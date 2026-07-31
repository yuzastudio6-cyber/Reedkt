export const LIVING_FRAME_PROFESSIONAL_VISUAL_REVIEW_VERSION =
  'living-frame-professional-visual-review-v1' as const

export const LIVING_FRAME_PROFESSIONAL_VISUAL_REVIEW_CLASS =
  'head_intelligence_rendered_motion_professional_visual_review' as const

export const LIVING_FRAME_PROFESSIONAL_VISUAL_CHECK_IDS = [
  'anatomy_and_limb_count',
  'joint_and_silhouette_continuity',
  'face_and_identity_continuity',
  'clothing_and_proportion_continuity',
  'hand_and_prop_attachment',
  'secondary_part_attachment',
  'temporal_flicker_and_texture_crawl',
  'motion_intent_and_physical_plausibility',
  'frame_layout_depth_caption_and_safe_zone_integration',
  'style_lighting_and_color_continuity',
] as const

export type LivingFrameProfessionalVisualCheckId =
  typeof LIVING_FRAME_PROFESSIONAL_VISUAL_CHECK_IDS[number]

export type LivingFrameProfessionalVisualCheckOutcome =
  | 'pass'
  | 'repairable_failure'
  | 'blocking_failure'

export interface LivingFrameProfessionalVisualCheckEvidence {
  readonly checkId:
    LivingFrameProfessionalVisualCheckId
  readonly outcome:
    LivingFrameProfessionalVisualCheckOutcome
  readonly observationSummary: string
  readonly evidenceRefIds: readonly string[]
}

export interface LivingFrameProfessionalVisualReviewRequest {
  readonly reviewId: string
  readonly sceneId: string
  readonly componentId: string
  readonly motionStrategyRef: {
    readonly contractVersion: string
    readonly version: number
    readonly digestSha256: string
  }
  readonly renderedArtifact: {
    readonly privateObjectIdentityHash: string
    readonly contentType: 'video/mp4'
    readonly byteLength: number
    readonly sha256: string
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly frameCount: number
    readonly boundedReviewProxy: boolean
    readonly finalCanvasClaimed: false
  }
  readonly technicalQaRef: {
    readonly contractVersion: string
    readonly version: number
    readonly digestSha256: string
    readonly technicalExecutionPassed: boolean
  }
  readonly inspection: {
    readonly performedBy:
      | 'head_intelligence'
      | 'owner'
      | 'head_intelligence_and_owner'
    readonly actualRenderedClipInspected: true
    readonly actualMotionAtPlaybackSpeedInspected:
      true
    readonly sampledFrameNumbers:
      readonly number[]
    readonly fullDurationCovered: true
  }
  readonly checks:
    readonly LivingFrameProfessionalVisualCheckEvidence[]
  readonly containsRawChatTranscriptMediaBytesPathUrlCredentialCommandOrEnvironment:
    false
}

export interface LivingFrameProfessionalVisualReviewDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_PROFESSIONAL_VISUAL_REVIEW_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_PROFESSIONAL_VISUAL_REVIEW_CLASS
  readonly request:
    LivingFrameProfessionalVisualReviewRequest
  readonly disposition:
    | 'accepted'
    | 'repair_required'
    | 'rejected'
  readonly failedCheckIds:
    readonly LivingFrameProfessionalVisualCheckId[]
  readonly technicalExecutionPassed:
    boolean
  readonly professionalVisualAcceptancePassed:
    boolean
  readonly technicalMetricsAloneCannotApproveVisualQuality:
    true
  readonly acceptedOutputMayProceedToCanonicalReconciliation:
    boolean
  readonly rejectedOrRepairOutputBlocksDownstreamUse:
    boolean
  readonly authorityBoundary: {
    readonly privateVisualReviewEvidenceAuthority:
      true
    readonly selectedSceneAuthority: false
    readonly approvalAuthority: false
    readonly masterTimingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly assetAuthority: false
    readonly assetManifestAuthority: false
    readonly canonicalQaApprovalAuthority:
      false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly canonicalQaApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameProfessionalVisualReviewRecord
  extends LivingFrameProfessionalVisualReviewDraft {
  readonly reviewDigestSha256: string
}
