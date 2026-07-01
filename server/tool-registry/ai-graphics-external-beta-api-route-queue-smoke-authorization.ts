import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_INSERTION_PROOF_DECISION,
  type AiGraphicsExternalBetaApiRouteQueueInsertionCandidate,
  type AiGraphicsExternalBetaApiRouteQueueInsertionProof,
} from './ai-graphics-external-beta-api-route-queue-insertion-proof'
import {
  AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_DECISION,
  type AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization,
} from './ai-graphics-external-beta-service-role-queue-smoke-authorization'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_AUTHORIZATION_DECISION =
  'ai_graphics_external_beta_api_route_queue_smoke_authorization_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationStatus =
  | 'missing_external_beta_api_route_queue_insertion_proof'
  | 'external_beta_api_route_queue_insertion_proof_rejected'
  | 'missing_external_beta_service_role_queue_smoke_authorization'
  | 'external_beta_service_role_queue_smoke_authorization_rejected'
  | 'awaiting_external_beta_api_route_queue_smoke_authorization'
  | 'external_beta_api_route_queue_smoke_authorization_recorded_execution_still_blocked'

export interface AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationInput {
  sourceExternalBetaApiRouteQueueInsertionProofPacket?:
    AiGraphicsExternalBetaApiRouteQueueInsertionProof
  sourceExternalBetaServiceRoleQueueSmokeAuthorizationPacket?:
    AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization
  externalBetaApiRouteQueueSmokeAuthorizationGranted?: boolean
  externalBetaApiRouteQueueSmokeAuthorizationRef?: string
  externalBetaApiRouteQueueSmokeOperatorRole?: string
  externalBetaApiRouteQueueInsertionProofRef?: string
  externalBetaServiceRoleQueueSmokeAuthorizationRef?: string
  externalBetaApiRouteQueueSmokeNonProductionEnvironmentRef?: string
  externalBetaApiRouteQueueSmokeRouteExecutionWindowRef?: string
  externalBetaApiRouteQueueSmokeQueueWriteWindowRef?: string
  externalBetaApiRouteQueueSmokeCleanupPlanRef?: string
  externalBetaApiRouteQueueSmokeRollbackPlanRef?: string
  externalBetaApiRouteQueueSmokeTelemetryRef?: string
  externalBetaApiRouteQueueSmokeCostCeilingRef?: string
  externalBetaApiRouteQueueSmokePrivateNetworkRef?: string
  externalBetaApiRouteQueueSmokeIncidentResponseRef?: string
}

export interface AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationCandidate {
  authorizationId: 'ai_graphics_external_beta_api_route_queue_smoke_authorization'
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
  traceId: string | null
  idempotencyKey: string
  runtimeTarget: string
  workerType: string
  gpuRequiredForRuntime: boolean
  sourceApiRouteQueueInsertionProofAccepted: boolean
  sourceServiceRoleQueueSmokeAuthorizationAccepted: boolean
  apiRouteQueueSmokeAuthorizationCandidateWithProvidedEvidence: true
  apiRouteQueueSmokeAuthorizationRecordedWithProvidedEvidence: boolean
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  apiRouteQueueSmokeApprovedNow: false
  apiRouteMountedNow: false
  apiRouteExecutionApprovedNow: false
  apiRouteExecutionPerformed: false
  liveQueueWriteApprovedNow: false
  liveQueueWritePerformed: false
  backendQueueSubmissionApprovedNow: false
  backendQueueSubmissionPerformed: false
  serviceRoleTransactionPerformed: false
  workerEnqueuePerformed: false
  workerLeaseCreated: false
  workerDispatchApprovedNow: false
  workerDispatchPerformed: false
  toolExecutionApprovedNow: false
  toolExecutionPerformed: false
}

