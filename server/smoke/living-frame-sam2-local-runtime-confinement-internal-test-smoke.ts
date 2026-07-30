import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { spawnSync } from 'node:child_process'

import type {
  LivingFrameSam2LocalRuntimeConfinementObservation,
} from '../../src/types/living-frame-sam2-local-runtime-confinement-evidence'
import {
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENTRYPOINT_DIGEST_SHA256,
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENVIRONMENT_DIGEST_SHA256,
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_PARENT_IMAGE_DIGEST_SHA256,
  LivingFrameSam2LocalRuntimeConfinementEvidenceError,
  createLivingFrameSam2LocalRuntimeConfinementEvidence,
  createLivingFrameSam2LocalRuntimeConfinementObservationPort,
  fixedLivingFrameSam2LocalRuntimeConfinementLaunchSpec,
  verifyLivingFrameSam2LocalRuntimeConfinementEvidence,
} from '../living-frame/living-frame-sam2-local-runtime-confinement-evidence'

const BASE_IMAGE =
  'reeditpro/ai-graphics-gpu-worker:proof-local'
const DERIVED_IMAGE =
  'reeditpro-living-frame-sam2-local-runtime-confinement-candidate:internal'
const DOCKERFILE =
  'docker/prod/gpu-worker/sam2/Dockerfile.local-runtime-confinement-candidate'
const BUILD_CONTEXT = 'docker/prod/gpu-worker/sam2'
const ENTRYPOINT_SOURCE =
  `${BUILD_CONTEXT}/local-runtime-confinement-entrypoint.py`
const EXPECTED_ENTRYPOINT = [
  '/usr/bin/python3',
  '-I',
  '-B',
  '/opt/reeditpro/local-sam2-runtime-confinement-entrypoint.py',
] as const
const READINESS_TIMEOUT_MILLISECONDS = 60_000

if (!imageAvailable(BASE_IMAGE)) {
  process.stdout.write(`${JSON.stringify({
    smoke:
      'living_frame_sam2_local_runtime_confinement_internal_test',
    status:
      'skipped_exact_local_gpu_worker_candidate_image_unavailable',
    privateInternalOnly: true,
    productionReady: false,
  })}\n`)
  process.exit(0)
}

assert.equal(
  sha256(readFileSync(ENTRYPOINT_SOURCE)),
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENTRYPOINT_DIGEST_SHA256,
)
assert.equal(
  inspectImage(BASE_IMAGE).Id,
  `sha256:${
    LIVING_FRAME_SAM2_LOCAL_RUNTIME_PARENT_IMAGE_DIGEST_SHA256
  }`,
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
  'sam2-model-free-local-runtime-confinement-candidate',
)
assert.equal(
  derived.Config.Labels[
    'org.reeditpro.living-frame.parent-image-sha256'
  ],
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_PARENT_IMAGE_DIGEST_SHA256,
)
assert.equal(
  derived.Config.Labels[
    'org.reeditpro.living-frame.entrypoint-source-sha256'
  ],
  LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENTRYPOINT_DIGEST_SHA256,
)

assertRejectedCallerArguments()
assertRejectedRootIdentityOverride()
assertRejectedUnexpectedModelMount()

const controlledObservation =
  await observeControlledStartup(derived)
const observationPort =
  createLivingFrameSam2LocalRuntimeConfinementObservationPort(
    async () => controlledObservation,
  )
const evidence =
  await createLivingFrameSam2LocalRuntimeConfinementEvidence({
    evidenceId: 'lf.sam2.local-runtime-confinement.001',
    observationPort,
  })

