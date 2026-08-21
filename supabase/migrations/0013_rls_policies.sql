-- 0013_rls_policies
-- Row Level Security on every table.
--
-- A table with RLS enabled and no policy denies everything to anon and
-- authenticated. That is the correct default, and the reason RLS is enabled
-- everywhere rather than selectively.
--
-- Tier 1  public read    - published content, anonymous
-- Tier 2  admin          - role-gated reads and writes
-- Tier 3  service only   - admin read at most; only the secret key writes
--
-- DATABASE_ARCHITECTURE.md §8.

-- ---------------------------------------------------------------------------
-- Role helpers.
--
-- SECURITY DEFINER is load-bearing: a policy on admin_users must read
-- admin_users, which recurses forever without it.
-- ---------------------------------------------------------------------------
create or replace function public.current_admin_role()
returns public.admin_role
language sql
security definer
stable
set search_path = public
as $$
  select role
    from public.admin_users
   where id = auth.uid()
     and status = 'active'
     and deleted_at is null
$$;

create or replace function public.is_admin_at_least(required public.admin_role)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select case public.current_admin_role()
    when 'super_admin' then true
    when 'admin'       then required <> 'super_admin'
    when 'editor'      then required in ('editor', 'viewer')
    when 'viewer'      then required = 'viewer'
    else false
  end
$$;

revoke execute on function public.current_admin_role() from public;
revoke execute on function public.is_admin_at_least(public.admin_role) from public;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.is_admin_at_least(public.admin_role) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere.
-- ---------------------------------------------------------------------------
alter table public.countries                enable row level security;
alter table public.states                   enable row level security;
alter table public.organizations            enable row level security;
alter table public.grant_categories         enable row level security;
alter table public.grant_tags               enable row level security;
alter table public.grants                   enable row level security;
alter table public.grant_category_relations enable row level security;
alter table public.grant_tag_relations      enable row level security;
alter table public.grant_documents          enable row level security;
alter table public.grant_sources            enable row level security;
alter table public.grant_ai_content         enable row level security;
alter table public.grant_answer_capsules    enable row level security;
alter table public.faq_items                enable row level security;
alter table public.grant_versions           enable row level security;
alter table public.grant_history            enable row level security;
alter table public.ai_generation_logs       enable row level security;
alter table public.seo_metadata             enable row level security;
alter table public.schema_markup            enable row level security;
alter table public.same_as_profiles         enable row level security;
alter table public.seo_redirects            enable row level security;
alter table public.crawler_sources          enable row level security;
alter table public.crawler_queue            enable row level security;
alter table public.crawler_pages            enable row level security;
alter table public.crawler_runs             enable row level security;
alter table public.duplicate_detection      enable row level security;
alter table public.admin_users              enable row level security;
alter table public.system_settings          enable row level security;
alter table public.audit_logs               enable row level security;
alter table public.contact_messages         enable row level security;
alter table public.media_library            enable row level security;

-- ===========================================================================
-- TIER 1 — public read
-- ===========================================================================

-- Reference data: active and not deleted.
create policy countries_public_read on public.countries
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

create policy states_public_read on public.states
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

create policy organizations_public_read on public.organizations
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

create policy categories_public_read on public.grant_categories
  for select to anon, authenticated
  using (status = 'active' and deleted_at is null);

create policy tags_public_read on public.grant_tags
  for select to anon, authenticated
  using (true);

-- Grants: published only. A draft is invisible even by direct id.
create policy grants_public_read on public.grants
  for select to anon, authenticated
  using (status = 'published' and deleted_at is null);

-- Child rows inherit visibility from their parent grant, so there is only one
-- place where "is this grant public?" is decided.
create policy gcr_public_read on public.grant_category_relations
  for select to anon, authenticated
  using (exists (select 1 from public.grants g
                  where g.id = grant_category_relations.grant_id
                    and g.status = 'published' and g.deleted_at is null));

create policy gtr_public_read on public.grant_tag_relations
  for select to anon, authenticated
  using (exists (select 1 from public.grants g
                  where g.id = grant_tag_relations.grant_id
                    and g.status = 'published' and g.deleted_at is null));

create policy documents_public_read on public.grant_documents
  for select to anon, authenticated
  using (exists (select 1 from public.grants g
                  where g.id = grant_documents.grant_id
                    and g.status = 'published' and g.deleted_at is null));

create policy sources_public_read on public.grant_sources
  for select to anon, authenticated
  using (exists (select 1 from public.grants g
                  where g.id = grant_sources.grant_id
                    and g.status = 'published' and g.deleted_at is null));

create policy ai_content_public_read on public.grant_ai_content
  for select to anon, authenticated
  using (exists (select 1 from public.grants g
                  where g.id = grant_ai_content.grant_id
                    and g.status = 'published' and g.deleted_at is null));

create policy capsules_public_read on public.grant_answer_capsules
  for select to anon, authenticated
  using (exists (select 1 from public.grants g
                  where g.id = grant_answer_capsules.grant_id
                    and g.status = 'published' and g.deleted_at is null));

-- FAQs: static pages are always public; grant FAQs follow the grant.
create policy faq_public_read on public.faq_items
  for select to anon, authenticated
  using (
    entity_id is null
    or entity_type <> 'grant'
    or exists (select 1 from public.grants g
                where g.id = faq_items.entity_id
                  and g.status = 'published' and g.deleted_at is null)
  );

