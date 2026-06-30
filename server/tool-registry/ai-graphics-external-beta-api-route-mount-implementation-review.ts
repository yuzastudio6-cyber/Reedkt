import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_READINESS_DECISION,
} from './ai-graphics-external-beta-api-route-mount-readiness'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_REVIEW_DECISION =
  'ai_graphics_external_beta_api_route_mount_implementation_review_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteMountImplementationReviewStatus =
  | 'missing_route_mount_readiness_packet'
  | 'route_mount_readiness_rejected'
  | 'route_mount_implementation_review_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteMountImplementationReviewInput {
  sourceRouteMountReadinessPacket?: Record<string, unknown>
  routeImplementationFileRef?: string
  appMountFileRef?: string
  sourceControlledRoutePath?: '/api/ai-graphics/external-beta/tool-call'
}

export interface AiGraphicsExternalBetaApiRouteMountImplementationReview {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_REVIEW_DECISION
  status: AiGraphicsExternalBetaApiRouteMountImplementationReviewStatus
  rejectionReasons: string[]
  sourceRouteMountReadinessDecision: string | null
  sourceRouteMountReadinessAccepted: boolean
  sourceControlledRouteImplementationReviewed: boolean
  appMountStillDeferred: true
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  apiRouteMountImplementationReadyToolsWithProvidedEvidence: 0 | 21
  apiRouteMountReadyToolsWithProvidedEvidence: 0 | 21
  routeHandlerGatewayFullProofToolsWithProvidedEvidence: 0 | 21
  runtimeAdmissionAcceptedToolsWithProvidedEvidence: 0 | 21
  gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence: 0 | 21
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools: 0 | 8
  gpuRuntimeShouldStartNowTools: 0
  apiRouteMountedNowTools: 0
  routeExecutionsApprovedNow: 0
  liveQueueWriteApprovedNowTools: 0
  workerEnqueueApprovedNowTools: 0
  workerDispatchesApprovedNow: 0
  toolExecutionsApprovedNow: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  routeImplementationCandidate: {
    routeFile: 'server/routes/ai-graphics-external-beta-tool-call-routes.ts'
    appFile: 'server/app.ts'
    routePath: '/api/ai-graphics/external-beta/tool-call'
    sourceControlledRouteFilePresent: true
    mountedInAppNow: false
    disabledRuntimeHandlerOnly: true
    validatesAll21ToolRequests: true
    requiresFutureAuthAndIdempotency: true
    requiresFutureApprovedSnapshotAndCreditReservation: true
    requiresFuturePrivateArtifactAndQueueAuthorization: true
    onDemandGpuOnly: true
  } | null
  implementationPolicy: {
    sourceControlledRouteFileAllowed: true
    appMountDeferred: true
    runtimeHandlerDisabled: true
    apiRouteExecutionDeferred: true
    queueWriteDeferred: true
    workerEnqueueDeferred: true
    workerDispatchDeferred: true
    toolExecutionDeferred: true
    providerExecutionDeferred: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteMountImplementationReviewPrepared: true
    sourceRouteMountReadinessAccepted: boolean
    sourceControlledRouteImplementationReviewed: boolean
    appMountStillDeferred: true
    apiRouteMountImplementationReadyWithProvidedEvidence: boolean
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
    apiRouteExecutionApprovedNow: false
    apiRouteExecutionPerformed: false
    routeExecutionApprovedNow: false
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

const implementationPolicy = {
  sourceControlledRouteFileAllowed: true,
  appMountDeferred: true,
  runtimeHandlerDisabled: true,
  apiRouteExecutionDeferred: true,
  queueWriteDeferred: true,
  workerEnqueueDeferred: true,
  workerDispatchDeferred: true,
  toolExecutionDeferred: true,
  providerExecutionDeferred: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const blockedRuntimeActions = [
  'app route mount',
  'API route execution',
  'live queue write',
  'Worker queue enqueue',
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
  'Run route mount implementation QA while the route remains unmounted.',
  'Add backend approved snapshot, credit reservation, private artifact, dependency readiness, and queue authorization adapters.',
  'Only after QA, mount the route behind feature flags and keep execution blocked until worker queue authorization is accepted.',
]

function countFrom(packet: Record<string, unknown> | undefined, key: string): number | undefined {
  const counts = (packet?.counts ?? {}) as Record<string, unknown>
  const value = packet?.[key]
  const countValue = counts[key]
  return typeof value === 'number' ? value :
    typeof countValue === 'number' ? countValue :
    undefined
}

function booleanFrom(packet: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const booleans = (packet?.booleans ?? {}) as Record<string, unknown>
  const value = booleans[key]
  return typeof value === 'boolean' ? value : undefined
}

function acceptedRouteMountReadiness(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_READINESS_DECISION &&
    packet.status === 'api_route_mount_ready_with_provided_evidence_runtime_still_blocked' &&
    countFrom(packet, 'apiRouteMountReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'routeHandlerGatewayFullProofToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'runtimeAdmissionAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools') === 8 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    countFrom(packet, 'apiRouteMountedNowTools') === 0 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'apiRouteMountReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'apiRouteMountedNow') === false &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function statusFromInput(input: {
  hasSource: boolean
  sourceAccepted: boolean
}): AiGraphicsExternalBetaApiRouteMountImplementationReviewStatus {
  if (!input.hasSource) return 'missing_route_mount_readiness_packet'
  if (!input.sourceAccepted) return 'route_mount_readiness_rejected'
  return 'route_mount_implementation_review_ready_runtime_still_blocked'
}

export function evaluateAiGraphicsExternalBetaApiRouteMountImplementationReview(
  input: AiGraphicsExternalBetaApiRouteMountImplementationReviewInput = {},
): AiGraphicsExternalBetaApiRouteMountImplementationReview {
  const sourceAccepted = acceptedRouteMountReadiness(input.sourceRouteMountReadinessPacket)
  const routeImplementationReviewed = sourceAccepted &&
    input.routeImplementationFileRef === 'source://server/routes/ai-graphics-external-beta-tool-call-routes.ts' &&
    input.appMountFileRef === 'source://server/app.ts' &&
    input.sourceControlledRoutePath === '/api/ai-graphics/external-beta/tool-call'
  const status = statusFromInput({
    hasSource: Boolean(input.sourceRouteMountReadinessPacket),
    sourceAccepted,
  })
  const rejectionReasons = [
    !input.sourceRouteMountReadinessPacket
      ? 'accepted route mount readiness packet is missing'
      : undefined,
    input.sourceRouteMountReadinessPacket && !sourceAccepted
      ? 'route mount readiness packet is not accepted'
      : undefined,
    sourceAccepted && !routeImplementationReviewed
      ? 'source-controlled route implementation refs are incomplete'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_REVIEW_DECISION,
    status,
    rejectionReasons,
    sourceRouteMountReadinessDecision:
      typeof input.sourceRouteMountReadinessPacket?.decision === 'string'
        ? input.sourceRouteMountReadinessPacket.decision
        : null,
    sourceRouteMountReadinessAccepted: sourceAccepted,
    sourceControlledRouteImplementationReviewed: routeImplementationReviewed,
    appMountStillDeferred: true,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    apiRouteMountImplementationReadyToolsWithProvidedEvidence:
      routeImplementationReviewed ? 21 : 0,
    apiRouteMountReadyToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    routeHandlerGatewayFullProofToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    runtimeAdmissionAcceptedToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence:
      sourceAccepted ? 21 : 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools:
      sourceAccepted ? 8 : 0,
    gpuRuntimeShouldStartNowTools: 0,
    apiRouteMountedNowTools: 0,
    routeExecutionsApprovedNow: 0,
    liveQueueWriteApprovedNowTools: 0,
    workerEnqueueApprovedNowTools: 0,
    workerDispatchesApprovedNow: 0,
    toolExecutionsApprovedNow: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    routeImplementationCandidate: routeImplementationReviewed
      ? {
          routeFile: 'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
          appFile: 'server/app.ts',
          routePath: '/api/ai-graphics/external-beta/tool-call',
          sourceControlledRouteFilePresent: true,
          mountedInAppNow: false,
          disabledRuntimeHandlerOnly: true,
          validatesAll21ToolRequests: true,
          requiresFutureAuthAndIdempotency: true,
          requiresFutureApprovedSnapshotAndCreditReservation: true,
          requiresFuturePrivateArtifactAndQueueAuthorization: true,
          onDemandGpuOnly: true,
        }
      : null,
    implementationPolicy,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteMountImplementationReviewPrepared: true,
      sourceRouteMountReadinessAccepted: sourceAccepted,
      sourceControlledRouteImplementationReviewed: routeImplementationReviewed,
      appMountStillDeferred: true,
      apiRouteMountImplementationReadyWithProvidedEvidence: routeImplementationReviewed,
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
      apiRouteExecutionApprovedNow: false,
      apiRouteExecutionPerformed: false,
      routeExecutionApprovedNow: false,
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

export function buildAiGraphicsExternalBetaApiRouteMountImplementationReviewInput(
  sourceRouteMountReadinessPacket: Record<string, unknown>,
): AiGraphicsExternalBetaApiRouteMountImplementationReviewInput {
  return {
    sourceRouteMountReadinessPacket,
    routeImplementationFileRef: 'source://server/routes/ai-graphics-external-beta-tool-call-routes.ts',
    appMountFileRef: 'source://server/app.ts',
    sourceControlledRoutePath: '/api/ai-graphics/external-beta/tool-call',
  }
}
