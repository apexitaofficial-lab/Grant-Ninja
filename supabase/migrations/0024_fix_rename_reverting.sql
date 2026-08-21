-- 0024_fix_rename_reverting
--
-- Renaming a slug back to a name it used before failed outright.
--
-- Found by test: rename `others` -> `uncategorised` -> `other-grants` ->
-- `others`. On the last step, the chain-flattening update repointed
-- `/categories/others` at `/categories/others` — a redirect to itself, which
-- `ck_seo_redirects_not_self` correctly refuses, taking the whole transaction
-- with it. Renaming something and then changing your mind is an obvious thing
-- to do, and it was impossible.
--
-- Two rules were missing:
--
--   1. A path that is live again must not redirect away from itself. When a
--      slug moves back to an address, any redirect *out of* that address is
--      stale by definition and is removed.
--   2. Flattening a chain can leave a row pointing at itself. Those are
--      deleted rather than allowed to reach the constraint.

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

  -- Rule 1. The new path serves a real page again, so nothing may redirect
  -- away from it. This is what makes renaming back to a previous name work.
  delete from public.seo_redirects where source_path = p_new_path;

  -- Chains (a -> b -> c) are repointed at the final destination rather than
  -- left to hop: each hop loses ranking signal and some crawlers stop early.
  update public.seo_redirects
     set destination_path = p_new_path
   where destination_path = p_old_path;

  -- Rule 2. Flattening can leave a row pointing at itself.
  delete from public.seo_redirects where source_path = destination_path;

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
  'old public path in the same transaction. Flattens redirect chains, and '
  'clears redirects out of an address that has become live again so a slug can '
  'be renamed back to a name it used before.';
