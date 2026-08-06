export const CANONICAL_SAM2_GPU_RUNTIME_CONTRACT_VERSION =
  'canonical-sam2-gpu-runtime-contract-v1' as const

export interface CanonicalSam2GpuRuntimeSourceFile {
  readonly relativePath: string
  readonly byteLength: number
  readonly contentSha256: string
}

export interface CanonicalSam2GpuRuntimeContract {
  readonly contractVersion:
    typeof CANONICAL_SAM2_GPU_RUNTIME_CONTRACT_VERSION
  readonly contractClass:
    'source_verified_cuda_only_private_gpu_operation_candidate'
  readonly operationIdentity: {
    readonly requestedToolId: 'sam2'
    readonly operationId:
      'tool.sam2.segment_and_track_subject.v1'
    readonly sharedWorkerType: 'gpu_ai_worker'
    readonly currentCatalogClass: 'non_e2e_capability'
    readonly registryMutationAuthorized: false
    readonly registryCountIsProductCap: false
    readonly distinctReleasedRuntimeIdentityRequiredForPromotion:
      true
  }
  readonly internalQualificationImage: {
    readonly parentImage:
      'reeditpro/ai-graphics-gpu-worker:proof-local'
    readonly parentImageSha256:
      '8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4'
    readonly platform: 'linux/amd64'
    readonly defaultUid: 65_532
    readonly defaultGid: 65_532
    readonly readOnlyRootRequired: true
    readonly allCapabilitiesDroppedRequired: true
    readonly noNewPrivilegesRequired: true
    readonly networkNoneRequired: true
    readonly sourceCandidateOnly: true
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
    readonly crossRegionTransferAllowed: false
  }
  readonly packageIdentity: {
    readonly sam2DistributionVersion: '1.0'
    readonly sam2SourceRevision:
      '2b90b9f5ceec907a1c18123530e92e794ad901a4'
    readonly sam2DirectUrlSha256:
      'fdb91deb308c348a13be152c36770d10fa38044f6d3d1c179cfc9631e0b2a96f'
    readonly sam2License: 'Apache-2.0'
    readonly sam2LicenseSha256:
      'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4'
    readonly sam2ConfigPath:
      'sam2/configs/sam2.1/sam2.1_hiera_s.yaml'
    readonly sam2ConfigSha256:
      '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55'
    readonly torchVersion: '2.5.1+cu124'
    readonly torchvisionVersion: '0.20.1+cu124'
    readonly cudaBuild: '12.4'
  }
  readonly fixedFileLayout: {
    readonly sourceVideoPath:
      '/mnt/reeditpro/private-input/source.mp4'
    readonly modelDirectory:
      '/mnt/reeditpro/model-artifacts/sam2-hiera-small'
    readonly privateOutputDirectory:
      '/mnt/reeditpro/private-output'
    readonly modelFiles: readonly [
      {
        readonly canonicalOrder: 0
        readonly slotId: 'sam2_checkpoint'
        readonly fileName: 'sam2.1_hiera_small.pt'
        readonly artifactId:
          'meta-sam2.1-hiera-small-checkpoint'
        readonly revision:
          'ee5bba1d82bb8749febdf90f45e84b687142ba03'
        readonly modelFamily: 'sam2.1-hiera-small'
        readonly byteLength: 184_416_285
        readonly contentSha256:
          '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38'
      },
    ]
    readonly callerPathsAccepted: false
    readonly callerUrlsAccepted: false
    readonly callerBytesAccepted: false
  }
  readonly runtimeProtocol: {
    readonly requestVersion:
      'canonical-sam2-gpu-runtime-request-v1'
    readonly responseVersion:
      'canonical-sam2-gpu-runtime-response-v1'
    readonly maximumRequestBytes: 131_072
    readonly maximumSourceBytes: 4_294_901_760
    readonly maximumSourceDimension: 8_192
    readonly maximumSourceFrames: 18_000
    readonly maximumSourceDurationMilliseconds: 600_000
    readonly maximumRawMaskSpoolBytes: 4_294_901_760
    readonly maximumMaskOutputBytes: 4_294_901_760
    readonly sourceVideoFormat: 'video/mp4'
    readonly outputMaskFormat:
      'gray8_ffv1_matroska_mask_sequence_v1'
    readonly device: 'cuda'
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
    readonly customerArtifactFiles: readonly [
      'mask-sequence.mkv',
      'tracking-analysis.json',
      'mask-qa-measurement.json',
    ]
    readonly outputBytesReturnedInReceipt: false
  }
  readonly sourceFiles: readonly [
    CanonicalSam2GpuRuntimeSourceFile,
    CanonicalSam2GpuRuntimeSourceFile,
    CanonicalSam2GpuRuntimeSourceFile,
  ]
  readonly summary: {
    readonly exactInternalParentDigestPinned: true
    readonly exactSam2SourceAndConfigPinned: true
    readonly exactCheckpointIdentityPinned: true
    readonly fixedServerOwnedFileLayoutDeclared: true
    readonly cudaL4OnlyPreflightImplemented: true
    readonly cpuFallbackDisabled: true
    readonly runtimeDownloadsDisabled: true
    readonly boundedPrivateOutputsImplemented: true
    readonly digestOnlyReceiptImplemented: true
    readonly semanticRegistryPolicyPreserved: true
  }
  readonly blockers: readonly string[]
  readonly boundaries: {
    readonly sourceContractVerified: true
    readonly runnerSourceImplemented: true
    readonly localConfinementEvidenceConsumedAsInput: true
    readonly runtimeImageBuiltFromCurrentSource: false
    readonly runtimeImageScannedAndSigned: false
    readonly checkpointIngested: false
    readonly checkpointReadOnlyMountVerified: false
    readonly cloudRunL4ContainerStarted: false
    readonly cloudRunL4CudaCompatibilityVerified: false
    readonly sam2CheckpointLoadVerified: false
    readonly sam2InferenceVerified: false
    readonly outputArtifactCommitVerified: false
    readonly maskEdgeQualityQaVerified: false
    readonly maskTemporalStabilityQaVerified: false
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
