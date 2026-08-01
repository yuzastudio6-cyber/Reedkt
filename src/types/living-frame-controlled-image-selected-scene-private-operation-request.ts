import type { LivingFrameControlledSdxlBenchmarkRequestSlotKind } from "./living-frame-controlled-sdxl-benchmark-request-blueprint";
import type { LivingFrameControlledModelFamilyRole } from "./living-frame-controlled-model-family-binding";
import type { LivingFrameControlledImageSelectedSceneGraphFeature } from "./living-frame-controlled-image-selected-scene-private-prompt-materialization";

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_VERSION =
  "living-frame-controlled-image-selected-scene-private-operation-request-v1" as const;

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_CLASS =
  "server_private_selected_scene_single_attempt_comfyui_operation_request_receipt" as const;

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_STATE =
  "selected_scene_private_operation_request_lease_created_dispatch_blocked" as const;

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_OPEN_GATES =
  [
    "canonical_comfyui_identity_and_operation_admission_required",
    "shared_registry_semantic_guard_reconciliation_required",
    "selected_scene_private_dispatch_and_worker_lease_required",
    "signed_scanned_nonroot_gpu_image_required",
    "license_vulnerability_dependency_and_model_weight_disposition_required",
    "atomic_five_model_read_only_mount_execution_required",
    "real_l4_resource_latency_determinism_and_quality_evidence_required",
    "canonical_resource_and_actual_cost_receipt_required",
    "create_only_generated_asset_persistence_required",
    "alpha_continuity_fact_and_destination_qa_required",
    "asset_manifest_reconciliation_and_private_review_required",
    "remotion_final_composition_required",
  ] as const;

export type LivingFrameControlledImageSelectedScenePrivateOperationRequestOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_OPEN_GATES)[number];

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_ISSUE_CODES =
  [
    "input_invalid",
    "reader_invalid",
    "reader_reused",
    "reader_failed",
    "selected_scene_request_invalid",
    "full_frame_ratio_extension_invalid",
    "admission_candidate_invalid",
    "prompt_materialization_invalid",
    "prompt_lease_invalid",
    "prompt_lease_reused",
    "source_lineage_mismatch",
    "materialization_unit_missing",
    "artifact_packet_invalid",
    "artifact_packet_digest_mismatch",
    "artifact_lineage_invalid",
    "cross_scene_work_item_or_output_substitution",
    "model_artifact_set_invalid",
    "input_image_artifact_set_invalid",
    "private_alias_invalid",
    "private_prompt_lineage_invalid",
    "generation_canvas_invalid",
    "fixed_runtime_policy_invalid",
    "wire_request_invalid",
    "wire_request_too_large",
    "wire_request_lease_invalid",
    "wire_request_lease_reused",
    "unsafe_receipt_forbidden",
    "authority_promotion_forbidden",
    "digest_mismatch",
  ] as const;

export type LivingFrameControlledImageSelectedScenePrivateOperationRequestIssueCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_ISSUE_CODES)[number];

