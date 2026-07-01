import {
  buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput,
  validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput,
  type GstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-IMPLEMENTATION-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DECISION =
  'completed_gstreamer_mkvtoolnix_narrow_registered_noop_source_implementation_ready_for_source_qa_rollup' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_EXECUTION =
  'completed_backend_source_guarded_registered_noop_source_validation_no_route_worker_tool_or_media_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_READY_STATUS =
  'ready_for_guarded_narrow_route_worker_registered_noop_source_qa_rollup' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-REGISTERED-NOOP-SOURCE-QA-ROLLUP-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN' as const

export type GstreamerMkvtoolnixNarrowRegisteredNoopSourceStatus =
  | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_READY_STATUS
  | 'blocked_missing_registered_noop_source_reference'
  | 'blocked_invalid_registered_noop_source_state'
  | 'blocked_narrow_route_worker_registered_noop_boundary_validation_failed'
  | 'blocked_registered_noop_source_idempotency_mismatch'
  | 'blocked_registered_noop_source_runtime_enabled_without_future_packet'
  | 'blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled'
  | 'blocked_registered_noop_public_or_signed_artifact_attempt'
  | 'blocked_registered_noop_delivery_or_unlock_attempt'

export interface GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput {
  sourceImplementationId?: string | null
  routeSourceId?: string | null
  routeSourcePath?: string | null
  routeOwner?: 'backend_service_role_only' | 'frontend' | 'broad_service_role' | null
  routeRegistrationMode?: 'source_declared_registered_but_runtime_disabled' | 'source_declared_not_registered' | 'registered_route_handler' | null
  routeRuntimeMode?: 'disabled_registered_noop_source_contract_only' | 'enabled_route_runtime' | null
  workerSourceMode?: 'source_declared_not_dispatched' | 'worker_dispatch_enabled' | null
  sourceIdempotencyKey?: string | null
  dryRunConfirmationGate?:
    | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV
    | string
    | null
  boundaryInput: GstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput
  productionRouteFileCreated?: boolean
  routeRegistered?: boolean
  routeEnabled?: boolean
  routeExecution?: boolean
  workerDispatch?: boolean
  workerExecution?: boolean
  workerProcessStart?: boolean
  workerLeaseClaim?: boolean
  persistentQueueWrite?: boolean
  serviceRoleSecretPayloadAccess?: boolean
  frontendCredentialExposure?: boolean
  broadServiceRoleHandler?: boolean
  gstreamerExecution?: boolean
  mkvtoolnixExecution?: boolean
  dockerExecution?: boolean
  ffmpegFfprobeExecution?: boolean
  remotionExecution?: boolean
  mediaProcessing?: boolean
  privateMediaProcessing?: boolean
  userMediaProcessing?: boolean
  supabaseMutation?: boolean
  sqlExecution?: boolean
  signedUrlCreation?: boolean
  publicArtifactCreation?: boolean
  finalRenderExport?: boolean
  broadExternalBetaUnlock?: boolean
  paidProductionUnlock?: boolean
  productionUnlock?: boolean
}

export interface GstreamerMkvtoolnixNarrowRegisteredNoopSourceResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixNarrowRegisteredNoopSourceStatus
  blockers: GstreamerMkvtoolnixNarrowRegisteredNoopSourceStatus[]
  dryRunConfirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV
  dryRunConfirmationRequired: true
  sanitizedSource: {
    sourceImplementationId: string
    routeSourceId: string
    routeSourcePath: string
    routeOwner: 'backend_service_role_only'
    routeRegistrationMode: 'source_declared_registered_but_runtime_disabled'
    routeRuntimeMode: 'disabled_registered_noop_source_contract_only'
    workerSourceMode: 'source_declared_not_dispatched'
    sourceIdempotencyKey: string
    boundaryAccepted: boolean
    productionRouteFileCreated: false
    routeRegistered: false
    routeEnabled: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  responseShape: {
    status: 'accepted_registered_noop_source_contract'
    runtimeEnabled: false
    routeRegisteredAtRuntime: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    toolExecution: false
    nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_NEXT_MILESTONE
  }
  safety: {
    productionRouteFileCreated: false
    routeRegistered: false
    routeEnabled: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentQueueWrite: false
    serviceRoleSecretPayloadAccess: false
    frontendCredentialExposure: false
    broadServiceRoleHandler: false
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
    broadExternalBetaUnlock: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function buildExpectedSourceIdempotencyKey(input: GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput): string {
  const boundary = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(input.boundaryInput)
  return [
    'gstreamer-mkvtoolnix',
    'narrow-route-worker-registered-noop-source-implementation-1',
    boundary.sanitizedBoundary.boundaryId,
    boundary.sanitizedBoundary.boundaryIdempotencyKey,
    input.sourceImplementationId ?? '',
  ].join(':')
}

function runtimeRequested(input: GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput): boolean {
  return [
    input.productionRouteFileCreated,
    input.routeRegistered,
    input.routeEnabled,
    input.routeExecution,
    input.workerDispatch,
    input.workerExecution,
    input.workerProcessStart,
    input.workerLeaseClaim,
    input.persistentQueueWrite,
    input.serviceRoleSecretPayloadAccess,
    input.frontendCredentialExposure,
    input.broadServiceRoleHandler,
    input.gstreamerExecution,
    input.mkvtoolnixExecution,
    input.dockerExecution,
    input.ffmpegFfprobeExecution,
    input.remotionExecution,
    input.mediaProcessing,
    input.privateMediaProcessing,
    input.userMediaProcessing,
    input.supabaseMutation,
    input.sqlExecution,
  ].some(Boolean)
}

export function buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
  overrides: Partial<GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput> = {},
): GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput {
  const sourceImplementationId =
    overrides.sourceImplementationId ?? 'source-gstreamer-mkvtoolnix-narrow-route-worker-registered-noop-1'
  const boundaryInput = overrides.boundaryInput ?? buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput()
  const input = {
    sourceImplementationId,
    routeSourceId: 'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeRegisteredNoopSource',
    routeSourcePath: '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/registered-noop-boundary',
    routeOwner: 'backend_service_role_only',
    routeRegistrationMode: 'source_declared_registered_but_runtime_disabled',
    routeRuntimeMode: 'disabled_registered_noop_source_contract_only',
    workerSourceMode: 'source_declared_not_dispatched',
    dryRunConfirmationGate:
      RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV,
    boundaryInput,
    productionRouteFileCreated: false,
    routeRegistered: false,
    routeEnabled: false,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentQueueWrite: false,
    serviceRoleSecretPayloadAccess: false,
    frontendCredentialExposure: false,
    broadServiceRoleHandler: false,
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
    broadExternalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    ...overrides,
  } satisfies GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput

  return {
    ...input,
    sourceIdempotencyKey: overrides.sourceIdempotencyKey ?? buildExpectedSourceIdempotencyKey(input),
  }
}

export function validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(
  input: GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput,
): GstreamerMkvtoolnixNarrowRegisteredNoopSourceResult {
  const blockers: GstreamerMkvtoolnixNarrowRegisteredNoopSourceStatus[] = []
  const boundary = validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(input.boundaryInput)

  if (!boundary.ok) pushOnce(blockers, 'blocked_narrow_route_worker_registered_noop_boundary_validation_failed')
  for (const value of [
    input.sourceImplementationId,
    input.routeSourceId,
    input.routeSourcePath,
    input.sourceIdempotencyKey,
    input.dryRunConfirmationGate,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_registered_noop_source_reference')
  }
  if (input.routeOwner !== 'backend_service_role_only') {
    pushOnce(blockers, 'blocked_invalid_registered_noop_source_state')
  }
  if (input.routeRegistrationMode !== 'source_declared_registered_but_runtime_disabled') {
    pushOnce(blockers, 'blocked_invalid_registered_noop_source_state')
  }
  if (input.routeRuntimeMode !== 'disabled_registered_noop_source_contract_only') {
    pushOnce(blockers, 'blocked_invalid_registered_noop_source_state')
  }
  if (input.routeRuntimeMode === 'enabled_route_runtime' || input.routeEnabled === true) {
    pushOnce(blockers, 'blocked_registered_noop_source_runtime_enabled_without_future_packet')
  }
  if (input.workerSourceMode !== 'source_declared_not_dispatched') {
    pushOnce(blockers, 'blocked_invalid_registered_noop_source_state')
  }
  if (
    input.dryRunConfirmationGate !==
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV
  ) {
    pushOnce(blockers, 'blocked_invalid_registered_noop_source_state')
  }
  if (!blank(input.sourceIdempotencyKey) && input.sourceIdempotencyKey !== buildExpectedSourceIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_registered_noop_source_idempotency_mismatch')
  }
  if (runtimeRequested(input)) {
    pushOnce(blockers, 'blocked_registered_noop_route_worker_queue_or_runtime_execution_not_enabled')
  }
  if (input.signedUrlCreation || input.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_registered_noop_public_or_signed_artifact_attempt')
  }
  if (
    input.finalRenderExport ||
    input.broadExternalBetaUnlock ||
    input.paidProductionUnlock ||
    input.productionUnlock
  ) {
    pushOnce(blockers, 'blocked_registered_noop_delivery_or_unlock_attempt')
  }

  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_EXECUTION,
    ok,
    status: ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_READY_STATUS : blockers[0],
    blockers,
    dryRunConfirmationGate:
      RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV,
    dryRunConfirmationRequired: true,
    sanitizedSource: {
      sourceImplementationId: input.sourceImplementationId ?? '',
      routeSourceId: input.routeSourceId ?? '',
      routeSourcePath: input.routeSourcePath ?? '',
      routeOwner: 'backend_service_role_only',
      routeRegistrationMode: 'source_declared_registered_but_runtime_disabled',
      routeRuntimeMode: 'disabled_registered_noop_source_contract_only',
      workerSourceMode: 'source_declared_not_dispatched',
      sourceIdempotencyKey: input.sourceIdempotencyKey ?? '',
      boundaryAccepted: boundary.ok,
      productionRouteFileCreated: false,
      routeRegistered: false,
      routeEnabled: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      persistentQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    responseShape: {
      status: 'accepted_registered_noop_source_contract',
      runtimeEnabled: false,
      routeRegisteredAtRuntime: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      toolExecution: false,
      nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_NEXT_MILESTONE,
    },
    safety: {
      productionRouteFileCreated: false,
      routeRegistered: false,
      routeEnabled: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      persistentQueueWrite: false,
      serviceRoleSecretPayloadAccess: false,
      frontendCredentialExposure: false,
      broadServiceRoleHandler: false,
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
      broadExternalBetaUnlock: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_NEXT_MILESTONE,
  }
}

export function createGstreamerMkvtoolnixNarrowRegisteredNoopSourceResponse(
  input: GstreamerMkvtoolnixNarrowRegisteredNoopSourceInput = buildGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(),
): GstreamerMkvtoolnixNarrowRegisteredNoopSourceResult['responseShape'] {
  const result = validateGstreamerMkvtoolnixNarrowRegisteredNoopSourceInput(input)
  if (!result.ok) {
    return {
      status: 'accepted_registered_noop_source_contract',
      runtimeEnabled: false,
      routeRegisteredAtRuntime: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      toolExecution: false,
      nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_NEXT_MILESTONE,
    }
  }
  return result.responseShape
}

export function summarizeGstreamerMkvtoolnixNarrowRegisteredNoopSourceBoundary(): string[] {
  return [
    'The registered no-op source implementation provides backend-source metadata and validation helpers only.',
    'No production HTTP route file is created, enabled, or executed by this packet.',
    'The registered source claim is source metadata only; routeRegisteredAtRuntime remains false.',
    'Worker dispatch, worker execution, process start, lease claim, persistent queue writes, and tool/media execution remain false.',
    `A later registered no-op dry run must use ${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_REGISTERED_NOOP_SOURCE_DRY_RUN_CONFIRM_ENV}=true before any dry-run evidence is accepted.`,
  ]
}
