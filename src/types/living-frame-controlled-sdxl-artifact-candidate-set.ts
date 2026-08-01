import type {
  LivingFrameComfyUiModelArtifactRequirement,
} from './living-frame-comfyui-model-artifact-requirements'

export const
LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_VERSION =
  'living-frame-controlled-sdxl-artifact-candidate-set-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_CLASS =
  'controlled_non_promotable_exact_sdxl_artifact_metadata_binding' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_STATE =
  'exact_upstream_lfs_metadata_observed_artifact_bytes_unverified' as const

type ValueOf<T extends readonly string[]> = T[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_REPOSITORY_CODES = [
  'hf_stabilityai_stable_diffusion_xl_base_1_0',
  'hf_diffusers_controlnet_canny_sdxl_1_0_small',
  'hf_h94_ip_adapter',
] as const
export type LivingFrameControlledSdxlArtifactRepositoryCode =
  ValueOf<
    typeof LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_REPOSITORY_CODES
  >

export const
LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CODES = [
  'sdxl_base_1_0_monolithic_safetensors',
  'controlnet_canny_sdxl_1_0_small_fp16_safetensors',
  'sdxl_offset_example_lora_1_0_safetensors',
  'generic_ipadapter_sdxl_big_g_safetensors',
  'openclip_vit_big_g_14_sdxl_image_encoder_safetensors',
] as const
export type LivingFrameControlledSdxlArtifactCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CODES>

export const
LIVING_FRAME_CONTROLLED_SDXL_DOCUMENT_CODES = [
  'sdxl_base_model_card',
  'sdxl_base_license',
  'controlnet_canny_sdxl_small_model_card',
  'generic_ipadapter_model_card',
] as const
export type LivingFrameControlledSdxlDocumentCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_SDXL_DOCUMENT_CODES>

export const
LIVING_FRAME_CONTROLLED_SDXL_DECLARED_LICENSE_LABELS = [
  'openrail_plus_plus',
  'apache_2_0',
] as const
export type LivingFrameControlledSdxlDeclaredLicenseLabel =
  ValueOf<
    typeof LIVING_FRAME_CONTROLLED_SDXL_DECLARED_LICENSE_LABELS
  >

export const
LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_OBSERVATION_CODES = [
  'base_repository_declares_sdxl_base_1_0',
  'controlnet_model_card_names_sdxl_base_1_0',
  'lora_is_co_located_with_sdxl_base_only',
  'ipadapter_model_card_maps_sdxl_default_to_big_g',
  'ipadapter_model_card_maps_sdxl_image_encoder_to_big_g',
] as const
export type LivingFrameControlledSdxlCompatibilityObservationCode =
  ValueOf<
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_OBSERVATION_CODES
  >

export const
LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_OPEN_GATES = [
  'independent_full_artifact_byte_verification_required',
  'canonical_model_artifact_repository_ingest_required',
  'exact_safetensors_schema_inspection_required',
  'exact_comfyui_bundle_compatibility_benchmark_required',
  'lora_behavior_and_quality_benchmark_required',
  'controlnet_quality_and_fallback_benchmark_required',
  'model_and_extension_license_review_required',
  'paid_production_use_review_required',
  'canonical_gpu_operation_artifact_set_required',
  'selected_scene_and_approved_snapshot_binding_required',
  'canonical_work_dispatch_cost_asset_and_qa_binding_required',
  'private_review_required',
] as const
export type LivingFrameControlledSdxlArtifactCandidateOpenGate =
  ValueOf<
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_OPEN_GATES
  >

export const
LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_ISSUES = [
  'input_invalid',
  'requirements_invalid',
  'requirement_set_incompatible',
  'reader_invalid',
  'reader_failed',
  'observation_invalid',
  'observation_date_invalid',
  'repository_revision_mismatch',
  'artifact_set_mismatch',
  'artifact_order_mismatch',
  'artifact_metadata_mismatch',
  'artifact_role_mismatch',
  'artifact_family_mismatch',
  'artifact_duplicate',
  'document_set_mismatch',
  'document_metadata_mismatch',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const
export type LivingFrameControlledSdxlArtifactCandidateIssueCode =
  ValueOf<
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_ISSUES
  >

export interface LivingFrameControlledSdxlDocumentObservation {
  readonly order: number
  readonly documentCode: LivingFrameControlledSdxlDocumentCode
  readonly repositoryCode:
    LivingFrameControlledSdxlArtifactRepositoryCode
  readonly repositoryRevisionSha1: string
  readonly observedContentDigestSha256: string
  readonly declaredLicenseLabel:
    LivingFrameControlledSdxlDeclaredLicenseLabel
  readonly observedOnDate: string
  readonly controlledDocumentObservationOnly: true
  readonly independentSourceReReadRequired: true
  readonly currentTruthAuthority: false
  readonly legalInterpretationProvided: false
  readonly commercialApprovalProvided: false
}

export interface LivingFrameControlledSdxlArtifactCandidate {
  readonly order: number
  readonly role:
    LivingFrameComfyUiModelArtifactRequirement['role']
  readonly bindingKind:
    LivingFrameComfyUiModelArtifactRequirement['bindingKind']
  readonly bindingDigestSha256: string
  readonly artifactCode: LivingFrameControlledSdxlArtifactCode
  readonly repositoryCode:
    LivingFrameControlledSdxlArtifactRepositoryCode
  readonly repositoryRevisionSha1: string
  readonly artifactFormat: 'safetensors'
  readonly expectedModelFamily: string
  readonly reportedByteLength: number
  readonly reportedContentSha256: string
  readonly declaredLicenseLabel:
    LivingFrameControlledSdxlDeclaredLicenseLabel
  readonly compatibilityObservationCode:
    LivingFrameControlledSdxlCompatibilityObservationCode
  readonly upstreamBlobMetadataObserved: true
  readonly controlledMetadataObservationOnly: true
  readonly independentSourceReReadRequired: true
  readonly artifactBytesFetchedByReeditPro: false
  readonly fullContentDigestIndependentlyVerified: false
  readonly safetensorsSchemaInspected: false
  readonly canonicalRepositoryObjectPresent: false
  readonly compatibilityBenchmarkPassed: false
  readonly paidProductionUseApproved: false
}

export interface LivingFrameControlledSdxlArtifactCandidateAuthority {
  readonly controlledUpstreamMetadataObservationConsumed: true
  readonly currentSourceAuthority: false
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

export interface LivingFrameControlledSdxlArtifactCandidateSetDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_CLASS
  readonly candidateSetId: string
  readonly candidateState:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_ARTIFACT_CANDIDATE_SET_STATE
  readonly observedOnDate: string
  readonly sourceBindings: {
    readonly requirementSetId: string
    readonly requirementsDigestSha256: string
    readonly controlledModelFamilyBindingId: string
    readonly controlledModelFamilyBindingDigestSha256: string
  }
  readonly artifacts:
    readonly LivingFrameControlledSdxlArtifactCandidate[]
  readonly documents:
    readonly LivingFrameControlledSdxlDocumentObservation[]
  readonly metrics: {
    readonly artifactCount: 5
    readonly documentCount: 4
    readonly totalReportedByteLength: number
    readonly upstreamBlobMetadataObservationCount: 5
    readonly independentlyVerifiedArtifactByteCount: 0
    readonly compatibilityBenchmarkPassedCount: 0
    readonly paidProductionUseApprovedCount: 0
  }
  readonly coherenceChecks: {
    readonly requirementRolesExactlyCovered: true
    readonly requirementBindingDigestsExactlyBound: true
    readonly allDiffusionArtifactsDeclareSdxlFamily: true
    readonly genericIpAdapterAndClipVisionPairDeclareBigG: true
    readonly faceIdInsightFaceAndAuraFaceGenerationRoutesAbsent: true
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlArtifactCandidateOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlArtifactCandidateAuthority
  readonly sourceRequirementsRevalidated: true
  readonly processBoundReaderConsumed: true
  readonly upstreamMetadataExactlyMatched: true
  readonly artifactBytesOrLocatorsPresent: false
  readonly exactArtifactCompatibilityProven: false
  readonly canonicalArtifactBundlePresent: false
  readonly containsUrlPathFilenameCredentialOrRawBytes: false
  readonly containsProviderToolOperationWorkQueueCostOrCommercialRoute:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlArtifactCandidateSet
  extends LivingFrameControlledSdxlArtifactCandidateSetDraft {
  readonly candidateSetDigestSha256: string
}

export interface LivingFrameControlledSdxlArtifactCandidateIssue {
  readonly code:
    LivingFrameControlledSdxlArtifactCandidateIssueCode
  readonly path: string
}
