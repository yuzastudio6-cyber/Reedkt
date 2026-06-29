import {
  AI_GRAPHICS_BETA_ACTIVATION_GAP_REPORT_DECISION,
  buildAiGraphicsBetaActivationGapReport,
  type AiGraphicsBetaActivationGapReport,
} from './ai-graphics-beta-activation-gap-report'
import {
  AI_GRAPHICS_CROSS_OWNER_COORDINATION_DECISION,
  buildAiGraphicsCrossOwnerCoordinationPacket,
  type AiGraphicsCrossOwnerCoordinationPacket,
} from './ai-graphics-cross-owner-coordination'
import {
  AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_GATE_READINESS_DECISION,
  buildAiGraphicsInternalBetaProductionWorkerGateReadiness,
  type AiGraphicsInternalBetaProductionWorkerGateReadiness,
  type AiGraphicsInternalBetaProductionWorkerGateReadinessInput,
} from './ai-graphics-internal-beta-production-worker-gate-readiness'
import {
  AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION,
  type AiGraphicsExternalBetaNativeGpuProofCollection,
} from './ai-graphics-external-beta-native-gpu-proof-collection'
import {
  AI_GRAPHICS_EXTERNAL_BETA_ACTIVATED_LAUNCH_READINESS_DECISION,
  type AiGraphicsExternalBetaActivatedLaunchReadiness,
} from './ai-graphics-external-beta-activated-launch-readiness'

export const AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION =
  'ai_graphics_beta_production_readiness_rollup_prepared_with_runtime_blocks'

export type AiGraphicsBetaProductionReadinessRollupStatus =
  | 'missing_technical_evidence'
  | 'awaiting_owner_approval'
  | 'owner_approved_worker_gates_ready_runtime_still_blocked'

export interface AiGraphicsBetaProductionReadinessRollupInput
  extends AiGraphicsInternalBetaProductionWorkerGateReadinessInput {
  sourceProductionWorkerGateReadinessPacket?: AiGraphicsInternalBetaProductionWorkerGateReadiness
  sourceExternalBetaNativeGpuProofCollectionPacket?: AiGraphicsExternalBetaNativeGpuProofCollection
  sourceExternalBetaActivatedLaunchReadinessPacket?: AiGraphicsExternalBetaActivatedLaunchReadiness
}

