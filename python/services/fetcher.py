"""The fetch stage.

Part 7B §144/§145: Crawl4AI is the default engine because it renders
JavaScript and returns clean markdown; plain HTTP is the fallback for simple
pages and feeds where a browser is wasted effort.

Three things happen before a page is ever handed to AI:

1. robots.txt is checked.
2. The host's requested crawl delay is honoured.
3. The cleaned content is hashed and compared with the previous crawl.

Step 3 is what keeps the bill down — an unchanged page costs one request
instead of one Gemini call.
"""

from __future__ import annotations

import asyncio
from collections import defaultdict
from urllib.parse import urlparse

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from config.settings import get_settings
from core.hashing import has_changed
from core.logging import get_logger
from core.robots import crawl_delay, is_allowed
from models.fetch import FetchEngine, FetchOutcome, FetchResult

log = get_logger("fetch")


class PageFetcher:
    """Fetches pages politely, one host at a time.

    Per-host locks mean a crawl can run several sources concurrently while
    still never issuing two overlapping requests to the same server.
    """

    def __init__(self) -> None:
        self._settings = get_settings()
        self._host_locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._last_request: dict[str, float] = {}

    async def fetch(self, url: str, previous_hash: str | None = None) -> FetchResult:
        if not is_allowed(url):
            return FetchResult(url=url, outcome=FetchOutcome.BLOCKED_BY_ROBOTS)

        host = urlparse(url).netloc

        async with self._host_locks[host]:
            await self._wait_turn(url, host)

            try:
                result = await self._fetch_with_crawl4ai(url)
            except Exception as error:  # noqa: BLE001 — one page must not end the run
                log.warning("Crawl4AI failed for {url}: {error}", url=url, error=error)
                result = await self._fetch_with_httpx(url)

        if not result.succeeded or result.markdown is None:
            return result

        changed, new_hash = has_changed(previous_hash, result.markdown)

        if not changed:
            log.debug("Unchanged, skipping downstream work: {url}", url=url)

            return result.model_copy(
                update={"outcome": FetchOutcome.UNCHANGED, "content_hash": new_hash}
            )

        return result.model_copy(update={"content_hash": new_hash})

    async def _wait_turn(self, url: str, host: str) -> None:
        """Throttle per host, honouring robots.txt Crawl-delay if stated."""
        delay = crawl_delay(url)
        loop = asyncio.get_running_loop()
        last = self._last_request.get(host)

        if last is not None:
            elapsed = loop.time() - last

            if elapsed < delay:
                await asyncio.sleep(delay - elapsed)

        self._last_request[host] = loop.time()

    async def _fetch_with_crawl4ai(self, url: str) -> FetchResult:
        # Imported lazily so the rest of the pipeline — and the health check —
        # runs without Playwright's browser binaries installed.
        from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig

        browser_config = BrowserConfig(
            headless=self._settings.headless,
            user_agent=self._settings.user_agent,
            verbose=False,
        )

        run_config = CrawlerRunConfig(
            # Our own hash decides what is stale, so Crawl4AI's cache would
            # only hide changes from us.
            cache_mode=CacheMode.BYPASS,
            page_timeout=self._settings.playwright_timeout * 1000,
            # Government portals redirect and hydrate after first paint.
            # Reading the DOM too early raises "the page is navigating and
            # changing the content"; waiting for the network to settle and
            # pausing briefly afterwards makes the fetch reproducible.
            wait_until="networkidle",
            delay_before_return_html=1.5,
            # Navigation, cookie banners and footers are noise that costs
            # tokens and confuses extraction (§6).
            excluded_tags=["nav", "header", "footer", "aside", "script", "style", "form"],
            exclude_external_links=True,
            remove_overlay_elements=True,
        )

        async with AsyncWebCrawler(config=browser_config) as crawler:
            response = await crawler.arun(url=url, config=run_config)

        if not response.success:
            return FetchResult(
                url=url,
                outcome=FetchOutcome.FAILED,
                engine=FetchEngine.CRAWL4AI,
                error=response.error_message,
            )

        markdown = _markdown_text(response)

        return FetchResult(
            url=url,
            outcome=FetchOutcome.FETCHED,
            engine=FetchEngine.CRAWL4AI,
            http_status=response.status_code,
            html=response.cleaned_html,
            markdown=markdown,
            links=_internal_links(response),
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(httpx.HTTPError),
        reraise=False,
    )
    async def _get(self, url: str) -> httpx.Response:
        async with httpx.AsyncClient(
            timeout=self._settings.crawl_timeout,
            follow_redirects=True,
            headers={"User-Agent": self._settings.user_agent},
        ) as client:
            return await client.get(url)

    async def _fetch_with_httpx(self, url: str) -> FetchResult:
        """Last resort. Returns raw text; extraction handles the cleaning."""
        try:
            response = await self._get(url)
        except httpx.HTTPError as error:
            return FetchResult(
                url=url,
                outcome=FetchOutcome.FAILED,
                engine=FetchEngine.HTTPX,
                error=str(error),
            )

        if response.status_code >= 400:
            return FetchResult(
                url=url,
                outcome=FetchOutcome.FAILED,
                engine=FetchEngine.HTTPX,
                http_status=response.status_code,
                error=f"HTTP {response.status_code}",
            )

        from extractors.content import html_to_text

        return FetchResult(
            url=url,
            outcome=FetchOutcome.FETCHED,
            engine=FetchEngine.HTTPX,
            http_status=response.status_code,
            html=response.text,
            markdown=html_to_text(response.text),
        )


def _markdown_text(response: object) -> str | None:
    """Crawl4AI has moved this field between releases; tolerate either shape."""
    markdown = getattr(response, "markdown", None)

    if markdown is None:
        return None

    if isinstance(markdown, str):
        return markdown

    for attribute in ("fit_markdown", "raw_markdown"):
        value = getattr(markdown, attribute, None)

        if isinstance(value, str) and value.strip():
            return value

    return str(markdown) or None


def _internal_links(response: object) -> list[str]:
    links = getattr(response, "links", None)

    if not isinstance(links, dict):
        return []

    internal = links.get("internal", [])

    return [
        entry["href"]
        for entry in internal
        if isinstance(entry, dict) and isinstance(entry.get("href"), str)
    ]
