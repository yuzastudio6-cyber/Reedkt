import {
  AI_GRAPHICS_PRODUCTION_LAUNCH_CONTROLS_DECISION,
  acceptedAiGraphicsProductionLaunchControls,
  type AiGraphicsProductionLaunchControls,
} from './ai-graphics-production-launch-controls'

export const AI_GRAPHICS_PRODUCTION_LAUNCH_GO_NO_GO_DECISION =
  'ai_graphics_production_launch_go_no_go_approved_with_runtime_blocks'

export type AiGraphicsProductionLaunchGoNoGoStatus =
  | 'missing_production_launch_controls'
  | 'production_launch_controls_rejected'
  | 'missing_production_go_no_go_controls'
  | 'production_launch_go_no_go_approved_pending_traffic_cutover'

export interface AiGraphicsProductionLaunchGoNoGoInput {
  sourceProductionLaunchControlsPacket?: AiGraphicsProductionLaunchControls
  productionFinalGoNoGoApprovalRef?: string
  productionTrafficCutoverPlanRef?: string
  productionFeatureFlagCutoverRef?: string
  productionCanaryRampPlanRef?: string
  productionRollbackOperatorAckRef?: string
  productionMonitoringOnCallAckRef?: string
  productionCostCeilingFinalAckRef?: string
  productionPrivacyRetentionFinalAckRef?: string
  productionPostCutoverReviewScheduleRef?: string
  productionLaunchApproverRole?: string
}