export interface AiGraphicsBetaProductionReadinessRollup {
  decision: typeof AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION
  sourceActivationGapDecision: typeof AI_GRAPHICS_BETA_ACTIVATION_GAP_REPORT_DECISION
  sourceCrossOwnerCoordinationDecision: typeof AI_GRAPHICS_CROSS_OWNER_COORDINATION_DECISION
  sourceProductionWorkerGateDecision: typeof AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_GATE_READINESS_DECISION
  sourceExternalBetaNativeGpuProofCollectionDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION
  sourceExternalBetaActivatedLaunchReadinessDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_ACTIVATED_LAUNCH_READINESS_DECISION | null
  status: AiGraphicsBetaProductionReadinessRollupStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  properlyInstalledForPlannedSurface: 21
  productionMappedTools: 21
  duplicateProductionMappings: 0
  gpuRuntimeTargetedTools: number
  gpuRuntimeTargetsExact: boolean
  gpuRuntimeOnDemandOnly: true
  expectedGpuRuntimeTargets: Record<string, string>
  heavyToolsIncorrectlyTargetingCpu: 0
  productionWorkerGateChecksAcceptedWithProvidedEvidence: number
  capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence: number
  hardFailedProductionWorkerGateChecksWithProvidedEvidence: number
  nativeGpuProofCollectionAcceptedWithProvidedEvidence: boolean
  nativeGpuProofCollectionReadyForPerToolRuntimeProofRecheck: boolean
  nativeGpuProofCollectionStatus: AiGraphicsExternalBetaNativeGpuProofCollection['decision'] | null
  nativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence: number
  nativeGpuRuntimeProofProfilesAcceptedWithProvidedEvidence: number
  modelWeightManifestReviewAcceptedWithProvidedEvidence: number
  internalBetaReadyNowTools: 0
  externalBetaReadyNowTools: 0 | 21
  productionReadyNowTools: 0
  activationGapReport: AiGraphicsBetaActivationGapReport
  crossOwnerCoordination: AiGraphicsCrossOwnerCoordinationPacket
  productionWorkerGateReadiness: AiGraphicsInternalBetaProductionWorkerGateReadiness
  requiredFinalGoNoGoGates: string[]
  stillBlockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    betaProductionReadinessRollupPrepared: true
    sourceActivationGapAccepted: true
    sourceCrossOwnerCoordinationAccepted: boolean
    sourceProductionWorkerGateAcceptedWithProvidedEvidence: boolean
    sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence: boolean
    nativeGpuProofCollectionReadyForPerToolRuntimeProofRecheck: boolean
    nativeGpuRuntimeProofAcceptedForAll8GpuToolsWithProvidedEvidence: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ToolsProperlyInstalledForPlannedSurface: boolean
    all21ToolsMappedToProductionRegistry: boolean
    noDuplicateProductionMappings: boolean
    gpuHeavyToolsTargetGpuRuntime: boolean
    gpuRuntimeTargetsExact: boolean
    gpuRuntimeOnDemandOnly: true
    productionWorkerGateHardFailuresWithProvidedEvidenceAbsent: boolean
    internalBetaGoNoGoReadyWithProvidedEvidence: boolean
    externalBetaGoNoGoReadyWithProvidedEvidence: boolean
    externalBetaActivatedLaunchReadyWithProvidedEvidence: boolean
    productionGoNoGoReadyWithProvidedEvidence: false
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    productionWorkerJobEnqueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    productionWorkerRouteExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: boolean
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    routeExecutionPerformed: false
    productionWorkerDispatchPerformed: false
    productionWorkerRouteExecutionPerformed: false
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

const requiredFinalGoNoGoGates = [
  'accepted all-21 install and production mapping audit',
  'accepted cross-owner duplicate and reserved-tool coordination',
  'accepted model-weight manifest review packet for private model tools',
  'accepted native NVIDIA L4 GPU runtime proof packet',
  'accepted committed Node/browser/Satori runtime proof packets',
  'accepted approved-plan snapshot gate',
  'accepted credit reservation gate',
  'accepted artifact boundary gate',
  'accepted Tool Route approval gate',
  'accepted Worker approval gate',
  'accepted production worker gate checks',
  'accepted external beta service-role queue smoke preflight',
  'accepted saved external beta service-role queue smoke proof',
  'explicit internal beta owner go/no-go approval',
  'accepted external beta activated-launch readiness',
  'separate production launch approval',
]

const stillBlockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'Worker queue enqueue',
  'Worker execution',
  'live service-role queue writes',
  'production worker dispatch',
  'production worker route execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'internal beta runtime unlock',
  'production unlock',
]

const nextMilestones = [
  'Feed an accepted external beta native GPU proof collection packet into the rollup before the final external-beta go/no-go.',
  'Re-run the external per-tool runtime proof gate after accepted native GPU collection evidence is available.',
  'Run the all-technical-gates-plus-owner-approval rollup and confirm 21 production worker gate checks are accepted with zero hard failures and native GPU proof collection is ready for per-tool recheck.',
  'Preserve the external-beta service-role queue smoke preflight and accepted saved smoke proof before any external beta launch decision.',
  'Complete a separate internal beta go/no-go owner packet that explicitly authorizes runtime enqueue/dispatch scope.',
  'After internal beta evidence exists, run separate external beta and production launch reviews; this rollup never unlocks them by itself.',
]

function statusFromGate(
  gate: AiGraphicsInternalBetaProductionWorkerGateReadiness,
): AiGraphicsBetaProductionReadinessRollupStatus {
  if (gate.status === 'missing_technical_evidence') return 'missing_technical_evidence'
  if (gate.status === 'awaiting_owner_approval') return 'awaiting_owner_approval'
  return 'owner_approved_worker_gates_ready_runtime_still_blocked'
}

function nativeGpuProofCollectionAccepted(
  packet?: AiGraphicsExternalBetaNativeGpuProofCollection,
): boolean {
  return Boolean(packet) &&
    packet?.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION &&
    packet?.decision === 'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready' &&
    packet?.counts.nativeGpuRuntimeProofAcceptedTools === 8 &&
    packet?.counts.nativeGpuRuntimeProofProfilesAccepted === 6 &&
    packet?.counts.cloudRunResultCollectorProfilesAccepted === 6 &&
    packet?.counts.sourceCloudRunResultCollectorBridgeAcceptedWithProvidedEvidence === 6 &&
    packet?.counts.modelWeightManifestReviewAccepted === 5 &&
    packet?.counts.blockedPendingNativeGpuRuntimeProofTools === 0 &&
    packet?.sourceCloudRunResultCollectorAccepted === true &&
    packet?.booleans.sourceCloudRunResultCollectorAccepted === true &&
    packet?.booleans.readyForPerToolRuntimeProofRecheck === true &&
    packet?.booleans.gpuRuntimeOnDemandOnly === true &&
    packet?.booleans.noIdleGpuRuntimeApproved === true &&
    packet?.booleans.cpuFallbackAllowedForHeavyTools === false &&
    packet?.booleans.agentCanExecuteToolsNow === false &&
    packet?.booleans.gpuRuntimeApprovedNow === false &&
    packet?.booleans.gpuRuntimeShouldStartNow === false &&
    packet?.booleans.modelWeightsLoaded === false &&
    packet?.booleans.modelInferencePerformed === false &&
    packet?.booleans.externalBetaReadyNow === false &&
    packet?.booleans.productionReadyNow === false
}

