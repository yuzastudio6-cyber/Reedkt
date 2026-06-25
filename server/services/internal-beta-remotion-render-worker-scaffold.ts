import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaRemotionRenderWorkerOperation =
  | 'render_worker_plan_read'
  | 'render_worker_preflight'
  | 'render_worker_job_prepare'
  | 'render_worker_manifest_expectation'
  | 'render_worker_qa_gate_prepare'
  | 'render_worker_cleanup_policy_prepare'
  | 'render_worker_status_readback'
  | 'render_worker_failure_classify'

export type InternalBetaRemotionRenderWorkerStatus = 'disabled_pending_remotion_render_worker_runtime_gate'

export interface InternalBetaRemotionRenderWorkerScaffoldDefinition {
  operation: InternalBetaRemotionRenderWorkerOperation
  scaffoldFunctionName: string
  approvedPlanRequired: boolean
  creditReservationRequired: boolean
  jobIdRequired: boolean
  artifactManifestRequired: boolean
  qaReportRequired: boolean
  cleanupPolicyRequired: boolean
  idempotencyKeyRequired: boolean
  routeExecutionEnabled: false
  workerExecutionEnabled: false
  remotionExecutionEnabled: false
  mediaProcessingEnabled: false
  renderExportEnabled: false
  storageWriteEnabled: false
  signedUrlCreationEnabled: false
  publicArtifactCreationEnabled: false
  supabaseMutationEnabled: false
}

export interface InternalBetaRemotionRenderWorkerInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  requestId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  jobId?: string
  artifactManifestId?: string
  qaReportId?: string
  cleanupPolicyId?: string
  rendererPlanId?: string
  idempotencyKey?: string
  reason?: string
  payload?: Record<string, unknown>
}