assert.equal(
  verifyLivingFrameSam2LocalRuntimeConfinementEvidence(evidence),
  true,
)
assert.equal(evidence.confinement.defaultUid, 65_532)
assert.equal(evidence.confinement.defaultGid, 65_532)
assert.equal(
  evidence.confinement.callerArgumentRejectionObserved,
  true,
)
assert.equal(
  evidence.confinement.rootIdentityOverrideRejectionObserved,
  true,
)
assert.equal(
  evidence.confinement.injectedCallerEnvironmentScrubbed,
  true,
)
assert.equal(evidence.runtime.sam2PackageImportVerified, true)
assert.equal(
  evidence.runtime.nativeVideoPredictorBuilderImportVerified,
  true,
)
assert.equal(evidence.runtime.cudaBuild, '12.4')
assert.equal(evidence.runtime.cudaAvailable, false)
assert.equal(evidence.runtime.modelArtifactCount, 0)
assert.equal(evidence.runtime.checkpointLoaded, false)
assert.equal(evidence.runtime.modelInferenceExecuted, false)
assert.equal(evidence.runtime.maskOutputCreated, false)
assert.equal(evidence.runtime.stopEscalationRequired, false)
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
    checkpointLoaded: true,
    modelInferenceExecuted: true,
  },
}
const {
  evidenceDigestSha256: _forgedDigest,
  ...forgedDraft
} = forged
void _forgedDigest
assert.equal(
  verifyLivingFrameSam2LocalRuntimeConfinementEvidence({
    ...forgedDraft,
    evidenceDigestSha256: sha256(
      Buffer.from(canonicalJson(forgedDraft)),
    ),
  }),
  false,
)
await assert.rejects(
  () => createLivingFrameSam2LocalRuntimeConfinementEvidence({
    evidenceId: 'lf.sam2.local-runtime-confinement.reuse',
    observationPort,
  }),
  (error: unknown) =>
    error instanceof
      LivingFrameSam2LocalRuntimeConfinementEvidenceError
    && error.issues[0]?.code === 'observation_port_reused',
)

