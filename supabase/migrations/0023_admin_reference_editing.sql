-- 0023_admin_reference_editing
--
-- Renaming a slug without breaking the web.
--
-- Countries, categories and agencies all have public URLs — /countries/ie,
-- /categories/healthcare, /agencies/nsf. Editors can already update those rows
-- directly, so the admin panel could simply change a slug. Doing that would
-- 404 every existing link, every bookmark and every search result pointing at
-- the old URL, silently and immediately.
--
-- `seo_redirects` was built for exactly this and is, so far, empty and unread.
-- This function makes a rename write the redirect in the same transaction, so
-- a rename cannot half-happen: either the slug changes and the old path
-- redirects, or neither.
--
-- The public path is passed in rather than built here. `config/routes.ts` is
-- the single place that knows the URL shape, and a second copy in SQL would
-- drift the first time a route changed.

create or replace function public.admin_rename_slug(
  p_entity text,
  p_id uuid,
  p_new_slug text,
  p_old_path text,
  p_new_path text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if not public.is_admin_at_least('editor') then
    raise exception 'not authorised to rename' using errcode = 'insufficient_privilege';
  end if;

  if p_new_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'a slug must be lowercase words joined by hyphens'
      using errcode = 'check_violation';
  end if;

  -- Whitelisted rather than interpolated: `p_entity` reaches a table name, and
  -- a CASE is what keeps that from being an injection point.
  case p_entity
    when 'country' then
      update public.countries set slug = p_new_slug where id = p_id;
    when 'category' then
      update public.grant_categories set slug = p_new_slug where id = p_id;
    when 'organization' then
      update public.organizations set slug = p_new_slug where id = p_id;
    else
      raise exception 'unknown entity %', p_entity using errcode = 'check_violation';
  end case;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'record not found' using errcode = 'no_data_found';
  end if;

  if p_old_path is null or p_old_path = p_new_path then
    return null;
  end if;

  -- A previous rename may already point at the path being left behind. Chains
  -- (a -> b -> c) are repointed at the final destination rather than left to
  -- hop, because each hop loses ranking signal and some crawlers stop early.
  update public.seo_redirects
     set destination_path = p_new_path
   where destination_path = p_old_path;

  insert into public.seo_redirects (source_path, destination_path, status_code, enabled)
  values (p_old_path, p_new_path, 301, true)
  on conflict (source_path) do update
    set destination_path = excluded.destination_path,
        enabled = true;

  return p_old_path;
end;
$$;

comment on function public.admin_rename_slug is
  'Renames a country, category or organization slug and records a 301 from the '
  'old public path in the same transaction. Repoints existing redirects that '
  'targeted the old path so no chain forms.';

revoke execute on function public.admin_rename_slug(text, uuid, text, text, text) from public, anon;
grant execute on function public.admin_rename_slug(text, uuid, text, text, text) to authenticated;

-- The middleware reads redirects anonymously, before any session exists.
-- Migration 0013 already exposes enabled rows to `anon` via
-- `redirects_public_read`, so nothing further is needed here.
