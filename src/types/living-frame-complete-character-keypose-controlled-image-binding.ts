import type {
  LivingFrameCharacterActionPhaseRole,
  LivingFrameCharacterActionPropConstraint,
} from './living-frame-character-action-choreography'

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_VERSION =
  'living-frame-complete-character-keypose-controlled-image-binding-v1' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_CLASS =
  'server_derived_non_executable_action_keypose_to_selected_scene_controlled_image_binding' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_STATE =
  'exact_action_keypose_units_bound_private_action_conditioning_required' as const

export const LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_ISSUE_CODES = [
  'input_invalid',
  'keypose_plan_invalid',
  'controlled_preparation_invalid',
  'source_lineage_mismatch',
  'unit_set_mismatch',
  'cross_keypose_work_item_or_output_substitution',
  'pose_control_binding_invalid',
  'controlled_graph_policy_invalid',
  'generation_canvas_invalid',
  'action_conditioning_bypass_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameCompleteCharacterKeyposeControlledImageBindingIssueCode =
  (typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_ISSUE_CODES)[number]

export interface LivingFrameCompleteCharacterKeyposeControlledImageBindingIssue {
  readonly code:
    LivingFrameCompleteCharacterKeyposeControlledImageBindingIssueCode
  readonly path: string
}

export interface LivingFrameCompleteCharacterKeyposeControlledImageBindingAuthority {
  readonly keyposeControlledImageBindingAuthority: true
  readonly actionChoreographyAuthority: false
  readonly storyTimingAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptPlanningAuthority: false
  readonly promptMaterializationAuthority: false
  readonly modelSelectionAuthority: false
  readonly operationRegistryAuthority: false
  readonly workGraphMutationAuthority: false
  readonly approvedSnapshotAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly assetPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly actualCostAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCompleteCharacterKeyposeControlledImageBindingUnit {
  readonly order: number
  readonly bindingUnitId: string
  readonly keyposeUnitId: string
  readonly keyposeUnitDigestSha256: string
  readonly role: LivingFrameCharacterActionPhaseRole
  readonly actionPhaseId: string
  readonly actionDescription: string
  readonly keyposeSelectionReason: string
  readonly bodyMechanicIntent: string
  readonly propConstraint:
    LivingFrameCharacterActionPropConstraint
  readonly storyTimingFrame: number
  readonly minimumHoldFrames: number
  readonly preparationUnitId: string
  readonly preparationUnitDigestSha256: string
  readonly selectedSceneRequestUnitId: string
  readonly selectedSceneRequestUnitDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly outputKey: string
  readonly poseControlArtifactRef: {
    readonly artifactId: string
    readonly digestSha256: string
    readonly preparedOutsideComfyUi: true
    readonly exactPoseForActionPhaseRequired: true
    readonly callerReplacementAllowed: false
  }
  readonly continuityReferenceRefs: {
    readonly completeCharacterSourceArtifactId: string
    readonly completeCharacterSourceDigestSha256: string
    readonly styleReferenceArtifactId: string
    readonly styleReferenceDigestSha256: string
    readonly genericIpAdapterOnly: true
    readonly faceIdOrInsightFaceAllowed: false
  }
  readonly controlledGraphPolicy: {
    readonly graphFamily: 'controlled_sdxl_selected_scene_v1'
    readonly canonicalToolId: 'comfyui'
    readonly canonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly controlNetRequired: true
    readonly genericIpAdapterAndClipVisionRequired: true
    readonly optionalLoRaAllowed: true
    readonly inGraphPreprocessorAllowed: false
    readonly arbitrarySaveOrPreviewNodeAllowed: false
    readonly websocketOutputOnly: true
    readonly exactModelRoleCount: 5
    readonly oneSupervisedGpuAttempt: true
    readonly oneImagePerAttempt: true
  }
  readonly generationCanvas: {
    readonly canvasClass: 'isolated_component_square_1024'
    readonly widthPixels: 1024
    readonly heightPixels: 1024
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly callerSelectedDimensionsAllowed: false
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly privateActionConditioningRequirement: {
    readonly serverDerivedActionConditioningRequired: true
    readonly mustIncludeActionPhaseSemanticsBodyMechanicsAndPropConstraint:
      true
    readonly rawChatOrCallerPromptAllowed: false
    readonly selectedSceneConditioningAloneSufficient: false
    readonly privatePromptMaterializationMayProceedBeforeActionConditioningReconciled:
      false
  }
  readonly outputPolicy: {
    readonly contentType: 'image/png'
    readonly completeCharacterRequired: true
    readonly detachedLimbOrVisiblePuppetJointAllowed: false
    readonly independentAnimationFrameGenerationAllowed: false
    readonly professionalVisualAcceptanceRequiredBeforeInterpolation:
      true
    readonly remotionOwnsFinalCanvas: true
  }
  readonly operationRegistered: false
  readonly dispatched: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly bindingUnitDigestSha256: string
}

export interface LivingFrameCompleteCharacterKeyposeControlledImageBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_CLASS
  readonly bindingState:
    typeof LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_CONTROLLED_IMAGE_BINDING_STATE
  readonly bindingId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly keyposePlanVersion:
      'living-frame-complete-character-keypose-plan-v2'
    readonly keyposePlanId: string
    readonly keyposePlanDigestSha256: string
    readonly actionChoreographyDigestSha256: string
    readonly authoritativeActionTimingArtifactId: string
    readonly authoritativeActionTimingDigestSha256: string
    readonly characterPreparationVersion:
      'living-frame-character-controlled-preparation-v1'
    readonly characterPreparationDigestSha256: string
    readonly characterRouteDecisionDigestSha256: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly approvedWorkGraphDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
  }
  readonly bindingUnits:
    readonly LivingFrameCompleteCharacterKeyposeControlledImageBindingUnit[]
  readonly metrics: {
    readonly keyposeUnitCount: 3 | 4
    readonly boundPreparationUnitCount: number
    readonly boundSelectedSceneRequestUnitCount: number
    readonly poseControlledUnitCount: number
    readonly referenceConditionedUnitCount: number
    readonly pendingPrivateActionConditioningUnitCount: number
  }
  readonly sequencingPolicy: {
    readonly everyPlannedKeyposeHasExactlyOneApprovedControlledImageOutput:
      true
    readonly everyControlledImageOutputMapsToExactlyOnePlannedKeypose:
      true
    readonly exactActionOrderPreserved: true
    readonly storyTimingFramesReinterpreted: false
    readonly genericStartMiddleEndSubstitutionAllowed: false
    readonly sceneLevelConditioningMayReplaceActionConditioning: false
    readonly independentPerFrameGenerationAllowed: false
  }
  readonly authorityBoundary:
    LivingFrameCompleteCharacterKeyposeControlledImageBindingAuthority
  readonly keyposePlanRevalidated: true
  readonly controlledPreparationRevalidated: true
  readonly selectedSceneRequestRevalidatedThroughPreparation: true
  readonly privateActionConditioningReconciled: false
  readonly privatePromptMaterialized: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly canonicalQaApproved: false
  readonly actualCostReceiptCreated: false
  readonly customerCharged: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCompleteCharacterKeyposeControlledImageBinding
  extends LivingFrameCompleteCharacterKeyposeControlledImageBindingDraft {
  readonly bindingDigestSha256: string
}
