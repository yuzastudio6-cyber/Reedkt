import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { CaptionRemotionLayer } from './caption-remotion-scene-group'

export const CAPTION_REMOTION_BROLL_OWNER_REVIEW_SPEC_VERSION =
  'caption-remotion-broll-owner-review-spec-v1' as const
export const CAPTION_REMOTION_BROLL_OWNER_COMPOSITION_PROFILE =
  'caption_direction_broll_owner_real_source_scene_group_v4' as const

export interface CaptionRemotionBrollOwnerReviewSpec {
  schemaVersion: typeof CAPTION_REMOTION_BROLL_OWNER_REVIEW_SPEC_VERSION
  reviewSpecId: string
  reviewSpecDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  sceneGroupRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  masterTimingHash: string
  brollOwnerLineage: {
    ownerRequestRef: CaptionDomainRef
    ownerResultRef: CaptionDomainRef
    brollResultReceiptRef: CaptionDomainRef
    selectedMediaManifestRef: CaptionDomainRef
    layoutOccupancyRef: CaptionDomainRef
    cropTimingRef: CaptionDomainRef
    visibleTextEvidenceRef: CaptionDomainRef
    authenticatedOwnerEvidenceRef: CaptionDomainRef
    ownerCanonicalScopeDigestSha256: string
    exactOwnerResultRereadVerified: true
    sourceSelectionPerformedByCaption: false
    cropOrTimingPerformedByCaption: false
  }
  sourceEvidence: {
    selectedNormalizedArtifactRef: CaptionDomainRef
    selectedNormalizedArtifactMimeType: 'video/x-nut'
    selectedNormalizedArtifactByteLength: number
    selectedNormalizedArtifactFrameCount: number
    selectedNormalizedArtifactFps: 24
    remotionProxyRef: CaptionDomainRef
    remotionProxyMimeType: 'video/x-matroska'
    remotionProxyByteLength: number
    remotionProxySha256: string
    remotionProxyProfileId:
      'approved_b_roll_remotion_preview_proxy_matroska_v1'
    remotionProxyDerivedFromSelectedArtifact: true
    selectedSourceAudioRemovedByOwner: true
    sourceMediaPolicy:
      'approved_b_roll_qa_normalized_preview_proxy_v1'
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
    width: 1920
    height: 1080
    aspectRatioNumerator: 16
    aspectRatioDenominator: 9
    fpsNumerator: 24
    fpsDenominator: 1
  }
  privateReviewFrame: {
    width: 640
    height: 360
    scaleNumerator: 1
    scaleDenominator: 3
    exactAspectRatioPreserved: true
    finalCustomerCanvasClaimed: false
  }
  compositionProfileId:
    typeof CAPTION_REMOTION_BROLL_OWNER_COMPOSITION_PROFILE
  canonicalOperationId: 'tool.remotion.render_approved_composition.v1'
  masterTimelineStartFrame: number
  masterTimelineEndFrameExclusive: number
  durationFrames: number
  reducedMotion: boolean
  inspectionFrameNumbers: number[]
  layers: CaptionRemotionLayer[]
  sourcePresentation: 'full_frame_cutaway_v1'
  safePlacementPolicy: 'broll_center_safe_caption_lower_band_v1'
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
