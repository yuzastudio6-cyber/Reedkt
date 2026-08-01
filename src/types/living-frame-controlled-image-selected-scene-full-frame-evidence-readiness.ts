import type {
  LivingFrameSourceTruthMode,
} from './living-frame'
import type {
  LivingFrameControlledImageFullFrameRatioClass,
  LivingFrameControlledImageFullFrameRatioComponentRole,
} from './living-frame-controlled-image-full-frame-ratio-extension'

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_VERSION =
  'living-frame-controlled-image-selected-scene-full-frame-evidence-readiness-v1' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_CLASS =
  'server_private_selected_scene_full_frame_evidence_readiness_candidate' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_STATE =
  'full_frame_output_bound_canonical_artifact_and_qa_evidence_pending' as const

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_OPEN_GATES = [
  'canonical_comfyui_operation_registration_dispatch_completion_and_cost_evidence_required',
  'create_only_canonical_private_image_artifact_persistence_required',
  'canonical_asset_received_and_asset_quality_qa_required',
  'canonical_visual_continuity_reference_and_measurement_required_when_planned',
  'canonical_documentary_fact_safety_revalidation_and_evidence_required',
  'living_frame_scene_evidence_package_required',
  'canonical_asset_manifest_reconciliation_required',
  'canonical_private_review_required',
  'remotion_final_composition_required',
] as const

export type LivingFrameControlledImageSelectedSceneFullFrameEvidenceOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_OPEN_GATES)[number]

