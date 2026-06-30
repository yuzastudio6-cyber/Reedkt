import {
  AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_QUEUE_AUTHORIZATION_BRIDGE_DECISION,
} from './ai-graphics-external-beta-route-to-queue-authorization-bridge'
import {
  AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION,
} from '../tool-registry/ai-graphics-external-beta-live-enqueue-authorization'

export const AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_LIVE_ENQUEUE_AUTHORIZATION_BRIDGE_DECISION =
  'ai_graphics_external_beta_route_to_live_enqueue_authorization_bridge_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeStatus =
  | 'missing_route_to_queue_authorization_bridge_packet'
  | 'route_to_queue_authorization_bridge_rejected'
  | 'missing_live_enqueue_authorization_packet'
  | 'live_enqueue_authorization_rejected'
  | 'route_to_live_enqueue_candidate_rejected'
  | 'route_to_live_enqueue_authorization_bridge_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeInput {
  sourceRouteToQueueAuthorizationBridgePacket?: Record<string, unknown>
  sourceLiveEnqueueAuthorizationPacket?: Record<string, unknown>
}

export interface AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationCandidate {
  bridgeId: string
  authorizationId: string
  requestId: string
  toolId: 'd3' | 'sam2'
  capabilityId: 'chart_overlay' | 'subject_segmentation'
  routePath: '/api/ai-graphics/external-beta/tool-call'
  method: 'POST'
  queueName: 'ai_graphics_external_beta_tool_runtime'
  queueJobType: 'ai_graphics_tool_runtime'
  queueJobStatus: 'prepared_not_submitted'
  runtimeTarget: string
  workerType: 'render_worker' | 'gpu_ai_worker'
  sourceRouteToQueueAuthorizationAccepted: true
  sourceLiveEnqueueAuthorizationAccepted: true
  sourceLiveEnqueueAuthorizationRecordedWithProvidedEvidence: true
  routeToLiveEnqueueAuthorizationMode: 'route_authorization_matched_to_live_enqueue_scope_not_enqueued'
  approvedPlanSnapshotBindingRequired: true
  creditReservationBindingRequired: true
  privateArtifactManifestBindingRequired: true
  idempotencyBindingRequired: true
  serviceRoleQueueAuthorizationRequired: true
  liveQueueWriteWindowRequiredLater: true
  cleanupPlanRequiredForLaterSmoke: true
  rollbackPlanRequiredForLaterSmoke: true
  costCeilingRequiredForLaterSmoke: true
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  apiRouteMountedNow: false
  apiRouteExecutionApprovedNow: false
  routeExecutionPerformed: false
  routeToQueueAuthorizationApprovedNow: false
  routeToLiveEnqueueAuthorizationApprovedNow: false
  backendQueueSubmissionApprovedNow: false
  backendQueueSubmissionPerformed: false
  liveQueueWriteApprovedNow: false
  liveQueueWritePerformed: false
  workerEnqueueApprovedNow: false
  workerEnqueuePerformed: false
  workerLeaseCreated: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
  publicArtifactCreated: false
  signedUrlCreated: false
}

