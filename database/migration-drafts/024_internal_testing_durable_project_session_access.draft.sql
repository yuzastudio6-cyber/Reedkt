-- ReEditPro internal-testing durable project/session access SQL draft.
-- Review artifact only: do not copy into supabase/migrations or apply to any database
-- until INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW passes.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  plan_type text not null default 'personal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  title text not null,
  editing_category text,
  status text not null default 'draft',
  current_edit_session_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.edit_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'active',
  current_plan_version_id uuid,
  current_intent_snapshot_id uuid,
  source_order_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects
  add constraint projects_current_edit_session_id_fkey
  foreign key (current_edit_session_id) references public.edit_sessions(id) on delete set null
  deferrable initially deferred;

create table if not exists public.edit_briefs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  brief_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.edit_cues (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.edit_briefs(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  cue_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.edit_session_export_settings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  edit_session_id uuid not null references public.edit_sessions(id) on delete cascade,
  export_settings_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_members_user_workspace_lookup
  on public.workspace_members (user_id, workspace_id);

create index if not exists projects_workspace_lookup
  on public.projects (workspace_id);

create index if not exists edit_sessions_project_lookup
  on public.edit_sessions (project_id);

create index if not exists edit_briefs_project_session_lookup
  on public.edit_briefs (project_id, edit_session_id);

create index if not exists edit_cues_session_lookup
  on public.edit_cues (edit_session_id);

create index if not exists edit_session_export_settings_project_session_lookup
  on public.edit_session_export_settings (project_id, edit_session_id);

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select on public.projects to authenticated;
grant select on public.edit_sessions to authenticated;

-- Route data table select grants remain review-only until policy inheritance is verified:
-- grant select on public.edit_briefs to authenticated;
-- grant select on public.edit_cues to authenticated;
-- grant select on public.edit_session_export_settings to authenticated;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.edit_sessions enable row level security;
alter table public.edit_briefs enable row level security;
alter table public.edit_cues enable row level security;
alter table public.edit_session_export_settings enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy workspaces_select_member on public.workspaces
  for select to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = workspaces.id
        and wm.user_id = auth.uid()
    )
  );

create policy workspace_members_select_self on public.workspace_members
  for select to authenticated
  using (user_id = auth.uid());

create policy projects_select_workspace_member on public.projects
  for select to authenticated
  using (
    exists (
      select 1
      from public.workspace_members wm
      where wm.workspace_id = projects.workspace_id
        and wm.user_id = auth.uid()
    )
  );

create policy edit_sessions_select_project_member on public.edit_sessions
  for select to authenticated
  using (
    exists (
      select 1
      from public.projects p
      join public.workspace_members wm on wm.workspace_id = p.workspace_id
      where p.id = edit_sessions.project_id
        and wm.user_id = auth.uid()
    )
  );

-- Route data policies are intentionally left for migration review before select grants graduate.
