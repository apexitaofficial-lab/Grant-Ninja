-- ===========================================================================
-- CRAWLER SOURCES — real configuration, not sample data.
--
-- These are the government portals the pipeline monitors. Unlike
-- dev_sample_grants.sql, this is intended for production: every entry is a
-- real, publicly documented source.
--
-- `adapter_key` names the Python module in python/adapters/ that handles the
-- site's particular markup. A source with no adapter yet is inserted as
-- `inactive` so the scheduler skips it rather than failing on it.
-- ===========================================================================

insert into public.crawler_sources (
  country_id, name, base_url, adapter_key, crawl_frequency,
  priority, status, request_delay_ms, max_concurrency, respect_robots_txt
)
select
  c.id, v.name, v.base_url, v.adapter_key, v.crawl_frequency,
  v.priority, v.status::public.entity_status, v.request_delay_ms, v.max_concurrency, true
from public.countries c
cross join (values
  -- The federal clearing house: every US federal grant appears here first.
  ('Grants.gov',            'https://www.grants.gov',      'grants_gov', '0 2 * * *',  10, 'active',   2000, 2),
  ('National Science Foundation', 'https://www.nsf.gov',   'nsf',        '0 3 * * *',   8, 'inactive', 2000, 2),
  ('National Institutes of Health', 'https://grants.nih.gov', 'nih',     '0 4 * * *',   8, 'inactive', 2000, 2),
  ('Department of Energy',  'https://www.energy.gov',      'doe',        '0 5 * * 1',   6, 'inactive', 3000, 1),
  ('NASA',                  'https://www.nasa.gov',        'nasa',       '0 5 * * 2',   6, 'inactive', 3000, 1)
) as v(name, base_url, adapter_key, crawl_frequency, priority, status, request_delay_ms, max_concurrency)
where c.slug = 'united-states'
on conflict (base_url) do nothing;
