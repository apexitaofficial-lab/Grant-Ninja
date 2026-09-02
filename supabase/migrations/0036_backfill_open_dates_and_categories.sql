-- 0036_backfill_open_dates_and_categories
--
-- Corrects the open date and category on 38 grants, read from the listing each
-- record was crawled from.
--
-- Sources, both structured fields rather than scraped prose:
--   grants.gov     api.grants.gov/v1/api/fetchOpportunity
--                    synopsis.postingDate
--                    synopsis.fundingActivityCategories
--   grants.ca.gov  the listing page's own "Open Date" and CATEGORIES fields
--
-- ---------------------------------------------------------------------------
-- Category mapping
-- ---------------------------------------------------------------------------
-- Only these source values have an equivalent in the eleven categories we
-- publish:
--
--   Agriculture                                     -> agriculture
--   Education                                       -> education
--   Energy                                          -> energy
--   Environment / Environment & Water               -> environment
--   Health / Health & Human Services                -> healthcare
--   Science and Technology and other R&D            -> research-and-development
--   Science, Technology, and Research & Development -> research-and-development
--
-- These source categories have no equivalent, so the grants carrying them keep
-- Others. That is the correct answer for them, not a failure to classify:
--
--   Disadvantaged Communities · Disaster Prevention & Relief ·
--   Employment, Labor and Training · Housing, Community and Economic
--   Development · Income Security and Social Services · Infrastructure
--   Investment and Jobs Act (IIJA) · Law, Justice and Legal Services ·
--   Parks & Recreation · Transportation · and grants.gov's literal
--   "Other (see text field ...)".
--
-- Where a grant lists several source categories, the first with an equivalent
-- becomes the primary. The others are not added as extra relations.
--
-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
-- Dates are stored at midnight UTC, matching the pipeline
-- (`processors/normalizer.py:247`) and the fact that the site renders dates
-- rather than times. Times published by the source are dropped rather than
-- converted, which would need a timezone the source does not state.
--
-- Open dates are set only where the column is null: a value already there was
-- entered deliberately and is not overwritten. Every date was checked against
-- that row's closes_at before this was generated, so `ck_grants_date_range`
-- cannot trip.
--
-- Statements are separate rather than data-modifying CTEs. WITH sub-statements
-- share one snapshot and cannot see each other's effects, which is how an
-- earlier migration of this shape broke `uk_grant_primary_category`.
--
-- Every statement is guarded on current state, so this is re-runnable.
--
-- Not covered: `egypt-annual-program-statement`. Its opportunity (363735) now
-- returns an empty record from grants.gov — withdrawn — so there is no source
-- to read, and nothing here is guessed.

begin;

