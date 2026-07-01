export const AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION =
  'ai_graphics_external_beta_controlled_on_demand_status_bridge_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaControlledOnDemandStatusBridgeStatus =
  | 'missing_external_beta_end_to_end_readiness'
  | 'external_beta_end_to_end_readiness_rejected'
  | 'missing_beta_production_readiness_rollup'
  | 'beta_production_readiness_rollup_rejected'
  | 'missing_external_beta_activated_launch_readiness'
  | 'external_beta_activated_launch_readiness_rejected'
  | 'external_beta_controlled_on_demand_status_bridge_ready_with_warnings'

export interface AiGraphicsStatusSourcePacket {
  decision?: string
  status?: string
  counts?: Record<string, unknown>
  scope?: Record<string, unknown>
  booleans?: Record<string, unknown>
  externalBetaActivatedLaunchReadiness?: Record<string, unknown>
}

export interface AiGraphicsExternalBetaControlledOnDemandStatusBridgeInput {
  sourceExternalBetaEndToEndReadinessPacket?: AiGraphicsStatusSourcePacket
  sourceBetaProductionReadinessRollupPacket?: AiGraphicsStatusSourcePacket
  sourceExternalBetaActivatedLaunchReadinessPacket?: AiGraphicsStatusSourcePacket
}

export interface AiGraphicsExternalBetaControlledOnDemandStatusBridge {
  decision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION
  status: AiGraphicsExternalBetaControlledOnDemandStatusBridgeStatus
  rejectionReasons: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  externalBetaControlledOnDemandReadyTools: 0 | 21
  externalBetaCallableNowTools: 0 | 21
  externalBetaReadyNowTools: 0 | 21
  runtimeReadyForOnDemandExternalBetaToolCallTools: 0 | 21
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence: 0 | 21
  productionReadyNowTools: 0
  readinessInterpretation:
    'external_beta_ready_means_controlled_on_demand_worker_path_not_direct_agent_execution'
  remainingProductionGap:
    'production_requires_separate_operator_traffic_cutover_and_live_runtime_evidence'
  gpuPolicy: {
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeShouldStartNow: false
  }
  acceptedSources: {
    externalBetaEndToEndReadiness: boolean
    betaProductionReadinessRollup: boolean
    externalBetaActivatedLaunchReadiness: boolean
  }
  booleans: {
    externalBetaControlledOnDemandStatusBridgePrepared: true
    sourceExternalBetaEndToEndReadinessAccepted: boolean
    sourceBetaProductionReadinessRollupAccepted: boolean
    sourceExternalBetaActivatedLaunchReadinessAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    all21ToolsReadyForControlledOnDemandExternalBetaToolCalls: boolean
    controlledExternalBetaToolCallReadinessClarified: boolean
    externalBetaReadyNow: boolean
    externalBetaCallableNow: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    workerEnqueuePerformed: false
    routeExecutionPerformed: false
    backendQueueSubmissionPerformed: false
    privateArtifactWritePerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

function countFrom(
  packet: AiGraphicsStatusSourcePacket | undefined,
  key: string,
): number | undefined {
  const count = packet?.counts?.[key]
  const scoped = packet?.scope?.[key]
  const nested = packet?.externalBetaActivatedLaunchReadiness?.[key]
  const value = typeof count === 'number' ? count :
    typeof scoped === 'number' ? scoped :
    typeof nested === 'number' ? nested :
    undefined
  return value
}

function booleanFrom(
  packet: AiGraphicsStatusSourcePacket | undefined,
  key: string,
): boolean | undefined {
  const value = packet?.booleans?.[key]
  return typeof value === 'boolean' ? value : undefined
}

function externalBetaEndToEndAccepted(
  packet?: AiGraphicsStatusSourcePacket,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'ai_graphics_external_beta_end_to_end_readiness_prepared_with_remaining_blocks' &&
    packet.status ===
      'external_beta_ready_for_controlled_on_demand_tool_calls_runtime_still_blocked' &&
    countFrom(packet, 'totalAiGraphicsTools') === 21 &&
    countFrom(packet, 'totalProductFacingCapabilities') === 12 &&
    countFrom(packet, 'gpuRuntimeTargetedTools') === 8 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 21 &&
    countFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'externalBetaActivatedLaunchReadinessAcceptedWithProvidedEvidence') === true &&
    booleanFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence') === true &&
    booleanFrom(packet, 'externalBetaReadyNow') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'routeExecutionApprovedNow') === false &&
    booleanFrom(packet, 'workerExecutionApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false &&
    booleanFrom(packet, 'productionReadyNow') === false
}

function betaProductionRollupAccepted(
  packet?: AiGraphicsStatusSourcePacket,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks' &&
    packet.status === 'owner_approved_worker_gates_ready_runtime_still_blocked' &&
    countFrom(packet, 'totalAiGraphicsTools') === 21 &&
    countFrom(packet, 'totalProductFacingCapabilities') === 12 &&
    countFrom(packet, 'gpuRuntimeTargetedTools') === 8 &&
    countFrom(packet, 'properlyInstalledForPlannedSurface') === 21 &&
    countFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 21 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'externalBetaActivatedLaunchReadyWithProvidedEvidence') === true &&
    booleanFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence') === true &&
    booleanFrom(packet, 'externalBetaReadyNow') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'routeExecutionApprovedNow') === false &&
    booleanFrom(packet, 'workerExecutionApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeApprovedNow') === false &&
    booleanFrom(packet, 'productionReadyNow') === false
}

