"""Deciding which sources are due.

The scheduler asks "has this source's schedule fired since it last ran?" rather
than "is it 02:00 now?". These tests pin the consequences of that choice: a
crawler that was switched off overnight catches up, a tick that runs twice does
not enqueue twice, and a broken cron expression takes down one source rather
than the run.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from scheduler.due import due_sources, is_due


def _source(frequency: str = "0 2 * * *", last_run: datetime | str | None = None) -> dict:
    return {
        "id": "source-1",
        "name": "Grants.gov",
        "crawl_frequency": frequency,
        "last_run_at": last_run.isoformat() if isinstance(last_run, datetime) else last_run,
    }


NOW = datetime(2026, 8, 20, 9, 0, tzinfo=UTC)


class TestDueness:
    def test_a_source_never_crawled_is_due_immediately(self) -> None:
        """Waiting until 02:00 to learn whether a new source works is no way to
        find out that its adapter is broken."""
        assert is_due(_source(last_run=None), NOW)

    def test_not_due_when_it_already_ran_after_the_last_firing(self) -> None:
        # Schedule fired at 02:00; it ran at 02:05.
        assert not is_due(_source(last_run=NOW.replace(hour=2, minute=5)), NOW)

    def test_due_when_the_schedule_fired_since_the_last_run(self) -> None:
        # Last ran yesterday morning; 02:00 has come round again.
        assert is_due(_source(last_run=NOW - timedelta(days=1, hours=8)), NOW)

    def test_a_missed_window_is_caught_up_not_skipped(self) -> None:
        """A machine switched off over 02:00 must still crawl when it wakes.

        This is the reason for comparing against the previous firing rather
        than checking the clock: a "is it 02:00 now?" scheduler silently loses
        a day every time the box is down at the wrong minute.
        """
        assert is_due(_source(last_run=NOW - timedelta(days=3)), NOW)

    def test_running_the_tick_twice_does_not_double_enqueue(self) -> None:
        """Second tick, same minute, after a run has been recorded."""
        source = _source(last_run=NOW.replace(hour=2, minute=1))

        assert not is_due(source, NOW)
        assert not is_due(source, NOW + timedelta(seconds=30))


class TestRobustness:
    def test_an_unreadable_schedule_is_skipped_not_treated_as_due(self) -> None:
        """Wrong either way, but "never" is recoverable and "always" is a bill."""
        assert not is_due(_source(frequency="every other tuesday", last_run=None), NOW)

    def test_a_missing_schedule_falls_back_to_the_daily_default(self) -> None:
        source = {"id": "s", "name": "x", "crawl_frequency": None, "last_run_at": None}

        assert is_due(source, NOW)

    def test_a_naive_timestamp_is_read_as_utc(self) -> None:
        """Postgres returns tz-aware strings, but a naive one must not crash."""
        assert not is_due(_source(last_run="2026-08-20T02:05:00"), NOW)

    def test_an_unparseable_timestamp_counts_as_never_run(self) -> None:
        assert is_due(_source(last_run="not a date"), NOW)


class TestSelection:
    def test_only_due_sources_are_returned(self) -> None:
        sources = [
            _source(last_run=None) | {"id": "never-run"},
            _source(last_run=NOW.replace(hour=2, minute=5)) | {"id": "already-ran"},
            _source(last_run=NOW - timedelta(days=2)) | {"id": "overdue"},
        ]

        assert [source["id"] for source in due_sources(sources, NOW)] == ["never-run", "overdue"]

    def test_an_empty_list_is_handled(self) -> None:
        assert due_sources([], NOW) == []
