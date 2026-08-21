"""The crawl worker.

    python -m app.worker                  # poll forever, schedule included
    python -m app.worker --once           # drain the queue and exit
    python -m app.worker --no-schedule    # only serve requested crawls
    python -m app.worker --interval 5     # poll every 5 seconds

This is the one process that needs to be running for the admin panel's
"Run crawl now" button to do anything. It does two jobs on each tick:

1. **Schedule** — enqueue any source whose cron expression has fired since it
   last ran.
2. **Drain** — claim queued crawls one at a time and run them.

Both go through the same queue, so a manual crawl and a scheduled one take
exactly the same path. There is no separate code path for the button, which is
the point: the button cannot work while the schedule is broken, or vice versa.

Deployment (Phase 7) can either keep this running under PM2/systemd, or drop
the loop entirely and let cron call `--once`. Both work; the loop is what makes
the button feel immediate.
"""

from __future__ import annotations

import argparse
import asyncio
import signal
import sys
from typing import Any

from adapters.base import registered_keys
from core.logging import get_logger
from repositories.sources import source_repository
from scheduler.due import due_sources
from services.pipeline import CrawlPipeline

log = get_logger("worker")

DEFAULT_INTERVAL = 10
STALLED_AFTER = "1 hour"


class Worker:
    def __init__(self, *, interval: int, schedule: bool) -> None:
        self._interval = interval
        self._schedule = schedule
        self._sources = source_repository
        self._pipeline = CrawlPipeline()
        self._stopping = False

    def stop(self) -> None:
        # Sets a flag rather than killing the loop: a crawl in flight has an
        # open run row, and abandoning it would leave a row stuck in 'running'
        # that blocks the source until it is reaped.
        if not self._stopping:
            log.info("Stop requested — finishing the current crawl first")

        self._stopping = True

    async def tick(self) -> int:
        """One pass. Returns how many crawls ran."""
        self._sources.publish_registered_adapters(registered_keys())

        reaped = self._sources.reap_stalled_runs(STALLED_AFTER)

        if reaped:
            log.warning("Reaped {count} stalled run(s)", count=reaped)

        if self._schedule:
            self._enqueue_due()

        return await self._drain()

    def _enqueue_due(self) -> None:
        sources = self._sources.list_active()

        for source in due_sources(sources):
            run_id = self._sources.request_run(
                source["id"],
                page_limit=int(source.get("page_limit") or 25),
                triggered_by="schedule",
            )

            if run_id is None:
                # Already queued or running. Normal, not an error.
                continue

            log.info(
                "Scheduled {name} ({frequency})",
                name=source["name"],
                frequency=source.get("crawl_frequency"),
            )

    async def _drain(self) -> int:
        completed = 0

        while not self._stopping:
            job = self._sources.claim_run()

            if job is None:
                break

            await self._execute(job)
            completed += 1

        return completed

    async def _execute(self, job: dict[str, Any]) -> None:
        run_id = str(job["run_id"])
        source = self._sources.find_by_id(str(job["source_id"]))

        if source is None:
            log.error("Run {run} names a source that no longer exists", run=run_id[:8])
            self._sources.finish_run_status(run_id, "failed", "source no longer exists")

            return

        log.info(
            "Running {trigger} crawl of {name} (limit {limit})",
            trigger=job.get("triggered_by", "?"),
            name=source["name"],
            limit=job.get("page_limit"),
        )

        try:
            await self._pipeline.run_source(
                source, limit=int(job.get("page_limit") or 25), run_id=run_id
            )
        except Exception as error:  # noqa: BLE001 — a bad crawl must not kill the worker
            # Closing the row is the important part. A worker that dies with a
            # run left open blocks that source until the reaper catches it.
            log.exception("Crawl failed for {name}: {error}", name=source["name"], error=error)
            self._sources.finish_run_status(run_id, "failed", str(error))

    async def serve(self) -> None:
        log.info(
            "Worker started · polling every {interval}s · scheduling {state}",
            interval=self._interval,
            state="on" if self._schedule else "off",
        )

        while not self._stopping:
            try:
                await self.tick()
            except Exception as error:  # noqa: BLE001 — outlast transient failures
                # A dropped connection or a paused database must not end the
                # worker; it should keep trying until the problem is fixed.
                log.error("Tick failed, continuing: {error}", error=error)

            for _ in range(self._interval):
                if self._stopping:
                    break

                await asyncio.sleep(1)

        log.info("Worker stopped")


def _parse(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="app.worker", description="Run queued crawls.")
    parser.add_argument("--once", action="store_true", help="Drain the queue once and exit.")
    parser.add_argument(
        "--no-schedule",
        action="store_true",
        help="Serve requested crawls only; do not enqueue scheduled ones.",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=DEFAULT_INTERVAL,
        help=f"Seconds between polls (default {DEFAULT_INTERVAL}).",
    )

    return parser.parse_args(argv)


async def _run(args: argparse.Namespace) -> int:
    worker = Worker(interval=args.interval, schedule=not args.no_schedule)

    if args.once:
        completed = await worker.tick()
        log.info("Ran {count} crawl(s)", count=completed)

        return 0

    loop = asyncio.get_running_loop()

    for name in ("SIGINT", "SIGTERM"):
        signal_number = getattr(signal, name, None)

        if signal_number is None:
            continue

        try:
            loop.add_signal_handler(signal_number, worker.stop)
        except NotImplementedError:
            # Windows has no add_signal_handler; KeyboardInterrupt covers it.
            pass

    try:
        await worker.serve()
    except KeyboardInterrupt:
        worker.stop()

    return 0


def main(argv: list[str] | None = None) -> int:
    args = _parse(argv if argv is not None else sys.argv[1:])

    try:
        return asyncio.run(_run(args))
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    sys.exit(main())
