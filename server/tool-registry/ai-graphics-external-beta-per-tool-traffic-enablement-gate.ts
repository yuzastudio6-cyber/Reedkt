import {
  AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION,
  type AiGraphicsExternalBetaLaunchGoNoGo,
} from './ai-graphics-external-beta-launch-go-no-go'
import {
  AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_CALLABLE_RESULT_GATE_DECISION,
  type AiGraphicsExternalBetaPerToolCallableResultGate,
} from './ai-graphics-external-beta-per-tool-callable-result-gate'

export const AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_TRAFFIC_ENABLEMENT_GATE_DECISION =
  'ai_graphics_external_beta_per_tool_traffic_enablement_gate_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaPerToolTrafficEnablementGateStatus =
  | 'missing_external_beta_per_tool_callable_result_gate'
  | 'external_beta_per_tool_callable_result_gate_rejected'
  | 'missing_external_beta_launch_go_no_go'
  | 'external_beta_launch_go_no_go_rejected'
  | 'missing_external_beta_per_tool_traffic_enablement_controls'
  | 'external_beta_per_tool_traffic_enablement_gate_ready_runtime_still_blocked'

export interface AiGraphicsExternalBetaPerToolTrafficEnablementGateInput {
  sourcePerToolCallableResultGatePacket?:
    AiGraphicsExternalBetaPerToolCallableResultGate
  sourceExternalBetaLaunchGoNoGoPacket?: AiGraphicsExternalBetaLaunchGoNoGo
  externalBetaTrafficEnablementOwnerApprovalRef?: string
  externalBetaTrafficEnablementFeatureFlagRef?: string
  externalBetaTrafficEnablementRolloutCohortRef?: string
  externalBetaTrafficEnablementKillSwitchRef?: string
  externalBetaTrafficEnablementRateLimitRef?: string
  externalBetaTrafficEnablementCostCeilingRef?: string
  externalBetaTrafficEnablementSupportRunbookRef?: string
  externalBetaTrafficEnablementTelemetryRef?: string
  externalBetaTrafficEnablementRollbackRef?: string
}

export interface AiGraphicsExternalBetaPerToolTrafficEnablementCandidate {
  toolId: string
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  routeId: string
  rolloutCohortRef: string
  featureFlagRef: string
  killSwitchRef: string
  rateLimitRef: string
  costCeilingRef: string
  supportRunbookRef: string
  telemetryRef: string
  rollbackRef: string
  ownerApprovalRef: string
  sourceCallableResultGateAccepted: true
  sourceExternalBetaLaunchGoNoGoAccepted: true
  externalBetaTrafficEnablementPreparedWithProvidedEvidence: true
  externalBetaTrafficEnabledNow: false
  routeExecutionApprovedNow: false
  workerDispatchApprovedNow: false
  toolExecutionApprovedNow: false
  gpuRuntimeShouldStartNow: false
}

