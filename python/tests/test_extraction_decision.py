"""The publish-or-review decision.

This is the most consequential branch in the pipeline: it decides whether an
AI extraction reaches the public site unattended. The rules are tested without
calling Gemini, so they can be reasoned about independently of the model.
"""

from __future__ import annotations

from decimal import Decimal

import pytest

from ai.extraction import ExtractionOutcome, GrantExtractor
from ai.prompt_loader import Prompt, PromptNotFoundError, load_prompt
from models.grant import ExtractedGrant


class _StubClient:
    """Stands in for Gemini. `model` is read when logging a failure."""

    model = "stub-model"

    def __init__(self, grant: ExtractedGrant) -> None:
        self._grant = grant

    def generate_structured(self, prompt, schema, **values):  # noqa: ANN001, ARG002
        from ai.gemini import AIResult

        return AIResult(
            value=self._grant,
            prompt_name=prompt.name,
            prompt_version=prompt.version,
            model=self.model,
            tokens_input=100,
            tokens_output=50,
            execution_ms=10,
        )


def _grant(**overrides) -> ExtractedGrant:
    values = {
        "title": "Small Business Innovation Research",
        "official_url": "https://seedfund.nsf.gov/",
        "confidence": 95,
        "maximum_amount": Decimal("305000"),
    }
    values.update(overrides)

    return ExtractedGrant(**values)


def _decide(grant: ExtractedGrant, threshold: int = 85) -> ExtractionOutcome:
    extractor = GrantExtractor(threshold=threshold, client=_StubClient(grant))

    # Long enough to clear the "too little content" guard.
    return extractor.extract("https://example.gov/notice", "x" * 500)


class TestPublishDecision:
    def test_high_confidence_with_a_source_publishes(self) -> None:
        outcome = _decide(_grant(confidence=95))

        assert outcome.auto_publish
        assert not outcome.needs_review

    def test_confidence_below_threshold_goes_to_review(self) -> None:
        outcome = _decide(_grant(confidence=84))

        assert not outcome.auto_publish
        assert outcome.needs_review
        assert "below threshold" in outcome.reason

    def test_exactly_at_the_threshold_publishes(self) -> None:
        """`>=`, not `>` — 85 must mean 85."""
        assert _decide(_grant(confidence=85)).auto_publish

    def test_missing_official_url_falls_back_to_the_crawled_page(self) -> None:
        """Content cleaning strips URLs, so the model rarely reports one.

        The page we fetched is itself a government notice for this grant, so
        naming it as the source is a fact rather than a guess. Without this
        every correctly extracted grant on the site would be held for lacking
        a URL we already knew.
        """
        outcome = _decide(_grant(confidence=100, official_url=None))

        assert outcome.grant is not None
        assert str(outcome.grant.official_url) == "https://example.gov/notice"
        assert outcome.auto_publish

    def test_a_url_the_model_did_find_is_not_overwritten(self) -> None:
        """A URL read off the page is more specific than the page itself."""
        outcome = _decide(_grant(official_url="https://seedfund.nsf.gov/"))

        assert outcome.grant is not None
        assert "seedfund" in str(outcome.grant.official_url)

    def test_zero_confidence_is_discarded_not_queued(self) -> None:
        """A search page is not a grant; queueing it would waste a human's time."""
        outcome = _decide(_grant(confidence=0))

        assert outcome.grant is None
        assert not outcome.auto_publish
        assert not outcome.needs_review

    def test_threshold_is_injected_not_hardcoded(self) -> None:
        """Decision D3 — the threshold lives in system_settings."""
        assert _decide(_grant(confidence=70), threshold=60).auto_publish
        assert not _decide(_grant(confidence=70), threshold=90).auto_publish

    def test_empty_page_costs_no_ai_call(self) -> None:
        extractor = GrantExtractor(threshold=85, client=_StubClient(_grant()))

        outcome = extractor.extract("https://example.gov/empty", "too short")

        assert outcome.grant is None
        assert not outcome.needs_review
        assert "too little content" in outcome.reason


class TestPromptLoader:
    def test_loads_the_extraction_prompt_and_its_version(self) -> None:
        prompt = load_prompt("grant_extraction")

        assert prompt.name == "grant_extraction"
        assert prompt.version.startswith("v")
        assert prompt.purpose != ""

    def test_render_replaces_the_content_placeholder(self) -> None:
        prompt = Prompt(name="t", version="v1", purpose="", template="Read this: {content}")

        assert prompt.render(content="a notice") == "Read this: a notice"

    def test_render_leaves_json_braces_alone(self) -> None:
        """`str.format` would raise here; prompts contain JSON examples."""
        prompt = Prompt(name="t", version="v1", purpose="", template='{"a": 1} {content}')

        assert prompt.render(content="x") == '{"a": 1} x'

    def test_unknown_prompt_raises(self) -> None:
        with pytest.raises(PromptNotFoundError):
            load_prompt("no_such_prompt")

    def test_unknown_version_raises(self) -> None:
        with pytest.raises(PromptNotFoundError):
            load_prompt("grant_extraction", "v99")
