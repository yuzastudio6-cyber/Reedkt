import type {
  LivingFrameComponentRole,
} from './living-frame'
import type {
  LivingFrameControlledSdxlBenchmarkGraphNodeClass,
} from './living-frame-controlled-sdxl-benchmark-graph-blueprint'
import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameControlledModelFamilyRole,
} from './living-frame-controlled-model-family-binding'

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_VERSION =
  'living-frame-controlled-image-selected-scene-private-prompt-materialization-v1' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_CLASS =
  'server_private_selected_scene_single_use_comfyui_prompt_request_materialization_receipt' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_STATE =
  'selected_scene_private_prompt_request_leases_created_dispatch_blocked' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_GRAPH_FEATURES = [
  'base',
  'lora',
  'controlnet',
  'generic_ipadapter',
] as const

export type LivingFrameControlledImageSelectedSceneGraphFeature =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_GRAPH_FEATURES)[number]

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_OPEN_GATES = [
  'canonical_comfyui_identity_and_operation_admission_required',
  'shared_registry_count_guard_reconciliation_required',
  'fixed_supervised_process_entrypoint_required',
  'current_gpu_node_schema_revalidation_required',
  'signed_scanned_nonroot_gpu_image_required',
  'atomic_five_model_read_only_mount_required',
  'license_vulnerability_and_model_weight_disposition_required',
  'private_gpu_dispatch_and_worker_lease_required',
  'canonical_resource_and_actual_cost_receipt_required',
  'create_only_asset_persistence_required',
  'alpha_continuity_fact_and_destination_qa_required',
  'asset_manifest_and_private_review_required',
  'remotion_final_composition_required',
] as const

