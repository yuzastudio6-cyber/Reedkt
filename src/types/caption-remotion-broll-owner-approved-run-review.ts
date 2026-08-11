import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'
import type { CaptionRemotionLayer } from './caption-remotion-scene-group'

export const CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_REVIEW_SPEC_VERSION =
  'caption-remotion-broll-owner-approved-run-review-spec-v2' as const
export const CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_COMPOSITION_PROFILE =
  'caption_direction_broll_owner_approved_run_scene_group_v5' as const

/**
 * Additive approved-run review contract. The frozen V1 B-roll review remains
 * readable as 1920x1080@24 fixture evidence; V2 binds a professional Caption
 * scene group to the exact 4K approved-run authority while rendering only a
 * bounded, aspect-correct private review proxy.
 */
export interface CaptionRemotionBrollOwnerApprovedRunReviewSpec {
  schemaVersion:
    typeof CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_REVIEW_SPEC_VERSION
  reviewSpecId: string
  reviewSpecDigestSha256: string
  canonicalScope: CaptionDomainCanonicalScope
  approvedRunLineage: {
    approvedSnapshotRef: CaptionDomainRef
    executionPackageRef: CaptionDomainRef
    captionPlanningProjectionRef: CaptionDomainRef
    captionPlanningBindingRef: CaptionDomainRef
    captionRenderedMediaWorkBindingRef: CaptionDomainRef
    exactImmutableApprovedRunRereadVerified: true
    creativeReviewSupplementsCanonicalFinalCanvas: true
    creativeReviewReplacesCanonicalFinalCanvas: false
  }
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
    selectedNormalizedArtifactFps: 30
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
    reviewPolicy: 'canonical_approved_run_phrase_lineage_review_v1'
    canonicalTranscriptRef: CaptionDomainRef
    canonicalTranscriptEvidenceRef: CaptionDomainRef
    timingProvenance: 'asr_native' | 'manually_corrected'
    phraseLevelOnly: true
    wordLockedMotionUsed: false
    exactSourceWordLineageBound: true
    canonicalTranscriptQualificationClaimed: false
  }
  confirmedOutputFrame: {
    frameRef: CaptionDomainRef
    outputId: string
    width: 3840
    height: 2160
    aspectRatioNumerator: 16
    aspectRatioDenominator: 9
    fpsNumerator: 30
    fpsDenominator: 1
  }
  privateReviewFrame: {
    width: 640
    height: 360
    scaleNumerator: 1
    scaleDenominator: 6
    exactAspectRatioPreserved: true
    finalCustomerCanvasClaimed: false
  }
  compositionProfileId:
    typeof CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_COMPOSITION_PROFILE
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
  completeTimeInspectionRequired: true
  syntheticEngineeringFixtureAcceptedAsProfessionalAppearance: false
  realSourcePixelsRequiredForProfessionalAppearance: true
  privateReviewOnly: true
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
