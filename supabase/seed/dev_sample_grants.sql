-- ===========================================================================
-- DEVELOPMENT SAMPLE DATA — NOT A MIGRATION
--
-- Deliberately kept out of supabase/migrations/ so it never applies to a real
-- environment by accident.
--
-- The agencies and official URLs are real. The funding figures, dates and
-- descriptions are ILLUSTRATIVE and were not taken from the agency notices —
-- they exist so the UI can be built and reviewed against realistic content.
-- Every row has last_verified_at = NULL, which is the signal that nothing here
-- has been checked against its source.
--
-- Dates are relative to now() so the deadline meter demonstrates each state:
-- open, closing soon, not yet open, closed, and unknown.
--
-- Remove it all with:
--   delete from grants where slug like 'sample-%';
--   delete from organizations where slug like 'sample-%';
-- ===========================================================================

-- --- Agencies --------------------------------------------------------------
insert into public.organizations
  (country_id, name, slug, organization_type, website, description, status)
select
  c.id, v.name, v.slug, v.org_type::public.organization_type, v.website, v.description, 'active'
from public.countries c
cross join (values
  ('National Science Foundation', 'sample-national-science-foundation', 'government_federal',
   'https://www.nsf.gov',
   'Independent federal agency supporting fundamental research and education across all non-medical fields of science and engineering.'),
  ('National Institutes of Health', 'sample-national-institutes-of-health', 'government_federal',
   'https://www.nih.gov',
   'The primary federal agency for biomedical and public health research in the United States.'),
  ('Department of Energy', 'sample-department-of-energy', 'government_federal',
   'https://www.energy.gov',
   'Federal department responsible for energy policy, nuclear safety and energy-related research.'),
  ('NASA', 'sample-nasa', 'government_federal',
   'https://www.nasa.gov',
   'The United States civil space programme, funding aeronautics and space technology research.'),
  ('National Institute of Standards and Technology', 'sample-nist', 'government_federal',
   'https://www.nist.gov',
   'Federal laboratory advancing measurement science, standards and industrial technology.')
) as v(name, slug, org_type, website, description)
where c.slug = 'united-states'
on conflict (slug) do nothing;

-- --- Grants ----------------------------------------------------------------
with agency as (
  select slug, id from public.organizations where slug like 'sample-%'
), us as (
  select id from public.countries where slug = 'united-states'
)
insert into public.grants (
  organization_id, country_id, title, slug, short_description, full_description,
  eligibility, minimum_amount, maximum_amount, currency, grant_type, status,
  official_url, application_url, opens_at, closes_at, published_at,
  featured, is_federal, last_verified_at
)
select
  agency.id, us.id, v.title, v.slug, v.short_description, v.full_description, v.eligibility,
  v.min_amount, v.max_amount, 'USD', v.grant_type::public.grant_funding_type, 'published',
  v.official_url, v.application_url, v.opens_at, v.closes_at, v.published_at,
  v.featured, true, null
