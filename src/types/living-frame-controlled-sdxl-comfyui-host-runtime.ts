export const
LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_VERSION =
  'living-frame-controlled-sdxl-comfyui-host-runtime-v1' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_RECEIPT_CLASS =
  'private_internal_subject_neutral_comfyui_host_runtime_observation' as const

export const
LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_EVIDENCE_CLASSES = [
  'controlled_non_promotable_comfyui_host_runtime_fixture',
  'private_internal_comfyui_host_runtime_observation_unreleased',
] as const

export type LivingFrameControlledSdxlComfyUiHostRuntimeEvidenceClass =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_EVIDENCE_CLASSES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_TERMINAL_STATES = [
  'completed',
  'failed',
  'outcome_unknown',
] as const

export type LivingFrameControlledSdxlComfyUiHostRuntimeTerminalState =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_TERMINAL_STATES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_FAILURE_CODES = [
  'none',
  'host_connection_failed',
  'host_prompt_rejected',
  'host_execution_failed',
  'host_execution_interrupted',
  'host_connection_closed',
  'host_timeout',
  'host_protocol_invalid',
  'output_count_invalid',
  'output_png_invalid',
  'output_dimensions_invalid',
  'output_size_invalid',
] as const

export type LivingFrameControlledSdxlComfyUiHostRuntimeFailureCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_FAILURE_CODES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_ISSUE_CODES = [
  'canonical_dispatch_invalid',
  'canonical_dispatch_replay_forbidden',
  'canonical_operation_mismatch',
  'private_wire_request_invalid',
  'host_port_invalid',
  'legacy_private_loopback_forbidden',
  'canonical_model_mount_session_required',
  'host_execution_result_invalid',
  'output_image_invalid',
  'unsafe_receipt_forbidden',
] as const

export type LivingFrameControlledSdxlComfyUiHostRuntimeIssueCode =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_ISSUE_CODES)[number]

export const
LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_OPEN_GATES = [
  'canonical_comfyui_tool_operation_registry_admission_required',
  'qualified_comfyui_gpu_worker_image_required',
  'canonical_model_mount_backend_adapter_and_qualification_required',
  'real_gpu_execution_and_resource_usage_evidence_required',
  'output_artifact_persistence_and_manifest_binding_required',
  'opaque_to_alpha_pipeline_and_qa_required_when_transparency_is_requested',
  'end_to_end_scene_runtime_private_review_and_release_required',
] as const

export type LivingFrameControlledSdxlComfyUiHostRuntimeOpenGate =
  (typeof
    LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_OPEN_GATES)[number]

export interface LivingFrameControlledSdxlComfyUiHostRuntimeAuthority {
  readonly canonicalDispatchAuthority: false
  readonly workerLeaseAuthority: false
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
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly alphaAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameControlledSdxlComfyUiHostRuntimeOutput {
  readonly contentType: 'image/png'
  readonly widthPixels: 1024
  readonly heightPixels: 1024
  readonly imageCount: 1
  readonly outputByteLength: number
  readonly outputContentSha256: string
  readonly opaqueGenerationOutputOnly: true
  readonly transparentBackgroundClaimAccepted: false
  readonly trueAlphaArtifactCreated: false
  readonly outputBytesIncluded: false
}

export interface LivingFrameControlledSdxlComfyUiHostRuntimeReceipt {
  readonly contractVersion:
    typeof LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_VERSION
  readonly resultClass:
    typeof LIVING_FRAME_CONTROLLED_SDXL_COMFYUI_HOST_RUNTIME_RECEIPT_CLASS
  readonly runtimeObservationId: string
  readonly evidenceClass:
    LivingFrameControlledSdxlComfyUiHostRuntimeEvidenceClass
  readonly sourceBindings: {
    readonly gpuRuntimeRequestReceiptDigestSha256: string
    readonly canonicalDispatchConsumptionResponseHash: string
    readonly executionAttemptId: string
    readonly expectedAssetId: string
    readonly approvedPlanSnapshotId: string
  }
  readonly modelMountObservation:
    | {
        readonly mode: 'controlled_fixture_unmounted'
        readonly atomicCanonicalMountSessionObserved: false
        readonly requiredArtifactCount: 0
        readonly hostPathIncluded: false
        readonly mountAliasIncluded: false
        readonly modelBytesIncluded: false
      }
    | {
        readonly mode: 'atomic_canonical_mount_session'
        readonly atomicCanonicalMountSessionObserved: true
        readonly requiredArtifactCount: 5
        readonly canonicalMountSessionDigestSha256: string
        readonly modelBindingPacketDigestSha256: string
        readonly processLifecycleReceiptDigestSha256: string
        readonly everyObjectVerifiedBeforeAndAfterInference: true
        readonly processStartedAndStoppedInsideSession: true
        readonly hostPathIncluded: false
        readonly mountAliasIncluded: false
        readonly modelBytesIncluded: false
      }
  readonly operation: {
    readonly canonicalToolId: 'comfyui'
    readonly operationId:
      'tool.comfyui.generate_controlled_image.v1'
    readonly fiveGpuCapabilitiesShareOneAttempt: true
    readonly separateAuraFaceCpuQaExcluded: true
  }
  readonly hostObservation: {
    readonly terminalState:
      LivingFrameControlledSdxlComfyUiHostRuntimeTerminalState
    readonly failureCode:
      LivingFrameControlledSdxlComfyUiHostRuntimeFailureCode
    readonly promptAccepted: boolean
    readonly modelInferenceExecuted: boolean
    readonly startedAt: string
    readonly finishedAt: string
    readonly elapsedMilliseconds: number
    readonly privatePromptIdDigestSha256?: string
    readonly privatePromptIdIncluded: false
  }
  readonly output?: LivingFrameControlledSdxlComfyUiHostRuntimeOutput
  readonly outputLeaseIssued: boolean
  readonly outputArtifactPersisted: false
  readonly assetManifestUpdated: false
  readonly actualCostEvidenceCreated: false
  readonly customerChargeCreated: false
  readonly providerCallPerformed: false
  readonly externalNetworkPerformed: false
  readonly runtimeDownloadPerformed: false
  readonly callerEndpointAccepted: false
  readonly callerPathUrlCredentialCommandOrBytesAccepted: false
  readonly openGateCodes:
    readonly LivingFrameControlledSdxlComfyUiHostRuntimeOpenGate[]
  readonly authorityBoundary:
    LivingFrameControlledSdxlComfyUiHostRuntimeAuthority
  readonly productionReady: false
  readonly runtimeObservationDigestSha256: string
}

export interface LivingFrameControlledSdxlComfyUiOutputLease {
  readonly leaseClass:
    'process_bound_single_use_unpersisted_comfyui_png_output_lease_v1'
  readonly leaseId: string
  readonly runtimeObservationDigestSha256: string
  readonly outputContentSha256: string
  readonly outputByteLength: number
  readonly callerSerializable: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly alphaAuthority: false
  readonly productionReady: false
}
