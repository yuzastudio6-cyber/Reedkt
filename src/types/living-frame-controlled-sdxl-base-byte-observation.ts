export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_VERSION =
  'living-frame-controlled-sdxl-base-byte-observation-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_CLASS =
  'controlled_non_promotable_exact_sdxl_base_full_byte_and_schema_observation'

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_STATE =
  'all_five_candidate_full_bytes_verified_schema_inspected_bundle_unqualified'

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_ARTIFACT_CODE =
  'sdxl_base_1_0_monolithic_safetensors' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_CODE =
  'hf_stabilityai_stable_diffusion_xl_base_1_0' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_REVISION =
  '462165984030d82259a11f4367a4eed129e94a7b' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH =
  6_938_078_334 as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256 =
  '31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b'

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_LENGTH =
  402_436 as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_SHA256 =
  '8b977bc23d8fde7ab1c3a5256d5a03e8a549ab3aa1a4030bd97714b33fad51d5'

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_TENSOR_NAME_SET_SHA256 =
  '96235265e176ec32fa4d9f86da46b83125c917460c49e4512b33021567034d44'

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_KEY_SET_SHA256 =
  '3185888da171a1ca9a52da85f41066acddc2c9a33bfc6f537382d9528e2aed20'

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_SHA256 =
  '07da095030f05768bf0652ad37f7cd68b44c754a93a60e8417a4e4c63614fb5f'

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_NAMESPACE_SHA256 =
  'b436868859489329cc2b95591f389f8e4276814b75db6ecf229d63fa58d0e3cc'

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_SELECTED_SHAPE_SHA256 =
  'd7633605763ec41559f807cc6d3017755124ac2058083765a3aa76897a551b47'

export const LIVING_FRAME_CONTROLLED_SDXL_BASE_OPEN_GATES = [
  'lora_metadata_base_version_compatibility_review_required',
  'controlnet_config_and_behavior_benchmark_required',
  'exact_ipadapter_model_card_and_clip_encoder_binding_required',
  'generic_ipadapter_comfyui_load_and_behavior_benchmark_required',
  'canonical_model_artifact_repository_ingest_required',
  'exact_comfyui_bundle_compatibility_benchmark_required',
  'model_and_extension_license_review_required',
  'paid_production_use_review_required',
  'canonical_gpu_operation_artifact_set_required',
  'selected_scene_and_approved_snapshot_binding_required',
  'canonical_work_dispatch_cost_asset_and_qa_binding_required',
  'private_review_required',
] as const

