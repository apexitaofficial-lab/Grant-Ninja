# Deployment

Grant Ninja runs as two deployed pieces plus one hosted service:

| Piece | Where | What it does |
| ----- | ----- | ------------ |
| `frontend/` | Vercel | The public site and the admin panel |
| `python/` | Ubuntu server | The crawl worker — reads sources, extracts grants |
| `supabase/` | Supabase (hosted) | The database. Nothing to deploy; migrations are applied to it |

**Supabase is not deployed to either machine.** It is a managed service both
halves connect to over HTTPS. The `supabase/` folder holds the migrations,
which are the schema definition — shared by both, applied by a person.

The two halves never talk to each other directly. The admin panel writes a job
row; the worker claims it from the database. That is why the worker needs no
inbound access, no reverse proxy and no TLS certificate — it makes outbound
calls only, and nothing connects to it.

---

## Order of operations

Always, every time:

1. **Apply migrations** — from a developer machine
2. **Deploy the frontend** — Vercel, usually automatic on push
3. **Deploy the worker** — `deploy-worker.sh` on the server

Migrations first is not a style preference. Migration `0022` added functions the
admin panel calls; if Vercel ships that code before the function exists, every
click on it errors. The reverse ordering is safe — a function nothing calls yet
is harmless.

---

## One-time: Vercel

Create the project from the GitHub repo, then:

**Root Directory:** `frontend`

That single setting is what makes the monorepo work. Vercel builds only that
folder and ignores `python/` entirely.

**Environment variables** (Project → Settings → Environment Variables):

| Variable | Example | Notes |
| -------- | ------- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` | Public by design; RLS protects the data |
| `NEXT_PUBLIC_SITE_URL` | `https://grantninja.com` | No trailing slash — canonicals and sitemaps are built from it |
| `NEXT_PUBLIC_SITE_NAME` | `Grant Ninja` | |
| `SUPABASE_SECRET_KEY` | `sb_secret_…` | **Never** prefix with `NEXT_PUBLIC_`. That would publish it to every visitor's browser. |

There is no Gemini key here. Every AI call happens in the Python worker, which
holds its own. A copy on the web host would be a second place to leak it from,
protecting nothing.

`frontend/config/env.ts` validates all of these at startup, so a missing one
fails the build with a readable message rather than at runtime with a null.

---

## One-time: the Ubuntu server

Nothing listens on a port, so there is no nginx and no certificate to manage.

```bash
# A user that owns the code and nothing else
sudo adduser --system --group --home /srv/grant-ninja grantninja

sudo apt update
sudo apt install -y python3.12 python3.12-venv git

sudo -u grantninja git clone https://github.com/apexitaofficial-lab/Grant-Ninja.git /srv/grant-ninja
cd /srv/grant-ninja/python

sudo -u grantninja python3.12 -m venv .venv
sudo -u grantninja .venv/bin/pip install -r requirements.txt

# Crawl4AI drives a real Chromium — around 1GB with its system libraries.
sudo -u grantninja .venv/bin/python -m playwright install --with-deps chromium
```

Create `/srv/grant-ninja/python/.env` from `python/.env.example`:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_…
GEMINI_API_KEY=…
```

Prove it works before installing the service:

```bash
sudo -u grantninja .venv/bin/python -m app.health
```

Then install the worker:

```bash
sudo cp /srv/grant-ninja/deployment/grant-ninja-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now grant-ninja-worker
journalctl -u grant-ninja-worker -f
```

### Populate the agency list

The pipeline refuses to invent a funding body, so without this almost every
grant is held for review:

```bash
sudo -u grantninja .venv/bin/python -m app.sync_agencies
```

---

## Routine deploys

**Migrations** — from a developer machine, before anything else:

```bash
npx supabase db push
```

**Frontend** — push to `main`; Vercel builds automatically. Roll back from the
Vercel dashboard by promoting a previous deployment.

**Worker** — on the server:

```bash
cd /srv/grant-ninja && ./deployment/deploy-worker.sh
```

The script pulls, installs, refreshes Chromium, runs the health check *while
the old worker is still up*, and only then restarts. A configuration mistake
fails before the crawler goes down rather than after.

---

## Scheduling

There is no cron entry. The worker runs continuously and does its own
scheduling: every tick it enqueues any source whose cron expression has fired
since it last ran, then drains the queue.

Two consequences worth knowing:

- **Schedules are UTC.** `0 2 * * *` means 02:00 UTC, not 2am wherever the
  server is. The admin panel labels the column accordingly.
- **A missed window is caught up, not skipped.** If the server is down over
  02:00, the source is still due when it comes back. A scheduler that asked
  "is it 02:00 now?" would silently lose a day.

If you would rather use cron, `python -m app.worker --once` drains the queue and
exits — but then the admin panel's "Run crawl now" button only takes effect at
the next cron tick rather than within seconds.

---

## Checking on it

| Question | Where to look |
| -------- | ------------- |
| Is the worker alive? | `systemctl status grant-ninja-worker` |
| What is it doing? | `journalctl -u grant-ninja-worker -f` |
| What has it done? | Admin panel → Crawler → Recent runs |
| Is anything stuck? | Admin panel → Crawler → "Queued or running" |
| What is AI costing? | `ai_generation_logs` — every call is recorded |
| Detailed history | `python/logs/` — JSON, daily rotation, 30-day retention |

A crashed worker leaves its run row in `running`, which would block that source
forever because only one job per source may be active. Each tick fails anything
that has been running over an hour, so the source recovers on its own.

---

## Rolling back

**Frontend:** promote the previous deployment in Vercel.

**Worker:** `git checkout <previous-sha>` on the server, then re-run
`deploy-worker.sh`.

**Database:** there is no automatic down-migration. Every migration is additive
by design, so an older frontend runs against a newer schema without complaint —
which is what makes rolling back the code alone a safe move.
