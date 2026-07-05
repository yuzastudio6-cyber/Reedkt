import {
  AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_TRAFFIC_RUNTIME_SOAK_RESULT_DECISION,
  type AiGraphicsExternalBetaControlledTrafficRuntimeSoakResult,
} from './ai-graphics-external-beta-controlled-traffic-runtime-soak-result'

export const AI_GRAPHICS_EXTERNAL_BETA_ACTIVATION_GO_NO_GO_DECISION =
  'ai_graphics_external_beta_activation_go_no_go_approved_with_runtime_blocks'

export type AiGraphicsExternalBetaActivationGoNoGoStatus =
  | 'missing_external_beta_controlled_traffic_runtime_soak_result'
  | 'external_beta_controlled_traffic_runtime_soak_result_rejected'
  | 'missing_external_beta_activation_go_no_go_controls'
  | 'external_beta_activation_go_no_go_approved_for_one_tool_runtime_on_demand'

export interface AiGraphicsExternalBetaActivationGoNoGoInput {
  sourceControlledTrafficRuntimeSoakResultPacket?:
    AiGraphicsExternalBetaControlledTrafficRuntimeSoakResult
  externalBetaActivationOwnerApprovalRef?: string
  externalBetaActivationFeatureFlagRef?: string
  externalBetaActivationCohortRef?: string
  externalBetaActivationSupportAckRef?: string
  externalBetaActivationMonitoringLiveRef?: string
  externalBetaActivationCostBudgetFinalRef?: string
  externalBetaActivationRollbackArmedRef?: string
  externalBetaActivationReleaseNotesRef?: string
  externalBetaActivationUserCommsRef?: string
  externalBetaActivationPostActivationReviewRef?: string
}

export interface AiGraphicsExternalBetaActivatedToolCallReadiness {
  toolId: string
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  routeId: string
  sourceControlledTrafficRuntimeSoakResultAccepted: true
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: true
  externalBetaActivationApprovedWithProvidedEvidence: true
  externalBetaToolCallReadyNow: true
  runtimeReadyForOnDemandExternalBetaToolCall: true
  gpuRuntimeOnDemandOnly: true
  gpuRuntimeShouldStartNow: false
  productionReadyNow: false
  ownerApprovalRef: string
  featureFlagRef: string
  cohortRef: string
  supportAckRef: string
  monitoringLiveRef: string
  costBudgetFinalRef: string
  rollbackArmedRef: string
  releaseNotesRef: string
  userCommsRef: string
  postActivationReviewRef: string
}

