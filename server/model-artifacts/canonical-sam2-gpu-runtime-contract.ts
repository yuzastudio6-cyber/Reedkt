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
  getNonE2EToolCapabilityProfile,
} from '../tool-registry'
import {
  resolveProfessionalToolOperationSpec,
} from '../tool-execution/professional-tool-operation-spec-registry'
import {
  CANONICAL_SAM2_GPU_RUNTIME_CONTRACT_VERSION,
  type CanonicalSam2GpuRuntimeContract,
  type CanonicalSam2GpuRuntimeSourceFile,
} from './canonical-sam2-gpu-runtime-contract-types'

const MAXIMUM_SOURCE_FILE_BYTES = 256 * 1_024
const SOURCE_ROOT = 'docker/prod/gpu-worker/sam2'
const SOURCE_PATHS = [
  `${SOURCE_ROOT}/runner.py`,
  `${SOURCE_ROOT}/Dockerfile.runtime-candidate`,
  `${SOURCE_ROOT}/source-provenance.lock`,
] as const

const EXPECTED_SOURCE_FILES = [
  {
    relativePath: SOURCE_PATHS[0],
    byteLength: 38_714,
    contentSha256:
      'e3560523154f666c0565489f660984aa2e148b29ce72de10fada2249d79c9329',
  },
  {
    relativePath: SOURCE_PATHS[1],
    byteLength: 1_037,
    contentSha256:
      'd8e546a28181865bc49697bda39f821a1ec14bbd9061019f180a13f6db031a3e',
  },
  {
    relativePath: SOURCE_PATHS[2],
    byteLength: 1_163,
    contentSha256:
      '818aaca18e101906279337491f8ba52264630ab49eb3bd0f9972ebe071b45f16',
  },
] as const

const EXPECTED_PROVENANCE_LINES = [
  'platform=linux/amd64',
  'internal_parent_image=reeditpro/ai-graphics-gpu-worker:proof-local',
  'internal_parent_image_sha256=8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4',
  'sam2_distribution_version=1.0',
  'sam2_source_repository=https://github.com/facebookresearch/sam2.git',
  'sam2_source_revision=2b90b9f5ceec907a1c18123530e92e794ad901a4',
  'sam2_direct_url_sha256=fdb91deb308c348a13be152c36770d10fa38044f6d3d1c179cfc9631e0b2a96f',
  'sam2_source_license=Apache-2.0',
  'sam2_source_license_sha256=c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
  'sam2_config_path=sam2/configs/sam2.1/sam2.1_hiera_s.yaml',
  'sam2_config_sha256=0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55',
  'torch_version=2.5.1+cu124',
  'torchvision_version=0.20.1+cu124',
  'cuda_build=12.4',
  'checkpoint_slot_id=sam2_checkpoint',
  'checkpoint_artifact_id=meta-sam2.1-hiera-small-checkpoint',
  'checkpoint_revision=ee5bba1d82bb8749febdf90f45e84b687142ba03',
  'checkpoint_file=sam2.1_hiera_small.pt',
  'checkpoint_byte_length=184416285',
  'checkpoint_sha256=6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38',
  'runtime_download_allowed=false',
  'network_fetch_allowed=false',
  'cpu_fallback_allowed=false',
] as const

const BLOCKERS = [
  'approved_checkpoint_ingest_and_read_only_mount_required',
  'current_source_candidate_image_build_scan_and_signature_required',
  'cloud_run_l4_cuda_inference_and_resource_receipt_required',
  'private_mask_output_commit_and_qa_reconciliation_required',
  'sam2_operation_registration_and_dispatch_admission_required',
] as const

