"""Fetch a page, extract it with Gemini, and print the result.

    python -m app.ai_probe <url>

The end-to-end rehearsal for a single URL: robots → fetch → clean → hash →
Gemini → validate → publish decision. Writes no grant; it only records the AI
usage row, because that call really did cost money.
"""

from __future__ import annotations

import asyncio
import sys

from ai.extraction import GrantExtractor
from core.logging import get_logger
from models.fetch import FetchOutcome
from repositories.reference import ReferenceRepository
from services.fetcher import PageFetcher

log = get_logger("ai-probe")

DEFAULT_URL = "https://www.grants.gov/search-grants"


async def probe(url: str) -> int:
    fetcher = PageFetcher()
    result = await fetcher.fetch(url)

    if result.outcome is not FetchOutcome.FETCHED or not result.markdown:
        log.error("Fetch did not produce content: {outcome}", outcome=result.outcome.value)
        return 1

    log.info("Fetched {chars} chars, hash={hash}", chars=len(result.markdown), hash=(result.content_hash or "")[:16])

    threshold = ReferenceRepository().get_auto_publish_threshold()
    log.info("Auto-publish threshold from settings: {threshold}", threshold=threshold)

    outcome = GrantExtractor(threshold=threshold).extract(url, result.markdown)

    print("\n=== extraction ===")
    print(f"prompt version : {outcome.prompt_version}")
    print(f"auto publish   : {outcome.auto_publish}")
    print(f"needs review   : {outcome.needs_review}")
    print(f"reason         : {outcome.reason}")

    if outcome.grant is None:
        print("\nNo grant extracted.\n")
        return 0

    grant = outcome.grant
    print(f"\ntitle          : {grant.title}")
    print(f"organization   : {grant.organization}")
    print(f"confidence     : {grant.confidence}")
    print(f"grant type     : {grant.grant_type.value}")
    print(f"amount         : {grant.minimum_amount} – {grant.maximum_amount} {grant.currency}")
    print(f"window         : {grant.opens_at} → {grant.closes_at}")
    print(f"official url   : {grant.official_url}")
    print(f"keywords       : {', '.join(grant.keywords) or '—'}")
    print(f"reasoning      : {grant.reasoning}")
    print()

    return 0


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL

    return asyncio.run(probe(url))


if __name__ == "__main__":
    sys.exit(main())
