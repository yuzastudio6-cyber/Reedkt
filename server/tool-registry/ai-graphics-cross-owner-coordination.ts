import { productionToolProfiles } from './production-tool-profiles'
import type { ProductionToolId } from './production-tool-types'
import {
  AI_GRAPHICS_CANONICAL_TOOL_IDS,
  AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS,
  aiGraphicsToolCallReadinessRecords,
} from './ai-graphics-tool-call-readiness'

export const AI_GRAPHICS_CROSS_OWNER_COORDINATION_DECISION =
  'ai_graphics_cross_owner_coordination_verified_without_duplicate_owner_claims'

export const AI_GRAPHICS_OWNER_ROUTE = 'AI_TOOLS_CREATIVE_GRAPHICS'
export const TRACK_B_MEDIA_OWNER_ROUTE = 'TRACK_B_MEDIA_OSS_STEWARD'
export const TRACK_A_RENDER_EXPORT_OWNER_ROUTE = 'TRACK_A_RENDER_EXPORT'

export const TRACK_A_RENDER_EXPORT_EXCLUDED_PRODUCTION_TOOL_IDS: readonly ProductionToolId[] = [
  'remotion',
  'revideo',
] as const

export const TRACK_A_RENDER_EXPORT_EXCLUDED_PACKAGE_NAMES = [
  '@remotion/renderer',
] as const

export const NON_AI_GRAPHICS_RESERVED_PRODUCTION_TOOL_IDS: readonly ProductionToolId[] = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'opentimelineio',
  'hyperframe',
  'remotion',
  'libass',
  'sharp',
  'duckdb',
  'polars',
  'faster_whisper',
  'whisper_cpp',
  'paddleocr',
  'pyscenedetect',
  'opencv',
  'mediapipe',
  'opencolorio',
  'openimageio',
  'deepfilternet',
  'rnnoise',
  'demucs',
  'librosa',
  'audioflux',
  'signalsmith_stretch',
  'soundtouch',
  'rubber_band',
  'essentia',
  'film',
  'playwright',
  'maplibre',
  'turf',
  'deck_gl',
  'cesium_js',
  'vapoursynth',
  'revideo',
] as const

export interface AiGraphicsCrossOwnerCoordinationPacket {
  decision: typeof AI_GRAPHICS_CROSS_OWNER_COORDINATION_DECISION
  status: 'verified_with_runtime_blocks'
  ownerRoute: typeof AI_GRAPHICS_OWNER_ROUTE
  counts: {
    canonicalAiGraphicsTools: 21
    toolCallRecords: number
    productionToolMappings: number
    uniqueAiGraphicsProductionToolIds: number
    productionRegistryProfiles: number
    productionRegistryDuplicateToolIds: number
    missingProductionProfiles: number
    duplicateCanonicalToolIds: number
    duplicateProductionToolIds: number
    trackAExcludedOverlaps: number
    nonAiGraphicsReservedOverlaps: number
    productFacingCapabilityIds: number
  }
  booleans: {
    crossOwnerCoordinationVerified: true
    all21AiGraphicsToolsCovered: boolean
    allAiGraphicsProductionMappingsPresent: boolean
    allAiGraphicsProductionMappingsUnique: boolean
    allAiGraphicsProductionProfilesExist: boolean
    productionRegistryToolIdsUnique: boolean
    trackAExcludedToolsNotClaimed: boolean
    trackBExclusionPreservedAsEvidenceOnly: true
    nonAiGraphicsReservedToolIdsNotClaimed: boolean
    internalOwnerLabelsNotProductCapabilityIds: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
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
    modelWeightsDownloaded: false
    mediaProcessingPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
  aiGraphicsProductionToolIds: ProductionToolId[]
  productionToolIdByCanonicalToolId: Record<string, ProductionToolId | null>
  duplicateCanonicalToolIds: string[]
  duplicateProductionToolIds: ProductionToolId[]
  productionRegistryDuplicateToolIds: ProductionToolId[]
  missingProductionProfiles: ProductionToolId[]
  trackAExcludedOverlaps: ProductionToolId[]
  nonAiGraphicsReservedOverlaps: ProductionToolId[]
  ownerExclusionEvidence: {
    trackA: {
      ownerRoute: typeof TRACK_A_RENDER_EXPORT_OWNER_ROUTE
      excludedProductionToolIds: readonly ProductionToolId[]
      excludedPackageNames: readonly string[]
      evidence: string[]
    }
    trackB: {
      ownerRoute: typeof TRACK_B_MEDIA_OWNER_ROUTE
      status: 'evidence_only_exclusion_context'
      evidence: string[]
    }
  }
  coordinationNotes: string[]
}

function duplicateValues<T extends string>(values: readonly T[]): T[] {
  const seen = new Set<T>()
  const duplicates = new Set<T>()

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value)
    } else {
      seen.add(value)
    }
  }

  return [...duplicates]
}

