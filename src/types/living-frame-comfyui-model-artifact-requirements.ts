import type {
  LivingFrameControlledClipVisionFamily,
  LivingFrameControlledModelBindingKind,
  LivingFrameControlledModelFamily,
  LivingFrameControlledModelFamilyRole,
} from './living-frame-controlled-model-family-binding'

export const LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENTS_VERSION =
  'living-frame-comfyui-model-artifact-requirements-v1' as const

export const LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENTS_CLASS =
  'controlled_unresolved_comfyui_model_artifact_requirements' as const

type ValueOf<T extends readonly string[]> = T[number]

export const LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENT_STATES = [
  'exact_unresolved_requirements_projected',
] as const
export type LivingFrameComfyUiModelArtifactRequirementState =
  ValueOf<
    typeof LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENT_STATES
  >

export const LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_OPEN_GATES = [
  'canonical_model_artifact_locator_binding_required',
  'canonical_model_artifact_full_verification_required',
  'exact_model_bundle_compatibility_manifest_required',
  'canonical_dependency_artifact_repository_admission_required',
  'signed_gpu_image_rebuild_required',
  'license_and_paid_use_review_required',
  'single_use_read_only_mount_lease_required',
  'google_cloud_run_gpu_worker_required',
  'network_off_runtime_confinement_required',
  'selected_scene_and_approved_snapshot_binding_required',
  'canonical_dispatch_work_cost_asset_and_qa_binding_required',
  'private_review_required',
] as const
export type LivingFrameComfyUiModelArtifactOpenGate =
  ValueOf<typeof LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_OPEN_GATES>

export const LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_ISSUES = [
  'input_invalid',
  'model_family_binding_invalid',
  'dependency_lock_evidence_invalid',
  'parent_lineage_mismatch',
  'family_expectation_invalid',
  'requirement_order_invalid',
  'artifact_resolution_promotion_forbidden',
  'runtime_promotion_forbidden',
  'subject_specific_routing_forbidden',
  'digest_mismatch',
] as const
export type LivingFrameComfyUiModelArtifactIssueCode =
  ValueOf<typeof LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_ISSUES>

export type LivingFrameComfyUiModelArtifactExpectedFamily =
  | {
      readonly familyClass: 'diffusion_base_model_family'
      readonly family: LivingFrameControlledModelFamily
    }
  | {
      readonly familyClass: 'clip_vision_model_family'
      readonly family: LivingFrameControlledClipVisionFamily
    }

export interface LivingFrameComfyUiModelArtifactRequirement {
  readonly order: number
  readonly role: LivingFrameControlledModelFamilyRole
  readonly bindingKind: LivingFrameControlledModelBindingKind
  readonly bindingDigestSha256: string
  readonly expectedFamily:
    LivingFrameComfyUiModelArtifactExpectedFamily
  readonly executionExpectation: {
    readonly executionClass: 'gpu_required'
    readonly requiredExecutionTarget: 'google_cloud_run_gpu'
    readonly accelerator: 'cuda'
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly artifactLocatorBound: false
  readonly artifactManifestVerified: false
  readonly artifactBytesMounted: false
  readonly compatibilityBenchmarkPassed: false
  readonly paidProductionUseApproved: false
}

export interface LivingFrameComfyUiModelArtifactRequirementsAuthority {
  readonly deterministicRequirementProjectionOnly: true
  readonly artifactRepositoryAuthority: false
  readonly artifactLocatorAuthority: false
  readonly artifactManifestAuthority: false
  readonly artifactVerificationAuthority: false
  readonly artifactMountAuthority: false
  readonly modelCompatibilityAuthority: false
  readonly licenseReviewAuthority: false
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

export interface LivingFrameComfyUiModelArtifactRequirementsDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENTS_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_COMFYUI_MODEL_ARTIFACT_REQUIREMENTS_CLASS
  readonly requirementSetId: string
  readonly requirementState:
    LivingFrameComfyUiModelArtifactRequirementState
  readonly sourceBindings: {
    readonly controlledModelFamilyBindingId: string
    readonly controlledModelFamilyBindingDigestSha256: string
    readonly stockWorkflowExpectationId: string
    readonly stockWorkflowExpectationDigestSha256: string
    readonly dependencyLockEvidenceId: string
    readonly dependencyLockEvidenceDigestSha256: string
  }
  readonly requirements:
    readonly LivingFrameComfyUiModelArtifactRequirement[]
  readonly metrics: {
    readonly requirementCount: number
    readonly diffusionCheckpointCount: number
    readonly adapterCount: number
    readonly clipVisionCount: number
    readonly unresolvedRequirementCount: number
  }
  readonly openGateCodes:
    readonly LivingFrameComfyUiModelArtifactOpenGate[]
  readonly authorityBoundary:
    LivingFrameComfyUiModelArtifactRequirementsAuthority
  readonly parentContractsRevalidated: true
  readonly graphSlotsExactlyCoveredByFamilyBinding: true
  readonly familyExpectationsExactlyMatched: true
  readonly dependencyLockEvidenceRevalidated: true
  readonly genericCanonicalArtifactRepositoryRemainsAuthority: true
  readonly containsArtifactLocatorManifestBytesPathUrlOrFilename: false
  readonly containsProviderToolOperationWorkQueueCostOrCommercialRoute:
    false
  readonly artifactRequirementsResolved: false
  readonly gpuWorkerAvailable: false
  readonly promptExecutable: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameComfyUiModelArtifactRequirements
  extends LivingFrameComfyUiModelArtifactRequirementsDraft {
  readonly requirementsDigestSha256: string
}

export interface LivingFrameComfyUiModelArtifactIssue {
  readonly code: LivingFrameComfyUiModelArtifactIssueCode
  readonly path: string
}
