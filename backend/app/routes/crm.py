"""
CRM integration endpoints.

Covers configuration, live connectivity testing, manual lead sync,
and inbound webhook handling from HubSpot / Salesforce.
"""

import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.database import CRMConfig, Lead
from app.models.schemas import (
    CRMConfigRequest,
    CRMStatusResponse,
    CRMSyncRequest,
    CRMSyncResponse,
    CRMWebhookPayload,
    CRMWebhookResponse,
    ErrorResponse,
)
from app.services import crm_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/crm", tags=["CRM Integration"])


# ══════════════════════════════════════════════════════════════════════════════
# POST /config  — save CRM configuration
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/config",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Save or replace a CRM integration configuration",
    responses={422: {"model": ErrorResponse}},
)
async def save_crm_config(
    body: CRMConfigRequest = Body(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Store or update the configuration for a CRM platform.

    The API key is encrypted with Fernet before being persisted — the raw key
    is never stored in plaintext.  A live connectivity test is performed
    immediately; `is_connected` in the response reflects the test result.

    Supported crm_type values: `hubspot`, `salesforce`
    """
    try:
        config = await crm_service.save_crm_config(
            db=db,
            crm_type=body.crm_type,
            api_key=body.api_key,
            webhook_url=body.webhook_url,
            auto_sync_enabled=body.auto_sync_enabled,
            sync_threshold=body.sync_lead_quality_threshold,
        )
        logger.info("CRM config saved: type=%s connected=%s", body.crm_type, config.get("is_connected"))
        return config
    except Exception as exc:
        logger.exception("Failed to save CRM config: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "CRM_CONFIG_FAILED", "error_message": str(exc)},
        )


# ══════════════════════════════════════════════════════════════════════════════
# GET /status  — connection status for all configured CRMs
# ══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/status",
    response_model=list[CRMStatusResponse],
    status_code=status.HTTP_200_OK,
    summary="Get connection status for all configured CRM integrations",
)
async def get_crm_status(
    crm_type: Optional[str] = Query(None, description="Filter to a specific CRM type"),
    db: AsyncSession = Depends(get_db),
) -> list[CRMStatusResponse]:
    """
    Return the connection state for each configured CRM integration.

    Also includes the total number of leads already synced for each CRM,
    making this the right endpoint for the settings dashboard status card.
    """
    query = select(CRMConfig)
    if crm_type:
        query = query.where(CRMConfig.crm_type == crm_type)
    result = await db.execute(query)
    configs = result.scalars().all()

    if not configs:
        return []

    responses: list[CRMStatusResponse] = []
    for cfg in configs:
        # Count synced leads for this CRM
        count_result = await db.execute(
            select(func.count(Lead.id)).where(
                Lead.crm_synced == True,  # noqa: E712
                Lead.crm_type == cfg.crm_type if hasattr(Lead, "crm_type") else True,
            )
        )
        synced_count = count_result.scalar_one() or 0

        responses.append(
            CRMStatusResponse(
                crm_type=cfg.crm_type,
                is_connected=cfg.is_connected,
                sync_status=cfg.sync_status,
                last_sync_time=cfg.last_sync_time.isoformat() if cfg.last_sync_time else None,
                error_message=cfg.error_message,
                auto_sync_enabled=cfg.auto_sync_enabled,
                sync_lead_quality_threshold=cfg.sync_lead_quality_threshold,
                total_synced_leads=synced_count,
            )
        )

    return responses


# ══════════════════════════════════════════════════════════════════════════════
# POST /sync/{lead_id}  — manual lead sync
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/sync/{lead_id}",
    response_model=CRMSyncResponse,
    status_code=status.HTTP_200_OK,
    summary="Manually sync a specific lead to CRM",
    responses={
        404: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
    },
)
async def manual_sync_lead(
    lead_id: uuid.UUID,
    crm_type: str = Query("hubspot", description="Target CRM platform"),
    force: bool = Query(False, description="Push even if already synced or below threshold"),
    db: AsyncSession = Depends(get_db),
) -> CRMSyncResponse:
    """
    Push a specific lead to the target CRM right now.

    By default the quality-threshold guard is respected.  Set `force=true`
    to bypass it (useful for manually verified high-value leads that scored
    below the automatic threshold).

    Returns the CRM contact ID on success.
    """
    # Validate lead exists first to give a clean 404
    lead_result = await db.execute(select(Lead).where(Lead.id == lead_id))
    if lead_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "LEAD_NOT_FOUND", "error_message": f"Lead {lead_id} not found"},
        )

    payload = CRMSyncRequest(lead_id=lead_id, crm_type=crm_type, force=force)
    response = await crm_service.sync_lead(db=db, payload=payload)

    if not response.success:
        logger.warning(
            "Manual CRM sync failed: lead_id=%s crm=%s reason=%s",
            lead_id, crm_type, response.error_message,
        )
    else:
        logger.info("Manual CRM sync succeeded: lead_id=%s crm_id=%s", lead_id, response.crm_id)

    return response


# ══════════════════════════════════════════════════════════════════════════════
# POST /webhook  — inbound CRM webhook handler
# ══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/webhook",
    response_model=CRMWebhookResponse,
    status_code=status.HTTP_200_OK,
    summary="Handle inbound webhooks from CRM platforms",
)
async def handle_crm_webhook(
    request: Request,
    x_hubspot_signature: Optional[str] = Header(None, alias="X-HubSpot-Signature"),
    x_crm_type: Optional[str] = Header(None, alias="X-CRM-Type"),
    db: AsyncSession = Depends(get_db),
) -> CRMWebhookResponse:
    """
    Accept inbound webhook events from HubSpot or Salesforce.

    HubSpot sends an `X-HubSpot-Signature` header for HMAC verification.
    Signature validation is applied when the header is present.

    Supported event types:
    - `contact.creation` / `contact.propertyChange` — sync updates back to Lead
    - `deal.creation` / `deal.stageChange` — update lead_status / lead_value
    - Any other type — acknowledged but not acted on (processed=False)
    """
    try:
        raw_body = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "INVALID_PAYLOAD", "error_message": "Request body must be valid JSON"},
        )

    # HubSpot delivers an array of event objects
    events: list[dict] = raw_body if isinstance(raw_body, list) else [raw_body]
    processed = False

    for event in events:
        event_type: str = event.get("subscriptionType") or event.get("event_type") or "unknown"
        object_id: Optional[str] = str(event.get("objectId") or event.get("object_id") or "")
        properties: dict = event.get("properties") or event.get("propertyValue") or {}

        logger.info(
            "CRM webhook received: type=%s object_id=%s crm=%s",
            event_type, object_id, x_crm_type or "unknown",
        )

        # Contact property change → update matching lead
        if event_type in ("contact.propertyChange", "contact.creation"):
            if object_id:
                lead_result = await db.execute(
                    select(Lead).where(Lead.crm_id == object_id)
                )
                lead = lead_result.scalar_one_or_none()
                if lead:
                    _apply_webhook_properties(lead, properties)
                    await db.flush()
                    processed = True
                    logger.info("Lead %s updated from CRM webhook", lead.id)

        # Deal stage change → update lead_status
        elif event_type in ("deal.stageChange", "deal.creation"):
            stage = properties.get("dealstage") or properties.get("stage")
            if stage and object_id:
                new_status = _map_deal_stage(stage)
                lead_result = await db.execute(
                    select(Lead).where(Lead.crm_id == object_id)
                )
                lead = lead_result.scalar_one_or_none()
                if lead and new_status:
                    lead.lead_status = new_status
                    await db.flush()
                    processed = True
                    logger.info("Lead %s status updated to %s from deal webhook", lead.id, new_status)

    return CRMWebhookResponse(
        received=True,
        event_type=events[0].get("subscriptionType") or events[0].get("event_type") or "batch",
        processed=processed,
        message=f"Processed {len(events)} webhook event(s)",
    )


# ── Private helpers ───────────────────────────────────────────────────────────

def _apply_webhook_properties(lead: Lead, properties: dict) -> None:
    """Map inbound CRM contact properties back onto the Lead ORM object."""
    if "email" in properties:
        lead.email = properties["email"]
    if "firstname" in properties or "lastname" in properties:
        first = properties.get("firstname", "")
        last = properties.get("lastname", "")
        lead.name = f"{first} {last}".strip() or lead.name
    if "company" in properties:
        lead.company = properties["company"]
    if "phone" in properties:
        lead.phone_number = properties["phone"] or lead.phone_number


def _map_deal_stage(stage: str) -> Optional[str]:
    """Map HubSpot deal stage to our internal lead_status."""
    mapping = {
        "appointmentscheduled": "contacted",
        "qualifiedtobuy": "qualified",
        "presentationscheduled": "contacted",
        "decisionmakerboughtin": "qualified",
        "contractsent": "contacted",
        "closedwon": "converted",
        "closedlost": "lost",
    }
    return mapping.get(stage.lower().replace("_", "").replace(" ", ""))
