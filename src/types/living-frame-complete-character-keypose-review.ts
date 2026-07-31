import type {
  LivingFrameCompleteCharacterKeyposeRole,
} from './living-frame-complete-character-keypose-plan'

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_VERSION =
  'living-frame-complete-character-keypose-review-v1' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_CLASS =
  'head_inspected_private_complete_character_keypose_visual_review' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_SET_VERSION =
  'living-frame-complete-character-keypose-review-set-v1' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CHECK_IDS = [
  'anatomy_and_limb_count',
  'joint_and_silhouette_continuity',
  'face_and_identity_continuity',
  'body_clothing_and_proportion_continuity',
  'hand_and_prop_attachment',
  'secondary_part_attachment',
  'complete_body_crop_and_isolation',
  'style_lighting_and_color_continuity',
] as const

export type LivingFrameCompleteCharacterKeyposeCheckId =
  (typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CHECK_IDS)[number]

export type LivingFrameCompleteCharacterKeyposeCheckOutcome =
  | 'pass'
  | 'repairable_failure'
  | 'blocking_failure'

export interface LivingFrameCompleteCharacterKeyposeCheck {
  readonly checkId:
    LivingFrameCompleteCharacterKeyposeCheckId
  readonly outcome:
    LivingFrameCompleteCharacterKeyposeCheckOutcome
  readonly observationSummary: string
  readonly evidenceRefIds:
    readonly string[]
}

export interface LivingFrameCompleteCharacterKeyposeReviewRequest {
  readonly reviewId: string
  readonly keyposePlanRef: {
    readonly planId: string
    readonly version:
      'living-frame-complete-character-keypose-plan-v1'
    readonly digestSha256: string
  }
  readonly keyposeUnitRef: {
    readonly unitId: string
    readonly unitDigestSha256: string
    readonly order: number
    readonly role:
      LivingFrameCompleteCharacterKeyposeRole
  }
  readonly privateArtifact: {
    readonly artifactId: string
    readonly approvedWorkItemId: string
    readonly plannedAssetManifestEntryId:
      string
    readonly outputKey: string
    readonly privateObjectIdentityHash:
      string
    readonly contentType: 'image/png'
    readonly byteLength: number
    readonly sha256: string
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly actualDecodedImageInspected:
      true
    readonly sourceBytesIncludedInReviewRecord:
      false
  }
  readonly technicalImageQaRef: {
    readonly version: number
    readonly digestSha256: string
    readonly artifactId: string
    readonly artifactSha256: string
    readonly decodePassed: boolean
    readonly expectedDimensionsPassed:
      boolean
    readonly noUnexpectedCropPassed:
      boolean
  }
  readonly headIntelligenceActualImageInspectionPerformed:
    true
  readonly checks:
    readonly LivingFrameCompleteCharacterKeyposeCheck[]
}

export interface LivingFrameCompleteCharacterKeyposeReviewDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_CLASS
  readonly reviewId: string
  readonly keyposePlanRef:
    LivingFrameCompleteCharacterKeyposeReviewRequest['keyposePlanRef']
  readonly keyposeUnitRef:
    LivingFrameCompleteCharacterKeyposeReviewRequest['keyposeUnitRef']
  readonly privateArtifactRef:
    LivingFrameCompleteCharacterKeyposeReviewRequest['privateArtifact']
  readonly technicalImageQaRef:
    LivingFrameCompleteCharacterKeyposeReviewRequest['technicalImageQaRef']
  readonly headIntelligenceActualImageInspectionPerformed:
    true
  readonly checks:
    readonly LivingFrameCompleteCharacterKeyposeCheck[]
  readonly disposition:
    | 'accepted'
    | 'repair_required'
    | 'rejected'
  readonly failedCheckIds:
    readonly LivingFrameCompleteCharacterKeyposeCheckId[]
  readonly technicalMetricsAloneCanApprove:
    false
  readonly interpolationAuthorized: false
  readonly canonicalQaApproved: false
  readonly containsImageBytesPathUrlCredentialCommandOrEnvironment:
    false
}

export interface LivingFrameCompleteCharacterKeyposeReview
  extends LivingFrameCompleteCharacterKeyposeReviewDraft {
  readonly reviewDigestSha256: string
}

export interface LivingFrameCompleteCharacterKeyposeReviewSetDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_REVIEW_SET_VERSION
  readonly setClass:
    'complete_character_keypose_review_set'
  readonly setId: string
  readonly keyposePlanRef:
    LivingFrameCompleteCharacterKeyposeReviewRequest['keyposePlanRef']
  readonly reviews:
    readonly LivingFrameCompleteCharacterKeyposeReview[]
  readonly exactRoleOrder:
    readonly LivingFrameCompleteCharacterKeyposeRole[]
  readonly everyPlannedPoseReviewed:
    true
  readonly everyPoseAccepted: boolean
  readonly interpolationAdmissionCandidateMayBeMaterialized:
    boolean
  readonly rejectedOrRepairRequiredReviewIds:
    readonly string[]
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly productionReady: false
}

export interface LivingFrameCompleteCharacterKeyposeReviewSet
  extends LivingFrameCompleteCharacterKeyposeReviewSetDraft {
  readonly reviewSetDigestSha256: string
}
