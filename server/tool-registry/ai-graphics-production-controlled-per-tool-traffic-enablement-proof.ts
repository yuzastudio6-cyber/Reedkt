import {
  acceptedAiGraphicsProductionControlledPerToolCallableResultProof,
  type AiGraphicsProductionControlledPerToolCallableResult,
  type AiGraphicsProductionControlledPerToolCallableResultProof,
} from './ai-graphics-production-controlled-per-tool-callable-result-proof'
import type { AiGraphicsCanonicalToolId } from './ai-graphics-tool-call-readiness'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'

export const AI_GRAPHICS_PRODUCTION_CONTROLLED_PER_TOOL_TRAFFIC_ENABLEMENT_PROOF_DECISION =
  'ai_graphics_production_controlled_per_tool_traffic_enablement_proof_prepared_with_runtime_blocks'

export type AiGraphicsProductionControlledPerToolTrafficEnablementProofStatus =
  | 'missing_production_controlled_per_tool_callable_result_proof'
  | 'production_controlled_per_tool_callable_result_proof_rejected'
  | 'missing_production_controlled_per_tool_traffic_enablement'
  | 'production_controlled_per_tool_traffic_enablement_rejected'
  | 'production_controlled_per_tool_traffic_enablement_proof_ready_no_execution'

export interface AiGraphicsProductionControlledPerToolTrafficEnablement {
  ok: true
  decision: 'ai_graphics_production_controlled_per_tool_traffic_enablement_recorded_with_runtime_blocks'
  status: 'production_controlled_per_tool_traffic_enablement_recorded_private_non_production_runtime_still_blocked'
  sourcePerToolCallableResultProofRef: string
  sourcePerToolCallableResultProofAccepted: true
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  capabilityId: string
  routePath: '/api/ai-graphics/production/tool-call'
  routeId: string
  futureHandler: string
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  privateInputManifestRef: string
  privateOutputManifestRef: string
  privateTelemetryRef: string
  privateLeaseAuditRef: string
  privateRouteHandoffRef: string
  modelWeightOrCacheManifestRef: string | null
  trafficPolicyRef: string
  trafficFlagRef: string
  rolloutCohortRef: string
  monitoringRef: string
  rollbackRef: string
  costGuardrailRef: string
  operatorReviewRef: string
  trafficEnablementRecordedInPrivateNonProduction: true
  trafficEnvelopeValidated: true
  sourceCallableResultProofAcceptedCount: 1
  callableEnvelopeAcceptedCount: 1
  privateArtifactManifestAcceptedCount: 1
  toolRouteHandoffAcceptedCount: 1
  trafficEnablementRequestedCount: 1
  trafficEnabledCount: 0
  toolExecutionCount: 0
  routeExecutionCount: 0
  workerDispatchCount: 0
  privateArtifactWriteCount: 0
  providerRuntimeCount: 0
  browserWebglCanvasRuntimeCount: 0
  gpuRuntimeStartedForTrafficEnablement: false
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
  externalBetaTrafficEnabledNowTools: 0
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
}

export interface AiGraphicsProductionControlledPerToolTrafficEnablementProofInput {
  sourcePerToolCallableResultProofPacket?:
    AiGraphicsProductionControlledPerToolCallableResultProof
  perToolTrafficEnablement?: AiGraphicsProductionControlledPerToolTrafficEnablement
  perToolTrafficEnablementEvidenceRef?: string
  perToolTrafficEnablementQaRef?: string
  perToolTrafficEnablementCostRef?: string
  perToolTrafficEnablementRollbackRef?: string
  perToolTrafficEnablementOperatorReviewRef?: string
}

