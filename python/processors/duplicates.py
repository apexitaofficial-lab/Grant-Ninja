"""Duplicate detection.

Part 4B §9: hash, then fuzzy title, then Gemini — cheapest test first, and the
expensive one only for the narrow band where cheap tests cannot decide.

The ordering matters economically. An exact hash match costs one indexed
lookup. A fuzzy comparison costs a few hundred string comparisons in C. Only a
pair that is *similar but not obviously identical* is worth an AI call, and in
practice that is a small fraction of what a crawl sees.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import StrEnum

from pydantic import BaseModel, Field
from rapidfuzz import fuzz

from ai.gemini import AIExtractionError, GeminiClient
from ai.prompt_loader import load_prompt
from core.logging import get_logger
from models.grant import ExtractedGrant
from repositories.grants import grant_repository

log = get_logger("dedup")

# Above this, two titles from the same agency are the same opportunity.
#
# Set high deliberately. Measured against real titles, "Phase I" and
# "Phase II" score 98.8 on token_sort_ratio — one roman numeral apart, and two
# completely different opportunities with different deadlines and budgets.
# Title similarity alone cannot be trusted to merge; it can only be trusted to
# rule out.
CERTAIN_MATCH = 99
# Below this, they are unrelated and not worth an AI call.
POSSIBLE_MATCH = 78

# Tokens that make two otherwise-identical titles different opportunities.
#
# This is the domain's whole vocabulary of near-duplicates: agencies re-run a
# programme every year and split it into phases and tracks, changing one token
# and nothing else. Any disagreement here overrides the similarity score.
_DISCRIMINATORS = re.compile(
    r"\b(?:phase\s+(?:[ivx]+|\d+)"
    r"|track\s+(?:[a-z]|\d+)"
    r"|(?:fy|fiscal\s+year)\s?\d{2,4}"
    r"|20\d{2}"
    r"|round\s+\d+"
    r"|cohort\s+\d+)\b",
    re.IGNORECASE,
)


class DuplicateAction(StrEnum):
    NEW = "new"
    """No match. Create a new grant."""

    UPDATE = "update"
    """Same opportunity, changed content. Update in place."""

    UNCHANGED = "unchanged"
    """Byte-identical to something already stored. Do nothing."""

    REVIEW = "review"
    """Might be the same. A human decides before anything is merged."""


class DuplicateVerdict(BaseModel):
    """Gemini's answer for one ambiguous pair."""

    is_same: bool
    confidence: int = Field(ge=0, le=100)
    reason: str


@dataclass(frozen=True, slots=True)
class DuplicateResult:
    action: DuplicateAction
    existing_id: str | None
    confidence: int
    method: str
    reason: str


