-- 0030_fix_zev_blueprints_category
--
-- "MD/HD ZEV and ZEV Infrastructure Planning Blueprints" is filed under
-- Others. The California Grants Portal lists it under ENERGY:
--
--   https://www.grants.ca.gov/grants/gfo-20-601-blueprints-for-medium-and-heavy-duty-zero-emission-vehicle-infrastructure/
--
-- One grant, corrected because it was reported. It is not the underlying
-- problem: 83 of 91 published grants sit in Others, because both source
-- portals publish a category as a structured field and neither adapter keeps
-- it — categories are re-derived from AI keywords and fall back to Others when
-- nothing matches. Correcting rows by hand cannot catch up with that; the next
-- crawl adds more. Raised separately.
--
-- ---------------------------------------------------------------------------
-- Why this repeats the admin function instead of calling it
-- ---------------------------------------------------------------------------
-- `admin_set_grant_classification` is the right path for this change and
-- cannot be used here: it opens with `is_admin_at_least('editor')`, which
-- reads `auth.uid()`, and a migration runs as the owner with no session. So
-- the steps it performs are reproduced — including the version snapshot and
-- the history row, which are the reason that function exists. A classification
-- change that leaves no trail is exactly what migration 0022 was written to
-- prevent.
--
-- Every statement is scoped to the one grant and guarded on its current state,
-- so this is re-runnable and cannot touch anything else.

begin;

-- ---------------------------------------------------------------------------
-- 1. Bump the version, as the admin path does on a classification change.
-- ---------------------------------------------------------------------------
update public.grants
   set current_version = current_version + 1,
       updated_at = now()
 where slug = 'md-hd-zev-and-zev-infrastructure-planning-blueprints'
   and deleted_at is null
   and exists (
     select 1
       from public.grant_category_relations r
       join public.grant_categories c on c.id = r.category_id
      where r.grant_id = grants.id
        and c.slug = 'others'
   );

-- ---------------------------------------------------------------------------
-- 2. Swap Others for Energy — as three separate statements, deliberately.
--
-- `uk_grant_primary_category` is a partial unique index permitting one primary
-- per grant, so the old flag must be gone before the new row claims it.
--
-- The first version of this migration expressed that as data-modifying CTEs —
-- clear, delete, then insert — and it failed with 23505 on exactly that index.
-- Postgres runs the sub-statements of a WITH clause against a single snapshot
-- and does not make their effects visible to each other, so the insert still
-- saw the old row flagged primary and there were momentarily two. CTEs express
-- *composition*, not *sequence*; only separate statements give ordering, and
-- ordering is the whole requirement here.
-- ---------------------------------------------------------------------------

-- 2a. Release the flag.
update public.grant_category_relations r
   set is_primary = false
  from public.grants g
 where g.id = r.grant_id
   and g.slug = 'md-hd-zev-and-zev-infrastructure-planning-blueprints'
   and g.deleted_at is null
   and r.is_primary;

-- 2b. Drop the fallback category.
delete from public.grant_category_relations r
 using public.grants g, public.grant_categories c
 where g.id = r.grant_id
   and g.slug = 'md-hd-zev-and-zev-infrastructure-planning-blueprints'
   and g.deleted_at is null
   and c.id = r.category_id
   and c.slug = 'others';

-- 2c. Claim it for Energy.
insert into public.grant_category_relations (grant_id, category_id, is_primary)
select g.id, c.id, true
  from public.grants g, public.grant_categories c
 where g.slug = 'md-hd-zev-and-zev-infrastructure-planning-blueprints'
   and g.deleted_at is null
   and c.slug = 'energy'
on conflict (grant_id, category_id) do update set is_primary = true;

-- ---------------------------------------------------------------------------
-- 3. The trail.
-- ---------------------------------------------------------------------------
insert into public.grant_versions (
  grant_id, version_number, snapshot, content_hash, change_reason, created_by_type
)
select g.id, g.current_version, to_jsonb(g) - 'search_vector', g.content_hash,
       'Category corrected from Others to Energy to match the California Grants Portal listing (migration 0030).',
       'admin'
  from public.grants g
 where g.slug = 'md-hd-zev-and-zev-infrastructure-planning-blueprints'
   and g.deleted_at is null
on conflict (grant_id, version_number) do nothing;

insert into public.grant_history (grant_id, action, description, performed_by_type)
select g.id,
       'classification_changed',
       'Category corrected from Others to Energy to match the California Grants Portal listing (migration 0030).',
       'system'
  from public.grants g
 where g.slug = 'md-hd-zev-and-zev-infrastructure-planning-blueprints'
   and g.deleted_at is null
   and not exists (
     select 1
       from public.grant_history h
      where h.grant_id = g.id
        and h.description like '%migration 0030%'
   );

commit;