function externalBetaActivatedLaunchReadinessAccepted(
  packet?: AiGraphicsExternalBetaActivatedLaunchReadiness,
): boolean {
  const scope = (packet as unknown as {
    scope?: {
      totalAiGraphicsTools?: number
      productFacingCapabilities?: number
      gpuRuntimeTargetedTools?: number
      externalBetaActivatedLaunchReadyToolsWithProvidedEvidence?: number
      externalBetaToolCallReadyNowTools?: number
      externalBetaReadyNowTools?: number
      runtimeReadyForOnDemandExternalBetaToolCallTools?: number
      productionReadyNowTools?: number
    }
  } | undefined)?.scope
  const totalAiGraphicsTools = packet?.totalAiGraphicsTools ?? scope?.totalAiGraphicsTools
  const totalProductFacingCapabilities =
    packet?.totalProductFacingCapabilities ?? scope?.productFacingCapabilities
  const gpuRuntimeTargetedTools =
    packet?.gpuRuntimeTargetedTools ?? scope?.gpuRuntimeTargetedTools
  const externalBetaActivatedLaunchReadyToolsWithProvidedEvidence =
    packet?.externalBetaActivatedLaunchReadyToolsWithProvidedEvidence ??
    scope?.externalBetaActivatedLaunchReadyToolsWithProvidedEvidence
  const externalBetaToolCallReadyNowTools =
    packet?.externalBetaToolCallReadyNowTools ?? scope?.externalBetaToolCallReadyNowTools
  const externalBetaReadyNowTools =
    packet?.externalBetaReadyNowTools ?? scope?.externalBetaReadyNowTools
  const runtimeReadyForOnDemandExternalBetaToolCallTools =
    packet?.runtimeReadyForOnDemandExternalBetaToolCallTools ??
    scope?.runtimeReadyForOnDemandExternalBetaToolCallTools
  const productionReadyNowTools =
    packet?.productionReadyNowTools ?? scope?.productionReadyNowTools
  const gpuRuntimeShouldStartNow =
    packet?.gpuRuntimeShouldStartNow ?? packet?.booleans.gpuRuntimeShouldStartNow

  return Boolean(packet) &&
    packet?.decision === AI_GRAPHICS_EXTERNAL_BETA_ACTIVATED_LAUNCH_READINESS_DECISION &&
    packet.status ===
      'external_beta_activated_launch_ready_for_controlled_on_demand_tool_calls' &&
    totalAiGraphicsTools === 21 &&
    totalProductFacingCapabilities === 12 &&
    gpuRuntimeTargetedTools === 8 &&
    externalBetaActivatedLaunchReadyToolsWithProvidedEvidence === 21 &&
    externalBetaToolCallReadyNowTools === 21 &&
    externalBetaReadyNowTools === 21 &&
    runtimeReadyForOnDemandExternalBetaToolCallTools === 21 &&
    productionReadyNowTools === 0 &&
    gpuRuntimeShouldStartNow === false &&
    packet.booleans.sourceExternalBetaLaunchGoNoGoAccepted === true &&
    packet.booleans.sourceExternalBetaAll21ActivationRollupAccepted === true &&
    packet.booleans.all21ExternalBetaActivatedLaunchReadyWithProvidedEvidence === true &&
    packet.booleans.externalBetaReadyNow === true &&
    packet.booleans.agentCanExecuteToolsNow === false &&
    packet.booleans.routeExecutionApprovedNow === false &&
    packet.booleans.workerExecutionApprovedNow === false &&
    packet.booleans.toolExecutionApprovedNow === false &&
    packet.booleans.gpuRuntimeApprovedNow === false &&
    packet.booleans.gpuRuntimeShouldStartNow === false &&
    packet.booleans.productionReadyNow === false
}

