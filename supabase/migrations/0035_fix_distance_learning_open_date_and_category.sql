-- 0035_fix_distance_learning_open_date_and_category
--
-- "Distance Learning Grant Program": sets the open date and corrects the
-- category, from the California Grants Portal listing:
--
--   https://www.grants.ca.gov/grants/distance-learning-grant-program-2/
--
--   Open Date:  7/6/20 00:00 -> we held null
--   Categories: Education
--               Law, Justice, and Legal Services
--                            -> we held Others
--
-- The portal lists two categories here, not one. `Education` is taken as the
-- primary; `Law, Justice, and Legal Services` has no equivalent in our
-- taxonomy and is dropped rather than approximated. Adding a category for one
-- grant would put an eleventh entry on the directory page that leads to a
-- single record, and mapping it onto an existing category would file the grant
-- somewhere the source does not.
--
-- That gap is worth noticing rather than papering over: the portal's category
-- vocabulary is wider than ours, so some grants will always carry a source
-- category we cannot represent. Reviewing the taxonomy against the portal's
-- list is a separate piece of work.
--
-- The portal shows the programme Closed, consistent with the closes_at of
-- 2020-08-03 already on the row.
--
-- Separate statements, not data-modifying CTEs — see 0030 for why.
-- Scoped to this slug and guarded on current state, so it is re-runnable.

begin;

-- ---------------------------------------------------------------------------
-- 1. The open date, plus the version bump the admin path would make.
-- ---------------------------------------------------------------------------
update public.grants
   set opens_at = timestamptz '2020-07-06 00:00:00+00',
       current_version = current_version + 1,
       updated_at = now()
 where slug = 'distance-learning-grant-program-dlgp'
   and deleted_at is null
   and opens_at is null;

-- ---------------------------------------------------------------------------
-- 2. Others -> Education, in order.
-- ---------------------------------------------------------------------------

-- 2a. Release the primary flag.
update public.grant_category_relations r
   set is_primary = false
  from public.grants g
 where g.id = r.grant_id
   and g.slug = 'distance-learning-grant-program-dlgp'
   and g.deleted_at is null
   and r.is_primary;

-- 2b. Drop the fallback category.
delete from public.grant_category_relations r
 using public.grants g, public.grant_categories c
 where g.id = r.grant_id
   and g.slug = 'distance-learning-grant-program-dlgp'
   and g.deleted_at is null
   and c.id = r.category_id
   and c.slug = 'others';

-- 2c. Claim it for Education.
insert into public.grant_category_relations (grant_id, category_id, is_primary)
select g.id, c.id, true
  from public.grants g, public.grant_categories c
 where g.slug = 'distance-learning-grant-program-dlgp'
   and g.deleted_at is null
   and c.slug = 'education'
on conflict (grant_id, category_id) do update set is_primary = true;

-- ---------------------------------------------------------------------------
-- 3. The trail.
-- ---------------------------------------------------------------------------
insert into public.grant_versions (
  grant_id, version_number, snapshot, content_hash, change_reason, created_by_type
)
select g.id, g.current_version, to_jsonb(g) - 'search_vector', g.content_hash,
       'Open date set to 2020-07-06 and category corrected from Others to Education, per the California Grants Portal listing (migration 0035).',
       'admin'
  from public.grants g
 where g.slug = 'distance-learning-grant-program-dlgp'
   and g.deleted_at is null
on conflict (grant_id, version_number) do nothing;

insert into public.grant_history (grant_id, action, description, performed_by_type)
select g.id,
       'corrected_from_source',
       'Open date set to 2020-07-06 and category corrected from Others to Education, per the California Grants Portal listing (migration 0035). The source also lists "Law, Justice, and Legal Services", which has no equivalent in this taxonomy.',
       'system'
  from public.grants g
 where g.slug = 'distance-learning-grant-program-dlgp'
   and g.deleted_at is null
   and not exists (
     select 1
       from public.grant_history h
      where h.grant_id = g.id
        and h.description like '%migration 0035%'
   );

commit;
