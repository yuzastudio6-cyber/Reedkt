import type {
  LivingFrameNormalizedRect,
} from './living-frame-component-geometry'

export const LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_VERSION =
  'living-frame-background-plate-reconstruction-v1' as const

export const LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_CLASS =
  'controlled_non_promotable_background_plate_reconstruction_spec' as const

export const LIVING_FRAME_RECONSTRUCTION_SAFETY_CLASSES = [
  'ordinary_visual_region',
  'identity_or_likeness_sensitive_region',
  'documentary_evidence_region',
  'exact_map_or_data_region',
  'unknown_region',
] as const
export type LivingFrameReconstructionSafetyClass =
  (typeof LIVING_FRAME_RECONSTRUCTION_SAFETY_CLASSES)[number]

export const LIVING_FRAME_RECONSTRUCTION_TEXTURE_CLASSES = [
  'low',
  'medium',
  'high',
  'unknown',
] as const
export type LivingFrameReconstructionTextureClass =
  (typeof LIVING_FRAME_RECONSTRUCTION_TEXTURE_CLASSES)[number]

export const LIVING_FRAME_RECONSTRUCTION_PROFILES = [
  'opencv_telea_small_hole_candidate',
  'opencv_navier_stokes_bounded_hole_candidate',
  'no_pixel_reconstruction_use_fallback',
] as const
export type LivingFrameReconstructionProfile =
  (typeof LIVING_FRAME_RECONSTRUCTION_PROFILES)[number]

export const LIVING_FRAME_RECONSTRUCTION_BLOCKER_CODES = [
  'identity_or_likeness_reconstruction_prohibited',
  'documentary_evidence_reconstruction_prohibited',
  'exact_map_or_data_reconstruction_prohibited',
  'unknown_region_requires_review',
  'hole_touches_frame_boundary',
  'hole_area_exceeds_deterministic_ceiling',
  'texture_complexity_exceeds_deterministic_ceiling',
  'canonical_opencv_pixel_operation_not_admitted',
  'qa_passed_plate_and_mask_artifacts_required',
] as const
export type LivingFrameReconstructionBlockerCode =
  (typeof LIVING_FRAME_RECONSTRUCTION_BLOCKER_CODES)[number]

export const LIVING_FRAME_RECONSTRUCTION_FALLBACK_STEPS = [
  'keep_component_static_over_original_plate',
  'reframe_to_hide_unreconstructed_region',
  'use_opaque_full_scene_or_panel',
  'omit_living_frame_depth_effect',
] as const
export type LivingFrameReconstructionFallbackStep =
  (typeof LIVING_FRAME_RECONSTRUCTION_FALLBACK_STEPS)[number]

export const LIVING_FRAME_RECONSTRUCTION_QA_CODES = [
  'outside_mask_pixels_unchanged',
  'plate_dimensions_and_color_profile_match',
  'mask_boundary_residual_check',
  'reconstruction_seam_continuity',
  'no_identity_text_fact_or_geography_invention',
  'destination_composite_review',
] as const
export type LivingFrameReconstructionQaCode =
  (typeof LIVING_FRAME_RECONSTRUCTION_QA_CODES)[number]

export interface LivingFrameBackgroundPlateSourceBindings {
  readonly sceneId: string
  readonly outputFrameId: string
  readonly outputFrameDigestSha256: string
  readonly masterTimingPlanId: string
  readonly masterTimingPlanDigestSha256: string
  readonly componentRigDigestSha256: string
}

export interface LivingFrameBackgroundPlateHoleExpectationInput {
  readonly holeId: string
  readonly order: number
  readonly plateComponentId: string
  readonly removedComponentId: string
  readonly normalizedBounds: LivingFrameNormalizedRect
  readonly frameCoverageRatio: number
  readonly touchesFrameBoundary: boolean
  readonly textureClass: LivingFrameReconstructionTextureClass
  readonly safetyClass: LivingFrameReconstructionSafetyClass
  readonly maskEvidenceExpectation:
    'future_qa_passed_component_alpha_artifact_required'
}

export interface LivingFrameBackgroundPlateReconstructionDecision {
  readonly holeId: string
  readonly order: number
  readonly plateComponentId: string
  readonly removedComponentId: string
  readonly normalizedBounds: LivingFrameNormalizedRect
  readonly frameCoverageRatio: number
  readonly textureClass: LivingFrameReconstructionTextureClass
  readonly safetyClass: LivingFrameReconstructionSafetyClass
  readonly reconstructionProfile: LivingFrameReconstructionProfile
  readonly inpaintRadiusPixelsExpectation: 0 | 3 | 5
  readonly blockerCodes:
    readonly LivingFrameReconstructionBlockerCode[]
  readonly fallbackLadder:
    readonly LivingFrameReconstructionFallbackStep[]
  readonly qaExpectationCodes:
    readonly LivingFrameReconstructionQaCode[]
  readonly executablePixelOperationAdmitted: false
  readonly qaPassedInputArtifactsBound: false
}

export interface LivingFrameBackgroundPlateArtifactExpectation {
  readonly workItemTypeExpectation: 'reconstruct_background_plate'
  readonly artifactTypeExpectation:
    'living_frame_reconstructed_background_plate_png'
  readonly assetRoleExpectation: 'processed'
  readonly contentTypeExpectation: 'image/png'
  readonly requiredDependencyArtifactKinds:
    readonly ['opaque_source_plate', 'component_alpha_mask']
  readonly canonicalWorkItemCreationStillRequired: true
  readonly canonicalAssetManifestEntryStillRequired: true
  readonly canonicalArtifactQaStillRequired: true
}

export interface LivingFrameBackgroundPlateReconstructionMetrics {
  readonly holeCount: number
  readonly smallHoleCandidateCount: number
  readonly boundedHoleCandidateCount: number
  readonly fallbackOnlyCount: number
  readonly prohibitedSafetyRegionCount: number
  readonly maximumFrameCoverageRatio: number
}

export interface LivingFrameBackgroundPlateReconstructionAuthorityBoundary {
  readonly reconstructionPlanningOnly: true
  readonly selectedSceneAuthority: false
  readonly outputFrameAuthority: false
  readonly masterTimingAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
  readonly pixelExecutionAuthority: false
  readonly workItemCreationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly queueAuthority: false
  readonly assetManifestMutationAuthority: false
  readonly qaApprovalAuthority: false
  readonly rendererAuthority: false
  readonly renderExecutionAuthority: false
  readonly runtimePromotionAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameBackgroundPlateReconstructionSpecDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_VERSION
  readonly reconstructionClass:
    typeof LIVING_FRAME_BACKGROUND_PLATE_RECONSTRUCTION_CLASS
  readonly sourceBindings: LivingFrameBackgroundPlateSourceBindings
  readonly decisions:
    readonly LivingFrameBackgroundPlateReconstructionDecision[]
  readonly artifactExpectation:
    LivingFrameBackgroundPlateArtifactExpectation
  readonly metrics: LivingFrameBackgroundPlateReconstructionMetrics
  readonly authorityBoundary:
    LivingFrameBackgroundPlateReconstructionAuthorityBoundary
  readonly subjectSpecificRouting: false
  readonly createsPixels: false
  readonly containsExecutableCodeCommandsPathsUrlsOrCredentials: false
  readonly canonicalOperationAdmissionStillRequired: true
  readonly currentSourceAndMaskArtifactRevalidationStillRequired: true
}

export interface LivingFrameBackgroundPlateReconstructionSpec
  extends LivingFrameBackgroundPlateReconstructionSpecDraft {
  readonly reconstructionDigestSha256: string
}
