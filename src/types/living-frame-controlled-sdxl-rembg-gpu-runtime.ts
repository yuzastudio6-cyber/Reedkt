export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_VERSION =
  'living-frame-controlled-sdxl-rembg-gpu-runtime-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_RECEIPT_CLASS =
  'private_internal_generated_still_rembg_gpu_runtime_observation' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_EVIDENCE_CLASSES = [
  'controlled_non_promotable_generated_still_rembg_gpu_fixture',
  'private_internal_generated_still_rembg_gpu_observation_unreleased',
] as const

export type LivingFrameControlledSdxlRembgGpuRuntimeEvidenceClass =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_EVIDENCE_CLASSES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_TERMINAL_STATES = [
  'completed',
  'failed',
  'outcome_unknown',
] as const

export type LivingFrameControlledSdxlRembgGpuRuntimeTerminalState =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_TERMINAL_STATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_FAILURE_CODES = [
  'none',
  'host_unavailable',
  'host_rejected_request',
  'host_execution_failed',
  'host_execution_interrupted',
  'host_timeout',
  'host_outcome_unknown',
  'host_protocol_invalid',
  'model_mount_mismatch',
  'mask_output_missing',
  'mask_output_invalid',
] as const

export type LivingFrameControlledSdxlRembgGpuRuntimeFailureCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_FAILURE_CODES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_ISSUE_CODES = [
  'input_invalid',
  'input_binding_invalid',
  'source_reader_invalid',
  'source_reader_reused',
  'source_reader_failed',
  'source_packet_invalid',
  'source_lineage_invalid',
  'source_bytes_invalid',
  'canonical_dispatch_invalid',
  'canonical_dispatch_replay_forbidden',
  'canonical_operation_mismatch',
  'runtime_contract_invalid',
  'model_mount_port_invalid',
  'model_mount_binding_invalid',
  'host_port_invalid',
  'host_result_invalid',
  'mask_output_invalid',
  'unsafe_receipt_forbidden',
  'mask_lease_invalid',
  'mask_lease_reused',
  'alpha_source_lease_invalid',
  'alpha_source_lease_reused',
] as const

export type LivingFrameControlledSdxlRembgGpuRuntimeIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_ISSUE_CODES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_OPEN_GATES = [
  'canonical_rembg_generated_opaque_still_source_variant_admission_required',
  'canonical_rembg_generated_still_work_and_dependency_projection_required',
  'qualified_rembg_cuda_l4_runtime_image_required',
  'canonical_u2netp_read_only_model_mount_required',
  'canonical_cloud_dispatch_completion_and_resource_cost_evidence_required',
  'mask_artifact_commit_reconciliation_and_qa_required',
  'canonical_sharp_generated_still_alpha_source_variant_required',
  'sharp_true_alpha_artifact_commit_and_alpha_qa_required',
  'destination_continuity_fact_and_private_review_required',
] as const

export type LivingFrameControlledSdxlRembgGpuRuntimeOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_OPEN_GATES)[number]

