import type {
  LivingFrameControlledModelFamilyRole,
} from './living-frame-controlled-model-family-binding'

export const LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_VERSION =
  'living-frame-comfyui-read-only-model-mount-v1' as const

export const LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_CLASS =
  'controlled_non_promotable_verified_read_only_model_source_presentation' as const

export const LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_OPEN_GATES = [
  'exact_bundle_compatibility_benchmark_required',
  'paid_production_license_approval_required',
  'canonical_operation_artifact_set_required',
  'distributed_private_gcs_mount_authority_required',
  'signed_gpu_worker_image_required',
  'selected_scene_snapshot_and_dispatch_required',
  'gpu_inference_output_capture_and_qa_required',
  'observed_attempt_cost_and_private_review_required',
] as const

export type LivingFrameComfyUiReadOnlyModelMountOpenGate =
  (typeof LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_OPEN_GATES)[number]

export const LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_ISSUES = [
  'input_invalid',
  'artifact_binding_invalid',
  'repository_invalid',
  'consumer_invalid',
  'lease_creation_failed',
  'lease_consumption_failed',
  'entry_order_invalid',
  'entry_identity_mismatch',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameComfyUiReadOnlyModelMountIssueCode =
  (typeof LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_ISSUES)[number]

export interface LivingFrameComfyUiReadOnlyModelMountEntry {
  readonly canonicalOrder: number
  readonly role: LivingFrameControlledModelFamilyRole
  readonly artifactRecordId: string
  readonly artifactId: string
  readonly revision: string
  readonly contentSha256: string
  readonly leaseDigestSha256: string
  readonly consumptionDigestSha256: string
  readonly consumerScope: 'comfyui.private-inference'
  readonly executionTarget: 'google_cloud_run_gpu'
  readonly objectVerifiedBeforeConsumer: true
  readonly objectVerifiedAfterConsumer: true
  readonly readOnlySourcePresented: true
  readonly hostPathIncluded: false
  readonly mountAliasIncluded: false
  readonly modelInferenceExecuted: false
}

export interface LivingFrameComfyUiReadOnlyModelMountAuthority {
  readonly canonicalArtifactBindingConsumed: true
  readonly canonicalReadOnlyLeaseAuthorityConsumed: true
  readonly localReadOnlySourcePresentationObserved: true
  readonly distributedMountAuthority: false
  readonly modelCompatibilityAuthority: false
  readonly licenseApprovalAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
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

export interface LivingFrameComfyUiReadOnlyModelMountDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_COMFYUI_READ_ONLY_MODEL_MOUNT_CLASS
  readonly preparationId: string
  readonly sourceBindings: {
    readonly canonicalModelArtifactBindingId: string
    readonly canonicalModelArtifactBindingDigestSha256: string
    readonly requirementsDigestSha256: string
  }
  readonly entries:
    readonly LivingFrameComfyUiReadOnlyModelMountEntry[]
  readonly metrics: {
    readonly requiredArtifactCount: number
    readonly readOnlySourcePresentationCount: number
    readonly totalByteLength: number
  }
  readonly openGateCodes:
    readonly LivingFrameComfyUiReadOnlyModelMountOpenGate[]
  readonly authorityBoundary:
    LivingFrameComfyUiReadOnlyModelMountAuthority
  readonly sourceArtifactBindingRevalidated: true
  readonly everyLeaseCreatedByCanonicalAuthority: true
  readonly everyLeaseConsumedExactlyOnce: true
  readonly everyObjectVerifiedBeforeAndAfterPresentation: true
  readonly containsHostPathMountAliasUrlCredentialOrBytes: false
  readonly distributedMountCreated: false
  readonly modelInferenceExecuted: false
  readonly outputArtifactCreated: false
  readonly actualAttemptCostReceiptCreated: false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameComfyUiReadOnlyModelMount
  extends LivingFrameComfyUiReadOnlyModelMountDraft {
  readonly preparationDigestSha256: string
}

export interface LivingFrameComfyUiReadOnlyModelMountIssue {
  readonly code: LivingFrameComfyUiReadOnlyModelMountIssueCode
  readonly path: string
}
