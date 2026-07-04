import {
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION,
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_RLS_POLICIES,
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_ROUTE_FAMILIES,
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_REQUIRED_GRANTS,
  DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_BLOCKED_SCOPE,
} from './project-session-supabase-route-contract-plan'

export const DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION =
  'internal_testing_durable_project_session_supabase_schema_rls_draft_passed_ready_for_migration_sql_draft'

export const DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_MIGRATION_SQL_DRAFT'

export const DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_SCENARIO_ID =
  'durable-project-session-supabase-schema-rls-draft'

export const DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_CORE_TABLES = [
  {
    table: 'profiles',
    requiredColumns: ['id'],
    accessPurpose: 'server-verified user identity anchor',
    requiredIndex: 'primary key on id',
  },
  {
    table: 'workspaces',
    requiredColumns: ['id'],
    accessPurpose: 'workspace scope anchor',
    requiredIndex: 'primary key on id',
  },
  {
    table: 'workspace_members',
    requiredColumns: ['workspace_id', 'user_id', 'role'],
    accessPurpose: 'workspace membership proof for project/session access',
    requiredIndex: 'workspace_members_user_workspace_lookup on user_id and workspace_id',
  },
  {
    table: 'projects',
    requiredColumns: ['id', 'workspace_id'],
    accessPurpose: 'project-to-workspace ownership chain',
    requiredIndex: 'projects_workspace_lookup on workspace_id',
  },
  {
    table: 'edit_sessions',
    requiredColumns: ['id', 'project_id'],
    accessPurpose: 'edit-session-to-project ownership chain',
    requiredIndex: 'edit_sessions_project_lookup on project_id',
  },
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_ROUTE_DATA_TABLES = [
  {
    table: 'edit_briefs',
    requiredColumns: ['id', 'project_id', 'edit_session_id'],
    accessPurpose: 'brief rows inherit project/session access',
    grantStatus: 'draft_select_only_after_policy_review',
  },
  {
    table: 'edit_cues',
    requiredColumns: ['id', 'brief_id', 'edit_session_id'],
    accessPurpose: 'cue rows inherit brief and edit-session access',
    grantStatus: 'draft_select_only_after_policy_review',
  },
  {
    table: 'edit_session_export_settings',
    requiredColumns: ['id', 'project_id', 'edit_session_id'],
    accessPurpose: 'export settings inherit project/session access',
    grantStatus: 'draft_select_only_after_policy_review',
  },
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_VERIFICATION_CHECKS = [
  'authenticated_user_can_read_own_profile',
  'authenticated_user_can_read_only_member_workspaces',
  'authenticated_user_can_read_only_projects_in_member_workspaces',
  'authenticated_user_can_read_only_edit_sessions_in_member_projects',
  'non_member_project_read_denied',
  'non_member_edit_session_read_denied',
  'anonymous_role_denied',
  'mutation_grants_absent_for_internal_testing_draft',
  'service_role_not_required_for_browser_or_frontend_safe_route_access',
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_BLOCKED_SCOPE = {
  ...DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_BLOCKED_SCOPE,
  migrationSqlWritten: false,
  migrationApplied: false,
  remoteSupabaseValidation: false,
  localSupabaseReset: false,
  generatedTypes: false,
  tableBackedRouteImplementation: false,
} as const

export interface DurableProjectSessionSupabaseSchemaRlsDraft {
  decision: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION
  scenarioId: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_SCENARIO_ID
  priorDecision: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION
  currentMode: 'schema_rls_draft_only'
  nextMode: 'migration_sql_draft'
  routeFamilies: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_ROUTE_FAMILIES
  coreTables: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_CORE_TABLES
  routeDataTables: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_ROUTE_DATA_TABLES
  rlsPolicyIntents: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_RLS_POLICIES
  dataApiGrantIntents: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_REQUIRED_GRANTS
  verificationChecks: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_VERIFICATION_CHECKS
  blockedScope: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_BLOCKED_SCOPE
  migrationApplied: false
  durableSupabaseAccessAllowed: false
  productReady: false
  nextGate: typeof DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_NEXT_GATE
}

export function getDurableProjectSessionSupabaseSchemaRlsDraft(): DurableProjectSessionSupabaseSchemaRlsDraft {
  return {
    decision: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_DECISION,
    scenarioId: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_SCENARIO_ID,
    priorDecision: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION,
    currentMode: 'schema_rls_draft_only',
    nextMode: 'migration_sql_draft',
    routeFamilies: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_ROUTE_FAMILIES,
    coreTables: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_CORE_TABLES,
    routeDataTables: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_ROUTE_DATA_TABLES,
    rlsPolicyIntents: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_RLS_POLICIES,
    dataApiGrantIntents: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_REQUIRED_GRANTS,
    verificationChecks: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_VERIFICATION_CHECKS,
    blockedScope: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_BLOCKED_SCOPE,
    migrationApplied: false,
    durableSupabaseAccessAllowed: false,
    productReady: false,
    nextGate: DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT_NEXT_GATE,
  }
}
