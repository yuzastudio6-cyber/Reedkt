import type {
  LivingFrameCompiledMotionTrack,
} from './living-frame-deterministic-motion'

export const LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_VERSION =
  'living-frame-remotion-motion-sample-binding-v1' as const

export const LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_CLASS =
  'controlled_non_executable_remotion_motion_sample_binding' as const

export const LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_STATES = [
  'candidate_samples_bound_pending_protocol',
  'blocked_by_profile_or_track_lineage',
] as const
export type LivingFrameRemotionMotionSampleBindingState =
  (typeof LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_STATES)[number]

export const LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_BLOCKERS = [
  'current_remotion_profile_reread_required',
  'current_motion_bundle_reread_required',
  'canonical_master_timing_revalidation_required',
  'canonical_output_frame_revalidation_required',
  'canonical_artifact_commitment_required',
  'canonical_artifact_qa_required',
  'offline_remotion_protocol_profile_admission_required',
  'canonical_private_remotion_execution_binding_required',
  'canonical_private_remotion_review_required',
  'source_remotion_profile_blocked',
  'referenced_motion_track_missing',
  'motion_track_owner_component_mismatch',
  'motion_sample_count_mismatch',
] as const
export type LivingFrameRemotionMotionSampleBindingBlocker =
  (typeof LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_BLOCKERS)[number]

export interface LivingFrameRemotionLayerMotionSampleBinding {
  readonly order: number
  readonly componentId: string
  readonly rendererLayerId: string
  readonly sourceProfileMotionTrackIds: readonly string[]
  readonly motionTracks: readonly LivingFrameCompiledMotionTrack[]
  readonly sourceProfileMotionSampleCount: number
  readonly compiledMotionSampleCount: number
  readonly blockerCodes:
    readonly LivingFrameRemotionMotionSampleBindingBlocker[]
}

export interface LivingFrameRemotionCameraMotionSampleBinding {
  readonly order: number
  readonly componentId: string
  readonly sourceProfileMotionTrackIds: readonly string[]
  readonly motionTracks: readonly LivingFrameCompiledMotionTrack[]
  readonly sourceProfileMotionSampleCount: number
  readonly compiledMotionSampleCount: number
  readonly blockerCodes:
    readonly LivingFrameRemotionMotionSampleBindingBlocker[]
}

export interface LivingFrameRemotionMotionSampleBindingMetrics {
  readonly layerBindingCount: number
  readonly cameraBindingCount: number
  readonly referencedTrackCount: number
  readonly referencedSampleCount: number
  readonly blockedLayerBindingCount: number
  readonly blockedCameraBindingCount: number
}

export interface LivingFrameRemotionMotionSampleBindingAuthorityBoundary {
  readonly deterministicSampleBindingOnly: true
  readonly selectedSceneAuthority: false
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly soundSyncAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly artifactCommitmentAuthority: false
  readonly artifactQaAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly remotionProtocolAuthority: false
  readonly remotionExecutionAuthority: false
  readonly privateReviewAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameRemotionMotionSampleBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_VERSION
  readonly bindingClass:
    typeof LIVING_FRAME_REMOTION_MOTION_SAMPLE_BINDING_CLASS
  readonly sceneId: string
  readonly sourceBindings: {
    readonly remotionProfileDigestSha256: string
    readonly deterministicMotionBundleDigestSha256: string
  }
  readonly outputFrame: {
    readonly outputFrameId: string
    readonly outputFrameDigestSha256: string
  }
  readonly masterTiming: {
    readonly masterTimingPlanId: string
    readonly masterTimingPlanDigestSha256: string
    readonly sceneStartFrame: number
    readonly sceneEndFrame: number
    readonly fpsNumerator: number
    readonly fpsDenominator: number
  }
  readonly layerBindings:
    readonly LivingFrameRemotionLayerMotionSampleBinding[]
  readonly cameraBindings:
    readonly LivingFrameRemotionCameraMotionSampleBinding[]
  readonly bindingState:
    LivingFrameRemotionMotionSampleBindingState
  readonly blockerCodes:
    readonly LivingFrameRemotionMotionSampleBindingBlocker[]
  readonly metrics: LivingFrameRemotionMotionSampleBindingMetrics
  readonly authorityBoundary:
    LivingFrameRemotionMotionSampleBindingAuthorityBoundary
  readonly existingMasterTimingRemainsAuthority: true
  readonly existingRemotionProfileRemainsNonExecutable: true
  readonly containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials: false
  readonly containsProviderModelToolOperationJobQueueCostOrCommercialRoute:
    false
  readonly containsExecutableCodeOrCommands: false
  readonly createsArtifactCommitments: false
  readonly createsWorkItemsOrAssetManifestEntries: false
  readonly subjectSpecificRouting: false
  readonly remotionExecutionStillForbidden: true
}

export interface LivingFrameRemotionMotionSampleBinding
  extends LivingFrameRemotionMotionSampleBindingDraft {
  readonly bindingDigestSha256: string
}