export interface AiGraphicsExternalBetaPerToolTrafficEnablementGate {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_TRAFFIC_ENABLEMENT_GATE_DECISION
  sourcePerToolCallableResultGateDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_CALLABLE_RESULT_GATE_DECISION | null
  sourceExternalBetaLaunchGoNoGoDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION | null
  status: AiGraphicsExternalBetaPerToolTrafficEnablementGateStatus
  sourcePerToolCallableResultGateAccepted: boolean
  sourceExternalBetaLaunchGoNoGoAccepted: boolean
  trafficEnablementControlsAccepted: boolean
  rejectionReasons: string[]
  requestedToolId: string | null
  capabilityId: string | null
  perToolTrafficEnablementPreparedRequestsWithProvidedEvidence: 0 | 1
  sourceCallableResultGateAcceptedRequestsWithProvidedEvidence: 0 | 1
  sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence: 0 | 21
  externalBetaTrafficCandidateToolsWithProvidedEvidence: 0 | 1
  externalBetaTrafficEnabledNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeShouldStartNow: false
  trafficEnablementCandidate:
    AiGraphicsExternalBetaPerToolTrafficEnablementCandidate | null
  evidence: {
    ownerApprovalRef: string | null
    featureFlagRef: string | null
    rolloutCohortRef: string | null
    killSwitchRef: string | null
    rateLimitRef: string | null
    costCeilingRef: string | null
    supportRunbookRef: string | null
    telemetryRef: string | null
    rollbackRef: string | null
    requiredExecutionEnvironment: 'private_non_production_external_beta'
    requiredTrafficMode: 'prepared_per_tool_traffic_enablement_metadata_only'
    sourceCallableResultGateRequired: true
    sourceLaunchGoNoGoRequired: true
  }
  policy: {
    validatesPreparedTrafficEnablementOnly: true
    noExternalBetaTrafficEnabledByGate: true
    noLiveApiRouteExecutionByGate: true
    noLiveWorkerDispatchByGate: true
    noToolExecutionByGate: true
    noProviderRuntimeByGate: true
    noGpuRuntimeStartByGate: true
    featureFlagAndKillSwitchRequiredBeforeFutureTraffic: true
    nextGateRequiresOperatorTrafficSwitchAndRuntimeSoak: true
  }
  booleans: {
    externalBetaPerToolTrafficEnablementGatePrepared: true
    sourcePerToolCallableResultGateAccepted: boolean
    sourceExternalBetaLaunchGoNoGoAccepted: boolean
    trafficEnablementControlsAccepted: boolean
    perToolTrafficEnablementPreparedWithProvidedEvidence: boolean
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
    workerLeaseCreatedByTrafficGate: false
    workerDispatchPerformedByTrafficGate: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformedByTrafficGate: false
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
    normalized.startsWith('external-beta-evidence://') ||
    normalized.startsWith('external-beta-traffic://')
}

function callableResultGateAccepted(
  packet?: AiGraphicsExternalBetaPerToolCallableResultGate,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_CALLABLE_RESULT_GATE_DECISION &&
    packet.status ===
      'external_beta_per_tool_callable_result_gate_accepted_runtime_still_blocked' &&
    packet.callableResultGateAcceptedWithProvidedEvidence === true &&
    packet.perToolCallableResultGateAcceptedRequestsWithProvidedEvidence === 1 &&
    packet.workerRuntimeSmokeProofAcceptedWithProvidedEvidence === 1 &&
    packet.workerLeaseLifecycleAcceptedWithProvidedEvidence === 1 &&
    packet.workerDispatchAcceptedWithProvidedEvidence === 1 &&
    packet.toolExecutionAcceptedWithProvidedEvidence === 0 &&
    packet.routeExecutionAcceptedWithProvidedEvidence === 0 &&
    packet.privateArtifactWriteAcceptedWithProvidedEvidence === 0 &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.externalBetaCallableNowTools === 0 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.sourceWorkerRuntimeSmokeProofAccepted === true &&
    packet.booleans.savedPerToolCallableResultAcceptedWithProvidedEvidence === true &&
    packet.booleans.gpuRuntimeStartedForCallableResult === false &&
    packet.booleans.toolExecutionAcceptedWithProvidedEvidence === false &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function launchGoNoGoAccepted(
  packet?: AiGraphicsExternalBetaLaunchGoNoGo,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION &&
    packet.status === 'external_beta_launch_go_no_go_approved_runtime_still_blocked' &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.externalBetaLaunchGoNoGoApprovalRecordAccepted === true &&
    packet.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence === 21 &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.requiredLaunchApprovalRecord.approvesRuntimeNow === false &&
    packet.booleans.sourceExternalBetaLaunchControlsAccepted === true &&
    packet.booleans.externalBetaLaunchGoNoGoApprovalRecordAccepted === true &&
    packet.booleans.all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerExecutionApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeApprovedNow === false &&
    packet.booleans.externalBetaReadyNow === false &&
    packet.booleans.productionReadyNow === false
}

function missingControls(
  input: AiGraphicsExternalBetaPerToolTrafficEnablementGateInput,
): string[] {
  return [
    !hasPrivateEvidenceRef(input.externalBetaTrafficEnablementOwnerApprovalRef)
      ? 'external beta per-tool traffic owner approval ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaTrafficEnablementFeatureFlagRef)
      ? 'external beta per-tool traffic feature flag ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaTrafficEnablementRolloutCohortRef)
      ? 'external beta per-tool traffic rollout cohort ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaTrafficEnablementKillSwitchRef)
      ? 'external beta per-tool traffic kill switch ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaTrafficEnablementRateLimitRef)
      ? 'external beta per-tool traffic rate limit ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaTrafficEnablementCostCeilingRef)
      ? 'external beta per-tool traffic cost ceiling ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaTrafficEnablementSupportRunbookRef)
      ? 'external beta per-tool traffic support runbook ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaTrafficEnablementTelemetryRef)
      ? 'external beta per-tool traffic telemetry ref is missing or not private'
      : undefined,
    !hasPrivateEvidenceRef(input.externalBetaTrafficEnablementRollbackRef)
      ? 'external beta per-tool traffic rollback ref is missing or not private'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))
}

function statusFromInput(input: {
  hasCallableGate: boolean
  callableGateAccepted: boolean
  hasLaunchGoNoGo: boolean
  launchGoNoGoAccepted: boolean
  controlsAccepted: boolean
}): AiGraphicsExternalBetaPerToolTrafficEnablementGateStatus {
  if (!input.hasCallableGate) return 'missing_external_beta_per_tool_callable_result_gate'
  if (!input.callableGateAccepted) return 'external_beta_per_tool_callable_result_gate_rejected'
  if (!input.hasLaunchGoNoGo) return 'missing_external_beta_launch_go_no_go'
  if (!input.launchGoNoGoAccepted) return 'external_beta_launch_go_no_go_rejected'
  return input.controlsAccepted
    ? 'external_beta_per_tool_traffic_enablement_gate_ready_runtime_still_blocked'
    : 'missing_external_beta_per_tool_traffic_enablement_controls'
}

function buildCandidate(
  input: AiGraphicsExternalBetaPerToolTrafficEnablementGateInput,
): AiGraphicsExternalBetaPerToolTrafficEnablementCandidate | null {
  const callableGate = input.sourcePerToolCallableResultGatePacket
  const savedResult = callableGate?.savedPerToolCallableResult
  if (!callableGate || !savedResult) return null
  return {
    toolId: savedResult.toolId,
    capabilityId: savedResult.capabilityId,
    routePath: savedResult.routePath,
    routeId: savedResult.routeId,
    rolloutCohortRef:
      input.externalBetaTrafficEnablementRolloutCohortRef ?? '',
    featureFlagRef:
      input.externalBetaTrafficEnablementFeatureFlagRef ?? '',
    killSwitchRef:
      input.externalBetaTrafficEnablementKillSwitchRef ?? '',
    rateLimitRef:
      input.externalBetaTrafficEnablementRateLimitRef ?? '',
    costCeilingRef:
      input.externalBetaTrafficEnablementCostCeilingRef ?? '',
    supportRunbookRef:
      input.externalBetaTrafficEnablementSupportRunbookRef ?? '',
    telemetryRef:
      input.externalBetaTrafficEnablementTelemetryRef ?? '',
    rollbackRef:
      input.externalBetaTrafficEnablementRollbackRef ?? '',
    ownerApprovalRef:
      input.externalBetaTrafficEnablementOwnerApprovalRef ?? '',
    sourceCallableResultGateAccepted: true,
    sourceExternalBetaLaunchGoNoGoAccepted: true,
    externalBetaTrafficEnablementPreparedWithProvidedEvidence: true,
    externalBetaTrafficEnabledNow: false,
    routeExecutionApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeShouldStartNow: false,
  }
}

export function evaluateAiGraphicsExternalBetaPerToolTrafficEnablementGate(
  input: AiGraphicsExternalBetaPerToolTrafficEnablementGateInput = {},
): AiGraphicsExternalBetaPerToolTrafficEnablementGate {
  const callableAccepted = callableResultGateAccepted(
    input.sourcePerToolCallableResultGatePacket,
  )
  const launchAccepted = launchGoNoGoAccepted(input.sourceExternalBetaLaunchGoNoGoPacket)
  const missing = callableAccepted && launchAccepted ? missingControls(input) : []
  const controlsAccepted = missing.length === 0
  const status = statusFromInput({
    hasCallableGate: Boolean(input.sourcePerToolCallableResultGatePacket),
    callableGateAccepted: callableAccepted,
    hasLaunchGoNoGo: Boolean(input.sourceExternalBetaLaunchGoNoGoPacket),
    launchGoNoGoAccepted: launchAccepted,
    controlsAccepted,
  })
  const accepted = status ===
    'external_beta_per_tool_traffic_enablement_gate_ready_runtime_still_blocked'
  const candidate = accepted ? buildCandidate(input) : null

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_PER_TOOL_TRAFFIC_ENABLEMENT_GATE_DECISION,
    sourcePerToolCallableResultGateDecision:
      input.sourcePerToolCallableResultGatePacket?.decision ?? null,
    sourceExternalBetaLaunchGoNoGoDecision:
      input.sourceExternalBetaLaunchGoNoGoPacket?.decision ?? null,
    status,
    sourcePerToolCallableResultGateAccepted: callableAccepted,
    sourceExternalBetaLaunchGoNoGoAccepted: launchAccepted,
    trafficEnablementControlsAccepted: controlsAccepted,
    rejectionReasons: missing,
    requestedToolId:
      input.sourcePerToolCallableResultGatePacket?.requestedToolId ?? null,
    capabilityId: input.sourcePerToolCallableResultGatePacket?.capabilityId ?? null,
    perToolTrafficEnablementPreparedRequestsWithProvidedEvidence:
      accepted ? 1 : 0,
    sourceCallableResultGateAcceptedRequestsWithProvidedEvidence:
      callableAccepted ? 1 : 0,
    sourceLaunchGoNoGoApprovedToolsWithProvidedEvidence:
      launchAccepted ? 21 : 0,
    externalBetaTrafficCandidateToolsWithProvidedEvidence: accepted ? 1 : 0,
    externalBetaTrafficEnabledNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    trafficEnablementCandidate: candidate,
    evidence: {
      ownerApprovalRef:
        input.externalBetaTrafficEnablementOwnerApprovalRef ?? null,
      featureFlagRef:
        input.externalBetaTrafficEnablementFeatureFlagRef ?? null,
      rolloutCohortRef:
        input.externalBetaTrafficEnablementRolloutCohortRef ?? null,
      killSwitchRef:
        input.externalBetaTrafficEnablementKillSwitchRef ?? null,
      rateLimitRef:
        input.externalBetaTrafficEnablementRateLimitRef ?? null,
      costCeilingRef:
        input.externalBetaTrafficEnablementCostCeilingRef ?? null,
      supportRunbookRef:
        input.externalBetaTrafficEnablementSupportRunbookRef ?? null,
      telemetryRef:
        input.externalBetaTrafficEnablementTelemetryRef ?? null,
      rollbackRef:
        input.externalBetaTrafficEnablementRollbackRef ?? null,
      requiredExecutionEnvironment: 'private_non_production_external_beta',
      requiredTrafficMode: 'prepared_per_tool_traffic_enablement_metadata_only',
      sourceCallableResultGateRequired: true,
      sourceLaunchGoNoGoRequired: true,
    },
    policy: {
      validatesPreparedTrafficEnablementOnly: true,
      noExternalBetaTrafficEnabledByGate: true,
      noLiveApiRouteExecutionByGate: true,
      noLiveWorkerDispatchByGate: true,
      noToolExecutionByGate: true,
      noProviderRuntimeByGate: true,
      noGpuRuntimeStartByGate: true,
      featureFlagAndKillSwitchRequiredBeforeFutureTraffic: true,
      nextGateRequiresOperatorTrafficSwitchAndRuntimeSoak: true,
    },
    booleans: {
      externalBetaPerToolTrafficEnablementGatePrepared: true,
      sourcePerToolCallableResultGateAccepted: callableAccepted,
      sourceExternalBetaLaunchGoNoGoAccepted: launchAccepted,
      trafficEnablementControlsAccepted: controlsAccepted,
      perToolTrafficEnablementPreparedWithProvidedEvidence: accepted,
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
      workerLeaseCreatedByTrafficGate: false,
      workerDispatchPerformedByTrafficGate: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformedByTrafficGate: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
