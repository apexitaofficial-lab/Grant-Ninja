"""Turning a cleaned page into a validated grant.

The single entry point the pipeline uses for extraction. It owns the decision
that matters most in this system: whether an extraction is trustworthy enough
to publish, or whether a human should look first.
"""

from __future__ import annotations

from dataclasses import dataclass

from ai.gemini import AIExtractionError, GeminiClient, describe_usage, to_log_row
from ai.prompt_loader import load_prompt
from core.logging import get_logger
from extractors.content import prepare_for_ai
from models.grant import ExtractedGrant
from repositories.ai_logs import ai_log_repository

log = get_logger("extract")

EXTRACTION_PROMPT = "grant_extraction"


@dataclass(frozen=True, slots=True)
class ExtractionOutcome:
    grant: ExtractedGrant | None
    prompt_version: str
    auto_publish: bool
    needs_review: bool
    reason: str

    @property
    def succeeded(self) -> bool:
        return self.grant is not None


class GrantExtractor:
    def __init__(self, threshold: int, client: GeminiClient | None = None) -> None:
        """`threshold` comes from `system_settings`, not from code (decision D3)."""
        self._threshold = threshold
        self._client = client or GeminiClient()

    def extract(self, url: str, content: str, prompt_version: str | None = None) -> ExtractionOutcome:
        prompt = load_prompt(EXTRACTION_PROMPT, prompt_version)
        prepared = prepare_for_ai(content)

        if len(prepared) < 200:
            # Not worth a paid call: there is nothing here to read.
            return ExtractionOutcome(
                grant=None,
                prompt_version=prompt.version,
                auto_publish=False,
                needs_review=False,
                reason="page had too little content to extract",
            )

        try:
            result = self._client.generate_structured(prompt, ExtractedGrant, content=prepared)
        except AIExtractionError as error:
            ai_log_repository.record_failure(
                model=self._client.model,
                prompt_name=prompt.name,
                prompt_version=prompt.version,
                status="invalid_json",
                error_message=str(error),
            )

            log.warning("Extraction failed for {url}: {error}", url=url, error=error)

            return ExtractionOutcome(
                grant=None,
                prompt_version=prompt.version,
                auto_publish=False,
                needs_review=True,
                reason=f"extraction failed: {error}",
            )

        ai_log_repository.record(to_log_row(result, grant_id=None, status="success"))
        log.info("{url} · {usage}", url=url, usage=describe_usage(result))

        return self._decide(_with_source(result.value, url), prompt.version)

    def _decide(self, grant: ExtractedGrant, prompt_version: str) -> ExtractionOutcome:
        """Publish, hold for review, or discard.

        Three independent reasons to withhold, checked in order of severity.
        """
        if grant.confidence == 0:
            return ExtractionOutcome(
                grant=None,
                prompt_version=prompt_version,
                auto_publish=False,
                needs_review=False,
                reason="model reported this is not a grant page",
            )

        # The database refuses to publish without an official source. After
        # `_with_source` this can only fail on a missing title.
        if not grant.is_publishable:
            return ExtractionOutcome(
                grant=grant,
                prompt_version=prompt_version,
                auto_publish=False,
                needs_review=True,
                reason="no title or official source could be established",
            )

        if grant.confidence < self._threshold:
            return ExtractionOutcome(
                grant=grant,
                prompt_version=prompt_version,
                auto_publish=False,
                needs_review=True,
                reason=f"confidence {grant.confidence} below threshold {self._threshold}",
            )

        return ExtractionOutcome(
            grant=grant,
            prompt_version=prompt_version,
            auto_publish=True,
            needs_review=False,
            reason=f"confidence {grant.confidence} at or above threshold {self._threshold}",
        )


def _with_source(grant: ExtractedGrant, url: str) -> ExtractedGrant:
    """Falls back to the crawled page as the grant's official source.

    Content cleaning strips URLs before the prompt — they cost tokens and the
    model has no use for them — so the model usually cannot report one even
    when the page is itself the official notice. Withholding a grant for
    lacking a URL we already know would hold back every correctly extracted
    grant on the site.

    The page we fetched is a government notice for this grant, so naming it as
    the source states a fact rather than filling a gap with a guess. Anything
    the model *did* find wins, because that is the more specific answer.
    """
    if grant.official_url is not None:
        return grant

    return grant.model_copy(update={"official_url": url})
