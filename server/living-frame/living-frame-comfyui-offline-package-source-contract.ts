import { createHash } from 'node:crypto'
import { open } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import {
  LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES,
  LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS,
  LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256,
} from './living-frame-comfyui-dependency-lock-manifest'
import {
  fixedLivingFrameComfyUiLaunchSpec,
} from './living-frame-controlled-sdxl-comfyui-process-supervisor'

export const
LIVING_FRAME_COMFYUI_OFFLINE_PACKAGE_SOURCE_CONTRACT_VERSION =
  'living-frame-comfyui-offline-package-source-contract-v1' as const

const SOURCE_ROOT =
  'docker/prod/gpu-worker/comfyui' as const
const SOURCE_FILES = [
  `${SOURCE_ROOT}/requirements.lock.txt`,
  `${SOURCE_ROOT}/source-provenance.lock`,
  `${SOURCE_ROOT}/install-offline.sh`,
  `${SOURCE_ROOT}/extra_model_paths.yaml`,
  `${SOURCE_ROOT}/README.md`,
] as const
const MAXIMUM_SOURCE_FILE_BYTES = 128 * 1_024

export interface LivingFrameComfyUiOfflinePackageSourceFile {
  readonly canonicalOrder: number
  readonly relativePath: (typeof SOURCE_FILES)[number]
  readonly byteLength: number
  readonly contentSha256: string
}

export interface LivingFrameComfyUiOfflinePackageSourceContract {
  readonly contractVersion:
    typeof
      LIVING_FRAME_COMFYUI_OFFLINE_PACKAGE_SOURCE_CONTRACT_VERSION
  readonly contractClass:
    'source_verified_offline_comfyui_package_candidate_unqualified'
  readonly sourceFiles:
    readonly LivingFrameComfyUiOfflinePackageSourceFile[]
  readonly dependencyClosure: {
    readonly wheelArtifactCount: 35
    readonly wheelArtifactTotalByteLength: 486_459_097
    readonly wheelManifestDigestSha256: string
    readonly exactRequirementLineCount: 35
    readonly installNetworkMode: 'none'
    readonly installIndexMode: 'no_index'
    readonly dependencyResolutionMode: 'no_deps'
    readonly requireHashes: true
  }
  readonly sourceClosure: {
    readonly sourceArchiveCount: 3
    readonly repositoryMetadataIncluded: false
    readonly runtimeDownloadsAllowed: false
  }
  readonly offlineInstaller: {
    readonly fixedBuildInputRoot:
      '/opt/reeditpro/build-inputs/comfyui'
    readonly fixedTargetRoot:
      '/opt/reeditpro/gpu-operations/comfyui'
    readonly fixedModelMountRoot:
      '/mnt/reeditpro/model-artifacts'
    readonly fixedPrivateInputRoot:
      '/mnt/reeditpro/private-input'
    readonly installerArgumentsAllowed: false
    readonly wheelhouseEntryCount: 35
    readonly wheelhouseTotalByteLength: 486_459_097
    readonly pythonVersion: '3.10.12'
    readonly venvUsesSystemSitePackages: true
    readonly sourceArchiveHashesVerified: true
    readonly wheelHashesVerifiedByPip: true
    readonly customNodeDirectoriesExactlyTwo: true
    readonly imageContainsModelWeights: false
    readonly runtimeDownloadsAllowed: false
  }
  readonly processContract: {
    readonly fixedLaunchSpecDigestSha256: string
    readonly loopbackAddress: '127.0.0.1'
    readonly loopbackPort: 8188
    readonly oneProcessPerAttempt: true
    readonly callerOverridesAllowed: false
    readonly externalListenAllowed: false
  }
  readonly capabilityAndCostBoundary: {
    readonly oneGpuAttemptCapabilityKeys: readonly [
      'comfyui',
      'comfyui_controlnet_aux',
      'controlnet',
      'ip_adapter',
      'peft_lora',
    ]
    readonly auraFaceExecutionClass: 'separate_optional_cpu_qa'
    readonly sixProductionToolIdsCreated: false
    readonly fiveSeparateGpuChargesCreated: false
    readonly exactReuseCreatesNoGpuAttempt: true
  }
  readonly boundaries: {
    readonly sourceContractVerified: true
    readonly packageDependencyClosureDeclared: true
    readonly exactSourceArchiveClosureDeclared: true
    readonly fixedProcessSupervisorLinked: true
    readonly offlineInstallerSourceVerified: true
    readonly fixedModelMountLayoutDeclared: true
    readonly wheelArtifactsIncludedInRepository: false
    readonly sourceArchivesIncludedInRepository: false
    readonly runtimeImageBuilt: false
    readonly runtimeImageScanned: false
    readonly runtimeImageSigned: false
    readonly runtimeImageQualified: false
    readonly canonicalOperationRegistered: false
    readonly canonicalRouterAdmission: false
    readonly modelArtifactsMounted: false
    readonly gpuExecutionObserved: false
    readonly actualCostEvidenceCreated: false
    readonly customerCreditAuthority: false
    readonly providerAuthority: false
    readonly toolRegistryAuthority: false
    readonly workGraphAuthority: false
    readonly queueAuthority: false
    readonly assetManifestAuthority: false
    readonly approvalAuthority: false
    readonly snapshotAuthority: false
    readonly renderAuthority: false
    readonly runtimeAuthority: false
    readonly productionAuthority: false
    readonly productionReady: false
  }
  readonly sourceDigestSha256: string
  readonly contractDigestSha256: string
}

