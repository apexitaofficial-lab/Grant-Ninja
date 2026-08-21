-- 0012_platform
-- Admin identity, settings, audit trail, enquiries and uploads.
-- DATABASE_ARCHITECTURE.md §5.17, §5.19, §5.20.

-- Extends Supabase Auth rather than replacing it: id IS auth.users.id.
create table public.admin_users (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default '',
  email         text not null,
  role          public.admin_role not null default 'viewer',
  avatar_url    text,
  status        public.entity_status not null default 'active',
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

comment on table public.admin_users is
  'New rows default to viewer. Privilege is granted deliberately by a '
  'super_admin, never acquired by signing up.';

create index ix_admin_users_role on public.admin_users (role) where deleted_at is null;

create trigger trg_admin_users_touch
  before update on public.admin_users
  for each row execute function public.touch_updated_at();

-- Mirror new auth users into admin_users at the lowest privilege.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_users (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    'viewer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Key/value rather than one wide row, so adding a setting needs no migration.
-- Mirrors frontend/types/site-settings.ts (decision D8).
-- ---------------------------------------------------------------------------
create table public.system_settings (
  key         text primary key,
  value       jsonb not null,
  group_name  text not null,
  description text,
  is_public   boolean not null default false,
  updated_by  uuid references public.admin_users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint ck_settings_group check (
    group_name in ('branding', 'contact', 'seo', 'analytics', 'ai', 'crawler', 'social')
  )
);

comment on column public.system_settings.is_public is
  'The security boundary. site_name and logo_url are public; gemini_model and '
  'auto_publish_confidence_threshold are not.';

create index ix_settings_group on public.system_settings (group_name);
create index ix_settings_public on public.system_settings (key) where is_public;

create trigger trg_system_settings_touch
  before update on public.system_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.admin_users (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index ix_audit_entity on public.audit_logs (entity_type, entity_id, created_at desc);
create index ix_audit_user on public.audit_logs (user_id, created_at desc);
create index ix_audit_created on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------

create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  company    text,
  subject    text,
  message    text not null,
  status     public.message_status not null default 'new',
  ip_address inet,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ck_contact_email_format
    check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint ck_contact_message_length check (char_length(message) between 10 and 5000),
  constraint ck_contact_name_length check (char_length(name) between 1 and 200)
);

create index ix_contact_status on public.contact_messages (status, created_at desc);

create trigger trg_contact_messages_touch
  before update on public.contact_messages
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------

create table public.media_library (
  id           uuid primary key default gen_random_uuid(),
  file_name    text not null,
  storage_path text not null,
  mime_type    text not null,
  file_size    bigint,
  width        integer,
  height       integer,
  alt_text     text,
  uploaded_by  uuid references public.admin_users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint uk_media_storage_path unique (storage_path),
  constraint ck_media_size_non_negative check (file_size is null or file_size >= 0)
);

create index ix_media_created on public.media_library (created_at desc);

create trigger trg_media_library_touch
  before update on public.media_library
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Polymorphic cleanup: stands in for the ON DELETE CASCADE that faq_items,
-- seo_metadata and schema_markup cannot declare.
-- ---------------------------------------------------------------------------
create trigger trg_grants_cleanup_polymorphic
  after delete on public.grants
  for each row execute function public.cleanup_polymorphic_children('grant');

create trigger trg_countries_cleanup_polymorphic
  after delete on public.countries
  for each row execute function public.cleanup_polymorphic_children('country');

create trigger trg_states_cleanup_polymorphic
  after delete on public.states
  for each row execute function public.cleanup_polymorphic_children('state');

create trigger trg_categories_cleanup_polymorphic
  after delete on public.grant_categories
  for each row execute function public.cleanup_polymorphic_children('category');

create trigger trg_organizations_cleanup_polymorphic
  after delete on public.organizations
  for each row execute function public.cleanup_polymorphic_children('organization');
