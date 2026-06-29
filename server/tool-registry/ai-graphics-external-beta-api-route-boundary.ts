import {
  AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION,
  type AiGraphicsExternalBetaCallableRequestAdmission,
  type AiGraphicsExternalBetaCallableRequestCandidate,
} from './ai-graphics-external-beta-callable-request-admission'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BOUNDARY_DECISION =
  'ai_graphics_external_beta_api_route_boundary_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteBoundaryStatus =
  | 'missing_external_beta_callable_request_admission'
  | 'external_beta_callable_request_admission_rejected'
  | 'missing_external_beta_api_route_boundary_controls'
  | 'external_beta_api_route_boundary_candidate_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteBoundaryInput {
  sourceExternalBetaCallableRequestAdmissionPacket?:
    AiGraphicsExternalBetaCallableRequestAdmission
  externalBetaApiRoutePolicyRef?: string
  externalBetaApiRouteSchemaRef?: string
  externalBetaApiRouteAuthzRef?: string
  externalBetaApiRouteRequestValidationRef?: string
  externalBetaApprovedSnapshotResolverRef?: string
  externalBetaCreditReservationResolverRef?: string
  externalBetaApiRouteRateLimitRef?: string
  externalBetaApiRouteCostGuardrailRef?: string
  externalBetaApiRouteIdempotencyStoreRef?: string
  externalBetaApiRouteAuditLogRef?: string
  externalBetaApiRoutePrivateNetworkRef?: string
  externalBetaApiRouteRollbackRef?: string
  externalBetaApiRouteIncidentResponseRef?: string
}

export interface AiGraphicsExternalBetaApiRouteCandidate {
  routeId: 'ai_graphics_external_beta_tool_call'
  method: 'POST'
  routePath: '/api/ai-graphics/external-beta/tool-call'
  toolId: string
  capabilityId: string
  requestId: string
  workspaceId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  gatewayCandidateRef: string
  traceId: string
  idempotencyKey: string
  runtimeTarget: string
  workerType: string
  gpuRequiredForRuntime: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  apiRouteMountedNow: false
  apiRouteExecutionPerformed: false
  routeExecutionApprovedNow: false
  liveQueueWriteApprovedNow: false
  workerEnqueuePerformed: false
  toolExecutionPerformed: false
}

