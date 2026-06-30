import {
  AI_GRAPHICS_PRODUCTION_LAUNCH_GO_NO_GO_DECISION,
  acceptedAiGraphicsProductionLaunchGoNoGo,
  type AiGraphicsProductionLaunchGoNoGo,
} from './ai-graphics-production-launch-go-no-go'

export const AI_GRAPHICS_PRODUCTION_TRAFFIC_CUTOVER_DECISION =
  'ai_graphics_production_traffic_cutover_approved_controlled_tool_call_ready'

export type AiGraphicsProductionTrafficCutoverStatus =
  | 'missing_production_launch_go_no_go'
  | 'production_launch_go_no_go_rejected'
  | 'missing_production_traffic_cutover_controls'
  | 'production_traffic_cutover_approved_controlled_tool_call_ready'

export interface AiGraphicsProductionTrafficCutoverInput {
  sourceProductionLaunchGoNoGoPacket?: AiGraphicsProductionLaunchGoNoGo
  productionTrafficSwitchApprovalRef?: string
  productionRouteReadinessRef?: string
  productionWorkerReadinessRef?: string
  productionPrivateArtifactStoreRef?: string
  productionMonitoringLiveDashboardRef?: string
  productionRollbackDrillRef?: string
  productionCanaryCohortActiveRef?: string
  productionSupportOnCallActiveRef?: string
  productionCostGuardrailLiveRef?: string
  productionPrivacyRetentionLiveRef?: string
  productionPostCutoverReviewOwnerRef?: string
  productionLaunchApproverRole?: string
}

