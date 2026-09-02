-- 0034_fix_tobacco_free_open_date_and_category
--
-- "Tobacco-Free for Recovery": sets the open date and corrects the category,
-- from the California Grants Portal listing:
--
--   https://www.grants.ca.gov/grants/cg-20-10230-tobacco-free-for-recovery/
--
--   Open Date:  6/18/20 00:00        -> we held null
--   Categories: HEALTH & HUMAN SERVICES -> we held Others
--
-- The portal shows the programme Closed, consistent with the closes_at of
-- 2020-08-14 already on the row.
--
-- Separate statements, not data-modifying CTEs: WITH sub-statements share one
-- snapshot and cannot see each other, which is how 0030's first attempt broke
-- `uk_grant_primary_category`.
--
-- Scoped to this slug and guarded on current state, so it is re-runnable.
--
-- Note for whoever reads this next: the slug is
-- `wellness-quality-improvement-projects-qip` while the grant is
-- "Tobacco-Free for Recovery". Grant slugs are permanent by decision D5, so it
-- is left alone here — but the public URL describes a different programme than
-- the page it serves, which is worth deciding on separately.

begin;

-- ---------------------------------------------------------------------------
-- 1. The open date, plus the version bump the admin path would make.
-- ---------------------------------------------------------------------------
update public.grants
   set opens_at = timestamptz '2020-06-18 00:00:00+00',
       current_version = current_version + 1,
       updated_at = now()
 where slug = 'wellness-quality-improvement-projects-qip'
   and deleted_at is null
   and opens_at is null;

-- ---------------------------------------------------------------------------
-- 2. Others -> Healthcare, in order.
-- ---------------------------------------------------------------------------

-- 2a. Release the primary flag.
update public.grant_category_relations r
   set is_primary = false
  from public.grants g
 where g.id = r.grant_id
   and g.slug = 'wellness-quality-improvement-projects-qip'
   and g.deleted_at is null
   and r.is_primary;

-- 2b. Drop the fallback category.
delete from public.grant_category_relations r
 using public.grants g, public.grant_categories c
 where g.id = r.grant_id
   and g.slug = 'wellness-quality-improvement-projects-qip'
   and g.deleted_at is null
   and c.id = r.category_id
   and c.slug = 'others';

-- 2c. Claim it for Healthcare.
insert into public.grant_category_relations (grant_id, category_id, is_primary)
select g.id, c.id, true
  from public.grants g, public.grant_categories c
 where g.slug = 'wellness-quality-improvement-projects-qip'
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
       'Open date set to 2020-06-18 and category corrected from Others to Healthcare, per the California Grants Portal listing (migration 0034).',
       'admin'
  from public.grants g
 where g.slug = 'wellness-quality-improvement-projects-qip'
   and g.deleted_at is null
on conflict (grant_id, version_number) do nothing;

insert into public.grant_history (grant_id, action, description, performed_by_type)
select g.id,
       'corrected_from_source',
       'Open date set to 2020-06-18 and category corrected from Others to Healthcare, per the California Grants Portal listing (migration 0034).',
       'system'
  from public.grants g
 where g.slug = 'wellness-quality-improvement-projects-qip'
   and g.deleted_at is null
   and not exists (
     select 1
       from public.grant_history h
      where h.grant_id = g.id
        and h.description like '%migration 0034%'
   );

commit;
