-- 0032_fix_sea_otter_open_date_and_category
--
-- "California Sea Otter Fund Grants": sets the open date and corrects the
-- category, from the California Grants Portal listing:
--
--   https://www.grants.ca.gov/grants/sea-otter-recovery-grants/
--
--   Open Date:  7/9/20 17:50        -> we held null
--   Categories: ENVIRONMENT & WATER -> we held Others
--
-- "Environment & Water" maps to the `environment` category. Our taxonomy has
-- no water category and inventing one for a single grant would be a worse
-- answer than the accurate broader one — the portal's own pairing puts them
-- together anyway.
--
-- The portal's open date carries a time (17:50). It is dropped, not converted:
-- grant dates are stored at midnight UTC throughout, which is what the
-- pipeline does (`processors/normalizer.py:247` combines a date with
-- `datetime.min.time()` at UTC), and the site renders dates rather than times.
-- Keeping 17:50 would also raise a timezone question the portal does not
-- answer, and guessing Pacific would shift the *displayed* date to 10 July —
-- one day later than the source says.
--
-- Separate statements rather than data-modifying CTEs, for the reason 0030's
-- first attempt failed: WITH sub-statements share one snapshot and cannot see
-- each other, so clearing the old primary never lands before the new row
-- claims it.
--
-- Scoped to this one slug and guarded on current state, so it is re-runnable.

begin;

-- ---------------------------------------------------------------------------
-- 1. The open date, plus the version bump the admin path would make.
-- ---------------------------------------------------------------------------
update public.grants
   set opens_at = timestamptz '2020-07-09 00:00:00+00',
       current_version = current_version + 1,
       updated_at = now()
 where slug = 'california-sea-otter-fund'
   and deleted_at is null
   and opens_at is null;

-- ---------------------------------------------------------------------------
-- 2. Others -> Environment, in order.
-- ---------------------------------------------------------------------------

-- 2a. Release the primary flag.
update public.grant_category_relations r
   set is_primary = false
  from public.grants g
 where g.id = r.grant_id
   and g.slug = 'california-sea-otter-fund'
   and g.deleted_at is null
   and r.is_primary;

-- 2b. Drop the fallback category.
delete from public.grant_category_relations r
 using public.grants g, public.grant_categories c
 where g.id = r.grant_id
   and g.slug = 'california-sea-otter-fund'
   and g.deleted_at is null
   and c.id = r.category_id
   and c.slug = 'others';

-- 2c. Claim it for Environment.
insert into public.grant_category_relations (grant_id, category_id, is_primary)
select g.id, c.id, true
  from public.grants g, public.grant_categories c
 where g.slug = 'california-sea-otter-fund'
   and g.deleted_at is null
   and c.slug = 'environment'
on conflict (grant_id, category_id) do update set is_primary = true;

-- ---------------------------------------------------------------------------
-- 3. The trail.
-- ---------------------------------------------------------------------------
insert into public.grant_versions (
  grant_id, version_number, snapshot, content_hash, change_reason, created_by_type
)
select g.id, g.current_version, to_jsonb(g) - 'search_vector', g.content_hash,
       'Open date set to 2020-07-09 and category corrected from Others to Environment, per the California Grants Portal listing (migration 0032).',
       'admin'
  from public.grants g
 where g.slug = 'california-sea-otter-fund'
   and g.deleted_at is null
on conflict (grant_id, version_number) do nothing;

insert into public.grant_history (grant_id, action, description, performed_by_type)
select g.id,
       'corrected_from_source',
       'Open date set to 2020-07-09 and category corrected from Others to Environment, per the California Grants Portal listing (migration 0032).',
       'system'
  from public.grants g
 where g.slug = 'california-sea-otter-fund'
   and g.deleted_at is null
   and not exists (
     select 1
       from public.grant_history h
      where h.grant_id = g.id
        and h.description like '%migration 0032%'
   );

commit;
