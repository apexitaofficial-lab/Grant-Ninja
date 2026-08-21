"""The validation gate.

These are the rules that stop a hallucinated or malformed extraction becoming
a published grant. They mirror the database check constraints, so anything
that passes here will be accepted by Postgres.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal

import pytest
from pydantic import ValidationError

from models.grant import ExtractedGrant, GrantFundingType, GrantStatus, NormalizedGrant


def _extracted(**overrides) -> dict:
    base = {
        "title": "Small Business Innovation Research",
        "official_url": "https://seedfund.nsf.gov/",
        "confidence": 90,
    }
    base.update(overrides)

    return base


class TestExtractedGrant:
    def test_accepts_a_notice_with_missing_amounts(self) -> None:
        """Most government notices omit the award ceiling. Absence is normal."""
        grant = ExtractedGrant(**_extracted())

        assert grant.maximum_amount is None
        assert grant.is_publishable

    def test_rejects_inverted_amount_range(self) -> None:
        with pytest.raises(ValidationError, match="minimum_amount cannot exceed maximum_amount"):
            ExtractedGrant(
                **_extracted(minimum_amount=Decimal("500000"), maximum_amount=Decimal("1000"))
            )

    def test_rejects_close_before_open(self) -> None:
        with pytest.raises(ValidationError, match="opens_at cannot be after closes_at"):
            ExtractedGrant(
                **_extracted(opens_at=date(2026, 6, 1), closes_at=date(2026, 1, 1))
            )

    def test_rejects_negative_funding(self) -> None:
        with pytest.raises(ValidationError):
            ExtractedGrant(**_extracted(funding_amount=Decimal("-1")))

    def test_rejects_confidence_out_of_range(self) -> None:
        with pytest.raises(ValidationError):
            ExtractedGrant(**_extracted(confidence=140))

    def test_rejects_a_non_url_official_link(self) -> None:
        with pytest.raises(ValidationError):
            ExtractedGrant(**_extracted(official_url="not a url"))

    def test_not_publishable_without_an_official_source(self) -> None:
        """The database refuses to publish without one; catch it earlier."""
        grant = ExtractedGrant(title="An orphan grant", confidence=95)

        assert not grant.is_publishable

    def test_cleans_padded_and_duplicated_keywords(self) -> None:
        grant = ExtractedGrant(**_extracted(keywords=["SBIR", " sbir ", "", "  ", "deep tech"]))

        assert grant.keywords == ["SBIR", "deep tech"]

    def test_normalises_currency_case(self) -> None:
        assert ExtractedGrant(**_extracted(currency="usd")).currency == "USD"

    def test_ignores_unexpected_fields_from_the_model(self) -> None:
        """Gemini sometimes invents extra keys; they must not break parsing."""
        grant = ExtractedGrant(**_extracted(hallucinated_field="ignore me"))

        assert grant.title.startswith("Small Business")


def _normalized(**overrides) -> dict:
    base = {
        "title": "Small Business Innovation Research",
        "slug": "nsf-sbir-phase-i",
        "organization_id": "11111111-1111-1111-1111-111111111111",
        "country_id": "22222222-2222-2222-2222-222222222222",
        "currency": "USD",
        "grant_type": GrantFundingType.COMPETITIVE,
        "status": GrantStatus.DRAFT,
        "content_hash": "abc123",
        "ai_confidence": 90,
    }
    base.update(overrides)

    return base


class TestNormalizedGrant:
    def test_rejects_a_non_kebab_slug(self) -> None:
        with pytest.raises(ValidationError, match="kebab-case"):
            NormalizedGrant(**_normalized(slug="NSF SBIR Phase I"))

    def test_rejects_a_primary_category_not_in_the_list(self) -> None:
        with pytest.raises(ValidationError, match="must appear in category_ids"):
            NormalizedGrant(
                **_normalized(category_ids=["cat-a"], primary_category_id="cat-b")
            )

    def test_published_requires_a_primary_category(self) -> None:
        """Decision D1 — enforced before the partial unique index has to."""
        with pytest.raises(ValidationError, match="requires a primary category"):
            NormalizedGrant(**_normalized(status=GrantStatus.PUBLISHED))

    def test_draft_may_have_no_category_yet(self) -> None:
        grant = NormalizedGrant(**_normalized(status=GrantStatus.DRAFT))

        assert grant.primary_category_id is None

    def test_to_row_serialises_decimals_and_dates_for_postgrest(self) -> None:
        grant = NormalizedGrant(
            **_normalized(
                category_ids=["cat-a"],
                primary_category_id="cat-a",
                status=GrantStatus.PUBLISHED,
                maximum_amount=Decimal("305000.00"),
            )
        )

        row = grant.to_row()

        assert isinstance(row["maximum_amount"], float)
        assert row["status"] == "published"
        assert row["grant_type"] == "competitive"

    def test_rejects_unknown_fields(self) -> None:
        """`extra="forbid"`: a typo must not silently vanish on the way to the row."""
        with pytest.raises(ValidationError):
            NormalizedGrant(**_normalized(nonexistent_column="oops"))
