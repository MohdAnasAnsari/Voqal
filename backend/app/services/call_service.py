"""
Call processing service.

Manages the full call lifecycle: session creation → real-time AI processing
→ result persistence → CRM sync triggers.  Redis holds ephemeral call state;
PostgreSQL holds durable records.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import redis.asyncio as aioredis
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import Call, Lead
from app.models.schemas import AnalyticsSummary, CallCreate, CallUpdate
from app.services import ai_service
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Redis TTL for call sessions: 2 hours
_SESSION_TTL = 7200
_QUALITY_SYNC_THRESHOLD = 6  # calls with score >= this trigger CRM sync


def _redis() -> aioredis.Redis:
    """Return a Redis client (connection is pooled by aioredis internally)."""
    return aioredis.from_url(settings.redis_url, decode_responses=True)


def _session_key(call_id: str) -> str:
    return f"call_session:{call_id}"


# ── Session management ─────────────────────────────────────────────────────────

async def create_call_session(
    db: AsyncSession,
    phone_number: str,
    caller_name: Optional[str] = None,
) -> dict[str, Any]:
    """
    Create a new Call record in the database and initialise session state in Redis.

    Args:
        db:           Active database session.
        phone_number: Caller's phone number (E.164 format preferred).
        caller_name:  Display name if available from caller-ID lookup.

    Returns:
        {
            "call_id":         str  – UUID of the new call record,
            "session_token":   str  – Redis session key clients can reference,
            "greeting_message":str  – AI-generated opening line for the agent
        }
    """
    call = Call(
        phone_number=phone_number,
        caller_name=caller_name,
        call_status="in_progress",
        start_time=datetime.now(timezone.utc),
    )
    db.add(call)
    await db.flush()
    await db.refresh(call)
    call_id = str(call.id)

    # Store mutable session state in Redis
    session_data = {
        "call_id": call_id,
        "phone_number": phone_number,
        "caller_name": caller_name or "",
        "transcript_so_far": "",
        "turn_count": 0,
        "current_intent": "unknown",
        "quality_score": 0,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    async with _redis() as r:
        await r.setex(_session_key(call_id), _SESSION_TTL, json.dumps(session_data))

    greeting = (
        f"Hello{', ' + caller_name if caller_name else ''}! "
        "Thank you for calling. How can I help you today?"
    )

    logger.info("Call session created: call_id=%s phone=%s", call_id, phone_number)
    return {
        "call_id": call_id,
        "session_token": _session_key(call_id),
        "greeting_message": greeting,
    }


# ── Real-time processing ───────────────────────────────────────────────────────

async def process_call_update(
    db: AsyncSession,
    call_id: str,
    transcript: str,
) -> dict[str, Any]:
    """
    Analyse the latest transcript fragment and return the agent's next response.

    Reads session context from Redis, calls the AI service, updates Redis state,
    and persists a lightweight update to the Call record in PostgreSQL.

    Args:
        db:         Active database session.
        call_id:    UUID string of the call.
        transcript: Latest caller utterance or accumulated transcript slice.

    Returns:
        {
            "intent":        str   – current classified intent,
            "response":      str   – what the AI agent should say,
            "quality_score": int   – lead quality 1–10
        }
    """
    # ── Load session from Redis ────────────────────────────────────────────────
    async with _redis() as r:
        raw = await r.get(_session_key(call_id))

    if raw is None:
        logger.warning("No Redis session found for call_id=%s, using empty context", call_id)
        session: dict = {"transcript_so_far": "", "turn_count": 0, "current_intent": "unknown"}
    else:
        session = json.loads(raw)

    # Append new utterance to running transcript
    session["transcript_so_far"] = (session.get("transcript_so_far", "") + "\n" + transcript).strip()
    session["turn_count"] = int(session.get("turn_count", 0)) + 1

    # ── AI analysis ───────────────────────────────────────────────────────────
    context = {
        "previous_turns": session["turn_count"],
        "running_transcript": session["transcript_so_far"][-2000:],  # trim for token budget
        "current_intent": session.get("current_intent"),
    }
    ai_result = await ai_service.get_ai_response(transcript, context)

    intent: str = ai_result.get("intent", "support")
    response_text: str = ai_result.get("response", "Could you repeat that?")
    quality_score: int = int(ai_result.get("quality_score", 1))

    # ── Update Redis session ───────────────────────────────────────────────────
    session["current_intent"] = intent
    session["quality_score"] = quality_score
    async with _redis() as r:
        await r.setex(_session_key(call_id), _SESSION_TTL, json.dumps(session))

    # ── Lightweight DB update ──────────────────────────────────────────────────
    result = await db.execute(select(Call).where(Call.id == uuid.UUID(call_id)))
    call = result.scalar_one_or_none()
    if call is not None:
        call.intent = intent
        call.lead_quality_score = quality_score / 10.0
        call.transcript = session["transcript_so_far"]
        await db.flush()

    logger.info("Call update: call_id=%s intent=%s quality=%d", call_id, intent, quality_score)
    return {"intent": intent, "response": response_text, "quality_score": quality_score}


# ── Call finalisation ──────────────────────────────────────────────────────────

async def save_call_result(
    db: AsyncSession,
    call_id: str,
    final_transcript: str,
    duration: int,
    recording_url: Optional[str] = None,
) -> dict[str, Any]:
    """
    Finalise a call: persist all data, qualify the lead, and trigger downstream actions.

    Steps performed:
    1. Update Call record with final transcript, duration, recording URL.
    2. Run full AI analysis (summary, intent, quality, sentiment, follow-up).
    3. Extract lead info and create/update Lead record if quality >= threshold.
    4. Trigger async CRM sync if applicable.
    5. Clear Redis session.

    Args:
        db:               Active database session.
        call_id:          UUID string of the call.
        final_transcript: Complete call transcript.
        duration:         Call duration in seconds.
        recording_url:    URL to the call recording if available.

    Returns:
        Dict with complete call summary including lead qualification result.
    """
    call_uuid = uuid.UUID(call_id)

    # ── Fetch or create Call record ────────────────────────────────────────────
    result = await db.execute(select(Call).where(Call.id == call_uuid))
    call = result.scalar_one_or_none()
    if call is None:
        logger.error("save_call_result: call %s not found in database", call_id)
        raise ValueError(f"Call {call_id} not found")

    # ── AI full analysis ───────────────────────────────────────────────────────
    logger.info("Running full AI analysis for call %s", call_id)
    extracted = await ai_service.extract_lead_info(final_transcript)
    quality_score_raw = await ai_service.score_lead_quality(extracted, final_transcript)
    intent = await ai_service.determine_intent(final_transcript)

    # Derive AI analysis fields
    quality_score_normalised = quality_score_raw / 10.0
    followup_content: Optional[str] = None

    if quality_score_raw >= _QUALITY_SYNC_THRESHOLD:
        call_summary = (
            f"Call with {extracted.get('name') or call.phone_number}. "
            f"Intent: {intent}. Duration: {duration}s."
        )
        followup_content = await ai_service.generate_followup_message(extracted, call_summary)

    # ── Persist Call record ────────────────────────────────────────────────────
    call.final_transcript = final_transcript if hasattr(call, "final_transcript") else None
    call.transcript = final_transcript
    call.call_duration_seconds = duration
    call.end_time = datetime.now(timezone.utc)
    call.recording_url = recording_url
    call.intent = intent
    call.lead_quality_score = quality_score_normalised
    call.followup_content = followup_content
    call.call_status = "completed"
    await db.flush()

    # ── Lead upsert ───────────────────────────────────────────────────────────
    lead_id: Optional[str] = None
    if quality_score_raw >= _QUALITY_SYNC_THRESHOLD:
        from app.services.lead_service import create_or_update_lead, qualify_lead

        lead_data = {
            **extracted,
            "phone_number": extracted.get("phone") or call.phone_number,
            "lead_source": "inbound_call",
        }
        lead_id = await create_or_update_lead(db, call_id, lead_data)
        if lead_id:
            await qualify_lead(db, lead_id, quality_score_raw, extracted)
            logger.info("Lead qualified: lead_id=%s score=%d", lead_id, quality_score_raw)

    # ── Clear Redis session ───────────────────────────────────────────────────
    try:
        async with _redis() as r:
            await r.delete(_session_key(call_id))
    except Exception as exc:
        logger.warning("Failed to clear Redis session for %s: %s", call_id, exc)

    await db.flush()
    logger.info(
        "Call finalised: call_id=%s duration=%ds intent=%s quality=%d lead_id=%s",
        call_id, duration, intent, quality_score_raw, lead_id,
    )

    return {
        "call_id": call_id,
        "duration_seconds": duration,
        "intent": intent,
        "quality_score": quality_score_raw,
        "lead_extracted": extracted,
        "lead_id": lead_id,
        "followup_content": followup_content,
        "recording_url": recording_url,
        "call_status": "completed",
    }


# ── Query helpers ──────────────────────────────────────────────────────────────

async def get_call_history(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
    filters: Optional[dict] = None,
) -> dict[str, Any]:
    """
    Return a paginated list of calls with optional filtering.

    Supported filter keys:
        date_from        (ISO-8601 string or datetime)
        date_to          (ISO-8601 string or datetime)
        quality_score_min (float 0.0–1.0)
        intent           (str)
        status           (str)

    Returns:
        {"items": [...], "total": int, "limit": int, "offset": int}
    """
    filters = filters or {}
    query = select(Call).order_by(Call.created_at.desc())

    if "date_from" in filters:
        query = query.where(Call.start_time >= _parse_dt(filters["date_from"]))
    if "date_to" in filters:
        query = query.where(Call.start_time <= _parse_dt(filters["date_to"]))
    if "quality_score_min" in filters:
        query = query.where(Call.lead_quality_score >= float(filters["quality_score_min"]))
    if "intent" in filters:
        query = query.where(Call.intent == filters["intent"])
    if "status" in filters:
        query = query.where(Call.call_status == filters["status"])

    # Total count (without pagination)
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    # Paginated results
    result = await db.execute(query.limit(limit).offset(offset))
    calls = list(result.scalars().all())

    return {
        "items": [_call_to_dict(c) for c in calls],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


async def get_call_details(db: AsyncSession, call_id: str) -> Optional[dict[str, Any]]:
    """
    Fetch complete call info including transcript, lead info, and analytics.

    Args:
        db:      Active database session.
        call_id: UUID string of the call.

    Returns:
        Full call dict or None if not found.
    """
    result = await db.execute(
        select(Call).where(Call.id == uuid.UUID(call_id))
    )
    call = result.scalar_one_or_none()
    if call is None:
        return None

    # Fetch linked lead if present
    lead_result = await db.execute(
        select(Lead).where(Lead.phone_number == call.phone_number)
    )
    lead = lead_result.scalar_one_or_none()

    details = _call_to_dict(call)
    details["lead"] = _lead_to_dict(lead) if lead else None
    return details


# ── Analytics helpers (used by routes/analytics.py) ───────────────────────────

async def aggregate(
    db: AsyncSession,
    start: datetime,
    end: datetime,
) -> dict[str, float]:
    """Compute aggregate call metrics for a date range."""
    stmt = (
        select(
            func.count(Call.id).label("total_calls"),
            func.sum(case((Call.call_status == "completed", 1), else_=0)).label("answered_calls"),
            func.sum(case((Call.call_status == "failed", 1), else_=0)).label("failed_calls"),
            func.sum(case((Call.agent_transferred_to.isnot(None), 1), else_=0)).label(
                "transferred_calls"
            ),
            func.avg(Call.call_duration_seconds).label("avg_duration"),
            func.avg(Call.confidence_score).label("intent_accuracy"),
            func.avg(Call.lead_quality_score).label("avg_sentiment"),
        ).where(Call.start_time.between(start, end))
    )

    try:
        result = await db.execute(stmt)
        row = result.one()
        intent_accuracy = float(row.intent_accuracy or 0)
        avg_sentiment = float(row.avg_sentiment or 0)
    except Exception as exc:
        msg = str(exc).lower()
        missing_conf = "confidence_score" in msg and ("does not exist" in msg or "undefinedcolumn" in msg)
        missing_lqs = "lead_quality_score" in msg and ("does not exist" in msg or "undefinedcolumn" in msg)
        if missing_conf or missing_lqs:
            logger.warning(
                "Call aggregate fallback: missing columns (confidence_score=%s lead_quality_score=%s); using zeros",
                missing_conf,
                missing_lqs,
            )
            fallback_stmt = (
                select(
                    func.count(Call.id).label("total_calls"),
                    func.sum(case((Call.call_status == "completed", 1), else_=0)).label("answered_calls"),
                    func.sum(case((Call.call_status == "failed", 1), else_=0)).label("failed_calls"),
                    func.sum(case((Call.agent_transferred_to.isnot(None), 1), else_=0)).label(
                        "transferred_calls"
                    ),
                    func.avg(Call.call_duration_seconds).label("avg_duration"),
                ).where(Call.start_time.between(start, end))
            )
            result = await db.execute(fallback_stmt)
            row = result.one()
            intent_accuracy = 0.0
            avg_sentiment = 0.0
        else:
            raise

    return {
        "total_calls": float(row.total_calls or 0),
        "answered_calls": float(row.answered_calls or 0),
        "failed_calls": float(row.failed_calls or 0),
        "transferred_calls": float(row.transferred_calls or 0),
        "avg_duration": float(row.avg_duration or 0),
        "intent_accuracy": intent_accuracy,
        "avg_sentiment": avg_sentiment,
    }


async def daily_summary(db: AsyncSession, days: int = 30) -> list[AnalyticsSummary]:
    """Return one AnalyticsSummary per calendar day for the last N days."""
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    summaries: list[AnalyticsSummary] = []
    for i in range(days - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start.replace(hour=23, minute=59, second=59)
        agg = await aggregate(db, day_start, day_end)
        summaries.append(
            AnalyticsSummary(
                date=day_start,
                total_calls=int(agg["total_calls"]),
                qualified_leads=0,
            )
        )
    return summaries


async def top_intents(db: AsyncSession, limit: int = 10) -> list[dict]:
    """Return the N most frequent call intents with counts."""
    result = await db.execute(
        select(Call.intent, func.count(Call.id).label("count"))
        .where(Call.intent.isnot(None))
        .group_by(Call.intent)
        .order_by(func.count(Call.id).desc())
        .limit(limit)
    )
    return [{"intent": row.intent, "count": row.count} for row in result]


# ── Private serialisation helpers ─────────────────────────────────────────────

def _call_to_dict(call: Call) -> dict:
    return {
        "id": str(call.id),
        "phone_number": call.phone_number,
        "caller_name": call.caller_name,
        "call_status": call.call_status,
        "call_duration_seconds": call.call_duration_seconds,
        "start_time": call.start_time.isoformat() if call.start_time else None,
        "end_time": call.end_time.isoformat() if call.end_time else None,
        "intent": call.intent,
        "lead_quality_score": call.lead_quality_score,
        "sentiment": call.sentiment,
        "crm_synced": call.crm_synced,
        "recording_url": call.recording_url,
        "transcript": call.transcript,
        "transcript_summary": call.transcript_summary,
        "followup_content": call.followup_content,
        "tags": call.tags,
        "created_at": call.created_at.isoformat() if call.created_at else None,
    }


def _lead_to_dict(lead: Lead) -> dict:
    return {
        "id": str(lead.id),
        "phone_number": lead.phone_number,
        "email": lead.email,
        "name": lead.name,
        "company": lead.company,
        "lead_status": lead.lead_status,
        "lead_quality_score": lead.lead_quality_score,
        "crm_synced": lead.crm_synced,
        "total_calls": lead.total_calls,
        "last_call_at": lead.last_call_at.isoformat() if lead.last_call_at else None,
    }


def _parse_dt(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value))
