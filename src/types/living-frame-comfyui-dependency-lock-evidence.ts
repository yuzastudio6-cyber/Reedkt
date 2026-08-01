export const
LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_VERSION =
  'living-frame-comfyui-dependency-lock-evidence-v1' as const

export const
LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_CLASS =
  'controlled_non_promotable_offline_comfyui_dependency_lock_and_rebuild_evidence' as const

export const
LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_STATE =
  'exact_wheel_and_source_artifacts_rebuilt_offline_with_deterministic_cpu_prompt_probes_gpu_model_generation_required' as const

export const
LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OPEN_GATES = [
  'canonical_wheel_artifact_repository_admission_required',
  'canonical_source_archive_artifact_repository_admission_required',
  'canonical_image_rebuild_scan_and_signature_required',
  'gpu_qualified_cloud_run_operation_required',
  'canonical_read_only_model_artifact_mount_required',
  'generic_ipadapter_model_compatibility_benchmark_required',
  'controlnet_image_adherence_benchmark_required',
  'runtime_node_allow_deny_enforcement_required',
  'security_license_and_performance_qa_required',
  'selected_scene_snapshot_and_dispatch_admission_required',
  'canonical_work_asset_qa_and_private_review_required',
] as const

export type LivingFrameComfyUiDependencyLockOpenGate =
  (typeof
    LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_OPEN_GATES)[number]

export const
LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_ISSUES = [
  'input_invalid',
  'reader_invalid',
  'reader_reused',
  'reader_failed',
  'observation_invalid',
  'base_image_mismatch',
  'wheel_count_mismatch',
  'wheel_order_mismatch',
  'wheel_artifact_mismatch',
  'wheel_manifest_digest_mismatch',
  'wheel_total_byte_length_mismatch',
  'source_archive_count_mismatch',
  'source_archive_order_mismatch',
  'source_archive_mismatch',
  'offline_build_mismatch',
  'runtime_inventory_mismatch',
  'node_schema_mismatch',
  'prompt_probe_count_mismatch',
  'prompt_probe_order_mismatch',
  'prompt_probe_mismatch',
  'authority_promotion_forbidden',
  'unsafe_payload_forbidden',
  'digest_mismatch',
] as const

export type LivingFrameComfyUiDependencyLockIssueCode =
  (typeof LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_ISSUES)[number]

export interface LivingFrameComfyUiLockedWheelArtifact {
  readonly order: number
  readonly distributionName: string
  readonly version: string
  readonly artifactFileName: string
  readonly byteLength: number
  readonly sha256: string
}

export interface LivingFrameComfyUiLockedSourceArchive {
  readonly order: number
  readonly sourceCode:
    | 'comfyui_host'
    | 'generic_ipadapter_extension'
    | 'controlnet_aux_extension'
  readonly repositoryRevision: string
  readonly repositoryTree: string
  readonly archiveFileCount: number
  readonly archiveByteLength: number
  readonly archiveSha256: string
}

export interface LivingFrameComfyUiDeterministicPromptProbe {
  readonly order: number
  readonly probeCode:
    | 'stock_empty_image'
    | 'binary_preprocessor'
    | 'canny_preprocessor'
    | 'color_preprocessor'
    | 'lineart_preprocessor'
  readonly outputWidthPixels: 64
  readonly outputHeightPixels: 64
  readonly outputPngByteLength: number
  readonly outputPngSha256: string
  readonly outputRgbaPixelSha256: string
  readonly repeatedPngDigestMatched: true
  readonly repeatedPixelDigestMatched: true
}

