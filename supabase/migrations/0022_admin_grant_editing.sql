-- 0022_admin_grant_editing
--
-- A versioned write path for human edits.
--
-- Nothing writes `grant_versions` or `grant_history` automatically — there is
-- no trigger. The pipeline creates them explicitly inside `publish_grant`, so
-- crawled changes are fully audited. An admin editing through PostgREST would
-- have updated the grant and written neither, leaving the audit trail with a
-- hole exactly where human decisions happen, which are the changes most worth
-- being able to explain later.
--
-- Both tables are also read-only for `authenticated` on purpose (policies
-- `versions_admin_read` / `history_admin_read`): an append-only trail that the
-- API can rewrite is not a trail. So the admin panel cannot write them
-- directly even if it wanted to.
--
-- These functions are the resolution: SECURITY DEFINER, role-checked, and each
-- writes the grant *and* its trail in one transaction. The tables stay closed;
-- only these narrow, audited operations get through.

create or replace function public.admin_save_grant(
  p_grant_id uuid,
  p_patch jsonb,
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
begin
  if not public.is_admin_at_least('editor') then
    raise exception 'not authorised to edit grants' using errcode = 'insufficient_privilege';
  end if;

  -- coalesce(patch ->> key, column) means an absent key leaves the column
  -- alone, while an explicit JSON null clears it. A partial edit form can
  -- therefore send only what it changed.
  update public.grants g
     set title             = coalesce(p_patch ->> 'title', g.title),
         short_description = case when p_patch ? 'short_description'
                                  then p_patch ->> 'short_description' else g.short_description end,
         full_description  = case when p_patch ? 'full_description'
                                  then p_patch ->> 'full_description' else g.full_description end,
         eligibility       = case when p_patch ? 'eligibility'
                                  then p_patch ->> 'eligibility' else g.eligibility end,
         funding_amount    = case when p_patch ? 'funding_amount'
                                  then (p_patch ->> 'funding_amount')::numeric else g.funding_amount end,
         minimum_amount    = case when p_patch ? 'minimum_amount'
                                  then (p_patch ->> 'minimum_amount')::numeric else g.minimum_amount end,
         maximum_amount    = case when p_patch ? 'maximum_amount'
                                  then (p_patch ->> 'maximum_amount')::numeric else g.maximum_amount end,
         official_url      = case when p_patch ? 'official_url'
                                  then p_patch ->> 'official_url' else g.official_url end,
         application_url   = case when p_patch ? 'application_url'
                                  then p_patch ->> 'application_url' else g.application_url end,
         opens_at          = case when p_patch ? 'opens_at'
                                  then (p_patch ->> 'opens_at')::timestamptz else g.opens_at end,
         closes_at         = case when p_patch ? 'closes_at'
                                  then (p_patch ->> 'closes_at')::timestamptz else g.closes_at end,
         grant_type        = coalesce((p_patch ->> 'grant_type')::public.grant_funding_type, g.grant_type),
         featured          = coalesce((p_patch ->> 'featured')::boolean, g.featured),
         current_version   = g.current_version + 1,
         updated_at        = now()
   where g.id = p_grant_id
     and g.deleted_at is null
  returning g.current_version into v_next_version;

  if v_next_version is null then
    raise exception 'grant not found' using errcode = 'no_data_found';
  end if;

  insert into public.grant_versions (
    grant_id, version_number, snapshot, content_hash, change_reason, created_by, created_by_type
  )
  select p_grant_id, v_next_version, to_jsonb(g) - 'search_vector', g.content_hash,
         coalesce(p_change_reason, 'edited in admin panel'), v_actor, 'admin'
    from public.grants g
   where g.id = p_grant_id
  on conflict (grant_id, version_number) do nothing;

  insert into public.grant_history (grant_id, action, description, performed_by, performed_by_type)
  values (p_grant_id, 'updated', coalesce(p_change_reason, 'edited in admin panel'), v_actor, 'admin');

  return p_grant_id;
end;
$$;

comment on function public.admin_save_grant is
  'Applies a partial edit to one grant and records a version snapshot and a '
  'history entry in the same transaction. Keys absent from the patch are left '
  'unchanged; an explicit null clears the column.';

-- ---------------------------------------------------------------------------
-- Status transitions. Separate from editing because they are decisions, not
-- corrections, and they are what the review queue acts on.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_grant_status(
  p_grant_id uuid,
  p_status public.grant_status,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_next_version integer;
  v_has_category boolean;
begin
  if not public.is_admin_at_least('editor') then
    raise exception 'not authorised to change grant status'
      using errcode = 'insufficient_privilege';
  end if;

  if p_status = 'published' then
    -- The table's own check constraint enforces this, but failing here gives a
    -- reviewer a sentence they can act on instead of a constraint name.
    select exists (
      select 1 from public.grant_category_relations r where r.grant_id = p_grant_id
    ) into v_has_category;

    if not v_has_category then
      raise exception 'a grant needs at least one category before it can be published'
        using errcode = 'check_violation';
    end if;
  end if;

  update public.grants g
     set status          = p_status,
         published_at    = case
                             when p_status = 'published' and g.published_at is null
                             then now() else g.published_at
                           end,
         current_version = g.current_version + 1,
         updated_at      = now()
   where g.id = p_grant_id
     and g.deleted_at is null
  returning g.current_version into v_next_version;

  if v_next_version is null then
    raise exception 'grant not found' using errcode = 'no_data_found';
  end if;

  insert into public.grant_versions (
    grant_id, version_number, snapshot, content_hash, change_reason, created_by, created_by_type
  )
  select p_grant_id, v_next_version, to_jsonb(g) - 'search_vector', g.content_hash,
         coalesce(p_reason, 'status changed to ' || p_status), v_actor, 'admin'
    from public.grants g
   where g.id = p_grant_id
  on conflict (grant_id, version_number) do nothing;

  insert into public.grant_history (grant_id, action, description, performed_by, performed_by_type)
  values (
    p_grant_id,
    p_status::text,
    coalesce(p_reason, 'status changed to ' || p_status),
    v_actor,
    'admin'
  );

  return p_grant_id;
end;
$$;

comment on function public.admin_set_grant_status is
  'Moves a grant between draft, pending_review, published, archived and '
  'expired, recording who did it and why. Refuses to publish a grant with no '
  'category.';

-- ---------------------------------------------------------------------------
-- Soft delete. The row stays for the audit trail and for anything referencing
-- it; RLS already hides deleted rows from the public.
-- ---------------------------------------------------------------------------
create or replace function public.admin_delete_grant(p_grant_id uuid, p_reason text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  -- Deletion is an admin decision, not an editor's.
  if not public.is_admin_at_least('admin') then
    raise exception 'not authorised to delete grants' using errcode = 'insufficient_privilege';
  end if;

  update public.grants
     set deleted_at = now(),
         status = 'archived',
         updated_at = now()
   where id = p_grant_id
     and deleted_at is null;

  if not found then
    raise exception 'grant not found' using errcode = 'no_data_found';
  end if;

  insert into public.grant_history (grant_id, action, description, performed_by, performed_by_type)
  values (p_grant_id, 'deleted', coalesce(p_reason, 'deleted in admin panel'), v_actor, 'admin');

  return p_grant_id;
end;
$$;

revoke execute on function public.admin_save_grant(uuid, jsonb, text) from public, anon;
revoke execute on function public.admin_set_grant_status(uuid, public.grant_status, text) from public, anon;
revoke execute on function public.admin_delete_grant(uuid, text) from public, anon;

grant execute on function public.admin_save_grant(uuid, jsonb, text) to authenticated;
grant execute on function public.admin_set_grant_status(uuid, public.grant_status, text) to authenticated;
grant execute on function public.admin_delete_grant(uuid, text) to authenticated;
