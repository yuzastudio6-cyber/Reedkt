import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaJobQueueRuntimeOperation =
  | 'job_batch_create'
  | 'job_enqueue'
  | 'job_status_read'
  | 'job_event_append'
  | 'worker_lease_claim'
  | 'worker_heartbeat'
  | 'job_retry_schedule'
  | 'job_cancel'

export type InternalBetaJobQueueRuntimeStatus = 'disabled_pending_job_queue_runtime_gate'

export interface InternalBetaJobQueueRuntimeScaffoldDefinition {
  operation: InternalBetaJobQueueRuntimeOperation
  scaffoldFunctionName: string
  approvedPlanRequired: boolean
  creditReservationRequired: boolean
  jobIdRequired: boolean
  workerLeaseRequired: boolean
  idempotencyKeyRequired: boolean
  routeExecutionEnabled: false
  workerExecutionEnabled: false
  providerModelCallsEnabled: false
  renderExportEnabled: false
  creditMutationEnabled: false
  supabaseMutationEnabled: false
}

export interface InternalBetaJobQueueRuntimeInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  requestId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  jobBatchId?: string
  jobId?: string
  workerType?: string
  workerInstanceId?: string
  leaseId?: string
  idempotencyKey?: string
  reason?: string
  payload?: Record<string, unknown>
}