export interface AiGraphicsExternalBetaApiRouteQueueSmokeAuthorization {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_AUTHORIZATION_DECISION
  sourceExternalBetaApiRouteQueueInsertionProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_INSERTION_PROOF_DECISION | null
  sourceExternalBetaServiceRoleQueueSmokeAuthorizationDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_DECISION | null
  status: AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  sourceApiRouteQueueInsertionProofReadyRequestsWithProvidedEvidence: 0 | 1
  sourceServiceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence: number
  sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidenceRequests: 0 | 1
  apiRouteQueueSmokeAuthorizationCandidateRequestsWithProvidedEvidence: 0 | 1
  apiRouteQueueSmokeAuthorizationRecordedRequestsWithProvidedEvidence: 0 | 1
  gpuRuntimeTargetedTools: number
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests: 0 | 1
  apiRouteQueueSmokeApprovedNowRequests: 0
  apiRouteExecutionsApprovedNowRequests: 0
  apiRouteExecutionsPerformedNowRequests: 0
  liveQueueWritesApprovedNowRequests: 0
  liveQueueWritesPerformedNowRequests: 0
  workerDispatchApprovedNowRequests: 0
  workerDispatchPerformedNowRequests: 0
  toolExecutionApprovedNowRequests: 0
  toolExecutionPerformedNowRequests: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceExternalBetaApiRouteQueueInsertionProof:
    AiGraphicsExternalBetaApiRouteQueueInsertionProof | null
  sourceExternalBetaServiceRoleQueueSmokeAuthorization:
    AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization | null
  sourceRouteQueueInsertionCandidate:
    AiGraphicsExternalBetaApiRouteQueueInsertionCandidate | null
  apiRouteQueueSmokeAuthorizationCandidate:
    AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationCandidate | null
  apiRouteQueueSmokeAuthorizationRecord: {
    accepted: boolean
    operatorRole: 'AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_OPERATOR'
    authorizationRef: string | null
    routeQueueInsertionProofRef: string | null
    serviceRoleQueueSmokeAuthorizationRef: string | null
    nonProductionEnvironmentRef: string | null
    routeExecutionWindowRef: string | null
    queueWriteWindowRef: string | null
    cleanupPlanRef: string | null
    rollbackPlanRef: string | null
    telemetryRef: string | null
    costCeilingRef: string | null
    privateNetworkRef: string | null
    incidentResponseRef: string | null
    authorizesApiRouteQueueSmokeNow: false
    authorizesApiRouteExecutionNow: false
    authorizesLiveQueueWriteNow: false
    authorizesWorkerDispatchNow: false
    authorizesToolExecutionNow: false
    authorizesRuntimeNow: false
  }
  allowedApiRouteQueueSmokeAuthorizationActions: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaApiRouteQueueSmokeAuthorizationPrepared: true
    sourceExternalBetaApiRouteQueueInsertionProofAccepted: boolean
    sourceExternalBetaServiceRoleQueueSmokeAuthorizationAccepted: boolean
    sourceServiceRoleQueueSmokePreflightAcceptedWithProvidedEvidence: boolean
    apiRouteQueueSmokeAuthorizationRecordAccepted: boolean
    all21ToolsCovered: boolean
    all12CapabilitiesCovered: boolean
    apiRouteQueueSmokeAuthorizationCandidateWithProvidedEvidence: boolean
    apiRouteQueueSmokeAuthorizationRecordedWithProvidedEvidence: boolean
    gpuHeavyToolsTargetGpuRuntime: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedOnlyForAcceptedJobs: true
    gpuRuntimeShouldStartNow: false
    cpuFallbackAllowedForHeavyTools: false
    serviceRoleCredentialsServerOnly: true
    nonProductionEnvironmentRequired: true
    explicitSmokeConfirmationRequired: true
    routeExecutionWindowRequired: true
    queueWriteWindowRequired: true
    cleanupRequired: true
    rollbackRequired: true
    telemetryRequired: true
    costCeilingRequired: true
    privateNetworkRequired: true
    incidentResponseRequired: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    apiRouteQueueSmokeApprovedNow: false
    apiRouteMountedNow: false
    apiRouteExecutionApprovedNow: false
    apiRouteExecutionPerformed: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    serviceRoleQueueTransactionApprovedNow: false
    serviceRoleQueueSmokeApprovedNow: false
    liveServiceRoleQueueSmokeExecutedNow: false
    liveQueueWriteApprovedNow: false
    liveJobBatchInsertApprovedNow: false
    liveJobInsertApprovedNow: false
    liveWorkerClaimInsertApprovedNow: false
    liveWorkerEventInsertApprovedNow: false
    liveAuditEventInsertApprovedNow: false
    workerLeaseCreationApprovedNow: false
    workerDispatchApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
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

const allowedApiRouteQueueSmokeAuthorizationActions = [
  'accept one side-effect-free API-route-to-queue insertion proof candidate',
  'accept all-21 service-role queue smoke authorization evidence',
  'record private non-production API route queue smoke authorization metadata',
  'keep API route execution, live queue writes, worker dispatch, tool execution, and GPU startup blocked in this evaluator',
]

const blockedRuntimeActions = [
  'API route queue smoke execution now',
  'mounted API route creation',
  'API route execution',
  'live queue write',
  'backend queue submission',
  'service-role transaction',
  'service-role queue smoke execution now',
  'job batch insert',
  'job insert',
  'worker claim row insert',
  'worker lease creation',
  'worker dispatch',
  'tool execution',
  'Tool Route execution',
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
  'implement the private non-production API route queue smoke runner behind explicit operator confirmation',
  'execute only one approved non-production route-to-queue smoke and save sanitized proof',
  'validate the saved route-to-queue smoke proof before enabling any external-beta traffic',
  'keep GPU startup bound to accepted worker/tool jobs and never idle',
]

function hasValue(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasPrivateEvidenceRef(value?: string): boolean {
  if (!hasValue(value)) return false
  const normalized = value?.trim().toLowerCase() ?? ''
  if (
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-runtime://') ||
    normalized.startsWith('external-beta-evidence://') ||
    normalized.startsWith('external-beta-route-queue-smoke://') ||
    normalized.startsWith('external-beta-service-role-smoke://')
}

function routeQueueInsertionProofAccepted(
  packet?: AiGraphicsExternalBetaApiRouteQueueInsertionProof,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_INSERTION_PROOF_DECISION &&
    packet.status ===
      'external_beta_api_route_queue_insertion_proof_ready_runtime_still_blocked' &&
    packet.sourceExternalBetaApiRouteBoundaryAccepted === true &&
    packet.sourceExternalBetaBackendQueueSubmissionAccepted === true &&
    packet.externalBetaRouteQueueInsertionControlsSatisfied === true &&
    packet.routeQueueMatchReport?.routeAndQueueMatch === true &&
    packet.externalBetaApiRouteQueueInsertionProofReadyWithProvidedEvidence === true &&
    packet.externalBetaApiRouteQueueInsertionProofReadyToolsWithProvidedEvidence === 1 &&
    packet.externalBetaCallableNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.routeQueueInsertionCandidate !== null &&
    packet.routeQueueInsertionCandidate?.queueJobStatus === 'prepared_not_submitted' &&
    packet.routeQueueInsertionCandidate?.apiRouteMountedNow === false &&
    packet.routeQueueInsertionCandidate?.apiRouteExecutionPerformed === false &&
    packet.routeQueueInsertionCandidate?.liveQueueWriteApprovedNow === false &&
    packet.routeQueueInsertionCandidate?.liveQueueWritePerformed === false &&
    packet.routeQueueInsertionCandidate?.backendQueueSubmissionPerformed === false &&
    packet.routeQueueInsertionCandidate?.serviceRoleTransactionPerformed === false &&
    packet.routeQueueInsertionCandidate?.workerDispatchPerformed === false &&
    packet.routeQueueInsertionCandidate?.toolExecutionPerformed === false &&
    packet.gpuRuntimeShouldStartNow === false &&
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

function serviceRoleQueueSmokeAuthorizationAccepted(
  packet?: AiGraphicsExternalBetaServiceRoleQueueSmokeAuthorization,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_AUTHORIZATION_DECISION &&
    packet.status ===
      'external_beta_service_role_queue_smoke_authorization_recorded_execution_still_blocked' &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidenceRequests === 1 &&
    packet.serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence === 21 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.heavyToolsIncorrectlyTargetingCpu === 0 &&
    packet.serviceRoleQueueSmokeApprovedNowTools === 0 &&
    packet.liveQueueWritesApprovedNowTools === 0 &&
    packet.liveQueueWritesPerformedNowTools === 0 &&
    packet.workerDispatchApprovedNowTools === 0 &&
    packet.toolExecutionApprovedNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.sourceExternalBetaServiceRoleQueueSmokePreflightAccepted === true &&
    packet.booleans.gpuHeavyToolsTargetGpuRuntime === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.serviceRoleCredentialsServerOnly === true &&
    packet.booleans.serviceRoleQueueSmokeApprovedNow === false &&
    packet.booleans.liveQueueWriteApprovedNow === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function authorizationRecordAccepted(
  input: AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationInput,
): boolean {
  return input.externalBetaApiRouteQueueSmokeAuthorizationGranted === true &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokeAuthorizationRef) &&
    (input.externalBetaApiRouteQueueSmokeOperatorRole ??
      'AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_OPERATOR') ===
        'AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_OPERATOR' &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueInsertionProofRef) &&
    hasPrivateEvidenceRef(input.externalBetaServiceRoleQueueSmokeAuthorizationRef) &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokeNonProductionEnvironmentRef) &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokeRouteExecutionWindowRef) &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokeQueueWriteWindowRef) &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokeCleanupPlanRef) &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokeRollbackPlanRef) &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokeTelemetryRef) &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokeCostCeilingRef) &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokePrivateNetworkRef) &&
    hasPrivateEvidenceRef(input.externalBetaApiRouteQueueSmokeIncidentResponseRef)
}