export interface AiGraphicsProductionTrafficCutover {
  decision: typeof AI_GRAPHICS_PRODUCTION_TRAFFIC_CUTOVER_DECISION
  sourceProductionLaunchGoNoGoDecision:
    typeof AI_GRAPHICS_PRODUCTION_LAUNCH_GO_NO_GO_DECISION | null
  status: AiGraphicsProductionTrafficCutoverStatus
  sourceProductionLaunchGoNoGoAccepted: boolean
  productionTrafficCutoverControlsAccepted: boolean
  rejectionReasons: string[]
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  productionTrafficCutoverApprovedToolsWithProvidedEvidence: 0 | 21
  productionControlledToolCallReadyNowTools: 0 | 21
  runtimeReadyForOnDemandProductionToolCallTools: 0 | 21
  productionReadyNowTools: 0 | 21
  gpuRuntimeShouldStartNow: false
  evidence: {
    trafficSwitchApprovalRef: string | null
    routeReadinessRef: string | null
    workerReadinessRef: string | null
    privateArtifactStoreRef: string | null
    monitoringLiveDashboardRef: string | null
    rollbackDrillRef: string | null
    canaryCohortActiveRef: string | null
    supportOnCallActiveRef: string | null
    costGuardrailLiveRef: string | null
    privacyRetentionLiveRef: string | null
    postCutoverReviewOwnerRef: string | null
    approverRole: 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER'
    privateEvidenceRefsOnly: true
  }
  policy: {
    approvesControlledProductionToolCallReadiness: boolean
    directAgentExecutionStillBlocked: true
    executionPerformedByThisGate: false
    runtimeStartsOnlyForAcceptedProductionWorkerJob: true
    gpuRuntimeApprovedForAcceptedProductionJobs: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    privateArtifactsOnly: true
    noPublicArtifactsByGate: true
    noSignedUrlsByGate: true
  }
  booleans: {
    productionTrafficCutoverPrepared: true
    sourceProductionLaunchGoNoGoAccepted: boolean
    productionTrafficCutoverControlsAccepted: boolean
    productionTrafficCutoverApprovedWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    productionControlledToolCallReadyNow: boolean
    runtimeReadyForOnDemandProductionToolCall: boolean
    productionRouteReadyNow: boolean
    productionWorkerPathReadyNow: boolean
    productionPrivateArtifactStoreReadyNow: boolean
    productionMonitoringReadyNow: boolean
    productionRollbackReadyNow: boolean
    gpuRuntimeApprovedForAcceptedProductionJobs: boolean
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    gpuStartsOnlyForApprovedWorkerOrToolCall: true
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    directAgentToolExecutionApprovedNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    productionTrafficCutoverApprovedNow: boolean
    productionTrafficEnabledNow: boolean
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    gpuRuntimeShouldStartNow: false
    runtimeReadyNow: boolean
    internalBetaReadyNow: false
    externalBetaReadyNow: true
    productionReadyNow: boolean
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
  'productionTrafficSwitchApprovalRef',
  'productionRouteReadinessRef',
  'productionWorkerReadinessRef',
  'productionPrivateArtifactStoreRef',
  'productionMonitoringLiveDashboardRef',
  'productionRollbackDrillRef',
  'productionCanaryCohortActiveRef',
  'productionSupportOnCallActiveRef',
  'productionCostGuardrailLiveRef',
  'productionPrivacyRetentionLiveRef',
  'productionPostCutoverReviewOwnerRef',
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

function missingCutoverControls(input: AiGraphicsProductionTrafficCutoverInput): string[] {
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

export function acceptedAiGraphicsProductionTrafficCutover(
  packet: AiGraphicsProductionTrafficCutover | undefined,
): packet is AiGraphicsProductionTrafficCutover {
  return Boolean(
    packet &&
      packet.decision === AI_GRAPHICS_PRODUCTION_TRAFFIC_CUTOVER_DECISION &&
      packet.status === 'production_traffic_cutover_approved_controlled_tool_call_ready' &&
      packet.sourceProductionLaunchGoNoGoAccepted === true &&
      packet.productionTrafficCutoverControlsAccepted === true &&
      packet.rejectionReasons.length === 0 &&
      packet.totalAiGraphicsTools === 21 &&
      packet.totalProductFacingCapabilities === 12 &&
      packet.gpuRuntimeTargetedTools === 8 &&
      packet.productionTrafficCutoverApprovedToolsWithProvidedEvidence === 21 &&
      packet.productionControlledToolCallReadyNowTools === 21 &&
      packet.runtimeReadyForOnDemandProductionToolCallTools === 21 &&
      packet.productionReadyNowTools === 21 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.policy.approvesControlledProductionToolCallReadiness === true &&
      packet.policy.directAgentExecutionStillBlocked === true &&
      packet.policy.executionPerformedByThisGate === false &&
      packet.policy.gpuRuntimeApprovedForAcceptedProductionJobs === true &&
      packet.policy.gpuRuntimeOnDemandOnly === true &&
      packet.policy.noPublicArtifactsByGate === true &&
      packet.policy.noSignedUrlsByGate === true &&
      packet.booleans.productionControlledToolCallReadyNow === true &&
      packet.booleans.runtimeReadyForOnDemandProductionToolCall === true &&
      packet.booleans.productionReadyNow === true &&
      packet.booleans.agentCanExecuteToolsNow === false &&
      packet.booleans.directAgentToolExecutionApprovedNow === false &&
      packet.booleans.gpuRuntimeShouldStartNow === false &&
      packet.booleans.toolExecutionPerformed === false,
  )
}

export function buildAiGraphicsProductionTrafficCutover(
  input: AiGraphicsProductionTrafficCutoverInput = {},
): AiGraphicsProductionTrafficCutover {
  const hasSourceGoNoGo = Boolean(input.sourceProductionLaunchGoNoGoPacket)
  const sourceProductionLaunchGoNoGoAccepted =
    acceptedAiGraphicsProductionLaunchGoNoGo(input.sourceProductionLaunchGoNoGoPacket)
  const rejectionReasons = hasSourceGoNoGo && !sourceProductionLaunchGoNoGoAccepted
    ? ['source production launch go/no-go packet is not accepted']
    : missingCutoverControls(input)
  const accepted = sourceProductionLaunchGoNoGoAccepted && rejectionReasons.length === 0
  const status: AiGraphicsProductionTrafficCutoverStatus = !hasSourceGoNoGo
    ? 'missing_production_launch_go_no_go'
    : !sourceProductionLaunchGoNoGoAccepted
      ? 'production_launch_go_no_go_rejected'
      : accepted
        ? 'production_traffic_cutover_approved_controlled_tool_call_ready'
        : 'missing_production_traffic_cutover_controls'

  return {
    decision: AI_GRAPHICS_PRODUCTION_TRAFFIC_CUTOVER_DECISION,
    sourceProductionLaunchGoNoGoDecision:
      input.sourceProductionLaunchGoNoGoPacket?.decision ?? null,
    status,
    sourceProductionLaunchGoNoGoAccepted,
    productionTrafficCutoverControlsAccepted: accepted,
    rejectionReasons,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    productionTrafficCutoverApprovedToolsWithProvidedEvidence: accepted ? 21 : 0,
    productionControlledToolCallReadyNowTools: accepted ? 21 : 0,
    runtimeReadyForOnDemandProductionToolCallTools: accepted ? 21 : 0,
    productionReadyNowTools: accepted ? 21 : 0,
    gpuRuntimeShouldStartNow: false,
    evidence: {
      trafficSwitchApprovalRef: trimOrNull(input.productionTrafficSwitchApprovalRef),
      routeReadinessRef: trimOrNull(input.productionRouteReadinessRef),
      workerReadinessRef: trimOrNull(input.productionWorkerReadinessRef),
      privateArtifactStoreRef: trimOrNull(input.productionPrivateArtifactStoreRef),
      monitoringLiveDashboardRef:
        trimOrNull(input.productionMonitoringLiveDashboardRef),
      rollbackDrillRef: trimOrNull(input.productionRollbackDrillRef),
      canaryCohortActiveRef: trimOrNull(input.productionCanaryCohortActiveRef),
      supportOnCallActiveRef: trimOrNull(input.productionSupportOnCallActiveRef),
      costGuardrailLiveRef: trimOrNull(input.productionCostGuardrailLiveRef),
      privacyRetentionLiveRef: trimOrNull(input.productionPrivacyRetentionLiveRef),
      postCutoverReviewOwnerRef:
        trimOrNull(input.productionPostCutoverReviewOwnerRef),
      approverRole: 'AI_GRAPHICS_PRODUCTION_LAUNCH_OWNER',
      privateEvidenceRefsOnly: true,
    },
    policy: {
      approvesControlledProductionToolCallReadiness: accepted,
      directAgentExecutionStillBlocked: true,
      executionPerformedByThisGate: false,
      runtimeStartsOnlyForAcceptedProductionWorkerJob: true,
      gpuRuntimeApprovedForAcceptedProductionJobs: accepted,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      privateArtifactsOnly: true,
      noPublicArtifactsByGate: true,
      noSignedUrlsByGate: true,
    },
    booleans: {
      productionTrafficCutoverPrepared: true,
      sourceProductionLaunchGoNoGoAccepted,
      productionTrafficCutoverControlsAccepted: accepted,
      productionTrafficCutoverApprovedWithProvidedEvidence: accepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      productionControlledToolCallReadyNow: accepted,
      runtimeReadyForOnDemandProductionToolCall: accepted,
      productionRouteReadyNow: accepted,
      productionWorkerPathReadyNow: accepted,
      productionPrivateArtifactStoreReadyNow: accepted,
      productionMonitoringReadyNow: accepted,
      productionRollbackReadyNow: accepted,
      gpuRuntimeApprovedForAcceptedProductionJobs: accepted,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      directAgentToolExecutionApprovedNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      productionTrafficCutoverApprovedNow: accepted,
      productionTrafficEnabledNow: accepted,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: accepted,
      internalBetaReadyNow: false,
      externalBetaReadyNow: true,
      productionReadyNow: accepted,
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
