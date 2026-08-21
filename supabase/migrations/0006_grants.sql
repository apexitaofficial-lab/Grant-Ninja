-- 0006_grants
-- The central table. No category_id (classification moved to a join table,
-- deviation V1) and no is_active (derived from status + closes_at, V5).
-- DATABASE_ARCHITECTURE.md §5.5.

create table public.grants (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete restrict,
  country_id        uuid not null references public.countries (id) on delete restrict,
  state_id          uuid references public.states (id) on delete set null,

  title             text not null,
  slug              text not null,
  short_description text,
  full_description  text,
  eligibility       text,

  funding_amount    numeric(14, 2),
  minimum_amount    numeric(14, 2),
  maximum_amount    numeric(14, 2),
  currency          char(3) not null,

  grant_type        public.grant_funding_type not null default 'other',
  status            public.grant_status not null default 'draft',

  application_url   text,
  official_url      text,
  source_url        text,

  opens_at          timestamptz,
  closes_at         timestamptz,
  published_at      timestamptz,
  last_verified_at  timestamptz,

  featured          boolean not null default false,
  is_federal        boolean not null default false,
  is_private        boolean not null default false,

  content_hash      text,
  ai_confidence     smallint,
  current_version   integer not null default 1,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,

  -- Weighted so a title match outranks a body match.
  search_vector     tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')),             'A') ||
    setweight(to_tsvector('english', coalesce(short_description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(eligibility, '')),       'C') ||
    setweight(to_tsvector('english', coalesce(full_description, '')),  'D')
  ) stored,

  constraint uk_grants_slug unique (slug),
  constraint ck_grants_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint ck_grants_currency_upper check (currency = upper(currency)),

  constraint ck_grants_amount_range
    check (minimum_amount is null or maximum_amount is null
           or minimum_amount <= maximum_amount),
  constraint ck_grants_date_range
    check (opens_at is null or closes_at is null or opens_at <= closes_at),
  constraint ck_grants_funding_non_negative
    check (funding_amount is null or funding_amount >= 0),
  constraint ck_grants_confidence_range
    check (ai_confidence is null or ai_confidence between 0 and 100),
  constraint ck_grants_version_positive check (current_version >= 1),

  -- Business rules from MASTER_PROJECT_SPEC Part 5B §51. Prose does not stop a
  -- bad row; a check constraint does.
  constraint ck_grants_published_needs_date
    check (status <> 'published' or published_at is not null),
  constraint ck_grants_published_needs_official_url
    check (status <> 'published' or official_url is not null)
);

comment on column public.grants.slug is
  'Globally unique and permanent. Collisions are suffixed with the country '
  'slug, then the organization slug, then a short hash.';
comment on column public.grants.content_hash is
  'sha256 of normalized source content. An unchanged hash skips AI entirely, '
  'which is the pipeline''s main cost lever.';
comment on column public.grants.ai_confidence is
  'Extraction confidence 0-100. At or above the configured threshold (85) the '
  'grant auto-publishes; below it goes to the review queue.';

-- ---------------------------------------------------------------------------
-- Indexes, driven by access pattern. Listing indexes are partial so archived
-- rows never inflate them.
-- ---------------------------------------------------------------------------
create index ix_grants_status_published
  on public.grants (status, published_at desc) where deleted_at is null;
create index ix_grants_country
  on public.grants (country_id, status) where deleted_at is null;
create index ix_grants_state
  on public.grants (state_id) where state_id is not null and deleted_at is null;
create index ix_grants_organization
  on public.grants (organization_id, status) where deleted_at is null;
create index ix_grants_closes_at
  on public.grants (closes_at) where status = 'published';
create index ix_grants_funding
  on public.grants (funding_amount) where deleted_at is null;
create index ix_grants_featured
  on public.grants (published_at desc) where featured and deleted_at is null;
create index ix_grants_updated
  on public.grants (updated_at desc) where status = 'published';
create index ix_grants_content_hash
  on public.grants (content_hash) where content_hash is not null;
create index ix_grants_confidence
  on public.grants (ai_confidence) where status = 'pending_review';

create index ix_grants_search on public.grants using gin (search_vector);
create index ix_grants_title_trgm
  on public.grants using gin (title extensions.gin_trgm_ops);

create trigger trg_grants_touch
  before update on public.grants
  for each row execute function public.touch_updated_at();
