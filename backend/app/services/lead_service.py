"""
Lead qualification and lifecycle management.

Leads are unique per phone number.  Status transitions follow the path:
    new → qualified → contacted → converted | lost
Each transition is logged via a status change note on the record.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.database import Call, Lead
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Quality score (1–10 integer) at or above which a lead is considered qualified
_QUALIFY_THRESHOLD = 5

# Sync to CRM when lead quality >= this value and the lead is not yet synced
_CRM_SYNC_THRESHOLD = 6


# ── Creation / upsert ─────────────────────────────────────────────────────────

async def create_or_update_lead(
    db: AsyncSession,
    call_id: str,
    lead_data: dict[str, Any],
) -> Optional[str]:
    """
    Upsert a lead by phone number or email, linking it to the originating call.

    If a matching lead already exists it is updated with any new non-null fields
    from lead_data.  Otherwise a new lead record is inserted.

    Args:
        db:        Active database session.
        call_id:   UUID string of the linked call.
        lead_data: Dict with keys: phone_number, email, name, company,
                   lead_source, needs (list[str]), etc.

    Returns:
        UUID string of the created/updated lead, or None if phone_number is absent.
    """
    phone = lead_data.get("phone_number") or lead_data.get("phone")
    email = lead_data.get("email")

    if not phone:
        logger.warning("create_or_update_lead: no phone_number in lead_data, skipping")
        return None

    # Look for an existing lead by phone (primary) or email (secondary)
    existing = await _find_existing(db, phone, email)

    if existing is None:
        lead = Lead(
            phone_number=phone,
            lead_status="new",
            lead_source=lead_data.get("lead_source", "inbound_call"),
        )
        db.add(lead)
        logger.info("Created new lead for phone=%s", phone)
    else:
        lead = existing
        logger.info("Updating existing lead %s for phone=%s", lead.id, phone)

    # Apply non-null fields from lead_data
    _apply_fields(lead, lead_data)

    # Increment call counter and update last contact time
    lead.total_calls = (lead.total_calls or 0) + 1
    lead.last_call_at = datetime.now(timezone.utc)

    # Link to the originating call (FK)
    try:
        lead.call_id = uuid.UUID(call_id)
    except (ValueError, AttributeError):
        logger.warning("Invalid call_id %r, not linking to lead", call_id)

    await db.flush()
    await db.refresh(lead)
    return str(lead.id)


# ── Qualification ─────────────────────────────────────────────────────────────

async def qualify_lead(
    db: AsyncSession,
    lead_id: str,
    quality_score: int,
    extracted_data: dict[str, Any],
) -> Optional[dict[str, Any]]:
    """
    Update a lead's quality score and mark it as 'qualified' when score >= threshold.

    Args:
        db:             Active database session.
        lead_id:        UUID string of the lead.
        quality_score:  Integer 1–10 produced by ai_service.score_lead_quality.
        extracted_data: Dict from ai_service.extract_lead_info (may supply missing fields).

    Returns:
        Updated lead as a dict, or None if the lead does not exist.
    """
    lead = await _get_lead(db, lead_id)
    if lead is None:
        logger.warning("qualify_lead: lead %s not found", lead_id)
        return None

    lead.lead_quality_score = quality_score / 10.0
    _apply_fields(lead, extracted_data)

    if quality_score >= _QUALIFY_THRESHOLD:
        lead.lead_status = "qualified"
        reason = (
            f"AI score {quality_score}/10 on {datetime.now(timezone.utc).date()}. "
            f"Needs: {', '.join(extracted_data.get('needs') or []) or 'not stated'}."
        )
        lead.qualification_reason = reason
        lead.recommended_action = _recommend_action(quality_score)
        logger.info("Lead %s qualified with score=%d", lead_id, quality_score)
    else:
        lead.lead_status = "new"
        lead.qualification_reason = f"Score {quality_score}/10 below threshold {_QUALIFY_THRESHOLD}"
        logger.info("Lead %s not qualified (score=%d)", lead_id, quality_score)

    await db.flush()
    await db.refresh(lead)
    return _lead_to_dict(lead)


# ── Status updates ────────────────────────────────────────────────────────────

async def update_lead_status(
    db: AsyncSession,
    lead_id: str,
    new_status: str,
) -> Optional[dict[str, Any]]:
    """
    Transition a lead to a new status, validating the transition path.

    Valid statuses: new → qualified → contacted → converted | lost

    Args:
        db:         Active database session.
        lead_id:    UUID string.
        new_status: Target status string.

    Returns:
        Updated lead dict, or None if not found.

    Raises:
        ValueError: If the requested transition is not permitted.
    """
    _VALID_STATUSES = {"new", "qualified", "contacted", "converted", "lost"}
    if new_status not in _VALID_STATUSES:
        raise ValueError(f"Invalid status '{new_status}'. Must be one of {_VALID_STATUSES}")

    lead = await _get_lead(db, lead_id)
    if lead is None:
        return None

    prev = lead.lead_status
    lead.lead_status = new_status

    # Append a timestamped note so the history is traceable
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    transition_note = f"[{timestamp}] Status changed: {prev} → {new_status}"
    lead.notes = (f"{lead.notes}\n{transition_note}" if lead.notes else transition_note).strip()

    await db.flush()
    await db.refresh(lead)
    logger.info("Lead %s status: %s → %s", lead_id, prev, new_status)
    return _lead_to_dict(lead)


# ── Retrieval ─────────────────────────────────────────────────────────────────

async def get_qualified_leads(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    """
    Return all qualified leads (quality_score >= threshold), newest first.

    Each result includes total_calls and last_call_at for the sales team.

    Args:
        db:     Active database session.
        limit:  Maximum rows to return.
        offset: Pagination offset.

    Returns:
        List of lead dicts sorted by last_call_at descending.
    """
    threshold = _QUALIFY_THRESHOLD / 10.0
    result = await db.execute(
        select(Lead)
        .where(Lead.lead_quality_score >= threshold)
        .order_by(Lead.last_call_at.desc().nullslast())
        .limit(limit)
        .offset(offset)
    )
    leads = list(result.scalars().all())
    logger.debug("get_qualified_leads returned %d leads", len(leads))
    return [_lead_to_dict(l) for l in leads]


# ── CRM sync eligibility ──────────────────────────────────────────────────────

async def should_sync_to_crm(lead: Lead) -> bool:
    """
    Determine whether a lead should be pushed to the CRM.

    Criteria (both must be true):
    - lead_quality_score (normalised 0–1) >= CRM sync threshold / 10
    - lead not already synced (crm_synced == False)

    Args:
        lead: ORM Lead object (does not require a DB session).

    Returns:
        True if the lead qualifies for CRM sync.
    """
    normalised_threshold = _CRM_SYNC_THRESHOLD / 10.0
    score = lead.lead_quality_score or 0.0
    eligible = (score >= normalised_threshold) and (not lead.crm_synced)
    logger.debug(
        "should_sync_to_crm: lead=%s score=%.2f threshold=%.2f synced=%s → %s",
        lead.id, score, normalised_threshold, lead.crm_synced, eligible,
    )
    return eligible


# ── Analytics helpers (used by routes/analytics.py) ──────────────────────────

async def aggregate(
    db: AsyncSession,
    start: datetime,
    end: datetime,
) -> dict[str, float]:
    """Compute aggregated lead metrics for a date range."""
    stmt = (
        select(
            func.count(Lead.id).label("total"),
            func.sum(
                case((Lead.lead_quality_score >= (_QUALIFY_THRESHOLD / 10.0), 1), else_=0)
            ).label("qualified"),
            func.avg(Lead.lead_quality_score).label("avg_score"),
            func.sum(case((Lead.lead_status == "converted", 1), else_=0)).label("converted"),
            func.sum(Lead.lead_value).label("revenue_impact"),
        ).where(Lead.created_at.between(start, end))
    )

    try:
        result = await db.execute(stmt)
        row = result.one()
        revenue_impact = float(row.revenue_impact or 0)
    except Exception as exc:
        # Local dev often uses a persisted Postgres volume; if the schema changed
        # since the volume was created, some newer columns may not exist yet.
        # Fall back gracefully so dashboard/report endpoints keep working.
        msg = str(exc).lower()
        if "lead_value" in msg and ("does not exist" in msg or "undefinedcolumn" in msg):
            logger.warning("Lead aggregate fallback: lead_value column missing; using revenue_impact=0")
            fallback_stmt = (
                select(
                    func.count(Lead.id).label("total"),
                    func.sum(
                        case((Lead.lead_quality_score >= (_QUALIFY_THRESHOLD / 10.0), 1), else_=0)
                    ).label("qualified"),
                    func.avg(Lead.lead_quality_score).label("avg_score"),
                    func.sum(case((Lead.lead_status == "converted", 1), else_=0)).label("converted"),
                ).where(Lead.created_at.between(start, end))
            )
            result = await db.execute(fallback_stmt)
            row = result.one()
            revenue_impact = 0.0
        else:
            raise

    total = int(row.total or 1)
    converted = int(row.converted or 0)
    return {
        "total": float(total),
        "qualified": float(row.qualified or 0),
        "avg_score": float(row.avg_score or 0),
        "converted": float(converted),
        "revenue_impact": revenue_impact,
        "conversion_rate": round(converted / total, 4),
    }


async def funnel_counts(db: AsyncSession) -> dict[str, int]:
    """Return count of leads at each status stage."""
    result = await db.execute(
        select(Lead.lead_status, func.count(Lead.id).label("count"))
        .group_by(Lead.lead_status)
    )
    return {row.lead_status: row.count for row in result}


# ── Private helpers ───────────────────────────────────────────────────────────

async def _get_lead(db: AsyncSession, lead_id: str) -> Optional[Lead]:
    result = await db.execute(select(Lead).where(Lead.id == uuid.UUID(lead_id)))
    return result.scalar_one_or_none()


async def _find_existing(
    db: AsyncSession,
    phone: str,
    email: Optional[str],
) -> Optional[Lead]:
    """Find a lead by phone number first, then by email."""
    result = await db.execute(select(Lead).where(Lead.phone_number == phone))
    lead = result.scalar_one_or_none()
    if lead is None and email:
        result = await db.execute(select(Lead).where(Lead.email == email))
        lead = result.scalar_one_or_none()
    return lead


def _apply_fields(lead: Lead, data: dict[str, Any]) -> None:
    """Copy non-null fields from data dict onto the ORM object."""
    field_map = {
        "email": "email",
        "name": "name",
        "company": "company",
        "lead_source": "lead_source",
        "lead_value": "lead_value",
        "assigned_to": "assigned_to",
        "notes": "notes",
    }
    for src, dest in field_map.items():
        val = data.get(src)
        if val is not None:
            setattr(lead, dest, val)

    # Merge tags list
    incoming_tags: list[str] = data.get("tags") or []
    if incoming_tags:
        existing = lead.tags or []
        lead.tags = list(set(existing) | set(incoming_tags))


def _recommend_action(score: int) -> str:
    if score >= 9:
        return "Call immediately — hot lead"
    if score >= 7:
        return "Follow up within 24 hours"
    if score >= 5:
        return "Send personalised follow-up email"
    return "Add to nurture sequence"


def _lead_to_dict(lead: Lead) -> dict[str, Any]:
    return {
        "id": str(lead.id),
        "phone_number": lead.phone_number,
        "email": lead.email,
        "name": lead.name,
        "company": lead.company,
        "lead_status": lead.lead_status,
        "lead_source": lead.lead_source,
        "lead_quality_score": lead.lead_quality_score,
        "lead_value": lead.lead_value,
        "total_calls": lead.total_calls,
        "last_call_at": lead.last_call_at.isoformat() if lead.last_call_at else None,
        "crm_synced": lead.crm_synced,
        "crm_id": lead.crm_id,
        "crm_sync_time": lead.crm_sync_time.isoformat() if lead.crm_sync_time else None,
        "qualification_reason": lead.qualification_reason,
        "recommended_action": lead.recommended_action,
        "assigned_to": lead.assigned_to,
        "tags": lead.tags,
        "notes": lead.notes,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
        "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
    }
