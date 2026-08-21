-- 0008_ai_content_and_faq
-- AI output lives apart from grant data so it can be regenerated without
-- touching the source of truth.
-- DATABASE_ARCHITECTURE.md §5.8, §5.9, §5.10.

create table public.grant_ai_content (
  id                uuid primary key default gen_random_uuid(),
  grant_id          uuid not null references public.grants (id) on delete cascade,
  summary           text,
  keywords          text[] not null default '{}',
  structured_json   jsonb,
  model_used        text not null,
  prompt_version    text not null,
  tokens_input      integer,
  tokens_output     integer,
  confidence        smallint,
  last_generated_at timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint uk_grant_ai_content_grant unique (grant_id),
  constraint ck_gac_confidence_range check (confidence is null or confidence between 0 and 100),
  constraint ck_gac_tokens_non_negative
    check ((tokens_input is null or tokens_input >= 0)
       and (tokens_output is null or tokens_output >= 0))
);

comment on column public.grant_ai_content.prompt_version is
  'Which prompt produced this. Lets a prompt fix target only the rows it affects.';

create trigger trg_grant_ai_content_touch
  before update on public.grant_ai_content
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Answer capsules. Kept apart from faq_items because they are a different
-- content type: a fixed question set, length-constrained for AI citation,
-- rendered above the fold.
-- ---------------------------------------------------------------------------
create table public.grant_answer_capsules (
  id         uuid primary key default gen_random_uuid(),
  grant_id   uuid not null references public.grants (id) on delete cascade,
  question   text not null,
  answer     text not null,
  position   integer not null default 0,
  source     public.content_source not null default 'ai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uk_capsules_grant_position unique (grant_id, position)
);

create index ix_capsules_grant on public.grant_answer_capsules (grant_id, position);

create trigger trg_capsules_touch
  before update on public.grant_answer_capsules
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- One FAQ system for every entity type (decision D2). Static pages carry a
-- null entity_id.
-- ---------------------------------------------------------------------------
create table public.faq_items (
  id          uuid primary key default gen_random_uuid(),
  entity_type public.faq_entity_type not null,
  entity_id   uuid,
  question    text not null,
  answer      text not null,
  sort_order  integer not null default 0,
  source      public.content_source not null default 'manual',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint ck_faq_entity_id_presence check (
    (entity_type in ('grant', 'country', 'state', 'category', 'organization')
       and entity_id is not null)
    or
    (entity_type in ('service', 'about', 'contact', 'home') and entity_id is null)
  )
);

create index ix_faq_entity on public.faq_items (entity_type, entity_id, sort_order);

create trigger trg_faq_items_touch
  before update on public.faq_items
  for each row execute function public.touch_updated_at();

-- Stands in for the foreign key a polymorphic column cannot have.
create trigger trg_faq_items_parent_exists
  before insert or update of entity_type, entity_id on public.faq_items
  for each row execute function public.enforce_polymorphic_parent('entity_type', 'entity_id');
