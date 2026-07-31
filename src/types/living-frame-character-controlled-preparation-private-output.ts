import type {
  LivingFrameAlphaFindingCode,
} from './living-frame-alpha-measurement'
import type {
  LivingFrameCharacterControlledPreparationPurpose,
} from './living-frame-character-controlled-preparation'

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_VERSION =
  'living-frame-character-controlled-preparation-private-output-v1' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_CLASS =
  'server_private_character_preparation_output_observation_candidate' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_STATE =
  'canonical_v2_output_observed_persistence_qa_and_route_recompile_pending' as const

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_EVIDENCE_CLASSES =
  [
    'controlled_source_fixture',
    'canonical_v2_untrusted_structural_result',
  ] as const

export type LivingFrameCharacterControlledPreparationPrivateOutputEvidenceClass =
  (typeof
    LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_EVIDENCE_CLASSES)[number]

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_OPEN_GATES =
  [
    'canonical_comfyui_v2_request_and_result_compiler_release_required',
    'signed_scanned_nonroot_l4_runtime_image_required',
    'atomic_five_model_read_only_mount_and_inference_required',
    'canonical_worker_completion_and_resource_cost_evidence_required',
    'existing_selected_scene_private_output_observation_v2_adapter_required',
    'create_only_private_artifact_persistence_and_exact_reread_required',
    'hidden_plate_or_component_alpha_continuity_face_attachment_and_fact_qa_required',
    'prepared_character_route_recompilation_required',
    'asset_manifest_reconciliation_and_private_review_required',
    'remotion_final_composition_required',
  ] as const

export type LivingFrameCharacterControlledPreparationPrivateOutputOpenGate =
  (typeof
    LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_OPEN_GATES)[number]

export const
LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_ISSUE_CODES =
  [
    'input_invalid',
    'preparation_invalid',
    'private_prompt_invalid',
    'canonical_reconciliation_invalid',
    'source_lineage_mismatch',
    'preparation_unit_missing',
    'result_envelope_invalid',
    'result_lineage_invalid',
    'masked_plate_contract_invalid',
    'reader_invalid',
    'reader_reused',
    'reader_failed',
    'output_packet_invalid',
    'output_bytes_invalid',
    'output_digest_mismatch',
    'output_decode_failed',
    'output_format_invalid',
    'output_dimension_invalid',
    'output_alpha_policy_invalid',
    'alpha_measurement_invalid',
    'lease_invalid',
    'lease_reused',
    'unsafe_receipt_forbidden',
    'authority_promotion_forbidden',
    'digest_mismatch',
  ] as const

export type LivingFrameCharacterControlledPreparationPrivateOutputIssueCode =
  (typeof
    LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_ISSUE_CODES)[number]

export type LivingFrameCharacterControlledPreparationPrivateOutputDisposition =
  'opaque_masked_plate_requires_hidden_plate_continuity_fact_and_destination_qa'

