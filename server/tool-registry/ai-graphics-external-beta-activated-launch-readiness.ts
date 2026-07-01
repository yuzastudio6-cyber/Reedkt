import {
  AI_GRAPHICS_EXTERNAL_BETA_ALL_21_ACTIVATION_ROLLUP_DECISION,
  type AiGraphicsExternalBetaAll21ActivationRollup,
} from './ai-graphics-external-beta-all-21-activation-rollup'
import {
  AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION,
  type AiGraphicsExternalBetaLaunchGoNoGo,
} from './ai-graphics-external-beta-launch-go-no-go'

export const AI_GRAPHICS_EXTERNAL_BETA_ACTIVATED_LAUNCH_READINESS_DECISION =
  'ai_graphics_external_beta_activated_launch_readiness_approved_with_runtime_blocks'

export type AiGraphicsExternalBetaActivatedLaunchReadinessStatus =
  | 'missing_external_beta_launch_go_no_go'
  | 'external_beta_launch_go_no_go_rejected'
  | 'missing_external_beta_all_21_activation_rollup'
  | 'external_beta_all_21_activation_rollup_rejected'
  | 'external_beta_activated_launch_ready_for_controlled_on_demand_tool_calls'

export interface AiGraphicsExternalBetaActivatedLaunchReadinessInput {
  sourceExternalBetaLaunchGoNoGoPacket?: AiGraphicsExternalBetaLaunchGoNoGo
  sourceExternalBetaAll21ActivationRollupPacket?:
    AiGraphicsExternalBetaAll21ActivationRollup
}

