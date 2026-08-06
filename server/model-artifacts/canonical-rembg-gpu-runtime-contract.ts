import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { open } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ApiError } from '../errors/api-error'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  CANONICAL_PRIVATE_E2E_TOOL_IDS,
} from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution/professional-tool-operation-spec-registry'
import {
  CANONICAL_REMBG_GPU_RUNTIME_CONTRACT_VERSION,
  type CanonicalRembgGpuRuntimeContract,
  type CanonicalRembgGpuRuntimePackage,
  type CanonicalRembgGpuRuntimeSourceFile,
} from './canonical-rembg-gpu-runtime-contract-types'

const DIGEST_PATTERN = /^[a-f0-9]{64}$/u
const MAXIMUM_SOURCE_FILE_BYTES = 256 * 1_024
const SOURCE_ROOT = 'docker/prod/gpu-worker/rembg'
const SOURCE_PATHS = [
  `${SOURCE_ROOT}/runner.py`,
  `${SOURCE_ROOT}/requirements.lock.txt`,
  `${SOURCE_ROOT}/source-provenance.lock`,
] as const

const EXPECTED_REQUIREMENT_LINES = [
  'attrs==26.1.0 --hash=sha256:c647aa4a12dfbad9333ca4e71fe62ddc36f4e63b2d260a37a8b83d2f043ac309',
  'certifi==2026.7.22 --hash=sha256:62f22742b58a1a33014a2b6b706588a8d7e2a88ae7bd1a6ebe8c992928483775',
  'charset-normalizer==3.4.9 --hash=sha256:04ce310cb89c15df659582aee80a0603788732a5e017d5bd5c81158106ce249c',
  'flatbuffers==25.12.19 --hash=sha256:7634f50c427838bb021c2d66a3d1168e9d199b0607e6329399f04846d42e20b4',
  'idna==3.18 --hash=sha256:7f952cbe720b688055e3f87de14f5c3e5fdaa8bc3928985c4077ca689de849a2',
  'imageio==2.37.4 --hash=sha256:1ab2e22c8debf700f24c3ac43e8f95f3b3a8110c83b93411e97b4b0b2cd1c7e6',
  'jsonschema==4.26.0 --hash=sha256:d489f15263b8d200f8387e64b4c3a75f06629559fb73deb8fdfb525f2dab50ce',
  'jsonschema-specifications==2025.9.1 --hash=sha256:98802fee3a11ee76ecaca44429fda8a41bff98b00a0f2838151b113f210cc6fe',
  'lazy-loader==0.5 --hash=sha256:ab0ea149e9c554d4ffeeb21105ac60bed7f3b4fd69b1d2360a4add51b170b005',
  'llvmlite==0.48.0 --hash=sha256:6fa532d6bb3fd3f0803567c736401c54aecfe1a396d3ad25d2440d220e09f0e7',
  'networkx==3.6.1 --hash=sha256:d47fbf302e7d9cbbb9e2555a0d267983d2aa476bac30e90dfbe5669bd57f3762',
  'numba==0.66.0 --hash=sha256:fc6629becb21a867d85401ec89f426dd24c484a4193ade8a38309debfd1529ca',
  'numpy==2.4.6 --hash=sha256:89cd468399cfd2504718f0ba50e410dca55a170b61a02ad92bb18c8a65186e93',
  'onnxruntime-gpu==1.27.0 --hash=sha256:404fb845dc06a04a28df5a2c6d5967bcf3f534e7df0b98507ff81686a1b49594',
  'packaging==26.2 --hash=sha256:5fc45236b9446107ff2415ce77c807cee2862cb6fac22b8a73826d0693b0980e',
  'pillow==12.3.0 --hash=sha256:23d27a3e0307ec2244cc51e7287b919aa68d097504ebe19df4e76a98a3eea5bd',
  'platformdirs==4.11.0 --hash=sha256:360ccded2b7fce0af0ff80cc8f5942a1c5d99b0e856033acb030bfc634709e74',
  'pooch==1.9.0 --hash=sha256:f265597baa9f760d25ceb29d0beb8186c243d6607b0f60b83ecf14078dbc703b',
  'protobuf==7.35.1 --hash=sha256:74758715c53d7158fb76caf4f0cfdacc5329a4b1bb994f865d6cf302d413a1c4',
  'pymatting==1.1.15 --hash=sha256:1bd7f04651f1e02b390b88b84cf97c7f4c871ad8568945e4303746bf3ab48ecc',
  'referencing==0.37.0 --hash=sha256:381329a9f99628c9069361716891d34ad94af76e461dcb0335825aecc7692231',
  'rembg==2.0.76 --hash=sha256:c98ed085de93f4e1e984f8939afd361fa13d0e4922ed14b3ef77670438a76db3',
  'requests==2.34.2 --hash=sha256:2a0d60c172f83ac6ab31e4554906c0f3b3588d37b5cb939b1c061f4907e278e0',
  'rpds-py==2026.6.3 --hash=sha256:9c1255b302953c86a486b81d330d5ee1d5bd937691ce271b6be0ef0e299eaab7',
  'scikit-image==0.26.0 --hash=sha256:74aa5518ccea28121f57a95374581d3b979839adc25bb03f289b1bc9b99c58af',
  'scipy==1.17.1 --hash=sha256:43af8d1f3bea642559019edfe64e9b11192a8978efbd1539d7bc2aaa23d92de4',
  'tifffile==2026.3.3 --hash=sha256:e8be15c94273113d31ecb7aa3a39822189dd11c4967e3cc88c178f1ad2fd1170',
  'tqdm==4.70.0 --hash=sha256:7f585706bfddbdebf89daac705b2dfcc16890130727d3197ca62c732b4310953',
  'urllib3==2.7.0 --hash=sha256:9fb4c81ebbb1ce9531cce37674bbc6f1360472bc18ca9a553ede278ef7276897',
] as const

