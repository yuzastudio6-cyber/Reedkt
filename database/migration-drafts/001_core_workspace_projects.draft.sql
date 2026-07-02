-- ReeditPro SQL MIGRATION DRAFT ONLY.
-- DO NOT RUN.
-- DO NOT APPLY TO SUPABASE.
-- This file is for schema review before real migrations are created.
-- Generated for RP-DATA-02.
-- Reviewed/hardened by RP-DATA-03 as draft-only SQL. Still DO NOT RUN.

-- Purpose: core identity, workspace, project, edit session, chat, and confirmation tables.
-- Review note: these drafts assume pgcrypto/gen_random_uuid() but do not enable or run anything here.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Draft profile table for app-facing user metadata. Review auth.users linkage before real migration.';

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  plan_type text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table workspaces is 'Draft workspace ownership table. Future RLS should scope project data through workspace membership.';

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

comment on table workspace_members is 'Draft workspace membership table for owner/admin/editor/viewer access planning.';

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_id uuid not null,
  title text not null,
  editing_category text,
  status text not null default 'draft',
  current_edit_session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table projects is 'Draft ReeditPro project table. current_edit_session_id should receive a reviewed FK after edit_sessions ordering is finalized.';

create table if not exists edit_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  status text not null default 'setup',
  current_plan_version_id uuid,
  current_intent_snapshot_id uuid,
  source_order_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table edit_sessions is 'Draft chat-native edit session table. Current plan/intent FK links are reviewed after plan tables exist.';

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  edit_session_id uuid not null references edit_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  attachments_json jsonb not null default '[]'::jsonb,
  related_clip_ids_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

comment on table chat_messages is 'Draft chat message table. Raw chat is context, not the worker execution contract.';

create table if not exists user_confirmations (
  id uuid primary key default gen_random_uuid(),
  edit_session_id uuid not null references edit_sessions(id) on delete cascade,
  confirmation_type text not null,
  confirmed_value_json jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz not null default now(),
  superseded_at timestamptz
);

comment on table user_confirmations is 'Draft confirmation table for source order, format, edit level, credit approval, and similar chat-native confirmations.';

create index if not exists idx_projects_workspace_id on projects(workspace_id);
create index if not exists idx_projects_owner_id on projects(owner_id);
create index if not exists idx_edit_sessions_project_id on edit_sessions(project_id);
create index if not exists idx_chat_messages_session_created_at on chat_messages(edit_session_id, created_at);
create index if not exists idx_user_confirmations_session_type on user_confirmations(edit_session_id, confirmation_type);
