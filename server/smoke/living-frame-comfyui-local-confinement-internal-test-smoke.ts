import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { setTimeout as delay } from 'node:timers/promises'
import { spawnSync } from 'node:child_process'

import type {
  LivingFrameComfyUiLocalConfinementObservation,
} from '../../src/types/living-frame-comfyui-local-confinement-evidence'
import {
  LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256,
} from '../living-frame/living-frame-comfyui-dependency-lock-manifest'
import {
  createLivingFrameComfyUiLocalConfinementEvidence,
  createLivingFrameComfyUiLocalConfinementObservationPort,
  fixedLivingFrameComfyUiLocalConfinementLaunchSpec,
  LivingFrameComfyUiLocalConfinementEvidenceError,
  verifyLivingFrameComfyUiLocalConfinementEvidence,
} from '../living-frame/living-frame-comfyui-local-confinement-evidence'

const BASE_IMAGE =
  'reeditpro-living-frame-comfyui-locked-candidate:local'
const DERIVED_IMAGE =
  'reeditpro-living-frame-comfyui-local-confinement-candidate:internal'
const DOCKERFILE =
  'docker/prod/gpu-worker/comfyui/Dockerfile.local-confinement-candidate'
const BUILD_CONTEXT = 'docker/prod/gpu-worker/comfyui'
const ENTRYPOINT_SOURCE =
  `${BUILD_CONTEXT}/local-candidate-confinement-entrypoint.py`
const EXPECTED_ENTRYPOINT_SOURCE_DIGEST =
  '1f12a36bbdea0f8aa51dd247a085db4d8658df71cd5d7ddac0bbec88df01055a'
const EXPECTED_ENVIRONMENT_DIGEST =
  'fbeef7db64ca9448fb41dccec77343d1be3ebbe572f43e3ea6916f75a50356c6'
const EXPECTED_ENTRYPOINT = [
  '/usr/bin/python3',
  '-I',
  '-B',
  '/opt/reeditpro/local-confinement-entrypoint.py',
] as const
const READINESS_TIMEOUT_MILLISECONDS = 60_000

if (!imageAvailable(BASE_IMAGE)) {
  process.stdout.write(`${JSON.stringify({
    smoke:
      'living_frame_comfyui_local_confinement_internal_test',
    status:
      'skipped_exact_locked_local_candidate_image_unavailable',
    privateInternalOnly: true,
    productionReady: false,
  })}\n`)
  process.exit(0)
}

assert.equal(
  sha256(readFileSync(ENTRYPOINT_SOURCE)),
  EXPECTED_ENTRYPOINT_SOURCE_DIGEST,
)
assert.equal(
  inspectImage(BASE_IMAGE).Id,
  `sha256:${
    LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256
  }`,
)

buildDerivedImage()
const derived = inspectImage(DERIVED_IMAGE)
assert.equal(derived.Os, 'linux')
assert.equal(derived.Architecture, 'amd64')
assert.equal(derived.Config.User, '65532:65532')
assert.deepEqual(
  derived.Config.Entrypoint,
  EXPECTED_ENTRYPOINT,
)
assert.equal(derived.Config.Cmd ?? null, null)
assert.equal(
  derived.Config.Labels[
    'org.reeditpro.living-frame.runtime-class'
  ],
  'controlled-local-confinement-candidate',
)
assert.equal(
  derived.Config.Labels[
    'org.reeditpro.living-frame.parent-image-sha256'
  ],
  LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256,
)
assert.equal(
  derived.Config.Labels[
    'org.reeditpro.living-frame.entrypoint-source-sha256'
  ],
  EXPECTED_ENTRYPOINT_SOURCE_DIGEST,
)

assertRejectedCallerArguments()
assertRejectedRootIdentityOverride()

const controlledObservation =
  await observeControlledStartup(derived)
const observationPort =
  createLivingFrameComfyUiLocalConfinementObservationPort(
    async () => controlledObservation,
  )
const evidence =
  await createLivingFrameComfyUiLocalConfinementEvidence({
    evidenceId: 'lf.comfyui.local-confinement.001',
    observationPort,
  })