-- ---------------------------------------------------------------------------
-- 1. Open dates (33 grants). Only where the column is null.
-- ---------------------------------------------------------------------------
update public.grants g
   set opens_at = v.opens_at,
       current_version = g.current_version + 1,
       updated_at = now()
  from (values
    ('step-implementation-grant', timestamptz '2020-06-04 00:00:00+00'),
    ('proposition-68-multi-benefit-projects-in-urbanized-areas-to-address-flooding', timestamptz '2020-06-05 00:00:00+00'),
    ('stream-flow-enhancement-program-solicitation', timestamptz '2020-07-10 00:00:00+00'),
    ('vertebrate-pest-control-research-program', timestamptz '2020-08-19 00:00:00+00'),
    ('irwm-grant-program', timestamptz '2019-04-22 00:00:00+00'),
    ('urban-greening-program', timestamptz '2020-06-09 00:00:00+00'),
    ('2020-public-access-proposal-solicitation', timestamptz '2020-05-28 00:00:00+00'),
    ('proposition-1-grant-program-round-3', timestamptz '2020-08-10 00:00:00+00'),
    ('lower-american-river-conservancy-program-solicitation', timestamptz '2020-06-02 00:00:00+00'),
    ('clean-transportation-program-fueling-infrastructure-for-medium-and-heavy-duty-ze', timestamptz '2020-07-23 00:00:00+00'),
    ('hydrogen-fuel-cell-systems-and-hydrogen-fueling-infrastructure-for-locomotive-an', timestamptz '2020-07-20 00:00:00+00'),
    ('san-joaquin-fish-population-enhancement-program', timestamptz '2019-07-02 00:00:00+00'),
    ('urban-streams-restoration-program', timestamptz '2019-07-02 00:00:00+00'),
    ('freedom-shield-global-forced-labor-import-prohibition-initiative', timestamptz '2026-08-21 00:00:00+00'),
    ('protecting-the-american-seafood-supply-chain-by-countering-unfair-labor-practice', timestamptz '2026-08-21 00:00:00+00'),
    ('agriculture-risk-management-education-partnerships-competitive-grants-program', timestamptz '2026-08-20 00:00:00+00'),
    ('national-center-for-narrative-intelligence-ncni', timestamptz '2026-08-20 00:00:00+00'),
    ('spatial-ecology-and-chronic-wasting-disease-dynamics-of-wild-white-tailed-and-mu', timestamptz '2026-08-21 00:00:00+00'),
    ('ovc-fy-2026-housing-assistance-for-victims-of-human-trafficking', timestamptz '2026-08-19 00:00:00+00'),
    ('dow-reconstructive-transplant-investigator-initiated-research-award', timestamptz '2026-08-26 00:00:00+00'),
    ('ovw-fiscal-year-2026-invitation-to-apply-administrative-funding-adjustment-2', timestamptz '2026-08-28 00:00:00+00'),
    ('english-access-microscholarship-program-for-central-and-southern-iraq', timestamptz '2026-08-30 00:00:00+00'),
    ('bja-fy-2026-crisis-response-training-program', timestamptz '2026-08-25 00:00:00+00'),
    ('training-and-employment-guidance-letter-02-26-for-fy-2026-community-project-fund', timestamptz '2026-08-25 00:00:00+00'),
    ('conservation-and-forestry-program-support-2026-2031-for-environmental-natural-re', timestamptz '2026-08-26 00:00:00+00'),
    ('capacity-building-grants-for-non-land-grant-colleges-of-agriculture-program', timestamptz '2026-08-26 00:00:00+00'),
    ('bja-fy-2026-byrne-state-crisis-intervention-formula-program', timestamptz '2026-08-27 00:00:00+00'),
    ('hispanic-serving-institutions-enriching-learning-programs-and-student-experience', timestamptz '2026-08-27 00:00:00+00'),
    ('sefsc-bluefin-tuna-research-program', timestamptz '2026-08-27 00:00:00+00'),
    ('fys-2024-through-2026-promoting-resilient-operations-for-transformative-efficien', timestamptz '2026-08-27 00:00:00+00'),
    ('research-and-education-program-for-historically-black-colleges-and-universities', timestamptz '2026-08-27 00:00:00+00'),
    ('ojp-fy-2026-special-attorneys-program-round-8', timestamptz '2026-08-28 00:00:00+00'),
    ('department-of-pesticide-regulation-research-grants-program', timestamptz '2020-09-01 00:00:00+00')
  ) as v(slug, opens_at)
 where g.slug = v.slug
   and g.deleted_at is null
   and g.opens_at is null;

-- ---------------------------------------------------------------------------
-- 2. Categories (24 grants), in the order the unique index requires.
-- ---------------------------------------------------------------------------
create temporary table _cat_fix (slug text primary key, category_slug text not null) on commit drop;
insert into _cat_fix (slug, category_slug) values
  ('proposition-68-multi-benefit-projects-in-urbanized-areas-to-address-flooding', 'environment'),
  ('stream-flow-enhancement-program-solicitation', 'environment'),
  ('irwm-grant-program', 'environment'),
  ('urban-greening-program', 'environment'),
  ('proposition-1-grant-program-round-3', 'environment'),
  ('lower-american-river-conservancy-program-solicitation', 'environment'),
  ('clean-transportation-program-fueling-infrastructure-for-medium-and-heavy-duty-ze', 'energy'),
  ('hydrogen-fuel-cell-systems-and-hydrogen-fueling-infrastructure-for-locomotive-an', 'energy'),
  ('san-joaquin-fish-population-enhancement-program', 'agriculture'),
  ('urban-streams-restoration-program', 'environment'),
  ('trauma-care-readiness-and-coordination-cooperative-agreement', 'healthcare'),
  ('innovative-water-infrastructure-workforce-development-grant', 'education'),
  ('agriculture-risk-management-education-partnerships-competitive-grants-program', 'agriculture'),
  ('national-center-for-narrative-intelligence-ncni', 'research-and-development'),
  ('cooperative-agreement-for-affiliated-partner-with-the-hawaii-pacific-islands-coo', 'research-and-development'),
  ('spatial-ecology-and-chronic-wasting-disease-dynamics-of-wild-white-tailed-and-mu', 'agriculture'),
  ('geosciences-core-research-atmospheric-geospace-earth-and-ocean-sciences-geo-core', 'research-and-development'),
  ('dow-reconstructive-transplant-investigator-initiated-research-award', 'research-and-development'),
  ('long-term-health-outcomes-of-people-living-with-spina-bifida', 'healthcare'),
  ('conservation-and-forestry-program-support-2026-2031-for-environmental-natural-re', 'research-and-development'),
  ('capacity-building-grants-for-non-land-grant-colleges-of-agriculture-program', 'agriculture'),
  ('hispanic-serving-institutions-enriching-learning-programs-and-student-experience', 'research-and-development'),
  ('sefsc-bluefin-tuna-research-program', 'environment'),
  ('research-and-education-program-for-historically-black-colleges-and-universities', 'research-and-development');

