-- 0025_resolve_duplicates
--
-- Acting on a flagged duplicate pair.
--
-- The pipeline writes `duplicate_detection` rows whenever the ladder cannot
-- decide — a fuzzy title match in the uncertain band, or a Gemini comparison
-- that came back below its confidence bar. Until now nothing displayed them,
-- so a flagged pair sat unresolved forever and the held grant stayed a draft
-- indefinitely. The detection worked; the loop was never closed.
--
-- Resolving is two writes that must not come apart: the verdict on the pair,
-- and the fate of the losing grant. A verdict recorded without the archive
-- leaves a visible duplicate the queue now claims to have handled — worse than
-- not having resolved it at all, because nobody will look again.

create or replace function public.admin_resolve_duplicate(
  p_id uuid,
  p_decision public.duplicate_decision,
  p_keep_grant_id uuid default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_pair public.duplicate_detection%rowtype;
  v_archive_id uuid;
  v_next_version integer;
begin
  if not public.is_admin_at_least('editor') then
    raise exception 'not authorised to resolve duplicates'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_pair from public.duplicate_detection where id = p_id;

  if not found then
    raise exception 'duplicate pair not found' using errcode = 'no_data_found';
  end if;

  if v_pair.resolved then
    raise exception 'that pair has already been resolved' using errcode = 'check_violation';
  end if;

  if p_decision = 'duplicate' then
    if p_keep_grant_id is null then
      raise exception 'merging needs the grant to keep' using errcode = 'check_violation';
    end if;

    if p_keep_grant_id not in (v_pair.grant_a_id, v_pair.grant_b_id) then
      raise exception 'the grant to keep must be one of the pair'
        using errcode = 'check_violation';
    end if;

    v_archive_id := case
                      when p_keep_grant_id = v_pair.grant_a_id then v_pair.grant_b_id
                      else v_pair.grant_a_id
                    end;

    -- Archived rather than deleted. The row is the evidence that this
    -- opportunity was seen, and its source URL is what stops the crawler
    -- rediscovering it as new on the next run.
    update public.grants g
       set status = 'archived',
           current_version = g.current_version + 1,
           updated_at = now()
     where g.id = v_archive_id
       and g.deleted_at is null
    returning g.current_version into v_next_version;

    if v_next_version is not null then
      insert into public.grant_versions (
        grant_id, version_number, snapshot, content_hash, change_reason, created_by, created_by_type
      )
      select v_archive_id, v_next_version, to_jsonb(g) - 'search_vector', g.content_hash,
             coalesce(p_reason, 'archived as a duplicate'), v_actor, 'admin'
        from public.grants g
       where g.id = v_archive_id
      on conflict (grant_id, version_number) do nothing;

      insert into public.grant_history (
        grant_id, action, description, performed_by, performed_by_type
      )
      values (
        v_archive_id,
        'archived',
        coalesce(p_reason, 'archived as a duplicate of the grant kept in its place'),
        v_actor,
        'admin'
      );
    end if;

    -- The survivor gets an entry too, so its history explains why it absorbed
    -- another record rather than leaving that discoverable only from the
    -- archived side.
    insert into public.grant_history (
      grant_id, action, description, performed_by, performed_by_type
    )
    values (
      p_keep_grant_id,
      'duplicate_resolved',
      coalesce(p_reason, 'kept over a duplicate record, which was archived'),
      v_actor,
      'admin'
    );
  end if;

  update public.duplicate_detection
     set decision = p_decision,
         resolved = true,
         resolved_by = v_actor,
         resolved_at = now()
   where id = p_id;

  return p_id;
end;
$$;

comment on function public.admin_resolve_duplicate is
  'Records a verdict on a flagged pair and, when they are the same grant, '
  'archives the one not kept — both in one transaction. Archived rather than '
  'deleted so the source URL still stops the crawler rediscovering it.';

revoke execute on function public.admin_resolve_duplicate(uuid, public.duplicate_decision, uuid, text)
  from public, anon;
grant execute on function public.admin_resolve_duplicate(uuid, public.duplicate_decision, uuid, text)
  to authenticated;
