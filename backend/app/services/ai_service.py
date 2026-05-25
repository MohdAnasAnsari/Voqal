"""
Groq API integration for the Voice AI Agent.

All public functions are async and use llama-3.3-70b-versatile with temperature 0.7,
max_tokens 500, and up to 3 automatic retries on transient API errors.
"""

import asyncio
import json
import logging
from typing import Any

import groq
from groq import APIConnectionError, APIStatusError, RateLimitError

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Constants ──────────────────────────────────────────────────────────────────

_MODEL = "llama-3.3-70b-versatile"
_TEMPERATURE = 0.7
_MAX_TOKENS = 500
_MAX_RETRIES = 3
_RETRY_BACKOFF_BASE = 2.0  # seconds; doubles each retry

_SYSTEM_PROMPT = """You are a professional sales AI agent handling inbound calls. Your job is to:
1. Qualify leads (score quality 1-10)
2. Extract key information from caller
3. Determine intent (lead qualification, appointment booking, support, transfer)
4. Be professional, friendly, and concise

Always respond in valid JSON matching the schema requested in the user message."""

# ── Internal helpers ───────────────────────────────────────────────────────────

def _client() -> groq.Groq:
    """Return a configured Groq client (not cached — lightweight object)."""
    return groq.Groq(api_key=settings.groq_api_key)


async def _call_groq(messages: list[dict], system: str = _SYSTEM_PROMPT) -> str:
    """
    Send a message to Groq with retry logic.

    Retries up to _MAX_RETRIES times on connection errors and rate limits,
    with exponential backoff.  Propagates the error on the final attempt.
    """
    full_messages = [{"role": "system", "content": system}] + messages
    last_exc: Exception | None = None
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            response = await asyncio.to_thread(
                _client().chat.completions.create,
                model=_MODEL,
                max_tokens=_MAX_TOKENS,
                temperature=_TEMPERATURE,
                messages=full_messages,
            )
            return response.choices[0].message.content
        except RateLimitError as exc:
            wait = _RETRY_BACKOFF_BASE ** attempt
            logger.warning("Rate limited by Groq (attempt %d/%d). Waiting %.1fs", attempt, _MAX_RETRIES, wait)
            last_exc = exc
            await asyncio.sleep(wait)
        except APIConnectionError as exc:
            wait = _RETRY_BACKOFF_BASE ** attempt
            logger.warning("Groq connection error (attempt %d/%d): %s. Waiting %.1fs", attempt, _MAX_RETRIES, exc, wait)
            last_exc = exc
            await asyncio.sleep(wait)
        except APIStatusError as exc:
            # 5xx: retry; 4xx: don't bother
            if exc.status_code >= 500:
                wait = _RETRY_BACKOFF_BASE ** attempt
                logger.warning("Groq server error %d (attempt %d/%d). Waiting %.1fs", exc.status_code, attempt, _MAX_RETRIES, wait)
                last_exc = exc
                await asyncio.sleep(wait)
            else:
                logger.error("Groq client error %d: %s", exc.status_code, exc.message)
                raise

    logger.error("All %d Groq retries exhausted", _MAX_RETRIES)
    raise last_exc  # type: ignore[misc]


def _parse_json(raw: str, fallback: dict) -> dict:
    """Strip markdown fences from the model's output and parse JSON safely."""
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        logger.error("JSON parse error from Groq output: %s\nRaw: %.300s", exc, raw)
        return fallback


# ── Public API ─────────────────────────────────────────────────────────────────

async def get_ai_response(transcript: str, context: dict) -> dict:
    """
    Generate a live AI response during an active call.

    Args:
        transcript: The caller's latest spoken words.
        context:    Conversation state — may include previous_turns, call_id,
                    caller_name, detected_intent_so_far, etc.

    Returns:
        {
            "intent":        str   – classified intent label,
            "response":      str   – text the agent should speak back,
            "quality_score": int   – lead quality 1–10,
            "reasoning":     str   – brief explanation,
            "confidence":    float – 0.0–1.0
        }
    """
    context_block = json.dumps(context, indent=2) if context else "{}"
    user_message = f"""Conversation context:
{context_block}

Latest caller statement:
\"\"\"{transcript}\"\"\"

Respond with JSON only:
{{
  "intent": "<lead_qualify|book_appointment|support|transfer|hangup>",
  "response": "<what the AI agent should say next>",
  "quality_score": <int 1-10>,
  "reasoning": "<brief reason for the score>",
  "confidence": <float 0.0-1.0>
}}"""

    logger.debug("get_ai_response — transcript length=%d", len(transcript))
    raw = await _call_groq([{"role": "user", "content": user_message}])
    result = _parse_json(raw, fallback={
        "intent": "support",
        "response": "I'm sorry, could you repeat that?",
        "quality_score": 1,
        "reasoning": "Parse error",
        "confidence": 0.0,
    })
    logger.info(
        "AI response — intent=%s quality=%s confidence=%s",
        result.get("intent"), result.get("quality_score"), result.get("confidence"),
    )
    return result