export const LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_ISSUE_CODES = [
  'input_invalid',
  'selected_scene_request_invalid',
  'full_frame_ratio_extension_invalid',
  'output_observation_invalid',
  'work_graph_integrity_invalid',
  'full_frame_output_required',
  'full_frame_alpha_chain_forbidden',
  'full_frame_ratio_unit_missing',
  'confirmed_frame_ratio_mismatch',
  'square_full_frame_substitution_forbidden',
  'generation_output_lineage_missing',
  'cross_scene_work_item_or_output_substitution',
  'unsafe_readiness_projection_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledImageSelectedSceneFullFrameEvidenceIssueCode =
  (typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_ISSUE_CODES)[number]

export type LivingFrameControlledImageSelectedSceneFullFrameContinuityRequirement =
  | 'required_by_approved_visual_continuity_pack'
  | 'canonical_continuity_revalidation_then_not_applicable'

export type LivingFrameControlledImageSelectedSceneFullFrameFactRequirement =
  | 'required_by_source_truth_mode'
  | 'canonical_source_truth_revalidation_then_not_applicable'

export interface LivingFrameControlledImageSelectedSceneFullFrameEvidenceAuthority {
  readonly serverDerivedReadOnlyEvidenceReadinessAuthority: true
  readonly selectedSceneAuthority: false
  readonly visualContinuityPackAuthority: false
  readonly documentaryFactAuthority: false
  readonly outputFrameAuthority: false
  readonly operationRegistryAuthority: false
  readonly providerAuthority: false
  readonly queueAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly workerCompletionAuthority: false
  readonly runtimeAuthority: false
  readonly gpuAttemptAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphMutationAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly artifactQaAuthority: false
  readonly continuityQaAuthority: false
  readonly sceneEvidencePackageAuthority: false
  readonly assetManifestAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_CLASS
  readonly readinessState:
    typeof LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_EVIDENCE_READINESS_STATE
  readonly readinessId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
  }
  readonly exactOutputLineage: {
    readonly componentId: string
    readonly componentRole:
      LivingFrameControlledImageFullFrameRatioComponentRole
    readonly materializationUnitId: string
    readonly requestUnitId: string
    readonly extensionUnitId: string
    readonly outputKey: string
    readonly approvedWorkItemId: string
    readonly approvedWorkItemKey: string
    readonly generatedAssetIntentId: string
    readonly approvedPlannedAssetManifestEntryId: string
    readonly rendererLayerId: string
    readonly outputCandidateId: string
  }
  readonly sourceBindings: {
    readonly operationRequestReceiptDigestSha256: string
    readonly privateOperationRequestDigestSha256: string
    readonly promptMaterializationDigestSha256: string
    readonly selectedSceneRequestBindingDigestSha256: string
    readonly fullFrameRatioExtensionDigestSha256: string
    readonly privateOutputObservationDigestSha256: string
    readonly alphaWorkChainReconciliationDigestSha256: string
    readonly canonicalWorkGraphProjectionDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly selectedSceneBindingDigestSha256: string
    readonly visualContinuityPackDigestSha256: string | null
    readonly currentMasterTimingDigestSha256: string
    readonly controlledIllustrationCostWorkBindingDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
  }
  readonly confirmedFrameBinding: {
    readonly frameClass:
      LivingFrameControlledImageFullFrameRatioClass
    readonly confirmedAspectRatioLabel: string
    readonly widthPixels: number
    readonly heightPixels: number
    readonly pixelCount: number
    readonly confirmedFrameIsSquare: boolean
    readonly dimensionsDerivedOnlyFromConfirmedOutputFrame: true
    readonly sourceGenerationCanvasMatchesConfirmedRatio: true
    readonly callerSelectedDimensionsAllowed: false
    readonly squareSubstitutionApplied: false
    readonly distortionAllowed: false
  }
  readonly canonicalArtifactCandidate: {
    readonly artifactId: string
    readonly artifactDigestSha256: string
    readonly contentType: 'image/png'
    readonly byteLength: number
    readonly decodedRgbaDigestSha256: string
    readonly sceneEvidenceArtifactKind: 'opaque_raster'
    readonly expectedAssetRole: 'generated'
    readonly privateCreateOnlyPersistenceRequired: true
    readonly bytesDeliveredOutOfBandOnly: true
    readonly rawBytesIncluded: false
  }
  readonly destinationEvidenceExpectation: {
    readonly sourceTruthMode: LivingFrameSourceTruthMode
    readonly continuityRequirement:
      LivingFrameControlledImageSelectedSceneFullFrameContinuityRequirement
    readonly documentaryFactRequirement:
      LivingFrameControlledImageSelectedSceneFullFrameFactRequirement
    readonly continuityReferenceArtifactRequired: boolean
    readonly continuityMeasurementRequired: boolean
    readonly maskArtifactRequired: false
    readonly alphaMeasurementRequired: false
    readonly alphaEdgeDecontaminationRequired: false
    readonly temporalMaskMeasurementRequired: false
    readonly destinationAlphaCompositeMeasurementRequired: false
    readonly fullFramePlateMayEnterRembg: false
    readonly fullFramePlateMayReplaceRemotionFinalCanvas: false
  }
  readonly canonicalOwnerBindings: {
    readonly privateImagePersistenceOwner:
      'persistCanonicalPrivateImageArtifact'
    readonly artifactQaAuthorityVersion:
      'private-artifact-qa-authority-aggregate-v1'
    readonly requiredArtifactQaGateIds:
      readonly ['asset_received_gate', 'asset_quality_gate']
    readonly visualContinuityMeasurementContractVersion:
      'living-frame-visual-continuity-measurement-v1'
    readonly sceneEvidencePackageContractVersion:
      'living-frame-scene-evidence-package-v1'
    readonly documentaryFactSafetyOwner:
      'documentaryFactSafetyPlan'
    readonly approvedAssetManifestOwner:
      'canonical_approved_asset_manifest'
    readonly privateReviewOwner:
      'canonical_private_review_assembly_service'
    readonly finalCanvasOwner: 'remotion'
  }
  readonly evidenceReadiness: {
    readonly exactSelectedGenerationOutputBound: true
    readonly exactConfirmedFrameRatioBound: true
    readonly alphaWorkChainCorrectlyNotApplicable: true
    readonly privateArtifactPersisted: false
    readonly artifactQaPassed: false
    readonly continuityReferenceResolved: false
    readonly continuityMeasurementPassed: false
    readonly documentaryFactSafetyRevalidated: false
    readonly sceneEvidencePackageCompiled: false
    readonly assetManifestReconciled: false
    readonly privateReviewReady: false
    readonly remotionCompositionReady: false
  }
  readonly fixedRuntimeLineage: {
    readonly expectedCanonicalToolId: 'comfyui'
    readonly expectedCanonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly processEntrypointKind:
      'fixed_supervised_python_process'
    readonly runtimeConfinementRequirementDigestSha256: string
    readonly deniedTopLevelImports: readonly ['sam2']
    readonly nonRootRequired: true
    readonly readOnlyRootFilesystemRequired: true
    readonly allLinuxCapabilitiesDroppedRequired: true
    readonly noNewPrivilegesRequired: true
    readonly externalNetworkAllowed: false
    readonly runtimeDownloadsAllowed: false
    readonly exactModelArtifactCount: 5
    readonly exactModelArtifactByteLength: 11_700_367_157
    readonly allFiveModelRolesMountedReadOnlyForAttempt: true
    readonly allFiveModelRolesVerifiedBeforeAndAfterInference: true
    readonly oneProcessPerAttemptRequired: true
    readonly oneRequestUnitPerAttemptRequired: true
    readonly oneImagePerAttemptRequired: true
  }
  readonly costAndRegistryPolicy: {
    readonly sharedGpuCapabilityRoles: readonly [
      'comfyui_host',
      'controlnet_aux_preprocessing',
      'controlnet_conditioning',
      'generic_ip_adapter_conditioning',
      'lora_adapter_loading',
    ]
    readonly comfyUiGpuAttemptMustNotBeChargedAgain: true
    readonly fiveGpuCapabilitiesCreateOneAttemptCostEvent: true
    readonly auraFaceCpuMeasurementExcluded: true
    readonly currentObservedCountIsProductCap: false
    readonly registryExpansionPermitted: true
    readonly postAdmissionCountDerivedFromReleasedDistinctIdentities:
      true
    readonly fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed:
      false
    readonly actualCostAmountIncluded: false
    readonly customerPriceOrCreditIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledImageSelectedSceneFullFrameEvidenceOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledImageSelectedSceneFullFrameEvidenceAuthority
  readonly selectedSceneRequestRevalidated: true
  readonly fullFrameRatioExtensionRevalidated: true
  readonly privateOutputObservationRevalidated: true
  readonly canonicalWorkGraphRevalidated: true
  readonly currentSnapshotTimingFrameCostAndWorkLineageMatched: true
  readonly canonicalWorkGraphMutated: false
  readonly persistenceExecuted: false
  readonly qaExecuted: false
  readonly sceneEvidencePackageCompiled: false
  readonly assetManifestMutated: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly finalCanvasCreatedByComfyUi: false
  readonly containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness
  extends LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessDraft {
  readonly readinessDigestSha256: string
}

export interface LivingFrameControlledImageSelectedSceneFullFrameEvidenceIssue {
  readonly code:
    LivingFrameControlledImageSelectedSceneFullFrameEvidenceIssueCode
  readonly path: string
}