function statusFromInput(input: {
  hasRouteQueueProof: boolean
  routeQueueProofAccepted: boolean
  hasServiceRoleAuthorization: boolean
  serviceRoleAuthorizationAccepted: boolean
  authorizationAccepted: boolean
}): AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationStatus {
  if (!input.hasRouteQueueProof) {
    return 'missing_external_beta_api_route_queue_insertion_proof'
  }
  if (!input.routeQueueProofAccepted) {
    return 'external_beta_api_route_queue_insertion_proof_rejected'
  }
  if (!input.hasServiceRoleAuthorization) {
    return 'missing_external_beta_service_role_queue_smoke_authorization'
  }
  if (!input.serviceRoleAuthorizationAccepted) {
    return 'external_beta_service_role_queue_smoke_authorization_rejected'
  }
  if (!input.authorizationAccepted) {
    return 'awaiting_external_beta_api_route_queue_smoke_authorization'
  }
  return 'external_beta_api_route_queue_smoke_authorization_recorded_execution_still_blocked'
}

function buildAuthorizationCandidate(input: {
  recorded: boolean
  routeQueueProofAccepted: boolean
  serviceRoleAuthorizationAccepted: boolean
  sourceCandidate: AiGraphicsExternalBetaApiRouteQueueInsertionCandidate | null
}): AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationCandidate | null {
  if (!input.routeQueueProofAccepted || !input.serviceRoleAuthorizationAccepted || !input.sourceCandidate) {
    return null
  }
  const source = input.sourceCandidate
  return {
    authorizationId: 'ai_graphics_external_beta_api_route_queue_smoke_authorization',
    routeId: source.routeId,
    method: source.method,
    routePath: source.routePath,
    queueName: source.queueName,
    queueJobType: source.queueJobType,
    queueJobStatus: source.queueJobStatus,
    toolId: source.toolId,
    capabilityId: source.capabilityId,
    workspaceId: source.workspaceId,
    projectId: source.projectId,
    approvedPlanSnapshotId: source.approvedPlanSnapshotId,
    creditReservationId: source.creditReservationId,
    privateArtifactManifestRef: source.privateArtifactManifestRef,
    traceId: source.traceId,
    idempotencyKey: source.idempotencyKey,
    runtimeTarget: source.runtimeTarget,
    workerType: source.workerType,
    gpuRequiredForRuntime: source.gpuRequiredForRuntime,
    sourceApiRouteQueueInsertionProofAccepted: input.routeQueueProofAccepted,
    sourceServiceRoleQueueSmokeAuthorizationAccepted:
      input.serviceRoleAuthorizationAccepted,
    apiRouteQueueSmokeAuthorizationCandidateWithProvidedEvidence: true,
    apiRouteQueueSmokeAuthorizationRecordedWithProvidedEvidence: input.recorded,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      input.recorded && source.gpuRuntimeStartAllowedForAcceptedExternalBetaJob,
    gpuRuntimeShouldStartNow: false,
    apiRouteQueueSmokeApprovedNow: false,
    apiRouteMountedNow: false,
    apiRouteExecutionApprovedNow: false,
    apiRouteExecutionPerformed: false,
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformed: false,
    backendQueueSubmissionApprovedNow: false,
    backendQueueSubmissionPerformed: false,
    serviceRoleTransactionPerformed: false,
    workerEnqueuePerformed: false,
    workerLeaseCreated: false,
    workerDispatchApprovedNow: false,
    workerDispatchPerformed: false,
    toolExecutionApprovedNow: false,
    toolExecutionPerformed: false,
  }
}

