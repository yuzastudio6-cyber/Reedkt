export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_VERSION =
  'living-frame-controlled-sdxl-lora-byte-observation-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_CLASS =
  'controlled_non_promotable_exact_sdxl_lora_full_byte_and_schema_observation'

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_STATE =
  'one_candidate_full_bytes_verified_schema_inspected_bundle_unqualified'

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_ARTIFACT_CODE =
  'sdxl_offset_example_lora_1_0_safetensors' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_CODE =
  'hf_stabilityai_stable_diffusion_xl_base_1_0' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_REVISION =
  '462165984030d82259a11f4367a4eed129e94a7b' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH =
  49_553_604 as const

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256 =
  '4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f'

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_LENGTH =
  364_180 as const

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_SHA256 =
  'e591a96aa0660fc0aecdf8e7b7d0a57f08a78b744f59882fcfc1774faeb87c5f'

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_TENSOR_NAME_SET_SHA256 =
  '8be6284e61a6fd06de614924e1e04e33abf02af879289b9b69fa133c17981cce'

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_KEY_SET_SHA256 =
  'a6ffd7d959d5a9317a1cdfb98786b455bf5238efe6ce510ea05927be99fbe380'

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_SHA256 =
  '7b8091a9b4e3be0f62b7d2f817f69603a335195e8b97093c5e7f8b7742d5a05a'

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_OPEN_GATES = [
  'remaining_four_artifact_full_byte_verifications_required',
  'lora_metadata_base_version_compatibility_review_required',
  'canonical_model_artifact_repository_ingest_required',
  'exact_comfyui_bundle_compatibility_benchmark_required',
  'lora_behavior_and_quality_benchmark_required',
  'model_and_extension_license_review_required',
  'paid_production_use_review_required',
  'canonical_gpu_operation_artifact_set_required',
  'selected_scene_and_approved_snapshot_binding_required',
  'canonical_work_dispatch_cost_asset_and_qa_binding_required',
  'private_review_required',
] as const

export type LivingFrameControlledSdxlLoraOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_LORA_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_ISSUES = [
  'input_invalid',
  'candidate_set_invalid',
  'candidate_lineage_mismatch',
  'reader_invalid',
  'reader_failed',
  'byte_length_mismatch',
  'content_digest_mismatch',
  'safetensors_prefix_invalid',
  'safetensors_header_length_invalid',
  'safetensors_header_digest_mismatch',
  'safetensors_header_json_invalid',
  'safetensors_tensor_entry_invalid',
  'safetensors_tensor_count_mismatch',
  'safetensors_dtype_mismatch',
  'safetensors_tensor_shape_invalid',
  'safetensors_tensor_size_mismatch',
  'safetensors_offset_invalid',
  'safetensors_offset_gap_or_overlap',
  'safetensors_data_section_mismatch',
  'safetensors_tensor_name_digest_mismatch',
  'safetensors_metadata_invalid',
  'safetensors_metadata_key_digest_mismatch',
  'safetensors_metadata_digest_mismatch',
  'safetensors_metadata_expectation_mismatch',
  'reader_reused',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlLoraByteObservationIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_ISSUES)[number]

export interface LivingFrameControlledSdxlLoraByteObservationAuthority {
  readonly processBoundServerOwnedBytesConsumed: true
  readonly fullContentDigestVerificationAuthority: true
  readonly safetensorsStructureObservationAuthority: true
  readonly currentUpstreamSourceAuthority: false
  readonly legalReviewAuthority: false
  readonly commercialUseAuthority: false
  readonly artifactRepositoryAuthority: false
  readonly artifactLocatorAuthority: false
  readonly artifactManifestAuthority: false
  readonly modelWeightAuthority: false
  readonly modelCompatibilityAuthority: false
  readonly packageAuthority: false
  readonly containerAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly semanticRouteAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly assetManifestAuthority: false
  readonly artifactCreationAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledSdxlLoraByteObservationDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_CLASS
  readonly observationId: string
  readonly observationState:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_OBSERVATION_STATE
  readonly sourceBindings: {
    readonly candidateSetId: string
    readonly candidateSetDigestSha256: string
    readonly requirementBindingDigestSha256: string
    readonly artifactCode:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_ARTIFACT_CODE
    readonly repositoryCode:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_CODE
    readonly repositoryRevisionSha1:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_REPOSITORY_REVISION
  }
  readonly byteVerification: {
    readonly expectedByteLength:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH
    readonly observedByteLength:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_BYTE_LENGTH
    readonly expectedContentSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256
    readonly observedContentSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_CONTENT_SHA256
    readonly fullByteStreamConsumed: true
    readonly fullContentDigestIndependentlyVerified: true
  }
  readonly safetensorsStructure: {
    readonly headerLength:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_LENGTH
    readonly headerDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_HEADER_SHA256
    readonly tensorNameSetDigestSha256:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_LORA_TENSOR_NAME_SET_SHA256
    readonly tensorCount: 2_364
    readonly dtypeCounts: readonly [{
      readonly dtype: 'F16'
      readonly count: 2_364
    }]
    readonly maximumRank: 4
    readonly dataSectionByteLength: 49_189_416
    readonly totalTensorByteLength: 49_189_416
    readonly finalDataOffset: 49_189_416
    readonly offsetsContiguousFromZero: true
    readonly everyTensorSpanMatchesShapeAndDtype: true
    readonly tensorPayloadExactlyAccountsForDataSection: true
    readonly metadataKeyCount: 67
    readonly metadataKeySetDigestSha256:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_KEY_SET_SHA256
    readonly metadataDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_LORA_METADATA_SHA256
    readonly declaredArchitecture:
      'stable-diffusion-xl-v1-base/lora'
    readonly declaredBaseModelVersion: 'sdxl_base_v0-9'
    readonly declaredResolution: '1024x1024'
    readonly declaredPredictionType: 'epsilon'
    readonly declaredNetworkModule: 'networks.lora'
    readonly declaredLicenseText:
      'CreativeML Open RAIL++-M License'
    readonly metadataNamesEarlierSdxlBaseVersion: true
  }
  readonly bundleProgress: {
    readonly candidateArtifactCount: 5
    readonly independentlyVerifiedArtifactByteCount: 1
    readonly safetensorsSchemaInspectedArtifactCount: 1
    readonly remainingUnverifiedArtifactCodes: readonly [
      'sdxl_base_1_0_monolithic_safetensors',
      'controlnet_canny_sdxl_1_0_small_fp16_safetensors',
      'generic_ipadapter_sdxl_big_g_safetensors',
      'openclip_vit_big_g_14_sdxl_image_encoder_safetensors',
    ]
    readonly completeBundleBytesVerified: false
    readonly exactBundleCompatibilityProven: false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlLoraOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlLoraByteObservationAuthority
  readonly candidateSetRevalidated: true
  readonly processBoundReaderConsumedExactlyOnce: true
  readonly artifactPathUrlFilenameOrRawBytesPersisted: false
  readonly canonicalRepositoryObjectPresent: false
  readonly modelLoadedOrExecuted: false
  readonly generationPerformed: false
  readonly containsProviderToolOperationWorkQueueCostOrCommercialRoute:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlLoraByteObservation
  extends LivingFrameControlledSdxlLoraByteObservationDraft {
  readonly observationDigestSha256: string
}

export interface LivingFrameControlledSdxlLoraByteObservationIssue {
  readonly code:
    LivingFrameControlledSdxlLoraByteObservationIssueCode
  readonly path: string
}
