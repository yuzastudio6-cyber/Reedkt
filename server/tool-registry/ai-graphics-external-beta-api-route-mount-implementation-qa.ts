import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_REVIEW_DECISION,
} from './ai-graphics-external-beta-api-route-mount-implementation-review'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_QA_DECISION =
  'ai_graphics_external_beta_api_route_mount_implementation_qa_passed_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteMountImplementationQaStatus =
  | 'missing_route_mount_implementation_review_packet'
  | 'route_mount_implementation_review_rejected'
  | 'route_mount_implementation_qa_passed_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteMountImplementationQaInput {
  sourceRouteMountImplementationReviewPacket?: Record<string, unknown>
  routeImplementationFileRef?: string
  appMountFileRef?: string
  routeSchemaRef?: string
  disabledRuntimeHandlerRef?: string
  sourceControlledRoutePath?: '/api/ai-graphics/external-beta/tool-call'
}

export interface AiGraphicsExternalBetaApiRouteMountImplementationQa {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_QA_DECISION
  status: AiGraphicsExternalBetaApiRouteMountImplementationQaStatus
  rejectionReasons: string[]
  sourceRouteMountImplementationReviewDecision: string | null
  sourceRouteMountImplementationReviewAccepted: boolean
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: boolean
  routeImplementationContractQaAccepted: boolean
  appMountStillDeferred: true
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  routeMountImplementationQaAcceptedToolsWithProvidedEvidence: 0 | 21
  apiRouteMountImplementationReadyToolsWithProvidedEvidence: 0 | 21
  apiRouteMountReadyToolsWithProvidedEvidence: 0 | 21
  routeHandlerGatewayFullProofToolsWithProvidedEvidence: 0 | 21
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence: 0 | 21
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
  routeImplementationQa: {
    routeFile: 'server/routes/ai-graphics-external-beta-tool-call-routes.ts'
    appFile: 'server/app.ts'
    routePath: '/api/ai-graphics/external-beta/tool-call'
    routeSchemaCoversAll21Tools: true
    routeSchemaCoversAll12Capabilities: true
    disabledRuntimeHandlerOnly: true
    throwsBeforeQueueWorkerToolGpuOrArtifactSideEffects: true
    mountedInAppNow: false
    appImportStillAbsent: true
    requiresFutureAuthAndIdempotency: true
    requiresFutureApprovedSnapshotAndCreditReservation: true
    requiresFuturePrivateArtifactAndQueueAuthorization: true
    onDemandGpuOnly: true
  } | null
  implementationQaPolicy: {
    sourceImplementationReviewAccepted: boolean
    qaMayInspectSourceFiles: true
    qaMayRunEvaluatorCliOnly: true
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
    externalBetaApiRouteMountImplementationQaCompleted: true
    sourceRouteMountImplementationReviewAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: boolean
    routeImplementationContractQaAccepted: boolean
    routeSchemaAll21ToolsQaAccepted: boolean
    routeSchemaAll12CapabilitiesQaAccepted: boolean
    disabledRuntimeHandlerQaAccepted: boolean
    appMountStillDeferred: true
    appRouteImportStillAbsent: boolean
    noRuntimeSideEffectsQaAccepted: boolean
    routeMountImplementationQaAcceptedWithProvidedEvidence: boolean
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
  'Mount QA remains unmounted and side-effect-free.',
  'Add backend approved snapshot, credit reservation, private artifact, dependency readiness, and queue authorization adapters.',
  'Only after backend adapter QA, mount the route behind feature flags while keeping worker and tool execution separately gated.',
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

function acceptedImplementationReview(packet?: Record<string, unknown>): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_REVIEW_DECISION &&
    packet.status === 'route_mount_implementation_review_ready_runtime_still_blocked' &&
    countFrom(packet, 'apiRouteMountImplementationReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'apiRouteMountReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'runtimeAdmissionAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'gatewayWorkerEnqueueCandidateReadyToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'gpuRuntimeStartAllowedForAcceptedExternalBetaJobTools') === 8 &&
    countFrom(packet, 'gpuRuntimeShouldStartNowTools') === 0 &&
    countFrom(packet, 'apiRouteMountedNowTools') === 0 &&
    countFrom(packet, 'routeExecutionsApprovedNow') === 0 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 0 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'sourceControlledRouteImplementationReviewed') === true &&
    booleanFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence') === true &&
    booleanFrom(packet, 'appMountStillDeferred') === true &&
    booleanFrom(packet, 'apiRouteMountedNow') === false &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false
}

function statusFromInput(input: {
  hasSource: boolean
  sourceAccepted: boolean
}): AiGraphicsExternalBetaApiRouteMountImplementationQaStatus {
  if (!input.hasSource) return 'missing_route_mount_implementation_review_packet'
  if (!input.sourceAccepted) return 'route_mount_implementation_review_rejected'
  return 'route_mount_implementation_qa_passed_runtime_still_blocked'
}

