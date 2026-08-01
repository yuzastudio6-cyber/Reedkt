import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

import type {
  LivingFrameComfyUiFiveModelLocalMountObservation,
} from '../../src/types/living-frame-comfyui-five-model-local-mount-evidence'
import {
  createLivingFrameComfyUiFiveModelLocalMountEvidence,
  createLivingFrameComfyUiFiveModelLocalMountObservationPort,
  fixedLivingFrameComfyUiFiveModelLocalMountLaunchSpec,
  LIVING_FRAME_COMFYUI_FIVE_MODEL_ARTIFACTS,
  LIVING_FRAME_COMFYUI_FIVE_MODEL_BUNDLE_DIGEST_SHA256,
  LIVING_FRAME_COMFYUI_FIVE_MODEL_ENTRYPOINT_DIGEST_SHA256,
  LIVING_FRAME_COMFYUI_FIVE_MODEL_ENVIRONMENT_DIGEST_SHA256,
  LIVING_FRAME_COMFYUI_FIVE_MODEL_PARENT_IMAGE_DIGEST_SHA256,
  verifyLivingFrameComfyUiFiveModelLocalMountEvidence,
} from '../living-frame/living-frame-comfyui-five-model-local-mount-evidence'

const BASE_IMAGE =
  'reeditpro-living-frame-comfyui-locked-candidate:local'
const DERIVED_IMAGE =
  'reeditpro-living-frame-comfyui-five-model-mount-candidate:internal'
const DOCKERFILE =
  'docker/prod/gpu-worker/comfyui/Dockerfile.local-five-model-mount-candidate'
const BUILD_CONTEXT = 'docker/prod/gpu-worker/comfyui'
const ENTRYPOINT_SOURCE =
  `${BUILD_CONTEXT}/local-five-model-mount-entrypoint.py`
const EXPECTED_ENTRYPOINT = [
  '/usr/bin/python3',
  '-I',
  '-B',
  '/opt/reeditpro/local-five-model-mount-entrypoint.py',
] as const
const EXPECTED_EXIT_CODE = 78
const RUN_TIMEOUT_MILLISECONDS = 20 * 60_000

const MODEL_PATH_SPECS = [
  {
    environmentKey: 'REEDITPRO_SDXL_BASE_MODEL_PATH',
    privateTmpPrefix: 'reeditpro-lf-sdxl-base-eval.',
    privateTmpFile: 'sd_xl_base_1.0.safetensors',
    target:
      '/mnt/reeditpro/model-artifacts/checkpoints/sd_xl_base_1.0.safetensors',
  },
  {
    environmentKey: 'REEDITPRO_SDXL_CONTROLNET_MODEL_PATH',
    privateTmpPrefix:
      'reeditpro-lf-sdxl-controlnet-eval.',
    privateTmpFile:
      'controlnet-canny-sdxl-small.fp16.safetensors',
    target:
      '/mnt/reeditpro/model-artifacts/controlnet/controlnet-canny-sdxl-small.fp16.safetensors',
  },
  {
    environmentKey: 'REEDITPRO_SDXL_LORA_MODEL_PATH',
    privateTmpPrefix: 'reeditpro-lf-sdxl-lora-eval.',
    privateTmpFile: 'sdxl-offset-lora.safetensors',
    target:
      '/mnt/reeditpro/model-artifacts/loras/sdxl-offset-lora.safetensors',
  },
  {
    environmentKey: 'REEDITPRO_SDXL_IPADAPTER_MODEL_PATH',
    privateTmpPrefix:
      'reeditpro-lf-sdxl-ipadapter-eval.',
    privateTmpFile: 'ip-adapter_sdxl.safetensors',
    target:
      '/mnt/reeditpro/model-artifacts/ipadapter/ip-adapter_sdxl.safetensors',
  },
  {
    environmentKey: 'REEDITPRO_SDXL_CLIP_VISION_MODEL_PATH',
    privateTmpPrefix:
      'reeditpro-lf-sdxl-clip-vision-eval.',
    privateTmpFile: 'clip-vision-vit-big-g.safetensors',
    target:
      '/mnt/reeditpro/model-artifacts/clip_vision/clip-vision-vit-big-g.safetensors',
  },
] as const

