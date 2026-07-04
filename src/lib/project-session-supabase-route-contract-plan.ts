import {
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES,
} from './project-edit-session-backend-persistence-plan'

export const DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION =
  'internal_testing_durable_project_session_backend_readback_qa_passed_ready_for_durable_supabase_route_contract_plan'

export const DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION =
  'internal_testing_durable_project_session_supabase_route_contract_plan_passed_ready_for_schema_rls_draft'

export const DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_SCHEMA_RLS_DRAFT'

export const DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_SCENARIO_ID =
  'durable-project-session-supabase-route-contract-plan'

export const DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_REQUIRED_GRANTS = [
  'schema_usage_granted_to_authenticated',
  'select_granted_to_authenticated_for_profiles_workspaces_workspace_members_projects_edit_sessions',
  'route_data_table_select_grants_graduated_only_after_rls_policy_review',
  'no_mutation_grants_until_write_route_contracts_are_separately_approved',
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_RLS_POLICIES = [
  {
    table: 'profiles',
    intent: 'authenticated user can read only their own profile row',
    predicate: 'auth.uid() = id',
  },
  {
    table: 'workspaces',
    intent: 'authenticated user can read workspaces where a workspace_members row exists',
    predicate: 'exists workspace_members where workspace_members.workspace_id = workspaces.id and workspace_members.user_id = auth.uid()',
  },
  {
    table: 'workspace_members',
    intent: 'authenticated user can read only their own workspace membership rows',
    predicate: 'workspace_members.user_id = auth.uid()',
  },
  {
    table: 'projects',
    intent: 'authenticated user can read projects whose workspace membership is verified',
    predicate: 'exists workspace_members where workspace_members.workspace_id = projects.workspace_id and workspace_members.user_id = auth.uid()',
  },
  {
    table: 'edit_sessions',
    intent: 'authenticated user can read edit sessions through project workspace membership',
    predicate:
      'exists projects join workspace_members where edit_sessions.project_id = projects.id and workspace_members.workspace_id = projects.workspace_id and workspace_members.user_id = auth.uid()',
  },
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_ROUTE_FAMILIES = [
  {
    routeFamily: 'project_home',
    path: '/projects/:projectId',
    requiredParams: ['projectId'],
    requiredTables: ['projects', 'workspace_members'],
    accessChain: 'projectId -> projects.workspace_id -> workspace_members.user_id -> auth.uid()',
  },
  {
    routeFamily: 'project_edit_session',
    path: '/projects/:projectId/edits/:editSessionId/chat',
    requiredParams: ['projectId', 'editSessionId'],
    requiredTables: ['edit_sessions', 'projects', 'workspace_members'],
    accessChain: 'editSessionId -> edit_sessions.project_id -> projects.workspace_id -> workspace_members.user_id -> auth.uid()',
  },
  {
    routeFamily: 'project_edit_brief',
    path: '/projects/:projectId/edits/:editSessionId/brief',
    requiredParams: ['projectId', 'editSessionId'],
    requiredTables: ['edit_sessions', 'projects', 'workspace_members'],
    futureRouteDataTables: [
      'edit_briefs',
      'edit_cues',
      'edit_cue_assets',
      'edit_cue_messages',
      'edit_cue_intents',
      'edit_cue_confirmations',
      'edit_cue_conflicts',
      'edit_cue_revisions',
      'edit_brief_application_logs',
      'edit_session_export_settings',
    ],
    accessChain: 'editSessionId -> edit_sessions.project_id -> projects.workspace_id -> workspace_members.user_id -> auth.uid()',
  },
] as const

export const DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_BLOCKED_SCOPE = {
  ...DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE,
  supabaseRouteImplementation: false,
  supabaseSchemaDraftApplied: false,
  rlsPolicyApplied: false,
  dataApiGrantApplied: false,
  liveRouteRead: false,
  liveRouteWrite: false,
  serviceRoleServerUse: false,
} as const

export interface DurableProjectSessionSupabaseRouteContractPlan {
  decision: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION
  scenarioId: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_SCENARIO_ID
  priorDecisions: readonly [
    typeof DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION,
    typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION,
  ]
  currentMode: 'contract_plan_only'
  nextMode: 'schema_rls_draft'
  routeFamilies: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_ROUTE_FAMILIES
  inheritedRouteContracts: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS
  requiredEvidence: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES
  requiredDataApiGrants: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_REQUIRED_GRANTS
  rlsPolicyIntents: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_RLS_POLICIES
  protectedTables: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES
  serviceRoleBoundary: readonly string[]
  auditAndRateLimitRequirements: readonly string[]
  blockedScope: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_BLOCKED_SCOPE
  durableSupabaseAccessAllowed: false
  productReady: false
  nextGate: typeof DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_NEXT_GATE
}

export function getDurableProjectSessionSupabaseRouteContractPlan(): DurableProjectSessionSupabaseRouteContractPlan {
  return {
    decision: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_DECISION,
    scenarioId: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_SCENARIO_ID,
    priorDecisions: [
      DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION,
      DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION,
    ],
    currentMode: 'contract_plan_only',
    nextMode: 'schema_rls_draft',
    routeFamilies: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_ROUTE_FAMILIES,
    inheritedRouteContracts: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS,
    requiredEvidence: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES,
    requiredDataApiGrants: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_REQUIRED_GRANTS,
    rlsPolicyIntents: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_RLS_POLICIES,
    protectedTables: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES,
    serviceRoleBoundary: [
      'browser and frontend-safe API helpers must never receive service-role credentials',
      'trusted backend code may use service role only after a separate schema/RLS/backend implementation gate',
      'route authorization must prefer authenticated-role RLS and explicit Data API grants before any service-role fallback is considered',
    ],
    auditAndRateLimitRequirements: [
      'every route access decision records requestId and idempotencyKey',
      'projectId and editSessionId mismatches fail closed before route data is returned',
      'rate-limit envelope is planned before any durable read or write route graduates',
      'access-denied readbacks return safe error details without private table payloads',
    ],
    blockedScope: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_BLOCKED_SCOPE,
    durableSupabaseAccessAllowed: false,
    productReady: false,
    nextGate: DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN_NEXT_GATE,
  }
}
