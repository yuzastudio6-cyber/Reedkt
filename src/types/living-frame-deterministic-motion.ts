export const LIVING_FRAME_DETERMINISTIC_MOTION_VERSION =
  'living-frame-deterministic-motion-v1' as const

export const LIVING_FRAME_DETERMINISTIC_MOTION_PROFILE =
  'frame_bound_scalar_tracks_v1' as const

export const LIVING_FRAME_DETERMINISTIC_MOTION_CLASS =
  'controlled_non_promotable_motion_sample_bundle' as const

export const LIVING_FRAME_MOTION_PROPERTIES = [
  'position_x_normalized',
  'position_y_normalized',
  'rotation_degrees',
  'scale_uniform',
  'opacity',
  'blur_pixels',
  'focus_depth_normalized',
  'path_reveal',
  'particle_emission_normalized',
  'light_intensity',
  'shadow_opacity',
] as const
export type LivingFrameMotionProperty =
  (typeof LIVING_FRAME_MOTION_PROPERTIES)[number]

export const LIVING_FRAME_MOTION_TRACK_ROLES = [
  'primary',
  'secondary',
  'ambient',
  'camera',
] as const
export type LivingFrameMotionTrackRole =
  (typeof LIVING_FRAME_MOTION_TRACK_ROLES)[number]

export const LIVING_FRAME_MOTION_EASINGS = [
  'linear',
  'hold',
  'ease_in_quad',
  'ease_out_quad',
  'ease_in_out_cubic',
  'mechanical_accelerate',
  'strike_accelerate',
  'settle_out',
] as const
export type LivingFrameMotionEasing =
  (typeof LIVING_FRAME_MOTION_EASINGS)[number]

export const LIVING_FRAME_MOTION_RESTORATION_EXPECTATIONS = [
  'not_applicable',
  'required_return_to_initial',
] as const
export type LivingFrameMotionRestorationExpectation =
  (typeof LIVING_FRAME_MOTION_RESTORATION_EXPECTATIONS)[number]

export interface LivingFrameMotionTimingExpectation {
  readonly masterTimingPlanId: string
  readonly masterTimingPlanDigestSha256: string
  readonly outputFrameId: string
  readonly outputFrameDigestSha256: string
  readonly sceneId: string
  readonly sceneStartFrame: number
  readonly sceneEndFrame: number
  readonly fpsNumerator: number
  readonly fpsDenominator: number
  readonly timingAuthorityRevalidationRequired: true
}

export interface LivingFrameMotionKeyframe {
  readonly frame: number
  readonly value: number
  readonly easingToNext: LivingFrameMotionEasing
}

export interface LivingFrameMotionTrackDraft {
  readonly trackId: string
  readonly order: number
  readonly motionGroupId: string
  readonly componentId: string
  readonly property: LivingFrameMotionProperty
  readonly role: LivingFrameMotionTrackRole
  readonly restorationExpectation: LivingFrameMotionRestorationExpectation
  readonly keyframes: readonly LivingFrameMotionKeyframe[]
}

export interface LivingFrameMotionSample {
  readonly frame: number
  readonly value: number
}

export interface LivingFrameCompiledMotionTrack {
  readonly trackId: string
  readonly order: number
  readonly motionGroupId: string
  readonly componentId: string
  readonly property: LivingFrameMotionProperty
  readonly role: LivingFrameMotionTrackRole
  readonly restorationExpectation: LivingFrameMotionRestorationExpectation
  readonly firstFrame: number
  readonly lastFrame: number
  readonly sourceKeyframes: readonly LivingFrameMotionKeyframe[]
  readonly samples: readonly LivingFrameMotionSample[]
}

export interface LivingFrameDeterministicMotionMetrics {
  readonly trackCount: number
  readonly motionGroupCount: number
  readonly primaryMotionGroupCount: number
  readonly cameraTrackCount: number
  readonly restorationTrackCount: number
  readonly sampleCount: number
  readonly maximumConcurrentTrackCount: number
}

export interface LivingFrameDeterministicMotionAuthorityBoundary {
  readonly deterministicSamplingOnly: true
  readonly masterTimingAuthority: false
  readonly exactFrameAuthority: false
  readonly planningAuthority: false
  readonly soundSyncAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly rendererAuthority: false
  readonly renderExecutionAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameDeterministicMotionBundleDraft {
  readonly contractVersion: typeof LIVING_FRAME_DETERMINISTIC_MOTION_VERSION
  readonly samplingProfile: typeof LIVING_FRAME_DETERMINISTIC_MOTION_PROFILE
  readonly bundleClass: typeof LIVING_FRAME_DETERMINISTIC_MOTION_CLASS
  readonly timingExpectation: LivingFrameMotionTimingExpectation
  readonly tracks: readonly LivingFrameCompiledMotionTrack[]
  readonly metrics: LivingFrameDeterministicMotionMetrics
  readonly authorityBoundary: LivingFrameDeterministicMotionAuthorityBoundary
  readonly containsExecutableCode: false
  readonly containsProviderOrToolRoute: false
  readonly containsRawInstructions: false
  readonly canonicalTimingRevalidationStillRequired: true
  readonly remotionCompilationStillRequired: true
}

export interface LivingFrameDeterministicMotionBundle
  extends LivingFrameDeterministicMotionBundleDraft {
  readonly bundleDigestSha256: string
}
