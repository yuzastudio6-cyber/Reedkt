export const
LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_VERSION =
  'living-frame-controlled-sdxl-compatibility-benchmark-spec-v2' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_CLASS =
  'controlled_non_executable_subject_neutral_sdxl_compatibility_benchmark_spec' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_STATE =
  'current_graph_dependency_and_candidate_bound_gpu_compatibility_evidence_required' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS = [
  'exact_bundle_load',
  'base_only_baseline',
  'lora_effect_probe',
  'controlnet_effect_probe',
  'ipadapter_effect_probe',
  'full_combined_primary',
  'full_combined_replay',
] as const

export type LivingFrameControlledSdxlCompatibilityBenchmarkCaseId =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_COMPONENTS = [
  'base_checkpoint',
  'controlnet_checkpoint',
  'lora_adapter',
  'generic_ipadapter_checkpoint',
  'clip_vision_checkpoint',
] as const

export type LivingFrameControlledSdxlCompatibilityBenchmarkComponent =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_COMPONENTS)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_METRICS = [
  'exact_model_load_integrity',
  'network_off_confinement',
  'decoded_output_validity',
  'finite_pixel_population',
  'seed_replay_normalized_mae',
  'lora_effect_normalized_mae',
  'controlnet_edge_f1_delta',
  'ipadapter_reference_similarity_delta',
  'peak_gpu_memory_mib',
  'cold_bundle_load_duration_ms',
  'warm_generation_duration_ms',
] as const

export type LivingFrameControlledSdxlCompatibilityBenchmarkMetric =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_METRICS)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_OPEN_GATES = [
  'exact_canonical_artifact_binding_required',
  'exact_lora_base_version_disposition_required',
  'single_use_read_only_model_mount_required',
  'dependency_locked_scanned_signed_gpu_image_required',
  'current_gpu_node_schema_revalidation_required',
  'server_owned_fixture_artifacts_required',
  'canonical_gpu_benchmark_admission_required',
  'canonical_gpu_attempt_and_internal_cost_evidence_required',
  'exact_gpu_measurement_result_required',
  'license_and_paid_use_review_required',
  'selected_scene_and_approved_snapshot_binding_required',
  'canonical_work_asset_qa_and_private_review_required',
] as const

export type LivingFrameControlledSdxlCompatibilityBenchmarkOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_ISSUES = [
  'input_invalid',
  'candidate_set_invalid',
  'model_requirements_invalid',
  'model_family_binding_invalid',
  'dependency_lock_invalid',
  'parent_lineage_mismatch',
  'candidate_artifact_set_mismatch',
  'ipadapter_merged_graph_required',
  'case_policy_invalid',
  'threshold_policy_invalid',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlCompatibilityBenchmarkIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_ISSUES)[number]

