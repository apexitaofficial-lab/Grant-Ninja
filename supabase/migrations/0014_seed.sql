-- 0014_seed
-- Reference data the application needs on first boot. Idempotent: every insert
-- is ON CONFLICT DO NOTHING so re-running changes nothing.

-- ---------------------------------------------------------------------------
-- Countries. United States first (MVP scope); the rest are architected for,
-- not populated with grants yet. iso_code drives the /us, /ie shortcuts.
-- ---------------------------------------------------------------------------
insert into public.countries (name, slug, iso_code, iso_code_3, currency, timezone, status)
values
  ('United States',  'united-states',  'US', 'USA', 'USD', 'America/New_York',  'active'),
  ('Ireland',        'ireland',        'IE', 'IRL', 'EUR', 'Europe/Dublin',     'inactive'),
  ('United Kingdom', 'united-kingdom', 'GB', 'GBR', 'GBP', 'Europe/London',     'inactive'),
  ('Australia',      'australia',      'AU', 'AUS', 'AUD', 'Australia/Sydney',  'inactive'),
  ('Canada',         'canada',         'CA', 'CAN', 'CAD', 'America/Toronto',   'inactive')
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Categories, from MASTER_PROJECT_SPEC.md Part 2B "Browse by Category".
-- `color` names a design token; `icon` names a Lucide icon.
-- ---------------------------------------------------------------------------
insert into public.grant_categories (name, slug, description, icon, color, sort_order)
values
  ('Healthcare', 'healthcare',
   'Grants supporting medical research, public health programmes and healthcare innovation.',
   'HeartPulse', 'primary', 10),
  ('Technology', 'technology',
   'Funding for software, hardware, telecommunications and digital infrastructure projects.',
   'Cpu', 'primary', 20),
  ('Artificial Intelligence', 'artificial-intelligence',
   'Grants for machine learning, data science and applied AI research.',
   'BrainCircuit', 'primary', 30),
  ('Manufacturing', 'manufacturing',
   'Support for advanced manufacturing, automation and industrial modernisation.',
   'Factory', 'primary', 40),
  ('Energy', 'energy',
   'Funding for clean energy, grid resilience, storage and decarbonisation research.',
   'Zap', 'brand', 50),
  ('Agriculture', 'agriculture',
   'Grants covering agricultural research, food security and rural development.',
   'Sprout', 'brand', 60),
  ('Education', 'education',
   'Funding for educational programmes, curriculum development and access initiatives.',
   'GraduationCap', 'primary', 70),
  ('Research and Development', 'research-and-development',
   'General R&D funding across scientific and engineering disciplines.',
   'FlaskConical', 'primary', 80),
  ('Environment', 'environment',
   'Grants for conservation, climate adaptation and environmental monitoring.',
   'Leaf', 'brand', 90),
  ('Small Business', 'small-business',
   'Funding aimed at startups, SMEs and early-stage commercialisation.',
   'Store', 'primary', 100)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- sameAs profiles (decision D7). Only is_primary rows reach Organization
-- JSON-LD; the rest are stored and editable but kept out of the entity signal.
-- Mirrors frontend/config/social-profiles.ts.
-- ---------------------------------------------------------------------------
insert into public.same_as_profiles (platform, label, url, is_primary, display_order, enabled)
values
  ('linkedin',   'LinkedIn',   'https://www.linkedin.com/company/grant-ninja/',                              true,  1,  true),
  ('x',          'X',          'https://x.com/TheGrantNinja',                                                true,  2,  true),
  ('trustpilot', 'Trustpilot', 'https://www.trustpilot.com/review/grant.ninja',                              true,  3,  true),
  ('g2',         'G2',         'https://www.g2.com/products/8f5df393-f5b5-42d3-97dc-b4ac317b9d54/reviews',   true,  4,  true),
  ('clutch',     'Clutch',     'https://clutch.co/profile/grant-ninja',                                      true,  5,  true),
  ('youtube',    'YouTube',    'https://www.youtube.com/@GrantNinja',                                        true,  6,  true),
  ('crunchbase', 'Crunchbase', 'https://www.crunchbase.com/organization/grant-ninja',                        true,  7,  true),
  ('goodfirms',    'GoodFirms',    'https://www.goodfirms.co/company/grant-ninja',            false, 8,  true),
  ('trustindex',   'Trustindex',   'https://www.trustindex.io/reviews/grant.ninja',           false, 9,  true),
  ('about_me',     'about.me',     'https://about.me/grantninja',                             false, 10, true),
  ('provenexpert', 'ProvenExpert', 'https://www.provenexpert.com/en-us/grantninja/',          false, 11, true),
  ('nextdoor',     'Nextdoor',     'https://nextdoor.com/page/grant-ninja-fort-worth-tx',     false, 12, true),
  ('smartcustomer','SmartCustomer','https://www.smartcustomer.com/reviews/grant.ninja',       false, 13, true),
  ('inhersight',   'InHerSight',   'https://www.inhersight.com/company/339834/ratings',       false, 14, true)
