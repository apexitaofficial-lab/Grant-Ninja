"""Crawler sources and their run history.

A source's behaviour — how often, how fast, how many at once, whether robots
is honoured — is configuration in the database, not constants in Python. An
operator can slow a crawler down at 2am without a deploy, which is the whole
reason `crawler_sources` has those columns.

Every crawl opens a run row and closes it. An open `running` row that never
closed is how a crashed crawl becomes visible in the admin panel instead of
silently producing nothing.
"""

from __future__ import annotations

from typing import Any

from postgrest.exceptions import APIError

from repositories.base import BaseRepository

SOURCE_FIELDS = (
    "id, country_id, organization_id, name, base_url, adapter_key, "
    "crawl_frequency, priority, status, request_delay_ms, max_concurrency, "
    "respect_robots_txt, last_run_at"
)


class SourceRepository(BaseRepository):
    entity_name = "CrawlerSource"

    def list_active(self) -> list[dict[str, Any]]:
        """Highest priority first, so a short run still covers what matters."""
        try:
            return (
                self._table("crawler_sources")
                .select(SOURCE_FIELDS)
                .eq("status", "active")
                .order("priority", desc=True)
                .execute()
                .data
            )
        except APIError as error:
            raise self._fail("list_active", error) from error

    def find_by_adapter_key(self, adapter_key: str) -> dict[str, Any] | None:
        try:
            rows = (
                self._table("crawler_sources")
                .select(SOURCE_FIELDS)
                .eq("adapter_key", adapter_key)
                .limit(1)
                .execute()
                .data
            )
        except APIError as error:
            raise self._fail("find_by_adapter_key", error) from error

        return self._first(rows)

    def request_run(
        self,
        source_id: str,
        *,
        page_limit: int = 25,
        triggered_by: str = "schedule",
    ) -> str | None:
        """Queues a crawl. Returns None if this source already has one waiting.

        The duplicate check lives in the database, not here: two schedulers, or
        a scheduler and an impatient admin, can call this at the same moment and
        exactly one row is created.
        """
        try:
            response = self.client.rpc(
                "request_crawl",
                {
                    "p_source_id": source_id,
                    "p_page_limit": page_limit,
                    "p_triggered_by": triggered_by,
                    "p_requested_by": None,
                },
            ).execute()
        except APIError as error:
            raise self._fail("request_run", error) from error

        return str(response.data) if response.data else None

    def claim_run(self) -> dict[str, Any] | None:
        """Takes the oldest queued crawl, or None when the queue is empty.

        Atomic, so several workers can poll the same queue without
        coordinating — whoever wins the row gets it, the rest step over it.
        """
        try:
            rows = self.client.rpc("claim_crawler_run", {}).execute().data
        except APIError as error:
            raise self._fail("claim_run", error) from error

        return self._first(rows) if rows else None

    def reap_stalled_runs(self, older_than: str = "1 hour") -> int:
        """Fails runs whose worker died, so the source is not blocked forever."""
        try:
            response = self.client.rpc(
                "reap_stalled_runs", {"p_older_than": older_than}
            ).execute()
        except APIError as error:
            raise self._fail("reap_stalled_runs", error) from error

        return int(response.data or 0)

    def finish_run_status(self, run_id: str, status: str, detail: str) -> None:
        """Closes a run that never got far enough to produce a tally."""
        try:
            (
                self._table("crawler_runs")
                .update(
                    {
                        "status": status,
                        "completed_at": "now()",
                        "logs": [{"stage": "worker", "outcome": status, "detail": detail}],
                    }
                )
                .eq("id", run_id)
                .execute()
            )
        except APIError as error:
            raise self._fail("finish_run_status", error) from error

    def find_by_id(self, source_id: str) -> dict[str, Any] | None:
        try:
            rows = (
                self._table("crawler_sources")
                .select(SOURCE_FIELDS)
                .eq("id", source_id)
                .limit(1)
                .execute()
                .data
            )
        except APIError as error:
            raise self._fail("find_by_id", error) from error

        return self._first(rows)

    def start_run(self, source_id: str) -> str:
        try:
            rows = (
                self._table("crawler_runs")
                .insert({"source_id": source_id, "status": "running"})
                .execute()
                .data
            )
        except APIError as error:
            raise self._fail("start_run", error) from error

        row = self._first(rows)

        if row is None:
            raise RuntimeError("crawler_runs insert returned no row")

        return str(row["id"])

    def finish_run(
        self,
        run_id: str,
        *,
        status: str,
        duration_ms: int,
        pages_scanned: int,
        grants_new: int,
        grants_updated: int,
        duplicates_found: int,
        errors: int,
        logs: list[dict[str, Any]] | None = None,
    ) -> None:
        try:
            (
                self._table("crawler_runs")
                .update(
                    {
                        "status": status,
                        "completed_at": "now()",
                        "duration_ms": duration_ms,
                        "pages_scanned": pages_scanned,
                        "grants_new": grants_new,
                        "grants_updated": grants_updated,
                        "duplicates_found": duplicates_found,
                        "errors": errors,
                        # Capped: a run log is a diagnostic, not an archive, and
                        # an unbounded jsonb column on a daily crawl grows
                        # without limit.
                        "logs": (logs or [])[-200:],
                    }
                )
                .eq("id", run_id)
                .execute()
            )
        except APIError as error:
            raise self._fail("finish_run", error) from error

    def publish_registered_adapters(self, keys: list[str]) -> None:
        """Tells the admin panel which adapters this build actually has.

        The adapters are Python; the panel is TypeScript. Without this the UI
        would need a hardcoded copy of the list, which would be wrong the first
        time an adapter was added and nobody remembered to update it — and the
        symptom would be an operator activating a source that can only fail.

        Written on every tick rather than at startup so removing an adapter is
        reflected too, not just adding one.
        """
        try:
            self._table("system_settings").upsert(
                {
                    "key": "registered_adapter_keys",
                    "value": keys,
                    "group_name": "crawler",
                    "description": (
                        "Adapter keys the running pipeline has registered. Written by the "
                        "worker; the admin panel uses it to decide whether a source can be "
                        "activated. Not edited by hand."
                    ),
                    "is_public": False,
                },
                on_conflict="key",
            ).execute()
        except APIError as error:
            # A stale list degrades to a warning in the UI, not a broken crawl.
            self.log.warning(
                "Could not publish adapter keys: {message}", message=error.message
            )

    def touch_last_run(self, source_id: str) -> None:
        """Records that this source was visited, whatever the run produced.

        Deliberately separate from `finish_run`: the scheduler uses this to
        decide what is due, and a failed run still counts as an attempt. Not
        updating it would make a persistently failing source retry forever.
        """
        try:
            self._table("crawler_sources").update({"last_run_at": "now()"}).eq(
                "id", source_id
            ).execute()
        except APIError as error:
            self.log.warning("Could not update last_run_at: {message}", message=error.message)


source_repository = SourceRepository()
