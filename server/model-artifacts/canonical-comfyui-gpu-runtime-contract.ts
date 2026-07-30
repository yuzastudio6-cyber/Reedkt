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
  CANONICAL_COMFYUI_GPU_RUNTIME_CONTRACT_VERSION,
  type CanonicalComfyUiGpuRuntimeContract,
  type CanonicalComfyUiGpuRuntimeModelFile,
  type CanonicalComfyUiGpuRuntimeSourceFile,
} from './canonical-comfyui-gpu-runtime-contract-types'

const MAXIMUM_SOURCE_FILE_BYTES = 512 * 1_024
const SOURCE_ROOT = 'docker/prod/gpu-worker/comfyui'
const SOURCE_PATHS = [
  `${SOURCE_ROOT}/runner.py`,
  `${SOURCE_ROOT}/requirements.lock.txt`,
  `${SOURCE_ROOT}/source-provenance.lock`,
  `${SOURCE_ROOT}/extra_model_paths.yaml`,
  `${SOURCE_ROOT}/install-offline.sh`,
  `${SOURCE_ROOT}/verify-installed-layout.sh`,
  `${SOURCE_ROOT}/README.md`,
] as const

const EXPECTED_SOURCE_FILES = [
  {
    relativePath: SOURCE_PATHS[0],
    byteLength: 48_858,
    contentSha256:
      'f28160b8e63fdf1a5717045850efd141275f20b4913a80b6502104c662b85caa',
    executable: false,
  },
  {
    relativePath: SOURCE_PATHS[1],
    byteLength: 3_634,
    contentSha256:
      '6dfa8623619ee854cb220ce3be538533b91b4b3703a3e8c79639d25e8909294e',
    executable: false,
  },
  {
    relativePath: SOURCE_PATHS[2],
    byteLength: 1_434,
    contentSha256:
      'c3088d74dd5ddef884c373f3da8544de69cfa81e386f12a38c3fb5123f8c8040',
    executable: false,
  },
  {
    relativePath: SOURCE_PATHS[3],
    byteLength: 204,
    contentSha256:
      '4fa61cadb61d595ed32ffac4f8fdcaa0d665fd8e5011de308a69ae4075391b60',
    executable: false,
  },
  {
    relativePath: SOURCE_PATHS[4],
    byteLength: 5_525,
    contentSha256:
      '2dca3ca658c24ba626e500fce991792b7bf5ded49eb3294da38811b0759d7119',
    executable: true,
  },
  {
    relativePath: SOURCE_PATHS[5],
    byteLength: 4_474,
    contentSha256:
      '71c0f35ad1ad0083eb88a2b1561d6e93ba0cfa05cb2762e6a28f8978008d5656',
    executable: true,
  },
  {
    relativePath: SOURCE_PATHS[6],
    byteLength: 1_765,
    contentSha256:
      '8349c76179f5b4e577c5289c74e58ae7c84018ab3104368a8c342155734747d0',
    executable: false,
  },
] as const

