import type { CaptionDomainCanonicalScope, CaptionDomainRef } from './caption-domain-contracts'
import type { CaptionRemotionLayer } from './caption-remotion-scene-group'

export const CAPTION_REMOTION_REAL_SOURCE_REVIEW_SPEC_VERSION =
  'caption-remotion-real-source-review-spec-v1' as const
export const CAPTION_REMOTION_REAL_SOURCE_COMPOSITION_PROFILE =
  'caption_direction_real_source_scene_group_v2' as const

export interface CaptionRemotionRealSourceReviewSpec {
  schemaVersion: typeof CAPTION_REMOTION_REAL_SOURCE_REVIEW_SPEC_VERSION
  reviewSpecId: string
  reviewSpecDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGroupRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  sourceEvidence: {
    originalSourceRef: CaptionDomainRef
    originalSourceSha256: string
    originalSourceStartMilliseconds: number
    originalSourceEndMilliseconds: number
    privateReviewProxyRef: CaptionDomainRef
    privateReviewProxyMimeType: 'video/mp4'
    privateReviewProxyByteLength: number
    privateReviewProxySha256: string
    sourceMediaPolicy: 'approved_caption_private_review_proxy_v1'
    sourceAudioPreserved: true
  }
  wordingEvidence: {
    reviewRef: CaptionDomainRef
    reviewDigestSha256: string
    reviewPolicy: 'fixture_specific_human_review_phrase_level_only_v1'
    timingProvenance: 'synthetic_estimate'
    phraseLevelOnly: true
    wordLockedMotionUsed: false
    canonicalTranscriptQualificationClaimed: false
  }
  confirmedOutputFrame: {
    frameRef: CaptionDomainRef
    outputId: string
    width: 1080
    height: 1920
    aspectRatioNumerator: 9
    aspectRatioDenominator: 16
    fpsNumerator: 30
    fpsDenominator: 1
  }
  privateReviewFrame: {
    width: 360
    height: 640
    scaleNumerator: 1
    scaleDenominator: 3
    exactAspectRatioPreserved: true
    finalCustomerCanvasClaimed: false
  }
  compositionProfileId: typeof CAPTION_REMOTION_REAL_SOURCE_COMPOSITION_PROFILE
  canonicalOperationId: 'tool.remotion.render_approved_composition.v1'
  durationFrames: number
  reducedMotion: boolean
  inspectionFrameNumbers: number[]
  layers: CaptionRemotionLayer[]
  safePlacementPolicy: 'speaker_face_and_gesture_avoidance_top_plane_v1'
  sourceBehindAllCaptionLayers: true
  stableAccessibleCaptionAboveVisualLayers: true
  subjectMaskFixturePolicy: 'none'
  trackAllEvidenceClaimed: false
  directRasterInspectionRequired: true
  privateReviewOnly: true
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
