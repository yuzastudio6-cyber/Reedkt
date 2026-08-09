import type {
  CaptionDomainCanonicalScope,
  CaptionDomainFrameRange,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type {
  CaptionSceneDepthPlane,
  CaptionSceneTrackRole,
} from './caption-multi-track-scene-graph'
import type {
  CaptionMotionEasing,
  CaptionMotionPrimitiveKind,
} from './caption-storytiming-motion'

export const CAPTION_REMOTION_SCENE_GROUP_VERSION =
  'caption-remotion-scene-group-v1' as const
export const CAPTION_REMOTION_RENDER_SPEC_VERSION =
  'caption-remotion-render-spec-v1' as const
export const CAPTION_REMOTION_COMPOSITION_PROFILE =
  'caption_direction_creative_scene_group_v1' as const
export const CAPTION_REMOTION_PINNED_RUNTIME_VERSION =
  'remotion-4.0.487-react-19.2.6-pinned-chromium-v1' as const

export type CaptionRemotionPresentationKind =
  | 'stable_accessible_caption'
  | 'semantic_phrase_card'
  | 'hero_typography'
  | 'persistent_topic_list'
  | 'environmental_label'
  | 'object_anchor_label'
  | 'caption_to_visual_bridge'

export interface CaptionRemotionLayer {
  layerId: string
  nodeId: string
  trackId: string
  phraseId: string
  trackRole: CaptionSceneTrackRole
  presentationKind: CaptionRemotionPresentationKind
  text: string
  exactSourceWordIds: string[]
  frameRange: CaptionDomainFrameRange
  stableReadRange: CaptionDomainFrameRange
  depthPlane: Exclude<CaptionSceneDepthPlane, 'subject_plane'>
  zIndex: number
  layoutBasisPoints: {
    x: number
    y: number
    width: number
    height: number
  }
  typography: {
    fontFamilyToken: 'approved_caption_sans_fixture_v1'
    fontWeight: 600 | 700 | 800
    fontSizeBasisPointsOfFrameHeight: number
    lineHeightMilli: number
    textColor: '#F8FAFC' | '#DFF7FF' | '#09111F'
    accentColor: '#6EE7F9' | '#A78BFA' | '#FBBF24'
    plateStyle: 'none' | 'soft_dark' | 'soft_light' | 'outline_dark'
    textAlign: 'left' | 'center'
  }
  motion: {
    primitive: CaptionMotionPrimitiveKind
    easing: CaptionMotionEasing
    travelBasisPoints: { x: number; y: number }
    startScaleBasisPoints: number
    endScaleBasisPoints: number
    startOpacityBasisPoints: number
    endOpacityBasisPoints: number
    overshootBasisPoints: number
    staggerFrames: number
  }
  reducedMotion: {
    primitive: 'fade' | 'stable_hold' | 'cut'
    frameRange: CaptionDomainFrameRange
  }
  accessibilityCounterpartNodeId: string | null
  maskSequenceRef: CaptionDomainRef | null
  objectAnchorRef: CaptionDomainRef | null
  trackManifestRef: CaptionDomainRef | null
  dependencyDisposition:
    | 'not_applicable'
    | 'admitted_exact_private_evidence'
    | 'declared_safe_fallback'
}

export interface CaptionRemotionSceneGroup {
  schemaVersion: typeof CAPTION_REMOTION_SCENE_GROUP_VERSION
  sceneGroupId: string
  sceneGroupDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGraphRef: CaptionDomainRef
  semanticStylePlanRef: CaptionDomainRef
  motionPlanRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  confirmedOutputFrame: {
    frameRef: CaptionDomainRef
    outputId: string
    width: number
    height: number
    aspectRatioNumerator: number
    aspectRatioDenominator: number
    fpsNumerator: number
    fpsDenominator: number
  }
  totalDurationFrames: number
  layers: CaptionRemotionLayer[]
  maximumConcurrentLayerCount: number
  layerStackOrder: [
    'source_media',
    'far_background',
    'environmental_background',
    'behind_subject',
    'living_frame',
    'subject_mask_plane',
    'speaker_adjacent',
    'object_attached',
    'in_front_of_subject',
    'foreground_hero',
    'stable_accessible_caption',
    'transitions',
  ]
  subjectMaskFixturePolicy:
    | 'none'
    | 'deterministic_private_fixture_only_not_track_all_evidence'
  fallbackProfileId: 'approved_timed_full_frame_rgba_track'
  accessibleCompleteWordingRetained: true
  exactStoryTimingFramesConsumed: true
  captionProducedParallelClock: false
  captionAboveLivingFrameByDefault: true
  accessibleCaptionAboveAllVisuals: true
  trackAllEvidenceClaimed: false
  brollSelectionClaimed: false
  arbitraryCssIncluded: false
  modelAuthoredCodeIncluded: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}

export interface CaptionRemotionRenderSpec {
  schemaVersion: typeof CAPTION_REMOTION_RENDER_SPEC_VERSION
  renderSpecId: string
  renderSpecDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGroupRef: CaptionDomainRef
  compositionProfileId: typeof CAPTION_REMOTION_COMPOSITION_PROFILE
  canonicalOperationId: 'tool.remotion.render_approved_composition.v1'
  pinnedRuntimeVersion: typeof CAPTION_REMOTION_PINNED_RUNTIME_VERSION
  confirmedOutputFrameRef: CaptionDomainRef
  confirmedOutputWidth: number
  confirmedOutputHeight: number
  reviewFrame: {
    width: 640
    height: 360
    scaleNumerator: 1
    scaleDenominator: 3
    exactAspectRatioPreserved: true
    privateReviewProxyOnly: true
    finalCustomerCanvasClaimed: false
  }
  fps: 30
  durationFrames: number
  reducedMotion: boolean
  rendererPayload: {
    compositionProfileId: typeof CAPTION_REMOTION_COMPOSITION_PROFILE
    width: 640
    height: 360
    fps: 30
    durationFrames: number
    sceneGroupId: string
    sceneGroupDigestSha256: string
    motionLockDigestSha256: string
    storyTimingResolutionDigestSha256: string
    confirmedOutputWidth: number
    confirmedOutputHeight: number
    confirmedAspectRatioNumerator: number
    confirmedAspectRatioDenominator: number
    privateReviewScaleNumerator: 1
    privateReviewScaleDenominator: 3
    reducedMotion: boolean
    subjectMaskFixturePolicy:
      | 'none'
      | 'deterministic_private_fixture_only_not_track_all_evidence'
    backgroundStyle: 'editorial_night_sky_v1'
    layers: CaptionRemotionLayer[]
  }
  goldenFrameNumbers: number[]
  legacyFallbackProfileId: 'approved_timed_full_frame_rgba_track'
  exactApprovedSnapshotRereadRequiredBeforeExecution: true
  exactMotionLockRereadRequiredBeforeExecution: true
  exactStoryTimingRereadRequiredBeforeExecution: true
  pinnedChromiumRequired: true
  directRasterInspectionRequired: true
  technicalQaRequired: true
  privateReviewOnly: true
  finalCustomerCanvasClaimed: false
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