assert.equal(
  verifyLivingFrameComfyUiLocalConfinementEvidence(evidence),
  true,
)
assert.equal(evidence.confinement.defaultUid, 65_532)
assert.equal(
  evidence.confinement.callerArgumentRejectionObserved,
  true,
)
assert.equal(
  evidence.confinement.injectedCallerEnvironmentScrubbed,
  true,
)
assert.equal(
  evidence.startup.sam2ImportBlockedBeforeComfyUiLoad,
  true,
)
assert.equal(evidence.startup.reviewedCustomNodeCount, 2)
assert.equal(evidence.startup.loopbackReady, true)
assert.equal(evidence.startup.modelArtifactCount, 0)
assert.equal(evidence.startup.modelInferenceExecuted, false)
assert.equal(evidence.startup.gpuExecutionPerformed, false)
assert.equal(evidence.canonicalOperationDispatched, false)
assert.equal(evidence.actualCostEvidenceCreated, false)
assert.equal(evidence.customerChargeCreated, false)
assert.equal(evidence.artifactPersisted, false)
assert.equal(evidence.publicDeliveryCreated, false)
assert.equal(evidence.productionReady, false)

const forged = {
  ...evidence,
  startup: {
    ...evidence.startup,
    gpuExecutionPerformed: true,
  },
}
const {
  evidenceDigestSha256: _forgedDigest,
  ...forgedDraft
} = forged
void _forgedDigest
assert.equal(
  verifyLivingFrameComfyUiLocalConfinementEvidence({
    ...forgedDraft,
    evidenceDigestSha256: sha256(
      Buffer.from(canonicalJson(forgedDraft)),
    ),
  }),
  false,
)
await assert.rejects(
  () => createLivingFrameComfyUiLocalConfinementEvidence({
    evidenceId: 'lf.comfyui.local-confinement.reuse',
    observationPort,
  }),
  (error: unknown) =>
    error instanceof
      LivingFrameComfyUiLocalConfinementEvidenceError
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
  '"modelbytes"',
  'musashi',
  'helicopter',
  'hormuz',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

process.stdout.write(`${JSON.stringify({
  smoke:
    'living_frame_comfyui_local_confinement_internal_test',
  status: 'passed',
  evidenceClass: evidence.evidenceClass,
  parentImageDigestSha256:
    evidence.image.parentImageDigestSha256,
  derivedImageDigestSha256:
    evidence.image.derivedImageDigestSha256,
  defaultUid: evidence.confinement.defaultUid,
  defaultGid: evidence.confinement.defaultGid,
  fixedEntrypointObserved:
    evidence.confinement.defaultEntrypointObserved,
  callerArgumentRejectionObserved:
    evidence.confinement.callerArgumentRejectionObserved,
  injectedCallerEnvironmentScrubbed:
    evidence.confinement.injectedCallerEnvironmentScrubbed,
  sam2ImportBlocked:
    evidence.startup.sam2ImportBlockedBeforeComfyUiLoad,
  reviewedCustomNodeCount:
    evidence.startup.reviewedCustomNodeCount,
  loopbackReady: evidence.startup.loopbackReady,
  elapsedMilliseconds:
    evidence.startup.elapsedMilliseconds,
  stopEscalationRequired:
    evidence.startup.stopEscalationRequired,
  stopGracePeriodSeconds:
    evidence.startup.stopGracePeriodSeconds,
  cpuEmulationOnly: evidence.startup.cpuEmulationOnly,
  modelArtifactCount: evidence.startup.modelArtifactCount,
  modelInferenceExecuted:
    evidence.startup.modelInferenceExecuted,
  gpuExecutionPerformed:
    evidence.startup.gpuExecutionPerformed,
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
): Promise<LivingFrameComfyUiLocalConfinementObservation> {
  const containerName =
    `reeditpro-lf-comfyui-confinement-${process.pid}`
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
      '512',
      '--memory',
      '4g',
      '--cpus',
      '2',
      '--tmpfs',
      '/tmp:rw,nosuid,nodev,noexec,size=2g',
      '--env',
      'REEDITPRO_CALLER_INJECTION=must_be_scrubbed',
      DERIVED_IMAGE,
    ])
    containerId = start.stdout.trim()
    assert.match(containerId, /^[a-f0-9]{64}$/u)

    const readyAt =
      await waitUntilLoopbackReady(containerId)
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
      '/opt/reeditpro/local-confinement-entrypoint.py',
    ])
    assert.equal(running.HostConfig.NetworkMode, 'none')
    assert.equal(running.HostConfig.ReadonlyRootfs, true)
    assert.deepEqual(running.HostConfig.CapDrop, ['ALL'])
    assert.deepEqual(
      running.HostConfig.SecurityOpt,
      ['no-new-privileges'],
    )
    assert.equal(running.HostConfig.PidsLimit, 512)
    assert.equal(running.HostConfig.Memory, 4_294_967_296)
    assert.equal(running.HostConfig.NanoCpus, 2_000_000_000)
    assert.equal(
      running.HostConfig.Tmpfs['/tmp'],
      'rw,nosuid,nodev,noexec,size=2g',
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
          'fields=dict(line.split(":",1) for line in s.splitlines() if ":" in line)',
          'w=[]',
          'root=pathlib.Path("/opt/ComfyUI/models")',
          'ext={".safetensors",".ckpt",".pt",".pth",".bin",".onnx"}',
          'w.extend(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in ext)',
          'print(json.dumps({"uid":os.getuid(),"gid":os.getgid(),"rootWritable":os.access("/",os.W_OK),"capEff":fields["CapEff"].strip(),"noNewPrivs":int(fields["NoNewPrivs"].strip()),"modelArtifactCount":len(w)},sort_keys=True))',
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

    const logResult = runDocker([
      'logs',
      containerId,
    ])
    const logs = `${logResult.stdout}\n${logResult.stderr}`
    const marker = parseConfinementMarker(logs)
    assert.deepEqual(marker, {
      callerArgumentsAccepted: false,
      callerEnvironmentMerged: false,
      cpuEmulationOnly: true,
      environmentDigestSha256:
        EXPECTED_ENVIRONMENT_DIGEST,
      event:
        'living_frame_comfyui_local_confinement_ready_to_start',
      externalNetworkAllowed: false,
      gid: 65_532,
      modelArtifactCount: 0,
      modelInferenceAuthorized: false,
      runtimeDownloadsAllowed: false,
      sam2ImportBlocked: true,
      standardLibraryImportPreserved: true,
      uid: 65_532,
    })
    assert.equal(
      logs.includes(
        '/opt/ComfyUI/custom_nodes/comfyui-ipadapter',
      ),
      true,
    )
    assert.equal(
      logs.includes(
        '/opt/ComfyUI/custom_nodes/comfyui_controlnet_aux',
      ),
      true,
    )
    assert.equal(
      logs.includes(
        'Skipping comfyui-ipadapter due to disable_all_custom_nodes',
      ),
      false,
    )
    assert.equal(
      logs.includes(
        'Skipping comfyui_controlnet_aux due to disable_all_custom_nodes',
      ),
      false,
    )

    runDocker([
      'stop',
      '--time',
      '5',
      containerId,
    ])
    const stoppedAt = new Date().toISOString()
    const stopped = inspectContainer(containerId)
    assert.equal(stopped.State.Running, false)
    assert.equal(
      [0, 137, 143].includes(stopped.State.ExitCode),
      true,
    )

    return {
      observationClass:
        'process_bound_local_comfyui_confinement_startup_observation_v1',
      parentImageDigestSha256:
        LIVING_FRAME_COMFYUI_LOCKED_CANDIDATE_IMAGE_DIGEST_SHA256,
      derivedImageDigestSha256:
        derived.Id.replace(/^sha256:/u, ''),
      entrypointSourceDigestSha256:
        EXPECTED_ENTRYPOINT_SOURCE_DIGEST,
      fixedLaunchSpecDigestSha256:
        sha256(
          Buffer.from(canonicalJson(
            fixedLivingFrameComfyUiLocalConfinementLaunchSpec(),
          )),
        ),
      operatingSystem: 'linux',
      architecture: 'amd64',
      localArchitectureEmulationUsed: true,
      derivedImageDefaultUid: 65_532,
      derivedImageDefaultGid: 65_532,
      defaultEntrypointObserved: true,
      callerCommandOrArgumentsUsedForMainStartup: false,
      callerArgumentRejectionObserved: true,
      injectedCallerEnvironmentScrubbed: true,
      environmentDigestSha256:
        EXPECTED_ENVIRONMENT_DIGEST,
      rootFilesystemReadOnlyObserved: true,
      allLinuxCapabilitiesDropped: true,
      noNewPrivilegesObserved: true,
      externalNetworkDisabled: true,
      runtimeDownloadsAllowed: false,
      ephemeralWriteRootOnly: true,
      processLimit: 512,
      cpuLimit: 2,
      memoryLimitBytes: 4_294_967_296,
      sam2ImportBlockedBeforeComfyUiLoad: true,
      standardLibraryImportPreserved: true,
      reviewedCustomNodeCount: 2,
      loopbackReady: true,
      fixedLoopbackPort: 8_188,
      modelArtifactCount: 0,
      modelInferenceExecuted: false,
      gpuExecutionPerformed: false,
      promptSubmitted: false,
      outputArtifactCreated: false,
      startedAt,
      readyAt,
      stoppedAt,
      elapsedMilliseconds:
        Date.parse(stoppedAt) - Date.parse(startedAt),
      exitCode: stopped.State.ExitCode as 0 | 137 | 143,
      stopGracePeriodSeconds: 5,
      stopEscalationRequired:
        stopped.State.ExitCode === 137,
      rawLogPromptPathUrlCredentialOrModelBytesIncluded:
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
        runDockerAllowFailure([
          'rm',
          '--force',
          containerId,
        ])
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
      'The confined ComfyUI process exited before readiness.',
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
        'r=urllib.request.urlopen("http://127.0.0.1:8188/system_stats",timeout=1)',
        'assert r.status == 200',
        'assert int(r.headers.get("content-length","0")) <= 65536',
        'r.close()',
      ].join(';'),
    ])
    if (probe.status === 0) return new Date().toISOString()
    await delay(250)
  }
  throw new Error(
    'Confined local ComfyUI readiness timed out.',
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
    '512',
    '--memory',
    '4g',
    '--cpus',
    '2',
    '--tmpfs',
    '/tmp:rw,nosuid,nodev,noexec,size=2g',
    DERIVED_IMAGE,
    'caller_argument_forbidden',
  ])
  assert.equal(result.status, 64)
  assert.equal(
    parseFailureMarker(result.stdout).code,
    64,
  )
}

function assertRejectedRootIdentityOverride(): void {
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
    '--user',
    '0:0',
    '--tmpfs',
    '/tmp:rw,nosuid,nodev,noexec,size=2g',
    DERIVED_IMAGE,
  ])
  assert.equal(result.status, 65)
  assert.equal(
    parseFailureMarker(result.stdout).code,
    65,
  )
}

function buildDerivedImage(): void {
  const result = runDocker([
    'build',
    '--pull=false',
    '--network',
    'none',
    '--platform',
    'linux/amd64',
    '--file',
    DOCKERFILE,
    '--tag',
    DERIVED_IMAGE,
    BUILD_CONTEXT,
  ], 5 * 60_000)
  assert.equal(result.status, 0)
}

function imageAvailable(image: string): boolean {
  return runDockerAllowFailure([
    'image',
    'inspect',
    image,
  ]).status === 0
}

function inspectImage(image: string): DockerImageInspection {
  const parsed = JSON.parse(
    runDocker([
      'image',
      'inspect',
      image,
    ]).stdout,
  ) as DockerImageInspection[]
  assert.equal(parsed.length, 1)
  return parsed[0]!
}

function inspectContainer(
  containerId: string,
): DockerContainerInspection {
  const parsed = JSON.parse(
    runDocker([
      'container',
      'inspect',
      containerId,
    ]).stdout,
  ) as DockerContainerInspection[]
  assert.equal(parsed.length, 1)
  return parsed[0]!
}

function parseConfinementMarker(
  logs: string,
): Record<string, unknown> {
  const matches = logs.split(/\r?\n/u)
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .filter((value) =>
      value.event ===
        'living_frame_comfyui_local_confinement_ready_to_start')
  assert.equal(matches.length, 1)
  return matches[0]!
}

function parseFailureMarker(
  logs: string,
): { readonly code: number } {
  const parsed = logs.split(/\r?\n/u)
    .filter((line) => line.startsWith('{'))
    .map((line) => JSON.parse(line) as {
      event: string
      code: number
    })
    .find((value) =>
      value.event ===
        'living_frame_comfyui_local_confinement_failure')
  assert.ok(parsed)
  return parsed
}

function runDocker(
  args: readonly string[],
  timeout = 90_000,
): ReturnType<typeof spawnSync> & {
  stdout: string
  stderr: string
  status: number
} {
  const result = runDockerAllowFailure(args, timeout)
  assert.equal(
    result.status,
    0,
    `Docker command failed: ${result.stderr}`,
  )
  return result as ReturnType<typeof spawnSync> & {
    stdout: string
    stderr: string
    status: number
  }
}

function runDockerAllowFailure(
  args: readonly string[],
  timeout = 90_000,
): {
  readonly stdout: string
  readonly stderr: string
  readonly status: number | null
} {
  const result = spawnSync(
    'docker',
    [...args],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      timeout,
    },
  )
  if (result.error) throw result.error
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
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
  if (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}
