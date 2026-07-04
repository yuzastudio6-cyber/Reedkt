import {
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_BLOCKED_SCOPE,
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_CORE_TABLES,
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_ROUTE_DATA_TABLES,
  DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_VERIFICATION_CHECKS,
} from './project-session-supabase-schema-rls-draft'
import {
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_RLS_POLICIES,
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_REQUIRED_GRANTS,
} from './project-session-supabase-route-contract-plan'

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION =
  'internal_testing_durable_project_session_supabase_migration_sql_draft_passed_ready_for_migration_review'

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_REVIEW'

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_SCENARIO_ID =
  'durable-project-session-supabase-migration-sql-draft'

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE =
  'database/migration-drafts/024_internal_testing_durable_project_session_access.draft.sql'

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_STATEMENTS = [
  {
    id: 'extensions-and-core-identity-tables',
    kind: 'schema',
    target: 'profiles, workspaces, workspace_members',
    draftSql: `create extension if not exists "pgcrypto";

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
);`,
    status: 'draft_only_not_applied',
  },
  {
    id: 'project-and-edit-session-tables',
    kind: 'schema',
    target: 'projects, edit_sessions',
    draftSql: `create table if not exists public.projects (
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
  deferrable initially deferred;`,
    status: 'draft_only_not_applied',
  },
  {
    id: 'edit-brief-route-data-tables',
    kind: 'schema',
    target: 'edit_briefs, edit_cues, edit_session_export_settings',
    draftSql: `create table if not exists public.edit_briefs (
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
);`,
    status: 'draft_only_not_applied_route_data_select_pending_review',
  },
  {
    id: 'membership-lookup-indexes',
    kind: 'index',
    target: 'workspace_members, projects, edit_sessions, edit_briefs',
    draftSql: `create index if not exists workspace_members_user_workspace_lookup
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
  on public.edit_session_export_settings (project_id, edit_session_id);`,
    status: 'draft_only_not_applied',
  },
  {
    id: 'authenticated-select-grants',
    kind: 'grant',
    target: 'authenticated role select on core route tables',
    draftSql: `grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select on public.projects to authenticated;
grant select on public.edit_sessions to authenticated;

-- Route data table select grants remain review-only until policy inheritance is verified:
-- grant select on public.edit_briefs to authenticated;
-- grant select on public.edit_cues to authenticated;
-- grant select on public.edit_session_export_settings to authenticated;`,
    status: 'draft_only_not_applied_core_select_only',
  },
  {
    id: 'authenticated-role-rls-policies',
    kind: 'rls_policy',
    target: 'core route access chain',
    draftSql: `alter table public.profiles enable row level security;
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
  );`,
    status: 'draft_only_not_applied_route_data_policies_pending_review',
  },
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_REVIEW_CHECKS = [
  'draft_file_lives_under_database_migration_drafts_not_supabase_migrations',
  'core_select_grants_only_until_route_data_policy_review',
  'authenticated_role_rls_uses_workspace_membership_chain',
  'anonymous_access_denied_by_absent_grants_and_rls',
  'mutation_grants_absent_for_internal_testing_draft',
  'no_local_supabase_reset_or_remote_database_apply',
  'no_generated_types_or_table_backed_routes',
  'migration_review_required_before_real_supabase_cli_migration',
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_BLOCKED_SCOPE = {
  ...DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_BLOCKED_SCOPE,
  migrationSqlWritten: true,
  migrationSqlDraftWritten: true,
  executableMigrationCreated: false,
  migrationApplied: false,
  remoteSupabaseValidation: false,
  localSupabaseReset: false,
  generatedTypes: false,
  tableBackedRouteImplementation: false,
  supabaseMigration: false,
  supabaseDataApiRead: false,
  supabaseWrite: false,
  storageSignedUrls: false,
  serviceRoleInBrowser: false,
  externalBeta: false,
  paidProduction: false,
  productReady: false,
} as const

export interface DurableProjectSessionSupabaseMigrationSqlDraft {
  decision: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION
  scenarioId: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_SCENARIO_ID
  priorDecision: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION
  currentMode: 'migration_sql_draft_only'
  nextMode: 'migration_review'
  draftSqlFile: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE
  coreTables: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_CORE_TABLES
  routeDataTables: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_ROUTE_DATA_TABLES
  draftStatements: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_STATEMENTS
  rlsPolicyIntents: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_RLS_POLICIES
  dataApiGrantIntents: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_REQUIRED_GRANTS
  inheritedVerificationChecks: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_VERIFICATION_CHECKS
  reviewChecks: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_REVIEW_CHECKS
  blockedScope: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_BLOCKED_SCOPE
  migrationApplied: false
  durableSupabaseAccessAllowed: false
  productReady: false
  nextGate: typeof DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_NEXT_GATE
}

export function getDurableProjectSessionSupabaseMigrationSqlDraft(): DurableProjectSessionSupabaseMigrationSqlDraft {
  return {
    decision: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_DECISION,
    scenarioId: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_SCENARIO_ID,
    priorDecision: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION,
    currentMode: 'migration_sql_draft_only',
    nextMode: 'migration_review',
    draftSqlFile: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_FILE,
    coreTables: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_CORE_TABLES,
    routeDataTables: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_ROUTE_DATA_TABLES,
    draftStatements: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_STATEMENTS,
    rlsPolicyIntents: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_RLS_POLICIES,
    dataApiGrantIntents: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_REQUIRED_GRANTS,
    inheritedVerificationChecks: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_VERIFICATION_CHECKS,
    reviewChecks: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_REVIEW_CHECKS,
    blockedScope: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_BLOCKED_SCOPE,
    migrationApplied: false,
    durableSupabaseAccessAllowed: false,
    productReady: false,
    nextGate: DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT_NEXT_GATE,
  }
}
