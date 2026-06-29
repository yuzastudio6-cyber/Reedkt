import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_AUTHORIZATION_DECISION,
  type AiGraphicsExternalBetaApiRouteQueueSmokeAuthorization,
  type AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationCandidate,
} from './ai-graphics-external-beta-api-route-queue-smoke-authorization'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_PROOF_DECISION =
  'ai_graphics_external_beta_api_route_queue_smoke_proof_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteQueueSmokeProofStatus =
  | 'missing_external_beta_api_route_queue_smoke_authorization'
  | 'external_beta_api_route_queue_smoke_authorization_rejected'
  | 'missing_external_beta_api_route_queue_smoke_result'
  | 'external_beta_api_route_queue_smoke_result_rejected'
  | 'external_beta_api_route_queue_smoke_proof_accepted_with_runtime_blocks'

export interface AiGraphicsExternalBetaApiRouteQueueSmokeResult {
  ok: true
  decision: 'ai_graphics_external_beta_api_route_queue_smoke_passed_with_cleanup'
  status: 'external_beta_api_route_queue_smoke_passed_with_cleanup_no_worker_or_tool_execution'
  sourceApiRouteQueueSmokeAuthorizationRef: string
  sourceApiRouteQueueSmokeAuthorizationAccepted: true
  routeId: 'ai_graphics_external_beta_tool_call'
  method: 'POST'
  routePath: '/api/ai-graphics/external-beta/tool-call'
  queueName: string
  queueJobType: 'ai_graphics_tool_runtime'
  queueJobStatus: 'inserted_then_cleaned_up_private_non_production_smoke'
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
  gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
  gpuRuntimeShouldStartNow: false
  apiRouteQueueSmokeExecutedInPrivateNonProduction: true
  apiRouteInvocationCount: 1
  liveQueueRowsInserted: 1
  liveQueueRowsPersistedAfterCleanup: 0
  liveWorkerClaimsReturned: 0
  liveWorkerDispatchesNow: 0
  liveToolExecutionsNow: 0
  routeExecutionWindowSatisfied: true
  queueWriteWindowSatisfied: true
  cleanupCompleted: true
  rollbackReady: true
  telemetryCaptured: true
  costWithinCeiling: true
  privateNetworkUsed: true
  secretsRedactedFromOutput: true
  publicArtifactCreated: false
  signedUrlCreated: false
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
}

export interface AiGraphicsExternalBetaApiRouteQueueSmokeProofInput {
  sourceExternalBetaApiRouteQueueSmokeAuthorizationPacket?:
    AiGraphicsExternalBetaApiRouteQueueSmokeAuthorization
  apiRouteQueueSmokeResult?: AiGraphicsExternalBetaApiRouteQueueSmokeResult
  apiRouteQueueSmokeEvidenceRef?: string
  apiRouteQueueSmokeTelemetryRef?: string
  apiRouteQueueSmokeCleanupProofRef?: string
}

