import type { JobRuntimeQueueItem } from '../../src/types/job-runtime'
import type { MockDatabase } from '../../src/backend/mock/mock-database'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_READY_STATUS,
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput,
  queueGstreamerMkvtoolnixAgentControlledWorkerQueueMetadataMock,
  validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput,
  type GstreamerMkvtoolnixAgentControlledWorkerQueueInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION =
  'completed_gstreamer_mkvtoolnix_agent_controlled_worker_dispatch_dry_run_metadata_only' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_EXECUTION =
  'completed_confirmation_gated_agent_controlled_worker_dispatch_dry_run_metadata_only_no_worker_execution_or_tool_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_READY_STATUS =
  'ready_for_agent_controlled_worker_runtime_execution_packet' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-RUNTIME-EXECUTION-PACKET-1' as const

export type GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunStatus =
  | 'dispatched_controlled_worker_dispatch_dry_run_metadata_only'
  | 'blocked_missing_controlled_worker_dispatch_dry_run_confirmation'
  | 'blocked_controlled_worker_queue_validation_failed'
  | 'blocked_missing_controlled_worker_dispatch_dry_run_reference'
  | 'blocked_invalid_controlled_worker_dispatch_dry_run_state'
  | 'blocked_controlled_worker_dispatch_dry_run_idempotency_mismatch'
  | 'blocked_runtime_execution_not_enabled'
  | 'blocked_queue_item_not_ready_for_dispatch_dry_run'

