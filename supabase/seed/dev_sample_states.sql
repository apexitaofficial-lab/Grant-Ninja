-- ===========================================================================
-- DEVELOPMENT SAMPLE DATA — NOT A MIGRATION
--
-- A handful of real US states, so the state routes have something behind them.
-- Names and USPS codes are real; nothing here is invented.
--
-- Two of the sample grants are then scoped to a state, which is what makes the
-- "Browse by state" section on the country page appear at all.
--
-- Remove with:
--   update grants set state_id = null where slug like 'sample-%';
--   delete from states where slug in
--     ('california','texas','massachusetts','new-york','washington');
-- ===========================================================================

insert into public.states (country_id, name, slug, code, status)
select c.id, v.name, v.slug, v.code, 'active'
from public.countries c
cross join (values
  ('California',    'california',    'CA'),
  ('Texas',         'texas',         'TX'),
  ('Massachusetts', 'massachusetts', 'MA'),
  ('New York',      'new-york',      'NY'),
  ('Washington',    'washington',    'WA')
) as v(name, slug, code)
where c.slug = 'united-states'
on conflict (country_id, slug) do nothing;

-- Scope two sample grants to a state so the routes render real results.
update public.grants g
   set state_id = s.id
  from public.states s
 where s.slug = 'california'
   and g.slug = 'sample-nsf-ai-research-institutes';

update public.grants g
   set state_id = s.id
  from public.states s
 where s.slug = 'massachusetts'
   and g.slug = 'sample-nih-exploratory-health-tech';
