import type {
  LivingFrameComponentRole,
} from './living-frame'
import type {
  LivingFrameCharacterAnimationRoute,
} from './living-frame-character-animation-route'

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_VERSION =
  'living-frame-character-controlled-preparation-v1' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CLASS =
  'server_derived_non_executable_character_controlled_preparation_candidate' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_STATE =
  'character_preparation_graphs_bound_private_runtime_and_qa_pending' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_OPEN_GATES = [
  'selected_scene_masked_inpaint_prompt_materialization_required',
  'current_comfyui_masked_inpaint_node_schema_qualification_required',
  'signed_scanned_nonroot_gpu_image_required',
  'atomic_five_model_read_only_mount_required',
  'license_vulnerability_and_model_weight_disposition_required',
  'real_l4_masked_inpaint_and_component_generation_required',
  'create_only_private_asset_persistence_required',
  'hidden_plate_component_alpha_continuity_and_face_clearance_qa_required',
  'prepared_character_route_recompilation_required',
  'asset_manifest_reconciliation_and_private_review_required',
  'remotion_final_composition_required',
] as const

export type LivingFrameCharacterControlledPreparationOpenGate =
  (typeof
    LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_OPEN_GATES)[number]

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_ISSUE_CODES = [
  'input_invalid',
  'route_decision_invalid',
  'route_not_controlled_generation',
  'selected_scene_request_invalid',
  'full_frame_ratio_extension_invalid',
  'source_lineage_mismatch',
  'component_request_unit_missing',
  'background_plate_request_unit_missing',
  'anchor_keypose_unit_count_invalid',
  'generation_canvas_invalid',
  'masked_inpaint_graph_invalid',
  'generic_graph_substitution_forbidden',
  'unsafe_projection_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameCharacterControlledPreparationIssueCode =
  (typeof
    LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_ISSUE_CODES)[number]

export type LivingFrameCharacterControlledPreparationPurpose =
  | 'reconstruct_exposed_source_plate'
  | 'prepare_clean_isolated_component'
  | 'generate_controlled_anchor_keypose'

export type LivingFrameCharacterControlledPreparationGraphFamily =
  | 'controlled_sdxl_masked_inpaint_v1'
  | 'controlled_sdxl_selected_scene_v1'

export type LivingFrameCharacterControlledPreparationGraphNodeClass =
  | 'CheckpointLoaderSimple'
  | 'LoraLoader'
  | 'CLIPTextEncode'
  | 'ControlNetLoader'
  | 'LoadImage'
  | 'LoadImageMask'
  | 'ControlNetApplyAdvanced'
  | 'EmptyLatentImage'
  | 'VAEEncodeForInpaint'
  | 'CLIPVisionLoader'
  | 'IPAdapterModelLoader'
  | 'IPAdapterAdvanced'
  | 'KSampler'
  | 'VAEDecode'
  | 'SaveImageWebsocket'

export type LivingFrameCharacterControlledPreparationPrivateSlotKind =
  | 'base_checkpoint_artifact'
  | 'controlnet_checkpoint_artifact'
  | 'lora_adapter_artifact'
  | 'generic_ipadapter_checkpoint_artifact'
  | 'clip_vision_checkpoint_artifact'
  | 'positive_conditioning_text'
  | 'negative_conditioning_text'
  | 'control_image_artifact'
  | 'reference_image_artifact'
  | 'source_plate_image_artifact'
  | 'source_plate_inpaint_mask_artifact'

export interface LivingFrameCharacterControlledPreparationUnit {
  readonly order: number
  readonly preparationUnitId: string
  readonly purpose:
    LivingFrameCharacterControlledPreparationPurpose
  readonly sceneId: string
  readonly componentId: string
  readonly componentRole: LivingFrameComponentRole
  readonly sourceArtifactId: string
  readonly selectedSceneRequestUnitId: string
  readonly selectedSceneRequestUnitDigestSha256: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly outputKey: string
  readonly rendererLayerId: string
  readonly graphProfile: {
    readonly graphFamily:
      LivingFrameCharacterControlledPreparationGraphFamily
    readonly nodeClasses:
      readonly LivingFrameCharacterControlledPreparationGraphNodeClass[]
    readonly requiredPrivateSlotKinds:
      readonly LivingFrameCharacterControlledPreparationPrivateSlotKind[]
    readonly sourceAndMaskStayPrivate: true
    readonly inGraphPreprocessorAllowed: false
    readonly faceIdOrInsightFaceAllowed: false
    readonly arbitrarySaveOrPreviewNodeAllowed: false
    readonly websocketOutputOnly: true
  }
  readonly generationCanvas: {
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly widthPixels: number
    readonly heightPixels: number
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly callerSelectedDimensionsAllowed: false
    readonly squareFullFrameSubstitutionApplied: false
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly attemptPolicy: {
    readonly onePreparationUnitPerApprovedOutput: true
    readonly oneImagePerGpuAttempt: true
    readonly outputBatchingAllowed: false
    readonly deterministicSeedDerivedServerSide: true
    readonly callerSeedAllowed: false
    readonly exactModelRoleCount: 5
    readonly atomicReadOnlyModelMountLifetimeRequired: true
    readonly fixedSupervisedProcessRequired: true
    readonly deniedTopLevelImports: readonly ['sam2']
  }
  readonly downstreamPolicy: {
    readonly outputContentType: 'image/png'
    readonly outputImageCount: 1
    readonly outputIsIntermediateComponentOrPlate: true
    readonly stillAlphaPipelineRequired: boolean
    readonly opaqueRectangleMayReplaceRequiredAlpha: false
    readonly generatedFrameSequenceAllowed: false
    readonly generateEveryAnimationFrameIndependently: false
    readonly rerunCharacterRouteAfterQa: true
    readonly remotionOwnsFinalComposition: true
  }
  readonly qaRequirementCodes: readonly (
    | 'hidden_source_plate_complete'
    | 'component_boundary_decontaminated'
    | 'alpha_destination_composite_clean'
    | 'protected_face_clearance_verified'
    | 'attachment_continuity_verified'
    | 'character_prop_style_continuity_verified'
    | 'illustrative_fact_treatment_preserved'
  )[]
  readonly operationRegistered: false
  readonly dispatched: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly preparationUnitDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationAuthority {
  readonly characterPreparationProjectionAuthority: true
  readonly selectedSceneAuthority: false
  readonly promptMaterializationAuthority: false
  readonly outputFrameAuthority: false
  readonly timingAuthority: false
  readonly approvalAuthority: false
  readonly approvedWorkItemMutationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly operationRegistryAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly actualCostAuthority: false
  readonly assetAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCharacterControlledPreparationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CLASS
  readonly preparationState:
    typeof LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_STATE
  readonly candidateId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly sourceBindings: {
    readonly characterRouteDecisionVersion:
      'living-frame-character-animation-route-decision-v2'
    readonly characterRouteDecisionDigestSha256: string
    readonly selectedSceneRequestVersion:
      'living-frame-controlled-image-selected-scene-request-v1'
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly fullFrameRatioExtensionVersion:
      'living-frame-controlled-image-full-frame-ratio-extension-v1'
    readonly fullFrameRatioExtensionDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly approvedWorkGraphDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly sourceArtifactId: string
  }
  readonly selectedRoute:
    | Extract<
        LivingFrameCharacterAnimationRoute,
        | 'comfyui_controlled_component_preparation'
        | 'comfyui_controlled_keyposes'
      >
  readonly preparationUnits:
    readonly LivingFrameCharacterControlledPreparationUnit[]
  readonly metrics: {
    readonly preparationUnitCount: number
    readonly maskedInpaintUnitCount: number
    readonly isolatedComponentUnitCount: number
    readonly anchorKeyposeUnitCount: number
    readonly maximumAnchorKeyposeCount: 4
  }
  readonly graphBoundary: {
    readonly existingSelectedSceneGraphSupportsMaskedInpaint:
      false
    readonly existingSelectedSceneGraphMaySubstituteForMaskedInpaint:
      false
    readonly maskedInpaintRequiresVersionedNamespacedExtension:
      true
    readonly maskedInpaintRequiredNodes: readonly [
      'LoadImageMask',
      'VAEEncodeForInpaint',
    ]
    readonly sourcePlateMaskEncodingProfile:
      'gray8_mask_png_v1'
    readonly sourcePlateMaskChannel: 'red'
    readonly sourcePlateMaskPolarity:
      'white_one_means_inpaint'
    readonly plainLoadImageMaskOutputAllowed: false
    readonly sourceAndMaskInputsPreparedOutsideComfyUi:
      true
    readonly oneComfyUiHostIdentityAndOperation: true
    readonly auxiliaryModelsOrLibrariesCreateToolIdentity:
      false
  }
  readonly professionalRules: {
    readonly reconstructPlateBeforeMovingOccludingComponent:
      true
    readonly cleanComponentBoundaryBeforeRigging:
      true
    readonly redesignMotionPathBeforeProtectedFaceCrossing:
      true
    readonly controlledGenerationCreatesComponentsOrAnchorKeyposesOnly:
      true
    readonly independentPerFrameGenerationForbidden:
      true
    readonly recompileRouteAfterPreparationQa:
      true
    readonly riggingCannotInventMissingArtwork:
      true
    readonly finalCanvasOwnedByRemotion: true
  }
  readonly openGateCodes:
    readonly LivingFrameCharacterControlledPreparationOpenGate[]
  readonly authorityBoundary:
    LivingFrameCharacterControlledPreparationAuthority
  readonly routeDecisionRevalidated: true
  readonly selectedSceneRequestRevalidated: true
  readonly fullFrameRatioExtensionRevalidated: true
  readonly rawPromptPathUrlModelBytesCredentialCommandOrEnvironmentIncluded:
    false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly runtimeExecuted: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly qaApproved: false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCharacterControlledPreparation
  extends LivingFrameCharacterControlledPreparationDraft {
  readonly preparationDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationIssue {
  readonly code:
    LivingFrameCharacterControlledPreparationIssueCode
  readonly path: string
}
