export const
LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_VERSION =
  'living-frame-comfyui-five-model-local-mount-evidence-v1' as const

export const
LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_CLASS =
  'private_internal_exact_five_model_atomic_read_only_mount_and_cuda_refusal_observation' as const

export const
LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_STATE =
  'controlled_non_promotable_local_model_mount_passed' as const

export const
LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_OPEN_GATES = [
  'clean_canonical_comfyui_cuda_image_build_required',
  'canonical_image_signature_scan_and_attestation_required',
  'canonical_distributed_five_model_mount_required',
  'current_comfyui_node_schema_revalidation_required',
  'exact_five_model_bundle_load_fixture_required',
  'real_l4_cuda_generation_and_resource_evidence_required',
  'private_output_persistence_qa_and_review_required',
  'canonical_operation_dispatch_and_cost_admission_required',
] as const

export type LivingFrameComfyUiFiveModelRole =
  | 'base_checkpoint'
  | 'controlnet_checkpoint'
  | 'lora_adapter'
  | 'generic_ipadapter_checkpoint'
  | 'clip_vision_checkpoint'

export interface LivingFrameComfyUiFiveModelLocalMountArtifact {
  readonly canonicalOrder: number
  readonly role: LivingFrameComfyUiFiveModelRole
  readonly byteLength: number
  readonly contentSha256: string
  readonly readOnlyMountObserved: true
}

export interface LivingFrameComfyUiFiveModelLocalMountObservation {
  readonly observationClass:
    'process_bound_local_comfyui_five_model_mount_observation_v1'
  readonly parentImageDigestSha256: string
  readonly derivedImageDigestSha256: string
  readonly entrypointSourceDigestSha256: string
  readonly fixedLaunchSpecDigestSha256: string
  readonly environmentDigestSha256: string
  readonly operatingSystem: 'linux'
  readonly architecture: 'amd64'
  readonly localArchitectureEmulationUsed: true
  readonly defaultUid: 65_532
  readonly defaultGid: 65_532
  readonly defaultEntrypointObserved: true
  readonly callerArgumentRejectionObserved: true
  readonly rootIdentityOverrideRejectionObserved: true
  readonly injectedCallerEnvironmentScrubbed: true
  readonly rootFilesystemReadOnlyObserved: true
  readonly allLinuxCapabilitiesDropped: true
  readonly noNewPrivilegesObserved: true
  readonly externalNetworkDisabled: true
  readonly runtimeDownloadsAllowed: false
  readonly ephemeralWriteRootOnly: true
  readonly processLimit: 256
  readonly cpuLimit: 2
  readonly memoryLimitBytes: 4_294_967_296
  readonly modelArtifactCount: 5
  readonly aggregateByteLength: 11_700_367_157
  readonly modelArtifacts:
    readonly LivingFrameComfyUiFiveModelLocalMountArtifact[]
  readonly bundleDigestSha256: string
  readonly atomicFiveModelMountLifetimeObserved: true
  readonly modelMountsReadOnlyObserved: true
  readonly sam2ImportBlocked: true
  readonly torchVersion: '2.5.1+cu124'
  readonly torchvisionVersion: '0.20.1+cu124'
  readonly cudaAvailable: false
  readonly cudaDeviceCount: 0
  readonly promptSubmitted: false
  readonly modelInferenceExecuted: false
  readonly gpuExecutionPerformed: false
  readonly outputArtifactCreated: false
  readonly startedAt: string
  readonly completedAt: string
  readonly elapsedMilliseconds: number
  readonly exitCode: 78
  readonly canonicalOperationDispatched: false
  readonly sensitiveDetailsIncluded: false
}

export interface LivingFrameComfyUiFiveModelLocalMountAuthority {
  readonly localCandidateBuildObservationAuthority: true
  readonly localExactModelByteObservationAuthority: true
  readonly localAtomicReadOnlyMountObservationAuthority: true
  readonly localCudaRefusalObservationAuthority: true
  readonly canonicalImageAuthority: false
  readonly canonicalArtifactRepositoryAuthority: false
  readonly distributedMountAuthority: false
  readonly modelLoadAuthority: false
  readonly gpuExecutionAuthority: false
  readonly modelInferenceAuthority: false
  readonly providerAuthority: false
  readonly toolRegistryAuthority: false
  readonly operationRegistryAuthority: false
  readonly dispatchAuthority: false
  readonly selectedSceneAuthority: false
  readonly promptAuthority: false
  readonly timingAuthority: false
  readonly soundAuthority: false
  readonly estimateAuthority: false
  readonly costAuthority: false
  readonly customerCreditAuthority: false
  readonly approvalAuthority: false
  readonly snapshotAuthority: false
  readonly workItemAuthority: false
  readonly workGraphAuthority: false
  readonly queueAuthority: false
  readonly artifactPersistenceAuthority: false
  readonly assetManifestAuthority: false
  readonly qaApprovalAuthority: false
  readonly renderAuthority: false
  readonly runtimeReleaseAuthority: false
  readonly publicDeliveryAuthority: false
  readonly productionAuthority: false
}

