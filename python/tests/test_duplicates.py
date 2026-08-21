"""The duplicate ladder and slug generation.

Getting duplicates wrong is expensive in both directions: a false merge hides a
real opportunity from applicants, a false split fills the directory with the
same grant three times. These tests pin the ladder's ordering and its
thresholds without touching the network.
"""

from __future__ import annotations

from decimal import Decimal

import pytest

from models.grant import ExtractedGrant
from processors.duplicates import (
    CERTAIN_MATCH,
    POSSIBLE_MATCH,
    DuplicateAction,
    DuplicateDetector,
    _best_title_match,
    _conflicting_discriminators,
)
from processors.normalizer import slugify


class _StubRepository:
    """Stands in for the database so the ladder can be tested in isolation."""

    def __init__(
        self,
        *,
        by_hash: dict | None = None,
        by_url: dict | None = None,
        titles: list[dict] | None = None,
    ) -> None:
        self._by_hash = by_hash
        self._by_url = by_url
        self._titles = titles or []

    def find_by_content_hash(self, _hash: str) -> dict | None:
        return self._by_hash

    def find_by_source_url(self, _url: str) -> dict | None:
        return self._by_url

    def list_titles_for_matching(self, _org: str, _country: str) -> list[dict]:
        return self._titles


def _detector(**stub_kwargs) -> DuplicateDetector:
    detector = DuplicateDetector(client=None)
    detector._repository = _StubRepository(**stub_kwargs)  # noqa: SLF001

    return detector


def _grant(title: str = "Small Business Innovation Research Phase I") -> ExtractedGrant:
    return ExtractedGrant(
        title=title,
        official_url="https://seedfund.nsf.gov/",
        confidence=90,
        maximum_amount=Decimal("305000"),
    )


def _check(detector: DuplicateDetector, grant: ExtractedGrant):
    return detector.check(
        grant,
        content_hash="hash-1",
        source_url="https://example.gov/notice",
        organization_id="org-1",
        country_id="country-1",
    )


class TestLadderOrdering:
    def test_hash_match_short_circuits_before_anything_else(self) -> None:
        """The cheapest test runs first and stops the rest."""
        detector = _detector(
            by_hash={"id": "grant-1"},
            by_url={"id": "other"},
            titles=[{"id": "another", "title": "Small Business Innovation Research Phase I"}],
        )

        result = _check(detector, _grant())

        assert result.action is DuplicateAction.UNCHANGED
        assert result.method == "hash"
        assert result.existing_id == "grant-1"

    def test_same_source_url_is_an_update_not_a_new_grant(self) -> None:
        """A URL is where a grant lives, not a guess about what it is."""
        detector = _detector(by_url={"id": "grant-2"})

        result = _check(detector, _grant())

        assert result.action is DuplicateAction.UPDATE
        assert result.method == "source_url"

    def test_no_similar_title_creates_a_new_grant(self) -> None:
        detector = _detector(titles=[{"id": "x", "title": "Coastal Wetlands Restoration Fund"}])

        result = _check(detector, _grant())

        assert result.action is DuplicateAction.NEW
        assert result.existing_id is None

    def test_identical_title_updates_without_an_ai_call(self) -> None:
        """Above the certainty threshold, paying for Gemini would be waste."""
        detector = _detector(
            titles=[{"id": "grant-3", "title": "Small Business Innovation Research Phase I"}]
        )

        result = _check(detector, _grant())

        assert result.action is DuplicateAction.UPDATE
        assert result.method == "rapidfuzz"
        assert result.confidence >= CERTAIN_MATCH

    def test_empty_candidate_list_is_new(self) -> None:
        assert _check(_detector(titles=[]), _grant()).action is DuplicateAction.NEW


class TestDiscriminators:
    """The rule that stops similarity alone from merging different grants."""

    def test_phase_i_never_merges_into_phase_ii(self) -> None:
        """Measured at 98.8 similarity — one roman numeral, two grants."""
        detector = _detector(
            titles=[{"id": "grant-9", "title": "Small Business Innovation Research Phase II"}]
        )

        result = _check(detector, _grant("Small Business Innovation Research Phase I"))

        assert result.action is DuplicateAction.NEW
        assert result.method == "discriminator"

    def test_different_fiscal_years_are_different_opportunities(self) -> None:
        detector = _detector(titles=[{"id": "g", "title": "Clean Energy Fund 2026"}])

        result = _check(detector, _grant("Clean Energy Fund 2025"))

        assert result.action is DuplicateAction.NEW

    def test_different_tracks_are_different_opportunities(self) -> None:
        detector = _detector(titles=[{"id": "g", "title": "Innovation Programme Track B"}])

        result = _check(detector, _grant("Innovation Programme Track A"))

        assert result.action is DuplicateAction.NEW

    def test_matching_discriminators_do_not_block_a_merge(self) -> None:
        """Two records of the *same* phase must still be recognised as one."""
        detector = _detector(
            titles=[{"id": "g", "title": "Small Business Innovation Research Phase I"}]
        )

        result = _check(detector, _grant("Small Business Innovation Research Phase I"))

        assert result.action is DuplicateAction.UPDATE

    def test_untagged_titles_are_unaffected(self) -> None:
        assert _conflicting_discriminators("Clean Energy Fund", "Clean Energy Fund") is None


class TestThresholds:
    def test_thresholds_leave_a_band_for_ai(self) -> None:
        """If these ever crossed, the AI stage would be unreachable."""
        assert POSSIBLE_MATCH < CERTAIN_MATCH

    def test_reordered_words_land_in_the_ai_band(self) -> None:
        """Measured at 92.8: similar enough to check, not to merge blindly."""
        _, _, score = _best_title_match(
            "Clean Energy Manufacturing Grant",
            [{"id": "b", "title": "Grant for Manufacturing, Clean Energy"}],
        )

        assert POSSIBLE_MATCH <= score < CERTAIN_MATCH

    def test_unrelated_titles_score_far_below_the_ai_band(self) -> None:
        _, _, score = _best_title_match(
            "Small Business Innovation Research Phase I",
            [{"id": "b", "title": "Coastal Wetlands Restoration Fund"}],
        )

        assert score < POSSIBLE_MATCH


class TestSlugify:
    @pytest.mark.parametrize(
        ("raw", "expected"),
        [
            ("Small Business Innovation Research", "small-business-innovation-research"),
            ("R&D Tax Credit — Phase II", "r-d-tax-credit-phase-ii"),
            ("  Leading and trailing  ", "leading-and-trailing"),
            ("Café Résearch Fund", "cafe-research-fund"),
            ("Multiple***Separators", "multiple-separators"),
        ],
    )
    def test_produces_database_valid_slugs(self, raw: str, expected: str) -> None:
        assert slugify(raw) == expected

    def test_never_ends_with_a_separator(self) -> None:
        """The database CHECK rejects a trailing hyphen."""
        assert not slugify("A" * 200 + " — ").endswith("-")

    def test_stays_within_the_length_budget(self) -> None:
        assert len(slugify("word " * 100)) <= 80
