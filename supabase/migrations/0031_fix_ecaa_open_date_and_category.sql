-- 0031_fix_ecaa_open_date_and_category
--
-- "Energy Conservation Assistance Act (ECAA) Program": sets the open date and
-- corrects the category, from the California Grants Portal listing:
--
--   https://www.grants.ca.gov/grants/pon-19-101-energy-conservation-assistance-act-education-subaccount-ecaa-ed-competitive-loan-program/
--
--   Open Date:  2/25/20 00:00   -> we held null
--   Category:   EDUCATION       -> we held Others
--
-- The category is worth reading twice. This is an *energy* conservation
-- programme and the portal files it under Education, because the money comes
-- from the Education Subaccount and goes to schools. Deriving it from the
-- title — which is what the pipeline effectively does — gets Energy, and Energy
-- is wrong. The source is filing on the funding stream, not the subject, and
-- the source is the authority.
--
-- Stored midnight UTC, matching how closes_at is held on the same row.
--
-- Structured in separate statements rather than data-modifying CTEs. 0030's
-- first attempt used CTEs and failed on `uk_grant_primary_category`: Postgres
-- runs WITH sub-statements against one snapshot and does not show their
-- effects to each other, so clearing the old primary never lands before the
-- new row claims it. Sequence needs statements.
--
-- Every statement is scoped to this one slug and guarded on current state, so
-- it is re-runnable and cannot reach another grant.

begin;

-- ---------------------------------------------------------------------------
-- 1. The open date, plus the version bump the admin path would make.
-- ---------------------------------------------------------------------------
update public.grants
   set opens_at = timestamptz '2020-02-25 00:00:00+00',
       current_version = current_version + 1,
       updated_at = now()
 where slug = 'energy-conservation-assistance-act-ecaa-program'
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
   and g.slug = 'energy-conservation-assistance-act-ecaa-program'
   and g.deleted_at is null
   and r.is_primary;

-- 2b. Drop the fallback category.
delete from public.grant_category_relations r
 using public.grants g, public.grant_categories c
 where g.id = r.grant_id
   and g.slug = 'energy-conservation-assistance-act-ecaa-program'
   and g.deleted_at is null
   and c.id = r.category_id
   and c.slug = 'others';

-- 2c. Claim it for Education.
insert into public.grant_category_relations (grant_id, category_id, is_primary)
select g.id, c.id, true
  from public.grants g, public.grant_categories c
 where g.slug = 'energy-conservation-assistance-act-ecaa-program'
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
       'Open date set to 2020-02-25 and category corrected from Others to Education, per the California Grants Portal listing (migration 0031).',
       'admin'
  from public.grants g
 where g.slug = 'energy-conservation-assistance-act-ecaa-program'
   and g.deleted_at is null
on conflict (grant_id, version_number) do nothing;

insert into public.grant_history (grant_id, action, description, performed_by_type)
select g.id,
       'corrected_from_source',
       'Open date set to 2020-02-25 and category corrected from Others to Education, per the California Grants Portal listing (migration 0031).',
       'system'
  from public.grants g
 where g.slug = 'energy-conservation-assistance-act-ecaa-program'
   and g.deleted_at is null
   and not exists (
     select 1
       from public.grant_history h
      where h.grant_id = g.id
        and h.description like '%migration 0031%'
   );

commit;
