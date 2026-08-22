"""State portals: attribution, and the generic adapter's guardrails.

Fifty states means fifty configurations rather than fifty modules, so the two
things worth pinning are that a state's grants are attributed to that state,
and that a misconfigured source refuses to run rather than crawling an entire
website.
"""

from __future__ import annotations

import asyncio
from decimal import Decimal

import pytest

from adapters.base import get_adapter
from adapters.generic import GenericAdapter
from adapters.grants_gov import DiscoveryError
from models.grant import ExtractedGrant, GrantStatus
from processors.normalizer import GrantNormalizer

COUNTRY = {"id": "country-us", "slug": "united-states", "name": "United States", "currency": "USD"}
STATE_ID = "state-ca"
STATE_ORG = {"id": "org-ca", "name": "State of California", "slug": "state-of-california"}
CATEGORY = {"id": "cat-env", "name": "Environment", "slug": "environment"}


class _StubReference:
    """No agency matches — the situation every state portal starts in."""

    def find_country(self, _slug: str) -> dict[str, str]:
        return COUNTRY

    def match_organization(self, _name: str, _country_id: str) -> None:
        return None

    def find_organization_by_id(self, organization_id: str) -> dict[str, str] | None:
        return STATE_ORG if organization_id == STATE_ORG["id"] else None

    def match_categories(self, _names: list[str]) -> list[dict[str, str]]:
        return [CATEGORY]

    def get_fallback_category(self) -> None:
        return None


class _StubGrants:
    def slug_exists(self, _slug: str) -> bool:
        return False


def _normalizer() -> GrantNormalizer:
    normalizer = GrantNormalizer()
    normalizer._reference = _StubReference()  # noqa: SLF001
    normalizer._grants = _StubGrants()  # noqa: SLF001

    return normalizer


def _grant(**overrides) -> ExtractedGrant:
    values = {
        "title": "Urban Streams Restoration Program",
        "official_url": "https://www.grants.ca.gov/grants/urban-streams/",
        "organization": "Department of Water Resources",
        "confidence": 90,
        "maximum_amount": Decimal("500000"),
    }
    values.update(overrides)

    return ExtractedGrant(**values)


def _normalize(**kwargs):
    return _normalizer().normalize(
        _grant(**kwargs.pop("grant_kwargs", {})),
        source_url="https://www.grants.ca.gov/grants/urban-streams/",
        content_hash="hash-1",
        default_country_slug="united-states",
        status=GrantStatus.PUBLISHED,
        **kwargs,
    )


class TestStateAttribution:
    def test_a_state_portal_grant_is_attributed_to_its_state(self) -> None:
        result = _normalize(state_id=STATE_ID, fallback_organization_id=STATE_ORG["id"])

        assert result.grant is not None
        assert result.grant.state_id == STATE_ID

    def test_an_uncatalogued_department_falls_back_to_the_state_government(self) -> None:
        """Every state names departments that a federal register does not list.

        Discarding those extractions would mean discarding most state grants.
        """
        result = _normalize(state_id=STATE_ID, fallback_organization_id=STATE_ORG["id"])

        assert result.grant is not None
        assert result.grant.organization_id == STATE_ORG["id"]

    def test_the_fallback_is_recorded_rather_than_silent(self) -> None:
        result = _normalize(state_id=STATE_ID, fallback_organization_id=STATE_ORG["id"])

        assert any("not catalogued" in problem for problem in result.problems)

    def test_state_grants_are_not_marked_federal(self) -> None:
        """"Department of Water Resources" shares words with federal bodies.

        Reading "federal" out of the name would mislabel state funding.
        """
        result = _normalize(state_id=STATE_ID, fallback_organization_id=STATE_ORG["id"])

        assert result.grant is not None
        assert result.grant.is_federal is False

    def test_without_a_fallback_an_unknown_agency_still_stops_the_grant(self) -> None:
        """The guard against inventing agencies must survive this change."""
        result = _normalize(state_id=STATE_ID, fallback_organization_id=None)

        assert result.grant is None
        assert any("not matched" in problem for problem in result.problems)


class TestGenericAdapterGuards:
    def _adapter(self, config: dict) -> GenericAdapter:
        return GenericAdapter(
            {"name": "Test portal", "base_url": "https://example.gov", "config": config}
        )

    def test_an_unknown_strategy_is_refused(self) -> None:
        with pytest.raises(DiscoveryError, match="strategy"):
            asyncio.run(self._adapter({"strategy": "magic"}).discover(10))

    def test_a_sitemap_source_without_a_pattern_is_refused(self) -> None:
        """No pattern would mean treating every page on the site as a grant."""
        with pytest.raises(DiscoveryError, match="url_pattern"):
            asyncio.run(
                self._adapter(
                    {"strategy": "sitemap", "sitemap_url": "https://example.gov/sitemap.xml"}
                ).discover(10)
            )

    def test_a_listing_source_without_urls_is_refused(self) -> None:
        with pytest.raises(DiscoveryError, match="listing_urls"):
            asyncio.run(self._adapter({"strategy": "listing", "link_pattern": "/x"}).discover(10))

    def test_is_grant_url_uses_the_configured_pattern(self) -> None:
        adapter = self._adapter(
            {
                "strategy": "sitemap",
                "sitemap_url": "https://example.gov/sitemap.xml",
                "url_pattern": r"/grants/[^/]+/?$",
            }
        )

        assert adapter.is_grant_url("https://example.gov/grants/urban-greening/")
        assert not adapter.is_grant_url("https://example.gov/news/annual-report/")


class TestRegistration:
    def test_the_generic_adapter_is_reachable_by_key(self) -> None:
        adapter = get_adapter(
            {"adapter_key": "generic", "name": "x", "base_url": "https://example.gov", "config": {}}
        )

        assert isinstance(adapter, GenericAdapter)
