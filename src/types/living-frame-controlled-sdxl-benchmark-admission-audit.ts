export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_VERSION =
  'living-frame-controlled-sdxl-benchmark-admission-audit-v2' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_CLASS =
  'controlled_non_executable_exact_sdxl_gpu_benchmark_admission_audit' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_STATES = [
  'blocked_exact_artifacts_and_mount_required',
  'blocked_canonical_comfyui_production_identity_required',
  'blocked_canonical_comfyui_operation_required',
  'blocked_gpu_image_and_distributed_mount_required',
] as const

export type LivingFrameControlledSdxlBenchmarkAdmissionAuditState =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_STATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_OPEN_GATES = [
  'exact_canonical_artifact_binding_required',
  'single_use_read_only_model_mount_required',
  'lora_base_version_mismatch_disposition_required',
  'canonical_comfyui_production_identity_required',
  'canonical_comfyui_operation_contract_required',
  'dependency_locked_scanned_signed_gpu_image_required',
  'distributed_private_model_mount_required',
  'current_gpu_node_schema_revalidation_required',
  'server_owned_benchmark_fixture_artifacts_required',
  'canonical_gpu_attempt_and_internal_cost_evidence_required',
  'canonical_gpu_metric_attestation_required',
  'license_and_paid_use_review_required',
  'selected_scene_snapshot_work_asset_qa_and_private_review_required',
] as const

export type LivingFrameControlledSdxlBenchmarkAdmissionAuditOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_ISSUES = [
  'input_invalid',
  'benchmark_spec_invalid',
  'exact_artifact_evidence_invalid',
  'exact_artifact_binding_invalid',
  'read_only_mount_invalid',
  'artifact_lineage_mismatch',
  'mount_lineage_mismatch',
  'registry_observation_mismatch',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlBenchmarkAdmissionAuditIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_ISSUES)[number]

export interface LivingFrameControlledSdxlBenchmarkRegistryObservation {
  readonly expectedCapabilityId: 'comfyui'
  readonly expectedOperationId:
    'tool.comfyui.generate_controlled_image.v1'
  readonly nonE2eCapabilityCatalogEntryPresent: boolean
  readonly nonE2eEvaluationOnly: boolean
  readonly gpuWorkerCandidateDeclared: boolean
  readonly gpuRequired: boolean
  readonly cpuFallbackForbidden: boolean
  readonly exactModelWeightReviewRequired: boolean
  readonly productionToolIdentityPresent: boolean
  readonly exactOperationContractPresent: boolean
  readonly privateGpuRunnerVerified: false
  readonly productReady: false
}

export interface LivingFrameControlledSdxlBenchmarkAdmissionAuditAuthority {
  readonly deterministicAdmissionAuditAuthority: true
  readonly benchmarkSpecificationAuthority: false
  readonly artifactRepositoryAuthority: false
  readonly artifactBindingAuthority: false
  readonly artifactMountAuthority: false
  readonly canonicalToolRegistryAuthority: false
  readonly canonicalOperationAuthority: false
  readonly gpuExecutionAuthority: false
  readonly benchmarkResultAuthority: false
  readonly legalReviewAuthority: false
  readonly commercialUseAuthority: false
  readonly providerAuthority: false
  readonly toolRouteAuthority: false
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

export interface LivingFrameControlledSdxlBenchmarkAdmissionAuditDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_ADMISSION_AUDIT_CLASS
  readonly auditId: string
  readonly auditState:
    LivingFrameControlledSdxlBenchmarkAdmissionAuditState
  readonly sourceBindings: {
    readonly benchmarkSpecificationId: string
    readonly benchmarkSpecificationDigestSha256: string
    readonly candidateSetDigestSha256: string
    readonly requirementsDigestSha256: string
    readonly dependencyLockEvidenceDigestSha256: string
    readonly exactCanonicalArtifactBindingDigestSha256:
      string | null
    readonly readOnlyModelPreparationDigestSha256:
      string | null
  }
  readonly exactArtifactEvidenceState:
    | {
        readonly state: 'not_injected'
        readonly exactArtifactCount: 0
        readonly readOnlyPresentationCount: 0
      }
    | {
        readonly state: 'server_revalidated'
        readonly exactArtifactCount: 5
        readonly readOnlyPresentationCount: 5
      }
  readonly registryObservation:
    LivingFrameControlledSdxlBenchmarkRegistryObservation
  readonly metrics: {
    readonly benchmarkCaseCount: 7
    readonly benchmarkMetricCount: 11
    readonly expectedArtifactCount: 5
    readonly expectedArtifactByteLength: 11_700_367_157
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlBenchmarkAdmissionAuditOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlBenchmarkAdmissionAuditAuthority
  readonly benchmarkSpecificationRevalidated: true
  readonly exactArtifactsAndLocalReadOnlyPresentationRevalidated:
    boolean
  readonly currentRegistryReadDirectlyByServer: true
  readonly exactDependencyGraphAndArtifactLineageBound: boolean
  readonly benchmarkRequestReady: false
  readonly releasedGpuAttemptPresent: false
  readonly canonicalGpuMetricAttestationPresent: false
  readonly canonicalInternalCostReceiptPresent: false
  readonly selectedSceneCreated: false
  readonly containsRawPromptImagePixelModelBytesPathUrlCredentialOrCommand:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlBenchmarkAdmissionAudit
  extends LivingFrameControlledSdxlBenchmarkAdmissionAuditDraft {
  readonly auditDigestSha256: string
}

export interface LivingFrameControlledSdxlBenchmarkAdmissionAuditIssue {
  readonly code:
    LivingFrameControlledSdxlBenchmarkAdmissionAuditIssueCode
  readonly path: string
}