if (!imageAvailable(BASE_IMAGE)) {
  process.stdout.write(`${JSON.stringify({
    smoke:
      'living_frame_comfyui_five_model_local_mount_internal_test',
    status: 'skipped_exact_locked_local_candidate_image_unavailable',
    privateInternalOnly: true,
    productionReady: false,
  })}\n`)
  process.exit(0)
}

const modelPaths = resolveModelPaths()
if (modelPaths === null) {
  process.stdout.write(`${JSON.stringify({
    smoke:
      'living_frame_comfyui_five_model_local_mount_internal_test',
    status: 'skipped_exact_private_model_bundle_unavailable',
    privateInternalOnly: true,
    productionReady: false,
  })}\n`)
  process.exit(0)
}

assert.equal(
  sha256(readFileSync(ENTRYPOINT_SOURCE)),
  LIVING_FRAME_COMFYUI_FIVE_MODEL_ENTRYPOINT_DIGEST_SHA256,
)
for (const [index, artifact] of
  LIVING_FRAME_COMFYUI_FIVE_MODEL_ARTIFACTS.entries()) {
  assert.equal(
    statSync(modelPaths[index].source).size,
    artifact.byteLength,
  )
}

assert.equal(
  inspectImage(BASE_IMAGE).Id,
  `sha256:${LIVING_FRAME_COMFYUI_FIVE_MODEL_PARENT_IMAGE_DIGEST_SHA256}`,
)
buildDerivedImage()
const derived = inspectImage(DERIVED_IMAGE)
assert.equal(derived.Os, 'linux')
assert.equal(derived.Architecture, 'amd64')
assert.equal(derived.Config.User, '65532:65532')
assert.deepEqual(derived.Config.Entrypoint, EXPECTED_ENTRYPOINT)
assert.equal(derived.Config.Cmd ?? null, null)
assert.equal(
  derived.Config.Labels[
    'org.reeditpro.living-frame.runtime-class'
  ],
  'controlled-local-five-model-mount-candidate',
)
assert.equal(
  derived.Config.Labels[
    'org.reeditpro.living-frame.parent-image-sha256'
  ],
  LIVING_FRAME_COMFYUI_FIVE_MODEL_PARENT_IMAGE_DIGEST_SHA256,
)
assert.equal(
  derived.Config.Labels[
    'org.reeditpro.living-frame.entrypoint-source-sha256'
  ],
  LIVING_FRAME_COMFYUI_FIVE_MODEL_ENTRYPOINT_DIGEST_SHA256,
)

assertRejectedCallerArguments()
assertRejectedRootIdentityOverride()
assertRejectedIncompleteAtomicMount(modelPaths)

const launchSpec =
  fixedLivingFrameComfyUiFiveModelLocalMountLaunchSpec()
const controlledObservation =
  observeExactFiveModelMount(derived, modelPaths, launchSpec)
const observationPort =
  createLivingFrameComfyUiFiveModelLocalMountObservationPort(
    async () => controlledObservation,
  )
const evidence =
  await createLivingFrameComfyUiFiveModelLocalMountEvidence({
    evidenceId: 'lf.comfyui.five-model-local-mount.001',
    observationPort,
  })
assert.equal(
  verifyLivingFrameComfyUiFiveModelLocalMountEvidence(evidence),
  true,
)
assert.equal(evidence.modelMount.modelArtifactCount, 5)
assert.equal(
  evidence.modelMount.aggregateByteLength,
  11_700_367_157,
)
assert.equal(
  evidence.modelMount.bundleDigestSha256,
  LIVING_FRAME_COMFYUI_FIVE_MODEL_BUNDLE_DIGEST_SHA256,
)
assert.equal(
  evidence.modelMount.atomicFiveModelMountLifetimeObserved,
  true,
)
assert.equal(
  evidence.modelMount.modelMountsReadOnlyObserved,
  true,
)
assert.equal(evidence.runtime.cudaAvailable, false)
assert.equal(evidence.runtime.cudaDeviceCount, 0)
assert.equal(evidence.runtime.modelInferenceExecuted, false)
assert.equal(evidence.runtime.gpuExecutionPerformed, false)
assert.equal(evidence.canonicalOperationDispatched, false)
assert.equal(evidence.actualCostEvidenceCreated, false)
assert.equal(evidence.customerChargeCreated, false)
assert.equal(evidence.artifactPersisted, false)
assert.equal(evidence.publicDeliveryCreated, false)
assert.equal(evidence.productionReady, false)