const EXPECTED_PROVENANCE_LINES = [
  'platform=linux/amd64',
  'nvidia_cuda_base=nvidia/cuda:12.3.2-cudnn9-runtime-ubuntu22.04',
  'nvidia_cuda_base_index_digest=sha256:fa44193567d1908f7ca1f3abf8623ce9c63bc8cba7bcfdb32702eb04d326f7a8',
  'nvidia_cuda_base_amd64_digest=sha256:edc99e084ef003e1e6f180dbe2e9f64496c61254cb109c09060532c2d3b61d75',
  'cuda_version=12.3.2',
  'cudnn_major=9',
  'python_version=3.11.14',
  'python_source_url=https://www.python.org/ftp/python/3.11.14/Python-3.11.14.tgz',
  'python_source_byte_length=26561042',
  'python_source_sha256=563d2a1b2a5ba5d5409b5ecd05a0e1bf9b028cf3e6a6f0c87a5dc8dc3f2d9182',
  'rembg_version=2.0.76',
  'rembg_source_revision=98f3a9fa5397f03a3101cbdb0c7d7b51f4e95bbb',
  'rembg_u2netp_source_sha256=f0f0f344f5bb19505ab3570d226a73512f99ff28b021d563247776a44969b501',
  'onnxruntime_gpu_version=1.27.0',
  'numpy_version=2.4.6',
  'pillow_version=12.3.0',
  'model_artifact_id=rembg-u2netp-onnx',
  'model_revision=rembg-v0.0.0-u2netp-309c8469258d',
  'model_file=u2netp.onnx',
  'model_byte_length=4574861',
  'model_sha256=309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8',
  'runtime_network_fetch_allowed=false',
  'runtime_model_download_allowed=false',
  'runtime_cpu_fallback_allowed=false',
] as const

const MODEL_FILES = [{
  canonicalOrder: 0 as const,
  slotId: 'rembg_u2netp_onnx' as const,
  fileName: 'u2netp.onnx' as const,
  byteLength: 4_574_861 as const,
  contentSha256:
    '309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8' as const,
}] as const

const BLOCKERS = [
  'approved_package_operation_input_reread_required',
  'cloud_run_gpu_job_deployment_not_verified',
  'cloud_run_l4_cuda_compatibility_not_verified',
  'cloud_run_l4_region_us_authority_migration_required',
  'cloud_run_runtime_image_not_built',
  'model_artifact_bundle_fresh_reread_required',
  'onnxruntime_cuda_provider_load_not_verified',
  'private_mask_artifact_commit_and_qa_not_verified',
  'private_source_frame_artifact_reread_required',
  'rembg_u2netp_gpu_inference_not_verified',
  'worker_lease_reread_required',
] as const

