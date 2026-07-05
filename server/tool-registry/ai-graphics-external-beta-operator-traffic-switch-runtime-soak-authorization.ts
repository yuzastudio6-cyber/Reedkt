import {
  AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_TRAFFIC_ENABLEMENT_GATE_DECISION,
  type AiGraphicsExternalBetaPerToolTrafficEnablementGate,
} from './ai-graphics-external-beta-per-tool-traffic-enablement-gate'

export const AI_GRAPHICS_EXTERNAL_BETA_OPERATOR_TRAFFIC_SWITCH_RUNTIME_SOAK_AUTHORIZATION_DECISION =
  'ai_graphics_external_beta_operator_traffic_switch_runtime_soak_authorization_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationStatus =
  | 'missing_external_beta_per_tool_traffic_enablement_gate'
  | 'external_beta_per_tool_traffic_enablement_gate_rejected'
  | 'missing_external_beta_operator_traffic_switch_runtime_soak_controls'
  | 'external_beta_operator_traffic_switch_runtime_soak_authorization_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationInput {
  sourcePerToolTrafficEnablementGatePacket?:
    AiGraphicsExternalBetaPerToolTrafficEnablementGate
  externalBetaOperatorTrafficSwitchApprovalRef?: string
  externalBetaRuntimeSoakPlanRef?: string
  externalBetaRuntimeSoakWindowRef?: string
  externalBetaCanaryCohortRef?: string
  externalBetaMonitoringDashboardRef?: string
  externalBetaAlertPolicyRef?: string
  externalBetaRollbackPlaybookRef?: string
  externalBetaSupportPagerRef?: string
  externalBetaCostBudgetRef?: string
  externalBetaKillSwitchDrillRef?: string
  externalBetaPostSoakReviewRef?: string
}

export interface AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakCandidate {
  toolId: string
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  routeId: string
  sourceTrafficEnablementGateAccepted: true
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: true
  operatorTrafficSwitchApprovalRef: string
  runtimeSoakPlanRef: string
  runtimeSoakWindowRef: string
  canaryCohortRef: string
  monitoringDashboardRef: string
  alertPolicyRef: string
  rollbackPlaybookRef: string
  supportPagerRef: string
  costBudgetRef: string
  killSwitchDrillRef: string
  postSoakReviewRef: string
  operatorTrafficSwitchRuntimeSoakAuthorizationPreparedWithProvidedEvidence: true
  externalBetaTrafficSwitchEnabledNow: false
  externalBetaRuntimeSoakStartedNow: false
  routeExecutionApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  gpuRuntimeShouldStartNow: false
}

