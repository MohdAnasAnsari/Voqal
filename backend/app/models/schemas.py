"""Pydantic v2 request/response schemas for the Voice AI Agent API."""

import uuid
from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ══════════════════════════════════════════════════════════════════════════════
# Shared
# ══════════════════════════════════════════════════════════════════════════════

class ErrorResponse(BaseModel):
    """Standard error envelope returned on 4xx / 5xx responses."""

    error_code: str = Field(..., description="Machine-readable error code", examples=["CALL_NOT_FOUND"])
    error_message: str = Field(..., description="Human-readable description")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "error_code": "CALL_NOT_FOUND",
                "error_message": "No call found with id abc-123",
                "timestamp": "2026-05-24T10:00:00Z",
            }
        }
    )


# ══════════════════════════════════════════════════════════════════════════════
# Call — request bodies
# ══════════════════════════════════════════════════════════════════════════════

class ReceiveCallRequest(BaseModel):
    """Body for POST /calls/receive — register an inbound call."""

    phone_number: str = Field(
        ...,
        min_length=7,
        max_length=20,
        pattern=r"^\+?[1-9]\d{6,18}$",
        description="Caller's E.164 or local phone number",
        examples=["+15551234567"],
    )
    caller_name: Optional[str] = Field(
        None, max_length=200, description="Caller display name from caller-ID lookup"
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class UpdateCallRequest(BaseModel):
    """Body for POST /calls/{call_id}/update — send the latest caller utterance."""

    transcript: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Latest caller utterance or partial transcript fragment",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class EndCallRequest(BaseModel):
    """Body for POST /calls/{call_id}/end — finalise a completed call."""

    duration: int = Field(..., ge=0, description="Total call duration in seconds")
    final_transcript: str = Field(
        ..., min_length=1, description="Complete call transcript"
    )
    recording_url: Optional[str] = Field(
        None, max_length=500, description="URL to the call recording file"
    )

    model_config = ConfigDict(str_strip_whitespace=True)


# Call — alias kept for backward compat with service layer
CallCreate = ReceiveCallRequest


class CallUpdate(BaseModel):
    """Partial update payload for mutable call fields."""

    call_status: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    tags: Optional[list[str]] = None
    agent_transferred_to: Optional[str] = Field(None, max_length=200)


# ══════════════════════════════════════════════════════════════════════════════
# Call — response bodies
# ══════════════════════════════════════════════════════════════════════════════

class ReceiveCallResponse(BaseModel):
    """Returned when a new call session is created."""

    call_id: str = Field(..., description="UUID of the new Call record")
    session_token: str = Field(..., description="Redis session key for subsequent updates")
    greeting: str = Field(..., description="Opening line the AI agent should speak")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "call_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "session_token": "call_session:3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "greeting": "Hello! Thank you for calling. How can I help you today?",
            }
        }
    )


class UpdateCallResponse(BaseModel):
    """Returned after processing a single conversational turn."""

    intent: str = Field(..., description="Classified intent for this turn")
    response: str = Field(..., description="Text the AI agent should speak back")
    quality_score: int = Field(..., ge=1, le=10, description="Lead quality score 1–10")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "intent": "lead_qualify",
                "response": "That sounds great! Could you tell me a bit about your budget?",
                "quality_score": 7,
            }
        }
    )


class NextAction(BaseModel):
    """A single recommended next action after call completion."""

    action: str = Field(..., description="Action type e.g. 'send_followup_sms'")
    description: str = Field(..., description="Human-readable description")
    priority: Literal["high", "medium", "low"] = "medium"


class EndCallResponse(BaseModel):
    """Returned when a call is successfully finalised."""

    call_id: str
    call_summary: dict[str, Any] = Field(..., description="Full call analysis results")
    next_actions: list[NextAction] = Field(default_factory=list)
    lead_qualified: bool = False
    lead_id: Optional[str] = None


class CallDetailResponse(BaseModel):
    """Complete call record returned by GET /calls/{call_id}."""

    call_id: str
    phone_number: str
    caller_name: Optional[str] = None
    call_status: str
    call_duration_seconds: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    intent: Optional[str] = None
    lead_quality_score: Optional[float] = None
    sentiment: Optional[str] = None
    crm_synced: bool = False
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    transcript_summary: Optional[str] = None
    followup_content: Optional[str] = None
    tags: Optional[list[str]] = None
    lead: Optional[dict[str, Any]] = None
    created_at: Optional[str] = None


class ActiveCallEntry(BaseModel):
    """Summary of a single active (in-progress) call."""

    call_id: str
    phone_number: str
    caller_name: Optional[str] = None
    started_at: Optional[str] = None
    duration_so_far: Optional[int] = None


