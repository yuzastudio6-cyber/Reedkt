import type { JobRuntimeQueueItem } from '../../src/types/job-runtime'
import type { MockDatabase } from '../../src/backend/mock/mock-database'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowControlledWorkerQueueInput,
  queueGstreamerMkvtoolnixNarrowControlledWorkerQueueMetadataMock,
  validateGstreamerMkvtoolnixNarrowControlledWorkerQueueInput,
  type GstreamerMkvtoolnixNarrowControlledWorkerQueueInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-queue-integration-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_dispatch_dry_run_metadata_only' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_EXECUTION =
  'completed_confirmation_gated_narrow_controlled_worker_dispatch_dry_run_metadata_only_no_worker_execution_or_tool_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_READY_STATUS =
  'ready_for_guarded_narrow_route_worker_runtime_execution_packet' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_CONTROLLED_WORKER_DISPATCH_DRY_RUN' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-EXECUTION-PACKET-1' as const

export type GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunStatus =
  | 'dispatched_narrow_controlled_worker_dispatch_dry_run_metadata_only'
  | 'blocked_missing_narrow_controlled_worker_dispatch_dry_run_confirmation'
  | 'blocked_narrow_controlled_worker_queue_validation_failed'
  | 'blocked_missing_narrow_controlled_worker_dispatch_dry_run_reference'
  | 'blocked_invalid_narrow_controlled_worker_dispatch_dry_run_state'
  | 'blocked_narrow_controlled_worker_dispatch_dry_run_idempotency_mismatch'
  | 'blocked_route_worker_or_tool_execution_not_enabled'
  | 'blocked_narrow_queue_item_not_ready_for_dispatch_dry_run'

export interface GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput {
  confirmation: boolean
  controlledWorkerQueueInput: GstreamerMkvtoolnixNarrowControlledWorkerQueueInput
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
  workerProcessStartRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  ffmpegFfprobeExecutionRequestedNow?: boolean
  dockerExecutionRequestedNow?: boolean
  remotionExecutionRequestedNow?: boolean
  mediaProcessingRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaUnlockRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunStatus
  blockers: GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV
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
    routeSourceId: string
    routeSourcePath: string
    sourceIdempotencyKey: string
    acceptedSourceStatus: 'accepted_registered_noop_source_contract'
    jobId: string
    workerLeaseId: string
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
    nonPublicArtifactPolicyId: string
    dryRunDispatchEnvelopeCreated: boolean
    dryRunDispatchAccepted: boolean
    nextWorkerRuntimeExecution: 'pending_next_milestone'
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    remotionExecution: false
    mediaProcessing: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gstreamerExecutionInThisDispatchDryRun: false
    mkvtoolnixExecutionInThisDispatchDryRun: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    remotionExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaUnlock: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function unsafeRequest(input: GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput): boolean {
  return [
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerProcessStartRequestedNow,
    input.workerLeaseClaimRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.ffmpegFfprobeExecutionRequestedNow,
    input.dockerExecutionRequestedNow,
    input.remotionExecutionRequestedNow,
    input.mediaProcessingRequestedNow,
    input.privateMediaProcessingRequestedNow,
    input.userMediaProcessingRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.externalBetaUnlockRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
  ].some(Boolean)
}

function expectedDispatchDryRunIdempotencyKey(
  input: GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput,
): string {
  const queue = validateGstreamerMkvtoolnixNarrowControlledWorkerQueueInput(input.controlledWorkerQueueInput)
  return [
    'gstreamer-mkvtoolnix',
    'narrow-route-worker-controlled-worker-dispatch-dry-run-1',
    queue.sanitizedQueue.routeSourceId,
    queue.sanitizedQueue.sourceIdempotencyKey,
    queue.sanitizedQueue.queueId,
    queue.sanitizedQueue.dispatchId,
    input.dispatchDryRunId ?? '',
  ].join(':')
}

export function buildGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  overrides: Partial<GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput> = {},
): GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput {
  const dispatchDryRunId =
    overrides.dispatchDryRunId ?? 'dispatch-dry-run-gstreamer-mkvtoolnix-narrow-controlled-worker-1'
  const controlledWorkerQueueInput =
    overrides.controlledWorkerQueueInput ?? buildGstreamerMkvtoolnixNarrowControlledWorkerQueueInput()
  const input = {
    confirmation: true,
    controlledWorkerQueueInput,
    dispatchDryRunId,
    dispatchDryRunMode: 'metadata_only_worker_dispatch_dry_run',
    workerRuntimeMode: 'dry_run_no_worker_claim',
    dispatchContractId: 'dispatch-contract-gstreamer-mkvtoolnix-narrow-controlled-worker-dry-run-1',
    dispatchAuditEventId: 'audit-event-gstreamer-mkvtoolnix-narrow-controlled-worker-dispatch-dry-run-1',
    workerRuntimePacketId: 'worker-runtime-packet-gstreamer-mkvtoolnix-narrow-controlled-worker-runtime-execution-1',
    ...overrides,
  } satisfies GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput

  return {
    ...input,
    dispatchDryRunIdempotencyKey:
      overrides.dispatchDryRunIdempotencyKey ?? expectedDispatchDryRunIdempotencyKey(input),
  }
}

