import { constants } from 'node:fs'
import { createHash } from 'node:crypto'
import { open } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import { CANONICAL_PRIVATE_E2E_TOOL_IDS } from '../tool-registry'
import {
  CANONICAL_FASTER_WHISPER_GPU_RUNTIME_CONTRACT_VERSION,
  type CanonicalFasterWhisperGpuRuntimeContract,
  type CanonicalFasterWhisperGpuRuntimePackage,
  type CanonicalFasterWhisperGpuRuntimeSourceFile,
} from './canonical-faster-whisper-gpu-runtime-contract-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const MAXIMUM_SOURCE_FILE_BYTES = 256 * 1_024
const SOURCE_ROOT =
  'docker/prod/gpu-worker/faster-whisper'
const SOURCE_PATHS = [
  `${SOURCE_ROOT}/runner.py`,
  `${SOURCE_ROOT}/requirements.lock.txt`,
  `${SOURCE_ROOT}/source-provenance.lock`,
] as const

const EXPECTED_REQUIREMENT_LINES = [
  'anyio==4.14.2 --hash=sha256:9f505dda5ac9f0c8309b5e8bd445a8c2bf7246f3ce950121e45ea15bc41d1494',
  'av==14.2.0 --hash=sha256:512a8ceca26250f26fc28913d7a08f962f8e7704189c111e9688180f9b752458',
  'certifi==2026.7.22 --hash=sha256:62f22742b58a1a33014a2b6b706588a8d7e2a88ae7bd1a6ebe8c992928483775',
  'click==8.4.2 --hash=sha256:e6f9f66136c816745b9d65817da91d61d957fb16e02e4dcd0552553c5a197b76',
  'coloredlogs==15.0.1 --hash=sha256:612ee75c546f53e92e70049c9dbfcc18c935a2b9a53b66085ce9ef6a6e5c0934',
  'ctranslate2==4.6.2 --hash=sha256:1c7a0fdf254f81910908cd16825875d8877334e654dd9f76c44e64fc54fbde3f',
  'exceptiongroup==1.3.1 --hash=sha256:a7a39a3bd276781e98394987d3a5701d0c4edffb633bb7a5144577f82c773598',
  'faster-whisper==1.2.1 --hash=sha256:79a66ad50688c0b794dd501dc340a736992a6342f7f95e5811be60b5224a26a7',
  'filelock==3.32.0 --hash=sha256:d396bea984af47333ef05e50eae7eff88c84256de6112aea0ec48a233c064fe3',
  'flatbuffers==25.12.19 --hash=sha256:7634f50c427838bb021c2d66a3d1168e9d199b0607e6329399f04846d42e20b4',
  'fsspec==2026.6.0 --hash=sha256:02e0b71817df9b2169dc30a16832045764def1191b43dcff5bb85bdee212d2a1',
  'h11==0.16.0 --hash=sha256:63cf8bbe7522de3bf65932fda1d9c2772064ffb3dae62d55932da54b31cb6c86',
  'hf-xet==1.5.2 --hash=sha256:db78c39c83d6279daddc98e2238f373ab8980685556d42472b4ec51abcf03e8c',
  'httpcore==1.0.9 --hash=sha256:2d400746a40668fc9dec9810239072b40b4484b640a8c38fd654a024c7a1bf55',
  'httpx==0.28.1 --hash=sha256:d909fcccc110f8c7faf814ca82a9a4d816bc5a6dbfea25d6591d6985b8ba59ad',
  'huggingface-hub==1.25.1 --hash=sha256:004d4e70350517e24c68a7dbb7dc5e40b2b6aefef8f94bf7a85f6f9835102ea5',
  'humanfriendly==10.0 --hash=sha256:1697e1a8a8f550fd43c2865cd84542fc175a61dcb779b6fee18cf6b6ccba1477',
  'idna==3.18 --hash=sha256:7f952cbe720b688055e3f87de14f5c3e5fdaa8bc3928985c4077ca689de849a2',
  'mpmath==1.3.0 --hash=sha256:a0b2b9fe80bbcd81a6647ff13108738cfb482d481d826cc0e02f5b35e5c88d2c',
  'numpy==1.26.4 --hash=sha256:ffa75af20b44f8dba823498024771d5ac50620e6915abac414251bd971b4529f',
  'onnxruntime==1.16.3 --hash=sha256:ef2b1fc269cabd27f129fb9058917d6fdc89b188c49ed8700f300b945c81f889',
  'packaging==26.2 --hash=sha256:5fc45236b9446107ff2415ce77c807cee2862cb6fac22b8a73826d0693b0980e',
  'protobuf==7.35.1 --hash=sha256:74758715c53d7158fb76caf4f0cfdacc5329a4b1bb994f865d6cf302d413a1c4',
  'pyyaml==6.0.3 --hash=sha256:9c7708761fccb9397fe64bbc0395abcae8c4bf7b0eac081e12b809bf47700d0b',
  'setuptools==83.0.0 --hash=sha256:29b23c360f22f414dc7336bb39178cc7bcbf6021ed2733cde173f09dba19abb3',
  'sympy==1.14.0 --hash=sha256:e091cc3e99d2141a0ba2847328f5479b05d94a6635cb96148ccb3f34671bd8f5',
  'tokenizers==0.23.1 --hash=sha256:5075b405006415ea148a992d093699c66eb01952bf59f4d5727089a98bda45a4',
  'tqdm==4.70.0 --hash=sha256:7f585706bfddbdebf89daac705b2dfcc16890130727d3197ca62c732b4310953',
  'typing-extensions==4.16.0 --hash=sha256:481caa481374e813c1b176ada14e97f1f67a4539ce9cfeb3f350d78d6370c2e8',
] as const

