"""
Lead management endpoints.

Covers listing, detail retrieval, AI-driven qualification, manual updates,
and the qualified-leads view with conversion metrics.
"""

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.database import Call, Lead
from app.models.schemas import (
    ErrorResponse,
    LeadDetailResponse,
    LeadListResponse,
    QualifiedLeadsResponse,
    QualifyLeadRequest,
    QualifyLeadResponse,
    UpdateLeadRequest,
)
from app.services import crm_service, lead_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/leads", tags=["Leads"])


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _call_history_for_phone(db: AsyncSession, phone: str) -> list[dict]:
    """Return up to 10 recent calls for a given phone number."""
    result = await db.execute(
        select(Call)
        .where(Call.phone_number == phone)
        .order_by(Call.start_time.desc())
        .limit(10)
    )
    calls = result.scalars().all()
    return [
        {
            "call_id": str(c.id),
            "start_time": c.start_time.isoformat() if c.start_time else None,
            "duration_seconds": c.call_duration_seconds,
            "intent": c.intent,
            "quality_score": c.lead_quality_score,
            "call_status": c.call_status,
            "sentiment": c.sentiment,
        }
        for c in calls
    ]


# ══════════════════════════════════════════════════════════════════════════════
# GET /  — paginated lead list
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/",
    response_model=LeadListResponse,
    status_code=status.HTTP_200_OK,
    summary="List leads with filtering and search",
)
async def list_leads(
    status_filter: Optional[str] = Query(
        None, alias="status",
        description="new | qualified | contacted | converted | lost",
    ),
    quality_score_min: Optional[float] = Query(None, ge=0.0, le=1.0),
    search: Optional[str] = Query(
        None, min_length=2, max_length=100,
        description="Partial match on name, email, or company",
    ),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> LeadListResponse:
    """
    Return a paginated, filterable list of leads sorted by quality score (highest first).

    Use the `search` parameter to do a partial-match filter across name, email,
    and company fields.
    """
    query = (
        select(Lead)
        .order_by(Lead.lead_quality_score.desc().nullslast(), Lead.created_at.desc())
    )
    if status_filter:
        query = query.where(Lead.lead_status == status_filter)
    if quality_score_min is not None:
        query = query.where(Lead.lead_quality_score >= quality_score_min)
    if search:
        like = f"%{search}%"
        query = query.where(
            Lead.name.ilike(like) | Lead.email.ilike(like) | Lead.company.ilike(like)
        )

    # Total (without pagination)
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar_one()

    result = await db.execute(query.limit(limit).offset(offset))
    leads = result.scalars().all()

    return LeadListResponse(
        leads=[lead_service._lead_to_dict(l) for l in leads],
        total_count=total,
        limit=limit,
        offset=offset,
    )


# ══════════════════════════════════════════════════════════════════════════════
# GET /qualified  — qualified lead pool
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/qualified",
    response_model=QualifiedLeadsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get all qualified leads with conversion metrics",
)
async def get_qualified_leads(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> QualifiedLeadsResponse:
    """
    Return all leads with quality score >= 0.5 (5/10), sorted by most recent contact.

    Also returns the overall conversion rate for the qualified pool.
    """
    leads = await lead_service.get_qualified_leads(db=db, limit=limit, offset=offset)

    # Compute conversion rate from raw DB aggregate (no date filter = all time)
    funnel = await lead_service.funnel_counts(db=db)
    total_qualified = funnel.get("qualified", 0) + funnel.get("contacted", 0) + funnel.get("converted", 0)
    converted = funnel.get("converted", 0)
    conversion_rate = round(converted / total_qualified, 4) if total_qualified else 0.0

    return QualifiedLeadsResponse(
        qualified_leads=leads,
        count=len(leads),
        conversion_rate=conversion_rate,
    )


# ══════════════════════════════════════════════════════════════════════════════
# GET /{lead_id}  — full lead detail
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/{lead_id}",
    response_model=LeadDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get full lead details including call history",
    responses={404: {"model": ErrorResponse}},
)
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> LeadDetailResponse:
    """
    Retrieve a complete lead record with its call history and conversion status.

    `conversion_status` summarises the lead's journey through the funnel:
    current status, quality score, and recommended next action.
    """
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error_code": "LEAD_NOT_FOUND",
                "error_message": f"No lead found with id {lead_id}",
            },
        )

    call_history = await _call_history_for_phone(db, lead.phone_number)

    conversion_status = {
        "current_status": lead.lead_status,
        "is_converted": lead.lead_status == "converted",
        "lead_quality_score": lead.lead_quality_score,
        "recommended_action": lead.recommended_action,
        "crm_synced": lead.crm_synced,
        "crm_id": lead.crm_id,
        "total_calls": lead.total_calls,
        "last_contact": lead.last_call_at.isoformat() if lead.last_call_at else None,
    }

    return LeadDetailResponse(
        lead=lead_service._lead_to_dict(lead),
        call_history=call_history,
        conversion_status=conversion_status,
    )


