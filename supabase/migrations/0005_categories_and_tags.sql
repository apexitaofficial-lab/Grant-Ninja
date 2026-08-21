-- 0005_categories_and_tags
-- Categories are hierarchical and curated; tags are flat and permissive.
-- DATABASE_ARCHITECTURE.md §5.4 and §5.7.

create table public.grant_categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.grant_categories (id) on delete set null,
  name        text not null,
  slug        text not null,
  description text,
  icon        text,
  color       text,
  sort_order  integer not null default 0,
  status      public.entity_status not null default 'active',
  grant_count integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,

  constraint uk_grant_categories_slug unique (slug),
  constraint ck_grant_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint ck_grant_categories_not_self_parent check (parent_id is distinct from id),
  constraint ck_grant_categories_grant_count_non_negative check (grant_count >= 0)
);

comment on column public.grant_categories.icon is 'Lucide icon name, not a path.';
comment on column public.grant_categories.color is
  'Design token name, not a raw hex value — keeps the palette in one place.';

create index ix_grant_categories_parent on public.grant_categories (parent_id)
  where parent_id is not null;
create index ix_grant_categories_sort on public.grant_categories (sort_order, name)
  where deleted_at is null;

create trigger trg_grant_categories_touch
  before update on public.grant_categories
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.grant_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null,
  color      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uk_grant_tags_slug unique (slug),
  constraint ck_grant_tags_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create trigger trg_grant_tags_touch
  before update on public.grant_tags
  for each row execute function public.touch_updated_at();