const MODEL_FILES = [
  {
    canonicalOrder: 0 as const,
    role: 'base_checkpoint' as const,
    slotId: 'base_checkpoint_artifact' as const,
    fileName: 'sd_xl_base_1.0.safetensors' as const,
    byteLength: 6_938_078_334 as const,
    contentSha256:
      '31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b',
    fixedContainerMountPath:
      '/mnt/reeditpro/model-artifacts/checkpoints/sd_xl_base_1.0.safetensors',
  },
  {
    canonicalOrder: 1 as const,
    role: 'controlnet_checkpoint' as const,
    slotId: 'controlnet_checkpoint_artifact' as const,
    fileName:
      'diffusion_pytorch_model.fp16.safetensors' as const,
    byteLength: 320_237_179 as const,
    contentSha256:
      'fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9',
    fixedContainerMountPath:
      '/mnt/reeditpro/model-artifacts/controlnet/diffusion_pytorch_model.fp16.safetensors',
  },
  {
    canonicalOrder: 2 as const,
    role: 'lora_adapter' as const,
    slotId: 'lora_adapter_artifact' as const,
    fileName:
      'sd_xl_offset_example-lora_1.0.safetensors' as const,
    byteLength: 49_553_604 as const,
    contentSha256:
      '4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f',
    fixedContainerMountPath:
      '/mnt/reeditpro/model-artifacts/loras/sd_xl_offset_example-lora_1.0.safetensors',
  },
  {
    canonicalOrder: 3 as const,
    role: 'generic_ipadapter_checkpoint' as const,
    slotId: 'generic_ipadapter_checkpoint_artifact' as const,
    fileName: 'ip-adapter_sdxl.safetensors' as const,
    byteLength: 702_585_376 as const,
    contentSha256:
      'ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6',
    fixedContainerMountPath:
      '/mnt/reeditpro/model-artifacts/ipadapter/ip-adapter_sdxl.safetensors',
  },
  {
    canonicalOrder: 4 as const,
    role: 'clip_vision_checkpoint' as const,
    slotId: 'clip_vision_checkpoint_artifact' as const,
    fileName: 'model.safetensors' as const,
    byteLength: 3_689_912_664 as const,
    contentSha256:
      '657723e09f46a7c3957df651601029f66b1748afb12b419816330f16ed45d64d',
    fixedContainerMountPath:
      '/mnt/reeditpro/model-artifacts/clip_vision/model.safetensors',
  },
] as const satisfies readonly CanonicalComfyUiGpuRuntimeModelFile[]

const BLOCKERS = [
  'offline_wheel_and_source_archive_build_inputs_materialization_required',
  'current_source_candidate_image_build_scan_and_signature_required',
  'canonical_five_model_ingest_distributed_read_only_mount_and_paid_use_review_required',
  'cloud_run_l4_generation_and_resource_receipt_required',
  'private_output_commit_alpha_continuity_fact_composite_qa_and_review_required',
  'comfyui_operation_registration_and_dispatch_admission_required',
] as const

