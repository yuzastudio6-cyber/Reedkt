import type {
  LivingFrameComponentRole,
} from './living-frame'
import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'

export const
LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_VERSION =
  'living-frame-controlled-image-full-frame-ratio-extension-v1' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_CLASS =
  'server_derived_non_executable_full_frame_ratio_request_extension' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_STATE =
  'full_frame_ratio_units_projected_operation_qualification_pending' as const

export const
LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_FRAME_CLASSES = [
  'portrait_9_16',
  'landscape_16_9',
  'custom_or_other_confirmed_ratio',
] as const

export type LivingFrameControlledImageFullFrameRatioClass =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_FRAME_CLASSES)[number]

export const
LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_COMPONENT_ROLES = [
  'source_still',
  'opaque_background_plate',
  'reconstructed_background_plate',
] as const satisfies readonly LivingFrameComponentRole[]

export type LivingFrameControlledImageFullFrameRatioComponentRole =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_COMPONENT_ROLES)[number]

export const
LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_OPEN_GATES = [
  'canonical_comfyui_operation_admission_required',
  'shared_registry_count_guard_reconciliation_required',
  'selected_scene_request_operation_binding_required',
  'fixed_supervised_process_entrypoint_shared_interface_required',
  'signed_scanned_nonroot_gpu_image_required',
  'released_import_guard_and_confinement_observation_required',
  'atomic_five_model_read_only_mount_required',
  'full_frame_resolution_and_l4_memory_qualification_required',
  'license_vulnerability_and_model_weight_disposition_required',
  'private_gpu_dispatch_and_worker_lease_required',
  'canonical_resource_and_actual_cost_receipt_required',
  'create_only_asset_persistence_required',
  'alpha_continuity_fact_and_destination_qa_required',
  'asset_manifest_and_private_review_required',
  'remotion_final_composition_required',
] as const

