export const LIVING_FRAME_CHARACTER_ANIMATION_ROUTE_DECISION_VERSION =
  'living-frame-character-animation-route-decision-v1' as const

export const LIVING_FRAME_CHARACTER_ANIMATION_ROUTE_DECISION_CLASS =
  'server_derived_character_animation_route_suitability_decision' as const

export type LivingFrameCharacterAnimationRoute =
  | 'pixijs_rigid_cutout'
  | 'opentoonz_flat_mesh'
  | 'blender_articulated_2_5d'
  | 'comfyui_controlled_keyposes'
  | 'real_motion_video_fallback'
  | 'no_animation'

export interface LivingFrameCharacterAnimationSuitabilityEvidence {
  readonly evidenceId: string
  readonly sceneId: string
  readonly componentId: string
  readonly sourceArtifactId: string
  readonly illustrativeNotArchivalEvidence: boolean
  readonly componentTopology:
    | 'single_rigid_cutout'
    | 'merged_limb_hand_clothing_and_prop_cutout'
    | 'separated_flat_mesh_parts'
    | 'separated_articulated_limb_parts'
    | 'complete_video_subject'
  readonly requestedMotionMagnitude:
    | 'ambient'
    | 'restrained'
    | 'moderate'
    | 'large_pose_change'
  readonly desiredPoseRequiresNewPixels: boolean
  readonly sourcePoseOccludesProtectedFace: boolean
  readonly upperArmSeparated: boolean
  readonly forearmSeparated: boolean
  readonly handSeparated: boolean
  readonly propSeparated: boolean
  readonly exactJointPivotsReviewed: boolean
  readonly hiddenJointArtworkReconstructed: boolean
  readonly deformableMeshTopologyReviewed: boolean
  readonly skinWeightMapReviewed: boolean
  readonly referenceIdentityAvailable: boolean
  readonly poseControlAvailable: boolean
  readonly deterministicRigidPivotAvailable: boolean
  readonly protectedFaceMotionPathReviewed: boolean
  readonly motionPathClearsProtectedFace: boolean
  readonly componentAttachmentContinuityReviewed: boolean
  readonly flatMeshDeformationSufficient: boolean
  readonly continuousNaturalMotionRequired: boolean
  readonly rawChatPromptPathUrlModelCodeOrBytesIncluded: false
}

export interface LivingFrameCharacterAnimationRouteDecisionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CHARACTER_ANIMATION_ROUTE_DECISION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CHARACTER_ANIMATION_ROUTE_DECISION_CLASS
  readonly evidence:
    LivingFrameCharacterAnimationSuitabilityEvidence
  readonly decision: {
    readonly selectedRoute:
      LivingFrameCharacterAnimationRoute
    readonly routeState:
      | 'qualified_private_pixijs_route'
      | 'evaluation_candidate_only'
      | 'blocked_pending_controlled_generation_runtime'
      | 'blocked_pending_real_motion_runtime'
      | 'deliberate_non_use'
    readonly selectedToolId:
      | 'pixijs'
      | 'opentoonz'
      | 'blender'
      | 'comfyui'
      | null
    readonly selectedOperationId:
      | 'tool.pixijs.render_pixi_scene.v1'
      | 'tool.opentoonz.render_living_frame_plastic_component_rig.v1'
      | 'tool.blender.render_living_frame_component_rig.v1'
      | 'tool.comfyui.generate_controlled_image.v1'
      | null
    readonly reasonCodes: readonly string[]
    readonly blenderAdmissionAllowed: boolean
    readonly openToonzAdmissionAllowed: boolean
    readonly controlledKeyposeGenerationRequired: boolean
    readonly realMotionFallbackRequired: boolean
    readonly generateEveryFrameIndependently: false
    readonly remotionOwnsFinalCanvas: true
  }
  readonly professionalRules: {
    readonly riggingCannotInventMissingAnatomy: true
    readonly mergedPaintedLimbPropCutoutCannotUseGenericDeformation:
      true
    readonly largePoseChangeRequiresNewPixelRouteWhenAnatomyIsHidden:
      true
    readonly controlledGenerationCreatesAnchorKeyposesNotEveryFrame:
      true
    readonly identityContinuityQaRequiredForGeneratedKeyposes:
      true
    readonly protectedFacePathAndAttachmentQaRequired:
      true
    readonly simplerProfessionalRoutePreferredWhenSufficient:
      true
  }
  readonly authorityBoundary: {
    readonly privatePlanningEvidenceAuthority: true
    readonly selectedSceneAuthority: false
    readonly approvalAuthority: false
    readonly masterTimingAuthority: false
    readonly workGraphAuthority: false
    readonly dispatchAuthority: false
    readonly runtimeAuthority: false
    readonly assetAuthority: false
    readonly qaApprovalAuthority: false
    readonly costAuthority: false
    readonly billingAuthority: false
    readonly publicDeliveryAuthority: false
    readonly productionAuthority: false
  }
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeGranted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly actualCostCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCharacterAnimationRouteDecision
  extends LivingFrameCharacterAnimationRouteDecisionDraft {
  readonly decisionDigestSha256: string
}
