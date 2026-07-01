import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput,
  validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput,
  type GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-bridge-implementation-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-BOUNDARY-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DECISION =
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_guarded_route_worker_boundary_contract_ready_for_confirmation_gated_noop_dry_run' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_EXECUTION =
  'completed_backend_source_guarded_route_worker_boundary_no_route_worker_tool_or_media_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_READY_STATUS =
  'ready_for_confirmation_gated_narrow_route_worker_boundary_noop_dry_run' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-BOUNDARY-DRY-RUN-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN' as const

export type GstreamerMkvtoolnixNarrowRouteWorkerBoundaryStatus =
  | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_READY_STATUS
  | 'blocked_missing_narrow_route_worker_boundary_reference'
  | 'blocked_invalid_narrow_route_worker_boundary_state'
  | 'blocked_narrow_bridge_validation_failed'
  | 'blocked_narrow_route_worker_boundary_idempotency_mismatch'
  | 'blocked_route_or_worker_runtime_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_delivery_or_unlock_attempt'

export interface GstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput {
  boundaryId?: string | null
  proposedRouteId?: string | null
  proposedRoutePath?: string | null
  proposedRouteOwner?: 'backend_service_role_only' | 'frontend' | 'broad_service_role' | null
  routeBoundaryMode?: 'noop_validation_only' | 'live_route_handler' | null
  workerBoundaryMode?: 'not_dispatched_boundary_only' | 'live_worker_dispatch' | null
  boundaryIdempotencyKey?: string | null
  futureDryRunConfirmationGate?: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV | string | null
  bridgeInput: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput
  routeRegistered?: boolean
  routeEnabled?: boolean
  routeExecution?: boolean
  serviceRoleSecretPayloadAccess?: boolean
  frontendCredentialExposure?: boolean
  broadServiceRoleHandler?: boolean
  workerDispatch?: boolean
  workerExecution?: boolean
  workerProcessStart?: boolean
  workerLeaseClaim?: boolean
  persistentQueueWrite?: boolean
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

export interface GstreamerMkvtoolnixNarrowRouteWorkerBoundaryResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixNarrowRouteWorkerBoundaryStatus
  blockers: GstreamerMkvtoolnixNarrowRouteWorkerBoundaryStatus[]
  sourceBridgeStatus: string
  futureDryRunConfirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV
  futureDryRunConfirmationRequired: true
  sanitizedBoundary: {
    boundaryId: string
    proposedRouteId: string
    proposedRoutePath: string
    proposedRouteOwner: 'backend_service_role_only'
    routeBoundaryMode: 'noop_validation_only'
    workerBoundaryMode: 'not_dispatched_boundary_only'
    boundaryIdempotencyKey: string
    sourceBridgeNextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_NEXT_MILESTONE
    bridgeAccepted: boolean
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
  safety: {
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function buildExpectedBoundaryIdempotencyKey(input: GstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput): string {
  const bridge = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(input.bridgeInput)
  return [
    'gstreamer-mkvtoolnix',
    'narrow-external-agent-route-worker-boundary-1',
    bridge.sanitizedBridge.approvedSnapshotId,
    bridge.sanitizedBridge.jobId,
    bridge.sanitizedBridge.commandTemplateId,
    input.boundaryId ?? '',
  ].join(':')
}

function runtimeRequested(input: GstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput): boolean {
  return [
    input.routeExecution,
    input.routeRegistered,
    input.routeEnabled,
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

export function buildGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  overrides: Partial<GstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput> = {},
): GstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput {
  const boundaryId = overrides.boundaryId ?? 'boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1'
  const bridgeInput = overrides.bridgeInput ?? buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput()
  const input = {
    boundaryId,
    proposedRouteId: 'externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeBoundary',
    proposedRoutePath: '/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/runtime-boundary',
    proposedRouteOwner: 'backend_service_role_only',
    routeBoundaryMode: 'noop_validation_only',
    workerBoundaryMode: 'not_dispatched_boundary_only',
    futureDryRunConfirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV,
    bridgeInput,
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
  } satisfies GstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput

  return {
    ...input,
    boundaryIdempotencyKey: overrides.boundaryIdempotencyKey ?? buildExpectedBoundaryIdempotencyKey(input),
  }
}

export function validateGstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput(
  input: GstreamerMkvtoolnixNarrowRouteWorkerBoundaryInput,
): GstreamerMkvtoolnixNarrowRouteWorkerBoundaryResult {
  const blockers: GstreamerMkvtoolnixNarrowRouteWorkerBoundaryStatus[] = []
  const bridge = validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(input.bridgeInput)

  if (!bridge.ok || bridge.status !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_READY_STATUS) {
    pushOnce(blockers, 'blocked_narrow_bridge_validation_failed')
  }
  for (const value of [
    input.boundaryId,
    input.proposedRouteId,
    input.proposedRoutePath,
    input.boundaryIdempotencyKey,
    input.futureDryRunConfirmationGate,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_narrow_route_worker_boundary_reference')
  }
  if (input.proposedRouteOwner !== 'backend_service_role_only') {
    pushOnce(blockers, 'blocked_invalid_narrow_route_worker_boundary_state')
  }
  if (input.routeBoundaryMode !== 'noop_validation_only') {
    pushOnce(blockers, 'blocked_invalid_narrow_route_worker_boundary_state')
  }
  if (input.workerBoundaryMode !== 'not_dispatched_boundary_only') {
    pushOnce(blockers, 'blocked_invalid_narrow_route_worker_boundary_state')
  }
  if (input.futureDryRunConfirmationGate !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV) {
    pushOnce(blockers, 'blocked_invalid_narrow_route_worker_boundary_state')
  }
  if (
    !blank(input.boundaryIdempotencyKey) &&
    input.boundaryIdempotencyKey !== buildExpectedBoundaryIdempotencyKey(input)
  ) {
    pushOnce(blockers, 'blocked_narrow_route_worker_boundary_idempotency_mismatch')
  }
  if (runtimeRequested(input)) {
    pushOnce(blockers, 'blocked_route_or_worker_runtime_not_enabled')
  }
  if (input.signedUrlCreation || input.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }
  if (
    input.finalRenderExport ||
    input.broadExternalBetaUnlock ||
    input.paidProductionUnlock ||
    input.productionUnlock
  ) {
    pushOnce(blockers, 'blocked_delivery_or_unlock_attempt')
  }

  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_EXECUTION,
    ok,
    status: ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_READY_STATUS : blockers[0],
    blockers,
    sourceBridgeStatus: bridge.status,
    futureDryRunConfirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV,
    futureDryRunConfirmationRequired: true,
    sanitizedBoundary: {
      boundaryId: input.boundaryId ?? '',
      proposedRouteId: input.proposedRouteId ?? '',
      proposedRoutePath: input.proposedRoutePath ?? '',
      proposedRouteOwner: 'backend_service_role_only',
      routeBoundaryMode: 'noop_validation_only',
      workerBoundaryMode: 'not_dispatched_boundary_only',
      boundaryIdempotencyKey: input.boundaryIdempotencyKey ?? '',
      sourceBridgeNextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_NEXT_MILESTONE,
      bridgeAccepted: bridge.ok,
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
    safety: {
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
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_NEXT_MILESTONE,
  }
}

export function summarizeGstreamerMkvtoolnixNarrowRouteWorkerBoundary(): string[] {
  return [
    'The narrow route/worker boundary defines backend-service-role-only source contracts and no-op validation helpers for the reviewed GStreamer/MKVToolNix external-agent bridge.',
    'No HTTP route is registered or enabled by this packet; route execution, worker dispatch, worker execution, worker lease claim, and persistent queue writes remain false.',
    'The boundary rejects invalid bridge references, non-backend owners, non-noop modes, idempotency mismatches, runtime requests, signed/public artifact attempts, delivery/export, and beta/production unlock requests.',
    `A later dry run must use ${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN_CONFIRM_ENV}=true before any no-op boundary dry-run evidence is accepted.`,
  ]
}
