"""Application configuration loaded from environment variables via pydantic-settings."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central settings object — all values sourced from .env or environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────────
    app_env: Literal["development", "staging", "production"] = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = False
    secret_key: str = Field(..., min_length=16)

    # ── Database ───────────────────────────────────────────────────────────────
    database_url: str = Field(
        default="postgresql://voqal_user:voqal_password@localhost:5432/voqal_db"
    )
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout: int = 30

    # ── Redis ──────────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── Groq ───────────────────────────────────────────────────────────────────
    groq_api_key: str = Field(default="")
    groq_model: str = "llama-3.3-70b-versatile"

    # ── Voice Provider ─────────────────────────────────────────────────────────
    voice_provider: str = "twilio"
    voice_provider_api_key: str = ""
    voice_phone_number: str = ""

    # ── CRM ───────────────────────────────────────────────────────────────────
    hubspot_api_key: str = ""
    salesforce_client_id: str = ""
    salesforce_client_secret: str = ""
    salesforce_instance_url: str = ""

    # ── Encryption ────────────────────────────────────────────────────────────
    encryption_key: str = Field(default="")

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()
