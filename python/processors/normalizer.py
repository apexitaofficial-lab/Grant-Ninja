"""Turning an extraction into something the database will accept.

Part 4A stage 4: free-text names become foreign keys, a slug is assigned, and
dates become timestamps. Anything that cannot be resolved is reported rather
than guessed — a grant filed under the wrong agency is worse than one held for
review.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from core.logging import get_logger
from models.grant import ExtractedGrant, GrantStatus, NormalizedGrant
from repositories.grants import grant_repository
from repositories.reference import ReferenceRepository

log = get_logger("normalize")

_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_MAX_SLUG_LENGTH = 80


@dataclass(frozen=True, slots=True)
class NormalizationResult:
    grant: NormalizedGrant | None
    problems: list[str]

    @property
    def succeeded(self) -> bool:
        return self.grant is not None


def slugify(value: str) -> str:
    """Lowercase kebab-case, matching the database's slug constraint."""
    ascii_value = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower()
    )
    slug = _NON_ALNUM.sub("-", ascii_value).strip("-")

    return slug[:_MAX_SLUG_LENGTH].rstrip("-")


class GrantNormalizer:
    def __init__(self) -> None:
        self._reference = ReferenceRepository()
        self._grants = grant_repository

    def normalize(
        self,
        grant: ExtractedGrant,
        *,
        source_url: str,
        content_hash: str,
        default_country_slug: str,
        status: GrantStatus,
        category_names: list[str] | None = None,
    ) -> NormalizationResult:
        problems: list[str] = []

        country = self._reference.find_country(grant.country or default_country_slug)

        if country is None:
            country = self._reference.find_country(default_country_slug)
            problems.append(f"country {grant.country!r} not recognised, fell back to default")

        if country is None:
            return NormalizationResult(None, ["no country could be resolved"])

        organization = None

        if grant.organization:
            organization = self._reference.match_organization(grant.organization, country["id"])

        if organization is None:
            # Creating an agency from a hallucinated name would pollute the
            # directory permanently, so this stops here instead.
            problems.append(f"agency {grant.organization!r} not matched to a known organization")

            return NormalizationResult(None, problems)

        categories = self._reference.match_categories(category_names or grant.keywords)
        category_ids = [category["id"] for category in categories]

        if not category_ids:
            # Nothing matched. A catch-all keeps the grant reachable rather
            # than parking a correct, confident extraction in a queue because
            # the taxonomy has not caught up with the feed yet.
            #
            # Only ever used when nothing else matched — it never joins or
            # displaces a real category, so it cannot dilute one.
            fallback = self._reference.get_fallback_category()

            if fallback is not None:
                category_ids = [fallback["id"]]
                problems.append(
                    f"no category matched, assigned fallback {fallback['name']!r}"
                )

        primary_category_id = category_ids[0] if category_ids else None

        if status is GrantStatus.PUBLISHED and primary_category_id is None:
            # Only reachable with the fallback disabled or misconfigured.
            # Enforced by the database too; catching it here gives a readable
            # reason instead of a constraint violation.
            problems.append("no category matched, cannot publish without one")
            status = GrantStatus.PENDING_REVIEW

        normalized = NormalizedGrant(
            title=grant.title,
            slug=self._unique_slug(grant.title, country["slug"], organization["slug"]),
            short_description=_shorten(grant.description),
            full_description=grant.description,
            eligibility=grant.eligibility,
            organization_id=organization["id"],
            country_id=country["id"],
            state_id=None,
            category_ids=category_ids,
            primary_category_id=primary_category_id,
            funding_amount=_stated_amount(grant.funding_amount),
            minimum_amount=_stated_amount(grant.minimum_amount),
            maximum_amount=_stated_amount(grant.maximum_amount),
            currency=grant.currency or country.get("currency", "USD"),
            grant_type=grant.grant_type,
            status=status,
            official_url=str(grant.official_url) if grant.official_url else None,
            application_url=str(grant.application_url) if grant.application_url else None,
            source_url=source_url,
            opens_at=_to_datetime(grant.opens_at),
            closes_at=_to_datetime(grant.closes_at),
            is_federal=_looks_federal(organization["name"]),
            is_private=False,
            content_hash=content_hash,
            ai_confidence=grant.confidence,
        )

        return NormalizationResult(normalized, problems)

    def _unique_slug(self, title: str, country_slug: str, organization_slug: str) -> str:
        """Globally unique, per decision D5.

        Collisions are suffixed with the country, then the agency — a readable
        distinction rather than a number, so `/grants/innovation-fund-ireland`
        still tells you what it is.
        """
        base = slugify(title)

        if not self._grants.slug_exists(base):
            return base

        for suffix in (country_slug, organization_slug):
            candidate = slugify(f"{base}-{suffix}")

            if not self._grants.slug_exists(candidate):
                return candidate

        # Deterministic last resort so re-running produces the same slug.
        digest = content_suffix(base + country_slug + organization_slug)

        return slugify(f"{base}-{digest}")


def content_suffix(value: str) -> str:
    import hashlib

    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:6]


def _stated_amount(value: Decimal | None) -> Decimal | None:
    """Treats a zero award as unstated, because that is what it means.

    Notices that give a ceiling but no floor make the model report the floor as
    0, and a stored 0 is not harmless: the card renders "$0.0 – $1.2M", which
    reads as though an award could be nothing, and the MonetaryGrant JSON-LD
    publishes `minValue: 0` to Google and to any assistant reading the page.
    That is a claim about the grant, and it is false. No funder awards $0.
    """
    if value is None or value <= 0:
        return None

    return value


def _shorten(description: str | None, limit: int = 240) -> str | None:
    if description is None:
        return None

    text = description.strip()

    if len(text) <= limit:
        return text

    return text[:limit].rsplit(" ", 1)[0] + "…"


def _to_datetime(value: object) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value

    return datetime.combine(value, datetime.min.time(), tzinfo=UTC)  # type: ignore[arg-type]


def _looks_federal(organization_name: str) -> bool:
    lowered = organization_name.lower()

    return any(
        marker in lowered
        for marker in ("national", "federal", "department of", "u.s.", "united states", "nasa")
    )