-- 2a. Release the primary flag on the rows about to change.
update public.grant_category_relations r
   set is_primary = false
  from public.grants g, _cat_fix f
 where g.id = r.grant_id and g.slug = f.slug and g.deleted_at is null and r.is_primary;

-- 2b. Drop the fallback category from those grants.
delete from public.grant_category_relations r
 using public.grants g, _cat_fix f, public.grant_categories c
 where g.id = r.grant_id and g.slug = f.slug and g.deleted_at is null
   and c.id = r.category_id and c.slug = 'others';

-- 2c. Attach the mapped category as primary.
insert into public.grant_category_relations (grant_id, category_id, is_primary)
select g.id, c.id, true
  from public.grants g
  join _cat_fix f on f.slug = g.slug
  join public.grant_categories c on c.slug = f.category_slug
 where g.deleted_at is null
on conflict (grant_id, category_id) do update set is_primary = true;

-- ---------------------------------------------------------------------------
-- 3. The trail, for every grant this touched.
-- ---------------------------------------------------------------------------
create temporary table _touched (slug text primary key) on commit drop;
insert into _touched (slug) values
  ('step-implementation-grant'),
  ('proposition-68-multi-benefit-projects-in-urbanized-areas-to-address-flooding'),
  ('stream-flow-enhancement-program-solicitation'),
  ('vertebrate-pest-control-research-program'),
  ('irwm-grant-program'),
  ('urban-greening-program'),
  ('2020-public-access-proposal-solicitation'),
  ('proposition-1-grant-program-round-3'),
  ('lower-american-river-conservancy-program-solicitation'),
  ('clean-transportation-program-fueling-infrastructure-for-medium-and-heavy-duty-ze'),
  ('hydrogen-fuel-cell-systems-and-hydrogen-fueling-infrastructure-for-locomotive-an'),
  ('san-joaquin-fish-population-enhancement-program'),
  ('urban-streams-restoration-program'),
  ('trauma-care-readiness-and-coordination-cooperative-agreement'),
  ('freedom-shield-global-forced-labor-import-prohibition-initiative'),
  ('protecting-the-american-seafood-supply-chain-by-countering-unfair-labor-practice'),
  ('innovative-water-infrastructure-workforce-development-grant'),
  ('agriculture-risk-management-education-partnerships-competitive-grants-program'),
  ('national-center-for-narrative-intelligence-ncni'),
  ('cooperative-agreement-for-affiliated-partner-with-the-hawaii-pacific-islands-coo'),
  ('spatial-ecology-and-chronic-wasting-disease-dynamics-of-wild-white-tailed-and-mu'),
  ('geosciences-core-research-atmospheric-geospace-earth-and-ocean-sciences-geo-core'),
  ('ovc-fy-2026-housing-assistance-for-victims-of-human-trafficking'),
  ('dow-reconstructive-transplant-investigator-initiated-research-award'),
  ('long-term-health-outcomes-of-people-living-with-spina-bifida'),
  ('ovw-fiscal-year-2026-invitation-to-apply-administrative-funding-adjustment-2'),
  ('english-access-microscholarship-program-for-central-and-southern-iraq'),
  ('bja-fy-2026-crisis-response-training-program'),
  ('training-and-employment-guidance-letter-02-26-for-fy-2026-community-project-fund'),
  ('conservation-and-forestry-program-support-2026-2031-for-environmental-natural-re'),
  ('capacity-building-grants-for-non-land-grant-colleges-of-agriculture-program'),
  ('bja-fy-2026-byrne-state-crisis-intervention-formula-program'),
  ('hispanic-serving-institutions-enriching-learning-programs-and-student-experience'),
  ('sefsc-bluefin-tuna-research-program'),
  ('fys-2024-through-2026-promoting-resilient-operations-for-transformative-efficien'),
  ('research-and-education-program-for-historically-black-colleges-and-universities'),
  ('ojp-fy-2026-special-attorneys-program-round-8'),
  ('department-of-pesticide-regulation-research-grants-program');

insert into public.grant_versions (
  grant_id, version_number, snapshot, content_hash, change_reason, created_by_type
)
select g.id, g.current_version, to_jsonb(g) - 'search_vector', g.content_hash,
       'Open date and/or category backfilled from the official source listing (migration 0036).',
       'admin'
  from public.grants g join _touched t on t.slug = g.slug
 where g.deleted_at is null
on conflict (grant_id, version_number) do nothing;

insert into public.grant_history (grant_id, action, description, performed_by_type)
select g.id, 'corrected_from_source',
       'Open date and/or category backfilled from the official source listing (migration 0036).',
       'system'
  from public.grants g join _touched t on t.slug = g.slug
 where g.deleted_at is null
   and not exists (select 1 from public.grant_history h
                    where h.grant_id = g.id and h.description like '%migration 0036%');

commit;