class DuplicateDetector:
    def __init__(self, client: GeminiClient | None = None) -> None:
        # Constructed lazily: most crawls never reach the AI stage, and
        # building a client we never use would cost startup time on every run.
        self._client = client
        self._repository = grant_repository

    def _gemini(self) -> GeminiClient:
        if self._client is None:
            self._client = GeminiClient()

        return self._client

    def check(
        self,
        grant: ExtractedGrant,
        content_hash: str,
        source_url: str,
        organization_id: str,
        country_id: str,
    ) -> DuplicateResult:
        # 1. Same content, byte for byte. Nothing to do.
        by_hash = self._repository.find_by_content_hash(content_hash)

        if by_hash is not None:
            return DuplicateResult(
                action=DuplicateAction.UNCHANGED,
                existing_id=by_hash["id"],
                confidence=100,
                method="hash",
                reason="content hash already stored",
            )

        # 2. Same page. The strongest identity signal there is — a URL is not
        # a guess about what a grant is, it is where the grant lives.
        by_url = self._repository.find_by_source_url(source_url)

        if by_url is not None:
            return DuplicateResult(
                action=DuplicateAction.UPDATE,
                existing_id=by_url["id"],
                confidence=100,
                method="source_url",
                reason="same source URL, content changed",
            )

        # 3. Fuzzy title, scoped to this agency and country.
        candidates = self._repository.list_titles_for_matching(organization_id, country_id)
        best_id, best_title, best_score = _best_title_match(grant.title, candidates)

        if best_id is None or best_score < POSSIBLE_MATCH:
            return DuplicateResult(
                action=DuplicateAction.NEW,
                existing_id=None,
                confidence=int(best_score),
                method="rapidfuzz",
                reason="no similar title from this agency",
            )

        # A phase, year or track that disagrees means these are different
        # opportunities however similar the strings are. Checked before the
        # certainty shortcut so a 99-scoring "Phase I" / "Phase II" pair can
        # never merge on similarity alone.
        conflict = _conflicting_discriminators(grant.title, best_title)

        if conflict is not None:
            return DuplicateResult(
                action=DuplicateAction.NEW,
                existing_id=None,
                confidence=int(best_score),
                method="discriminator",
                reason=f"titles differ by {conflict}",
            )

        if best_score >= CERTAIN_MATCH:
            return DuplicateResult(
                action=DuplicateAction.UPDATE,
                existing_id=best_id,
                confidence=int(best_score),
                method="rapidfuzz",
                reason=f"title matches {best_title!r} at {int(best_score)}",
            )

        # 4. Similar but not certain. This narrow band is the only place an AI
        # call earns its cost.
        return self._ask_gemini(grant, best_id, best_title, int(best_score))

    def _ask_gemini(
        self, grant: ExtractedGrant, candidate_id: str, candidate_title: str, score: int
    ) -> DuplicateResult:
        prompt = load_prompt("duplicate_check")

        try:
            result = self._gemini().generate_structured(
                prompt,
                DuplicateVerdict,
                title_a=grant.title,
                agency_a=grant.organization or "unknown",
                amount_a=_describe_amount(grant),
                window_a=f"{grant.opens_at or '?'} to {grant.closes_at or '?'}",
                summary_a=(grant.description or "")[:800],
                title_b=candidate_title,
                agency_b=grant.organization or "unknown",
                amount_b="unknown",
                window_b="unknown",
                summary_b="stored record",
            )
        except AIExtractionError as error:
            # Cannot decide, so do not decide. A human is cheaper than a bad
            # merge that hides a real opportunity.
            log.warning("Duplicate check failed, deferring to review: {error}", error=error)

            return DuplicateResult(
                action=DuplicateAction.REVIEW,
                existing_id=candidate_id,
                confidence=score,
                method="rapidfuzz+gemini",
                reason=f"AI comparison unavailable: {error}",
            )

        verdict = result.value

        if verdict.is_same and verdict.confidence >= 90:
            return DuplicateResult(
                action=DuplicateAction.UPDATE,
                existing_id=candidate_id,
                confidence=verdict.confidence,
                method="gemini",
                reason=verdict.reason,
            )

        if not verdict.is_same and verdict.confidence >= 90:
            return DuplicateResult(
                action=DuplicateAction.NEW,
                existing_id=None,
                confidence=verdict.confidence,
                method="gemini",
                reason=verdict.reason,
            )

        return DuplicateResult(
            action=DuplicateAction.REVIEW,
            existing_id=candidate_id,
            confidence=verdict.confidence,
            method="gemini",
            reason=verdict.reason,
        )


def _discriminators_in(title: str) -> set[str]:
    return {match.group(0).lower().replace(" ", "") for match in _DISCRIMINATORS.finditer(title)}


def _conflicting_discriminators(title_a: str, title_b: str) -> str | None:
    """Reports a phase/year/track disagreement between two titles.

    Returns None when neither title carries a discriminator, or when both
    carry the same one — absence is not a conflict, so an untagged title still
    matches an untagged title.
    """
    found_a = _discriminators_in(title_a)
    found_b = _discriminators_in(title_b)

    if not found_a or not found_b or found_a == found_b:
        return None

    return f"{sorted(found_a)} vs {sorted(found_b)}"


def _best_title_match(
    title: str, candidates: list[dict[str, object]]
) -> tuple[str | None, str, float]:
    """token_sort_ratio: word order varies between notices, meaning does not."""
    best_id: str | None = None
    best_title = ""
    best_score = 0.0

    for candidate in candidates:
        candidate_title = str(candidate.get("title", ""))
        score = fuzz.token_sort_ratio(title, candidate_title)

        if score > best_score:
            best_id = str(candidate["id"])
            best_title = candidate_title
            best_score = score

    return best_id, best_title, best_score


def _describe_amount(grant: ExtractedGrant) -> str:
    if grant.minimum_amount is not None and grant.maximum_amount is not None:
        return f"{grant.minimum_amount}-{grant.maximum_amount} {grant.currency}"

    if grant.maximum_amount is not None:
        return f"up to {grant.maximum_amount} {grant.currency}"

    return "not published"
