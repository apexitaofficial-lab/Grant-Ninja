"""Validated shapes for extracted grant data.

Part 4B §15: every Gemini response is validated here before anything touches
the database. The rules mirror the check constraints in the schema, so a value
that passes validation cannot be rejected by Postgres — and a value Gemini
invented cannot quietly become a published grant.
"""

from __future__ import annotations

import re
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Annotated, Any

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

SLUG_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")

# Mirrors public.grant_funding_type.
class GrantFundingType(StrEnum):
    COMPETITIVE = "competitive"
    FORMULA = "formula"
    CONTINUATION = "continuation"
    COOPERATIVE_AGREEMENT = "cooperative_agreement"
    TAX_CREDIT = "tax_credit"
    LOAN = "loan"
    VOUCHER = "voucher"
    PRIZE = "prize"
    FELLOWSHIP = "fellowship"
    OTHER = "other"


class GrantStatus(StrEnum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    EXPIRED = "expired"


Confidence = Annotated[int, Field(ge=0, le=100)]


class ExtractedGrant(BaseModel):
    """What Gemini returns for one grant page, before normalisation.

    Deliberately permissive about *absence* and strict about *content*: a
    government notice often omits the award ceiling, and inventing one would
    be worse than leaving it null. Anything present, though, must be coherent.
    """

    model_config = ConfigDict(str_strip_whitespace=True, extra="ignore")

    title: str = Field(min_length=3, max_length=500)
    description: str | None = None
    eligibility: str | None = None

    funding_amount: Decimal | None = Field(default=None, ge=0)
    minimum_amount: Decimal | None = Field(default=None, ge=0)
    maximum_amount: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)

    grant_type: GrantFundingType = GrantFundingType.OTHER
    organization: str | None = None
    country: str | None = None
    state: str | None = None

    opens_at: date | None = None
    closes_at: date | None = None

    official_url: HttpUrl | None = None
    application_url: HttpUrl | None = None

    keywords: list[str] = Field(default_factory=list, max_length=25)
    required_documents: list[str] = Field(default_factory=list, max_length=25)

    confidence: Confidence = 0
    reasoning: str | None = None

    @field_validator("currency")
    @classmethod
    def _upper_currency(cls, value: str) -> str:
        return value.upper()

    @field_validator("keywords", "required_documents")
    @classmethod
    def _clean_list(cls, values: list[str]) -> list[str]:
        # Models like to pad lists with empty strings and duplicates.
        seen: list[str] = []

        for value in values:
            cleaned = value.strip()

            if cleaned and cleaned.lower() not in {item.lower() for item in seen}:
                seen.append(cleaned)

        return seen

    @model_validator(mode="after")
    def _coherent_amounts_and_dates(self) -> ExtractedGrant:
        if (
            self.minimum_amount is not None
            and self.maximum_amount is not None
            and self.minimum_amount > self.maximum_amount
        ):
            raise ValueError("minimum_amount cannot exceed maximum_amount")

        if self.opens_at is not None and self.closes_at is not None and self.opens_at > self.closes_at:
            raise ValueError("opens_at cannot be after closes_at")

        return self

    @property
    def is_publishable(self) -> bool:
        """The database refuses to publish without these (constraint `ck_grants_published_*`)."""
        return self.official_url is not None and self.title.strip() != ""


class NormalizedGrant(BaseModel):
    """An extracted grant resolved against the database.

    Free-text names have become real foreign keys, and a slug has been
    assigned. This is the only shape the publisher accepts.
    """

    model_config = ConfigDict(extra="forbid")

    title: str
    slug: str
    short_description: str | None = None
    full_description: str | None = None
    eligibility: str | None = None

    organization_id: str
    country_id: str
    state_id: str | None = None
    category_ids: list[str] = Field(default_factory=list)
    primary_category_id: str | None = None

    funding_amount: Decimal | None = None
    minimum_amount: Decimal | None = None
    maximum_amount: Decimal | None = None
    currency: str

    grant_type: GrantFundingType
    status: GrantStatus

    official_url: str | None = None
    application_url: str | None = None
    source_url: str | None = None

    opens_at: datetime | None = None
    closes_at: datetime | None = None

    is_federal: bool = False
    is_private: bool = False

    content_hash: str
    ai_confidence: Confidence

    @field_validator("slug")
    @classmethod
    def _valid_slug(cls, value: str) -> str:
        if not SLUG_PATTERN.match(value):
            raise ValueError(f"slug {value!r} must be lowercase kebab-case")

        return value

    @model_validator(mode="after")
    def _primary_category_is_one_of_the_categories(self) -> NormalizedGrant:
        if self.primary_category_id is not None and self.primary_category_id not in self.category_ids:
            raise ValueError("primary_category_id must appear in category_ids")

        # Decision D1: a published grant needs exactly one primary category.
        if self.status == GrantStatus.PUBLISHED and self.primary_category_id is None:
            raise ValueError("a published grant requires a primary category")

        return self

    def to_row(self) -> dict[str, Any]:
        """The `grants` row. Relations are written separately by the publisher."""
        return {
            "title": self.title,
            "slug": self.slug,
            "short_description": self.short_description,
            "full_description": self.full_description,
            "eligibility": self.eligibility,
            "organization_id": self.organization_id,
            "country_id": self.country_id,
            "state_id": self.state_id,
            "funding_amount": _decimal_to_float(self.funding_amount),
            "minimum_amount": _decimal_to_float(self.minimum_amount),
            "maximum_amount": _decimal_to_float(self.maximum_amount),
            "currency": self.currency,
            "grant_type": self.grant_type.value,
            "status": self.status.value,
            "official_url": self.official_url,
            "application_url": self.application_url,
            "source_url": self.source_url,
            "opens_at": _iso(self.opens_at),
            "closes_at": _iso(self.closes_at),
            "is_federal": self.is_federal,
            "is_private": self.is_private,
            "content_hash": self.content_hash,
            "ai_confidence": self.ai_confidence,
        }


def _decimal_to_float(value: Decimal | None) -> float | None:
    # PostgREST speaks JSON; Decimal is not serialisable. Precision is not at
    # risk here — these are award figures, not ledger balances.
    return None if value is None else float(value)


def _iso(value: datetime | None) -> str | None:
    return None if value is None else value.isoformat()