export interface InternalBetaRemotionRenderWorkerScaffoldResult {
  ok: false
  status: InternalBetaRemotionRenderWorkerStatus
  operation: InternalBetaRemotionRenderWorkerOperation
  scaffoldFunctionName: string
  createdAt: string
  httpStatusCode: 202
  approvedPlanRequired: boolean
  creditReservationRequired: boolean
  jobIdRequired: boolean
  artifactManifestRequired: boolean
  qaReportRequired: boolean
  cleanupPolicyRequired: boolean
  idempotencyKeyRequired: boolean
  routeExecution: false
  workerExecution: false
  workerDispatch: false
  remotionExecution: false
  ffmpegExecution: false
  ffprobeExecution: false
  mediaProcessing: false
  renderExportExecution: false
  previewArtifactCreation: false
  finalExportCreation: false
  storageWrite: false
  storageRead: false
  signedUrlCreation: false
  publicArtifactCreation: false
  supabaseMutation: false
  creditMutation: false
  providerModelCalls: false
  internalBetaUnlock: false
  requiredBeforeEnablement: string[]
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export const INTERNAL_BETA_REMOTION_RENDER_WORKER_SCAFFOLDS: InternalBetaRemotionRenderWorkerScaffoldDefinition[] = [
  {
    operation: 'render_worker_plan_read',
    scaffoldFunctionName: 'readInternalBetaRenderWorkerPlanScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: false,
    artifactManifestRequired: false,
    qaReportRequired: false,
    cleanupPolicyRequired: false,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    remotionExecutionEnabled: false,
    mediaProcessingEnabled: false,
    renderExportEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'render_worker_preflight',
    scaffoldFunctionName: 'preflightInternalBetaRenderWorkerScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: true,
    qaReportRequired: false,
    cleanupPolicyRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    remotionExecutionEnabled: false,
    mediaProcessingEnabled: false,
    renderExportEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'render_worker_job_prepare',
    scaffoldFunctionName: 'prepareInternalBetaRenderWorkerJobScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: true,
    qaReportRequired: false,
    cleanupPolicyRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    remotionExecutionEnabled: false,
    mediaProcessingEnabled: false,
    renderExportEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'render_worker_manifest_expectation',
    scaffoldFunctionName: 'expectInternalBetaRenderWorkerArtifactManifestScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: true,
    qaReportRequired: false,
    cleanupPolicyRequired: false,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    remotionExecutionEnabled: false,
    mediaProcessingEnabled: false,
    renderExportEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'render_worker_qa_gate_prepare',
    scaffoldFunctionName: 'prepareInternalBetaRenderWorkerQaGateScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: true,
    qaReportRequired: true,
    cleanupPolicyRequired: false,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    remotionExecutionEnabled: false,
    mediaProcessingEnabled: false,
    renderExportEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'render_worker_cleanup_policy_prepare',
    scaffoldFunctionName: 'prepareInternalBetaRenderWorkerCleanupPolicyScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: false,
    jobIdRequired: true,
    artifactManifestRequired: true,
    qaReportRequired: false,
    cleanupPolicyRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    remotionExecutionEnabled: false,
    mediaProcessingEnabled: false,
    renderExportEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'render_worker_status_readback',
    scaffoldFunctionName: 'readInternalBetaRenderWorkerStatusScaffold',
    approvedPlanRequired: false,
    creditReservationRequired: false,
    jobIdRequired: true,
    artifactManifestRequired: false,
    qaReportRequired: false,
    cleanupPolicyRequired: false,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    remotionExecutionEnabled: false,
    mediaProcessingEnabled: false,
    renderExportEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'render_worker_failure_classify',
    scaffoldFunctionName: 'classifyInternalBetaRenderWorkerFailureScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    artifactManifestRequired: false,
    qaReportRequired: false,
    cleanupPolicyRequired: false,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    remotionExecutionEnabled: false,
    mediaProcessingEnabled: false,
    renderExportEnabled: false,
    storageWriteEnabled: false,
    signedUrlCreationEnabled: false,
    publicArtifactCreationEnabled: false,
    supabaseMutationEnabled: false,
  },
]

export function getInternalBetaRemotionRenderWorkerScaffold(
  operation: InternalBetaRemotionRenderWorkerOperation,
): InternalBetaRemotionRenderWorkerScaffoldDefinition {
  const definition = INTERNAL_BETA_REMOTION_RENDER_WORKER_SCAFFOLDS.find((item) => item.operation === operation)
  if (!definition) {
    throw new Error(`Unknown internal beta Remotion render worker operation: ${operation}`)
  }

  return definition
}

export function createDisabledInternalBetaRemotionRenderWorkerScaffoldResult(
  operation: InternalBetaRemotionRenderWorkerOperation,
  input: InternalBetaRemotionRenderWorkerInput = {},
): InternalBetaRemotionRenderWorkerScaffoldResult {
  const definition = getInternalBetaRemotionRenderWorkerScaffold(operation)

  return {
    ok: false,
    status: 'disabled_pending_remotion_render_worker_runtime_gate',
    operation,
    scaffoldFunctionName: definition.scaffoldFunctionName,
    createdAt: nowIso(),
    httpStatusCode: 202,
    approvedPlanRequired: definition.approvedPlanRequired,
    creditReservationRequired: definition.creditReservationRequired,
    jobIdRequired: definition.jobIdRequired,
    artifactManifestRequired: definition.artifactManifestRequired,
    qaReportRequired: definition.qaReportRequired,
    cleanupPolicyRequired: definition.cleanupPolicyRequired,
    idempotencyKeyRequired: definition.idempotencyKeyRequired,
    routeExecution: false,
    workerExecution: false,
    workerDispatch: false,
    remotionExecution: false,
    ffmpegExecution: false,
    ffprobeExecution: false,
    mediaProcessing: false,
    renderExportExecution: false,
    previewArtifactCreation: false,
    finalExportCreation: false,
    storageWrite: false,
    storageRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    supabaseMutation: false,
    creditMutation: false,
    providerModelCalls: false,
    internalBetaUnlock: false,
    requiredBeforeEnablement: buildRemotionRenderWorkerGateRequirements(definition),
    inputSummary: summarizeRemotionRenderWorkerInput(input),
    warnings: [
      'Internal beta Remotion render worker scaffold is fail-closed.',
      'No worker dispatch, worker execution, Remotion execution, FFmpeg/FFprobe execution, media processing, preview/export creation, storage access, signed URL creation, Supabase write, provider/model call, beta unlock, or production unlock occurred.',
    ],
  }
}

export function readInternalBetaRenderWorkerPlanScaffold(input: InternalBetaRemotionRenderWorkerInput = {}) {
  return createDisabledInternalBetaRemotionRenderWorkerScaffoldResult('render_worker_plan_read', input)
}

export function preflightInternalBetaRenderWorkerScaffold(input: InternalBetaRemotionRenderWorkerInput = {}) {
  return createDisabledInternalBetaRemotionRenderWorkerScaffoldResult('render_worker_preflight', input)
}

export function prepareInternalBetaRenderWorkerJobScaffold(input: InternalBetaRemotionRenderWorkerInput = {}) {
  return createDisabledInternalBetaRemotionRenderWorkerScaffoldResult('render_worker_job_prepare', input)
}

export function expectInternalBetaRenderWorkerArtifactManifestScaffold(
  input: InternalBetaRemotionRenderWorkerInput = {},
) {
  return createDisabledInternalBetaRemotionRenderWorkerScaffoldResult('render_worker_manifest_expectation', input)
}

export function prepareInternalBetaRenderWorkerQaGateScaffold(input: InternalBetaRemotionRenderWorkerInput = {}) {
  return createDisabledInternalBetaRemotionRenderWorkerScaffoldResult('render_worker_qa_gate_prepare', input)
}

export function prepareInternalBetaRenderWorkerCleanupPolicyScaffold(
  input: InternalBetaRemotionRenderWorkerInput = {},
) {
  return createDisabledInternalBetaRemotionRenderWorkerScaffoldResult('render_worker_cleanup_policy_prepare', input)
}

export function readInternalBetaRenderWorkerStatusScaffold(input: InternalBetaRemotionRenderWorkerInput = {}) {
  return createDisabledInternalBetaRemotionRenderWorkerScaffoldResult('render_worker_status_readback', input)
}

export function classifyInternalBetaRenderWorkerFailureScaffold(input: InternalBetaRemotionRenderWorkerInput = {}) {
  return createDisabledInternalBetaRemotionRenderWorkerScaffoldResult('render_worker_failure_classify', input)
}

function buildRemotionRenderWorkerGateRequirements(
  definition: InternalBetaRemotionRenderWorkerScaffoldDefinition,
): string[] {
  const requirements = [
    'explicit_remotion_render_worker_runtime_enablement_milestone',
    'approved_snapshot_render_plan_contract_test',
    'credit_reservation_gate_before_render_test',
    'private_artifact_manifest_runtime_test',
    'negative_no_render_from_raw_chat_test',
    'negative_no_public_artifact_or_signed_url_without_policy_test',
  ]

  if (definition.approvedPlanRequired) requirements.push('approved_plan_snapshot_required')
  if (definition.creditReservationRequired) requirements.push('credit_reservation_required')
  if (definition.jobIdRequired) requirements.push('job_id_required')
  if (definition.artifactManifestRequired) requirements.push('artifact_manifest_required')
  if (definition.qaReportRequired) requirements.push('qa_report_required')
  if (definition.cleanupPolicyRequired) requirements.push('cleanup_policy_required')
  if (definition.idempotencyKeyRequired) requirements.push('idempotency_key_enforcement')

  return requirements
}

function summarizeRemotionRenderWorkerInput(input: InternalBetaRemotionRenderWorkerInput): Record<string, unknown> {
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
    cleanupPolicyId: input.cleanupPolicyId,
    rendererPlanId: input.rendererPlanId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    reason: input.reason,
    payloadKeys: input.payload ? Object.keys(sanitizeJson(input.payload)).sort() : [],
  })
}
