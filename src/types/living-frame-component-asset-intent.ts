import type {
  LivingFrameCapabilityKey,
  LivingFrameComponentRole,
  LivingFrameTransparencyExpectation,
} from './living-frame'
import type {
  EditWorkItemType,
} from './editing-agent-runtime'

export const LIVING_FRAME_COMPONENT_ASSET_INTENT_VERSION =
  'living-frame-component-asset-intent-v1' as const

export const LIVING_FRAME_COMPONENT_ASSET_INTENT_CLASS =
  'controlled_non_promotable_component_asset_intent_bundle' as const

export const LIVING_FRAME_COMPONENT_ASSET_INTENT_STATES = [
  'candidate_intents_compiled',
  'deliberate_non_use',
  'blocked_by_unsafe_or_unavailable_asset_route',
] as const
export type LivingFrameComponentAssetIntentState =
  (typeof LIVING_FRAME_COMPONENT_ASSET_INTENT_STATES)[number]

export const LIVING_FRAME_COMPONENT_ASSET_STAGES = [
  'source_or_generated_anchor',
  'alpha_or_mask_companion',
  'processed_component',
  'deterministic_component',
  'reconstructed_plate',
] as const
export type LivingFrameComponentAssetStage =
  (typeof LIVING_FRAME_COMPONENT_ASSET_STAGES)[number]

export const LIVING_FRAME_COMPONENT_ASSET_KINDS = [
  'approved_source_asset_reference',
  'generated_opaque_still_source',
  'controlled_opaque_still_variation_source',
  'processed_rgba_still_component',
  'still_alpha_mask',
  'temporal_subject_mask_sequence',
  'procedural_graphic_spec',
  'exact_map_spec',
  'exact_data_graphic_spec',
  'bounded_generated_video_clip',
  'reconstructed_background_plate_png',
] as const
export type LivingFrameComponentAssetKind =
  (typeof LIVING_FRAME_COMPONENT_ASSET_KINDS)[number]

export const LIVING_FRAME_COMPONENT_ASSET_BLOCKER_CODES = [
  'canonical_selected_scene_required',
  'canonical_synthesis_route_revalidation_required',
  'canonical_work_item_projection_required',
  'canonical_asset_manifest_projection_required',
  'canonical_tool_or_provider_route_required',
  'canonical_estimate_and_approval_required',
  'canonical_artifact_qa_required',
  'source_asset_lineage_required',
  'visual_continuity_revalidation_required',
  'still_alpha_generation_and_qa_required',
  'temporal_mask_generation_and_qa_required',
  'reconstructed_plate_dependencies_required',
  'bounded_video_with_still_alpha_is_unsupported',
  'unsafe_identity_or_adapter_route_blocked',
  'no_safe_asset_intent',
] as const
export type LivingFrameComponentAssetBlockerCode =
  (typeof LIVING_FRAME_COMPONENT_ASSET_BLOCKER_CODES)[number]

export interface LivingFrameComponentAssetIntent {
  readonly assetIntentId: string
  readonly order: number
  readonly sceneId: string
  readonly componentId: string
  readonly componentRole: LivingFrameComponentRole
  readonly stage: LivingFrameComponentAssetStage
  readonly assetKind: LivingFrameComponentAssetKind
  readonly dependencyAssetIntentIds: readonly string[]
  readonly capabilityKeys: readonly LivingFrameCapabilityKey[]
  readonly expectedNamedWorkItemTypes:
    readonly Exclude<EditWorkItemType, 'custom'>[]
  readonly transparencyExpectation:
    LivingFrameTransparencyExpectation
  readonly required: true
  readonly placeholderAllowedForPreviewOnly: boolean
  readonly finalRenderMayUsePlaceholder: false
  readonly canonicalAssetIdAssigned: false
  readonly canonicalWorkItemIdAssigned: false
}

export interface LivingFrameComponentAssetIntentMetrics {
  readonly sceneCount: number
  readonly componentCount: number
  readonly assetIntentCount: number
  readonly reusedSourceIntentCount: number
  readonly generatedStillSourceIntentCount: number
  readonly deterministicIntentCount: number
  readonly alphaOrMaskIntentCount: number
  readonly processedRgbaIntentCount: number
  readonly boundedVideoIntentCount: number
  readonly reconstructedPlateIntentCount: number
  readonly blockedComponentCount: number
}

export interface LivingFrameComponentAssetIntentAuthorityBoundary {
  readonly abstractAssetIntentPlanningOnly: true
  readonly selectedSceneAuthority: false
  readonly sourceAssetAuthority: false
  readonly continuityQaAuthority: false
  readonly exactFrameAuthority: false
  readonly masterTimingAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly modelWeightAuthority: false
  readonly workItemCreationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly artifactQaAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameComponentAssetIntentBundleDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPONENT_ASSET_INTENT_VERSION
  readonly intentClass:
    typeof LIVING_FRAME_COMPONENT_ASSET_INTENT_CLASS
  readonly intentState: LivingFrameComponentAssetIntentState
  readonly sourceBindings: {
    readonly semanticPlanProjectionDigestSha256: string
    readonly projectedComponentDigestSha256: string
    readonly synthesisRoutingDigestSha256: string
    readonly workAdmissionCatalogDigestSha256: string
  }
  readonly assetIntents:
    readonly LivingFrameComponentAssetIntent[]
  readonly blockedComponentIds: readonly string[]
  readonly blockerCodes:
    readonly LivingFrameComponentAssetBlockerCode[]
  readonly metrics: LivingFrameComponentAssetIntentMetrics
  readonly authorityBoundary:
    LivingFrameComponentAssetIntentAuthorityBoundary
  readonly existingAssetManifestRemainsAuthority: true
  readonly existingExecutionPlannerRemainsAuthority: true
  readonly customWorkItemAllowed: false
  readonly createsAssetManifestEntries: false
  readonly createsWorkItems: false
  readonly containsProviderModelToolOperationJobQueueCostOrCommercialRoute:
    false
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsExecutableCodeOrCommands: false
  readonly subjectSpecificRouting: false
  readonly promotionAllowed: false
}

export interface LivingFrameComponentAssetIntentBundle
  extends LivingFrameComponentAssetIntentBundleDraft {
  readonly bundleDigestSha256: string
}