export async function getCanonicalComfyUiGpuRuntimeContract():
Promise<CanonicalComfyUiGpuRuntimeContract> {
  assertCatalogBoundary()
  const sourceFiles = await readAndValidateSourceFiles()
  const sourceDigestSha256 = sha256AuthorityValue(sourceFiles)
  const draft = {
    contractVersion: CANONICAL_COMFYUI_GPU_RUNTIME_CONTRACT_VERSION,
    contractClass:
      'source_verified_offline_selected_scene_comfyui_gpu_operation_candidate' as const,
    operationIdentity: {
      requestedToolId: 'comfyui' as const,
      operationId:
        'tool.comfyui.generate_controlled_image.v1' as const,
      sharedWorkerType: 'gpu_ai_worker' as const,
      currentCatalogClass: 'non_e2e_capability' as const,
      registryMutationAuthorized: false as const,
      registryCountIsProductCap: false as const,
      representedGpuCapabilities: [
        'comfyui',
        'comfyui_controlnet_aux',
        'controlnet',
        'ip_adapter',
        'peft_lora',
      ] as const,
      representedGpuCapabilitiesShareOneAttempt: true as const,
      auraFaceExcludedAsSeparateOptionalCpuQa: true as const,
    },
    internalQualificationImage: {
      image:
        'reeditpro-living-frame-comfyui-locked-candidate:local' as const,
      imageSha256:
        '1de2c0415c477537dc4035a0550cec1859b8e5c5719647a64c0172962a770a64' as const,
      sanitizedSpdxDigestSha256:
        'dd7fd3bf99acf78a25bc61b0fb97b10e309b68fdb5c70c8581db3073c270bf5d' as const,
      packageCount: 761 as const,
      platform: 'linux/amd64' as const,
      derivedNonRootUid: 65_532 as const,
      derivedNonRootGid: 65_532 as const,
      readOnlyRootRequired: true as const,
      allCapabilitiesDroppedRequired: true as const,
      noNewPrivilegesRequired: true as const,
      networkNoneRequired: true as const,
      exactSam2TopLevelImportDenied: true as const,
      sourceCandidateOnly: true as const,
    },
    privateLocalFiveModelMountEvidence: {
      evidenceCommitSha:
        '03b8a562de899e5776b1b70366e328b4ece392e4' as const,
      evidenceTreeSha:
        '38604f5021f0c17901e1edccbb294b3de17bec4a' as const,
      orderedBundleDigestSha256:
        'cf63c0109667a2e8fe9ccca62680a4823c520f3980b262565243b7f3e6ce1c20' as const,
      modelArtifactCount: 5 as const,
      aggregateByteLength: 11_700_367_157 as const,
      simultaneousReadOnlyMountObserved: true as const,
      everyObjectRereadAndHashed: true as const,
      exactSetRequired: true as const,
      symlinksRejected: true as const,
      writeOpenRejected: true as const,
      fixedUid: 65_532 as const,
      fixedGid: 65_532 as const,
      networkNoneObserved: true as const,
      readOnlyRootObserved: true as const,
      allCapabilitiesDroppedObserved: true as const,
      noNewPrivilegesObserved: true as const,
      sam2ImportDenied: true as const,
      torchVersion: '2.5.1+cu124' as const,
      torchvisionVersion: '0.20.1+cu124' as const,
      cpuEmulationOnly: true as const,
      cudaAvailable: false as const,
      modelLoadClaimed: false as const,
      inferenceClaimed: false as const,
      canonicalArtifactIngestClaimed: false as const,
      distributedMountClaimed: false as const,
      productionQualified: false as const,
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
      pythonVersion: '3.10.12' as const,
      torchVersion: '2.5.1+cu124' as const,
      cudaBuild: '12.4' as const,
      wheelArtifactCount: 35 as const,
      wheelArtifactTotalByteLength: 486_459_097 as const,
      wheelManifestSha256:
        'cc63d5e32c32497953482f864c5cd47bf9ef48ee59dca9ab484211af665c37e9' as const,
      comfyUiSourceRevision:
        '093d571b83e7a79833200e199b46b9f5a62217f9' as const,
      comfyUiSourceArchiveSha256:
        'dfc771e822aeef3956a3295834a211b36a72e8dce1a7f2bf6b8327a311af9948' as const,
      ipAdapterSourceRevision:
        'b188a6cb39b512a9c6da7235b880af42c78ccd0d' as const,
      ipAdapterSourceArchiveSha256:
        '8565104c6a20e2e092bc895a72b8dcf588c0165f0de0f4f01dc0f735d2af50ec' as const,
      controlNetAuxSourceRevision:
        'e8b689a513c3e6b63edc44066560ca5919c0576e' as const,
      controlNetAuxSourceArchiveSha256:
        '6ab94365c94e7c4a02be19d1ad5921c5ac490c0539bd1b38fc0d1516225d9b4e' as const,
      inheritedDirectVcsSam2Revision:
        '2b90b9f5ceec907a1c18123530e92e794ad901a4' as const,
      inheritedDirectVcsSam2RuntimeUseAllowed: false as const,
    },
    fixedFileLayout: {
      packageRoot:
        '/opt/reeditpro/gpu-operations/comfyui' as const,
      pythonPath:
        '/opt/reeditpro/gpu-operations/comfyui/venv/bin/python' as const,
      runnerPath:
        '/opt/reeditpro/gpu-operations/comfyui/runner.py' as const,
      sourceRoot:
        '/opt/reeditpro/gpu-operations/comfyui/source' as const,
      privateInputRoot:
        '/mnt/reeditpro/private-input' as const,
      privateOutputRoot:
        '/mnt/reeditpro/private-output' as const,
      modelFiles: MODEL_FILES,
      totalModelByteLength: 11_700_367_157 as const,
      callerPathsAccepted: false as const,
      callerUrlsAccepted: false as const,
      callerBytesAccepted: false as const,
    },
    runtimeProtocol: {
      requestVersion:
        'canonical-comfyui-gpu-runtime-request-v1' as const,
      responseVersion:
        'canonical-comfyui-gpu-runtime-response-v1' as const,
      maximumRequestBytes: 1_048_576 as const,
      maximumOutputBytes: 67_108_864 as const,
      maximumDimension: 4_096 as const,
      maximumPixelCount: 8_294_400 as const,
      minimumDimension: 256 as const,
      dimensionMultiple: 8 as const,
      outputImageCount: 1 as const,
      outputContentType: 'image/png' as const,
      outputEncodingProfile:
        'opaque_rgb_or_rgba_png_v1' as const,
      device: 'cuda' as const,
      cpuFallbackAllowed: false as const,
      runtimeDownloadAllowed: false as const,
      networkFetchAllowed: false as const,
      websocketOutputOnly: true as const,
      outputBytesReturnedInReceipt: false as const,
    },
    sourceFiles,
    summary: {
      exactOfflinePackageClosurePinned: true as const,
      exactFiveModelIdentitiesPinned: true as const,
      privateLocalExactFiveModelBytesObserved: true as const,
      privateLocalAtomicReadOnlyMountObserved: true as const,
      selectedSceneDimensionsSupported: true as const,
      fixedSupervisedProcessImplemented: true as const,
      exactSam2ImportDenialImplemented: true as const,
      cudaL4OnlyPreflightImplemented: true as const,
      cpuFallbackDisabled: true as const,
      runtimeDownloadsDisabled: true as const,
      opaqueSinglePngOutputImplemented: true as const,
      digestOnlyReceiptImplemented: true as const,
      semanticRegistryPolicyPreserved: true as const,
    },
    blockers: BLOCKERS,
    boundaries: {
      sourceContractVerified: true as const,
      runnerSourceImplemented: true as const,
      localConfinementEvidenceConsumedAsInput: true as const,
      privateLocalExactModelBundleBytesVerified: true as const,
      privateLocalAtomicReadOnlyMountVerified: true as const,
      runtimeImageBuiltFromCurrentSource: false as const,
      runtimeImageScannedAndSigned: false as const,
      exactModelBundleIngested: false as const,
      exactModelBundleReadOnlyMountVerified: false as const,
      modelLicenseAndPaidUseApproved: false as const,
      cloudRunL4ContainerStarted: false as const,
      cloudRunL4CudaCompatibilityVerified: false as const,
      comfyUiInferenceVerified: false as const,
      outputArtifactCommitVerified: false as const,
      outputQaAndPrivateReviewVerified: false as const,
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

export async function assertCanonicalComfyUiGpuRuntimeContract(
  value: unknown,
): Promise<CanonicalComfyUiGpuRuntimeContract> {
  const expected = await getCanonicalComfyUiGpuRuntimeContract()
  if (
    stableAuthorityStringify(value)
      !== stableAuthorityStringify(expected)
  ) {
    throw blocked('comfyui_gpu_runtime_contract_mismatch')
  }
  return expected
}

async function readAndValidateSourceFiles():
Promise<readonly CanonicalComfyUiGpuRuntimeSourceFile[]> {
  const values = await Promise.all(
    SOURCE_PATHS.map((path) => readSourceFile(path)),
  )
  if (
    stableAuthorityStringify(values)
      !== stableAuthorityStringify(EXPECTED_SOURCE_FILES)
  ) {
    throw blocked('comfyui_gpu_runtime_source_identity_mismatch')
  }
  validateRunner(await readSourceText(SOURCE_PATHS[0]))
  validateLocks({
    requirements:
      await readSourceText(SOURCE_PATHS[1]),
    provenance:
      await readSourceText(SOURCE_PATHS[2]),
    modelPaths:
      await readSourceText(SOURCE_PATHS[3]),
    installer:
      await readSourceText(SOURCE_PATHS[4]),
    verifier:
      await readSourceText(SOURCE_PATHS[5]),
  })
  return values
}

async function readSourceFile(
  relativePath: string,
): Promise<CanonicalComfyUiGpuRuntimeSourceFile> {
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
      throw blocked('comfyui_gpu_runtime_source_file_invalid')
    }
    const bytes = await handle.readFile()
    return {
      relativePath,
      byteLength: bytes.length,
      contentSha256:
        createHash('sha256').update(bytes).digest('hex'),
      executable: (metadata.mode & 0o111) !== 0,
    }
  } finally {
    await handle.close()
  }
}

async function readSourceText(relativePath: string): Promise<string> {
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
      throw blocked('comfyui_gpu_runtime_source_file_invalid')
    }
    return (await handle.readFile()).toString('utf8')
  } finally {
    await handle.close()
  }
}