export interface LivingFrameComfyUiDependencyLockAuthority {
  readonly controlledDependencyEvidenceAuthority: true
  readonly offlineRebuildObservationAuthority: true
  readonly liveEvidenceAuthority: false
  readonly canonicalRuntimeHostAuthority: false
  readonly canonicalImageAuthority: false
  readonly canonicalArtifactRepositoryAuthority: false
  readonly modelArtifactAuthority: false
  readonly gpuExecutionAuthority: false
  readonly providerAuthority: false
  readonly modelAuthority: false
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

export interface LivingFrameComfyUiDependencyLockEvidenceDraft {
  readonly contractVersion:
    typeof
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_VERSION
  readonly evidenceClass:
    typeof
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_CLASS
  readonly evidenceId: string
  readonly evidenceState:
    typeof
      LIVING_FRAME_COMFYUI_DEPENDENCY_LOCK_EVIDENCE_STATE
  readonly targetPlatform: {
    readonly operatingSystem: 'linux'
    readonly architecture: 'amd64'
    readonly distribution: 'ubuntu_22_04'
    readonly pythonVersion: '3.10.12'
    readonly cudaRuntimeFamily: '12.4'
  }
  readonly baseImage: {
    readonly controlledBaseImageDigestSha256: string
    readonly baseImageCanonicalOrSigned: false
  }
  readonly wheelLock: {
    readonly wheelArtifactCount: 35
    readonly wheelArtifactTotalByteLength: 486_459_097
    readonly wheelManifestDigestSha256: string
    readonly artifacts:
      readonly LivingFrameComfyUiLockedWheelArtifact[]
    readonly installNetworkMode: 'none'
    readonly installIndexMode: 'no_index'
    readonly dependencyResolutionMode: 'no_deps'
  }
  readonly sourceLock: {
    readonly sourceArchiveCount: 3
    readonly archives:
      readonly LivingFrameComfyUiLockedSourceArchive[]
  }
  readonly controlledOfflineBuild: {
    readonly candidateImageDigestSha256: string
    readonly candidateImageByteLength: 11_871_727_486
    readonly rootFilesystemLayerCount: 28
    readonly buildNetworkMode: 'none'
    readonly sourceArchivesCopiedWithoutRepositoryMetadata: true
    readonly wheelArtifactsInstalledWithoutIndexOrDependencyResolution:
      true
    readonly imageBuiltScannedOrSigned: false
  }
  readonly controlledRuntimeProbe: {
    readonly runtimeClass:
      'temporary_controlled_cpu_emulation_without_model_generation'
    readonly pythonFreezeLineCount: 168
    readonly pythonFreezeByteLength: 9_199
    readonly pythonFreezeDigestSha256: string
    readonly objectInfoNodeClassCount: 920
    readonly objectInfoNodeClassSetDigestSha256: string
    readonly selectedNodeSchemaCount: 12
    readonly selectedNodeSchemaDigestSha256: string
    readonly selectedNodeClasses:
      readonly string[]
    readonly deterministicInputPngDigestSha256: string
    readonly deterministicPromptProbeCount: 5
    readonly deterministicPromptProbes:
      readonly LivingFrameComfyUiDeterministicPromptProbe[]
    readonly allSelectedNodeSchemasPresent: true
    readonly fullExtensionNodeSurfaceProductionQualified: false
    readonly genericFaceIdentityNodesAdmitted: false
    readonly modelGenerationExecuted: false
    readonly gpuExecutionObserved: false
  }
  readonly openGateCodes:
    readonly LivingFrameComfyUiDependencyLockOpenGate[]
  readonly authorityBoundary:
    LivingFrameComfyUiDependencyLockAuthority
  readonly processBoundSingleUseReaderConsumed: true
  readonly exactWheelArtifactsObserved: true
  readonly exactSourceArchivesObserved: true
  readonly offlineRebuildObserved: true
  readonly deterministicCpuPromptProbesObserved: true
  readonly containsUrlPathCredentialSecretRawBytesOrExecutableCode:
    false
  readonly providerTransportCalled: false
  readonly canonicalOperationDispatched: false
  readonly selectedSceneCreated: false
  readonly artifactPersistedToCanonicalRepository: false
  readonly productionReady: false
}

export interface LivingFrameComfyUiDependencyLockEvidence
  extends LivingFrameComfyUiDependencyLockEvidenceDraft {
  readonly evidenceDigestSha256: string
}

export interface LivingFrameComfyUiDependencyLockIssue {
  readonly code:
    LivingFrameComfyUiDependencyLockIssueCode
  readonly path: string
}

export type LivingFrameComfyUiDependencyLockValidationResult =
  | {
      readonly ok: true
      readonly evidence:
        LivingFrameComfyUiDependencyLockEvidence
    }
  | {
      readonly ok: false
      readonly issues:
        readonly LivingFrameComfyUiDependencyLockIssue[]
    }
