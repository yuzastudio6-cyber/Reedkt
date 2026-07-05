import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BOUNDARY_DECISION,
  type AiGraphicsExternalBetaApiRouteBoundary,
  type AiGraphicsExternalBetaApiRouteCandidate,
} from './ai-graphics-external-beta-api-route-boundary'
import {
  AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION,
  type AiGraphicsExternalBetaBackendQueueSubmission,
  type AiGraphicsExternalBetaBackendQueueSubmissionEnvelope,
} from './ai-graphics-external-beta-backend-queue-submission'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_INSERTION_PROOF_DECISION =
  'ai_graphics_external_beta_api_route_queue_insertion_proof_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteQueueInsertionProofStatus =
  | 'missing_external_beta_api_route_boundary'
  | 'external_beta_api_route_boundary_rejected'
  | 'missing_external_beta_backend_queue_submission'
  | 'external_beta_backend_queue_submission_rejected'
  | 'requested_tool_mismatch_between_route_and_queue'
  | 'missing_external_beta_route_to_queue_controls'
  | 'external_beta_api_route_queue_insertion_proof_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaApiRouteQueueInsertionProofInput {
  sourceExternalBetaApiRouteBoundaryPacket?: AiGraphicsExternalBetaApiRouteBoundary
  sourceExternalBetaBackendQueueSubmissionPacket?: AiGraphicsExternalBetaBackendQueueSubmission
  externalBetaRouteQueueInsertionPolicyRef?: string
  externalBetaRouteQueueInsertionSchemaRef?: string
  externalBetaRouteQueueServiceRoleAuthorizationRef?: string
  externalBetaRouteQueueIdempotencyBindingRef?: string
  externalBetaRouteQueueApprovedSnapshotBindingRef?: string
  externalBetaRouteQueueCreditReservationBindingRef?: string
  externalBetaRouteQueuePrivateArtifactManifestBindingRef?: string
  externalBetaRouteQueueAuditEnvelopeRef?: string
  externalBetaRouteQueueRollbackPlanRef?: string
  externalBetaRouteQueuePoisonQueuePolicyRef?: string
  externalBetaRouteQueueNonProductionEnvironmentRef?: string
  externalBetaRouteQueuePrivateNetworkRef?: string
}

export interface AiGraphicsExternalBetaApiRouteQueueInsertionCandidate {
  proofId: 'ai_graphics_external_beta_api_route_queue_insertion_proof'
  routeId: 'ai_graphics_external_beta_tool_call'
  method: 'POST'
  routePath: '/api/ai-graphics/external-beta/tool-call'
  queueName: string
  queueJobType: 'ai_graphics_tool_runtime'
  queueJobStatus: 'prepared_not_submitted'
  toolId: string
  capabilityId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId: string
  creditReservationId: string
  privateArtifactManifestRef: string
  gatewayCandidateRef: string
  sourceAdapterCandidateRef: string
  traceId: string | null
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
  liveQueueWritePerformed: false
  backendQueueSubmissionPerformed: false
  serviceRoleTransactionPerformed: false
  workerEnqueuePerformed: false
  workerLeaseCreated: false
  workerDispatchPerformed: false
  toolExecutionPerformed: false
}

export interface AiGraphicsExternalBetaRouteQueueMatchReport {
  toolIdMatches: boolean
  capabilityIdMatches: boolean
  workspaceIdMatches: boolean
  approvedSnapshotMatches: boolean
  creditReservationMatches: boolean
  idempotencyKeyMatches: boolean
  runtimeTargetMatches: boolean
  workerTypeMatches: boolean
  sourceCandidateRefMatches: boolean
  queuePreparedNotSubmitted: boolean
  routeAndQueueMatch: boolean
  mismatches: string[]
}

