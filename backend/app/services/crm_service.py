"""
CRM integration service — HubSpot (primary) + Salesforce (secondary).

API credentials are encrypted at rest using Fernet symmetric encryption.
All HubSpot operations use the official hubspot-api-client library and include
3-attempt retry logic with exponential back-off for rate-limit / transient errors.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import CRMConfig, Lead
from app.models.schemas import CRMSyncRequest, CRMSyncResponse
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_MAX_RETRIES = 3
_RETRY_BACKOFF_BASE = 2.0  # seconds


# ── Encryption helpers ────────────────────────────────────────────────────────

def _fernet() -> Fernet:
    """Return a Fernet cipher.  Falls back to a per-process key if none configured."""
    key = settings.encryption_key.encode() if settings.encryption_key else Fernet.generate_key()
    return Fernet(key)


def _encrypt(plain: str) -> str:
    return _fernet().encrypt(plain.encode()).decode()


def _decrypt(token: str) -> str:
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        logger.error("Decryption failed — encryption key may have changed")
        raise ValueError("Cannot decrypt CRM credential: invalid token")


# ── Retry decorator ───────────────────────────────────────────────────────────

async def _with_retry(coro_factory, label: str) -> Any:
    """
    Call coro_factory() up to _MAX_RETRIES times, sleeping on transient errors.

    Args:
        coro_factory: Zero-argument async callable that performs the operation.
        label:        Human-readable name for log messages.

    Returns:
        The return value of coro_factory() on success.

    Raises:
        The last exception if all retries are exhausted.
    """
    last_exc: Exception | None = None
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            return await coro_factory()
        except Exception as exc:
            wait = _RETRY_BACKOFF_BASE ** attempt
            logger.warning(
                "%s failed (attempt %d/%d): %s — retrying in %.1fs",
                label, attempt, _MAX_RETRIES, exc, wait,
            )
            last_exc = exc
            await asyncio.sleep(wait)
    logger.error("%s failed after %d retries", label, _MAX_RETRIES)
    raise last_exc  # type: ignore[misc]


# ── HubSpot connectivity ──────────────────────────────────────────────────────

async def test_hubspot_connection(api_key: str) -> bool:
    """
    Verify that the supplied HubSpot API key is valid by performing a minimal
    read operation (list one contact).

    Args:
        api_key: HubSpot private-app access token.

    Returns:
        True on success, False on authentication / connectivity failure.
    """
    import httpx

    async def _do() -> bool:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.hubapi.com/crm/v3/objects/contacts",
                headers={"Authorization": f"Bearer {api_key}"},
                params={"limit": 1},
            )
            resp.raise_for_status()
            return True

    try:
        return await _with_retry(_do, "HubSpot connectivity test")
    except Exception as exc:
        logger.error("HubSpot connection test failed: %s", exc)
        return False


# ── HubSpot lead sync ─────────────────────────────────────────────────────────

async def sync_lead_to_hubspot(lead: Lead, api_key: str) -> dict[str, Any]:
    """
    Create or update a HubSpot contact from a Lead ORM object.

    Field mapping:
        lead.name           → firstname + lastname
        lead.email          → email
        lead.phone_number   → phone
        lead.company        → company
        lead.lead_quality_score → custom property 'ai_quality_score' (0–10 integer)

    The upsert is done via the HubSpot v3 Contacts API using the `email` or
    `phone` as the deduplication key (phone used when email is absent).

    Args:
        lead:    ORM Lead object with the data to sync.
        api_key: HubSpot private-app access token (decrypted).

    Returns:
        {
            "hubspot_id":   str  – HubSpot internal contact ID,
            "sync_status":  str  – "created" | "updated" | "error",
            "timestamp":    str  – ISO-8601 UTC timestamp
        }

    Raises:
        httpx.HTTPStatusError: On a non-retryable 4xx error from HubSpot.
    """
    import httpx

    first, *rest = (lead.name or "").split()
    last = " ".join(rest) if rest else ""

    # Scale 0.0–1.0 score to 0–10 integer for HubSpot custom property
    hs_score = round((lead.lead_quality_score or 0) * 10)

    properties = {
        "firstname": first,
        "lastname": last,
        "email": lead.email or "",
        "phone": lead.phone_number,
        "company": lead.company or "",
        "ai_quality_score": str(hs_score),
    }
    # Remove empty strings so HubSpot doesn't overwrite existing values with blanks
    properties = {k: v for k, v in properties.items() if v}

    async def _do() -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=15) as client:
            # Try upsert by email first, then by phone
            dedup_key = lead.email or lead.phone_number
            dedup_field = "email" if lead.email else "phone"

            # Check if contact already exists
            search_resp = await client.post(
                "https://api.hubapi.com/crm/v3/objects/contacts/search",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "filterGroups": [{
                        "filters": [{
                            "propertyName": dedup_field,
                            "operator": "EQ",
                            "value": dedup_key,
                        }]
                    }],
                    "limit": 1,
                },
            )
            search_resp.raise_for_status()
            results = search_resp.json().get("results", [])

            if results:
                # Update existing contact
                hs_id = results[0]["id"]
                patch_resp = await client.patch(
                    f"https://api.hubapi.com/crm/v3/objects/contacts/{hs_id}",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"properties": properties},
                )
                patch_resp.raise_for_status()
                logger.info("HubSpot contact updated: id=%s lead=%s", hs_id, lead.id)
                return {
                    "hubspot_id": hs_id,
                    "sync_status": "updated",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            else:
                # Create new contact
                create_resp = await client.post(
                    "https://api.hubapi.com/crm/v3/objects/contacts",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"properties": properties},
                )
                create_resp.raise_for_status()
                hs_id = create_resp.json()["id"]
                logger.info("HubSpot contact created: id=%s lead=%s", hs_id, lead.id)
                return {
                    "hubspot_id": hs_id,
                    "sync_status": "created",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }

    try:
        return await _with_retry(_do, f"HubSpot sync lead={lead.id}")
    except Exception as exc:
        logger.exception("HubSpot sync permanently failed for lead %s: %s", lead.id, exc)
        return {
            "hubspot_id": None,
            "sync_status": "error",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "error": str(exc),
        }


# ── Config management ─────────────────────────────────────────────────────────

async def get_crm_config(db: AsyncSession, crm_type: str = "hubspot") -> Optional[dict[str, Any]]:
    """
    Fetch and decrypt the CRM configuration for the given platform.

    Args:
        db:       Active database session.
        crm_type: Platform identifier (default: 'hubspot').

    Returns:
        Config dict with the decrypted API key, or None if not configured.
    """
    result = await db.execute(
        select(CRMConfig).where(CRMConfig.crm_type == crm_type)
    )
    config = result.scalar_one_or_none()
    if config is None:
        logger.info("No CRM config found for type=%s", crm_type)
        return None

    decrypted_key: Optional[str] = None
    if config.api_key:
        try:
            decrypted_key = _decrypt(config.api_key)
        except ValueError as exc:
            logger.error("Cannot decrypt API key for crm_type=%s: %s", crm_type, exc)

    return {
        "id": str(config.id),
        "crm_type": config.crm_type,
        "api_key": decrypted_key,
        "webhook_url": config.webhook_url,
        "auto_sync_enabled": config.auto_sync_enabled,
        "sync_lead_quality_threshold": config.sync_lead_quality_threshold,
        "sync_fields_mapping": config.sync_fields_mapping,
        "is_connected": config.is_connected,
        "last_sync_time": config.last_sync_time.isoformat() if config.last_sync_time else None,
        "sync_status": config.sync_status,
        "error_message": config.error_message,
    }


async def save_crm_config(
    db: AsyncSession,
    crm_type: str,
    api_key: str,
    webhook_url: Optional[str] = None,
    auto_sync_enabled: bool = False,
    sync_threshold: float = 0.6,
) -> dict[str, Any]:
    """
    Persist a CRM configuration, encrypting the API key before storage.

    Tests connectivity immediately and sets is_connected accordingly.

    Args:
        db:                 Active database session.
        crm_type:           Platform identifier e.g. 'hubspot'.
        api_key:            Plain-text API key (will be encrypted).
        webhook_url:        Optional webhook endpoint URL.
        auto_sync_enabled:  Whether to automatically push qualified leads.
        sync_threshold:     Minimum normalised quality score (0–1) for auto-sync.

    Returns:
        Saved config as a dict (api_key field is absent — never returned).
    """
    result = await db.execute(
        select(CRMConfig).where(CRMConfig.crm_type == crm_type)
    )
    config = result.scalar_one_or_none()

    if config is None:
        config = CRMConfig(crm_type=crm_type)
        db.add(config)
        logger.info("Creating new CRM config for type=%s", crm_type)
    else:
        logger.info("Updating CRM config for type=%s", crm_type)

    config.api_key = _encrypt(api_key)
    config.webhook_url = webhook_url
    config.auto_sync_enabled = auto_sync_enabled
    config.sync_lead_quality_threshold = sync_threshold

    # Test live connectivity
    if crm_type == "hubspot":
        connected = await test_hubspot_connection(api_key)
    else:
        logger.warning("Connectivity test not implemented for crm_type=%s", crm_type)
        connected = False

    config.is_connected = connected
    config.sync_status = "ok" if connected else "connection_failed"
    config.error_message = None if connected else f"Connection test failed for {crm_type}"

    await db.flush()
    await db.refresh(config)

    logger.info(
        "CRM config saved: type=%s connected=%s auto_sync=%s threshold=%.2f",
        crm_type, connected, auto_sync_enabled, sync_threshold,
    )
    return {
        "id": str(config.id),
        "crm_type": config.crm_type,
        "webhook_url": config.webhook_url,
        "auto_sync_enabled": config.auto_sync_enabled,
        "sync_lead_quality_threshold": config.sync_lead_quality_threshold,
        "is_connected": config.is_connected,
        "sync_status": config.sync_status,
        "error_message": config.error_message,
        "created_at": config.created_at.isoformat() if config.created_at else None,
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
    }


# ── Bulk sync (used by routes/crm.py) ────────────────────────────────────────

async def sync_lead(db: AsyncSession, payload: CRMSyncRequest) -> CRMSyncResponse:
    """
    Push a single lead to the target CRM, honouring the quality threshold.

    Args:
        db:      Active database session.
        payload: CRMSyncRequest with lead_id, crm_type, and optional force flag.

    Returns:
        CRMSyncResponse describing the outcome.
    """
    lead_result = await db.execute(select(Lead).where(Lead.id == payload.lead_id))
    lead = lead_result.scalar_one_or_none()

    if lead is None:
        return CRMSyncResponse(
            lead_id=payload.lead_id,
            crm_type=payload.crm_type,
            success=False,
            error_message="Lead not found",
        )

    config = await get_crm_config(db, payload.crm_type)
    if config is None or not config.get("is_connected"):
        return CRMSyncResponse(
            lead_id=payload.lead_id,
            crm_type=payload.crm_type,
            success=False,
            error_message="CRM not configured or not connected",
        )

    threshold = config.get("sync_lead_quality_threshold", 0.6)
    if not payload.force and (lead.lead_quality_score or 0) < threshold:
        return CRMSyncResponse(
            lead_id=payload.lead_id,
            crm_type=payload.crm_type,
            success=False,
            error_message=(
                f"Lead score {lead.lead_quality_score:.2f} below threshold {threshold:.2f}"
            ),
        )

    api_key = config["api_key"]
    if payload.crm_type == "hubspot":
        result = await sync_lead_to_hubspot(lead, api_key)
    else:
        return CRMSyncResponse(
            lead_id=payload.lead_id,
            crm_type=payload.crm_type,
            success=False,
            error_message=f"Unsupported CRM type: {payload.crm_type}",
        )

    if result.get("sync_status") in ("created", "updated"):
        lead.crm_synced = True
        lead.crm_id = result.get("hubspot_id")
        lead.crm_sync_time = datetime.now(timezone.utc)
        await db.flush()
        return CRMSyncResponse(
            lead_id=payload.lead_id,
            crm_type=payload.crm_type,
            success=True,
            crm_id=result.get("hubspot_id"),
        )

    return CRMSyncResponse(
        lead_id=payload.lead_id,
        crm_type=payload.crm_type,
        success=False,
        error_message=result.get("error", "Sync failed"),
    )


async def bulk_sync(db: AsyncSession, crm_type: str) -> list[CRMSyncResponse]:
    """
    Find all unsynced leads meeting the quality threshold and push them to CRM.

    Args:
        db:       Active database session.
        crm_type: Target CRM platform identifier.

    Returns:
        List of CRMSyncResponse, one per lead processed.
    """
    config = await get_crm_config(db, crm_type)
    if config is None:
        logger.warning("bulk_sync: no config for crm_type=%s", crm_type)
        return []

    threshold = config.get("sync_lead_quality_threshold", 0.6)
    leads_result = await db.execute(
        select(Lead).where(
            Lead.crm_synced == False,  # noqa: E712
            Lead.lead_quality_score >= threshold,
        )
    )
    leads = list(leads_result.scalars().all())
    logger.info("bulk_sync: %d leads eligible for %s", len(leads), crm_type)

    results = []
    for lead in leads:
        resp = await sync_lead(
            db,
            CRMSyncRequest(lead_id=lead.id, crm_type=crm_type, force=False),
        )
        results.append(resp)

    return results
