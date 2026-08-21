-- 0004_organizations
-- Grant-issuing bodies. Public URLs call these "agencies"; the entity is
-- `organizations`. config/routes.ts is the single translation point.
-- DATABASE_ARCHITECTURE.md §5.3.

create table public.organizations (
  id                uuid primary key default gen_random_uuid(),
  country_id        uuid not null references public.countries (id) on delete restrict,
  state_id          uuid references public.states (id) on delete set null,
  name              text not null,
  slug              text not null,
  organization_type public.organization_type not null,
  website           text,
  logo_url          text,
  description       text,
  email             text,
  phone             text,
  address           text,
  status            public.entity_status not null default 'active',
  grant_count       integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,

  constraint uk_organizations_slug unique (slug),
  constraint ck_organizations_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint ck_organizations_grant_count_non_negative check (grant_count >= 0),
  constraint ck_organizations_email_format
    check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create index ix_organizations_country_id on public.organizations (country_id)
  where deleted_at is null;
create index ix_organizations_state_id on public.organizations (state_id)
  where state_id is not null;
create index ix_organizations_type on public.organizations (organization_type)
  where deleted_at is null;

create trigger trg_organizations_touch
  before update on public.organizations
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Keep countries.organization_count accurate.
-- ---------------------------------------------------------------------------
create or replace function public.sync_organization_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
begin
  -- Branch with IF rather than a CASE expression: a CASE spanning NEW and OLD
  -- forces both records to be bound as parameters, and OLD is unassigned
  -- during INSERT.
  if tg_op = 'INSERT' then
    v_ids := array[new.country_id];
  elsif tg_op = 'DELETE' then
    v_ids := array[old.country_id];
  else
    v_ids := array[new.country_id, old.country_id];
  end if;

  update public.countries c
     set organization_count = (
           select count(*)
             from public.organizations o
            where o.country_id = c.id
              and o.status = 'active'
              and o.deleted_at is null
         )
   where c.id = any (array_remove(v_ids, null));

  return null;
end;
$$;

create trigger trg_organizations_sync_counts
  after insert or update of country_id, status, deleted_at or delete
  on public.organizations
  for each row execute function public.sync_organization_counts();
