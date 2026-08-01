import type {
  LivingFrameControlledSdxlArtifactCandidate,
  LivingFrameControlledSdxlArtifactCode,
} from './living-frame-controlled-sdxl-artifact-candidate-set'

export const
LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_VERSION =
  'living-frame-controlled-sdxl-canonical-artifact-binding-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_CLASS =
  'controlled_non_promotable_exact_sdxl_candidate_to_canonical_repository_binding' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_STATE =
  'five_exact_candidate_artifacts_repository_verified_bundle_compatibility_unproven' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_OPEN_GATES = [
  'lora_base_version_mismatch_disposition_required',
  'exact_comfyui_bundle_load_benchmark_required',
  'exact_comfyui_bundle_behavior_benchmark_required',
  'exact_comfyui_dependency_and_node_schema_lock_required',
  'license_and_paid_use_review_required',
  'canonical_registered_gpu_tool_operation_required',
  'selected_scene_and_approved_snapshot_binding_required',
  'canonical_cloud_run_gpu_attempt_required',
  'private_gcs_distribution_and_read_only_mount_required',
  'canonical_dispatch_work_cost_asset_and_qa_binding_required',
  'private_review_required',
] as const

export type LivingFrameControlledSdxlCanonicalArtifactBindingOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_ISSUES = [
  'input_invalid',
  'completed_byte_observation_invalid',
  'canonical_artifact_binding_invalid',
  'parent_lineage_mismatch',
  'artifact_count_mismatch',
  'artifact_order_mismatch',
  'artifact_role_mismatch',
  'artifact_binding_kind_mismatch',
  'artifact_id_mismatch',
  'repository_revision_mismatch',
  'artifact_format_mismatch',
  'model_family_mismatch',
  'artifact_byte_length_mismatch',
  'artifact_content_digest_mismatch',
  'repository_admission_mismatch',
  'license_review_state_mismatch',
  'gpu_requirement_mismatch',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlCanonicalArtifactBindingIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_ISSUES)[number]

export interface LivingFrameControlledSdxlCanonicalArtifactBindingAuthority {
  readonly completedByteObservationChainConsumed: true
  readonly canonicalRepositoryVerificationConsumed: true
  readonly serverOwnedLocatorBindingConsumed: true
  readonly exactCandidateIdentityComparisonAuthority: true
  readonly artifactRepositoryMutationAuthority: false
  readonly artifactIngestAuthority: false
  readonly artifactMountAuthority: false
  readonly artifactCompatibilityAuthority: false
  readonly legalReviewAuthority: false
  readonly commercialUseAuthority: false
  readonly modelWeightAuthority: false
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

export interface LivingFrameControlledSdxlCanonicalArtifactBindingEntry {
  readonly canonicalOrder: number
  readonly sourceCandidateOrder: number
  readonly role:
    LivingFrameControlledSdxlArtifactCandidate['role']
  readonly bindingKind:
    LivingFrameControlledSdxlArtifactCandidate['bindingKind']
  readonly artifactCode: LivingFrameControlledSdxlArtifactCode
  readonly repositoryRevisionSha1: string
  readonly artifactRecordId: string
  readonly manifestDigestSha256: string
  readonly descriptorDigestSha256: string
  readonly objectIdentityDigestSha256: string
  readonly canonicalArtifactId: string
  readonly canonicalRevision: string
  readonly artifactFormat: 'safetensors'
  readonly modelFamily: string
  readonly byteLength: number
  readonly contentSha256: string
  readonly repositoryAdmission: 'controlled_internal_test'
  readonly commercialUseStatus: 'needs_review'
  readonly reviewStatus: 'evaluation_only'
  readonly paidProductionUseApproved: false
  readonly canonicalGpuBundleSlotId: string
  readonly canonicalGpuBundleRequirementDigestSha256: string
  readonly fullCandidateIdentityMatched: true
  readonly fullRepositoryChecksumVerified: true
  readonly gpuExecutionPolicyVerified: true
  readonly compatibilityBenchmarkPassed: false
}

export interface LivingFrameControlledSdxlCanonicalArtifactBindingDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_CLASS
  readonly bindingId: string
  readonly bindingState:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_CANONICAL_ARTIFACT_BINDING_STATE
  readonly sourceBindings: {
    readonly candidateSetId: string
    readonly candidateSetDigestSha256: string
    readonly completedBaseObservationId: string
    readonly completedBaseObservationDigestSha256: string
    readonly requirementSetId: string
    readonly requirementsDigestSha256: string
    readonly canonicalArtifactBindingId: string
    readonly canonicalArtifactBindingDigestSha256: string
  }
  readonly entries:
    readonly LivingFrameControlledSdxlCanonicalArtifactBindingEntry[]
  readonly metrics: {
    readonly candidateArtifactCount: 5
    readonly canonicalRepositoryVerifiedArtifactCount: 5
    readonly exactCandidateIdentityMatchCount: 5
    readonly totalByteLength: 11_700_367_157
    readonly compatibilityBenchmarkPassedCount: 0
    readonly paidProductionUseApprovedCount: 0
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlCanonicalArtifactBindingOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlCanonicalArtifactBindingAuthority
  readonly completedByteObservationChainRevalidated: true
  readonly canonicalArtifactBindingRevalidated: true
  readonly exactCandidateOrderAndIdentityVerified: true
  readonly everyCanonicalRepositoryObjectFullyChecksumVerified: true
  readonly canonicalGpuRequirementIdentityProjectionVerified: true
  readonly completeFiveArtifactCandidateSetRepositoryBound: true
  readonly canonicalOperationArtifactSetVerified: false
  readonly exactBundleCompatibilityProven: false
  readonly loraBaseVersionMismatchUnresolved: true
  readonly artifactsMounted: false
  readonly modelLoadedOrExecuted: false
  readonly generationPerformed: false
  readonly containsPathUrlCredentialFilenameRawBytesOrMountAlias: false
  readonly containsCallerSelectedToolOperationProviderOrRoute: false
  readonly createsWorkDispatchQueueCostAssetOrQaState: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlCanonicalArtifactBinding
  extends LivingFrameControlledSdxlCanonicalArtifactBindingDraft {
  readonly bindingDigestSha256: string
}

export interface LivingFrameControlledSdxlCanonicalArtifactBindingIssue {
  readonly code:
    LivingFrameControlledSdxlCanonicalArtifactBindingIssueCode
  readonly path: string
}