export class LivingFrameComfyUiOfflinePackageSourceContractError
  extends Error {
  readonly code:
    | 'source_file_missing'
    | 'source_file_invalid'
    | 'requirements_lock_mismatch'
    | 'source_provenance_mismatch'
    | 'offline_installer_mismatch'
    | 'extra_model_paths_mismatch'
    | 'readme_boundary_mismatch'
    | 'contract_mismatch'

  constructor(
    code:
      LivingFrameComfyUiOfflinePackageSourceContractError['code'],
  ) {
    super('Living Frame ComfyUI offline package source is invalid.')
    this.name =
      'LivingFrameComfyUiOfflinePackageSourceContractError'
    this.code = code
  }
}

export async function getLivingFrameComfyUiOfflinePackageSourceContract():
Promise<LivingFrameComfyUiOfflinePackageSourceContract> {
  const sourceFiles = await Promise.all(
    SOURCE_FILES.map(async (relativePath, canonicalOrder) => {
      const bytes = await readBoundedSource(relativePath)
      return {
        canonicalOrder,
        relativePath,
        byteLength: bytes.byteLength,
        contentSha256: sha256(bytes),
      }
    }),
  )
  const requirements = await readText(SOURCE_FILES[0])
  const provenance = await readText(SOURCE_FILES[1])
  const installer = await readText(SOURCE_FILES[2])
  const extraModelPaths = await readText(SOURCE_FILES[3])
  const readme = await readText(SOURCE_FILES[4])
  assertRequirements(requirements)
  assertProvenance(provenance)
  assertInstaller(installer)
  assertExtraModelPaths(extraModelPaths)
  assertReadme(readme)

  const launchSpec = fixedLivingFrameComfyUiLaunchSpec()
  const sourceDigestSha256 = digest(sourceFiles)
  const draft = {
    contractVersion:
      LIVING_FRAME_COMFYUI_OFFLINE_PACKAGE_SOURCE_CONTRACT_VERSION,
    contractClass: (
      'source_verified_offline_comfyui_package_candidate_unqualified'
    ) as const,
    sourceFiles,
    dependencyClosure: {
      wheelArtifactCount: 35 as const,
      wheelArtifactTotalByteLength: 486_459_097 as const,
      wheelManifestDigestSha256:
        LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256,
      exactRequirementLineCount: 35 as const,
      installNetworkMode: 'none' as const,
      installIndexMode: 'no_index' as const,
      dependencyResolutionMode: 'no_deps' as const,
      requireHashes: true as const,
    },
    sourceClosure: {
      sourceArchiveCount: 3 as const,
      repositoryMetadataIncluded: false as const,
      runtimeDownloadsAllowed: false as const,
    },
    offlineInstaller: {
      fixedBuildInputRoot:
        '/opt/reeditpro/build-inputs/comfyui' as const,
      fixedTargetRoot:
        '/opt/reeditpro/gpu-operations/comfyui' as const,
      fixedModelMountRoot:
        '/mnt/reeditpro/model-artifacts' as const,
      fixedPrivateInputRoot:
        '/mnt/reeditpro/private-input' as const,
      installerArgumentsAllowed: false as const,
      wheelhouseEntryCount: 35 as const,
      wheelhouseTotalByteLength: 486_459_097 as const,
      pythonVersion: '3.10.12' as const,
      venvUsesSystemSitePackages: true as const,
      sourceArchiveHashesVerified: true as const,
      wheelHashesVerifiedByPip: true as const,
      customNodeDirectoriesExactlyTwo: true as const,
      imageContainsModelWeights: false as const,
      runtimeDownloadsAllowed: false as const,
    },
    processContract: {
      fixedLaunchSpecDigestSha256: digest(launchSpec),
      loopbackAddress: '127.0.0.1' as const,
      loopbackPort: 8188 as const,
      oneProcessPerAttempt: true as const,
      callerOverridesAllowed: false as const,
      externalListenAllowed: false as const,
    },
    capabilityAndCostBoundary: {
      oneGpuAttemptCapabilityKeys: [
        'comfyui',
        'comfyui_controlnet_aux',
        'controlnet',
        'ip_adapter',
        'peft_lora',
      ] as const,
      auraFaceExecutionClass:
        'separate_optional_cpu_qa' as const,
      sixProductionToolIdsCreated: false as const,
      fiveSeparateGpuChargesCreated: false as const,
      exactReuseCreatesNoGpuAttempt: true as const,
    },
    boundaries: {
      sourceContractVerified: true as const,
      packageDependencyClosureDeclared: true as const,
      exactSourceArchiveClosureDeclared: true as const,
      fixedProcessSupervisorLinked: true as const,
      offlineInstallerSourceVerified: true as const,
      fixedModelMountLayoutDeclared: true as const,
      wheelArtifactsIncludedInRepository: false as const,
      sourceArchivesIncludedInRepository: false as const,
      runtimeImageBuilt: false as const,
      runtimeImageScanned: false as const,
      runtimeImageSigned: false as const,
      runtimeImageQualified: false as const,
      canonicalOperationRegistered: false as const,
      canonicalRouterAdmission: false as const,
      modelArtifactsMounted: false as const,
      gpuExecutionObserved: false as const,
      actualCostEvidenceCreated: false as const,
      customerCreditAuthority: false as const,
      providerAuthority: false as const,
      toolRegistryAuthority: false as const,
      workGraphAuthority: false as const,
      queueAuthority: false as const,
      assetManifestAuthority: false as const,
      approvalAuthority: false as const,
      snapshotAuthority: false as const,
      renderAuthority: false as const,
      runtimeAuthority: false as const,
      productionAuthority: false as const,
      productionReady: false as const,
    },
    sourceDigestSha256,
  }
  return deepFreeze({
    ...draft,
    contractDigestSha256: digest(draft),
  })
}

