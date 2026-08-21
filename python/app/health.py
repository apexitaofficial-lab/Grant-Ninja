"""Startup health check.

Part 4A "Verify: Environment loads successfully". Run this before a crawl and
before a deploy: it proves the configuration parses, the database is
reachable, the secret key has the privileges it needs, and the reference data
the pipeline resolves against actually exists.

    python -m app.health
"""

from __future__ import annotations

import sys

from postgrest.exceptions import APIError

from config.settings import get_settings
from core.database import get_client
from core.logging import get_logger
from repositories.reference import ReferenceRepository

log = get_logger("health")


def _check_settings() -> bool:
    try:
        settings = get_settings()
    except Exception as error:  # noqa: BLE001 — the message is the whole point
        log.error("Configuration invalid: {error}", error=error)
        return False

    log.info(
        "Configuration loaded (model={model}, country={country}, dry_run={dry_run})",
        model=settings.gemini_model,
        country=settings.default_country,
        dry_run=settings.dry_run,
    )

    return True


def _check_read_access() -> bool:
    """Reads a public table. Proves the URL and key reach the project."""
    try:
        response = get_client().table("countries").select("id", count="exact").limit(1).execute()
    except APIError as error:
        log.error("Cannot read countries: {message} ({code})", message=error.message, code=error.code)
        return False

    log.info("Read access confirmed ({count} countries)", count=response.count)

    return True


def _check_write_access() -> bool:
    """Proves the secret key really does bypass RLS.

    `crawler_runs` has no write policy for any role — only the secret key can
    insert. If this fails, every publish would fail later, at the least
    convenient moment.
    """
    client = get_client()

    try:
        sources = client.table("crawler_sources").select("id").limit(1).execute().data
    except APIError as error:
        log.error("Cannot read crawler_sources: {message}", message=error.message)
        return False

    if not sources:
        log.warning("No crawler sources configured yet — write check skipped")
        return True

    try:
        inserted = (
            client.table("crawler_runs")
            .insert({"source_id": sources[0]["id"], "status": "cancelled"})
            .execute()
            .data
        )
        client.table("crawler_runs").delete().eq("id", inserted[0]["id"]).execute()
    except APIError as error:
        log.error(
            "Write access denied: {message} (hint: {hint})",
            message=error.message,
            hint=error.hint,
        )
        return False

    log.info("Write access confirmed (insert + delete on crawler_runs)")

    return True


def _check_reference_data() -> bool:
    repository = ReferenceRepository()

    countries = repository.list_countries()
    categories = repository.list_categories()
    threshold = repository.get_auto_publish_threshold()

    if not countries:
        log.error("No countries in the database — run migration 0014_seed")
        return False

    if not categories:
        log.error("No categories in the database — run migration 0014_seed")
        return False

    log.info(
        "Reference data present ({countries} countries, {categories} categories, "
        "auto-publish at {threshold})",
        countries=len(countries),
        categories=len(categories),
        threshold=threshold,
    )

    return True


def main() -> int:
    checks = (
        ("configuration", _check_settings),
        ("read access", _check_read_access),
        ("write access", _check_write_access),
        ("reference data", _check_reference_data),
    )

    failures = [name for name, check in checks if not check()]

    if failures:
        log.error("Health check FAILED: {failed}", failed=", ".join(failures))
        return 1

    log.info("Health check passed — the pipeline can run")

    return 0


if __name__ == "__main__":
    sys.exit(main())
