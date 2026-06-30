import type { JobRuntimeQueueItem } from '../../src/types/job-runtime'
import type { MockDatabase } from '../../src/backend/mock/mock-database'
import { queueMockJob } from '../../src/backend/services/job-queue-runtime-service'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_READY_STATUS,
  buildGstreamerMkvtoolnixAgentControlledDispatchInput,
  validateGstreamerMkvtoolnixAgentControlledDispatchInput,
  type GstreamerMkvtoolnixAgentControlledDispatchInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-QUEUE-INTEGRATION-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_DECISION =
  'completed_gstreamer_mkvtoolnix_agent_controlled_worker_queue_integration_metadata_only' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_EXECUTION =
  'completed_confirmation_gated_agent_controlled_worker_queue_metadata_only_no_worker_dispatch_or_tool_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_READY_STATUS =
  'ready_for_agent_controlled_worker_dispatch_dry_run' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_INTEGRATION' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1' as const

export type GstreamerMkvtoolnixAgentControlledWorkerQueueStatus =
  | 'queued_controlled_worker_queue_metadata_only'
  | 'blocked_missing_controlled_worker_queue_confirmation'
  | 'blocked_controlled_dispatch_validation_failed'
  | 'blocked_missing_controlled_worker_queue_reference'
  | 'blocked_invalid_controlled_worker_queue_state'
  | 'blocked_controlled_worker_queue_idempotency_mismatch'
  | 'blocked_runtime_execution_not_enabled'
  | 'blocked_job_queue_gate_failed'

