import type {
  LivingFrameActiveNonIllustrationCaseId,
} from './living-frame-active-non-illustration-aggregate'
import type {
  LivingFrameActiveNonIllustrationScope,
  LivingFramePausedOwnerSpecificationScope,
} from './living-frame-owner-scope-amendment'
import type {
  LivingFrameNonCharacterProfessionalCheckId,
} from './living-frame-non-character-professional-review'

export const LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_VERSION =
  'living-frame-representative-visual-fixture-v1' as const

export const LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_CLASS =
  'byte_free_non_executable_representative_media_acceptance_plan' as const

export const LIVING_FRAME_REPRESENTATIVE_CONTENT_KINDS = [
  'real_source_a_roll_with_integrated_visual',
  'approved_static_illustration_without_subject_animation',
  'source_bound_non_character_still_with_selective_environmental_motion',
  'source_verified_archive_document_composition',
  'source_verified_diagram_or_process_visual',
  'real_source_a_roll_to_non_character_visual_expansion_and_return',
  'source_verified_map_route_or_literal_data_graphic',
  'real_scene_attention_focus_and_semantic_scale_demonstration',
  'real_scene_camera_depth_occlusion_and_mask_demonstration',
  'non_character_environmental_editorial_or_preapproved_rigid_support_motion',
  'real_narration_caption_and_soundsync_coordination_demonstration',
  'exact_final_remotion_artifact_professional_review_and_repair',
] as const

export type LivingFrameRepresentativeContentKind =
  typeof LIVING_FRAME_REPRESENTATIVE_CONTENT_KINDS[number]

export const LIVING_FRAME_REPRESENTATIVE_ASSET_ROLES = [
  'approved_source_video',
  'approved_static_illustration',
  'approved_non_character_still',
  'approved_archive_source',
  'approved_document_source',
  'approved_map_source',
  'approved_data_source',
  'approved_diagram_source',
  'approved_caption_projection',
  'approved_soundsync_mix',
  'approved_temporal_mask_or_safe_space_fallback',
  'approved_remotion_final_artifact',
] as const

export type LivingFrameRepresentativeAssetRole =
  typeof LIVING_FRAME_REPRESENTATIVE_ASSET_ROLES[number]

export type LivingFrameRepresentativeMotionPolicy =
  | 'source_motion_plus_integrated_non_character_visuals'
  | 'no_illustrated_subject_animation'
  | 'selective_environmental_or_editorial_motion_only'
  | 'document_camera_and_layer_motion_only'
  | 'diagram_reveal_and_relationship_motion_only'
  | 'expansion_return_and_attention_motion_only'
  | 'literal_map_route_or_data_reveal_only'
  | 'focus_camera_and_semantic_scale_only'
  | 'camera_depth_occlusion_and_approved_mask_only'
  | 'preapproved_rigid_transform_without_rig_inference'
  | 'caption_and_soundsync_timing_only'
  | 'no_new_motion_review_exact_final_artifact'

export interface LivingFrameRepresentativeFixtureSourceRequirements {
  readonly realOrSourceVerifiedRepresentativeMediaRequired: true
  readonly geometryOnlyProbeMayCountAsProfessionalEvidence: false
  readonly syntheticRectanglesMayCountAsProfessionalEvidence: false
  readonly placeholderMayReachFinalReview: false
  readonly exactSourceProvenanceRequired: true
  readonly immutableSourceRereadRequired: true
  readonly confirmedOutputFrameRequired: true
  readonly canonicalMasterTimingRequired: true
  readonly canonicalWorkAndManifestLineageRequired: true
  readonly generatedVideoFallbackPermitted: false
}

export interface LivingFrameRepresentativeFixtureReviewRequirements {
  readonly exactProfessionalCheckIds:
    readonly LivingFrameNonCharacterProfessionalCheckId[]
  readonly completePlaybackInspectionRequired: true
  readonly completeTimeQwenVisualEvidenceRequired: true
  readonly separateVerifiedAudioEvidenceRequired: true
  readonly kimiPrimaryTerraFallbackRecommendationRequired: true
  readonly canonicalPrivateReviewRequired: true
  readonly metricsOnlyAcceptancePermitted: false
  readonly callerAssertionAcceptancePermitted: false
  readonly failedArtifactMayBeReusedAfterRepair: false
  readonly nPlusOneRepairAndCompleteReinspectionRequired: true
}

export interface LivingFrameRepresentativeVisualFixtureCase {
  readonly caseId: LivingFrameActiveNonIllustrationCaseId
  readonly order: number
  readonly activeScope: LivingFrameActiveNonIllustrationScope
  readonly contentKind: LivingFrameRepresentativeContentKind
  readonly requiredAssetRoles:
    readonly LivingFrameRepresentativeAssetRole[]
  readonly motionPolicy: LivingFrameRepresentativeMotionPolicy
  readonly sourceRequirements:
    LivingFrameRepresentativeFixtureSourceRequirements
  readonly reviewRequirements:
    LivingFrameRepresentativeFixtureReviewRequirements
  readonly ownerScopeAmendmentDigestSha256: string
  readonly narrativeIntentRefDigestSha256: string
  readonly styleProfileRefDigestSha256: string
  readonly confirmedFrameRefDigestSha256: string
  readonly masterTimingRefDigestSha256: string
  readonly caseDigestSha256: string
}

export interface LivingFrameRepresentativeVisualFixtureManifestDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_VERSION
  readonly fixtureClass:
    typeof LIVING_FRAME_REPRESENTATIVE_VISUAL_FIXTURE_CLASS
  readonly state:
    'representative_media_required_engineering_geometry_is_not_acceptance_evidence'
  readonly ownerScopeAmendmentVersion:
    'living-frame-owner-scope-amendment-v1'
  readonly ownerScopeAmendmentDigestSha256: string
  readonly cases:
    readonly LivingFrameRepresentativeVisualFixtureCase[]
  readonly activeCaseCount: 12
  readonly pausedScopesRejected:
    readonly LivingFramePausedOwnerSpecificationScope[]
  readonly pausedScopeCount: 7
  readonly engineeringGeometryProbeMayApproveProfessionalQuality: false
  readonly currentEngineeringAggregateMayApproveProfessionalQuality: false
  readonly representativeMediaRuntimeExecuted: false
  readonly qwenProviderCallMade: false
  readonly headQaRecommendationMade: false
  readonly canonicalPrivateReviewApproved: false
  readonly canonicalConsumptionPending: true
  readonly createsPlannerSnapshotTimingWorkAssetRendererQaOrReviewOwner: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameRepresentativeVisualFixtureManifest
  extends LivingFrameRepresentativeVisualFixtureManifestDraft {
  readonly caseSetDigestSha256: string
  readonly manifestDigestSha256: string
}
