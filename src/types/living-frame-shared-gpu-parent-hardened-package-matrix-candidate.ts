export const
LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_VERSION =
  'living-frame-shared-gpu-parent-hardened-package-matrix-candidate-v1' as const

export const
LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_CLASS =
  'private_internal_non_executable_hardening_input' as const

export const
LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_STATUS =
  'official_package_matrix_observed_not_build_admitted' as const

export const
LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_OPEN_GATES = [
  'complete_hash_locked_offline_dependency_closure_required',
  'hardened_parent_build_required',
  'complete_linux_image_scan_required',
  'sam2_checkpoint_and_inference_regression_required',
  'comfyui_five_model_graph_regression_required',
  'real_l4_resource_and_output_evidence_required',
] as const

export interface LivingFramePublishedGpuPackageArtifact {
  readonly role:
    | 'torch'
    | 'torchvision'
    | 'triton'
    | 'nvidia_cusparselt'
  readonly version: string
  readonly fileName: string
  readonly byteLength: number
  readonly sha256: string
  readonly metadataSha256: string
  readonly source:
    | 'official_pytorch_wheel_index'
    | 'official_python_package_index'
}

export interface LivingFrameSharedGpuParentHardenedPackageMatrixObservation {
  readonly observedAt: '2026-07-30'
  readonly target: {
    readonly platform: 'linux/amd64'
    readonly pythonVersion: '3.10'
    readonly pythonTag: 'cp310-cp310'
    readonly cudaBuild: '12.4'
  }
  readonly currentParent: {
    readonly digestSha256: string
    readonly torchVersion: '2.5.1+cu124'
    readonly torchvisionVersion: '0.20.1+cu124'
    readonly tritonVersion: '3.1.0'
    readonly cusparseLtMetadataPresent: false
  }
  readonly publishedArtifacts:
    readonly LivingFramePublishedGpuPackageArtifact[]
  readonly retainedCudaVersions: {
    readonly cudaNvrtc: '12.4.127'
    readonly cudaRuntime: '12.4.127'
    readonly cudaCupti: '12.4.127'
    readonly cudnn: '9.1.0.70'
    readonly cublas: '12.4.5.8'
    readonly cufft: '11.2.1.3'
    readonly curand: '10.3.5.147'
    readonly cusolver: '11.6.1.9'
    readonly cusparse: '12.3.1.170'
    readonly nccl: '2.21.5'
    readonly nvtx: '12.4.127'
    readonly nvjitlink: '12.4.127'
    readonly sympy: '1.13.1'
  }
  readonly compatibilityChanges: {
    readonly torchLoadWeightsOnlyDefaultChanged: true
    readonly sam2CheckpointRegressionRequired: true
    readonly comfyUiCheckpointRegressionRequired: true
    readonly comfyUiCustomNodeRegressionRequired: true
  }
  readonly unresolvedSecurityPackages: readonly [
    'pillow',
    'transformers',
    'setuptools_system_metadata',
    'wheel_system_metadata',
  ]
}

export interface LivingFrameSharedGpuParentHardenedPackageMatrixCandidate {
  readonly contractVersion:
    typeof LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_VERSION
  readonly candidateClass:
    typeof LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_CLASS
  readonly status:
    typeof LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_CANDIDATE_STATUS
  readonly candidateId: string
  readonly candidateDigestSha256: string
  readonly observationDigestSha256: string
  readonly currentParentDigestSha256: string
  readonly targetPlatform: 'linux/amd64'
  readonly targetPythonTag: 'cp310-cp310'
  readonly targetCudaBuild: '12.4'
  readonly candidateTorchVersion: '2.6.0+cu124'
  readonly candidateTorchVisionVersion: '0.21.0+cu124'
  readonly candidateTritonVersion: '3.2.0'
  readonly requiredCusparseLtVersion: '0.6.2'
  readonly publishedArtifactCount: 4
  readonly publishedArtifactByteLength: 1_178_861_927
  readonly publishedArtifacts:
    readonly LivingFramePublishedGpuPackageArtifact[]
  readonly completeOfflineClosure: false
  readonly currentParentHardened: false
  readonly sam2CompatibilityProven: false
  readonly comfyUiCompatibilityProven: false
  readonly openGateCodes:
    typeof LIVING_FRAME_SHARED_GPU_PARENT_HARDENED_PACKAGE_MATRIX_OPEN_GATES
  readonly packageDownloaded: false
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
}