export interface AiGraphicsExternalBetaApiRouteQueueInsertionProof {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_INSERTION_PROOF_DECISION
  sourceExternalBetaApiRouteBoundaryDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BOUNDARY_DECISION | null
  sourceExternalBetaBackendQueueSubmissionDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION | null
  status: AiGraphicsExternalBetaApiRouteQueueInsertionProofStatus
  requestedToolId: string | null
  capabilityId: string | null
  sourceExternalBetaApiRouteBoundaryAccepted: boolean
  sourceExternalBetaBackendQueueSubmissionAccepted: boolean
  externalBetaRouteQueueInsertionControlsSatisfied: boolean
  missingRouteQueueInsertionControls: string[]
  routeQueueMatchReport: AiGraphicsExternalBetaRouteQueueMatchReport | null
  externalBetaApiRouteQueueInsertionProofReadyWithProvidedEvidence: boolean
  externalBetaApiRouteQueueInsertionProofReadyToolsWithProvidedEvidence: 0 | 1
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  sourceExternalBetaApiRouteBoundary: AiGraphicsExternalBetaApiRouteBoundary | null
  sourceExternalBetaBackendQueueSubmission: AiGraphicsExternalBetaBackendQueueSubmission | null
  sourceApiRouteCandidate: AiGraphicsExternalBetaApiRouteCandidate | null
  sourceBackendQueueSubmissionEnvelope: AiGraphicsExternalBetaBackendQueueSubmissionEnvelope | null
  routeQueueInsertionCandidate: AiGraphicsExternalBetaApiRouteQueueInsertionCandidate | null
  routeQueueInsertionPolicy: {
    sideEffectFreeInsertionProof: true
    nonProductionOnly: true
    routeBoundaryRequired: true
    backendQueueSubmissionEnvelopeRequired: true
    routeQueuePolicyRefRequired: true
    routeQueueSchemaRefRequired: true
    serviceRoleAuthorizationRefRequired: true
    idempotencyBindingRequired: true
    approvedSnapshotBindingRequired: true
    creditReservationBindingRequired: true
    privateArtifactManifestBindingRequired: true
    auditEnvelopeRequired: true
    rollbackPlanRequired: true
    poisonQueuePolicyRequired: true
    privateNetworkRequired: true
    liveQueueWriteBlockedNow: true
    workerDispatchBlockedNow: true
    onDemandGpuOnly: true
    noIdleGpuRuntimeApproved: true
  }
  allowedProofActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteQueueInsertionProofPrepared: true
    sourceExternalBetaApiRouteBoundaryAccepted: boolean
    sourceExternalBetaBackendQueueSubmissionAccepted: boolean
    externalBetaRouteQueueInsertionControlsSatisfied: boolean
    routeAndQueueMatch: boolean
    externalBetaApiRouteQueueInsertionProofReadyWithProvidedEvidence: boolean
    approvedPlanSnapshotBindingAccepted: boolean
    creditReservationBindingAccepted: boolean
    privateArtifactManifestBindingAccepted: boolean
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

const routeQueueInsertionPolicy = {
  sideEffectFreeInsertionProof: true,
  nonProductionOnly: true,
  routeBoundaryRequired: true,
  backendQueueSubmissionEnvelopeRequired: true,
  routeQueuePolicyRefRequired: true,
  routeQueueSchemaRefRequired: true,
  serviceRoleAuthorizationRefRequired: true,
  idempotencyBindingRequired: true,
  approvedSnapshotBindingRequired: true,
  creditReservationBindingRequired: true,
  privateArtifactManifestBindingRequired: true,
  auditEnvelopeRequired: true,
  rollbackPlanRequired: true,
  poisonQueuePolicyRequired: true,
  privateNetworkRequired: true,
  liveQueueWriteBlockedNow: true,
  workerDispatchBlockedNow: true,
  onDemandGpuOnly: true,
  noIdleGpuRuntimeApproved: true,
} as const

const allowedProofActions = [
  'read accepted external-beta API route boundary metadata',
  'read accepted external-beta backend queue submission envelope metadata',
  'verify route candidate and queue submission envelope describe the same approved tool request',
  'verify route-to-queue policy, schema, service-role authorization, binding, audit, rollback, poison queue, environment, and private network refs',
  'record one side-effect-free API-route-to-queue insertion proof candidate',
  'preserve GPU startup as on-demand only for a later accepted worker/tool job',
]

const blockedRuntimeActions = [
  'mounted API route creation',
  'API route execution',
  'agent/tool execution',
  'Tool Route execution',
  'live queue write',
  'backend queue submission',
  'service-role transaction',
  'Worker queue enqueue',
  'Worker lease creation',
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
  'Implement a private non-production API route handler behind the accepted route boundary.',
  'Bind the handler to the approved queue submission envelope with service-role transaction controls.',
  'Run a private route-to-queue smoke proof that writes only in the approved non-production queue window.',
  'Keep GPU workers cold until an accepted GPU/model queue job is claimed, then release GPU resources after completion.',
]

function hasValue(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function apiRouteBoundaryAccepted(packet?: AiGraphicsExternalBetaApiRouteBoundary): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_BOUNDARY_DECISION &&
    packet.status === 'external_beta_api_route_boundary_candidate_ready_runtime_still_blocked' &&
    packet.sourceCallableRequestAdmissionAccepted === true &&
    packet.externalBetaApiRouteBoundaryControlsSatisfied === true &&
    packet.externalBetaApiRouteBoundaryCandidateReadyWithProvidedEvidence === true &&
    packet.externalBetaApiRouteBoundaryCandidateReadyToolsWithProvidedEvidence === 1 &&
    packet.externalBetaCallableNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.gpuRuntimeShouldStartNow === false &&
    Boolean(packet.apiRouteCandidate) &&
    packet.apiRouteCandidate?.apiRouteMountedNow === false &&
    packet.apiRouteCandidate?.apiRouteExecutionPerformed === false &&
    packet.apiRouteCandidate?.liveQueueWriteApprovedNow === false &&
    packet.apiRouteCandidate?.workerEnqueuePerformed === false &&
    packet.apiRouteCandidate?.toolExecutionPerformed === false &&
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

function backendQueueSubmissionAccepted(
  packet?: AiGraphicsExternalBetaBackendQueueSubmission,
): boolean {
  return Boolean(packet) &&
    packet?.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_BACKEND_QUEUE_SUBMISSION_DECISION &&
    packet.decision === 'external_beta_backend_queue_submission_envelope_ready' &&
    packet.sourceExternalBetaWorkerEnqueueAdapterAccepted === true &&
    packet.sourceExternalBetaWorkerEnqueueAdapterProofBridgeAccepted === true &&
    packet.externalBetaQueueSubmissionControlsSatisfied === true &&
    packet.externalBetaBackendQueueSubmissionEnvelopeReadyWithProvidedEvidence === true &&
    packet.externalBetaBackendQueueSubmissionEnvelope !== null &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.liveBackendQueueSubmissionsNow === 0 &&
    packet.liveServiceRoleTransactionsNow === 0 &&
    packet.liveWorkerLeasesCreatedNow === 0 &&
    packet.liveWorkerDispatchesNow === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.externalBetaBackendQueueSubmissionEnvelope?.queueJobCandidate.status === 'prepared_not_submitted' &&
    packet.externalBetaBackendQueueSubmissionEnvelope?.queueJobCandidate.liveInsertPerformed === false &&
    packet.externalBetaBackendQueueSubmissionEnvelope?.queueBatchCandidate.liveInsertPerformed === false &&
    packet.externalBetaBackendQueueSubmissionEnvelope?.queueAuditCandidate.liveInsertPerformed === false &&
    packet.externalBetaBackendQueueSubmissionEnvelope?.backendQueueSubmissionPerformed === false &&
    packet.externalBetaBackendQueueSubmissionEnvelope?.serviceRoleTransactionPerformed === false &&
    packet.externalBetaBackendQueueSubmissionEnvelope?.workerEnqueuePerformed === false &&
    packet.externalBetaBackendQueueSubmissionEnvelope?.workerDispatchPerformed === false &&
    packet.externalBetaBackendQueueSubmissionEnvelope?.toolExecutionPerformed === false &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.all8GpuToolsTargetGpuRuntime === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.backendQueueSubmissionApprovedNow === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.backendQueueSubmissionPerformed === false &&
    packet.booleans.serviceRoleTransactionPerformed === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function missingRouteQueueInsertionControls(
  input: AiGraphicsExternalBetaApiRouteQueueInsertionProofInput,
): string[] {
  return [
    !hasValue(input.externalBetaRouteQueueInsertionPolicyRef)
      ? 'external beta route-to-queue insertion policy reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueueInsertionSchemaRef)
      ? 'external beta route-to-queue insertion schema reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueueServiceRoleAuthorizationRef)
      ? 'external beta route-to-queue service-role authorization reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueueIdempotencyBindingRef)
      ? 'external beta route-to-queue idempotency binding reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueueApprovedSnapshotBindingRef)
      ? 'external beta route-to-queue approved snapshot binding reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueueCreditReservationBindingRef)
      ? 'external beta route-to-queue credit reservation binding reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueuePrivateArtifactManifestBindingRef)
      ? 'external beta route-to-queue private artifact manifest binding reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueueAuditEnvelopeRef)
      ? 'external beta route-to-queue audit envelope reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueueRollbackPlanRef)
      ? 'external beta route-to-queue rollback plan reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueuePoisonQueuePolicyRef)
      ? 'external beta route-to-queue poison queue policy reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueueNonProductionEnvironmentRef)
      ? 'external beta route-to-queue non-production environment reference is missing'
      : undefined,
    !hasValue(input.externalBetaRouteQueuePrivateNetworkRef)
      ? 'external beta route-to-queue private network reference is missing'
      : undefined,
  ].filter((gate): gate is string => Boolean(gate))
}

function buildMatchReport(input: {
  routeCandidate: AiGraphicsExternalBetaApiRouteCandidate
  queueEnvelope: AiGraphicsExternalBetaBackendQueueSubmissionEnvelope
}): AiGraphicsExternalBetaRouteQueueMatchReport {
  const queueJob = input.queueEnvelope.queueJobCandidate
  const route = input.routeCandidate
  const report = {
    toolIdMatches: route.toolId === input.queueEnvelope.toolId,
    capabilityIdMatches: route.capabilityId === input.queueEnvelope.capabilityId,
    workspaceIdMatches: route.workspaceId === queueJob.workspaceId,
    approvedSnapshotMatches:
      route.approvedPlanSnapshotId === queueJob.approvedSnapshotId,
    creditReservationMatches:
      route.creditReservationId === queueJob.creditReservationId,
    idempotencyKeyMatches: route.idempotencyKey === queueJob.idempotencyKey,
    runtimeTargetMatches: route.runtimeTarget === input.queueEnvelope.runtimeTarget,
    workerTypeMatches: route.workerType === input.queueEnvelope.workerType,
    sourceCandidateRefMatches:
      route.gatewayCandidateRef === input.queueEnvelope.sourceAdapterCandidateRef,
    queuePreparedNotSubmitted:
      queueJob.status === 'prepared_not_submitted' &&
      queueJob.liveInsertPerformed === false &&
      input.queueEnvelope.queueBatchCandidate.liveInsertPerformed === false &&
      input.queueEnvelope.queueAuditCandidate.liveInsertPerformed === false,
  }
  const mismatches = Object.entries(report)
    .filter(([, matched]) => matched !== true)
    .map(([key]) => key)
  return {
    ...report,
    routeAndQueueMatch: mismatches.length === 0,
    mismatches,
  }
}

function statusFromInput(input: {
  hasRoute: boolean
  routeAccepted: boolean
  hasQueue: boolean
  queueAccepted: boolean
  matchReport: AiGraphicsExternalBetaRouteQueueMatchReport | null
  controlsSatisfied: boolean
}): AiGraphicsExternalBetaApiRouteQueueInsertionProofStatus {
  if (!input.hasRoute) return 'missing_external_beta_api_route_boundary'
  if (!input.routeAccepted) return 'external_beta_api_route_boundary_rejected'
  if (!input.hasQueue) return 'missing_external_beta_backend_queue_submission'
  if (!input.queueAccepted) return 'external_beta_backend_queue_submission_rejected'
  if (input.matchReport?.routeAndQueueMatch !== true) {
    return 'requested_tool_mismatch_between_route_and_queue'
  }
  return input.controlsSatisfied
    ? 'external_beta_api_route_queue_insertion_proof_ready_runtime_still_blocked'
    : 'missing_external_beta_route_to_queue_controls'
}

function buildRouteQueueInsertionCandidate(input: {
  ready: boolean
  routeCandidate: AiGraphicsExternalBetaApiRouteCandidate | null
  queueEnvelope: AiGraphicsExternalBetaBackendQueueSubmissionEnvelope | null
}): AiGraphicsExternalBetaApiRouteQueueInsertionCandidate | null {
  if (!input.ready || !input.routeCandidate || !input.queueEnvelope) return null
  const route = input.routeCandidate
  const queueJob = input.queueEnvelope.queueJobCandidate
  return {
    proofId: 'ai_graphics_external_beta_api_route_queue_insertion_proof',
    routeId: route.routeId,
    method: route.method,
    routePath: route.routePath,
    queueName: input.queueEnvelope.queueName,
    queueJobType: queueJob.jobType,
    queueJobStatus: queueJob.status,
    toolId: route.toolId,
    capabilityId: route.capabilityId,
    workspaceId: route.workspaceId,
    projectId: queueJob.projectId,
    approvedPlanSnapshotId: route.approvedPlanSnapshotId,
    creditReservationId: route.creditReservationId,
    privateArtifactManifestRef: route.privateArtifactManifestRef,
    gatewayCandidateRef: route.gatewayCandidateRef,
    sourceAdapterCandidateRef: input.queueEnvelope.sourceAdapterCandidateRef,
    traceId: input.queueEnvelope.queueAuditCandidate.traceId,
    idempotencyKey: route.idempotencyKey,
    runtimeTarget: route.runtimeTarget,
    workerType: route.workerType,
    gpuRequiredForRuntime: route.gpuRequiredForRuntime,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      route.gpuRuntimeStartAllowedForAcceptedExternalBetaJob &&
      input.queueEnvelope.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    apiRouteMountedNow: false,
    apiRouteExecutionPerformed: false,
    routeExecutionApprovedNow: false,
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformed: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchPerformed: false,
    toolExecutionPerformed: false,
  }
}

export function buildAiGraphicsExternalBetaApiRouteQueueInsertionProof(
  input: AiGraphicsExternalBetaApiRouteQueueInsertionProofInput = {},
): AiGraphicsExternalBetaApiRouteQueueInsertionProof {
  const routeBoundary = input.sourceExternalBetaApiRouteBoundaryPacket ?? null
  const queueSubmission = input.sourceExternalBetaBackendQueueSubmissionPacket ?? null
  const routeCandidate = routeBoundary?.apiRouteCandidate ?? null
  const queueEnvelope =
    queueSubmission?.externalBetaBackendQueueSubmissionEnvelope ?? null
  const routeAccepted = apiRouteBoundaryAccepted(routeBoundary ?? undefined)
  const queueAccepted = backendQueueSubmissionAccepted(queueSubmission ?? undefined)
  const matchReport =
    routeAccepted && queueAccepted && routeCandidate && queueEnvelope
      ? buildMatchReport({ routeCandidate, queueEnvelope })
      : null
  const missingControls =
    routeAccepted && queueAccepted && matchReport?.routeAndQueueMatch === true
      ? missingRouteQueueInsertionControls(input)
      : []
  const controlsSatisfied =
    routeAccepted &&
    queueAccepted &&
    matchReport?.routeAndQueueMatch === true &&
    missingControls.length === 0
  const ready = controlsSatisfied
  const routeQueueInsertionCandidate = buildRouteQueueInsertionCandidate({
    ready,
    routeCandidate,
    queueEnvelope,
  })
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    ready &&
    routeBoundary?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true &&
    queueSubmission?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_INSERTION_PROOF_DECISION,
    sourceExternalBetaApiRouteBoundaryDecision: routeBoundary?.decision ?? null,
    sourceExternalBetaBackendQueueSubmissionDecision:
      queueSubmission?.sourceDecision ?? null,
    status: statusFromInput({
      hasRoute: Boolean(routeBoundary),
      routeAccepted,
      hasQueue: Boolean(queueSubmission),
      queueAccepted,
      matchReport,
      controlsSatisfied,
    }),
    requestedToolId:
      routeBoundary?.requestedToolId ?? queueSubmission?.requestedToolId ?? null,
    capabilityId:
      routeBoundary?.capabilityId ?? queueSubmission?.capabilityId ?? null,
    sourceExternalBetaApiRouteBoundaryAccepted: routeAccepted,
    sourceExternalBetaBackendQueueSubmissionAccepted: queueAccepted,
    externalBetaRouteQueueInsertionControlsSatisfied: controlsSatisfied,
    missingRouteQueueInsertionControls: missingControls,
    routeQueueMatchReport: matchReport,
    externalBetaApiRouteQueueInsertionProofReadyWithProvidedEvidence: ready,
    externalBetaApiRouteQueueInsertionProofReadyToolsWithProvidedEvidence:
      ready ? 1 : 0,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    sourceExternalBetaApiRouteBoundary: routeBoundary,
    sourceExternalBetaBackendQueueSubmission: queueSubmission,
    sourceApiRouteCandidate: routeCandidate,
    sourceBackendQueueSubmissionEnvelope: queueEnvelope,
    routeQueueInsertionCandidate,
    routeQueueInsertionPolicy,
    allowedProofActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteQueueInsertionProofPrepared: true,
      sourceExternalBetaApiRouteBoundaryAccepted: routeAccepted,
      sourceExternalBetaBackendQueueSubmissionAccepted: queueAccepted,
      externalBetaRouteQueueInsertionControlsSatisfied: controlsSatisfied,
      routeAndQueueMatch: matchReport?.routeAndQueueMatch === true,
      externalBetaApiRouteQueueInsertionProofReadyWithProvidedEvidence: ready,
      approvedPlanSnapshotBindingAccepted: controlsSatisfied,
      creditReservationBindingAccepted: controlsSatisfied,
      privateArtifactManifestBindingAccepted: controlsSatisfied,
      all21ToolsCovered:
        routeBoundary?.booleans.all21ToolsCovered === true &&
        queueSubmission?.booleans.all21ToolsCovered === true,
      all12CapabilitiesCovered:
        routeBoundary?.booleans.all12CapabilitiesCovered === true &&
        queueSubmission?.booleans.all12CapabilitiesCovered === true,
      all8GpuToolsTargetGpuRuntime:
        routeBoundary?.booleans.all8GpuToolsTargetGpuRuntime === true &&
        queueSubmission?.booleans.all8GpuToolsTargetGpuRuntime === true,
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
