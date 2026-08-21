-- 0020_category_counts_follow_status
--
-- Category counts went stale whenever a grant was published or unpublished.
--
-- `trg_grants_sync_counts` fires on a status change but refreshes only
-- countries, states and organizations. `trg_gcr_sync_counts` refreshes
-- categories, but only when a *relation* changes. Nothing refreshed categories
-- when a grant's status changed, so the counts only stayed correct if the
-- category was attached at the same moment the grant became published.
--
-- The pipeline does exactly that, which is why this went unnoticed: the
-- `publish_grant` transaction writes the row and its relations together. The
-- admin review queue does the opposite — a draft arrives with its categories
-- already attached and is published later — so the very workflow the review
-- queue exists for would have left every count wrong.
--
-- Found when a category facet read "Others 2" beside three grants.
--
-- The recompute is a full recount rather than an increment, matching
-- `refresh_grant_counts`: a concurrent write or a manual SQL fix then cannot
-- leave a counter permanently skewed.

create or replace function public.refresh_category_counts(p_category_ids uuid[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.grant_categories c
     set grant_count = (
           select count(*)
             from public.grant_category_relations r
             join public.grants g on g.id = r.grant_id
            where r.category_id = c.id
              and g.status = 'published'
              and g.deleted_at is null
         )
   where c.id = any (array_remove(p_category_ids, null));
$$;

-- The relation trigger now delegates rather than holding its own copy of the
-- recount, so the two paths can never drift apart.
create or replace function public.sync_category_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
begin
  -- IF rather than CASE: OLD is unassigned during INSERT.
  if tg_op = 'INSERT' then
    v_ids := array[new.category_id];
  elsif tg_op = 'DELETE' then
    v_ids := array[old.category_id];
  else
    v_ids := array[new.category_id, old.category_id];
  end if;

  perform public.refresh_category_counts(v_ids);

  return null;
end;
$$;

-- Publishing, unpublishing or soft-deleting a grant now refreshes the
-- categories it belongs to.
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
  v_grant_id  uuid;
begin
  if tg_op = 'INSERT' then
    v_countries := array[new.country_id];
    v_states    := array[new.state_id];
    v_orgs      := array[new.organization_id];
    v_grant_id  := new.id;
  elsif tg_op = 'DELETE' then
    v_countries := array[old.country_id];
    v_states    := array[old.state_id];
    v_orgs      := array[old.organization_id];
    v_grant_id  := old.id;
  else
    v_countries := array[new.country_id, old.country_id];
    v_states    := array[new.state_id, old.state_id];
    v_orgs      := array[new.organization_id, old.organization_id];
    v_grant_id  := new.id;
  end if;

  perform public.refresh_grant_counts(
    array_remove(v_countries, null),
    array_remove(v_states, null),
    array_remove(v_orgs, null)
  );

  perform public.refresh_category_counts(
    array(
      select r.category_id
        from public.grant_category_relations r
       where r.grant_id = v_grant_id
    )
  );

  return null;
end;
$$;

-- Correct every count that is already wrong.
select public.refresh_category_counts(array(select id from public.grant_categories));

revoke execute on function public.refresh_category_counts(uuid[]) from public, anon, authenticated;
