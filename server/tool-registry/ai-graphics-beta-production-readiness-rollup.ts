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
}

export interface AiGraphicsBetaProductionReadinessRollup {
  decision: typeof AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION
  sourceActivationGapDecision: typeof AI_GRAPHICS_BETA_ACTIVATION_GAP_REPORT_DECISION
  sourceCrossOwnerCoordinationDecision: typeof AI_GRAPHICS_CROSS_OWNER_COORDINATION_DECISION
  sourceProductionWorkerGateDecision: typeof AI_GRAPHICS_INTERNAL_BETA_PRODUCTION_WORKER_GATE_READINESS_DECISION
  sourceExternalBetaNativeGpuProofCollectionDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_NATIVE_GPU_PROOF_COLLECTION_DECISION
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
  externalBetaReadyNowTools: 0
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
    externalBetaGoNoGoReadyWithProvidedEvidence: false
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
    externalBetaReadyNow: false
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
  'explicit internal beta owner go/no-go approval',
  'separate external beta approval',
  'separate production launch approval',
]

const stillBlockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'Worker queue enqueue',
  'Worker execution',
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
  'external beta unlock',
  'production unlock',
]

const nextMilestones = [
  'Feed an accepted external beta native GPU proof collection packet into the rollup before the final external-beta go/no-go.',
  'Re-run the external per-tool runtime proof gate after accepted native GPU collection evidence is available.',
  'Run the all-technical-gates-plus-owner-approval rollup and confirm 21 production worker gate checks are accepted with zero hard failures and native GPU proof collection is ready for per-tool recheck.',
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
    packet?.counts.modelWeightManifestReviewAccepted === 5 &&
    packet?.counts.blockedPendingNativeGpuRuntimeProofTools === 0 &&
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

export function buildAiGraphicsBetaProductionReadinessRollup(
  input: AiGraphicsBetaProductionReadinessRollupInput = {},
): AiGraphicsBetaProductionReadinessRollup {
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
    buildAiGraphicsInternalBetaProductionWorkerGateReadiness(input)
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
    externalBetaReadyNowTools: 0,
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
      externalBetaGoNoGoReadyWithProvidedEvidence: false,
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
      externalBetaReadyNow: false,
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