const forged = {
  ...evidence,
  runtime: {
    ...evidence.runtime,
    gpuExecutionPerformed: true,
  },
}
assert.equal(
  verifyLivingFrameComfyUiFiveModelLocalMountEvidence(forged),
  false,
)
await assert.rejects(
  () =>
    createLivingFrameComfyUiFiveModelLocalMountEvidence({
      evidenceId: 'lf.comfyui.five-model-local-mount.reuse',
      observationPort,
    }),
  /five-model mount evidence failed/,
)

const serialized = JSON.stringify(evidence).toLowerCase()
for (const forbidden of [
  '/private/tmp/',
  '/mnt/reeditpro/',
  '/opt/comfyui/',
  'http://',
  'https://',
  'file://',
  'sd_xl_base_1.0.safetensors',
  'ip-adapter_sdxl.safetensors',
  'clip-vision-vit-big-g.safetensors',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

process.stdout.write(`${JSON.stringify({
  smoke:
    'living_frame_comfyui_five_model_local_mount_internal_test',
  status: 'passed',
  evidenceClass: evidence.evidenceClass,
  parentImageDigestSha256:
    evidence.image.parentImageDigestSha256,
  derivedImageDigestSha256:
    evidence.image.derivedImageDigestSha256,
  modelArtifactCount:
    evidence.modelMount.modelArtifactCount,
  aggregateByteLength:
    evidence.modelMount.aggregateByteLength,
  bundleDigestSha256:
    evidence.modelMount.bundleDigestSha256,
  atomicFiveModelMountLifetimeObserved:
    evidence.modelMount.atomicFiveModelMountLifetimeObserved,
  modelMountsReadOnlyObserved:
    evidence.modelMount.modelMountsReadOnlyObserved,
  sam2ImportBlocked:
    evidence.modelMount.sam2ImportBlocked,
  cudaAvailable: evidence.runtime.cudaAvailable,
  cudaDeviceCount: evidence.runtime.cudaDeviceCount,
  expectedGpuRefusalExitCode: evidence.runtime.exitCode,
  elapsedMilliseconds:
    evidence.runtime.elapsedMilliseconds,
  promptSubmitted: evidence.runtime.promptSubmitted,
  modelInferenceExecuted:
    evidence.runtime.modelInferenceExecuted,
  gpuExecutionPerformed:
    evidence.runtime.gpuExecutionPerformed,
  canonicalOperationDispatched:
    evidence.canonicalOperationDispatched,
  actualCostEvidenceCreated:
    evidence.actualCostEvidenceCreated,
  customerChargeCreated:
    evidence.customerChargeCreated,
  publicDeliveryCreated: evidence.publicDeliveryCreated,
  productionReady: evidence.productionReady,
})}\n`)

interface DockerImageInspection {
  readonly Id: string
  readonly Os: string
  readonly Architecture: string
  readonly Config: {
    readonly User: string
    readonly Entrypoint: readonly string[]
    readonly Cmd?: readonly string[] | null
    readonly Labels: Readonly<Record<string, string>>
  }
}

interface DockerContainerInspection {
  readonly Config: {
    readonly User: string
    readonly Entrypoint: readonly string[]
  }
  readonly HostConfig: {
    readonly NetworkMode: string
    readonly ReadonlyRootfs: boolean
    readonly CapDrop: readonly string[]
    readonly SecurityOpt: readonly string[]
    readonly PidsLimit: number
    readonly Memory: number
    readonly NanoCpus: number
    readonly Tmpfs: Readonly<Record<string, string>>
  }
  readonly Mounts: readonly {
    readonly Destination: string
    readonly RW: boolean
  }[]
  readonly State: {
    readonly ExitCode: number
  }
}

interface ModelPath {
  readonly source: string
  readonly target: string
}

interface RuntimeReceipt {
  readonly event:
    'living_frame_comfyui_five_model_mount_verified_cuda_required'
  readonly aggregateByteLength: 11_700_367_157
  readonly atomicFiveModelMountLifetimeObserved: true
  readonly bundleDigestSha256: string
  readonly completedAt: string
  readonly cudaAvailable: false
  readonly cudaDeviceCount: 0
  readonly environmentDigestSha256: string
  readonly modelArtifactCount: 5
  readonly modelArtifacts:
    readonly {
      readonly canonicalOrder: number
      readonly role: string
      readonly byteLength: number
      readonly contentSha256: string
      readonly readOnlyMountObserved: true
    }[]
  readonly modelInferenceExecuted: false
  readonly modelMountsReadOnlyObserved: true
  readonly outputArtifactCreated: false
  readonly promptSubmitted: false
  readonly gpuExecutionPerformed: false
  readonly sam2ImportBlocked: true
  readonly sensitiveDetailsIncluded: false
  readonly startedAt: string
  readonly torchVersion: '2.5.1+cu124'
  readonly torchvisionVersion: '0.20.1+cu124'
}

function resolveModelPaths(): readonly ModelPath[] | null {
  const resolved: ModelPath[] = []
  for (const spec of MODEL_PATH_SPECS) {
    const configured = process.env[spec.environmentKey]?.trim()
    const source = configured && configured.length > 0
      ? configured
      : findPrivateTmpArtifact(
        spec.privateTmpPrefix,
        spec.privateTmpFile,
      )
    if (!source) return null
    resolved.push({ source, target: spec.target })
  }
  return resolved
}

function findPrivateTmpArtifact(
  directoryPrefix: string,
  fileName: string,
): string | null {
  const candidates = readdirSync('/private/tmp')
    .filter((entry) => entry.startsWith(directoryPrefix))
    .sort()
    .reverse()
  for (const directory of candidates) {
    const candidate = join('/private/tmp', directory, fileName)
    try {
      if (statSync(candidate).isFile()) return candidate
    } catch {
      continue
    }
  }
  return null
}

function imageAvailable(image: string): boolean {
  return spawnSync(
    'docker',
    ['image', 'inspect', image],
    { encoding: 'utf8' },
  ).status === 0
}

function inspectImage(image: string): DockerImageInspection {
  const result = runDocker(
    ['image', 'inspect', image],
    'inspect image',
  )
  return JSON.parse(result.stdout)[0] as DockerImageInspection
}

function buildDerivedImage(): void {
  runDocker(
    [
      'build',
      '--platform',
      'linux/amd64',
      '--network',
      'none',
      '-f',
      DOCKERFILE,
      '-t',
      DERIVED_IMAGE,
      BUILD_CONTEXT,
    ],
    'build derived image',
  )
}

function assertRejectedCallerArguments(): void {
  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '--platform',
      'linux/amd64',
      '--network',
      'none',
      '--read-only',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges',
      '--pids-limit',
      '256',
      '--cpus',
      '2',
      '--memory',
      '4g',
      '--tmpfs',
      '/tmp:rw,noexec,nosuid,size=536870912,uid=65532,gid=65532,mode=0700',
      DERIVED_IMAGE,
      'forged-argument',
    ],
    { encoding: 'utf8', timeout: 60_000 },
  )
  assert.equal(result.status, 64)
}

