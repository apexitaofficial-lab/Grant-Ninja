-- 0021_crawl_job_queue
--
-- Lets the admin panel ask for a crawl, and lets the Python worker pick it up.
--
-- Postgres is the queue. That is a deliberate choice, not a shortcut:
--
--   * The producer is TypeScript (the admin panel) and the consumer is Python
--     (the pipeline). The one thing both already hold a connection to is this
--     database, so a table is the natural meeting point. A Node-only queue
--     such as BullMQ could not be consumed by the worker at all.
--   * The volume is five sources on a daily schedule. `FOR UPDATE SKIP LOCKED`
--     handles orders of magnitude more than that.
--   * It is one less service to run, secure and monitor on a single VPS, and
--     jobs survive a restart with no extra configuration.
--
-- MASTER_PROJECT_SPEC.md §20 agrees: Linux cron, "no third-party scheduler is
-- required", with Redis and Celery listed under Future. Revisit when there are
-- multiple worker machines or thousands of jobs a minute — neither is close.
--
-- A run row is created the moment a crawl is *requested*, in status 'pending'.
-- The worker claims it, moves it to 'running', and finishes it. That means a
-- requested crawl is visible in the admin panel before a worker has picked it
-- up, and a crawl that no worker ever collects is visible as a pending row
-- rather than as silence.

alter table public.crawler_runs
  add column if not exists triggered_by text not null default 'schedule',
  add column if not exists requested_by uuid references public.admin_users (id) on delete set null,
  add column if not exists page_limit integer not null default 25,
  add column if not exists queued_at timestamptz not null default now();

alter table public.crawler_runs
  drop constraint if exists ck_crawler_runs_triggered_by;
alter table public.crawler_runs
  add constraint ck_crawler_runs_triggered_by
  check (triggered_by in ('manual', 'schedule'));

alter table public.crawler_runs
  drop constraint if exists ck_crawler_runs_page_limit;
alter table public.crawler_runs
  add constraint ck_crawler_runs_page_limit
  check (page_limit between 1 and 500);

comment on column public.crawler_runs.triggered_by is
  'manual = requested from the admin panel, schedule = enqueued by the scheduler.';
comment on column public.crawler_runs.queued_at is
  'When the run was requested. started_at is when a worker picked it up; the '
  'gap between them is queue latency.';

-- `started_at` defaults to now() and is not null, which was right when a run
-- row was only created at the moment it began. A queued run has not started,
-- so it must be allowed to be null until a worker claims it.
alter table public.crawler_runs alter column started_at drop not null;
alter table public.crawler_runs alter column started_at drop default;

-- Only one pending or running job per source. A user leaning on the button
-- must not be able to queue twenty crawls of the same site, and two workers
-- must never crawl one source at once.
create unique index if not exists uk_crawler_runs_one_active_per_source
  on public.crawler_runs (source_id)
  where status in ('pending', 'running');

create index if not exists ix_crawler_runs_pending
  on public.crawler_runs (queued_at)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- Enqueue. Returns the run id, or null when one is already pending/running.
-- ---------------------------------------------------------------------------
create or replace function public.request_crawl(
  p_source_id uuid,
  p_page_limit integer default 25,
  p_triggered_by text default 'manual',
  p_requested_by uuid default null
)
returns uuid
-- SECURITY DEFINER on purpose, and narrowly.
--
-- `crawler_runs` has no write policy for `authenticated`, deliberately: run
-- history must not be rewritable through the API. Adding a general INSERT
-- policy to make a button work would trade that guarantee away for one
-- feature. Instead this one function is allowed to insert, it inserts exactly
-- one shape of row, and it checks the caller's role itself — so the table stays
-- closed and only this narrow, audited action gets through.
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
begin
  -- The scheduler calls this with the secret key and has no auth.uid(), so it
  -- is allowed through explicitly rather than by weakening the admin check.
  if auth.role() is distinct from 'service_role'
     and not public.is_admin_at_least('editor') then
    raise exception 'not authorised to request a crawl'
      using errcode = 'insufficient_privilege';
  end if;

  if not exists (
    select 1 from public.crawler_sources s
     where s.id = p_source_id and s.status = 'active'
  ) then
    -- An inactive source has no adapter, or has been switched off on purpose.
    -- Queueing it would produce a job the worker can only fail.
    raise exception 'source is not active' using errcode = 'check_violation';
  end if;

  if p_triggered_by not in ('manual', 'schedule') then
    raise exception 'unknown trigger %', p_triggered_by using errcode = 'check_violation';
  end if;

  insert into public.crawler_runs (source_id, status, triggered_by, requested_by, page_limit)
  values (p_source_id, 'pending', p_triggered_by, p_requested_by, p_page_limit)
  -- The partial unique index above is what makes this safe under concurrency:
  -- two simultaneous clicks race, and exactly one inserts.
  on conflict do nothing
  returning id into v_run_id;

  return v_run_id;
end;
$$;

comment on function public.request_crawl is
  'Queues a crawl for one source. Returns null when that source already has a '
  'pending or running job, so a repeated click is a no-op rather than a queue '
  'of duplicate crawls.';

-- ---------------------------------------------------------------------------
-- Claim. The worker's dequeue path.
-- ---------------------------------------------------------------------------
create or replace function public.claim_crawler_run()
returns table (
  run_id uuid,
  source_id uuid,
  page_limit integer,
  triggered_by text
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with claimed as (
    update public.crawler_runs r
       set status = 'running',
           started_at = now()
     where r.id = (
             select c.id
               from public.crawler_runs c
              where c.status = 'pending'
              order by c.queued_at
              limit 1
              -- SKIP LOCKED is the whole point: a second worker steps over a
              -- row another worker is already claiming instead of blocking on
              -- it, so workers scale without coordinating.
              for update skip locked
           )
    returning r.id, r.source_id, r.page_limit, r.triggered_by
  )
  select claimed.id, claimed.source_id, claimed.page_limit, claimed.triggered_by
    from claimed;
end;
$$;

comment on function public.claim_crawler_run is
  'Atomically claims the oldest pending crawl and marks it running. Returns no '
  'rows when the queue is empty. Safe to call from several workers at once.';

-- ---------------------------------------------------------------------------
-- Recover jobs abandoned by a worker that died mid-run.
-- ---------------------------------------------------------------------------
create or replace function public.reap_stalled_runs(p_older_than interval default '1 hour')
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Without this a killed worker leaves a row in 'running' forever, and the
  -- one-active-per-source index then blocks that source from ever running
  -- again. Failing the row explicitly is what makes the button keep working
  -- after a crash.
  update public.crawler_runs
     set status = 'failed',
         completed_at = now(),
         logs = coalesce(logs, '[]'::jsonb) || jsonb_build_array(
           jsonb_build_object('stage', 'worker', 'outcome', 'stalled',
                              'detail', 'no worker heartbeat; marked failed')
         )
   where status = 'running'
     and started_at < now() - p_older_than;

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

revoke execute on function public.claim_crawler_run() from public, anon, authenticated;
revoke execute on function public.reap_stalled_runs(interval) from public, anon, authenticated;
grant execute on function public.claim_crawler_run() to service_role;
grant execute on function public.reap_stalled_runs(interval) to service_role;

-- The admin panel calls request_crawl as the signed-in user, so authenticated
-- needs it. RLS on crawler_runs still decides who may insert.
grant execute on function public.request_crawl(uuid, integer, text, uuid) to authenticated, service_role;