async def extract_lead_info(transcript: str) -> dict:
    """
    Extract structured contact and qualification info from a call transcript.

    Args:
        transcript: Full or partial call transcript.

    Returns:
        {
            "name":    str | None,
            "email":   str | None,
            "company": str | None,
            "phone":   str | None,
            "needs":   list[str]   – stated pain-points or requirements
        }
    """
    user_message = f"""Extract lead information from the following call transcript.
Return JSON only with these exact keys:
{{
  "name":    "<full name or null>",
  "email":   "<email address or null>",
  "company": "<company name or null>",
  "phone":   "<phone number or null>",
  "needs":   ["<need 1>", "<need 2>"]
}}

Transcript:
\"\"\"{transcript}\"\"\""""

    logger.debug("extract_lead_info — transcript length=%d", len(transcript))
    raw = await _call_groq([{"role": "user", "content": user_message}])
    result = _parse_json(raw, fallback={"name": None, "email": None, "company": None, "phone": None, "needs": []})
    logger.info("Extracted lead info: name=%s email=%s company=%s", result.get("name"), result.get("email"), result.get("company"))
    return result


async def score_lead_quality(extracted_info: dict, transcript: str) -> int:
    """
    Score lead quality from 1 to 10 using BANT-style criteria.

    Scoring rubric applied by the model:
    - Information completeness (name, email, company present → up to +3)
    - Engagement level (length and detail of answers → up to +2)
    - Budget indicators (mentions of budget, spend, pricing → up to +2)
    - Decision authority signals (mentions of deciding/approving → up to +3)

    Args:
        extracted_info: Dict returned by extract_lead_info.
        transcript:     Raw transcript for engagement/signal analysis.

    Returns:
        Integer score between 1 (cold) and 10 (hot, highly qualified).
    """
    info_block = json.dumps(extracted_info, indent=2)
    user_message = f"""Score the quality of this sales lead from 1 to 10.

Scoring criteria (be strict and realistic):
- Information completeness (name/email/company provided): up to 3 points
- Engagement level (detailed, relevant answers): up to 2 points
- Budget indicators (mentions cost, pricing, budget): up to 2 points
- Decision authority (is decision-maker or influencer): up to 3 points

Extracted info:
{info_block}

Transcript:
\"\"\"{transcript}\"\"\"

Return JSON only:
{{
  "score": <integer 1-10>,
  "reasoning": "<one sentence justification>"
}}"""

    logger.debug("score_lead_quality — extracted_info keys=%s", list(extracted_info.keys()))
    raw = await _call_groq([{"role": "user", "content": user_message}])
    result = _parse_json(raw, fallback={"score": 1, "reasoning": "Unable to score"})
    score = int(result.get("score", 1))
    score = max(1, min(10, score))  # clamp to valid range
    logger.info("Lead quality score=%d reason=%s", score, result.get("reasoning"))
    return score


async def determine_intent(transcript: str) -> str:
    """
    Classify the dominant intent of a call transcript.

    Returns one of:
        'lead_qualify'      – caller is a prospective customer being qualified
        'book_appointment'  – caller wants to schedule a meeting or demo
        'support'           – caller has a technical or billing issue
        'transfer'          – caller needs a specific human agent
        'hangup'            – caller indicated they want to end the call

    Args:
        transcript: Full or latest portion of the call transcript.

    Returns:
        Intent string (always one of the five labels above).
    """
    user_message = f"""Classify the caller's primary intent from this transcript.

Choose exactly one of:
- lead_qualify      (prospect interested in product/service)
- book_appointment  (wants to schedule a call, demo, or meeting)
- support           (has a problem or question about existing product)
- transfer          (needs a specific person or department)
- hangup            (wants to end the call or disengage)

Transcript:
\"\"\"{transcript}\"\"\"

Return JSON only:
{{
  "intent": "<one of the five labels>",
  "confidence": <float 0.0-1.0>
}}"""

    logger.debug("determine_intent — transcript length=%d", len(transcript))
    raw = await _call_groq([{"role": "user", "content": user_message}])
    result = _parse_json(raw, fallback={"intent": "support", "confidence": 0.0})
    intent: str = result.get("intent", "support")
    valid = {"lead_qualify", "book_appointment", "support", "transfer", "hangup"}
    if intent not in valid:
        logger.warning("Groq returned unknown intent %r, defaulting to 'support'", intent)
        intent = "support"
    logger.info("Determined intent=%s confidence=%s", intent, result.get("confidence"))
    return intent


async def generate_followup_message(lead_data: dict, call_summary: str) -> str:
    """
    Create a personalised follow-up message for a qualified lead.

    The message is suitable for both SMS and email (concise, professional,
    friendly). Caller's name is used if available in lead_data.

    Args:
        lead_data:    Dict with keys: name, email, company, needs, quality_score.
        call_summary: 2-3 sentence plain-English summary of the call.

    Returns:
        Ready-to-send follow-up message as a plain string.
    """
    name = lead_data.get("name") or "there"
    company = lead_data.get("company", "")
    needs = ", ".join(lead_data.get("needs") or []) or "your requirements"

    user_message = f"""Write a short, personalised follow-up message for a sales lead.

Tone: professional, warm, specific — reference the actual call content.
Length: 2-3 sentences (suitable for SMS or a short email body).
Do NOT include a subject line or salutation header — just the message body.

Lead details:
- Name: {name}
- Company: {company}
- Stated needs: {needs}
- Call summary: {call_summary}

Return only the message text, no JSON wrapper."""

    logger.debug("generate_followup_message — name=%s company=%s", name, company)
    message = await _call_groq(
        [{"role": "user", "content": user_message}],
        system=(
            "You are a professional sales assistant writing concise, personalised "
            "follow-up messages. Never use clichés or filler phrases."
        ),
    )
    message = message.strip()
    logger.info("Generated follow-up message (%d chars) for %s", len(message), name)
    return message
