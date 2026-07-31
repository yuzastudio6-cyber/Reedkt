import {
  LIVING_FRAME_AI_2D_CHARACTER_MOTION_STRATEGY_CLASS,
  LIVING_FRAME_AI_2D_CHARACTER_MOTION_STRATEGY_VERSION,
  type LivingFrameAi2dCharacterMotionEvidence,
  type LivingFrameAi2dCharacterMotionStrategyDraft,
  type LivingFrameAi2dCharacterMotionStrategyRecord,
} from '../../src/types/living-frame-ai-2d-character-motion'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,239}$/u
const UNSAFE_TEXT =
  /(?:https?:\/\/|file:\/\/|\/{2,}|\\|\.{2}\/|[<>`]|\b(?:curl|wget|bash|sh|python|node|powershell|sudo)\b)/iu

export function compileLivingFrameAi2dCharacterMotionStrategy(
  evidence:
    LivingFrameAi2dCharacterMotionEvidence,
): LivingFrameAi2dCharacterMotionStrategyRecord {
  assertEvidence(evidence)
  const decision = decideStrategy(
    evidence,
  )
  const draft:
    LivingFrameAi2dCharacterMotionStrategyDraft = {
      contractVersion:
        LIVING_FRAME_AI_2D_CHARACTER_MOTION_STRATEGY_VERSION,
      resultClass:
        LIVING_FRAME_AI_2D_CHARACTER_MOTION_STRATEGY_CLASS,
      evidence:
        structuredClone(evidence),
      decision,
      toolResponsibilities: {
        headIntelligence:
          'select_strategy_direct_action_and_accept_or_reject_actual_rendered_motion',
        gptImage2:
          'design_or_repair_complete_character_source_and_keypose_candidates',
        comfyUi:
          'orchestrate_pose_depth_reference_ip_adapter_controlnet_and_optional_lora_for_complete_keyposes',
        toonCrafter:
          'evaluation_only_cartoon_interpolation_between_already_accepted_complete_keyposes',
        rife:
          'evaluation_only_frame_cadence_smoothing_after_motion_and_anatomy_are_already_accepted',
        openToonz:
          'animate_only_professionally_authored_2d_mesh_or_cutout_assets',
        pixiJs:
          'animate_rigid_editorial_components_environmental_effects_particles_and_support_motion',
        blender:
          'animate_only_professionally_authored_rigs_3d_objects_cameras_or_non_character_2_5d_assets',
        remotion:
          'own_final_canvas_layout_depth_captions_audio_timing_and_approved_motion_composition',
      },
      keyposePolicy: {
        poseRoles: [
          'start',
          'action_apex',
          'settle',
        ],
        everyPoseIsACompleteCharacter:
          true,
        detachedLimbGenerationForbidden:
          true,
        independentPerFrameGenerationForbidden:
          true,
        poseGenerationPrecedesInterpolation:
          true,
        everyPoseRequiresVisualAcceptance:
          true,
        failedPoseBlocksInterpolation:
          true,
      },
      renderedVisualAcceptance: {
        technicalMetricsCannotApproveVisualQuality:
          true,
        actualRenderedClipInspectionRequired:
          true,
        sampledFrameInspectionRequired:
          true,
        dispositions: [
          'accepted',
          'repair_required',
          'rejected',
        ],
        blockingChecks: [
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
        ],
        currentDisposition: 'pending',
      },
      feasibilityGate: {
        requiredFixtureCount: 3,
        maximumKeyposeAttemptsPerRole:
          3,
        allKeyposesMustPassBeforeInterpolation:
          true,
        allRenderedFixturesMustPassProfessionalVisualReview:
          true,
        routineManualRepaintMeansAutomationFailed:
          true,
        failureDisablesAutomatedCharacterAnimationWithoutDisablingLivingFrame:
          true,
      },
      registryAndRuntimeBoundary: {
        createsToolIdentity: false,
        toonCrafterRegistered: false,
        rifeRegistered: false,
        openToonzRuntimeQualified:
          false,
        comfyUiKeyposeRuntimeQualified:
          false,
        operationRegistered: false,
        dispatchGranted: false,
        runtimeGranted: false,
        assetCreated: false,
        actualCostCreated: false,
      },
      authorityBoundary: {
        privatePlanningEvidenceAuthority:
          true,
        selectedSceneAuthority: false,
        approvalAuthority: false,
        masterTimingAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        assetAuthority: false,
        qaApprovalAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority:
          false,
        productionAuthority: false,
      },
      canonicalQaApproved: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    strategyDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameAi2dCharacterMotionStrategy(
  value: unknown,
): value is LivingFrameAi2dCharacterMotionStrategyRecord {
  if (
    !isRecord(value)
    || typeof value.strategyDigestSha256
      !== 'string'
  ) return false
  const {
    strategyDigestSha256,
    ...draft
  } = value
  try {
    const expected =
      compileLivingFrameAi2dCharacterMotionStrategy(
        draft.evidence as
          LivingFrameAi2dCharacterMotionEvidence,
      )
    return strategyDigestSha256
      === sha256AuthorityValue(draft)
      && stableAuthorityStringify(
        value,
      ) === stableAuthorityStringify(
        expected,
      )
  } catch {
    return false
  }
}

function decideStrategy(
  evidence:
    LivingFrameAi2dCharacterMotionEvidence,
): LivingFrameAi2dCharacterMotionStrategyDraft['decision'] {
  const authoredRigVisualEvidenceReady =
    !evidence.visibleJointHardwarePresent
    && evidence
      .jointSeamsConcealedAcrossPoseRange
    && evidence
      .anatomicalProportionsReviewedAcrossPoseRange
    && evidence
      .handPropAttachmentReviewedAcrossPoseRange
    && evidence
      .secondaryPartsAnchoredAcrossPoseRange
    && evidence
      .protectedFaceAndIdentityRegionsDefined
  if (
    evidence
      .professionallyAuthoredOpenToonzRigAvailable
    && authoredRigVisualEvidenceReady
  ) {
    return decision(
      'professionally_authored_opentoonz_rig',
      'evaluation_candidate_only',
      0,
      [
        'professionally_authored_2d_rig_available',
        'joint_seam_anatomy_attachment_and_identity_evidence_ready',
        'opentoonz_remains_evaluation_only_until_runtime_qualification',
      ],
    )
  }
  if (
    evidence
      .professionallyAuthoredBlenderRigAvailable
    && authoredRigVisualEvidenceReady
  ) {
    return decision(
      'professionally_authored_blender_rig',
      'evaluation_candidate_only',
      0,
      [
        'professionally_authored_rig_available',
        'generic_still_character_blender_routing_remains_forbidden',
        'blender_remains_evaluation_only_until_visual_acceptance',
      ],
    )
  }
  const meaningfulPoseChange =
    evidence.requestedMotionMagnitude
      === 'moderate_pose_change'
    || evidence.requestedMotionMagnitude
      === 'large_pose_change'
  if (
    meaningfulPoseChange
    && evidence
      .illustrativeNotArchivalEvidence
    && evidence
      .completeCharacterReferenceAvailable
    && evidence.styleReferenceAvailable
    && evidence.poseControlAvailable
    && !evidence
      .continuousNaturalMotionRequired
  ) {
    return decision(
      'ai_2d_complete_keyposes',
      'source_only_ai_2d_feasibility_candidate',
      evidence.requestedMotionMagnitude
        === 'large_pose_change'
        ? 4
        : 3,
      [
        'complete_character_pose_change_required',
        'controlled_keyposes_preserve_coherent_character_before_interpolation',
        ...(evidence
          .priorRejectedVisualProofRefs.length > 0
          ? [
            'prior_rigid_or_articulated_visual_proof_rejected',
          ]
          : []),
        'tooncrafter_and_rife_remain_unregistered_evaluation_candidates',
      ],
    )
  }
  if (
    (
      evidence.requestedMotionMagnitude
        === 'ambient'
      || evidence.requestedMotionMagnitude
        === 'restrained'
    )
    && evidence
      .restrainedRigidMotionPreservesSilhouette
    && evidence
      .protectedFaceAndIdentityRegionsDefined
  ) {
    return decision(
      'restrained_rigid_character_motion',
      'qualified_private_rigid_character_route',
      0,
      [
        'whole_character_rigid_motion_preserves_source_artwork',
        'pixijs_support_motion_only_below_remotion_final_canvas',
      ],
    )
  }
  if (
    evidence.continuousNaturalMotionRequired
    && evidence
      .completeCharacterReferenceAvailable
  ) {
    return decision(
      'real_motion_fallback',
      'blocked_pending_real_motion_runtime',
      0,
      [
        'continuous_natural_motion_exceeds_keypose_interpolation_scope',
      ],
    )
  }
  return decision(
    'no_character_animation',
    'deliberate_non_use',
    0,
    [
      'no_professional_character_motion_strategy_has_sufficient_evidence',
    ],
  )
}

function decision(
  selectedStrategy:
    LivingFrameAi2dCharacterMotionStrategyDraft['decision']['selectedStrategy'],
  strategyState:
    LivingFrameAi2dCharacterMotionStrategyDraft['decision']['strategyState'],
  completeKeyposeCount:
    LivingFrameAi2dCharacterMotionStrategyDraft['decision']['completeKeyposeCount'],
  reasonCodes: readonly string[],
): LivingFrameAi2dCharacterMotionStrategyDraft['decision'] {
  return {
    selectedStrategy,
    strategyState,
    reasonCodes,
    completeKeyposeCount,
    generateEveryFrameIndependently:
      false,
    blenderIsGenericStillCharacterRoute:
      false,
    remotionOwnsFinalCanvas: true,
  }
}

function assertEvidence(
  evidence:
    LivingFrameAi2dCharacterMotionEvidence,
): void {
  if (
    !isRecord(evidence)
    || Object.keys(evidence).sort()
      .join('|') !== [
        'evidenceId',
        'sceneId',
        'componentId',
        'sourceArtifactId',
        'illustrativeNotArchivalEvidence',
        'requestedMotionMagnitude',
        'requestedActionSummary',
        'completeCharacterReferenceAvailable',
        'styleReferenceAvailable',
        'poseControlAvailable',
        'requiresNewPixelsOrHiddenAnatomy',
        'continuousNaturalMotionRequired',
        'restrainedRigidMotionPreservesSilhouette',
        'professionallyAuthoredOpenToonzRigAvailable',
        'professionallyAuthoredBlenderRigAvailable',
        'visibleJointHardwarePresent',
        'jointSeamsConcealedAcrossPoseRange',
        'anatomicalProportionsReviewedAcrossPoseRange',
        'handPropAttachmentReviewedAcrossPoseRange',
        'secondaryPartsAnchoredAcrossPoseRange',
        'protectedFaceAndIdentityRegionsDefined',
        'priorRejectedVisualProofRefs',
        'rawChatPromptPathUrlModelCodeOrBytesIncluded',
      ].sort().join('|')
    || !SAFE_ID.test(evidence.evidenceId)
    || !SAFE_ID.test(evidence.sceneId)
    || !SAFE_ID.test(evidence.componentId)
    || !SAFE_ID.test(
      evidence.sourceArtifactId,
    )
    || typeof evidence
      .requestedActionSummary !==
        'string'
    || evidence.requestedActionSummary
      .length < 8
    || evidence.requestedActionSummary
      .length > 320
    || UNSAFE_TEXT.test(
      evidence.requestedActionSummary,
    )
    || !Array.isArray(
      evidence.priorRejectedVisualProofRefs,
    )
    || evidence
      .priorRejectedVisualProofRefs.some(
        (reference) =>
          typeof reference !== 'string'
          || !SAFE_ID.test(reference),
      )
    || evidence
      .rawChatPromptPathUrlModelCodeOrBytesIncluded
      !== false
  ) {
    throw new Error(
      'Living Frame AI 2D character-motion evidence is invalid.',
    )
  }
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