export interface GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput {
  confirmation: boolean
  controlledWorkerQueueInput: GstreamerMkvtoolnixAgentControlledWorkerQueueInput
  dispatchDryRunId?: string | null
  dispatchDryRunIdempotencyKey?: string | null
  dispatchDryRunMode?: 'metadata_only_worker_dispatch_dry_run' | 'runtime_worker_dispatch' | null
  workerRuntimeMode?: 'dry_run_no_worker_claim' | 'claim_worker_lease' | null
  dispatchContractId?: string | null
  dispatchAuditEventId?: string | null
  workerRuntimePacketId?: string | null
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
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

export interface GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunStatus
  blockers: GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV
  confirmationRequired: true
  controlledWorkerQueueStatus: string
  queueItem?: JobRuntimeQueueItem
  sanitizedDispatchDryRun: {
    dispatchDryRunId: string
    dispatchDryRunMode: 'metadata_only_worker_dispatch_dry_run'
    dispatchDryRunIdempotencyKey: string
    dispatchContractId: string
    dispatchAuditEventId: string
    workerRuntimeMode: 'dry_run_no_worker_claim'
    workerRuntimePacketId: string
    queueId: string
    queueIdempotencyKey: string
    queueContractId: string
    queueStatusAtDryRun: 'pending_validation' | 'queued'
    queueItemId: string
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
    queueAuditEventId: string
    nonPublicArtifactPolicyId: string
    dryRunDispatchEnvelopeCreated: boolean
    dryRunDispatchAccepted: boolean
    nextWorkerRuntimeExecution: 'pending_next_milestone'
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerLeaseClaim: false
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
    workerLeaseClaim: false
    gstreamerExecutionInThisDispatchDryRun: false
    mkvtoolnixExecutionInThisDispatchDryRun: false
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function unsafeRequest(input: GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput): boolean {
  return [
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerLeaseClaimRequestedNow,
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

function expectedDispatchDryRunIdempotencyKey(
  input: GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
): string {
  const queue = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(input.controlledWorkerQueueInput)
  return [
    'gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run',
    queue.sanitizedQueue.workspaceId,
    queue.sanitizedQueue.projectId,
    queue.sanitizedQueue.approvedSnapshotId,
    queue.sanitizedQueue.jobId,
    queue.sanitizedQueue.dispatchId,
    queue.sanitizedQueue.queueId,
    input.dispatchDryRunId ?? '',
  ].join(':')
}

export function buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  overrides: Partial<GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput> = {},
): GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput {
  const dispatchDryRunId =
    overrides.dispatchDryRunId ?? 'dispatch-dry-run-gstreamer-mkvtoolnix-agent-controlled-worker-1'
  const controlledWorkerQueueInput =
    overrides.controlledWorkerQueueInput ?? buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput()

  const input = {
    confirmation: true,
    controlledWorkerQueueInput,
    dispatchDryRunId,
    dispatchDryRunMode: 'metadata_only_worker_dispatch_dry_run',
    workerRuntimeMode: 'dry_run_no_worker_claim',
    dispatchContractId: 'dispatch-contract-gstreamer-mkvtoolnix-agent-controlled-worker-dry-run-1',
    dispatchAuditEventId: 'audit-event-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1',
    workerRuntimePacketId: 'worker-runtime-packet-gstreamer-mkvtoolnix-agent-controlled-worker-1',
    ...overrides,
  } satisfies GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput

  return {
    ...input,
    dispatchDryRunIdempotencyKey:
      overrides.dispatchDryRunIdempotencyKey ?? expectedDispatchDryRunIdempotencyKey(input),
  }
}

function sanitizedDispatchDryRun(
  input: GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
  ok: boolean,
  queueItem?: JobRuntimeQueueItem,
): GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunResult['sanitizedDispatchDryRun'] {
  const queue = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(input.controlledWorkerQueueInput)
  const sanitized = queue.sanitizedQueue

  return {
    dispatchDryRunId: input.dispatchDryRunId ?? '',
    dispatchDryRunMode: 'metadata_only_worker_dispatch_dry_run',
    dispatchDryRunIdempotencyKey: input.dispatchDryRunIdempotencyKey ?? '',
    dispatchContractId: input.dispatchContractId ?? '',
    dispatchAuditEventId: input.dispatchAuditEventId ?? '',
    workerRuntimeMode: 'dry_run_no_worker_claim',
    workerRuntimePacketId: input.workerRuntimePacketId ?? '',
    queueId: sanitized.queueId,
    queueIdempotencyKey: sanitized.queueIdempotencyKey,
    queueContractId: sanitized.queueContractId,
    queueStatusAtDryRun: queueItem?.queueStatus === 'queued' ? 'queued' : sanitized.queueStatus,
    queueItemId: queueItem?.id ?? '',
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
    failurePolicyId: sanitized.failurePolicyId,
    retryPolicyId: sanitized.retryPolicyId,
    auditEventParentId: sanitized.auditEventParentId,
    queueAuditEventId: sanitized.auditEventId,
    nonPublicArtifactPolicyId: sanitized.nonPublicArtifactPolicyId,
    dryRunDispatchEnvelopeCreated: ok,
    dryRunDispatchAccepted: ok,
    nextWorkerRuntimeExecution: 'pending_next_milestone',
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerLeaseClaim: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    mediaProcessing: false,
    persistentJobQueueWrite: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

function safety(): GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunResult['safety'] {
  return {
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerLeaseClaim: false,
    gstreamerExecutionInThisDispatchDryRun: false,
    mkvtoolnixExecutionInThisDispatchDryRun: false,
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

export function validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
  input: GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
): GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunResult {
  const blockers: GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunStatus[] = []
  const queue = validateGstreamerMkvtoolnixAgentControlledWorkerQueueInput(input.controlledWorkerQueueInput)

  if (!input.confirmation) pushOnce(blockers, 'blocked_missing_controlled_worker_dispatch_dry_run_confirmation')
  if (!queue.ok || queue.nextMilestone !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE) {
    pushOnce(blockers, 'blocked_controlled_worker_queue_validation_failed')
  }
  if (
    blank(input.dispatchDryRunId) ||
    blank(input.dispatchDryRunIdempotencyKey) ||
    blank(input.dispatchContractId) ||
    blank(input.dispatchAuditEventId) ||
    blank(input.workerRuntimePacketId)
  ) {
    pushOnce(blockers, 'blocked_missing_controlled_worker_dispatch_dry_run_reference')
  }
  if (input.dispatchDryRunMode !== 'metadata_only_worker_dispatch_dry_run' || input.workerRuntimeMode !== 'dry_run_no_worker_claim') {
    pushOnce(blockers, 'blocked_invalid_controlled_worker_dispatch_dry_run_state')
  }
  if (!blank(input.dispatchDryRunIdempotencyKey) && input.dispatchDryRunIdempotencyKey !== expectedDispatchDryRunIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_controlled_worker_dispatch_dry_run_idempotency_mismatch')
  }
  if (unsafeRequest(input)) {
    pushOnce(blockers, 'blocked_runtime_execution_not_enabled')
  }

  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_EXECUTION,
    ok,
    status: ok ? 'dispatched_controlled_worker_dispatch_dry_run_metadata_only' : blockers[0] ?? 'blocked_invalid_controlled_worker_dispatch_dry_run_state',
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV,
    confirmationRequired: true,
    controlledWorkerQueueStatus: queue.ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_READY_STATUS : queue.status,
    sanitizedDispatchDryRun: sanitizedDispatchDryRun(input, ok),
    safety: safety(),
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE,
  }
}

export function createGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunMetadata(
  db: MockDatabase,
  input: GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
): GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunResult {
  const validation = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(input)
  if (!validation.ok) return validation

  const queue = queueGstreamerMkvtoolnixAgentControlledWorkerQueueMetadataMock(db, input.controlledWorkerQueueInput)
  if (!queue.ok || !queue.queueItem || queue.queueItem.queueStatus !== 'queued' || !queue.queueItem.mockOnly) {
    return {
      ...validation,
      ok: false,
      status: 'blocked_queue_item_not_ready_for_dispatch_dry_run',
      blockers: ['blocked_queue_item_not_ready_for_dispatch_dry_run'],
      queueItem: queue.queueItem,
      sanitizedDispatchDryRun: sanitizedDispatchDryRun(input, false, queue.queueItem),
    }
  }

  return {
    ...validation,
    queueItem: queue.queueItem,
    sanitizedDispatchDryRun: sanitizedDispatchDryRun(input, true, queue.queueItem),
  }
}

export function summarizeGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunBoundary(): string[] {
  return [
    'Controlled worker dispatch dry run consumes only queued local mock metadata from the queue integration packet.',
    'The dry run creates a sanitized dispatch envelope and does not claim a worker lease or mutate a persistent queue.',
    'Worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, media processing, signed/public artifacts, and final render/export remain disabled.',
    'The next milestone must be a separately guarded worker runtime execution packet before any real worker or tool execution is considered.',
  ]
}