const EXPECTED_PROVENANCE_LINES = [
  'platform=linux/amd64',
  'nvidia_cuda_base=nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04',
  'nvidia_cuda_base_index_digest=sha256:fa44193567d1908f7ca1f3abf8623ce9c63bc8cba7bcfdb32702eb04d326f7a8',
  'nvidia_cuda_base_amd64_digest=sha256:edc99e084ef003e1e6f180dbe2e9f64496c61254cb109c09060532c2d3b61d75',
  'cuda_version=12.3.2',
  'cudnn_major=9',
  'python_version=3.10',
  'faster_whisper_version=1.2.1',
  'faster_whisper_source_revision=65882eee9f5cdbeeb2d877f1131d48cf241b327d',
  'ctranslate2_version=4.6.2',
  'numpy_version=1.26.4',
  'av_version=14.2.0',
  'onnxruntime_version=1.16.3',
  'model_repository=Systran/faster-whisper-small',
  'model_revision=536b0662742c02347bc0e980a01041f333bce120',
  'runtime_network_fetch_allowed=false',
  'runtime_cpu_fallback_allowed=false',
] as const

const BLOCKERS = [
  'approved_package_operation_input_reread_required',
  'cloud_run_gpu_job_deployment_not_verified',
  'cloud_run_l4_cuda_compatibility_not_verified',
  'cloud_run_l4_region_us_authority_migration_required',
  'cloud_run_runtime_image_not_built',
  'ctranslate2_cuda_model_load_not_verified',
  'faster_whisper_gpu_inference_not_verified',
  'model_artifact_bundle_fresh_reread_required',
  'private_audio_artifact_reread_required',
  'private_output_artifact_commit_and_qa_not_verified',
  'worker_lease_reread_required',
] as const

const MODEL_FILES = [
  {
    canonicalOrder: 0 as const,
    slotId: 'faster_whisper_config' as const,
    fileName: 'config.json' as const,
    byteLength: 2_370 as const,
    contentSha256:
      'b55496ac7940a7ae47d2c01eab40edfd8701feec1229d9cce3b40014383fb828' as const,
  },
  {
    canonicalOrder: 1 as const,
    slotId: 'faster_whisper_model' as const,
    fileName: 'model.bin' as const,
    byteLength: 483_546_902 as const,
    contentSha256:
      '3e305921506d8872816023e4c273e75d2419fb89b24da97b4fe7bce14170d671' as const,
  },
  {
    canonicalOrder: 2 as const,
    slotId: 'faster_whisper_tokenizer' as const,
    fileName: 'tokenizer.json' as const,
    byteLength: 2_203_239 as const,
    contentSha256:
      'fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab' as const,
  },
  {
    canonicalOrder: 3 as const,
    slotId: 'faster_whisper_vocabulary' as const,
    fileName: 'vocabulary.txt' as const,
    byteLength: 459_861 as const,
    contentSha256:
      '34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913' as const,
  },
] as const

