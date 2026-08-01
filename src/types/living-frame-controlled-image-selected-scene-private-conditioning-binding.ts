import type {
  LivingFrameComponentRole,
  LivingFrameSourceTruthMode,
} from './living-frame'
import type {
  LivingFrameControlledImageFullFrameRatioClass,
} from './living-frame-controlled-image-full-frame-ratio-extension'
import type {
  LivingFrameVisualContinuityAssetTreatment,
  LivingFrameVisualContinuityDepthStyle,
} from './living-frame-visual-continuity'

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_VERSION =
  'living-frame-controlled-image-selected-scene-private-conditioning-binding-v1' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_CLASS =
  'server_derived_process_bound_animation_aware_private_conditioning_binding_candidate' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_STATE =
  'private_conditioning_brief_leases_created_prompt_packet_merge_pending' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_OPEN_GATES = [
  'canonical_selected_scene_private_conditioning_repository_required',
  'canonical_prompt_packet_merge_owner_required',
  'canonical_reference_artifact_binding_required_when_reference_conditioning_is_enabled',
  'canonical_documentary_fact_safety_revalidation_required_when_source_truth_demands_it',
  'canonical_semantic_style_continuity_qa_required',
  'canonical_private_gpu_dispatch_and_worker_lease_required',
  'signed_scanned_nonroot_gpu_image_required',
  'exact_read_only_model_mount_and_l4_evidence_required',
  'canonical_resource_and_actual_cost_receipt_required',
  'create_only_asset_persistence_and_asset_manifest_reconciliation_required',
  'alpha_continuity_fact_and_destination_qa_required',
  'canonical_private_review_required',
  'remotion_final_composition_required',
] as const

export type LivingFrameControlledImageSelectedScenePrivateConditioningOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_OPEN_GATES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_ISSUE_CODES = [
  'input_invalid',
  'selected_scene_request_invalid',
  'full_frame_ratio_extension_invalid',
  'visual_continuity_pack_binding_invalid',
  'source_lineage_mismatch',
  'selected_scene_mismatch',
  'component_mismatch',
  'continuity_payload_mismatch',
  'conditioning_text_unsafe',
  'conditioning_text_too_large',
  'cross_scene_work_item_or_output_substitution',
  'reference_expectation_promoted_to_artifact',
  'caller_conditioning_or_runtime_input_forbidden',
  'authority_promotion_forbidden',
  'lease_invalid',
  'lease_reused',
  'digest_mismatch',
] as const

export type LivingFrameControlledImageSelectedScenePrivateConditioningIssueCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_ISSUE_CODES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_MOTION_PREPARATION_CLASSES = [
  'flat_layer_animation',
  'shallow_2_5d_parallax',
  'deep_multiplane_parallax',
  'dimensional_spatial_composition',
] as const

export type LivingFrameControlledImageSelectedSceneMotionPreparationClass =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_MOTION_PREPARATION_CLASSES)[number]

