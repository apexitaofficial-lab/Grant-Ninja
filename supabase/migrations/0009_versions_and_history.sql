-- 0009_versions_and_history
-- Append-only trails. Nothing here is ever updated or deleted through the API.
-- DATABASE_ARCHITECTURE.md §5.11, §5.12.

-- A jsonb snapshot rather than mirrored columns (deviation V7): adding a grant
-- column later would otherwise mean backfilling every historical row.
create table public.grant_versions (
  id              uuid primary key default gen_random_uuid(),
  grant_id        uuid not null references public.grants (id) on delete cascade,
  version_number  integer not null,
  snapshot        jsonb not null,
  content_hash    text,
  change_reason   text,
  created_by      uuid,
  created_by_type public.actor_type not null default 'system',
  created_at      timestamptz not null default now(),

  constraint uk_grant_versions_number unique (grant_id, version_number),
  constraint ck_grant_versions_number_positive check (version_number >= 1)
);

create index ix_versions_grant_created
  on public.grant_versions (grant_id, created_at desc);

-- ---------------------------------------------------------------------------

create table public.grant_history (
  id                uuid primary key default gen_random_uuid(),
  grant_id          uuid not null references public.grants (id) on delete cascade,
  action            text not null,
  description       text,
  performed_by      uuid,
  performed_by_type public.actor_type not null default 'system',
  created_at        timestamptz not null default now()
);

comment on table public.grant_history is
  'Event log: created, updated, closed, deadline_changed, ai_regenerated. '
  'This is where "updated" lives, rather than in grant_status (deviation V6).';

create index ix_grant_history_grant on public.grant_history (grant_id, created_at desc);
create index ix_grant_history_action on public.grant_history (action, created_at desc);

-- ---------------------------------------------------------------------------
-- Every Gemini call, for cost monitoring and prompt debugging.
-- ---------------------------------------------------------------------------
create table public.ai_generation_logs (
  id             uuid primary key default gen_random_uuid(),
  grant_id       uuid references public.grants (id) on delete set null,
  model          text not null,
  prompt_name    text not null,
  prompt_version text not null,
  tokens_input   integer,
  tokens_output  integer,
  execution_ms   integer,
  status         public.ai_job_status not null,
  error_message  text,
  created_at     timestamptz not null default now(),

  constraint ck_ai_logs_tokens_non_negative
    check ((tokens_input is null or tokens_input >= 0)
       and (tokens_output is null or tokens_output >= 0))
);

create index ix_ai_logs_created on public.ai_generation_logs (created_at desc);
create index ix_ai_logs_grant on public.ai_generation_logs (grant_id)
  where grant_id is not null;
create index ix_ai_logs_failures on public.ai_generation_logs (status, created_at desc)
  where status <> 'success';