export interface LivingFrameControlledSdxlCompatibilityBenchmarkAuthority {
  readonly controlledCandidateSetConsumed: true
  readonly currentModelRequirementProjectionConsumed: true
  readonly currentModelFamilyGraphBindingConsumed: true
  readonly currentDependencyLockEvidenceConsumed: true
  readonly deterministicBenchmarkSpecificationAuthority: true
  readonly canonicalArtifactBindingAuthority: false
  readonly artifactMountAuthority: false
  readonly modelCompatibilityAuthority: false
  readonly benchmarkAdmissionAuthority: false
  readonly benchmarkExecutionAuthority: false
  readonly benchmarkResultAuthority: false
  readonly legalReviewAuthority: false
  readonly commercialUseAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
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

export interface LivingFrameControlledSdxlCompatibilityBenchmarkCase {
  readonly order: number
  readonly caseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId
  readonly caseClass:
    | 'load_integrity'
    | 'baseline_generation'
    | 'isolated_capability_effect'
    | 'combined_generation'
    | 'deterministic_replay'
  readonly comparisonCaseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId | null
  readonly enabledComponents:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkComponent[]
  readonly disabledComponents:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkComponent[]
  readonly seedGroup:
    | 'load_probe'
    | 'isolated_effect_probe'
    | 'full_combined_replay'
  readonly seed: null | 19_791_104 | 420_042
  readonly outputWidthPixels: 1024
  readonly outputHeightPixels: 1024
  readonly sampler: 'dpmpp_2m'
  readonly scheduler: 'karras'
  readonly stepCount: 24
  readonly cfg: 5.5
  readonly denoise: 1
  readonly metricCodes:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkMetric[]
}

export interface LivingFrameControlledSdxlCompatibilityBenchmarkThreshold {
  readonly metricCode:
    LivingFrameControlledSdxlCompatibilityBenchmarkMetric
  readonly comparison:
    | 'equals'
    | 'less_than_or_equal'
    | 'greater_than_or_equal'
    | 'within_inclusive_range'
  readonly unit:
    | 'boolean'
    | 'normalized_ratio'
    | 'mib'
    | 'milliseconds'
  readonly minimum: number | null
  readonly maximum: number | null
  readonly exactBoolean: boolean | null
}

export interface LivingFrameControlledSdxlCompatibilityBenchmarkSpecDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_CLASS
  readonly specificationId: string
  readonly specificationState:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_SPEC_STATE
  readonly sourceBindings: {
    readonly candidateSetId: string
    readonly candidateSetDigestSha256: string
    readonly requirementSetId: string
    readonly requirementsDigestSha256: string
    readonly controlledModelFamilyBindingId: string
    readonly controlledModelFamilyBindingDigestSha256: string
    readonly dependencyLockEvidenceId: string
    readonly dependencyLockEvidenceDigestSha256: string
    readonly stockWorkflowExpectationId: string
    readonly stockWorkflowExpectationDigestSha256: string
    readonly ipAdapterMergedWorkflowId: string
    readonly ipAdapterMergedWorkflowDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
  }
  readonly fixtureRecipes: {
    readonly conditioningRecipeId:
      'living_frame_subject_neutral_conditioning_fixture_v1'
    readonly conditioningRecipeDigestSha256: string
    readonly controlImageRecipeId:
      'living_frame_subject_neutral_canny_control_fixture_v1'
    readonly controlImageRecipeDigestSha256: string
    readonly referenceImageRecipeId:
      'living_frame_subject_neutral_reference_fixture_v1'
    readonly referenceImageRecipeDigestSha256: string
    readonly containsRawPromptImageBytesPathUrlOrFilename: false
    readonly serverOwnedFixtureArtifactsPresent: false
  }
  readonly cases:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkCase[]
  readonly thresholds:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkThreshold[]
  readonly metrics: {
    readonly caseCount: 7
    readonly candidateArtifactCount: 5
    readonly candidateArtifactByteLength: 11_700_367_157
    readonly isolatedCapabilityProbeCount: 3
    readonly combinedRunCount: 2
    readonly requiredMetricCount: 11
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlCompatibilityBenchmarkAuthority
  readonly candidateSetRevalidated: true
  readonly modelRequirementsRevalidated: true
  readonly modelFamilyGraphBindingRevalidated: true
  readonly dependencyLockEvidenceRevalidated: true
  readonly exactParentLineageMatched: true
  readonly allFiveCandidateRolesCovered: true
  readonly isolatedAndCombinedCapabilityCoverageComplete: true
  readonly deterministicReplayCasePresent: true
  readonly oneCapabilityEffectComparedAtATime: true
  readonly exactCanonicalArtifactsBound: false
  readonly exactArtifactsMounted: false
  readonly benchmarkAdmitted: false
  readonly benchmarkExecuted: false
  readonly benchmarkMeasurementsPresent: false
  readonly exactBundleCompatibilityProven: false
  readonly selectedSceneCreated: false
  readonly containsProviderToolOperationWorkQueueCostOrCommercialRoute:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlCompatibilityBenchmarkSpec
  extends LivingFrameControlledSdxlCompatibilityBenchmarkSpecDraft {
  readonly specificationDigestSha256: string
}

export interface LivingFrameControlledSdxlCompatibilityBenchmarkIssue {
  readonly code:
    LivingFrameControlledSdxlCompatibilityBenchmarkIssueCode
  readonly path: string
}
