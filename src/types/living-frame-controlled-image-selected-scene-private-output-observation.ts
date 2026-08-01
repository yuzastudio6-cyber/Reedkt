import type {
  LivingFrameAlphaFindingCode,
} from "./living-frame-alpha-measurement";

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_VERSION =
  "living-frame-controlled-image-selected-scene-private-output-observation-v1" as const;

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_CLASS =
  "server_private_selected_scene_opaque_output_observation_non_authoritative" as const;

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_STATE =
  "selected_scene_private_output_verified_downstream_admission_pending" as const;

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_EVIDENCE_CLASSES =
  [
    "controlled_source_fixture",
    "fixed_gpu_subprocess_unqualified",
  ] as const;

export type LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_EVIDENCE_CLASSES)[number];

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OPEN_GATES =
  [
    "canonical_comfyui_operation_registration_required",
    "selected_scene_private_dispatch_worker_lease_and_completion_required",
    "signed_scanned_nonroot_gpu_image_required",
    "license_vulnerability_dependency_and_model_weight_disposition_required",
    "atomic_five_model_read_only_mount_execution_required",
    "runtime_image_identity_gpu_metric_and_confinement_attestation_required",
    "canonical_resource_and_actual_cost_receipt_required",
    "create_only_generated_asset_persistence_required",
    "component_segmentation_matting_decontamination_and_alpha_qa_when_required",
    "destination_composite_continuity_and_documentary_fact_qa_required",
    "asset_manifest_reconciliation_and_private_review_required",
    "remotion_final_composition_required",
  ] as const;

export type LivingFrameControlledImageSelectedScenePrivateOutputOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OPEN_GATES)[number];

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_ISSUE_CODES =
  [
    "input_invalid",
    "operation_request_receipt_invalid",
    "reader_invalid",
    "reader_reused",
    "reader_failed",
    "reader_lineage_invalid",
    "consumer_invalid",
    "consumer_reused",
    "consumer_failed",
    "output_packet_invalid",
    "output_lineage_invalid",
    "cross_scene_work_item_or_output_substitution",
    "output_bytes_invalid",
    "output_digest_mismatch",
    "output_decode_failed",
    "output_format_invalid",
    "output_dimension_invalid",
    "output_alpha_policy_invalid",
    "alpha_measurement_invalid",
    "downstream_disposition_invalid",
    "fixed_runtime_policy_invalid",
    "unsafe_receipt_forbidden",
    "authority_promotion_forbidden",
    "digest_mismatch",
  ] as const;

export type LivingFrameControlledImageSelectedScenePrivateOutputIssueCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_ISSUE_CODES)[number];

export type LivingFrameControlledImageSelectedScenePrivateOutputDisposition =
  | "opaque_component_source_requires_segmentation_matting_decontamination_and_alpha_qa"
  | "opaque_full_frame_plate_requires_destination_continuity_and_documentary_fact_qa";

export interface LivingFrameControlledImageSelectedScenePrivateOutputAuthority {
  readonly privateOutputRereadAndObservationAuthority: true;
  readonly selectedSceneAuthority: false;
  readonly visualContinuityPackAuthority: false;
  readonly outputFrameAuthority: false;
  readonly operationRegistryAuthority: false;
  readonly providerAuthority: false;
  readonly queueAuthority: false;
  readonly dispatchAuthority: false;
  readonly workerLeaseAuthority: false;
  readonly workerCompletionAuthority: false;
  readonly runtimeAuthority: false;
  readonly gpuAttemptAuthority: false;
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
  readonly artifactPersistenceAuthority: false;
  readonly assetManifestAuthority: false;
  readonly segmentationOrMattingAuthority: false;
  readonly alphaQaAuthority: false;
  readonly continuityQaAuthority: false;
  readonly documentaryFactAuthority: false;
  readonly privateReviewAuthority: false;
  readonly renderAuthority: false;
  readonly finalCanvasAuthority: false;
  readonly productionAuthority: false;
}

