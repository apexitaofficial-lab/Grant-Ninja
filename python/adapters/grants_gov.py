"""Grants.gov — the US federal clearing house.

Discovery uses the JSON search service the grants.gov UI itself calls, rather
than scraping the search page. The search page is a client-rendered app whose
results never appear in the initial HTML, so scraping it would mean driving a
browser through pagination to recover data the site already publishes as JSON.
One request returns a page of opportunities with ids, titles, agencies and
dates.

Two things follow from that choice and are worth stating plainly:

* The endpoint is **undocumented**. It is what the public site runs on, so it
  is stable in practice, but it carries no compatibility promise. When it
  changes, discovery fails loudly and the run records the error rather than
  silently finding nothing — a source that quietly returns zero grants looks
  identical to a source with no new grants, which is the failure mode worth
  designing against.
* Only `posted` opportunities are taken by default. `forecasted` entries are
  announcements with no close date and often no detail page worth reading;
  they would fill the directory with grants nobody can apply for.

The detail pages themselves *are* client-rendered, so those go through the
normal Crawl4AI path like any other source.
"""

from __future__ import annotations

from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from adapters.base import SourceAdapter, register
from config.settings import get_settings
from core.logging import get_logger

log = get_logger("adapter", source="grants_gov")

SEARCH_ENDPOINT = "https://apply07.grants.gov/grantsws/rest/opportunities/search"
DETAIL_URL = "https://www.grants.gov/search-results-detail/{opportunity_id}"

# One request per page of results. Larger pages mean fewer requests, but the
# service slows noticeably past a few hundred rows.
PAGE_SIZE = 100


class DiscoveryError(RuntimeError):
    """Discovery failed. The run records this rather than reporting zero."""


@register
class GrantsGovAdapter(SourceAdapter):
    adapter_key = "grants_gov"

    def __init__(self, source: dict[str, Any]) -> None:
        super().__init__(source)
        self._settings = get_settings()
        self._last_hit_count = 0

    async def discover(self, limit: int) -> list[str]:
        opportunities = await self._search(limit)

        if not opportunities:
            raise DiscoveryError("search service returned no opportunities")

        urls = [
            DETAIL_URL.format(opportunity_id=opportunity["id"])
            for opportunity in opportunities
            if opportunity.get("id")
        ]

        log.info(
            "Discovered {count} posted opportunities from {total} available",
            count=len(urls),
            total=self._last_hit_count,
        )

        return urls[:limit]

    async def _search(self, limit: int) -> list[dict[str, Any]]:
        collected: list[dict[str, Any]] = []
        offset = 0

        async with httpx.AsyncClient(
            timeout=self._settings.crawl_timeout,
            headers={"User-Agent": self._settings.user_agent},
        ) as client:
            while len(collected) < limit:
                want = min(PAGE_SIZE, limit - len(collected))

                # Transport errors are retried inside `_search_page`; once the
                # retries are exhausted they surface here and become a
                # DiscoveryError, so the caller has one exception type to
                # handle whatever went wrong.
                try:
                    page = await self._search_page(client, offset, want)
                except httpx.HTTPError as error:
                    raise DiscoveryError(f"search request failed: {error}") from error

                hits = page.get("oppHits") or []

                if not hits:
                    break

                self._last_hit_count = int(page.get("hitCount") or 0)
                collected.extend(hits)
                offset += len(hits)

                if offset >= self._last_hit_count:
                    break

        return collected[:limit]

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.HTTPError),
        reraise=True,
    )
    async def _search_page(
        self, client: httpx.AsyncClient, offset: int, rows: int
    ) -> dict[str, Any]:
        response = await client.post(
            SEARCH_ENDPOINT,
            json={
                "rows": rows,
                "startRecordNum": offset,
                "keyword": "",
                # Open opportunities only. See the module docstring.
                "oppStatuses": "posted",
                "sortBy": "openDate|desc",
            },
        )

        if response.status_code != httpx.codes.OK:
            raise DiscoveryError(f"search returned HTTP {response.status_code}")

        try:
            payload = response.json()
        except ValueError as error:
            # The endpoint is undocumented; if it ever starts returning HTML,
            # this is where that becomes a readable failure.
            raise DiscoveryError("search did not return JSON") from error

        if not isinstance(payload, dict):
            raise DiscoveryError("search returned an unexpected shape")

        return payload

    def is_grant_url(self, url: str) -> bool:
        return "/search-results-detail/" in url

    async def fetch_agencies(self) -> list[dict[str, str]]:
        """The federal agency list, as grants.gov publishes it.

        The search response carries an `agencies` facet: parent departments,
        each with the sub-agencies that actually award grants, with the federal
        agency code alongside the name.

        This matters more than it looks. The normalizer refuses to invent an
        agency from a name a model read off a page, because a hallucinated
        agency would pollute the directory permanently. Names taken from this
        facet are not model output — they come from the system of record — so
        seeding from it resolves agencies without weakening that rule.

        Returns flat `{name, code, parent}` records; sub-agencies are what
        opportunities are actually filed under.
        """
        async with httpx.AsyncClient(
            timeout=self._settings.crawl_timeout,
            headers={"User-Agent": self._settings.user_agent},
        ) as client:
            try:
                page = await self._search_page(client, 0, 1)
            except httpx.HTTPError as error:
                raise DiscoveryError(f"agency lookup failed: {error}") from error

        agencies: list[dict[str, str]] = []

        for parent in page.get("agencies") or []:
            parent_name = str(parent.get("label") or "").strip()

            if parent_name:
                agencies.append(
                    {"name": parent_name, "code": str(parent.get("value") or ""), "parent": ""}
                )

            for child in parent.get("subAgencyOptions") or []:
                child_name = str(child.get("label") or "").strip()

                if child_name:
                    agencies.append(
                        {
                            "name": child_name,
                            "code": str(child.get("value") or ""),
                            "parent": parent_name,
                        }
                    )

        log.info("Agency facet returned {count} agencies", count=len(agencies))

        return agencies
