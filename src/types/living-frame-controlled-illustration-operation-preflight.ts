export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_VERSION =
  'living-frame-controlled-illustration-operation-preflight-v1' as const

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_CLASS =
  'controlled_non_executable_operation_admission_preflight' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_KEYS = [
  'comfyui',
  'comfyui_controlnet_aux',
  'controlnet',
  'ip_adapter',
  'peft_lora',
  'auraface',
] as const
export type LivingFrameControlledIllustrationCapabilityKey =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_KEYS>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_PLACEMENTS = [
  'shared_gpu_host',
  'external_control_image_preparation',
  'gpu_host_model_conditioning',
  'gpu_host_reference_conditioning',
  'gpu_host_adapter_loading',
  'post_generation_cpu_continuity_qa',
] as const
export type LivingFrameControlledIllustrationCapabilityPlacement =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_PLACEMENTS>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_DECISIONS = [
  'required',
  'conditional',
] as const
export type LivingFrameControlledIllustrationCapabilityDecision =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_CAPABILITY_DECISIONS>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_OPEN_GATES = [
  'canonical_comfyui_tool_identity_required',
  'canonical_comfyui_operation_spec_required',
  'signed_gpu_worker_image_required',
  'dependency_lock_and_sbom_required',
  'operation_owned_model_artifact_requirements_required',
  'read_only_model_mount_binding_required',
  'approved_generate_image_work_projection_required',
  'private_gpu_dispatch_and_lease_required',
  'actual_attempt_cost_evidence_required',
  'generated_component_asset_qa_required',
] as const
export type LivingFrameControlledIllustrationOperationOpenGate =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_OPEN_GATES>

export const LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_ISSUE_CODES = [
  'input_invalid',
  'unknown_key',
  'unsafe_input',
  'lineage_invalid',
  'digest_invalid',
  'capability_set_invalid',
  'capability_order_invalid',
  'capability_contract_invalid',
  'gpu_host_count_invalid',
  'auraface_placement_invalid',
  'operation_expectation_invalid',
  'cost_binding_invalid',
  'gate_set_invalid',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const
export type LivingFrameControlledIllustrationOperationIssueCode =
  ValueOf<typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_ISSUE_CODES>

export interface LivingFrameControlledIllustrationCapabilityExpectation {
  readonly capabilityKey: LivingFrameControlledIllustrationCapabilityKey
  readonly order: number
  readonly placement:
    LivingFrameControlledIllustrationCapabilityPlacement
  readonly decision:
    LivingFrameControlledIllustrationCapabilityDecision
  readonly separateProductionToolIdentityExpected: false
  readonly installed: false
  readonly artifactQualified: false
  readonly runtimeQualified: false
  readonly dispatchable: false
}

export interface LivingFrameControlledIllustrationOperationAuthorityBoundary {
  readonly planningAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly providerAuthority: false
  readonly dispatchAuthority: false
  readonly modelArtifactAuthority: false
  readonly assetManifestAuthority: false
  readonly actualCostAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledIllustrationOperationPreflightDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_ILLUSTRATION_OPERATION_PREFLIGHT_CLASS
  readonly preflightId: string
  readonly lineage: {
    readonly approvedLineageBindingDigestSha256: string
    readonly selectedSceneAdmissionDigestSha256: string
    readonly componentAssetIntentDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly masterTimingExpectationDigestSha256: string
    readonly controlledIllustrationQualificationDigestSha256: string
    readonly controlledIllustrationSourceObservationDigestSha256: string
    readonly estimateProjectionDigestSha256: string
    readonly workGraphProjectionDigestSha256: string
  }
  readonly capabilityExpectations:
    readonly LivingFrameControlledIllustrationCapabilityExpectation[]
  readonly operationExpectation: {
    readonly expectedCanonicalToolId: 'comfyui'
    readonly expectedCanonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly expectedWorkItemType: 'generate_image_asset'
    readonly expectedWorkerType: 'gpu_ai_worker'
    readonly expectedAccelerator: 'nvidia_l4'
    readonly expectedGpuCount: 1
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkModelFetchAllowed: false
    readonly oneSharedGpuHostLifetime: true
    readonly auraFaceRunsInsideGpuHost: false
    readonly canonicalToolIdentityRegistered: false
    readonly canonicalOperationRegistered: false
    readonly workItemProjected: false
    readonly privateDispatchAdmitted: false
  }
  readonly costBinding: {
    readonly estimateCostComponentId:
      'shared_controlled_illustration_gpu_host'
    readonly estimateCapabilityGroup:
      'shared_controlled_illustration_runtime'
    readonly sharedGpuHostPricedOnce: true
    readonly auraFaceSeparateCpuMeasurementConditional: true
    readonly plannedUsageIsActualCostEvidence: false
    readonly failedAndUnknownAttemptCostRetentionRequired: true
    readonly customerCreditCalculationDelegatedToCanonicalEstimate: true
    readonly actualCostDelegatedToCanonicalAttemptCostEvidence: true
  }
  readonly openGateCodes:
    readonly LivingFrameControlledIllustrationOperationOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledIllustrationOperationAuthorityBoundary
  readonly executableOperationPresent: false
  readonly workItemPresent: false
  readonly dispatchGrantPresent: false
  readonly modelArtifactMountPresent: false
  readonly actualAttemptReceiptPresent: false
  readonly productionReady: false
}

export interface LivingFrameControlledIllustrationOperationPreflight
  extends LivingFrameControlledIllustrationOperationPreflightDraft {
  readonly preflightDigestSha256: string
}

export interface LivingFrameControlledIllustrationOperationIssue {
  readonly code: LivingFrameControlledIllustrationOperationIssueCode
  readonly path: string
}

