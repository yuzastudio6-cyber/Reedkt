-- ReEditPro canonical V3 local baseline: identity and exact-edit authority.
-- Local-only executable migration. Never apply through the historical root chain.

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create table public.workspaces (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 120),
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, owner_user_id)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default clock_timestamp(),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_user_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 160),
  editing_category text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  revision bigint not null default 1 check (revision >= 1),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, workspace_id),
  foreign key (workspace_id, owner_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict
);

create table public.edit_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null,
  workspace_id uuid not null,
  status text not null default 'planning' check (
    status in ('planning', 'approved', 'executing', 'private_review', 'completed_internal', 'revision_handoff', 'archived')
  ),
  planning_input_revision bigint not null default 0 check (planning_input_revision >= 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, project_id, workspace_id),
  foreign key (project_id, workspace_id)
    references public.projects(id, workspace_id) on delete cascade
);

create table public.exact_edit_preference_states (
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  record_revision bigint not null default 0 check (record_revision >= 0),
  preference_revision bigint not null default 0 check (preference_revision >= 0),
  planning_input_revision bigint not null default 0 check (planning_input_revision >= 0),
  preference_values jsonb not null default '{}'::jsonb,
  preference_fingerprint_sha256 text not null check (preference_fingerprint_sha256 ~ '^[a-f0-9]{64}$'),
  lifecycle_phase text not null default 'planning' check (
    lifecycle_phase in ('planning', 'approved_snapshot', 'credit_reserved', 'executing', 'private_review', 'completed_internal', 'revision_handoff')
  ),
  locked boolean not null default false,
  current_application_state text not null default 'not_selected' check (
    current_application_state in ('not_selected', 'connected', 'cleared')
  ),
  current_application_id uuid,
  output_frame_confirmed boolean not null default false,
  output_frame_confirmation_id uuid,
  output_frame_aspect_ratio text check (output_frame_aspect_ratio in ('9:16', '16:9', '1:1', '4:5', '4:3')),
  output_frame_confirmed_at timestamptz,
  output_frame_authority_digest_sha256 text,
  current_draft_plan_version_id uuid,
  current_draft_estimate_id uuid,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (workspace_id, project_id, edit_session_id),
  foreign key (edit_session_id, project_id, workspace_id)
    references public.edit_sessions(id, project_id, workspace_id) on delete cascade,
  check (
    (current_application_state = 'connected' and current_application_id is not null)
    or (current_application_state <> 'connected' and current_application_id is null)
  ),
  check (
    (output_frame_confirmed
      and output_frame_confirmation_id is not null
      and output_frame_aspect_ratio is not null
      and output_frame_confirmed_at is not null
      and output_frame_authority_digest_sha256 ~ '^[a-f0-9]{64}$')
    or (not output_frame_confirmed
      and output_frame_confirmation_id is null
      and output_frame_aspect_ratio is null
      and output_frame_confirmed_at is null
      and output_frame_authority_digest_sha256 is null)
  )
);

create table public.edit_plan_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  version bigint not null check (version >= 1),
  status text not null default 'draft' check (status in ('draft', 'stale', 'approved', 'superseded')),
  plan_digest_sha256 text not null check (plan_digest_sha256 ~ '^[a-f0-9]{64}$'),
  preference_application_id uuid,
  stale_reason text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, edit_session_id, project_id, workspace_id),
  unique (edit_session_id, version),
  foreign key (edit_session_id, project_id, workspace_id)
    references public.edit_sessions(id, project_id, workspace_id) on delete restrict
);

create table public.edit_credit_estimates (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  edit_plan_version_id uuid not null,
  version bigint not null check (version >= 1),
  status text not null default 'draft' check (status in ('draft', 'stale', 'approved', 'superseded')),
  estimate_digest_sha256 text not null check (estimate_digest_sha256 ~ '^[a-f0-9]{64}$'),
  estimate_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, edit_session_id, project_id, workspace_id),
  foreign key (edit_plan_version_id, edit_session_id, project_id, workspace_id)
    references public.edit_plan_versions(id, edit_session_id, project_id, workspace_id) on delete restrict
);

create table public.approved_plan_snapshots (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  edit_plan_version_id uuid not null,
  preference_application_id uuid,
  preference_application_content_digest_sha256 text,
  preference_application_context_hash_sha256 text,
  snapshot_digest_sha256 text not null check (snapshot_digest_sha256 ~ '^[a-f0-9]{64}$'),
  snapshot_json jsonb not null,
  approved_by_user_id uuid not null,
  approved_at timestamptz not null default clock_timestamp(),
  unique (id, edit_session_id, project_id, workspace_id),
  foreign key (edit_plan_version_id, edit_session_id, project_id, workspace_id)
    references public.edit_plan_versions(id, edit_session_id, project_id, workspace_id) on delete restrict,
  foreign key (workspace_id, approved_by_user_id)
    references public.workspace_members(workspace_id, user_id) on delete restrict
);