export async function getCanonicalRembgGpuRuntimeContract():
Promise<CanonicalRembgGpuRuntimeContract> {
  assertRegistryBoundary()
  const sourceFiles = await readAndValidateSourceFiles()
  const packages = parsePackages(await readSourceText(
    sourceFiles[1]!.relativePath,
  ))
  const sourceDigestSha256 = sha256AuthorityValue(sourceFiles)
  const draft = {
    contractVersion:
      CANONICAL_REMBG_GPU_RUNTIME_CONTRACT_VERSION,
    contractClass:
      'source_verified_cuda_only_shared_gpu_worker_operation_contract' as const,
    operationIdentity: {
      approvedToolId: 'rembg' as const,
      operationId:
        'tool.rembg.remove_image_background.v1' as const,
      sharedWorkerType: 'gpu_ai_worker' as const,
      existingToolIdentityReused: true as const,
      registryMutationAuthorized: false as const,
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
      pythonVersion: '3.11.14' as const,
      pythonSourceByteLength: 26_561_042 as const,
      pythonSourceSha256:
        '563d2a1b2a5ba5d5409b5ecd05a0e1bf9b028cf3e6a6f0c87a5dc8dc3f2d9182' as const,
      pythonBuiltFromPinnedSource: true as const,
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
      rembgVersion: '2.0.76' as const,
      rembgSourceRevision:
        '98f3a9fa5397f03a3101cbdb0c7d7b51f4e95bbb' as const,
      onnxRuntimeGpuVersion: '1.27.0' as const,
      numpyVersion: '2.4.6' as const,
      pillowVersion: '12.3.0' as const,
      packageCount: 29 as const,
      packages,
      requirementsLockSha256:
        sourceFiles[1]!.contentSha256,
    },
    fixedFileLayout: {
      sourceFramePath:
        '/mnt/reeditpro/private-input/source-frame.png' as const,
      modelDirectory:
        '/mnt/reeditpro/model-artifacts/rembg-u2netp' as const,
      privateOutputDirectory:
        '/mnt/reeditpro/private-output' as const,
      modelFiles: MODEL_FILES,
      callerPathsAccepted: false as const,
      callerUrlsAccepted: false as const,
      callerBytesAccepted: false as const,
    },
    runtimeProtocol: {
      requestVersion:
        'canonical-rembg-gpu-runtime-request-v1' as const,
      responseVersion:
        'canonical-rembg-gpu-runtime-response-v1' as const,
      maximumRequestBytes: 65_536 as const,
      maximumSourceFrameBytes: 16_777_216 as const,
      maximumSourceDimension: 4_096 as const,
      maximumSourcePixels: 16_777_216 as const,
      maximumMaskOutputBytes: 16_777_216 as const,
      sourceFrameFormat: 'opaque_rgba_png' as const,
      outputMaskFormat: 'gray8_mask_png' as const,
      device: 'cuda' as const,
      executionProvider: 'CUDAExecutionProvider' as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      customerArtifactFiles: ['mask.png'] as const,
      processEvidenceFiles: [
        'mask-analysis.json',
        'mask-qa-measurement.json',
      ] as const,
      outputBytesReturnedInReceipt: false as const,
    },
    sourceFiles,
    summary: {
      exactLinuxAmd64BaseDigestPinned: true as const,
      exactPythonSourcePinned: true as const,
      exactDependencyLockDeclared: true as const,
      fixedServerOwnedFileLayoutDeclared: true as const,
      cudaOnlyPreflightImplemented: true as const,
      cpuExecutionProviderFallbackDisabled: true as const,
      localModelOnlyImplemented: true as const,
      boundedPrivateMaskOutputImplemented: true as const,
      digestOnlyReceiptImplemented: true as const,
      exactFiftyToolRegistryPreserved: true as const,
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
      onnxRuntimeCudaProviderLoadVerified: false as const,
      u2netpInferenceVerified: false as const,
      approvedPackageRereadRequired: true as const,
      approvedSnapshotRereadRequired: true as const,
      workerLeaseRereadRequired: true as const,
      modelArtifactBundleRereadRequired: true as const,
      privateSourceFrameArtifactRereadRequired: true as const,
      outputArtifactCommitVerified: false as const,
      maskEdgeQualityQaVerified: false as const,
      maskSubjectCoverageQaVerified: false as const,
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

export async function assertCanonicalRembgGpuRuntimeContract(
  value: unknown,
): Promise<CanonicalRembgGpuRuntimeContract> {
  const expected = await getCanonicalRembgGpuRuntimeContract()
  if (
    stableAuthorityStringify(value)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked('rembg_gpu_runtime_contract_mismatch')
  }
  return expected
}

async function readAndValidateSourceFiles(): Promise<readonly [
  CanonicalRembgGpuRuntimeSourceFile,
  CanonicalRembgGpuRuntimeSourceFile,
  CanonicalRembgGpuRuntimeSourceFile,
]> {
  const runner = await readSourceFile(SOURCE_PATHS[0])
  const requirements = await readSourceFile(SOURCE_PATHS[1])
  const provenance = await readSourceFile(SOURCE_PATHS[2])
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
): Promise<CanonicalRembgGpuRuntimeSourceFile> {
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
      throw blocked('rembg_gpu_runtime_source_file_invalid')
    }
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

function validateRunner(
  sourceFile: CanonicalRembgGpuRuntimeSourceFile,
  value: string,
): void {
  const required = [
    "REQUEST_VERSION = 'canonical-rembg-gpu-runtime-request-v1'",
    "SOURCE_FRAME_PATH = Path(",
    "'/mnt/reeditpro/private-input/source-frame.png'",
    "'/mnt/reeditpro/model-artifacts/rembg-u2netp'",
    "PRIVATE_OUTPUT_DIRECTORY = Path('/mnt/reeditpro/private-output')",
    "'session.disable_cpu_ep_fallback'",
    "os.environ['U2NET_HOME'] = str(MODEL_DIRECTORY)",
    "os.environ.pop('MODEL_CHECKSUM_DISABLED', None)",
    "providers=['CUDAExecutionProvider']",
    "providers != ['CUDAExecutionProvider']",
    "only_mask=True",
    'os.O_NOFOLLOW',
    'os.fsync(handle.fileno())',
    "'foregroundPixelCountAtThreshold':",
    "'runtimeDownloadAllowed': False",
    "'networkFetchAllowed': False",
    "'cpuFallbackAllowed': False",
  ]
  if (
    sourceFile.relativePath !== SOURCE_PATHS[0]
    || required.some((token) => !value.includes(token))
    || /\bCPUExecutionProvider\b/u.test(value)
    || /\b(?:urlopen|requests\.|snapshot_download)\b/u.test(value)
    || /https?:\/\//u.test(value)
  ) {
    throw blocked('rembg_gpu_runner_policy_invalid')
  }
}

function validateRequirements(value: string): void {
  if (
    stableAuthorityStringify(nonemptyLines(value))
      !== stableAuthorityStringify(EXPECTED_REQUIREMENT_LINES)
  ) {
    throw blocked('rembg_gpu_dependency_lock_mismatch')
  }
}

function validateProvenance(value: string): void {
  if (
    stableAuthorityStringify(nonemptyLines(value))
      !== stableAuthorityStringify(EXPECTED_PROVENANCE_LINES)
  ) {
    throw blocked('rembg_gpu_source_provenance_mismatch')
  }
}

function parsePackages(
  value: string,
): readonly CanonicalRembgGpuRuntimePackage[] {
  return nonemptyLines(value).map((line, canonicalOrder) => {
    const match =
      /^([a-z0-9-]+)==([a-zA-Z0-9.]+) --hash=sha256:([a-f0-9]{64})$/u
        .exec(line)
    if (!match || !DIGEST_PATTERN.test(match[3]!)) {
      throw blocked('rembg_gpu_dependency_lock_invalid')
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
  const operation = resolveProfessionalToolOperationSpec('rembg')
  if (
    CANONICAL_PRIVATE_E2E_TOOL_IDS.length !== 50
    || !(CANONICAL_PRIVATE_E2E_TOOL_IDS as readonly string[])
      .includes('rembg')
    || operation?.canonicalToolId !== 'rembg'
    || operation.allowedOperationIds[0]
      !== 'tool.rembg.remove_image_background.v1'
  ) {
    throw blocked('rembg_gpu_runtime_registry_boundary_changed')
  }
}

function repositoryRoot(): string {
  return fileURLToPath(new URL('../../', import.meta.url))
    .replace(/[\\/]$/u, '')
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(child)
    }
  }
  return value
}

function blocked(code: string): ApiError {
  return new ApiError('TOOL_NOT_READY', code, 409, {
    requiredGate: 'canonical_rembg_gpu_runtime_contract',
  })
}
