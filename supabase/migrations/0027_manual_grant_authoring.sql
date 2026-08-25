-- 0027_manual_grant_authoring
--
-- Everything needed to add a grant by hand, for any country.
--
-- Until now the admin panel could edit and delete a grant but not create one:
-- `admin_save_grant` requires an id that already exists, so every row in the
-- directory had to come from the crawler. Amy needs to add USA, UK and Italian
-- grants directly, and most countries have no crawlable source at all, so the
-- manual path is not a convenience — for the UK and Italy it is the only path.
--
-- Three things are missing and added here:
--   1. Italy as a country, and the other seeded countries switched on
--   2. `admin_create_organization` — a new country has no agencies to pick from
--   3. `admin_create_grant` — one transaction: row, categories, version, history
--
-- Nothing here is US-specific. Country is a parameter throughout, and the
-- federal/state/private distinction is expressed as a funding level so that
-- "national government" reads correctly whether the country calls that federal,
-- central or state.

-- ---------------------------------------------------------------------------
-- 1. Countries
--
-- Italy joins the seeded set. The rest were inserted as 'inactive' in 0014 and
-- stay hidden from the public site until they hold grants; the UK and Italy are
-- activated because grants are about to be entered for them by hand.
-- ---------------------------------------------------------------------------
insert into public.countries (name, slug, iso_code, iso_code_3, currency, timezone, status)
values ('Italy', 'italy', 'IT', 'ITA', 'EUR', 'Europe/Rome', 'active')
on conflict (slug) do nothing;

update public.countries
   set status = 'active'
 where slug in ('united-kingdom', 'italy')
   and status <> 'active';

