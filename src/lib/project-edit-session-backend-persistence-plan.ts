export const DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION =
  'internal_testing_durable_auth_project_session_backend_persistence_plan_passed_ready_for_mock_safe_backend_skeleton'

export const DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES = [
  'signed_in_auth_user_verified_server_side',
  'workspace_membership_verified_by_workspace_members',
  'project_membership_verified_by_projects_workspace_id',
  'edit_session_access_verified_by_project_id',
  'rls_policies_verified_for_authenticated_role',
  'explicit_data_api_grants_verified_for_authenticated_role',
  'service_role_confined_to_trusted_backend_worker_context',
  'audit_idempotency_and_rate_limit_envelope_defined',
] as const

export const DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES = [
  'profiles',
  'workspaces',
  'workspace_members',
  'projects',
  'edit_sessions',
  'audit_events',
] as const

export const DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS = [
  {
    surface: 'project_home',
    path: '/projects/:projectId',
    accessCheck: 'projectId -> projects.workspace_id -> workspace_members.user_id',
  },
  {
    surface: 'edit_chat',
    path: '/projects/:projectId/edits/:editSessionId/chat',
    accessCheck: 'editSessionId -> edit_sessions.project_id -> projects.workspace_id -> workspace_members.user_id',
  },
  {
    surface: 'edit_brief',
    path: '/projects/:projectId/edits/:editSessionId/brief',
    accessCheck: 'editSessionId -> edit_sessions.project_id -> projects.workspace_id -> workspace_members.user_id',
  },
] as const

export const DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE = {
  supabaseMigration: false,
  supabaseWrite: false,
  supabaseDataApiRead: false,
  storageSignedUrls: false,
  serviceRoleInBrowser: false,
  profileWorkspaceBootstrapWrites: false,
  providerOrModelCalls: false,
  workerDispatch: false,
  mediaProcessing: false,
  renderOrExport: false,
  creditSpend: false,
  externalBeta: false,
  paidProduction: false,
  productReady: false,
} as const

export type DurableAuthProjectSessionBackendPersistencePlan = {
  decision: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION
  currentMode: 'mock_internal_plan_only'
  nextMode: 'mock_safe_backend_skeleton'
  requiredGates: readonly string[]
  plannedTables: readonly string[]
  routeContracts: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS
  hardSecurityRules: readonly string[]
  blockedScope: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE
}

export function getDurableAuthProjectSessionBackendPersistencePlan(): DurableAuthProjectSessionBackendPersistencePlan {
  return {
    decision: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION,
    currentMode: 'mock_internal_plan_only',
    nextMode: 'mock_safe_backend_skeleton',
    requiredGates: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES,
    plannedTables: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES,
    routeContracts: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS,
    hardSecurityRules: [
      'authorize from server-verified Supabase Auth user id, never raw user_metadata',
      'scope every project and edit session through workspace_members',
      'require explicit Data API grants and RLS together before table-backed access is considered ready',
      'keep service-role credentials out of browser bundles and frontend-safe helpers',
      'record backend access decisions with idempotency, audit, and rate-limit metadata before durable writes',
      'preserve approved snapshot and credit reservation gates before any expensive work can start',
    ],
    blockedScope: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE,
  }
}