export interface LivingFrameControlledImageSelectedScenePrivateConditioningAuthority {
  readonly privateConditioningCompilationAuthority: true
  readonly canonicalSelectedSceneMutationAuthority: false
  readonly visualContinuityPackCreationAuthority: false
  readonly promptPacketRepositoryAuthority: false
  readonly promptMaterializationAuthority: false
  readonly modelSelectionAuthority: false
  readonly referenceArtifactAuthority: false
  readonly documentaryFactAuthority: false
  readonly sourceTruthAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemMutationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly operationRegistryAuthority: false
  readonly toolRegistryAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly gpuAttemptAuthority: false
  readonly actualCostAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactQaAuthority: false
  readonly semanticStyleQaAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledImageSelectedScenePrivateConditioningBrief {
  readonly briefClass:
    'process_bound_selected_scene_animation_aware_conditioning_brief_v1'
  readonly conditioningUnitId: string
  readonly requestUnitId: string
  readonly sceneId: string
  readonly componentId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly serverOwnedConditioningLocatorId: string
  readonly positiveConditioningText: string
  readonly negativeConditioningText: string
  readonly textDerivedOnlyFromValidatedSelectedSceneAndContinuityPack:
    true
  readonly callerConditioningTextAccepted: false
  readonly callerSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
    false
  readonly referenceExpectationIsArtifactEvidence: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedScenePrivateConditioningLease {
  readonly leaseClass:
    'process_bound_single_use_selected_scene_private_conditioning_brief_lease_v1'
  readonly leaseId: string
  readonly conditioningBindingDigestSha256: string
  readonly conditioningUnitId: string
  readonly requestUnitId: string
  readonly callerSerializable: false
  readonly promptPacketMergeAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedScenePrivateConditioningUnit {
  readonly order: number
  readonly conditioningUnitId: string
  readonly requestUnitId: string
  readonly requestUnitDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly componentRole: LivingFrameComponentRole
  readonly assetIntentId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly rendererLayerId: string
  readonly serverOwnedConditioningLocatorId: string
  readonly semanticDirectionDigestSha256: string
  readonly componentDirectionDigestSha256: string
  readonly visualContinuityPackDigestSha256: string
  readonly selectedSceneContinuityBindingDigestSha256: string
  readonly semanticSceneProposalDigestSha256: string
  readonly semanticComponentProposalDigestSha256: string
  readonly sceneDesignSheetDigestSha256: string
  readonly styleBibleDigestSha256: string
  readonly linkedCharacterSheetDigestsSha256: readonly string[]
  readonly linkedObjectSheetDigestsSha256: readonly string[]
  readonly linkedEnvironmentSheetDigestsSha256: readonly string[]
  readonly motionLanguageSheetDigestSha256: string
  readonly alphaEdgeRulesDigestSha256: string
  readonly animationAwareIllustrationDirection: {
    readonly stillImageSourceOnly: true
    readonly frameByFrameOrAiVideoRequested: false
    readonly selectiveMotionPreparedForDownstream: true
    readonly movablePartsRemainSeparable: true
    readonly foregroundAndBackgroundRemainSeparable: true
    readonly noBakedMotionBlur: true
    readonly noBakedText: true
    readonly downstreamRemotionOwnsMotionCameraAndFinalComposition:
      true
  }
  readonly styleDirection: {
    readonly assetTreatment:
      LivingFrameVisualContinuityAssetTreatment
    readonly depthStyle:
      LivingFrameVisualContinuityDepthStyle
    readonly motionPreparationClass:
      LivingFrameControlledImageSelectedSceneMotionPreparationClass
    readonly depthStyleSupportsTwoPointFiveD: boolean
    readonly styleRuleCount: number
    readonly avoidanceRuleCount: number
  }
  readonly sourceTruthPolicy: {
    readonly sourceTruthMode: LivingFrameSourceTruthMode
    readonly generatedImageIsIllustrativeSourceOnly: true
    readonly generatedImageMayClaimAuthenticArchiveOrVerifiedEvidence:
      false
    readonly unsupportedActionMayBeImplied: false
    readonly exactDocumentaryFactSafetyRevalidationRequired:
      boolean
  }
  readonly generationCanvas: {
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly frameClass:
      | LivingFrameControlledImageFullFrameRatioClass
      | 'isolated_component'
    readonly widthPixels: number
    readonly heightPixels: number
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly dimensionsDerivedFromApprovedPolicyOnly: true
    readonly squareSubstitutionApplied: false
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly privateConditioningReceipt: {
    readonly leaseId: string
    readonly positiveConditioningDigestSha256: string
    readonly positiveConditioningByteLength: number
    readonly negativeConditioningDigestSha256: string
    readonly negativeConditioningByteLength: number
    readonly rawConditioningTextIncludedInReceipt: false
    readonly rawPackPayloadIncludedInReceipt: false
    readonly subjectSpecificSummaryIncludedInReceipt: false
    readonly referenceArtifactIncludedInReceipt: false
    readonly privateBytesPathUrlCredentialSeedModelCommandOrEnvironmentOrCallerSelectedDimensionIncludedInReceipt:
      false
    readonly leaseConsumed: false
  }
  readonly runtimeAndRegistryPolicy: {
    readonly canonicalToolId: 'comfyui'
    readonly canonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly fixedSupervisedProcessEntrypointRequired: true
    readonly runtimeConfinementRequirementDigestSha256: string
    readonly deniedTopLevelImports: readonly ['sam2']
    readonly exactModelArtifactRoleCount: 5
    readonly exactModelArtifactByteLength: 11_700_367_157
    readonly atomicReadOnlyMountRequiredForOneAttempt: true
    readonly oneRequestUnitOneImageOneGpuAttemptOneCostEvent:
      true
    readonly registryExpansionPermittedForReleasedDistinctExecutables:
      true
    readonly fakeIdentityForWeightAdapterLibraryPreprocessorOrCapabilityAllowed:
      false
    readonly auraFaceRemainsSeparateOptionalCpuContinuityQa:
      true
  }
  readonly conditioningUnitState:
    'private_conditioning_brief_lease_created_prompt_packet_merge_blocked'
  readonly promptPacketMerged: false
  readonly operationRegistered: false
  readonly dispatched: false
  readonly gpuAttemptCreated: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly conditioningUnitDigestSha256: string
}

export interface LivingFrameControlledImageSelectedScenePrivateConditioningBindingDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_CLASS
  readonly bindingState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_STATE
  readonly bindingId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly fullFrameRatioExtensionDigestSha256: string
    readonly visualContinuityPackBindingDigestSha256: string
    readonly semanticProposalBindingDigestSha256: string
    readonly semanticPlanProjectionDigestSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly visualContinuityPackDigestSha256: string
    readonly confirmedOutputFrameDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
  }
  readonly conditioningUnits:
    readonly LivingFrameControlledImageSelectedScenePrivateConditioningUnit[]
  readonly metrics: {
    readonly conditioningUnitCount: number
    readonly isolatedComponentUnitCount: number
    readonly confirmedFullFrameUnitCount: number
    readonly referenceConditionedUnitCount: number
    readonly structureConditionedUnitCount: number
    readonly exactFactRevalidationUnitCount: number
    readonly twoPointFiveDDirectedUnitCount: number
    readonly flatLayerAnimationUnitCount: number
    readonly shallowTwoPointFiveDUnitCount: number
    readonly deepMultiplaneUnitCount: number
    readonly dimensionalSpatialUnitCount: number
  }
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedScenePrivateConditioningOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedScenePrivateConditioningAuthority
  readonly selectedSceneRequestRevalidated: true
  readonly fullFrameRatioExtensionRevalidated: true
  readonly visualContinuityPackBindingRevalidated: true
  readonly selectedSceneSemanticComponentAndDesignSheetMappingRevalidated:
    true
  readonly animationAwareConditioningDerivedServerSide: true
  readonly conditioningDerivedFromRawChat: false
  readonly controlledReferenceExpectationsPromotedToArtifacts: false
  readonly callerConditioningPromptSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
    false
  readonly promptPacketMerged: false
  readonly promptMaterializationChanged: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly workerLeaseCreated: false
  readonly runtimeExecuted: false
  readonly gpuAttemptCreated: false
  readonly actualCostReceiptCreated: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly semanticStyleQaExecuted: false
  readonly documentaryFactSafetyRevalidated: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly finalCanvasCreatedByComfyUi: false
  readonly containsRawConditioningTextPackPayloadOrSubjectSpecificSummaries:
    false
  readonly containsPrivateBytesPathUrlCredentialSeedModelCommandOrEnvironmentOrCallerSelectedDimension:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedScenePrivateConditioningBinding
  extends LivingFrameControlledImageSelectedScenePrivateConditioningBindingDraft {
  readonly bindingDigestSha256: string
}

export interface LivingFrameControlledImageSelectedScenePrivateConditioningResult {
  readonly receipt:
    LivingFrameControlledImageSelectedScenePrivateConditioningBinding
  readonly privateConditioningBriefLeases:
    readonly LivingFrameControlledImageSelectedScenePrivateConditioningLease[]
}

export interface LivingFrameControlledImageSelectedScenePrivateConditioningIssue {
  readonly code:
    LivingFrameControlledImageSelectedScenePrivateConditioningIssueCode
  readonly path: string
}