export type LivingFrameControlledImageSelectedScenePrivatePromptOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_ISSUE_CODES = [
  'input_invalid',
  'reader_invalid',
  'reader_reused',
  'reader_failed',
  'packet_invalid',
  'selected_scene_request_invalid',
  'full_frame_ratio_extension_invalid',
  'admission_candidate_invalid',
  'source_lineage_mismatch',
  'materialization_unit_set_invalid',
  'cross_scene_work_item_or_output_substitution',
  'full_frame_ratio_unit_missing',
  'generation_canvas_invalid',
  'graph_family_not_qualified',
  'node_allowlist_violation',
  'node_denylist_violation',
  'node_order_invalid',
  'edge_reference_invalid',
  'slot_set_invalid',
  'slot_value_invalid',
  'prompt_text_invalid',
  'private_alias_invalid',
  'lease_invalid',
  'lease_reused',
  'unsafe_receipt_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledImageSelectedScenePrivatePromptIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_ISSUE_CODES)[number]

export interface LivingFrameControlledImageSelectedScenePrivatePromptAuthority {
  readonly selectedScenePrivatePromptMaterializationAuthority: true
  readonly selectedSceneAuthority: false
  readonly visualContinuityPackAuthority: false
  readonly outputFrameAuthority: false
  readonly promptPlanningAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly approvedWorkItemMutationAuthority: false
  readonly workGraphMutationAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly modelArtifactAuthority: false
  readonly artifactMountAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly actualCostAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptSlotReceipt {
  readonly order: number
  readonly slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly valueDigestSha256: string
  readonly valueByteLength: number
  readonly valueIncluded: false
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit {
  readonly order: number
  readonly materializationUnitId: string
  readonly requestUnitId: string
  readonly requestUnitDigestSha256: string
  readonly fullFrameRatioExtensionUnitId: string | null
  readonly fullFrameRatioExtensionUnitDigestSha256: string | null
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
  readonly continuityDirectionDigestSha256: string | null
  readonly graphProfile: {
    readonly qualifiedGraphFamily:
      'controlled_sdxl_selected_scene_v1'
    readonly enabledFeatures:
      readonly LivingFrameControlledImageSelectedSceneGraphFeature[]
    readonly nodeClasses:
      readonly LivingFrameControlledSdxlBenchmarkGraphNodeClass[]
    readonly graphTopologyDigestSha256: string
    readonly benchmarkCaseOrRecipeUsed: false
    readonly baseRequired: true
    readonly loraOptional: true
    readonly deterministicControlNetInputOptional: true
    readonly genericIpAdapterAndClipVisionReferenceOptional: true
    readonly faceIdOrInsightFaceAllowed: false
    readonly inGraphPreprocessorAllowed: false
    readonly arbitrarySaveOrPreviewNodeAllowed: false
    readonly websocketOutputOnly: true
  }
  readonly generationCanvas: {
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly widthPixels: number
    readonly heightPixels: number
    readonly dimensionSource:
      | 'selected_scene_isolated_component_policy'
      | 'confirmed_full_frame_ratio_extension'
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly callerSelectedDimensionsAllowed: false
    readonly squareSubstitutionApplied: false
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly deterministicSeedPolicy: {
    readonly policyVersion:
      'living_frame_selected_scene_server_seed_v1'
    readonly seedDigestSha256: string
    readonly seedIncludedInReceipt: false
    readonly callerSeedAllowed: false
  }
  readonly atomicModelMountPolicy: {
    readonly exactModelRoleCount: 5
    readonly exactModelRoles:
      readonly LivingFrameControlledModelFamilyRole[]
    readonly exactModelArtifactByteLength: 11_700_367_157
    readonly allRolesMountedReadOnlyForAttempt: true
    readonly allRolesVerifiedBeforeAndAfterInference: true
    readonly modelArtifactsTravelInPromptOrRequest: false
  }
  readonly attemptPolicy: {
    readonly oneMaterializationUnitPerApprovedGeneratedOutput:
      true
    readonly oneLeaseRepresentsOneFutureGpuAttempt: true
    readonly oneImagePerAttempt: true
    readonly outputBatchingAllowed: false
    readonly exactMaximumSceneAttemptCount: number
    readonly fixedSupervisedProcessRequired: true
    readonly confinementDigestSha256: string
    readonly deniedTopLevelImports: readonly ['sam2']
  }
  readonly privatePromptRequest: {
    readonly leaseId: string
    readonly promptRequestDigestSha256: string
    readonly serializedPromptRequestByteLength: number
    readonly nodeCount: number
    readonly slotReceipts:
      readonly LivingFrameControlledImageSelectedScenePrivatePromptSlotReceipt[]
    readonly rawPromptIncludedInReceipt: false
    readonly rawConditioningTextIncludedInReceipt: false
    readonly modelOrImageAliasIncludedInReceipt: false
    readonly modelOrImageBytesIncludedInReceipt: false
    readonly pathUrlCredentialCommandOrEnvironmentIncludedInReceipt:
      false
    readonly leaseConsumed: false
  }
  readonly downstreamPolicy: {
    readonly outputContentType: 'image/png'
    readonly outputImageCount: 1
    readonly generatedArtifactType:
      'living_frame_generated_opaque_still_png'
    readonly stillAlphaPipelineRequired: boolean
    readonly aiVideoFallbackAllowed: false
    readonly generatedAssetRemainsInputToRemotion: true
    readonly remotionOwnsFinalComposition: true
  }
  readonly materializationUnitState:
    'private_prompt_request_lease_created_dispatch_blocked'
  readonly operationRegistered: false
  readonly dispatched: false
  readonly gpuAttemptCreated: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly materializationUnitDigestSha256: string
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptMaterializationDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_CLASS
  readonly materializationState:
    typeof
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_STATE
  readonly materializationBatchId: string
  readonly serverOwnedMaterializationLocatorId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly sourceBindings: {
    readonly selectedSceneRequestContractVersion:
      'living-frame-controlled-image-selected-scene-request-v1'
    readonly selectedSceneRequestBindingId: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly fullFrameRatioExtensionContractVersion:
      'living-frame-controlled-image-full-frame-ratio-extension-v1'
    readonly fullFrameRatioExtensionId: string
    readonly fullFrameRatioExtensionDigestSha256: string
    readonly admissionCandidateContractVersion:
      'living-frame-comfyui-operation-admission-candidate-v3'
    readonly admissionCandidateDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly visualContinuityPackDigestSha256: string | null
    readonly currentMasterTimingDigestSha256: string
    readonly canonicalWorkGraphProjectionDigestSha256: string
    readonly plannedAssetAndApprovedOutputLineageDigestSha256: string
    readonly controlledIllustrationCostWorkBindingDigestSha256:
      string
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly fixedLaunchSpecDigestSha256: string
    readonly runtimeConfinementRequirementDigestSha256: string
    readonly privatePacketDigestSha256: string
  }
  readonly materializationUnits:
    readonly LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit[]
  readonly metrics: {
    readonly approvedGeneratedOutputCount: number
    readonly materializationUnitCount: number
    readonly privateLeaseCount: number
    readonly isolatedComponentUnitCount: number
    readonly fullFrameRatioUnitCount: number
    readonly loraUnitCount: number
    readonly controlNetUnitCount: number
    readonly genericIpAdapterUnitCount: number
    readonly totalPromptNodeCount: number
    readonly totalPrivateSlotCount: number
  }
  readonly registryPolicy: {
    readonly currentObservedProductionToolIdentityCount: number
    readonly currentObservedCountIsProductCap: false
    readonly registryExpansionPermitted: true
    readonly postAdmissionCountDerivedFromReleasedDistinctIdentities:
      true
    readonly oneComfyUiIdentityForSharedGpuAttempt: true
    readonly fakeIdentityForModelWeightAdapterOrLibraryAllowed:
      false
    readonly auraFaceMayUseDistinctReleasedCpuQaIdentity: true
  }
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedScenePrivatePromptOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedScenePrivatePromptAuthority
  readonly selectedSceneRequestRevalidated: true
  readonly fullFrameRatioExtensionRevalidated: true
  readonly admissionCandidateRevalidated: true
  readonly approvedSnapshotSceneContinuityTimingWorkAssetAndCostRevalidated:
    true
  readonly oneMaterializationUnitPerApprovedGeneratedOutput: true
  readonly benchmarkPromptPathUsed: false
  readonly benchmarkSubstitutionAllowed: false
  readonly callerSeedDimensionsPromptModelPathUrlBytesCredentialCommandOrEnvironmentAllowed:
    false
  readonly processBoundSingleUsePromptRequestLeasesCreated: true
  readonly allPrivateValuesExcludedFromReceipt: true
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly workerLeaseCreated: false
  readonly runtimeExecuted: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly approvalPromoted: false
  readonly finalCanvasClaimAllowed: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptMaterialization
  extends LivingFrameControlledImageSelectedScenePrivatePromptMaterializationDraft {
  readonly materializationDigestSha256: string
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptIssue {
  readonly code:
    LivingFrameControlledImageSelectedScenePrivatePromptIssueCode
  readonly path: string
}
