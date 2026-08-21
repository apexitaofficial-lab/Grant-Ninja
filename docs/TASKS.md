# TASKS.md

Progress tracker for Grant Ninja.

Legend: `[x]` complete `[~]` in progress `[ ]` not started `[!]` blocked

Last updated: 2026-08-04

---

## Decisions log

Settled 2026-08-04. These are binding; revisit only with a written change note.

| # | Decision | Outcome |
| - | -------- | ------- |
| D1 | Categories per grant | Many, with one flagged primary. The primary drives the URL. |
| D2 | FAQ scope | One generic system, attachable to grant, country, category, service, about, contact. Polymorphic `faq_items` (`entity_type` + `entity_id`). |
| D3 | Auto-publish threshold | Confidence >= 85 publishes; below goes to the review queue. Stored in settings, not a constant. |
| D4 | Secondary brand colour | Emerald green, not purple. Finance/funding/growth associations. `UI_UX_DESIGN_SYSTEM.md` §4 updated. |
| D5 | Grant URLs | Global and permanent: `/grants/[slug]`. Slugs globally unique; cross-country collisions suffixed at insert. |
| D6 | Country URLs | Country is a path namespace: `/countries/[country]/...`. ISO shortcuts (`/us`, `/ie`) are 301s to the canonical form, generated from `countries.iso_code`. Whole-site prefixing (`/us/grants/...`) rejected. |
| D7 | Social profiles | All stored in settings; only the 7 primary profiles emitted in Organization JSON-LD `sameAs`. Tracking parameters stripped before storage. |
| D8 | Hardcoding | Nothing in the Site Settings contract may be hardcoded in a component. Contract defined in `types/site-settings.ts`. |

---

## Phase 1 — Bootstrap

### Repository

- [x] Create folder structure (`docs/`, `frontend/`, `python/`, `deployment/`, `scripts/`, `assets/`)
- [x] Create root `.gitignore`
- [x] Create `README.md`
- [ ] `git init` + default branch — deferred by request, to be done locally
- [ ] Create `LICENSE`

### Next.js