const serialized = JSON.stringify(evidence).toLowerCase()
for (const forbidden of [
  '/opt/',
  '/tmp/',
  'http://',
  'https://',
  'file://',
  '"prompt"',
  '"credential"',
  '"checkpointbytes"',
  '"mediabytes"',
  'musashi',
  'helicopter',
  'hormuz',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

process.stdout.write(`${JSON.stringify({
  smoke:
    'living_frame_sam2_local_runtime_confinement_internal_test',
  status: 'passed',
  evidenceClass: evidence.evidenceClass,
  parentImageDigestSha256:
    evidence.image.parentImageDigestSha256,
  derivedImageDigestSha256:
    evidence.image.derivedImageDigestSha256,
  sourceRevision: evidence.runtime.sourceRevision,
  selectedConfigDigestSha256:
    evidence.runtime.selectedConfigDigestSha256,
  sourceLicenseDigestSha256:
    evidence.runtime.sourceLicenseDigestSha256,
  sam2DistributionVersion:
    evidence.runtime.sam2DistributionVersion,
  torchVersion: evidence.runtime.torchVersion,
  torchvisionVersion: evidence.runtime.torchvisionVersion,
  cudaBuild: evidence.runtime.cudaBuild,
  cudaAvailable: evidence.runtime.cudaAvailable,
  defaultUid: evidence.confinement.defaultUid,
  defaultGid: evidence.confinement.defaultGid,
  fixedEntrypointObserved:
    evidence.confinement.defaultEntrypointObserved,
  callerArgumentRejectionObserved:
    evidence.confinement.callerArgumentRejectionObserved,
  rootIdentityOverrideRejectionObserved:
    evidence.confinement.rootIdentityOverrideRejectionObserved,
  unexpectedModelMountRejectionObserved: true,
  injectedCallerEnvironmentScrubbed:
    evidence.confinement.injectedCallerEnvironmentScrubbed,
  elapsedMilliseconds:
    evidence.runtime.elapsedMilliseconds,
  stopEscalationRequired:
    evidence.runtime.stopEscalationRequired,
  modelArtifactCount: evidence.runtime.modelArtifactCount,
  checkpointLoaded: evidence.runtime.checkpointLoaded,
  modelInferenceExecuted:
    evidence.runtime.modelInferenceExecuted,
  canonicalOperationDispatched:
    evidence.canonicalOperationDispatched,
  actualCostEvidenceCreated:
    evidence.actualCostEvidenceCreated,
  customerChargeCreated: evidence.customerChargeCreated,
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
  readonly Path: string
  readonly Args: readonly string[]
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
    readonly Binds: readonly string[] | null
  }
  readonly Mounts: readonly unknown[]
  readonly State: {
    readonly Running: boolean
    readonly ExitCode: number
  }
}

async function observeControlledStartup(
  derived: DockerImageInspection,
): Promise<LivingFrameSam2LocalRuntimeConfinementObservation> {
  const containerName =
    `reeditpro-lf-sam2-confinement-${process.pid}`
  const startedAt = new Date().toISOString()
  let containerId = ''
  try {
    const start = runDocker([
      'run',
      '--detach',
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
      '--memory',
      '2g',
      '--cpus',
      '1',
      '--tmpfs',
      '/tmp:rw,nosuid,nodev,noexec,size=256m',
      '--env',
      'REEDITPRO_CALLER_INJECTION=must_be_scrubbed',
      DERIVED_IMAGE,
    ])
    containerId = start.stdout.trim()
    assert.match(containerId, /^[a-f0-9]{64}$/u)

    const readyAt = await waitUntilLoopbackReady(containerId)
    const running = inspectContainer(containerId)
    assert.equal(running.State.Running, true)
    assert.equal(running.Config.User, '65532:65532')
    assert.deepEqual(
      running.Config.Entrypoint,
      EXPECTED_ENTRYPOINT,
    )
    assert.deepEqual(running.Args, [
      '-I',
      '-B',
      '/opt/reeditpro/local-sam2-runtime-confinement-entrypoint.py',
    ])
    assert.equal(running.HostConfig.NetworkMode, 'none')
    assert.equal(running.HostConfig.ReadonlyRootfs, true)
    assert.deepEqual(running.HostConfig.CapDrop, ['ALL'])
    assert.deepEqual(
      running.HostConfig.SecurityOpt,
      ['no-new-privileges'],
    )
    assert.equal(running.HostConfig.PidsLimit, 256)
    assert.equal(running.HostConfig.Memory, 2_147_483_648)
    assert.equal(running.HostConfig.NanoCpus, 1_000_000_000)
    assert.equal(
      running.HostConfig.Tmpfs['/tmp'],
      'rw,nosuid,nodev,noexec,size=256m',
    )
    assert.equal(running.HostConfig.Binds, null)
    assert.deepEqual(running.Mounts, [])

    const processProbe = JSON.parse(
      runDocker([
        'exec',
        containerId,
        '/usr/bin/python3',
        '-I',
        '-B',
        '-c',
        [
          'import json,os,pathlib',
          's=pathlib.Path("/proc/1/status").read_text()',
          'f=dict(line.split(":",1) for line in s.splitlines() if ":" in line)',
          'root=pathlib.Path("/opt/reeditpro/model-weights/sam2")',
          'ext={".safetensors",".ckpt",".pt",".pth",".bin",".onnx"}',
          'models=[] if not root.is_dir() else [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in ext]',
          'print(json.dumps({"uid":os.getuid(),"gid":os.getgid(),"rootWritable":os.access("/",os.W_OK),"capEff":f["CapEff"].strip(),"noNewPrivs":int(f["NoNewPrivs"].strip()),"modelArtifactCount":len(models)},sort_keys=True))',
        ].join(';'),
      ]).stdout,
    ) as {
      uid: number
      gid: number
      rootWritable: boolean
      capEff: string
      noNewPrivs: number
      modelArtifactCount: number
    }
    assert.deepEqual(processProbe, {
      uid: 65_532,
      gid: 65_532,
      rootWritable: false,
      capEff: '0000000000000000',
      noNewPrivs: 1,
      modelArtifactCount: 0,
    })

    const logResult = runDocker(['logs', containerId])
    const logs = `${logResult.stdout}\n${logResult.stderr}`
    const marker = parseConfinementMarker(logs)
    assert.deepEqual(marker, {
      builderImportVerified: true,
      callerArgumentsAccepted: false,
      callerEnvironmentMerged: false,
      checkpointLoaded: false,
      configDigestSha256:
        '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55',
      cpuEmulationOnly: true,
      cudaAvailable: false,
      cudaBuild: '12.4',
      cudaDeviceCount: 0,
      environmentDigestSha256:
        LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENVIRONMENT_DIGEST_SHA256,
      event:
        'living_frame_sam2_local_runtime_confinement_ready',
      externalNetworkAllowed: false,
      gid: 65_532,
      licenseDigestSha256:
        'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
      modelArtifactCount: 0,
      modelInferenceAuthorized: false,
      nativeVideoPredictorBuilderImportable: true,
      runtimeDownloadsAllowed: false,
      sam2DistributionVersion: '1.0',
      sourceRevision:
        '2b90b9f5ceec907a1c18123530e92e794ad901a4',
      torchVersion: '2.5.1+cu124',
      torchvisionVersion: '0.20.1+cu124',
      uid: 65_532,
    })
    assert.equal(
      logs.includes('REEDITPRO_CALLER_INJECTION'),
      false,
    )

    runDocker(['stop', '--timeout', '5', containerId])
    const stoppedAt = new Date().toISOString()
    const stopped = inspectContainer(containerId)
    assert.equal(stopped.State.Running, false)
    assert.equal(stopped.State.ExitCode, 0)

    return {
      observationClass:
        'process_bound_local_sam2_runtime_confinement_observation_v1',
      parentImageDigestSha256:
        LIVING_FRAME_SAM2_LOCAL_RUNTIME_PARENT_IMAGE_DIGEST_SHA256,
      derivedImageDigestSha256:
        derived.Id.replace(/^sha256:/u, ''),
      entrypointSourceDigestSha256:
        LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENTRYPOINT_DIGEST_SHA256,
      fixedLaunchSpecDigestSha256: sha256(
        Buffer.from(canonicalJson(
          fixedLivingFrameSam2LocalRuntimeConfinementLaunchSpec(),
        )),
      ),
      operatingSystem: 'linux',
      architecture: 'amd64',
      localArchitectureEmulationUsed: true,
      defaultUid: 65_532,
      defaultGid: 65_532,
      defaultEntrypointObserved: true,
      callerCommandOrArgumentsUsedForStartup: false,
      callerArgumentRejectionObserved: true,
      rootIdentityOverrideRejectionObserved: true,
      injectedCallerEnvironmentScrubbed: true,
      environmentDigestSha256:
        LIVING_FRAME_SAM2_LOCAL_RUNTIME_ENVIRONMENT_DIGEST_SHA256,
      rootFilesystemReadOnlyObserved: true,
      allLinuxCapabilitiesDropped: true,
      noNewPrivilegesObserved: true,
      externalNetworkDisabled: true,
      runtimeDownloadsAllowed: false,
      ephemeralWriteRootOnly: true,
      processLimit: 256,
      cpuLimit: 1,
      memoryLimitBytes: 2_147_483_648,
      sourceRevision:
        '2b90b9f5ceec907a1c18123530e92e794ad901a4',
      sourceLicenseDigestSha256:
        'c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4',
      selectedConfigDigestSha256:
        '0f36b91e86e58d06c87e42997166212468b88b98b60e4d816d5e4d4d088b6f55',
      directSourceRecordDigestSha256:
        'fdb91deb308c348a13be152c36770d10fa38044f6d3d1c179cfc9631e0b2a96f',
      sam2DistributionVersion: '1.0',
      torchVersion: '2.5.1+cu124',
      torchvisionVersion: '0.20.1+cu124',
      cudaBuild: '12.4',
      sam2PackageImportVerified: true,
      nativeVideoPredictorBuilderImportVerified: true,
      loopbackReady: true,
      fixedLoopbackPort: 8_190,
      cudaAvailable: false,
      cudaDeviceCount: 0,
      modelArtifactCount: 0,
      checkpointLoaded: false,
      modelInferenceExecuted: false,
      maskOutputCreated: false,
      startedAt,
      readyAt,
      stoppedAt,
      elapsedMilliseconds:
        Date.parse(stoppedAt) - Date.parse(startedAt),
      exitCode: 0,
      stopGracePeriodSeconds: 5,
      stopEscalationRequired: false,
      rawLogPromptPathUrlCredentialCheckpointOrMediaBytesIncluded:
        false,
    }
  } finally {
    if (containerId) {
      const inspection = runDockerAllowFailure([
        'container',
        'inspect',
        containerId,
      ])
      if (inspection.status === 0) {
        runDockerAllowFailure(['rm', '--force', containerId])
      }
    }
  }
}

async function waitUntilLoopbackReady(
  containerId: string,
): Promise<string> {
  const deadline =
    Date.now() + READINESS_TIMEOUT_MILLISECONDS
  while (Date.now() < deadline) {
    const inspection = inspectContainer(containerId)
    assert.equal(
      inspection.State.Running,
      true,
      'The confined local SAM2 process exited before readiness.',
    )
    const probe = runDockerAllowFailure([
      'exec',
      containerId,
      '/usr/bin/python3',
      '-I',
      '-B',
      '-c',
      [
        'import urllib.request',
        'r=urllib.request.urlopen("http://127.0.0.1:8190/ready",timeout=1)',
        'assert r.status == 200',
        'assert int(r.headers.get("content-length","0")) <= 64',
        'r.close()',
      ].join(';'),
    ])
    if (probe.status === 0) return new Date().toISOString()
    await delay(250)
  }
  throw new Error(
    'Confined local SAM2 readiness timed out.',
  )
}

function assertRejectedCallerArguments(): void {
  const result = runDockerAllowFailure([
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
    '--memory',
    '2g',
    '--cpus',
    '1',
    '--tmpfs',
    '/tmp:rw,nosuid,nodev,noexec,size=256m',
    DERIVED_IMAGE,
    'caller-supplied-argument',
  ])
  assert.equal(result.status, 64)
  assert.equal(
    `${result.stdout}\n${result.stderr}`.includes(
      'living_frame_sam2_local_runtime_confinement_failure',
    ),
    true,
  )
}

function assertRejectedRootIdentityOverride(): void {
  const result = runDockerAllowFailure([
    'run',
    '--rm',
    '--platform',
    'linux/amd64',
    '--user',
    '0:0',
    '--network',
    'none',
    '--read-only',
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--pids-limit',
    '256',
    '--memory',
    '2g',
    '--cpus',
    '1',
    '--tmpfs',
    '/tmp:rw,nosuid,nodev,noexec,size=256m',
    DERIVED_IMAGE,
  ])
  assert.equal(result.status, 65)
}

function assertRejectedUnexpectedModelMount(): void {
  const tempRoot = mkdtempSync(
    join(tmpdir(), 'reeditpro-lf-sam2-model-rejection-'),
  )
  try {
    writeFileSync(
      join(tempRoot, 'caller-checkpoint.pt'),
      Buffer.from('not-a-checkpoint', 'utf8'),
      { mode: 0o400 },
    )
    const result = runDockerAllowFailure([
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
      '--memory',
      '2g',
      '--cpus',
      '1',
      '--tmpfs',
      '/tmp:rw,nosuid,nodev,noexec,size=256m',
      '--mount',
      `type=bind,src=${tempRoot},dst=/opt/reeditpro/model-weights/sam2,readonly`,
      DERIVED_IMAGE,
    ])
    assert.equal(result.status, 73)
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
}

function buildDerivedImage(): void {
  runDocker([
    'build',
    '--network',
    'none',
    '--platform',
    'linux/amd64',
    '--file',
    DOCKERFILE,
    '--tag',
    DERIVED_IMAGE,
    BUILD_CONTEXT,
  ])
}

function imageAvailable(image: string): boolean {
  return runDockerAllowFailure([
    'image',
    'inspect',
    image,
  ]).status === 0
}

function inspectImage(
  image: string,
): DockerImageInspection {
  return JSON.parse(
    runDocker(['image', 'inspect', image]).stdout,
  )[0] as DockerImageInspection
}

function inspectContainer(
  containerId: string,
): DockerContainerInspection {
  return JSON.parse(
    runDocker(['container', 'inspect', containerId]).stdout,
  )[0] as DockerContainerInspection
}

function parseConfinementMarker(
  logs: string,
): Record<string, unknown> {
  for (const line of logs.split(/\r?\n/u)) {
    if (!line.includes(
      'living_frame_sam2_local_runtime_confinement_ready',
    )) continue
    const parsed = JSON.parse(line) as unknown
    if (isRecord(parsed)) return parsed
  }
  throw new Error(
    'Local SAM2 runtime confinement marker not found.',
  )
}

function runDocker(
  args: readonly string[],
): {
  readonly status: number
  readonly stdout: string
  readonly stderr: string
} {
  const result = runDockerAllowFailure(args)
  if (result.status !== 0) {
    throw new Error(
      `Docker command failed (${result.status}): ${
        result.stderr || result.stdout
      }`,
    )
  }
  return result
}

function runDockerAllowFailure(
  args: readonly string[],
): {
  readonly status: number
  readonly stdout: string
  readonly stderr: string
} {
  const result = spawnSync('docker', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  if (result.error) throw result.error
  return {
    status: result.status ?? 1,
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

function sha256(value: Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
}
