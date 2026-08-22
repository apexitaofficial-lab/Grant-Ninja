"""A source that needs no code of its own.

Fifty states publish grants fifty different ways, and writing an adapter for
each would be fifty modules to keep working. Most government sites, though,
expose their pages one of two ways: a sitemap, or a listing page full of links.
This adapter does both, driven by `crawler_sources.config`, so adding a state
is filling in a form rather than shipping Python.

Config shapes:

    {"strategy": "sitemap",
     "sitemap_url": "https://example.gov/sitemap.xml",
     "url_pattern": "/funding-opportunit"}

    {"strategy": "listing",
     "listing_urls": ["https://example.gov/grants"],
     "link_pattern": "/grants/[^/]+$"}

`url_pattern` and `link_pattern` are regular expressions matched against the
whole URL. They are the difference between crawling a site's grant pages and
crawling its entire archive of press releases, so a source without one is
rejected rather than allowed to discover everything.
"""

from __future__ import annotations

import re
from typing import Any
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree

import httpx

from adapters.base import SourceAdapter, register
from adapters.grants_gov import DiscoveryError
from config.settings import get_settings
from core.logging import get_logger

log = get_logger("adapter", source="generic")

# A sitemap index points at other sitemaps. One level of following is enough
# for every government site seen so far, and stopping there prevents a
# malformed or circular index turning into an unbounded crawl.
MAX_SITEMAP_DEPTH = 1
MAX_SITEMAP_BYTES = 20 * 1024 * 1024

_SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


@register
class GenericAdapter(SourceAdapter):
    adapter_key = "generic"

    def __init__(self, source: dict[str, Any]) -> None:
        super().__init__(source)
        self._settings = get_settings()

        config = source.get("config")
        self.config: dict[str, Any] = config if isinstance(config, dict) else {}
        self.strategy = str(self.config.get("strategy", "")).strip().lower()

    async def discover(self, limit: int) -> list[str]:
        if self.strategy == "sitemap":
            urls = await self._from_sitemap(limit)
        elif self.strategy == "listing":
            urls = await self._from_listing(limit)
        else:
            raise DiscoveryError(
                f"config.strategy must be 'sitemap' or 'listing', got {self.strategy!r}"
            )

        if not urls:
            # Reported as a failure rather than an empty run: a source that
            # silently finds nothing looks exactly like a source with nothing
            # new, and the difference matters when a site changes its markup.
            raise DiscoveryError(
                f"no URLs matched for {self.name} — check the pattern in its configuration"
            )

        log.info("Discovered {count} URLs for {name}", count=len(urls), name=self.name)

        return urls[:limit]

    # --- sitemap ------------------------------------------------------------

    async def _from_sitemap(self, limit: int) -> list[str]:
        sitemap_url = str(self.config.get("sitemap_url", "")).strip()

        if sitemap_url == "":
            raise DiscoveryError("config.sitemap_url is required for the sitemap strategy")

        pattern = self._compiled_pattern("url_pattern")
        found: list[str] = []
        seen: set[str] = set()

        async with self._client() as client:
            for url in await self._collect_sitemap_urls(client, sitemap_url, depth=0):
                if len(found) >= limit:
                    break

                if url in seen or not pattern.search(url):
                    continue

                seen.add(url)
                found.append(url)

        return found

    async def _collect_sitemap_urls(
        self, client: httpx.AsyncClient, sitemap_url: str, depth: int
    ) -> list[str]:
        try:
            response = await client.get(sitemap_url)
        except httpx.HTTPError as error:
            raise DiscoveryError(f"could not fetch {sitemap_url}: {error}") from error

        if response.status_code != httpx.codes.OK:
            raise DiscoveryError(f"{sitemap_url} returned HTTP {response.status_code}")

        if len(response.content) > MAX_SITEMAP_BYTES:
            raise DiscoveryError(f"{sitemap_url} is larger than the {MAX_SITEMAP_BYTES} byte cap")

        try:
            root = ElementTree.fromstring(response.content)
        except ElementTree.ParseError as error:
            # Some sites serve an HTML error page with a 200. Saying so beats
            # "no URLs matched", which sends someone hunting the wrong problem.
            raise DiscoveryError(f"{sitemap_url} is not valid XML: {error}") from error

        # A sitemap index lists <sitemap><loc>; a sitemap lists <url><loc>.
        nested = [element.text for element in root.findall(".//sm:sitemap/sm:loc", _SITEMAP_NS)]

        if nested:
            if depth >= MAX_SITEMAP_DEPTH:
                log.warning("Sitemap index nested deeper than {max}, stopping", max=MAX_SITEMAP_DEPTH)

                return []

            collected: list[str] = []

            for child in nested:
                if child is None:
                    continue

                collected.extend(await self._collect_sitemap_urls(client, child.strip(), depth + 1))

            return collected

        return [
            element.text.strip()
            for element in root.findall(".//sm:url/sm:loc", _SITEMAP_NS)
            if element.text is not None
        ]

    # --- listing ------------------------------------------------------------

    async def _from_listing(self, limit: int) -> list[str]:
        listing_urls = self.config.get("listing_urls")

        if not isinstance(listing_urls, list) or not listing_urls:
            raise DiscoveryError("config.listing_urls must be a non-empty list")

        pattern = self._compiled_pattern("link_pattern")
        found: list[str] = []
        seen: set[str] = set()
        base_host = urlparse(self.base_url).netloc

        async with self._client() as client:
            for listing in listing_urls:
                if len(found) >= limit:
                    break

                try:
                    response = await client.get(str(listing))
                except httpx.HTTPError as error:
                    log.warning("Listing page failed: {error}", error=error)
                    continue

                if response.status_code != httpx.codes.OK:
                    log.warning(
                        "Listing page {url} returned {status}",
                        url=listing,
                        status=response.status_code,
                    )
                    continue

                for href in _extract_links(response.text):
                    absolute = urljoin(str(listing), href)

                    # Staying on the source's own host matters: a government
                    # page links out constantly, and following those would
                    # crawl half the internet on someone else's behalf.
                    if urlparse(absolute).netloc != base_host:
                        continue

                    if absolute in seen or not pattern.search(absolute):
                        continue

                    seen.add(absolute)
                    found.append(absolute)

                    if len(found) >= limit:
                        break

        return found

    # --- shared -------------------------------------------------------------

    def _compiled_pattern(self, key: str) -> re.Pattern[str]:
        raw = str(self.config.get(key, "")).strip()

        if raw == "":
            raise DiscoveryError(
                f"config.{key} is required — without it this source would treat every page "
                f"on the site as a grant"
            )

        try:
            return re.compile(raw, re.IGNORECASE)
        except re.error as error:
            raise DiscoveryError(f"config.{key} is not a valid regular expression: {error}") from error

    def _client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            timeout=self._settings.crawl_timeout,
            follow_redirects=True,
            headers={"User-Agent": self._settings.user_agent},
        )

    def is_grant_url(self, url: str) -> bool:
        key = "url_pattern" if self.strategy == "sitemap" else "link_pattern"

        try:
            return bool(self._compiled_pattern(key).search(url))
        except DiscoveryError:
            return False


_HREF = re.compile(r"""<a\b[^>]*?\bhref\s*=\s*["']([^"'#>]+)["']""", re.IGNORECASE)


def _extract_links(html: str) -> list[str]:
    """Hrefs from a listing page.

    A regex rather than a parser on purpose: this runs before anything is
    fetched, on pages that are often malformed, and only needs the href
    attribute. BeautifulSoup is used later where structure actually matters.
    """
    return [match.group(1).strip() for match in _HREF.finditer(html)]
