"""One crawl, end to end.

discover → fetch → clean → extract → normalize → deduplicate → publish

Every stage already exists and is tested on its own; this is the only place
they are wired together, and the only place that decides what a failure means.

The governing rule is that **one bad page must never end a run**. A government
portal will always have a page that redirects oddly, times out, or turns out to
be a login form. Each URL is therefore handled independently: its failure is
counted, logged into the run record, and the crawl moves on. A run that
processed 97 of 100 pages is a success with three errors, not a failure.

Costs are avoided in stage order, cheapest first:

* robots.txt disallows it        → no request at all
* content hash unchanged         → no AI call
* page has almost no content     → no AI call
* model reports "not a grant"    → no database write
* duplicate of something stored  → no new record
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field
from typing import Any

from adapters.base import get_adapter
from ai.extraction import GrantExtractor
from config.settings import get_settings
from core.logging import get_logger
from models.fetch import FetchOutcome
from models.grant import GrantStatus
from processors.duplicates import DuplicateAction, DuplicateDetector
from processors.normalizer import GrantNormalizer
from publishers.grant_publisher import GrantPublisher
from repositories.grants import grant_repository
from repositories.reference import ReferenceRepository
from repositories.sources import source_repository
from services.fetcher import PageFetcher

log = get_logger("pipeline")

DEFAULT_PAGE_LIMIT = 25


def _optional_str(value: object) -> str | None:
    """A UUID column that may be null. PostgREST returns None, not ''."""
    return str(value) if isinstance(value, str) and value != "" else None


def _is_federal_source(source: dict[str, Any]) -> bool:
    """Whether a source publishes federal funding.

    A source tied to a state publishes that state's programmes; anything else
    configured so far is a national government portal, and everything on
    grants.gov is federal by definition.

    A source's own `config` can override this with `{"funding_level": ...}`,
    which is what a private foundation source will need — there is no such
    source yet, so the default is deliberately the honest one rather than a
    guess dressed up as a rule.
    """
    config = source.get("config")
    level = str(config.get("funding_level", "")).strip().lower() if isinstance(config, dict) else ""

    if level in {"federal", "state", "private"}:
        return level == "federal"

    return _optional_str(source.get("state_id")) is None


@dataclass
class RunTally:
    """What a run did. Mirrors the columns on `crawler_runs`."""

    pages_scanned: int = 0
    grants_new: int = 0
    grants_updated: int = 0
    duplicates_found: int = 0
    errors: int = 0
    skipped_unchanged: int = 0
    held_for_review: int = 0
    """Written as a draft: a human decides before it is public."""
    unresolved: int = 0
    """Nothing written — an agency or category could not be resolved."""
    logs: list[dict[str, Any]] = field(default_factory=list)

    def note(self, url: str, stage: str, outcome: str, detail: str = "") -> None:
        self.logs.append({"url": url, "stage": stage, "outcome": outcome, "detail": detail})

    def summary(self) -> str:
        return (
            f"{self.pages_scanned} scanned, {self.grants_new} new, "
            f"{self.grants_updated} updated, {self.skipped_unchanged} unchanged, "
            f"{self.held_for_review} held for review, {self.unresolved} unresolved, "
            f"{self.duplicates_found} duplicates, {self.errors} errors"
        )


class CrawlPipeline:
    def __init__(self) -> None:
        self._fetcher = PageFetcher()
        self._reference = ReferenceRepository()
        self._normalizer = GrantNormalizer()
        self._duplicates = DuplicateDetector()
        # Dry run is a setting, not a constructor argument: the publisher is
        # the only thing that writes, so it is the only thing that needs to
        # know, and one source of truth avoids a "dry run" that still writes.
        self._publisher = GrantPublisher()
        self._sources = source_repository
        self._grants = grant_repository
        self._extractor: GrantExtractor | None = None

    def _extraction(self) -> GrantExtractor:
        """Built once per run, with the threshold read from the database (D3)."""
        if self._extractor is None:
            threshold = self._reference.get_auto_publish_threshold()
            log.info("Auto-publish threshold is {threshold}", threshold=threshold)
            self._extractor = GrantExtractor(threshold=threshold)

        return self._extractor

    async def run_source(
        self,
        source: dict[str, Any],
        limit: int = DEFAULT_PAGE_LIMIT,
        run_id: str | None = None,
    ) -> RunTally:
        """Crawls one source.

        `run_id` is passed when a worker has already claimed a queued run, so
        the same crawl is not recorded twice. Called without it — from
        `app.crawl` — the run row is created here.
        """
        adapter = get_adapter(source)
        tally = RunTally()

        if adapter is None:
            tally.errors += 1
            tally.note(source["base_url"], "discover", "no_adapter")

            if run_id is not None:
                self._sources.finish_run_status(
                    run_id, "failed", f"no adapter registered for {source.get('adapter_key')!r}"
                )

            return tally

        started = time.monotonic()

        if run_id is None:
            run_id = self._sources.start_run(source["id"])

        log.info("Run {run} started for {name}", run=run_id[:8], name=source["name"])

        try:
            urls = await adapter.discover(limit)
        except Exception as error:  # noqa: BLE001 — recorded, not raised
            # Discovery failing is the one error worth shouting about: without
            # it the run finds nothing, which looks identical to a quiet day.
            log.error("Discovery failed for {name}: {error}", name=source["name"], error=error)
            tally.errors += 1
            tally.note(source["base_url"], "discover", "failed", str(error))
            self._finish(run_id, source, tally, started, status="failed")

            return tally

        log.info("Processing {count} URLs", count=len(urls))

        for url in urls:
            try:
                await self._process_url(url, source, tally)
            except Exception as error:  # noqa: BLE001 — one page must not end a run
                log.warning("Unhandled error on {url}: {error}", url=url, error=error)
                tally.errors += 1
                tally.note(url, "pipeline", "error", str(error))

        self._finish(run_id, source, tally, started, status="completed")
        log.info("Run {run} finished — {summary}", run=run_id[:8], summary=tally.summary())

        return tally

    async def _process_url(self, url: str, source: dict[str, Any], tally: RunTally) -> None:
        tally.pages_scanned += 1

        # A previously seen page is compared by hash, so an unchanged notice
        # costs one request and no AI call.
        previous = self._grants.find_by_source_url(url)
        previous_hash = previous.get("content_hash") if previous else None

        result = await self._fetcher.fetch(url, previous_hash=previous_hash)

        if result.outcome is FetchOutcome.BLOCKED_BY_ROBOTS:
            tally.note(url, "fetch", "blocked_by_robots")
            return

        if result.outcome is FetchOutcome.UNCHANGED:
            tally.skipped_unchanged += 1
            tally.note(url, "fetch", "unchanged")
            return

        if result.outcome is FetchOutcome.FAILED or result.markdown is None:
            tally.errors += 1
            tally.note(url, "fetch", "failed", result.error or "no content")
            return

        outcome = self._extraction().extract(url, result.markdown)

        if outcome.grant is None:
            if outcome.needs_review:
                # The model did not answer — a quota refusal, a timeout, or
                # unparseable output. The page is still unread, so this is an
                # error even though nothing crashed. Counting it as "not a
                # grant" would quietly write off pages we never looked at.
                tally.errors += 1
                tally.note(url, "extract", "failed", outcome.reason)

                return

            # "This is not a grant page" is a correct answer, and a common one
            # on a portal full of guidance and search pages.
            tally.note(url, "extract", "no_grant", outcome.reason)

            return

        requested_status = (
            GrantStatus.PUBLISHED if outcome.auto_publish else GrantStatus.PENDING_REVIEW
        )

        normalized = self._normalizer.normalize(
            outcome.grant,
            source_url=url,
            content_hash=result.content_hash or "",
            default_country_slug=self._country_slug(source),
            status=requested_status,
            # A state portal's grants belong to that state. Without this the
            # `crawler_sources.state_id` column would be configuration nothing
            # reads, and every state grant would sit under the country only —
            # invisible to the state pages built to list them.
            state_id=_optional_str(source.get("state_id")),
            # `crawler_sources.organization_id` is the source's own body — the
            # state government for a state portal. Used only when the specific
            # department cannot be matched.
            fallback_organization_id=_optional_str(source.get("organization_id")),
            is_federal=_is_federal_source(source),
        )

        if normalized.grant is None:
            tally.unresolved += 1
            tally.note(url, "normalize", "unresolved", "; ".join(normalized.problems))
            return

        if normalized.problems:
            # A grant can normalize successfully and still have lost something
            # — most often no category matched, which silently downgrades it
            # from published to draft. Recorded so the run explains itself
            # rather than leaving a reviewer to guess why nothing went live.
            tally.note(url, "normalize", "degraded", "; ".join(normalized.problems))

        duplicate = self._duplicates.check(
            outcome.grant,
            content_hash=result.content_hash or "",
            source_url=url,
            organization_id=normalized.grant.organization_id,
            country_id=normalized.grant.country_id,
        )

        if duplicate.action is DuplicateAction.REVIEW:
            tally.duplicates_found += 1

        published = self._publisher.publish(normalized.grant, duplicate, source["name"])

        if duplicate.action is DuplicateAction.UNCHANGED:
            tally.skipped_unchanged += 1
        elif duplicate.action is DuplicateAction.UPDATE:
            tally.grants_updated += 1
        elif published.wrote_anything:
            tally.grants_new += 1

        # The status the grant was actually written with, not the one asked
        # for: the normalizer downgrades a publishable grant to a draft when it
        # cannot resolve a category, and counting the request would report
        # grants as live that are sitting in the review queue.
        if normalized.grant.status is GrantStatus.PENDING_REVIEW:
            tally.held_for_review += 1

        tally.note(url, "publish", published.action, published.reason)

    def _country_slug(self, source: dict[str, Any]) -> str:
        """The source's own country, not a global default.

        A source is configured for one country, so that is the right fallback
        when a notice does not name one. Only if the row is somehow unresolvable
        does the configured default apply.
        """
        country_id = source.get("country_id")

        for country in self._reference.list_countries():
            if country["id"] == country_id:
                return country["slug"]

        return get_settings().default_country

    def _finish(
        self,
        run_id: str,
        source: dict[str, Any],
        tally: RunTally,
        started: float,
        *,
        status: str,
    ) -> None:
        self._sources.finish_run(
            run_id,
            status=status,
            duration_ms=int((time.monotonic() - started) * 1000),
            pages_scanned=tally.pages_scanned,
            grants_new=tally.grants_new,
            grants_updated=tally.grants_updated,
            duplicates_found=tally.duplicates_found,
            errors=tally.errors,
            logs=tally.logs,
        )
        # Recorded even for a failed run: a source that keeps failing should
        # wait its turn like any other, not retry in a tight loop.
        self._sources.touch_last_run(source["id"])

    async def run_all(self, limit: int = DEFAULT_PAGE_LIMIT) -> list[RunTally]:
        sources = self._sources.list_active()

        if not sources:
            log.warning("No active crawler sources configured")

            return []

        log.info("{count} active source(s)", count=len(sources))

        # Sequential by design. Sources are separate hosts, but the AI layer
        # and the database are shared, and a crawl is not latency-sensitive.
        return [await self.run_source(source, limit) for source in sources]




async def crawl_source_by_key(adapter_key: str, limit: int = DEFAULT_PAGE_LIMIT) -> RunTally | None:
    source = source_repository.find_by_adapter_key(adapter_key)

    if source is None:
        log.error("No crawler source configured for {key!r}", key=adapter_key)

        return None

    return await CrawlPipeline().run_source(source, limit)


def run(adapter_key: str | None = None, limit: int = DEFAULT_PAGE_LIMIT) -> None:
    if adapter_key:
        asyncio.run(crawl_source_by_key(adapter_key, limit))
    else:
        asyncio.run(CrawlPipeline().run_all(limit))
