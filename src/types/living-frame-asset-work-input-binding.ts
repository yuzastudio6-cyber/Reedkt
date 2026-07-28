import type {
  LivingFrameComponentAssetKind,
  LivingFrameComponentAssetStage,
} from './living-frame-component-asset-intent'
import type {
  CanonicalLivingFrameProjectedWorkItemType,
} from './living-frame-estimate-work-asset-projection'

export const CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_VERSION =
  'canonical-living-frame-asset-work-input-binding-v2' as const

export const CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_SOURCE =
  'canonical_living_frame_asset_work_input_binding_compiler' as const

export const CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_COMPONENT_KEY =
  'livingFrameAssetWorkInputBinding' as const

export type CanonicalLivingFrameAssetWorkInputBindingReadiness =
  | 'ready_without_living_frame_asset_work_inputs'
  | 'source_inputs_bound_operation_admission_pending'
  | 'blocked_by_unresolved_primary_asset_inputs'

export type CanonicalLivingFrameAssetIntentInputResolutionState =
  | 'canonical_source_media_bound'
  | 'semantic_deterministic_spec_bound'
  | 'pending_provider_asset_artifact'
  | 'pending_named_work_output'

export interface CanonicalLivingFrameBoundAssetIntent {
  readonly assetIntentId: string
  readonly order: number
  readonly sceneId: string
  readonly componentId: string
  readonly stage: LivingFrameComponentAssetStage
  readonly assetKind: LivingFrameComponentAssetKind
  readonly dependencyAssetIntentIds: readonly string[]
  readonly expectedNamedWorkItemTypes:
    readonly CanonicalLivingFrameProjectedWorkItemType[]
  readonly inputResolutionState:
    CanonicalLivingFrameAssetIntentInputResolutionState
}

export interface CanonicalLivingFrameSourceAssetBinding {
  readonly assetIntentId: string
  readonly sceneId: string
  readonly componentId: string
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly sourceCleanupDecisionId: string
  readonly masterFrameIndex: number
  readonly sourceFrameIndex: number
  readonly frameRate: number
  readonly frameSelectionPolicy:
    'scene_start_meaning_anchor_v1'
  readonly sourceFrameSelectionDigestSha256: string
  readonly checksumSha256: string
  readonly mimeType: string
  readonly sizeBytes: number
  readonly sourceBindingHash: string
  readonly storageIdentityHash: string
  readonly required: true
  readonly authorityState:
    'exact_verified_source_media_and_cleanup_bound'
}

export interface CanonicalLivingFrameNamedWorkSourceFrameInput {
  readonly assetIntentId: string
  readonly sourceSequenceItemId: string
  readonly sourceCleanupDecisionId: string
  readonly masterFrameIndex: number
  readonly sourceFrameIndex: number
  readonly frameRate: number
  readonly frameSelectionPolicy:
    'scene_start_meaning_anchor_v1'
  readonly sourceFrameSelectionDigestSha256: string
}

export interface CanonicalLivingFrameNamedWorkInput {
  readonly workItemType:
    CanonicalLivingFrameProjectedWorkItemType
  readonly inputAssetIntentIds: readonly string[]
  readonly outputAssetIntentIds: readonly string[]
  readonly dependencyNamedWorkItemTypes:
    readonly CanonicalLivingFrameProjectedWorkItemType[]
  readonly sourceSequenceItemIds: readonly string[]
  readonly sourceCleanupDecisionIds: readonly string[]
  readonly sourceFrameInputs:
    readonly CanonicalLivingFrameNamedWorkSourceFrameInput[]
}

export interface CanonicalLivingFrameSceneAssetWorkInputBinding {
  readonly sceneId: string
  readonly canonicalSegmentId: string
  readonly canonicalSegmentOrder: number
  readonly originalRequiredNamedWorkItemTypes:
    readonly CanonicalLivingFrameProjectedWorkItemType[]
  readonly refinedRequiredNamedWorkItemTypes:
    readonly CanonicalLivingFrameProjectedWorkItemType[]
  readonly omittedOverbroadNamedWorkItemTypes:
    readonly CanonicalLivingFrameProjectedWorkItemType[]
  readonly assetIntents:
    readonly CanonicalLivingFrameBoundAssetIntent[]
  readonly sourceAssetBindings:
    readonly CanonicalLivingFrameSourceAssetBinding[]
  readonly namedWorkInputs:
    readonly CanonicalLivingFrameNamedWorkInput[]
}

export interface CanonicalLivingFrameAssetWorkInputBindingMetrics {
  readonly selectedSceneCount: number
  readonly selectedComponentCount: number
  readonly selectedAssetIntentCount: number
  readonly exactSourceAssetBindingCount: number
  readonly exactSourceFrameBindingCount: number
  readonly unresolvedPrimaryAssetIntentCount: number
  readonly originalNamedWorkItemCount: number
  readonly refinedNamedWorkItemCount: number
  readonly omittedOverbroadNamedWorkItemCount: number
}

export interface CanonicalLivingFrameAssetWorkInputBindingAuthorityBoundary {
  readonly serverDerivedAssetIntentAuthority: true
  readonly serverDerivedSourceInputBindingAuthority: true
  readonly serverDerivedNamedWorkInputAuthority: true
  readonly selectedSceneAuthority: false
  readonly sourceMediaMutationAuthority: false
  readonly sourceCleanupMutationAuthority: false
  readonly estimateAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly artifactQaAuthority: false
  readonly privateReviewAuthority: false
  readonly rendererAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface CanonicalLivingFrameAssetWorkInputBindingDraft {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_VERSION
  readonly source:
    typeof CANONICAL_LIVING_FRAME_ASSET_WORK_INPUT_BINDING_SOURCE
  readonly evidenceClass:
    'private_internal_server_derived_asset_work_input_binding'
  readonly identity: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneBindingDigestSha256: string
    readonly executionRequirementsDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly semanticPlanProjectionDigestSha256: string
    readonly sourceMediaCandidateHash: string
    readonly sourceSequenceHash: string
    readonly sourceSequenceDigestSha256: string
    readonly sourceCleanupPlanDigestSha256: string
    readonly synthesisRoutingDigestSha256: string
    readonly componentAssetIntentBundleDigestSha256: string
    readonly workAdmissionCatalogDigestSha256: string
  }
  readonly readiness:
    CanonicalLivingFrameAssetWorkInputBindingReadiness
  readonly scenes:
    readonly CanonicalLivingFrameSceneAssetWorkInputBinding[]
  readonly unresolvedPrimaryAssetIntentIds: readonly string[]
  readonly metrics:
    CanonicalLivingFrameAssetWorkInputBindingMetrics
  readonly authorityBoundary:
    CanonicalLivingFrameAssetWorkInputBindingAuthorityBoundary
  readonly existingApprovedWorkGraphRemainsAuthority: true
  readonly existingApprovedAssetManifestRemainsAuthority: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials:
    false
  readonly containsProviderPromptOrExecutablePayload: false
  readonly createsCanonicalWorkItems: false
  readonly createsAssetManifestEntries: false
  readonly expandsExactFiftyToolRegistry: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface CanonicalLivingFrameAssetWorkInputBinding
  extends CanonicalLivingFrameAssetWorkInputBindingDraft {
  readonly bindingDigestSha256: string
}
