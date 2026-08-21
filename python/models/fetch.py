"""What a fetch produces.

One shape regardless of which engine did the work, so the stages downstream
never care whether Crawl4AI, Playwright or plain HTTP retrieved the page.
"""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class FetchEngine(StrEnum):
    CRAWL4AI = "crawl4ai"
    HTTPX = "httpx"


class FetchOutcome(StrEnum):
    FETCHED = "fetched"
    UNCHANGED = "unchanged"
    """Content hash matched the last crawl — everything downstream is skipped."""

    BLOCKED_BY_ROBOTS = "blocked_by_robots"
    FAILED = "failed"


class FetchResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str
    outcome: FetchOutcome
    engine: FetchEngine | None = None

    http_status: int | None = None
    html: str | None = None
    markdown: str | None = None
    """Cleaned content. This is what Gemini sees — never raw HTML (§7)."""

    content_hash: str | None = None
    links: list[str] = Field(default_factory=list)
    error: str | None = None
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @property
    def succeeded(self) -> bool:
        return self.outcome in {FetchOutcome.FETCHED, FetchOutcome.UNCHANGED}

    @property
    def needs_processing(self) -> bool:
        """Only a genuinely changed page is worth spending an AI call on."""
        return self.outcome == FetchOutcome.FETCHED and bool(self.markdown)
