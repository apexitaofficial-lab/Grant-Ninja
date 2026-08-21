-- 0018_publish_grant_rpc
--
-- Publishing a grant is five writes: the grant row, its category relations, a
-- version snapshot, a history entry, and the counters those triggers touch.
-- PostgREST issues one statement per request, so doing this from Python would
-- leave a grant published with no version history if the process died between
-- calls — exactly the state the audit trail exists to prevent.
--
-- A function runs the whole thing in one transaction. Part 7B §154.
--
-- SECURITY INVOKER on purpose: the caller's privileges still apply, so this
-- does not become a way for a lesser role to write rows it could not write
-- directly. The pipeline calls it with the secret key.

create or replace function public.publish_grant(
  p_grant jsonb,
  p_category_ids uuid[] default '{}',
  p_primary_category_id uuid default null,
  p_change_reason text default null,
  p_actor public.actor_type default 'crawler'
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_slug text := p_grant ->> 'slug';
  v_existing public.grants%rowtype;
  v_grant_id uuid;
  v_next_version integer;
  v_action text;
  v_category_id uuid;
begin
  if v_slug is null or v_slug = '' then
    raise exception 'publish_grant requires a slug' using errcode = 'check_violation';
  end if;

  select * into v_existing from public.grants where slug = v_slug;

  if found then
    -- Unchanged content is not an update. Returning early keeps the version
    -- history meaningful: a row per real change, not a row per crawl.
    if v_existing.content_hash is not distinct from (p_grant ->> 'content_hash') then
      return v_existing.id;
    end if;

    update public.grants
       set title             = coalesce(p_grant ->> 'title', title),
           short_description = p_grant ->> 'short_description',
           full_description  = p_grant ->> 'full_description',
           eligibility       = p_grant ->> 'eligibility',
           organization_id   = coalesce((p_grant ->> 'organization_id')::uuid, organization_id),
           country_id        = coalesce((p_grant ->> 'country_id')::uuid, country_id),
           state_id          = (p_grant ->> 'state_id')::uuid,
           funding_amount    = (p_grant ->> 'funding_amount')::numeric,
           minimum_amount    = (p_grant ->> 'minimum_amount')::numeric,
           maximum_amount    = (p_grant ->> 'maximum_amount')::numeric,
           currency          = coalesce(p_grant ->> 'currency', currency),
           grant_type        = coalesce((p_grant ->> 'grant_type')::public.grant_funding_type, grant_type),
           status            = coalesce((p_grant ->> 'status')::public.grant_status, status),
           official_url      = p_grant ->> 'official_url',
           application_url   = p_grant ->> 'application_url',
           source_url        = p_grant ->> 'source_url',
           opens_at          = (p_grant ->> 'opens_at')::timestamptz,
           closes_at         = (p_grant ->> 'closes_at')::timestamptz,
           is_federal        = coalesce((p_grant ->> 'is_federal')::boolean, is_federal),
           is_private        = coalesce((p_grant ->> 'is_private')::boolean, is_private),
           content_hash      = p_grant ->> 'content_hash',
           ai_confidence     = (p_grant ->> 'ai_confidence')::smallint,
           last_verified_at  = now(),
           current_version   = current_version + 1,
           published_at      = case
                                 when (p_grant ->> 'status') = 'published' and published_at is null
                                 then now() else published_at
                               end
     where id = v_existing.id
    returning id, current_version into v_grant_id, v_next_version;

    v_action := 'updated';
  else
    insert into public.grants (
      title, slug, short_description, full_description, eligibility,
      organization_id, country_id, state_id,
      funding_amount, minimum_amount, maximum_amount, currency,
      grant_type, status, official_url, application_url, source_url,
      opens_at, closes_at, is_federal, is_private,
      content_hash, ai_confidence, last_verified_at, published_at
    )
    values (
      p_grant ->> 'title',
      v_slug,
      p_grant ->> 'short_description',
      p_grant ->> 'full_description',
      p_grant ->> 'eligibility',
      (p_grant ->> 'organization_id')::uuid,
      (p_grant ->> 'country_id')::uuid,
      (p_grant ->> 'state_id')::uuid,
      (p_grant ->> 'funding_amount')::numeric,
      (p_grant ->> 'minimum_amount')::numeric,
      (p_grant ->> 'maximum_amount')::numeric,
      coalesce(p_grant ->> 'currency', 'USD'),
      coalesce((p_grant ->> 'grant_type')::public.grant_funding_type, 'other'),
      coalesce((p_grant ->> 'status')::public.grant_status, 'draft'),
      p_grant ->> 'official_url',
      p_grant ->> 'application_url',
      p_grant ->> 'source_url',
      (p_grant ->> 'opens_at')::timestamptz,
      (p_grant ->> 'closes_at')::timestamptz,
      coalesce((p_grant ->> 'is_federal')::boolean, false),
      coalesce((p_grant ->> 'is_private')::boolean, false),
      p_grant ->> 'content_hash',
      (p_grant ->> 'ai_confidence')::smallint,
      now(),
      case when (p_grant ->> 'status') = 'published' then now() else null end
    )
    returning id, current_version into v_grant_id, v_next_version;

    v_action := 'created';
  end if;

  -- Categories are replaced wholesale: the extraction is the current truth
  -- about what this grant is, and a stale classification is worse than none.
  if array_length(p_category_ids, 1) is not null then
    delete from public.grant_category_relations where grant_id = v_grant_id;

    foreach v_category_id in array p_category_ids loop
      insert into public.grant_category_relations (grant_id, category_id, is_primary)
      values (v_grant_id, v_category_id, v_category_id = p_primary_category_id)
      on conflict (grant_id, category_id) do nothing;
    end loop;
  end if;

  -- Append-only trail. The snapshot is the row as it now stands, so a
  -- rollback never has to reconstruct anything.
  insert into public.grant_versions (
    grant_id, version_number, snapshot, content_hash, change_reason, created_by_type
  )
  select
    v_grant_id,
    v_next_version,
    to_jsonb(g) - 'search_vector',
    g.content_hash,
    p_change_reason,
    p_actor
  from public.grants g
  where g.id = v_grant_id
  on conflict (grant_id, version_number) do nothing;

  insert into public.grant_history (grant_id, action, description, performed_by_type)
  values (v_grant_id, v_action, p_change_reason, p_actor);

  return v_grant_id;
end;
$$;

comment on function public.publish_grant is
  'Publishes or updates one grant with its categories, version snapshot and '
  'history entry in a single transaction. Returns the grant id. Unchanged '
  'content is a no-op so the version history records real changes only.';

-- Only the trusted server identity may call this.
revoke execute on function public.publish_grant(jsonb, uuid[], uuid, text, public.actor_type) from public, anon, authenticated;
grant execute on function public.publish_grant(jsonb, uuid[], uuid, text, public.actor_type) to service_role;