from (values
  -- Closing soon: exercises the urgent state.
  ('sample-national-science-foundation',
   'Small Business Innovation Research — Phase I',
   'sample-nsf-sbir-phase-i',
   'Seed funding for small businesses to establish the technical merit and commercial potential of a deep-technology concept.',
   'Phase I supports the early feasibility stage of a research-driven product. Awards fund the work needed to show that a technical approach is sound before larger development funding is sought. Projects across software, hardware, materials and biotechnology are eligible, and no preliminary results are required at the point of application.',
   'Small businesses registered in the United States, with fewer than 500 employees and majority US ownership. The principal investigator must be primarily employed by the applicant at the time of award.',
   50000, 305000, 'competitive',
   'https://seedfund.nsf.gov/', 'https://seedfund.nsf.gov/apply/',
   now() - interval '75 days', now() + interval '6 days', now() - interval '75 days', true),

  -- Comfortably open: the ordinary state.
  ('sample-national-institutes-of-health',
   'Exploratory Research for Emerging Technologies in Health',
   'sample-nih-exploratory-health-tech',
   'Support for high-risk, early-stage biomedical research that could shift how a condition is diagnosed or treated.',
   'This programme funds exploratory work where the underlying hypothesis is promising but unproven. Preliminary data is not required. Reviewers weight originality and potential impact more heavily than feasibility, so proposals that would score poorly under standard review are explicitly in scope.',
   'Accredited universities, research institutions, and small businesses conducting biomedical research. Early-career investigators are encouraged to apply.',
   100000, 750000, 'competitive',
   'https://grants.nih.gov/', 'https://grants.nih.gov/grants/how-to-apply-application-guide.html',
   now() - interval '30 days', now() + interval '112 days', now() - interval '30 days', true),

  -- Not yet open: the window has not started.
  ('sample-department-of-energy',
   'Clean Energy Manufacturing and Grid Resilience',
   'sample-doe-clean-energy-manufacturing',
   'Funding for domestic manufacturing of clean energy components and for technologies that strengthen grid reliability.',
   'The programme covers manufacturing process improvements, supply chain development and grid-scale storage. Applicants are expected to describe how the work reduces reliance on imported components and what the pathway to commercial production looks like.',
   'US-based manufacturers, national laboratories, universities and consortia. Cost sharing of at least 20 percent is expected for industry applicants.',
   500000, 5000000, 'cooperative_agreement',
   'https://www.energy.gov/eere/funding-opportunity-exchange', null,
   now() + interval '21 days', now() + interval '110 days', now() - interval '9 days', false),

  -- No published dates: exercises the unknown state.
  ('sample-nist',
   'Advanced Manufacturing Technology Development',
   'sample-nist-advanced-manufacturing',
   'Support for measurement science and standards work that removes technical barriers to advanced manufacturing.',
   'Projects address gaps in metrology, testing methods or standards that currently prevent a manufacturing technology from scaling. Awards are made on a rolling basis and the programme does not publish a fixed closing date.',
   'US manufacturers, universities and standards bodies. Partnerships between industry and academia are prioritised.',
   null, 1200000, 'competitive',
   'https://www.nist.gov/mep', null,
   null, null, now() - interval '54 days', false),

  -- Closed: shows how an expired window reads.
  ('sample-nasa',
   'Space Technology Graduate Research Opportunities',
   'sample-nasa-space-tech-graduate',
   'Awards for graduate students pursuing research aligned with NASA space technology priorities.',
   'Recipients carry out their thesis research in collaboration with a NASA centre, with access to agency facilities and a technical mentor. The award covers stipend, tuition contribution and a visiting technologist experience.',
   'Students enrolled full time in an accredited US graduate programme, holding US citizenship or permanent residency.',
   null, 80000, 'fellowship',
   'https://www.nasa.gov/stmd-space-technology-research-grants/', null,
   now() - interval '200 days', now() - interval '26 days', now() - interval '200 days', false),

  -- Ordinary open window, no featured flag.
  ('sample-national-science-foundation',
   'Artificial Intelligence Research Institutes',
   'sample-nsf-ai-research-institutes',
   'Multi-year funding for institutes advancing foundational AI research alongside a specific application domain.',
   'Institutes are expected to combine foundational advances in artificial intelligence with sustained work in an application area such as agriculture, education or materials discovery. Proposals must describe a workforce development plan and a route to lasting institutional capacity.',
   'US universities and non-profit research institutions, working as a lead or in a multi-institution consortium.',
   2000000, 20000000, 'cooperative_agreement',
   'https://www.nsf.gov/cise/ai.jsp', null,
   now() - interval '14 days', now() + interval '64 days', now() - interval '14 days', false)
) as v(
  org_slug, title, slug, short_description, full_description, eligibility,
  min_amount, max_amount, grant_type, official_url, application_url,
  opens_at, closes_at, published_at, featured
)
join agency on agency.slug = v.org_slug
cross join us
on conflict (slug) do nothing;

-- --- Classification --------------------------------------------------------
insert into public.grant_category_relations (grant_id, category_id, is_primary)
select g.id, cat.id, v.is_primary
from (values
  ('sample-nsf-sbir-phase-i',                'small-business',           true),
  ('sample-nsf-sbir-phase-i',                'technology',               false),
  ('sample-nih-exploratory-health-tech',     'healthcare',               true),
  ('sample-nih-exploratory-health-tech',     'research-and-development', false),
  ('sample-doe-clean-energy-manufacturing',  'energy',                   true),
  ('sample-doe-clean-energy-manufacturing',  'manufacturing',            false),
  ('sample-nist-advanced-manufacturing',     'manufacturing',            true),
  ('sample-nasa-space-tech-graduate',        'research-and-development', true),
  ('sample-nsf-ai-research-institutes',      'artificial-intelligence',  true),
  ('sample-nsf-ai-research-institutes',      'education',                false)
) as v(grant_slug, category_slug, is_primary)
join public.grants g on g.slug = v.grant_slug
join public.grant_categories cat on cat.slug = v.category_slug
on conflict (grant_id, category_id) do nothing;