export function buildAiGraphicsBetaProductionReadinessRollup(
  input: AiGraphicsBetaProductionReadinessRollupInput = {},
): AiGraphicsBetaProductionReadinessRollup {
  const nestedEvidenceBundleInput = {
    ...(input.evidenceBundleInput ?? {}),
    sourceExternalBetaNativeGpuProofCollectionPacket:
      input.evidenceBundleInput?.sourceExternalBetaNativeGpuProofCollectionPacket ??
      input.sourceExternalBetaNativeGpuProofCollectionPacket,
  }
  const evidenceBundle = input.evidenceBundle
  const activationGapReport = buildAiGraphicsBetaActivationGapReport({
    nodeRuntimeProofAccepted: Boolean(input.evidenceBundleInput?.nodeRuntimeProofPacket) ||
      evidenceBundle?.evidenceSources.nodeRuntimeProofPacketAccepted === true,
    browserRuntimeProofAccepted: Boolean(input.evidenceBundleInput?.browserRuntimeProofPacket) ||
      input.evidenceBundleInput?.browserCanvasWebglSandboxPassed === true ||
      evidenceBundle?.evidenceSources.browserRuntimeProofPacketAccepted === true ||
      evidenceBundle?.evidence.browserCanvasWebglSandboxPassed === true,
    satoriFontRuntimeProofAccepted: Boolean(input.evidenceBundleInput?.satoriFontRuntimeProofPacket) ||
      evidenceBundle?.evidenceSources.satoriFontRuntimeProofPacketAccepted === true,
  })
  const crossOwnerCoordination = buildAiGraphicsCrossOwnerCoordinationPacket()
  const productionWorkerGateReadiness =
    input.sourceProductionWorkerGateReadinessPacket ??
    buildAiGraphicsInternalBetaProductionWorkerGateReadiness({
      ...input,
      evidenceBundleInput: nestedEvidenceBundleInput,
    })
  const status = statusFromGate(productionWorkerGateReadiness)
  const sourceProductionWorkerGateAcceptedWithProvidedEvidence =
    productionWorkerGateReadiness.ownerApprovedProductionWorkerGateEvidenceAccepted &&
    productionWorkerGateReadiness.productionWorkerGateChecksAcceptedWithProvidedEvidence === 21 &&
    productionWorkerGateReadiness.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence === 12 &&
    productionWorkerGateReadiness.hardFailedGateChecksWithProvidedEvidence === 0
  const sourceCrossOwnerCoordinationAccepted =
    crossOwnerCoordination.booleans.all21AiGraphicsToolsCovered &&
    crossOwnerCoordination.booleans.allAiGraphicsProductionMappingsPresent &&
    crossOwnerCoordination.booleans.allAiGraphicsProductionMappingsUnique &&
    crossOwnerCoordination.booleans.trackAExcludedToolsNotClaimed &&
    crossOwnerCoordination.booleans.nonAiGraphicsReservedToolIdsNotClaimed
  const sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence =
    nativeGpuProofCollectionAccepted(input.sourceExternalBetaNativeGpuProofCollectionPacket)
  const nativeGpuProofCollectionReadyForPerToolRuntimeProofRecheck =
    sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence &&
    input.sourceExternalBetaNativeGpuProofCollectionPacket?.booleans.readyForPerToolRuntimeProofRecheck === true
  const sourceExternalBetaActivatedLaunchReadinessAcceptedWithProvidedEvidence =
    externalBetaActivatedLaunchReadinessAccepted(
      input.sourceExternalBetaActivatedLaunchReadinessPacket,
    )
  const nativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence =
    sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence
      ? input.sourceExternalBetaNativeGpuProofCollectionPacket?.counts.nativeGpuRuntimeProofAcceptedTools ?? 0
      : 0
  const nativeGpuRuntimeProofProfilesAcceptedWithProvidedEvidence =
    sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence
      ? input.sourceExternalBetaNativeGpuProofCollectionPacket?.counts.nativeGpuRuntimeProofProfilesAccepted ?? 0
      : 0
  const modelWeightManifestReviewAcceptedWithProvidedEvidence =
    sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence
      ? input.sourceExternalBetaNativeGpuProofCollectionPacket?.counts.modelWeightManifestReviewAccepted ?? 0
      : 0

  return {
    decision: AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION,
    sourceActivationGapDecision: AI_GRAPHICS_BETA_ACTIVATION_GAP_REPORT_DECISION,
    sourceCrossOwnerCoordinationDecision: AI_GRAPHICS_CROSS_OWNER_COORDINATION_DECISION,
    sourceProductionWorkerGateDecision:
      AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_GATE_READINESS_DECISION,
    sourceExternalBetaNativeGpuProofCollectionDecision:
      AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION,
    sourceExternalBetaActivatedLaunchReadinessDecision:
      input.sourceExternalBetaActivatedLaunchReadinessPacket?.decision ?? null,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    properlyInstalledForPlannedSurface: 21,
    productionMappedTools: 21,
    duplicateProductionMappings: 0,
    gpuRuntimeTargetedTools: activationGapReport.gpuRuntimeTargetedTools.length,
    gpuRuntimeTargetsExact: activationGapReport.booleans.gpuRuntimeTargetsExact,
    gpuRuntimeOnDemandOnly: true,
    expectedGpuRuntimeTargets: activationGapReport.expectedGpuRuntimeTargets,
    heavyToolsIncorrectlyTargetingCpu: 0,
    productionWorkerGateChecksAcceptedWithProvidedEvidence:
      productionWorkerGateReadiness.productionWorkerGateChecksAcceptedWithProvidedEvidence,
    capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence:
      productionWorkerGateReadiness.capabilityProductionWorkerGateScenariosAcceptedWithProvidedEvidence,
    hardFailedProductionWorkerGateChecksWithProvidedEvidence:
      productionWorkerGateReadiness.hardFailedGateChecksWithProvidedEvidence,
    nativeGpuProofCollectionAcceptedWithProvidedEvidence:
      sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence,
    nativeGpuProofCollectionReadyForPerToolRuntimeProofRecheck,
    nativeGpuProofCollectionStatus:
      input.sourceExternalBetaNativeGpuProofCollectionPacket?.decision ?? null,
    nativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence,
    nativeGpuRuntimeProofProfilesAcceptedWithProvidedEvidence,
    modelWeightManifestReviewAcceptedWithProvidedEvidence,
    internalBetaReadyNowTools: 0,
    externalBetaReadyNowTools:
      sourceExternalBetaActivatedLaunchReadinessAcceptedWithProvidedEvidence ? 21 : 0,
    productionReadyNowTools: 0,
    activationGapReport,
    crossOwnerCoordination,
    productionWorkerGateReadiness,
    requiredFinalGoNoGoGates,
    stillBlockedRuntimeActions,
    nextMilestones,
    booleans: {
      betaProductionReadinessRollupPrepared: true,
      sourceActivationGapAccepted: true,
      sourceCrossOwnerCoordinationAccepted,
      sourceProductionWorkerGateAcceptedWithProvidedEvidence,
      sourceExternalBetaNativeGpuProofCollectionAcceptedWithProvidedEvidence,
      nativeGpuProofCollectionReadyForPerToolRuntimeProofRecheck,
      nativeGpuRuntimeProofAcceptedForAll8GpuToolsWithProvidedEvidence:
        nativeGpuRuntimeProofAcceptedToolsWithProvidedEvidence === 8,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ToolsProperlyInstalledForPlannedSurface:
        activationGapReport.properInstallForPlannedSurface === 21,
      all21ToolsMappedToProductionRegistry:
        activationGapReport.productionMappedTools === 21,
      noDuplicateProductionMappings:
        activationGapReport.duplicateProductionMappings === 0 &&
        crossOwnerCoordination.counts.duplicateProductionToolIds === 0,
      gpuHeavyToolsTargetGpuRuntime:
        activationGapReport.gpuRuntimeTargetedTools.length === 8 &&
        activationGapReport.heavyToolsIncorrectlyTargetingCpu === 0,
      gpuRuntimeTargetsExact: activationGapReport.booleans.gpuRuntimeTargetsExact,
      gpuRuntimeOnDemandOnly: true,
      productionWorkerGateHardFailuresWithProvidedEvidenceAbsent:
        productionWorkerGateReadiness.hardFailedGateChecksWithProvidedEvidence === 0,
      internalBetaGoNoGoReadyWithProvidedEvidence:
        sourceProductionWorkerGateAcceptedWithProvidedEvidence,
      externalBetaGoNoGoReadyWithProvidedEvidence:
        sourceExternalBetaActivatedLaunchReadinessAcceptedWithProvidedEvidence,
      externalBetaActivatedLaunchReadyWithProvidedEvidence:
        sourceExternalBetaActivatedLaunchReadinessAcceptedWithProvidedEvidence,
      productionGoNoGoReadyWithProvidedEvidence: false,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      productionWorkerJobEnqueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      productionWorkerRouteExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow:
        sourceExternalBetaActivatedLaunchReadinessAcceptedWithProvidedEvidence,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      productionWorkerDispatchPerformed: false,
      productionWorkerRouteExecutionPerformed: false,
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