create policy seo_public_read on public.seo_metadata
  for select to anon, authenticated
  using (
    entity_id is null
    or entity_type <> 'grant'
    or exists (select 1 from public.grants g
                where g.id = seo_metadata.entity_id
                  and g.status = 'published' and g.deleted_at is null)
  );

create policy schema_public_read on public.schema_markup
  for select to anon, authenticated
  using (
    entity_id is null
    or entity_type <> 'grant'
    or exists (select 1 from public.grants g
                where g.id = schema_markup.entity_id
                  and g.status = 'published' and g.deleted_at is null)
  );

create policy same_as_public_read on public.same_as_profiles
  for select to anon, authenticated
  using (enabled);

create policy redirects_public_read on public.seo_redirects
  for select to anon, authenticated
  using (enabled);

-- ===========================================================================
-- TIER 2 — admin writes
-- ===========================================================================

-- Content editing: editor and above.
create policy countries_editor_write on public.countries
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy states_editor_write on public.states
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy organizations_editor_write on public.organizations
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy categories_editor_write on public.grant_categories
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy tags_editor_write on public.grant_tags
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy grants_editor_write on public.grants
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy gcr_editor_write on public.grant_category_relations
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy gtr_editor_write on public.grant_tag_relations
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy documents_editor_write on public.grant_documents
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy sources_editor_write on public.grant_sources
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy ai_content_editor_write on public.grant_ai_content
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy capsules_editor_write on public.grant_answer_capsules
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy faq_editor_write on public.faq_items
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy seo_editor_write on public.seo_metadata
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

create policy schema_editor_write on public.schema_markup
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

-- Configuration: admin and above.
create policy same_as_admin_write on public.same_as_profiles
  for all to authenticated
  using (public.is_admin_at_least('admin'))
  with check (public.is_admin_at_least('admin'));

create policy redirects_admin_write on public.seo_redirects
  for all to authenticated
  using (public.is_admin_at_least('admin'))
  with check (public.is_admin_at_least('admin'));

-- Settings: public keys readable by anyone, everything else admin-only.
create policy settings_public_read on public.system_settings
  for select to anon, authenticated
  using (is_public);

create policy settings_admin_all on public.system_settings
  for all to authenticated
  using (public.is_admin_at_least('admin'))
  with check (public.is_admin_at_least('admin'));

-- Media
create policy media_read on public.media_library
  for select to authenticated
  using (public.is_admin_at_least('viewer'));

create policy media_editor_write on public.media_library
  for all to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

-- Contact form: strangers may write, only staff may read.
create policy contact_anon_insert on public.contact_messages
  for insert to anon, authenticated
  with check (true);

create policy contact_admin_read on public.contact_messages
  for select to authenticated
  using (public.is_admin_at_least('editor'));

create policy contact_admin_update on public.contact_messages
  for update to authenticated
  using (public.is_admin_at_least('editor'))
  with check (public.is_admin_at_least('editor'));

-- Admin users: read your own row; only a super_admin changes roles.
create policy admin_self_read on public.admin_users
  for select to authenticated
  using (id = auth.uid() or public.is_admin_at_least('admin'));

create policy admin_super_write on public.admin_users
  for all to authenticated
  using (public.is_admin_at_least('super_admin'))
  with check (public.is_admin_at_least('super_admin'));

-- ===========================================================================
-- TIER 3 — service only
--
-- Read for staff, no write policy for anyone. The Python pipeline writes with
-- the secret key, which bypasses RLS.
-- ===========================================================================

create policy versions_admin_read on public.grant_versions
  for select to authenticated using (public.is_admin_at_least('viewer'));

create policy history_admin_read on public.grant_history
  for select to authenticated using (public.is_admin_at_least('viewer'));

create policy ai_logs_admin_read on public.ai_generation_logs
  for select to authenticated using (public.is_admin_at_least('viewer'));

create policy crawler_sources_admin_read on public.crawler_sources
  for select to authenticated using (public.is_admin_at_least('viewer'));

create policy crawler_queue_admin_read on public.crawler_queue
  for select to authenticated using (public.is_admin_at_least('viewer'));

create policy crawler_pages_admin_read on public.crawler_pages
  for select to authenticated using (public.is_admin_at_least('viewer'));

create policy crawler_runs_admin_read on public.crawler_runs
  for select to authenticated using (public.is_admin_at_least('viewer'));

create policy duplicates_admin_read on public.duplicate_detection
  for select to authenticated using (public.is_admin_at_least('viewer'));

create policy audit_admin_read on public.audit_logs
  for select to authenticated using (public.is_admin_at_least('admin'));

-- crawler_sources is configuration, so admins may edit it. The queue, pages,
-- runs, duplicate rows, versions, history and audit trail stay write-locked:
-- history must not be rewritable through the API.
create policy crawler_sources_admin_write on public.crawler_sources
  for all to authenticated
  using (public.is_admin_at_least('admin'))
  with check (public.is_admin_at_least('admin'));

-- Duplicate resolution is a human decision, so admins may update the verdict.
create policy duplicates_admin_update on public.duplicate_detection
  for update to authenticated
  using (public.is_admin_at_least('admin'))
  with check (public.is_admin_at_least('admin'));