export interface LivingFrameComfyUiFiveModelLocalMountEvidenceDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_VERSION
  readonly evidenceClass:
    typeof
      LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_CLASS
  readonly evidenceState:
    typeof
      LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_EVIDENCE_STATE
  readonly evidenceId: string
  readonly image: {
    readonly parentImageDigestSha256: string
    readonly derivedImageDigestSha256: string
    readonly entrypointSourceDigestSha256: string
    readonly fixedLaunchSpecDigestSha256: string
    readonly operatingSystem: 'linux'
    readonly architecture: 'amd64'
    readonly localImageOnly: true
    readonly canonicalImageRepositoryAdmissionPresent: false
    readonly imageSignatureVerified: false
    readonly vulnerabilityScanCompleted: false
    readonly provenanceAttestationVerified: false
  }
  readonly confinement: {
    readonly defaultUid: 65_532
    readonly defaultGid: 65_532
    readonly defaultEntrypointObserved: true
    readonly callerArgumentRejectionObserved: true
    readonly rootIdentityOverrideRejectionObserved: true
    readonly injectedCallerEnvironmentScrubbed: true
    readonly environmentDigestSha256: string
    readonly rootFilesystemReadOnlyObserved: true
    readonly allLinuxCapabilitiesDropped: true
    readonly noNewPrivilegesObserved: true
    readonly externalNetworkDisabled: true
    readonly runtimeDownloadsAllowed: false
    readonly ephemeralWriteRootOnly: true
    readonly processLimit: 256
    readonly cpuLimit: 2
    readonly memoryLimitBytes: 4_294_967_296
  }
  readonly modelMount: {
    readonly modelArtifactCount: 5
    readonly aggregateByteLength: 11_700_367_157
    readonly modelArtifacts:
      readonly LivingFrameComfyUiFiveModelLocalMountArtifact[]
    readonly bundleDigestSha256: string
    readonly atomicFiveModelMountLifetimeObserved: true
    readonly modelMountsReadOnlyObserved: true
    readonly sam2ImportBlocked: true
  }
  readonly runtime: {
    readonly torchVersion: '2.5.1+cu124'
    readonly torchvisionVersion: '0.20.1+cu124'
    readonly cpuEmulationOnly: true
    readonly localArchitectureEmulationUsed: true
    readonly cudaAvailable: false
    readonly cudaDeviceCount: 0
    readonly promptSubmitted: false
    readonly modelInferenceExecuted: false
    readonly gpuExecutionPerformed: false
    readonly outputArtifactCreated: false
    readonly startedAt: string
    readonly completedAt: string
    readonly elapsedMilliseconds: number
    readonly exitCode: 78
  }
  readonly authorityBoundary:
    LivingFrameComfyUiFiveModelLocalMountAuthority
  readonly openGateCodes:
    readonly (typeof
      LIVING_FRAME_COMFYUI_FIVE_MODEL_LOCAL_MOUNT_OPEN_GATES)[number][]
  readonly canonicalOperationDispatched: false
  readonly actualCostEvidenceCreated: false
  readonly customerChargeCreated: false
  readonly artifactPersisted: false
  readonly publicDeliveryCreated: false
  readonly productionReady: false
}

export interface LivingFrameComfyUiFiveModelLocalMountEvidence
  extends LivingFrameComfyUiFiveModelLocalMountEvidenceDraft {
  readonly evidenceDigestSha256: string
}

export interface LivingFrameComfyUiFiveModelLocalMountIssue {
  readonly code:
    | 'input_invalid'
    | 'observation_port_invalid'
    | 'observation_port_reused'
    | 'observation_failed'
    | 'observation_invalid'
    | 'evidence_semantics_invalid'
  readonly path: string
}
