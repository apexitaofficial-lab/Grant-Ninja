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

**Email (Resend)** — all three optional. Without them the contact form still
stores every message; it just emails nobody about it.

| Variable | Example | Notes |
| -------- | ------- | ----- |
| `RESEND_API_KEY` | `re_…` | resend.com → API Keys. Server only |
| `RESEND_FROM_EMAIL` | `hello@grantninja.com` | Must be on a domain verified in Resend — see below |
| `CONTACT_NOTIFICATION_EMAIL` | `dev@apexita.com` | Where submissions are delivered |

Resend will not send from an address on an unverified domain. Until
`grantninja.com` is added under Resend → Domains and its DNS records are in
place, the only accepted sender is `onboarding@resend.dev`, and it delivers
only to the Resend account owner's own address. That is fine for testing and
useless in production, so verify the domain before launch.

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
```

### Clone only the Python half

One repository does not mean one checkout. A **sparse checkout** puts `python/`
and `deployment/` on this machine and leaves the frontend in the repository
where it belongs — the server never renders a page, so shipping React source to
it only widens what an intruder can read and what an audit has to cover.

`--filter=blob:none` is the part that matters: with it, git never even
downloads the contents of files outside the checkout, rather than downloading
them and hiding them.

```bash
sudo -u grantninja git clone --filter=blob:none --no-checkout \
  https://github.com/apexitaofficial-lab/Grant-Ninja.git /srv/grant-ninja

cd /srv/grant-ninja
sudo -u grantninja git sparse-checkout init --cone
sudo -u grantninja git sparse-checkout set python deployment
sudo -u grantninja git checkout main
```

`deployment/` is included because `deploy-worker.sh` lives there.

`git pull` then behaves exactly as normal — it just keeps honouring the sparse
rules, so updates to the frontend cost nothing here. Confirm what landed:

```bash
ls /srv/grant-ninja        # expect: python  deployment
```

`python/` is self-contained — settings, `.env` and `logs/` all resolve inside
it — so nothing needs the rest of the tree.

```bash
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

Then create the directories the unit writes to, and install the browser where
the service user will look for it:

```bash
sudo mkdir -p /srv/grant-ninja/python/logs /srv/grant-ninja/python/.crawl4ai
sudo PLAYWRIGHT_BROWSERS_PATH=/srv/grant-ninja/.cache/ms-playwright \
  /srv/grant-ninja/python/.venv/bin/python -m playwright install --with-deps chromium
sudo chown -R grantninja:grantninja /srv/grant-ninja
```

Both steps matter, and each has bitten this deployment once:

- **Every `ReadWritePaths` entry must already exist.** `ProtectSystem=strict`
  bind-mounts them; it does not create them. A missing one fails the service
  with `status=226/NAMESPACE` *before* Python starts, so the logs say nothing
  about the worker at all.
- **Install the browser as the path says, not as whoever is logged in.** Run
  with `sudo` and an unpinned install lands in `/root/.cache`, which
  `ProtectHome=true` then hides from the service. The worker looks for a
  browser it cannot see, Crawl4AI fails, and the fetcher quietly falls back to
  plain HTTP — losing JavaScript rendering with no error that mentions
  browsers.

Then install the worker:

```bash
sudo cp /srv/grant-ninja/deployment/grant-ninja-worker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now grant-ninja-worker
systemctl status grant-ninja-worker --no-pager
```

Check `status` before moving on. `enable --now` returns silently whether the
service started or entered a restart loop, so the failure above is invisible
if you go straight to following the log.

Confirm the browser is actually reachable by the service user:

```bash
sudo -u grantninja PLAYWRIGHT_BROWSERS_PATH=/srv/grant-ninja/.cache/ms-playwright \
  /srv/grant-ninja/python/.venv/bin/python -c "from playwright.sync_api import sync_playwright
import os
with sync_playwright() as p:
    path = p.chromium.executable_path
    print(path, os.path.exists(path))"
```

It must print a path under `/srv/grant-ninja/.cache/` and `True`. Anything else
means the crawler will run, and publish, while silently fetching every page
without JavaScript.

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
