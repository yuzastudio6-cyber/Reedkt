import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { CaptionRemotionLayer } from './caption-remotion-scene-group'

export const CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_REVIEW_SPEC_VERSION =
  'caption-remotion-real-source-multi-output-review-spec-v1' as const
export const CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_COMPOSITION_PROFILE =
  'caption_direction_real_source_multi_output_scene_group_v3' as const

export type CaptionRealSourceOutputFormat =
  | 'widescreen_16_9'
  | 'square_1_1'

export type CaptionRealSourceConfirmedOutputFrame =
  | {
      frameRef: CaptionDomainRef
      outputId: string
      width: 1920
      height: 1080
      aspectRatioNumerator: 16
      aspectRatioDenominator: 9
      fpsNumerator: 30
      fpsDenominator: 1
    }
  | {
      frameRef: CaptionDomainRef
      outputId: string
      width: 1440
      height: 1440
      aspectRatioNumerator: 1
      aspectRatioDenominator: 1
      fpsNumerator: 30
      fpsDenominator: 1
    }

export type CaptionRealSourcePrivateReviewFrame =
  | {
      width: 640
      height: 360
      scaleNumerator: 1
      scaleDenominator: 3
      exactAspectRatioPreserved: true
      finalCustomerCanvasClaimed: false
    }
  | {
      width: 480
      height: 480
      scaleNumerator: 1
      scaleDenominator: 3
      exactAspectRatioPreserved: true
      finalCustomerCanvasClaimed: false
    }

export interface CaptionRemotionRealSourceMultiOutputReviewSpec {
  schemaVersion:
    typeof CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_REVIEW_SPEC_VERSION
  reviewSpecId: string
  reviewSpecDigestSha256: string
  outputFormat: CaptionRealSourceOutputFormat
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
  confirmedOutputFrame: CaptionRealSourceConfirmedOutputFrame
  privateReviewFrame: CaptionRealSourcePrivateReviewFrame
  compositionProfileId:
    typeof CAPTION_REMOTION_REAL_SOURCE_MULTI_OUTPUT_COMPOSITION_PROFILE
  canonicalOperationId: 'tool.remotion.render_approved_composition.v1'
  durationFrames: number
  reducedMotion: boolean
  inspectionFrameNumbers: number[]
  layers: CaptionRemotionLayer[]
  sourcePresentation: 'editorial_split_right_v1'
  safePlacementPolicy:
    'speaker_face_and_gesture_avoidance_editorial_sidecar_v1'
  sourceBehindAllCaptionLayers: true
  stableAccessibleCaptionAboveVisualLayers: true
  subjectMaskFixturePolicy: 'none'
  trackAllEvidenceClaimed: false
  directRasterInspectionRequired: true
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false
  realSourcePixelsRequiredForProfessionalAppearance: true
  privateReviewOnly: true
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