export interface AiGraphicsExternalBetaApiRouteBoundary {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BOUNDARY_DECISION
  sourceExternalBetaCallableRequestAdmissionDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION | null
  status: AiGraphicsExternalBetaApiRouteBoundaryStatus
  requestedToolId: string | null
  capabilityId: string | null
  sourceCallableRequestAdmissionAccepted: boolean
  externalBetaApiRouteBoundaryControlsSatisfied: boolean
  missingApiRouteBoundaryControls: string[]
  externalBetaApiRouteBoundaryCandidateReadyWithProvidedEvidence: boolean
  externalBetaApiRouteBoundaryCandidateReadyToolsWithProvidedEvidence: 0 | 1
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  sourceExternalBetaCallableRequestAdmission:
    AiGraphicsExternalBetaCallableRequestAdmission | null
  sourceCallableRequestCandidate:
    AiGraphicsExternalBetaCallableRequestCandidate | null
  apiRouteCandidate: AiGraphicsExternalBetaApiRouteCandidate | null
  apiRouteBoundaryPolicy: {
    futureRouteOnly: true
    mountedRouteNotCreated: true
    sideEffectFreeBoundaryCheck: true
    policyRefRequired: true
    schemaRefRequired: true
    authorizationRefRequired: true
    requestValidationRefRequired: true
    approvedSnapshotResolverRequired: true
    creditReservationResolverRequired: true
    rateLimitAndCostGuardrailRequired: true
    idempotencyAndAuditRequired: true
    privateNetworkRequired: true
    rollbackAndIncidentResponseRequired: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  allowedBoundaryActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteBoundaryPrepared: true
    sourceExternalBetaCallableRequestAdmissionAccepted: boolean
    externalBetaApiRouteBoundaryControlsSatisfied: boolean
    externalBetaApiRouteBoundaryCandidateReadyWithProvidedEvidence: boolean
    approvedPlanSnapshotAccepted: boolean
    creditReservationAccepted: boolean
    privateArtifactManifestAccepted: boolean
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    all8GpuToolsTargetGpuRuntime: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    apiRouteMountedNow: false
    apiRouteExecutionPerformed: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
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

const apiRouteBoundaryPolicy = {
  futureRouteOnly: true,
  mountedRouteNotCreated: true,
  sideEffectFreeBoundaryCheck: true,
  policyRefRequired: true,
  schemaRefRequired: true,
  authorizationRefRequired: true,
  requestValidationRefRequired: true,
  approvedSnapshotResolverRequired: true,
  creditReservationResolverRequired: true,
  rateLimitAndCostGuardrailRequired: true,
  idempotencyAndAuditRequired: true,
  privateNetworkRequired: true,
  rollbackAndIncidentResponseRequired: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const allowedBoundaryActions = [
  'read accepted external-beta callable request-admission metadata',
  'verify future API route policy, schema, authorization, and request validation refs',
  'verify approved snapshot and credit reservation resolver refs',
  'verify route rate-limit, cost, idempotency, audit, rollback, and incident-response refs',
  'record one future external-beta API route boundary candidate',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'mounted API route creation',
  'API route execution',
  'agent/tool execution',
  'Tool Route execution',
  'live queue write',
  'Worker queue enqueue',
  'Worker execution',
  'production worker dispatch',
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
  'Implement the real external-beta API route handler behind the approved route policy and schema.',
  'Wire the handler to approved snapshot and credit reservation services without bypassing the callable request-admission candidate.',
  'Run private non-production API-route-to-queue insertion proof before any external-beta user traffic.',
  'Keep GPU workers cold until an accepted GPU/model job is claimed, then release GPU resources after completion.',
]

function hasValue(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function callableRequestAdmissionAccepted(
  packet?: AiGraphicsExternalBetaCallableRequestAdmission,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_CALLABLE_REQUEST_ADMISSION_DECISION &&
    packet.status === 'external_beta_callable_request_admission_ready_runtime_still_blocked' &&
    packet.sourceCallableScopeAccepted === true &&
    packet.sourceToolCallGatewayAccepted === true &&
    packet.requestedToolPresentInCallableScope === true &&
    packet.requestedCapabilityPresentInCallableScope === true &&
    packet.externalBetaCallableRequestAdmissionReadyWithProvidedEvidence === true &&
    packet.externalBetaCallableRequestAdmissionReadyToolsWithProvidedEvidence === 1 &&
    packet.externalBetaCallableCandidateToolsWithProvidedEvidence === 21 &&
    packet.externalBetaCallableNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.gpuRuntimeShouldStartNow === false &&
    Boolean(packet.callableRequestCandidate) &&
    hasValue(packet.callableRequestCandidate?.approvedPlanSnapshotId) &&
    hasValue(packet.callableRequestCandidate?.creditReservationId) &&
    hasValue(packet.callableRequestCandidate?.privateArtifactManifestRef) &&
    packet.booleans.externalBetaCallableRequestAdmissionReadyWithProvidedEvidence === true &&
    packet.booleans.approvedPlanSnapshotAccepted === true &&
    packet.booleans.creditReservationAccepted === true &&
    packet.booleans.privateArtifactManifestAccepted === true &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function missingApiRouteBoundaryControls(
  input: AiGraphicsExternalBetaApiRouteBoundaryInput,
): string[] {
  return [
    !hasValue(input.externalBetaApiRoutePolicyRef)
      ? 'external beta API route policy reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRouteSchemaRef)
      ? 'external beta API route schema reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRouteAuthzRef)
      ? 'external beta API route authorization reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRouteRequestValidationRef)
      ? 'external beta API route request validation reference is missing'
      : undefined,
    !hasValue(input.externalBetaApprovedSnapshotResolverRef)
      ? 'external beta approved snapshot resolver reference is missing'
      : undefined,
    !hasValue(input.externalBetaCreditReservationResolverRef)
      ? 'external beta credit reservation resolver reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRouteRateLimitRef)
      ? 'external beta API route rate-limit reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRouteCostGuardrailRef)
      ? 'external beta API route cost guardrail reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRouteIdempotencyStoreRef)
      ? 'external beta API route idempotency store reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRouteAuditLogRef)
      ? 'external beta API route audit log reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRoutePrivateNetworkRef)
      ? 'external beta API route private network reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRouteRollbackRef)
      ? 'external beta API route rollback reference is missing'
      : undefined,
    !hasValue(input.externalBetaApiRouteIncidentResponseRef)
      ? 'external beta API route incident response reference is missing'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function statusFromInput(input: {
  hasAdmission: boolean
  admissionAccepted: boolean
  controlsSatisfied: boolean
}): AiGraphicsExternalBetaApiRouteBoundaryStatus {
  if (!input.hasAdmission) return 'missing_external_beta_callable_request_admission'
  if (!input.admissionAccepted) return 'external_beta_callable_request_admission_rejected'
  return input.controlsSatisfied
    ? 'external_beta_api_route_boundary_candidate_ready_runtime_still_blocked'
    : 'missing_external_beta_api_route_boundary_controls'
}

function buildApiRouteCandidate(input: {
  ready: boolean
  candidate: AiGraphicsExternalBetaCallableRequestCandidate | null | undefined
}): AiGraphicsExternalBetaApiRouteCandidate | null {
  if (!input.ready || !input.candidate) return null
  return {
    routeId: 'ai_graphics_external_beta_tool_call',
    method: 'POST',
    routePath: '/api/ai-graphics/external-beta/tool-call',
    toolId: input.candidate.toolId,
    capabilityId: input.candidate.capabilityId,
    requestId: input.candidate.requestId,
    workspaceId: input.candidate.workspaceId,
    approvedPlanSnapshotId: input.candidate.approvedPlanSnapshotId,
    creditReservationId: input.candidate.creditReservationId,
    privateArtifactManifestRef: input.candidate.privateArtifactManifestRef,
    gatewayCandidateRef: input.candidate.gatewayCandidateRef,
    traceId: input.candidate.traceId,
    idempotencyKey: input.candidate.idempotencyKey,
    runtimeTarget: input.candidate.runtimeTarget,
    workerType: input.candidate.workerType,
    gpuRequiredForRuntime: input.candidate.gpuRequiredForRuntime,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      input.candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    apiRouteMountedNow: false,
    apiRouteExecutionPerformed: false,
    routeExecutionApprovedNow: false,
    liveQueueWriteApprovedNow: false,
    workerEnqueuePerformed: false,
    toolExecutionPerformed: false,
  }
}

export function buildAiGraphicsExternalBetaApiRouteBoundary(
  input: AiGraphicsExternalBetaApiRouteBoundaryInput = {},
): AiGraphicsExternalBetaApiRouteBoundary {
  const admission = input.sourceExternalBetaCallableRequestAdmissionPacket ?? null
  const sourceCandidate = admission?.callableRequestCandidate ?? null
  const admissionAccepted = callableRequestAdmissionAccepted(
    input.sourceExternalBetaCallableRequestAdmissionPacket,
  )
  const missingControls = admissionAccepted ? missingApiRouteBoundaryControls(input) : []
  const controlsSatisfied = admissionAccepted && missingControls.length === 0
  const ready = admissionAccepted && controlsSatisfied
  const apiRouteCandidate = buildApiRouteCandidate({
    ready,
    candidate: sourceCandidate,
  })
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    ready &&
    sourceCandidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BOUNDARY_DECISION,
    sourceExternalBetaCallableRequestAdmissionDecision: admission?.decision ?? null,
    status: statusFromInput({
      hasAdmission: Boolean(admission),
      admissionAccepted,
      controlsSatisfied,
    }),
    requestedToolId: admission?.requestedToolId ?? null,
    capabilityId: admission?.capabilityId ?? null,
    sourceCallableRequestAdmissionAccepted: admissionAccepted,
    externalBetaApiRouteBoundaryControlsSatisfied: controlsSatisfied,
    missingApiRouteBoundaryControls: missingControls,
    externalBetaApiRouteBoundaryCandidateReadyWithProvidedEvidence: ready,
    externalBetaApiRouteBoundaryCandidateReadyToolsWithProvidedEvidence: ready ? 1 : 0,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    sourceExternalBetaCallableRequestAdmission: admission,
    sourceCallableRequestCandidate: sourceCandidate,
    apiRouteCandidate,
    apiRouteBoundaryPolicy,
    allowedBoundaryActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteBoundaryPrepared: true,
      sourceExternalBetaCallableRequestAdmissionAccepted: admissionAccepted,
      externalBetaApiRouteBoundaryControlsSatisfied: controlsSatisfied,
      externalBetaApiRouteBoundaryCandidateReadyWithProvidedEvidence: ready,
      approvedPlanSnapshotAccepted:
        ready && hasValue(sourceCandidate?.approvedPlanSnapshotId),
      creditReservationAccepted:
        ready && hasValue(sourceCandidate?.creditReservationId),
      privateArtifactManifestAccepted:
        ready && hasValue(sourceCandidate?.privateArtifactManifestRef),
      all21ToolsCovered: admission?.booleans.all21ToolsCovered === true,
      all12CapabilitiesCovered: admission?.booleans.all12CapabilitiesCovered === true,
      all8GpuToolsTargetGpuRuntime:
        admission?.booleans.all8GpuToolsTargetGpuRuntime === true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      apiRouteMountedNow: false,
      apiRouteExecutionPerformed: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
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
