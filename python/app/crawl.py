"""Run a crawl.

    python -m app.crawl                      # every active source
    python -m app.crawl grants_gov           # one source
    python -m app.crawl grants_gov --limit 5 # one source, five pages
    python -m app.crawl grants_gov --dry-run # rehearse, write no grants

`--dry-run` still opens and closes a `crawler_runs` row — the run happened, and
hiding it would make a rehearsal invisible to whoever is watching the crawler
page. What it suppresses is grant writes.
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from config.settings import get_settings
from core.logging import get_logger
from services.pipeline import DEFAULT_PAGE_LIMIT, CrawlPipeline, crawl_source_by_key

log = get_logger("crawl")


def _parse(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="app.crawl", description="Run a Grant Ninja crawl.")
    parser.add_argument(
        "adapter_key",
        nargs="?",
        help="Crawl one source by adapter key. Omit to run every active source.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_PAGE_LIMIT,
        help=f"Maximum pages per source (default {DEFAULT_PAGE_LIMIT}).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and extract, but write no grants.",
    )

    return parser.parse_args(argv)


async def _run(args: argparse.Namespace) -> int:
    if args.adapter_key:
        tally = await crawl_source_by_key(args.adapter_key, args.limit)

        if tally is None:
            return 1

        tallies = [tally]
    else:
        tallies = await CrawlPipeline().run_all(args.limit)

    if not tallies:
        return 1

    for tally in tallies:
        log.info("Result: {summary}", summary=tally.summary())

    # A run that only produced errors is a failed run, whatever it scanned.
    total_errors = sum(tally.errors for tally in tallies)
    total_useful = sum(
        tally.grants_new + tally.grants_updated + tally.skipped_unchanged + tally.unresolved
        for tally in tallies
    )

    if total_useful == 0 and total_errors > 0:
        log.error("Crawl produced nothing but errors")

        return 1

    return 0


def main(argv: list[str] | None = None) -> int:
    args = _parse(argv if argv is not None else sys.argv[1:])

    settings = get_settings()

    if args.dry_run:
        # Set before the publisher reads it. `get_settings` is cached, so
        # mutating the instance is what actually takes effect.
        settings.dry_run = True

    log.info(
        "Starting crawl · source={source} limit={limit} dry_run={dry}",
        source=args.adapter_key or "all active",
        limit=args.limit,
        dry=settings.dry_run,
    )

    return asyncio.run(_run(args))


if __name__ == "__main__":
    sys.exit(main())