function activatedLaunchAccepted(
  packet?: AiGraphicsStatusSourcePacket,
): boolean {
  return Boolean(packet) &&
    packet?.decision ===
      'ai_graphics_external_beta_activated_launch_readiness_approved_with_runtime_blocks' &&
    packet.status ===
      'external_beta_activated_launch_ready_for_controlled_on_demand_tool_calls' &&
    countFrom(packet, 'totalAiGraphicsTools') === 21 &&
    (countFrom(packet, 'totalProductFacingCapabilities') === 12 ||
      countFrom(packet, 'productFacingCapabilities') === 12) &&
    countFrom(packet, 'gpuRuntimeTargetedTools') === 8 &&
    countFrom(packet, 'externalBetaReadyNowTools') === 21 &&
    countFrom(packet, 'externalBetaToolCallReadyNowTools') === 21 &&
    countFrom(packet, 'runtimeReadyForOnDemandExternalBetaToolCallTools') === 21 &&
    countFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence') === 21 &&
    countFrom(packet, 'productionReadyNowTools') === 0 &&
    booleanFrom(packet, 'sourceExternalBetaLaunchGoNoGoAccepted') === true &&
    booleanFrom(packet, 'sourceExternalBetaAll21ActivationRollupAccepted') === true &&
    booleanFrom(packet, 'sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence') === true &&
    booleanFrom(packet, 'externalBetaReadyNow') === true &&
    booleanFrom(packet, 'agentCanExecuteToolsNow') === false &&
    booleanFrom(packet, 'directAgentToolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'routeExecutionApprovedNow') === false &&
    booleanFrom(packet, 'workerExecutionApprovedNow') === false &&
    booleanFrom(packet, 'toolExecutionApprovedNow') === false &&
    booleanFrom(packet, 'gpuRuntimeShouldStartNow') === false &&
    booleanFrom(packet, 'productionReadyNow') === false
}

function statusFromInput(input: {
  hasEndToEnd: boolean
  endToEndAccepted: boolean
  hasRollup: boolean
  rollupAccepted: boolean
  hasActivatedLaunch: boolean
  activatedLaunchAccepted: boolean
}): AiGraphicsExternalBetaControlledOnDemandStatusBridgeStatus {
  if (!input.hasEndToEnd) return 'missing_external_beta_end_to_end_readiness'
  if (!input.endToEndAccepted) return 'external_beta_end_to_end_readiness_rejected'
  if (!input.hasRollup) return 'missing_beta_production_readiness_rollup'
  if (!input.rollupAccepted) return 'beta_production_readiness_rollup_rejected'
  if (!input.hasActivatedLaunch) return 'missing_external_beta_activated_launch_readiness'
  if (!input.activatedLaunchAccepted) return 'external_beta_activated_launch_readiness_rejected'
  return 'external_beta_controlled_on_demand_status_bridge_ready_with_warnings'
}

export function evaluateAiGraphicsExternalBetaControlledOnDemandStatusBridge(
  input: AiGraphicsExternalBetaControlledOnDemandStatusBridgeInput = {},
): AiGraphicsExternalBetaControlledOnDemandStatusBridge {
  const sourceExternalBetaEndToEndReadinessAccepted = externalBetaEndToEndAccepted(
    input.sourceExternalBetaEndToEndReadinessPacket,
  )
  const sourceBetaProductionReadinessRollupAccepted = betaProductionRollupAccepted(
    input.sourceBetaProductionReadinessRollupPacket,
  )
  const sourceExternalBetaActivatedLaunchReadinessAccepted =
    activatedLaunchAccepted(input.sourceExternalBetaActivatedLaunchReadinessPacket)
  const status = statusFromInput({
    hasEndToEnd: Boolean(input.sourceExternalBetaEndToEndReadinessPacket),
    endToEndAccepted: sourceExternalBetaEndToEndReadinessAccepted,
    hasRollup: Boolean(input.sourceBetaProductionReadinessRollupPacket),
    rollupAccepted: sourceBetaProductionReadinessRollupAccepted,
    hasActivatedLaunch: Boolean(input.sourceExternalBetaActivatedLaunchReadinessPacket),
    activatedLaunchAccepted: sourceExternalBetaActivatedLaunchReadinessAccepted,
  })
  const accepted = status ===
    'external_beta_controlled_on_demand_status_bridge_ready_with_warnings'
  const rejectionReasons = [
    !input.sourceExternalBetaEndToEndReadinessPacket
      ? 'missing accepted external beta end-to-end readiness packet'
      : undefined,
    input.sourceExternalBetaEndToEndReadinessPacket &&
        !sourceExternalBetaEndToEndReadinessAccepted
      ? 'external beta end-to-end readiness packet is not accepted'
      : undefined,
    sourceExternalBetaEndToEndReadinessAccepted &&
        !input.sourceBetaProductionReadinessRollupPacket
      ? 'missing accepted beta/production readiness rollup packet'
      : undefined,
    input.sourceBetaProductionReadinessRollupPacket &&
        !sourceBetaProductionReadinessRollupAccepted
      ? 'beta/production readiness rollup packet is not accepted'
      : undefined,
    sourceBetaProductionReadinessRollupAccepted &&
        !input.sourceExternalBetaActivatedLaunchReadinessPacket
      ? 'missing accepted external beta activated-launch readiness packet'
      : undefined,
    input.sourceExternalBetaActivatedLaunchReadinessPacket &&
        !sourceExternalBetaActivatedLaunchReadinessAccepted
      ? 'external beta activated-launch readiness packet is not accepted'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_CONTROLLED_ON_DEMAND_STATUS_BRIDGE_DECISION,
    status,
    rejectionReasons,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    externalBetaControlledOnDemandReadyTools: accepted ? 21 : 0,
    externalBetaCallableNowTools: accepted ? 21 : 0,
    externalBetaReadyNowTools: accepted ? 21 : 0,
    runtimeReadyForOnDemandExternalBetaToolCallTools: accepted ? 21 : 0,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
      accepted ? 21 : 0,
    productionReadyNowTools: 0,
    readinessInterpretation:
      'external_beta_ready_means_controlled_on_demand_worker_path_not_direct_agent_execution',
    remainingProductionGap:
      'production_requires_separate_operator_traffic_cutover_and_live_runtime_evidence',
    gpuPolicy: {
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeShouldStartNow: false,
    },
    acceptedSources: {
      externalBetaEndToEndReadiness: sourceExternalBetaEndToEndReadinessAccepted,
      betaProductionReadinessRollup: sourceBetaProductionReadinessRollupAccepted,
      externalBetaActivatedLaunchReadiness:
        sourceExternalBetaActivatedLaunchReadinessAccepted,
    },
    booleans: {
      externalBetaControlledOnDemandStatusBridgePrepared: true,
      sourceExternalBetaEndToEndReadinessAccepted,
      sourceBetaProductionReadinessRollupAccepted,
      sourceExternalBetaActivatedLaunchReadinessAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      all21ToolsReadyForControlledOnDemandExternalBetaToolCalls: accepted,
      controlledExternalBetaToolCallReadinessClarified: accepted,
      externalBetaReadyNow: accepted,
      externalBetaCallableNow: accepted,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      workerEnqueuePerformed: false,
      routeExecutionPerformed: false,
      backendQueueSubmissionPerformed: false,
      privateArtifactWritePerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
