-- 0007_grant_relations
-- Classification, tagging, documents, provenance, and the grant_count triggers.
-- DATABASE_ARCHITECTURE.md §5.6, §5.7, §5.12, §6.

-- ---------------------------------------------------------------------------
-- Categories: many per grant, exactly one primary (decision D1).
-- ---------------------------------------------------------------------------
create table public.grant_category_relations (
  grant_id    uuid not null references public.grants (id) on delete cascade,
  category_id uuid not null references public.grant_categories (id) on delete cascade,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),

  primary key (grant_id, category_id)
);

-- Guarantees at most one primary. "At least one" cannot be expressed as an
-- index, so it is enforced at publish time by the service layer.
create unique index uk_grant_primary_category
  on public.grant_category_relations (grant_id) where is_primary;

create index ix_gcr_category_id on public.grant_category_relations (category_id);

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
create table public.grant_tag_relations (
  grant_id   uuid not null references public.grants (id) on delete cascade,
  tag_id     uuid not null references public.grant_tags (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (grant_id, tag_id)
);

create index ix_gtr_tag_id on public.grant_tag_relations (tag_id);

-- ---------------------------------------------------------------------------
-- Downloadable documents
-- ---------------------------------------------------------------------------
create table public.grant_documents (
  id            uuid primary key default gen_random_uuid(),
  grant_id      uuid not null references public.grants (id) on delete cascade,
  title         text not null,
  file_url      text not null,
  document_type text,
  file_size     bigint,
  mime_type     text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint ck_grant_documents_size_non_negative check (file_size is null or file_size >= 0)
);

create index ix_grant_documents_grant on public.grant_documents (grant_id, sort_order);

create trigger trg_grant_documents_touch
  before update on public.grant_documents
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Provenance. A grant may be assembled from several sources.
-- ---------------------------------------------------------------------------
create table public.grant_sources (
  id               uuid primary key default gen_random_uuid(),
  grant_id         uuid not null references public.grants (id) on delete cascade,
  source_name      text,
  source_url       text not null,
  source_type      public.grant_source_type not null default 'crawler',
  confidence_score smallint,
  last_checked     timestamptz,
  created_at       timestamptz not null default now(),

  constraint uk_grant_sources_grant_url unique (grant_id, source_url),
  constraint ck_grant_sources_confidence_range
    check (confidence_score is null or confidence_score between 0 and 100)
);

create index ix_grant_sources_grant on public.grant_sources (grant_id);

-- ---------------------------------------------------------------------------
-- Denormalized grant counts.
--
-- Recomputed for the affected rows rather than incremented, so a concurrent
-- write or a manual SQL fix cannot leave the counter permanently skewed. Only
-- published, non-deleted grants count.
-- ---------------------------------------------------------------------------
create or replace function public.refresh_grant_counts(
  p_country_ids uuid[],
  p_state_ids uuid[],
  p_organization_ids uuid[]
)
returns void
language sql
security definer
set search_path = public
as $$
  with c as (
    update public.countries t
       set grant_count = (
             select count(*) from public.grants g
              where g.country_id = t.id
                and g.status = 'published'
                and g.deleted_at is null)
     where t.id = any (p_country_ids)
    returning 1
  ), s as (
    update public.states t
       set grant_count = (
             select count(*) from public.grants g
              where g.state_id = t.id
                and g.status = 'published'
                and g.deleted_at is null)
     where t.id = any (p_state_ids)
    returning 1
  ), o as (
    update public.organizations t
       set grant_count = (
             select count(*) from public.grants g
              where g.organization_id = t.id
                and g.status = 'published'
                and g.deleted_at is null)
     where t.id = any (p_organization_ids)
    returning 1
  )
  select null::void;
$$;

create or replace function public.sync_grant_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_countries uuid[];
  v_states    uuid[];
  v_orgs      uuid[];
begin
  if tg_op = 'INSERT' then
    v_countries := array[new.country_id];
    v_states    := array[new.state_id];
    v_orgs      := array[new.organization_id];
  elsif tg_op = 'DELETE' then
    v_countries := array[old.country_id];
    v_states    := array[old.state_id];
    v_orgs      := array[old.organization_id];
  else
    v_countries := array[new.country_id, old.country_id];
    v_states    := array[new.state_id, old.state_id];
    v_orgs      := array[new.organization_id, old.organization_id];
  end if;

  perform public.refresh_grant_counts(
    array_remove(v_countries, null),
    array_remove(v_states, null),
    array_remove(v_orgs, null)
  );

  return null;
end;
$$;

create trigger trg_grants_sync_counts
  after insert
     or update of status, deleted_at, country_id, state_id, organization_id
     or delete
  on public.grants
  for each row execute function public.sync_grant_counts();

-- ---------------------------------------------------------------------------
-- Category counts follow the join table rather than grants.
-- ---------------------------------------------------------------------------
create or replace function public.sync_category_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
begin
  -- IF rather than CASE, for the same reason as sync_organization_counts:
  -- OLD is unassigned during INSERT.
  if tg_op = 'INSERT' then
    v_ids := array[new.category_id];
  elsif tg_op = 'DELETE' then
    v_ids := array[old.category_id];
  else
    v_ids := array[new.category_id, old.category_id];
  end if;

  update public.grant_categories c
     set grant_count = (
           select count(*)
             from public.grant_category_relations r
             join public.grants g on g.id = r.grant_id
            where r.category_id = c.id
              and g.status = 'published'
              and g.deleted_at is null
         )
   where c.id = any (array_remove(v_ids, null));

  return null;
end;
$$;

create trigger trg_gcr_sync_counts
  after insert or update of category_id or delete
  on public.grant_category_relations
  for each row execute function public.sync_category_counts();