function assertRejectedRootIdentityOverride(): void {
  const result = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '--platform',
      'linux/amd64',
      '--network',
      'none',
      '--read-only',
      '--user',
      '0:0',
      '--cap-drop',
      'ALL',
      '--security-opt',
      'no-new-privileges',
      '--pids-limit',
      '256',
      '--cpus',
      '2',
      '--memory',
      '4g',
      '--tmpfs',
      '/tmp:rw,noexec,nosuid,size=536870912,uid=65532,gid=65532,mode=0700',
      DERIVED_IMAGE,
    ],
    { encoding: 'utf8', timeout: 60_000 },
  )
  assert.equal(result.status, 65)
}

function assertRejectedIncompleteAtomicMount(
  models: readonly ModelPath[],
): void {
  const args = [
    'run',
    '--rm',
    '--platform',
    'linux/amd64',
    '--network',
    'none',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--pids-limit',
    '256',
    '--cpus',
    '2',
    '--memory',
    '4g',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,size=536870912,uid=65532,gid=65532,mode=0700',
  ]
  for (const model of models.slice(1)) {
    args.push(
      '--mount',
      `type=bind,source=${model.source},target=${model.target},readonly`,
    )
  }
  args.push(DERIVED_IMAGE)
  const result = spawnSync(
    'docker',
    args,
    { encoding: 'utf8', timeout: 60_000 },
  )
  assert.equal(result.status, 72)
}