export interface AiGraphicsProductionLaunchGoNoGo {
  decision: typeof AI_GRAPHICS_PRODUCTION_LAUNCH_GO_NO_GO_DECISION
  sourceProductionLaunchControlsDecision:
    typeof AI_GRAPHICS_PRODUCTION_LAUNCH_CONTROLS_DECISION | null
  status: AiGraphicsProductionLaunchGoNoGoStatus
  sourceProductionLaunchControlsAccepted: boolean
  productionGoNoGoControlsAccepted: boolean
  rejectionReasons: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionLaunchGoNoGoApprovedToolsWithProvidedEvidence: 0 | 21
  productionTrafficCutoverApprovedNowTools: 0
  productionReadyNowTools: 0
  gpuRuntimeShouldStartNow: false
  evidence: {
    finalGoNoGoApprovalRef: string | null
    trafficCutoverPlanRef: string | null
    featureFlagCutoverRef: string | null
    canaryRampPlanRef: string | null
    rollbackOperatorAckRef: string | null
    monitoringOnCallAckRef: string | null
    costCeilingFinalAckRef: string | null
    privacyRetentionFinalAckRef: string | null
    postCutoverReviewScheduleRef: string | null
    approverRole: 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER'
    privateEvidenceRefsOnly: true
  }
  policy: {
    approvesProductionGoNoGoMetadata: true
    approvesProductionTrafficCutoverNow: false
    productionExecutionStillBlocked: true
    explicitTrafficCutoverGateRequired: true
    runtimeStartsOnlyForAcceptedProductionWorkerJob: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    noPublicArtifactsByGate: true
    noSignedUrlsByGate: true
  }
  booleans: {
    productionLaunchGoNoGoPrepared: true
    sourceProductionLaunchControlsAccepted: boolean
    productionGoNoGoControlsAccepted: boolean
    productionLaunchGoNoGoApprovedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    productionTrafficCutoverApprovedNow: false
    productionTrafficEnabledNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: true
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    routeExecutionPerformed: false
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

const requiredRefFields = [
  'productionFinalGoNoGoApprovalRef',
  'productionTrafficCutoverPlanRef',
  'productionFeatureFlagCutoverRef',
  'productionCanaryRampPlanRef',
  'productionRollbackOperatorAckRef',
  'productionMonitoringOnCallAckRef',
  'productionCostCeilingFinalAckRef',
  'productionPrivacyRetentionFinalAckRef',
  'productionPostCutoverReviewScheduleRef',
] as const

function isPrivateEvidenceRef(value: string | undefined): boolean {
  if (!value || value.trim().length === 0) return false
  const normalized = value.trim().toLowerCase()
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('production-evidence://')
}

function missingGoNoGoControls(input: AiGraphicsProductionLaunchGoNoGoInput): string[] {
  return [
    ...requiredRefFields
      .filter((field) => !isPrivateEvidenceRef(input[field]))
      .map((field) => `${field}: private/backend production evidence ref is required`),
    input.productionLaunchApproverRole &&
      input.productionLaunchApproverRole !== 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER'
      ? 'productionLaunchApproverRole: AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER is required'
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))
}

function trimOrNull(value: string | undefined): string | null {
  return value?.trim() || null
}

export function acceptedAiGraphicsProductionLaunchGoNoGo(
  packet: AiGraphicsProductionLaunchGoNoGo | undefined,
): packet is AiGraphicsProductionLaunchGoNoGo {
  return Boolean(
    packet &&
      packet.decision === AI_GRAPHICS_PRODUCTION_LAUNCH_GO_NO_GO_DECISION &&
      packet.status === 'production_launch_go_no_go_approved_pending_traffic_cutover' &&
      packet.sourceProductionLaunchControlsAccepted === true &&
      packet.productionGoNoGoControlsAccepted === true &&
      packet.rejectionReasons.length === 0 &&
      packet.totalAiGraphicsTools === 21 &&
      packet.totalProductFacingCapabilities === 12 &&
      packet.gpuRuntimeTargetedTools === 8 &&
      packet.productionLaunchGoNoGoApprovedToolsWithProvidedEvidence === 21 &&
      packet.productionTrafficCutoverApprovedNowTools === 0 &&
      packet.productionReadyNowTools === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.policy.approvesProductionGoNoGoMetadata === true &&
      packet.policy.approvesProductionTrafficCutoverNow === false &&
      packet.policy.productionExecutionStillBlocked === true &&
      packet.policy.explicitTrafficCutoverGateRequired === true &&
      packet.booleans.productionLaunchGoNoGoApprovedWithProvidedEvidence === true &&
      packet.booleans.productionTrafficCutoverApprovedNow === false &&
      packet.booleans.productionTrafficEnabledNow === false &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.workerQueueApprovedNow === false &&
      packet.booleans.gpuRuntimeApprovedNow === false &&
      packet.booleans.gpuRuntimeShouldStartNow === false &&
      packet.booleans.productionReadyNow === false,
  )
}

export function buildAiGraphicsProductionLaunchGoNoGo(
  input: AiGraphicsProductionLaunchGoNoGoInput = {},
): AiGraphicsProductionLaunchGoNoGo {
  const hasSourceControls = Boolean(input.sourceProductionLaunchControlsPacket)
  const sourceProductionLaunchControlsAccepted =
    acceptedAiGraphicsProductionLaunchControls(input.sourceProductionLaunchControlsPacket)
  const rejectionReasons = hasSourceControls && !sourceProductionLaunchControlsAccepted
    ? ['source production launch controls packet is not accepted']
    : missingGoNoGoControls(input)
  const accepted = sourceProductionLaunchControlsAccepted && rejectionReasons.length === 0
  const status: AiGraphicsProductionLaunchGoNoGoStatus = !hasSourceControls
    ? 'missing_production_launch_controls'
    : !sourceProductionLaunchControlsAccepted
      ? 'production_launch_controls_rejected'
      : accepted
        ? 'production_launch_go_no_go_approved_pending_traffic_cutover'
        : 'missing_production_go_no_go_controls'

  return {
    decision: AI_GRAPHICS_PRODUCTION_LAUNCH_GO_NO_GO_DECISION,
    sourceProductionLaunchControlsDecision:
      input.sourceProductionLaunchControlsPacket?.decision ?? null,
    status,
    sourceProductionLaunchControlsAccepted,
    productionGoNoGoControlsAccepted: accepted,
    rejectionReasons,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionLaunchGoNoGoApprovedToolsWithProvidedEvidence: accepted ? 21 : 0,
    productionTrafficCutoverApprovedNowTools: 0,
    productionReadyNowTools: 0,
    gpuRuntimeShouldStartNow: false,
    evidence: {
      finalGoNoGoApprovalRef: trimOrNull(input.productionFinalGoNoGoApprovalRef),
      trafficCutoverPlanRef: trimOrNull(input.productionTrafficCutoverPlanRef),
      featureFlagCutoverRef: trimOrNull(input.productionFeatureFlagCutoverRef),
      canaryRampPlanRef: trimOrNull(input.productionCanaryRampPlanRef),
      rollbackOperatorAckRef: trimOrNull(input.productionRollbackOperatorAckRef),
      monitoringOnCallAckRef: trimOrNull(input.productionMonitoringOnCallAckRef),
      costCeilingFinalAckRef: trimOrNull(input.productionCostCeilingFinalAckRef),
      privacyRetentionFinalAckRef: trimOrNull(input.productionPrivacyRetentionFinalAckRef),
      postCutoverReviewScheduleRef:
        trimOrNull(input.productionPostCutoverReviewScheduleRef),
      approverRole: 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
      privateEvidenceRefsOnly: true,
    },
    policy: {
      approvesProductionGoNoGoMetadata: true,
      approvesProductionTrafficCutoverNow: false,
      productionExecutionStillBlocked: true,
      explicitTrafficCutoverGateRequired: true,
      runtimeStartsOnlyForAcceptedProductionWorkerJob: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      noPublicArtifactsByGate: true,
      noSignedUrlsByGate: true,
    },
    booleans: {
      productionLaunchGoNoGoPrepared: true,
      sourceProductionLaunchControlsAccepted,
      productionGoNoGoControlsAccepted: accepted,
      productionLaunchGoNoGoApprovedWithProvidedEvidence: accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      productionTrafficCutoverApprovedNow: false,
      productionTrafficEnabledNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: true,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
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
