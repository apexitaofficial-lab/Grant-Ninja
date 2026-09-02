-- 0033_fix_childrens_hospital_source_date_category
--
-- "Children's Hospital Bond Act of 2018 Grant Program": replaces a source link
-- that returns 403, sets the open date, and corrects the category.
--
-- ---------------------------------------------------------------------------
-- Which listing this grant actually is
-- ---------------------------------------------------------------------------
-- The California Grants Portal carries two programmes under the 2018 Act, and
-- they are not the same thing:
--
--   .../childrens-hospital-program-of-2018-eligible-hospitals/
--       Open 8 Jul 2020 · Closed, 6 applications · Health & Human Services
--
--   .../childrens-hospital-program-of-2018-childrens-hospitals/
--       Open 22 Feb 2022 · Active · Health & Human Services
--
-- This row was crawled from the first — `source_url` still points at it — and
-- holds `closes_at = 2020-09-10`, which belongs to the 2020 cycle. The second
-- opened eighteen months later and is still taking applications.
--
-- The reported fix named the *second* URL. Using it would have replaced a link
-- that fails visibly with one that fails silently: a page for a different,
-- still-open programme sitting under a 2020 closing date, which a reader has
-- no way to detect. So the official link is set to the listing this record was
-- actually built from, which serves 200 and describes these dates.
--
-- ---------------------------------------------------------------------------
-- What changes
-- ---------------------------------------------------------------------------
--   official_url  treasurer.ca.gov/.../chp18-regulations.pdf  (HTTP 403)
--                 -> grants.ca.gov/.../-eligible-hospitals/    (HTTP 200)
--   opens_at      null      -> 2020-07-08   ("Open Date: 7/8/20 12:01")
--   category      Others    -> Healthcare   ("HEALTH & HUMAN SERVICES")
--
-- The portal's time (12:01) is dropped, matching how the pipeline stores dates
-- — midnight UTC — and because the site renders dates rather than times.
--
-- Separate statements, not data-modifying CTEs: WITH sub-statements share one
-- snapshot and cannot see each other, which is how 0030's first attempt broke
-- `uk_grant_primary_category`.
--
-- Scoped to this slug and guarded on current state, so it is re-runnable.

begin;

-- ---------------------------------------------------------------------------
-- 1. Working source link, open date, version bump.
-- ---------------------------------------------------------------------------
update public.grants
   set official_url = 'https://www.grants.ca.gov/grants/childrens-hospital-program-of-2018-eligible-hospitals/',
       opens_at = coalesce(opens_at, timestamptz '2020-07-08 00:00:00+00'),
       current_version = current_version + 1,
       updated_at = now()
 where slug = 'children-s-hospital-bond-act-of-2018'
   and deleted_at is null
   and (official_url is distinct from
        'https://www.grants.ca.gov/grants/childrens-hospital-program-of-2018-eligible-hospitals/'
        or opens_at is null);

-- ---------------------------------------------------------------------------
-- 2. Others -> Healthcare, in order.
-- ---------------------------------------------------------------------------

-- 2a. Release the primary flag.
update public.grant_category_relations r
   set is_primary = false
  from public.grants g
 where g.id = r.grant_id
   and g.slug = 'children-s-hospital-bond-act-of-2018'
   and g.deleted_at is null
   and r.is_primary;

-- 2b. Drop the fallback category.
delete from public.grant_category_relations r
 using public.grants g, public.grant_categories c
 where g.id = r.grant_id
   and g.slug = 'children-s-hospital-bond-act-of-2018'
   and g.deleted_at is null
   and c.id = r.category_id
   and c.slug = 'others';

-- 2c. Claim it for Healthcare.
insert into public.grant_category_relations (grant_id, category_id, is_primary)
select g.id, c.id, true
  from public.grants g, public.grant_categories c
 where g.slug = 'children-s-hospital-bond-act-of-2018'
   and g.deleted_at is null
   and c.slug = 'healthcare'
on conflict (grant_id, category_id) do update set is_primary = true;

-- ---------------------------------------------------------------------------
-- 3. The trail.
-- ---------------------------------------------------------------------------
insert into public.grant_versions (
  grant_id, version_number, snapshot, content_hash, change_reason, created_by_type
)
select g.id, g.current_version, to_jsonb(g) - 'search_vector', g.content_hash,
       'Official link repointed from a 403 PDF to the California Grants Portal listing this record was crawled from, open date set to 2020-07-08, category corrected from Others to Healthcare (migration 0033).',
       'admin'
  from public.grants g
 where g.slug = 'children-s-hospital-bond-act-of-2018'
   and g.deleted_at is null
on conflict (grant_id, version_number) do nothing;

insert into public.grant_history (grant_id, action, description, performed_by_type)
select g.id,
       'corrected_from_source',
       'Official link repointed from a 403 PDF to the California Grants Portal listing this record was crawled from, open date set to 2020-07-08, category corrected from Others to Healthcare (migration 0033).',
       'system'
  from public.grants g
 where g.slug = 'children-s-hospital-bond-act-of-2018'
   and g.deleted_at is null
   and not exists (
     select 1
       from public.grant_history h
      where h.grant_id = g.id
        and h.description like '%migration 0033%'
   );

commit;
