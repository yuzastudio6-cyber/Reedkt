import {
  LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_CLASS,
  LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_VERSION,
  type LivingFrameCharacterMotionToolPolicy,
  type LivingFrameCharacterMotionToolPolicyDraft,
} from '../../src/types/living-frame-character-motion-tool-policy'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const RESPONSIBILITIES = [
  {
    owner: 'head_intelligence',
    responsibility:
      'Select the minimum professional route, direct the structured narrative action, and inspect every actual keypose, motion clip, and final composite.',
    permittedInputs: [
      'compiled_narrative_intent',
      'approved_scene_lineage',
      'source_and_style_evidence',
      'technical_qa_evidence',
      'actual_rendered_visual_evidence',
    ],
    permittedOutputs: [
      'structured_route_decision',
      'structured_action_direction',
      'accepted_repair_required_or_rejected_disposition',
    ],
    forbiddenClaims: [
      'visual_acceptance_from_numeric_metrics_only',
      'canonical_timing_ownership',
      'executable_tool_code',
    ],
    qualificationState:
      'planning_contract_ready',
    requiresActualRenderedVisualInspection:
      true,
  },
  {
    owner: 'gpt_image_2',
    responsibility:
      'Design or repair one coherent complete-character source or a bounded complete keypose candidate.',
    permittedInputs: [
      'approved_complete_character_reference',
      'approved_style_reference',
      'structured_pose_direction',
    ],
    permittedOutputs: [
      'complete_character_source_candidate',
      'complete_character_keypose_candidate',
    ],
    forbiddenClaims: [
      'animation_interpolation',
      'final_canvas',
      'visual_qa_approval',
    ],
    qualificationState:
      'evaluation_required',
    requiresActualRenderedVisualInspection:
      true,
  },
  {
    owner: 'comfyui',
    responsibility:
      'Run one controlled complete-keypose attempt using server-selected pose, depth, reference, ControlNet, generic IP-Adapter, and optional LoRA roles.',
    permittedInputs: [
      'approved_complete_character_reference',
      'approved_style_reference',
      'deterministic_pose_control',
      'server_owned_seed_and_graph_family',
    ],
    permittedOutputs: [
      'one_private_complete_character_keypose_candidate',
      'byte_free_attempt_receipt',
    ],
    forbiddenClaims: [
      'independent_generation_of_every_animation_frame',
      'final_canvas',
      'faceid_or_insightface',
      'caller_selected_graph_model_seed_dimensions_or_paths',
    ],
    qualificationState:
      'evaluation_required',
    requiresActualRenderedVisualInspection:
      true,
  },
  {
    owner: 'tooncrafter',
    responsibility:
      'Evaluate bounded cartoon interpolation only between already accepted complete-character keyposes.',
    permittedInputs: [
      'accepted_start_keypose',
      'accepted_end_keypose',
      'bounded_server_owned_motion_direction',
    ],
    permittedOutputs: [
      'private_interpolated_character_motion_candidate',
    ],
    forbiddenClaims: [
      'source_or_keypose_design',
      'anatomy_repair',
      'guaranteed_success',
      'final_canvas',
    ],
    qualificationState:
      'evaluation_required',
    requiresActualRenderedVisualInspection:
      true,
  },
  {
    owner: 'rife',
    responsibility:
      'Optionally smooth cadence only after the underlying motion, anatomy, identity, and attachments are accepted.',
    permittedInputs: [
      'accepted_motion_frames',
      'server_owned_target_cadence',
    ],
    permittedOutputs: [
      'private_cadence_smoothed_motion_candidate',
    ],
    forbiddenClaims: [
      'action_generation',
      'anatomy_or_identity_repair',
      'pre_acceptance_use',
      'final_canvas',
    ],
    qualificationState:
      'evaluation_required',
    requiresActualRenderedVisualInspection:
      true,
  },
  {
    owner: 'opentoonz',
    responsibility:
      'Animate only a deliberately authored nonliving mechanical 2D object rig with reviewed pivots, hidden artwork, rigidity, stacking, and motion range.',
    permittedInputs: [
      'professionally_authored_2d_rig',
      'fixed_server_owned_scene_adapter',
    ],
    permittedOutputs: [
      'transparent_authored_rig_motion_candidate',
    ],
    forbiddenClaims: [
      'automatic_rescue_of_arbitrary_merged_still',
      'living_or_organic_subject_rigging',
      'new_hidden_anatomy_generation',
      'final_canvas',
    ],
    qualificationState:
      'evaluation_required',
    requiresActualRenderedVisualInspection:
      true,
  },
  {
    owner: 'pixijs',
    responsibility:
      'Animate rigid editorial components, vehicle and machine parts, wheels, doors, rotors, particles, atmosphere, routes, masks, and restrained support motion.',
    permittedInputs: [
      'approved_prepared_component',
      'approved_motion_track',
      'approved_environmental_effect_spec',
    ],
    permittedOutputs: [
      'transparent_support_motion_sequence',
    ],
    forbiddenClaims: [
      'complex_character_anatomy_deformation',
      'living_or_organic_subject_rigging',
      'hidden_pixel_invention',
      'final_canvas',
    ],
    qualificationState:
      'private_bounded_evidence_only',
    requiresActualRenderedVisualInspection:
      true,
  },
  {
    owner: 'blender',
    responsibility:
      'Animate professionally authored nonliving mechanical object rigs, 3D objects, cameras, environments, or selected non-character 2.5D assets.',
    permittedInputs: [
      'professionally_authored_rig_or_scene',
      'fixed_reviewed_adapter',
    ],
    permittedOutputs: [
      'transparent_component_motion_and_depth_candidate',
    ],
    forbiddenClaims: [
      'generic_still_character_animation',
      'living_or_organic_subject_rigging',
      'professional_acceptance_of_rejected_airship_puppet',
      'final_canvas',
    ],
    qualificationState:
      'generic_character_route_quarantined',
    requiresActualRenderedVisualInspection:
      true,
  },
  {
    owner: 'remotion',
    responsibility:
      'Compose accepted assets into the exact final canvas with canonical timing, layout, depth, captions, sound, and color.',
    permittedInputs: [
      'accepted_versioned_asset_refs',
      'canonical_master_timing_projection',
      'approved_layout_depth_caption_and_sound_specs',
    ],
    permittedOutputs: [
      'private_final_composite_candidate',
    ],
    forbiddenClaims: [
      'repair_or_accept_rejected_upstream_motion',
      'master_timing_ownership',
      'automatic_professional_visual_approval',
    ],
    qualificationState:
      'private_bounded_evidence_only',
    requiresActualRenderedVisualInspection:
      true,
  },
] as const satisfies LivingFrameCharacterMotionToolPolicyDraft['responsibilities']

