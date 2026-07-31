export const LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_VERSION =
  'living-frame-character-motion-tool-policy-v2' as const

export const LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_CLASS =
  'server_derived_non_executable_character_motion_tool_policy' as const

export type LivingFrameCharacterMotionOwner =
  | 'head_intelligence'
  | 'gpt_image_2'
  | 'comfyui'
  | 'tooncrafter'
  | 'rife'
  | 'opentoonz'
  | 'pixijs'
  | 'blender'
  | 'remotion'

export type LivingFrameCharacterMotionQualificationState =
  | 'planning_contract_ready'
  | 'private_bounded_evidence_only'
  | 'evaluation_required'
  | 'generic_character_route_quarantined'

export interface LivingFrameCharacterMotionToolResponsibility {
  readonly owner: LivingFrameCharacterMotionOwner
  readonly responsibility: string
  readonly permittedInputs: readonly string[]
  readonly permittedOutputs: readonly string[]
  readonly forbiddenClaims: readonly string[]
  readonly qualificationState:
    LivingFrameCharacterMotionQualificationState
  readonly requiresActualRenderedVisualInspection:
    boolean
}

export interface LivingFrameCharacterMotionToolPolicyDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_CLASS
  readonly policyState:
    'source_only_tool_responsibilities_locked_runtime_feasibility_pending'
  readonly governingRules: {
    readonly minimumProfessionalRouteOnly: true
    readonly completeCharacterBeforeInterpolation: true
    readonly technicalMetricsCannotApproveVisualQuality: true
    readonly headIntelligenceMustInspectActualRenderedOutput: true
    readonly failedVisualReviewBlocksEveryDownstreamStage: true
    readonly silentToolSubstitutionForbidden: true
    readonly independentAiFrameGenerationForbidden: true
    readonly livingOrOrganicSubjectRiggingForbidden: true
    readonly livingOrOrganicSubjectUsesCompleteFramePoseAnimation:
      true
    readonly mechanicalObjectRiggingMayBePlannedOnlyAfterOwnerSpecification:
      true
    readonly unknownSubjectClassificationBlocksRigging: true
    readonly everyCharacterMotionRouteRequiresSubjectClassGate: true
    readonly remotionOwnsFinalCanvas: true
    readonly masterTimingRemainsCanonical: true
  }
  readonly responsibilities:
    readonly LivingFrameCharacterMotionToolResponsibility[]
  readonly ai2dSequence: readonly [
    'head_intelligence_route_and_action_direction',
    'gpt_image_2_complete_source_design_or_repair_when_required',
    'comfyui_controlled_complete_keyposes',
    'head_intelligence_complete_keypose_visual_acceptance',
    'tooncrafter_bounded_interpolation_evaluation',
    'head_intelligence_rendered_motion_visual_acceptance',
    'rife_optional_cadence_smoothing_only_after_acceptance',
    'pixijs_optional_support_motion',
    'remotion_final_composition',
    'head_intelligence_final_composite_visual_acceptance',
  ]
  readonly authoredRigAlternatives: {
    readonly openToonz:
      'only_professionally_authored_nonliving_mechanical_2d_object_rig'
    readonly blender:
      'only_professionally_authored_nonliving_mechanical_object_3d_or_2_5d'
    readonly livingOrOrganicSubject:
      'rigging_forbidden_use_complete_frame_pose_animation'
    readonly mechanicalRigSpecification:
      'pending_explicit_owner_direction'
    readonly arbitraryStillCharacterRigging:
      'forbidden'
  }
  readonly failurePolicy: {
    readonly keyposeFailure:
      'repair_only_failed_complete_pose_up_to_attempt_limit_then_disable_character_motion'
    readonly interpolationFailure:
      'reject_clip_and_fallback_to_accepted_still_or_restrained_motion'
    readonly rigFailure:
      'return_to_route_selection_without_silent_backend_substitution'
    readonly finalCompositeFailure:
      'local_repair_then_reinspect_actual_render'
    readonly livingFrameWithoutCharacterMotionRemainsAvailable:
      true
  }
  readonly registryPolicy: {
    readonly createsOrMutatesToolIdentity: false
    readonly modelWeightsAdaptersLibrariesAndPreprocessorsAreNotToolIdentities:
      true
    readonly comfyUiIsOneSupervisedHostAttempt: true
    readonly distinctReleasedRuntimeMayLaterReceiveIdentityAfterQualification:
      true
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

export interface LivingFrameCharacterMotionToolPolicy
  extends LivingFrameCharacterMotionToolPolicyDraft {
  readonly policyDigestSha256: string
}
