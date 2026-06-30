import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION,
  type AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization,
  type AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationCandidate,
} from './ai-graphics-external-beta-api-route-worker-runtime-smoke-authorization'

export const AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_PROOF_DECISION =
  'ai_graphics_external_beta_api_route_worker_runtime_smoke_proof_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProofStatus =
  | 'missing_external_beta_api_route_worker_runtime_smoke_authorization'
  | 'external_beta_api_route_worker_runtime_smoke_authorization_rejected'
  | 'missing_external_beta_api_route_worker_runtime_smoke_result'
  | 'external_beta_api_route_worker_runtime_smoke_result_rejected'
  | 'external_beta_api_route_worker_runtime_smoke_proof_accepted_with_runtime_blocks'

export interface AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeResult {
  ok: true
  decision: 'ai_graphics_external_beta_api_route_worker_runtime_smoke_passed_with_cleanup'
  status: 'external_beta_api_route_worker_runtime_smoke_passed_private_non_production_no_tool_execution'
  sourceWorkerRuntimeSmokeAuthorizationRef: string
  sourceWorkerRuntimeSmokeAuthorizationAccepted: true
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: true
  toolId: string
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  routeId: string
  queueName: string
  queueJobType: 'ai_graphics_tool_runtime'
  approvedPlanSnapshotId: string
  creditReservationId: string
  idempotencyKey: string
  runtimeTarget: string
  workerType: string
  gpuRequiredForRuntime: boolean
  privateInputManifestRef: string
  privateOutputManifestRef: string
  privateTelemetryRef: string
  privateLeaseAuditRef: string
  modelWeightOrCacheManifestRef: string | null
  workerRuntimeSmokeExecutedInPrivateNonProduction: true
  workerLeaseCreatedCount: 1
  workerLeaseReleasedCount: 1
  workerDispatchCount: 1
  toolExecutionCount: 0
  privateArtifactWriteCount: 0
  routeExecutionCount: 0
  providerRuntimeCount: 0
  gpuRuntimeStartedForAcceptedJob: boolean
  gpuRuntimeReleasedAfterAcceptedJob: boolean
  gpuRuntimeIdleAfterCleanup: true
  gpuRuntimeShouldStartNow: false
  modelWeightsDownloaded: false
  modelWeightsLoaded: false
  privateArtifactSandboxUsed: true
  resultCaptureCompleted: true
  qaGatePassedWithProvidedEvidence: true
  telemetryCaptured: true
  costWithinCeiling: true
  rollbackReady: true
  secretsRedactedFromOutput: true
  publicArtifactCreated: false
  signedUrlCreated: false
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
}

export interface AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProofInput {
  sourceWorkerRuntimeSmokeAuthorizationPacket?:
    AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization
  workerRuntimeSmokeResult?: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeResult
  workerRuntimeSmokeEvidenceRef?: string
  workerRuntimeSmokeTelemetryRef?: string
  workerRuntimeSmokeCleanupProofRef?: string
  workerRuntimeSmokeQaProofRef?: string
}

