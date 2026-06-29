import {
  AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof,
} from './ai-graphics-external-beta-api-route-worker-runtime-smoke-proof'

export const AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_CALLABLE_RESULT_GATE_DECISION =
  'ai_graphics_external_beta_per_tool_callable_result_gate_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaPerToolCallableResultGateStatus =
  | 'missing_external_beta_api_route_worker_runtime_smoke_proof'
  | 'external_beta_api_route_worker_runtime_smoke_proof_rejected'
  | 'missing_external_beta_per_tool_callable_result'
  | 'external_beta_per_tool_callable_result_rejected'
  | 'external_beta_per_tool_callable_result_gate_accepted_runtime_still_blocked'

export interface AiGraphicsExternalBetaPerToolCallableResult {
  ok: true
  decision: 'ai_graphics_external_beta_per_tool_callable_result_recorded_with_runtime_blocks'
  status: 'external_beta_per_tool_callable_result_recorded_private_non_production_runtime_still_blocked'
  sourceWorkerRuntimeSmokeProofRef: string
  sourceWorkerRuntimeSmokeProofAccepted: true
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
  callableEnvelopeRecordedInPrivateNonProduction: true
  callableEnvelopeValidated: true
  workerRuntimeSmokeProofAcceptedCount: 1
  workerLeaseLifecycleAcceptedCount: 1
  workerDispatchAcceptedCount: 1
  requestAdmittedCount: 1
  toolExecutionCount: 0
  routeExecutionCount: 0
  workerDispatchCount: 0
  privateArtifactWriteCount: 0
  providerRuntimeCount: 0
  sourceGpuRuntimeStartedForAcceptedSmoke: boolean
  sourceGpuRuntimeReleasedAfterAcceptedSmoke: boolean
  gpuRuntimeStartedForCallableResult: false
  gpuRuntimeReleasedAfterCallableResult: false
  gpuRuntimeIdleAfterCleanup: true
  gpuRuntimeShouldStartNow: false
  modelWeightsDownloaded: false
  modelWeightsLoaded: false
  qaGatePassedWithProvidedEvidence: true
  telemetryCaptured: true
  costWithinCeiling: true
  rollbackReady: true
  secretsRedactedFromOutput: true
  publicArtifactCreated: false
  signedUrlCreated: false
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
}

export interface AiGraphicsExternalBetaPerToolCallableResultGateInput {
  sourceWorkerRuntimeSmokeProofPacket?:
    AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof
  perToolCallableResult?: AiGraphicsExternalBetaPerToolCallableResult
  perToolCallableResultEvidenceRef?: string
  perToolCallableResultQaRef?: string
  perToolCallableResultCostRef?: string
  perToolCallableResultRollbackRef?: string
}