export interface AiGraphicsExternalBetaActivationGoNoGo {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_ACTIVATION_GO_NO_GO_DECISION
  sourceControlledTrafficRuntimeSoakResultDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_TRAFFIC_RUNTIME_SOAK_RESULT_DECISION | null
  status: AiGraphicsExternalBetaActivationGoNoGoStatus
  sourceControlledTrafficRuntimeSoakResultAccepted: boolean
  externalBetaActivationControlsAccepted: boolean
  rejectionReasons: string[]
  requestedToolId: string | null
  capabilityId: string | null
  externalBetaActivationGoNoGoApprovedToolsWithProvidedEvidence: 0 | 1
  sourceControlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence:
    0 | 1
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
    0 | 1
  externalBetaToolCallReadyNowTools: 0 | 1
  externalBetaReadyNowTools: 0 | 1
  runtimeReadyForOnDemandExternalBetaToolCallTools: 0 | 1
  productionReadyNowTools: 0
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeShouldStartNow: false
  activatedToolCallReadiness:
    AiGraphicsExternalBetaActivatedToolCallReadiness | null
  evidence: {
    ownerApprovalRef: string | null
    featureFlagRef: string | null
    cohortRef: string | null
    supportAckRef: string | null
    monitoringLiveRef: string | null
    costBudgetFinalRef: string | null
    rollbackArmedRef: string | null
    releaseNotesRef: string | null
    userCommsRef: string | null
    postActivationReviewRef: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredActivationMode:
      'external_beta_tool_call_ready_on_demand_metadata_only'
    sourceControlledTrafficRuntimeSoakResultRequired: true
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      boolean
  }
  policy: {
    approvesExternalBetaToolCallReadinessMetadata: true
    directAgentExecutionStillBlocked: true
    runtimeStartsOnlyForAcceptedWorkerJob: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    noProductionUnlockByGate: true
    noPublicArtifactsByGate: true
    nextGateRequiresAll21ToolActivationRollup: true
  }
  booleans: {
    externalBetaActivationGoNoGoPrepared: true
    sourceControlledTrafficRuntimeSoakResultAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: boolean
    externalBetaActivationControlsAccepted: boolean
    externalBetaActivationApprovedWithProvidedEvidence: boolean
    externalBetaToolCallReadyNow: boolean
    runtimeReadyForOnDemandExternalBetaToolCall: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    controlledWorkerToolCallReadyNow: boolean
    externalBetaCallableNow: boolean
    controlledTrafficRunExecutedByThisGate: false
    apiRouteExecutionPerformedByThisGate: false
    workerDispatchPerformedByThisGate: false
    toolExecutionPerformedByThisGate: false
    externalBetaReadyNow: boolean
    productionReadyNow: false
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
    productionReadyNowGlobal: false
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
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformedByActivationGate: false
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

function sourceResultAccepted(
  packet?: AiGraphicsExternalBetaControlledTrafficRuntimeSoakResult,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_TRAFFIC_RUNTIME_SOAK_RESULT_DECISION &&
    packet.status ===
      'external_beta_controlled_traffic_runtime_soak_result_accepted_runtime_still_blocked' &&
    packet.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAccepted === true &&
    packet.controlledTrafficRuntimeSoakObservedEvidenceAccepted === true &&
    packet.controlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence === 1 &&
    packet.sourceOperatorTrafficSwitchRuntimeSoakAuthorizationAcceptedRequestsWithProvidedEvidence === 1 &&
    packet.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === 1 &&
    packet.controlledTrafficRuntimeSoakObservedToolsWithProvidedEvidence === 1 &&
    packet.externalBetaTrafficSwitchEnabledByThisGateTools === 0 &&
    packet.externalBetaRuntimeSoakStartedByThisGateTools === 0 &&
    packet.externalBetaTrafficEnabledByThisGateTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.observedResult !== null &&
    packet.observedResult.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    packet.observedResult.controlledTrafficRunObservedWithProvidedEvidence === true &&
    packet.observedResult.runtimeSoakObservedWithProvidedEvidence === true &&
    packet.observedResult.gpuLifecycleObservedAsOnDemandWithProvidedEvidence === true &&
    packet.observedResult.controlledTrafficRunExecutedByThisGate === false &&
    packet.observedResult.externalBetaTrafficSwitchEnabledByThisGate === false &&
    packet.observedResult.externalBetaRuntimeSoakStartedByThisGate === false &&
    packet.observedResult.routeExecutionPerformedByThisGate === false &&
    packet.observedResult.workerDispatchPerformedByThisGate === false &&
    packet.observedResult.toolExecutionPerformedByThisGate === false &&
    packet.observedResult.gpuRuntimePerformedByThisGate === false &&
    packet.policy.noControlledTrafficExecutedByGate === true &&
    packet.policy.noExternalBetaTrafficSwitchEnabledByGate === true &&
    packet.policy.noRuntimeSoakStartedByGate === true &&
    packet.policy.noLiveApiRouteExecutionByGate === true &&
    packet.policy.noLiveWorkerDispatchByGate === true &&
    packet.policy.noToolExecutionByGate === true &&
    packet.policy.noGpuRuntimeStartByGate === true &&
    packet.booleans.controlledTrafficRunObservedWithProvidedEvidence === true &&
    packet.booleans.runtimeSoakObservedWithProvidedEvidence === true &&
    packet.booleans.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    packet.evidence
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === true &&
    packet.booleans.controlledTrafficRunExecutedByThisGate === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.productionReadyNow === false
}

function missingControls(input: AiGraphicsExternalBetaActivationGoNoGoInput): string[] {
  return [
    !hasPrivateEvidenceRef(input.externalBetaActivationOwnerApprovalRef)
      ? 'external beta activation owner approval ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaActivationFeatureFlagRef)
      ? 'external beta activation feature flag ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaActivationCohortRef)
      ? 'external beta activation cohort ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaActivationSupportAckRef)
      ? 'external beta activation support ack ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaActivationMonitoringLiveRef)
      ? 'external beta activation monitoring live ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaActivationCostBudgetFinalRef)
      ? 'external beta activation cost budget final ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaActivationRollbackArmedRef)
      ? 'external beta activation rollback armed ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaActivationReleaseNotesRef)
      ? 'external beta activation release notes ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaActivationUserCommsRef)
      ? 'external beta activation user comms ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaActivationPostActivationReviewRef)
      ? 'external beta activation post-activation review ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSourceResult: boolean
  sourceResultAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsExternalBetaActivationGoNoGoStatus {
  if (!input.hasSourceResult) {
    return 'missing_external_beta_controlled_traffic_runtime_soak_result'
  }
  if (!input.sourceResultAccepted) {
    return 'external_beta_controlled_traffic_runtime_soak_result_rejected'
  }
  return input.controlsAccepted
    ? 'external_beta_activation_go_no_go_approved_for_one_tool_runtime_on_demand'
    : 'missing_external_beta_activation_go_no_go_controls'
}

function buildActivatedTool(
  input: AiGraphicsExternalBetaActivationGoNoGoInput,
): AiGraphicsExternalBetaActivatedToolCallReadiness | null {
  const observedResult =
    input.sourceControlledTrafficRuntimeSoakResultPacket?.observedResult
  if (!observedResult) return null
  return {
    toolId: observedResult.toolId,
    capabilityId: observedResult.capabilityId,
    routePath: observedResult.routePath,
    routeId: observedResult.routeId,
    sourceControlledTrafficRuntimeSoakResultAccepted: true,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: true,
    externalBetaActivationApprovedWithProvidedEvidence: true,
    externalBetaToolCallReadyNow: true,
    runtimeReadyForOnDemandExternalBetaToolCall: true,
    gpuRuntimeOnDemandOnly: true,
    gpuRuntimeShouldStartNow: false,
    productionReadyNow: false,
    ownerApprovalRef: input.externalBetaActivationOwnerApprovalRef ?? '',
    featureFlagRef: input.externalBetaActivationFeatureFlagRef ?? '',
    cohortRef: input.externalBetaActivationCohortRef ?? '',
    supportAckRef: input.externalBetaActivationSupportAckRef ?? '',
    monitoringLiveRef: input.externalBetaActivationMonitoringLiveRef ?? '',
    costBudgetFinalRef:
      input.externalBetaActivationCostBudgetFinalRef ?? '',
    rollbackArmedRef: input.externalBetaActivationRollbackArmedRef ?? '',
    releaseNotesRef: input.externalBetaActivationReleaseNotesRef ?? '',
    userCommsRef: input.externalBetaActivationUserCommsRef ?? '',
    postActivationReviewRef:
      input.externalBetaActivationPostActivationReviewRef ?? '',
  }
}

export function evaluateAiGraphicsExternalBetaActivationGoNoGo(
  input: AiGraphicsExternalBetaActivationGoNoGoInput = {},
): AiGraphicsExternalBetaActivationGoNoGo {
  const sourceAccepted = sourceResultAccepted(
    input.sourceControlledTrafficRuntimeSoakResultPacket,
  )
  const sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted =
    sourceAccepted &&
    input.sourceControlledTrafficRuntimeSoakResultPacket
      ?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === 1 &&
    input.sourceControlledTrafficRuntimeSoakResultPacket?.evidence
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === true &&
    input.sourceControlledTrafficRuntimeSoakResultPacket?.booleans
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    input.sourceControlledTrafficRuntimeSoakResultPacket?.observedResult
      ?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true
  const missing = sourceAccepted ? missingControls(input) : []
  const controlsAccepted = missing.length === 0
  const status = statusFromInput({
    hasSourceResult: Boolean(input.sourceControlledTrafficRuntimeSoakResultPacket),
    sourceResultAccepted: sourceAccepted,
    controlsAccepted,
  })
  const accepted = status ===
    'external_beta_activation_go_no_go_approved_for_one_tool_runtime_on_demand'
  const activatedTool = accepted ? buildActivatedTool(input) : null

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_ACTIVATION_GO_NO_GO_DECISION,
    sourceControlledTrafficRuntimeSoakResultDecision:
      input.sourceControlledTrafficRuntimeSoakResultPacket?.decision ?? null,
    status,
    sourceControlledTrafficRuntimeSoakResultAccepted: sourceAccepted,
    externalBetaActivationControlsAccepted: controlsAccepted,
    rejectionReasons: missing,
    requestedToolId:
      input.sourceControlledTrafficRuntimeSoakResultPacket?.requestedToolId ?? null,
    capabilityId:
      input.sourceControlledTrafficRuntimeSoakResultPacket?.capabilityId ?? null,
    externalBetaActivationGoNoGoApprovedToolsWithProvidedEvidence:
      accepted ? 1 : 0,
    sourceControlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence:
      sourceAccepted ? 1 : 0,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted ? 1 : 0,
    externalBetaToolCallReadyNowTools: accepted ? 1 : 0,
    externalBetaReadyNowTools: accepted ? 1 : 0,
    runtimeReadyForOnDemandExternalBetaToolCallTools: accepted ? 1 : 0,
    productionReadyNowTools: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    activatedToolCallReadiness: activatedTool,
    evidence: {
      ownerApprovalRef: input.externalBetaActivationOwnerApprovalRef ?? null,
      featureFlagRef: input.externalBetaActivationFeatureFlagRef ?? null,
      cohortRef: input.externalBetaActivationCohortRef ?? null,
      supportAckRef: input.externalBetaActivationSupportAckRef ?? null,
      monitoringLiveRef: input.externalBetaActivationMonitoringLiveRef ?? null,
      costBudgetFinalRef:
        input.externalBetaActivationCostBudgetFinalRef ?? null,
      rollbackArmedRef:
        input.externalBetaActivationRollbackArmedRef ?? null,
      releaseNotesRef:
        input.externalBetaActivationReleaseNotesRef ?? null,
      userCommsRef: input.externalBetaActivationUserCommsRef ?? null,
      postActivationReviewRef:
        input.externalBetaActivationPostActivationReviewRef ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredActivationMode:
        'external_beta_tool_call_ready_on_demand_metadata_only',
      sourceControlledTrafficRuntimeSoakResultRequired: true,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
    },
    policy: {
      approvesExternalBetaToolCallReadinessMetadata: true,
      directAgentExecutionStillBlocked: true,
      runtimeStartsOnlyForAcceptedWorkerJob: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      noProductionUnlockByGate: true,
      noPublicArtifactsByGate: true,
      nextGateRequiresAll21ToolActivationRollup: true,
    },
    booleans: {
      externalBetaActivationGoNoGoPrepared: true,
      sourceControlledTrafficRuntimeSoakResultAccepted: sourceAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
      externalBetaActivationControlsAccepted: controlsAccepted,
      externalBetaActivationApprovedWithProvidedEvidence: accepted,
      externalBetaToolCallReadyNow: accepted,
      runtimeReadyForOnDemandExternalBetaToolCall: accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      controlledWorkerToolCallReadyNow: accepted,
      externalBetaCallableNow: accepted,
      controlledTrafficRunExecutedByThisGate: false,
      apiRouteExecutionPerformedByThisGate: false,
      workerDispatchPerformedByThisGate: false,
      toolExecutionPerformedByThisGate: false,
      externalBetaReadyNow: accepted,
      productionReadyNow: false,
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
      productionReadyNowGlobal: false,
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
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByActivationGate: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
