-- 0028_remove_seed_and_test_data
--
-- Takes development sample data and one test record off the public site.
--
-- `supabase/seed/dev_sample_grants.sql` says of itself: "DEVELOPMENT SAMPLE
-- DATA — NOT A MIGRATION. Deliberately kept out of supabase/migrations/ so it
-- never applies to a real environment by accident. The funding figures, dates
-- and descriptions are ILLUSTRATIVE and were not taken from the agency
-- notices." It was applied to production regardless, so six invented grants —
-- carrying award figures up to $20,000,000 — have been served as verified
-- records on a directory whose stated promise is that every entry links to the
-- official source it came from.
--
-- Alongside them, `test-usa-manual-grant-united-states` is worse in one
-- specific way: its official_url, application_url and source_url all point at
-- https://grant-ninja.apexita.com/admin/grants/new. A public, indexed page has
-- been offering "Read the official notice" and "Apply on the agency site"
-- buttons that lead to the admin panel's own create-grant form.
--
-- All seven are in the sitemap, so search engines have been told they exist.
--
-- ---------------------------------------------------------------------------
-- Why soft delete rather than the seed file's `delete from grants`
-- ---------------------------------------------------------------------------
-- Row Level Security already restricts public reads to `deleted_at is null`,
-- so setting it removes these rows from every listing, every grant page and
-- the sitemap — the same visible outcome as a hard delete. What it keeps is
-- the version and history rows, which are the record of what was published and
-- when. That evidence is worth more than the disk space, and it makes this
-- migration reversible: clearing `deleted_at` puts a row back.
--
-- The `trg_grants_sync_counts` trigger fires on `update of ... deleted_at`, so
-- countries, states and organizations recount themselves. No manual fix-up.
--
-- ---------------------------------------------------------------------------
-- Why the agencies are renamed rather than removed
-- ---------------------------------------------------------------------------
-- The seed file's own cleanup is:
--
--   delete from grants where slug like 'sample-%';
--   delete from organizations where slug like 'sample-%';
--
-- The second line is now dangerous. Since the seed ran, the crawler has
-- matched **14 real grants** to those five organization rows — 10 to the NIH
-- record and 4 to the NSF one — because they carry the agencies' real names
-- and the matcher had nothing else to match against. There is no non-sample
-- record for NIH, NSF, DOE, NASA or NIST: these rows *are* the live agency
-- records. `organization_id` is `on delete restrict`, so that delete either
-- fails outright or, without the constraint, would take real grants with it.
--
-- So the rows stay and only the slug changes, which is a cosmetic fix to a
-- public URL. Each rename writes a 301 in the same statement, mirroring what
-- `admin_rename_slug` does, so the eleven indexed `/agencies/sample-…` URLs
-- keep resolving.

begin;

-- ---------------------------------------------------------------------------
-- 1. The fabricated and test grants
-- ---------------------------------------------------------------------------
update public.grants
   set deleted_at = now(),
       status = 'archived'
 where deleted_at is null
   and (slug like 'sample-%' or slug = 'test-usa-manual-grant-united-states');

-- ---------------------------------------------------------------------------
-- 2. Their audit trail records why they went, from either side.
-- ---------------------------------------------------------------------------
insert into public.grant_history (grant_id, action, description, performed_by_type)
select g.id,
       'archived',
       case
         when g.slug = 'test-usa-manual-grant-united-states'
           then 'Removed by migration 0028: test record whose official, application and source URLs all pointed at the admin panel.'
         else 'Removed by migration 0028: development sample data from supabase/seed/dev_sample_grants.sql, published in error. Figures and dates were illustrative, never sourced.'
       end,
       'system'
  from public.grants g
 where g.deleted_at is not null
   and (g.slug like 'sample-%' or g.slug = 'test-usa-manual-grant-united-states')
   -- Re-runnable. The other two statements no-op on a second pass by their own
   -- guards — nothing is left un-deleted, no old slug is left to rename — but
   -- an unguarded insert would stack a duplicate history row every time. That
   -- matters because this may be applied by hand in the SQL editor, which does
   -- not record it in the CLI's migration history, so a later `db push` will
   -- try it again.
   and not exists (
     select 1
       from public.grant_history h
      where h.grant_id = g.id
        and h.action = 'archived'
        and h.description like 'Removed by migration 0028:%'
   );

-- ---------------------------------------------------------------------------
-- 3. Agency slugs, with a redirect each.
--
-- Written as one statement over a values list rather than five copied blocks,
-- so a sixth is a line rather than a paragraph. Guarded on the target slug
-- being free: if one has been taken since this was written, that row is
-- skipped instead of the migration failing on a unique violation.
-- ---------------------------------------------------------------------------
with renames (old_slug, new_slug) as (
  values
    ('sample-national-institutes-of-health', 'national-institutes-of-health'),
    ('sample-national-science-foundation',   'national-science-foundation'),
    ('sample-department-of-energy',          'department-of-energy'),
    ('sample-nasa',                          'nasa'),
    ('sample-nist',                          'nist')
),
applicable as (
  select r.old_slug, r.new_slug
    from renames r
    join public.organizations o on o.slug = r.old_slug
   where not exists (
     select 1 from public.organizations t where t.slug = r.new_slug
   )
),
renamed as (
  update public.organizations o
     set slug = a.new_slug
    from applicable a
   where o.slug = a.old_slug
  returning a.old_slug, a.new_slug
),
-- Any redirect already aimed at an address being vacated is repointed at the
-- final destination rather than left to hop through it. There are none today,
-- but `admin_rename_slug` does this and migration 0024 exists because chains
-- are exactly where slug renames go wrong; a migration that behaves
-- differently from the function it mirrors is a trap for whoever reads it next.
flattened as (
  update public.seo_redirects r
     set destination_path = '/agencies/' || a.new_slug
    from applicable a
   where r.destination_path = '/agencies/' || a.old_slug
  returning r.id
)
insert into public.seo_redirects (source_path, destination_path, status_code, enabled)
select '/agencies/' || old_slug, '/agencies/' || new_slug, 301, true
  from renamed
 -- `ck_seo_redirects_not_self` would refuse a row pointing at itself; the
 -- rename cannot produce one, but the guard costs nothing and states the rule.
 where old_slug <> new_slug
    on conflict (source_path) do update
       set destination_path = excluded.destination_path,
           enabled = true;

commit;

-- ---------------------------------------------------------------------------
-- After applying
-- ---------------------------------------------------------------------------
-- The sitemap declares `revalidate = 3600`, so the twelve removed URLs leave
-- it within the hour; a redeploy is faster. They should then be submitted for
-- removal in Search Console rather than left to be recrawled.
--
-- Published grants drop from 86 to 79. The homepage counter has been
-- overstating the catalogue by seven.
