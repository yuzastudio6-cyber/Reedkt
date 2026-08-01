export const LIVING_FRAME_OWNER_SCOPE_AMENDMENT_VERSION =
  'living-frame-owner-scope-amendment-v1' as const

export const LIVING_FRAME_OWNER_SCOPE_AMENDMENT_CLASS =
  'server_derived_non_executable_owner_scope_amendment' as const

export type LivingFrameActiveNonIllustrationScope =
  | 'living_a_roll_compositing'
  | 'static_illustration_without_character_animation'
  | 'living_still_non_character_selective_motion'
  | 'living_archive'
  | 'living_diagram'
  | 'hybrid_expansion_non_character'
  | 'maps_routes_and_data_graphics'
  | 'attention_focus_and_semantic_scale'
  | 'camera_depth_occlusion_and_masks'
  | 'environmental_editorial_and_rigid_support_motion'
  | 'sound_story_timing_and_caption_coordination'
  | 'remotion_composition_qa_and_private_review'

export type LivingFramePausedOwnerSpecificationScope =
  | 'illustrated_character_animation'
  | 'living_or_organic_subject_animation'
  | 'complete_character_keypose_generation'
  | 'character_pose_interpolation'
  | 'character_frame_cadence_smoothing'
  | 'living_or_organic_subject_rigging'
  | 'mechanical_object_rigging'

export interface LivingFrameOwnerScopeAmendmentDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_OWNER_SCOPE_AMENDMENT_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_OWNER_SCOPE_AMENDMENT_CLASS
  readonly policyState:
    'non_illustration_living_frame_active_animation_routes_paused'
  readonly ownerDecision: {
    readonly staticIllustrationMayRemainAsAStillVisualElement: true
    readonly illustratedCharacterAnimationPaused: true
    readonly livingOrOrganicSubjectAnimationPaused: true
    readonly livingOrOrganicSubjectRiggingForbidden: true
    readonly mechanicalRiggingPausedPendingSeparateOwnerSpecification: true
    readonly priorCharacterAnimationResearchMayAuthorizeAdmission: false
    readonly resumeRequiresExplicitFutureOwnerSpecification: true
  }
  readonly activeScope:
    readonly LivingFrameActiveNonIllustrationScope[]
  readonly pausedScope:
    readonly LivingFramePausedOwnerSpecificationScope[]
  readonly routingRules: {
    readonly activeNonIllustrationWorkMustContinue: true
    readonly characterKeyposeAdmissionWrapperMayBeCompiled: false
    readonly completeCharacterControlledImageOperationMayBeAdmitted: false
    readonly toonCrafterCharacterInterpolationMayBeAdmitted: false
    readonly rifeCharacterCadenceSmoothingMayBeAdmitted: false
    readonly blenderOrOpenToonzLivingSubjectRigMayBeAdmitted: false
    readonly mechanicalRigOperationMayBeAdmitted: false
    readonly unknownSubjectMayDefaultToMechanical: false
    readonly genericSelectedSceneComfyUiRequestContractRemainsUnchanged: true
    readonly remotionOwnsFinalCanvas: true
    readonly masterTimingRemainsCanonical: true
  }
  readonly evidencePolicy: {
    readonly rejectedGenericCharacterRigRendersRemainNegativeEvidenceOnly: true
    readonly priorSourceContractsRemainResearchNotActiveAdmission: true
    readonly technicalMetricsCannotApproveVisualQuality: true
    readonly headIntelligenceMustInspectEveryRenderedFixture: true
  }
  readonly authorityBoundary: {
    readonly operationRegistryAuthority: false
    readonly providerAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly assetAuthority: false
    readonly qaApprovalAuthority: false
    readonly renderAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameOwnerScopeAmendment
  extends LivingFrameOwnerScopeAmendmentDraft {
  readonly amendmentDigestSha256: string
}