create table public.edit_execution_authorizations (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null,
  project_id uuid not null,
  edit_session_id uuid not null,
  approved_plan_snapshot_id uuid not null,
  edit_plan_version_id uuid not null,
  preference_application_id uuid,
  preference_application_content_digest_sha256 text,
  preference_application_context_hash_sha256 text,
  status text not null default 'active' check (status in ('active', 'revoked', 'completed')),
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (id, edit_session_id, project_id, workspace_id),
  foreign key (approved_plan_snapshot_id, edit_session_id, project_id, workspace_id)
    references public.approved_plan_snapshots(id, edit_session_id, project_id, workspace_id) on delete restrict,
  foreign key (edit_plan_version_id, edit_session_id, project_id, workspace_id)
    references public.edit_plan_versions(id, edit_session_id, project_id, workspace_id) on delete restrict,
  check (
    (status = 'revoked' and revoked_at is not null and revoke_reason is not null)
    or status <> 'revoked'
  )
);

create unique index edit_execution_authorizations_one_active_per_edit
  on public.edit_execution_authorizations(workspace_id, project_id, edit_session_id)
  where status = 'active';

alter table public.exact_edit_preference_states
  add foreign key (current_draft_plan_version_id, edit_session_id, project_id, workspace_id)
  references public.edit_plan_versions(id, edit_session_id, project_id, workspace_id) on delete restrict,
  add foreign key (current_draft_estimate_id, edit_session_id, project_id, workspace_id)
  references public.edit_credit_estimates(id, edit_session_id, project_id, workspace_id) on delete restrict;

create index workspace_members_user_lookup on public.workspace_members(user_id, workspace_id);
create index projects_workspace_lookup on public.projects(workspace_id, id);
create index edit_sessions_workspace_project_lookup on public.edit_sessions(workspace_id, project_id, id);
create index edit_plan_versions_edit_status_lookup on public.edit_plan_versions(workspace_id, project_id, edit_session_id, status);
create index edit_credit_estimates_edit_status_lookup on public.edit_credit_estimates(workspace_id, project_id, edit_session_id, status);

create or replace function public.reeditpro_is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = auth.uid()
  );
$$;

create or replace function public.reeditpro_has_workspace_write_access(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1
    from public.workspace_members membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin', 'editor')
  );
$$;

revoke all on function public.reeditpro_is_workspace_member(uuid) from public, anon;
revoke all on function public.reeditpro_has_workspace_write_access(uuid) from public, anon;
grant execute on function public.reeditpro_is_workspace_member(uuid) to authenticated, service_role;
grant execute on function public.reeditpro_has_workspace_write_access(uuid) to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.workspaces enable row level security;
alter table public.workspaces force row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_members force row level security;
alter table public.projects enable row level security;
alter table public.projects force row level security;
alter table public.edit_sessions enable row level security;
alter table public.edit_sessions force row level security;
alter table public.exact_edit_preference_states enable row level security;
alter table public.exact_edit_preference_states force row level security;
alter table public.edit_plan_versions enable row level security;
alter table public.edit_plan_versions force row level security;
alter table public.edit_credit_estimates enable row level security;
alter table public.edit_credit_estimates force row level security;
alter table public.approved_plan_snapshots enable row level security;
alter table public.approved_plan_snapshots force row level security;
alter table public.edit_execution_authorizations enable row level security;
alter table public.edit_execution_authorizations force row level security;

create policy profiles_read_self on public.profiles
  for select to authenticated using (id = auth.uid());
create policy workspaces_read_member on public.workspaces
  for select to authenticated using (public.reeditpro_is_workspace_member(id));
create policy workspace_members_read_member on public.workspace_members
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy projects_read_member on public.projects
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy edit_sessions_read_member on public.edit_sessions
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy exact_edit_preference_states_read_member on public.exact_edit_preference_states
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy edit_plan_versions_read_member on public.edit_plan_versions
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy edit_credit_estimates_read_member on public.edit_credit_estimates
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy approved_plan_snapshots_read_member on public.approved_plan_snapshots
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));
create policy edit_execution_authorizations_read_member on public.edit_execution_authorizations
  for select to authenticated using (public.reeditpro_is_workspace_member(workspace_id));

revoke all on all tables in schema public from public, anon, authenticated, service_role;
grant usage on schema public to authenticated, service_role;
grant select on public.profiles, public.workspaces, public.workspace_members,
  public.projects, public.edit_sessions, public.exact_edit_preference_states,
  public.edit_plan_versions, public.edit_credit_estimates,
  public.approved_plan_snapshots, public.edit_execution_authorizations
  to authenticated;