export async function getCanonicalSam2GpuRuntimeContract():
Promise<CanonicalSam2GpuRuntimeContract> {
  assertCatalogBoundary()
  const sourceFiles = await readAndValidateSourceFiles()
  const sourceDigestSha256 = sha256AuthorityValue(sourceFiles)
  const draft = {
    contractVersion: CANONICAL_SAM2_GPU_RUNTIME_CONTRACT_VERSION,
    contractClass:
      'source_verified_cuda_only_private_gpu_operation_candidate' as const,
    operationIdentity: {
      requestedToolId: 'sam2' as const,
      operationId:
        'tool.sam2.segment_and_track_subject.v1' as const,
      sharedWorkerType: 'gpu_ai_worker' as const,
      currentCatalogClass: 'non_e2e_capability' as const,
      registryMutationAuthorized: false as const,
      registryCountIsProductCap: false as const,
      distinctReleasedRuntimeIdentityRequiredForPromotion:
        true as const,
    },
    internalQualificationImage: {
      parentImage:
        'reeditpro/ai-graphics-gpu-worker:proof-local' as const,
      parentImageSha256:
        '8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4' as const,
      platform: 'linux/amd64' as const,
      defaultUid: 65_532 as const,
      defaultGid: 65_532 as const,
      readOnlyRootRequired: true as const,
      allCapabilitiesDroppedRequired: true as const,
      noNewPrivilegesRequired: true as const,
      networkNoneRequired: true as const,
      sourceCandidateOnly: true as const,
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
      crossRegionTransferAllowed: false as const,
    },
    packageIdentity: {
      sam2DistributionVersion: '1.0' as const,
      sam2SourceRevision:
        '2b90b9f5ceec907a1c18123530e92e794ad901a4' as const,
      sam2DirectUrlSha256:
        'fdb91deb308c348a13be152c36770d10fa38044f6d3d1c179cfc9631e0b2a96f' as const,
      sam2License: 'Apache-2.0' as const,
      sam2LicenseSha256:
        'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4' as const,
      sam2ConfigPath:
        'sam2/configs/sam2.1/sam2.1_hiera_s.yaml' as const,
      sam2ConfigSha256:
        '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55' as const,
      torchVersion: '2.5.1+cu124' as const,
      torchvisionVersion: '0.20.1+cu124' as const,
      cudaBuild: '12.4' as const,
    },
    fixedFileLayout: {
      sourceVideoPath:
        '/mnt/reeditpro/private-input/source.mp4' as const,
      modelDirectory:
        '/mnt/reeditpro/model-artifacts/sam2-hiera-small' as const,
      privateOutputDirectory:
        '/mnt/reeditpro/private-output' as const,
      modelFiles: [{
        canonicalOrder: 0 as const,
        slotId: 'sam2_checkpoint' as const,
        fileName: 'sam2.1_hiera_small.pt' as const,
        artifactId:
          'meta-sam2.1-hiera-small-checkpoint' as const,
        revision:
          'ee5bba1d82bb8749febdf90f45e84b687142ba03' as const,
        modelFamily: 'sam2.1-hiera-small' as const,
        byteLength: 184_416_285 as const,
        contentSha256:
          '6d1aa6f30de5c92224f8172114de081d104bbd23dd9dc5c58996f0cad5dc4d38' as const,
      }] as const,
      callerPathsAccepted: false as const,
      callerUrlsAccepted: false as const,
      callerBytesAccepted: false as const,
    },
    runtimeProtocol: {
      requestVersion:
        'canonical-sam2-gpu-runtime-request-v1' as const,
      responseVersion:
        'canonical-sam2-gpu-runtime-response-v1' as const,
      maximumRequestBytes: 131_072 as const,
      maximumSourceBytes: 4_294_901_760 as const,
      maximumSourceDimension: 8_192 as const,
      maximumSourceFrames: 18_000 as const,
      maximumSourceDurationMilliseconds: 600_000 as const,
      maximumRawMaskSpoolBytes: 4_294_901_760 as const,
      maximumMaskOutputBytes: 4_294_901_760 as const,
      sourceVideoFormat: 'video/mp4' as const,
      outputMaskFormat:
        'gray8_ffv1_matroska_mask_sequence_v1' as const,
      device: 'cuda' as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      customerArtifactFiles: [
        'mask-sequence.mkv',
        'tracking-analysis.json',
        'mask-qa-measurement.json',
      ] as const,
      outputBytesReturnedInReceipt: false as const,
    },
    sourceFiles,
    summary: {
      exactInternalParentDigestPinned: true as const,
      exactSam2SourceAndConfigPinned: true as const,
      exactCheckpointIdentityPinned: true as const,
      fixedServerOwnedFileLayoutDeclared: true as const,
      cudaL4OnlyPreflightImplemented: true as const,
      cpuFallbackDisabled: true as const,
      runtimeDownloadsDisabled: true as const,
      boundedPrivateOutputsImplemented: true as const,
      digestOnlyReceiptImplemented: true as const,
      semanticRegistryPolicyPreserved: true as const,
    },
    blockers: BLOCKERS,
    boundaries: {
      sourceContractVerified: true as const,
      runnerSourceImplemented: true as const,
      localConfinementEvidenceConsumedAsInput: true as const,
      runtimeImageBuiltFromCurrentSource: false as const,
      runtimeImageScannedAndSigned: false as const,
      checkpointIngested: false as const,
      checkpointReadOnlyMountVerified: false as const,
      cloudRunL4ContainerStarted: false as const,
      cloudRunL4CudaCompatibilityVerified: false as const,
      sam2CheckpointLoadVerified: false as const,
      sam2InferenceVerified: false as const,
      outputArtifactCommitVerified: false as const,
      maskEdgeQualityQaVerified: false as const,
      maskTemporalStabilityQaVerified: false as const,
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

export async function assertCanonicalSam2GpuRuntimeContract(
  value: unknown,
): Promise<CanonicalSam2GpuRuntimeContract> {
  const expected = await getCanonicalSam2GpuRuntimeContract()
  if (
    stableAuthorityStringify(value)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked('sam2_gpu_runtime_contract_mismatch')
  }
  return expected
}

async function readAndValidateSourceFiles(): Promise<readonly [
  CanonicalSam2GpuRuntimeSourceFile,
  CanonicalSam2GpuRuntimeSourceFile,
  CanonicalSam2GpuRuntimeSourceFile,
]> {
  const values = await Promise.all([
    readSourceFile(SOURCE_PATHS[0]),
    readSourceFile(SOURCE_PATHS[1]),
    readSourceFile(SOURCE_PATHS[2]),
  ])
  if (
    stableAuthorityStringify(values)
      !== stableAuthorityStringify(EXPECTED_SOURCE_FILES)
  ) {
    throw blocked('sam2_gpu_runtime_source_identity_mismatch')
  }
  validateRunner(
    await readSourceText(SOURCE_PATHS[0]),
  )
  validateDockerfile(
    await readSourceText(SOURCE_PATHS[1]),
  )
  validateProvenance(
    await readSourceText(SOURCE_PATHS[2]),
  )
  return values
}

async function readSourceFile(
  relativePath: string,
): Promise<CanonicalSam2GpuRuntimeSourceFile> {
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
  const handle = await open(
    join(repositoryRoot(), relativePath),
    constants.O_RDONLY | constants.O_NOFOLLOW,
  )
  try {
    const metadata = await handle.stat()
    if (
      !metadata.isFile()
      || metadata.size < 1
      || metadata.size > MAXIMUM_SOURCE_FILE_BYTES
    ) {
      throw blocked('sam2_gpu_runtime_source_file_invalid')
    }
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

function validateRunner(value: string): void {
  const required = [
    'REQUEST_VERSION = "canonical-sam2-gpu-runtime-request-v1"',
    'OPERATION_ID = "tool.sam2.segment_and_track_subject.v1"',
    '"/mnt/reeditpro/private-input/source.mp4"',
    '"/mnt/reeditpro/model-artifacts/sam2-hiera-small"',
    '"/mnt/reeditpro/private-output"',
    'build_sam2_video_predictor',
    'torch.cuda.device_count() != 1',
    '"L4" not in torch.cuda.get_device_name(0)',
    'os.O_NOFOLLOW',
    'runtimeDownloadAllowed',
    'networkFetchAllowed',
    'artifactCommitAuthority',
    'qaPassAuthority',
  ]
  if (
    required.some((token) => !value.includes(token))
    || /\b(?:urlopen|requests\.|snapshot_download)\b/u.test(value)
    || /\bdevice\s*=\s*["']cpu["']/u.test(value)
  ) {
    throw blocked('sam2_gpu_runner_policy_invalid')
  }
}

function validateDockerfile(value: string): void {
  const required = [
    'FROM reeditpro/ai-graphics-gpu-worker:proof-local@sha256:8f83b1b549daac2800c8d86ef785be669340e8b504f948804209c7800fc76df4',
    'USER 65532:65532',
    'ENTRYPOINT ["/usr/bin/python3", "-I", "-B",',
  ]
  if (required.some((token) => !value.includes(token))) {
    throw blocked('sam2_gpu_runtime_dockerfile_invalid')
  }
}

function validateProvenance(value: string): void {
  const lines = value
    .split(/\r?\n/u)
    .filter((line) => line.length > 0)
  if (
    stableAuthorityStringify(lines)
      !== stableAuthorityStringify(EXPECTED_PROVENANCE_LINES)
  ) {
    throw blocked('sam2_gpu_source_provenance_mismatch')
  }
}

function assertCatalogBoundary(): void {
  const profile = getNonE2EToolCapabilityProfile('sam2')
  if (
    profile?.toolId !== 'sam2'
    || profile.workerType !== 'gpu_ai_worker'
    || profile.productionStatus !== 'planned'
    || resolveProfessionalToolOperationSpec('sam2') !== undefined
  ) {
    throw blocked('sam2_gpu_runtime_catalog_boundary_changed')
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
    requiredGate: 'canonical_sam2_gpu_runtime_contract',
  })
}