export interface AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_PROOF_DECISION
  sourceWorkerRuntimeSmokeAuthorizationDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION | null
  status: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProofStatus
  sourceAuthorizationAccepted: boolean
  proofAcceptedWithProvidedEvidence: boolean
  rejectionReasons: string[]
  requestedToolId: string | null
  capabilityId: string | null
  workerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence: 0 | 1
  sourceAuthorizationAcceptedRequestsWithProvidedEvidence: 0 | 1
  workerRuntimeSmokeAcceptedWithProvidedEvidence: 0 | 1
  workerLeaseLifecycleAcceptedWithProvidedEvidence: 0 | 1
  workerDispatchAcceptedWithProvidedEvidence: 0 | 1
  toolExecutionAcceptedWithProvidedEvidence: 0
  gpuRuntimeStartedWithProvidedEvidence: 0 | 1
  gpuRuntimeReleasedWithProvidedEvidence: 0 | 1
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: 0 | 1
  gpuRuntimeShouldStartNow: false
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceAuthorizationCandidate:
    AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationCandidate | null
  savedWorkerRuntimeSmokeResult:
    AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeResult | null
  evidence: {
    workerRuntimeSmokeEvidenceRef: string | null
    workerRuntimeSmokeTelemetryRef: string | null
    workerRuntimeSmokeCleanupProofRef: string | null
    workerRuntimeSmokeQaProofRef: string | null
    sourceWorkerRuntimeSmokeAuthorizationRef: string | null
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: boolean
    sanitizedSourceStatus: string | null
    sanitizedSourceDecision: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredSmokeMode: 'saved_worker_runtime_smoke_result_only'
    savedResultOnly: true
  }
  policy: {
    validatesSavedSmokeResultOnly: true
    noLiveWorkerLeaseByProofValidator: true
    noLiveWorkerDispatchByProofValidator: true
    noToolExecutionByProofValidator: true
    noPrivateArtifactWriteByProofValidator: true
    noRouteExecutionByProofValidator: true
    gpuMayStartOnlyInAcceptedSavedGpuSmokeResult: true
    gpuMustBeReleasedAfterAcceptedSavedGpuSmokeResult: true
    cleanupMustLeaveGpuIdle: true
    nextGateRequiresPerToolCallableResultAndExternalBetaOwnerGoNoGo: true
  }
  booleans: {
    externalBetaApiRouteWorkerRuntimeSmokeProofPrepared: true
    sourceWorkerRuntimeSmokeAuthorizationAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: boolean
    workerRuntimeSmokeProofAcceptedWithProvidedEvidence: boolean
    savedWorkerRuntimeSmokeResultAcceptedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartedForAcceptedJob: boolean
    gpuRuntimeReleasedAfterAcceptedJob: boolean
    gpuRuntimeIdleAfterCleanup: boolean
    gpuRuntimeShouldStartNow: false
    workerLeaseLifecycleAcceptedWithProvidedEvidence: boolean
    workerDispatchAcceptedWithProvidedEvidence: boolean
    toolExecutionAcceptedWithProvidedEvidence: false
    privateArtifactWriteAcceptedWithProvidedEvidence: false
    qaGateAcceptedWithProvidedEvidence: boolean
    telemetryAcceptedWithProvidedEvidence: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    workerRuntimeSmokeApprovedNow: false
    workerRuntimeSmokeExecutedByValidator: false
    apiRouteExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    backendQueueSubmissionApprovedNow: false
    liveQueueWriteApprovedNow: false
    privateArtifactWriteApprovedNow: false
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
    privateArtifactWritePerformed: false
    serviceRoleQueueSmokePerformed: false
    supabaseMutationPerformed: false
    workerLeaseCreatedByValidator: false
    workerDispatchPerformedByValidator: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformedByValidator: false
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
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
    normalized.startsWith('gcs://') ||
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
    normalized.startsWith('external-beta-worker-runtime-smoke://')
}

function authorizationAccepted(
  packet?: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorization,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_AUTHORIZATION_DECISION &&
    packet.status ===
      'external_beta_api_route_worker_runtime_smoke_authorization_ready_runtime_still_blocked' &&
    packet.workerRuntimeSmokeAuthorizationPreparedWithProvidedEvidence === true &&
    packet.workerRuntimeSmokeAuthorizationPreparedRequestsWithProvidedEvidence === 1 &&
    packet.authorizationCandidate !== null &&
    packet.sourceControlledWorkerRuntimeProofAccepted === true &&
    packet.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === 21 &&
    packet.sourceLiveEnqueueAuthorizationAccepted === true &&
    packet.sourceControlledWorkerRuntimeProofCoversRequestedTool === true &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.booleans.liveWorkerRuntimeSmokeAuthorizedNow === false &&
    packet.booleans.workerRuntimeSmokeExecutedNow === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.workerLeaseCreationApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    packet.evidence
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === true &&
    packet.authorizationCandidate
      ?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    packet.booleans.gpuRuntimeShouldStartNow === false
}

