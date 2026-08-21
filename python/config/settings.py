"""Typed configuration, validated once at startup.

MASTER_PROJECT_SPEC.md Part 7B §141: nothing is hardcoded and no secret is
read from anywhere but the environment. Validation happens on import so a
missing key fails immediately with a readable message, rather than surfacing
as a confusing auth error halfway through a crawl.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
LOG_DIR = PACKAGE_ROOT / "logs"


class Settings(BaseSettings):
    """Everything the pipeline needs to run, read from `python/.env`."""

    model_config = SettingsConfigDict(
        env_file=PACKAGE_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- Supabase -----------------------------------------------------------
    supabase_url: str = Field(description="Project URL, e.g. https://xxx.supabase.co")
    supabase_secret_key: SecretStr = Field(
        description="sb_secret_… key. Bypasses RLS, so this process is trusted."
    )

    # --- AI -----------------------------------------------------------------
    gemini_api_key: SecretStr
    # Verified against the live API on 2026-08-20. gemini-2.5-flash now
    # returns 404 for keys created after its deprecation, with the API itself
    # naming this as the replacement.
    gemini_model: str = "gemini-3.6-flash"

    # --- Crawler ------------------------------------------------------------
    user_agent: str = "GrantNinjaBot/1.0 (+https://grantninja.com/about)"
    crawl_timeout: int = Field(default=30, ge=1, le=300)
    playwright_timeout: int = Field(default=60, ge=1, le=300)
    max_retries: int = Field(default=3, ge=0, le=10)
    request_delay: float = Field(
        default=2.0, ge=0, description="Seconds between requests to one host."
    )
    max_concurrent_jobs: int = Field(default=4, ge=1, le=32)
    headless: bool = True
    respect_robots_txt: bool = True

    # --- Runtime ------------------------------------------------------------
    log_level: str = "INFO"
    default_country: str = "united-states"
    dry_run: bool = Field(
        default=False,
        description="Run every stage but write nothing. Used to rehearse a source.",
    )

    @field_validator("supabase_url")
    @classmethod
    def _require_https_url(cls, value: str) -> str:
        if not value.startswith("https://"):
            raise ValueError("supabase_url must start with https://")

        return value.rstrip("/")

    @field_validator("log_level")
    @classmethod
    def _known_log_level(cls, value: str) -> str:
        allowed = {"TRACE", "DEBUG", "INFO", "SUCCESS", "WARNING", "ERROR", "CRITICAL"}
        upper = value.upper()

        if upper not in allowed:
            raise ValueError(f"log_level must be one of {sorted(allowed)}")

        return upper


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Settings are read once per process and cached.

    Cached rather than re-read so a long crawl cannot pick up a half-edited
    `.env` partway through.
    """
    return Settings()  # type: ignore[call-arg]
