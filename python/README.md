# Grant Ninja — AI data pipeline

Discovers, extracts, validates and publishes grant records from official
government sources. Design lives in `docs/MASTER_PROJECT_SPEC.md` Parts 4A, 4B
and 7B.

This is an AI-assisted ETL system, not a scraper: every stage takes structured
input and produces structured output, and no stage writes to the database
except the publisher.

## Setup

Python 3.12 is pinned by `.python-version`. Confirm it before anything else —
a venv built on the wrong interpreter is a confusing failure later.

```bash
cd python && python --version
```

```bash
python -m venv .venv && .venv/Scripts/python.exe -m pip install -r requirements.txt
```

```bash
cp .env.example .env
```

## Health check

Run this before a crawl, and after any deploy. It proves the configuration
parses, the database is reachable, the secret key can write, and the reference
data the pipeline resolves against exists.

```bash
.venv/Scripts/python.exe -m app.health
```

## Running it

Before the first real crawl, populate the agency list. The normalizer refuses
to invent an agency, so without this almost every federal grant is held for
review:

```bash
.venv/Scripts/python.exe -m app.sync_agencies
```

**The worker is what makes the admin panel's "Run crawl now" button work.**
Leave it running while you use the site locally:

```bash
.venv/Scripts/python.exe -m app.worker
```

It polls for queued crawls and enqueues scheduled ones. `--once` drains the
queue and exits (this is the form cron would call), `--no-schedule` serves only
crawls requested from the admin panel.

To crawl immediately without going through the queue:

```bash
.venv/Scripts/python.exe -m app.crawl grants_gov --limit 5 --dry-run
```

## Tests

```bash
.venv/Scripts/python.exe -m pytest
```

## Layout

| Path | Holds |
| ---- | ----- |
| `app/` | Entry points. No business logic. |
| `config/` | Typed settings, validated at startup. |
| `core/` | Logging and the Supabase client. |
| `models/` | Pydantic shapes. The gate every AI response passes through. |
| `repositories/` | The only code that knows Supabase exists. |
| `adapters/` | One module per source, isolating site-specific markup. |
| `extractors/` | Pull content out of a page. Never calls AI. |
| `processors/` | Business rules: classification, dedup, relationships. |
| `ai/` | Prompt loading, Gemini calls, JSON validation. Never touches the database. |
| `publishers/` | Insert, update, version, history. Transactional. |
| `validators/` | Checks that run before publishing. |
| `scheduler/` | Cron entry points. |

## Things worth knowing

**This process is trusted.** It authenticates with the Supabase secret key,
which bypasses Row Level Security — it writes rows no public role may write.
The key must never leave the server, and `.env` is git-ignored.

**Supabase rejects secret keys from browser-like user agents.** The client
sends an explicit `User-Agent`; without it you get a 401 with an empty body,
which is a genuinely miserable thing to debug.

**Validation is the point.** `models/grant.py` mirrors the database check
constraints, so anything that passes Pydantic will be accepted by Postgres.
Reject early and loudly rather than letting a malformed grant reach a page.

**Absence is not failure.** Government notices routinely omit the award
ceiling or the closing date. A missing value stays `None`; inventing one would
be worse than leaving it empty, and the front end already renders "Not
published" honestly.

**The auto-publish threshold is not in `.env`.** It lives in `system_settings`
so an operator can change it from the admin panel without a deploy
(decision D3, default 85).

**Postgres is the queue — there is no Redis.** The admin panel (TypeScript)
writes a job, this worker (Python) claims it with `FOR UPDATE SKIP LOCKED`, and
the one thing both already connect to is the database. A Node-only queue such
as BullMQ could not be consumed here at all, and at five sources on a daily
schedule the durability and concurrency Postgres gives for free are more than
enough. `MASTER_PROJECT_SPEC.md` §20 says the same: cron, no third-party
scheduler, with Redis and Celery listed under Future.

**A manual crawl and a scheduled one take the same path.** Both become a row in
`crawler_runs` with status `pending`. There is no separate code path for the
button, so the button cannot work while the schedule is broken, or the reverse.

**A killed worker does not block its source forever.** One pending-or-running
job per source is enforced by a unique index, so a run left open by a crash
would lock that source out. Each tick calls `reap_stalled_runs`, which fails
anything running for more than an hour.
