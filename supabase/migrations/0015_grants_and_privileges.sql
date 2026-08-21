-- 0015_grants_and_privileges
--
-- RLS decides *which rows* a role may see. Table-level GRANTs decide whether
-- the role may touch the table at all, and both are required. Objects created
-- by a migration are owned by `postgres` and carry no grants to `anon` or
-- `authenticated`, so without this every policy in 0013 sits behind a
-- "permission denied for table" error.
--
-- Grants are listed explicitly rather than using GRANT ... ON ALL TABLES so
-- that a table added later is unreachable until someone deliberately opens it.

grant usage on schema public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tier 1 — readable by anonymous visitors.
-- The row filter still applies: only published grants, active reference data,
-- enabled profiles and is_public settings are returned.
-- ---------------------------------------------------------------------------
grant select on table
  public.countries,
  public.states,
  public.organizations,
  public.grant_categories,
  public.grant_tags,
  public.grants,
  public.grant_category_relations,
  public.grant_tag_relations,
  public.grant_documents,
  public.grant_sources,
  public.grant_ai_content,
  public.grant_answer_capsules,
  public.faq_items,
  public.seo_metadata,
  public.schema_markup,
  public.same_as_profiles,
  public.seo_redirects,
  public.system_settings
to anon, authenticated;

-- The contact form accepts writes from strangers but never reveals the inbox:
-- INSERT only, with no SELECT for anon.
grant insert on table public.contact_messages to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tier 2 — signed-in staff.
--
-- Broad DML here is safe because every write policy calls is_admin_at_least().
-- A signed-in account with no granted role fails that check, so the grant
-- opens the door and the policy decides who walks through.
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on table
  public.countries,
  public.states,
  public.organizations,
  public.grant_categories,
  public.grant_tags,
  public.grants,
  public.grant_category_relations,
  public.grant_tag_relations,
  public.grant_documents,
  public.grant_sources,
  public.grant_ai_content,
  public.grant_answer_capsules,
  public.faq_items,
  public.seo_metadata,
  public.schema_markup,
  public.same_as_profiles,
  public.seo_redirects,
  public.system_settings,
  public.media_library,
  public.admin_users,
  public.crawler_sources,
  public.duplicate_detection
to authenticated;

grant select, update on table public.contact_messages to authenticated;

-- ---------------------------------------------------------------------------
-- Tier 3 — read-only for staff, written only by the secret key.
--
-- No INSERT/UPDATE/DELETE grant, and 0013 defines no write policy either.
-- Two independent locks on the audit trail: history cannot be rewritten
-- through the API even if a policy were added by mistake.
-- ---------------------------------------------------------------------------
grant select on table
  public.grant_versions,
  public.grant_history,
  public.ai_generation_logs,
  public.crawler_queue,
  public.crawler_pages,
  public.crawler_runs,
  public.audit_logs
to authenticated;

-- ---------------------------------------------------------------------------
-- New accounts start deactivated.
--
-- current_admin_role() only considers active rows, so an inactive account
-- resolves to NULL and fails every is_admin_at_least() check. Access becomes
-- something a super_admin grants, rather than something signing up confers.
-- See supabase/README.md for promoting the first super_admin.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_users (id, email, display_name, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    'viewer',
    'inactive'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