export type LivingFrameControlledSdxlBaseOpenGate =
  (typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_ISSUES = [
  'input_invalid',
  'candidate_set_invalid',
  'candidate_lineage_mismatch',
  'clip_vision_observation_invalid',
  'clip_vision_lineage_mismatch',
  'reader_invalid',
  'reader_failed',
  'reader_reused',
  'safetensors_inspection_failed',
  'tensor_structure_mismatch',
  'selected_shape_mismatch',
  'namespace_mismatch',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlBaseByteObservationIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_ISSUES)[number]

export interface LivingFrameControlledSdxlBaseByteObservationAuthority {
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

export interface LivingFrameControlledSdxlBaseByteObservationDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_CLASS
  readonly observationId: string
  readonly observationState:
    typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_OBSERVATION_STATE
  readonly sourceBindings: {
    readonly candidateSetId: string
    readonly candidateSetDigestSha256: string
    readonly priorClipVisionObservationId: string
    readonly priorClipVisionObservationDigestSha256: string
    readonly requirementBindingDigestSha256: string
    readonly artifactCode:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_ARTIFACT_CODE
    readonly repositoryCode:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_CODE
    readonly repositoryRevisionSha1:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_REPOSITORY_REVISION
  }
  readonly byteVerification: {
    readonly expectedByteLength:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH
    readonly observedByteLength:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_BYTE_LENGTH
    readonly expectedContentSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256
    readonly observedContentSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_CONTENT_SHA256
    readonly fullByteStreamConsumed: true
    readonly fullContentDigestIndependentlyVerified: true
  }
  readonly safetensorsStructure: {
    readonly headerLength:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_LENGTH
    readonly headerDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_HEADER_SHA256
    readonly tensorNameSetDigestSha256:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_BASE_TENSOR_NAME_SET_SHA256
    readonly tensorCount: 2_515
    readonly dtypeCounts: readonly [{
      readonly dtype: 'F16'
      readonly count: 2_515
    }]
    readonly rankCounts: readonly [
      { readonly rank: 0; readonly count: 1 },
      { readonly rank: 1; readonly count: 1_442 },
      { readonly rank: 2; readonly count: 949 },
      { readonly rank: 4; readonly count: 123 },
    ]
    readonly maximumRank: 4
    readonly dataSectionByteLength: 6_937_675_890
    readonly totalTensorByteLength: 6_937_675_890
    readonly finalDataOffset: 6_937_675_890
    readonly offsetsContiguousFromZero: true
    readonly everyTensorSpanMatchesShapeAndDtype: true
    readonly tensorPayloadExactlyAccountsForDataSection: true
    readonly metadataPresent: true
    readonly metadataKeyCount: 12
    readonly metadataKeySetDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_KEY_SET_SHA256
    readonly metadataDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_METADATA_SHA256
  }
  readonly embeddedModelSpecClues: {
    readonly saiModelSpec: '1.0.0'
    readonly architecture: 'stable-diffusion-xl-v1-base'
    readonly title: 'Stable Diffusion XL 1.0 Base'
    readonly resolution: '1024x1024'
    readonly predictionType: 'epsilon'
    readonly licenseLabel: 'CreativeML Open RAIL++-M License'
    readonly metadataExpectationCount: 6
    readonly independentFullContentDigestIsArtifactIdentity: true
  }
  readonly compatibilityClues: {
    readonly namespaceCountDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_NAMESPACE_SHA256
    readonly namespaceCounts: readonly [
      { readonly namespace: 'conditioner'; readonly count: 587 },
      { readonly namespace: 'first_stage_model'; readonly count: 248 },
      { readonly namespace: 'model'; readonly count: 1_680 },
    ]
    readonly selectedTensorShapeDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_BASE_SELECTED_SHAPE_SHA256
    readonly primaryTextEncoderWidth: 768
    readonly secondaryTextEncoderWidth: 1_280
    readonly crossAttentionContextWidth: 2_048
    readonly additionalConditioningInputWidth: 2_816
    readonly latentChannelCount: 4
    readonly imageChannelCount: 3
    readonly embeddedMetadataNamesExactBaseFamily: true
    readonly priorLoraMetadataNamesSdxlBaseVersion09: true
    readonly priorLoraMetadataMatchesBaseVersion10: false
    readonly completeBundleLoadAndBehaviorBenchmarkRequired: true
  }
  readonly bundleProgress: {
    readonly candidateArtifactCount: 5
    readonly independentlyVerifiedArtifactByteCount: 5
    readonly safetensorsSchemaInspectedArtifactCount: 5
    readonly remainingUnverifiedArtifactCodes: readonly []
    readonly completeBundleBytesVerified: true
    readonly completeBundleSafetensorsSchemasInspected: true
    readonly exactBundleCompatibilityProven: false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlBaseOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlBaseByteObservationAuthority
  readonly candidateSetRevalidated: true
  readonly priorClipVisionObservationRevalidated: true
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

export interface LivingFrameControlledSdxlBaseByteObservation
  extends LivingFrameControlledSdxlBaseByteObservationDraft {
  readonly observationDigestSha256: string
}

export interface LivingFrameControlledSdxlBaseByteObservationIssue {
  readonly code:
    LivingFrameControlledSdxlBaseByteObservationIssueCode
  readonly path: string
}
