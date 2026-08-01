export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_VERSION =
  'living-frame-controlled-sdxl-ipadapter-byte-observation-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_CLASS =
  'controlled_non_promotable_exact_generic_sdxl_ipadapter_full_byte_and_schema_observation'

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_STATE =
  'third_candidate_full_bytes_verified_schema_inspected_bundle_unqualified'

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_ARTIFACT_CODE =
  'generic_ipadapter_sdxl_big_g_safetensors' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_CODE =
  'hf_h94_ip_adapter' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_REVISION =
  '018e402774aeeddd60609b4ecdb7e298259dc729' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH =
  702_585_376 as const

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256 =
  'ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6'

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_LENGTH =
  14_872 as const

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_SHA256 =
  'a0659feae76d4b40e640b971cc7a882b4c5de98c0e8467ce0e9524935514d313'

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_TENSOR_NAME_SET_SHA256 =
  'b0723b7407a40df182cb806e33ccbfc353e669be92652fdeb1580ff85df01211'

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_KEY_SET_SHA256 =
  '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945'

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_SHA256 =
  '74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b'

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_NAMESPACE_SHA256 =
  'b0f197110861b450c7404d0cbe63e69ec9cc52161afd9408f79805c13e245e6e'

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_SELECTED_SHAPE_SHA256 =
  '6e8842eda5420f500ab480b519d76555f36cc25caa85a79ec09ef9231553f715'

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_OPEN_GATES = [
  'remaining_two_artifact_full_byte_verifications_required',
  'lora_metadata_base_version_compatibility_review_required',
  'controlnet_config_and_behavior_benchmark_required',
  'ipadapter_embedded_metadata_family_claim_absent',
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

export type LivingFrameControlledSdxlIpAdapterOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_ISSUES = [
  'input_invalid',
  'candidate_set_invalid',
  'candidate_lineage_mismatch',
  'controlnet_observation_invalid',
  'controlnet_lineage_mismatch',
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

export type LivingFrameControlledSdxlIpAdapterByteObservationIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_ISSUES)[number]

export interface LivingFrameControlledSdxlIpAdapterByteObservationAuthority {
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

export interface LivingFrameControlledSdxlIpAdapterByteObservationDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_CLASS
  readonly observationId: string
  readonly observationState:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_OBSERVATION_STATE
  readonly sourceBindings: {
    readonly candidateSetId: string
    readonly candidateSetDigestSha256: string
    readonly priorControlNetObservationId: string
    readonly priorControlNetObservationDigestSha256: string
    readonly requirementBindingDigestSha256: string
    readonly artifactCode:
      typeof LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_ARTIFACT_CODE
    readonly repositoryCode:
      typeof LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_CODE
    readonly repositoryRevisionSha1:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_REPOSITORY_REVISION
  }
  readonly byteVerification: {
    readonly expectedByteLength:
      typeof LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH
    readonly observedByteLength:
      typeof LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_BYTE_LENGTH
    readonly expectedContentSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256
    readonly observedContentSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_CONTENT_SHA256
    readonly fullByteStreamConsumed: true
    readonly fullContentDigestIndependentlyVerified: true
  }
  readonly safetensorsStructure: {
    readonly headerLength:
      typeof LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_LENGTH
    readonly headerDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_HEADER_SHA256
    readonly tensorNameSetDigestSha256:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_TENSOR_NAME_SET_SHA256
    readonly tensorCount: 144
    readonly dtypeCounts: readonly [{
      readonly dtype: 'F16'
      readonly count: 144
    }]
    readonly rankCounts: readonly [
      { readonly rank: 1; readonly count: 3 },
      { readonly rank: 2; readonly count: 141 },
    ]
    readonly maximumRank: 2
    readonly dataSectionByteLength: 702_570_496
    readonly totalTensorByteLength: 702_570_496
    readonly finalDataOffset: 702_570_496
    readonly offsetsContiguousFromZero: true
    readonly everyTensorSpanMatchesShapeAndDtype: true
    readonly tensorPayloadExactlyAccountsForDataSection: true
    readonly metadataPresent: false
    readonly metadataKeyCount: 0
    readonly metadataKeySetDigestSha256:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_KEY_SET_SHA256
    readonly metadataDigestSha256:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_METADATA_SHA256
  }
  readonly compatibilityClues: {
    readonly namespaceCountDigestSha256:
      typeof LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_NAMESPACE_SHA256
    readonly namespaceCounts: readonly [
      { readonly namespace: 'image_proj'; readonly count: 4 },
      { readonly namespace: 'ip_adapter'; readonly count: 140 },
    ]
    readonly selectedTensorShapeDigestSha256:
      typeof
        LIVING_FRAME_CONTROLLED_SDXL_IPADAPTER_SELECTED_SHAPE_SHA256
    readonly imageProjectionInputWidth: 1_280
    readonly imageProjectionOutputWidth: 8_192
    readonly adapterContextWidth: 2_048
    readonly adapterAttentionIndexCount: 70
    readonly pairedKeyAndValueProjectionCount: 70
    readonly genericIpAdapterNamespaceStructureObserved: true
    readonly faceIdOrInsightFaceNamespaceObserved: false
    readonly embeddedMetadataNamesExactModelFamily: false
    readonly exactPinnedModelCardAndClipEncoderBindingRequired: true
    readonly exactComfyUiLoadAndGenericReferenceBehaviorBenchmarkRequired:
      true
  }
  readonly bundleProgress: {
    readonly candidateArtifactCount: 5
    readonly independentlyVerifiedArtifactByteCount: 3
    readonly safetensorsSchemaInspectedArtifactCount: 3
    readonly remainingUnverifiedArtifactCodes: readonly [
      'sdxl_base_1_0_monolithic_safetensors',
      'openclip_vit_big_g_14_sdxl_image_encoder_safetensors',
    ]
    readonly completeBundleBytesVerified: false
    readonly exactBundleCompatibilityProven: false
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlIpAdapterOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlIpAdapterByteObservationAuthority
  readonly candidateSetRevalidated: true
  readonly priorControlNetObservationRevalidated: true
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

export interface LivingFrameControlledSdxlIpAdapterByteObservation
  extends LivingFrameControlledSdxlIpAdapterByteObservationDraft {
  readonly observationDigestSha256: string
}

export interface LivingFrameControlledSdxlIpAdapterByteObservationIssue {
  readonly code:
    LivingFrameControlledSdxlIpAdapterByteObservationIssueCode
  readonly path: string
}
