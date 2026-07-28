export const CANONICAL_FASTER_WHISPER_GPU_RUNTIME_CONTRACT_VERSION =
  'canonical-faster-whisper-gpu-runtime-contract-v1' as const

export interface CanonicalFasterWhisperGpuRuntimeSourceFile {
  readonly relativePath: string
  readonly byteLength: number
  readonly contentSha256: string
}

export interface CanonicalFasterWhisperGpuRuntimePackage {
  readonly canonicalOrder: number
  readonly packageName: string
  readonly version: string
  readonly wheelSha256: string
}

export interface CanonicalFasterWhisperGpuRuntimeContract {
  readonly contractVersion:
    typeof CANONICAL_FASTER_WHISPER_GPU_RUNTIME_CONTRACT_VERSION
  readonly contractClass:
    'source_verified_cuda_only_shared_gpu_worker_operation_contract'
  readonly operationIdentity: {
    readonly candidateToolId: 'faster_whisper'
    readonly operationId:
      'tool.faster_whisper.transcribe_private_audio.v1'
    readonly sharedWorkerType: 'gpu_ai_worker'
    readonly registryPromotionAuthorized: false
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
    readonly pythonVersion: '3.10'
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
    readonly fasterWhisperVersion: '1.2.1'
    readonly fasterWhisperSourceRevision:
      '65882eee9f5cdbeeb2d877f1131d48cf241b327d'
    readonly ctranslate2Version: '4.6.2'
    readonly numpyVersion: '1.26.4'
    readonly avVersion: '14.2.0'
    readonly onnxruntimeVersion: '1.16.3'
    readonly packageCount: 28
    readonly packages:
      readonly CanonicalFasterWhisperGpuRuntimePackage[]
    readonly requirementsLockSha256: string
  }
  readonly fixedFileLayout: {
    readonly sourceAudioPath:
      '/mnt/reeditpro/private-input/source.wav'
    readonly modelDirectory:
      '/mnt/reeditpro/model-artifacts/faster-whisper-small'
    readonly privateOutputDirectory:
      '/mnt/reeditpro/private-output'
    readonly modelFiles: readonly [
      {
        readonly canonicalOrder: 0
        readonly slotId: 'faster_whisper_config'
        readonly fileName: 'config.json'
        readonly byteLength: 2_370
        readonly contentSha256:
          'b55496ac7940a7ae47d2c01eab40edfd8701feec1229d9cce3b40014383fb828'
      },
      {
        readonly canonicalOrder: 1
        readonly slotId: 'faster_whisper_model'
        readonly fileName: 'model.bin'
        readonly byteLength: 483_546_902
        readonly contentSha256:
          '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671'
      },
      {
        readonly canonicalOrder: 2
        readonly slotId: 'faster_whisper_tokenizer'
        readonly fileName: 'tokenizer.json'
        readonly byteLength: 2_203_239
        readonly contentSha256:
          'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab'
      },
      {
        readonly canonicalOrder: 3
        readonly slotId: 'faster_whisper_vocabulary'
        readonly fileName: 'vocabulary.txt'
        readonly byteLength: 459_861
        readonly contentSha256:
          '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913'
      },
    ]
    readonly callerPathsAccepted: false
    readonly callerUrlsAccepted: false
    readonly callerBytesAccepted: false
  }
  readonly runtimeProtocol: {
    readonly requestVersion:
      'canonical-faster-whisper-gpu-runtime-request-v1'
    readonly responseVersion:
      'canonical-faster-whisper-gpu-runtime-response-v1'
    readonly maximumRequestBytes: 65_536
    readonly maximumSourceAudioBytes: 2_147_483_648
    readonly maximumSourceDurationMilliseconds: 7_200_000
    readonly maximumSingleOutputBytes: 33_554_432
    readonly maximumCombinedOutputBytes: 67_108_864
    readonly sourceAudioFormat:
      'wav_pcm_s16le_16000hz_mono'
    readonly device: 'cuda'
    readonly computeType: 'float16'
    readonly cpuFallbackAllowed: false
    readonly runtimeDownloadAllowed: false
    readonly networkFetchAllowed: false
    readonly outputFiles: readonly [
      'transcript.json',
      'caption-segments.json',
      'analysis-report.json',
    ]
    readonly outputBytesReturnedInReceipt: false
    readonly transcriptTextReturnedInReceipt: false
  }
  readonly sourceFiles: readonly [
    CanonicalFasterWhisperGpuRuntimeSourceFile,
    CanonicalFasterWhisperGpuRuntimeSourceFile,
    CanonicalFasterWhisperGpuRuntimeSourceFile,
  ]
  readonly summary: {
    readonly exactLinuxAmd64BaseDigestPinned: true
    readonly exactDependencyLockDeclared: true
    readonly fixedServerOwnedFileLayoutDeclared: true
    readonly cudaOnlyPreflightImplemented: true
    readonly localModelOnlyImplemented: true
    readonly boundedPrivateOutputsImplemented: true
    readonly privateDigestOnlyReceiptImplemented: true
    readonly productionToolRegistryCountPreserved: true
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
    readonly ctranslate2CudaModelLoadVerified: false
    readonly fasterWhisperInferenceVerified: false
    readonly approvedPackageRereadRequired: true
    readonly approvedSnapshotRereadRequired: true
    readonly workerLeaseRereadRequired: true
    readonly modelArtifactBundleRereadRequired: true
    readonly privateAudioArtifactRereadRequired: true
    readonly outputArtifactCommitVerified: false
    readonly transcriptAlignmentQaVerified: false
    readonly captionTimingQaVerified: false
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