export interface AiGraphicsProductionControlledPerToolTrafficEnablementProof {
  decision:
    typeof AI_GRAPHICS_PRODUCTION_CONTROLLED_PER_TOOL_TRAFFIC_ENABLEMENT_PROOF_DECISION
  sourcePerToolCallableResultProofDecision: string | null
  status: AiGraphicsProductionControlledPerToolTrafficEnablementProofStatus
  requestedToolId: AiGraphicsCanonicalToolId | null
  capabilityId: string | null
  sourcePerToolCallableResultProofAccepted: boolean
  sourceCallableEnvelopeAccepted: boolean
  sourcePrivateArtifactManifestAccepted: boolean
  sourceToolRouteHandoffAccepted: boolean
  trafficEnablementProofAcceptedWithProvidedEvidence: boolean
  perToolTrafficEnablementAcceptedWithProvidedEvidence: boolean
  savedTrafficEnablementEnvelopeAcceptedWithProvidedEvidence: boolean
  rejectionReasons: string[]
  perToolTrafficEnablementProofAcceptedRequestsWithProvidedEvidence: 0 | 1
  sourcePerToolCallableResultProofAcceptedRequestsWithProvidedEvidence: 0 | 1
  callableEnvelopeAcceptedWithProvidedEvidence: 0 | 1
  privateArtifactManifestAcceptedWithProvidedEvidence: 0 | 1
  toolRouteHandoffAcceptedWithProvidedEvidence: 0 | 1
  trafficEnablementAcceptedWithProvidedEvidence: 0 | 1
  toolExecutionAcceptedWithProvidedEvidence: 0
  routeExecutionAcceptedWithProvidedEvidence: 0
  workerDispatchAcceptedWithProvidedEvidence: 0
  privateArtifactWriteAcceptedWithProvidedEvidence: 0
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeShouldStartNow: false
  externalBetaTrafficEnabledNowTools: 0
  externalBetaCallableNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourcePerToolCallableResultProof:
    AiGraphicsProductionControlledPerToolCallableResultProof | null
  savedPerToolTrafficEnablement:
    AiGraphicsProductionControlledPerToolTrafficEnablement | null
  evidence: {
    perToolTrafficEnablementEvidenceRef: string | null
    perToolTrafficEnablementQaRef: string | null
    perToolTrafficEnablementCostRef: string | null
    perToolTrafficEnablementRollbackRef: string | null
    perToolTrafficEnablementOperatorReviewRef: string | null
    sourcePerToolCallableResultProofRef: string | null
    sanitizedSourceStatus: string | null
    sanitizedSourceDecision: string | null
    requiredExecutionEnvironment: 'private_non_production_traffic_enablement'
    requiredTrafficMode: 'saved_per_tool_traffic_enablement_only'
    savedTrafficEnvelopeOnly: true
  }
  policy: {
    validatesSavedTrafficEnablementOnly: true
    sourcePerToolCallableResultProofRequired: true
    noExternalBetaTrafficEnabledByProof: true
    noLiveApiRouteExecutionByProof: true
    noLiveWorkerDispatchByProof: true
    noToolExecutionByProof: true
    noPrivateArtifactWriteByProof: true
    noProviderRuntimeByProof: true
    noBrowserWebglCanvasRuntimeByProof: true
    noGpuRuntimeStartByProof: true
    publicArtifactsRejected: true
    signedUrlsRejected: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    nextGateRequiresControlledOperatorTrafficSwitch: true
  }
  booleans: {
    productionControlledPerToolTrafficEnablementProofPrepared: true
    sourcePerToolCallableResultProofAccepted: boolean
    sourceCallableEnvelopeAcceptedWithProvidedEvidence: boolean
    sourcePrivateArtifactManifestAcceptedWithProvidedEvidence: boolean
    sourceToolRouteHandoffAcceptedWithProvidedEvidence: boolean
    perToolTrafficEnablementPreparedWithProvidedEvidence: boolean
    savedTrafficEnablementEnvelopeAcceptedWithProvidedEvidence: boolean
    trafficEnablementAcceptedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    productionControlledToolCallReadyNow: boolean
    runtimeReadyForOnDemandProductionToolCall: false
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeStartedForTrafficEnablement: false
    gpuRuntimeIdleAfterCleanup: boolean
    gpuRuntimeShouldStartNow: false
    qaGateAcceptedWithProvidedEvidence: boolean
    telemetryAcceptedWithProvidedEvidence: boolean
    rollbackAcceptedWithProvidedEvidence: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    externalBetaTrafficEnabledNow: false
    externalBetaTrafficSwitchApprovedNow: false
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
    workerLeaseCreatedByTrafficEnablementProof: false
    workerDispatchPerformedByTrafficEnablementProof: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformedByTrafficEnablementProof: false
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

function sourceCallableResult(
  packet?: AiGraphicsProductionControlledPerToolCallableResultProof,
): AiGraphicsProductionControlledPerToolCallableResult | null {
  return packet?.savedPerToolCallableResult ?? null
}

function compareTrafficEnablementToSource(
  traffic: AiGraphicsProductionControlledPerToolTrafficEnablement,
  source: AiGraphicsProductionControlledPerToolCallableResult,
): string[] {
  return [
    traffic.toolId !== source.toolId ? 'tool id mismatch' : undefined,
    traffic.productionToolId !== source.productionToolId
      ? 'production tool id mismatch'
      : undefined,
    traffic.capabilityId !== source.capabilityId ? 'capability id mismatch' : undefined,
    traffic.routePath !== source.routePath ? 'route path mismatch' : undefined,
    traffic.routeId !== source.routeId ? 'route id mismatch' : undefined,
    traffic.futureHandler !== source.futureHandler ? 'future handler mismatch' : undefined,
    traffic.workerType !== source.workerType ? 'worker type mismatch' : undefined,
    traffic.runtimeTarget !== source.runtimeTarget ? 'runtime target mismatch' : undefined,
    traffic.privateInputManifestRef !== source.privateInputManifestRef
      ? 'private input manifest mismatch'
      : undefined,
    traffic.privateOutputManifestRef !== source.privateOutputManifestRef
      ? 'private output manifest mismatch'
      : undefined,
    traffic.privateTelemetryRef !== source.privateTelemetryRef
      ? 'private telemetry mismatch'
      : undefined,
    traffic.privateLeaseAuditRef !== source.privateLeaseAuditRef
      ? 'private lease audit mismatch'
      : undefined,
    traffic.privateRouteHandoffRef !== source.privateRouteHandoffRef
      ? 'private route handoff mismatch'
      : undefined,
    traffic.modelWeightOrCacheManifestRef !== source.modelWeightOrCacheManifestRef
      ? 'model weight/cache manifest mismatch'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function validateTrafficEnablement(
  traffic: AiGraphicsProductionControlledPerToolTrafficEnablement | undefined,
  source: AiGraphicsProductionControlledPerToolCallableResult | null,
): string[] {
  if (!traffic) return ['production controlled per-tool traffic enablement is missing']
  if (!source) return ['accepted per-tool callable result is missing']

  return [
    traffic.ok !== true ? 'per-tool traffic enablement ok flag is not true' : undefined,
    traffic.decision !==
      'ai_graphics_production_controlled_per_tool_traffic_enablement_recorded_with_runtime_blocks'
      ? 'per-tool traffic enablement decision is not accepted'
      : undefined,
    traffic.status !==
      'production_controlled_per_tool_traffic_enablement_recorded_private_non_production_runtime_still_blocked'
      ? 'per-tool traffic enablement status is not accepted'
      : undefined,
    !hasPrivateEvidenceRef(traffic.sourcePerToolCallableResultProofRef)
      ? 'per-tool traffic enablement must include a private source callable proof ref'
      : undefined,
    traffic.sourcePerToolCallableResultProofAccepted !== true
      ? 'per-tool traffic enablement must preserve the source callable proof chain'
      : undefined,
    !hasPrivateEvidenceRef(traffic.trafficPolicyRef)
      ? 'traffic policy ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(traffic.trafficFlagRef)
      ? 'traffic flag ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(traffic.rolloutCohortRef)
      ? 'rollout cohort ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(traffic.monitoringRef)
      ? 'monitoring ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(traffic.rollbackRef)
      ? 'rollback ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(traffic.costGuardrailRef)
      ? 'cost guardrail ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(traffic.operatorReviewRef)
      ? 'operator review ref is missing or not private'
      : undefined,
    traffic.trafficEnablementRecordedInPrivateNonProduction !== true
      ? 'traffic enablement must be recorded in private non-production'
      : undefined,
    traffic.trafficEnvelopeValidated !== true
      ? 'traffic envelope must be validated'
      : undefined,
    traffic.sourceCallableResultProofAcceptedCount !== 1
      ? 'traffic enablement must accept one source callable result proof'
      : undefined,
    traffic.callableEnvelopeAcceptedCount !== 1
      ? 'traffic enablement must accept one callable envelope'
      : undefined,
    traffic.privateArtifactManifestAcceptedCount !== 1
      ? 'traffic enablement must accept one private artifact manifest'
      : undefined,
    traffic.toolRouteHandoffAcceptedCount !== 1
      ? 'traffic enablement must accept one Tool Route handoff'
      : undefined,
    traffic.trafficEnablementRequestedCount !== 1
      ? 'traffic enablement must record one requested traffic envelope'
      : undefined,
    traffic.trafficEnabledCount !== 0
      ? 'traffic enablement must not enable traffic now'
      : undefined,
    traffic.toolExecutionCount !== 0 ? 'traffic enablement must not execute tools' : undefined,
    traffic.routeExecutionCount !== 0
      ? 'traffic enablement must not execute routes'
      : undefined,
    traffic.workerDispatchCount !== 0
      ? 'traffic enablement must not dispatch workers'
      : undefined,
    traffic.privateArtifactWriteCount !== 0
      ? 'traffic enablement must not write private artifacts'
      : undefined,
    traffic.providerRuntimeCount !== 0
      ? 'traffic enablement must not call providers/models'
      : undefined,
    traffic.browserWebglCanvasRuntimeCount !== 0
      ? 'traffic enablement must not start browser/WebGL/canvas runtime'
      : undefined,
    traffic.gpuRuntimeStartedForTrafficEnablement !== false
      ? 'traffic enablement must not start GPU runtime'
      : undefined,
    traffic.gpuRuntimeShouldStartNow !== false
      ? 'traffic enablement must not request GPU runtime now'
      : undefined,
    traffic.gpuRuntimeIdleAfterCleanup !== true
      ? 'GPU runtime must be idle after traffic enablement metadata'
      : undefined,
    traffic.modelWeightsDownloaded !== false
      ? 'traffic enablement must not download model weights'
      : undefined,
    traffic.modelWeightsLoaded !== false
      ? 'traffic enablement must not load model weights'
      : undefined,
    traffic.qaGatePassedWithProvidedEvidence !== true
      ? 'traffic enablement must pass QA gate with provided evidence'
      : undefined,
    traffic.telemetryCaptured !== true
      ? 'traffic enablement must capture telemetry metadata'
      : undefined,
    traffic.costWithinCeiling !== true
      ? 'traffic enablement must remain within cost ceiling'
      : undefined,
    traffic.rollbackReady !== true
      ? 'traffic enablement must preserve rollback readiness'
      : undefined,
    traffic.secretsRedactedFromOutput !== true
      ? 'traffic enablement must redact secrets from output'
      : undefined,
    traffic.publicArtifactCreated !== false
      ? 'traffic enablement must not create public artifacts'
      : undefined,
    traffic.signedUrlCreated !== false
      ? 'traffic enablement must not create signed URLs'
      : undefined,
    traffic.externalBetaTrafficEnabledNowTools !== 0
      ? 'traffic enablement must not enable external beta traffic now'
      : undefined,
    traffic.externalBetaCallableNowTools !== 0
      ? 'traffic enablement must not enable external beta callable tools now'
      : undefined,
    traffic.externalBetaReadyNowTools !== 0
      ? 'traffic enablement must not unlock external beta readiness'
      : undefined,
    traffic.productionReadyNowTools !== 0
      ? 'traffic enablement must not unlock production tools'
      : undefined,
    ...compareTrafficEnablementToSource(traffic, source),
  ].filter((reason): reason is string => Boolean(reason))
}

function evidenceRefsMissing(
  input: AiGraphicsProductionControlledPerToolTrafficEnablementProofInput,
): string[] {
  return [
    !hasPrivateEvidenceRef(input.perToolTrafficEnablementEvidenceRef)
      ? 'per-tool traffic enablement evidence ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.perToolTrafficEnablementQaRef)
      ? 'per-tool traffic enablement QA ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.perToolTrafficEnablementCostRef)
      ? 'per-tool traffic enablement cost ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.perToolTrafficEnablementRollbackRef)
      ? 'per-tool traffic enablement rollback ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.perToolTrafficEnablementOperatorReviewRef)
      ? 'per-tool traffic enablement operator review ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSourceProof: boolean
  sourceProofAccepted: boolean
  hasTrafficEnablement: boolean
  trafficEnablementAccepted: boolean
}): AiGraphicsProductionControlledPerToolTrafficEnablementProofStatus {
  if (!input.hasSourceProof) {
    return 'missing_production_controlled_per_tool_callable_result_proof'
  }
  if (!input.sourceProofAccepted) {
    return 'production_controlled_per_tool_callable_result_proof_rejected'
  }
  if (!input.hasTrafficEnablement) {
    return 'missing_production_controlled_per_tool_traffic_enablement'
  }
  return input.trafficEnablementAccepted
    ? 'production_controlled_per_tool_traffic_enablement_proof_ready_no_execution'
    : 'production_controlled_per_tool_traffic_enablement_rejected'
}

export function acceptedAiGraphicsProductionControlledPerToolTrafficEnablementProof(
  packet: AiGraphicsProductionControlledPerToolTrafficEnablementProof | undefined,
): packet is AiGraphicsProductionControlledPerToolTrafficEnablementProof {
  return Boolean(
    packet &&
      packet.decision ===
        AI_GRAPHICS_PRODUCTION_CONTROLLED_PER_TOOL_TRAFFIC_ENABLEMENT_PROOF_DECISION &&
      packet.status ===
        'production_controlled_per_tool_traffic_enablement_proof_ready_no_execution' &&
      packet.sourcePerToolCallableResultProofAccepted === true &&
      packet.trafficEnablementProofAcceptedWithProvidedEvidence === true &&
      packet.savedPerToolTrafficEnablement !== null &&
      packet.trafficEnablementAcceptedWithProvidedEvidence === 1 &&
      packet.toolExecutionAcceptedWithProvidedEvidence === 0 &&
      packet.routeExecutionAcceptedWithProvidedEvidence === 0 &&
      packet.workerDispatchAcceptedWithProvidedEvidence === 0 &&
      packet.privateArtifactWriteAcceptedWithProvidedEvidence === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.externalBetaTrafficEnabledNowTools === 0 &&
      packet.externalBetaReadyNowTools === 0 &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.externalBetaTrafficEnabledNow === false &&
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

export function evaluateAiGraphicsProductionControlledPerToolTrafficEnablementProof(
  input: AiGraphicsProductionControlledPerToolTrafficEnablementProofInput = {},
): AiGraphicsProductionControlledPerToolTrafficEnablementProof {
  const sourceAccepted =
    acceptedAiGraphicsProductionControlledPerToolCallableResultProof(
      input.sourcePerToolCallableResultProofPacket,
    )
  const sourceResult = sourceCallableResult(input.sourcePerToolCallableResultProofPacket)
  const sourceCallableEnvelopeAccepted =
    sourceAccepted &&
    input.sourcePerToolCallableResultProofPacket
      ?.callableEnvelopeAcceptedWithProvidedEvidence === 1
  const sourcePrivateArtifactManifestAccepted =
    sourceAccepted &&
    input.sourcePerToolCallableResultProofPacket
      ?.privateArtifactManifestAcceptedWithProvidedEvidence === 1
  const sourceToolRouteHandoffAccepted =
    sourceAccepted &&
    input.sourcePerToolCallableResultProofPacket
      ?.toolRouteHandoffAcceptedWithProvidedEvidence === 1
  const resultRejections = sourceAccepted
    ? validateTrafficEnablement(input.perToolTrafficEnablement, sourceResult)
    : []
  const evidenceRejections = sourceAccepted && input.perToolTrafficEnablement
    ? evidenceRefsMissing(input)
    : []
  const rejectionReasons = [...resultRejections, ...evidenceRejections]
  const resultAccepted = sourceAccepted &&
    Boolean(input.perToolTrafficEnablement) &&
    rejectionReasons.length === 0
  const status = statusFromInput({
    hasSourceProof: Boolean(input.sourcePerToolCallableResultProofPacket),
    sourceProofAccepted: sourceAccepted,
    hasTrafficEnablement: Boolean(input.perToolTrafficEnablement),
    trafficEnablementAccepted: resultAccepted,
  })
  const result = resultAccepted ? input.perToolTrafficEnablement ?? null : null

  return {
    decision: AI_GRAPHICS_PRODUCTION_CONTROLLED_PER_TOOL_TRAFFIC_ENABLEMENT_PROOF_DECISION,
    sourcePerToolCallableResultProofDecision:
      input.sourcePerToolCallableResultProofPacket?.decision ?? null,
    status,
    requestedToolId: sourceResult?.toolId ?? null,
    capabilityId: sourceResult?.capabilityId ?? null,
    sourcePerToolCallableResultProofAccepted: sourceAccepted,
    sourceCallableEnvelopeAccepted,
    sourcePrivateArtifactManifestAccepted,
    sourceToolRouteHandoffAccepted,
    trafficEnablementProofAcceptedWithProvidedEvidence: resultAccepted,
    perToolTrafficEnablementAcceptedWithProvidedEvidence: resultAccepted,
    savedTrafficEnablementEnvelopeAcceptedWithProvidedEvidence: resultAccepted,
    rejectionReasons,
    perToolTrafficEnablementProofAcceptedRequestsWithProvidedEvidence:
      resultAccepted ? 1 : 0,
    sourcePerToolCallableResultProofAcceptedRequestsWithProvidedEvidence:
      sourceAccepted ? 1 : 0,
    callableEnvelopeAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    privateArtifactManifestAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    toolRouteHandoffAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    trafficEnablementAcceptedWithProvidedEvidence: resultAccepted ? 1 : 0,
    toolExecutionAcceptedWithProvidedEvidence: 0,
    routeExecutionAcceptedWithProvidedEvidence: 0,
    workerDispatchAcceptedWithProvidedEvidence: 0,
    privateArtifactWriteAcceptedWithProvidedEvidence: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    externalBetaTrafficEnabledNowTools: 0,
    externalBetaCallableNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourcePerToolCallableResultProof:
      input.sourcePerToolCallableResultProofPacket ?? null,
    savedPerToolTrafficEnablement: result,
    evidence: {
      perToolTrafficEnablementEvidenceRef:
        input.perToolTrafficEnablementEvidenceRef ?? null,
      perToolTrafficEnablementQaRef: input.perToolTrafficEnablementQaRef ?? null,
      perToolTrafficEnablementCostRef: input.perToolTrafficEnablementCostRef ?? null,
      perToolTrafficEnablementRollbackRef:
        input.perToolTrafficEnablementRollbackRef ?? null,
      perToolTrafficEnablementOperatorReviewRef:
        input.perToolTrafficEnablementOperatorReviewRef ?? null,
      sourcePerToolCallableResultProofRef:
        result?.sourcePerToolCallableResultProofRef ?? null,
      sanitizedSourceStatus: result?.status ?? null,
      sanitizedSourceDecision: result?.decision ?? null,
      requiredExecutionEnvironment: 'private_non_production_traffic_enablement',
      requiredTrafficMode: 'saved_per_tool_traffic_enablement_only',
      savedTrafficEnvelopeOnly: true,
    },
    policy: {
      validatesSavedTrafficEnablementOnly: true,
      sourcePerToolCallableResultProofRequired: true,
      noExternalBetaTrafficEnabledByProof: true,
      noLiveApiRouteExecutionByProof: true,
      noLiveWorkerDispatchByProof: true,
      noToolExecutionByProof: true,
      noPrivateArtifactWriteByProof: true,
      noProviderRuntimeByProof: true,
      noBrowserWebglCanvasRuntimeByProof: true,
      noGpuRuntimeStartByProof: true,
      publicArtifactsRejected: true,
      signedUrlsRejected: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      nextGateRequiresControlledOperatorTrafficSwitch: true,
    },
    booleans: {
      productionControlledPerToolTrafficEnablementProofPrepared: true,
      sourcePerToolCallableResultProofAccepted: sourceAccepted,
      sourceCallableEnvelopeAcceptedWithProvidedEvidence: sourceCallableEnvelopeAccepted,
      sourcePrivateArtifactManifestAcceptedWithProvidedEvidence:
        sourcePrivateArtifactManifestAccepted,
      sourceToolRouteHandoffAcceptedWithProvidedEvidence: sourceToolRouteHandoffAccepted,
      perToolTrafficEnablementPreparedWithProvidedEvidence: resultAccepted,
      savedTrafficEnablementEnvelopeAcceptedWithProvidedEvidence: resultAccepted,
      trafficEnablementAcceptedWithProvidedEvidence: resultAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      productionControlledToolCallReadyNow: sourceAccepted,
      runtimeReadyForOnDemandProductionToolCall: false,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeStartedForTrafficEnablement: false,
      gpuRuntimeIdleAfterCleanup:
        resultAccepted && result?.gpuRuntimeIdleAfterCleanup === true,
      gpuRuntimeShouldStartNow: false,
      qaGateAcceptedWithProvidedEvidence:
        resultAccepted && result?.qaGatePassedWithProvidedEvidence === true,
      telemetryAcceptedWithProvidedEvidence:
        resultAccepted && result?.telemetryCaptured === true,
      rollbackAcceptedWithProvidedEvidence:
        resultAccepted && result?.rollbackReady === true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      externalBetaTrafficEnabledNow: false,
      externalBetaTrafficSwitchApprovedNow: false,
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
      workerLeaseCreatedByTrafficEnablementProof: false,
      workerDispatchPerformedByTrafficEnablementProof: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByTrafficEnablementProof: false,
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