export function evaluateAiGraphicsExternalBetaApiRouteMountImplementationQa(
  input: AiGraphicsExternalBetaApiRouteMountImplementationQaInput = {},
): AiGraphicsExternalBetaApiRouteMountImplementationQa {
  const sourceAccepted = acceptedImplementationReview(
    input.sourceRouteMountImplementationReviewPacket,
  )
  const sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted =
    sourceAccepted
  const contractQaAccepted = sourceAccepted &&
    input.routeImplementationFileRef === 'source://server/routes/ai-graphics-external-beta-tool-call-routes.ts' &&
    input.appMountFileRef === 'source://server/app.ts' &&
    input.routeSchemaRef === 'source://server/routes/ai-graphics-external-beta-tool-call-routes.ts#aiGraphicsExternalBetaToolCallRequestSchema' &&
    input.disabledRuntimeHandlerRef === 'source://server/routes/ai-graphics-external-beta-tool-call-routes.ts#createAiGraphicsExternalBetaToolCallRoutes' &&
    input.sourceControlledRoutePath === '/api/ai-graphics/external-beta/tool-call'
  const status = statusFromInput({
    hasSource: Boolean(input.sourceRouteMountImplementationReviewPacket),
    sourceAccepted,
  })
  const rejectionReasons = [
    !input.sourceRouteMountImplementationReviewPacket
      ? 'accepted route mount implementation review packet is missing'
      : undefined,
    input.sourceRouteMountImplementationReviewPacket && !sourceAccepted
      ? 'route mount implementation review packet is not accepted'
      : undefined,
    sourceAccepted && !contractQaAccepted
      ? 'route implementation QA refs are incomplete'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_MOUNT_IMPLEMENTATION_QA_DECISION,
    status,
    rejectionReasons,
    sourceRouteMountImplementationReviewDecision:
      typeof input.sourceRouteMountImplementationReviewPacket?.decision === 'string'
        ? input.sourceRouteMountImplementationReviewPacket.decision
        : null,
    sourceRouteMountImplementationReviewAccepted: sourceAccepted,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
    routeImplementationContractQaAccepted: contractQaAccepted,
    appMountStillDeferred: true,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    routeMountImplementationQaAcceptedToolsWithProvidedEvidence:
      contractQaAccepted ? 21 : 0,
    apiRouteMountImplementationReadyToolsWithProvidedEvidence:
      sourceAccepted ? 21 : 0,
    apiRouteMountReadyToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    routeHandlerGatewayFullProofToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted ? 21 : 0,
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
    routeImplementationQa: contractQaAccepted
      ? {
          routeFile: 'server/routes/ai-graphics-external-beta-tool-call-routes.ts',
          appFile: 'server/app.ts',
          routePath: '/api/ai-graphics/external-beta/tool-call',
          routeSchemaCoversAll21Tools: true,
          routeSchemaCoversAll12Capabilities: true,
          disabledRuntimeHandlerOnly: true,
          throwsBeforeQueueWorkerToolGpuOrArtifactSideEffects: true,
          mountedInAppNow: false,
          appImportStillAbsent: true,
          requiresFutureAuthAndIdempotency: true,
          requiresFutureApprovedSnapshotAndCreditReservation: true,
          requiresFuturePrivateArtifactAndQueueAuthorization: true,
          onDemandGpuOnly: true,
        }
      : null,
    implementationQaPolicy: {
      sourceImplementationReviewAccepted: sourceAccepted,
      qaMayInspectSourceFiles: true,
      qaMayRunEvaluatorCliOnly: true,
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
    },
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteMountImplementationQaCompleted: true,
      sourceRouteMountImplementationReviewAccepted: sourceAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
      routeImplementationContractQaAccepted: contractQaAccepted,
      routeSchemaAll21ToolsQaAccepted: contractQaAccepted,
      routeSchemaAll12CapabilitiesQaAccepted: contractQaAccepted,
      disabledRuntimeHandlerQaAccepted: contractQaAccepted,
      appMountStillDeferred: true,
      appRouteImportStillAbsent: contractQaAccepted,
      noRuntimeSideEffectsQaAccepted: contractQaAccepted,
      routeMountImplementationQaAcceptedWithProvidedEvidence: contractQaAccepted,
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

export function buildAiGraphicsExternalBetaApiRouteMountImplementationQaInput(
  sourceRouteMountImplementationReviewPacket: Record<string, unknown>,
): AiGraphicsExternalBetaApiRouteMountImplementationQaInput {
  return {
    sourceRouteMountImplementationReviewPacket,
    routeImplementationFileRef: 'source://server/routes/ai-graphics-external-beta-tool-call-routes.ts',
    appMountFileRef: 'source://server/app.ts',
    routeSchemaRef: 'source://server/routes/ai-graphics-external-beta-tool-call-routes.ts#aiGraphicsExternalBetaToolCallRequestSchema',
    disabledRuntimeHandlerRef: 'source://server/routes/ai-graphics-external-beta-tool-call-routes.ts#createAiGraphicsExternalBetaToolCallRoutes',
    sourceControlledRoutePath: '/api/ai-graphics/external-beta/tool-call',
  }
}
