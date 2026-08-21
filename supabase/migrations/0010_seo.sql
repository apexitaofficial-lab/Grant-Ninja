-- 0010_seo
-- SEO is a first-class feature, stored apart from content so metadata and AI
-- summaries can be regenerated independently.
-- DATABASE_ARCHITECTURE.md §5.13 to §5.16.

-- Polymorphic rather than one table per entity (deviation V3): countries,
-- categories and agencies all need SEO records, and six near-identical tables
-- drift apart.
create table public.seo_metadata (
  id                    uuid primary key default gen_random_uuid(),
  entity_type           public.seo_entity_type not null,
  entity_id             uuid,
  static_page_key       text,
  meta_title            text,
  meta_description      text,
  canonical_url         text,
  focus_keywords        text[] not null default '{}',
  og_title              text,
  og_description        text,
  og_image_url          text,
  twitter_title         text,
  twitter_description   text,
  robots                text not null default 'index,follow',
  schema_version        integer not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint ck_seo_entity_shape check (
    (entity_type = 'static_page' and entity_id is null and static_page_key is not null)
    or
    (entity_type <> 'static_page' and entity_id is not null and static_page_key is null)
  )
);

-- One SEO record per page. Two partial indexes because NULL never equals NULL
-- in a composite unique constraint, which would let duplicates through.
create unique index uk_seo_entity
  on public.seo_metadata (entity_type, entity_id) where entity_id is not null;
create unique index uk_seo_static_page
  on public.seo_metadata (static_page_key) where static_page_key is not null;

create trigger trg_seo_metadata_touch
  before update on public.seo_metadata
  for each row execute function public.touch_updated_at();

create trigger trg_seo_metadata_parent_exists
  before insert or update of entity_type, entity_id on public.seo_metadata
  for each row execute function public.enforce_polymorphic_parent('entity_type', 'entity_id');

-- ---------------------------------------------------------------------------
-- Generated JSON-LD, stored so it can be regenerated without re-rendering.
-- ---------------------------------------------------------------------------
create table public.schema_markup (
  id             uuid primary key default gen_random_uuid(),
  entity_type    public.seo_entity_type not null,
  entity_id      uuid,
  static_page_key text,
  schema_type    text not null,
  schema_json    jsonb not null,
  schema_version integer not null default 1,
  generated_at   timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on column public.schema_markup.schema_type is
  'schema.org type: MonetaryGrant, Organization, FAQPage, BreadcrumbList, '
  'WebSite, CollectionPage. MonetaryGrant is used for grants — schema.org has '
  'no bare "Grant" type.';

create unique index uk_schema_markup_entity
  on public.schema_markup (entity_type, entity_id, schema_type) where entity_id is not null;
create unique index uk_schema_markup_static
  on public.schema_markup (static_page_key, schema_type) where static_page_key is not null;

create trigger trg_schema_markup_touch
  before update on public.schema_markup
  for each row execute function public.touch_updated_at();

create trigger trg_schema_markup_parent_exists
  before insert or update of entity_type, entity_id on public.schema_markup
  for each row execute function public.enforce_polymorphic_parent('entity_type', 'entity_id');

-- ---------------------------------------------------------------------------
-- Organization sameAs profiles (decision D7). Only is_primary rows are emitted
-- in JSON-LD; the rest are stored and editable but kept out of the entity
-- signal.
-- ---------------------------------------------------------------------------
create table public.same_as_profiles (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null,
  label         text not null,
  url           text not null,
  is_primary    boolean not null default false,
  display_order integer not null default 0,
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint uk_same_as_platform unique (platform),
  constraint ck_same_as_https check (url ~ '^https://'),
  -- Tracking parameters weaken the entity match and leak referral data.
  constraint ck_same_as_no_tracking
    check (url !~* '[?&](utm_|_ga|_gl|gclid|dclid|fbclid|msclkid|mc_|mkt_tok)')
);

create trigger trg_same_as_touch
  before update on public.same_as_profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.seo_redirects (
  id               uuid primary key default gen_random_uuid(),
  source_path      text not null,
  destination_path text not null,
  status_code      smallint not null default 301,
  enabled          boolean not null default true,
  hit_count        integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint uk_seo_redirects_source unique (source_path),
  constraint ck_seo_redirects_status check (status_code in (301, 302)),
  constraint ck_seo_redirects_leading_slash check (source_path ~ '^/'),
  constraint ck_seo_redirects_not_self check (source_path <> destination_path)
);

create trigger trg_seo_redirects_touch
  before update on public.seo_redirects
  for each row execute function public.touch_updated_at();
