import { MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION } from '../../lib/project-edit-session-backend-skeleton'
import { DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION } from './project-session-access-route-integration'

export const DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION =
  'internal_testing_durable_project_session_backend_readback_qa_passed_ready_for_durable_supabase_route_contract_plan'

export const DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_NEXT_GATE =
  'INTERNAL_TESTING_DURABLE_PROJECT_SESSION_SUPABASE_ROUTE_CONTRACT_PLAN'

export type ProjectSessionReadbackRouteFamily = 'project_edit_session' | 'project_edit_brief'
export type ProjectSessionReadbackEnvelopeKind = 'success_data' | 'failure_error'

export interface ProjectSessionAccessReadbackMeta {
  decision?: string
  status?: string
  mockInternalAccessAllowed?: boolean
  durableSupabaseAccessAllowed?: boolean
  routeAccessAllowed?: boolean
  supabaseLiveEnabled?: boolean
  serviceRoleInBrowserAllowed?: boolean
  auditEnvelope?: {
    requestId?: string | null
    idempotencyKey?: string | null
    idempotent?: boolean
    source?: string
  }
  blockedScope?: Record<string, boolean>
}

export interface ProjectSessionRouteReadbackCase {
  routeId: string
  routeFamily: ProjectSessionReadbackRouteFamily
  envelopeKind: ProjectSessionReadbackEnvelopeKind
  ok: boolean
  statusCode: number
  projectSessionAccess?: ProjectSessionAccessReadbackMeta
  warnings: readonly string[]
  productionSideEffects: {
    providerCallMade?: boolean
    supabaseWriteMade?: boolean
    workerJobCreated?: boolean
    renderJobCreated?: boolean
    creditReservedOrSpent?: boolean
  }
}

export interface ProjectSessionReadbackQaReport {
  decision: typeof DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION
  priorDecision: typeof DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION
  acceptedRouteFamilies: readonly ProjectSessionReadbackRouteFamily[]
  acceptedEnvelopeKinds: readonly ProjectSessionReadbackEnvelopeKind[]
  routeCaseCount: number
  passedCaseCount: number
  failedCases: Array<{ routeId: string; reasons: string[] }>
  durableSupabaseAccessAllowed: false
  productReady: false
  nextGate: typeof DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_NEXT_GATE
}

function isFalse(value: boolean | undefined): boolean {
  return value === false || value === undefined
}

export function validateProjectSessionReadbackCase(routeCase: ProjectSessionRouteReadbackCase): string[] {
  const reasons: string[] = []
  const access = routeCase.projectSessionAccess

  if (!access) reasons.push('missing_project_session_access')
  if (access?.decision !== MOCK_SAFE_DURABLE_PROJECT_SESSION_BACKEND_SKELETON_DECISION) reasons.push('decision_drift')
  if (access?.status !== 'mock_internal_access_allowed') reasons.push('status_not_mock_internal_access_allowed')
  if (access?.mockInternalAccessAllowed !== true) reasons.push('mock_internal_access_not_allowed')
  if (access?.routeAccessAllowed !== true) reasons.push('route_access_not_allowed')
  if (access?.durableSupabaseAccessAllowed !== false) reasons.push('durable_supabase_access_not_false')
  if (access?.supabaseLiveEnabled !== false) reasons.push('supabase_live_not_false')
  if (access?.serviceRoleInBrowserAllowed !== false) reasons.push('service_role_browser_boundary_not_false')
  if (access?.auditEnvelope?.idempotent !== true) reasons.push('audit_envelope_not_idempotent')
  if (!access?.auditEnvelope?.requestId) reasons.push('missing_request_id')
  if (!access?.auditEnvelope?.idempotencyKey) reasons.push('missing_idempotency_key')
  if (!routeCase.warnings.some((warning) => warning.toLowerCase().includes('project/session access'))) {
    reasons.push('missing_project_session_access_warning')
  }
  if (!isFalse(routeCase.productionSideEffects.providerCallMade)) reasons.push('provider_call_made')
  if (!isFalse(routeCase.productionSideEffects.supabaseWriteMade)) reasons.push('supabase_write_made')
  if (!isFalse(routeCase.productionSideEffects.workerJobCreated)) reasons.push('worker_job_created')
  if (!isFalse(routeCase.productionSideEffects.renderJobCreated)) reasons.push('render_job_created')
  if (!isFalse(routeCase.productionSideEffects.creditReservedOrSpent)) reasons.push('credit_reserved_or_spent')

  return reasons
}

export function createProjectSessionBackendReadbackQaReport(
  routeCases: readonly ProjectSessionRouteReadbackCase[],
): ProjectSessionReadbackQaReport {
  const failedCases = routeCases
    .map((routeCase) => ({
      routeId: routeCase.routeId,
      reasons: validateProjectSessionReadbackCase(routeCase),
    }))
    .filter((result) => result.reasons.length > 0)

  return {
    decision: DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_DECISION,
    priorDecision: DURABLE_PROJECT_SESSION_BACKEND_ROUTE_INTEGRATION_DECISION,
    acceptedRouteFamilies: ['project_edit_session', 'project_edit_brief'],
    acceptedEnvelopeKinds: ['success_data', 'failure_error'],
    routeCaseCount: routeCases.length,
    passedCaseCount: routeCases.length - failedCases.length,
    failedCases,
    durableSupabaseAccessAllowed: false,
    productReady: false,
    nextGate: DURABLE_PROJECT_SESSION_BACKEND_READBACK_QA_NEXT_GATE,
  }
}
