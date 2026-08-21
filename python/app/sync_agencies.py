"""Populate the agency list from grants.gov.

    python -m app.sync_agencies            # add missing agencies
    python -m app.sync_agencies --dry-run  # report what would be added

The pipeline resolves an extracted agency name to an `organizations` row and
refuses to guess when it cannot. With only the five seeded agencies, that means
almost every real federal grant is held for review — correct, but useless.

This closes the gap with data rather than by relaxing the rule: grants.gov
publishes its own agency hierarchy, and those names are authoritative. Run it
once before the first real crawl, and occasionally afterwards as agencies are
reorganised.
"""

from __future__ import annotations

import argparse
import asyncio
import sys

from adapters.grants_gov import GrantsGovAdapter
from core.logging import get_logger
from processors.normalizer import slugify
from repositories.reference import ReferenceRepository
from repositories.sources import source_repository

log = get_logger("sync-agencies")

ADAPTER_KEY = "grants_gov"


async def sync(dry_run: bool) -> int:
    reference = ReferenceRepository()
    source = source_repository.find_by_adapter_key(ADAPTER_KEY)

    if source is None:
        log.error("No crawler source configured for {key!r}", key=ADAPTER_KEY)

        return 1

    country_id = source["country_id"]
    adapter = GrantsGovAdapter(source)

    try:
        agencies = await adapter.fetch_agencies()
    except Exception as error:  # noqa: BLE001 — reported, not raised
        log.error("Could not fetch the agency list: {error}", error=error)

        return 1

    if not agencies:
        log.error("Agency list was empty — refusing to treat that as success")

        return 1

    added = 0
    skipped = 0
    seen: set[str] = set()

    for agency in agencies:
        name = agency["name"]
        slug = slugify(name)

        if not slug or slug in seen:
            # The facet lists a department and its sub-agencies, and a
            # department that awards directly appears in both.
            skipped += 1
            continue

        seen.add(slug)

        # Reuses the matcher the pipeline uses, so an agency already stored
        # under its acronym is recognised rather than duplicated.
        if reference.match_organization(name, country_id) is not None:
            skipped += 1
            continue

        if dry_run:
            log.info("Would add {name} ({code})", name=name, code=agency["code"] or "no code")
            added += 1
            continue

        row = {
            "country_id": country_id,
            "name": name,
            "slug": slug,
            "organization_type": "government_federal",
            "website": "https://www.grants.gov",
            "description": (
                f"{name}, part of {agency['parent']}." if agency["parent"] else name
            ),
        }

        if reference.upsert_organization(row):
            added += 1
        else:
            skipped += 1

    log.info(
        "{verb} {added} agencies, {skipped} already present",
        verb="Would add" if dry_run else "Added",
        added=added,
        skipped=skipped,
    )

    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="app.sync_agencies")
    parser.add_argument("--dry-run", action="store_true", help="Report without writing.")
    args = parser.parse_args(argv if argv is not None else sys.argv[1:])

    return asyncio.run(sync(args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