export async function getCanonicalFasterWhisperGpuRuntimeContract():
Promise<CanonicalFasterWhisperGpuRuntimeContract> {
  assertRegistryBoundary()
  const sourceFiles = await readAndValidateSourceFiles()
  const requirements = sourceFiles[1]
  const packages = parsePackages(await readSourceText(
    requirements.relativePath,
  ))
  const sourceDigestSha256 = sha256AuthorityValue(sourceFiles)
  const draft = {
    contractVersion:
      CANONICAL_FASTER_WHISPER_GPU_RUNTIME_CONTRACT_VERSION,
    contractClass:
      'source_verified_cuda_only_shared_gpu_worker_operation_contract' as const,
    operationIdentity: {
      candidateToolId: 'faster_whisper' as const,
      operationId:
        'tool.faster_whisper.transcribe_private_audio.v1' as const,
      sharedWorkerType: 'gpu_ai_worker' as const,
      registryPromotionAuthorized: false as const,
      productionToolRegistryCount: 50 as const,
    },
    runtimeImage: {
      baseImage:
        'nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04' as const,
      baseImageIndexDigest:
        'sha256:fa44193567d1908f7ca1f3abf8623ce9c63bc8cba7bcfdb32702eb04d326f7a8' as const,
      linuxAmd64ManifestDigest:
        'sha256:edc99e084ef003e1e6f180dbe2e9f64496c61254cb109c09060532c2d3b61d75' as const,
      platform: 'linux/amd64' as const,
      cudaVersion: '12.3.2' as const,
      cudnnMajor: 9 as const,
      pythonVersion: '3.10' as const,
      cudaMinorVersionCompatibilityRequired: true as const,
      cudaForwardCompatibilityPackageRequired: false as const,
    },
    cloudRunGpuPolicy: {
      accelerator: 'nvidia_l4' as const,
      gpuCount: 1 as const,
      minimumCpu: 4 as const,
      minimumMemory: '16Gi' as const,
      noGpuZonalRedundancy: true as const,
      taskCount: 1 as const,
      parallelism: 1 as const,
      internalRetries: 0 as const,
      admittedExistingRegion: 'europe-west1' as const,
      blockedExistingRegion: 'us-east1' as const,
      crossRegionTransferAllowed: false as const,
      usGpuRegionAuthorityMigrationRequired: true as const,
    },
    packageIdentity: {
      fasterWhisperVersion: '1.2.1' as const,
      fasterWhisperSourceRevision:
        '65882eee9f5cdbeeb2d877f1131d48cf241b327d' as const,
      ctranslate2Version: '4.6.2' as const,
      numpyVersion: '1.26.4' as const,
      avVersion: '14.2.0' as const,
      onnxruntimeVersion: '1.16.3' as const,
      packageCount: 29 as const,
      packages,
      requirementsLockSha256: requirements.contentSha256,
    },
    fixedFileLayout: {
      sourceAudioPath:
        '/mnt/reeditpro/private-input/source.wav' as const,
      modelDirectory:
        '/mnt/reeditpro/model-artifacts/faster-whisper-small' as const,
      privateOutputDirectory:
        '/mnt/reeditpro/private-output' as const,
      modelFiles: MODEL_FILES,
      callerPathsAccepted: false as const,
      callerUrlsAccepted: false as const,
      callerBytesAccepted: false as const,
    },
    runtimeProtocol: {
      requestVersion:
        'canonical-faster-whisper-gpu-runtime-request-v1' as const,
      responseVersion:
        'canonical-faster-whisper-gpu-runtime-response-v1' as const,
      maximumRequestBytes: 65_536 as const,
      maximumSourceAudioBytes: 2_147_483_648 as const,
      maximumSourceDurationMilliseconds: 7_200_000 as const,
      maximumSingleOutputBytes: 33_554_432 as const,
      maximumCombinedOutputBytes: 67_108_864 as const,
      sourceAudioFormat:
        'wav_pcm_s16le_16000hz_mono' as const,
      device: 'cuda' as const,
      computeType: 'float16' as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      outputFiles: [
        'transcript.json',
        'caption-segments.json',
        'analysis-report.json',
      ] as const,
      outputBytesReturnedInReceipt: false as const,
      transcriptTextReturnedInReceipt: false as const,
    },
    sourceFiles,
    summary: {
      exactLinuxAmd64BaseDigestPinned: true as const,
      exactDependencyLockDeclared: true as const,
      fixedServerOwnedFileLayoutDeclared: true as const,
      cudaOnlyPreflightImplemented: true as const,
      localModelOnlyImplemented: true as const,
      boundedPrivateOutputsImplemented: true as const,
      privateDigestOnlyReceiptImplemented: true as const,
      productionToolRegistryCountPreserved: true as const,
    },
    blockers: BLOCKERS,
    boundaries: {
      sourceContractVerified: true as const,
      runnerSourceImplemented: true as const,
      packageDependencyLockVerified: true as const,
      runtimeImageBuilt: false as const,
      runtimeImageQualified: false as const,
      cloudRunL4ContainerStarted: false as const,
      cloudRunL4CudaCompatibilityVerified: false as const,
      ctranslate2CudaModelLoadVerified: false as const,
      fasterWhisperInferenceVerified: false as const,
      approvedPackageRereadRequired: true as const,
      approvedSnapshotRereadRequired: true as const,
      workerLeaseRereadRequired: true as const,
      modelArtifactBundleRereadRequired: true as const,
      privateAudioArtifactRereadRequired: true as const,
      outputArtifactCommitVerified: false as const,
      transcriptAlignmentQaVerified: false as const,
      captionTimingQaVerified: false as const,
      cloudDispatchAuthorized: false as const,
      modelInferenceAuthority: false as const,
      providerAuthority: false as const,
      toolRegistryAuthority: false as const,
      workGraphAuthority: false as const,
      queueMutationAuthority: false as const,
      assetManifestAuthority: false as const,
      customerCostAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionReady: false as const,
    },
    sourceDigestSha256,
  }
  return deepFreeze({
    ...draft,
    contractDigestSha256: sha256AuthorityValue(draft),
  })
}

