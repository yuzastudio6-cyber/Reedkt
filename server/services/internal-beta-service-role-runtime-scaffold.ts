import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaRuntimeScaffoldRouteId =
  | 'internalBeta.session.create'
  | 'internalBeta.approvedPlan.commit'
  | 'internalBeta.creditReservation.create'
  | 'internalBeta.job.enqueue'
  | 'internalBeta.job.status.get'
  | 'internalBeta.artifactManifest.write'
  | 'internalBeta.privateArtifactAccess.create'
  | 'internalBeta.qaReport.read'

export type InternalBetaRuntimeScaffoldStatus = 'disabled_pending_runtime_gate'

export interface InternalBetaRuntimeScaffoldDefinition {
  routeId: InternalBetaRuntimeScaffoldRouteId
  futureHandlerName: string
  scaffoldFunctionName: string
  serviceRoleRequired: boolean
  approvedSnapshotRequired: boolean
  creditReservationRequired: boolean
  idempotencyKeyRequired: boolean
  privateArtifactPolicyRequired: boolean
  routeExecutionEnabled: false
  workerExecutionEnabled: false
  providerModelCallsEnabled: false
  renderExportEnabled: false
  creditMutationEnabled: false
  supabaseMutationEnabled: false
}

export interface InternalBetaRuntimeScaffoldInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  requestId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  jobId?: string
  artifactManifestId?: string
  qaReportId?: string
  idempotencyKey?: string
  payload?: Record<string, unknown>
}

