"""Fetch one page and report what came back.

    python -m app.fetch_probe <url>

A rehearsal tool, not part of the pipeline: it exercises robots.txt, the
crawl delay, Crawl4AI, content cleaning and the change-detection hash on a
single URL so a new source can be checked before a full run is scheduled.
Writes nothing to the database.
"""

from __future__ import annotations

import asyncio
import sys

from core.logging import get_logger
from extractors.content import prepare_for_ai
from models.fetch import FetchOutcome
from services.fetcher import PageFetcher

log = get_logger("probe")

DEFAULT_URL = "https://www.grants.gov/search-grants"


async def probe(url: str, previous_hash: str | None = None) -> int:
    fetcher = PageFetcher()

    log.info("Fetching {url}", url=url)
    result = await fetcher.fetch(url, previous_hash=previous_hash)

    log.info(
        "Outcome={outcome} engine={engine} status={status}",
        outcome=result.outcome.value,
        engine=result.engine.value if result.engine else "none",
        status=result.http_status,
    )

    if result.outcome == FetchOutcome.BLOCKED_BY_ROBOTS:
        log.warning("robots.txt disallows this URL — nothing was requested")
        return 0

    if result.outcome == FetchOutcome.FAILED:
        log.error("Fetch failed: {error}", error=result.error)
        return 1

    if result.outcome == FetchOutcome.UNCHANGED:
        log.info("Content hash unchanged — AI and publishing would be skipped")
        return 0

    cleaned = prepare_for_ai(result.markdown or "")

    log.info(
        "Extracted {chars} chars of clean content, {links} internal links, hash={hash}",
        chars=len(cleaned),
        links=len(result.links),
        hash=(result.content_hash or "")[:16],
    )

    preview = "\n".join(line for line in cleaned.splitlines() if line.strip())[:600]
    print("\n--- first 600 characters of what Gemini would receive ---\n")
    print(preview)
    print("\n--- end ---\n")

    # Re-fetch to demonstrate the cost lever: the second call should report
    # UNCHANGED and would skip every downstream stage.
    if result.content_hash is not None:
        log.info("Re-fetching to confirm change detection…")
        again = await fetcher.fetch(url, previous_hash=result.content_hash)
        log.info("Second fetch outcome={outcome}", outcome=again.outcome.value)

    return 0


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL

    return asyncio.run(probe(url))


if __name__ == "__main__":
    sys.exit(main())
