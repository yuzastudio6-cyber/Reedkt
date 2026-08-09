import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const publicationPath =
  'server/cli/publish-canonical-sam3_1-qualification-image-build-forward-propagation-frame-count-authority.ts'
const startPath =
  'server/cli/start-canonical-sam3_1-qualification-image-build-forward-propagation-frame-count.ts'
const patchPath =
  'docker/prod/gpu-worker/sam3_1/patches/0004-weeditpro-forward-propagation-frame-count.patch'
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
const capsuleBuilder = readFileSync(
  'docker/prod/gpu-worker/sam3_1/build-qualification-capsule.sh',
  'utf8',
)
const capsuleBuilderDockerfile = readFileSync(
  'docker/prod/gpu-worker/sam3_1/Dockerfile.qualification-capsule-builder',
  'utf8',
)
const capsuleGcloudIgnore = readFileSync(
  'docker/prod/gpu-worker/sam3_1/.gcloudignore',
  'utf8',
)
const reproducibilityPublisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-capsule-reproducibility.ts',
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
const provenance = readFileSync(
  'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-build-forward-propagation-frame-count-corrected-v1',
    'make_forward_propagation_bound_count_exact',
    'failedAttemptAutomaticallyRetried: false',
  ] as const) assert.ok(source.includes(expected), `successor lost ${expected}`)
  assert.doesNotMatch(
    source,
    /failedAttemptAutomaticallyRetried: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'sam31-a100-multiplex-gpu-kernel-cache-corrected-20260809-v13',
  'sam31-vertex-terminal.9948942ae9e354f763e6d75692d76ffc',
  '9948942ae9e354f763e6d75692d76ffc564d5a1480dd5f56486616b3cfbc0ab9',
  'boundedForwardPropagationUsesExactFrameCount: true',
  'maximumFrameCountOneEmitsExactlyOneFrame: true',
  'callerPropagationLimitAccepted: false',
] as const) assert.ok(publication.includes(expected), `lineage lost ${expected}`)

assert.equal(
  createHash('sha256').update(patch).digest('hex'),
  '2540f5ba2a4d3f8931554e254d2f1c2c79abd28461f902477b7d64a04784f6de',
)
assert.match(
  patch,
  /end_frame_idx = start_frame_idx \+ max_frame_num_to_track - 1/u,
)
assert.doesNotMatch(patch, /except|continue|pass\s*$/mu)

for (const source of [
  qualificationDockerfile,
  productionDockerfile,
  capsuleBuilder,
  capsuleBuilderDockerfile,
  capsuleGcloudIgnore,
] as const) {
  assert.ok(
    source.includes('0004-weeditpro-forward-propagation-frame-count.patch'),
    'build closure lost patch 0004',
  )
}
for (const source of [
  qualificationDockerfile,
  productionDockerfile,
  capsuleBuilder,
] as const) assert.ok(
  source.includes(
    '2540f5ba2a4d3f8931554e254d2f1c2c79abd28461f902477b7d64a04784f6de',
  ),
  'build closure lost patch 0004 digest',
)

for (const expected of [
  'forward_propagation_frame_count_corrected',
  'sam31-qualification-capsule-reproducibility-forward-propagation-frame-count-corrected-v1',
] as const) assert.ok(
  reproducibilityPublisher.includes(expected),
  `reproducibility publisher lost ${expected}`,
)

for (const source of [qualificationDockerfile, productionDockerfile] as const) {
  for (const expected of [
    "old='            end_frame_idx = start_frame_idx + max_frame_num_to_track\\n'",
    "new='            end_frame_idx = start_frame_idx + max_frame_num_to_track - 1\\n'",
    "assert text.count(old) == 1",
    "assert text.count(new) == 0",
    '05678adccf05342514e1bbdb09a572fd68db66578dce07d2d5d11bc783090b03',
  ] as const) assert.ok(source.includes(expected), `exact patching lost ${expected}`)
}

for (const source of [qualificationRunner, productionRunner] as const) {
  assert.match(source, /"max_frame_num_to_track"/u)
  assert.doesNotMatch(source, /IndexError|chunk_find_inputs|except IndexError/u)
}

for (const expected of [
  'fixed_forward_propagation_limit_semantics=exact_frame_count',
  'fixed_forward_propagation_end_index_formula=start_plus_maximum_minus_one',
] as const) assert.ok(provenance.includes(expected), `provenance lost ${expected}`)

assert.equal(
  packageJson.scripts?.[
    'smoke:sam3_1-qualification-image-forward-propagation-frame-count-successor'
  ],
  'tsx server/smoke/canonical-sam3_1-qualification-image-forward-propagation-frame-count-successor-smoke.ts',
)
assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-forward-propagation-frame-count-authority'
  ],
  `tsx ${publicationPath}`,
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-forward-propagation-frame-count-build'
  ],
  `tsx ${startPath}`,
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-image-forward-propagation-frame-count-successor',
  officialSourceArchiveMutated: false,
  installedPinnedSourcePatched: true,
  boundedForwardPropagationUsesExactFrameCount: true,
  emptyTrailingGroundingChunkPossible: false,
  cpuStateOffloadAllowed: false,
  cpuVideoDecodeFallbackAllowed: false,
  predecessorAutomaticallyRetried: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