class ActiveCallsResponse(BaseModel):
    """Returned by GET /calls/active."""

    active_calls: list[ActiveCallEntry]
    count: int


class CallHistoryResponse(BaseModel):
    """Paginated list of calls returned by GET /calls/history."""

    calls: list[dict[str, Any]]
    total_count: int
    has_more: bool
    limit: int
    offset: int


class CallResponse(BaseModel):
    """Lightweight call record (ORM-compatible) used in mixed contexts."""

    id: uuid.UUID
    phone_number: str
    caller_name: Optional[str] = None
    call_duration_seconds: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    transcript: Optional[str] = None
    lead_quality_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    intent: Optional[str] = None
    sentiment: Optional[str] = None
    call_status: str
    crm_synced: bool
    followup_sms_sent: bool
    followup_email_sent: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ══════════════════════════════════════════════════════════════════════════════
# Lead — request bodies
# ══════════════════════════════════════════════════════════════════════════════

class QualifyLeadRequest(BaseModel):
    """Body for POST /leads/qualify."""

    call_id: str = Field(..., description="UUID of the call that generated this lead")
    name: Optional[str] = Field(None, max_length=200, description="Caller's full name")
    email: Optional[EmailStr] = Field(None, description="Caller's email address")
    company: Optional[str] = Field(None, max_length=200)
    phone_number: Optional[str] = Field(
        None,
        max_length=20,
        pattern=r"^\+?[1-9]\d{6,18}$",
        description="Override phone; falls back to call record's phone_number",
    )
    quality_score: int = Field(..., ge=1, le=10, description="AI-assigned lead quality 1–10")
    notes: Optional[str] = Field(None, description="Optional context from the agent")

    model_config = ConfigDict(str_strip_whitespace=True)


class UpdateLeadRequest(BaseModel):
    """Body for PUT /leads/{lead_id}."""

    status: Optional[str] = Field(
        None,
        description="new | qualified | contacted | converted | lost",
    )
    assigned_to: Optional[str] = Field(None, max_length=200, description="Agent email or ID")
    notes: Optional[str] = None
    tags: Optional[list[str]] = None
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    lead_value: Optional[float] = Field(None, ge=0, description="Estimated deal value in USD")

    model_config = ConfigDict(str_strip_whitespace=True)


# Lead — alias kept for backward compat
LeadCreate = QualifyLeadRequest


class LeadUpdate(BaseModel):
    """Internal partial update model."""

    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, max_length=200)
    company: Optional[str] = Field(None, max_length=200)
    lead_status: Optional[str] = Field(None, max_length=50)
    lead_value: Optional[float] = Field(None, ge=0)
    assigned_to: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None
    tags: Optional[list[str]] = None


# ══════════════════════════════════════════════════════════════════════════════
# Lead — response bodies
# ══════════════════════════════════════════════════════════════════════════════

class CallSummary(BaseModel):
    """Condensed call info embedded in lead responses."""

    id: uuid.UUID
    start_time: Optional[datetime] = None
    call_duration_seconds: Optional[int] = None
    intent: Optional[str] = None
    sentiment: Optional[str] = None
    call_status: str

    model_config = ConfigDict(from_attributes=True)


class QualifyLeadResponse(BaseModel):
    """Returned by POST /leads/qualify."""

    lead_id: str
    crm_sync_status: Literal["synced", "queued", "skipped", "error"] = "skipped"
    crm_id: Optional[str] = None
    message: str = "Lead created/updated successfully"

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "crm_sync_status": "synced",
                "crm_id": "hs-contact-12345",
            }
        }
    )


class LeadDetailResponse(BaseModel):
    """Full lead returned by GET /leads/{lead_id}."""

    lead: dict[str, Any]
    call_history: list[dict[str, Any]] = Field(default_factory=list)
    conversion_status: dict[str, Any] = Field(default_factory=dict)


class LeadListResponse(BaseModel):
    """Paginated lead list returned by GET /leads."""

    leads: list[dict[str, Any]]
    total_count: int
    limit: int
    offset: int


class QualifiedLeadsResponse(BaseModel):
    """Returned by GET /leads/qualified."""

    qualified_leads: list[dict[str, Any]]
    count: int
    conversion_rate: float = Field(..., description="Fraction of qualified leads converted 0–1")