function compareResultToCandidate(
  result: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeResult,
  candidate: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationCandidate,
): string[] {
  return [
    result.toolId !== candidate.toolId ? 'tool id mismatch' : undefined,
    result.capabilityId !== candidate.capabilityId ? 'capability id mismatch' : undefined,
    result.routePath !== candidate.routePath ? 'route path mismatch' : undefined,
    result.routeId !== candidate.routeId ? 'route id mismatch' : undefined,
    result.queueName !== candidate.queueName ? 'queue name mismatch' : undefined,
    result.queueJobType !== candidate.queueJobType ? 'queue job type mismatch' : undefined,
    result.approvedPlanSnapshotId !== candidate.approvedPlanSnapshotId
      ? 'approved snapshot mismatch'
      : undefined,
    result.creditReservationId !== candidate.creditReservationId
      ? 'credit reservation mismatch'
      : undefined,
    result.idempotencyKey !== candidate.idempotencyKey
      ? 'idempotency key mismatch'
      : undefined,
    result.runtimeTarget !== candidate.runtimeTarget ? 'runtime target mismatch' : undefined,
    result.workerType !== candidate.workerType ? 'worker type mismatch' : undefined,
    result.gpuRequiredForRuntime !== candidate.gpuRequiredForRuntime
      ? 'GPU runtime requirement mismatch'
      : undefined,
    result.privateInputManifestRef !== candidate.privateInputManifestRef
      ? 'private input manifest mismatch'
      : undefined,
    result.privateOutputManifestRef !== candidate.privateOutputManifestRef
      ? 'private output manifest mismatch'
      : undefined,
    result.privateTelemetryRef !== candidate.privateTelemetryRef
      ? 'private telemetry ref mismatch'
      : undefined,
    result.privateLeaseAuditRef !== candidate.privateLeaseAuditRef
      ? 'private lease audit ref mismatch'
      : undefined,
    result.modelWeightOrCacheManifestRef !== candidate.modelWeightOrCacheManifestRef
      ? 'model weight/cache manifest mismatch'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function validateSmokeResult(
  result: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeResult | undefined,
  candidate: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeAuthorizationCandidate | null,
): string[] {
  if (!result) return ['external beta worker runtime smoke result is missing']
  if (!candidate) return ['accepted worker runtime smoke authorization candidate is missing']

  const gpuRequired = candidate.gpuRequiredForRuntime === true
  return [
    result.ok !== true ? 'worker runtime smoke result ok flag is not true' : undefined,
    result.decision !==
      'ai_graphics_external_beta_api_route_worker_runtime_smoke_passed_with_cleanup'
      ? 'worker runtime smoke result decision is not accepted'
      : undefined,
    result.status !==
      'external_beta_api_route_worker_runtime_smoke_passed_private_non_production_no_tool_execution'
      ? 'worker runtime smoke result status is not accepted'
      : undefined,
    !hasPrivateEvidenceRef(result.sourceWorkerRuntimeSmokeAuthorizationRef)
      ? 'worker runtime smoke result must include a private source authorization ref'
      : undefined,
    result.sourceWorkerRuntimeSmokeAuthorizationAccepted !== true
      ? 'worker runtime smoke result must preserve the authorization chain'
      : undefined,
    result.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted !== true
      ? 'worker runtime smoke result must preserve the route-bound operator preflight chain'
      : undefined,
    result.workerRuntimeSmokeExecutedInPrivateNonProduction !== true
      ? 'worker runtime smoke must be private non-production'
      : undefined,
    result.workerLeaseCreatedCount !== 1 ? 'worker smoke must create one lease' : undefined,
    result.workerLeaseReleasedCount !== 1 ? 'worker smoke must release one lease' : undefined,
    result.workerDispatchCount !== 1 ? 'worker smoke must dispatch one worker' : undefined,
    result.toolExecutionCount !== 0 ? 'worker smoke must not execute tools' : undefined,
    result.privateArtifactWriteCount !== 0
      ? 'worker smoke must not write private artifacts yet'
      : undefined,
    result.routeExecutionCount !== 0
      ? 'worker smoke result must not execute API routes'
      : undefined,
    result.providerRuntimeCount !== 0
      ? 'worker smoke result must not call providers/models'
      : undefined,
    result.gpuRuntimeStartedForAcceptedJob !== gpuRequired
      ? 'GPU runtime start evidence does not match requested runtime target'
      : undefined,
    result.gpuRuntimeReleasedAfterAcceptedJob !== gpuRequired
      ? 'GPU runtime release evidence does not match requested runtime target'
      : undefined,
    result.gpuRuntimeIdleAfterCleanup !== true
      ? 'GPU runtime must be idle after cleanup'
      : undefined,
    result.gpuRuntimeShouldStartNow !== false
      ? 'proof validator must not leave GPU startup requested now'
      : undefined,
    result.modelWeightsDownloaded !== false
      ? 'worker runtime smoke must not download model weights'
      : undefined,
    result.modelWeightsLoaded !== false
      ? 'worker runtime smoke must not load model weights'
      : undefined,
    result.privateArtifactSandboxUsed !== true
      ? 'worker runtime smoke must use private artifact sandbox'
      : undefined,
    result.resultCaptureCompleted !== true
      ? 'worker runtime smoke must capture result evidence'
      : undefined,
    result.qaGatePassedWithProvidedEvidence !== true
      ? 'worker runtime smoke must pass QA gate with provided evidence'
      : undefined,
    result.telemetryCaptured !== true
      ? 'worker runtime smoke must capture telemetry'
      : undefined,
    result.costWithinCeiling !== true
      ? 'worker runtime smoke must remain within cost ceiling'
      : undefined,
    result.rollbackReady !== true
      ? 'worker runtime smoke must preserve rollback readiness'
      : undefined,
    result.secretsRedactedFromOutput !== true
      ? 'worker runtime smoke must redact secrets from output'
      : undefined,
    result.publicArtifactCreated !== false
      ? 'worker runtime smoke must not create public artifacts'
      : undefined,
    result.signedUrlCreated !== false
      ? 'worker runtime smoke must not create signed URLs'
      : undefined,
    result.externalBetaReadyNowTools !== 0
      ? 'worker runtime smoke must not unlock external beta tools'
      : undefined,
    result.productionReadyNowTools !== 0
      ? 'worker runtime smoke must not unlock production tools'
      : undefined,
    ...compareResultToCandidate(result, candidate),
  ].filter((reason): reason is string => Boolean(reason))
}

function evidenceRefsMissing(
  input: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProofInput,
): string[] {
  return [
    !hasPrivateEvidenceRef(input.workerRuntimeSmokeEvidenceRef)
      ? 'worker runtime smoke evidence ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.workerRuntimeSmokeTelemetryRef)
      ? 'worker runtime smoke telemetry ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.workerRuntimeSmokeCleanupProofRef)
      ? 'worker runtime smoke cleanup proof ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.workerRuntimeSmokeQaProofRef)
      ? 'worker runtime smoke QA proof ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasAuthorization: boolean
  authorizationAccepted: boolean
  hasSmokeResult: boolean
  resultAccepted: boolean
}): AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProofStatus {
  if (!input.hasAuthorization) {
    return 'missing_external_beta_api_route_worker_runtime_smoke_authorization'
  }
  if (!input.authorizationAccepted) {
    return 'external_beta_api_route_worker_runtime_smoke_authorization_rejected'
  }
  if (!input.hasSmokeResult) return 'missing_external_beta_api_route_worker_runtime_smoke_result'
  return input.resultAccepted
    ? 'external_beta_api_route_worker_runtime_smoke_proof_accepted_with_runtime_blocks'
    : 'external_beta_api_route_worker_runtime_smoke_result_rejected'
}

export function evaluateAiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof(
  input: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProofInput = {},
): AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof {
  const sourceAccepted =
    authorizationAccepted(input.sourceWorkerRuntimeSmokeAuthorizationPacket)
  const sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted =
    sourceAccepted &&
    input.sourceWorkerRuntimeSmokeAuthorizationPacket
      ?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === 21 &&
    input.sourceWorkerRuntimeSmokeAuthorizationPacket?.evidence
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === true &&
    input.sourceWorkerRuntimeSmokeAuthorizationPacket?.booleans
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    input.sourceWorkerRuntimeSmokeAuthorizationPacket?.authorizationCandidate
      ?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true
  const candidate =
    input.sourceWorkerRuntimeSmokeAuthorizationPacket?.authorizationCandidate ?? null
  const resultRejections = sourceAccepted
    ? validateSmokeResult(input.workerRuntimeSmokeResult, candidate)
    : []
  const evidenceRejections = sourceAccepted && input.workerRuntimeSmokeResult
    ? evidenceRefsMissing(input)
    : []
  const rejectionReasons = [...resultRejections, ...evidenceRejections]
  const resultAccepted = sourceAccepted &&
    Boolean(input.workerRuntimeSmokeResult) &&
    rejectionReasons.length === 0
  const status = statusFromInput({
    hasAuthorization: Boolean(input.sourceWorkerRuntimeSmokeAuthorizationPacket),
    authorizationAccepted: sourceAccepted,
    hasSmokeResult: Boolean(input.workerRuntimeSmokeResult),
    resultAccepted,
  })
  const result = resultAccepted ? input.workerRuntimeSmokeResult ?? null : null
  const gpuStarted = resultAccepted && result?.gpuRuntimeStartedForAcceptedJob === true
  const gpuReleased = resultAccepted && result?.gpuRuntimeReleasedAfterAcceptedJob === true

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_PROOF_DECISION,
    sourceWorkerRuntimeSmokeAuthorizationDecision:
      input.sourceWorkerRuntimeSmokeAuthorizationPacket?.decision ?? null,
    status,
    sourceAuthorizationAccepted: sourceAccepted,
    proofAcceptedWithProvidedEvidence: resultAccepted,
    rejectionReasons,
    requestedToolId: candidate?.toolId ?? null,
    capabilityId: candidate?.capabilityId ?? null,
    workerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence: resultAccepted ? 1 : 0,
    sourceAuthorizationAcceptedRequestsWithProvidedEvidence: sourceAccepted ? 1 : 0,
    workerRuntimeSmokeAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    workerLeaseLifecycleAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    workerDispatchAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    toolExecutionAcceptedWithProvidedEvidence: 0,
    gpuRuntimeStartedWithProvidedEvidence: gpuStarted ? 1 : 0,
    gpuRuntimeReleasedWithProvidedEvidence: gpuReleased ? 1 : 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      resultAccepted && result?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true
        ? 1
        : 0,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceAuthorizationCandidate: candidate,
    savedWorkerRuntimeSmokeResult: result,
    evidence: {
      workerRuntimeSmokeEvidenceRef: input.workerRuntimeSmokeEvidenceRef ?? null,
      workerRuntimeSmokeTelemetryRef: input.workerRuntimeSmokeTelemetryRef ?? null,
      workerRuntimeSmokeCleanupProofRef:
        input.workerRuntimeSmokeCleanupProofRef ?? null,
      workerRuntimeSmokeQaProofRef: input.workerRuntimeSmokeQaProofRef ?? null,
      sourceWorkerRuntimeSmokeAuthorizationRef:
        result?.sourceWorkerRuntimeSmokeAuthorizationRef ?? null,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted &&
        resultAccepted &&
        result?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true,
      sanitizedSourceStatus: result?.status ?? null,
      sanitizedSourceDecision: result?.decision ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredSmokeMode: 'saved_worker_runtime_smoke_result_only',
      savedResultOnly: true,
    },
    policy: {
      validatesSavedSmokeResultOnly: true,
      noLiveWorkerLeaseByProofValidator: true,
      noLiveWorkerDispatchByProofValidator: true,
      noToolExecutionByProofValidator: true,
      noPrivateArtifactWriteByProofValidator: true,
      noRouteExecutionByProofValidator: true,
      gpuMayStartOnlyInAcceptedSavedGpuSmokeResult: true,
      gpuMustBeReleasedAfterAcceptedSavedGpuSmokeResult: true,
      cleanupMustLeaveGpuIdle: true,
      nextGateRequiresPerToolCallableResultAndExternalBetaOwnerGoNoGo: true,
    },
    booleans: {
      externalBetaApiRouteWorkerRuntimeSmokeProofPrepared: true,
      sourceWorkerRuntimeSmokeAuthorizationAccepted: sourceAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted &&
        resultAccepted &&
        result?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true,
      workerRuntimeSmokeProofAcceptedWithProvidedEvidence: resultAccepted,
      savedWorkerRuntimeSmokeResultAcceptedWithProvidedEvidence: resultAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartedForAcceptedJob: gpuStarted,
      gpuRuntimeReleasedAfterAcceptedJob: gpuReleased,
      gpuRuntimeIdleAfterCleanup:
        resultAccepted && result?.gpuRuntimeIdleAfterCleanup === true,
      gpuRuntimeShouldStartNow: false,
      workerLeaseLifecycleAcceptedWithProvidedEvidence: resultAccepted,
      workerDispatchAcceptedWithProvidedEvidence: resultAccepted,
      toolExecutionAcceptedWithProvidedEvidence: false,
      privateArtifactWriteAcceptedWithProvidedEvidence: false,
      qaGateAcceptedWithProvidedEvidence:
        resultAccepted && result?.qaGatePassedWithProvidedEvidence === true,
      telemetryAcceptedWithProvidedEvidence:
        resultAccepted && result?.telemetryCaptured === true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      workerRuntimeSmokeApprovedNow: false,
      workerRuntimeSmokeExecutedByValidator: false,
      apiRouteExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      backendQueueSubmissionApprovedNow: false,
      liveQueueWriteApprovedNow: false,
      privateArtifactWriteApprovedNow: false,
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
      privateArtifactWritePerformed: false,
      serviceRoleQueueSmokePerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreatedByValidator: false,
      workerDispatchPerformedByValidator: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByValidator: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