export interface LivingFrameControlledSdxlRembgGpuRuntimeAuthority {
  readonly privateGeneratedStillRereadAuthority: true
  readonly namespacedRuntimeObservationAuthority: true
  readonly canonicalSourceVariantAuthority: false
  readonly canonicalDispatchAuthority: false
  readonly modelArtifactRepositoryAuthority: false
  readonly modelArtifactMountAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly selectedSceneAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly actualCostAuthority: false
  readonly customerPriceAuthority: false
  readonly customerCreditAuthority: false
  readonly serviceFeeAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly maskArtifactCommitAuthority: false
  readonly maskQaAuthority: false
  readonly alphaComponentAuthority: false
  readonly alphaQaAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledSdxlRembgGpuMaskOutput {
  readonly contentType: 'image/png'
  readonly encodingProfile: 'gray8_mask_png_v1'
  readonly widthPixels: 1024
  readonly heightPixels: 1024
  readonly outputCount: 1
  readonly byteLength: number
  readonly contentSha256: string
  readonly decodedMaskSha256: string
  readonly minimumMaskValue: number
  readonly maximumMaskValue: number
  readonly uniqueMaskValueCount: number
  readonly transparentPixelCount: number
  readonly partialPixelCount: number
  readonly opaquePixelCount: number
  readonly thresholdMaskValue: 128
  readonly foregroundPixelCountAtThreshold: number
  readonly sourceDimensionsPreserved: true
  readonly maskVariationObserved: true
  readonly outputBytesIncluded: false
}

export interface LivingFrameControlledSdxlRembgGpuRuntimeReceipt {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_SDXL_REMBG_GPU_RUNTIME_RECEIPT_CLASS
  readonly runtimeObservationId: string
  readonly evidenceClass:
    LivingFrameControlledSdxlRembgGpuRuntimeEvidenceClass
  readonly sourceBindings: {
    readonly rembgInputBindingId: string
    readonly rembgInputBindingDigestSha256: string
    readonly gpuOutputObservationId: string
    readonly gpuOutputObservationDigestSha256: string
    readonly generatedOpaqueSourceArtifactId: string
    readonly generatedOpaqueSourceContentSha256: string
    readonly generatedOpaqueDecodedRgbaSha256: string
    readonly outputFrameExpectationDigestSha256: string
    readonly sourceReaderBindingDigestSha256: string
    readonly canonicalDispatchConsumptionResponseHash: string
    readonly executionAttemptId: string
    readonly approvedPlanSnapshotId: string
    readonly expectedMaskAssetId: string
  }
  readonly operation: {
    readonly canonicalToolId: 'rembg'
    readonly operationId:
      'tool.rembg.remove_image_background.v1'
    readonly sourceVariant:
      'living_frame_generated_opaque_still_png'
    readonly sourceIsFfmpegExtractedFrame: false
    readonly executionTarget: 'google_cloud_run_gpu'
    readonly runtimeRegion: 'europe-west1'
    readonly accelerator: 'nvidia_l4'
    readonly gpuCount: 1
    readonly device: 'cuda'
    readonly modelId: 'u2netp'
    readonly outputMode: 'mask_only_png'
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
  }
  readonly runtimeContract: {
    readonly contractDigestSha256: string
    readonly sourceDigestSha256: string
    readonly rembgVersion: '2.0.76'
    readonly onnxRuntimeGpuVersion: '1.27.0'
    readonly exactFixedRunnerContractReused: true
  }
  readonly modelMountObservation: {
    readonly evidenceClass:
      | 'controlled_non_promotable_u2netp_mount_fixture'
      | 'private_internal_u2netp_mount_observation_unreleased'
    readonly slotId: 'rembg_u2netp_onnx'
    readonly artifactId: 'rembg-u2netp-onnx'
    readonly revision:
      'rembg-v0.0.0-u2netp-309c8469258d'
    readonly byteLength: 4_574_861
    readonly contentSha256:
      '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
    readonly consumerScope: 'rembg.private-inference'
    readonly readOnlyMountRequired: true
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
    readonly cpuFallbackAllowed: false
    readonly modelBytesIncluded: false
    readonly mountPathIncluded: false
    readonly bindingDigestSha256: string
  }
  readonly hostObservation: {
    readonly terminalState:
      LivingFrameControlledSdxlRembgGpuRuntimeTerminalState
    readonly failureCode:
      LivingFrameControlledSdxlRembgGpuRuntimeFailureCode
    readonly requestAccepted: boolean
    readonly modelInferenceExecuted: boolean
    readonly startedAt: string
    readonly finishedAt: string
    readonly elapsedMilliseconds: number
  }
  readonly maskOutput?: LivingFrameControlledSdxlRembgGpuMaskOutput
  readonly maskOutputLeaseIssued: boolean
  readonly alphaSourceLeaseIssued: boolean
  readonly costLineage: {
    readonly comfyuiGpuAttemptChargedAgain: false
    readonly rembgIsSeparateCanonicalToolAttempt: true
    readonly oneRuntimeInvocationRepresentsOneRembgAttempt: true
    readonly failedOrUnknownAttemptCostMustBeRetained: true
    readonly canonicalWorkerResourceCostEvidenceRequired: true
    readonly actualCostAmountIncluded: false
    readonly customerPriceOrCreditIncluded: false
    readonly serviceFeeIncluded: false
  }
  readonly generatedStillSourceVariantAdmittedInCanonicalSharedAuthority:
    false
  readonly outputArtifactPersisted: false
  readonly assetManifestUpdated: false
  readonly actualCostEvidenceCreated: false
  readonly customerChargeCreated: false
  readonly providerCallPerformed: false
  readonly externalNetworkPerformed: false
  readonly runtimeDownloadPerformed: false
  readonly callerPathUrlCredentialCommandOrBytesAccepted: false
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlRembgGpuRuntimeOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlRembgGpuRuntimeAuthority
  readonly productionReady: false
  readonly runtimeObservationDigestSha256: string
}

export interface LivingFrameControlledSdxlRembgGpuMaskLease {
  readonly leaseClass:
    'process_bound_single_use_unpersisted_rembg_gray8_mask_lease_v1'
  readonly leaseId: string
  readonly runtimeObservationDigestSha256: string
  readonly contentSha256: string
  readonly decodedMaskSha256: string
  readonly byteLength: number
  readonly widthPixels: 1024
  readonly heightPixels: 1024
  readonly callerSerializable: false
  readonly artifactPersistenceAuthority: false
  readonly maskQaAuthority: false
  readonly alphaAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlRembgAlphaSourceLease {
  readonly leaseClass:
    'process_bound_single_use_unpersisted_generated_still_alpha_source_lease_v1'
  readonly leaseId: string
  readonly runtimeObservationDigestSha256: string
  readonly sourceContentSha256: string
  readonly decodedRgbaSha256: string
  readonly byteLength: number
  readonly widthPixels: 1024
  readonly heightPixels: 1024
  readonly callerSerializable: false
  readonly artifactPersistenceAuthority: false
  readonly alphaAuthority: false
  readonly productionReady: false
}
