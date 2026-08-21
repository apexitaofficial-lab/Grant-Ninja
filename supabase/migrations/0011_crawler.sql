-- 0011_crawler
-- Pipeline state. Written exclusively by the Python service using the secret
-- key; the admin UI only reads it.
-- DATABASE_ARCHITECTURE.md §5.18.

create table public.crawler_sources (
  id                 uuid primary key default gen_random_uuid(),
  country_id         uuid not null references public.countries (id) on delete restrict,
  organization_id    uuid references public.organizations (id) on delete set null,
  name               text not null,
  base_url           text not null,
  adapter_key        text not null,
  crawl_frequency    text not null default '0 2 * * *',
  priority           smallint not null default 5,
  status             public.entity_status not null default 'active',
  request_delay_ms   integer not null default 2000,
  max_concurrency    integer not null default 2,
  respect_robots_txt boolean not null default true,
  last_run_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint uk_crawler_sources_base_url unique (base_url),
  constraint ck_crawler_sources_priority check (priority between 1 and 10),
  constraint ck_crawler_sources_delay check (request_delay_ms >= 0),
  constraint ck_crawler_sources_concurrency check (max_concurrency between 1 and 32)
);

comment on column public.crawler_sources.adapter_key is
  'Names the Python adapter module that handles this source, e.g. grants_gov.';
comment on column public.crawler_sources.crawl_frequency is
  'Cron expression. Parseable by the scheduler, unlike the free text the spec '
  'suggested (deviation V8).';

create index ix_crawler_sources_country on public.crawler_sources (country_id);
create index ix_crawler_sources_active on public.crawler_sources (priority desc)
  where status = 'active';

create trigger trg_crawler_sources_touch
  before update on public.crawler_sources
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.crawler_queue (
  id            uuid primary key default gen_random_uuid(),
  source_id     uuid not null references public.crawler_sources (id) on delete cascade,
  url           text not null,
  priority      smallint not null default 5,
  status        public.job_status not null default 'pending',
  scheduled_for timestamptz not null default now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  retry_count   integer not null default 0,
  last_error    text,
  created_at    timestamptz not null default now(),

  constraint ck_crawler_queue_retry_non_negative check (retry_count >= 0)
);

-- The worker's dequeue path.
create index ix_crawler_queue_dispatch
  on public.crawler_queue (status, priority desc, scheduled_for)
  where status = 'pending';
create index ix_crawler_queue_source on public.crawler_queue (source_id, status);

-- ---------------------------------------------------------------------------
-- The cost lever: an unchanged content_hash skips fetch, AI and SEO entirely.
-- ---------------------------------------------------------------------------
create table public.crawler_pages (
  id               uuid primary key default gen_random_uuid(),
  source_id        uuid not null references public.crawler_sources (id) on delete cascade,
  url              text not null,
  content_hash     text,
  http_status      smallint,
  etag             text,
  last_crawled_at  timestamptz,
  last_modified_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint uk_crawler_pages_source_url unique (source_id, url)
);

create index ix_crawler_pages_hash on public.crawler_pages (content_hash)
  where content_hash is not null;
create index ix_crawler_pages_crawled on public.crawler_pages (last_crawled_at);

create trigger trg_crawler_pages_touch
  before update on public.crawler_pages
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.crawler_runs (
  id               uuid primary key default gen_random_uuid(),
  source_id        uuid not null references public.crawler_sources (id) on delete cascade,
  started_at       timestamptz not null default now(),
  completed_at     timestamptz,
  duration_ms      integer,
  pages_scanned    integer not null default 0,
  grants_new       integer not null default 0,
  grants_updated   integer not null default 0,
  duplicates_found integer not null default 0,
  errors           integer not null default 0,
  status           public.job_status not null default 'running',
  logs             jsonb,
  created_at       timestamptz not null default now(),

  constraint ck_crawler_runs_counts_non_negative check (
    pages_scanned >= 0 and grants_new >= 0 and grants_updated >= 0
    and duplicates_found >= 0 and errors >= 0
  )
);

create index ix_crawler_runs_source on public.crawler_runs (source_id, started_at desc);
create index ix_crawler_runs_status on public.crawler_runs (status, started_at desc);

-- ---------------------------------------------------------------------------
-- Duplicate candidates. The pair is stored once in a stable order so
-- (a, b) and (b, a) cannot both exist.
-- ---------------------------------------------------------------------------
create table public.duplicate_detection (
  id          uuid primary key default gen_random_uuid(),
  grant_a_id  uuid not null references public.grants (id) on delete cascade,
  grant_b_id  uuid not null references public.grants (id) on delete cascade,
  confidence  smallint not null,
  decision    public.duplicate_decision not null default 'possible_duplicate',
  method      text not null,
  resolved    boolean not null default false,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),

  constraint uk_duplicate_pair unique (grant_a_id, grant_b_id),
  constraint ck_duplicate_not_self check (grant_a_id <> grant_b_id),
  constraint ck_duplicate_pair_order check (grant_a_id < grant_b_id),
  constraint ck_duplicate_confidence check (confidence between 0 and 100)
);

comment on column public.duplicate_detection.method is
  'Which stage flagged it: hash, rapidfuzz, or gemini.';

create index ix_duplicate_unresolved on public.duplicate_detection (confidence desc)
  where not resolved;
create index ix_duplicate_grant_a on public.duplicate_detection (grant_a_id);
create index ix_duplicate_grant_b on public.duplicate_detection (grant_b_id);