on conflict (platform) do nothing;

-- ---------------------------------------------------------------------------
-- Settings. Shape mirrors frontend/types/site-settings.ts (decision D8).
-- is_public gates anonymous read: branding and contact are public, AI and
-- crawler configuration is not.
-- ---------------------------------------------------------------------------
insert into public.system_settings (key, value, group_name, description, is_public)
values
  ('site_name', '"Grant Ninja"'::jsonb, 'branding',
   'Displayed in the header, footer and metadata.', true),
  ('logo_url', '"/logo-wordmark.png"'::jsonb, 'branding',
   'Header and footer wordmark.', true),
  ('favicon_url', '"/icon.png"'::jsonb, 'branding',
   'Browser tab icon.', true),
  ('primary_color', '"#104577"'::jsonb, 'branding',
   'Brand navy, sampled from the logo.', true),

  ('contact_email', '""'::jsonb, 'contact', 'Public enquiries address.', true),
  ('contact_phone', '""'::jsonb, 'contact', 'Public telephone number.', true),
  ('contact_address', '{}'::jsonb, 'contact',
   'Structured postal address for LocalBusiness schema.', true),

  ('default_meta_title', '"Grant Ninja — The World''s Most Extensive Research Grants Database"'::jsonb,
   'seo', 'Fallback title when a page supplies none.', true),
  ('default_meta_description',
   '"Discover thousands of research grants from government agencies around the world while accessing funding solutions that help your business grow faster."'::jsonb,
   'seo', 'Fallback meta description.', true),
  ('default_og_image_url', '""'::jsonb, 'seo', 'Fallback OpenGraph image.', true),
  ('robots_allow_indexing', 'true'::jsonb, 'seo',
   'Master switch. Set false to block all indexing before launch.', false),
  ('robots_disallow_paths', '["/admin", "/search"]'::jsonb, 'seo',
   'Paths written into robots.txt as Disallow rules.', false),
  ('llms_txt', '""'::jsonb, 'seo',
   'Body served at /llms.txt. Empty means generate from site metadata.', false),

  ('google_analytics_id', '""'::jsonb, 'analytics', 'Future use.', false),
  ('google_site_verification', '""'::jsonb, 'analytics', 'Future use.', false),

  ('gemini_model', '"gemini-2.5-flash"'::jsonb, 'ai',
   'Model used by the extraction pipeline.', false),
  ('auto_publish_confidence_threshold', '85'::jsonb, 'ai',
   'Decision D3. At or above this, extracted grants publish automatically; '
   'below it they go to the review queue.', false),

  ('crawler_default_request_delay_ms', '2000'::jsonb, 'crawler',
   'Politeness delay between requests to the same host.', false),
  ('crawler_user_agent', '"GrantNinjaBot/1.0 (+https://grantninja.com/about)"'::jsonb,
   'crawler', 'Descriptive agent string, per the crawler ethics section.', false)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Static-page FAQs (decision D2 — entity_id is null for these).
-- ---------------------------------------------------------------------------
insert into public.faq_items (entity_type, entity_id, question, answer, sort_order, source)
values
  ('home', null, 'How often is the grants database updated?',
   'The database is refreshed continuously. Automated crawlers check official government sources on a daily schedule, and every grant record shows its last verified date.',
   10, 'manual'),
  ('home', null, 'Where do the grants come from?',
   'Every grant is sourced from an official government or agency website. Each record links back to its original source so you can verify the details yourself.',
   20, 'manual'),
  ('home', null, 'Is the information official?',
   'Grant Ninja summarises information published by official sources and links to each one. Always confirm eligibility and deadlines on the issuing agency''s own website before applying.',
   30, 'manual'),
  ('home', null, 'Can Grant Ninja help with funding?',
   'Yes. Alongside the grants database, Grant Ninja provides upfront funding against approved government grants and R&D tax credits.',
   40, 'manual')
on conflict do nothing;