function sanitizedDispatchDryRun(
  input: GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput,
  ok: boolean,
  queueItem?: JobRuntimeQueueItem,
): GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunResult['sanitizedDispatchDryRun'] {
  const queue = validateGstreamerMkvtoolnixNarrowControlledWorkerQueueInput(input.controlledWorkerQueueInput)
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
    routeSourceId: sanitized.routeSourceId,
    routeSourcePath: sanitized.routeSourcePath,
    sourceIdempotencyKey: sanitized.sourceIdempotencyKey,
    acceptedSourceStatus: sanitized.acceptedSourceStatus,
    jobId: sanitized.jobId,
    workerLeaseId: sanitized.workerLeaseId,
    commandTemplateId: sanitized.commandTemplateId,
    privateInputManifestId: sanitized.privateInputManifestId,
    privateInputManifestSha256: sanitized.privateInputManifestSha256,
    outputManifestSchemaId: sanitized.outputManifestSchemaId,
    qaReportSchemaId: sanitized.qaReportSchemaId,
    cleanupPolicyId: sanitized.cleanupPolicyId,
    retentionPolicyId: sanitized.retentionPolicyId,
    failurePolicyId: sanitized.failurePolicyId,
    retryPolicyId: sanitized.retryPolicyId,
    auditEventParentId: sanitized.auditEventId,
    nonPublicArtifactPolicyId: sanitized.nonPublicArtifactPolicyId,
    dryRunDispatchEnvelopeCreated: ok,
    dryRunDispatchAccepted: ok,
    nextWorkerRuntimeExecution: 'pending_next_milestone',
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentJobQueueWrite: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    ffmpegFfprobeExecution: false,
    dockerExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

function safety(): GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunResult['safety'] {
  return {
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentJobQueueWrite: false,
    gstreamerExecutionInThisDispatchDryRun: false,
    mkvtoolnixExecutionInThisDispatchDryRun: false,
    ffmpegFfprobeExecution: false,
    dockerExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
    externalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
  }
}

export function validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(
  input: GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput,
): GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunResult {
  const blockers: GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunStatus[] = []
  const queue = validateGstreamerMkvtoolnixNarrowControlledWorkerQueueInput(input.controlledWorkerQueueInput)

  if (!input.confirmation) pushOnce(blockers, 'blocked_missing_narrow_controlled_worker_dispatch_dry_run_confirmation')
  if (!queue.ok || queue.nextMilestone !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE) {
    pushOnce(blockers, 'blocked_narrow_controlled_worker_queue_validation_failed')
  }
  if (
    blank(input.dispatchDryRunId) ||
    blank(input.dispatchDryRunIdempotencyKey) ||
    blank(input.dispatchContractId) ||
    blank(input.dispatchAuditEventId) ||
    blank(input.workerRuntimePacketId)
  ) {
    pushOnce(blockers, 'blocked_missing_narrow_controlled_worker_dispatch_dry_run_reference')
  }
  if (
    input.dispatchDryRunMode !== 'metadata_only_worker_dispatch_dry_run' ||
    input.workerRuntimeMode !== 'dry_run_no_worker_claim'
  ) {
    pushOnce(blockers, 'blocked_invalid_narrow_controlled_worker_dispatch_dry_run_state')
  }
  if (
    !blank(input.dispatchDryRunIdempotencyKey) &&
    input.dispatchDryRunIdempotencyKey !== expectedDispatchDryRunIdempotencyKey(input)
  ) {
    pushOnce(blockers, 'blocked_narrow_controlled_worker_dispatch_dry_run_idempotency_mismatch')
  }
  if (unsafeRequest(input)) {
    pushOnce(blockers, 'blocked_route_worker_or_tool_execution_not_enabled')
  }

  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_EXECUTION,
    ok,
    status: ok
      ? 'dispatched_narrow_controlled_worker_dispatch_dry_run_metadata_only'
      : blockers[0] ?? 'blocked_invalid_narrow_controlled_worker_dispatch_dry_run_state',
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV,
    confirmationRequired: true,
    controlledWorkerQueueStatus: queue.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_READY_STATUS
      : queue.status,
    sanitizedDispatchDryRun: sanitizedDispatchDryRun(input, ok),
    safety: safety(),
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE,
  }
}

export function createGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunMetadata(
  db: MockDatabase,
  input: GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput,
): GstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunResult {
  const validation = validateGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunInput(input)
  if (!validation.ok) return validation

  const queue = queueGstreamerMkvtoolnixNarrowControlledWorkerQueueMetadataMock(db, input.controlledWorkerQueueInput)
  if (!queue.ok || !queue.queueItem || queue.queueItem.queueStatus !== 'queued' || !queue.queueItem.mockOnly) {
    return {
      ...validation,
      ok: false,
      status: 'blocked_narrow_queue_item_not_ready_for_dispatch_dry_run',
      blockers: ['blocked_narrow_queue_item_not_ready_for_dispatch_dry_run'],
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

export function summarizeGstreamerMkvtoolnixNarrowControlledWorkerDispatchDryRunBoundary(): string[] {
  return [
    'Narrow controlled worker dispatch dry run consumes only queued local mock metadata from the narrow queue integration packet.',
    'The dry run creates a sanitized dispatch envelope and does not dispatch a worker, claim a worker lease, or write a persistent queue.',
    'Route execution, worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, media processing, signed/public artifacts, and final render/export remain disabled.',
    `The next milestone must be ${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE} before any guarded runtime execution packet is considered.`,
  ]
}
