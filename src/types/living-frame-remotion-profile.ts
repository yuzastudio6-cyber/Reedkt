import type {
  LayerFitMode,
  RendererLayerType,
} from './reeditpro'
import type {
  LivingFrameProjectedLayerPrimitive,
} from './living-frame-render-projection'
import type {
  LivingFrameSceneArtifactRef,
} from './living-frame-scene-evidence-package'

export const LIVING_FRAME_REMOTION_PROFILE_VERSION =
  'living-frame-remotion-profile-v1' as const

export const LIVING_FRAME_REMOTION_PROFILE_ID =
  'living_frame_deterministic_layered_scene_v1' as const

export const LIVING_FRAME_REMOTION_PROFILE_CLASS =
  'controlled_non_executable_existing_remotion_profile_candidate' as const

export const LIVING_FRAME_REMOTION_PROFILE_STATES = [
  'blocked_by_canonical_component_admission',
  'blocked_by_renderer_choreography_or_lineage',
] as const
export type LivingFrameRemotionProfileState =
  (typeof LIVING_FRAME_REMOTION_PROFILE_STATES)[number]

export const LIVING_FRAME_REMOTION_PROFILE_OPEN_GATES = [
  'canonical_selected_living_frame_scene_component_ref_required',
  'canonical_living_frame_renderer_binding_component_ref_required',
  'canonical_living_frame_choreography_binding_component_ref_required',
  'canonical_renderer_layer_extension_required',
  'canonical_motion_track_sample_projection_required',
  'canonical_artifact_commitment_required',
  'canonical_artifact_qa_required',
  'offline_remotion_protocol_profile_admission_required',
  'canonical_private_remotion_execution_binding_required',
  'canonical_private_remotion_review_required',
  'approved_work_output_lineage_incomplete',
  'approved_asset_manifest_lineage_incomplete',
  'renderer_projection_blocked',
  'choreography_projection_blocked',
] as const
export type LivingFrameRemotionProfileOpenGate =
  (typeof LIVING_FRAME_REMOTION_PROFILE_OPEN_GATES)[number]

export interface LivingFrameRemotionLayerProfile {
  readonly order: number
  readonly componentId: string
  readonly rendererLayerId: string
  readonly rendererLayerType: RendererLayerType
  readonly fitMode: LayerFitMode
  readonly zIndex: number
  readonly primitive: LivingFrameProjectedLayerPrimitive
  readonly artifact: LivingFrameSceneArtifactRef
  readonly maskArtifact: LivingFrameSceneArtifactRef | null
  readonly zonePixels: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
  readonly motionTrackIds: readonly string[]
  readonly motionSampleCount: number
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedOutputKey: string
  readonly plannedAssetManifestEntryId: string
}

export interface LivingFrameRemotionCameraProfile {
  readonly componentId: string
  readonly motionTrackIds: readonly string[]
  readonly motionSampleCount: number
}

export interface LivingFrameRemotionSemanticProfile {
  readonly attentionEventIds: readonly string[]
  readonly semanticScaleRequestIds: readonly string[]
  readonly soundRequestIds: readonly string[]
  readonly exactFramesStillOwnedByMasterTiming: true
  readonly exactSoundCuesAndMixStillOwnedBySoundSync: true
}

export interface LivingFrameRemotionProfileMetrics {
  readonly layerCount: number
  readonly cameraCount: number
  readonly motionTrackCount: number
  readonly motionSampleCount: number
  readonly captionLayerCount: number
  readonly attentionEventCount: number
  readonly semanticScaleRequestCount: number
  readonly soundRequestCount: number
}

export interface LivingFrameRemotionProfileAuthorityBoundary {
  readonly profileCandidateOnly: true
  readonly selectedSceneAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly artifactQaAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly remotionProtocolAuthority: false
  readonly remotionExecutionAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameRemotionProfileDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REMOTION_PROFILE_VERSION
  readonly compositionProfileId:
    typeof LIVING_FRAME_REMOTION_PROFILE_ID
  readonly profileClass:
    typeof LIVING_FRAME_REMOTION_PROFILE_CLASS
  readonly sceneId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
  }
  readonly outputFrame: {
    readonly outputFrameId: string
    readonly outputFrameDigestSha256: string
  }
  readonly masterTiming: {
    readonly masterTimingPlanId: string
    readonly masterTimingPlanDigestSha256: string
  }
  readonly sourceBindings: {
    readonly rendererPlanBindingDigestSha256: string
    readonly choreographyBindingDigestSha256: string
    readonly approvedLineageBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly approvedPlanId: string
    readonly approvedPlanVersion: number
    readonly approvedPlanHashSha256: string
    readonly approvedWorkGraphHashSha256: string
    readonly approvedTimingHashSha256: string
    readonly approvedAssetManifestHashSha256: string
    readonly canonicalRendererPlanRefSha256: string
    readonly canonicalRendererPlanDigestSha256: string
  }
  readonly layers: readonly LivingFrameRemotionLayerProfile[]
  readonly cameras: readonly LivingFrameRemotionCameraProfile[]
  readonly captionLayerIds: readonly string[]
  readonly semanticProfile: LivingFrameRemotionSemanticProfile
  readonly profileState: LivingFrameRemotionProfileState
  readonly openGateCodes:
    readonly LivingFrameRemotionProfileOpenGate[]
  readonly metrics: LivingFrameRemotionProfileMetrics
  readonly authorityBoundary:
    LivingFrameRemotionProfileAuthorityBoundary
  readonly existingRendererCompositionPlanRemainsAuthority: true
  readonly existingMasterTimingAndSoundSyncRemainAuthority: true
  readonly existingApprovedSnapshotWorkGraphAndAssetManifestRemainAuthority: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderToolJobQueueCostOrCommercialRoute: false
  readonly containsExecutableCodeOrCommands: false
  readonly subjectSpecificRouting: false
  readonly remotionExecutionStillForbidden: true
}

export interface LivingFrameRemotionProfile
  extends LivingFrameRemotionProfileDraft {
  readonly profileDigestSha256: string
}