class LeadResponse(BaseModel):
    """ORM-compatible full lead (for service-layer use)."""

    id: uuid.UUID
    phone_number: str
    email: Optional[str] = None
    name: Optional[str] = None
    company: Optional[str] = None
    lead_source: Optional[str] = None
    lead_status: str
    lead_quality_score: Optional[float] = None
    lead_value: Optional[float] = None
    total_calls: int
    last_call_at: Optional[datetime] = None
    crm_synced: bool
    crm_id: Optional[str] = None
    crm_sync_time: Optional[datetime] = None
    qualification_reason: Optional[str] = None
    recommended_action: Optional[str] = None
    assigned_to: Optional[str] = None
    tags: Optional[list[str]] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    recent_calls: list[CallSummary] = Field(default_factory=list)
    is_converted: bool = False

    model_config = ConfigDict(from_attributes=True)

    @field_validator("is_converted", mode="before")
    @classmethod
    def derive_conversion(cls, v: Any, info: Any) -> bool:
        if isinstance(v, bool):
            return v
        data = info.data if hasattr(info, "data") else {}
        return data.get("lead_status") == "converted"


# ══════════════════════════════════════════════════════════════════════════════
# CRM — request / response bodies
# ══════════════════════════════════════════════════════════════════════════════

class CRMConfigRequest(BaseModel):
    """Payload to configure or update a CRM integration."""

    crm_type: str = Field(
        ..., max_length=50, description="CRM platform", examples=["hubspot", "salesforce"]
    )
    api_key: str = Field(..., min_length=8, description="CRM API key (stored encrypted)")
    api_secret: Optional[str] = Field(None, description="API secret if required")
    webhook_url: Optional[str] = Field(None, max_length=500)
    auto_sync_enabled: bool = False
    sync_lead_quality_threshold: float = Field(default=0.6, ge=0.0, le=1.0)
    sync_fields_mapping: Optional[dict[str, str]] = None

    model_config = ConfigDict(str_strip_whitespace=True)


class CRMConfigResponse(BaseModel):
    """Public CRM config (no secrets)."""

    id: uuid.UUID
    crm_type: str
    is_connected: bool
    auto_sync_enabled: bool
    sync_lead_quality_threshold: float
    webhook_url: Optional[str] = None
    last_sync_time: Optional[datetime] = None
    sync_status: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CRMStatusResponse(BaseModel):
    """Returned by GET /crm/status."""

    crm_type: str
    is_connected: bool
    sync_status: Optional[str] = None
    last_sync_time: Optional[str] = None
    error_message: Optional[str] = None
    auto_sync_enabled: bool = False
    sync_lead_quality_threshold: float = 0.6
    total_synced_leads: int = 0


class CRMSyncRequest(BaseModel):
    """Trigger a manual CRM sync for a specific lead."""

    lead_id: uuid.UUID
    crm_type: str = Field(..., max_length=50)
    force: bool = Field(default=False, description="Re-sync even if already synced")


class CRMSyncResponse(BaseModel):
    """Result of a CRM sync operation."""

    lead_id: uuid.UUID
    crm_type: str
    success: bool
    crm_id: Optional[str] = None
    error_message: Optional[str] = None
    synced_at: datetime = Field(default_factory=datetime.utcnow)


class CRMWebhookPayload(BaseModel):
    """Generic inbound webhook from a CRM platform."""

    event_type: str = Field(..., description="CRM event type e.g. 'contact.updated'")
    object_type: Optional[str] = Field(None, description="Object type e.g. 'contact'")
    object_id: Optional[str] = Field(None, description="CRM object ID")
    timestamp: Optional[datetime] = None
    properties: dict[str, Any] = Field(default_factory=dict)
    portal_id: Optional[str] = Field(None, description="HubSpot portal ID if applicable")

    model_config = ConfigDict(extra="allow")


class CRMWebhookResponse(BaseModel):
    """Acknowledgement returned to the CRM webhook sender."""

    received: bool = True
    event_type: str
    processed: bool = False
    message: str = "Webhook received"


# ══════════════════════════════════════════════════════════════════════════════
# Agent — request / response bodies
# ══════════════════════════════════════════════════════════════════════════════

