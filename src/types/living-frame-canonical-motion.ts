import type {
  LivingFrameDepthBand,
  LivingFrameImportance,
  LivingFrameVisualVerb,
} from './living-frame'
import type {
  LivingFrameMotionEasing,
  LivingFrameMotionProperty,
  LivingFrameMotionTrackRole,
} from './living-frame-deterministic-motion'

export const CANONICAL_LIVING_FRAME_MOTION_SPEC_VERSION =
  'canonical-living-frame-motion-spec-v1' as const

export const CANONICAL_LIVING_FRAME_MOTION_PROFILE =
  'approved_scalar_keyframe_choreography_v1' as const

export const CANONICAL_LIVING_FRAME_DEPTH_STYLES = [
  'flat',
  'shallow_2_5d',
  'deep_multiplane',
] as const
export type CanonicalLivingFrameDepthStyle =
  (typeof CANONICAL_LIVING_FRAME_DEPTH_STYLES)[number]

export const CANONICAL_LIVING_FRAME_MOTION_TARGETS = [
  'layer',
  'virtual_camera',
  'source',
] as const
export type CanonicalLivingFrameMotionTarget =
  (typeof CANONICAL_LIVING_FRAME_MOTION_TARGETS)[number]

export const CANONICAL_LIVING_FRAME_RENDERABLE_MOTION_PROPERTIES = [
  'position_x_normalized',
  'position_y_normalized',
  'rotation_degrees',
  'scale_uniform',
  'opacity',
  'blur_pixels',
  'light_intensity',
  'shadow_opacity',
] as const satisfies readonly LivingFrameMotionProperty[]
export type CanonicalLivingFrameRenderableMotionProperty =
  (typeof CANONICAL_LIVING_FRAME_RENDERABLE_MOTION_PROPERTIES)[number]

export interface CanonicalLivingFrameMotionKeyframe {
  readonly frameOffset: number
  readonly value: number
  readonly easingToNext: LivingFrameMotionEasing
}

export interface CanonicalLivingFrameMotionTrack {
  readonly trackId: string
  readonly order: number
  readonly target: CanonicalLivingFrameMotionTarget
  readonly property: CanonicalLivingFrameRenderableMotionProperty
  readonly role: LivingFrameMotionTrackRole
  readonly keyframes: readonly CanonicalLivingFrameMotionKeyframe[]
  readonly compiledSampleCount: number
  readonly compiledSampleDigestSha256: string
}

export interface CanonicalLivingFrameMotionSpecAuthorityBoundary {
  readonly serverDerivedFromSelectedSceneAndMasterTiming: true
  readonly exactFrameAuthority: false
  readonly masterTimingMutationAuthority: false
  readonly soundSyncAuthority: false
  readonly approvalAuthority: false
  readonly workGraphAuthority: false
  readonly rendererCodeAuthority: false
  readonly providerAuthority: false
  readonly queueAuthority: false
  readonly productionAuthority: false
}

export interface CanonicalLivingFrameMotionSpecDraft {
  readonly schemaVersion:
    typeof CANONICAL_LIVING_FRAME_MOTION_SPEC_VERSION
  readonly motionProfileId:
    typeof CANONICAL_LIVING_FRAME_MOTION_PROFILE
  readonly sceneId: string
  readonly componentId: string
  readonly sceneStartFrame: number
  readonly sceneEndFrameExclusive: number
  readonly visualVerb: LivingFrameVisualVerb
  readonly importance: LivingFrameImportance
  readonly depthStyle: CanonicalLivingFrameDepthStyle
  readonly depthBand: LivingFrameDepthBand
  readonly parallaxFactor: number
  readonly sourceBindings: {
    readonly selectedSceneBindingDigestSha256: string
    readonly timingBindingDigestSha256: string
    readonly deterministicMotionBundleDigestSha256: string
  }
  readonly attentionEventIds: readonly string[]
  readonly semanticScaleRequestIds: readonly string[]
  readonly tracks: readonly CanonicalLivingFrameMotionTrack[]
  readonly metrics: {
    readonly layerTrackCount: number
    readonly cameraTrackCount: number
    readonly sourceTrackCount: number
    readonly keyframeCount: number
    readonly compiledSampleCount: number
  }
  readonly authorityBoundary:
    CanonicalLivingFrameMotionSpecAuthorityBoundary
  readonly exactFramesRemainOwnedByMasterTiming: true
  readonly captionsRemainAboveLivingFrame: true
  readonly containsExecutableCodeCommandsPathsUrlsOrCredentials: false
  readonly subjectSpecificRouting: false
}

export interface CanonicalLivingFrameMotionSpec
  extends CanonicalLivingFrameMotionSpecDraft {
  readonly motionSpecDigestSha256: string
}
