import type {
  LivingFrameMode,
} from './living-frame'

export const LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_REVIEW_VERSION =
  'living-frame-non-character-professional-review-v1' as const

export const LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_REVIEW_CLASS =
  'head_intelligence_non_character_living_frame_scene_professional_review' as const

export const LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS = [
  'narrative_point_and_visual_comprehension',
  'focal_hierarchy_attention_handoff_and_restoration',
  'source_speaker_contact_object_and_product_preservation',
  'composition_safe_zones_caption_and_label_priority',
  'depth_occlusion_anchor_perspective_and_parallax',
  'motion_semantics_timing_easing_hold_and_settle',
  'semantic_scale_data_geography_and_fact_integrity',
  'map_diagram_document_typography_and_label_accuracy',
  'color_light_texture_grain_and_source_integration',
  'sound_narration_protection_spatial_fit_and_restraint',
  'transition_expansion_return_and_scene_continuity',
  'edge_flicker_compression_artifact_and_output_integrity',
  'overall_professional_polish_and_style_coherence',
] as const

export type LivingFrameNonCharacterProfessionalCheckId =
  typeof LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS[number]

export type LivingFrameNonCharacterProfessionalCheckOutcome =
  | 'pass'
  | 'repairable_failure'
  | 'blocking_failure'
  | 'not_applicable'

export interface LivingFrameNonCharacterProfessionalCheckEvidence {
  readonly checkId:
    LivingFrameNonCharacterProfessionalCheckId
  readonly applicable: boolean
  readonly outcome:
    LivingFrameNonCharacterProfessionalCheckOutcome
  readonly observationSummary: string
  readonly evidenceRefIds: readonly string[]
}

export interface LivingFrameNonCharacterProfessionalReviewRequest {
  readonly reviewId: string
  readonly sceneId: string
  readonly mode: LivingFrameMode
  readonly sourceBindings: {
    readonly ownerScopeAmendmentVersion:
      'living-frame-owner-scope-amendment-v1'
    readonly ownerScopeAmendmentDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly rendererBindingDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
  }
  readonly activeScopeAssertions: {
    readonly reviewedUnderActiveNonCharacterScope: true
    readonly containsAnimatedLivingOrOrganicSubject: false
    readonly containsCharacterKeyposeOrInterpolationOutput: false
    readonly containsLivingSubjectRigging: false
    readonly containsMechanicalRigging: false
    readonly staticIllustrationIfPresentRemainsUnanimated: true
    readonly simpleRigidComponentTransformMayBePresent: boolean
  }
  readonly sceneEvidence: {
    readonly movingSourceSpeakerPresent: boolean
    readonly exactMapDiagramDataOrDocumentPresent: boolean
    readonly soundPresent: boolean
    readonly expansionOrReturnTransitionPresent: boolean
    readonly deliberateNonUseRangePresent: boolean
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
    readonly boundedPrivateReviewOnly: true
    readonly finalCanvasOwnedByRemotion: true
    readonly publicDeliveryCandidate: false
  }
  readonly confirmedFrame: {
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
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
      | 'head_intelligence_and_owner'
    readonly actualRenderedClipInspected: true
    readonly actualMotionAtPlaybackSpeedInspected: true
    readonly completeAudioTrackAuditionedWhenPresent: true
    readonly sampledFrameNumbers: readonly number[]
    readonly entryPeakHoldSettleAndExitCovered: true
    readonly fullDurationCovered: true
  }
  readonly checks:
    readonly LivingFrameNonCharacterProfessionalCheckEvidence[]
  readonly containsRawChatTranscriptMediaBytesPathUrlCredentialPromptCommandOrEnvironment:
    false
}

export interface LivingFrameNonCharacterProfessionalReviewDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_REVIEW_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_REVIEW_CLASS
  readonly reviewState:
    'actual_non_character_scene_inspected_technical_and_visual_results_separated'
  readonly request:
    LivingFrameNonCharacterProfessionalReviewRequest
  readonly disposition:
    | 'accepted'
    | 'repair_required'
    | 'rejected'
  readonly failedCheckIds:
    readonly LivingFrameNonCharacterProfessionalCheckId[]
  readonly notApplicableCheckIds:
    readonly LivingFrameNonCharacterProfessionalCheckId[]
  readonly technicalExecutionPassed: boolean
  readonly professionalVisualAcceptancePassed: boolean
  readonly technicalMetricsAloneCannotApproveVisualQuality: true
  readonly headIntelligenceInspectionRequired: true
  readonly localRepairPermitted: boolean
  readonly fullSceneReplanOrFallbackRequired: boolean
  readonly repairedOutputRequiresCompleteReinspection: boolean
  readonly acceptedOutputMayProceedToCanonicalReconciliation:
    boolean
  readonly rejectedOrRepairOutputBlocksDownstreamUse: boolean
  readonly pausedAnimationEvidenceUsedForAcceptance: false
  readonly authorityBoundary: {
    readonly privateProfessionalReviewEvidenceAuthority: true
    readonly livingFrameSelectionAuthority: false
    readonly layoutAuthority: false
    readonly masterTimingAuthority: false
    readonly soundSyncAuthority: false
    readonly approvedSnapshotAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly assetAuthority: false
    readonly assetManifestAuthority: false
    readonly canonicalQaApprovalAuthority: false
    readonly rendererAuthority: false
    readonly finalCanvasAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameNonCharacterProfessionalReviewRecord
  extends LivingFrameNonCharacterProfessionalReviewDraft {
  readonly reviewDigestSha256: string
}