export interface AiGraphicsExternalBetaActivatedLaunchReadiness {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_ACTIVATED_LAUNCH_READINESS_DECISION
  sourceExternalBetaLaunchGoNoGoDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION | null
  sourceExternalBetaAll21ActivationRollupDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ALL_21_ACTIVATION_ROLLUP_DECISION | null
  status: AiGraphicsExternalBetaActivatedLaunchReadinessStatus
  rejectionReasons: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  sourceExternalBetaLaunchGoNoGoAccepted: boolean
  sourceExternalBetaAll21ActivationRollupAccepted: boolean
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
    0 | 21
  externalBetaActivatedLaunchReadyToolsWithProvidedEvidence: 0 | 21
  externalBetaToolCallReadyNowTools: 0 | 21
  externalBetaReadyNowTools: 0 | 21
  runtimeReadyForOnDemandExternalBetaToolCallTools: 0 | 21
  productionReadyNowTools: 0
  gpuRuntimeShouldStartNow: false
  readinessMode:
    | 'controlled_external_beta_on_demand_tool_call_metadata'
    | 'not_ready'
  policy: {
    approvesControlledExternalBetaToolCallReadiness: true
    directAgentExecutionStillBlocked: true
    runtimeStartsOnlyForAcceptedWorkerJob: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    noProductionUnlockByReadinessGate: true
    noPublicArtifactsByReadinessGate: true
    nextGateRequiresProductionLaunchApproval: true
  }
  booleans: {
    externalBetaActivatedLaunchReadinessPrepared: true
    sourceExternalBetaLaunchGoNoGoAccepted: boolean
    sourceExternalBetaAll21ActivationRollupAccepted: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      boolean
    all21ExternalBetaActivatedLaunchReadyWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    controlledExternalBetaToolCallGatewayReadyNow: boolean
    controlledWorkerToolCallReadyNow: boolean
    externalBetaCallableNow: boolean
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
    gpuRuntimePerformedByReadinessGate: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
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
    packet.externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence === 21 &&
    packet.externalBetaLaunchGoNoGoApprovalRecordAccepted === true &&
    packet.externalBetaReadyNowTools === 0 &&
    packet.productionReadyNowTools === 0 &&
    packet.booleans.sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted === true &&
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

function all21ActivationRollupAccepted(
  packet?: AiGraphicsExternalBetaAll21ActivationRollup,
): boolean {
  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_ALL_21_ACTIVATION_ROLLUP_DECISION &&
    packet.status ===
      'external_beta_all_21_activation_rollup_accepted_runtime_on_demand' &&
    packet.externalBetaActivationGoNoGoAcceptedToolsWithProvidedEvidence === 21 &&
    packet.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence === 21 &&
    packet.externalBetaToolCallReadyNowTools === 21 &&
    packet.externalBetaReadyNowTools === 21 &&
    packet.runtimeReadyForOnDemandExternalBetaToolCallTools === 21 &&
    packet.productionReadyNowTools === 0 &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.activatedTools.length === 21 &&
    packet.activatedTools.every((tool) =>
      tool.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true
    ) &&
    packet.booleans.all21ActivationGoNoGoPacketsAcceptedWithProvidedEvidence === true &&
    packet.booleans.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === true &&
    packet.booleans.externalBetaReadyNow === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.directAgentToolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.productionReadyNow === false
}

function statusFromInput(input: {
  hasLaunch: boolean
  launchAccepted: boolean
  hasActivation: boolean
  activationAccepted: boolean
}): AiGraphicsExternalBetaActivatedLaunchReadinessStatus {
  if (!input.hasLaunch) return 'missing_external_beta_launch_go_no_go'
  if (!input.launchAccepted) return 'external_beta_launch_go_no_go_rejected'
  if (!input.hasActivation) return 'missing_external_beta_all_21_activation_rollup'
  if (!input.activationAccepted) return 'external_beta_all_21_activation_rollup_rejected'
  return 'external_beta_activated_launch_ready_for_controlled_on_demand_tool_calls'
}

export function evaluateAiGraphicsExternalBetaActivatedLaunchReadiness(
  input: AiGraphicsExternalBetaActivatedLaunchReadinessInput = {},
): AiGraphicsExternalBetaActivatedLaunchReadiness {
  const launchAccepted = launchGoNoGoAccepted(
    input.sourceExternalBetaLaunchGoNoGoPacket,
  )
  const activationAccepted = all21ActivationRollupAccepted(
    input.sourceExternalBetaAll21ActivationRollupPacket,
  )
  const status = statusFromInput({
    hasLaunch: Boolean(input.sourceExternalBetaLaunchGoNoGoPacket),
    launchAccepted,
    hasActivation: Boolean(input.sourceExternalBetaAll21ActivationRollupPacket),
    activationAccepted,
  })
  const accepted = status ===
    'external_beta_activated_launch_ready_for_controlled_on_demand_tool_calls'
  const rejectionReasons = [
    !input.sourceExternalBetaLaunchGoNoGoPacket
      ? 'missing accepted external beta launch go/no-go packet'
      : undefined,
    input.sourceExternalBetaLaunchGoNoGoPacket && !launchAccepted
      ? 'external beta launch go/no-go packet is not accepted'
      : undefined,
    launchAccepted && !input.sourceExternalBetaAll21ActivationRollupPacket
      ? 'missing accepted all-21 activation rollup packet'
      : undefined,
    input.sourceExternalBetaAll21ActivationRollupPacket && !activationAccepted
      ? 'all-21 activation rollup packet is not accepted'
      : undefined,
  ].filter((reason): reason is string => Boolean(reason))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_ACTIVATED_LAUNCH_READINESS_DECISION,
    sourceExternalBetaLaunchGoNoGoDecision:
      input.sourceExternalBetaLaunchGoNoGoPacket?.decision ?? null,
    sourceExternalBetaAll21ActivationRollupDecision:
      input.sourceExternalBetaAll21ActivationRollupPacket?.decision ?? null,
    status,
    rejectionReasons,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    sourceExternalBetaLaunchGoNoGoAccepted: launchAccepted,
    sourceExternalBetaAll21ActivationRollupAccepted: activationAccepted,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
      activationAccepted ? 21 : 0,
    externalBetaActivatedLaunchReadyToolsWithProvidedEvidence: accepted ? 21 : 0,
    externalBetaToolCallReadyNowTools: accepted ? 21 : 0,
    externalBetaReadyNowTools: accepted ? 21 : 0,
    runtimeReadyForOnDemandExternalBetaToolCallTools: accepted ? 21 : 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    readinessMode: accepted
      ? 'controlled_external_beta_on_demand_tool_call_metadata'
      : 'not_ready',
    policy: {
      approvesControlledExternalBetaToolCallReadiness: true,
      directAgentExecutionStillBlocked: true,
      runtimeStartsOnlyForAcceptedWorkerJob: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      noProductionUnlockByReadinessGate: true,
      noPublicArtifactsByReadinessGate: true,
      nextGateRequiresProductionLaunchApproval: true,
    },
    booleans: {
      externalBetaActivatedLaunchReadinessPrepared: true,
      sourceExternalBetaLaunchGoNoGoAccepted: launchAccepted,
      sourceExternalBetaAll21ActivationRollupAccepted: activationAccepted,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        activationAccepted,
      all21ExternalBetaActivatedLaunchReadyWithProvidedEvidence: accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      controlledExternalBetaToolCallGatewayReadyNow: accepted,
      controlledWorkerToolCallReadyNow: accepted,
      externalBetaCallableNow: accepted,
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
      gpuRuntimePerformedByReadinessGate: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