export interface LivingFrameControlledImageSelectedScenePrivateOutputObservationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_VERSION;
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_CLASS;
  readonly observationState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_OUTPUT_OBSERVATION_STATE;
  readonly observationId: string;
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
    readonly operationRequestReceiptId: string;
    readonly operationRequestReceiptDigestSha256: string;
    readonly privateOperationRequestDigestSha256: string;
    readonly selectedSceneRequestBindingDigestSha256: string;
    readonly fullFrameRatioExtensionDigestSha256: string;
    readonly admissionCandidateDigestSha256: string;
    readonly promptMaterializationDigestSha256: string;
    readonly promptMaterializationUnitDigestSha256: string;
    readonly approvedSnapshotId: string;
    readonly approvedSnapshotHashSha256: string;
    readonly selectedSceneBindingDigestSha256: string;
    readonly visualContinuityPackDigestSha256: string | null;
    readonly currentMasterTimingDigestSha256: string;
    readonly canonicalWorkGraphProjectionDigestSha256: string;
    readonly plannedAssetAndApprovedOutputLineageDigestSha256: string;
    readonly controlledIllustrationCostWorkBindingDigestSha256: string;
    readonly confirmedOutputFrameExpectationDigestSha256: string;
    readonly artifactSetDigestSha256: string;
    readonly artifactPacketDigestSha256: string;
    readonly readerBindingDigestSha256: string;
  };
  readonly outputReader: {
    readonly evidenceClass:
      LivingFrameControlledImageSelectedScenePrivateOutputEvidenceClass;
    readonly oneShotReaderConsumed: true;
    readonly oneShotConsumerConsumed: true;
    readonly verifiedBytesDeliveredOutOfBand: true;
  };
  readonly verifiedOutput: {
    readonly outputCandidateId: string;
    readonly contentType: "image/png";
    readonly byteLength: number;
    readonly contentSha256: string;
    readonly decodedRgbaSha256: string;
    readonly widthPixels: number;
    readonly heightPixels: number;
    readonly decodedChannelCount: 4;
    readonly sourcePngHadAlphaChannel: false;
    readonly transparentPixelCount: 0;
    readonly semiTransparentPixelCount: 0;
    readonly opaquePixelCount: number;
    readonly alphaMeasurementReportDigestSha256: string;
    readonly alphaFindingCodes: readonly LivingFrameAlphaFindingCode[];
    readonly canvasClass:
      | "isolated_component_square_1024"
      | "confirmed_full_frame_ratio";
    readonly stillAlphaPipelineRequired: boolean;
    readonly sourceDisposition:
      LivingFrameControlledImageSelectedScenePrivateOutputDisposition;
  };
  readonly fixedRuntimeLineage: {
    readonly expectedCanonicalToolId: "comfyui";
    readonly expectedCanonicalOperationId:
      "tool.comfyui.generate_controlled_image.v1";
    readonly processEntrypointKind: "fixed_supervised_python_process";
    readonly runtimeConfinementRequirementDigestSha256: string;
    readonly deniedTopLevelImports: readonly ["sam2"];
    readonly nonRootRequired: true;
    readonly readOnlyRootFilesystemRequired: true;
    readonly allLinuxCapabilitiesDroppedRequired: true;
    readonly noNewPrivilegesRequired: true;
    readonly externalNetworkAllowed: false;
    readonly runtimeDownloadsAllowed: false;
    readonly exactModelArtifactCount: 5;
    readonly exactModelArtifactByteLength: 11_700_367_157;
    readonly allFiveModelRolesMountedReadOnlyForAttempt: true;
    readonly allFiveModelRolesVerifiedBeforeAndAfterInference: true;
    readonly oneProcessPerAttemptRequired: true;
  };
  readonly costLineage: {
    readonly costComponentId:
      "shared_controlled_illustration_gpu_host";
    readonly oneObservedOutputBelongsToOneFutureGpuAttempt: true;
    readonly fiveGpuCapabilitiesShareAttemptLifetime: true;
    readonly fiveGpuCapabilitiesCreateOneAttemptCostEvent: true;
    readonly auraFaceCpuMeasurementExcluded: true;
    readonly completedFailedOrUnknownOutcomeNotInferred: true;
    readonly canonicalWorkerResourceCostEvidenceRequired: true;
    readonly actualCostAmountIncluded: false;
    readonly customerPriceOrCreditIncluded: false;
    readonly serviceFeeIncluded: false;
  };
  readonly registryPolicy: {
    readonly currentObservedCountIsProductCap: false;
    readonly registryExpansionPermitted: true;
    readonly postAdmissionCountDerivedFromReleasedDistinctIdentities: true;
    readonly oneComfyUiIdentityForSharedGpuAttempt: true;
    readonly fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed:
      false;
  };
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedScenePrivateOutputOpenGate[];
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedScenePrivateOutputAuthority;
  readonly operationRequestReceiptRevalidated: true;
  readonly exactSceneWorkItemOutputAndFrameLineageMatched: true;
  readonly exactPrivateOutputBytesRereadAndDecoded: true;
  readonly alphaMeasurementRecomputedFromDecodedBytes: true;
  readonly outputIsOpaqueGeneratedSourceOnly: true;
  readonly benchmarkRequestOrOutputSubstitutionAllowed: false;
  readonly workerCompletionInferred: false;
  readonly gpuAttemptCreated: false;
  readonly actualAttemptCostEvidenceVerified: false;
  readonly artifactPersisted: false;
  readonly assetManifestMutated: false;
  readonly qaApproved: false;
  readonly privateReviewApproved: false;
  readonly renderAuthorized: false;
  readonly finalCanvasCreatedByComfyUi: false;
  readonly containsOutputBytesPathUrlCredentialPromptAliasModelCommandOrEnvironment:
    false;
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false;
  readonly productionReady: false;
}

export interface LivingFrameControlledImageSelectedScenePrivateOutputObservation
  extends LivingFrameControlledImageSelectedScenePrivateOutputObservationDraft {
  readonly observationDigestSha256: string;
}

export interface LivingFrameControlledImageSelectedScenePrivateOutputIssue {
  readonly code:
    LivingFrameControlledImageSelectedScenePrivateOutputIssueCode;
  readonly path: string;
}