class AgentCreate(BaseModel):
    """Body for POST /agents — create a new agent persona."""

    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Literal["draft", "active", "inactive"] = "draft"
    llm_model: str = Field(default="llama-3.3-70b-versatile", max_length=100)
    temperature: float = Field(default=0.7, ge=0.0, le=1.0)
    max_tokens: int = Field(default=500, ge=50, le=8000)
    system_prompt: Optional[str] = None
    voice_id: Optional[str] = Field(None, max_length=100)
    assigned_phone_number: Optional[str] = Field(
        None, max_length=20, pattern=r"^\+?[1-9]\d{6,18}$"
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class AgentUpdate(BaseModel):
    """Body for PUT /agents/{agent_id} — partial update."""

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[Literal["draft", "active", "inactive"]] = None
    llm_model: Optional[str] = Field(None, max_length=100)
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(None, ge=50, le=8000)
    system_prompt: Optional[str] = None
    voice_id: Optional[str] = Field(None, max_length=100)
    assigned_phone_number: Optional[str] = Field(
        None, max_length=20, pattern=r"^\+?[1-9]\d{6,18}$"
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class AgentResponse(BaseModel):
    """Full agent record returned by GET /agents/{agent_id}."""

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    status: str
    llm_model: str
    temperature: float
    max_tokens: int
    system_prompt: Optional[str] = None
    voice_id: Optional[str] = None
    assigned_phone_number: Optional[str] = None
    total_calls: int
    qualified_leads: int
    conversion_rate: float
    avg_call_duration: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentListResponse(BaseModel):
    """Paginated list of agents."""

    agents: list[AgentResponse]
    total_count: int
    limit: int
    offset: int


# ══════════════════════════════════════════════════════════════════════════════
# Analytics — response bodies
# ══════════════════════════════════════════════════════════════════════════════

class TrendMetric(BaseModel):
    """A numeric metric with period-over-period delta."""

    value: float
    change_percent: Optional[float] = Field(None, description="% change vs previous period")
    trend: Optional[str] = Field(None, description="'up' | 'down' | 'flat'")


class IntentBreakdown(BaseModel):
    """Intent label with count and percentage."""

    intent: str
    count: int
    percentage: float


class DailyDataPoint(BaseModel):
    """One data point in a time-series chart."""

    date: str
    calls: int
    qualified_leads: int
    conversion_rate: float


class DashboardResponse(BaseModel):
    """
    Top-level dashboard metrics for the current day and trailing 7 days.

    Designed for the executive summary card row + sparkline charts.
    """

    # Today's snapshot
    calls_today: int = Field(..., description="Total calls received today")
    qualified_today: int = Field(..., description="Leads qualified today")
    active_calls_now: int = Field(default=0, description="Calls currently in progress")

    # Trailing 7-day aggregates with trend
    qualified_leads: TrendMetric
    conversion_rate: TrendMetric
    revenue: TrendMetric
    avg_call_duration: TrendMetric
    avg_quality_score: TrendMetric

    # Chart data (last 7 days, one point per day)
    metrics_chart: list[DailyDataPoint] = Field(default_factory=list)

    # Intent breakdown for pie chart
    intent_breakdown: list[IntentBreakdown] = Field(default_factory=list)

    generated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "calls_today": 24,
                "qualified_today": 8,
                "active_calls_now": 2,
                "qualified_leads": {"value": 56, "change_percent": 14.3, "trend": "up"},
                "conversion_rate": {"value": 0.32, "change_percent": -2.0, "trend": "down"},
                "revenue": {"value": 48000, "change_percent": 8.5, "trend": "up"},
            }
        }
    )


class ReportMetrics(BaseModel):
    """Detailed metrics block inside a report."""

    total_calls: int
    answered_calls: int
    failed_calls: int
    transferred_calls: int
    avg_call_duration_seconds: float
    qualified_leads: int
    avg_lead_quality_score: float
    leads_converted: int
    conversion_rate: float
    revenue_impact: float
    avg_sentiment_score: float
    intent_accuracy: float


class TrendPoint(BaseModel):
    """One point in a trend series."""

    date: str
    value: float


class ReportResponse(BaseModel):
    """
    Detailed analytics report for an arbitrary date range.

    Includes per-metric breakdowns and daily trend series for chart rendering.
    """

    date_from: str
    date_to: str
    period_days: int

    detailed_metrics: ReportMetrics

    # Chart series (one entry per day in the range)
    charts_data: dict[str, list[TrendPoint]] = Field(
        default_factory=dict,
        description="Keyed by metric name; each value is a daily trend series",
    )

    # Comparison vs previous equivalent period
    trends: dict[str, TrendMetric] = Field(
        default_factory=dict,
        description="Period-over-period change for each key metric",
    )

    # Top 5 intents for the period
    top_intents: list[IntentBreakdown] = Field(default_factory=list)

    generated_at: datetime = Field(default_factory=datetime.utcnow)


class AnalyticsResponse(BaseModel):
    """Generic dashboard metrics (used by /analytics/summary)."""

    date: datetime
    period_label: Optional[str] = None
    total_calls: TrendMetric
    answered_calls: TrendMetric
    failed_calls: TrendMetric
    transferred_calls: TrendMetric
    avg_call_duration_seconds: TrendMetric
    qualified_leads: TrendMetric
    avg_lead_quality_score: TrendMetric
    leads_converted: TrendMetric
    intent_classification_accuracy: TrendMetric
    average_sentiment_score: TrendMetric
    revenue_impact: TrendMetric
    conversion_rate: TrendMetric
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(from_attributes=True)


class AnalyticsSummary(BaseModel):
    """Lightweight summary used in daily list endpoints."""

    date: datetime
    total_calls: int
    qualified_leads: int
    conversion_rate: Optional[float] = None
    avg_lead_quality_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
