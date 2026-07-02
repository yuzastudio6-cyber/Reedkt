export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID =
  'worker.gstreamerMkvtoolnix.narrowSourceExecution.notRegistered' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH =
  'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_IMPLEMENTATION' as const

export type GstreamerMkvtoolnixNarrowSourceExecutionWorkerSourceStatus =
  | 'accepted_worker_source_file_created_not_registered'
  | 'blocked_invalid_worker_source_contract'
  | 'blocked_worker_dispatch_or_execution_not_enabled'
  | 'blocked_tool_or_media_execution_not_enabled'
  | 'blocked_unsafe_worker_source_scope'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_delivery_or_unlock_attempt'

export interface GstreamerMkvtoolnixNarrowSourceExecutionWorkerSource {
  sourceId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID
  sourcePath: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH
  workerOwner: 'backend_worker_only'
  workerKind: 'render_export'
  sourceClass: 'generated_fixture_only_narrow_controlled_worker_runtime_source'
  approvedSnapshotRequirement: 'required_before_future_runtime'
  confirmationGate: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_CONFIRM_ENV
  workerSourceMode: 'source_file_created_not_registered_not_dispatched'
  workerRuntimeMode: 'disabled_source_contract_only'
  workerRegisteredAtRuntime: false
  workerDispatch: false
  workerExecution: false
  workerProcessStart: false
  workerLeaseClaim: false
  persistentJobQueueWrite: false
  queueConsumptionMode: 'not_enabled'
  rawCommandStringsAllowed: false
  rawChatAllowed: false
  frontendFilePathAllowed: false
  privateOrUserMediaAllowed: false
  gstreamerExecution: false
  mkvtoolnixExecution: false
  dockerExecution: false
  ffmpegFfprobeExecution: false
  remotionExecution: false
  mediaProcessing: false
  privateMediaProcessing: false
  userMediaProcessing: false
  signedUrlCreation: false
  publicArtifactCreation: false
  finalRenderExport: false
  broadExternalBetaUnlock: false
  paidProductionUnlock: false
  productionUnlock: false
}

export interface GstreamerMkvtoolnixNarrowSourceExecutionWorkerSourceValidation {
  ok: boolean
  status: GstreamerMkvtoolnixNarrowSourceExecutionWorkerSourceStatus
  blockers: GstreamerMkvtoolnixNarrowSourceExecutionWorkerSourceStatus[]
  sanitizedWorkerSource: GstreamerMkvtoolnixNarrowSourceExecutionWorkerSource
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

export function buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource(
  overrides: Partial<GstreamerMkvtoolnixNarrowSourceExecutionWorkerSource> = {},
): GstreamerMkvtoolnixNarrowSourceExecutionWorkerSource {
  return {
    sourceId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID,
    sourcePath: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH,
    workerOwner: 'backend_worker_only',
    workerKind: 'render_export',
    sourceClass: 'generated_fixture_only_narrow_controlled_worker_runtime_source',
    approvedSnapshotRequirement: 'required_before_future_runtime',
    confirmationGate: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_CONFIRM_ENV,
    workerSourceMode: 'source_file_created_not_registered_not_dispatched',
    workerRuntimeMode: 'disabled_source_contract_only',
    workerRegisteredAtRuntime: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentJobQueueWrite: false,
    queueConsumptionMode: 'not_enabled',
    rawCommandStringsAllowed: false,
    rawChatAllowed: false,
    frontendFilePathAllowed: false,
    privateOrUserMediaAllowed: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    dockerExecution: false,
    ffmpegFfprobeExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
    broadExternalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    ...overrides,
  }
}

export function validateGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource(
  source: GstreamerMkvtoolnixNarrowSourceExecutionWorkerSource,
): GstreamerMkvtoolnixNarrowSourceExecutionWorkerSourceValidation {
  const blockers: GstreamerMkvtoolnixNarrowSourceExecutionWorkerSourceStatus[] = []

  if (
    source.sourceId !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID ||
    source.sourcePath !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH ||
    source.workerOwner !== 'backend_worker_only' ||
    source.workerKind !== 'render_export' ||
    source.confirmationGate !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_CONFIRM_ENV
  ) {
    pushOnce(blockers, 'blocked_invalid_worker_source_contract')
  }

  if (
    source.sourceClass !== 'generated_fixture_only_narrow_controlled_worker_runtime_source' ||
    source.approvedSnapshotRequirement !== 'required_before_future_runtime' ||
    source.workerSourceMode !== 'source_file_created_not_registered_not_dispatched' ||
    source.workerRuntimeMode !== 'disabled_source_contract_only' ||
    source.queueConsumptionMode !== 'not_enabled'
  ) {
    pushOnce(blockers, 'blocked_unsafe_worker_source_scope')
  }

  if (
    source.workerRegisteredAtRuntime ||
    source.workerDispatch ||
    source.workerExecution ||
    source.workerProcessStart ||
    source.workerLeaseClaim ||
    source.persistentJobQueueWrite
  ) {
    pushOnce(blockers, 'blocked_worker_dispatch_or_execution_not_enabled')
  }

  if (
    source.rawCommandStringsAllowed ||
    source.rawChatAllowed ||
    source.frontendFilePathAllowed ||
    source.privateOrUserMediaAllowed ||
    source.gstreamerExecution ||
    source.mkvtoolnixExecution ||
    source.dockerExecution ||
    source.ffmpegFfprobeExecution ||
    source.remotionExecution ||
    source.mediaProcessing ||
    source.privateMediaProcessing ||
    source.userMediaProcessing
  ) {
    pushOnce(blockers, 'blocked_tool_or_media_execution_not_enabled')
  }

  if (source.signedUrlCreation || source.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }

  if (
    source.finalRenderExport ||
    source.broadExternalBetaUnlock ||
    source.paidProductionUnlock ||
    source.productionUnlock
  ) {
    pushOnce(blockers, 'blocked_delivery_or_unlock_attempt')
  }

  const sanitizedWorkerSource = buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource()
  return {
    ok: blockers.length === 0,
    status: blockers[0] ?? 'accepted_worker_source_file_created_not_registered',
    blockers,
    sanitizedWorkerSource,
  }
}