export function buildAiGraphicsExternalBetaApiRouteQueueSmokeAuthorization(
  input: AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationInput = {},
): AiGraphicsExternalBetaApiRouteQueueSmokeAuthorization {
  const routeQueueProof =
    input.sourceExternalBetaApiRouteQueueInsertionProofPacket ?? null
  const serviceRoleAuthorization =
    input.sourceExternalBetaServiceRoleQueueSmokeAuthorizationPacket ?? null
  const sourceCandidate = routeQueueProof?.routeQueueInsertionCandidate ?? null
  const routeProofAccepted = routeQueueInsertionProofAccepted(
    input.sourceExternalBetaApiRouteQueueInsertionProofPacket,
  )
  const serviceRoleAccepted = serviceRoleQueueSmokeAuthorizationAccepted(
    input.sourceExternalBetaServiceRoleQueueSmokeAuthorizationPacket,
  )
  const recordAccepted = authorizationRecordAccepted(input)
  const status = statusFromInput({
    hasRouteQueueProof: Boolean(routeQueueProof),
    routeQueueProofAccepted: routeProofAccepted,
    hasServiceRoleAuthorization: Boolean(serviceRoleAuthorization),
    serviceRoleAuthorizationAccepted: serviceRoleAccepted,
    authorizationAccepted: recordAccepted,
  })
  const recorded =
    status ===
      'external_beta_api_route_queue_smoke_authorization_recorded_execution_still_blocked'
  const candidate = buildAuthorizationCandidate({
    recorded,
    routeQueueProofAccepted: routeProofAccepted,
    serviceRoleAuthorizationAccepted: serviceRoleAccepted,
    sourceCandidate,
  })
  const candidateReady = Boolean(candidate)
  const gpuRuntimeTargetedTools =
    serviceRoleAuthorization?.gpuRuntimeTargetedTools ?? 0
  const sourceServiceRoleQueueSmokePreflightAccepted =
    serviceRoleAccepted &&
    serviceRoleAuthorization?.sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidenceRequests === 1 &&
    serviceRoleAuthorization.booleans.sourceExternalBetaServiceRoleQueueSmokePreflightAccepted === true
  const gpuRuntimeStartAllowedForAcceptedExternalBetaJob =
    candidate?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_AUTHORIZATION_DECISION,
    sourceExternalBetaApiRouteQueueInsertionProofDecision:
      routeQueueProof?.decision ?? null,
    sourceExternalBetaServiceRoleQueueSmokeAuthorizationDecision:
      serviceRoleAuthorization?.decision ?? null,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    sourceApiRouteQueueInsertionProofReadyRequestsWithProvidedEvidence:
      routeProofAccepted ? 1 : 0,
    sourceServiceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence:
      serviceRoleAuthorization?.serviceRoleQueueSmokeAuthorizationRecordedToolsWithProvidedEvidence ?? 0,
    sourceServiceRoleQueueSmokePreflightReadyWithProvidedEvidenceRequests:
      sourceServiceRoleQueueSmokePreflightAccepted ? 1 : 0,
    apiRouteQueueSmokeAuthorizationCandidateRequestsWithProvidedEvidence:
      candidateReady ? 1 : 0,
    apiRouteQueueSmokeAuthorizationRecordedRequestsWithProvidedEvidence:
      recorded ? 1 : 0,
    gpuRuntimeTargetedTools,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests:
      gpuRuntimeStartAllowedForAcceptedExternalBetaJob ? 1 : 0,
    apiRouteQueueSmokeApprovedNowRequests: 0,
    apiRouteExecutionsApprovedNowRequests: 0,
    apiRouteExecutionsPerformedNowRequests: 0,
    liveQueueWritesApprovedNowRequests: 0,
    liveQueueWritesPerformedNowRequests: 0,
    workerDispatchApprovedNowRequests: 0,
    workerDispatchPerformedNowRequests: 0,
    toolExecutionApprovedNowRequests: 0,
    toolExecutionPerformedNowRequests: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceExternalBetaApiRouteQueueInsertionProof: routeQueueProof,
    sourceExternalBetaServiceRoleQueueSmokeAuthorization: serviceRoleAuthorization,
    sourceRouteQueueInsertionCandidate: sourceCandidate,
    apiRouteQueueSmokeAuthorizationCandidate: candidate,
    apiRouteQueueSmokeAuthorizationRecord: {
      accepted: recordAccepted,
      operatorRole: 'AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_OPERATOR',
      authorizationRef:
        input.externalBetaApiRouteQueueSmokeAuthorizationRef ?? null,
      routeQueueInsertionProofRef:
        input.externalBetaApiRouteQueueInsertionProofRef ?? null,
      serviceRoleQueueSmokeAuthorizationRef:
        input.externalBetaServiceRoleQueueSmokeAuthorizationRef ?? null,
      nonProductionEnvironmentRef:
        input.externalBetaApiRouteQueueSmokeNonProductionEnvironmentRef ?? null,
      routeExecutionWindowRef:
        input.externalBetaApiRouteQueueSmokeRouteExecutionWindowRef ?? null,
      queueWriteWindowRef:
        input.externalBetaApiRouteQueueSmokeQueueWriteWindowRef ?? null,
      cleanupPlanRef: input.externalBetaApiRouteQueueSmokeCleanupPlanRef ?? null,
      rollbackPlanRef: input.externalBetaApiRouteQueueSmokeRollbackPlanRef ?? null,
      telemetryRef: input.externalBetaApiRouteQueueSmokeTelemetryRef ?? null,
      costCeilingRef: input.externalBetaApiRouteQueueSmokeCostCeilingRef ?? null,
      privateNetworkRef:
        input.externalBetaApiRouteQueueSmokePrivateNetworkRef ?? null,
      incidentResponseRef:
        input.externalBetaApiRouteQueueSmokeIncidentResponseRef ?? null,
      authorizesApiRouteQueueSmokeNow: false,
      authorizesApiRouteExecutionNow: false,
      authorizesLiveQueueWriteNow: false,
      authorizesWorkerDispatchNow: false,
      authorizesToolExecutionNow: false,
      authorizesRuntimeNow: false,
    },
    allowedApiRouteQueueSmokeAuthorizationActions,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      externalBetaApiRouteQueueSmokeAuthorizationPrepared: true,
      sourceExternalBetaApiRouteQueueInsertionProofAccepted: routeProofAccepted,
      sourceExternalBetaServiceRoleQueueSmokeAuthorizationAccepted:
        serviceRoleAccepted,
      sourceServiceRoleQueueSmokePreflightAcceptedWithProvidedEvidence:
        sourceServiceRoleQueueSmokePreflightAccepted,
      apiRouteQueueSmokeAuthorizationRecordAccepted: recordAccepted,
      all21ToolsCovered:
        routeQueueProof?.booleans.all21ToolsCovered === true &&
        serviceRoleAuthorization?.booleans.all21ToolsCovered === true,
      all12CapabilitiesCovered:
        routeQueueProof?.booleans.all12CapabilitiesCovered === true &&
        serviceRoleAuthorization?.booleans.all12CapabilitiesCovered === true,
      apiRouteQueueSmokeAuthorizationCandidateWithProvidedEvidence:
        candidateReady,
      apiRouteQueueSmokeAuthorizationRecordedWithProvidedEvidence: recorded,
      gpuHeavyToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartAllowedOnlyForAcceptedJobs: true,
      gpuRuntimeShouldStartNow: false,
      cpuFallbackAllowedForHeavyTools: false,
      serviceRoleCredentialsServerOnly: true,
      nonProductionEnvironmentRequired: true,
      explicitSmokeConfirmationRequired: true,
      routeExecutionWindowRequired: true,
      queueWriteWindowRequired: true,
      cleanupRequired: true,
      rollbackRequired: true,
      telemetryRequired: true,
      costCeilingRequired: true,
      privateNetworkRequired: true,
      incidentResponseRequired: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      apiRouteQueueSmokeApprovedNow: false,
      apiRouteMountedNow: false,
      apiRouteExecutionApprovedNow: false,
      apiRouteExecutionPerformed: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      serviceRoleQueueTransactionApprovedNow: false,
      serviceRoleQueueSmokeApprovedNow: false,
      liveServiceRoleQueueSmokeExecutedNow: false,
      liveQueueWriteApprovedNow: false,
      liveJobBatchInsertApprovedNow: false,
      liveJobInsertApprovedNow: false,
      liveWorkerClaimInsertApprovedNow: false,
      liveWorkerEventInsertApprovedNow: false,
      liveAuditEventInsertApprovedNow: false,
      workerLeaseCreationApprovedNow: false,
      workerDispatchApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
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
