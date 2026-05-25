"""
Call management endpoints.

Lifecycle: receive → (N × update) → end
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.database import Call
from app.models.schemas import (
    ActiveCallEntry,
    ActiveCallsResponse,
    CallDetailResponse,
    CallHistoryResponse,
    EndCallRequest,
    EndCallResponse,
    ErrorResponse,
    NextAction,
    ReceiveCallRequest,
    ReceiveCallResponse,
    UpdateCallRequest,
    UpdateCallResponse,
)
from app.services import call_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/calls", tags=["Calls"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_next_actions(summary: dict) -> list[NextAction]:
    """Derive recommended next actions from a finalised call summary."""
    actions: list[NextAction] = []
    score = summary.get("quality_score", 0)
    followup = summary.get("followup_content")
    lead_id = summary.get("lead_id")
    crm_status = summary.get("crm_sync_status")

    if followup:
        actions.append(NextAction(
            action="send_followup_sms",
            description="Send the AI-generated follow-up SMS to the caller",
            priority="high" if score >= 7 else "medium",
        ))
    if lead_id and crm_status != "synced":
        actions.append(NextAction(
            action="sync_to_crm",
            description="Push this lead to your CRM",
            priority="high" if score >= 8 else "medium",
        ))
    if score >= 8:
        actions.append(NextAction(
            action="assign_to_agent",
            description="Hot lead — assign to a human sales agent immediately",
            priority="high",
        ))
    elif score >= 5:
        actions.append(NextAction(
            action="add_to_nurture",
            description="Enroll lead in the automated nurture sequence",
            priority="low",
        ))
    return actions


# ══════════════════════════════════════════════════════════════════════════════
# POST /receive  — register an inbound call
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/receive",
    response_model=ReceiveCallResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register and initialise an inbound call",
    responses={422: {"model": ErrorResponse}},
)
async def receive_call(
    body: ReceiveCallRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> ReceiveCallResponse:
    """
    Create a Call record in PostgreSQL and initialise a Redis session.

    Call this as soon as the phone rings.  The returned `session_token` must
    be stored by the telephony layer and passed to subsequent `/update` calls.

    Returns:
        call_id, session_token, and the opening greeting the agent should speak.
    """
    try:
        result = await call_service.create_call_session(
            db=db,
            phone_number=body.phone_number,
            caller_name=body.caller_name,
        )
        logger.info("Call received: call_id=%s phone=%s", result["call_id"], body.phone_number)
        return ReceiveCallResponse(
            call_id=result["call_id"],
            session_token=result["session_token"],
            greeting=result["greeting_message"],
        )
    except Exception as exc:
        logger.exception("Failed to create call session: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "SESSION_CREATE_FAILED", "error_message": str(exc)},
        )


# ══════════════════════════════════════════════════════════════════════════════
# POST /{call_id}/update  — process one conversational turn
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/{call_id}/update",
    response_model=UpdateCallResponse,
    status_code=status.HTTP_200_OK,
    summary="Feed latest caller utterance to the AI pipeline",
    responses={
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
async def update_call(
    call_id: uuid.UUID,
    body: UpdateCallRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> UpdateCallResponse:
    """
    Analyse the caller's latest utterance and return the agent's response.

    Call this once per conversational turn.  The AI pipeline:
    1. Reads Redis session context for conversation history
    2. Calls Claude to classify intent, generate a response, and score quality
    3. Updates Redis session + the Call record in PostgreSQL

    Returns:
        intent, agent response text, and the current lead quality score (1–10).
    """
    try:
        result = await call_service.process_call_update(
            db=db,
            call_id=str(call_id),
            transcript=body.transcript,
        )
        return UpdateCallResponse(
            intent=result["intent"],
            response=result["response"],
            quality_score=result["quality_score"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail={"error_code": "CALL_NOT_FOUND", "error_message": str(exc)})
    except Exception as exc:
        logger.exception("Call update failed for %s: %s", call_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "UPDATE_FAILED", "error_message": str(exc)},
        )


# ══════════════════════════════════════════════════════════════════════════════
# POST /{call_id}/end  — finalise the call
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/{call_id}/end",
    response_model=EndCallResponse,
    status_code=status.HTTP_200_OK,
    summary="Finalise a completed call and trigger downstream actions",
    responses={
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
async def end_call(
    call_id: uuid.UUID,
    body: EndCallRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> EndCallResponse:
    """
    Run the full post-call pipeline:

    1. Persist final transcript, duration, and recording URL
    2. AI analysis: summarise, classify intent, score sentiment
    3. Extract lead information from transcript
    4. Create / update Lead record if quality meets threshold
    5. Trigger CRM sync if configured
    6. Generate personalised follow-up content
    7. Clear Redis session

    Returns a complete call summary and a prioritised list of next actions.
    """
    try:
        summary = await call_service.save_call_result(
            db=db,
            call_id=str(call_id),
            final_transcript=body.final_transcript,
            duration=body.duration,
            recording_url=body.recording_url,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail={"error_code": "CALL_NOT_FOUND", "error_message": str(exc)})
    except Exception as exc:
        logger.exception("end_call failed for %s: %s", call_id, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "END_CALL_FAILED", "error_message": str(exc)},
        )

    next_actions = _build_next_actions(summary)
    logger.info(
        "Call ended: call_id=%s duration=%ds intent=%s score=%s lead_id=%s",
        call_id, body.duration, summary.get("intent"), summary.get("quality_score"), summary.get("lead_id"),
    )
    return EndCallResponse(
        call_id=str(call_id),
        call_summary=summary,
        next_actions=next_actions,
        lead_qualified=summary.get("lead_id") is not None,
        lead_id=summary.get("lead_id"),
    )


# ══════════════════════════════════════════════════════════════════════════════
# GET /history  — paginated call history
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/history",
    response_model=CallHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="Paginated call history with optional filters",
)
async def get_call_history(
    limit: int = Query(20, ge=1, le=100, description="Max calls to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    date_from: Optional[str] = Query(None, description="Filter: ISO-8601 start date"),
    date_to: Optional[str] = Query(None, description="Filter: ISO-8601 end date"),
    quality_score_min: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum normalised quality score"),
    intent: Optional[str] = Query(None, description="Filter by classified intent"),
    call_status: Optional[str] = Query(None, description="Filter by call status"),
    db: AsyncSession = Depends(get_db),
) -> CallHistoryResponse:
    """
    Return a paginated, filterable list of call records sorted newest first.

    `has_more` is True when more records exist beyond the current page.
    """
    filters: dict = {}
    if date_from:
        filters["date_from"] = date_from
    if date_to:
        filters["date_to"] = date_to
    if quality_score_min is not None:
        filters["quality_score_min"] = quality_score_min
    if intent:
        filters["intent"] = intent
    if call_status:
        filters["status"] = call_status

    result = await call_service.get_call_history(db=db, limit=limit, offset=offset, filters=filters)
    total = result["total"]
    return CallHistoryResponse(
        calls=result["items"],
        total_count=total,
        has_more=(offset + limit) < total,
        limit=limit,
        offset=offset,
    )


# ══════════════════════════════════════════════════════════════════════════════
# GET /active  — currently in-progress calls
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/active",
    response_model=ActiveCallsResponse,
    status_code=status.HTTP_200_OK,
    summary="List calls currently in progress",
)
async def get_active_calls(
    db: AsyncSession = Depends(get_db),
) -> ActiveCallsResponse:
    """
    Return all calls with status `in_progress`, including their duration so far.

    Useful for a live dashboard tile showing concurrent call load.
    """
    result = await db.execute(
        select(Call)
        .where(Call.call_status == "in_progress")
        .order_by(Call.start_time.asc())
    )
    calls = list(result.scalars().all())
    now = datetime.now(timezone.utc)

    entries = [
        ActiveCallEntry(
            call_id=str(c.id),
            phone_number=c.phone_number,
            caller_name=c.caller_name,
            started_at=c.start_time.isoformat() if c.start_time else None,
            duration_so_far=(
                int((now - c.start_time).total_seconds())
                if c.start_time and c.start_time.tzinfo
                else None
            ),
        )
        for c in calls
    ]
    logger.debug("Active calls: %d", len(entries))
    return ActiveCallsResponse(active_calls=entries, count=len(entries))


# ══════════════════════════════════════════════════════════════════════════════
# GET /{call_id}  — full call detail
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/{call_id}",
    response_model=CallDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get complete details for a single call",
    responses={404: {"model": ErrorResponse}},
)
async def get_call(
    call_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> CallDetailResponse:
    """
    Retrieve the full call record including transcript, AI analysis results,
    and the linked lead (if any).

    Returns 404 when no call exists for the given ID.
    """
    data = await call_service.get_call_details(db=db, call_id=str(call_id))
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "CALL_NOT_FOUND",
                "error_message": f"No call found with id {call_id}",
            },
        )
    return CallDetailResponse(
        call_id=data["id"],
        phone_number=data["phone_number"],
        caller_name=data.get("caller_name"),
        call_status=data["call_status"],
        call_duration_seconds=data.get("call_duration_seconds"),
        start_time=data.get("start_time"),
        end_time=data.get("end_time"),
        intent=data.get("intent"),
        lead_quality_score=data.get("lead_quality_score"),
        sentiment=data.get("sentiment"),
        crm_synced=data.get("crm_synced", False),
        recording_url=data.get("recording_url"),
        transcript=data.get("transcript"),
        transcript_summary=data.get("transcript_summary"),
        followup_content=data.get("followup_content"),
        tags=data.get("tags"),
        lead=data.get("lead"),
        created_at=data.get("created_at"),
    )