export interface GstreamerMkvtoolnixAgentControlledWorkerQueueInput {
  confirmation: boolean
  controlledDispatchInput: GstreamerMkvtoolnixAgentControlledDispatchInput
  queueId?: string | null
  queueIdempotencyKey?: string | null
  queueMode?: 'mock_queue_metadata_only' | 'runtime_worker_queue' | null
  queueContractId?: string | null
  retryPolicyId?: string | null
  failurePolicyId?: string | null
  auditEventId?: string | null
  nonPublicArtifactPolicyId?: string | null
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  mediaProcessingRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaExpansionRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixAgentControlledWorkerQueueResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixAgentControlledWorkerQueueStatus
  blockers: GstreamerMkvtoolnixAgentControlledWorkerQueueStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV
  confirmationRequired: true
  controlledDispatchStatus: string
  queueItem?: JobRuntimeQueueItem
  sanitizedQueue: {
    queueId: string
    queueMode: 'mock_queue_metadata_only'
    queueIdempotencyKey: string
    queueContractId: string
    dispatchId: string
    dispatchIdempotencyKey: string
    externalAgentRequestId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
    approvalRecordId: string
    creditPolicyRef: string
    creditPolicyMode: 'no_spend_fixture_policy' | 'credit_reservation'
    jobId: string
    workerLeaseId: string
    routeIdempotencyKey: string
    commandTemplateId: string
    privateInputManifestId: string
    privateInputManifestSha256: string
    outputManifestSchemaId: string
    qaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    retryPolicyId: string
    auditEventParentId: string
    auditEventId: string
    nonPublicArtifactPolicyId: string
    localMockQueueItemCreated: boolean
    queueStatus: 'pending_validation' | 'queued'
    nextWorkerDispatch: 'pending_next_milestone'
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    persistentJobQueueWrite: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gstreamerExecutionInThisQueueIntegration: false
    mkvtoolnixExecutionInThisQueueIntegration: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    persistentJobQueueWrite: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    dockerPushDeploy: false
    remotionExecution: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaExpansion: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function unsafeRequest(input: GstreamerMkvtoolnixAgentControlledWorkerQueueInput): boolean {
  return [
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.mediaProcessingRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.externalBetaExpansionRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
  ].some(Boolean)
}

function expectedQueueIdempotencyKey(input: GstreamerMkvtoolnixAgentControlledWorkerQueueInput): string {
  const dispatch = validateGstreamerMkvtoolnixAgentControlledDispatchInput(input.controlledDispatchInput)
  return [
    'gstreamer-mkvtoolnix-agent-controlled-worker-queue',
    dispatch.sanitizedDispatch.workspaceId,
    dispatch.sanitizedDispatch.projectId,
    dispatch.sanitizedDispatch.approvedSnapshotId,
    dispatch.sanitizedDispatch.jobId,
    dispatch.sanitizedDispatch.dispatchId,
    input.queueId ?? '',
  ].join(':')
}

export function buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput(
  overrides: Partial<GstreamerMkvtoolnixAgentControlledWorkerQueueInput> = {},
): GstreamerMkvtoolnixAgentControlledWorkerQueueInput {
  const queueId = overrides.queueId ?? 'queue-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1'
  const controlledDispatchInput =
    overrides.controlledDispatchInput ?? buildGstreamerMkvtoolnixAgentControlledDispatchInput()

  const input = {
    confirmation: true,
    controlledDispatchInput,
    queueId,
    queueMode: 'mock_queue_metadata_only',
    queueContractId: 'queue-contract-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
    retryPolicyId: 'retry-policy-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
    failurePolicyId: 'failure-policy-agent-controlled-dispatch-1',
    auditEventId: 'audit-event-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
    nonPublicArtifactPolicyId: 'non-public-artifact-policy-gstreamer-mkvtoolnix-agent-controlled-worker-queue-1',
    ...overrides,
  } satisfies GstreamerMkvtoolnixAgentControlledWorkerQueueInput

  return {
    ...input,
    queueIdempotencyKey:
      overrides.queueIdempotencyKey ?? expectedQueueIdempotencyKey(input),
  }
}

function sanitizedQueue(
  input: GstreamerMkvtoolnixAgentControlledWorkerQueueInput,
  ok: boolean,
): GstreamerMkvtoolnixAgentControlledWorkerQueueResult['sanitizedQueue'] {
  const dispatch = validateGstreamerMkvtoolnixAgentControlledDispatchInput(input.controlledDispatchInput)
  const sanitized = dispatch.sanitizedDispatch

  return {
    queueId: input.queueId ?? '',
    queueMode: 'mock_queue_metadata_only',
    queueIdempotencyKey: input.queueIdempotencyKey ?? '',
    queueContractId: input.queueContractId ?? '',
    dispatchId: sanitized.dispatchId,
    dispatchIdempotencyKey: sanitized.dispatchIdempotencyKey,
    externalAgentRequestId: sanitized.externalAgentRequestId,
    workspaceId: sanitized.workspaceId,
    projectId: sanitized.projectId,
    editSessionId: sanitized.editSessionId,
    approvedSnapshotId: sanitized.approvedSnapshotId,
    approvalRecordId: sanitized.approvalRecordId,
    creditPolicyRef: sanitized.creditPolicyRef,
    creditPolicyMode: sanitized.creditPolicyMode,
    jobId: sanitized.jobId,
    workerLeaseId: sanitized.workerLeaseId,
    routeIdempotencyKey: sanitized.routeIdempotencyKey,
    commandTemplateId: sanitized.commandTemplateId,
    privateInputManifestId: sanitized.privateInputManifestId,
    privateInputManifestSha256: sanitized.privateInputManifestSha256,
    outputManifestSchemaId: sanitized.outputManifestSchemaId,
    qaReportSchemaId: sanitized.qaReportSchemaId,
    cleanupPolicyId: sanitized.cleanupPolicyId,
    retentionPolicyId: sanitized.retentionPolicyId,
    failurePolicyId: input.failurePolicyId ?? sanitized.failurePolicyId,
    retryPolicyId: input.retryPolicyId ?? '',
    auditEventParentId: sanitized.auditEventParentId,
    auditEventId: input.auditEventId ?? '',
    nonPublicArtifactPolicyId: input.nonPublicArtifactPolicyId ?? '',
    localMockQueueItemCreated: false,
    queueStatus: ok ? 'pending_validation' : 'pending_validation',
    nextWorkerDispatch: 'pending_next_milestone',
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    mediaProcessing: false,
    persistentJobQueueWrite: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

function safety(): GstreamerMkvtoolnixAgentControlledWorkerQueueResult['safety'] {
  return {
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    gstreamerExecutionInThisQueueIntegration: false,
    mkvtoolnixExecutionInThisQueueIntegration: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    persistentJobQueueWrite: false,
    ffmpegFfprobeExecution: false,
    dockerExecution: false,
    dockerPushDeploy: false,
    remotionExecution: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
    externalBetaExpansion: false,
    paidProductionUnlock: false,
    productionUnlock: false,
  }
}

export function validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(
  input: GstreamerMkvtoolnixAgentControlledWorkerQueueInput,
): GstreamerMkvtoolnixAgentControlledWorkerQueueResult {
  const blockers: GstreamerMkvtoolnixAgentControlledWorkerQueueStatus[] = []
  const dispatch = validateGstreamerMkvtoolnixAgentControlledDispatchInput(input.controlledDispatchInput)

  if (!input.confirmation) pushOnce(blockers, 'blocked_missing_controlled_worker_queue_confirmation')
  if (!dispatch.ok || dispatch.sanitizedDispatch.queueIntegration !== 'pending_next_milestone') {
    pushOnce(blockers, 'blocked_controlled_dispatch_validation_failed')
  }
  if (dispatch.nextMilestone !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-QUEUE-INTEGRATION-1') {
    pushOnce(blockers, 'blocked_controlled_dispatch_validation_failed')
  }
  if (
    blank(input.queueId) ||
    blank(input.queueIdempotencyKey) ||
    blank(input.queueContractId) ||
    blank(input.retryPolicyId) ||
    blank(input.failurePolicyId) ||
    blank(input.auditEventId) ||
    blank(input.nonPublicArtifactPolicyId)
  ) {
    pushOnce(blockers, 'blocked_missing_controlled_worker_queue_reference')
  }
  if (input.queueMode !== 'mock_queue_metadata_only') {
    pushOnce(blockers, 'blocked_invalid_controlled_worker_queue_state')
  }
  if (!blank(input.queueIdempotencyKey) && input.queueIdempotencyKey !== expectedQueueIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_controlled_worker_queue_idempotency_mismatch')
  }
  if (unsafeRequest(input)) {
    pushOnce(blockers, 'blocked_runtime_execution_not_enabled')
  }

  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_EXECUTION,
    ok,
    status: ok ? 'queued_controlled_worker_queue_metadata_only' : blockers[0] ?? 'blocked_invalid_controlled_worker_queue_state',
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV,
    confirmationRequired: true,
    controlledDispatchStatus: dispatch.ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_READY_STATUS : dispatch.status,
    sanitizedQueue: sanitizedQueue(input, ok),
    safety: safety(),
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
  }
}

export function queueGstreamerMkvtoolnixAgentControlledWorkerQueueMetadataMock(
  db: MockDatabase,
  input: GstreamerMkvtoolnixAgentControlledWorkerQueueInput,
): GstreamerMkvtoolnixAgentControlledWorkerQueueResult {
  const validation = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(input)
  if (!validation.ok) return validation

  const queueItem = queueMockJob(db, {
    workspaceId: validation.sanitizedQueue.workspaceId,
    projectId: validation.sanitizedQueue.projectId,
    editPlanId: validation.sanitizedQueue.approvedSnapshotId,
    jobId: validation.sanitizedQueue.jobId,
    workerKind: 'render_export',
    mockSafe: true,
    requiresEditPlanApproval: false,
    requiresCreditEstimateApproval: false,
    requiresCreditReservation: false,
    requiresGenerationRequest: false,
    requiresProvider: false,
    requiresRequiredAssets: false,
    requiresTimingReadiness: false,
    requiresBackendRuntime: false,
    payload: {
      packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_PACKET,
      queueMode: validation.sanitizedQueue.queueMode,
      queueId: validation.sanitizedQueue.queueId,
      queueContractId: validation.sanitizedQueue.queueContractId,
      queueIdempotencyKey: validation.sanitizedQueue.queueIdempotencyKey,
      dispatchId: validation.sanitizedQueue.dispatchId,
      dispatchIdempotencyKey: validation.sanitizedQueue.dispatchIdempotencyKey,
      externalAgentRequestId: validation.sanitizedQueue.externalAgentRequestId,
      approvedSnapshotId: validation.sanitizedQueue.approvedSnapshotId,
      approvalRecordId: validation.sanitizedQueue.approvalRecordId,
      creditPolicyRef: validation.sanitizedQueue.creditPolicyRef,
      creditPolicyMode: validation.sanitizedQueue.creditPolicyMode,
      commandTemplateId: validation.sanitizedQueue.commandTemplateId,
      privateInputManifestId: validation.sanitizedQueue.privateInputManifestId,
      privateInputManifestSha256: validation.sanitizedQueue.privateInputManifestSha256,
      outputManifestSchemaId: validation.sanitizedQueue.outputManifestSchemaId,
      qaReportSchemaId: validation.sanitizedQueue.qaReportSchemaId,
      cleanupPolicyId: validation.sanitizedQueue.cleanupPolicyId,
      retentionPolicyId: validation.sanitizedQueue.retentionPolicyId,
      failurePolicyId: validation.sanitizedQueue.failurePolicyId,
      retryPolicyId: validation.sanitizedQueue.retryPolicyId,
      auditEventParentId: validation.sanitizedQueue.auditEventParentId,
      auditEventId: validation.sanitizedQueue.auditEventId,
      nonPublicArtifactPolicyId: validation.sanitizedQueue.nonPublicArtifactPolicyId,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      persistentJobQueueWrite: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
  })

  if (queueItem.queueStatus !== 'queued' || !queueItem.mockOnly || queueItem.payload.mockOnly !== true) {
    return {
      ...validation,
      ok: false,
      status: 'blocked_job_queue_gate_failed',
      blockers: ['blocked_job_queue_gate_failed'],
      queueItem,
    }
  }

  return {
    ...validation,
    queueItem,
    sanitizedQueue: {
      ...validation.sanitizedQueue,
      localMockQueueItemCreated: true,
      queueStatus: 'queued',
    },
  }
}

export function summarizeGstreamerMkvtoolnixAgentControlledWorkerQueueBoundary(): string[] {
  return [
    'Controlled worker queue integration consumes only accepted controlled-dispatch metadata.',
    'The queue integration creates local mock queue metadata only and does not persist to Supabase or a remote queue.',
    'Worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, media processing, signed/public artifacts, and final render/export remain disabled.',
    'The next milestone must prove a controlled worker-dispatch dry run before any real worker or tool execution is considered.',
  ]
}
