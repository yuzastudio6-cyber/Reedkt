import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkCaseId,
} from './living-frame-controlled-sdxl-compatibility-benchmark-spec'

export const
LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION =
  'living-frame-controlled-sdxl-gpu-runtime-protocol-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_REQUEST_RECEIPT_CLASS =
  'server_private_non_dispatched_comfyui_gpu_request_receipt' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_OPEN_GATES = [
  'canonical_comfyui_production_tool_identity_required',
  'canonical_comfyui_operation_registration_required',
  'current_gpu_node_schema_revalidation_required',
  'dependency_locked_scanned_signed_gpu_image_required',
  'distributed_private_model_and_input_mount_required',
  'canonical_private_gpu_dispatch_and_lease_required',
  'released_gpu_attempt_and_completion_receipts_required',
  'canonical_worker_resource_cost_evidence_required',
  'canonical_gpu_metric_attestation_required',
  'canonical_actual_cost_attribution_required',
  'canonical_customer_estimate_and_settlement_reconciliation_required',
  'license_and_paid_use_review_required',
  'selected_scene_snapshot_work_asset_qa_and_private_review_required',
] as const

export type LivingFrameControlledSdxlGpuRuntimeProtocolOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_OPEN_GATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_ISSUES = [
  'input_invalid',
  'reader_invalid',
  'reader_reused',
  'reader_failed',
  'materialization_invalid',
  'materialization_lease_invalid',
  'artifact_packet_invalid',
  'artifact_lineage_invalid',
  'artifact_slot_set_invalid',
  'private_alias_invalid',
  'private_prompt_lineage_invalid',
  'wire_request_invalid',
  'wire_request_too_large',
  'unsafe_receipt_forbidden',
  'authority_promotion_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameControlledSdxlGpuRuntimeProtocolIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_ISSUES)[number]

export interface LivingFrameControlledSdxlGpuRuntimeArtifactReceipt {
  readonly order: number
  readonly slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind
  readonly artifactClass:
    | 'canonical_model_artifact'
    | 'private_input_image_artifact'
  readonly artifactRecordId: string
  readonly artifactContentSha256: string
  readonly artifactByteLength: number
  readonly artifactSourceBindingDigestSha256: string
  readonly privateAliasDigestSha256: string
  readonly privateAliasIncluded: false
  readonly artifactBytesIncluded: false
  readonly pathOrUrlIncluded: false
  readonly readOnlyMountRequired: true
}

export interface LivingFrameControlledSdxlGpuRuntimeProtocolAuthority {
  readonly privateWireProtocolCompilationAuthority: true
  readonly materializationAuthority: false
  readonly artifactRepositoryAuthority: false
  readonly artifactMountAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly dispatchAuthority: false
  readonly workerLeaseAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
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

export interface LivingFrameControlledSdxlGpuRuntimeRequestReceiptDraft {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_PROTOCOL_VERSION
  readonly resultClass:
    typeof
      LIVING_FRAME_CONTROLLED_SDXL_GPU_RUNTIME_REQUEST_RECEIPT_CLASS
  readonly requestReceiptId: string
  readonly serverOwnedArtifactLocatorId: string
  readonly caseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId
  readonly sourceBindings: {
    readonly promptMaterializationId: string
    readonly promptMaterializationDigestSha256: string
    readonly privatePromptDigestSha256: string
    readonly privatePromptLeaseId: string
    readonly artifactSetDigestSha256: string
    readonly artifactPacketDigestSha256: string
    readonly outputFrameExpectationDigestSha256: string
  }
  readonly operationExpectation: {
    readonly expectedCanonicalToolId: 'comfyui'
    readonly expectedCanonicalOperationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly sharedWorkerType: 'gpu_ai_worker'
    readonly executionTarget: 'google_cloud_run_gpu'
    readonly runtimeRegion: 'europe-west1'
    readonly accelerator: 'nvidia_l4'
    readonly gpuCount: 1
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly requestSummary: {
    readonly privateWireRequestLeaseId: string
    readonly privateWireRequestDigestSha256: string
    readonly serializedWireRequestByteLength: number
    readonly promptNodeCount: number
    readonly modelArtifactCount: number
    readonly inputImageArtifactCount: number
    readonly artifactReceipts:
      readonly LivingFrameControlledSdxlGpuRuntimeArtifactReceipt[]
    readonly outputContentType: 'image/png'
    readonly outputWidthPixels: 1024
    readonly outputHeightPixels: 1024
    readonly websocketImageOutputRequired: true
    readonly privateWireRequestIncludedInReceipt: false
    readonly privatePromptIncludedInReceipt: false
  }
  readonly costBinding: {
    readonly costComponentId:
      'shared_controlled_illustration_gpu_host'
    readonly sharedGpuCapabilityKeys: readonly [
      'comfyui',
      'comfyui_controlnet_aux',
      'controlnet',
      'ip_adapter',
      'peft_lora',
    ]
    readonly separateCpuQaCapabilityKey: 'auraface'
    readonly oneWireRequestRepresentsOneGpuAttempt: true
    readonly fiveGpuCapabilitiesShareAttemptLifetime: true
    readonly auraFaceExcludedFromGpuRequest: true
    readonly actualWorkerResourceCostEvidenceRequired: true
    readonly costAmountIncluded: false
    readonly customerCreditAmountIncluded: false
    readonly serviceFeeIncluded: false
    readonly failedOrUnknownAttemptCostMustBeRetained: true
    readonly exactReuseCreatesNoNewGpuAttempt: true
    readonly creditsMustRoundOnceAfterBundleAggregation: true
    readonly customerServiceFeeAppliedOnceDownstream: true
  }
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlGpuRuntimeProtocolOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlGpuRuntimeProtocolAuthority
  readonly materializationReceiptRevalidated: true
  readonly materializationLeaseConsumedExactlyOnce: true
  readonly artifactPacketReadThroughProcessBoundPort: true
  readonly exactArtifactSlotsMatchedMaterialization: true
  readonly privateWireRequestLeaseCreated: true
  readonly canonicalToolIdentityRegistered: false
  readonly canonicalOperationRegistered: false
  readonly dispatchReady: false
  readonly gpuAttemptCreated: false
  readonly gpuResponseAccepted: false
  readonly actualAttemptCostEvidenceCreated: false
  readonly selectedSceneCreated: false
  readonly artifactCreated: false
  readonly containsPrivatePromptAliasPathUrlCredentialCommandOrBytes:
    false
  readonly containsPriceCreditServiceFeeReservationWalletOrLedgerData:
    false
  readonly subjectSpecificRouting: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlGpuRuntimeRequestReceipt
  extends LivingFrameControlledSdxlGpuRuntimeRequestReceiptDraft {
  readonly requestReceiptDigestSha256: string
}

export interface LivingFrameControlledSdxlGpuRuntimeProtocolIssue {
  readonly code:
    LivingFrameControlledSdxlGpuRuntimeProtocolIssueCode
  readonly path: string
}