export function compileLivingFrameCharacterMotionToolPolicy():
LivingFrameCharacterMotionToolPolicy {
  const draft:
    LivingFrameCharacterMotionToolPolicyDraft = {
      contractVersion:
        LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_VERSION,
      resultClass:
        LIVING_FRAME_CHARACTER_MOTION_TOOL_POLICY_CLASS,
      policyState:
        'source_only_tool_responsibilities_locked_runtime_feasibility_pending',
      governingRules: {
        minimumProfessionalRouteOnly:
          true,
        completeCharacterBeforeInterpolation:
          true,
        technicalMetricsCannotApproveVisualQuality:
          true,
        headIntelligenceMustInspectActualRenderedOutput:
          true,
        failedVisualReviewBlocksEveryDownstreamStage:
          true,
        silentToolSubstitutionForbidden:
          true,
        independentAiFrameGenerationForbidden:
          true,
        livingOrOrganicSubjectRiggingForbidden:
          true,
        livingOrOrganicSubjectUsesCompleteFramePoseAnimation:
          true,
        mechanicalObjectRiggingMayBePlannedOnlyAfterOwnerSpecification:
          true,
        unknownSubjectClassificationBlocksRigging:
          true,
        remotionOwnsFinalCanvas: true,
        masterTimingRemainsCanonical:
          true,
      },
      responsibilities:
        structuredClone(RESPONSIBILITIES),
      ai2dSequence: [
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
      ],
      authoredRigAlternatives: {
        openToonz:
          'only_professionally_authored_nonliving_mechanical_2d_object_rig',
        blender:
          'only_professionally_authored_nonliving_mechanical_object_3d_or_2_5d',
        livingOrOrganicSubject:
          'rigging_forbidden_use_complete_frame_pose_animation',
        mechanicalRigSpecification:
          'pending_explicit_owner_direction',
        arbitraryStillCharacterRigging:
          'forbidden',
      },
      failurePolicy: {
        keyposeFailure:
          'repair_only_failed_complete_pose_up_to_attempt_limit_then_disable_character_motion',
        interpolationFailure:
          'reject_clip_and_fallback_to_accepted_still_or_restrained_motion',
        rigFailure:
          'return_to_route_selection_without_silent_backend_substitution',
        finalCompositeFailure:
          'local_repair_then_reinspect_actual_render',
        livingFrameWithoutCharacterMotionRemainsAvailable:
          true,
      },
      registryPolicy: {
        createsOrMutatesToolIdentity:
          false,
        modelWeightsAdaptersLibrariesAndPreprocessorsAreNotToolIdentities:
          true,
        comfyUiIsOneSupervisedHostAttempt:
          true,
        distinctReleasedRuntimeMayLaterReceiveIdentityAfterQualification:
          true,
      },
      authorityBoundary: {
        operationRegistryAuthority:
          false,
        providerAuthority: false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        assetAuthority: false,
        qaApprovalAuthority: false,
        renderAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority:
          false,
        productionAuthority: false,
      },
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    policyDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameCharacterMotionToolPolicy(
  value: unknown,
): value is LivingFrameCharacterMotionToolPolicy {
  if (
    !isRecord(value)
    || typeof value.policyDigestSha256
      !== 'string'
  ) return false
  const expected =
    compileLivingFrameCharacterMotionToolPolicy()
  return stableAuthorityStringify(value)
    === stableAuthorityStringify(expected)
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (
    const nested of Object.values(
      value as Record<string, unknown>,
    )
  ) deepFreeze(nested)
  return value
}