export function buildAiGraphicsCrossOwnerCoordinationPacket(): AiGraphicsCrossOwnerCoordinationPacket {
  const canonicalToolIds = [...AI_GRAPHICS_CANONICAL_TOOL_IDS]
  const productionToolIdByCanonicalToolId = Object.fromEntries(
    aiGraphicsToolCallReadinessRecords.map((record) => [record.toolId, record.productionToolId]),
  ) as Record<string, ProductionToolId | null>

  const aiGraphicsProductionToolIds = aiGraphicsToolCallReadinessRecords
    .map((record) => record.productionToolId)
    .filter((toolId): toolId is ProductionToolId => toolId !== null)

  const productionRegistryToolIds = productionToolProfiles.map((profile) => profile.toolId)
  const productionRegistryDuplicateToolIds = duplicateValues(productionRegistryToolIds)
  const duplicateCanonicalToolIds = duplicateValues(aiGraphicsToolCallReadinessRecords.map((record) => record.toolId))
  const duplicateProductionToolIds = duplicateValues(aiGraphicsProductionToolIds)
  const productionRegistryToolIdSet = new Set(productionRegistryToolIds)
  const missingProductionProfiles = aiGraphicsProductionToolIds.filter((toolId) => !productionRegistryToolIdSet.has(toolId))
  const trackAExcludedOverlaps = aiGraphicsProductionToolIds.filter((toolId) =>
    TRACK_A_RENDER_EXPORT_EXCLUDED_PRODUCTION_TOOL_IDS.includes(toolId),
  )
  const nonAiGraphicsReservedOverlaps = aiGraphicsProductionToolIds.filter((toolId) =>
    NON_AI_GRAPHICS_RESERVED_PRODUCTION_TOOL_IDS.includes(toolId),
  )
  const productFacingCapabilities = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter(
    (capabilityId) => !['planning_metadata_only', 'blocked_or_deferred'].includes(capabilityId),
  )
  const internalOwnerLabelsInCapabilities = AI_GRAPHICS_TOOL_CALL_CAPABILITY_IDS.filter((capabilityId) =>
    /track_a|track_b|atlas|owner/i.test(capabilityId),
  )

  return {
    decision: AI_GRAPHICS_CROSS_OWNER_COORDINATION_DECISION,
    status: 'verified_with_runtime_blocks',
    ownerRoute: AI_GRAPHICS_OWNER_ROUTE,
    counts: {
      canonicalAiGraphicsTools: canonicalToolIds.length as 21,
      toolCallRecords: aiGraphicsToolCallReadinessRecords.length,
      productionToolMappings: aiGraphicsProductionToolIds.length,
      uniqueAiGraphicsProductionToolIds: new Set(aiGraphicsProductionToolIds).size,
      productionRegistryProfiles: productionToolProfiles.length,
      productionRegistryDuplicateToolIds: productionRegistryDuplicateToolIds.length,
      missingProductionProfiles: missingProductionProfiles.length,
      duplicateCanonicalToolIds: duplicateCanonicalToolIds.length,
      duplicateProductionToolIds: duplicateProductionToolIds.length,
      trackAExcludedOverlaps: trackAExcludedOverlaps.length,
      nonAiGraphicsReservedOverlaps: nonAiGraphicsReservedOverlaps.length,
      productFacingCapabilityIds: productFacingCapabilities.length,
    },
    booleans: {
      crossOwnerCoordinationVerified: true,
      all21AiGraphicsToolsCovered: aiGraphicsToolCallReadinessRecords.length === 21,
      allAiGraphicsProductionMappingsPresent: aiGraphicsProductionToolIds.length === 21,
      allAiGraphicsProductionMappingsUnique: duplicateProductionToolIds.length === 0,
      allAiGraphicsProductionProfilesExist: missingProductionProfiles.length === 0,
      productionRegistryToolIdsUnique: productionRegistryDuplicateToolIds.length === 0,
      trackAExcludedToolsNotClaimed: trackAExcludedOverlaps.length === 0,
      trackBExclusionPreservedAsEvidenceOnly: true,
      nonAiGraphicsReservedToolIdsNotClaimed: nonAiGraphicsReservedOverlaps.length === 0,
      internalOwnerLabelsNotProductCapabilityIds: internalOwnerLabelsInCapabilities.length === 0,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
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
      modelWeightsDownloaded: false,
      mediaProcessingPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    aiGraphicsProductionToolIds,
    productionToolIdByCanonicalToolId,
    duplicateCanonicalToolIds,
    duplicateProductionToolIds,
    productionRegistryDuplicateToolIds,
    missingProductionProfiles,
    trackAExcludedOverlaps,
    nonAiGraphicsReservedOverlaps,
    ownerExclusionEvidence: {
      trackA: {
        ownerRoute: TRACK_A_RENDER_EXPORT_OWNER_ROUTE,
        excludedProductionToolIds: TRACK_A_RENDER_EXPORT_EXCLUDED_PRODUCTION_TOOL_IDS,
        excludedPackageNames: TRACK_A_RENDER_EXPORT_EXCLUDED_PACKAGE_NAMES,
        evidence: [
          'PR #544 Track A render/export owner context',
          'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-batch-3-excluded-tools.md',
          'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.json',
        ],
      },
      trackB: {
        ownerRoute: TRACK_B_MEDIA_OWNER_ROUTE,
        status: 'evidence_only_exclusion_context',
        evidence: [
          'PR #542 Track B media OSS steward owner registry',
          'PR #543 owner assignment and conflict sync',
          'Track B labels are evidence-only context, not AI graphics product-facing capability categories',
        ],
      },
    },
    coordinationNotes: [
      'AI graphics owns only the 21 canonical tool-call planning records in this packet.',
      'Track A render/export tools remain excluded from AI graphics ownership and execution claims.',
      'Track B media ownership remains evidence-only exclusion context for this AI graphics lane.',
      'Production registry aliases are intentional for lottie_web -> lottie, pixi_js -> pixijs, and babylonjs -> babylon_js.',
      'This packet verifies uniqueness and owner boundaries; it does not execute tools or unlock runtime.',
    ],
  }
}