export async function assertLivingFrameComfyUiOfflinePackageSourceContract(
  value: unknown,
): Promise<LivingFrameComfyUiOfflinePackageSourceContract> {
  const expected =
    await getLivingFrameComfyUiOfflinePackageSourceContract()
  if (canonicalJson(value) !== canonicalJson(expected)) {
    throw new LivingFrameComfyUiOfflinePackageSourceContractError(
      'contract_mismatch',
    )
  }
  return expected
}

function expectedRequirementLines(): readonly string[] {
  return LIVING_FRAME_COMFYUI_LOCKED_WHEEL_ARTIFACTS.map(
    (artifact) =>
      `${artifact.distributionName}==${artifact.version}`
      + ` --hash=sha256:${artifact.sha256}`,
  )
}

function expectedProvenanceLines(): readonly string[] {
  const lines = [
    'contract=weeditpro-comfyui-offline-source-closure-v1',
    'platform=linux/amd64',
    'python_version=3.10.12',
    'cuda_runtime_family=12.4',
    'wheel_install_network_mode=none',
    'wheel_install_index_mode=no_index',
    'wheel_install_dependency_resolution=no_deps',
    'wheel_artifact_count=35',
    'wheel_artifact_total_byte_length=486459097',
    `wheel_manifest_sha256=${
      LIVING_FRAME_COMFYUI_LOCKED_WHEEL_MANIFEST_DIGEST_SHA256
    }`,
    'source_archive_count=3',
  ]
  for (const [index, source] of
    LIVING_FRAME_COMFYUI_LOCKED_SOURCE_ARCHIVES.entries()) {
    lines.push(
      `source.${index}.code=${source.sourceCode}`,
      `source.${index}.revision=${source.repositoryRevision}`,
      `source.${index}.tree=${source.repositoryTree}`,
      `source.${index}.file_count=${source.archiveFileCount}`,
      `source.${index}.byte_length=${source.archiveByteLength}`,
      `source.${index}.sha256=${source.archiveSha256}`,
    )
  }
  lines.push(
    'runtime_network_fetch_allowed=false',
    'runtime_model_download_allowed=false',
    'runtime_external_listen_allowed=false',
    'runtime_cpu_fallback_allowed=false',
    'production_qualified=false',
  )
  return lines
}

