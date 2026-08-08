import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const publicationPath =
  'server/cli/publish-canonical-sam3_1-qualification-image-build-multiplex-session-gpu-forwarding-authority.ts'
const startPath =
  'server/cli/start-canonical-sam3_1-qualification-image-build-multiplex-session-gpu-forwarding.ts'
const patchPath =
  'docker/prod/gpu-worker/sam3_1/patches/0003-weeditpro-multiplex-session-gpu-forwarding.patch'
const publication = readFileSync(publicationPath, 'utf8')
const start = readFileSync(startPath, 'utf8')
const patch = readFileSync(patchPath, 'utf8')
const qualificationDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification.candidate',
  'utf8',
)
const productionDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.candidate',
  'utf8',
)
const qualificationRunner = readFileSync(
  'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
  'utf8',
)
const productionRunner = readFileSync(
  'docker/prod/gpu-worker/sam3_1/runner.py',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-build-multiplex-session-gpu-forwarding-corrected-v1',
    'forward_gpu_session_controls_through_all_pinned_sam31_multiplex_overrides',
    'failedAttemptAutomaticallyRetried: false',
  ] as const) assert.ok(
    source.includes(expected),
    `GPU-forwarding successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /failedAttemptAutomaticallyRetried: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'sam31-a100-multiplex-session-corrected-20260808-v11',
  'sam31-vertex-terminal.4dfedd7e47c191aef83eb11a2c52bb40',
  '4dfedd7e47c191aef83eb11a2c52bb406acb66df029e4aa273c22115ae26a9cc',
  'cpuStateOffloadAllowed: false',
  'cpuVideoDecodeFallbackAllowed: false',
] as const) assert.ok(
  publication.includes(expected),
  `GPU-forwarding failure lineage lost ${expected}`,
)

assert.equal(
  createHash('sha256').update(patch).digest('hex'),
  'fb5c047013629d27d7b8f2aecbf8343a402d2e36de3e24dc1be4347f83d9c86b',
)
assert.equal(
  (patch.match(/offload_state_to_cpu=offload_state_to_cpu/gmu) ?? []).length,
  2,
)
assert.equal(
  (patch.match(/gpu_acceleration=gpu_acceleration/gmu) ?? []).length,
  2,
)
assert.equal(
  (patch.match(/gpu_device=gpu_device/gmu) ?? []).length,
  2,
)

for (const source of [qualificationDockerfile, productionDockerfile] as const) {
  for (const expected of [
    patchPath.split('/').at(-1)!,
    'fde68920b0073ec6eea2ad63351fb1c133c9abdd866c2cb9f9d28c8a2d969038',
    'e9fd77f867968f0740e420971fd0405a0b511ac8684019660767f5b07d26ab41',
    'gpu_acceleration=gpu_acceleration',
    'gpu_device=gpu_device',
  ] as const) assert.ok(
    source.includes(expected),
    `candidate Dockerfile lost ${expected}`,
  )
}

for (const source of [qualificationRunner, productionRunner] as const) {
  for (const expected of [
    '"offload_state_to_cpu"',
    '"use_torchcodec"',
    '"gpu_acceleration"',
    '"gpu_device"',
    'SAM 3.1 multiplex init_state signature changed',
    'SAM 3.1 multiplex init_state became open-ended',
  ] as const) assert.ok(
    source.includes(expected),
    `runtime guard lost ${expected}`,
  )
  assert.doesNotMatch(source, /kwargs\.pop\("gpu_acceleration"/u)
  assert.doesNotMatch(source, /kwargs\.pop\("gpu_device"/u)
}

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-multiplex-session-gpu-forwarding-authority'
  ],
  `tsx ${publicationPath}`,
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-multiplex-session-gpu-forwarding-build'
  ],
  `tsx ${startPath}`,
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-image-multiplex-session-gpu-forwarding-successor',
  officialSourceArchiveMutated: false,
  installedMultiplexSourcePatched: true,
  allSessionControlsForwarded: true,
  cpuStateOffloadAllowed: false,
  cpuVideoDecodeFallbackAllowed: false,
  predecessorAutomaticallyRetried: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