function validateRunner(value: string): void {
  const required = [
    'REQUEST_VERSION = "canonical-comfyui-gpu-runtime-request-v1"',
    'OPERATION_ID = "tool.comfyui.generate_controlled_image.v1"',
    '"/mnt/reeditpro/model-artifacts/checkpoints/"',
    '"/mnt/reeditpro/private-output"',
    '"SaveImageWebsocket"',
    '"sam2" or fullname.startswith("sam2.")',
    'torch.cuda.device_count() != 1',
    'device_name != "NVIDIA L4"',
    'allModelsVerifiedBeforeAndAfterInference',
    'os.killpg(process.pid, signal.SIGTERM)',
    'artifactCommitAuthority',
    'qaPassAuthority',
  ]
  if (
    required.some((token) => !value.includes(token))
    || /\b(?:urlopen|requests\.|snapshot_download)\b/u.test(value)
    || /\bdevice\s*=\s*["']cpu["']/u.test(value)
  ) {
    throw blocked('comfyui_gpu_runner_policy_invalid')
  }
}

function validateLocks(input: {
  requirements: string
  provenance: string
  modelPaths: string
  installer: string
  verifier: string
}): void {
  const requirements = input.requirements
    .split(/\r?\n/u)
    .filter(Boolean)
  if (
    requirements.length !== 35
    || requirements.some((line) =>
      !/^[A-Za-z0-9_.-]+==[A-Za-z0-9_.+-]+ --hash=sha256:[a-f0-9]{64}$/u
        .test(line))
    || !input.provenance.includes('wheel_artifact_count=35')
    || !input.provenance.includes(
      'wheel_artifact_total_byte_length=486459097',
    )
    || !input.provenance.includes(
      'source.0.revision=093d571b83e7a79833200e199b46b9f5a62217f9',
    )
    || !input.provenance.includes(
      'source.1.revision=b188a6cb39b512a9c6da7235b880af42c78ccd0d',
    )
    || !input.provenance.includes(
      'source.2.revision=e8b689a513c3e6b63edc44066560ca5919c0576e',
    )
    || !input.modelPaths.includes(
      'base_path: /mnt/reeditpro/model-artifacts',
    )
    || !input.installer.includes('--no-index')
    || !input.installer.includes('--no-deps')
    || !input.installer.includes('--require-hashes')
    || !input.installer.includes('--force-reinstall')
    || !input.verifier.includes(
      'modelWeightsBakedIntoImage":false',
    )
  ) {
    throw blocked('comfyui_gpu_offline_package_lock_invalid')
  }
}

function assertCatalogBoundary(): void {
  const profile = getNonE2EToolCapabilityProfile('comfyui')
  if (
    profile?.toolId !== 'comfyui'
    || profile.workerType !== 'gpu_ai_worker'
    || profile.productionStatus !== 'evaluation_only'
    || resolveProfessionalToolOperationSpec('comfyui') !== undefined
  ) {
    throw blocked('comfyui_gpu_runtime_catalog_boundary_changed')
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
    requiredGate: 'canonical_comfyui_gpu_runtime_contract',
  })
}