-- ---------------------------------------------------------------------------
-- 2. Organizations
--
-- A grant needs an agency, and `organizations` is populated entirely by the
-- crawler — every one of the 151 rows is American. Adding a UK or Italian grant
-- with no way to create its funder would be a dead end at the first field.
--
-- Slug collisions are resolved against the country, mirroring how grant slugs
-- behave: two countries may both have a "Ministry of Health".
-- ---------------------------------------------------------------------------
create or replace function public.admin_create_organization(
  p_name text,
  p_country_id uuid,
  p_website text default null,
  -- 'government_federal' is the enum's name for national government, whatever
  -- the country calls that level. A UK department and an Italian ministry are
  -- both this, not 'government_state'.
  p_organization_type public.organization_type default 'government_federal'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_slug text;
  v_country_slug text;
  v_id uuid;
  v_suffix integer := 2;
begin
  if not public.is_admin_at_least('editor') then
    raise exception 'not authorised to create agencies' using errcode = 'insufficient_privilege';
  end if;

  if p_name is null or btrim(p_name) = '' then
    raise exception 'an agency needs a name' using errcode = 'check_violation';
  end if;

  -- An existing agency with the same name in the same country is the one the
  -- operator meant. Returning it keeps a typo-free retry from minting a
  -- duplicate funder that then splits the agency page in two.
  select id into v_id
    from public.organizations
   where country_id = p_country_id
     and lower(btrim(name)) = lower(btrim(p_name))
     and deleted_at is null
   limit 1;

  if v_id is not null then
    return v_id;
  end if;

  v_base := public.slugify(p_name);

  if v_base = '' then
    raise exception 'that agency name produces an empty slug' using errcode = 'check_violation';
  end if;

  v_slug := v_base;

  select slug into v_country_slug from public.countries where id = p_country_id;

  if v_country_slug is null then
    raise exception 'unknown country' using errcode = 'foreign_key_violation';
  end if;

  if exists (select 1 from public.organizations where slug = v_slug) then
    v_slug := v_base || '-' || v_country_slug;
  end if;

  while exists (select 1 from public.organizations where slug = v_slug) loop
    v_slug := v_base || '-' || v_country_slug || '-' || v_suffix;
    v_suffix := v_suffix + 1;
  end loop;

  insert into public.organizations (name, slug, country_id, website, organization_type)
  values (btrim(p_name), v_slug, p_country_id, nullif(btrim(coalesce(p_website, '')), ''), p_organization_type)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.admin_create_organization is
  'Creates a funding agency, or returns the existing one with the same name in '
  'the same country. Slugs collide across countries, so a duplicate name is '
  'suffixed with the country slug.';

-- ---------------------------------------------------------------------------
-- 3. Grants
--
-- The counterpart to `admin_save_grant`. Same reasoning: `grant_versions` and
-- `grant_history` are read-only to `authenticated`, and nothing writes them
-- automatically, so a hand-created grant inserted through PostgREST would have
-- no version 1 and no creation entry — a hole in the trail at exactly the point
-- a human made a decision.
--
-- Slug generation follows the documented rule on `grants.slug`: title, then
-- country, then organization, then a short hash.
-- ---------------------------------------------------------------------------
create or replace function public.admin_create_grant(
  p_grant jsonb,
  p_category_ids uuid[] default '{}',
  p_primary_category_id uuid default null,
  p_change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_title text := btrim(p_grant ->> 'title');
  v_country_id uuid := (p_grant ->> 'country_id')::uuid;
  v_organization_id uuid := (p_grant ->> 'organization_id')::uuid;
  v_status public.grant_status := coalesce((p_grant ->> 'status')::public.grant_status, 'draft');
  v_currency char(3);
  v_base text;
  v_slug text;
  v_country_slug text;
  v_org_slug text;
  v_grant_id uuid;
  v_category_id uuid;
begin
  if not public.is_admin_at_least('editor') then
    raise exception 'not authorised to create grants' using errcode = 'insufficient_privilege';
  end if;

  if v_title is null or v_title = '' then
    raise exception 'a grant needs a title' using errcode = 'check_violation';
  end if;

  if v_country_id is null then
    raise exception 'a grant needs a country' using errcode = 'check_violation';
  end if;

  if v_organization_id is null then
    raise exception 'a grant needs a funding agency' using errcode = 'check_violation';
  end if;

  -- Publishing has two hard preconditions in the table's own check constraints.
  -- Failing here names the missing field; failing there names a constraint.
  if v_status = 'published' then
    if coalesce(btrim(p_grant ->> 'official_url'), '') = '' then
      raise exception 'a published grant needs an official URL'
        using errcode = 'check_violation';
    end if;

    if coalesce(array_length(p_category_ids, 1), 0) = 0 then
      raise exception 'a published grant needs at least one category'
        using errcode = 'check_violation';
    end if;
  end if;

  select slug, currency into v_country_slug, v_currency
    from public.countries where id = v_country_id;

  if v_country_slug is null then
    raise exception 'unknown country' using errcode = 'foreign_key_violation';
  end if;

  -- The country's own currency is the right default: a UK grant priced in USD
  -- because the form remembered the last entry is a subtle, lasting error.
  v_currency := coalesce(nullif(btrim(p_grant ->> 'currency'), ''), v_currency, 'USD');

  select slug into v_org_slug from public.organizations where id = v_organization_id;

  if v_org_slug is null then
    raise exception 'unknown agency' using errcode = 'foreign_key_violation';
  end if;

  v_base := public.slugify(v_title);

  if v_base = '' then
    raise exception 'that title produces an empty slug' using errcode = 'check_violation';
  end if;

  -- Escalating suffixes, cheapest first. A hash is the last resort because it
  -- is the only one a person cannot read.
  v_slug := v_base;

  if exists (select 1 from public.grants where slug = v_slug) then
    v_slug := v_base || '-' || v_country_slug;
  end if;

  if exists (select 1 from public.grants where slug = v_slug) then
    v_slug := v_base || '-' || v_org_slug;
  end if;

  if exists (select 1 from public.grants where slug = v_slug) then
    v_slug := v_base || '-' || substr(encode(extensions.digest(gen_random_uuid()::text, 'sha256'), 'hex'), 1, 8);
  end if;

  insert into public.grants (
    organization_id, country_id, state_id,
    title, slug, short_description, full_description, eligibility,
    funding_amount, minimum_amount, maximum_amount, currency,
    grant_type, status,
    application_url, official_url, source_url,
    opens_at, closes_at, published_at, last_verified_at,
    featured, is_federal, is_private
  )
  values (
    v_organization_id,
    v_country_id,
    nullif(p_grant ->> 'state_id', '')::uuid,
    v_title,
    v_slug,
    nullif(btrim(coalesce(p_grant ->> 'short_description', '')), ''),
    nullif(btrim(coalesce(p_grant ->> 'full_description', '')), ''),
    nullif(btrim(coalesce(p_grant ->> 'eligibility', '')), ''),
    nullif(p_grant ->> 'funding_amount', '')::numeric,
    nullif(p_grant ->> 'minimum_amount', '')::numeric,
    nullif(p_grant ->> 'maximum_amount', '')::numeric,
    upper(v_currency),
    coalesce((p_grant ->> 'grant_type')::public.grant_funding_type, 'other'),
    v_status,
    nullif(btrim(coalesce(p_grant ->> 'application_url', '')), ''),
    nullif(btrim(coalesce(p_grant ->> 'official_url', '')), ''),
    nullif(btrim(coalesce(p_grant ->> 'source_url', '')), ''),
    nullif(p_grant ->> 'opens_at', '')::timestamptz,
    nullif(p_grant ->> 'closes_at', '')::timestamptz,
    case when v_status = 'published' then now() else null end,
    -- A person typing from the official notice has just verified it.
    now(),
    coalesce((p_grant ->> 'featured')::boolean, false),
    coalesce((p_grant ->> 'is_federal')::boolean, false),
    coalesce((p_grant ->> 'is_private')::boolean, false)
  )
  returning id into v_grant_id;

  foreach v_category_id in array coalesce(p_category_ids, '{}')
  loop
    insert into public.grant_category_relations (grant_id, category_id, is_primary)
    values (
      v_grant_id,
      v_category_id,
      v_category_id is not distinct from p_primary_category_id
    )
    on conflict (grant_id, category_id) do nothing;
  end loop;

  insert into public.grant_versions (
    grant_id, version_number, snapshot, content_hash, change_reason, created_by, created_by_type
  )
  select v_grant_id, 1, to_jsonb(g) - 'search_vector', g.content_hash,
         coalesce(p_change_reason, 'created in admin panel'), v_actor, 'admin'
    from public.grants g
   where g.id = v_grant_id
  on conflict (grant_id, version_number) do nothing;

  insert into public.grant_history (grant_id, action, description, performed_by, performed_by_type)
  values (
    v_grant_id,
    'created',
    coalesce(p_change_reason, 'created in admin panel'),
    v_actor,
    'admin'
  );

  return v_grant_id;
end;
$$;

comment on function public.admin_create_grant is
  'Creates one grant by hand with its category relations, version 1 snapshot '
  'and a history entry, in a single transaction. Generates a unique slug from '
  'the title and defaults the currency from the country.';

-- ---------------------------------------------------------------------------
-- 4. Editing the fields creation exposes
--
-- `admin_save_grant` was written for correcting crawled text, so it cannot move
-- a grant between countries, agencies or categories — the crawler resolves
-- those. A hand-entered grant can have any of them wrong, and re-entering the
-- whole record to fix a mis-picked agency is not an edit path.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_grant_classification(
  p_grant_id uuid,
  p_country_id uuid default null,
  p_organization_id uuid default null,
  p_state_id uuid default null,
  p_clear_state boolean default false,
  p_category_ids uuid[] default null,
  p_primary_category_id uuid default null,
  p_is_federal boolean default null,
  p_is_private boolean default null,
  p_change_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_next_version integer;
  v_category_id uuid;
  v_status public.grant_status;
begin
  if not public.is_admin_at_least('editor') then
    raise exception 'not authorised to edit grants' using errcode = 'insufficient_privilege';
  end if;

  select status into v_status from public.grants where id = p_grant_id and deleted_at is null;

  if v_status is null then
    raise exception 'grant not found' using errcode = 'no_data_found';
  end if;

  -- Removing every category from a published grant would violate the table's
  -- publish constraint on the next write rather than here, so refuse now.
  if p_category_ids is not null
     and coalesce(array_length(p_category_ids, 1), 0) = 0
     and v_status = 'published' then
    raise exception 'a published grant needs at least one category'
      using errcode = 'check_violation';
  end if;

  update public.grants g
     set country_id      = coalesce(p_country_id, g.country_id),
         organization_id = coalesce(p_organization_id, g.organization_id),
         state_id        = case
                             when p_clear_state then null
                             else coalesce(p_state_id, g.state_id)
                           end,
         is_federal      = coalesce(p_is_federal, g.is_federal),
         is_private      = coalesce(p_is_private, g.is_private),
         current_version = g.current_version + 1,
         updated_at      = now()
   where g.id = p_grant_id
     and g.deleted_at is null
  returning g.current_version into v_next_version;

  if p_category_ids is not null then
    delete from public.grant_category_relations
     where grant_id = p_grant_id
       and category_id <> all (p_category_ids);

    -- `uk_grant_primary_category` allows one primary per grant. Promoting a
    -- different category while the old one is still flagged trips it, so the
    -- flag is cleared across the grant before any row claims it.
    update public.grant_category_relations
       set is_primary = false
     where grant_id = p_grant_id
       and is_primary;

    foreach v_category_id in array p_category_ids
    loop
      insert into public.grant_category_relations (grant_id, category_id, is_primary)
      values (p_grant_id, v_category_id, v_category_id is not distinct from p_primary_category_id)
      on conflict (grant_id, category_id)
      do update set is_primary = excluded.is_primary;
    end loop;
  end if;

  insert into public.grant_versions (
    grant_id, version_number, snapshot, content_hash, change_reason, created_by, created_by_type
  )
  select p_grant_id, v_next_version, to_jsonb(g) - 'search_vector', g.content_hash,
         coalesce(p_change_reason, 'classification changed in admin panel'), v_actor, 'admin'
    from public.grants g
   where g.id = p_grant_id
  on conflict (grant_id, version_number) do nothing;

  insert into public.grant_history (grant_id, action, description, performed_by, performed_by_type)
  values (
    p_grant_id,
    'updated',
    coalesce(p_change_reason, 'classification changed in admin panel'),
    v_actor,
    'admin'
  );

  return p_grant_id;
end;
$$;

comment on function public.admin_set_grant_classification is
  'Changes a grant''s country, agency, state, categories and funding level. '
  'Separate from admin_save_grant, which only touches text the crawler wrote.';

revoke execute on function public.admin_create_organization(text, uuid, text, public.organization_type)
  from public, anon;
revoke execute on function public.admin_create_grant(jsonb, uuid[], uuid, text) from public, anon;
revoke execute on function public.admin_set_grant_classification(
  uuid, uuid, uuid, uuid, boolean, uuid[], uuid, boolean, boolean, text
) from public, anon;

grant execute on function public.admin_create_organization(text, uuid, text, public.organization_type)
  to authenticated;
grant execute on function public.admin_create_grant(jsonb, uuid[], uuid, text) to authenticated;
grant execute on function public.admin_set_grant_classification(
  uuid, uuid, uuid, uuid, boolean, uuid[], uuid, boolean, boolean, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Support widget key
--
-- D8: nothing in the settings contract may be hardcoded in a component. The key
-- is not a secret — it ships in the page to every visitor — but it belongs in
-- settings so support can be switched off, or the account changed, without a
-- deploy. An empty value renders no script at all.
-- ---------------------------------------------------------------------------
insert into public.system_settings (key, value, group_name, description, is_public)
values (
  'zendesk_widget_key',
  '"a9ac9ba6-8588-4267-830b-c3d1e2c3b7d7"'::jsonb,
  'contact',
  'Zendesk Web Widget key. Public by design — it is visible in the page source. Empty disables the widget.',
  true
)
on conflict (key) do nothing;