export interface AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridge {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_LIVE_ENQUEUE_AUTHORIZATION_BRIDGE_DECISION
  status: AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeStatus
  rejectionReasons: string[]
  sourceRouteToQueueAuthorizationBridgeDecision: string | null
  sourceRouteToQueueAuthorizationBridgeAccepted: boolean
  sourceLiveEnqueueAuthorizationDecision: string | null
  sourceLiveEnqueueAuthorizationAccepted: boolean
  routeToLiveEnqueueAuthorizationCandidates:
    AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationCandidate[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  routeToLiveEnqueueAuthorizationBridgeReadyToolsWithProvidedEvidence: 0 | 21
  sourceRouteToQueueAuthorizationBridgeReadyToolsWithProvidedEvidence: 0 | 21
  sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence: 0 | 21
  routeToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence: 0 | 2
  cpuStaticRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence: 0 | 1
  gpuModelRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence: 0 | 1
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  routeToQueueAuthorizationsApprovedNow: 0
  routeToLiveEnqueueAuthorizationsApprovedNow: 0
  backendQueueSubmissionApprovedNowTools: 0
  liveQueueWriteApprovedNowTools: 0
  liveQueueWritesPerformedNowTools: 0
  workerEnqueueApprovedNowTools: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0 | 8
  gpuRuntimeShouldStartNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  routeToLiveEnqueueAuthorizationPolicy: {
    privateRouteToLiveEnqueueAuthorizationBridgeOnly: true
    sourceRouteToQueueAuthorizationRequired: true
    sourceLiveEnqueueAuthorizationRequired: true
    queueJobPreparedNotSubmittedOnly: true
    noApiRouteExecution: true
    noBackendQueueSubmission: true
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
    externalBetaRouteToLiveEnqueueAuthorizationBridgePrepared: true
    sourceRouteToQueueAuthorizationBridgeAccepted: boolean
    sourceLiveEnqueueAuthorizationAccepted: boolean
    routeToLiveEnqueueAuthorizationCandidatesAccepted: boolean
    routeToLiveEnqueueAuthorizationBridgeReadyWithProvidedEvidence: boolean
    cpuStaticRouteToLiveEnqueueAuthorizationAccepted: boolean
    gpuModelRouteToLiveEnqueueAuthorizationAccepted: boolean
    privateRouteToLiveEnqueueAuthorizationBridgeOnly: true
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
    routeToQueueAuthorizationApprovedNow: false
    routeToLiveEnqueueAuthorizationApprovedNow: false
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
    serviceRoleTransactionPerformed: false
    serviceRoleQueueSmokePerformed: false
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

const routeToLiveEnqueueAuthorizationPolicy = {
  privateRouteToLiveEnqueueAuthorizationBridgeOnly: true,
  sourceRouteToQueueAuthorizationRequired: true,
  sourceLiveEnqueueAuthorizationRequired: true,
  queueJobPreparedNotSubmittedOnly: true,
  noApiRouteExecution: true,
  noBackendQueueSubmission: true,
  noLiveQueueWrite: true,
  noWorkerEnqueue: true,
  noWorkerDispatch: true,
  noToolExecution: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const allowedBridgeActions = [
  'read accepted route-to-queue authorization bridge metadata',
  'read accepted all-21 live-enqueue authorization metadata',
  'match route candidates for d3 and sam2 to live-enqueue authorization scope',
  'keep queue jobs prepared_not_submitted with no live queue writes',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'app route mount',
  'API route execution',
  'route-to-queue authorization approval now',
  'route-to-live-enqueue authorization approval now',
  'approved snapshot mutation',
  'credit reservation mutation',
  'private artifact write',
  'backend queue submission',
  'live queue write',
  'service-role transaction',
  'service-role queue smoke',
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
  'QA the private route-to-live-enqueue authorization bridge while queue writes remain blocked.',
  'Add a route-bound service-role queue smoke authorization bridge before any live queue write is attempted.',
  'Run a single private non-production service-role queue smoke only after explicit operator authorization.',
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

function routeToQueueAuthorizationAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_QUEUE_AUTHORIZATION_BRIDGE_DECISION &&
    packet.status === 'route_to_queue_authorization_bridge_ready_runtime_still_blocked' &&
    countFrom(packet, 'routeToQueueAuthorizationBridgeReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'routeToQueueAuthorizationCandidatesWithProvidedEvidence') === 2 &&
    countFrom(packet, 'cpuStaticRouteToQueueAuthorizationCandidatesWithProvidedEvidence') === 1 &&
    countFrom(packet, 'gpuModelRouteToQueueAuthorizationCandidatesWithProvidedEvidence') === 1 &&
    countFrom(packet, 'liveQueueWriteApprovedNowTools') === 0 &&
    countFrom(packet, 'workerEnqueueApprovedNowTools') === 0 &&
    countFrom(packet, 'workerDispatchesApprovedNow') === 0 &&
    countFrom(packet, 'toolExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    booleanFrom(packet, 'routeToQueueAuthorizationBridgeReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'routeToQueueAuthorizationApprovedNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'workerEnqueuePerformed') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function liveEnqueueAuthorizationAccepted(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_LIVE_ENQUEUE_AUTHORIZATION_DECISION &&
    countFrom(packet, 'totalAiGraphicsTools') === 21 &&
    countFrom(packet, 'totalProductFacingCapabilities') === 12 &&
    countFrom(packet, 'liveEnqueueAuthorizationCandidateToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'liveEnqueueAuthorizationRecordedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'gpuRuntimeTargetedTools') === 8 &&
    countFrom(packet, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools') === 8 &&
    countFrom(packet, 'liveQueueWritesApprovedNowTools') === 0 &&
    countFrom(packet, 'liveQueueWritesPerformedNowTools') === 0 &&
    countFrom(packet, 'workerDispatchApprovedNowTools') === 0 &&
    countFrom(packet, 'toolExecutionApprovedNowTools') === 0 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    stringArrayFrom(packet, 'tools').includes('d3') &&
    stringArrayFrom(packet, 'tools').includes('sam2') &&
    stringArrayFrom(packet, 'capabilities').includes('chart_overlay') &&
    stringArrayFrom(packet, 'capabilities').includes('subject_segmentation') &&
    booleanFrom(packet, 'liveEnqueueAuthorizationRecordAccepted') === true &&
    booleanFrom(packet, 'all21LiveEnqueueAuthorizationScopesRecordedWithProvidedEvidence') === true &&
    booleanFrom(packet, 'gpuRuntimeOnDemandOnly') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'liveQueueWriteApprovedNow') === false &&
    booleanFrom(packet, 'workerDispatchApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function routeCandidateFor(packet: Record<string, unknown> | undefined, toolId: 'd3' | 'sam2') {
  const candidates = (packet?.routeToQueueAuthorizationCandidates ?? []) as Array<Record<string, unknown>>
  return candidates.find((item) => item.toolId === toolId)
}

function candidateReasons(
  routePacket: Record<string, unknown> | undefined,
  livePacket: Record<string, unknown> | undefined,
): string[] {
  const liveTools = stringArrayFrom(livePacket, 'tools')
  const liveCapabilities = stringArrayFrom(livePacket, 'capabilities')
  return (['d3', 'sam2'] as const).flatMap((toolId) => {
    const routeCandidate = routeCandidateFor(routePacket, toolId)
    const capabilityId = toolId === 'd3' ? 'chart_overlay' : 'subject_segmentation'
    return [
      !routeCandidate ? `missing route-to-queue authorization candidate for ${toolId}` : undefined,
      !liveTools.includes(toolId) ? `missing live-enqueue authorization tool scope for ${toolId}` : undefined,
      !liveCapabilities.includes(capabilityId) ? `missing live-enqueue authorization capability scope for ${capabilityId}` : undefined,
      routeCandidate && routeCandidate.capabilityId !== capabilityId
        ? `route candidate capability mismatch for ${toolId}`
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
  hasLive: boolean
  liveAccepted: boolean
  candidateReasons: string[]
}): AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeStatus {
  if (!input.hasRoute) return 'missing_route_to_queue_authorization_bridge_packet'
  if (!input.routeAccepted) return 'route_to_queue_authorization_bridge_rejected'
  if (!input.hasLive) return 'missing_live_enqueue_authorization_packet'
  if (!input.liveAccepted) return 'live_enqueue_authorization_rejected'
  if (input.candidateReasons.length > 0) return 'route_to_live_enqueue_candidate_rejected'
  return 'route_to_live_enqueue_authorization_bridge_ready_runtime_still_blocked'
}

function buildCandidate(
  routeCandidate: Record<string, unknown>,
): AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationCandidate {
  const toolId = routeCandidate.toolId as 'd3' | 'sam2'
  return {
    bridgeId: `route-to-live-enqueue-authorization-${toolId}`,
    authorizationId: routeCandidate.authorizationId as string,
    requestId: routeCandidate.requestId as string,
    toolId,
    capabilityId: routeCandidate.capabilityId as 'chart_overlay' | 'subject_segmentation',
    routePath: routeCandidate.routePath as '/api/ai-graphics/external-beta/tool-call',
    method: 'POST',
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueJobType: 'ai_graphics_tool_runtime',
    queueJobStatus: 'prepared_not_submitted',
    runtimeTarget: routeCandidate.runtimeTarget as string,
    workerType: routeCandidate.workerType as 'render_worker' | 'gpu_ai_worker',
    sourceRouteToQueueAuthorizationAccepted: true,
    sourceLiveEnqueueAuthorizationAccepted: true,
    sourceLiveEnqueueAuthorizationRecordedWithProvidedEvidence: true,
    routeToLiveEnqueueAuthorizationMode: 'route_authorization_matched_to_live_enqueue_scope_not_enqueued',
    approvedPlanSnapshotBindingRequired: true,
    creditReservationBindingRequired: true,
    privateArtifactManifestBindingRequired: true,
    idempotencyBindingRequired: true,
    serviceRoleQueueAuthorizationRequired: true,
    liveQueueWriteWindowRequiredLater: true,
    cleanupPlanRequiredForLaterSmoke: true,
    rollbackPlanRequiredForLaterSmoke: true,
    costCeilingRequiredForLaterSmoke: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      routeCandidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
    gpuRuntimeShouldStartNow: false,
    apiRouteMountedNow: false,
    apiRouteExecutionApprovedNow: false,
    routeExecutionPerformed: false,
    routeToQueueAuthorizationApprovedNow: false,
    routeToLiveEnqueueAuthorizationApprovedNow: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformed: false,
    workerEnqueueApprovedNow: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
    publicArtifactCreated: false,
    signedUrlCreated: false,
  }
}

export function evaluateAiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridge(
  input: AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeInput = {},
): AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridge {
  const routeAccepted = routeToQueueAuthorizationAccepted(
    input.sourceRouteToQueueAuthorizationBridgePacket,
  )
  const liveAccepted = liveEnqueueAuthorizationAccepted(
    input.sourceLiveEnqueueAuthorizationPacket,
  )
  const reasons = candidateReasons(
    input.sourceRouteToQueueAuthorizationBridgePacket,
    input.sourceLiveEnqueueAuthorizationPacket,
  )
  const status = statusFromInput({
    hasRoute: Boolean(input.sourceRouteToQueueAuthorizationBridgePacket),
    routeAccepted,
    hasLive: Boolean(input.sourceLiveEnqueueAuthorizationPacket),
    liveAccepted,
    candidateReasons: reasons,
  })
  const ready =
    status === 'route_to_live_enqueue_authorization_bridge_ready_runtime_still_blocked'
  const routeToLiveEnqueueAuthorizationCandidates = ready
    ? (['d3', 'sam2'] as const).map((toolId) =>
        buildCandidate(routeCandidateFor(input.sourceRouteToQueueAuthorizationBridgePacket, toolId)!),
      )
    : []
  const cpuStaticAccepted =
    routeToLiveEnqueueAuthorizationCandidates.some((item) => item.toolId === 'd3' && !item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)
  const gpuModelAccepted =
    routeToLiveEnqueueAuthorizationCandidates.some((item) => item.toolId === 'sam2' && item.gpuRuntimeStartAllowedForAcceptedExternalBetaJob)

  const rejectionReasons = [
    !input.sourceRouteToQueueAuthorizationBridgePacket
      ? 'accepted route-to-queue authorization bridge packet is missing'
      : undefined,
    input.sourceRouteToQueueAuthorizationBridgePacket && !routeAccepted
      ? 'route-to-queue authorization bridge packet is not accepted'
      : undefined,
    !input.sourceLiveEnqueueAuthorizationPacket
      ? 'accepted live-enqueue authorization packet is missing'
      : undefined,
    input.sourceLiveEnqueueAuthorizationPacket && !liveAccepted
      ? 'live-enqueue authorization packet is not accepted'
      : undefined,
    ...reasons,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_ROUTE_TO_LIVE_ENQUEUE_AUTHORIZATION_BRIDGE_DECISION,
    status,
    rejectionReasons,
    sourceRouteToQueueAuthorizationBridgeDecision:
      typeof input.sourceRouteToQueueAuthorizationBridgePacket?.decision === 'string'
        ? input.sourceRouteToQueueAuthorizationBridgePacket.decision
        : null,
    sourceRouteToQueueAuthorizationBridgeAccepted: routeAccepted,
    sourceLiveEnqueueAuthorizationDecision:
      typeof input.sourceLiveEnqueueAuthorizationPacket?.decision === 'string'
        ? input.sourceLiveEnqueueAuthorizationPacket.decision
        : null,
    sourceLiveEnqueueAuthorizationAccepted: liveAccepted,
    routeToLiveEnqueueAuthorizationCandidates,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    routeToLiveEnqueueAuthorizationBridgeReadyToolsWithProvidedEvidence: ready ? 21 : 0,
    sourceRouteToQueueAuthorizationBridgeReadyToolsWithProvidedEvidence:
      routeAccepted ? 21 : 0,
    sourceLiveEnqueueAuthorizationRecordedToolsWithProvidedEvidence:
      liveAccepted ? 21 : 0,
    routeToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence: ready ? 2 : 0,
    cpuStaticRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence:
      cpuStaticAccepted ? 1 : 0,
    gpuModelRouteToLiveEnqueueAuthorizationCandidatesWithProvidedEvidence:
      gpuModelAccepted ? 1 : 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    routeToQueueAuthorizationsApprovedNow: 0,
    routeToLiveEnqueueAuthorizationsApprovedNow: 0,
    backendQueueSubmissionApprovedNowTools: 0,
    liveQueueWriteApprovedNowTools: 0,
    liveQueueWritesPerformedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: routeAccepted && liveAccepted ? 8 : 0,
    gpuRuntimeShouldStartNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    routeToLiveEnqueueAuthorizationPolicy,
    allowedBridgeActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaRouteToLiveEnqueueAuthorizationBridgePrepared: true,
      sourceRouteToQueueAuthorizationBridgeAccepted: routeAccepted,
      sourceLiveEnqueueAuthorizationAccepted: liveAccepted,
      routeToLiveEnqueueAuthorizationCandidatesAccepted: ready,
      routeToLiveEnqueueAuthorizationBridgeReadyWithProvidedEvidence: ready,
      cpuStaticRouteToLiveEnqueueAuthorizationAccepted: cpuStaticAccepted,
      gpuModelRouteToLiveEnqueueAuthorizationAccepted: gpuModelAccepted,
      privateRouteToLiveEnqueueAuthorizationBridgeOnly: true,
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
      routeToQueueAuthorizationApprovedNow: false,
      routeToLiveEnqueueAuthorizationApprovedNow: false,
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
      serviceRoleTransactionPerformed: false,
      serviceRoleQueueSmokePerformed: false,
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

export function buildAiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeInput(
  sourceRouteToQueueAuthorizationBridgePacket: Record<string, unknown>,
  sourceLiveEnqueueAuthorizationPacket: Record<string, unknown>,
): AiGraphicsExternalBetaRouteToLiveEnqueueAuthorizationBridgeInput {
  return {
    sourceRouteToQueueAuthorizationBridgePacket,
    sourceLiveEnqueueAuthorizationPacket,
  }
}
