import {
  LIVING_FRAME_CHARACTER_ANIMATION_ROUTE_DECISION_CLASS,
  LIVING_FRAME_CHARACTER_ANIMATION_ROUTE_DECISION_VERSION,
  type LivingFrameCharacterAnimationRouteDecision,
  type LivingFrameCharacterAnimationRouteDecisionDraft,
  type LivingFrameCharacterAnimationSuitabilityEvidence,
} from '../../src/types/living-frame-character-animation-route'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,239}$/u

export function compileLivingFrameCharacterAnimationRouteDecision(
  evidence:
    LivingFrameCharacterAnimationSuitabilityEvidence,
): LivingFrameCharacterAnimationRouteDecision {
  assertEvidence(evidence)
  const decision =
    decideRoute(evidence)
  const draft:
    LivingFrameCharacterAnimationRouteDecisionDraft = {
      contractVersion:
        LIVING_FRAME_CHARACTER_ANIMATION_ROUTE_DECISION_VERSION,
      resultClass:
        LIVING_FRAME_CHARACTER_ANIMATION_ROUTE_DECISION_CLASS,
      evidence:
        structuredClone(evidence),
      decision,
      professionalRules: {
        riggingCannotInventMissingAnatomy:
          true,
        mergedPaintedLimbPropCutoutCannotUseGenericDeformation:
          true,
        largePoseChangeRequiresNewPixelRouteWhenAnatomyIsHidden:
          true,
        controlledGenerationCreatesAnchorKeyposesNotEveryFrame:
          true,
        identityContinuityQaRequiredForGeneratedKeyposes:
          true,
        protectedFacePathAndAttachmentQaRequired:
          true,
        simplerProfessionalRoutePreferredWhenSufficient:
          true,
      },
      authorityBoundary: {
        privatePlanningEvidenceAuthority:
          true,
        selectedSceneAuthority: false,
        approvalAuthority: false,
        masterTimingAuthority: false,
        workGraphAuthority: false,
        dispatchAuthority: false,
        runtimeAuthority: false,
        assetAuthority: false,
        qaApprovalAuthority: false,
        costAuthority: false,
        billingAuthority: false,
        publicDeliveryAuthority: false,
        productionAuthority: false,
      },
      operationRegistered: false,
      dispatchGranted: false,
      runtimeGranted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  return deepFreeze({
    ...draft,
    decisionDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameCharacterAnimationRouteDecision(
  value: unknown,
): value is LivingFrameCharacterAnimationRouteDecision {
  if (
    !isRecord(value)
    || typeof value.decisionDigestSha256
      !== 'string'
  ) return false
  const {
    decisionDigestSha256,
    ...draft
  } = value
  try {
    const expected =
      compileLivingFrameCharacterAnimationRouteDecision(
        draft.evidence as
          LivingFrameCharacterAnimationSuitabilityEvidence,
      )
    return decisionDigestSha256
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

function decideRoute(
  evidence:
    LivingFrameCharacterAnimationSuitabilityEvidence,
): LivingFrameCharacterAnimationRouteDecisionDraft['decision'] {
  const mergedPaintedCutout =
    evidence.componentTopology ===
      'merged_limb_hand_clothing_and_prop_cutout'
  const articulatedPartsReady =
    evidence.componentTopology ===
      'separated_articulated_limb_parts'
    && evidence.upperArmSeparated
    && evidence.forearmSeparated
    && evidence.handSeparated
    && evidence.exactJointPivotsReviewed
    && evidence.hiddenJointArtworkReconstructed
    && evidence.deformableMeshTopologyReviewed
    && evidence.skinWeightMapReviewed
    && evidence.protectedFaceMotionPathReviewed
    && evidence.motionPathClearsProtectedFace
    && evidence.componentAttachmentContinuityReviewed
  if (
    mergedPaintedCutout
    && (
      evidence.requestedMotionMagnitude
        === 'large_pose_change'
      || evidence.desiredPoseRequiresNewPixels
    )
  ) {
    if (
      !evidence.illustrativeNotArchivalEvidence
      || !evidence.referenceIdentityAvailable
      || !evidence.poseControlAvailable
    ) {
      return noAnimation(
        'controlled_keypose_generation_missing_fact_or_reference_safety_evidence',
      )
    }
    return {
      selectedRoute:
        'comfyui_controlled_keyposes',
      routeState:
        'blocked_pending_controlled_generation_runtime',
      selectedToolId: 'comfyui',
      selectedOperationId:
        'tool.comfyui.generate_controlled_image.v1',
      reasonCodes: [
        'large_pose_change_requires_new_pixels',
        'merged_cutout_cannot_reveal_hidden_anatomy',
        'generate_controlled_anchor_keyposes_then_interpolate',
      ],
      blenderAdmissionAllowed:
        false,
      openToonzAdmissionAllowed:
        false,
      controlledKeyposeGenerationRequired:
        true,
      realMotionFallbackRequired:
        false,
      generateEveryFrameIndependently:
        false,
      remotionOwnsFinalCanvas: true,
    }
  }
  if (
    (
      mergedPaintedCutout
      || evidence.componentTopology
        === 'single_rigid_cutout'
    )
    && evidence.deterministicRigidPivotAvailable
    && evidence.protectedFaceMotionPathReviewed
    && evidence.motionPathClearsProtectedFace
    && evidence.componentAttachmentContinuityReviewed
    && (
      evidence.requestedMotionMagnitude
        === 'ambient'
      || evidence.requestedMotionMagnitude
        === 'restrained'
    )
    && !evidence.desiredPoseRequiresNewPixels
  ) {
    return {
      selectedRoute:
        'pixijs_rigid_cutout',
      routeState:
        'qualified_private_pixijs_route',
      selectedToolId: 'pixijs',
      selectedOperationId:
        'tool.pixijs.render_pixi_scene.v1',
      reasonCodes: [
        'restrained_motion_preserves_source_artwork',
        'pixijs_rigid_pivot_and_scene_graph_available',
        'generic_mesh_deformation_rejected',
        'remotion_retains_final_canvas_ownership',
      ],
      blenderAdmissionAllowed:
        false,
      openToonzAdmissionAllowed:
        false,
      controlledKeyposeGenerationRequired:
        false,
      realMotionFallbackRequired:
        false,
      generateEveryFrameIndependently:
        false,
      remotionOwnsFinalCanvas: true,
    }
  }
  if (articulatedPartsReady) {
    return {
      selectedRoute:
        'blender_articulated_2_5d',
      routeState:
        'evaluation_candidate_only',
      selectedToolId: 'blender',
      selectedOperationId:
        'tool.blender.render_living_frame_component_rig.v1',
      reasonCodes: [
        'separated_articulated_parts_verified',
        'joint_and_hidden_artwork_verified',
        'reviewed_mesh_and_skin_weights_verified',
      ],
      blenderAdmissionAllowed:
        true,
      openToonzAdmissionAllowed:
        false,
      controlledKeyposeGenerationRequired:
        false,
      realMotionFallbackRequired:
        false,
      generateEveryFrameIndependently:
        false,
      remotionOwnsFinalCanvas: true,
    }
  }
  if (
    evidence.componentTopology ===
      'separated_flat_mesh_parts'
    && evidence.flatMeshDeformationSufficient
    && evidence.exactJointPivotsReviewed
    && evidence.hiddenJointArtworkReconstructed
    && evidence.deformableMeshTopologyReviewed
    && evidence.protectedFaceMotionPathReviewed
    && evidence.motionPathClearsProtectedFace
    && evidence.componentAttachmentContinuityReviewed
  ) {
    return {
      selectedRoute:
        'opentoonz_flat_mesh',
      routeState:
        'evaluation_candidate_only',
      selectedToolId: 'opentoonz',
      selectedOperationId:
        'tool.opentoonz.render_living_frame_plastic_component_rig.v1',
      reasonCodes: [
        'flat_mesh_deformation_is_sufficient',
        'reviewed_joint_and_mesh_evidence_available',
      ],
      blenderAdmissionAllowed:
        false,
      openToonzAdmissionAllowed:
        true,
      controlledKeyposeGenerationRequired:
        false,
      realMotionFallbackRequired:
        false,
      generateEveryFrameIndependently:
        false,
      remotionOwnsFinalCanvas: true,
    }
  }
  if (
    evidence.continuousNaturalMotionRequired
    && evidence.referenceIdentityAvailable
  ) {
    return {
      selectedRoute:
        'real_motion_video_fallback',
      routeState:
        'blocked_pending_real_motion_runtime',
      selectedToolId: null,
      selectedOperationId: null,
      reasonCodes: [
        'continuous_natural_motion_exceeds_keypose_and_rig_routes',
      ],
      blenderAdmissionAllowed:
        false,
      openToonzAdmissionAllowed:
        false,
      controlledKeyposeGenerationRequired:
        false,
      realMotionFallbackRequired:
        true,
      generateEveryFrameIndependently:
        false,
      remotionOwnsFinalCanvas: true,
    }
  }
  return noAnimation(
    'no_professional_animation_route_has_sufficient_evidence',
  )
}

function noAnimation(
  reasonCode: string,
): LivingFrameCharacterAnimationRouteDecisionDraft['decision'] {
  return {
    selectedRoute: 'no_animation',
    routeState:
      'deliberate_non_use',
    selectedToolId: null,
    selectedOperationId: null,
    reasonCodes: [reasonCode],
    blenderAdmissionAllowed: false,
    openToonzAdmissionAllowed: false,
    controlledKeyposeGenerationRequired:
      false,
    realMotionFallbackRequired:
      false,
    generateEveryFrameIndependently:
      false,
    remotionOwnsFinalCanvas: true,
  }
}

function assertEvidence(
  evidence:
    LivingFrameCharacterAnimationSuitabilityEvidence,
): void {
  if (
    !isRecord(evidence)
    || !SAFE_ID.test(evidence.evidenceId)
    || !SAFE_ID.test(evidence.sceneId)
    || !SAFE_ID.test(evidence.componentId)
    || !SAFE_ID.test(
      evidence.sourceArtifactId,
    )
    || evidence
      .rawChatPromptPathUrlModelCodeOrBytesIncluded
      !== false
  ) {
    throw new Error(
      'Living Frame character animation suitability evidence is invalid.',
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
