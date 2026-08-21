-- 0001_extensions_and_enums
-- Extensions and every enumerated type used by the schema.
-- DATABASE_ARCHITECTURE.md §2 and §3.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Semantic search is deliberately out of scope for the MVP.
-- create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------

-- Shared lifecycle for reference data.
create type public.entity_status as enum ('active', 'inactive');

-- `updated` is intentionally absent: being updated is an event recorded in
-- grant_history, not a state a grant sits in (deviation V6).
create type public.grant_status as enum (
  'draft',
  'pending_review',
  'published',
  'archived',
  'expired'
);

create type public.grant_funding_type as enum (
  'competitive',
  'formula',
  'continuation',
  'cooperative_agreement',
  'tax_credit',
  'loan',
  'voucher',
  'prize',
  'fellowship',
  'other'
);

create type public.organization_type as enum (
  'government_federal',
  'government_state',
  'government_local',
  'university',
  'research_council',
  'innovation_agency',
  'foundation',
  'private'
);

create type public.admin_role as enum ('super_admin', 'admin', 'editor', 'viewer');

create type public.job_status as enum (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
);

create type public.grant_source_type as enum (
  'official_website',
  'rss',
  'pdf',
  'api',
  'manual',
  'crawler'
);

create type public.duplicate_decision as enum (
  'duplicate',
  'possible_duplicate',
  'different'
);

create type public.seo_entity_type as enum (
  'grant',
  'country',
  'state',
  'category',
  'organization',
  'static_page'
);

create type public.faq_entity_type as enum (
  'grant',
  'country',
  'state',
  'category',
  'organization',
  'service',
  'about',
  'contact',
  'home'
);

create type public.actor_type as enum ('crawler', 'admin', 'ai', 'system');

create type public.ai_job_status as enum ('success', 'failed', 'invalid_json', 'timeout');

create type public.message_status as enum ('new', 'read', 'replied', 'archived');

create type public.content_source as enum ('ai', 'manual');