export async function assertCanonicalFasterWhisperGpuRuntimeContract(
  value: unknown,
): Promise<CanonicalFasterWhisperGpuRuntimeContract> {
  const expected = await getCanonicalFasterWhisperGpuRuntimeContract()
  if (
    stableAuthorityStringify(value)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked(
      'faster_whisper_gpu_runtime_contract_mismatch',
    )
  }
  return expected
}

async function readAndValidateSourceFiles(): Promise<
  readonly [
    CanonicalFasterWhisperGpuRuntimeSourceFile,
    CanonicalFasterWhisperGpuRuntimeSourceFile,
    CanonicalFasterWhisperGpuRuntimeSourceFile,
  ]
> {
  const files = await Promise.all(SOURCE_PATHS.map(readSourceFile))
  const runner = files[0]!
  const requirements = files[1]!
  const provenance = files[2]!
  validateRunner(
    runner,
    await readSourceText(runner.relativePath),
  )
  validateRequirements(
    await readSourceText(requirements.relativePath),
  )
  validateProvenance(
    await readSourceText(provenance.relativePath),
  )
  return [runner, requirements, provenance]
}

async function readSourceFile(
  relativePath: string,
): Promise<CanonicalFasterWhisperGpuRuntimeSourceFile> {
  const bytes = await readBoundedFile(relativePath)
  return {
    relativePath,
    byteLength: bytes.length,
    contentSha256:
      createHash('sha256').update(bytes).digest('hex'),
  }
}

