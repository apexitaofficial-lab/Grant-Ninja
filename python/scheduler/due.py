"""Which sources are due for a crawl.

`crawler_sources.crawl_frequency` holds a cron expression (deviation V8 — the
spec suggested free text like "daily", which cannot be evaluated). A source is
due when the most recent firing of its schedule is later than its last run.

That phrasing matters. Asking "has the schedule fired since we last ran?"
rather than "is it 02:00 now?" means a crawler that was switched off overnight
catches up on the next tick instead of silently skipping a day, and a tick that
runs twice in the same minute does not enqueue twice.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from croniter import CroniterBadCronError, croniter

from core.logging import get_logger

log = get_logger("scheduler")

DEFAULT_FREQUENCY = "0 2 * * *"


def _parse_timestamp(value: Any) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)

    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None

    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def is_due(source: dict[str, Any], now: datetime | None = None) -> bool:
    """True when this source's schedule has fired since it last ran."""
    now = now or datetime.now(UTC)
    expression = str(source.get("crawl_frequency") or DEFAULT_FREQUENCY).strip()

    try:
        schedule = croniter(expression, now)
    except (CroniterBadCronError, ValueError):
        # A malformed expression must not stop every other source from running,
        # and must not silently mean "always due" either.
        log.warning(
            "Source {name!r} has an unreadable schedule {expression!r}; skipping",
            name=source.get("name"),
            expression=expression,
        )

        return False

    last_run = _parse_timestamp(source.get("last_run_at"))

    if last_run is None:
        # Never crawled. Due immediately — waiting for the next 02:00 to see
        # whether a newly added source works at all is a poor first experience.
        return True

    previous_firing = schedule.get_prev(datetime)

    return previous_firing > last_run


def due_sources(sources: list[dict[str, Any]], now: datetime | None = None) -> list[dict[str, Any]]:
    return [source for source in sources if is_due(source, now)]