-- --- AI content ------------------------------------------------------------
-- Stands in for pipeline output so the detail page can be designed against
-- the summary and answer-capsule blocks.
insert into public.grant_ai_content
  (grant_id, summary, keywords, model_used, prompt_version, confidence)
select g.id, v.summary, v.keywords, 'sample-data', 'v0-placeholder', 70
from (values
  ('sample-nsf-sbir-phase-i',
   'This programme funds the earliest stage of a deep-technology company, where the question is whether an idea works at all rather than whether it can be sold. An award covers roughly six to twelve months of feasibility work: building the prototype, running the experiment, or gathering the evidence that a later development round would depend on. The money is a grant, so it takes no equity and carries no repayment obligation. Applicants do not need preliminary results, existing revenue or an academic affiliation, which makes it one of the more accessible federal entry points for a technical founder. Review weighs both technical merit and commercial potential, so a strong application explains the science and names the customer. Companies that complete this stage successfully are eligible to apply for substantially larger follow-on funding.',
   array['sbir', 'seed funding', 'deep tech', 'prototype', 'non-dilutive']),
  ('sample-nih-exploratory-health-tech',
   'This grant is aimed at biomedical research that is too early or too unconventional to compete under standard review. Preliminary data is explicitly not required, and reviewers are instructed to weight originality and potential impact above demonstrated feasibility. In practice that makes it suitable for a hypothesis a researcher believes in but cannot yet evidence. Awards run for two to three years and support staff, equipment and study costs. Both academic institutions and small businesses conducting biomedical research are eligible, and early-career investigators are encouraged to apply. Because the programme accepts higher risk, a proportion of funded projects are expected not to succeed, and that is not held against the investigator in later applications.',
   array['biomedical', 'exploratory', 'high risk', 'early career'])
) as v(grant_slug, summary, keywords)
join public.grants g on g.slug = v.grant_slug
on conflict (grant_id) do nothing;

insert into public.grant_answer_capsules (grant_id, question, answer, position, source)
select g.id, v.question, v.answer, v.position, 'ai'
from (values
  ('sample-nsf-sbir-phase-i', 'What is this grant?',
   'A federal seed grant for small businesses developing a technology product. It funds the feasibility stage — proving the technical approach works — before larger development funding is sought.', 1),
  ('sample-nsf-sbir-phase-i', 'Who can apply?',
   'US-registered small businesses with fewer than 500 employees and majority US ownership. The principal investigator must be primarily employed by the company at the time of award.', 2),
  ('sample-nsf-sbir-phase-i', 'How much funding is available?',
   'Awards range from about $50,000 to $305,000 depending on the scope of work proposed. The funding is a grant, so it is non-dilutive and is not repaid.', 3),
  ('sample-nsf-sbir-phase-i', 'Can a startup with no revenue apply?',
   'Yes. There is no revenue requirement and no preliminary results are needed. The programme is designed for companies at the point where technical feasibility is still an open question.', 4),
  ('sample-nih-exploratory-health-tech', 'What is this grant?',
   'Federal funding for exploratory biomedical research where the hypothesis is promising but unproven, and where preliminary data does not yet exist.', 1),
  ('sample-nih-exploratory-health-tech', 'Who can apply?',
   'Accredited universities, research institutions and small businesses conducting biomedical research. Early-career investigators are explicitly encouraged.', 2),
  ('sample-nih-exploratory-health-tech', 'Is preliminary data required?',
   'No. Reviewers are instructed to weight originality and potential impact above demonstrated feasibility, which is what separates this programme from standard research funding.', 3)
) as v(grant_slug, question, answer, position)
join public.grants g on g.slug = v.grant_slug
on conflict (grant_id, position) do nothing;