- [x] Next.js 15.5 + React 19 + TypeScript + App Router + Turbopack, `src/` disabled
- [x] Tailwind CSS v4
- [x] Strict TypeScript (`noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, …)
- [x] Path alias `@/*`

### Core packages

- [x] React Hook Form, Zod, `@hookform/resolvers`
- [x] TanStack Query, TanStack Table
- [x] Framer Motion, Lucide React, Sonner, date-fns, react-markdown, nuqs
- [x] `@supabase/supabase-js`, `@supabase/ssr`, `server-only`
- [ ] Recharts — deferred to the admin dashboard phase, no chart exists yet

### Code quality

- [x] Prettier + `prettier-plugin-tailwindcss`
- [x] ESLint: import sorting, unused-import removal, `no-explicit-any` as error, `eqeqeq`
- [x] `lint-staged` + `commitlint` config (scope enum matching §51)
- [!] Husky git hooks — blocked until `git init` runs. Then: `npx husky init && echo "npx lint-staged" > .husky/pre-commit`

### Project structure

- [x] `app/`, `components/`, `features/`, `hooks/`, `providers/`, `services/`, `types/`, `config/`, `constants/`, `utils/`, `lib/`
- [x] Feature folders: home, search, grants, countries, organizations, categories, services, seo, admin, crawler, shared

### Environment

- [x] `frontend/.env.example` + `frontend/.env.local`
- [x] `python/.env.example`
- [x] Zod validation in `config/env.ts`, server secrets isolated from the client bundle
- [x] Supabase connected. Both keys verified through `@supabase/supabase-js`:
      PostgREST authenticates and returns `PGRST205` (no tables yet), which is
      the expected response for an empty project.
- [x] Variables renamed to Supabase's current model:
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`
      (replacing the legacy `ANON_KEY` / `SERVICE_ROLE_KEY` names)
- [ ] Gemini key — untested until the first AI call
- [ ] Rotate all keys before launch; they were shared in plain text during setup

### shadcn/ui

- [x] Initialised (radix base, nova preset, CSS variables)
- [x] Components: button, input, textarea, dialog, card, dropdown-menu, badge, sonner, accordion, tabs, sheet, pagination, tooltip, skeleton, table, label, select, separator, breadcrumb, checkbox, popover, command, avatar, alert, field, input-group

### Design system

- [x] Blue primary / slate neutrals / emerald brand accent, success–warning–destructive tokens
- [x] Radius scale (buttons 12px, cards 16px, dialogs 20px) and three shadow elevations
- [x] Inter (body) + JetBrains Mono, loaded via `next/font`
- [x] Brand logo wired (header eager, footer lazy). The supplied `Logo.png` is a
      4500x5625 canvas that is ~85% white padding, so `public/logo-wordmark.png`
      (1200x411) is generated from it. The original is kept as the print source.
- [x] Favicon from the supplied `favicon.png`, cropped and squared into
      `app/icon.png` (512) and `app/apple-icon.png` (180). The create-next-app
      `favicon.ico` was removed so it cannot take precedence.
- [x] `--primary` set to the logo navy #104577 = `oklch(0.385 0.101 251.4)`

### Global layout

- [x] `Container`, `PageHeader`, `SiteHeader` (sticky), `MobileNav` (drawer), `SiteFooter`, `Logo`
- [x] Root layout: metadata defaults, OpenGraph, Twitter card, viewport, skip-to-content link
- [x] `not-found.tsx`, `error.tsx`, `loading.tsx`
- [x] Providers: nuqs adapter, TanStack Query, Tooltip, Toaster
- [ ] Homepage — placeholder only, real implementation is Phase 3

### Shared services

- [x] Structured JSON logger (`lib/logger.ts`)
- [x] `AppError` + `ActionResult` contract (`lib/errors.ts`)
- [x] `BaseRepository` with pagination and error translation
- [x] Supabase browser / server / service-role clients
- [x] URL sanitiser stripping `utm_*`, `_gl`, `gclid`, `fbclid` and friends (`lib/url.ts`)
- [x] Country-aware route map + ISO shortcut resolver (`config/routes.ts`)
- [x] Social profile seed, primary vs secondary (`config/social-profiles.ts`)
- [x] Site Settings contract (`types/site-settings.ts`)
- [ ] HTTP client — not needed until an external integration exists

### Verification

- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] `npm run format:check` passes
- [x] `npm run build` passes
- [x] Dev server renders (header, footer, skip link, metadata all present)

---

## Phase 2 — Database

The original table-by-table planning list lived here and has been removed: it
was still showing as outstanding long after every table was built and applied,
which made this document lie about the state of the project. The completed
migration list below is the record.

- [x] Architecture document with ERDs, every column, index, FK and RLS policy
- [x] `0001` extensions + 14 enum types
- [x] `0002` shared trigger functions (touch, polymorphic guard, slugify)
- [x] `0003` countries, states
- [x] `0004` organizations + organization_count trigger
- [x] `0005` grant_categories (hierarchical), grant_tags
- [x] `0006` grants — checks, generated tsvector, 12 indexes
- [x] `0007` `grant_category_relations` with one-primary partial unique index (D1),
      tag joins, documents, sources, grant_count triggers
- [x] `0008` grant_ai_content, answer capsules, polymorphic `faq_items` (D2)
- [x] `0009` grant_versions, grant_history, ai_generation_logs — append-only
- [x] `0010` seo_metadata, schema_markup, same_as_profiles, seo_redirects
- [x] `0011` crawler sources, queue, pages, runs, duplicate_detection
- [x] `0012` admin_users, system_settings, audit_logs, contact_messages, media
- [x] `0013` RLS on all 30 tables — role helpers plus the three tiers
- [x] `0014` seed: 5 countries, 10 categories, 14 sameAs profiles (D7),
      19 settings including the 85 threshold (D3, D8), static-page FAQs
- [x] `0015` table GRANTs for anon/authenticated; new accounts start `inactive`
- [x] Applied to Supabase 2026-08-19. Verified live: 30 tables, 54 policies,
      103 indexes, 14 enums, 37 triggers, RLS enabled on all 30
- [x] `frontend/types/database.ts` generated; `Database` generic threaded through
      all three Supabase clients; file excluded from ESLint and Prettier
- [x] RLS verified end to end with the publishable key — public tables readable,
      10 of 19 settings visible with 0 private leaked, all 10 admin/service
      tables blocked, anonymous contact insert accepted, anonymous update denied
- [ ] Promote the first `super_admin` (see `supabase/README.md`) — needs a real
      account to exist first

Open questions Q1–Q5 resolved with the documented defaults: cross-currency
grants allowed, state sections auto-hidden, country-slug suffix for collisions,
`viewer` role included but unassigned, 90-day retention on `ai_generation_logs`.

---

## Phase 3 — Frontend features

- [x] Grants repository → service → listing → detail page, end to end against live data
- [x] Route groups: `(public)` for marketing and grants
- [x] Signature component — the deadline meter (`features/grants/components/deadline-meter.tsx`)
      encoding the application window; all five states verified against seeded data
- [x] Grant card, key-facts table, empty state, sort control (URL state), pagination
- [x] Breadcrumbs on the detail page
- [x] Dev seed: 5 agencies, 6 grants, AI summaries, answer capsules
      (`supabase/seed/dev_sample_grants.sql` — not a migration)
- [x] Grant FAQs wired via a shared polymorphic `FaqRepository` + `FaqSection`
      (reused on grant, country, category, agency and static pages)
- [x] Keyword search over the weighted tsvector — debounced, URL-backed, shareable
- [x] Directories: `/countries`, `/categories`, `/agencies`
- [x] Detail pages: `/countries/[country]`, `/categories/[slug]`, `/agencies/[slug]`
      with scoped listings, stat rows, FAQs and breadcrumbs
- [x] Homepage: search-led hero, live stats, closing-soonest, browse by
      category and country, funding CTA, FAQ
- [x] Shared components: `DirectoryCard`, `StatRow`, `EntityBreadcrumb`,
      `FaqSection`, `GrantResultList`
- [x] Filter system, server side — application window (open / closing within 14
      days / not yet open / closed), funding source (federal / state / private),
      award-ceiling bounds, multi-select categories (OR). All 13 combinations
      verified against live data, including reversed bounds being dropped
      rather than returning nothing.
- [x] Shared `useQueryParams` hook so sort, search and filters write URL state
      one way and cannot disagree about resetting pagination
- [x] Pagination now rebuilds the whole query string — it previously dropped
      every active filter, so page 2 of a filtered list showed unfiltered results
- [x] State pages `/countries/[country]/states/[state]`, with 5 real US states
      seeded and 2 grants scoped to them. Cross-country mismatches 404.
- [x] **Filter hydration defect — fixed.** Cause was
      `app/(public)/grants/(index)/loading.tsx`. That route-level boundary made
      the page's Suspense content stream into a hidden container that never got
      moved into place, so no client component on the route hydrated — filters,
      search and sort all rendered as dead HTML, with no error in the console
      or the server log. The tell was React's `<!--$~-->` marker with the
      fallback still in the DOM.
      Found by bisection: removing the panel and the drawer changed nothing,
      which ruled out the components and pointed at the route. `loading.tsx`
      was the only route-level boundary in the entire app, and `/grants` was
      the only page that failed.
      Deleting it fixed hydration immediately. Verified live: uncheck a facet,
      OR-combine categories, clear all, debounced search, clear search, and the
      mobile drawer — every one updates the URL and the results.
      Do not re-add a route `loading.tsx` without re-verifying hydration; the
      reason is written up in `frontend/README.md`.
      Also kept from the investigation: `useQueryParams` now takes the query
      string as a prop instead of calling `useSearchParams()`, which removes
      the client-render bail-out entirely.
- [x] Marketing pages: `/about`, `/services`, `/contact`
- [x] Contact form: shared Zod schema validated on both sides, Server Action,
      database-backed rate limit (5 per IP per hour), Sonner feedback.
      Verified end to end — row inserted, 6th submission refused and logged.
      Contact details render from settings and are hidden while empty.

Bugs found and fixed while building this slice:

| | |
| - | - |
| `PGRST108` on related grants | Filtered on a table nested two levels behind an alias. Split into two queries. |
| Related-grant failure blanked the page | `getRelatedGrants` now degrades to an empty section and logs. |
| Closed grants sorted first under "Closing soonest" | That sort now excludes passed windows; they stay reachable elsewhere. |
| Missing slug returned 200, not 404 | A `loading.tsx` above `[slug]` flushed the shell early. Scoped it to the listing with a `(index)` route group. |
| Headings rendered in serif | Font variables were on `<body>` while `font-sans` applies to `<html>`. |
| Footer overflowed on mobile | Seven social links in a non-wrapping flex row. |
| Agency page looked empty despite having a grant | "Closing soonest" hides passed windows. Scoped pages now default to "Recently added", and the empty state explains the filter and offers a way past it. |
| `service_role` had no table privileges | Migration `0015` granted `anon` and `authenticated` but not `service_role`. The secret key bypasses RLS, which is easy to mistake for "can do anything" — it still needs GRANTs. Fixed in `0017`, including default privileges so a new table cannot break the pipeline the same way. **This would have blocked every write from the Python pipeline.** |
| Database errors logged as `[object Object]` | `PostgrestError` is a plain object, not an `Error`, so `String(error)` discarded the only useful diagnostic. The logger now serialises plain objects and unwraps `AppError.cause`. |
| Duplicate detection would have merged Phase I into Phase II | `CERTAIN_MATCH` was 95; measured, that pair scores **98.8** — the two titles are one roman numeral apart and are different opportunities with different deadlines and budgets. Fuzzy scores near the top of the range say "these strings are alike", never "these grants are the same". Raised `CERTAIN_MATCH` to 99 and added a discriminator rule that vetoes a merge whenever a phase, fiscal year, track, round or cohort token disagrees, whatever the score. Found by measuring the thresholds instead of trusting them. |
| Login route returned 500 | A `"use server"` module may only export async functions — every export becomes a callable endpoint. Exporting the Zod schema from the actions file failed at runtime with "can only export async functions". Typecheck and lint both passed; only running the page caught it. Schema moved to `features/admin/schemas/`. |
| Pagination dropped active filters | Page links were built as `?sort=&page=`, so page 2 of a filtered list returned unfiltered results. Now rebuilt from the full query string. |
| `/llms.txt` and `/sitemap.xml` silently served fallback bodies | Both declare `revalidate` but call `cookies()` through the Supabase client, so static generation fails at build time and the catch serves the minimal fallback. They work at runtime because Next marks them dynamic, but the caching intent is currently a no-op. **Not yet fixed** — needs a cookie-free Supabase client for public generated files. |

---

## Phase 4 — Python AI pipeline

- [x] **Unblocked.** This was never a missing prerequisite: Python 3.13 was
      already installed and pyenv was pinned globally to 3.10.10, so every
      shell got 3.10. 3.12.10 installed and pinned to `python/` via
      `.python-version`, leaving the rest of the machine on 3.10.
      Note for future reference: `cd "D:\..."` from a `C:\` prompt in cmd.exe
      changes D:'s directory but leaves the shell on C:, so the first
      `pyenv local` wrote `.python-version` into the home folder instead of
      the project. Use `cd /d`, or run it from a shell already on D:.
- [x] Virtual environment on 3.12.10 + pinned `requirements.txt`
- [x] Core dependencies: Pydantic 2, pydantic-settings, Loguru, supabase,
      RapidFuzz, tenacity, httpx, BeautifulSoup, lxml
- [x] `config/settings.py` — typed settings validated at import, so a missing
      key fails immediately rather than as an auth error mid-crawl
- [x] `core/logging.py` — human-readable console sink, JSON file sink with
      daily rotation and 30-day retention, every record tagged with its stage
- [x] `core/database.py` — Supabase client with an explicit `User-Agent`,
      without which Supabase rejects the secret key with an empty-bodied 401
- [x] `models/grant.py` — `ExtractedGrant` and `NormalizedGrant`, mirroring the
      database check constraints so anything passing Pydantic is accepted by
      Postgres. 16 tests covering inverted ranges, reversed dates, negative
      funding, out-of-range confidence, bad URLs, keyword cleaning, the
      one-primary-category rule (D1), and unknown-field handling.
- [x] `repositories/` — base with PostgREST error translation, plus reference
      lookups that fuzzy-match agency and category names (RapidFuzz) instead of
      creating a duplicate agency per spelling
- [x] `app/health.py` — startup check. **Write access on `crawler_runs`
      confirmed from Python**, which independently verifies the `service_role`
      grants from migration 0017.
- [x] `supabase/seed/crawler_sources.sql` — five real US sources; only
      Grants.gov is `active`, the rest wait for their adapter
- [x] Crawl4AI + Playwright installed, Chromium headless shell downloaded
- [x] `core/robots.py` — robots.txt honoured, per-host cached, and the site's
      own `Crawl-delay` wins when it is longer than ours
- [x] `core/hashing.py` — SHA256 over whitespace-normalised content, so a page
      that only re-indented its HTML does not trigger a paid re-extraction
- [x] `services/fetcher.py` — Crawl4AI primary, httpx fallback, per-host locks
      and throttling so concurrent sources never overlap on one server
- [x] `extractors/content.py` — boilerplate, markdown-image and data-URI
      stripping before anything reaches AI
- [x] `app/fetch_probe.py` — rehearse a single URL without writing anything
- [x] **Verified against the live grants.gov site.** Three real problems found
      by running it, all fixed:
      (1) the first fetch returned 2,830 characters that were almost entirely
      base64 icon data — it would have been paid for on every page forever;
      (2) the page redirects and hydrates after first paint, so reading the DOM
      too early raised "the page is navigating and changing the content" and
      the re-fetch failed outright — fixed with `wait_until="networkidle"`;
      (3) the `.gov` trust banner appears on every federal page and was being
      sent to the model.
      After the fixes: 19,932 characters of clean readable content, 29 internal
      links, a stable hash across runs, and a second fetch correctly reporting
      `unchanged` — which is change detection working end to end.
- [x] 26 Python tests (10 new for markdown cleaning, boilerplate and hashing),
      including that a long eligibility paragraph mentioning "privacy policy"
      is *not* mistaken for a cookie banner
- [x] Gemini layer, verified end to end against the live API
- [x] `ai/prompts/grant_extraction.v1.md` — versioned prompt file with front
      matter. Prompts are files, not string literals, so a non-engineer can
      improve them and a diff shows exactly what changed.
- [x] `ai/prompt_loader.py` — resolves the highest version by default, or a
      pinned one for reproducible regeneration. The resolved version is stored
      with every output, so a prompt fix can find the records it should redo.
- [x] `ai/gemini.py` — structured output via `response_schema` bound to the
      Pydantic model, so the model returns a conforming object rather than
      prose to salvage. Temperature 0: extraction is reading, not writing.
      Retries only transient errors; a 4xx is surfaced immediately.
- [x] `ai/extraction.py` — the publish-or-review decision, with the threshold
      injected from `system_settings` (D3), never hardcoded
- [x] `repositories/ai_logs.py` — every call recorded for cost monitoring.
      Logging failures are swallowed: losing a usage row must never abandon a
      successful extraction.
- [x] **`gemini-2.5-flash` is dead for new API keys.** The live API returned
      404 naming `gemini-3.6-flash` as the replacement. Updated in `.env`,
      `.env.example`, the settings default and `system_settings.gemini_model`.
      The API key itself was fine all along.
- [x] Verified on two real pages:
      `grants.gov/search-grants` → confidence 0, correctly identified as a
      search page, discarded rather than queued (queueing it would waste a
      reviewer's time);
      `seedfund.nsf.gov` → "America's Seed Fund", NSF, up to $2,000,000,
      confidence 60 with the honest reasoning that it is a programme overview
      rather than a dated notice — held for review on two independent grounds.
      Three usage rows written to `ai_generation_logs`, including the failure.
- [x] 38 Python tests (12 new for the decision logic and prompt loader),
      including that the threshold is injected rather than baked in, and that
      an empty page costs no AI call at all
- [x] `processors/duplicates.py` — the ladder: content hash → source URL →
      RapidFuzz title → Gemini, cheapest test first and the paid one only for
      the narrow band where the cheap tests genuinely cannot decide
- [x] **Thresholds calibrated against measured scores, not guessed.** The
      original `CERTAIN_MATCH = 95` would have merged "…Phase I" into
      "…Phase II", which score 98.8 against each other. Fuzzy similarity near
      the top of the range means "these strings are alike", never "these grants
      are the same". Now 99, with a discriminator veto for disagreeing phase,
      fiscal year, track, round or cohort tokens. Measured decisions:

      | score | decision | pair |
      | - | - | - |
      | 98.8 | new (discriminator) | Phase I vs Phase II |
      | 96.4 | new (discriminator) | Track A vs Track B |
      | 95.5 | new (discriminator) | Fund 2025 vs Fund 2026 |
      | 92.8 | → Gemini | word-order variants of one title |
      | 34.7 | new (rapidfuzz) | unrelated grants |
      | 100.0 | update (rapidfuzz) | same title, whitespace differs |

- [x] `processors/normalizer.py` — names to foreign keys, globally unique slugs
      per D5, suffixed by country then agency so a collision stays readable
- [x] `supabase/migrations/0018_publish_grant_rpc.sql` — grant, categories,
      version and history written in one transaction. PostgREST cannot span
      statements, so a half-written grant was possible until this existed.
- [x] `publishers/grant_publisher.py` — an ambiguous pair is held as a draft
      rather than published or discarded: publishing risks a visible duplicate,
      discarding loses a real opportunity, a draft does neither
- [x] `app/publish_probe.py` — **verified against the live database**: first
      write created 1 version, 1 history row and 1 category link; an unchanged
      re-publish stayed at 1 version; a changed one produced 2. Version history
      therefore records real edits, not crawl frequency. Probe rows removed.
- [x] 58 Python tests (20 new for the ladder, discriminators and slugs)
- [ ] **Known limitation — acronym expansion.** "AI Research Institutes" vs
      "Artificial Intelligence Research Institutes" scores 64.6, below the
      78 floor, so it never reaches Gemini and would produce two records. The
      source-URL check catches the common case (an agency re-listing the same
      page), so this only bites when two agencies describe one programme
      differently. Lowering the floor would send a large volume of unrelated
      pairs to a paid model; the better fix is an acronym expansion pass before
      scoring. Left deliberately, not overlooked.
- [x] `adapters/base.py` — an adapter answers one question, *which URLs on this
      site are worth reading?* Everything else is identical per source, so a
      new portal is a discovery rule rather than another copy of the pipeline.
- [x] `adapters/grants_gov.py` — **verified against the live site.** Discovery
      uses the JSON search service the grants.gov UI itself calls, after
      checking the alternatives: the public API needs a key (401), the
      simpler.grants.gov sitemap is broken (it serves `http://localhost:3000/…`
      — their bug, not ours), and the search page renders client-side so
      scraping it would mean driving a browser through pagination for data the
      site already publishes as JSON. One request returns ids, titles, agencies
      and dates for 1,104 open opportunities. The endpoint is undocumented, so
      discovery failing is recorded as a failed run rather than reported as
      zero results — a source that quietly finds nothing looks exactly like a
      quiet day.
- [x] `services/pipeline.py` — discover → fetch → clean → extract → normalize →
      deduplicate → publish. One bad page never ends a run; its failure is
      counted, written into the run log and the crawl continues.
- [x] `repositories/sources.py` + `app/crawl.py` — every crawl opens and closes
      a `crawler_runs` row, so a crashed crawl is visible in the admin panel
      instead of silently producing nothing
- [x] `app/sync_agencies.py` — **the pipeline was unusable without this.** The
      normalizer refuses to invent an agency, correctly, but only five were
      seeded, so every real federal grant was held for review. Grants.gov
      publishes its own agency hierarchy in the search facet; those names come
      from the system of record, not from a model, so seeding from them fixes
      the gap without weakening the rule. 143 agencies added.
- [x] Agency matching rebuilt around two measured failures: fuzzy scoring puts
      "NASA" and "National Aeronautics and Space Administration" at about 30,
      and "Bureau of African Affairs, Department of State" at 70 against the
      stored name. Added acronym matching and leading-part probing. The trailing
      part is deliberately *not* probed — an unrecognised bureau must be held,
      not filed under its parent department, which would look correct and be
      wrong.
- [x] **Crawled the live site end to end**: 4 grants written with agencies,
      amounts, deadlines and version history, no duplicates, 0 errors.
- [x] 79 Python tests (21 new for agency matching and change detection)
- [x] **Scheduler and worker — Postgres is the queue, no Redis.** The admin
      panel writes a job, the Python worker claims it with
      `FOR UPDATE SKIP LOCKED`. That boundary is the reason: the producer is
      TypeScript and the consumer is Python, and the one thing both already
      connect to is the database. BullMQ was raised as a comparison — it is
      Node-only, so a Python worker could not consume it at all; the equivalent
      would be Celery or RQ plus Redis, which is a second service to run and
      monitor for five sources on a daily schedule. `MASTER_PROJECT_SPEC.md`
      §20 agrees: cron, "no third-party scheduler is required", Redis and
      Celery under Future. Revisit at multiple worker machines or thousands of
      jobs a minute.
- [x] Migration `0021` — `request_crawl` and `claim_crawler_run`, plus a
      partial unique index allowing **one pending-or-running job per source**,
      so a repeated click is a no-op rather than twenty queued crawls.
      `request_crawl` is `SECURITY DEFINER` and checks the caller's role
      itself: `crawler_runs` has no write policy for any role, deliberately, so
      that run history cannot be rewritten through the API — a general INSERT
      policy would have traded that guarantee away to make a button work.
- [x] `reap_stalled_runs` — the one-job-per-source index means a run left open
      by a killed worker would lock that source out permanently. Each tick
      fails anything running over an hour.
- [x] `scheduler/due.py` — a source is due when its cron expression has fired
      *since it last ran*, not when the clock reads 02:00. A machine switched
      off overnight therefore catches up instead of silently losing a day.
- [x] `app/worker.py` — one command (`python -m app.worker`) serves both the
      button and the schedule. There is no separate code path for the button,
      so it cannot work while the schedule is broken, or the reverse.
- [x] **"Run crawl now" in the Crawler Center**, verified end to end against a
      temporary editor account, since deleted: queued a 2-page manual crawl,
      the row appeared as `manual · waiting for worker · pending`, the worker
      claimed it, ran it and updated a grant in place. The wording throughout
      says *queued*, never *crawling* — the crawl happens in another process,
      and a confident spinner would be a lie the page cannot detect. The panel
      warns when no worker has been seen for 24 hours, but never blocks
      queuing.
- [x] **Pause / activate a source**, deliberately asymmetric. Pausing is always
      available: a site that starts blocking the crawler has to be stoppable
      immediately, and it changes nothing else — grants already collected stay
      published. Activating is refused when no adapter is registered, because
      the scheduler would otherwise queue crawls the worker can only fail, and
      a button that quietly creates failing jobs is worse than no button.
      The check lives in the action as well as the UI: the button can be
      disabled, but an action must not trust that it was.
      An empty adapter list means no worker has reported in, which is treated
      as *unknown* rather than *none* — refusing every activation because a
      worker is down would be its own kind of wrong, and the page says so.
- [x] Toggling is `admin`, not `editor`, matching what the action enforces —
      otherwise an editor sees a control that bounces them to the dashboard.
- [x] **Verified end to end.** Pausing and reactivating Grants.gov both landed
      in the database. Reaching the server guard needed care: React checks
      `disabled` in its own props, so flipping the DOM attribute never invoked
      the handler and an early "the guard held" reading was actually "the click
      never ran" — the two look identical from the database. Invoking the
      handler through React directly produced the real refusal: *No adapter
      named "nasa" is registered, so this source would queue crawls that fail.*
      All five sources restored to their original state.
- [x] Schedule column made human-readable — `cronstrue` renders "At 05:00, only
      on Monday" with the cron expression kept underneath, since that is what
      an operator edits and what the scheduler evaluates. The zone is in the
      column header because the scheduler compares against UTC, and "02:00"
      read as local time is simply wrong about when a crawl runs. A malformed
      expression falls back to the raw text in red rather than throwing and
      taking the page down with it.
- [x] Crawler Center stats now read `grants` and `crawler_runs` instead of
      `crawler_pages` and `crawler_queue`, which nothing writes — four
      permanent zeros beside a paragraph explaining the cost lever. A stat that
      cannot move is worse than no stat.
- [x] 98 Python tests (11 new for scheduling)
- [x] The worker publishes its registered adapter keys to
      `system_settings.registered_adapter_keys` on every tick. The adapters are
      Python and the admin panel is TypeScript; a hardcoded copy in the UI
      would be wrong the first time an adapter was added and nobody remembered
      to update it, and the symptom would be an operator activating a source
      that can only fail. Written every tick rather than at startup so removing
      an adapter is reflected too.
- [ ] Monitoring beyond the run table (alerting on repeated failures)
- [x] **Category coverage — resolved with an "Others" fallback** (owner's
      decision). Every crawled grant was being held as a draft because none of
      the ten seeded categories fitted a feed full of victim services, foreign
      assistance and public health, and the database correctly refuses to
      publish without one. Migration `0019` adds the catch-all and names it in
      `system_settings.fallback_category_slug`, so it can be repointed from the
      admin panel, and clearing the setting restores the previous
      hold-for-review behaviour without a deploy.
      The fallback applies **only** when nothing else matched — it never joins
      or displaces a real category, so it cannot dilute one — and its use is
      written into the run log rather than applied silently.
      Result: 3 of the 4 crawled grants went live. The fourth is still held at
      confidence 80 against the threshold of 85, which is the right
      distinction: the fallback fixes a classification gap, not a confidence
      one.
      **Watch the size of "Others".** A large one means the taxonomy needs
      extending, not that the fallback is working. Grants.gov's own
      `fundingCategories` facet is the obvious source when that time comes:
      Arts, Business and Commerce, Community Development, Consumer Protection,
      Disaster Prevention and Relief, Employment/Labor/Training, and more.

Bugs found by running the pipeline against the live site, all fixed:

| | |
| - | - |
| Every crawl re-extracted unchanged grants | **The biggest one.** Grants.gov renders its "Eligible Applicants" list in a different order on every request, and it is a markdown table, so the row label and trailing separator attach to whichever value lands first and last. Three of four pages hashed differently between fetches seconds apart with byte-identical content. The change-detection hash — the single biggest cost lever in the project — was defeated on nearly every page, and it would have shown up only as an unexplained Gemini bill. The hash now compares a sorted multiset of table cells. Verified stable against the live pages. |
| A re-crawl created a second row for the same grant | The publish function keys on slug, but the normalizer assigns a slug *before* duplicate detection runs, so on a re-crawl it found its own previous row holding the base slug and minted `…-united-states`. Duplicate detection correctly said "update"; the write inserted anyway. The duplication the whole ladder exists to prevent, arriving through the back door. The publisher now resolves the existing row's slug before updating. |
| Nothing could ever auto-publish | Content cleaning strips URLs before the prompt — they cost tokens and the model has no use for them — but the publish gate requires an official source URL, so the model could never supply what the gate demanded. The crawled page is itself the government notice, so it is now used as the source when the model finds nothing more specific. |
| A quota refusal was recorded as "not a grant" | An unread page counted the same as a page correctly identified as not being a grant, so pages nobody looked at were quietly written off. Extraction failures now count as errors. |
| Run counters reported the wrong thing | "Held for review" counted the status the pipeline *asked* for, not the one written, so grants the normalizer downgraded to drafts were reported as live. It also conflated "written as a draft" with "nothing written at all"; those are now separate counters. |
| Category counts went stale whenever a grant was published | `trg_grants_sync_counts` fires on a status change but refreshes only countries, states and organizations; categories were refreshed only when a *relation* changed. The pipeline writes a grant and its categories in one transaction so it never showed there — but the admin review queue does the opposite, publishing a draft whose categories are already attached, so **the very workflow the review queue exists for would have left every count wrong**. Migration `0020` makes a status change refresh the grant's categories too, and backfills. Found because a facet read "Others 2" beside three grants. |
| A grant advertised a $0 minimum award | Notices that give a ceiling but no floor make the model report the floor as 0, and the card rendered "$0.0 – $1.2M" while the MonetaryGrant JSON-LD published `minValue: 0` to Google and to any assistant reading the page — a false claim about the grant, not merely an ugly one. Zero amounts are now stored as unstated, and the UI's existing "Up to $1.2M" wording takes over. |
| The `.gov` trust banner survived cleaning | It arrives as one ~165-character line combining two sentences, and the boilerplate filter only considered lines under 90 characters — a guard that correctly protects long eligibility paragraphs. Verbatim government-template phrases are now stripped at any length, keyword matches still only on short lines. |

---

## Phase 5 — Admin

- [x] Public chrome moved from the root layout into `(public)`, so the admin
      portal does not inherit the marketing header, footer or their queries
- [x] Middleware: session refresh on every request (tokens expire otherwise),
      plus the authentication gate on `/admin`. Uses `getUser()` rather than
      `getSession()` so the token is revalidated, not read from a cookie.
- [x] Two-layer authorization — middleware answers "who are you" with no
      database round trip; the `(dashboard)` layout answers "may you be here"
      via `requireAdmin()`. RLS enforces it a third time at the data layer.
- [x] Sign-in and sign-out Server Actions. Failed logins are deliberately vague
      about which half was wrong; the redirect target is restricted to
      same-site `/admin/` paths so the form cannot become an open redirect.
- [x] Login screen, admin shell (role-filtered sidebar + top bar), dashboard
- [x] Dashboard reads real operational data — attention counters first
      (awaiting review, unverified, closing soon, unread messages), then
      inventory by status, pipeline health, recently updated grants
- [x] Verified end to end against a temporary account, since deleted:
      inactive account refused with a clear message · promotion to
      `super_admin` grants access · dashboard renders live counts
      (Published 6, Unverified 6, Closing soon 1) · sign-out clears the
      session · `/admin` and `/admin/settings` both 307 to login afterwards,
      with `?next=` preserved · deleting the auth user cascaded the
      `admin_users` row away
- [x] Crawler Center (`/admin/crawler`) — sources with adapter, schedule,
      delay and robots policy; recent runs; and the change-detection cache
      stats. Read-only by design: those tables have no write policy for any
      role, so a run history cannot be rewritten through the UI.
- [x] **Grant list and editor** (`/admin/grants`, `/admin/grants/[id]`). The
      list opens on "Needs review" rather than "All": the pipeline holds
      anything it is unsure about, so that queue is the actual work, while a
      list of everything is a reference. A grant with no category is called out
      in red because that is what blocks publication.
- [x] **Migration `0022` — a versioned write path for human edits.** Nothing
      writes `grant_versions` or `grant_history` automatically; there is no
      trigger, and the pipeline creates them explicitly inside `publish_grant`.
      An admin editing through PostgREST would have changed the grant and
      written neither, leaving the audit trail with a hole exactly where human
      decisions happen — the changes most worth being able to explain later.
      Both tables are also read-only for `authenticated` on purpose, so the
      panel could not write them directly anyway. `admin_save_grant`,
      `admin_set_grant_status` and `admin_delete_grant` are the narrow,
      role-checked exceptions, each writing the grant *and* its trail in one
      transaction.
- [x] The editor shows provenance before the form — confidence, version,
      categories, and a link to the original notice — because the reviewer's
      job is to check the extraction against the source, not to admire it.
- [x] Publishing is disabled without a category rather than attempted and
      rejected: the constraint is real, so the button reflects it beforehand.
- [x] Deleting is `admin`, editing and publishing are `editor`. Deletion is
      soft — the row stays for the audit trail.
- [x] **Verified end to end** against a temporary account, since deleted: as a
      real signed-in user (publishable key, so RLS and the role checks applied
      exactly as in the panel) an edit produced version 2 and a history row, a
      publish set `published_at` and produced version 3, and the trail read
      `admin updated` / `admin published` / `crawler created` in order. Then
      repeated through the UI itself: the Publish button recorded the reviewer's
      note verbatim against `performed_by_type = admin`.
- [ ] Bulk actions on the review queue (approve several at once)
- [x] **Countries, Categories and Agencies** (`/admin/countries`,
      `/admin/categories`, `/admin/agencies`) — expandable rows rather than
      separate edit pages: these are short records, there are 148 agencies, and
      the common task is correcting one field. Agencies are searchable and
      paginated because a list of 148 is unusable otherwise.
- [x] **Migration `0023`/`0024` — renaming a slug no longer breaks the web.**
      All three have public URLs. Editors could already update those rows, so
      the panel could simply change a slug and 404 every existing link,
      bookmark and search result pointing at the old address — silently.
      `seo_redirects` was built for exactly this and was, until now, empty and
      unread by anything. `admin_rename_slug` writes the redirect in the same
      transaction as the rename, so it cannot half-happen. Redirect chains are
      flattened rather than left to hop, because each hop loses ranking signal.
      The public path is passed in from `config/routes.ts` rather than rebuilt
      in SQL, so the URL shape stays defined in one place.
- [x] **`lib/redirects.ts` + middleware — the redirects are actually served.**
      Writing redirect rows nothing reads would have been worse than not
      writing them. Cached for 60 seconds in the middleware instance, because
      middleware runs on every request and a database round trip per request is
      not affordable; the cost is that a rename takes up to a minute to take
      effect, which is right for something nobody does twice in an hour.
      A failed load caches empty briefly rather than retrying every request —
      hammering a database that is already down makes the outage worse.
- [x] **Bug found by testing, fixed in `0024`: renaming back to a previous name
      failed outright.** Renaming `others` → `uncategorised` → `other-grants` →
      `others` made the chain-flattening step point `/categories/others` at
      itself, which the `ck_seo_redirects_not_self` constraint correctly
      refused — taking the whole transaction with it. Renaming something and
      then changing your mind is an obvious thing to do, and it was impossible.
      Two rules were missing: an address that is live again must not redirect
      away from itself, and flattening must not leave a row pointing at itself.
- [x] **Verified end to end**: the full rename round trip as a real signed-in
      editor, then `curl` against the running site — `/categories/other-grants`
      returned **301** to `/categories/others`, the live page returned **200**,
      and query strings carried over. Test redirects removed afterwards.
- [ ] Creating and deleting countries, categories and agencies (editing only,
      for now — the pipeline creates agencies, and deleting one with grants
      attached needs a reassignment flow rather than a delete button)
- [ ] AI Center (Gemini cost and failure monitoring from `ai_generation_logs`)
- [ ] SEO Center (redirects table, per-page metadata overrides)
- [x] **Duplicate review queue** (`/admin/duplicates`) — closes a loop that was
      silently broken: the pipeline wrote `duplicate_detection` rows whenever
      its ladder could not decide, and nothing displayed them, so a flagged
      pair waited forever and the grant held beside it stayed a draft
      indefinitely. The detection worked; only the last step was missing.
- [x] The pair is shown side by side with **differing fields highlighted**.
      That is the whole job of the screen — two grant records are mostly
      identical text, and a reviewer scanning two paragraphs for the one
      changed date will miss it. Showing what differs turns reading into a
      glance.
- [x] Migration `0025` — `admin_resolve_duplicate` writes the verdict and the
      losing grant's fate in one transaction. A verdict recorded without the
      archive would leave a visible duplicate the queue claims to have handled,
      which is worse than not resolving it, because nobody looks twice.
      Archived rather than deleted: the source URL is what stops the crawler
      rediscovering it as new on the next run.
- [x] Both sides get a history entry — the archived one records why it went,
      the survivor records that it absorbed another record. Discoverable from
      either grant rather than only from the one that disappeared.
- [x] **Verified end to end** against a seeded pair of genuinely similar OVC
      grants: "not duplicates" recorded the verdict with actor and timestamp
      and left both published; merging archived the loser, bumped it to v3,
      wrote a version snapshot and left `admin archived` on one side and
      `admin duplicate_resolved` on the other. All test data removed and the
      grants restored to published.
- [ ] Audit log viewer (`audit_logs`)
- [ ] Recharts for the dashboard trend charts (not installed yet)
- [x] **Site Settings** (`/admin/settings`) — decision D8, twenty settings
      across branding, contact, SEO/LLMO, AI pipeline, crawler and analytics,
      plus the fourteen social profiles.
- [x] `features/admin/config/settings-fields.ts` describes every editable
      setting once — key, kind, help text — and the form, the validation and
      the save path are all generated from it. Adding a setting is one entry
      rather than three files that drift. Keys absent from the descriptor are
      ignored by the save path rather than trusted.
- [x] **Coercion is driven by the descriptor, not guessed from the value.**
      `system_settings.value` is `jsonb` and the types differ per key, while a
      form submits strings for all of them. A boolean stored as the string
      `"true"` is truthy in JavaScript, so robots.txt would keep working right
      up until someone switched indexing off and nothing happened. Verified by
      round-tripping the whole SEO group and asserting the *types*: bool stayed
      bool, array stayed array, ints stayed ints.
- [x] Social URLs are stripped of tracking parameters before storage, per the
      agreed rule, and the field says so rather than silently rewriting what
      was typed. Verified: pasting a LinkedIn URL with `utm_source`,
      `utm_medium` and `fbclid` stored the clean original and reported
      "Tracking parameters removed."
- [x] The sameAs/footer split is explained in the page rather than assumed —
      only high-authority profiles belong in Organization structured data (D7),
      and a profile can be linked in the footer without being claimed as an
      identity. The page states how many are currently emitted.
- [x] Saving revalidates the whole layout, not just the settings route. The
      values feed the header, footer, metadata, robots.txt, llms.txt and every
      page's JSON-LD; revalidating one path would show the new value in the
      form and nowhere else.
- [x] **Verified across both languages**: changing the auto-publish threshold in
      the browser stored a JSON *number*, and the Python pipeline read it back
      as `90` — admin panel to database to pipeline with no deploy, which is
      the entire claim of the page. Reverted to 85. `robots.txt` and the
      homepage `sameAs` both confirmed to reflect stored values.
- [ ] **No frontend test runner is installed.** 98 Python tests, zero
      TypeScript ones. The settings coercion, the URL stripping and the deadline
      maths are pure functions and the obvious first candidates. Vitest is the
      natural fit; this is an infrastructure decision rather than part of any
      feature, so it is flagged rather than assumed.
- [ ] Contact address sub-fields (`contact_address` is seeded as `{}` and not
      yet exposed in the form)

---

## Phase 6 — SEO / LLMO

- [x] JSON-LD generators as pure functions (`features/seo/lib/json-ld.ts`):
      Organization, WebSite + SearchAction, BreadcrumbList, FAQPage,
      MonetaryGrant, CollectionPage
- [x] Organization + WebSite emitted once in the root layout; every page schema
      references them by `@id` so one entity resolves for the whole site
- [x] `sameAs` read from `same_as_profiles` (D7) — verified: exactly the 7
      primary profiles, database-driven, not hardcoded
- [x] Settings layer (`settings-repository` + `settings-service`), React-cached
      per request, every getter falling back to a working default (D8)
- [x] Footer social links now read from the database, so the footer and the
      Organization schema cannot disagree
- [x] `sitemap.xml` — generated from live data, 30 URLs, excludes `/admin`,
      includes closed grants, falls back to static entries if the DB is down
- [x] `robots.txt` — settings-driven, so indexing can be switched off from the
      admin panel without a deploy
- [x] `llms.txt` — generated from live counts and directories, with a
      hand-written override available in settings
- [x] Per-page metadata + canonicals on every route
- [x] FAQ rendering with answers kept in the DOM so they stay quotable
- [ ] Middleware issuing 301s for ISO country shortcuts (D6) — `/us`, `/ie`
- [ ] `schema_markup` table is not yet written to; schemas are generated at
      render time. Persisting them is only needed for the admin SEO centre.
- [ ] OpenGraph images (`og:image`) — no default image asset exists yet

Note on `MonetaryGrant`: schema.org has no property for an application
deadline, so the closing date cannot be expressed in structured data. It is
carried by the visible key-facts table and the answer capsules instead.

---

## Phase 7 — Deployment

- [ ] Nginx config, PM2 config, cron examples
- [ ] Environment documentation
- [ ] Hostinger VPS notes
