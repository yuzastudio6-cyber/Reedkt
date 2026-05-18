-- ReeditPro active migration file.
-- Created by RP-DATA-04.
-- Do not run against production until local/staging tests pass and the migration is approved.
-- This file is intended for Supabase migration testing, not direct SQL editor changes.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  plan_type text not null default 'free',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  editing_category text,
  status text not null default 'draft',
  current_edit_session_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.edit_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'setup',
  current_plan_version_id uuid,
  current_intent_snapshot_id uuid,
  source_order_confirmed boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_current_edit_session_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_current_edit_session_id_fkey
      foreign key (current_edit_session_id) references public.edit_sessions(id) on delete set null;
  end if;
end $$;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  attachments_json jsonb not null default '[]'::jsonb,
  related_clip_ids_json jsonb not null default '[]'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_confirmations (
  id uuid primary key default gen_random_uuid(),
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  confirmation_type text not null,
  confirmed_value_json jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz not null default now(),
  superseded_at timestamptz
);

comment on table public.projects is 'ReeditPro project shell scoped to a workspace. Chat remains the editor; timeline is secondary.';
comment on table public.edit_sessions is 'Chat-native editing sessions. User approval and source sequence confirmation happen before execution.';
comment on table public.chat_messages is 'Chat messages are persisted for product context but workers execute approved snapshots, not raw chat.';
comment on table public.user_confirmations is 'Structured user confirmations such as source order, format, intent, and credit approval acknowledgements.';

create index if not exists idx_workspaces_owner_id on public.workspaces(owner_id);
create index if not exists idx_workspace_members_workspace_user on public.workspace_members(workspace_id, user_id);
create index if not exists idx_projects_workspace_id on public.projects(workspace_id);
create index if not exists idx_projects_owner_id on public.projects(owner_id);
create index if not exists idx_edit_sessions_project_id on public.edit_sessions(project_id);
create index if not exists idx_chat_messages_session_created on public.chat_messages(edit_session_id, created_at);
create index if not exists idx_user_confirmations_session_type on public.user_confirmations(edit_session_id, confirmation_type);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_edit_sessions_updated_at on public.edit_sessions;
create trigger set_edit_sessions_updated_at before update on public.edit_sessions
for each row execute function public.set_updated_at();
