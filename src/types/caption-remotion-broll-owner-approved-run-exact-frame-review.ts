import type {
  CaptionDomainCanonicalScope,
  CaptionDomainRef,
} from './caption-domain-contracts'

export const CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_REVIEW_VERSION =
  'caption-remotion-broll-owner-approved-run-exact-frame-review-v1' as const

export const CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_PROFILE =
  'caption_direction_broll_owner_approved_run_exact_frame_scene_group_v6' as const

/**
 * Additive private-internal qualification binding for rendering the already
 * admitted V2 review scene at its exact confirmed frame. The selected B-roll
 * review proxy remains source evidence, so this record does not claim a final
 * customer canvas or replace the canonical final-render owner.
 */
export interface CaptionRemotionBrollOwnerApprovedRunExactFrameReview {
  schemaVersion:
    typeof CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_REVIEW_VERSION
  exactFrameReviewId: string
  exactFrameReviewDigestSha256: string
  sourceReviewSpecRef: CaptionDomainRef
  canonicalScope: CaptionDomainCanonicalScope
  approvedSnapshotRef: CaptionDomainRef
  executionPackageRef: CaptionDomainRef
  sceneGroupRef: CaptionDomainRef
  motionLockRef: CaptionDomainRef
  storyTimingResolutionRef: CaptionDomainRef
  confirmedOutputFrame: {
    frameRef: CaptionDomainRef
    outputId: string
    width: 3840
    height: 2160
    fps: 30
    exactConfirmedFrameRendered: true
  }
  inputSourceFrame: {
    width: 640
    height: 360
    profileId: 'approved_b_roll_remotion_preview_proxy_matroska_v1'
    sourceProxyUpscaleRequired: true
    sourceProxyAcceptedAsFinalPictureQuality: false
  }
  compositionProfileId:
    typeof CAPTION_REMOTION_BROLL_OWNER_APPROVED_RUN_EXACT_FRAME_PROFILE
  durationFrames: number
  reducedMotion: boolean
  inspectionFrameNumbers: number[]
  exactV2ReviewSpecReread: true
  exactConfirmedFrameMatchesApprovedRun: true
  typographyAndLayoutEvaluatedAtConfirmedFrame: true
  sourceQualityQualificationClaimed: false
  finalCustomerCanvasClaimed: false
  replacesCanonicalFinalCanvas: false
  privateInternalOnly: true
  runtimeExecutionGranted: false
  assetCreationGranted: false
  finalQaApprovalGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
