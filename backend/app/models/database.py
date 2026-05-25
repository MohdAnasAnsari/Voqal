"""SQLAlchemy 2.0 ORM models for the Voice AI Agent platform."""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


# ─── Mixin ────────────────────────────────────────────────────────────────────

class TimestampMixin:
    """Adds auto-managed created_at / updated_at columns to any model."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


# ─── Call ─────────────────────────────────────────────────────────────────────

class Call(TimestampMixin, Base):
    """
    Represents a single AI-handled inbound or outbound call.

    Stores the full lifecycle of a call: transcript, AI analysis results,
    CRM sync state, and follow-up actions taken.
    """

    __tablename__ = "calls"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    caller_name: Mapped[Optional[str]] = mapped_column(String(200))
    call_duration_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Transcript & AI analysis
    transcript: Mapped[Optional[str]] = mapped_column(Text)
    transcript_summary: Mapped[Optional[str]] = mapped_column(Text)
    recording_url: Mapped[Optional[str]] = mapped_column(String(500))
    intent: Mapped[Optional[str]] = mapped_column(String(100))
    lead_quality_score: Mapped[Optional[float]] = mapped_column(Float)
    sentiment: Mapped[Optional[str]] = mapped_column(String(50))
    confidence_score: Mapped[Optional[float]] = mapped_column(Float)

    # CRM sync
    crm_synced: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    crm_id: Mapped[Optional[str]] = mapped_column(String(200))
    crm_type: Mapped[Optional[str]] = mapped_column(String(50))

    # Follow-up actions
    followup_sms_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    followup_email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    followup_content: Mapped[Optional[str]] = mapped_column(Text)

    # Metadata
    call_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    agent_transferred_to: Mapped[Optional[str]] = mapped_column(String(200))

    # ── Relationships ──────────────────────────────────────────────────────────
    leads: Mapped[list["Lead"]] = relationship(
        "Lead", back_populates="call", cascade="all, delete-orphan"
    )

    # ── Indexes ────────────────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_calls_phone_number", "phone_number"),
        Index("ix_calls_start_time", "start_time"),
        Index("ix_calls_lead_quality_score", "lead_quality_score"),
        Index("ix_calls_crm_synced", "crm_synced"),
    )

    def __repr__(self) -> str:
        return f"<Call id={self.id} phone={self.phone_number} status={self.call_status}>"


# ─── Lead ─────────────────────────────────────────────────────────────────────

class Lead(TimestampMixin, Base):
    """
    Qualified lead derived from one or more calls.

    A lead is unique per phone number and accumulates data across multiple
    interactions. It is the primary entity synced to external CRMs.
    """

    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255))
    name: Mapped[Optional[str]] = mapped_column(String(200))
    company: Mapped[Optional[str]] = mapped_column(String(200))

    # Lead qualification
    lead_source: Mapped[Optional[str]] = mapped_column(String(100))
    lead_status: Mapped[str] = mapped_column(String(50), default="new", nullable=False)
    lead_quality_score: Mapped[Optional[float]] = mapped_column(Float)
    lead_value: Mapped[Optional[float]] = mapped_column(Float)

    # Call linkage
    call_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("calls.id", ondelete="SET NULL")
    )
    total_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_call_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # CRM sync
    crm_id: Mapped[Optional[str]] = mapped_column(String(200))
    crm_synced: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    crm_sync_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # AI qualification results
    qualification_reason: Mapped[Optional[str]] = mapped_column(Text)
    recommended_action: Mapped[Optional[str]] = mapped_column(String(200))

    # Metadata
    notes: Mapped[Optional[str]] = mapped_column(Text)
    tags: Mapped[Optional[list]] = mapped_column(ARRAY(String))
    assigned_to: Mapped[Optional[str]] = mapped_column(String(200))

    # ── Relationships ──────────────────────────────────────────────────────────
    call: Mapped[Optional["Call"]] = relationship("Call", back_populates="leads")

    # ── Indexes ────────────────────────────────────────────────────────────────
    __table_args__ = (
        Index("ix_leads_phone_number", "phone_number"),
        Index("ix_leads_email", "email"),
        Index("ix_leads_lead_status", "lead_status"),
        Index("ix_leads_lead_quality_score", "lead_quality_score"),
    )

    def __repr__(self) -> str:
        return f"<Lead id={self.id} phone={self.phone_number} status={self.lead_status}>"


# ─── CRMConfig ────────────────────────────────────────────────────────────────

class CRMConfig(TimestampMixin, Base):
    """
    Per-CRM integration configuration.

    API credentials are stored encrypted at rest. Only one active config
    per crm_type should exist — enforce this at the service layer.
    """

    __tablename__ = "crm_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    crm_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Credentials stored encrypted
    api_key: Mapped[Optional[str]] = mapped_column(Text)
    api_secret: Mapped[Optional[str]] = mapped_column(Text)
    webhook_url: Mapped[Optional[str]] = mapped_column(String(500))

    # Sync behaviour
    auto_sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sync_lead_quality_threshold: Mapped[float] = mapped_column(Float, default=0.6, nullable=False)
    sync_fields_mapping: Mapped[Optional[dict]] = mapped_column(JSON)

    # Connection state
    is_connected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_sync_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    sync_status: Mapped[Optional[str]] = mapped_column(String(50))
    error_message: Mapped[Optional[str]] = mapped_column(Text)

    def __repr__(self) -> str:
        return f"<CRMConfig id={self.id} type={self.crm_type} connected={self.is_connected}>"


# ─── CallSettings ─────────────────────────────────────────────────────────────

class CallSettings(TimestampMixin, Base):
    """
    Global runtime configuration for the AI call agent.

    Includes voice provider credentials, LLM parameters, and call behaviour
    thresholds. Credentials are stored encrypted at rest.
    """

    __tablename__ = "call_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Voice provider
    voice_provider: Mapped[Optional[str]] = mapped_column(String(50))
    voice_provider_api_key: Mapped[Optional[str]] = mapped_column(Text)  # encrypted
    phone_number: Mapped[Optional[str]] = mapped_column(String(20))

    # LLM
    llm_model: Mapped[str] = mapped_column(String(100), default="llama-3.3-70b-versatile", nullable=False)
    llm_api_key: Mapped[Optional[str]] = mapped_column(Text)  # encrypted
    system_prompt: Mapped[Optional[str]] = mapped_column(Text)

    # Voice synthesis
    voice_service: Mapped[Optional[str]] = mapped_column(String(50))
    voice_id: Mapped[Optional[str]] = mapped_column(String(100))
    speech_rate: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)

    # Call behaviour
    transfer_to_human_threshold: Mapped[float] = mapped_column(Float, default=0.3, nullable=False)
    max_call_duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    call_timeout_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)

    def __repr__(self) -> str:
        return f"<CallSettings id={self.id} model={self.llm_model}>"


# ─── Agent ────────────────────────────────────────────────────────────────────

class Agent(TimestampMixin, Base):
    """
    A configured AI call agent persona.

    Each agent has its own system prompt, voice, and LLM settings.
    Performance stats (total_calls, qualified_leads, etc.) are cached
    counters updated by the call-processing pipeline.
    """

    __tablename__ = "agents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)

    # Status: draft | active | inactive
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)

    # LLM config
    llm_model: Mapped[str] = mapped_column(String(100), default="llama-3.3-70b-versatile", nullable=False)
    temperature: Mapped[float] = mapped_column(Float, default=0.7, nullable=False)
    max_tokens: Mapped[int] = mapped_column(Integer, default=500, nullable=False)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text)

    # Voice & phone
    voice_id: Mapped[Optional[str]] = mapped_column(String(100))
    assigned_phone_number: Mapped[Optional[str]] = mapped_column(String(20))

    # Cached performance counters (updated by call pipeline)
    total_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    qualified_leads: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    conversion_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    avg_call_duration: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    __table_args__ = (
        Index("ix_agents_status", "status"),
        Index("ix_agents_name", "name"),
    )

    def __repr__(self) -> str:
        return f"<Agent id={self.id} name={self.name!r} status={self.status}>"


# ─── Analytics ────────────────────────────────────────────────────────────────

class Analytics(Base):
    """
    Daily aggregated analytics snapshot.

    One row per date. Populated by a nightly background job that aggregates
    data from the calls and leads tables.
    """

    __tablename__ = "analytics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), unique=True, nullable=False)

    # Call volume
    total_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    answered_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    transferred_calls: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avg_call_duration_seconds: Mapped[Optional[float]] = mapped_column(Float)

    # Lead metrics
    qualified_leads: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    avg_lead_quality_score: Mapped[Optional[float]] = mapped_column(Float)
    leads_converted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # AI performance
    intent_classification_accuracy: Mapped[Optional[float]] = mapped_column(Float)
    average_sentiment_score: Mapped[Optional[float]] = mapped_column(Float)

    # Business metrics
    revenue_impact: Mapped[Optional[float]] = mapped_column(Float)
    conversion_rate: Mapped[Optional[float]] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Analytics date={self.date} calls={self.total_calls}>"