function observeExactFiveModelMount(
  derived: DockerImageInspection,
  models: readonly ModelPath[],
  launchSpec:
    ReturnType<
      typeof fixedLivingFrameComfyUiFiveModelLocalMountLaunchSpec
    >,
): LivingFrameComfyUiFiveModelLocalMountObservation {
  const containerName =
    `reeditpro-lf-five-model-mount-${process.pid}`
  const createArgs = [
    'create',
    '--name',
    containerName,
    '--platform',
    'linux/amd64',
    '--network',
    'none',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--pids-limit',
    '256',
    '--cpus',
    '2',
    '--memory',
    '4g',
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,size=536870912,uid=65532,gid=65532,mode=0700',
    '--env',
    'REEDITPRO_FORGED_CALLER_VALUE=must-be-scrubbed',
  ]
  for (const model of models) {
    createArgs.push(
      '--mount',
      `type=bind,source=${model.source},target=${model.target},readonly`,
    )
  }
  createArgs.push(DERIVED_IMAGE)

  try {
    runDocker(createArgs, 'create controlled container')
    const inspection = inspectContainer(containerName)
    assert.equal(inspection.Config.User, '65532:65532')
    assert.deepEqual(
      inspection.Config.Entrypoint,
      EXPECTED_ENTRYPOINT,
    )
    assert.equal(inspection.HostConfig.NetworkMode, 'none')
    assert.equal(inspection.HostConfig.ReadonlyRootfs, true)
    assert.deepEqual(inspection.HostConfig.CapDrop, ['ALL'])
    assert.ok(
      inspection.HostConfig.SecurityOpt.includes(
        'no-new-privileges',
      ),
    )
    assert.equal(inspection.HostConfig.PidsLimit, 256)
    assert.equal(inspection.HostConfig.Memory, 4_294_967_296)
    assert.equal(inspection.HostConfig.NanoCpus, 2_000_000_000)
    assert.ok('/tmp' in inspection.HostConfig.Tmpfs)
    assert.equal(inspection.Mounts.length, 5)
    assert.deepEqual(
      inspection.Mounts
        .map((mount) => mount.Destination)
        .sort(),
      models.map((model) => model.target).sort(),
    )
    assert.ok(inspection.Mounts.every((mount) => !mount.RW))

    const result = spawnSync(
      'docker',
      ['start', '--attach', containerName],
      {
        encoding: 'utf8',
        timeout: RUN_TIMEOUT_MILLISECONDS,
        maxBuffer: 2 * 1_024 * 1_024,
      },
    )
    assert.equal(result.error, undefined)
    const completed = inspectContainer(containerName)
    assert.equal(completed.State.ExitCode, EXPECTED_EXIT_CODE)
    const receipt = parseReceipt(result.stdout)
    assert.equal(receipt.modelArtifactCount, 5)
    assert.equal(
      receipt.aggregateByteLength,
      11_700_367_157,
    )
    assert.equal(
      receipt.bundleDigestSha256,
      LIVING_FRAME_COMFYUI_FIVE_MODEL_BUNDLE_DIGEST_SHA256,
    )
    assert.equal(
      receipt.environmentDigestSha256,
      LIVING_FRAME_COMFYUI_FIVE_MODEL_ENVIRONMENT_DIGEST_SHA256,
    )
    assert.deepEqual(
      receipt.modelArtifacts,
      LIVING_FRAME_COMFYUI_FIVE_MODEL_ARTIFACTS,
    )

    const elapsed =
      Date.parse(receipt.completedAt)
      - Date.parse(receipt.startedAt)
    assert.ok(elapsed > 0)
    return {
      observationClass:
        'process_bound_local_comfyui_five_model_mount_observation_v1',
      parentImageDigestSha256:
        LIVING_FRAME_COMFYUI_FIVE_MODEL_PARENT_IMAGE_DIGEST_SHA256,
      derivedImageDigestSha256:
        derived.Id.replace(/^sha256:/u, ''),
      entrypointSourceDigestSha256:
        LIVING_FRAME_COMFYUI_FIVE_MODEL_ENTRYPOINT_DIGEST_SHA256,
      fixedLaunchSpecDigestSha256:
        sha256(Buffer.from(canonicalJson(launchSpec))),
      environmentDigestSha256:
        receipt.environmentDigestSha256,
      operatingSystem: 'linux',
      architecture: 'amd64',
      localArchitectureEmulationUsed: true,
      defaultUid: 65_532,
      defaultGid: 65_532,
      defaultEntrypointObserved: true,
      callerArgumentRejectionObserved: true,
      rootIdentityOverrideRejectionObserved: true,
      injectedCallerEnvironmentScrubbed: true,
      rootFilesystemReadOnlyObserved: true,
      allLinuxCapabilitiesDropped: true,
      noNewPrivilegesObserved: true,
      externalNetworkDisabled: true,
      runtimeDownloadsAllowed: false,
      ephemeralWriteRootOnly: true,
      processLimit: 256,
      cpuLimit: 2,
      memoryLimitBytes: 4_294_967_296,
      modelArtifactCount: 5,
      aggregateByteLength: 11_700_367_157,
      modelArtifacts:
        LIVING_FRAME_COMFYUI_FIVE_MODEL_ARTIFACTS,
      bundleDigestSha256:
        LIVING_FRAME_COMFYUI_FIVE_MODEL_BUNDLE_DIGEST_SHA256,
      atomicFiveModelMountLifetimeObserved: true,
      modelMountsReadOnlyObserved: true,
      sam2ImportBlocked: true,
      torchVersion: '2.5.1+cu124',
      torchvisionVersion: '0.20.1+cu124',
      cudaAvailable: false,
      cudaDeviceCount: 0,
      promptSubmitted: false,
      modelInferenceExecuted: false,
      gpuExecutionPerformed: false,
      outputArtifactCreated: false,
      startedAt: receipt.startedAt,
      completedAt: receipt.completedAt,
      elapsedMilliseconds: elapsed,
      exitCode: 78,
      canonicalOperationDispatched: false,
      sensitiveDetailsIncluded: false,
    }
  } finally {
    spawnSync(
      'docker',
      ['rm', '-f', containerName],
      { encoding: 'utf8' },
    )
  }
}

