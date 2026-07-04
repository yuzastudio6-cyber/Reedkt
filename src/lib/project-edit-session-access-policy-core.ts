import type {
  InternalTestingAuthProjectAccessReadiness,
  InternalTestingAuthProjectAccessStatus,
} from './internal-testing-auth-project-access-readiness'
import { MOCK_PROJECT_HOME_PROJECT_ID } from './project-edit-session-project-home-ui-adapter'

export const PROJECT_EDIT_SESSION_ACCESS_POLICY_DECISION =
  'internal_testing_auth_project_session_membership_policy_passed_ready_for_durable_auth_project_session_backend_persistence_plan'

export const PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE = [
  'signed_in_auth_user',
  'workspace_membership_verified',
  'project_membership_verified',
  'edit_session_access_verified',
  'rls_policy_verified',
  'explicit_data_api_grants_verified',
  'backend_persistence_mode_verified',
] as const

export type ProjectEditSessionAccessPolicyStatus =
  | 'mock_internal_route_allowed'
  | 'signed_out_durable_access_blocked'
  | 'auth_only_durable_membership_pending'
  | 'durable_membership_ready'
  | 'auth_readiness_error'

export type ProjectEditSessionAccessPersistenceMode =
  | 'mock_internal'
  | 'supabase_disabled_internal'
  | 'supabase_durable_verified'

export type ProjectEditSessionDurableAccessEvidence = {
  workspaceMembershipVerified: boolean
  projectMembershipVerified: boolean
  editSessionAccessVerified: boolean
  rlsPolicyVerified: boolean
  dataApiGrantVerified: boolean
  backendPersistenceMode: ProjectEditSessionAccessPersistenceMode
}

export type ProjectEditSessionAccessPolicyInput = {
  projectId?: string
  editSessionId?: string
  authReadiness: Pick<InternalTestingAuthProjectAccessReadiness, 'status' | 'configured' | 'userEmail' | 'warnings'>
  durableEvidence?: Partial<ProjectEditSessionDurableAccessEvidence>
}

export type ProjectEditSessionAccessPolicy = {
  decision: typeof PROJECT_EDIT_SESSION_ACCESS_POLICY_DECISION
  status: ProjectEditSessionAccessPolicyStatus
  projectId: string
  editSessionId?: string
  authStatus: InternalTestingAuthProjectAccessStatus
  authConfigured: boolean
  userEmail?: string
  mockInternalRouteAllowed: boolean
  durableAuthenticatedAccessAllowed: boolean
  persistenceMode: ProjectEditSessionAccessPersistenceMode
  requiredEvidence: readonly string[]
  missingEvidence: string[]
  message: string
  warnings: string[]
  blockedScope: {
    serviceRole: false
    profileWorkspaceBootstrapWrites: false
    supabaseDataReadWrite: false
    storageSignedUrls: false
    sqlOrMigration: false
    providerOrModelCalls: false
    workerDispatch: false
    mediaProcessing: false
    renderOrExport: false
    creditSpend: false
    productReady: false
  }
}

const DEFAULT_DURABLE_EVIDENCE: ProjectEditSessionDurableAccessEvidence = {
  workspaceMembershipVerified: false,
  projectMembershipVerified: false,
  editSessionAccessVerified: false,
  rlsPolicyVerified: false,
  dataApiGrantVerified: false,
  backendPersistenceMode: 'mock_internal',
}

function mergeDurableEvidence(
  evidence?: Partial<ProjectEditSessionDurableAccessEvidence>,
): ProjectEditSessionDurableAccessEvidence {
  return {
    ...DEFAULT_DURABLE_EVIDENCE,
    ...evidence,
  }
}

function missingEvidenceFor(
  authStatus: InternalTestingAuthProjectAccessStatus,
  evidence: ProjectEditSessionDurableAccessEvidence,
): string[] {
  const missing: string[] = []

  if (authStatus !== 'signed_in_auth_only') missing.push('signed_in_auth_user')
  if (!evidence.workspaceMembershipVerified) missing.push('workspace_membership_verified')
  if (!evidence.projectMembershipVerified) missing.push('project_membership_verified')
  if (!evidence.editSessionAccessVerified) missing.push('edit_session_access_verified')
  if (!evidence.rlsPolicyVerified) missing.push('rls_policy_verified')
  if (!evidence.dataApiGrantVerified) missing.push('explicit_data_api_grants_verified')
  if (evidence.backendPersistenceMode !== 'supabase_durable_verified') {
    missing.push('backend_persistence_mode_verified')
  }

  return missing
}

function statusFor(
  authStatus: InternalTestingAuthProjectAccessStatus,
  missingEvidence: string[],
): ProjectEditSessionAccessPolicyStatus {
  if (authStatus === 'error') return 'auth_readiness_error'
  if (missingEvidence.length === 0) return 'durable_membership_ready'
  if (authStatus === 'signed_out') return 'signed_out_durable_access_blocked'
  if (authStatus === 'signed_in_auth_only') return 'auth_only_durable_membership_pending'
  return 'mock_internal_route_allowed'
}

function messageFor(status: ProjectEditSessionAccessPolicyStatus): string {
  if (status === 'durable_membership_ready') {
    return 'Durable authenticated project/session access evidence is complete for this route.'
  }

  if (status === 'auth_only_durable_membership_pending') {
    return 'Auth is signed in, but durable workspace/project/session membership evidence is still pending.'
  }

  if (status === 'signed_out_durable_access_blocked') {
    return 'Sign in before durable project/session access can be evaluated; mock route access remains available for internal testing.'
  }

  if (status === 'auth_readiness_error') {
    return 'Auth readiness failed safely before durable project/session access evaluation.'
  }

  return 'Mock internal project/session route access is allowed; durable authenticated access is not proven yet.'
}

export function evaluateProjectEditSessionAccessPolicy(
  input: ProjectEditSessionAccessPolicyInput,
): ProjectEditSessionAccessPolicy {
  const durableEvidence = mergeDurableEvidence(input.durableEvidence)
  const missingEvidence = missingEvidenceFor(input.authReadiness.status, durableEvidence)
  const status = statusFor(input.authReadiness.status, missingEvidence)
  const durableAuthenticatedAccessAllowed = status === 'durable_membership_ready'

  return {
    decision: PROJECT_EDIT_SESSION_ACCESS_POLICY_DECISION,
    status,
    projectId: input.projectId ?? MOCK_PROJECT_HOME_PROJECT_ID,
    editSessionId: input.editSessionId,
    authStatus: input.authReadiness.status,
    authConfigured: input.authReadiness.configured,
    userEmail: input.authReadiness.userEmail,
    mockInternalRouteAllowed: true,
    durableAuthenticatedAccessAllowed,
    persistenceMode: durableEvidence.backendPersistenceMode,
    requiredEvidence: PROJECT_EDIT_SESSION_ACCESS_POLICY_REQUIRED_EVIDENCE,
    missingEvidence,
    message: messageFor(status),
    warnings: [
      ...input.authReadiness.warnings,
      ...(durableAuthenticatedAccessAllowed
        ? []
        : ['Durable project/session access remains blocked until backend persistence, RLS, Data API grant, and membership evidence pass.']),
    ],
    blockedScope: {
      serviceRole: false,
      profileWorkspaceBootstrapWrites: false,
      supabaseDataReadWrite: false,
      storageSignedUrls: false,
      sqlOrMigration: false,
      providerOrModelCalls: false,
      workerDispatch: false,
      mediaProcessing: false,
      renderOrExport: false,
      creditSpend: false,
      productReady: false,
    },
  }
}
