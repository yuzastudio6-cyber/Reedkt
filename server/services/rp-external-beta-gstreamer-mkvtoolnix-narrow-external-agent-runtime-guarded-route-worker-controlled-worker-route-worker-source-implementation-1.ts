import {
  buildGstreamerMkvtoolnixNarrowSourceExecutionRouteSource,
  validateGstreamerMkvtoolnixNarrowSourceExecutionRouteSource,
  type GstreamerMkvtoolnixNarrowSourceExecutionRouteSource,
  type GstreamerMkvtoolnixNarrowSourceExecutionRouteSourceStatus,
} from '../routes/gstreamer-mkvtoolnix-narrow-source-execution-boundary-route-source'
import {
  buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource,
  validateGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource,
  type GstreamerMkvtoolnixNarrowSourceExecutionWorkerSource,
  type GstreamerMkvtoolnixNarrowSourceExecutionWorkerSourceStatus,
} from '../workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered'
import {
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput,
  validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput,
  type GstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-IMPLEMENTATION-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_DECISION =
  'completed_gstreamer_mkvtoolnix_narrow_route_worker_source_implementation' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_EXECUTION =
  'completed_source_only_route_worker_files_created_not_registered_or_executed' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_READY_STATUS =
  'ready_for_guarded_narrow_route_worker_source_implementation_qa_rollup' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-ROUTE-WORKER-SOURCE-IMPLEMENTATION-QA-ROLLUP-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_QA_SOURCE_DECISION =
  'qa_passed_gstreamer_mkvtoolnix_narrow_route_worker_source_execution_packet_evidence' as const

export type GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationStatus =
  | 'completed_narrow_route_worker_source_implementation'
  | 'blocked_missing_narrow_route_worker_source_implementation_confirmation'
  | 'blocked_source_execution_packet_validation_failed'
  | 'blocked_route_source_validation_failed'
  | 'blocked_worker_source_validation_failed'
  | 'blocked_missing_source_execution_packet_qa_rollup'
  | 'blocked_source_implementation_idempotency_mismatch'
  | 'blocked_route_worker_or_tool_execution_not_enabled'

export interface GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput {
  confirmation: boolean
  sourceImplementationId?: string | null
  sourceImplementationIdempotencyKey?: string | null
  sourceExecutionPacketInput: GstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput
  routeSource: GstreamerMkvtoolnixNarrowSourceExecutionRouteSource
  workerSource: GstreamerMkvtoolnixNarrowSourceExecutionWorkerSource
  sourceExecutionPacketQaDecision?:
    | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_QA_SOURCE_DECISION
    | string
    | null
  sourceExecutionPacketQaStatus?: 'passed_source_evidence_review' | 'pending' | 'failed' | null
  sourceExecutionPacketQaMergeSha?: string | null
  routeRegistrationRequestedNow?: boolean
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  dockerExecutionRequestedNow?: boolean
  ffmpegFfprobeExecutionRequestedNow?: boolean
  remotionExecutionRequestedNow?: boolean
  mediaProcessingRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  secretPayloadAccessRequestedNow?: boolean
  serviceRoleSecretPayloadAccessRequestedNow?: boolean
  providerCallRequestedNow?: boolean
  modelCallRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  broadExternalBetaUnlockRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationStatus
  blockers: GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationStatus[]
  routeSourceBlockers: GstreamerMkvtoolnixNarrowSourceExecutionRouteSourceStatus[]
  workerSourceBlockers: GstreamerMkvtoolnixNarrowSourceExecutionWorkerSourceStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_CONFIRM_ENV
  confirmationRequired: true
  sanitizedImplementation: {
    sourceImplementationId: string
    sourceImplementationIdempotencyKey: string
    sourceExecutionPacketQaDecision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_QA_SOURCE_DECISION
    sourceExecutionPacketQaStatus: 'passed_source_evidence_review'
    sourceExecutionPacketQaMergeSha: string
    sourceExecutionPacketId: string
    routeSourceId: string
    routeSourcePath: string
    routeSourceMode: 'source_file_created_not_registered'
    workerSourceId: string
    workerSourcePath: string
    workerSourceMode: 'source_file_created_not_registered_not_dispatched'
    queueSourceMode: 'metadata_only_queue_source_declared_no_persistent_write'
    sourceClass: 'generated_fixture_only_narrow_controlled_worker_runtime_source'
    approvedSnapshotRequirement: 'required_before_future_runtime'
    generatedFixtureEvidenceAccepted: true
    routeRegisteredAtRuntime: false
    productionRouteFileCreated: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    dockerExecution: false
    ffmpegFfprobeExecution: false
    remotionExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  responseShape: {
    status: 'accepted_narrow_route_worker_source_implementation'
    routeRegisteredAtRuntime: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    toolExecution: false
    nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_NEXT_MILESTONE
  }
  safety: {
    routeRegisteredAtRuntime: false
    productionRouteFileCreated: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gstreamerExecutionInThisSourceImplementation: false
    mkvtoolnixExecutionInThisSourceImplementation: false
    dockerExecutionInThisSourceImplementation: false
    ffmpegFfprobeExecutionInThisSourceImplementation: false
    remotionExecutionInThisSourceImplementation: false
    mediaProcessingInThisSourceImplementation: false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    serviceRoleSecretPayloadAccess: false
    providerCall: false
    modelCall: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    broadExternalBetaUnlock: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function expectedSourceImplementationIdempotencyKey(
  input: GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput,
): string {
  const sourcePacket = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
    input.sourceExecutionPacketInput,
  )
  return [
    'gstreamer-mkvtoolnix',
    'narrow-route-worker-source-implementation-1',
    sourcePacket.sanitizedSourceExecutionPacket.routeWorkerSourceExecutionPacketId,
    sourcePacket.sanitizedSourceExecutionPacket.routeWorkerSourceExecutionPacketIdempotencyKey,
    input.routeSource.sourceId,
    input.workerSource.sourceId,
    input.sourceImplementationId ?? '',
  ].join(':')
}

function unsafeRequest(input: GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput): boolean {
  return [
    input.routeRegistrationRequestedNow,
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerProcessStartRequestedNow,
    input.workerLeaseClaimRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.dockerExecutionRequestedNow,
    input.ffmpegFfprobeExecutionRequestedNow,
    input.remotionExecutionRequestedNow,
    input.mediaProcessingRequestedNow,
    input.privateMediaProcessingRequestedNow,
    input.userMediaProcessingRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.secretPayloadAccessRequestedNow,
    input.serviceRoleSecretPayloadAccessRequestedNow,
    input.providerCallRequestedNow,
    input.modelCallRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.broadExternalBetaUnlockRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
  ].some(Boolean)
}

export function buildGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput(
  overrides: Partial<GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput> = {},
): GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput {
  const sourceImplementationId =
    overrides.sourceImplementationId ?? 'source-implementation-gstreamer-mkvtoolnix-narrow-route-worker-1'
  const sourceExecutionPacketInput =
    overrides.sourceExecutionPacketInput ?? buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput()
  const routeSource =
    overrides.routeSource ?? buildGstreamerMkvtoolnixNarrowSourceExecutionRouteSource()
  const workerSource =
    overrides.workerSource ?? buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource()
  const input: GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput = {
    confirmation: true,
    sourceImplementationId,
    sourceExecutionPacketInput,
    routeSource,
    workerSource,
    sourceExecutionPacketQaDecision:
      RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_QA_SOURCE_DECISION,
    sourceExecutionPacketQaStatus: 'passed_source_evidence_review',
    sourceExecutionPacketQaMergeSha: 'ee557c2322317f7fdc3e3f0f85b6571f9bf88fc4',
    routeRegistrationRequestedNow: false,
    routeExecutionRequestedNow: false,
    workerDispatchRequestedNow: false,
    workerExecutionRequestedNow: false,
    workerProcessStartRequestedNow: false,
    workerLeaseClaimRequestedNow: false,
    persistentJobQueueWriteRequestedNow: false,
    gstreamerExecutionRequestedNow: false,
    mkvtoolnixExecutionRequestedNow: false,
    dockerExecutionRequestedNow: false,
    ffmpegFfprobeExecutionRequestedNow: false,
    remotionExecutionRequestedNow: false,
    mediaProcessingRequestedNow: false,
    privateMediaProcessingRequestedNow: false,
    userMediaProcessingRequestedNow: false,
    supabaseMutationRequestedNow: false,
    sqlExecutionRequestedNow: false,
    secretPayloadAccessRequestedNow: false,
    serviceRoleSecretPayloadAccessRequestedNow: false,
    providerCallRequestedNow: false,
    modelCallRequestedNow: false,
    signedUrlCreationRequestedNow: false,
    publicArtifactRequestedNow: false,
    finalRenderExportRequestedNow: false,
    broadExternalBetaUnlockRequestedNow: false,
    paidProductionUnlockRequestedNow: false,
    productionUnlockRequestedNow: false,
    ...overrides,
  }

  return {
    ...input,
    sourceImplementationIdempotencyKey:
      overrides.sourceImplementationIdempotencyKey ?? expectedSourceImplementationIdempotencyKey(input),
  }
}

export function validateGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput(
  input: GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput,
): GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationResult {
  const blockers: GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationStatus[] = []
  const sourcePacket = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(
    input.sourceExecutionPacketInput,
  )
  const routeSource = validateGstreamerMkvtoolnixNarrowSourceExecutionRouteSource(input.routeSource)
  const workerSource = validateGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource(input.workerSource)

  if (!input.confirmation) {
    pushOnce(blockers, 'blocked_missing_narrow_route_worker_source_implementation_confirmation')
  }
  if (!sourcePacket.ok) pushOnce(blockers, 'blocked_source_execution_packet_validation_failed')
  if (!routeSource.ok) pushOnce(blockers, 'blocked_route_source_validation_failed')
  if (!workerSource.ok) pushOnce(blockers, 'blocked_worker_source_validation_failed')
  if (
    input.sourceExecutionPacketQaDecision !==
      RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_QA_SOURCE_DECISION ||
    input.sourceExecutionPacketQaStatus !== 'passed_source_evidence_review' ||
    input.sourceExecutionPacketQaMergeSha !== 'ee557c2322317f7fdc3e3f0f85b6571f9bf88fc4'
  ) {
    pushOnce(blockers, 'blocked_missing_source_execution_packet_qa_rollup')
  }
  if (input.sourceImplementationIdempotencyKey !== expectedSourceImplementationIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_source_implementation_idempotency_mismatch')
  }
  if (unsafeRequest(input)) pushOnce(blockers, 'blocked_route_worker_or_tool_execution_not_enabled')

  const sanitizedImplementation: GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationResult['sanitizedImplementation'] = {
    sourceImplementationId: String(input.sourceImplementationId ?? ''),
    sourceImplementationIdempotencyKey: expectedSourceImplementationIdempotencyKey(input),
    sourceExecutionPacketQaDecision:
      RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_QA_SOURCE_DECISION,
    sourceExecutionPacketQaStatus: 'passed_source_evidence_review',
    sourceExecutionPacketQaMergeSha: 'ee557c2322317f7fdc3e3f0f85b6571f9bf88fc4',
    sourceExecutionPacketId:
      sourcePacket.sanitizedSourceExecutionPacket.routeWorkerSourceExecutionPacketId,
    routeSourceId: routeSource.sanitizedRouteSource.sourceId,
    routeSourcePath: routeSource.sanitizedRouteSource.path,
    routeSourceMode: 'source_file_created_not_registered',
    workerSourceId: workerSource.sanitizedWorkerSource.sourceId,
    workerSourcePath: workerSource.sanitizedWorkerSource.sourcePath,
    workerSourceMode: 'source_file_created_not_registered_not_dispatched',
    queueSourceMode: 'metadata_only_queue_source_declared_no_persistent_write',
    sourceClass: 'generated_fixture_only_narrow_controlled_worker_runtime_source',
    approvedSnapshotRequirement: 'required_before_future_runtime',
    generatedFixtureEvidenceAccepted: true,
    routeRegisteredAtRuntime: false,
    productionRouteFileCreated: false,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentJobQueueWrite: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    dockerExecution: false,
    ffmpegFfprobeExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_EXECUTION,
    ok,
    status: ok ? 'completed_narrow_route_worker_source_implementation' : blockers[0],
    blockers,
    routeSourceBlockers: routeSource.blockers,
    workerSourceBlockers: workerSource.blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_CONFIRM_ENV,
    confirmationRequired: true,
    sanitizedImplementation,
    responseShape: {
      status: 'accepted_narrow_route_worker_source_implementation',
      routeRegisteredAtRuntime: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      toolExecution: false,
      nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_NEXT_MILESTONE,
    },
    safety: {
      routeRegisteredAtRuntime: false,
      productionRouteFileCreated: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      persistentJobQueueWrite: false,
      gstreamerExecutionInThisSourceImplementation: false,
      mkvtoolnixExecutionInThisSourceImplementation: false,
      dockerExecutionInThisSourceImplementation: false,
      ffmpegFfprobeExecutionInThisSourceImplementation: false,
      remotionExecutionInThisSourceImplementation: false,
      mediaProcessingInThisSourceImplementation: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      serviceRoleSecretPayloadAccess: false,
      providerCall: false,
      modelCall: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      broadExternalBetaUnlock: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_NEXT_MILESTONE,
  }
}

export function createGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationResponse(
  input: GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput,
): GstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationResult['responseShape'] {
  return validateGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationInput(input).responseShape
}

export function summarizeGstreamerMkvtoolnixNarrowRouteWorkerSourceImplementationBoundary(): string[] {
  return [
    `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_PACKET} creates source-only route/worker files.`,
    `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION_CONFIRM_ENV} is required even though the implementation remains metadata/source-only.`,
    'The route source is not registered at runtime and route execution remains false.',
    'The worker source is not dispatched, not started, and not allowed to claim a lease or write a persistent queue.',
    'GStreamer, MKVToolNix, Docker, FFmpeg/FFprobe, Remotion, Supabase, SQL, provider/model calls, media processing, signed/public artifacts, and unlocks remain false.',
  ]
}
