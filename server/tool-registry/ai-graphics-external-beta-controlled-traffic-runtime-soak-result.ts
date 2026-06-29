import {
  AI_GRAPHICS_EXTERNAL_BETA_OPERATOR_TRAFFIC_SWITCH_RUNTIME_SOAK_AUTHORIZATION_DECISION,
  type AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization,
} from './ai-graphics-external-beta-operator-traffic-switch-runtime-soak-authorization'

export const AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_TRAFFIC_RUNTIME_SOAK_RESULT_DECISION =
  'ai_graphics_external_beta_controlled_traffic_runtime_soak_result_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaControlledTrafficRuntimeSoakResultStatus =
  | 'missing_external_beta_operator_traffic_switch_runtime_soak_authorization'
  | 'external_beta_operator_traffic_switch_runtime_soak_authorization_rejected'
  | 'missing_external_beta_controlled_traffic_runtime_soak_result_evidence'
  | 'external_beta_controlled_traffic_runtime_soak_result_accepted_runtime_still_blocked'

export interface AiGraphicsExternalBetaControlledTrafficRuntimeSoakResultInput {
  sourceOperatorTrafficSwitchRuntimeSoakAuthorizationPacket?:
    AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization
  externalBetaControlledTrafficRunResultRef?: string
  externalBetaRuntimeSoakMetricsRef?: string
  externalBetaRequestSampleAuditRef?: string
  externalBetaZeroCriticalIncidentRef?: string
  externalBetaCostObservationRef?: string
  externalBetaGpuLifecycleObservationRef?: string
  externalBetaUserImpactReviewRef?: string
  externalBetaRollbackReadinessRef?: string
  externalBetaPostSoakOwnerReviewRef?: string
}

export interface AiGraphicsExternalBetaControlledTrafficRuntimeSoakObservedResult {
  toolId: string
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  routeId: string
  sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted: true
  controlledTrafficRunResultRef: string
  runtimeSoakMetricsRef: string
  requestSampleAuditRef: string
  zeroCriticalIncidentRef: string
  costObservationRef: string
  gpuLifecycleObservationRef: string
  userImpactReviewRef: string
  rollbackReadinessRef: string
  postSoakOwnerReviewRef: string
  controlledTrafficRunObservedWithProvidedEvidence: true
  runtimeSoakObservedWithProvidedEvidence: true
  gpuLifecycleObservedAsOnDemandWithProvidedEvidence: true
  controlledTrafficRunExecutedByThisGate: false
  externalBetaTrafficSwitchEnabledByThisGate: false
  externalBetaRuntimeSoakStartedByThisGate: false
  routeExecutionPerformedByThisGate: false
  workerDispatchPerformedByThisGate: false
  toolExecutionPerformedByThisGate: false
  gpuRuntimePerformedByThisGate: false
}

