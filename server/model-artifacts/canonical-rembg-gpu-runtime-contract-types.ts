export const CANONICAL_REMBG_GPU_RUNTIME_CONTRACT_VERSION =
  'canonical-rembg-gpu-runtime-contract-v1' as const

export interface CanonicalRembgGpuRuntimeSourceFile {
  readonly relativePath: string
  readonly byteLength: number
  readonly contentSha256: string
}

export interface CanonicalRembgGpuRuntimePackage {
  readonly canonicalOrder: number
  readonly packageName: string
  readonly version: string
  readonly wheelSha256: string
}

export interface CanonicalRembgGpuRuntimeContract {
  readonly contractVersion:
    typeof CANONICAL_REMBG_GPU_RUNTIME_CONTRACT_VERSION
  readonly contractClass:
    'source_verified_cuda_only_shared_gpu_worker_operation_contract'
  readonly operationIdentity: {
    readonly approvedToolId: 'rembg'
    readonly operationId:
      'tool.rembg.remove_image_background.v1'
    readonly sharedWorkerType: 'gpu_ai_worker'
    readonly existingToolIdentityReused: true
    readonly registryMutationAuthorized: false
    readonly productionToolRegistryCount: 50
  }
  readonly runtimeImage: {
    readonly baseImage:
      'nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04'
    readonly baseImageIndexDigest:
      'sha256:fa44193567d1908f7ca1f3abf8623ce9c63bc8cba7bcfdb32702eb04d326f7a8'
    readonly linuxAmd64ManifestDigest:
      'sha256:edc99e084ef003e1e6f180dbe2e9f64496c61254cb109c09060532c2d3b61d75'
    readonly platform: 'linux/amd64'
    readonly cudaVersion: '12.3.2'
    readonly cudnnMajor: 9
    readonly pythonVersion: '3.11.14'
    readonly pythonSourceByteLength: 26_561_042
    readonly pythonSourceSha256:
      '563d2a1b2a5ba5d5409b5ecd05a0e1bf9b028cf3e6a6f0c87a5dc8dc3f2d9182'
    readonly pythonBuiltFromPinnedSource: true
    readonly cudaMinorVersionCompatibilityRequired: true
    readonly cudaForwardCompatibilityPackageRequired: false
  }
  readonly cloudRunGpuPolicy: {
    readonly accelerator: 'nvidia_l4'
    readonly gpuCount: 1
    readonly minimumCpu: 4
    readonly minimumMemory: '16Gi'
    readonly noGpuZonalRedundancy: true
    readonly taskCount: 1
    readonly parallelism: 1
    readonly internalRetries: 0
    readonly admittedExistingRegion: 'europe-west1'
    readonly blockedExistingRegion: 'us-east1'
    readonly crossRegionTransferAllowed: false
    readonly usGpuRegionAuthorityMigrationRequired: true
  }
  readonly packageIdentity: {
    readonly rembgVersion: '2.0.76'
    readonly rembgSourceRevision:
      '98f3a9fa5397f03a3101cbdb0c7d7b51f4e95bbb'
    readonly onnxRuntimeGpuVersion: '1.27.0'
    readonly numpyVersion: '2.4.6'
    readonly pillowVersion: '12.3.0'
    readonly packageCount: 29
    readonly packages:
      readonly CanonicalRembgGpuRuntimePackage[]
    readonly requirementsLockSha256: string
  }
  readonly fixedFileLayout: {
    readonly sourceFramePath:
      '/mnt/reeditpro/private-input/source-frame.png'
    readonly modelDirectory:
      '/mnt/reeditpro/model-artifacts/rembg-u2netp'
    readonly privateOutputDirectory:
      '/mnt/reeditpro/private-output'
    readonly modelFiles: readonly [
      {
        readonly canonicalOrder: 0
        readonly slotId: 'rembg_u2netp_onnx'
        readonly fileName: 'u2netp.onnx'
        readonly byteLength: 4_574_861
        readonly contentSha256:
          '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8'
      },
    ]
    readonly callerPathsAccepted: false
    readonly callerUrlsAccepted: false
    readonly callerBytesAccepted: false
  }
  readonly runtimeProtocol: {
    readonly requestVersion:
      'canonical-rembg-gpu-runtime-request-v1'
    readonly responseVersion:
      'canonical-rembg-gpu-runtime-response-v1'
    readonly maximumRequestBytes: 65_536
    readonly maximumSourceFrameBytes: 16_777_216
    readonly maximumSourceDimension: 4_096
    readonly maximumSourcePixels: 16_777_216
    readonly maximumMaskOutputBytes: 16_777_216
    readonly sourceFrameFormat: 'opaque_rgba_png'
    readonly outputMaskFormat: 'gray8_mask_png'
    readonly device: 'cuda'
    readonly executionProvider: 'CUDAExecutionProvider'
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
    readonly customerArtifactFiles: readonly ['mask.png']
    readonly processEvidenceFiles: readonly [
      'mask-analysis.json',
      'mask-qa-measurement.json',
    ]
    readonly outputBytesReturnedInReceipt: false
  }
  readonly sourceFiles: readonly [
    CanonicalRembgGpuRuntimeSourceFile,
    CanonicalRembgGpuRuntimeSourceFile,
    CanonicalRembgGpuRuntimeSourceFile,
  ]
  readonly summary: {
    readonly exactLinuxAmd64BaseDigestPinned: true
    readonly exactPythonSourcePinned: true
    readonly exactDependencyLockDeclared: true
    readonly fixedServerOwnedFileLayoutDeclared: true
    readonly cudaOnlyPreflightImplemented: true
    readonly cpuExecutionProviderFallbackDisabled: true
    readonly localModelOnlyImplemented: true
    readonly boundedPrivateMaskOutputImplemented: true
    readonly digestOnlyReceiptImplemented: true
    readonly exactFiftyToolRegistryPreserved: true
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly sourceContractVerified: true
    readonly runnerSourceImplemented: true
    readonly packageDependencyLockVerified: true
    readonly runtimeImageBuilt: false
    readonly runtimeImageQualified: false
    readonly cloudRunL4ContainerStarted: false
    readonly cloudRunL4CudaCompatibilityVerified: false
    readonly onnxRuntimeCudaProviderLoadVerified: false
    readonly u2netpInferenceVerified: false
    readonly approvedPackageRereadRequired: true
    readonly approvedSnapshotRereadRequired: true
    readonly workerLeaseRereadRequired: true
    readonly modelArtifactBundleRereadRequired: true
    readonly privateSourceFrameArtifactRereadRequired: true
    readonly outputArtifactCommitVerified: false
    readonly maskEdgeQualityQaVerified: false
    readonly maskSubjectCoverageQaVerified: false
    readonly cloudDispatchAuthorized: false
    readonly modelInferenceAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly queueMutationAuthority: false
    readonly assetManifestAuthority: false
    readonly customerCostAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionReady: false
  }
  readonly sourceDigestSha256: string
  readonly contractDigestSha256: string
}