export interface InternalBetaRuntimeScaffoldResult {
  ok: false
  status: InternalBetaRuntimeScaffoldStatus
  routeId: InternalBetaRuntimeScaffoldRouteId
  futureHandlerName: string
  scaffoldFunctionName: string
  createdAt: string
  httpStatusCode: 202
  routeExecution: false
  workerExecution: false
  providerModelCalls: false
  renderExportExecution: false
  creditMutation: false
  supabaseMutation: false
  privateArtifactAccessEnabled: false
  publicArtifactsCreated: false
  stripePaymentProcessing: false
  requiredBeforeEnablement: string[]
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export const INTERNAL_BETA_SERVICE_ROLE_RUNTIME_SCAFFOLDS: InternalBetaRuntimeScaffoldDefinition[] = [
  {
    routeId: 'internalBeta.session.create',
    futureHandlerName: 'createInternalBetaSession',
    scaffoldFunctionName: 'createInternalBetaSessionScaffold',
    serviceRoleRequired: true,
    approvedSnapshotRequired: false,
    creditReservationRequired: false,
    idempotencyKeyRequired: true,
    privateArtifactPolicyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    routeId: 'internalBeta.approvedPlan.commit',
    futureHandlerName: 'commitInternalBetaApprovedPlan',
    scaffoldFunctionName: 'commitInternalBetaApprovedPlanScaffold',
    serviceRoleRequired: true,
    approvedSnapshotRequired: false,
    creditReservationRequired: true,
    idempotencyKeyRequired: true,
    privateArtifactPolicyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    routeId: 'internalBeta.creditReservation.create',
    futureHandlerName: 'createInternalBetaCreditReservation',
    scaffoldFunctionName: 'createInternalBetaCreditReservationScaffold',
    serviceRoleRequired: true,
    approvedSnapshotRequired: false,
    creditReservationRequired: false,
    idempotencyKeyRequired: true,
    privateArtifactPolicyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    routeId: 'internalBeta.job.enqueue',
    futureHandlerName: 'enqueueInternalBetaJob',
    scaffoldFunctionName: 'enqueueInternalBetaJobScaffold',
    serviceRoleRequired: true,
    approvedSnapshotRequired: true,
    creditReservationRequired: true,
    idempotencyKeyRequired: true,
    privateArtifactPolicyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    routeId: 'internalBeta.job.status.get',
    futureHandlerName: 'getInternalBetaJobStatus',
    scaffoldFunctionName: 'getInternalBetaJobStatusScaffold',
    serviceRoleRequired: false,
    approvedSnapshotRequired: false,
    creditReservationRequired: false,
    idempotencyKeyRequired: false,
    privateArtifactPolicyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    routeId: 'internalBeta.artifactManifest.write',
    futureHandlerName: 'writeInternalBetaArtifactManifest',
    scaffoldFunctionName: 'writeInternalBetaArtifactManifestScaffold',
    serviceRoleRequired: true,
    approvedSnapshotRequired: true,
    creditReservationRequired: false,
    idempotencyKeyRequired: true,
    privateArtifactPolicyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    routeId: 'internalBeta.privateArtifactAccess.create',
    futureHandlerName: 'createInternalBetaPrivateArtifactAccess',
    scaffoldFunctionName: 'createInternalBetaPrivateArtifactAccessScaffold',
    serviceRoleRequired: true,
    approvedSnapshotRequired: true,
    creditReservationRequired: false,
    idempotencyKeyRequired: true,
    privateArtifactPolicyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    routeId: 'internalBeta.qaReport.read',
    futureHandlerName: 'readInternalBetaQaReport',
    scaffoldFunctionName: 'readInternalBetaQaReportScaffold',
    serviceRoleRequired: false,
    approvedSnapshotRequired: true,
    creditReservationRequired: false,
    idempotencyKeyRequired: false,
    privateArtifactPolicyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
]

export function getInternalBetaServiceRoleRuntimeScaffold(
  routeId: InternalBetaRuntimeScaffoldRouteId,
): InternalBetaRuntimeScaffoldDefinition {
  const definition = INTERNAL_BETA_SERVICE_ROLE_RUNTIME_SCAFFOLDS.find((item) => item.routeId === routeId)
  if (!definition) {
    throw new Error(`Unknown internal beta runtime scaffold route: ${routeId}`)
  }

  return definition
}

export function createDisabledInternalBetaRuntimeScaffoldResult(
  routeId: InternalBetaRuntimeScaffoldRouteId,
  input: InternalBetaRuntimeScaffoldInput = {},
): InternalBetaRuntimeScaffoldResult {
  const definition = getInternalBetaServiceRoleRuntimeScaffold(routeId)

  return {
    ok: false,
    status: 'disabled_pending_runtime_gate',
    routeId,
    futureHandlerName: definition.futureHandlerName,
    scaffoldFunctionName: definition.scaffoldFunctionName,
    createdAt: nowIso(),
    httpStatusCode: 202,
    routeExecution: false,
    workerExecution: false,
    providerModelCalls: false,
    renderExportExecution: false,
    creditMutation: false,
    supabaseMutation: false,
    privateArtifactAccessEnabled: false,
    publicArtifactsCreated: false,
    stripePaymentProcessing: false,
    requiredBeforeEnablement: buildRuntimeGateRequirements(definition),
    inputSummary: summarizeScaffoldInput(input),
    warnings: [
      'Internal beta service-role runtime scaffold is fail-closed.',
      'No Supabase write, worker dispatch, provider/model call, render/export, private artifact access, signed URL, public artifact, credit mutation, Stripe/payment processing, beta unlock, or production unlock occurred.',
    ],
  }
}

export function createInternalBetaSessionScaffold(input: InternalBetaRuntimeScaffoldInput = {}) {
  return createDisabledInternalBetaRuntimeScaffoldResult('internalBeta.session.create', input)
}

export function commitInternalBetaApprovedPlanScaffold(input: InternalBetaRuntimeScaffoldInput = {}) {
  return createDisabledInternalBetaRuntimeScaffoldResult('internalBeta.approvedPlan.commit', input)
}

export function createInternalBetaCreditReservationScaffold(input: InternalBetaRuntimeScaffoldInput = {}) {
  return createDisabledInternalBetaRuntimeScaffoldResult('internalBeta.creditReservation.create', input)
}

export function enqueueInternalBetaJobScaffold(input: InternalBetaRuntimeScaffoldInput = {}) {
  return createDisabledInternalBetaRuntimeScaffoldResult('internalBeta.job.enqueue', input)
}

export function getInternalBetaJobStatusScaffold(input: InternalBetaRuntimeScaffoldInput = {}) {
  return createDisabledInternalBetaRuntimeScaffoldResult('internalBeta.job.status.get', input)
}

export function writeInternalBetaArtifactManifestScaffold(input: InternalBetaRuntimeScaffoldInput = {}) {
  return createDisabledInternalBetaRuntimeScaffoldResult('internalBeta.artifactManifest.write', input)
}

export function createInternalBetaPrivateArtifactAccessScaffold(input: InternalBetaRuntimeScaffoldInput = {}) {
  return createDisabledInternalBetaRuntimeScaffoldResult('internalBeta.privateArtifactAccess.create', input)
}

export function readInternalBetaQaReportScaffold(input: InternalBetaRuntimeScaffoldInput = {}) {
  return createDisabledInternalBetaRuntimeScaffoldResult('internalBeta.qaReport.read', input)
}

function buildRuntimeGateRequirements(definition: InternalBetaRuntimeScaffoldDefinition): string[] {
  const requirements = [
    'explicit_backend_runtime_enablement_milestone',
    'local_or_staging_supabase_target_approval',
    'least_privilege_service_role_runtime_test',
    'transactional_audit_log_contract',
  ]

  if (definition.idempotencyKeyRequired) requirements.push('idempotency_key_enforcement')
  if (definition.approvedSnapshotRequired) requirements.push('approved_plan_snapshot_required')
  if (definition.creditReservationRequired) requirements.push('credit_reservation_required')
  if (definition.privateArtifactPolicyRequired) requirements.push('private_artifact_policy_and_cleanup_required')

  return requirements
}

function summarizeScaffoldInput(input: InternalBetaRuntimeScaffoldInput): Record<string, unknown> {
  return sanitizeJson({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    requestId: input.requestId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    jobId: input.jobId,
    artifactManifestId: input.artifactManifestId,
    qaReportId: input.qaReportId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    payloadKeys: input.payload ? Object.keys(sanitizeJson(input.payload)).sort() : [],
  })
}