# ══════════════════════════════════════════════════════════════════════════════
# POST /qualify  — create / update lead from call
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/qualify",
    response_model=QualifyLeadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create or update a lead from a qualified call",
    responses={422: {"model": ErrorResponse}},
)
async def qualify_lead(
    body: QualifyLeadRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> QualifyLeadResponse:
    """
    Upsert a lead linked to the given call_id and apply the AI quality score.

    - If a lead with the same phone / email already exists it is updated.
    - If the score meets the CRM sync threshold a HubSpot sync is attempted.

    Returns the lead_id and CRM sync outcome.
    """
    # Resolve phone_number: explicit body > call record
    phone = body.phone_number
    if not phone:
        call_result = await db.execute(
            select(Call).where(Call.id == uuid.UUID(body.call_id))
        )
        call = call_result.scalar_one_or_none()
        if call is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "error_code": "CALL_NOT_FOUND",
                    "error_message": f"Call {body.call_id} not found and no phone_number supplied",
                },
            )
        phone = call.phone_number

    lead_data = {
        "phone_number": phone,
        "email": body.email,
        "name": body.name,
        "company": body.company,
        "notes": body.notes,
        "lead_source": "inbound_call",
    }

    lead_id = await lead_service.create_or_update_lead(db=db, call_id=body.call_id, lead_data=lead_data)
    if lead_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "LEAD_CREATE_FAILED", "error_message": "phone_number is required"},
        )

    await lead_service.qualify_lead(
        db=db,
        lead_id=lead_id,
        quality_score=body.quality_score,
        extracted_data=lead_data,
    )

    # Attempt CRM sync if eligible
    crm_sync_status = "skipped"
    crm_id: Optional[str] = None

    lead_result = await db.execute(select(Lead).where(Lead.id == uuid.UUID(lead_id)))
    lead_obj = lead_result.scalar_one_or_none()

    if lead_obj and await lead_service.should_sync_to_crm(lead_obj):
        crm_cfg = await crm_service.get_crm_config(db, "hubspot")
        if crm_cfg and crm_cfg.get("api_key"):
            hs_result = await crm_service.sync_lead_to_hubspot(lead_obj, crm_cfg["api_key"])
            if hs_result.get("sync_status") in ("created", "updated"):
                lead_obj.crm_synced = True
                lead_obj.crm_id = hs_result.get("hubspot_id")
                await db.flush()
                crm_sync_status = "synced"
                crm_id = hs_result.get("hubspot_id")
            else:
                crm_sync_status = "error"
        else:
            crm_sync_status = "queued"

    logger.info(
        "Lead qualified: lead_id=%s score=%d crm=%s", lead_id, body.quality_score, crm_sync_status
    )
    return QualifyLeadResponse(lead_id=lead_id, crm_sync_status=crm_sync_status, crm_id=crm_id)


# ══════════════════════════════════════════════════════════════════════════════
# PUT /{lead_id}  — manual update
# ══════════════════════════════════════════════════════════════════════════════

@router.put(
    "/{lead_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Update a lead's status, assignment, notes, or tags",
    responses={
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
async def update_lead(
    lead_id: uuid.UUID,
    body: UpdateLeadRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Partially update a lead record.

    Status transitions are validated against the allowed path:
    `new → qualified → contacted → converted | lost`

    All status changes are recorded as timestamped audit notes on the record.
    """
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalar_one_or_none()
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "LEAD_NOT_FOUND", "error_message": f"Lead {lead_id} not found"},
        )

    updated: Optional[dict] = None

    # Status change (uses validated transition logic in lead_service)
    if body.status is not None:
        try:
            updated = await lead_service.update_lead_status(
                db=db, lead_id=str(lead_id), new_status=body.status
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"error_code": "INVALID_STATUS_TRANSITION", "error_message": str(exc)},
            )

    # Scalar field updates (applied directly)
    scalar_fields = {
        "assigned_to": body.assigned_to,
        "email": body.email,
        "name": body.name,
        "company": body.company,
        "lead_value": body.lead_value,
    }
    for attr, value in scalar_fields.items():
        if value is not None:
            setattr(lead, attr, value)

    if body.notes is not None:
        from datetime import datetime
        ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        lead.notes = (f"{lead.notes}\n[{ts}] {body.notes}" if lead.notes else body.notes).strip()

    if body.tags is not None:
        existing = lead.tags or []
        lead.tags = list(set(existing) | set(body.tags))

    await db.flush()
    await db.refresh(lead)
    final = updated or lead_service._lead_to_dict(lead)
    logger.info("Lead updated: lead_id=%s", lead_id)
    return final
