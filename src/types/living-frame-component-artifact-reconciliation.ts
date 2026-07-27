import type {
  LivingFrameComponentAssetKind,
} from './living-frame-component-asset-intent'
import type {
  LivingFrameTransparencyExpectation,
} from './living-frame'
import type {
  LivingFrameSceneArtifactKind,
  LivingFrameSceneArtifactRef,
} from './living-frame-scene-evidence-package'

export const LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_VERSION =
  'living-frame-component-artifact-reconciliation-v1' as const

export const LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_CLASS =
  'controlled_non_promotable_component_artifact_lineage_candidate' as const

export const LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_STATES = [
  'candidate_lineage_structurally_reconciled',
  'blocked_by_evidence_or_lineage',
  'deliberate_non_use',
] as const
export type LivingFrameComponentArtifactReconciliationState =
  (typeof LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_STATES)[number]

export const LIVING_FRAME_COMPONENT_ARTIFACT_MATCH_KINDS = [
  'opaque_source_candidate',
  'processed_rgba_candidate',
  'source_with_temporal_mask_candidate',
  'deterministic_alpha_candidate',
  'deterministic_raster_candidate',
  'reconstructed_plate_candidate',
  'unsupported_bounded_video_candidate',
] as const
export type LivingFrameComponentArtifactMatchKind =
  (typeof LIVING_FRAME_COMPONENT_ARTIFACT_MATCH_KINDS)[number]

export const LIVING_FRAME_COMPONENT_ARTIFACT_MATCH_STATES = [
  'structurally_compatible_pending_canonical_lineage',
  'incompatible',
] as const
export type LivingFrameComponentArtifactMatchState =
  (typeof LIVING_FRAME_COMPONENT_ARTIFACT_MATCH_STATES)[number]

export const LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_BLOCKERS = [
  'canonical_selected_scene_required',
  'canonical_current_artifact_reread_required',
  'canonical_artifact_origin_lineage_required',
  'canonical_work_output_lineage_required',
  'canonical_asset_manifest_lineage_required',
  'canonical_artifact_qa_required',
  'scene_evidence_blocked',
  'component_intent_chain_missing',
  'component_intent_chain_not_terminal',
  'artifact_kind_incompatible_with_asset_intent',
  'mask_artifact_incompatible_with_asset_intent',
  'bounded_video_artifact_kind_not_supported',
] as const
export type LivingFrameComponentArtifactReconciliationBlocker =
  (typeof LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_BLOCKERS)[number]

export interface LivingFrameComponentArtifactIntentRef {
  readonly assetIntentId: string
  readonly assetKind: LivingFrameComponentAssetKind
}

export interface LivingFrameComponentArtifactReconciliationBinding {
  readonly order: number
  readonly sceneId: string
  readonly componentId: string
  readonly orderedAssetIntentIds: readonly string[]
  readonly expectedArtifactIntent:
    LivingFrameComponentArtifactIntentRef | null
  readonly expectedMaskIntent:
    LivingFrameComponentArtifactIntentRef | null
  readonly transparencyExpectation:
    LivingFrameTransparencyExpectation
  readonly artifactKind: LivingFrameSceneArtifactKind
  readonly artifact: LivingFrameSceneArtifactRef
  readonly maskArtifact: LivingFrameSceneArtifactRef | null
  readonly matchKind: LivingFrameComponentArtifactMatchKind
  readonly matchState: LivingFrameComponentArtifactMatchState
  readonly blockerCodes:
    readonly LivingFrameComponentArtifactReconciliationBlocker[]
  readonly canonicalArtifactOriginProven: false
  readonly canonicalWorkOutputLineageProven: false
  readonly canonicalAssetManifestLineageProven: false
}

export interface LivingFrameComponentArtifactReconciliationMetrics {
  readonly sceneCount: 0 | 1
  readonly componentBindingCount: number
  readonly structurallyCompatibleComponentCount: number
  readonly incompatibleComponentCount: number
  readonly artifactCount: number
  readonly maskArtifactCount: number
  readonly referencedAssetIntentCount: number
}

export interface LivingFrameComponentArtifactReconciliationAuthorityBoundary {
  readonly structuralLineageCandidateOnly: true
  readonly selectedSceneAuthority: false
  readonly sourceAssetAuthority: false
  readonly artifactOriginAuthority: false
  readonly artifactQaAuthority: false
  readonly continuityQaAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly customerCommercialAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workItemCreationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly rendererAuthority: false
  readonly renderExecutionAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameComponentArtifactReconciliationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_VERSION
  readonly reconciliationClass:
    typeof LIVING_FRAME_COMPONENT_ARTIFACT_RECONCILIATION_CLASS
  readonly reconciliationState:
    LivingFrameComponentArtifactReconciliationState
  readonly sceneId: string | null
  readonly sourceBindings: {
    readonly componentAssetIntentBundleDigestSha256: string
    readonly sceneEvidencePackageDigestSha256: string | null
  }
  readonly componentBindings:
    readonly LivingFrameComponentArtifactReconciliationBinding[]
  readonly blockerCodes:
    readonly LivingFrameComponentArtifactReconciliationBlocker[]
  readonly metrics: LivingFrameComponentArtifactReconciliationMetrics
  readonly authorityBoundary:
    LivingFrameComponentArtifactReconciliationAuthorityBoundary
  readonly existingCanonicalWorkGraphRemainsAuthority: true
  readonly existingCanonicalAssetManifestRemainsAuthority: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderModelToolOperationJobQueueCostOrCommercialRoute:
    false
  readonly containsExecutableCodeOrCommands: false
  readonly createsWorkItems: false
  readonly createsAssetManifestEntries: false
  readonly subjectSpecificRouting: false
  readonly promotionAllowed: false
}

export interface LivingFrameComponentArtifactReconciliation
  extends LivingFrameComponentArtifactReconciliationDraft {
  readonly reconciliationDigestSha256: string
}