export interface AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_OPERATOR_TRAFFIC_SWITCH_RUNTIME_SOAK_AUTHORIZATION_DECISION
  sourcePerToolTrafficEnablementGateDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_TRAFFIC_ENABLEMENT_GATE_DECISION | null
  status: AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationStatus
  sourcePerToolTrafficEnablementGateAccepted: boolean
  operatorTrafficSwitchRuntimeSoakControlsAccepted: boolean
  rejectionReasons: string[]
  requestedToolId: string | null
  capabilityId: string | null
  operatorTrafficSwitchRuntimeSoakAuthorizationPreparedRequestsWithProvidedEvidence:
    0 | 1
  sourcePerToolTrafficEnablementGateAcceptedRequestsWithProvidedEvidence: 0 | 1
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
    0 | 1
  operatorTrafficSwitchRuntimeSoakCandidateToolsWithProvidedEvidence: 0 | 1
  externalBetaTrafficSwitchEnabledNowTools: 0
  externalBetaRuntimeSoakStartedNowTools: 0
  externalBetaTrafficEnabledNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeShouldStartNow: false
  trafficSwitchRuntimeSoakCandidate:
    AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakCandidate | null
  evidence: {
    operatorTrafficSwitchApprovalRef: string | null
    runtimeSoakPlanRef: string | null
    runtimeSoakWindowRef: string | null
    canaryCohortRef: string | null
    monitoringDashboardRef: string | null
    alertPolicyRef: string | null
    rollbackPlaybookRef: string | null
    supportPagerRef: string | null
    costBudgetRef: string | null
    killSwitchDrillRef: string | null
    postSoakReviewRef: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredTrafficMode:
      'prepared_operator_traffic_switch_runtime_soak_authorization_metadata_only'
    sourcePerToolTrafficEnablementGateRequired: true
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      boolean
  }
  policy: {
    validatesOperatorSwitchAndSoakAuthorizationOnly: true
    noExternalBetaTrafficSwitchEnabledByGate: true
    noRuntimeSoakStartedByGate: true
    noLiveApiRouteExecutionByGate: true
    noLiveWorkerDispatchByGate: true
    noToolExecutionByGate: true
    noProviderRuntimeByGate: true
    noGpuRuntimeStartByGate: true
    monitoringAlertsRollbackAndSupportRequiredBeforeFutureTraffic: true
    nextGateRequiresControlledTrafficExecutionAndObservedSoakResults: true
  }
  booleans: {
    externalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationPrepared: true
    sourcePerToolTrafficEnablementGateAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: boolean
    operatorTrafficSwitchRuntimeSoakControlsAccepted: boolean
    operatorTrafficSwitchRuntimeSoakAuthorizationPreparedWithProvidedEvidence:
      boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    externalBetaCallableNow: false
    externalBetaTrafficEnabledNow: false
    externalBetaTrafficSwitchEnabledNow: false
    externalBetaRuntimeSoakStartedNow: false
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
    workerLeaseCreatedByAuthorizationGate: false
    workerDispatchPerformedByAuthorizationGate: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformedByAuthorizationGate: false
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

function sourceTrafficGateAccepted(
  packet?: AiGraphicsExternalBetaPerToolTrafficEnablementGate,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_TRAFFIC_ENABLEMENT_GATE_DECISION &&
    packet.status ===
      'external_beta_per_tool_traffic_enablement_gate_ready_runtime_still_blocked' &&
    packet.sourcePerToolCallableResultGateAccepted === true &&
    packet.sourceExternalBetaLaunchGoNoGoAccepted === true &&
    packet.trafficEnablementControlsAccepted === true &&
    packet.perToolTrafficEnablementPreparedRequestsWithProvidedEvidence === 1 &&
    packet.sourceCallableResultGateAcceptedRequestsWithProvidedEvidence === 1 &&
    packet.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    packet.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === 1 &&
    packet.sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence === 21 &&
    packet.externalBetaTrafficCandidateToolsWithProvidedEvidence === 1 &&
    packet.externalBetaTrafficEnabledNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.trafficEnablementCandidate !== null &&
    packet.trafficEnablementCandidate.externalBetaTrafficEnabledNow === false &&
    packet.trafficEnablementCandidate
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    packet.trafficEnablementCandidate.routeExecutionApprovedNow === false &&
    packet.trafficEnablementCandidate.workerDispatchApprovedNow === false &&
    packet.trafficEnablementCandidate.toolExecutionApprovedNow === false &&
    packet.trafficEnablementCandidate.gpuRuntimeShouldStartNow === false &&
    packet.policy.noExternalBetaTrafficEnabledByGate === true &&
    packet.policy.noLiveApiRouteExecutionByGate === true &&
    packet.policy.noLiveWorkerDispatchByGate === true &&
    packet.policy.noToolExecutionByGate === true &&
    packet.policy.noGpuRuntimeStartByGate === true &&
    packet.booleans.perToolTrafficEnablementPreparedWithProvidedEvidence === true &&
    packet.booleans.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    packet.evidence
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === true &&
    packet.booleans.externalBetaTrafficEnabledNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerDispatchApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function missingControls(
  input:
    AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationInput,
): string[] {
  return [
    !hasPrivateEvidenceRef(input.externalBetaOperatorTrafficSwitchApprovalRef)
      ? 'external beta operator traffic switch approval ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaRuntimeSoakPlanRef)
      ? 'external beta runtime soak plan ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaRuntimeSoakWindowRef)
      ? 'external beta runtime soak window ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaCanaryCohortRef)
      ? 'external beta canary cohort ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaMonitoringDashboardRef)
      ? 'external beta monitoring dashboard ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaAlertPolicyRef)
      ? 'external beta alert policy ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaRollbackPlaybookRef)
      ? 'external beta rollback playbook ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaSupportPagerRef)
      ? 'external beta support pager ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaCostBudgetRef)
      ? 'external beta cost budget ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaKillSwitchDrillRef)
      ? 'external beta kill switch drill ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaPostSoakReviewRef)
      ? 'external beta post-soak review ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasSourceGate: boolean
  sourceGateAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationStatus {
  if (!input.hasSourceGate) {
    return 'missing_external_beta_per_tool_traffic_enablement_gate'
  }
  if (!input.sourceGateAccepted) {
    return 'external_beta_per_tool_traffic_enablement_gate_rejected'
  }
  return input.controlsAccepted
    ? 'external_beta_operator_traffic_switch_runtime_soak_authorization_ready_runtime_still_blocked'
    : 'missing_external_beta_operator_traffic_switch_runtime_soak_controls'
}

function buildCandidate(
  input:
    AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationInput,
): AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakCandidate | null {
  const sourceCandidate =
    input.sourcePerToolTrafficEnablementGatePacket?.trafficEnablementCandidate
  if (!sourceCandidate) return null
  return {
    toolId: sourceCandidate.toolId,
    capabilityId: sourceCandidate.capabilityId,
    routePath: sourceCandidate.routePath,
    routeId: sourceCandidate.routeId,
    sourceTrafficEnablementGateAccepted: true,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: true,
    operatorTrafficSwitchApprovalRef:
      input.externalBetaOperatorTrafficSwitchApprovalRef ?? '',
    runtimeSoakPlanRef: input.externalBetaRuntimeSoakPlanRef ?? '',
    runtimeSoakWindowRef: input.externalBetaRuntimeSoakWindowRef ?? '',
    canaryCohortRef: input.externalBetaCanaryCohortRef ?? '',
    monitoringDashboardRef: input.externalBetaMonitoringDashboardRef ?? '',
    alertPolicyRef: input.externalBetaAlertPolicyRef ?? '',
    rollbackPlaybookRef: input.externalBetaRollbackPlaybookRef ?? '',
    supportPagerRef: input.externalBetaSupportPagerRef ?? '',
    costBudgetRef: input.externalBetaCostBudgetRef ?? '',
    killSwitchDrillRef: input.externalBetaKillSwitchDrillRef ?? '',
    postSoakReviewRef: input.externalBetaPostSoakReviewRef ?? '',
    operatorTrafficSwitchRuntimeSoakAuthorizationPreparedWithProvidedEvidence:
      true,
    externalBetaTrafficSwitchEnabledNow: false,
    externalBetaRuntimeSoakStartedNow: false,
    routeExecutionApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
  }
}

export function evaluateAiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization(
  input:
    AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationInput = {},
): AiGraphicsExternalBetaOperatorTrafficSwitchRuntimeSoakAuthorization {
  const sourceAccepted = sourceTrafficGateAccepted(
    input.sourcePerToolTrafficEnablementGatePacket,
  )
  const sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted =
    sourceAccepted &&
    input.sourcePerToolTrafficEnablementGatePacket
      ?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    input.sourcePerToolTrafficEnablementGatePacket
      ?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === 1 &&
    input.sourcePerToolTrafficEnablementGatePacket?.evidence
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === true &&
    input.sourcePerToolTrafficEnablementGatePacket?.booleans
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    input.sourcePerToolTrafficEnablementGatePacket?.trafficEnablementCandidate
      ?.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true
  const missing = sourceAccepted ? missingControls(input) : []
  const controlsAccepted = missing.length === 0
  const status = statusFromInput({
    hasSourceGate: Boolean(input.sourcePerToolTrafficEnablementGatePacket),
    sourceGateAccepted: sourceAccepted,
    controlsAccepted,
  })
  const accepted = status ===
    'external_beta_operator_traffic_switch_runtime_soak_authorization_ready_runtime_still_blocked'
  const candidate = accepted ? buildCandidate(input) : null

  return {
    decision:
      AI_GRAPHICS_EXTERNAL_BETA_OPERATOR_TRAFFIC_SWITCH_RUNTIME_SOAK_AUTHORIZATION_DECISION,
    sourcePerToolTrafficEnablementGateDecision:
      input.sourcePerToolTrafficEnablementGatePacket?.decision ?? null,
    status,
    sourcePerToolTrafficEnablementGateAccepted: sourceAccepted,
    operatorTrafficSwitchRuntimeSoakControlsAccepted: controlsAccepted,
    rejectionReasons: missing,
    requestedToolId:
      input.sourcePerToolTrafficEnablementGatePacket?.requestedToolId ?? null,
    capabilityId:
      input.sourcePerToolTrafficEnablementGatePacket?.capabilityId ?? null,
    operatorTrafficSwitchRuntimeSoakAuthorizationPreparedRequestsWithProvidedEvidence:
      accepted ? 1 : 0,
    sourcePerToolTrafficEnablementGateAcceptedRequestsWithProvidedEvidence:
      sourceAccepted ? 1 : 0,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted ? 1 : 0,
    operatorTrafficSwitchRuntimeSoakCandidateToolsWithProvidedEvidence:
      accepted ? 1 : 0,
    externalBetaTrafficSwitchEnabledNowTools: 0,
    externalBetaRuntimeSoakStartedNowTools: 0,
    externalBetaTrafficEnabledNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    trafficSwitchRuntimeSoakCandidate: candidate,
    evidence: {
      operatorTrafficSwitchApprovalRef:
        input.externalBetaOperatorTrafficSwitchApprovalRef ?? null,
      runtimeSoakPlanRef: input.externalBetaRuntimeSoakPlanRef ?? null,
      runtimeSoakWindowRef: input.externalBetaRuntimeSoakWindowRef ?? null,
      canaryCohortRef: input.externalBetaCanaryCohortRef ?? null,
      monitoringDashboardRef: input.externalBetaMonitoringDashboardRef ?? null,
      alertPolicyRef: input.externalBetaAlertPolicyRef ?? null,
      rollbackPlaybookRef: input.externalBetaRollbackPlaybookRef ?? null,
      supportPagerRef: input.externalBetaSupportPagerRef ?? null,
      costBudgetRef: input.externalBetaCostBudgetRef ?? null,
      killSwitchDrillRef: input.externalBetaKillSwitchDrillRef ?? null,
      postSoakReviewRef: input.externalBetaPostSoakReviewRef ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredTrafficMode:
        'prepared_operator_traffic_switch_runtime_soak_authorization_metadata_only',
      sourcePerToolTrafficEnablementGateRequired: true,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
    },
    policy: {
      validatesOperatorSwitchAndSoakAuthorizationOnly: true,
      noExternalBetaTrafficSwitchEnabledByGate: true,
      noRuntimeSoakStartedByGate: true,
      noLiveApiRouteExecutionByGate: true,
      noLiveWorkerDispatchByGate: true,
      noToolExecutionByGate: true,
      noProviderRuntimeByGate: true,
      noGpuRuntimeStartByGate: true,
      monitoringAlertsRollbackAndSupportRequiredBeforeFutureTraffic: true,
      nextGateRequiresControlledTrafficExecutionAndObservedSoakResults: true,
    },
    booleans: {
      externalBetaOperatorTrafficSwitchRuntimeSoakAuthorizationPrepared: true,
      sourcePerToolTrafficEnablementGateAccepted: sourceAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted:
        sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted,
      operatorTrafficSwitchRuntimeSoakControlsAccepted: controlsAccepted,
      operatorTrafficSwitchRuntimeSoakAuthorizationPreparedWithProvidedEvidence:
        accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      externalBetaCallableNow: false,
      externalBetaTrafficEnabledNow: false,
      externalBetaTrafficSwitchEnabledNow: false,
      externalBetaRuntimeSoakStartedNow: false,
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
      workerLeaseCreatedByAuthorizationGate: false,
      workerDispatchPerformedByAuthorizationGate: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByAuthorizationGate: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
