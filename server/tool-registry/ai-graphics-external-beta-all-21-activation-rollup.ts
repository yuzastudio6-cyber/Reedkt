import {
  AI_GRAPHICS_EXTERNAL_BETA_ACTIVATION_GO_NO_GO_DECISION,
  type AiGraphicsExternalBetaActivationGoNoGo,
} from './ai-graphics-external-beta-activation-go-no-go'

export const AI_GRAPHICS_EXTERNAL_BETA_ALL_21_ACTIVATION_ROLLUP_DECISION =
  'ai_graphics_external_beta_all_21_activation_rollup_approved_with_runtime_blocks'

export type AiGraphicsExternalBetaAll21ActivationRollupStatus =
  | 'missing_external_beta_activation_go_no_go_packets'
  | 'partial_external_beta_activation_go_no_go_packets'
  | 'duplicate_external_beta_activation_go_no_go_tool_packets'
  | 'external_beta_all_21_activation_rollup_accepted_runtime_on_demand'

const aiGraphicsTools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
] as const

export type AiGraphicsToolId = typeof aiGraphicsTools[number]

const gpuTools = new Set<AiGraphicsToolId>([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

export interface AiGraphicsExternalBetaAll21ActivationRollupInput {
  activationGoNoGoPackets?: AiGraphicsExternalBetaActivationGoNoGo[]
}

export interface AiGraphicsExternalBetaAll21ActivatedTool {
  toolId: string
  capabilityId: string
  routePath: '/api/ai-graphics/external-beta/tool-call'
  routeId: string
  gpuRuntimeTargetedTool: boolean
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: true
  externalBetaToolCallReadyNow: true
  runtimeReadyForOnDemandExternalBetaToolCall: true
  gpuRuntimeOnDemandOnly: true
  gpuRuntimeShouldStartNow: false
  productionReadyNow: false
}

export interface AiGraphicsExternalBetaAll21ActivationRollup {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_ALL_21_ACTIVATION_ROLLUP_DECISION
  sourceActivationGoNoGoDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ACTIVATION_GO_NO_GO_DECISION
  status: AiGraphicsExternalBetaAll21ActivationRollupStatus
  rejectionReasons: string[]
  acceptedToolIds: string[]
  missingToolIds: string[]
  duplicateToolIds: string[]
  externalBetaActivationGoNoGoAcceptedToolsWithProvidedEvidence: number
  sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
    number
  externalBetaToolCallReadyNowTools: 0 | 21
  externalBetaReadyNowTools: 0 | 21
  runtimeReadyForOnDemandExternalBetaToolCallTools: 0 | 21
  productionReadyNowTools: 0
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeShouldStartNow: false
  activatedTools: AiGraphicsExternalBetaAll21ActivatedTool[]
  policy: {
    approvesAll21ExternalBetaToolCallReadinessMetadata: true
    directAgentExecutionStillBlocked: true
    runtimeStartsOnlyForAcceptedWorkerJob: true
    gpuRuntimeOnDemandOnly: true
    noIdleGpuRuntimeApproved: true
    noProductionUnlockByRollup: true
    noPublicArtifactsByRollup: true
    nextGateRequiresExternalBetaLaunchOwnerApproval: true
  }
  booleans: {
    externalBetaAll21ActivationRollupPrepared: true
    sourceActivationGoNoGoPacketsAcceptedWithProvidedEvidence: boolean
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
      boolean
    all21ActivationGoNoGoPacketsAcceptedWithProvidedEvidence: boolean
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
    gpuRuntimePerformedByActivationRollup: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

function isAcceptedActivationPacket(
  packet: AiGraphicsExternalBetaActivationGoNoGo,
): boolean {
  return packet.decision ===
    AI_GRAPHICS_EXTERNAL_BETA_ACTIVATION_GO_NO_GO_DECISION &&
    packet.status ===
      'external_beta_activation_go_no_go_approved_for_one_tool_runtime_on_demand' &&
    packet.sourceControlledTrafficRuntimeSoakResultAccepted === true &&
    packet.externalBetaActivationControlsAccepted === true &&
    packet.externalBetaActivationGoNoGoApprovedToolsWithProvidedEvidence === 1 &&
    packet.sourceControlledTrafficRuntimeSoakResultAcceptedRequestsWithProvidedEvidence === 1 &&
    packet.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === 1 &&
    packet.externalBetaToolCallReadyNowTools === 1 &&
    packet.externalBetaReadyNowTools === 1 &&
    packet.runtimeReadyForOnDemandExternalBetaToolCallTools === 1 &&
    packet.productionReadyNowTools === 0 &&
    packet.totalAiGraphicsTools === 21 &&
    packet.totalProductFacingCapabilities === 12 &&
    packet.gpuRuntimeTargetedTools === 8 &&
    packet.gpuRuntimeShouldStartNow === false &&
    packet.activatedToolCallReadiness !== null &&
    packet.activatedToolCallReadiness
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    packet.activatedToolCallReadiness.externalBetaToolCallReadyNow === true &&
    packet.activatedToolCallReadiness.runtimeReadyForOnDemandExternalBetaToolCall === true &&
    packet.activatedToolCallReadiness.gpuRuntimeOnDemandOnly === true &&
    packet.activatedToolCallReadiness.gpuRuntimeShouldStartNow === false &&
    packet.activatedToolCallReadiness.productionReadyNow === false &&
    packet.booleans.externalBetaActivationApprovedWithProvidedEvidence === true &&
    packet.booleans.sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted === true &&
    packet.evidence
      .sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence === true &&
    packet.booleans.externalBetaReadyNow === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.directAgentToolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.productionReadyNow === false
}

function statusFromInput(input: {
  hasPackets: boolean
  duplicateToolIds: string[]
  missingToolIds: string[]
}): AiGraphicsExternalBetaAll21ActivationRollupStatus {
  if (!input.hasPackets) return 'missing_external_beta_activation_go_no_go_packets'
  if (input.duplicateToolIds.length > 0) {
    return 'duplicate_external_beta_activation_go_no_go_tool_packets'
  }
  if (input.missingToolIds.length > 0) {
    return 'partial_external_beta_activation_go_no_go_packets'
  }
  return 'external_beta_all_21_activation_rollup_accepted_runtime_on_demand'
}

export function evaluateAiGraphicsExternalBetaAll21ActivationRollup(
  input: AiGraphicsExternalBetaAll21ActivationRollupInput = {},
): AiGraphicsExternalBetaAll21ActivationRollup {
  const packets = input.activationGoNoGoPackets ?? []
  const acceptedByTool = new Map<string, AiGraphicsExternalBetaActivationGoNoGo>()
  const duplicateToolIds = new Set<string>()
  const rejectionReasons: string[] = []

  for (const packet of packets) {
    const toolId = packet.activatedToolCallReadiness?.toolId ?? packet.requestedToolId
    if (!toolId || !aiGraphicsTools.includes(toolId as AiGraphicsToolId)) {
      rejectionReasons.push('activation packet missing recognized AI graphics tool id')
      continue
    }
    if (!isAcceptedActivationPacket(packet)) {
      rejectionReasons.push(`activation packet for ${toolId} is not accepted`)
      continue
    }
    if (acceptedByTool.has(toolId)) {
      duplicateToolIds.add(toolId)
      continue
    }
    acceptedByTool.set(toolId, packet)
  }

  const missingToolIds = aiGraphicsTools.filter((toolId) => !acceptedByTool.has(toolId))
  const status = statusFromInput({
    hasPackets: packets.length > 0,
    duplicateToolIds: [...duplicateToolIds],
    missingToolIds,
  })
  const accepted = status ===
    'external_beta_all_21_activation_rollup_accepted_runtime_on_demand'
  const acceptedToolIds = aiGraphicsTools.filter((toolId) => acceptedByTool.has(toolId))
  const activatedTools = acceptedToolIds.flatMap((toolId) => {
    const readiness = acceptedByTool.get(toolId)?.activatedToolCallReadiness
    if (!readiness) return []
    return [{
      toolId: readiness.toolId,
      capabilityId: readiness.capabilityId,
      routePath: readiness.routePath,
      routeId: readiness.routeId,
      gpuRuntimeTargetedTool: gpuTools.has(toolId as AiGraphicsToolId),
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAccepted: true,
      externalBetaToolCallReadyNow: true,
      runtimeReadyForOnDemandExternalBetaToolCall: true,
      gpuRuntimeOnDemandOnly: true,
      gpuRuntimeShouldStartNow: false,
      productionReadyNow: false,
    }]
  })

  if (missingToolIds.length > 0) {
    rejectionReasons.push(`missing accepted activation packets for ${missingToolIds.length} tools`)
  }
  if (duplicateToolIds.size > 0) {
    rejectionReasons.push(`duplicate accepted activation packets for ${duplicateToolIds.size} tools`)
  }

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_ALL_21_ACTIVATION_ROLLUP_DECISION,
    sourceActivationGoNoGoDecision:
      AI_GRAPHICS_EXTERNAL_BETA_ACTIVATION_GO_NO_GO_DECISION,
    status,
    rejectionReasons,
    acceptedToolIds,
    missingToolIds,
    duplicateToolIds: [...duplicateToolIds],
    externalBetaActivationGoNoGoAcceptedToolsWithProvidedEvidence:
      acceptedToolIds.length,
    sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedToolsWithProvidedEvidence:
      acceptedToolIds.length,
    externalBetaToolCallReadyNowTools: accepted ? 21 : 0,
    externalBetaReadyNowTools: accepted ? 21 : 0,
    runtimeReadyForOnDemandExternalBetaToolCallTools: accepted ? 21 : 0,
    productionReadyNowTools: 0,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeShouldStartNow: false,
    activatedTools,
    policy: {
      approvesAll21ExternalBetaToolCallReadinessMetadata: true,
      directAgentExecutionStillBlocked: true,
      runtimeStartsOnlyForAcceptedWorkerJob: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      noProductionUnlockByRollup: true,
      noPublicArtifactsByRollup: true,
      nextGateRequiresExternalBetaLaunchOwnerApproval: true,
    },
    booleans: {
      externalBetaAll21ActivationRollupPrepared: true,
      sourceActivationGoNoGoPacketsAcceptedWithProvidedEvidence:
        acceptedToolIds.length > 0,
      sourceRouteBoundServiceRoleQueueSmokeOperatorPreflightAcceptedWithProvidedEvidence:
        acceptedToolIds.length === 21,
      all21ActivationGoNoGoPacketsAcceptedWithProvidedEvidence: accepted,
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
      gpuRuntimePerformedByActivationRollup: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
