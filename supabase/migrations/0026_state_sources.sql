-- 0026_state_sources
--
-- All fifty states, and the configuration a source needs to be crawled
-- without writing Python for it.
--
-- Federal grants come from one place. State grants come from fifty, and no two
-- publish the same way. Writing an adapter per state would be fifty modules to
-- maintain, so instead a source carries its own discovery configuration and one
-- generic adapter reads it. Adding a state then means filling in a form, not
-- shipping code.
--
-- `config` is jsonb rather than columns because the shape differs per strategy:
-- a sitemap source needs a sitemap URL and a path pattern, a listing source
-- needs a page URL and a link pattern. Columns would mean a wide table where
-- most cells are null for any given row.

alter table public.crawler_sources
  add column if not exists config jsonb not null default '{}'::jsonb,
  add column if not exists state_id uuid references public.states (id) on delete set null;

comment on column public.crawler_sources.config is
  'Discovery configuration for the generic adapter. Shape depends on '
  '`strategy`: "sitemap" takes sitemap_url and url_pattern; "listing" takes '
  'listing_urls and link_pattern. Ignored by bespoke adapters such as '
  'grants_gov, which know their own site.';
comment on column public.crawler_sources.state_id is
  'Set for a state portal, so grants found there are attributed to the state '
  'rather than only to the country.';

create index if not exists ix_crawler_sources_state on public.crawler_sources (state_id)
  where state_id is not null;

-- ---------------------------------------------------------------------------
-- The fifty states, plus DC and Puerto Rico.
--
-- DC and PR are included because they run their own grant programmes and
-- applicants look for them by name; leaving them out would be a gap a user
-- notices. They are not counted as states in the "fifty" the brief asks for.
-- ---------------------------------------------------------------------------
insert into public.states (country_id, name, slug, code, status)
select c.id, v.name, v.slug, v.code, 'active'::public.entity_status
from public.countries c
cross join (values
  ('Alabama', 'alabama', 'AL'),
  ('Alaska', 'alaska', 'AK'),
  ('Arizona', 'arizona', 'AZ'),
  ('Arkansas', 'arkansas', 'AR'),
  ('California', 'california', 'CA'),
  ('Colorado', 'colorado', 'CO'),
  ('Connecticut', 'connecticut', 'CT'),
  ('Delaware', 'delaware', 'DE'),
  ('Florida', 'florida', 'FL'),
  ('Georgia', 'georgia', 'GA'),
  ('Hawaii', 'hawaii', 'HI'),
  ('Idaho', 'idaho', 'ID'),
  ('Illinois', 'illinois', 'IL'),
  ('Indiana', 'indiana', 'IN'),
  ('Iowa', 'iowa', 'IA'),
  ('Kansas', 'kansas', 'KS'),
  ('Kentucky', 'kentucky', 'KY'),
  ('Louisiana', 'louisiana', 'LA'),
  ('Maine', 'maine', 'ME'),
  ('Maryland', 'maryland', 'MD'),
  ('Massachusetts', 'massachusetts', 'MA'),
  ('Michigan', 'michigan', 'MI'),
  ('Minnesota', 'minnesota', 'MN'),
  ('Mississippi', 'mississippi', 'MS'),
  ('Missouri', 'missouri', 'MO'),
  ('Montana', 'montana', 'MT'),
  ('Nebraska', 'nebraska', 'NE'),
  ('Nevada', 'nevada', 'NV'),
  ('New Hampshire', 'new-hampshire', 'NH'),
  ('New Jersey', 'new-jersey', 'NJ'),
  ('New Mexico', 'new-mexico', 'NM'),
  ('New York', 'new-york', 'NY'),
  ('North Carolina', 'north-carolina', 'NC'),
  ('North Dakota', 'north-dakota', 'ND'),
  ('Ohio', 'ohio', 'OH'),
  ('Oklahoma', 'oklahoma', 'OK'),
  ('Oregon', 'oregon', 'OR'),
  ('Pennsylvania', 'pennsylvania', 'PA'),
  ('Rhode Island', 'rhode-island', 'RI'),
  ('South Carolina', 'south-carolina', 'SC'),
  ('South Dakota', 'south-dakota', 'SD'),
  ('Tennessee', 'tennessee', 'TN'),
  ('Texas', 'texas', 'TX'),
  ('Utah', 'utah', 'UT'),
  ('Vermont', 'vermont', 'VT'),
  ('Virginia', 'virginia', 'VA'),
  ('Washington', 'washington', 'WA'),
  ('West Virginia', 'west-virginia', 'WV'),
  ('Wisconsin', 'wisconsin', 'WI'),
  ('Wyoming', 'wyoming', 'WY'),
  ('District of Columbia', 'district-of-columbia', 'DC'),
  ('Puerto Rico', 'puerto-rico', 'PR')
) as v(name, slug, code)
where c.slug = 'united-states'
-- The sample seed already inserted five of these. Conflict on the real unique
-- constraint so a re-run is a no-op rather than a duplicate-key failure.
on conflict (country_id, slug) do nothing;