export interface LivingFrameCharacterControlledPreparationCanonicalV2ResultEnvelope {
  readonly envelopeClass:
    'canonical_comfyui_v2_character_preparation_result_envelope_candidate'
  readonly evidenceClass:
    LivingFrameCharacterControlledPreparationPrivateOutputEvidenceClass
  readonly requestCandidateVersion:
    'canonical-comfyui-gpu-runtime-request-candidate-v2'
  readonly resultCandidateVersion:
    'canonical-comfyui-gpu-runtime-result-candidate-v2'
  readonly canonicalToolId: 'comfyui'
  readonly canonicalOperationId:
    'tool.comfyui.generate_controlled_image.v1'
  readonly requestCandidateDigestSha256: string
  readonly resultCandidateDigestSha256: string
  readonly workerCompletionReceiptDigestSha256: string
  readonly runtimeIdentityDigestSha256: string
  readonly runtimeConfinementRequirementDigestSha256: string
  readonly modelMountRereadDigestSha256: string
  readonly resourceCostEvidenceDigestSha256: string
  readonly approvedSnapshotId: string
  readonly approvedSnapshotHashSha256: string
  readonly approvedWorkGraphDigestSha256: string
  readonly currentMasterTimingDigestSha256: string
  readonly confirmedOutputFrameExpectationDigestSha256: string
  readonly preparationUnitId: string
  readonly preparationUnitDigestSha256: string
  readonly promptUnitId: string
  readonly promptUnitDigestSha256: string
  readonly graphTopologyDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly outputKey: string
  readonly canvasClass:
    | 'isolated_component_square_1024'
    | 'confirmed_full_frame_ratio'
  readonly widthPixels: number
  readonly heightPixels: number
  readonly outputCandidateId: string
  readonly outputContentType: 'image/png'
  readonly outputByteLength: number
  readonly outputContentSha256: string
  readonly decodedRgbaSha256: string
  readonly exactModelArtifactCount: 5
  readonly exactModelRoles: readonly [
    'base_checkpoint',
    'controlnet_checkpoint',
    'lora_adapter',
    'generic_ipadapter_checkpoint',
    'clip_vision_checkpoint',
  ]
  readonly exactModelArtifactByteLength: 11_700_367_157
  readonly processEntrypointKind:
    'fixed_supervised_python_process'
  readonly fixedSupervisedProcessRequired: true
  readonly atomicFiveModelReadOnlyMountLifetimeRequired: true
  readonly allFiveModelRolesVerifiedBeforeAndAfterInferenceRequired:
    true
  readonly deniedTopLevelImports: readonly ['sam2']
  readonly externalNetworkAllowed: false
  readonly runtimeDownloadsAllowed: false
  readonly oneRequestOneProcessOneImageOneAttempt: true
  readonly outputBytesIncluded: false
  readonly promptModelPathUrlCredentialCommandOrEnvironmentIncluded:
    false
  readonly canonicalWorkerCompletionAuthority: false
  readonly artifactCommitAuthority: false
  readonly qaPassAuthority: false
  readonly customerCostAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionReady: false
  readonly envelopeDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationPrivateOutputAuthority {
  readonly privateCharacterOutputObservationAuthority: true
  readonly canonicalRuntimeCompilerAuthority: false
  readonly canonicalWorkerCompletionAuthority: false
  readonly operationRegistryAuthority: false
  readonly dispatchAuthority: false
  readonly gpuAttemptAuthority: false
  readonly actualCostAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly timingAuthority: false
  readonly workGraphMutationAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly segmentationOrMattingAuthority: false
  readonly alphaQaAuthority: false
  readonly continuityQaAuthority: false
  readonly documentaryFactAuthority: false
  readonly characterRouteAuthority: false
  readonly privateReviewAuthority: false
  readonly renderAuthority: false
  readonly finalCanvasAuthority: false
  readonly billingAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameCharacterControlledPreparationPrivateOutputDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_CLASS
  readonly observationState:
    typeof
      LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_OUTPUT_STATE
  readonly observationId: string
  readonly canonicalScope: {
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly sceneId: string
    readonly componentId: string
  }
  readonly exactOutputLineage: {
    readonly preparationUnitId: string
    readonly preparationUnitDigestSha256: string
    readonly purpose:
      LivingFrameCharacterControlledPreparationPurpose
    readonly promptUnitId: string
    readonly promptUnitDigestSha256: string
    readonly graphTopologyDigestSha256: string
    readonly approvedWorkItemId: string
    readonly approvedWorkItemKey: string
    readonly approvedPlannedAssetManifestEntryId: string
    readonly outputKey: string
  }
  readonly sourceBindings: {
    readonly preparationDigestSha256: string
    readonly privatePromptMaterializationDigestSha256: string
    readonly canonicalComfyUiReconciliationDigestSha256: string
    readonly canonicalV2RequestCandidateDigestSha256: string
    readonly canonicalV2ResultCandidateDigestSha256: string
    readonly canonicalWorkerCompletionReceiptDigestSha256: string
    readonly approvedSnapshotId: string
    readonly approvedSnapshotHashSha256: string
    readonly approvedWorkGraphDigestSha256: string
    readonly currentMasterTimingDigestSha256: string
    readonly confirmedOutputFrameExpectationDigestSha256: string
    readonly runtimeIdentityDigestSha256: string
    readonly runtimeConfinementRequirementDigestSha256: string
    readonly modelMountRereadDigestSha256: string
    readonly resourceCostEvidenceDigestSha256: string
    readonly envelopeDigestSha256: string
    readonly readerBindingDigestSha256: string
  }
  readonly canonicalV2Boundary: {
    readonly requestCandidateVersion:
      'canonical-comfyui-gpu-runtime-request-candidate-v2'
    readonly resultCandidateVersion:
      'canonical-comfyui-gpu-runtime-result-candidate-v2'
    readonly sameCanonicalToolAndOperation: true
    readonly exactMaskEncodingProfile:
      'gray8_mask_png_v1'
    readonly exactMaskLoader: 'LoadImageMask'
    readonly exactMaskChannel: 'red'
    readonly exactMaskOutputIndex: 0
    readonly maskPolarity:
      'white_one_means_inpaint'
    readonly plainLoadImageMaskOutputAllowed: false
    readonly exactInpaintEncoder: 'VAEEncodeForInpaint'
    readonly exactGrowMaskBy: 6
    readonly exactSamplerDenoise: 0.55
    readonly emptyLatentSubstitutionAllowed: false
    readonly arbitraryNodeOrSlotExpansionAllowed: false
  }
  readonly verifiedOutput: {
    readonly outputCandidateId: string
    readonly contentType: 'image/png'
    readonly byteLength: number
    readonly contentSha256: string
    readonly decodedRgbaSha256: string
    readonly widthPixels: number
    readonly heightPixels: number
    readonly decodedChannelCount: 4
    readonly sourcePngHadAlphaChannel: false
    readonly transparentPixelCount: 0
    readonly semiTransparentPixelCount: 0
    readonly opaquePixelCount: number
    readonly alphaMeasurementReportDigestSha256: string
    readonly alphaFindingCodes:
      readonly LivingFrameAlphaFindingCode[]
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly sourceDisposition:
      LivingFrameCharacterControlledPreparationPrivateOutputDisposition
  }
  readonly downstreamRequirements: {
    readonly outputRemainsIntermediate: true
    readonly existingSelectedScenePrivateOutputObservationV2AdapterRequired:
      true
    readonly createOnlyPersistenceAndExactRereadRequired: true
    readonly canonicalAssetManifestReconciliationRequired: true
    readonly routeRecompileAfterQaRequired: true
    readonly independentPerFrameGenerationAllowed: false
    readonly remotionOwnsFinalCanvas: true
  }
  readonly runtimePolicy: {
    readonly canonicalToolId: 'comfyui'
    readonly canonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly exactModelArtifactCount: 5
    readonly exactModelRoles: readonly [
      'base_checkpoint',
      'controlnet_checkpoint',
      'lora_adapter',
      'generic_ipadapter_checkpoint',
      'clip_vision_checkpoint',
    ]
    readonly exactModelArtifactByteLength: 11_700_367_157
    readonly processEntrypointKind:
      'fixed_supervised_python_process'
    readonly fixedSupervisedProcessRequired: true
    readonly atomicFiveModelReadOnlyMountLifetimeRequired:
      true
    readonly allFiveModelRolesVerifiedBeforeAndAfterInferenceRequired:
      true
    readonly deniedTopLevelImports: readonly ['sam2']
    readonly externalNetworkAllowed: false
    readonly runtimeDownloadsAllowed: false
    readonly oneRequestOneProcessOneImageOneAttempt: true
    readonly oneGpuAttemptAndCostEventForAllInProcessCapabilities:
      true
    readonly finalCanvasCreatedByComfyUi: false
  }
  readonly evidenceClass:
    LivingFrameCharacterControlledPreparationPrivateOutputEvidenceClass
  readonly openGateCodes:
    readonly LivingFrameCharacterControlledPreparationPrivateOutputOpenGate[]
  readonly authorityBoundary:
    LivingFrameCharacterControlledPreparationPrivateOutputAuthority
  readonly exactPrivateOutputBytesRereadAndDecoded: true
  readonly alphaMeasurementRecomputedFromDecodedBytes: true
  readonly canonicalWorkerCompletionInferred: false
  readonly gpuAttemptCreated: false
  readonly actualAttemptCostEvidenceVerified: false
  readonly artifactPersisted: false
  readonly assetManifestMutated: false
  readonly qaApproved: false
  readonly characterRouteRecompiled: false
  readonly privateReviewApproved: false
  readonly renderAuthorized: false
  readonly containsOutputBytesPathUrlPromptModelCredentialCommandOrEnvironment:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly publicDeliveryReady: false
  readonly productionReady: false
}

export interface LivingFrameCharacterControlledPreparationPrivateOutput
  extends LivingFrameCharacterControlledPreparationPrivateOutputDraft {
  readonly observationDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationPrivateOutputLease {
  readonly leaseClass:
    'process_bound_single_use_verified_character_preparation_output_lease'
  readonly leaseId: string
  readonly observationId: string
  readonly preparationUnitId: string
  readonly outputCandidateId: string
  readonly outputContentSha256: string
  readonly leaseBindingDigestSha256: string
}

export interface LivingFrameCharacterControlledPreparationPrivateOutputIssue {
  readonly code:
    LivingFrameCharacterControlledPreparationPrivateOutputIssueCode
  readonly path: string
}
