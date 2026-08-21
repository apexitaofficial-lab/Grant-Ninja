"""The catch-all category.

A grant cannot be published without a category, so an unmatched grant used to
sit in the review queue however confident and complete the extraction was. The
fallback releases those, and these tests pin the two properties that keep it
from doing damage: it applies only when nothing else matched, and it is
configuration rather than a constant.
"""

from __future__ import annotations

from decimal import Decimal

from models.grant import ExtractedGrant, GrantStatus
from processors.normalizer import GrantNormalizer

FALLBACK = {"id": "cat-others", "name": "Others", "slug": "others"}
HEALTHCARE = {"id": "cat-health", "name": "Healthcare", "slug": "healthcare"}
RESEARCH = {"id": "cat-research", "name": "Research and Development", "slug": "research"}

COUNTRY = {"id": "country-us", "slug": "united-states", "name": "United States", "currency": "USD"}
ORGANIZATION = {"id": "org-nih", "name": "National Institutes of Health", "slug": "nih"}


class _StubReference:
    def __init__(self, matched: list[dict[str, str]], fallback: dict[str, str] | None) -> None:
        self._matched = matched
        self._fallback = fallback

    def find_country(self, _slug: str) -> dict[str, str]:
        return COUNTRY

    def match_organization(self, _name: str, _country_id: str) -> dict[str, str]:
        return ORGANIZATION

    def match_categories(self, _names: list[str]) -> list[dict[str, str]]:
        return self._matched

    def get_fallback_category(self) -> dict[str, str] | None:
        return self._fallback


class _StubGrants:
    def slug_exists(self, _slug: str) -> bool:
        return False


def _normalizer(matched: list[dict[str, str]], fallback: dict[str, str] | None) -> GrantNormalizer:
    normalizer = GrantNormalizer()
    normalizer._reference = _StubReference(matched, fallback)  # noqa: SLF001
    normalizer._grants = _StubGrants()  # noqa: SLF001

    return normalizer


def _normalize(matched: list[dict[str, str]], fallback: dict[str, str] | None = FALLBACK):
    grant = ExtractedGrant(
        title="Housing Assistance for Victims of Human Trafficking",
        official_url="https://www.grants.gov/search-results-detail/363654",
        organization="National Institutes of Health",
        confidence=95,
        maximum_amount=Decimal("1200000"),
        keywords=["human trafficking", "victim services"],
    )

    return _normalizer(matched, fallback).normalize(
        grant,
        source_url="https://www.grants.gov/search-results-detail/363654",
        content_hash="hash-1",
        default_country_slug="united-states",
        status=GrantStatus.PUBLISHED,
    )


class TestFallbackApplies:
    def test_an_unmatched_grant_is_published_under_the_fallback(self) -> None:
        result = _normalize(matched=[])

        assert result.grant is not None
        assert result.grant.category_ids == ["cat-others"]
        assert result.grant.primary_category_id == "cat-others"
        assert result.grant.status is GrantStatus.PUBLISHED

    def test_using_the_fallback_is_recorded_not_silent(self) -> None:
        """The run log should say why a grant landed in the catch-all."""
        result = _normalize(matched=[])

        assert any("fallback" in problem for problem in result.problems)


class TestFallbackDoesNotInterfere:
    def test_a_matched_category_is_used_instead(self) -> None:
        result = _normalize(matched=[HEALTHCARE])

        assert result.grant is not None
        assert result.grant.category_ids == ["cat-health"]

    def test_the_fallback_is_never_added_alongside_real_categories(self) -> None:
        """A catch-all mixed into real categories would dilute every one."""
        result = _normalize(matched=[HEALTHCARE, RESEARCH])

        assert result.grant is not None
        assert "cat-others" not in result.grant.category_ids
        assert result.grant.primary_category_id == "cat-health"

    def test_matching_a_category_is_not_reported_as_a_problem(self) -> None:
        assert _normalize(matched=[HEALTHCARE]).problems == []


class TestAmounts:
    def test_a_zero_minimum_is_stored_as_unstated(self) -> None:
        """A notice with a ceiling and no floor makes the model report 0.

        Stored, that renders as "$0.0 – $1.2M" on the card and publishes
        `minValue: 0` in the MonetaryGrant JSON-LD — a false claim about the
        grant, served to Google and to any assistant reading the page.
        """
        grant = ExtractedGrant(
            title="Housing Assistance for Victims",
            official_url="https://www.grants.gov/x",
            organization="National Institutes of Health",
            confidence=95,
            minimum_amount=Decimal("0"),
            maximum_amount=Decimal("1200000"),
        )

        result = _normalizer([HEALTHCARE], FALLBACK).normalize(
            grant,
            source_url="https://www.grants.gov/x",
            content_hash="hash-1",
            default_country_slug="united-states",
            status=GrantStatus.PUBLISHED,
        )

        assert result.grant is not None
        assert result.grant.minimum_amount is None
        assert result.grant.maximum_amount == Decimal("1200000")

    def test_a_real_minimum_is_kept(self) -> None:
        grant = ExtractedGrant(
            title="Strategic Investment Program",
            official_url="https://www.grants.gov/y",
            organization="National Institutes of Health",
            confidence=95,
            minimum_amount=Decimal("5000000"),
            maximum_amount=Decimal("50000000"),
        )

        result = _normalizer([HEALTHCARE], FALLBACK).normalize(
            grant,
            source_url="https://www.grants.gov/y",
            content_hash="hash-2",
            default_country_slug="united-states",
            status=GrantStatus.PUBLISHED,
        )

        assert result.grant is not None
        assert result.grant.minimum_amount == Decimal("5000000")


class TestFallbackDisabled:
    def test_no_fallback_configured_still_holds_the_grant_for_review(self) -> None:
        """Clearing the setting restores the old behaviour without a deploy."""
        result = _normalize(matched=[], fallback=None)

        assert result.grant is not None
        assert result.grant.status is GrantStatus.PENDING_REVIEW
        assert result.grant.primary_category_id is None
