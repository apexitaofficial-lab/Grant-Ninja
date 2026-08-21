-- 0003_geography
-- countries and states.
-- DATABASE_ARCHITECTURE.md §5.1 and §5.2.

create table public.countries (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  slug               text not null,
  iso_code           char(2) not null,
  iso_code_3         char(3),
  currency           char(3) not null,
  timezone           text,
  flag_url           text,
  description        text,
  status             public.entity_status not null default 'active',
  grant_count        integer not null default 0,
  organization_count integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz,

  constraint uk_countries_slug unique (slug),
  constraint uk_countries_iso_code unique (iso_code),
  constraint uk_countries_iso_code_3 unique (iso_code_3),
  constraint ck_countries_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint ck_countries_iso_upper check (iso_code = upper(iso_code)),
  constraint ck_countries_currency_upper check (currency = upper(currency)),
  constraint ck_countries_counts_non_negative
    check (grant_count >= 0 and organization_count >= 0)
);

comment on column public.countries.iso_code is
  'ISO 3166-1 alpha-2. Powers the /us, /ie shortcut redirects.';
comment on column public.countries.grant_count is
  'Denormalized. Maintained by sync_grant_counts and re-derived nightly.';

create index ix_countries_status on public.countries (status) where deleted_at is null;

create trigger trg_countries_touch
  before update on public.countries
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.states (
  id          uuid primary key default gen_random_uuid(),
  country_id  uuid not null references public.countries (id) on delete cascade,
  name        text not null,
  slug        text not null,
  code        text,
  status      public.entity_status not null default 'active',
  grant_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,

  -- Slugs are unique per country, not globally, so Victoria (AU) and
  -- Victoria (CA) can coexist.
  constraint uk_states_country_slug unique (country_id, slug),
  constraint ck_states_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint ck_states_grant_count_non_negative check (grant_count >= 0)
);

create index ix_states_country_id on public.states (country_id) where deleted_at is null;

create trigger trg_states_touch
  before update on public.states
  for each row execute function public.touch_updated_at();
