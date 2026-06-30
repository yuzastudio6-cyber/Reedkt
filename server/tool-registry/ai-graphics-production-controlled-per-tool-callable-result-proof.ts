import {
  acceptedAiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof,
  type AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffCandidate,
  type AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof,
} from './ai-graphics-production-controlled-private-artifact-tool-route-handoff-proof'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_PRODUCTION_CONTROLLED_PER_TOOL_CALLABLE_RESULT_PROOF_DECISION =
  'ai_graphics_production_controlled_per_tool_callable_result_proof_prepared_with_runtime_blocks'

export type AiGraphicsProductionControlledPerToolCallableResultProofStatus =
  | 'missing_production_controlled_private_artifact_tool_route_handoff_proof'
  | 'production_controlled_private_artifact_tool_route_handoff_proof_rejected'
  | 'missing_production_controlled_per_tool_callable_result'
  | 'production_controlled_per_tool_callable_result_rejected'
  | 'production_controlled_per_tool_callable_result_proof_ready_no_execution'

export interface AiGraphicsProductionControlledPerToolCallableResult {
  ok: true
  decision: 'ai_graphics_production_controlled_per_tool_callable_result_recorded_with_runtime_blocks'
  status: 'production_controlled_per_tool_callable_result_recorded_private_non_production_runtime_still_blocked'
  sourcePrivateArtifactToolRouteHandoffProofRef: string
  sourcePrivateArtifactToolRouteHandoffProofAccepted: true
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  capabilityId: string
  routePath: '/api/ai-graphics/production/tool-call'
  routeId: string
  futureHandler: string
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  sourceRuntimeSmokeJobId: string
  privateInputManifestRef: string
  privateOutputManifestRef: string
  privateTelemetryRef: string
  privateLeaseAuditRef: string
  privateRouteHandoffRef: string
  modelWeightOrCacheManifestRef: string | null
  callableEnvelopeRecordedInPrivateNonProduction: true
  callableEnvelopeValidated: true
  sourceHandoffProofAcceptedCount: 1
  sourceAiGraphicsToolCallHandoffAcceptedCount: 1
  sourceInMemoryLeaseLifecycleAcceptedCount: 1
  privateArtifactManifestAcceptedCount: 1
  toolRouteHandoffAcceptedCount: 1
  requestAdmittedCount: 1
  toolExecutionCount: 0
  routeExecutionCount: 0
  workerDispatchCount: 0
  privateArtifactWriteCount: 0
  providerRuntimeCount: 0
  browserWebglCanvasRuntimeCount: 0
  gpuRuntimeStartedForCallableResult: false
  gpuRuntimeReleasedAfterCallableResult: false
  gpuRuntimeShouldStartNow: false
  gpuRuntimeIdleAfterCleanup: true
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

export interface AiGraphicsProductionControlledPerToolCallableResultProofInput {
  sourcePrivateArtifactToolRouteHandoffProofPacket?:
    AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof
  perToolCallableResult?: AiGraphicsProductionControlledPerToolCallableResult
  perToolCallableResultEvidenceRef?: string
  perToolCallableResultQaRef?: string
  perToolCallableResultCostRef?: string
  perToolCallableResultRollbackRef?: string
  perToolCallableResultOperatorReviewRef?: string
}

export interface AiGraphicsProductionControlledPerToolCallableResultProof {
  decision:
    typeof AI_GRAPHICS_PRODUCTION_CONTROLLED_PER_TOOL_CALLABLE_RESULT_PROOF_DECISION
  sourcePrivateArtifactToolRouteHandoffProofDecision: string | null
  status: AiGraphicsProductionControlledPerToolCallableResultProofStatus
  requestedToolId: AiGraphicsCanonicalToolId | null
  capabilityId: string | null
  sourcePrivateArtifactToolRouteHandoffProofAccepted: boolean
  sourceAiGraphicsToolCallHandoffResultAccepted: boolean
  sourceInMemoryLeaseLifecycleAccepted: boolean
  sourcePrivateArtifactManifestPrepared: boolean
  sourceToolRouteHandoffPrepared: boolean
  callableResultProofAcceptedWithProvidedEvidence: boolean
  perToolCallableResultAcceptedWithProvidedEvidence: boolean
  savedPerToolCallableResultAcceptedWithProvidedEvidence: boolean
  rejectionReasons: string[]
  perToolCallableResultProofAcceptedRequestsWithProvidedEvidence: 0 | 1
  sourcePrivateArtifactToolRouteHandoffAcceptedRequestsWithProvidedEvidence: 0 | 1
  callableEnvelopeAcceptedWithProvidedEvidence: 0 | 1
  privateArtifactManifestAcceptedWithProvidedEvidence: 0 | 1
  toolRouteHandoffAcceptedWithProvidedEvidence: 0 | 1
  toolExecutionAcceptedWithProvidedEvidence: 0
  routeExecutionAcceptedWithProvidedEvidence: 0
  workerDispatchAcceptedWithProvidedEvidence: 0
  privateArtifactWriteAcceptedWithProvidedEvidence: 0
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeShouldStartNow: false
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourcePrivateArtifactToolRouteHandoffProof:
    AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof | null
  savedPerToolCallableResult:
    AiGraphicsProductionControlledPerToolCallableResult | null
  evidence: {
    perToolCallableResultEvidenceRef: string | null
    perToolCallableResultQaRef: string | null
    perToolCallableResultCostRef: string | null
    perToolCallableResultRollbackRef: string | null
    perToolCallableResultOperatorReviewRef: string | null
    sourcePrivateArtifactToolRouteHandoffProofRef: string | null
    sanitizedSourceStatus: string | null
    sanitizedSourceDecision: string | null
    requiredExecutionEnvironment: 'private_non_production_runtime_smoke'
    requiredResultMode: 'saved_per_tool_callable_result_only'
    savedResultOnly: true
  }
  policy: {
    validatesSavedCallableResultOnly: true
    sourcePrivateArtifactToolRouteHandoffRequired: true
    noLiveApiRouteExecutionByResultProof: true
    noLiveWorkerDispatchByResultProof: true
    noToolExecutionByResultProof: true
    noPrivateArtifactWriteByResultProof: true
    noProviderRuntimeByResultProof: true
    noBrowserWebglCanvasRuntimeByResultProof: true
    noGpuRuntimeStartByResultProof: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresControlledPerToolTrafficEnablement: true
  }
  booleans: {
    productionControlledPerToolCallableResultProofPrepared: true
    sourcePrivateArtifactToolRouteHandoffProofAccepted: boolean
    sourceAiGraphicsToolCallHandoffResultAccepted: boolean
    sourceInMemoryLeaseLifecycleAccepted: boolean
    sourcePrivateArtifactManifestPrepared: boolean
    sourceToolRouteHandoffPrepared: boolean
    perToolCallableResultAcceptedWithProvidedEvidence: boolean
    savedPerToolCallableResultAcceptedWithProvidedEvidence: boolean
    callableEnvelopeAcceptedWithProvidedEvidence: boolean
    privateArtifactManifestAcceptedWithProvidedEvidence: boolean
    toolRouteHandoffAcceptedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    productionControlledToolCallReadyNow: boolean
    runtimeReadyForOnDemandProductionToolCall: false
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartedForCallableResult: false
    gpuRuntimeReleasedAfterCallableResult: false
    gpuRuntimeIdleAfterCleanup: boolean
    gpuRuntimeShouldStartNow: false
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
    workerDispatchPerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    privateArtifactWritePerformed: false
    serviceRoleTransactionPerformed: false
    supabaseMutationPerformed: false
    workerLeaseCreatedByResultProof: false
    workerDispatchPerformedByResultProof: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformedByResultProof: false
    gpuRuntimeShouldStartNowPerformed: false
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
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('production-evidence://') ||
    normalized.startsWith('reeditpro-private://')
}

function sourceCandidate(
  packet?: AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof,
): AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffCandidate | null {
  return packet?.handoffCandidate ?? null
}

function compareResultToSource(
  result: AiGraphicsProductionControlledPerToolCallableResult,
  candidate: AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffCandidate,
): string[] {
  return [
    result.toolId !== candidate.toolId ? 'tool id mismatch' : undefined,
    result.productionToolId !== candidate.productionToolId
      ? 'production tool id mismatch'
      : undefined,
    result.capabilityId !== candidate.capabilityId ? 'capability id mismatch' : undefined,
    result.routePath !== candidate.futureRoutePath ? 'route path mismatch' : undefined,
    result.routeId !== candidate.futureRouteId ? 'route id mismatch' : undefined,
    result.futureHandler !== candidate.futureHandler ? 'future handler mismatch' : undefined,
    result.workerType !== candidate.workerType ? 'worker type mismatch' : undefined,
    result.runtimeTarget !== candidate.runtimeTarget ? 'runtime target mismatch' : undefined,
    result.sourceRuntimeSmokeJobId !== candidate.sourceRuntimeSmokeJobId
      ? 'source runtime smoke job mismatch'
      : undefined,
    result.privateInputManifestRef !== candidate.privateInputManifestRef
      ? 'private input manifest mismatch'
      : undefined,
    result.privateOutputManifestRef !== candidate.privateOutputManifestRef
      ? 'private output manifest mismatch'
      : undefined,
    result.privateTelemetryRef !== candidate.privateTelemetryRef
      ? 'private telemetry mismatch'
      : undefined,
    result.privateLeaseAuditRef !== candidate.privateLeaseAuditRef
      ? 'private lease audit mismatch'
      : undefined,
    result.privateRouteHandoffRef !== candidate.privateRouteHandoffRef
      ? 'private route handoff mismatch'
      : undefined,
    result.modelWeightOrCacheManifestRef !== candidate.modelWeightOrCacheManifestRef
      ? 'model weight/cache manifest mismatch'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function validateCallableResult(
  result: AiGraphicsProductionControlledPerToolCallableResult | undefined,
  candidate: AiGraphicsProductionControlledPrivateArtifactToolRouteHandoffCandidate | null,
): string[] {
  if (!result) return ['production controlled per-tool callable result is missing']
  if (!candidate) return ['accepted private artifact Tool Route handoff candidate is missing']

  return [
    result.ok !== true ? 'per-tool callable result ok flag is not true' : undefined,
    result.decision !==
      'ai_graphics_production_controlled_per_tool_callable_result_recorded_with_runtime_blocks'
      ? 'per-tool callable result decision is not accepted'
      : undefined,
    result.status !==
      'production_controlled_per_tool_callable_result_recorded_private_non_production_runtime_still_blocked'
      ? 'per-tool callable result status is not accepted'
      : undefined,
    !hasPrivateEvidenceRef(result.sourcePrivateArtifactToolRouteHandoffProofRef)
      ? 'per-tool callable result must include a private source handoff proof ref'
      : undefined,
    result.sourcePrivateArtifactToolRouteHandoffProofAccepted !== true
      ? 'per-tool callable result must preserve the source handoff proof chain'
      : undefined,
    result.callableEnvelopeRecordedInPrivateNonProduction !== true
      ? 'callable envelope must be recorded in private non-production'
      : undefined,
    result.callableEnvelopeValidated !== true
      ? 'callable envelope must be validated'
      : undefined,
    result.sourceHandoffProofAcceptedCount !== 1
      ? 'callable result must accept one source handoff proof'
      : undefined,
    result.sourceAiGraphicsToolCallHandoffAcceptedCount !== 1
      ? 'callable result must preserve one source aiGraphics handoff'
      : undefined,
    result.sourceInMemoryLeaseLifecycleAcceptedCount !== 1
      ? 'callable result must preserve one source in-memory lease lifecycle'
      : undefined,
    result.privateArtifactManifestAcceptedCount !== 1
      ? 'callable result must accept one private artifact manifest'
      : undefined,
    result.toolRouteHandoffAcceptedCount !== 1
      ? 'callable result must accept one Tool Route handoff'
      : undefined,
    result.requestAdmittedCount !== 1
      ? 'callable result must admit one request envelope'
      : undefined,
    result.toolExecutionCount !== 0 ? 'callable result must not execute tools' : undefined,
    result.routeExecutionCount !== 0
      ? 'callable result must not execute routes'
      : undefined,
    result.workerDispatchCount !== 0
      ? 'callable result must not dispatch workers'
      : undefined,
    result.privateArtifactWriteCount !== 0
      ? 'callable result must not write private artifacts'
      : undefined,
    result.providerRuntimeCount !== 0
      ? 'callable result must not call providers/models'
      : undefined,
    result.browserWebglCanvasRuntimeCount !== 0
      ? 'callable result must not start browser/WebGL/canvas runtime'
      : undefined,
    result.gpuRuntimeStartedForCallableResult !== false
      ? 'callable result must not start GPU runtime'
      : undefined,
    result.gpuRuntimeReleasedAfterCallableResult !== false
      ? 'callable result must not release GPU runtime'
      : undefined,
    result.gpuRuntimeShouldStartNow !== false
      ? 'callable result must not request GPU runtime now'
      : undefined,
    result.gpuRuntimeIdleAfterCleanup !== true
      ? 'GPU runtime must be idle after cleanup'
      : undefined,
    result.modelWeightsDownloaded !== false
      ? 'callable result must not download model weights'
      : undefined,
    result.modelWeightsLoaded !== false
      ? 'callable result must not load model weights'
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
    ...compareResultToSource(result, candidate),
  ].filter((reason): reason is string => Boolean(reason))
}

function evidenceRefsMissing(
  input: AiGraphicsProductionControlledPerToolCallableResultProofInput,
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
    !hasPrivateEvidenceRef(input.perToolCallableResultOperatorReviewRef)
      ? 'per-tool callable result operator review ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSourceProof: boolean
  sourceProofAccepted: boolean
  hasCallableResult: boolean
  callableResultAccepted: boolean
}): AiGraphicsProductionControlledPerToolCallableResultProofStatus {
  if (!input.hasSourceProof) {
    return 'missing_production_controlled_private_artifact_tool_route_handoff_proof'
  }
  if (!input.sourceProofAccepted) {
    return 'production_controlled_private_artifact_tool_route_handoff_proof_rejected'
  }
  if (!input.hasCallableResult) {
    return 'missing_production_controlled_per_tool_callable_result'
  }
  return input.callableResultAccepted
    ? 'production_controlled_per_tool_callable_result_proof_ready_no_execution'
    : 'production_controlled_per_tool_callable_result_rejected'
}

export function acceptedAiGraphicsProductionControlledPerToolCallableResultProof(
  packet: AiGraphicsProductionControlledPerToolCallableResultProof | undefined,
): packet is AiGraphicsProductionControlledPerToolCallableResultProof {
  return Boolean(
    packet &&
      packet.decision ===
        AI_GRAPHICS_PRODUCTION_CONTROLLED_PER_TOOL_CALLABLE_RESULT_PROOF_DECISION &&
      packet.status ===
        'production_controlled_per_tool_callable_result_proof_ready_no_execution' &&
      packet.sourcePrivateArtifactToolRouteHandoffProofAccepted === true &&
      packet.callableResultProofAcceptedWithProvidedEvidence === true &&
      packet.savedPerToolCallableResult !== null &&
      packet.toolExecutionAcceptedWithProvidedEvidence === 0 &&
      packet.routeExecutionAcceptedWithProvidedEvidence === 0 &&
      packet.workerDispatchAcceptedWithProvidedEvidence === 0 &&
      packet.privateArtifactWriteAcceptedWithProvidedEvidence === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.routeExecutionApprovedNow === false &&
      packet.booleans.workerExecutionApprovedNow === false &&
      packet.booleans.toolExecutionApprovedNow === false &&
      packet.booleans.privateArtifactWriteApprovedNow === false &&
      packet.booleans.gpuRuntimeApprovedNow === false &&
      packet.booleans.runtimeReadyNow === false &&
      packet.booleans.externalBetaReadyNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export function evaluateAiGraphicsProductionControlledPerToolCallableResultProof(
  input: AiGraphicsProductionControlledPerToolCallableResultProofInput = {},
): AiGraphicsProductionControlledPerToolCallableResultProof {
  const sourceAccepted =
    acceptedAiGraphicsProductionControlledPrivateArtifactToolRouteHandoffProof(
      input.sourcePrivateArtifactToolRouteHandoffProofPacket,
    )
  const candidate = sourceCandidate(input.sourcePrivateArtifactToolRouteHandoffProofPacket)
  const sourceHandoffAccepted =
    sourceAccepted &&
    input.sourcePrivateArtifactToolRouteHandoffProofPacket
      ?.sourceAiGraphicsToolCallHandoffResultAccepted === true
  const sourceLeaseAccepted =
    sourceAccepted &&
    input.sourcePrivateArtifactToolRouteHandoffProofPacket
      ?.sourceInMemoryLeaseLifecycleAccepted === true
  const sourcePrivateManifestPrepared =
    sourceAccepted &&
    input.sourcePrivateArtifactToolRouteHandoffProofPacket
      ?.privateArtifactManifestPreparedWithProvidedEvidence === true
  const sourceToolRoutePrepared =
    sourceAccepted &&
    input.sourcePrivateArtifactToolRouteHandoffProofPacket
      ?.toolRouteHandoffPreparedWithProvidedEvidence === true
  const resultRejections = sourceAccepted
    ? validateCallableResult(input.perToolCallableResult, candidate)
    : []
  const evidenceRejections = sourceAccepted && input.perToolCallableResult
    ? evidenceRefsMissing(input)
    : []
  const rejectionReasons = [...resultRejections, ...evidenceRejections]
  const resultAccepted = sourceAccepted &&
    Boolean(input.perToolCallableResult) &&
    rejectionReasons.length === 0
  const status = statusFromInput({
    hasSourceProof: Boolean(input.sourcePrivateArtifactToolRouteHandoffProofPacket),
    sourceProofAccepted: sourceAccepted,
    hasCallableResult: Boolean(input.perToolCallableResult),
    callableResultAccepted: resultAccepted,
  })
  const result = resultAccepted ? input.perToolCallableResult ?? null : null

  return {
    decision: AI_GRAPHICS_PRODUCTION_CONTROLLED_PER_TOOL_CALLABLE_RESULT_PROOF_DECISION,
    sourcePrivateArtifactToolRouteHandoffProofDecision:
      input.sourcePrivateArtifactToolRouteHandoffProofPacket?.decision ?? null,
    status,
    requestedToolId: candidate?.toolId ?? null,
    capabilityId: candidate?.capabilityId ?? null,
    sourcePrivateArtifactToolRouteHandoffProofAccepted: sourceAccepted,
    sourceAiGraphicsToolCallHandoffResultAccepted: sourceHandoffAccepted,
    sourceInMemoryLeaseLifecycleAccepted: sourceLeaseAccepted,
    sourcePrivateArtifactManifestPrepared: sourcePrivateManifestPrepared,
    sourceToolRouteHandoffPrepared: sourceToolRoutePrepared,
    callableResultProofAcceptedWithProvidedEvidence: resultAccepted,
    perToolCallableResultAcceptedWithProvidedEvidence: resultAccepted,
    savedPerToolCallableResultAcceptedWithProvidedEvidence: resultAccepted,
    rejectionReasons,
    perToolCallableResultProofAcceptedRequestsWithProvidedEvidence:
      resultAccepted ? 1 : 0,
    sourcePrivateArtifactToolRouteHandoffAcceptedRequestsWithProvidedEvidence:
      sourceAccepted ? 1 : 0,
    callableEnvelopeAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    privateArtifactManifestAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    toolRouteHandoffAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    toolExecutionAcceptedWithProvidedEvidence: 0,
    routeExecutionAcceptedWithProvidedEvidence: 0,
    workerDispatchAcceptedWithProvidedEvidence: 0,
    privateArtifactWriteAcceptedWithProvidedEvidence: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourcePrivateArtifactToolRouteHandoffProof:
      input.sourcePrivateArtifactToolRouteHandoffProofPacket ?? null,
    savedPerToolCallableResult: result,
    evidence: {
      perToolCallableResultEvidenceRef:
        input.perToolCallableResultEvidenceRef ?? null,
      perToolCallableResultQaRef: input.perToolCallableResultQaRef ?? null,
      perToolCallableResultCostRef: input.perToolCallableResultCostRef ?? null,
      perToolCallableResultRollbackRef:
        input.perToolCallableResultRollbackRef ?? null,
      perToolCallableResultOperatorReviewRef:
        input.perToolCallableResultOperatorReviewRef ?? null,
      sourcePrivateArtifactToolRouteHandoffProofRef:
        result?.sourcePrivateArtifactToolRouteHandoffProofRef ?? null,
      sanitizedSourceStatus: result?.status ?? null,
      sanitizedSourceDecision: result?.decision ?? null,
      requiredExecutionEnvironment: 'private_non_production_runtime_smoke',
      requiredResultMode: 'saved_per_tool_callable_result_only',
      savedResultOnly: true,
    },
    policy: {
      validatesSavedCallableResultOnly: true,
      sourcePrivateArtifactToolRouteHandoffRequired: true,
      noLiveApiRouteExecutionByResultProof: true,
      noLiveWorkerDispatchByResultProof: true,
      noToolExecutionByResultProof: true,
      noPrivateArtifactWriteByResultProof: true,
      noProviderRuntimeByResultProof: true,
      noBrowserWebglCanvasRuntimeByResultProof: true,
      noGpuRuntimeStartByResultProof: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresControlledPerToolTrafficEnablement: true,
    },
    booleans: {
      productionControlledPerToolCallableResultProofPrepared: true,
      sourcePrivateArtifactToolRouteHandoffProofAccepted: sourceAccepted,
      sourceAiGraphicsToolCallHandoffResultAccepted: sourceHandoffAccepted,
      sourceInMemoryLeaseLifecycleAccepted: sourceLeaseAccepted,
      sourcePrivateArtifactManifestPrepared: sourcePrivateManifestPrepared,
      sourceToolRouteHandoffPrepared: sourceToolRoutePrepared,
      perToolCallableResultAcceptedWithProvidedEvidence: resultAccepted,
      savedPerToolCallableResultAcceptedWithProvidedEvidence: resultAccepted,
      callableEnvelopeAcceptedWithProvidedEvidence: resultAccepted,
      privateArtifactManifestAcceptedWithProvidedEvidence: resultAccepted,
      toolRouteHandoffAcceptedWithProvidedEvidence: resultAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      productionControlledToolCallReadyNow: sourceAccepted,
      runtimeReadyForOnDemandProductionToolCall: false,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartedForCallableResult: false,
      gpuRuntimeReleasedAfterCallableResult: false,
      gpuRuntimeIdleAfterCleanup:
        resultAccepted && result?.gpuRuntimeIdleAfterCleanup === true,
      gpuRuntimeShouldStartNow: false,
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
      workerDispatchPerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      privateArtifactWritePerformed: false,
      serviceRoleTransactionPerformed: false,
      supabaseMutationPerformed: false,
      workerLeaseCreatedByResultProof: false,
      workerDispatchPerformedByResultProof: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByResultProof: false,
      gpuRuntimeShouldStartNowPerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