export interface AiGraphicsExternalBetaControlledTrafficRuntimeSoakResult {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_TRAFFIC_RUNTIME_SOAK_RESULT_DECISION
  sourceOperatorTrafficSwitchRuntimeSoakAuthorizationDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_OPERATOR_TRAFFIC_SWITCH_RUNTIME_SOAK_AUTHORIZATION_DECISION | null
  status: AiGraphicsExternalBetaControlledTrafficRuntimeSoakResultStatus
  sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted: boolean
  controlledTrafficRuntimeSoakObservedEvidenceAccepted: boolean
  rejectionReasons: string[]
  requestedToolId: string | null
  capabilityId: string | null
  controlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence: 0 | 1
  sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAcceptedRequestsWithProvidedEvidence:
    0 | 1
  controlledTrafficRuntimeSoakObservedToolsWithProvidedEvidence: 0 | 1
  externalBetaTrafficSwitchEnabledByThisGateTools: 0
  externalBetaRuntimeSoakStartedByThisGateTools: 0
  externalBetaTrafficEnabledByThisGateTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeShouldStartNow: false
  observedResult: AiGraphicsExternalBetaControlledTrafficRuntimeSoakObservedResult | null
  evidence: {
    controlledTrafficRunResultRef: string | null
    runtimeSoakMetricsRef: string | null
    requestSampleAuditRef: string | null
    zeroCriticalIncidentRef: string | null
    costObservationRef: string | null
    gpuLifecycleObservationRef: string | null
    userImpactReviewRef: string | null
    rollbackReadinessRef: string | null
    postSoakOwnerReviewRef: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredEvidenceMode:
      'observed_controlled_traffic_runtime_soak_result_metadata_only'
    sourceOperatorTrafficSwitchRuntimeSoakAuthorizationRequired: true
  }
  policy: {
    validatesObservedResultEvidenceOnly: true
    noControlledTrafficExecutedByGate: true
    noExternalBetaTrafficSwitchEnabledByGate: true
    noRuntimeSoakStartedByGate: true
    noLiveApiRouteExecutionByGate: true
    noLiveWorkerDispatchByGate: true
    noToolExecutionByGate: true
    noProviderRuntimeByGate: true
    noGpuRuntimeStartByGate: true
    nextGateRequiresExternalBetaActivationGoNoGo: true
  }
  booleans: {
    externalBetaControlledTrafficRuntimeSoakResultPrepared: true
    sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted: boolean
    controlledTrafficRuntimeSoakObservedEvidenceAccepted: boolean
    controlledTrafficRunObservedWithProvidedEvidence: boolean
    runtimeSoakObservedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    controlledTrafficRunExecutedByThisGate: false
    externalBetaTrafficEnabledNow: false
    externalBetaTrafficSwitchEnabledByThisGate: false
    externalBetaRuntimeSoakStartedByThisGate: false
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
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-evidence://') ||
    normalized.startsWith('external-beta-traffic://')
}

function sourceAuthorizationAccepted(
  packet?: AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_OPERATOR_TRAFFIC_SWITCH_RUNTIME_SOAK_AUTHORIZATION_DECISION &&
    packet.status ===
      'external_beta_operator_traffic_switch_runtime_soak_authorization_ready_runtime_still_blocked' &&
    packet.sourcePerToolTrafficEnablementGateAccepted === true &&
    packet.operatorTrafficSwitchRuntimeSoakControlsAccepted === true &&
    packet.operatorTrafficSwitchRuntimeSoakAuthorizationPreparedRequestsWithProvidedEvidence === 1 &&
    packet.sourcePerToolTrafficEnablementGateAcceptedRequestsWithProvidedEvidence === 1 &&
    packet.operatorTrafficSwitchRuntimeSoakCandidateToolsWithProvidedEvidence === 1 &&
    packet.externalBetaTrafficSwitchEnabledNowTools === 0 &&
    packet.externalBetaRuntimeSoakStartedNowTools === 0 &&
    packet.externalBetaTrafficEnabledNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.trafficSwitchRuntimeSoakCandidate !== null &&
    packet.trafficSwitchRuntimeSoakCandidate.externalBetaTrafficSwitchEnabledNow === false &&
    packet.trafficSwitchRuntimeSoakCandidate.externalBetaRuntimeSoakStartedNow === false &&
    packet.trafficSwitchRuntimeSoakCandidate.routeExecutionApprovedNow === false &&
    packet.trafficSwitchRuntimeSoakCandidate.workerDispatchApprovedNow === false &&
    packet.trafficSwitchRuntimeSoakCandidate.toolExecutionApprovedNow === false &&
    packet.trafficSwitchRuntimeSoakCandidate.gpuRuntimeShouldStartNow === false &&
    packet.policy.noExternalBetaTrafficSwitchEnabledByGate === true &&
    packet.policy.noRuntimeSoakStartedByGate === true &&
    packet.policy.noLiveApiRouteExecutionByGate === true &&
    packet.policy.noLiveWorkerDispatchByGate === true &&
    packet.policy.noToolExecutionByGate === true &&
    packet.policy.noGpuRuntimeStartByGate === true &&
    packet.booleans.operatorTrafficSwitchRuntimeSoakAuthorizationPreparedWithProvidedEvidence === true &&
    packet.booleans.externalBetaTrafficSwitchEnabledNow === false &&
    packet.booleans.externalBetaRuntimeSoakStartedNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function missingEvidence(
  input: AiGraphicsExternalBetaControlledTrafficRuntimeSoakResultInput,
): string[] {
  return [
    !hasPrivateEvidenceRef(input.externalBetaControlledTrafficRunResultRef)
      ? 'external beta controlled traffic run result ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaRuntimeSoakMetricsRef)
      ? 'external beta runtime soak metrics ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaRequestSampleAuditRef)
      ? 'external beta request sample audit ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaZeroCriticalIncidentRef)
      ? 'external beta zero critical incident ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaCostObservationRef)
      ? 'external beta cost observation ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaGpuLifecycleObservationRef)
      ? 'external beta GPU lifecycle observation ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaUserImpactReviewRef)
      ? 'external beta user impact review ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaRollbackReadinessRef)
      ? 'external beta rollback readiness ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaPostSoakOwnerReviewRef)
      ? 'external beta post-soak owner review ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSourceAuthorization: boolean
  sourceAuthorizationAccepted: boolean
  observedEvidenceAccepted: boolean
}): AiGraphicsExternalBetaControlledTrafficRuntimeSoakResultStatus {
  if (!input.hasSourceAuthorization) {
    return 'missing_external_beta_operator_traffic_switch_runtime_soak_authorization'
  }
  if (!input.sourceAuthorizationAccepted) {
    return 'external_beta_operator_traffic_switch_runtime_soak_authorization_rejected'
  }
  return input.observedEvidenceAccepted
    ? 'external_beta_controlled_traffic_runtime_soak_result_accepted_runtime_still_blocked'
    : 'missing_external_beta_controlled_traffic_runtime_soak_result_evidence'
}

function buildObservedResult(
  input: AiGraphicsExternalBetaControlledTrafficRuntimeSoakResultInput,
): AiGraphicsExternalBetaControlledTrafficRuntimeSoakObservedResult | null {
  const sourceCandidate =
    input.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationPacket
      ?.trafficSwitchRuntimeSoakCandidate
  if (!sourceCandidate) return null
  return {
    toolId: sourceCandidate.toolId,
    capabilityId: sourceCandidate.capabilityId,
    routePath: sourceCandidate.routePath,
    routeId: sourceCandidate.routeId,
    sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted: true,
    controlledTrafficRunResultRef:
      input.externalBetaControlledTrafficRunResultRef ?? '',
    runtimeSoakMetricsRef: input.externalBetaRuntimeSoakMetricsRef ?? '',
    requestSampleAuditRef: input.externalBetaRequestSampleAuditRef ?? '',
    zeroCriticalIncidentRef: input.externalBetaZeroCriticalIncidentRef ?? '',
    costObservationRef: input.externalBetaCostObservationRef ?? '',
    gpuLifecycleObservationRef:
      input.externalBetaGpuLifecycleObservationRef ?? '',
    userImpactReviewRef: input.externalBetaUserImpactReviewRef ?? '',
    rollbackReadinessRef: input.externalBetaRollbackReadinessRef ?? '',
    postSoakOwnerReviewRef: input.externalBetaPostSoakOwnerReviewRef ?? '',
    controlledTrafficRunObservedWithProvidedEvidence: true,
    runtimeSoakObservedWithProvidedEvidence: true,
    gpuLifecycleObservedAsOnDemandWithProvidedEvidence: true,
    controlledTrafficRunExecutedByThisGate: false,
    externalBetaTrafficSwitchEnabledByThisGate: false,
    externalBetaRuntimeSoakStartedByThisGate: false,
    routeExecutionPerformedByThisGate: false,
    workerDispatchPerformedByThisGate: false,
    toolExecutionPerformedByThisGate: false,
    gpuRuntimePerformedByThisGate: false,
  }
}

export function evaluateAiGraphicsExternalBetaControlledTrafficRuntimeSoakResult(
  input: AiGraphicsExternalBetaControlledTrafficRuntimeSoakResultInput = {},
): AiGraphicsExternalBetaControlledTrafficRuntimeSoakResult {
  const sourceAccepted = sourceAuthorizationAccepted(
    input.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationPacket,
  )
  const missing = sourceAccepted ? missingEvidence(input) : []
  const observedEvidenceAccepted = missing.length === 0
  const status = statusFromInput({
    hasSourceAuthorization:
      Boolean(input.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationPacket),
    sourceAuthorizationAccepted: sourceAccepted,
    observedEvidenceAccepted,
  })
  const accepted = status ===
    'external_beta_controlled_traffic_runtime_soak_result_accepted_runtime_still_blocked'
  const observedResult = accepted ? buildObservedResult(input) : null

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_TRAFFIC_RUNTIME_SOAK_RESULT_DECISION,
    sourceOperatorTrafficSwitchRuntimeSoakAuthorizationDecision:
      input.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationPacket?.decision ?? null,
    status,
    sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted: sourceAccepted,
    controlledTrafficRuntimeSoakObservedEvidenceAccepted:
      observedEvidenceAccepted,
    rejectionReasons: missing,
    requestedToolId:
      input.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationPacket
        ?.requestedToolId ?? null,
    capabilityId:
      input.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationPacket
        ?.capabilityId ?? null,
    controlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence:
      accepted ? 1 : 0,
    sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAcceptedRequestsWithProvidedEvidence:
      sourceAccepted ? 1 : 0,
    controlledTrafficRuntimeSoakObservedToolsWithProvidedEvidence:
      accepted ? 1 : 0,
    externalBetaTrafficSwitchEnabledByThisGateTools: 0,
    externalBetaRuntimeSoakStartedByThisGateTools: 0,
    externalBetaTrafficEnabledByThisGateTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    observedResult,
    evidence: {
      controlledTrafficRunResultRef:
        input.externalBetaControlledTrafficRunResultRef ?? null,
      runtimeSoakMetricsRef: input.externalBetaRuntimeSoakMetricsRef ?? null,
      requestSampleAuditRef: input.externalBetaRequestSampleAuditRef ?? null,
      zeroCriticalIncidentRef:
        input.externalBetaZeroCriticalIncidentRef ?? null,
      costObservationRef: input.externalBetaCostObservationRef ?? null,
      gpuLifecycleObservationRef:
        input.externalBetaGpuLifecycleObservationRef ?? null,
      userImpactReviewRef: input.externalBetaUserImpactReviewRef ?? null,
      rollbackReadinessRef: input.externalBetaRollbackReadinessRef ?? null,
      postSoakOwnerReviewRef: input.externalBetaPostSoakOwnerReviewRef ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredEvidenceMode:
        'observed_controlled_traffic_runtime_soak_result_metadata_only',
      sourceOperatorTrafficSwitchRuntimeSoakAuthorizationRequired: true,
    },
    policy: {
      validatesObservedResultEvidenceOnly: true,
      noControlledTrafficExecutedByGate: true,
      noExternalBetaTrafficSwitchEnabledByGate: true,
      noRuntimeSoakStartedByGate: true,
      noLiveApiRouteExecutionByGate: true,
      noLiveWorkerDispatchByGate: true,
      noToolExecutionByGate: true,
      noProviderRuntimeByGate: true,
      noGpuRuntimeStartByGate: true,
      nextGateRequiresExternalBetaActivationGoNoGo: true,
    },
    booleans: {
      externalBetaControlledTrafficRuntimeSoakResultPrepared: true,
      sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted:
        sourceAccepted,
      controlledTrafficRuntimeSoakObservedEvidenceAccepted:
        observedEvidenceAccepted,
      controlledTrafficRunObservedWithProvidedEvidence: accepted,
      runtimeSoakObservedWithProvidedEvidence: accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      controlledTrafficRunExecutedByThisGate: false,
      externalBetaTrafficEnabledNow: false,
      externalBetaTrafficSwitchEnabledByThisGate: false,
      externalBetaRuntimeSoakStartedByThisGate: false,
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
