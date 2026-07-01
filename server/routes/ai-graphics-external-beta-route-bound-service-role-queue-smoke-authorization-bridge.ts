import {
  AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_LIVE_ENQUEUE_AUTHORIZATION_BRIDGE_DECISION,
} from './ai-graphics-external-beta-route-to-live-enqueue-authorization-bridge'
import {
  AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_DECISION,
} from '../tool-registry/ai-graphics-external-beta-service-role-queue-smoke-authorization'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  type AiGraphicsCanonicalToolId,
} from '../tool-registry/ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_BRIDGE_DECISION =
  'ai_graphics_external_beta_route_bound_service_role_queue_smoke_authorization_bridge_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgeStatus =
  | 'missing_route_to_live_enqueue_authorization_bridge_packet'
  | 'route_to_live_enqueue_authorization_bridge_rejected'
  | 'missing_service_role_queue_smoke_authorization_packet'
  | 'service_role_queue_smoke_authorization_rejected'
  | 'route_bound_service_role_queue_smoke_candidate_rejected'
  | 'route_bound_service_role_queue_smoke_authorization_bridge_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgeInput {
  sourceRouteToLiveEnqueueAuthorizationBridgePacket?: Record<string, unknown>
  sourceServiceRoleQueueSmokeAuthorizationPacket?: Record<string, unknown>
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationCandidate {
  bridgeId: string
  routeToLiveEnqueueBridgeId: string
  authorizationId: string
  requestId: string
  toolId: AiGraphicsCanonicalToolId
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  method: 'POST'
  queueName: 'ai_graphics_external_beta_tool_runtime'
  queueJobType: 'ai_graphics_tool_runtime'
  queueJobStatus: 'prepared_not_submitted'
  runtimeTarget: string
  workerType: string
  sourceRouteToLiveEnqueueAuthorizationAccepted: true
  sourceServiceRoleQueueSmokeAuthorizationAccepted: true
  sourceServiceRoleQueueSmokeAuthorizationRecordedWithProvidedEvidence: true
  routeBoundServiceRoleQueueSmokeAuthorizationMode:
    'route_live_enqueue_scope_matched_to_service_role_smoke_authorization_not_executed'
  approvedPlanSnapshotBindingRequired: true
  creditReservationBindingRequired: true
  privateArtifactManifestBindingRequired: true
  idempotencyBindingRequired: true
  serviceRoleQueueAuthorizationRequired: true
  routeExecutionWindowRequiredLater: true
  liveQueueWriteWindowRequiredLater: true
  cleanupPlanRequiredForLaterSmoke: true
  rollbackPlanRequiredForLaterSmoke: true
  telemetryRequiredForLaterSmoke: true
  costCeilingRequiredForLaterSmoke: true
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  apiRouteMountedNow: false
  apiRouteExecutionApprovedNow: false
  routeExecutionPerformed: false
  routeBoundServiceRoleQueueSmokeAuthorizationApprovedNow: false
  serviceRoleQueueSmokeApprovedNow: false
  serviceRoleQueueSmokePerformed: false
  backendQueueSubmissionApprovedNow: false
  backendQueueSubmissionPerformed: false
  serviceRoleQueueTransactionApprovedNow: false
  serviceRoleTransactionPerformed: false
  liveQueueWriteApprovedNow: false
  liveQueueWritePerformed: false
  workerEnqueueApprovedNow: false
  workerEnqueuePerformed: false
  workerLeaseCreated: false
  workerDispatchApprovedNow: false
  workerDispatchPerformed: false
  toolExecutionApprovedNow: false
  toolExecutionPerformed: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

export interface AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridge {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_BRIDGE_DECISION
  status: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgeStatus
  rejectionReasons: string[]
  sourceRouteToLiveEnqueueAuthorizationBridgeDecision: string | null
  sourceRouteToLiveEnqueueAuthorizationBridgeAccepted: boolean
  sourceServiceRoleQueueSmokeAuthorizationDecision: string | null
  sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
  routeBoundServiceRoleQueueSmokeAuthorizationCandidates:
    AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationCandidate[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  routeBoundServiceRoleQueueSmokeAuthorizationBridgeReadyToolsWithProvidedEvidence: 0 | 21
  sourceRouteToLiveEnqueueAuthorizationBridgeReadyToolsWithProvidedEvidence: 0 | 21
  sourceServiceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence: 0 | 21
  routeBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence: 0 | 21
  cpuStaticRouteBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence: 0 | 13
  gpuModelRouteBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence: 0 | 8
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  routeBoundServiceRoleQueueSmokeAuthorizationsApprovedNow: 0
  serviceRoleQueueSmokeApprovedNowTools: 0
  serviceRoleQueueSmokesPerformedNowTools: 0
  backendQueueSubmissionApprovedNowTools: 0
  serviceRoleQueueTransactionApprovedNowTools: 0
  liveQueueWriteApprovedNowTools: 0
  liveQueueWritesPerformedNowTools: 0
  workerEnqueueApprovedNowTools: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0 | 8
  gpuRuntimeShouldStartNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  routeBoundServiceRoleQueueSmokeAuthorizationPolicy: {
    privateRouteBoundServiceRoleQueueSmokeAuthorizationBridgeOnly: true
    sourceRouteToLiveEnqueueAuthorizationBridgeRequired: true
    sourceServiceRoleQueueSmokeAuthorizationRequired: true
    queueJobPreparedNotSubmittedOnly: true
    noApiRouteExecution: true
    noServiceRoleQueueSmoke: true
    noBackendQueueSubmission: true
    noServiceRoleTransaction: true
    noLiveQueueWrite: true
    noWorkerEnqueue: true
    noWorkerDispatch: true
    noToolExecution: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  allowedBridgeActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgePrepared: true
    sourceRouteToLiveEnqueueAuthorizationBridgeAccepted: boolean
    sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
    routeBoundServiceRoleQueueSmokeAuthorizationCandidatesAccepted: boolean
    routeBoundServiceRoleQueueSmokeAuthorizationBridgeReadyWithProvidedEvidence: boolean
    cpuStaticRouteBoundServiceRoleQueueSmokeAuthorizationAccepted: boolean
    gpuModelRouteBoundServiceRoleQueueSmokeAuthorizationAccepted: boolean
    serviceRoleQueueSmokeAuthorizationRecordAcceptedFromSource: boolean
    privateRouteBoundServiceRoleQueueSmokeAuthorizationBridgeOnly: true
    queueJobPreparedNotSubmittedOnly: true
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    apiRouteMountedNow: false
    expressRouteMountedInAppNow: false
    apiRouteExecutionApprovedNow: false
    apiRouteExecutionPerformed: false
    routeExecutionApprovedNow: false
    routeBoundServiceRoleQueueSmokeAuthorizationApprovedNow: false
    serviceRoleQueueSmokeApprovedNow: false
    liveServiceRoleQueueSmokeExecutedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    workerEnqueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    serviceRoleQueueTransactionApprovedNow: false
    liveQueueWriteApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    serviceRoleQueueSmokePerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    liveQueueWritePerformed: false
    workerLeaseCreated: false
    workerDispatchPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const routeBoundServiceRoleQueueSmokeAuthorizationPolicy = {
  privateRouteBoundServiceRoleQueueSmokeAuthorizationBridgeOnly: true,
  sourceRouteToLiveEnqueueAuthorizationBridgeRequired: true,
  sourceServiceRoleQueueSmokeAuthorizationRequired: true,
  queueJobPreparedNotSubmittedOnly: true,
  noApiRouteExecution: true,
  noServiceRoleQueueSmoke: true,
  noBackendQueueSubmission: true,
  noServiceRoleTransaction: true,
  noLiveQueueWrite: true,
  noWorkerEnqueue: true,
  noWorkerDispatch: true,
  noToolExecution: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const allowedBridgeActions = [
  'read accepted route-to-live-enqueue authorization bridge metadata',
  'read accepted all-21 service-role queue smoke authorization metadata',
  'match all 21 route-bound tool candidates to service-role smoke authorization scope',
  'keep queue jobs prepared_not_submitted with no live queue writes',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'app route mount',
  'API route execution',
  'route-bound service-role queue smoke authorization approval now',
  'service-role queue smoke execution now',
  'approved snapshot mutation',
  'credit reservation mutation',
  'private artifact write',
  'backend queue submission',
  'service-role transaction',
  'live queue write',
  'Worker queue enqueue',
  'Worker lease creation',
  'Worker execution',
  'tool execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution now',
  'idle or always-on GPU runtime',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'QA the private route-bound service-role queue smoke authorization bridge while queue writes remain blocked.',
  'Add a route-bound service-role queue smoke preflight/run gate before any live queue write is attempted.',
  'Run one private non-production route-bound service-role queue smoke only after explicit operator authorization.',
]

function countFrom(packet: Record<string, unknown> | undefined, key: string): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const scope = (packet?.scope ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  return typeof value === 'number' ? value :
    typeof counts[key] === 'number' ? counts[key] as number :
    typeof scope[key] === 'number' ? scope[key] as number :
    undefined
}

function booleanFrom(packet: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function stringArrayFrom(packet: Record<string, unknown> | undefined, key: string): string[] {
  const value = packet?.[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function routeToLiveEnqueueAuthorizationBridgeAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_LIVE_ENQUEUE_AUTHORIZATION_BRIDGE_DECISION &&
    packet.status === 'route_to_live_enqueue_authorization_bridge_ready_runtime_still_blocked' &&
    countFrom(packet, 'routeToLiveEnqueueAuthorizationBridgeReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'routeToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence') === 21 &&
    countFrom(packet, 'cpuStaticRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence') === 13 &&
    countFrom(packet, 'gpuModelRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence') === 8 &&
    countFrom(packet, 'liveQueueWritesPerformedNowTools') === 0 &&
    countFrom(packet, 'workerEnqueueApprovedNowTools') === 0 &&
    countFrom(packet, 'workerDispatchesApprovedNow') === 0 &&
    countFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    booleanFrom(packet, 'routeToLiveEnqueueAuthorizationBridgeReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'routeToLiveEnqueueAuthorizationApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'workerEnqueuePerformed') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function serviceRoleQueueSmokeAuthorizationAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_DECISION &&
    countFrom(packet, 'totalAiGraphicsTools') === 21 &&
    countFrom(packet, 'totalProductFacingCapabilities') === 12 &&
    countFrom(packet, 'serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'gpuRuntimeTargetedTools') === 8 &&
    countFrom(packet, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools') === 8 &&
    countFrom(packet, 'serviceRoleQueueSmokeApprovedNowTools') === 0 &&
    countFrom(packet, 'liveQueueWritesApprovedNowTools') === 0 &&
    countFrom(packet, 'liveQueueWritesPerformedNowTools') === 0 &&
    countFrom(packet, 'workerDispatchApprovedNowTools') === 0 &&
    countFrom(packet, 'toolExecutionApprovedNowTools') === 0 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    AI_GRAPHICS_CANONICAL_TOOL_IDS.every((toolId) =>
      stringArrayFrom(packet, 'tools').includes(toolId),
    ) &&
    stringArrayFrom(packet, 'capabilities').length >= 12 &&
    booleanFrom(packet, 'serviceRoleQueueSmokeAuthorizationRecordAccepted') === true &&
    booleanFrom(packet, 'all21ServiceRoleQueueSmokeAuthorizationScopesRecordedWithProvidedEvidence') === true &&
    booleanFrom(packet, 'gpuRuntimeOnDemandOnly') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'serviceRoleQueueSmokeApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'workerDispatchApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function routeCandidateFor(
  packet: Record<string, unknown> | undefined,
  toolId: AiGraphicsCanonicalToolId,
) {
  const candidates = (packet?.routeToLiveEnqueueAuthorizationCandidates ?? []) as Array<Record<string, unknown>>
  return candidates.find((item) => item.toolId === toolId)
}

function candidateReasons(
  routePacket: Record<string, unknown> | undefined,
  serviceRolePacket: Record<string, unknown> | undefined,
): string[] {
  const serviceRoleTools = stringArrayFrom(serviceRolePacket, 'tools')
  const serviceRoleCapabilities = stringArrayFrom(serviceRolePacket, 'capabilities')
  return AI_GRAPHICS_CANONICAL_TOOL_IDS.flatMap((toolId) => {
    const routeCandidate = routeCandidateFor(routePacket, toolId)
    const capabilityId =
      typeof routeCandidate?.capabilityId === 'string'
        ? routeCandidate.capabilityId
        : undefined
    return [
      !routeCandidate ? `missing route-to-live-enqueue authorization candidate for ${toolId}` : undefined,
      !serviceRoleTools.includes(toolId) ? `missing service-role queue smoke authorization tool scope for ${toolId}` : undefined,
      capabilityId && !serviceRoleCapabilities.includes(capabilityId)
        ? `missing service-role queue smoke authorization capability scope for ${capabilityId}`
        : undefined,
      !capabilityId
        ? `route candidate capability missing for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.queueJobStatus !== 'prepared_not_submitted'
        ? `route candidate queue status is not prepared_not_submitted for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.liveQueueWritePerformed !== false
        ? `route candidate live queue write was performed for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.workerEnqueuePerformed !== false
        ? `route candidate worker enqueue was performed for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.workerDispatchPerformed !== false
        ? `route candidate worker dispatch was performed for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.toolExecutionPerformed !== false
        ? `route candidate tool execution was performed for ${toolId}`
        : undefined,
      routeCandidate && routeCandidate.gpuRuntimeShouldStartNow !== false
        ? `GPU runtime should not start now for ${toolId}`
        : undefined,
    ].filter((reason): reason is string => Boolean(reason))
  })
}

function statusFromInput(input: {
  hasRoute: boolean
  routeAccepted: boolean
  hasServiceRole: boolean
  serviceRoleAccepted: boolean
  candidateReasons: string[]
}): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgeStatus {
  if (!input.hasRoute) return 'missing_route_to_live_enqueue_authorization_bridge_packet'
  if (!input.routeAccepted) return 'route_to_live_enqueue_authorization_bridge_rejected'
  if (!input.hasServiceRole) return 'missing_service_role_queue_smoke_authorization_packet'
  if (!input.serviceRoleAccepted) return 'service_role_queue_smoke_authorization_rejected'
  if (input.candidateReasons.length > 0) {
    return 'route_bound_service_role_queue_smoke_candidate_rejected'
  }
  return 'route_bound_service_role_queue_smoke_authorization_bridge_ready_runtime_still_blocked'
}

function buildCandidate(
  routeCandidate: Record<string, unknown>,
): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationCandidate {
  const toolId = routeCandidate.toolId as AiGraphicsCanonicalToolId
  return {
    bridgeId: `route-bound-service-role-queue-smoke-authorization-${toolId}`,
    routeToLiveEnqueueBridgeId: routeCandidate.bridgeId as string,
    authorizationId: routeCandidate.authorizationId as string,
    requestId: routeCandidate.requestId as string,
    toolId,
    capabilityId: routeCandidate.capabilityId as string,
    routePath: routeCandidate.routePath as '/api/ai-graphics/external-beta/tool-call',
    method: 'POST',
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    queueJobStatus: 'prepared_not_submitted',
    runtimeTarget: routeCandidate.runtimeTarget as string,
    workerType: routeCandidate.workerType as string,
    sourceRouteToLiveEnqueueAuthorizationAccepted: true,
    sourceServiceRoleQueueSmokeAuthorizationAccepted: true,
    sourceServiceRoleQueueSmokeAuthorizationRecordedWithProvidedEvidence: true,
    routeBoundServiceRoleQueueSmokeAuthorizationMode:
      'route_live_enqueue_scope_matched_to_service_role_smoke_authorization_not_executed',
    approvedPlanSnapshotBindingRequired: true,
    creditReservationBindingRequired: true,
    privateArtifactManifestBindingRequired: true,
    idempotencyBindingRequired: true,
    serviceRoleQueueAuthorizationRequired: true,
    routeExecutionWindowRequiredLater: true,
    liveQueueWriteWindowRequiredLater: true,
    cleanupPlanRequiredForLaterSmoke: true,
    rollbackPlanRequiredForLaterSmoke: true,
    telemetryRequiredForLaterSmoke: true,
    costCeilingRequiredForLaterSmoke: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      routeCandidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
    gpuRuntimeShouldStartNow: false,
    apiRouteMountedNow: false,
    apiRouteExecutionApprovedNow: false,
    routeExecutionPerformed: false,
    routeBoundServiceRoleQueueSmokeAuthorizationApprovedNow: false,
    serviceRoleQueueSmokeApprovedNow: false,
    serviceRoleQueueSmokePerformed: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleQueueTransactionApprovedNow: false,
    serviceRoleTransactionPerformed: false,
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformed: false,
    workerEnqueueApprovedNow: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchApprovedNow: false,
    workerDispatchPerformed: false,
    toolExecutionApprovedNow: false,
    toolExecutionPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

export function evaluateAiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridge(
  input: AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgeInput = {},
): AiGraphicsExternalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridge {
  const routeAccepted = routeToLiveEnqueueAuthorizationBridgeAccepted(
    input.sourceRouteToLiveEnqueueAuthorizationBridgePacket,
  )
  const serviceRoleAccepted = serviceRoleQueueSmokeAuthorizationAccepted(
    input.sourceServiceRoleQueueSmokeAuthorizationPacket,
  )
  const reasons = candidateReasons(
    input.sourceRouteToLiveEnqueueAuthorizationBridgePacket,
    input.sourceServiceRoleQueueSmokeAuthorizationPacket,
  )
  const status = statusFromInput({
    hasRoute: Boolean(input.sourceRouteToLiveEnqueueAuthorizationBridgePacket),
    routeAccepted,
    hasServiceRole: Boolean(input.sourceServiceRoleQueueSmokeAuthorizationPacket),
    serviceRoleAccepted,
    candidateReasons: reasons,
  })
  const ready =
    status ===
      'route_bound_service_role_queue_smoke_authorization_bridge_ready_runtime_still_blocked'
  const routeBoundServiceRoleQueueSmokeAuthorizationCandidates = ready
    ? AI_GRAPHICS_CANONICAL_TOOL_IDS.map((toolId) =>
        buildCandidate(
          routeCandidateFor(input.sourceRouteToLiveEnqueueAuthorizationBridgePacket, toolId)!,
        ),
      )
    : []
  const cpuStaticCandidateCount =
    routeBoundServiceRoleQueueSmokeAuthorizationCandidates.filter(
      (item) => !item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    ).length
  const gpuModelCandidateCount =
    routeBoundServiceRoleQueueSmokeAuthorizationCandidates.filter(
      (item) => item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    ).length
  const cpuStaticAccepted = cpuStaticCandidateCount === 13
  const gpuModelAccepted = gpuModelCandidateCount === 8

  const rejectionReasons = [
    !input.sourceRouteToLiveEnqueueAuthorizationBridgePacket
      ? 'accepted route-to-live-enqueue authorization bridge packet is missing'
      : undefined,
    input.sourceRouteToLiveEnqueueAuthorizationBridgePacket && !routeAccepted
      ? 'route-to-live-enqueue authorization bridge packet is not accepted'
      : undefined,
    !input.sourceServiceRoleQueueSmokeAuthorizationPacket
      ? 'accepted service-role queue smoke authorization packet is missing'
      : undefined,
    input.sourceServiceRoleQueueSmokeAuthorizationPacket && !serviceRoleAccepted
      ? 'service-role queue smoke authorization packet is not accepted'
      : undefined,
    ...reasons,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_ROUTE_BOUND_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_BRIDGE_DECISION,
    status,
    rejectionReasons,
    sourceRouteToLiveEnqueueAuthorizationBridgeDecision:
      typeof input.sourceRouteToLiveEnqueueAuthorizationBridgePacket?.decision === 'string'
        ? input.sourceRouteToLiveEnqueueAuthorizationBridgePacket.decision
        : null,
    sourceRouteToLiveEnqueueAuthorizationBridgeAccepted: routeAccepted,
    sourceServiceRoleQueueSmokeAuthorizationDecision:
      typeof input.sourceServiceRoleQueueSmokeAuthorizationPacket?.decision === 'string'
        ? input.sourceServiceRoleQueueSmokeAuthorizationPacket.decision
        : null,
    sourceServiceRoleQueueSmokeAuthorizationAccepted: serviceRoleAccepted,
    routeBoundServiceRoleQueueSmokeAuthorizationCandidates,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    routeBoundServiceRoleQueueSmokeAuthorizationBridgeReadyToolsWithProvidedEvidence:
      ready ? 21 : 0,
    sourceRouteToLiveEnqueueAuthorizationBridgeReadyToolsWithProvidedEvidence:
      routeAccepted ? 21 : 0,
    sourceServiceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence:
      serviceRoleAccepted ? 21 : 0,
    routeBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence:
      ready ? 21 : 0,
    cpuStaticRouteBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence:
      cpuStaticAccepted ? 13 : 0,
    gpuModelRouteBoundServiceRoleQueueSmokeAuthorizationCandidatesWithProvidedEvidence:
      gpuModelAccepted ? 8 : 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    routeBoundServiceRoleQueueSmokeAuthorizationsApprovedNow: 0,
    serviceRoleQueueSmokeApprovedNowTools: 0,
    serviceRoleQueueSmokesPerformedNowTools: 0,
    backendQueueSubmissionApprovedNowTools: 0,
    serviceRoleQueueTransactionApprovedNowTools: 0,
    liveQueueWriteApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
      routeAccepted && serviceRoleAccepted ? 8 : 0,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    routeBoundServiceRoleQueueSmokeAuthorizationPolicy,
    allowedBridgeActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaRouteBoundServiceRoleQueueSmokeAuthorizationBridgePrepared: true,
      sourceRouteToLiveEnqueueAuthorizationBridgeAccepted: routeAccepted,
      sourceServiceRoleQueueSmokeAuthorizationAccepted: serviceRoleAccepted,
      routeBoundServiceRoleQueueSmokeAuthorizationCandidatesAccepted: ready,
      routeBoundServiceRoleQueueSmokeAuthorizationBridgeReadyWithProvidedEvidence:
        ready,
      cpuStaticRouteBoundServiceRoleQueueSmokeAuthorizationAccepted:
        cpuStaticAccepted,
      gpuModelRouteBoundServiceRoleQueueSmokeAuthorizationAccepted:
        gpuModelAccepted,
      serviceRoleQueueSmokeAuthorizationRecordAcceptedFromSource:
        booleanFrom(
          input.sourceServiceRoleQueueSmokeAuthorizationPacket,
          'serviceRoleQueueSmokeAuthorizationRecordAccepted',
        ) === true,
      privateRouteBoundServiceRoleQueueSmokeAuthorizationBridgeOnly: true,
      queueJobPreparedNotSubmittedOnly: true,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      apiRouteMountedNow: false,
      expressRouteMountedInAppNow: false,
      apiRouteExecutionApprovedNow: false,
      apiRouteExecutionPerformed: false,
      routeExecutionApprovedNow: false,
      routeBoundServiceRoleQueueSmokeAuthorizationApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      workerEnqueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      liveQueueWritePerformed: false,
      workerLeaseCreated: false,
      workerDispatchPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
