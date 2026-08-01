import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkCaseId,
  LivingFrameControlledSdxlCompatibilityBenchmarkMetric,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_VERSION =
  'living-frame-controlled-sdxl-benchmark-result-binding-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_CLASS =
  'controlled_non_promotable_subject_neutral_sdxl_benchmark_result_binding' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_STATE =
  'controlled_threshold_evaluation_without_released_gpu_attempt' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_OBSERVATION_CLASS =
  'controlled_non_promotable_subject_neutral_sdxl_benchmark_observation' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_OPEN_GATES = [
  'canonical_comfyui_operation_contract_required',
  'dependency_locked_scanned_signed_gpu_image_required',
  'distributed_private_model_mount_required',
  'server_owned_fixture_artifacts_and_private_materialization_required',
  'current_gpu_node_schema_revalidation_required',
  'released_gpu_attempt_receipt_required',
  'canonical_gpu_metric_attestation_required',
  'canonical_internal_attempt_cost_evidence_required',
  'exact_bundle_compatibility_disposition_required',
  'lora_base_version_mismatch_disposition_required',
  'license_and_paid_use_review_required',
  'selected_scene_snapshot_work_asset_qa_and_private_review_required',
] as const

export type LivingFrameControlledSdxlBenchmarkResultBindingOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_ISSUES = [
  'input_invalid',
  'benchmark_specification_invalid',
  'request_blueprint_invalid',
  'source_lineage_mismatch',
  'observation_reader_invalid',
  'observation_invalid',
  'observation_unstable',
  'observation_lineage_mismatch',
  'case_set_or_order_mismatch',
  'case_receipt_invalid',
  'metric_set_or_order_mismatch',
  'metric_observation_invalid',
  'measurement_cross_check_mismatch',
  'threshold_evaluation_invalid',
  'unsafe_payload_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlBenchmarkResultBindingIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_ISSUES)[number]

export type LivingFrameControlledSdxlBenchmarkMetricUnit =
  | 'boolean'
  | 'normalized_ratio'
  | 'mib'
  | 'milliseconds'

export interface LivingFrameControlledSdxlBenchmarkCaseObservation {
  readonly order: number
  readonly caseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId
  readonly observationState:
    'completed_controlled_fixture_observation'
  readonly outputObservationDigestSha256: string | null
  readonly exactModelLoadIntegrity: boolean | null
  readonly networkOffConfinement: boolean | null
  readonly decodedOutputValid: boolean | null
  readonly finitePixelPopulation: boolean | null
  readonly durationMs: number
  readonly peakGpuMemoryMiB: number
}

export interface LivingFrameControlledSdxlBenchmarkMetricObservation {
  readonly order: number
  readonly metricCode:
    LivingFrameControlledSdxlCompatibilityBenchmarkMetric
  readonly unit:
    LivingFrameControlledSdxlBenchmarkMetricUnit
  readonly value: boolean | number
}

export interface LivingFrameControlledSdxlBenchmarkObservationDraft {
  readonly observationClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_OBSERVATION_CLASS
  readonly observationId: string
  readonly sourceBindings: {
    readonly benchmarkSpecificationId: string
    readonly benchmarkSpecificationDigestSha256: string
    readonly requestBlueprintId: string
    readonly requestBlueprintDigestSha256: string
  }
  readonly caseObservations:
    readonly LivingFrameControlledSdxlBenchmarkCaseObservation[]
  readonly metricObservations:
    readonly LivingFrameControlledSdxlBenchmarkMetricObservation[]
  readonly controlledFixtureObservationOnly: true
  readonly releasedGpuAttemptPresent: false
  readonly canonicalGpuMetricAttestationPresent: false
  readonly canonicalInternalAttemptCostEvidencePresent: false
  readonly rawPromptImagePixelsModelBytesPathUrlFilenameCredentialOrCommandIncluded:
    false
}

export interface LivingFrameControlledSdxlBenchmarkObservation
  extends LivingFrameControlledSdxlBenchmarkObservationDraft {
  readonly observationDigestSha256: string
}

export interface LivingFrameControlledSdxlBenchmarkThresholdResult {
  readonly order: number
  readonly metricCode:
    LivingFrameControlledSdxlCompatibilityBenchmarkMetric
  readonly unit:
    LivingFrameControlledSdxlBenchmarkMetricUnit
  readonly comparison:
    | 'equals'
    | 'less_than_or_equal'
    | 'greater_than_or_equal'
    | 'within_inclusive_range'
  readonly observedValue: boolean | number
  readonly minimum: number | null
  readonly maximum: number | null
  readonly exactBoolean: boolean | null
  readonly passed: boolean
}

export interface LivingFrameControlledSdxlBenchmarkResultBindingAuthority {
  readonly deterministicThresholdEvaluationAuthority: true
  readonly processBoundControlledObservationAuthority: true
  readonly benchmarkSpecificationAuthority: false
  readonly requestBlueprintAuthority: false
  readonly benchmarkExecutionAuthority: false
  readonly releasedAttemptAuthority: false
  readonly canonicalMetricAttestationAuthority: false
  readonly canonicalInternalCostAuthority: false
  readonly modelCompatibilityAuthority: false
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
  readonly customerCostOrCreditAuthority: false
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

export interface LivingFrameControlledSdxlBenchmarkResultBindingDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_CLASS
  readonly resultId: string
  readonly resultState:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_RESULT_BINDING_STATE
  readonly sourceBindings: {
    readonly benchmarkSpecificationId: string
    readonly benchmarkSpecificationDigestSha256: string
    readonly requestBlueprintId: string
    readonly requestBlueprintDigestSha256: string
    readonly observationId: string
    readonly observationDigestSha256: string
  }
  readonly caseObservations:
    readonly LivingFrameControlledSdxlBenchmarkCaseObservation[]
  readonly thresholdResults:
    readonly LivingFrameControlledSdxlBenchmarkThresholdResult[]
  readonly metrics: {
    readonly controlledCaseObservationCount: 7
    readonly evaluatedThresholdCount: 11
    readonly passedThresholdCount: number
    readonly failedThresholdCount: number
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlBenchmarkResultBindingOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlBenchmarkResultBindingAuthority
  readonly benchmarkSpecificationRevalidated: true
  readonly requestBlueprintRevalidated: true
  readonly controlledObservationRereadByProcessBoundPort: true
  readonly stableObservationDigestObservedTwice: true
  readonly exactSourceLineageMatched: true
  readonly allSevenControlledCaseObservationsPresent: true
  readonly allElevenThresholdsEvaluated: true
  readonly controlledThresholdSetPassed: boolean
  readonly releasedGpuAttemptPresent: false
  readonly canonicalGpuMetricAttestationPresent: false
  readonly canonicalInternalAttemptCostEvidencePresent: false
  readonly exactBundleCompatibilityProven: false
  readonly loraBaseVersionMismatchResolved: false
  readonly selectedSceneCreated: false
  readonly containsRawPromptImagePixelsModelBytesPathUrlFilenameCredentialOrCommand:
    false
  readonly containsProviderToolOperationWorkQueueCostOrCommercialRoute:
    false
  readonly subjectSpecificRouting: false
  readonly promotionAllowed: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlBenchmarkResultBinding
  extends LivingFrameControlledSdxlBenchmarkResultBindingDraft {
  readonly resultDigestSha256: string
}

export interface LivingFrameControlledSdxlBenchmarkResultBindingIssue {
  readonly code:
    LivingFrameControlledSdxlBenchmarkResultBindingIssueCode
  readonly path: string
}