export interface AiGraphicsExternalBetaPerToolCallableResultGate {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_CALLABLE_RESULT_GATE_DECISION
  sourceWorkerRuntimeSmokeProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_PROOF_DECISION | null
  status: AiGraphicsExternalBetaPerToolCallableResultGateStatus
  sourceWorkerRuntimeSmokeProofAccepted: boolean
  callableResultGateAcceptedWithProvidedEvidence: boolean
  rejectionReasons: string[]
  requestedToolId: string | null
  capabilityId: string | null
  perToolCallableResultGateAcceptedRequestsWithProvidedEvidence: 0 | 1
  sourceWorkerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence: 0 | 1
  callableEnvelopeAcceptedWithProvidedEvidence: 0 | 1
  workerRuntimeSmokeProofAcceptedWithProvidedEvidence: 0 | 1
  workerLeaseLifecycleAcceptedWithProvidedEvidence: 0 | 1
  workerDispatchAcceptedWithProvidedEvidence: 0 | 1
  toolExecutionAcceptedWithProvidedEvidence: 0
  routeExecutionAcceptedWithProvidedEvidence: 0
  privateArtifactWriteAcceptedWithProvidedEvidence: 0
  sourceGpuRuntimeStartedWithProvidedEvidence: 0 | 1
  sourceGpuRuntimeReleasedWithProvidedEvidence: 0 | 1
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeShouldStartNow: false
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceWorkerRuntimeSmokeProof:
    AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof | null
  savedPerToolCallableResult: AiGraphicsExternalBetaPerToolCallableResult | null
  evidence: {
    perToolCallableResultEvidenceRef: string | null
    perToolCallableResultQaRef: string | null
    perToolCallableResultCostRef: string | null
    perToolCallableResultRollbackRef: string | null
    sourceWorkerRuntimeSmokeProofRef: string | null
    sanitizedSourceStatus: string | null
    sanitizedSourceDecision: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredResultMode: 'saved_per_tool_callable_result_only'
    savedResultOnly: true
  }
  policy: {
    validatesSavedCallableResultOnly: true
    noLiveApiRouteExecutionByResultGate: true
    noLiveWorkerDispatchByResultGate: true
    noToolExecutionByResultGate: true
    noPrivateArtifactWriteByResultGate: true
    noProviderRuntimeByResultGate: true
    gpuRuntimeMayOnlyAppearInAcceptedSourceSmokeProof: true
    gpuRuntimeMustRemainIdleAfterSourceSmokeCleanup: true
    nextGateRequiresExternalBetaOwnerGoNoGoAndPerToolTrafficEnablement: true
  }
  booleans: {
    externalBetaPerToolCallableResultGatePrepared: true
    sourceWorkerRuntimeSmokeProofAccepted: boolean
    perToolCallableResultAcceptedWithProvidedEvidence: boolean
    savedPerToolCallableResultAcceptedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    sourceGpuRuntimeStartedForAcceptedSmoke: boolean
    sourceGpuRuntimeReleasedAfterAcceptedSmoke: boolean
    gpuRuntimeStartedForCallableResult: false
    gpuRuntimeReleasedAfterCallableResult: false
    gpuRuntimeIdleAfterCleanup: boolean
    gpuRuntimeShouldStartNow: false
    callableEnvelopeAcceptedWithProvidedEvidence: boolean
    workerRuntimeSmokeProofAcceptedWithProvidedEvidence: boolean
    workerLeaseLifecycleAcceptedWithProvidedEvidence: boolean
    workerDispatchAcceptedWithProvidedEvidence: boolean
    toolExecutionAcceptedWithProvidedEvidence: false
    routeExecutionAcceptedWithProvidedEvidence: false
    privateArtifactWriteAcceptedWithProvidedEvidence: false
    qaGateAcceptedWithProvidedEvidence: boolean
    telemetryAcceptedWithProvidedEvidence: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    externalBetaTrafficEnabledNow: false
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
    workerLeaseCreatedByResultGate: false
    workerDispatchPerformedByResultGate: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformedByResultGate: false
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
    normalized.startsWith('external-beta-worker-runtime-smoke://') ||
    normalized.startsWith('external-beta-callable-result://')
}

function sourceProofAccepted(
  packet?: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_API_ROUTE_WORKER_RUNTIME_SMOKE_PROOF_DECISION &&
    packet.status ===
      'external_beta_api_route_worker_runtime_smoke_proof_accepted_with_runtime_blocks' &&
    packet.proofAcceptedWithProvidedEvidence === true &&
    packet.workerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence === 1 &&
    packet.sourceAuthorizationAcceptedRequestsWithProvidedEvidence === 1 &&
    packet.workerRuntimeSmokeAcceptedWithProvidedEvidence === 1 &&
    packet.workerLeaseLifecycleAcceptedWithProvidedEvidence === 1 &&
    packet.workerDispatchAcceptedWithProvidedEvidence === 1 &&
    packet.toolExecutionAcceptedWithProvidedEvidence === 0 &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.sourceAuthorizationCandidate !== null &&
    packet.savedWorkerRuntimeSmokeResult !== null &&
    packet.booleans.sourceWorkerRuntimeSmokeAuthorizationAccepted === true &&
    packet.booleans.savedWorkerRuntimeSmokeResultAcceptedWithProvidedEvidence === true &&
    packet.booleans.workerLeaseLifecycleAcceptedWithProvidedEvidence === true &&
    packet.booleans.workerDispatchAcceptedWithProvidedEvidence === true &&
    packet.booleans.toolExecutionAcceptedWithProvidedEvidence === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function compareResultToSource(
  result: AiGraphicsExternalBetaPerToolCallableResult,
  packet: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof,
): string[] {
  const candidate = packet.sourceAuthorizationCandidate
  if (!candidate) return ['source authorization candidate is missing']
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

function validateCallableResult(
  result: AiGraphicsExternalBetaPerToolCallableResult | undefined,
  packet: AiGraphicsExternalBetaApiRouteWorkerRuntimeSmokeProof | undefined,
): string[] {
  if (!result) return ['external beta per-tool callable result is missing']
  if (!packet) return ['accepted worker runtime smoke proof is missing']

  const sourceGpuStarted = packet.gpuRuntimeStartedWithProvidedEvidence === 1
  const sourceGpuReleased = packet.gpuRuntimeReleasedWithProvidedEvidence === 1
  return [
    result.ok !== true ? 'per-tool callable result ok flag is not true' : undefined,
    result.decision !==
      'ai_graphics_external_beta_per_tool_callable_result_recorded_with_runtime_blocks'
      ? 'per-tool callable result decision is not accepted'
      : undefined,
    result.status !==
      'external_beta_per_tool_callable_result_recorded_private_non_production_runtime_still_blocked'
      ? 'per-tool callable result status is not accepted'
      : undefined,
    !hasPrivateEvidenceRef(result.sourceWorkerRuntimeSmokeProofRef)
      ? 'per-tool callable result must include a private source proof ref'
      : undefined,
    result.sourceWorkerRuntimeSmokeProofAccepted !== true
      ? 'per-tool callable result must preserve the worker-runtime smoke proof chain'
      : undefined,
    result.callableEnvelopeRecordedInPrivateNonProduction !== true
      ? 'callable envelope must be recorded in private non-production'
      : undefined,
    result.callableEnvelopeValidated !== true
      ? 'callable envelope must be validated'
      : undefined,
    result.workerRuntimeSmokeProofAcceptedCount !== 1
      ? 'callable result must accept one source worker-runtime smoke proof'
      : undefined,
    result.workerLeaseLifecycleAcceptedCount !== 1
      ? 'callable result must preserve one accepted worker lease lifecycle'
      : undefined,
    result.workerDispatchAcceptedCount !== 1
      ? 'callable result must preserve one accepted worker dispatch'
      : undefined,
    result.requestAdmittedCount !== 1
      ? 'callable result must admit one request envelope'
      : undefined,
    result.toolExecutionCount !== 0
      ? 'callable result must not execute tools'
      : undefined,
    result.routeExecutionCount !== 0
      ? 'callable result gate must not execute API routes'
      : undefined,
    result.workerDispatchCount !== 0
      ? 'callable result gate must not dispatch workers'
      : undefined,
    result.privateArtifactWriteCount !== 0
      ? 'callable result gate must not write private artifacts'
      : undefined,
    result.providerRuntimeCount !== 0
      ? 'callable result must not call providers/models'
      : undefined,
    result.sourceGpuRuntimeStartedForAcceptedSmoke !== sourceGpuStarted
      ? 'callable result source GPU start evidence does not match source proof'
      : undefined,
    result.sourceGpuRuntimeReleasedAfterAcceptedSmoke !== sourceGpuReleased
      ? 'callable result source GPU release evidence does not match source proof'
      : undefined,
    result.gpuRuntimeStartedForCallableResult !== false
      ? 'callable result gate must not start GPU runtime'
      : undefined,
    result.gpuRuntimeReleasedAfterCallableResult !== false
      ? 'callable result gate must not release GPU runtime'
      : undefined,
    result.gpuRuntimeIdleAfterCleanup !== true
      ? 'GPU runtime must be idle after callable result cleanup'
      : undefined,
    result.gpuRuntimeShouldStartNow !== false
      ? 'callable result gate must not leave GPU startup requested now'
      : undefined,
    result.modelWeightsDownloaded !== false
      ? 'callable result gate must not download model weights'
      : undefined,
    result.modelWeightsLoaded !== false
      ? 'callable result gate must not load model weights'
      : undefined,
    result.qaGatePassedWithProvidedEvidence !== true
      ? 'callable result must pass QA gate with provided evidence'
      : undefined,
    result.telemetryCaptured !== true
      ? 'callable result must capture telemetry'
      : undefined,
    result.costWithinCeiling !== true
      ? 'callable result must remain within cost ceiling'
      : undefined,
    result.rollbackReady !== true
      ? 'callable result must preserve rollback readiness'
      : undefined,
    result.secretsRedactedFromOutput !== true
      ? 'callable result must redact secrets from output'
      : undefined,
    result.publicArtifactCreated !== false
      ? 'callable result must not create public artifacts'
      : undefined,
    result.signedUrlCreated !== false
      ? 'callable result must not create signed URLs'
      : undefined,
    result.externalBetaCallableNowTools !== 0
      ? 'callable result must not enable external beta callable tools now'
      : undefined,
    result.externalBetaReadyNowTools !== 0
      ? 'callable result must not unlock external beta readiness'
      : undefined,
    result.productionReadyNowTools !== 0
      ? 'callable result must not unlock production tools'
      : undefined,
    ...compareResultToSource(result, packet),
  ].filter((reason): reason is string => Boolean(reason))
}

function evidenceRefsMissing(
  input: AiGraphicsExternalBetaPerToolCallableResultGateInput,
): string[] {
  return [
    !hasPrivateEvidenceRef(input.perToolCallableResultEvidenceRef)
      ? 'per-tool callable result evidence ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.perToolCallableResultQaRef)
      ? 'per-tool callable result QA ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.perToolCallableResultCostRef)
      ? 'per-tool callable result cost ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.perToolCallableResultRollbackRef)
      ? 'per-tool callable result rollback ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSourceProof: boolean
  sourceProofAccepted: boolean
  hasCallableResult: boolean
  callableResultAccepted: boolean
}): AiGraphicsExternalBetaPerToolCallableResultGateStatus {
  if (!input.hasSourceProof) {
    return 'missing_external_beta_api_route_worker_runtime_smoke_proof'
  }
  if (!input.sourceProofAccepted) {
    return 'external_beta_api_route_worker_runtime_smoke_proof_rejected'
  }
  if (!input.hasCallableResult) {
    return 'missing_external_beta_per_tool_callable_result'
  }
  return input.callableResultAccepted
    ? 'external_beta_per_tool_callable_result_gate_accepted_runtime_still_blocked'
    : 'external_beta_per_tool_callable_result_rejected'
}

export function evaluateAiGraphicsExternalBetaPerToolCallableResultGate(
  input: AiGraphicsExternalBetaPerToolCallableResultGateInput = {},
): AiGraphicsExternalBetaPerToolCallableResultGate {
  const sourceAccepted =
    sourceProofAccepted(input.sourceWorkerRuntimeSmokeProofPacket)
  const resultRejections = sourceAccepted
    ? validateCallableResult(
      input.perToolCallableResult,
      input.sourceWorkerRuntimeSmokeProofPacket,
    )
    : []
  const evidenceRejections = sourceAccepted && input.perToolCallableResult
    ? evidenceRefsMissing(input)
    : []
  const rejectionReasons = [...resultRejections, ...evidenceRejections]
  const resultAccepted = sourceAccepted &&
    Boolean(input.perToolCallableResult) &&
    rejectionReasons.length === 0
  const status = statusFromInput({
    hasSourceProof: Boolean(input.sourceWorkerRuntimeSmokeProofPacket),
    sourceProofAccepted: sourceAccepted,
    hasCallableResult: Boolean(input.perToolCallableResult),
    callableResultAccepted: resultAccepted,
  })
  const result = resultAccepted ? input.perToolCallableResult ?? null : null
  const sourceGpuStarted =
    resultAccepted &&
    result?.sourceGpuRuntimeStartedForAcceptedSmoke === true
  const sourceGpuReleased =
    resultAccepted &&
    result?.sourceGpuRuntimeReleasedAfterAcceptedSmoke === true

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_CALLABLE_RESULT_GATE_DECISION,
    sourceWorkerRuntimeSmokeProofDecision:
      input.sourceWorkerRuntimeSmokeProofPacket?.decision ?? null,
    status,
    sourceWorkerRuntimeSmokeProofAccepted: sourceAccepted,
    callableResultGateAcceptedWithProvidedEvidence: resultAccepted,
    rejectionReasons,
    requestedToolId:
      input.sourceWorkerRuntimeSmokeProofPacket?.requestedToolId ?? null,
    capabilityId: input.sourceWorkerRuntimeSmokeProofPacket?.capabilityId ?? null,
    perToolCallableResultGateAcceptedRequestsWithProvidedEvidence:
      resultAccepted ? 1 : 0,
    sourceWorkerRuntimeSmokeProofAcceptedRequestsWithProvidedEvidence:
      sourceAccepted ? 1 : 0,
    callableEnvelopeAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    workerRuntimeSmokeProofAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    workerLeaseLifecycleAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    workerDispatchAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    toolExecutionAcceptedWithProvidedEvidence: 0,
    routeExecutionAcceptedWithProvidedEvidence: 0,
    privateArtifactWriteAcceptedWithProvidedEvidence: 0,
    sourceGpuRuntimeStartedWithProvidedEvidence: sourceGpuStarted ? 1 : 0,
    sourceGpuRuntimeReleasedWithProvidedEvidence: sourceGpuReleased ? 1 : 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceWorkerRuntimeSmokeProof:
      input.sourceWorkerRuntimeSmokeProofPacket ?? null,
    savedPerToolCallableResult: result,
    evidence: {
      perToolCallableResultEvidenceRef:
        input.perToolCallableResultEvidenceRef ?? null,
      perToolCallableResultQaRef: input.perToolCallableResultQaRef ?? null,
      perToolCallableResultCostRef: input.perToolCallableResultCostRef ?? null,
      perToolCallableResultRollbackRef:
        input.perToolCallableResultRollbackRef ?? null,
      sourceWorkerRuntimeSmokeProofRef:
        result?.sourceWorkerRuntimeSmokeProofRef ?? null,
      sanitizedSourceStatus: result?.status ?? null,
      sanitizedSourceDecision: result?.decision ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredResultMode: 'saved_per_tool_callable_result_only',
      savedResultOnly: true,
    },
    policy: {
      validatesSavedCallableResultOnly: true,
      noLiveApiRouteExecutionByResultGate: true,
      noLiveWorkerDispatchByResultGate: true,
      noToolExecutionByResultGate: true,
      noPrivateArtifactWriteByResultGate: true,
      noProviderRuntimeByResultGate: true,
      gpuRuntimeMayOnlyAppearInAcceptedSourceSmokeProof: true,
      gpuRuntimeMustRemainIdleAfterSourceSmokeCleanup: true,
      nextGateRequiresExternalBetaOwnerGoNoGoAndPerToolTrafficEnablement: true,
    },
    booleans: {
      externalBetaPerToolCallableResultGatePrepared: true,
      sourceWorkerRuntimeSmokeProofAccepted: sourceAccepted,
      perToolCallableResultAcceptedWithProvidedEvidence: resultAccepted,
      savedPerToolCallableResultAcceptedWithProvidedEvidence: resultAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      sourceGpuRuntimeStartedForAcceptedSmoke: sourceGpuStarted,
      sourceGpuRuntimeReleasedAfterAcceptedSmoke: sourceGpuReleased,
      gpuRuntimeStartedForCallableResult: false,
      gpuRuntimeReleasedAfterCallableResult: false,
      gpuRuntimeIdleAfterCleanup:
        resultAccepted && result?.gpuRuntimeIdleAfterCleanup === true,
      gpuRuntimeShouldStartNow: false,
      callableEnvelopeAcceptedWithProvidedEvidence: resultAccepted,
      workerRuntimeSmokeProofAcceptedWithProvidedEvidence: resultAccepted,
      workerLeaseLifecycleAcceptedWithProvidedEvidence: resultAccepted,
      workerDispatchAcceptedWithProvidedEvidence: resultAccepted,
      toolExecutionAcceptedWithProvidedEvidence: false,
      routeExecutionAcceptedWithProvidedEvidence: false,
      privateArtifactWriteAcceptedWithProvidedEvidence: false,
      qaGateAcceptedWithProvidedEvidence:
        resultAccepted && result?.qaGatePassedWithProvidedEvidence === true,
      telemetryAcceptedWithProvidedEvidence:
        resultAccepted && result?.telemetryCaptured === true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      externalBetaTrafficEnabledNow: false,
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
      workerLeaseCreatedByResultGate: false,
      workerDispatchPerformedByResultGate: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByResultGate: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
