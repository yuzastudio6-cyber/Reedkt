import {
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS,
  DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES,
} from './project-edit-session-backend-persistence-plan'

export const MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION =
  'internal_testing_mock_safe_durable_project_session_backend_skeleton_passed_ready_for_backend_route_integration'

export const MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION'

export type ProjectSessionBackendSkeletonMode = 'mock_internal' | 'durable_supabase_disabled'

export type ProjectSessionBackendSkeletonStatus =
  | 'mock_internal_access_allowed'
  | 'blocked_missing_request_context'
  | 'blocked_mock_membership'
  | 'blocked_durable_supabase_missing_evidence'
  | 'blocked_durable_supabase_runtime_not_implemented'

export type ProjectSessionBackendEvidenceGate =
  (typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES)[number]

export type ProjectSessionBackendEvidence = Partial<Record<ProjectSessionBackendEvidenceGate, boolean>>

export interface MockProjectSessionMembershipRecord {
  userId: string
  workspaceId: string
  role: 'owner' | 'editor' | 'viewer'
  projectIds: readonly string[]
  editSessionIdsByProjectId: Readonly<Record<string, readonly string[]>>
}

export interface ProjectSessionBackendSkeletonInput {
  mode?: ProjectSessionBackendSkeletonMode
  authUserId?: string
  workspaceId?: string
  projectId?: string
  editSessionId?: string
  requestId?: string
  idempotencyKey?: string
  membershipRecords?: readonly MockProjectSessionMembershipRecord[]
  evidence?: ProjectSessionBackendEvidence
}

export interface ProjectSessionBackendAccessResult {
  decision: typeof MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION
  mode: ProjectSessionBackendSkeletonMode
  status: ProjectSessionBackendSkeletonStatus
  mockInternalAccessAllowed: boolean
  durableSupabaseAccessAllowed: false
  routeAccessAllowed: boolean
  supabaseLiveEnabled: false
  serviceRoleInBrowserAllowed: false
  matchedRole: MockProjectSessionMembershipRecord['role'] | null
  missingRequestFields: string[]
  missingDurableEvidence: ProjectSessionBackendEvidenceGate[]
  checkedGates: readonly ProjectSessionBackendEvidenceGate[]
  auditEnvelope: {
    requestId: string | null
    idempotencyKey: string | null
    source: 'mock_safe_project_session_backend_skeleton'
    idempotent: boolean
  }
  blockedScope: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE
}

export interface ProjectSessionBackendSkeletonSummary {
  decision: typeof MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION
  priorDecision: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION
  currentMode: 'mock_safe_backend_skeleton'
  routeIntegrationReady: true
  durableSupabaseReady: false
  requiredEvidence: readonly ProjectSessionBackendEvidenceGate[]
  plannedTables: readonly string[]
  routeContracts: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS
  blockedScope: typeof DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE
  nextGate: typeof MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_NEXT_GATE
}

export const DEFAULT_MOCK_PROJECT_SESSION_MEMBERSHIP_RECORDS: readonly MockProjectSessionMembershipRecord[] = [
  {
    userId: 'mock-auth-user-internal-tester',
    workspaceId: 'workspace-internal-testing',
    role: 'owner',
    projectIds: ['mock-project-edit-chat-foundation'],
    editSessionIdsByProjectId: {
      'mock-project-edit-chat-foundation': [
        'edit-session-youtube-wide',
        'edit-session-vertical-dna',
        'edit-session-product-demo-short',
      ],
    },
  },
]

function hasText(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

interface ResolvedProjectSessionAccessIds {
  authUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}

function findMembership(input: ResolvedProjectSessionAccessIds, records: readonly MockProjectSessionMembershipRecord[]) {
  return records.find((record) => {
    if (record.userId !== input.authUserId || record.workspaceId !== input.workspaceId) {
      return false
    }

    if (!record.projectIds.includes(input.projectId)) {
      return false
    }

    return record.editSessionIdsByProjectId[input.projectId]?.includes(input.editSessionId) === true
  }) ?? null
}

export function evaluateProjectSessionBackendAccess(
  input: ProjectSessionBackendSkeletonInput,
): ProjectSessionBackendAccessResult {
  const mode = input.mode ?? 'mock_internal'
  const requestFields: Array<readonly [string, string | undefined]> = [
    ['authUserId', input.authUserId],
    ['workspaceId', input.workspaceId],
    ['projectId', input.projectId],
    ['editSessionId', input.editSessionId],
    ['requestId', input.requestId],
    ['idempotencyKey', input.idempotencyKey],
  ]
  const missingRequestFields = requestFields
    .filter(([, value]) => !hasText(value))
    .map(([key]) => key)

  const missingDurableEvidence = DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES.filter(
    (gate) => input.evidence?.[gate] !== true,
  )

  const auditEnvelope = {
    requestId: hasText(input.requestId) ? input.requestId : null,
    idempotencyKey: hasText(input.idempotencyKey) ? input.idempotencyKey : null,
    source: 'mock_safe_project_session_backend_skeleton' as const,
    idempotent: hasText(input.requestId) && hasText(input.idempotencyKey),
  }

  const baseResult = {
    decision: MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION as typeof MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION,
    mode,
    durableSupabaseAccessAllowed: false as const,
    supabaseLiveEnabled: false as const,
    serviceRoleInBrowserAllowed: false as const,
    missingRequestFields,
    missingDurableEvidence,
    checkedGates: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES,
    auditEnvelope,
    blockedScope: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE,
  }

  if (missingRequestFields.length > 0) {
    return {
      ...baseResult,
      status: 'blocked_missing_request_context',
      mockInternalAccessAllowed: false,
      routeAccessAllowed: false,
      matchedRole: null,
    }
  }

  if (mode === 'durable_supabase_disabled') {
    return {
      ...baseResult,
      status:
        missingDurableEvidence.length > 0
          ? 'blocked_durable_supabase_missing_evidence'
          : 'blocked_durable_supabase_runtime_not_implemented',
      mockInternalAccessAllowed: false,
      routeAccessAllowed: false,
      matchedRole: null,
    }
  }

  const matchedRecord = findMembership(
    {
      authUserId: input.authUserId as string,
      workspaceId: input.workspaceId as string,
      projectId: input.projectId as string,
      editSessionId: input.editSessionId as string,
    },
    input.membershipRecords ?? DEFAULT_MOCK_PROJECT_SESSION_MEMBERSHIP_RECORDS,
  )

  if (!matchedRecord) {
    return {
      ...baseResult,
      status: 'blocked_mock_membership',
      mockInternalAccessAllowed: false,
      routeAccessAllowed: false,
      matchedRole: null,
    }
  }

  return {
    ...baseResult,
    status: 'mock_internal_access_allowed',
    mockInternalAccessAllowed: true,
    routeAccessAllowed: true,
    matchedRole: matchedRecord.role,
  }
}

export function getMockSafeDurableProjectSessionBackendSkeleton(): ProjectSessionBackendSkeletonSummary {
  return {
    decision: MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION,
    priorDecision: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_DECISION,
    currentMode: 'mock_safe_backend_skeleton',
    routeIntegrationReady: true,
    durableSupabaseReady: false,
    requiredEvidence: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_REQUIRED_GATES,
    plannedTables: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_TABLES,
    routeContracts: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_ROUTE_CONTRACTS,
    blockedScope: DURABLE_AUTH_PROJECT_SESSION_BACKEND_PERSISTENCE_PLAN_BLOCKED_SCOPE,
    nextGate: MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_NEXT_GATE,
  }
}