function assertRequirements(value: string): void {
  if (
    canonicalJson(nonEmptyLines(value))
      !== canonicalJson(expectedRequirementLines())
  ) {
    throw new LivingFrameComfyUiOfflinePackageSourceContractError(
      'requirements_lock_mismatch',
    )
  }
}

function assertProvenance(value: string): void {
  if (
    canonicalJson(nonEmptyLines(value))
      !== canonicalJson(expectedProvenanceLines())
  ) {
    throw new LivingFrameComfyUiOfflinePackageSourceContractError(
      'source_provenance_mismatch',
    )
  }
}

function assertInstaller(value: string): void {
  const required = [
    '#!/bin/sh',
    'if [ "$#" -ne 0 ]',
    'PIP_NO_INDEX=1',
    'HF_HUB_OFFLINE=1',
    'TRANSFORMERS_OFFLINE=1',
    'PACKAGE_INPUT_ROOT=/opt/reeditpro/build-inputs/comfyui/package',
    'WHEELHOUSE_ROOT=/opt/reeditpro/build-inputs/comfyui/wheelhouse',
    'SOURCE_ARCHIVE_ROOT=/opt/reeditpro/build-inputs/comfyui/sources',
    'TARGET_ROOT=/opt/reeditpro/gpu-operations/comfyui',
    'PRIVATE_INPUT_ROOT=/mnt/reeditpro/private-input',
    'comfyui-host.tar',
    'generic-ipadapter-extension.tar',
    'controlnet-aux-extension.tar',
    'python3 -m venv --system-site-packages',
    '--no-index',
    '--no-deps',
    '--require-hashes',
    '--find-links',
    'ComfyUI_IPAdapter_plus',
    'comfyui_controlnet_aux',
  ]
  const forbidden = [
    'curl ',
    'wget ',
    'git clone',
    'http://',
    'https://',
    'pip download',
    '0.0.0.0',
  ]
  if (
    value.length < 4_000
    || value.length > 16_000
    || !required.every((text) => value.includes(text))
    || forbidden.some((text) => value.includes(text))
  ) {
    throw new LivingFrameComfyUiOfflinePackageSourceContractError(
      'offline_installer_mismatch',
    )
  }
}

function assertExtraModelPaths(value: string): void {
  const expected = [
    'reeditpro_living_frame:',
    '  base_path: /mnt/reeditpro/model-artifacts',
    '  is_default: true',
    '  checkpoints: checkpoints',
    '  controlnet: controlnet',
    '  loras: loras',
    '  clip_vision: clip_vision',
    '  ipadapter: ipadapter',
    '',
  ].join('\n')
  if (value.replace(/\r\n/gu, '\n') !== expected) {
    throw new LivingFrameComfyUiOfflinePackageSourceContractError(
      'extra_model_paths_mismatch',
    )
  }
}

function assertReadme(value: string): void {
  const required = [
    'tool.comfyui.generate_controlled_image.v1',
    '--no-index',
    '--no-deps',
    '--require-hashes',
    'AuraFace',
    'one GPU attempt',
    'production use',
  ]
  if (
    value.length < 1_000
    || value.length > 16_000
    || !required.every((text) => value.includes(text))
  ) {
    throw new LivingFrameComfyUiOfflinePackageSourceContractError(
      'readme_boundary_mismatch',
    )
  }
}

async function readText(
  relativePath: (typeof SOURCE_FILES)[number],
): Promise<string> {
  return new TextDecoder(
    'utf-8',
    { fatal: true },
  ).decode(await readBoundedSource(relativePath))
}

async function readBoundedSource(
  relativePath: (typeof SOURCE_FILES)[number],
): Promise<Uint8Array> {
  const absolutePath = fileURLToPath(
    new URL(`../../${relativePath}`, import.meta.url),
  )
  let handle
  try {
    handle = await open(absolutePath, 'r')
  } catch {
    throw new LivingFrameComfyUiOfflinePackageSourceContractError(
      'source_file_missing',
    )
  }
  try {
    const stat = await handle.stat()
    if (
      !stat.isFile()
      || stat.isSymbolicLink()
      || stat.size < 1
      || stat.size > MAXIMUM_SOURCE_FILE_BYTES
    ) {
      throw new LivingFrameComfyUiOfflinePackageSourceContractError(
        'source_file_invalid',
      )
    }
    const bytes = new Uint8Array(stat.size)
    const read = await handle.read(bytes, 0, stat.size, 0)
    if (read.bytesRead !== stat.size) {
      throw new LivingFrameComfyUiOfflinePackageSourceContractError(
        'source_file_invalid',
      )
    }
    return bytes
  } finally {
    await handle.close()
  }
}

function nonEmptyLines(value: string): readonly string[] {
  return value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}