export interface LivingFrameControlledImageSelectedScenePrivateOperationRequestAuthority {
  readonly privateOperationRequestCompilationAuthority: true;
  readonly selectedSceneAuthority: false;
  readonly visualContinuityPackAuthority: false;
  readonly outputFrameAuthority: false;
  readonly promptPlanningAuthority: false;
  readonly promptMaterializationAuthority: false;
  readonly modelArtifactRepositoryAuthority: false;
  readonly inputArtifactRepositoryAuthority: false;
  readonly artifactMountAuthority: false;
  readonly toolRegistryAuthority: false;
  readonly operationRegistryAuthority: false;
  readonly providerAuthority: false;
  readonly timingAuthority: false;
  readonly soundAuthority: false;
  readonly estimateAuthority: false;
  readonly actualCostAuthority: false;
  readonly customerPriceAuthority: false;
  readonly customerCreditAuthority: false;
  readonly approvalAuthority: false;
  readonly snapshotAuthority: false;
  readonly approvedWorkItemMutationAuthority: false;
  readonly workGraphMutationAuthority: false;
  readonly queueAuthority: false;
  readonly dispatchAuthority: false;
  readonly workerLeaseAuthority: false;
  readonly gpuAttemptAuthority: false;
  readonly artifactPersistenceAuthority: false;
  readonly assetManifestAuthority: false;
  readonly qaApprovalAuthority: false;
  readonly privateReviewAuthority: false;
  readonly renderAuthority: false;
  readonly runtimeAuthority: false;
  readonly productionAuthority: false;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationArtifactReceipt {
  readonly order: number;
  readonly artifactClass:
    "canonical_model_artifact" | "private_selected_scene_input_image_artifact";
  readonly modelRole: LivingFrameControlledModelFamilyRole | null;
  readonly slotKind: LivingFrameControlledSdxlBenchmarkRequestSlotKind;
  readonly artifactRecordId: string;
  readonly artifactContentSha256: string;
  readonly artifactByteLength: number;
  readonly artifactSourceBindingDigestSha256: string;
  readonly privateAliasDigestSha256: string;
  readonly privateAliasIncluded: false;
  readonly artifactBytesIncluded: false;
  readonly pathOrUrlIncluded: false;
  readonly readOnlyMountRequired: true;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationRequestReceiptDraft {
  readonly contractVersion: typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_VERSION;
  readonly resultClass: typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_CLASS;
  readonly requestState: typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OPERATION_REQUEST_STATE;
  readonly operationRequestReceiptId: string;
  readonly serverOwnedArtifactLocatorId: string;
  readonly canonicalScope: {
    readonly workspaceId: string;
    readonly projectId: string;
    readonly editSessionId: string;
    readonly sceneId: string;
  };
  readonly exactOutputLineage: {
    readonly materializationUnitId: string;
    readonly requestUnitId: string;
    readonly requestUnitDigestSha256: string;
    readonly componentId: string;
    readonly outputKey: string;
    readonly approvedWorkItemId: string;
    readonly approvedWorkItemKey: string;
    readonly approvedPlannedAssetManifestEntryId: string;
    readonly rendererLayerId: string;
  };
  readonly sourceBindings: {
    readonly selectedSceneRequestBindingDigestSha256: string;
    readonly fullFrameRatioExtensionDigestSha256: string;
    readonly admissionCandidateDigestSha256: string;
    readonly promptMaterializationDigestSha256: string;
    readonly promptMaterializationUnitDigestSha256: string;
    readonly privatePromptRequestDigestSha256: string;
    readonly privatePromptRequestLeaseId: string;
    readonly approvedSnapshotId: string;
    readonly approvedSnapshotHashSha256: string;
    readonly selectedSceneBindingDigestSha256: string;
    readonly visualContinuityPackDigestSha256: string | null;
    readonly currentMasterTimingDigestSha256: string;
    readonly canonicalWorkGraphProjectionDigestSha256: string;
    readonly plannedAssetAndApprovedOutputLineageDigestSha256: string;
    readonly controlledIllustrationCostWorkBindingDigestSha256: string;
    readonly confirmedOutputFrameExpectationDigestSha256: string;
    readonly fullFrameRatioExtensionUnitDigestSha256: string | null;
    readonly artifactSetDigestSha256: string;
    readonly artifactPacketDigestSha256: string;
  };
  readonly graphProfile: {
    readonly qualifiedGraphFamily: "controlled_sdxl_selected_scene_v1";
    readonly enabledFeatures: readonly LivingFrameControlledImageSelectedSceneGraphFeature[];
    readonly graphTopologyDigestSha256: string;
    readonly benchmarkCaseOrRecipeUsed: false;
    readonly faceIdOrInsightFaceAllowed: false;
    readonly inGraphPreprocessorAllowed: false;
    readonly arbitrarySaveOrPreviewNodeAllowed: false;
    readonly websocketOutputOnly: true;
  };
  readonly generationCanvas: {
    readonly canvasClass:
      "isolated_component_square_1024" | "confirmed_full_frame_ratio";
    readonly widthPixels: number;
    readonly heightPixels: number;
    readonly confirmedOutputFrameExpectationDigestSha256: string;
    readonly callerSelectedDimensionsAllowed: false;
    readonly squareSubstitutionApplied: false;
    readonly finalCanvasCreatedByComfyUi: false;
  };
  readonly operationExpectation: {
    readonly expectedCanonicalToolId: "comfyui";
    readonly expectedCanonicalOperationId: "tool.comfyui.generate_controlled_image.v1";
    readonly sharedWorkerType: "gpu_ai_worker";
    readonly executionTarget: "google_cloud_run_gpu";
    readonly runtimeRegion: "europe-west1";
    readonly accelerator: "nvidia_l4";
    readonly gpuCount: 1;
    readonly cpuFallbackAllowed: false;
  };
  readonly fixedRuntimePolicy: {
    readonly processEntrypointKind: "fixed_supervised_python_process";
    readonly runtimeConfinementRequirementDigestSha256: string;
    readonly deniedTopLevelImports: readonly ["sam2"];
    readonly nonRootRequired: true;
    readonly readOnlyRootFilesystemRequired: true;
    readonly allLinuxCapabilitiesDroppedRequired: true;
    readonly noNewPrivilegesRequired: true;
    readonly externalNetworkAllowed: false;
    readonly runtimeDownloadsAllowed: false;
    readonly allFiveModelRolesMountedReadOnlyForAttempt: true;
    readonly allFiveModelRolesVerifiedBeforeAndAfterInference: true;
    readonly oneProcessPerAttemptRequired: true;
    readonly callerCommandArgumentsEnvironmentPathUrlOrCredentialAllowed: false;
  };
  readonly requestSummary: {
    readonly privateOperationRequestLeaseId: string;
    readonly privateOperationRequestDigestSha256: string;
    readonly serializedOperationRequestByteLength: number;
    readonly promptNodeCount: number;
    readonly exactModelArtifactCount: 5;
    readonly exactModelArtifactByteLength: 11_700_367_157;
    readonly inputImageArtifactCount: number;
    readonly artifactReceipts: readonly LivingFrameControlledImageSelectedScenePrivateOperationArtifactReceipt[];
    readonly outputContentType: "image/png";
    readonly outputImageCount: 1;
    readonly websocketImageOutputRequired: true;
    readonly privateOperationRequestIncludedInReceipt: false;
    readonly privatePromptIncludedInReceipt: false;
  };
  readonly attemptAndCostBinding: {
    readonly costComponentId: "shared_controlled_illustration_gpu_host";
    readonly sharedGpuCapabilityKeys: readonly [
      "comfyui",
      "comfyui_controlnet_aux",
      "controlnet",
      "ip_adapter",
      "peft_lora",
    ];
    readonly separateCpuQaCapabilityKey: "auraface";
    readonly oneOperationRequestRepresentsOneGpuAttempt: true;
    readonly oneMaterializationUnitRepresentsOneApprovedOutput: true;
    readonly outputBatchingAllowed: false;
    readonly fiveGpuCapabilitiesShareAttemptLifetime: true;
    readonly fiveGpuCapabilitiesCreateOneAttemptCostEvent: true;
    readonly auraFaceExcludedFromGpuAttempt: true;
    readonly exactReuseCreatesNoNewGpuAttempt: true;
    readonly failedOrUnknownAttemptCostMustBeRetained: true;
    readonly actualWorkerResourceCostEvidenceRequired: true;
    readonly costAmountIncluded: false;
    readonly customerCreditAmountIncluded: false;
    readonly serviceFeeIncluded: false;
  };
  readonly registryPolicy: {
    readonly currentObservedCountIsProductCap: false;
    readonly registryExpansionPermitted: true;
    readonly postAdmissionCountDerivedFromReleasedDistinctIdentities: true;
    readonly oneComfyUiIdentityForSharedGpuAttempt: true;
    readonly fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed: false;
    readonly auraFaceMayUseDistinctReleasedCpuQaIdentity: true;
  };
  readonly openGateCodes: readonly LivingFrameControlledImageSelectedScenePrivateOperationRequestOpenGate[];
  readonly authorityBoundary: LivingFrameControlledImageSelectedScenePrivateOperationRequestAuthority;
  readonly selectedSceneRequestRevalidated: true;
  readonly fullFrameRatioExtensionRevalidated: true;
  readonly admissionCandidateRevalidated: true;
  readonly promptMaterializationRevalidated: true;
  readonly exactSelectedOutputLineageRevalidated: true;
  readonly privatePromptRequestLeaseConsumedExactlyOnce: true;
  readonly artifactPacketReadThroughProcessBoundPort: true;
  readonly exactFiveModelArtifactsBound: true;
  readonly exactPrivateInputImageArtifactsBound: true;
  readonly privateOperationRequestLeaseCreated: true;
  readonly benchmarkPromptOrRuntimePathUsed: false;
  readonly operationRegistered: false;
  readonly dispatchGranted: false;
  readonly workerLeaseCreated: false;
  readonly gpuAttemptCreated: false;
  readonly runtimeExecuted: false;
  readonly actualCostReceiptCreated: false;
  readonly assetCreated: false;
  readonly assetManifestMutated: false;
  readonly approvalPromoted: false;
  readonly finalCanvasClaimAllowed: false;
  readonly containsRawPromptAliasPathUrlModelBytesCredentialCommandOrEnvironment: false;
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData: false;
  readonly productionReady: false;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt extends LivingFrameControlledImageSelectedScenePrivateOperationRequestReceiptDraft {
  readonly operationRequestReceiptDigestSha256: string;
}

export interface LivingFrameControlledImageSelectedScenePrivateOperationRequestIssue {
  readonly code: LivingFrameControlledImageSelectedScenePrivateOperationRequestIssueCode;
  readonly path: string;
}