async function readSourceText(relativePath: string): Promise<string> {
  return (await readBoundedFile(relativePath)).toString('utf8')
}

async function readBoundedFile(relativePath: string): Promise<Buffer> {
  const absolutePath = join(repositoryRoot(), relativePath)
  const handle = await open(
    absolutePath,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  try {
    const metadata = await handle.stat()
    if (
      !metadata.isFile()
      || metadata.size < 1
      || metadata.size > MAXIMUM_SOURCE_FILE_BYTES
    ) {
      throw blocked(
        'faster_whisper_gpu_runtime_source_file_invalid',
      )
    }
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

function validateRunner(
  sourceFile: CanonicalFasterWhisperGpuRuntimeSourceFile,
  value: string,
): void {
  const required = [
    "REQUEST_VERSION = 'canonical-faster-whisper-gpu-runtime-request-v1'",
    "SOURCE_AUDIO_PATH = Path('/mnt/reeditpro/private-input/source.wav')",
    "'/mnt/reeditpro/model-artifacts/faster-whisper-small'",
    "PRIVATE_OUTPUT_DIRECTORY = Path('/mnt/reeditpro/private-output')",
    "device='cuda'",
    "compute_type='float16'",
    'ctranslate2.get_cuda_device_count()',
    "ctranslate2.get_supported_compute_types('cuda', 0)",
    'local_files_only=True',
    "'runtimeRegion'] != 'europe-west1'",
    "'cpuFallbackAllowed': False",
    "'runtimeDownloadAllowed': False",
    "'networkFetchAllowed': False",
  ]
  if (
    sourceFile.relativePath !== SOURCE_PATHS[0]
    || required.some((token) => !value.includes(token))
    || /device\s*=\s*['"]cpu['"]/u.test(value)
    || /\b(?:snapshot_download|download_model|urlopen|requests\.)\b/u
      .test(value)
    || /https?:\/\//u.test(value)
  ) {
    throw blocked('faster_whisper_gpu_runner_policy_invalid')
  }
}

function validateRequirements(value: string): void {
  const lines = nonemptyLines(value)
  if (
    stableAuthorityStringify(lines)
      !== stableAuthorityStringify(EXPECTED_REQUIREMENT_LINES)
  ) {
    throw blocked(
      'faster_whisper_gpu_dependency_lock_mismatch',
    )
  }
}

function validateProvenance(value: string): void {
  if (
    stableAuthorityStringify(nonemptyLines(value))
      !== stableAuthorityStringify(EXPECTED_PROVENANCE_LINES)
  ) {
    throw blocked(
      'faster_whisper_gpu_source_provenance_mismatch',
    )
  }
}

function parsePackages(
  value: string,
): readonly CanonicalFasterWhisperGpuRuntimePackage[] {
  return nonemptyLines(value).map((line, canonicalOrder) => {
    const match =
      /^([a-z0-9-]+)==([a-zA-Z0-9.]+) --hash=sha256:([a-f0-9]{64})$/u
        .exec(line)
    if (!match || !DIGEST_PATTERN.test(match[3]!)) {
      throw blocked(
        'faster_whisper_gpu_dependency_lock_invalid',
      )
    }
    return {
      canonicalOrder,
      packageName: match[1]!,
      version: match[2]!,
      wheelSha256: match[3]!,
    }
  })
}

function nonemptyLines(value: string): string[] {
  return value.split(/\r?\n/u).filter((line) => line.length > 0)
}

function assertRegistryBoundary(): void {
  if (
    CANONICAL_PRIVATE_E2E_TOOL_IDS.length !== 50
    || (CANONICAL_PRIVATE_E2E_TOOL_IDS as readonly string[])
      .includes('faster_whisper')
  ) {
    throw blocked(
      'faster_whisper_gpu_runtime_registry_boundary_changed',
    )
  }
}

function repositoryRoot(): string {
  return fileURLToPath(new URL('../../', import.meta.url))
    .replace(/[\\/]$/u, '')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(nested)
    }
  }
  return value
}

function blocked(message: string): ApiError {
  return new ApiError('TOOL_NOT_READY', message, 503)
}