function inspectContainer(
  containerName: string,
): DockerContainerInspection {
  const result = runDocker(
    ['inspect', containerName],
    'inspect controlled container',
  )
  return JSON.parse(result.stdout)[0] as
    DockerContainerInspection
}

function parseReceipt(output: string): RuntimeReceipt {
  for (const line of output.trim().split(/\r?\n/u).reverse()) {
    try {
      const value = JSON.parse(line) as RuntimeReceipt
      if (
        value.event ===
          'living_frame_comfyui_five_model_mount_verified_cuda_required'
      ) return value
    } catch {
      continue
    }
  }
  throw new Error('Expected five-model mount receipt was absent.')
}

function runDocker(
  args: readonly string[],
  label: string,
): { readonly stdout: string; readonly stderr: string } {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    timeout: RUN_TIMEOUT_MILLISECONDS,
    maxBuffer: 4 * 1_024 * 1_024,
  })
  assert.equal(
    result.status,
    0,
    `${label} failed: ${result.stderr}`,
  )
  return {
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value: unknown): string {
  if (
    value === null
    || typeof value === 'boolean'
    || typeof value === 'string'
    || typeof value === 'number'
  ) return JSON.stringify(value)
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalJson(record[key])}`,
    ).join(',')}}`
  }
  throw new TypeError('Unsupported canonical value.')
}
