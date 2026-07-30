import type {
  LivingFramePublishedGpuPackageArtifact,
} from './living-frame-shared-gpu-parent-hardened-package-matrix-candidate'

export const
LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_VERSION =
  'living-frame-shared-gpu-parent-hardened-core-package-cache-evidence-v1' as const

export const
LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_CLASS =
  'private_local_exact_package_bytes_observation' as const

export const
LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_STATUS =
  'exact_core_artifacts_cached_mutable_host_cache_not_install_admitted' as const

export const
LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_OPEN_GATES = [
  'canonical_private_package_repository_ingest_required',
  'atomic_read_only_mount_and_post_consumer_rehash_required',
  'complete_hash_locked_offline_dependency_closure_required',
  'hardened_parent_build_and_complete_scan_required',
  'sam2_and_comfyui_compatibility_regression_required',
  'real_l4_runtime_evidence_required',
] as const

export interface LivingFrameCachedGpuPackageArtifact
  extends LivingFramePublishedGpuPackageArtifact {
  readonly archiveIntegrityVerified: true
  readonly embeddedMetadataDigestVerified: true
  readonly wheelTags: readonly string[]
  readonly hostReadOnlyModeVerified: false
}

export interface LivingFrameSharedGpuParentHardenedCorePackageCacheObservation {
  readonly observedAt: '2026-07-30'
  readonly matrix: {
    readonly sourceCommit:
      'fe94fda0ddb0e50f7d28123b40bab45328174d2b'
    readonly contractVersion:
      'living-frame-shared-gpu-parent-hardened-package-matrix-candidate-v1'
    readonly observationDigestSha256: string
  }
  readonly cache: {
    readonly privateLocalOnly: true
    readonly pathSerialized: false
    readonly hostFilesystemReadOnlyModeVerified: false
    readonly consumerMustRehashBeforeAndAfterUse: true
    readonly canonicalRepositoryIngested: false
    readonly atomicReadOnlyMountVerified: false
  }
  readonly artifacts: readonly LivingFrameCachedGpuPackageArtifact[]
  readonly artifactCount: 4
  readonly totalByteLength: 1_178_861_927
}

export interface LivingFrameSharedGpuParentHardenedCorePackageCacheEvidence {
  readonly contractVersion:
    typeof LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_VERSION
  readonly evidenceClass:
    typeof LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_CLASS
  readonly status:
    typeof LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_EVIDENCE_STATUS
  readonly evidenceId: string
  readonly evidenceDigestSha256: string
  readonly observationDigestSha256: string
  readonly matrixObservationDigestSha256: string
  readonly artifactCount: 4
  readonly totalByteLength: 1_178_861_927
  readonly artifactDigestsSha256: readonly string[]
  readonly archiveIntegrityVerified: true
  readonly embeddedMetadataDigestsVerified: true
  readonly hostFilesystemReadOnlyModeVerified: false
  readonly consumerMustRehashBeforeAndAfterUse: true
  readonly canonicalRepositoryIngested: false
  readonly atomicReadOnlyMountVerified: false
  readonly completeOfflineClosure: false
  readonly packageInstalled: false
  readonly imageBuilt: false
  readonly imageScanned: false
  readonly gpuAttemptCreated: false
  readonly runtimeExecuted: false
  readonly operationRegistered: false
  readonly dispatchGranted: false
  readonly assetCreated: false
  readonly actualCostReceiptCreated: false
  readonly customerChargeCreated: false
  readonly publicDeliveryCreated: false
  readonly productionReady: false
  readonly openGateCodes:
    typeof LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_CORE_PACKAGE_CACHE_OPEN_GATES
}