export interface AiGraphicsExternalBetaApiRouteQueueSmokeProof {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_PROOF_DECISION
  sourceExternalBetaApiRouteQueueSmokeAuthorizationDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_AUTHORIZATION_DECISION | null
  status: AiGraphicsExternalBetaApiRouteQueueSmokeProofStatus
  sourceAuthorizationAccepted: boolean
  proofAcceptedWithProvidedEvidence: boolean
  rejectionReasons: string[]
  requestedToolId: string | null
  capabilityId: string | null
  apiRouteQueueSmokeProofAcceptedRequestsWithProvidedEvidence: 0 | 1
  sourceAuthorizationAcceptedRequestsWithProvidedEvidence: 0 | 1
  liveApiRouteQueueSmokeAcceptedWithProvidedEvidence: 0 | 1
  liveQueueRowsAcceptedWithProvidedEvidence: 0 | 1
  liveQueueRowsPersistedAfterCleanup: 0
  liveWorkerClaimsAcceptedWithProvidedEvidence: 0
  liveWorkerDispatchesAcceptedWithProvidedEvidence: 0
  liveToolExecutionsAcceptedWithProvidedEvidence: 0
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests: 0 | 1
  gpuRuntimeShouldStartNow: false
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceAuthorizationCandidate:
    AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationCandidate | null
  savedApiRouteQueueSmokeResult:
    AiGraphicsExternalBetaApiRouteQueueSmokeResult | null
  evidence: {
    apiRouteQueueSmokeEvidenceRef: string | null
    apiRouteQueueSmokeTelemetryRef: string | null
    apiRouteQueueSmokeCleanupProofRef: string | null
    sourceApiRouteQueueSmokeAuthorizationRef: string | null
    sanitizedSourceStatus: string | null
    sanitizedSourceDecision: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredWorkerMode: 'none'
    requiredE2eRuntimeMode: 'route_to_queue_smoke_only'
    savedResultOnly: true
  }
  policy: {
    validatesSavedSmokeResultOnly: true
    noLiveApiRouteExecutionByProofValidator: true
    noLiveQueueWriteByProofValidator: true
    noWorkerDispatchByProofValidator: true
    noToolExecutionByProofValidator: true
    noGpuRuntimeStartByProofValidator: true
    cleanupMustPersistZeroRows: true
    nextGateRequiresWorkerLeaseAndDispatchProof: true
  }
  booleans: {
    externalBetaApiRouteQueueSmokeProofPrepared: true
    sourceExternalBetaApiRouteQueueSmokeAuthorizationAccepted: boolean
    apiRouteQueueSmokeProofAcceptedWithProvidedEvidence: boolean
    savedApiRouteQueueSmokeResultAcceptedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob: boolean
    gpuRuntimeShouldStartNow: false
    cleanupVerifiedWithProvidedEvidence: boolean
    routeExecutionWindowAcceptedWithProvidedEvidence: boolean
    queueWriteWindowAcceptedWithProvidedEvidence: boolean
    telemetryAcceptedWithProvidedEvidence: boolean
    privateNetworkAcceptedWithProvidedEvidence: boolean
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
    liveQueueWriteApprovedNow: false
    liveQueueWritePerformed: false
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

function hasValue(value?: string | null): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function hasPrivateEvidenceRef(value?: string | null): boolean {
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
    normalized.startsWith('external-beta-route-queue-smoke://')
}

function authorizationAccepted(
  packet?: AiGraphicsExternalBetaApiRouteQueueSmokeAuthorization,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_AUTHORIZATION_DECISION &&
    packet.status ===
      'external_beta_api_route_queue_smoke_authorization_recorded_execution_still_blocked' &&
    packet.apiRouteQueueSmokeAuthorizationRecordedRequestsWithProvidedEvidence === 1 &&
    packet.apiRouteQueueSmokeAuthorizationCandidate !== null &&
    packet.apiRouteQueueSmokeAuthorizationCandidate?.queueJobStatus === 'prepared_not_submitted' &&
    packet.apiRouteQueueSmokeAuthorizationCandidate?.apiRouteExecutionPerformed === false &&
    packet.apiRouteQueueSmokeAuthorizationCandidate?.liveQueueWritePerformed === false &&
    packet.apiRouteQueueSmokeAuthorizationCandidate?.workerDispatchPerformed === false &&
    packet.apiRouteQueueSmokeAuthorizationCandidate?.toolExecutionPerformed === false &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.all21ToolsCovered === true &&
    packet.booleans.all12CapabilitiesCovered === true &&
    packet.booleans.gpuHeavyToolsTargetGpuRuntime === true &&
    packet.booleans.gpuRuntimeOnDemandOnly === true &&
    packet.booleans.noIdleGpuRuntimeApproved === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.apiRouteQueueSmokeApprovedNow === false &&
    packet.booleans.apiRouteExecutionPerformed === false &&
    packet.booleans.liveQueueWritePerformed === false &&
    packet.booleans.workerDispatchPerformed === false &&
    packet.booleans.toolExecutionPerformed === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function compareResultToCandidate(
  result: AiGraphicsExternalBetaApiRouteQueueSmokeResult,
  candidate: AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationCandidate,
): string[] {
  return [
    result.routeId !== candidate.routeId ? 'route id mismatch' : undefined,
    result.method !== candidate.method ? 'route method mismatch' : undefined,
    result.routePath !== candidate.routePath ? 'route path mismatch' : undefined,
    result.queueName !== candidate.queueName ? 'queue name mismatch' : undefined,
    result.queueJobType !== candidate.queueJobType ? 'queue job type mismatch' : undefined,
    result.toolId !== candidate.toolId ? 'tool id mismatch' : undefined,
    result.capabilityId !== candidate.capabilityId ? 'capability id mismatch' : undefined,
    result.workspaceId !== candidate.workspaceId ? 'workspace id mismatch' : undefined,
    result.projectId !== candidate.projectId ? 'project id mismatch' : undefined,
    result.approvedPlanSnapshotId !== candidate.approvedPlanSnapshotId
      ? 'approved snapshot mismatch'
      : undefined,
    result.creditReservationId !== candidate.creditReservationId
      ? 'credit reservation mismatch'
      : undefined,
    result.privateArtifactManifestRef !== candidate.privateArtifactManifestRef
      ? 'private artifact manifest mismatch'
      : undefined,
    result.idempotencyKey !== candidate.idempotencyKey
      ? 'idempotency key mismatch'
      : undefined,
    result.runtimeTarget !== candidate.runtimeTarget ? 'runtime target mismatch' : undefined,
    result.workerType !== candidate.workerType ? 'worker type mismatch' : undefined,
    result.gpuRequiredForRuntime !== candidate.gpuRequiredForRuntime
      ? 'GPU runtime requirement mismatch'
      : undefined,
    result.gpuRuntimeStartAllowedForAcceptedExternalBetaJob !==
      candidate.gpuRuntimeStartAllowedForAcceptedExternalBetaJob
      ? 'GPU runtime start allowance mismatch'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function validateSmokeResult(
  result: AiGraphicsExternalBetaApiRouteQueueSmokeResult | undefined,
  candidate: AiGraphicsExternalBetaApiRouteQueueSmokeAuthorizationCandidate | null,
): string[] {
  if (!result) return ['external beta API route queue smoke result is missing']
  if (!candidate) return ['accepted API route queue smoke authorization candidate is missing']
  return [
    result.ok !== true ? 'smoke result ok flag is not true' : undefined,
    result.decision !== 'ai_graphics_external_beta_api_route_queue_smoke_passed_with_cleanup'
      ? 'smoke result decision is not accepted'
      : undefined,
    result.status !==
      'external_beta_api_route_queue_smoke_passed_with_cleanup_no_worker_or_tool_execution'
      ? 'smoke result status is not accepted'
      : undefined,
    !hasPrivateEvidenceRef(result.sourceApiRouteQueueSmokeAuthorizationRef)
      ? 'smoke result must include a private source authorization ref'
      : undefined,
    result.sourceApiRouteQueueSmokeAuthorizationAccepted !== true
      ? 'smoke result must preserve the API route queue smoke authorization chain'
      : undefined,
    result.queueJobStatus !== 'inserted_then_cleaned_up_private_non_production_smoke'
      ? 'smoke result queue job status is not accepted'
      : undefined,
    result.apiRouteQueueSmokeExecutedInPrivateNonProduction !== true
      ? 'smoke result must come from a private non-production route-to-queue smoke'
      : undefined,
    result.apiRouteInvocationCount !== 1
      ? 'smoke result must invoke exactly one API route request'
      : undefined,
    result.liveQueueRowsInserted !== 1
      ? 'smoke result must insert exactly one queue row before cleanup'
      : undefined,
    result.liveQueueRowsPersistedAfterCleanup !== 0
      ? 'smoke cleanup must leave zero persisted route queue rows'
      : undefined,
    result.liveWorkerClaimsReturned !== 0
      ? 'smoke result must not claim worker rows'
      : undefined,
    result.liveWorkerDispatchesNow !== 0
      ? 'smoke result must not dispatch workers'
      : undefined,
    result.liveToolExecutionsNow !== 0
      ? 'smoke result must not execute tools'
      : undefined,
    result.gpuRuntimeShouldStartNow !== false
      ? 'smoke result must not start GPU runtime'
      : undefined,
    result.routeExecutionWindowSatisfied !== true
      ? 'smoke result must satisfy the route execution window'
      : undefined,
    result.queueWriteWindowSatisfied !== true
      ? 'smoke result must satisfy the queue write window'
      : undefined,
    result.cleanupCompleted !== true
      ? 'smoke result must include completed cleanup'
      : undefined,
    result.rollbackReady !== true
      ? 'smoke result must preserve rollback readiness'
      : undefined,
    result.telemetryCaptured !== true
      ? 'smoke result must capture telemetry'
      : undefined,
    result.costWithinCeiling !== true
      ? 'smoke result must stay within the cost ceiling'
      : undefined,
    result.privateNetworkUsed !== true
      ? 'smoke result must use the private network boundary'
      : undefined,
    result.secretsRedactedFromOutput !== true
      ? 'smoke result must redact secrets from output'
      : undefined,
    result.publicArtifactCreated !== false
      ? 'smoke result must not create public artifacts'
      : undefined,
    result.signedUrlCreated !== false
      ? 'smoke result must not create signed URLs'
      : undefined,
    result.externalBetaReadyNowTools !== 0
      ? 'smoke result must not unlock external beta tools'
      : undefined,
    result.productionReadyNowTools !== 0
      ? 'smoke result must not unlock production tools'
      : undefined,
    ...compareResultToCandidate(result, candidate),
  ].filter((reason): reason is string => Boolean(reason))
}

function evidenceRefsMissing(
  input: AiGraphicsExternalBetaApiRouteQueueSmokeProofInput,
): string[] {
  return [
    !hasPrivateEvidenceRef(input.apiRouteQueueSmokeEvidenceRef)
      ? 'API route queue smoke evidence ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.apiRouteQueueSmokeTelemetryRef)
      ? 'API route queue smoke telemetry ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.apiRouteQueueSmokeCleanupProofRef)
      ? 'API route queue smoke cleanup proof ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function buildBooleans(input: {
  accepted: boolean
  authorizationAccepted: boolean
  result?: AiGraphicsExternalBetaApiRouteQueueSmokeResult
}) {
  return {
    externalBetaApiRouteQueueSmokeProofPrepared: true,
    sourceExternalBetaApiRouteQueueSmokeAuthorizationAccepted:
      input.authorizationAccepted,
    apiRouteQueueSmokeProofAcceptedWithProvidedEvidence: input.accepted,
    savedApiRouteQueueSmokeResultAcceptedWithProvidedEvidence: input.accepted,
    all21ToolsCovered: true,
    all12CapabilitiesCovered: true,
    all8GpuToolsTargetGpuRuntime: true,
    gpuRuntimeOnDemandOnly: true,
    noIdleGpuRuntimeApproved: true,
    gpuStartsOnlyForApprovedWorkerOrToolCall: true,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      input.accepted &&
      input.result?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true,
    gpuRuntimeShouldStartNow: false,
    cleanupVerifiedWithProvidedEvidence: input.accepted,
    routeExecutionWindowAcceptedWithProvidedEvidence: input.accepted,
    queueWriteWindowAcceptedWithProvidedEvidence: input.accepted,
    telemetryAcceptedWithProvidedEvidence: input.accepted,
    privateNetworkAcceptedWithProvidedEvidence: input.accepted,
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
    liveQueueWriteApprovedNow: false,
    liveQueueWritePerformed: false,
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
  } as const
}

export function evaluateAiGraphicsExternalBetaApiRouteQueueSmokeProof(
  input: AiGraphicsExternalBetaApiRouteQueueSmokeProofInput = {},
): AiGraphicsExternalBetaApiRouteQueueSmokeProof {
  const sourceAuthorization =
    input.sourceExternalBetaApiRouteQueueSmokeAuthorizationPacket ?? null
  const sourceAuthorizationAccepted = authorizationAccepted(
    input.sourceExternalBetaApiRouteQueueSmokeAuthorizationPacket,
  )
  const sourceCandidate =
    sourceAuthorization?.apiRouteQueueSmokeAuthorizationCandidate ?? null
  const authorizationReasons = sourceAuthorization
    ? sourceAuthorizationAccepted
      ? []
      : ['accepted API route queue smoke authorization packet is missing']
    : ['external beta API route queue smoke authorization packet is missing']
  const resultReasons = validateSmokeResult(
    input.apiRouteQueueSmokeResult,
    sourceCandidate,
  )
  const rejectionReasons = [
    ...authorizationReasons,
    ...resultReasons,
    ...evidenceRefsMissing(input),
  ]
  const accepted = rejectionReasons.length === 0
  const result = input.apiRouteQueueSmokeResult ?? null
  const status: AiGraphicsExternalBetaApiRouteQueueSmokeProofStatus =
    !sourceAuthorization
      ? 'missing_external_beta_api_route_queue_smoke_authorization'
      : !sourceAuthorizationAccepted
        ? 'external_beta_api_route_queue_smoke_authorization_rejected'
        : !result
          ? 'missing_external_beta_api_route_queue_smoke_result'
          : accepted
            ? 'external_beta_api_route_queue_smoke_proof_accepted_with_runtime_blocks'
            : 'external_beta_api_route_queue_smoke_result_rejected'

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_QUEUE_SMOKE_PROOF_DECISION,
    sourceExternalBetaApiRouteQueueSmokeAuthorizationDecision:
      sourceAuthorization?.decision ?? null,
    status,
    sourceAuthorizationAccepted,
    proofAcceptedWithProvidedEvidence: accepted,
    rejectionReasons,
    requestedToolId: sourceCandidate?.toolId ?? result?.toolId ?? null,
    capabilityId: sourceCandidate?.capabilityId ?? result?.capabilityId ?? null,
    apiRouteQueueSmokeProofAcceptedRequestsWithProvidedEvidence: accepted ? 1 : 0,
    sourceAuthorizationAcceptedRequestsWithProvidedEvidence:
      sourceAuthorizationAccepted ? 1 : 0,
    liveApiRouteQueueSmokeAcceptedWithProvidedEvidence: accepted ? 1 : 0,
    liveQueueRowsAcceptedWithProvidedEvidence: accepted ? 1 : 0,
    liveQueueRowsPersistedAfterCleanup: 0,
    liveWorkerClaimsAcceptedWithProvidedEvidence: 0,
    liveWorkerDispatchesAcceptedWithProvidedEvidence: 0,
    liveToolExecutionsAcceptedWithProvidedEvidence: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJobRequests:
      accepted && result?.gpuRuntimeStartAllowedForAcceptedExternalBetaJob === true
        ? 1
        : 0,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceAuthorizationCandidate: sourceCandidate,
    savedApiRouteQueueSmokeResult: result,
    evidence: {
      apiRouteQueueSmokeEvidenceRef:
        input.apiRouteQueueSmokeEvidenceRef ?? null,
      apiRouteQueueSmokeTelemetryRef:
        input.apiRouteQueueSmokeTelemetryRef ?? null,
      apiRouteQueueSmokeCleanupProofRef:
        input.apiRouteQueueSmokeCleanupProofRef ?? null,
      sourceApiRouteQueueSmokeAuthorizationRef:
        result?.sourceApiRouteQueueSmokeAuthorizationRef ?? null,
      sanitizedSourceStatus: result?.status ?? null,
      sanitizedSourceDecision: result?.decision ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredWorkerMode: 'none',
      requiredE2eRuntimeMode: 'route_to_queue_smoke_only',
      savedResultOnly: true,
    },
    policy: {
      validatesSavedSmokeResultOnly: true,
      noLiveApiRouteExecutionByProofValidator: true,
      noLiveQueueWriteByProofValidator: true,
      noWorkerDispatchByProofValidator: true,
      noToolExecutionByProofValidator: true,
      noGpuRuntimeStartByProofValidator: true,
      cleanupMustPersistZeroRows: true,
      nextGateRequiresWorkerLeaseAndDispatchProof: true,
    },
    booleans: buildBooleans({
      accepted,
      authorizationAccepted: sourceAuthorizationAccepted,
      result: input.apiRouteQueueSmokeResult,
    }),
  }
}
