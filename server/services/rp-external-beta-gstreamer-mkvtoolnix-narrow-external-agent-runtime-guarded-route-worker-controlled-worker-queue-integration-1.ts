import type { JobRuntimeQueueItem } from '../../src/types/job-runtime'
import type { MockDatabase } from '../../src/backend/mock/mock-database'
import { queueMockJob } from '../../src/backend/services/job-queue-runtime-service'
import {
  buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput,
  createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse,
  validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput,
  type GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-registered-noop-source-implementation-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-QUEUE-INTEGRATION-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_DECISION =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_queue_integration_metadata_only' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_EXECUTION =
  'completed_confirmation_gated_narrow_controlled_worker_queue_metadata_only_no_route_worker_tool_or_media_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_READY_STATUS =
  'ready_for_guarded_narrow_route_worker_controlled_worker_dispatch_dry_run' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_CONTROLLED_WORKER_QUEUE_INTEGRATION' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1' as const

export type GstreamerMkvtoolnixNarrowControlledWorkerQueueStatus =
  | 'queued_narrow_controlled_worker_queue_metadata_only'
  | 'blocked_missing_narrow_controlled_worker_queue_confirmation'
  | 'blocked_registered_noop_source_validation_failed'
  | 'blocked_missing_narrow_controlled_worker_queue_reference'
  | 'blocked_invalid_narrow_controlled_worker_queue_state'
  | 'blocked_narrow_controlled_worker_queue_idempotency_mismatch'
  | 'blocked_route_worker_or_tool_execution_not_enabled'
  | 'blocked_mock_queue_gate_failed'

export interface GstreamerMkvtoolnixNarrowControlledWorkerQueueInput {
  confirmation: boolean
  registeredNoopSourceInput: GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput
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
  workerProcessStartRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  persistentQueueWriteRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  ffmpegFfprobeExecutionRequestedNow?: boolean
  dockerExecutionRequestedNow?: boolean
  remotionExecutionRequestedNow?: boolean
  mediaProcessingRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaUnlockRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixNarrowControlledWorkerQueueResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixNarrowControlledWorkerQueueStatus
  blockers: GstreamerMkvtoolnixNarrowControlledWorkerQueueStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV
  confirmationRequired: true
  registeredNoopSourceStatus: string
  queueItem?: JobRuntimeQueueItem
  sanitizedQueue: {
    queueId: string
    queueMode: 'mock_queue_metadata_only'
    queueIdempotencyKey: string
    queueContractId: string
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
    auditEventId: string
    nonPublicArtifactPolicyId: string
    localMockQueueItemCreated: boolean
    queueStatus: 'pending_validation' | 'queued'
    nextWorkerDispatch: 'pending_next_milestone'
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    remotionExecution: false
    mediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
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
    persistentQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function runtimeRequested(input: GstreamerMkvtoolnixNarrowControlledWorkerQueueInput): boolean {
  return [
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerProcessStartRequestedNow,
    input.workerLeaseClaimRequestedNow,
    input.persistentQueueWriteRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.ffmpegFfprobeExecutionRequestedNow,
    input.dockerExecutionRequestedNow,
    input.remotionExecutionRequestedNow,
    input.mediaProcessingRequestedNow,
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

function buildDispatchId(sourceId: string): string {
  return `controlled-dispatch-contract-gstreamer-mkvtoolnix-narrow:${sourceId}`
}

function expectedQueueIdempotencyKey(input: GstreamerMkvtoolnixNarrowControlledWorkerQueueInput): string {
  const source = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(input.registeredNoopSourceInput)
  return [
    'gstreamer-mkvtoolnix',
    'narrow-route-worker-controlled-worker-queue-integration-1',
    source.sanitizedSource.routeSourceId,
    source.sanitizedSource.sourceIdempotencyKey,
    input.queueId ?? '',
  ].join(':')
}

export function buildGstreamerMkvtoolnixNarrowControlledWorkerQueueInput(
  overrides: Partial<GstreamerMkvtoolnixNarrowControlledWorkerQueueInput> = {},
): GstreamerMkvtoolnixNarrowControlledWorkerQueueInput {
  const queueId =
    overrides.queueId ?? 'queue-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1'
  const registeredNoopSourceInput =
    overrides.registeredNoopSourceInput ?? buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput()
  const input = {
    confirmation: true,
    registeredNoopSourceInput,
    queueId,
    queueMode: 'mock_queue_metadata_only',
    queueContractId: 'queue-contract-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    retryPolicyId: 'retry-policy-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    failurePolicyId: 'failure-policy-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    auditEventId: 'audit-event-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    nonPublicArtifactPolicyId: 'non-public-artifact-policy-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    ...overrides,
  } satisfies GstreamerMkvtoolnixNarrowControlledWorkerQueueInput

  return {
    ...input,
    queueIdempotencyKey: overrides.queueIdempotencyKey ?? expectedQueueIdempotencyKey(input),
  }
}

function safety(): GstreamerMkvtoolnixNarrowControlledWorkerQueueResult['safety'] {
  return {
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentQueueWrite: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
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

function sanitizedQueue(
  input: GstreamerMkvtoolnixNarrowControlledWorkerQueueInput,
  ok: boolean,
): GstreamerMkvtoolnixNarrowControlledWorkerQueueResult['sanitizedQueue'] {
  const source = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(input.registeredNoopSourceInput)
  const response = createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse(input.registeredNoopSourceInput)
  const sourceId = source.sanitizedSource.sourceImplementationId

  return {
    queueId: input.queueId ?? '',
    queueMode: 'mock_queue_metadata_only',
    queueIdempotencyKey: input.queueIdempotencyKey ?? '',
    queueContractId: input.queueContractId ?? '',
    dispatchId: buildDispatchId(sourceId),
    dispatchIdempotencyKey: [
      'gstreamer-mkvtoolnix',
      'narrow-route-worker-controlled-dispatch',
      source.sanitizedSource.routeSourceId,
      source.sanitizedSource.sourceIdempotencyKey,
      buildDispatchId(sourceId),
    ].join(':'),
    routeSourceId: source.sanitizedSource.routeSourceId,
    routeSourcePath: source.sanitizedSource.routeSourcePath,
    sourceIdempotencyKey: source.sanitizedSource.sourceIdempotencyKey,
    acceptedSourceStatus: response.status,
    jobId: 'job-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    workerLeaseId: 'lease-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    commandTemplateId: 'command-template-gstreamer-mkvtoolnix-narrow-no-media-tools-disabled-1',
    privateInputManifestId: 'private-input-manifest-gstreamer-mkvtoolnix-narrow-registered-noop-1',
    privateInputManifestSha256: 'sha256:not_applicable_registered_noop_source_no_media',
    outputManifestSchemaId: 'output-manifest-schema-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    qaReportSchemaId: 'qa-report-schema-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    cleanupPolicyId: 'cleanup-policy-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    retentionPolicyId: 'retention-policy-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    failurePolicyId: input.failurePolicyId ?? '',
    retryPolicyId: input.retryPolicyId ?? '',
    auditEventId: input.auditEventId ?? '',
    nonPublicArtifactPolicyId: input.nonPublicArtifactPolicyId ?? '',
    localMockQueueItemCreated: false,
    queueStatus: ok ? 'pending_validation' : 'pending_validation',
    nextWorkerDispatch: 'pending_next_milestone',
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentQueueWrite: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    ffmpegFfprobeExecution: false,
    dockerExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

export function validateGstreamerMkvtoolnixNarrowControlledWorkerQueueInput(
  input: GstreamerMkvtoolnixNarrowControlledWorkerQueueInput,
): GstreamerMkvtoolnixNarrowControlledWorkerQueueResult {
  const blockers: GstreamerMkvtoolnixNarrowControlledWorkerQueueStatus[] = []
  const source = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(input.registeredNoopSourceInput)

  if (!input.confirmation) pushOnce(blockers, 'blocked_missing_narrow_controlled_worker_queue_confirmation')
  if (!source.ok || source.responseShape.status !== 'accepted_registered_noop_source_contract') {
    pushOnce(blockers, 'blocked_registered_noop_source_validation_failed')
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
    pushOnce(blockers, 'blocked_missing_narrow_controlled_worker_queue_reference')
  }
  if (input.queueMode !== 'mock_queue_metadata_only') {
    pushOnce(blockers, 'blocked_invalid_narrow_controlled_worker_queue_state')
  }
  if (!blank(input.queueIdempotencyKey) && input.queueIdempotencyKey !== expectedQueueIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_narrow_controlled_worker_queue_idempotency_mismatch')
  }
  if (runtimeRequested(input)) {
    pushOnce(blockers, 'blocked_route_worker_or_tool_execution_not_enabled')
  }

  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_EXECUTION,
    ok,
    status: ok
      ? 'queued_narrow_controlled_worker_queue_metadata_only'
      : blockers[0] ?? 'blocked_invalid_narrow_controlled_worker_queue_state',
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV,
    confirmationRequired: true,
    registeredNoopSourceStatus: source.status,
    sanitizedQueue: sanitizedQueue(input, ok),
    safety: safety(),
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
  }
}

export function queueGstreamerMkvtoolnixNarrowControlledWorkerQueueMetadataMock(
  db: MockDatabase,
  input: GstreamerMkvtoolnixNarrowControlledWorkerQueueInput,
): GstreamerMkvtoolnixNarrowControlledWorkerQueueResult {
  const validation = validateGstreamerMkvtoolnixNarrowControlledWorkerQueueInput(input)
  if (!validation.ok) return validation

  const queueItem = queueMockJob(db, {
    workspaceId: 'workspace-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    projectId: 'project-gstreamer-mkvtoolnix-narrow-controlled-worker-queue-1',
    editPlanId: validation.sanitizedQueue.sourceIdempotencyKey,
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
      packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_PACKET,
      queueMode: validation.sanitizedQueue.queueMode,
      queueId: validation.sanitizedQueue.queueId,
      queueContractId: validation.sanitizedQueue.queueContractId,
      queueIdempotencyKey: validation.sanitizedQueue.queueIdempotencyKey,
      dispatchId: validation.sanitizedQueue.dispatchId,
      dispatchIdempotencyKey: validation.sanitizedQueue.dispatchIdempotencyKey,
      routeSourceId: validation.sanitizedQueue.routeSourceId,
      routeSourcePath: validation.sanitizedQueue.routeSourcePath,
      sourceIdempotencyKey: validation.sanitizedQueue.sourceIdempotencyKey,
      acceptedSourceStatus: validation.sanitizedQueue.acceptedSourceStatus,
      commandTemplateId: validation.sanitizedQueue.commandTemplateId,
      privateInputManifestId: validation.sanitizedQueue.privateInputManifestId,
      privateInputManifestSha256: validation.sanitizedQueue.privateInputManifestSha256,
      outputManifestSchemaId: validation.sanitizedQueue.outputManifestSchemaId,
      qaReportSchemaId: validation.sanitizedQueue.qaReportSchemaId,
      cleanupPolicyId: validation.sanitizedQueue.cleanupPolicyId,
      retentionPolicyId: validation.sanitizedQueue.retentionPolicyId,
      failurePolicyId: validation.sanitizedQueue.failurePolicyId,
      retryPolicyId: validation.sanitizedQueue.retryPolicyId,
      auditEventId: validation.sanitizedQueue.auditEventId,
      nonPublicArtifactPolicyId: validation.sanitizedQueue.nonPublicArtifactPolicyId,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      persistentQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
      remotionExecution: false,
      mediaProcessing: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
  })

  if (queueItem.queueStatus !== 'queued' || !queueItem.mockOnly || queueItem.payload.mockOnly !== true) {
    return {
      ...validation,
      ok: false,
      status: 'blocked_mock_queue_gate_failed',
      blockers: ['blocked_mock_queue_gate_failed'],
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

export function summarizeGstreamerMkvtoolnixNarrowControlledWorkerQueueBoundary(): string[] {
  return [
    'Narrow controlled worker queue integration consumes only the accepted registered no-op source metadata.',
    'It creates local MockDatabase queue metadata only and does not write a persistent queue.',
    'Route execution, worker dispatch, worker execution, tool execution, media processing, Supabase mutation, SQL execution, signed/public artifacts, and final render/export remain disabled.',
    `A later worker-dispatch dry run must use ${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE} before any real worker or tool execution is considered.`,
  ]
}