export type LivingFrameControlledImageFullFrameRatioOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_ISSUE_CODES = [
  'input_invalid',
  'confirmed_output_frame_required',
  'confirmed_output_frame_unsupported',
  'frame_ratio_mismatch',
  'frame_expectation_digest_mismatch',
  'selected_scene_request_invalid',
  'admission_candidate_invalid',
  'full_frame_request_unit_missing',
  'full_frame_request_unit_invalid',
  'isolated_component_boundary_invalid',
  'cross_scene_or_work_item_substitution',
  'unsafe_projection_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledImageFullFrameRatioIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_ISSUE_CODES)[number]

export interface LivingFrameControlledImageFullFrameRatioAuthority {
  readonly fullFrameRatioExtensionCompilationAuthority: true
  readonly selectedSceneAuthority: false
  readonly outputFrameAuthority: false
  readonly promptAuthority: false
  readonly visualContinuityPackAuthority: false
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

export interface LivingFrameControlledImageFullFrameRatioUnit {
  readonly order: number
  readonly extensionUnitId: string
  readonly selectedSceneRequestUnitId: string
  readonly selectedSceneRequestUnitDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly componentRole:
    LivingFrameControlledImageFullFrameRatioComponentRole
  readonly assetIntentId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly rendererLayerId: string
  readonly serverOwnedConditioningLocatorId: string
  readonly privateSlotKinds:
    readonly LivingFrameControlledSdxlBenchmarkRequestSlotKind[]
  readonly frameProfile: {
    readonly frameClass:
      LivingFrameControlledImageFullFrameRatioClass
    readonly confirmedAspectRatioLabel: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly widthPixels: number
    readonly heightPixels: number
    readonly pixelCount: number
    readonly reducedAspectRatioNumerator: number
    readonly reducedAspectRatioDenominator: number
    readonly dimensionsDerivedOnlyFromConfirmedOutputFrame: true
    readonly callerSelectedDimensionsAllowed: false
    readonly sourceGenerationCanvasMatchesConfirmedRatio: true
    readonly confirmedFrameIsSquare: boolean
    readonly squareCanvasAllowedOnlyWhenConfirmedFrameIsSquare: true
    readonly squareSubstitutionApplied: false
    readonly distortionAllowed: false
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly sourceAssetPolicy: {
    readonly assetPurpose:
      'living_frame_full_frame_source_or_background_plate'
    readonly generatedArtifactType:
      'living_frame_generated_opaque_still_png'
    readonly outputContentType: 'image/png'
    readonly outputImageCount: 1
    readonly stillAlphaPipelineRequired: boolean
    readonly opaqueRectangleMayReplaceRequiredAlpha: false
    readonly aiVideoFallbackAllowed: false
    readonly generatedAssetRemainsInputToRemotion: true
    readonly remotionOwnsFinalComposition: true
  }
  readonly attemptPolicy: {
    readonly oneRequestUnitProducesOneImage: true
    readonly oneRequestUnitConsumesOneGpuAttempt: true
    readonly outputBatchingAllowed: false
    readonly deterministicSeedDerivedServerSide: true
    readonly callerSeedAllowed: false
    readonly maximumSceneAttemptCount: number
  }
  readonly qualificationState:
    'ready_for_full_frame_ratio_operation_qualification'
  readonly executableRequestCreated: false
  readonly runtimeExecuted: false
  readonly assetCreated: false
  readonly extensionUnitDigestSha256: string
}

export interface LivingFrameControlledImageFullFrameRatioExtensionDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_CLASS
  readonly extensionState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_FULL_FRAME_RATIO_EXTENSION_STATE
  readonly extensionId: string
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
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly admissionCandidateContractVersion:
      'living-frame-comfyui-operation-admission-candidate-v3'
    readonly admissionCandidateDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly recomputedConfirmedOutputFrameDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly fixedLaunchSpecDigestSha256: string
    readonly runtimeConfinementRequirementDigestSha256: string
  }
  readonly confirmedFrameProfile: {
    readonly frameClass:
      LivingFrameControlledImageFullFrameRatioClass
    readonly aspectRatioLabel: string
    readonly widthPixels: number
    readonly heightPixels: number
    readonly fps: number
    readonly pixelCount: number
    readonly reducedAspectRatioNumerator: number
    readonly reducedAspectRatioDenominator: number
    readonly outputFrameConfirmed: true
    readonly outputFramePurpose:
      'private_canonical_4k_master_review'
    readonly maximumQualifiedTargetWidthPixels: 4_096
    readonly maximumQualifiedTargetHeightPixels: 4_096
    readonly maximumQualifiedTargetPixelCount: 8_294_400
  }
  readonly fullFrameRequestUnits:
    readonly LivingFrameControlledImageFullFrameRatioUnit[]
  readonly isolatedComponentBoundary: {
    readonly isolatedRequestUnitIds: readonly string[]
    readonly isolatedUnitCount: number
    readonly isolatedUnitsIncludedInFullFrameExtension: false
    readonly isolatedGenerationCanvasClass:
      'isolated_component_square_1024'
    readonly isolatedGenerationWidthPixels: 1_024
    readonly isolatedGenerationHeightPixels: 1_024
    readonly fullFrameExtensionMayMutateIsolatedUnits: false
  }
  readonly operationExpectation: {
    readonly canonicalToolId: 'comfyui'
    readonly canonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly currentObservedProductionToolIdentityCount: number
    readonly currentObservedCountIsProductCap: false
    readonly registryExpansionPermitted: true
    readonly postAdmissionCountDerivedFromReleasedDistinctIdentities:
      true
    readonly oneComfyUiIdentityForSharedGpuAttempt: true
    readonly fakeIdentityForModelWeightAdapterOrLibraryAllowed:
      false
    readonly auraFaceMayUseDistinctReleasedCpuQaIdentity: true
    readonly qualificationOnly: true
    readonly productionToolSelectionAllowed: false
    readonly providerRoutingAllowed: false
    readonly approvedWorkDispatchAllowed: false
    readonly customerBillingAllowed: false
    readonly publicDeliveryAllowed: false
    readonly operationRegistered: false
  }
  readonly runtimeSafetyExpectation: {
    readonly processEntrypointKind:
      'fixed_supervised_python_process'
    readonly deniedTopLevelImports: readonly ['sam2']
    readonly outOfScopeDirectVcsImportsAllowed: false
    readonly runtimeConfinementRequirementDigestSha256: string
    readonly readOnlyModelMountsRequired: true
    readonly atomicFiveModelMountLifetimeRequired: true
    readonly exactModelRoleCount: 5
    readonly everyModelVerifiedBeforeAndAfterInferenceRequired: true
    readonly oneProcessPerAttemptRequired: true
    readonly oneRequestUnitPerAttemptRequired: true
    readonly oneImagePerAttemptRequired: true
    readonly callerCommandArgumentsEnvironmentPathUrlCredentialAllowed:
      false
    readonly modelArtifactsTravelInRequestBindings: false
    readonly faceIdOrUnapprovedIdentityAdapterAllowed: false
    readonly auraFaceExecutionPlacement:
      'separate_optional_cpu_continuity_qa'
  }
  readonly metrics: {
    readonly fullFrameRequestUnitCount: number
    readonly isolatedRequestUnitCount: number
    readonly portraitRequestUnitCount: number
    readonly landscapeRequestUnitCount: number
    readonly customOrOtherRatioRequestUnitCount: number
  }
  readonly openGateCodes:
    readonly LivingFrameControlledImageFullFrameRatioOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageFullFrameRatioAuthority
  readonly selectedSceneRequestRevalidated: true
  readonly admissionCandidateRevalidated: true
  readonly confirmedOutputFrameRevalidated: true
  readonly fullFrameRatioExtensionImplemented: true
  readonly squareSubstitutionAllowed: false
  readonly callerDimensionsPromptPathUrlModelOrCredentialAllowed:
    false
  readonly finalCanvasClaimAllowed: false
  readonly executableRequestCreated: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly workerLeaseCreated: false
  readonly actualCostReceiptCreated: false
  readonly assetCreated: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageFullFrameRatioExtension
  extends LivingFrameControlledImageFullFrameRatioExtensionDraft {
  readonly extensionDigestSha256: string
}

export interface LivingFrameControlledImageFullFrameRatioIssue {
  readonly code:
    LivingFrameControlledImageFullFrameRatioIssueCode
  readonly path: string
}
