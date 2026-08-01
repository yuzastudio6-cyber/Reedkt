export const LIVING_FRAME_AI_2D_CHARACTER_MOTION_STRATEGY_VERSION =
  'living-frame-ai-2d-character-motion-strategy-v1' as const

export const LIVING_FRAME_AI_2D_CHARACTER_MOTION_STRATEGY_CLASS =
  'server_derived_ai_assisted_2d_character_motion_strategy' as const

export type LivingFrameAi2dCharacterMotionStrategy =
  | 'ai_2d_complete_keyposes'
  | 'restrained_rigid_character_motion'
  | 'professionally_authored_opentoonz_rig'
  | 'professionally_authored_blender_rig'
  | 'real_motion_fallback'
  | 'no_character_animation'

export type LivingFrameProfessionalVisualDisposition =
  | 'pending'
  | 'accepted'
  | 'repair_required'
  | 'rejected'

export interface LivingFrameAi2dCharacterMotionEvidence {
  readonly evidenceId: string
  readonly sceneId: string
  readonly componentId: string
  readonly sourceArtifactId: string
  readonly illustrativeNotArchivalEvidence: boolean
  readonly requestedMotionMagnitude:
    | 'ambient'
    | 'restrained'
    | 'moderate_pose_change'
    | 'large_pose_change'
  readonly requestedActionSummary: string
  readonly completeCharacterReferenceAvailable: boolean
  readonly styleReferenceAvailable: boolean
  readonly poseControlAvailable: boolean
  readonly requiresNewPixelsOrHiddenAnatomy: boolean
  readonly continuousNaturalMotionRequired: boolean
  readonly restrainedRigidMotionPreservesSilhouette: boolean
  readonly professionallyAuthoredOpenToonzRigAvailable: boolean
  readonly professionallyAuthoredBlenderRigAvailable: boolean
  readonly visibleJointHardwarePresent: boolean
  readonly jointSeamsConcealedAcrossPoseRange: boolean
  readonly anatomicalProportionsReviewedAcrossPoseRange: boolean
  readonly handPropAttachmentReviewedAcrossPoseRange: boolean
  readonly secondaryPartsAnchoredAcrossPoseRange: boolean
  readonly protectedFaceAndIdentityRegionsDefined: boolean
  readonly priorRejectedVisualProofRefs: readonly string[]
  readonly rawChatPromptPathUrlModelCodeOrBytesIncluded: false
}

export interface LivingFrameAi2dCharacterMotionStrategyDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_AI_2D_CHARACTER_MOTION_STRATEGY_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_AI_2D_CHARACTER_MOTION_STRATEGY_CLASS
  readonly evidence:
    LivingFrameAi2dCharacterMotionEvidence
  readonly decision: {
    readonly selectedStrategy:
      LivingFrameAi2dCharacterMotionStrategy
    readonly strategyState:
      | 'source_only_ai_2d_feasibility_candidate'
      | 'qualified_private_rigid_character_route'
      | 'evaluation_candidate_only'
      | 'blocked_pending_real_motion_runtime'
      | 'deliberate_non_use'
    readonly reasonCodes: readonly string[]
    readonly completeKeyposeCount:
      0 | 3 | 4 | 5
    readonly generateEveryFrameIndependently: false
    readonly blenderIsGenericStillCharacterRoute: false
    readonly remotionOwnsFinalCanvas: true
  }
  readonly toolResponsibilities: {
    readonly headIntelligence:
      'select_strategy_direct_action_and_accept_or_reject_actual_rendered_motion'
    readonly gptImage2:
      'design_or_repair_complete_character_source_and_keypose_candidates'
    readonly comfyUi:
      'orchestrate_pose_depth_reference_ip_adapter_controlnet_and_optional_lora_for_complete_keyposes'
    readonly toonCrafter:
      'evaluation_only_cartoon_interpolation_between_already_accepted_complete_keyposes'
    readonly rife:
      'evaluation_only_frame_cadence_smoothing_after_motion_and_anatomy_are_already_accepted'
    readonly openToonz:
      'animate_only_professionally_authored_2d_mesh_or_cutout_assets'
    readonly pixiJs:
      'animate_rigid_editorial_components_environmental_effects_particles_and_support_motion'
    readonly blender:
      'animate_only_professionally_authored_rigs_3d_objects_cameras_or_non_character_2_5d_assets'
    readonly remotion:
      'own_final_canvas_layout_depth_captions_audio_timing_and_approved_motion_composition'
  }
  readonly keyposePolicy: {
    readonly poseRoles:
      readonly [
        'start',
        'action_apex',
        'settle',
      ]
    readonly everyPoseIsACompleteCharacter: true
    readonly detachedLimbGenerationForbidden: true
    readonly independentPerFrameGenerationForbidden: true
    readonly poseGenerationPrecedesInterpolation: true
    readonly everyPoseRequiresVisualAcceptance: true
    readonly failedPoseBlocksInterpolation: true
  }
  readonly renderedVisualAcceptance: {
    readonly technicalMetricsCannotApproveVisualQuality: true
    readonly actualRenderedClipInspectionRequired: true
    readonly sampledFrameInspectionRequired: true
    readonly dispositions:
      readonly [
        'accepted',
        'repair_required',
        'rejected',
      ]
    readonly blockingChecks: readonly [
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
    ]
    readonly currentDisposition:
      LivingFrameProfessionalVisualDisposition
  }
  readonly feasibilityGate: {
    readonly requiredFixtureCount: 3
    readonly maximumKeyposeAttemptsPerRole: 3
    readonly allKeyposesMustPassBeforeInterpolation: true
    readonly allRenderedFixturesMustPassProfessionalVisualReview: true
    readonly routineManualRepaintMeansAutomationFailed: true
    readonly failureDisablesAutomatedCharacterAnimationWithoutDisablingLivingFrame: true
  }
  readonly registryAndRuntimeBoundary: {
    readonly createsToolIdentity: false
    readonly toonCrafterRegistered: false
    readonly rifeRegistered: false
    readonly openToonzRuntimeQualified: false
    readonly comfyUiKeyposeRuntimeQualified: false
    readonly operationRegistered: false
    readonly dispatchGranted: false
    readonly runtimeGranted: false
    readonly assetCreated: false
    readonly actualCostCreated: false
  }
  readonly authorityBoundary: {
    readonly privatePlanningEvidenceAuthority: true
    readonly selectedSceneAuthority: false
    readonly approvalAuthority: false
    readonly masterTimingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly assetAuthority: false
    readonly qaApprovalAuthority: false
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

export interface LivingFrameAi2dCharacterMotionStrategyRecord
  extends LivingFrameAi2dCharacterMotionStrategyDraft {
  readonly strategyDigestSha256: string
}
