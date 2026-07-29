import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkCaseId,
  LivingFrameControlledSdxlCompatibilityBenchmarkComponent,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_VERSION =
  'living-frame-controlled-sdxl-benchmark-request-blueprint-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_CLASS =
  'controlled_non_executable_subject_neutral_sdxl_benchmark_request_blueprint' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_STATE =
  'projection_complete_private_materialization_and_canonical_operation_admission_required' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_SLOT_KINDS = [
  'base_checkpoint_artifact',
  'controlnet_checkpoint_artifact',
  'lora_adapter_artifact',
  'generic_ipadapter_checkpoint_artifact',
  'clip_vision_checkpoint_artifact',
  'positive_conditioning_text',
  'negative_conditioning_text',
  'control_image_artifact',
  'reference_image_artifact',
] as const

export type LivingFrameControlledSdxlBenchmarkRequestSlotKind =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_SLOT_KINDS)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_OPEN_GATES = [
  'exact_canonical_artifacts_and_read_only_mount_required',
  'canonical_comfyui_operation_contract_required',
  'dependency_locked_scanned_signed_gpu_image_required',
  'distributed_private_model_mount_required',
  'server_owned_conditioning_control_and_reference_fixtures_required',
  'private_binding_slot_materialization_required',
  'current_gpu_node_schema_revalidation_required',
  'runtime_node_allowlist_enforcement_required',
  'canonical_gpu_attempt_and_internal_cost_evidence_required',
  'canonical_gpu_metric_attestation_required',
  'license_and_paid_use_review_required',
  'selected_scene_snapshot_work_asset_qa_and_private_review_required',
] as const

export type LivingFrameControlledSdxlBenchmarkRequestBlueprintOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_ISSUES = [
  'input_invalid',
  'benchmark_specification_invalid',
  'admission_audit_invalid',
  'source_lineage_mismatch',
  'admission_state_promotion_forbidden',
  'case_set_or_order_mismatch',
  'case_component_mismatch',
  'case_comparison_mismatch',
  'case_runtime_policy_mismatch',
  'binding_slot_policy_mismatch',
  'unsafe_payload_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlBenchmarkRequestBlueprintIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_ISSUES)[number]

export interface LivingFrameControlledSdxlBenchmarkRequestSlot {
  readonly order: number
  readonly slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind
  readonly sourceClass:
    | 'canonical_model_artifact'
    | 'server_owned_conditioning'
    | 'server_owned_control_image'
    | 'server_owned_reference_image'
  readonly required: true
  readonly resolved: false
  readonly valuePresent: false
}

export interface LivingFrameControlledSdxlBenchmarkRequestRecipe {
  readonly order: number
  readonly caseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId
  readonly recipeClass:
    | 'load_only_bundle_probe'
    | 'unmaterialized_generation_request'
  readonly comparisonCaseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId | null
  readonly enabledComponents:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkComponent[]
  readonly disabledComponents:
    readonly LivingFrameControlledSdxlCompatibilityBenchmarkComponent[]
  readonly runtimePolicy:
    | null
    | {
        readonly seed: 19_791_104 | 420_042
        readonly outputWidthPixels: 1024
        readonly outputHeightPixels: 1024
        readonly sampler: 'dpmpp_2m'
        readonly scheduler: 'karras'
        readonly stepCount: 24
        readonly cfg: 5.5
        readonly denoise: 1
      }
  readonly requiredBindingSlots:
    readonly LivingFrameControlledSdxlBenchmarkRequestSlot[]
  readonly exactCasePolicyProjected: true
  readonly allBindingsRemainServerResolved: true
  readonly promptTextPresent: false
  readonly imageBytesPresent: false
  readonly modelBytesPathUrlOrFilenamePresent: false
  readonly executableRequestPresent: false
  readonly recipeDigestSha256: string
}

export interface LivingFrameControlledSdxlBenchmarkRequestBlueprintAuthority {
  readonly deterministicRequestBlueprintAuthority: true
  readonly benchmarkSpecificationAuthority: false
  readonly benchmarkAdmissionAuthority: false
  readonly artifactRepositoryAuthority: false
  readonly artifactMountAuthority: false
  readonly fixtureArtifactAuthority: false
  readonly promptAuthority: false
  readonly requestMaterializationAuthority: false
  readonly currentNodeSchemaAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly toolRouteAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly selectedSceneAuthority: false
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

export interface LivingFrameControlledSdxlBenchmarkRequestBlueprintDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_CLASS
  readonly blueprintId: string
  readonly blueprintState:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_BLUEPRINT_STATE
  readonly sourceBindings: {
    readonly benchmarkSpecificationId: string
    readonly benchmarkSpecificationDigestSha256: string
    readonly benchmarkAdmissionAuditId: string
    readonly benchmarkAdmissionAuditDigestSha256: string
    readonly candidateSetDigestSha256: string
    readonly requirementsDigestSha256: string
    readonly dependencyLockEvidenceDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
  }
  readonly admissionProjection: {
    readonly exactArtifactEvidenceState:
      'not_injected' | 'server_revalidated'
    readonly canonicalOperationContractState:
      'not_registered'
    readonly canonicalOperationContractDigestSha256: null
    readonly distributedPrivateModelMountDigestSha256: null
    readonly signedGpuImageDigestSha256: null
    readonly serverOwnedFixtureSetDigestSha256: null
    readonly currentGpuNodeSchemaDigestSha256: null
  }
  readonly recipes:
    readonly LivingFrameControlledSdxlBenchmarkRequestRecipe[]
  readonly metrics: {
    readonly caseCount: 7
    readonly loadOnlyRecipeCount: 1
    readonly generationRecipeCount: 6
    readonly unresolvedBindingSlotCount: 41
    readonly distinctBindingSlotSetCount: 6
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlBenchmarkRequestBlueprintOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlBenchmarkRequestBlueprintAuthority
  readonly benchmarkSpecificationRevalidated: true
  readonly benchmarkAdmissionAuditRevalidated: true
  readonly exactSourceLineageMatched: true
  readonly caseSetOrderComponentsAndComparisonsMatched: true
  readonly requestBlueprintProjected: true
  readonly requestMaterialized: false
  readonly dispatchReady: false
  readonly benchmarkExecuted: false
  readonly benchmarkMeasurementsPresent: false
  readonly actualAttemptCostEvidencePresent: false
  readonly selectedSceneCreated: false
  readonly containsRawPromptImagePixelsModelBytesPathUrlFilenameCredentialOrCommand:
    false
  readonly containsProviderToolOperationWorkQueueCostOrCommercialRoute:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlBenchmarkRequestBlueprint
  extends LivingFrameControlledSdxlBenchmarkRequestBlueprintDraft {
  readonly blueprintDigestSha256: string
}

export interface LivingFrameControlledSdxlBenchmarkRequestBlueprintIssue {
  readonly code:
    LivingFrameControlledSdxlBenchmarkRequestBlueprintIssueCode
  readonly path: string
}