export interface InternalBetaJobQueueRuntimeScaffoldResult {
  ok: false
  status: InternalBetaJobQueueRuntimeStatus
  operation: InternalBetaJobQueueRuntimeOperation
  scaffoldFunctionName: string
  createdAt: string
  httpStatusCode: 202
  approvedPlanRequired: boolean
  creditReservationRequired: boolean
  jobIdRequired: boolean
  workerLeaseRequired: boolean
  idempotencyKeyRequired: boolean
  routeExecution: false
  workerExecution: false
  providerModelCalls: false
  renderExportExecution: false
  creditMutation: false
  supabaseMutation: false
  privateArtifactAccessEnabled: false
  publicArtifactsCreated: false
  internalBetaUnlock: false
  requiredBeforeEnablement: string[]
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export const INTERNAL_BETA_JOB_QUEUE_RUNTIME_SCAFFOLDS: InternalBetaJobQueueRuntimeScaffoldDefinition[] = [
  {
    operation: 'job_batch_create',
    scaffoldFunctionName: 'createInternalBetaJobBatchRuntimeScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: false,
    workerLeaseRequired: false,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'job_enqueue',
    scaffoldFunctionName: 'enqueueInternalBetaJobRuntimeScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: false,
    workerLeaseRequired: false,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'job_status_read',
    scaffoldFunctionName: 'readInternalBetaJobStatusRuntimeScaffold',
    approvedPlanRequired: false,
    creditReservationRequired: false,
    jobIdRequired: true,
    workerLeaseRequired: false,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'job_event_append',
    scaffoldFunctionName: 'appendInternalBetaJobEventRuntimeScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: false,
    jobIdRequired: true,
    workerLeaseRequired: false,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'worker_lease_claim',
    scaffoldFunctionName: 'claimInternalBetaWorkerLeaseRuntimeScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    workerLeaseRequired: false,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'worker_heartbeat',
    scaffoldFunctionName: 'heartbeatInternalBetaWorkerLeaseRuntimeScaffold',
    approvedPlanRequired: false,
    creditReservationRequired: false,
    jobIdRequired: true,
    workerLeaseRequired: true,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'job_retry_schedule',
    scaffoldFunctionName: 'scheduleInternalBetaJobRetryRuntimeScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    workerLeaseRequired: false,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'job_cancel',
    scaffoldFunctionName: 'cancelInternalBetaJobRuntimeScaffold',
    approvedPlanRequired: false,
    creditReservationRequired: false,
    jobIdRequired: true,
    workerLeaseRequired: false,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
]

export function getInternalBetaJobQueueRuntimeScaffold(
  operation: InternalBetaJobQueueRuntimeOperation,
): InternalBetaJobQueueRuntimeScaffoldDefinition {
  const definition = INTERNAL_BETA_JOB_QUEUE_RUNTIME_SCAFFOLDS.find((item) => item.operation === operation)
  if (!definition) {
    throw new Error(`Unknown internal beta job queue runtime operation: ${operation}`)
  }

  return definition
}

export function createDisabledInternalBetaJobQueueRuntimeScaffoldResult(
  operation: InternalBetaJobQueueRuntimeOperation,
  input: InternalBetaJobQueueRuntimeInput = {},
): InternalBetaJobQueueRuntimeScaffoldResult {
  const definition = getInternalBetaJobQueueRuntimeScaffold(operation)

  return {
    ok: false,
    status: 'disabled_pending_job_queue_runtime_gate',
    operation,
    scaffoldFunctionName: definition.scaffoldFunctionName,
    createdAt: nowIso(),
    httpStatusCode: 202,
    approvedPlanRequired: definition.approvedPlanRequired,
    creditReservationRequired: definition.creditReservationRequired,
    jobIdRequired: definition.jobIdRequired,
    workerLeaseRequired: definition.workerLeaseRequired,
    idempotencyKeyRequired: definition.idempotencyKeyRequired,
    routeExecution: false,
    workerExecution: false,
    providerModelCalls: false,
    renderExportExecution: false,
    creditMutation: false,
    supabaseMutation: false,
    privateArtifactAccessEnabled: false,
    publicArtifactsCreated: false,
    internalBetaUnlock: false,
    requiredBeforeEnablement: buildJobQueueGateRequirements(definition),
    inputSummary: summarizeJobQueueInput(input),
    warnings: [
      'Internal beta job queue runtime scaffold is fail-closed.',
      'No job enqueue, job event write, worker lease claim, worker heartbeat, worker dispatch, provider/model call, render/export, credit mutation, Supabase write, beta unlock, or production unlock occurred.',
    ],
  }
}

export function createInternalBetaJobBatchRuntimeScaffold(input: InternalBetaJobQueueRuntimeInput = {}) {
  return createDisabledInternalBetaJobQueueRuntimeScaffoldResult('job_batch_create', input)
}

export function enqueueInternalBetaJobRuntimeScaffold(input: InternalBetaJobQueueRuntimeInput = {}) {
  return createDisabledInternalBetaJobQueueRuntimeScaffoldResult('job_enqueue', input)
}

export function readInternalBetaJobStatusRuntimeScaffold(input: InternalBetaJobQueueRuntimeInput = {}) {
  return createDisabledInternalBetaJobQueueRuntimeScaffoldResult('job_status_read', input)
}

export function appendInternalBetaJobEventRuntimeScaffold(input: InternalBetaJobQueueRuntimeInput = {}) {
  return createDisabledInternalBetaJobQueueRuntimeScaffoldResult('job_event_append', input)
}

export function claimInternalBetaWorkerLeaseRuntimeScaffold(input: InternalBetaJobQueueRuntimeInput = {}) {
  return createDisabledInternalBetaJobQueueRuntimeScaffoldResult('worker_lease_claim', input)
}

export function heartbeatInternalBetaWorkerLeaseRuntimeScaffold(input: InternalBetaJobQueueRuntimeInput = {}) {
  return createDisabledInternalBetaJobQueueRuntimeScaffoldResult('worker_heartbeat', input)
}

export function scheduleInternalBetaJobRetryRuntimeScaffold(input: InternalBetaJobQueueRuntimeInput = {}) {
  return createDisabledInternalBetaJobQueueRuntimeScaffoldResult('job_retry_schedule', input)
}

export function cancelInternalBetaJobRuntimeScaffold(input: InternalBetaJobQueueRuntimeInput = {}) {
  return createDisabledInternalBetaJobQueueRuntimeScaffoldResult('job_cancel', input)
}

function buildJobQueueGateRequirements(definition: InternalBetaJobQueueRuntimeScaffoldDefinition): string[] {
  const requirements = [
    'explicit_job_queue_runtime_enablement_milestone',
    'transactional_job_event_and_lease_contract',
    'least_privilege_service_role_runtime_test',
    'negative_no_worker_execution_from_raw_chat_test',
    'credit_reservation_gate_before_execution',
  ]

  if (definition.approvedPlanRequired) requirements.push('approved_plan_snapshot_required')
  if (definition.creditReservationRequired) requirements.push('credit_reservation_required')
  if (definition.jobIdRequired) requirements.push('job_id_required')
  if (definition.workerLeaseRequired) requirements.push('active_worker_lease_required')
  if (definition.idempotencyKeyRequired) requirements.push('idempotency_key_enforcement')

  return requirements
}

function summarizeJobQueueInput(input: InternalBetaJobQueueRuntimeInput): Record<string, unknown> {
  return sanitizeJson({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    requestId: input.requestId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    jobBatchId: input.jobBatchId,
    jobId: input.jobId,
    workerType: input.workerType,
    workerInstanceId: input.workerInstanceId,
    leaseId: input.leaseId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    reason: input.reason,
    payloadKeys: input.payload ? Object.keys(sanitizeJson(input.payload)).sort() : [],
  })
}
