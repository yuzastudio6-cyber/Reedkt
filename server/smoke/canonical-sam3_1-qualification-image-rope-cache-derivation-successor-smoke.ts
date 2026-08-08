import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publicationPath =
  'server/cli/publish-canonical-sam3_1-qualification-image-build-rope-cache-derivation-authority.ts'
const startPath =
  'server/cli/start-canonical-sam3_1-qualification-image-build-rope-cache-derivation.ts'
const publication = readFileSync(publicationPath, 'utf8')
const start = readFileSync(startPath, 'utf8')
const capsulePublisher = readFileSync(
  'server/cli/publish-canonical-sam3_1-qualification-capsule-reproducibility.ts',
  'utf8',
)
const runner = readFileSync(
  'docker/prod/gpu-worker/sam3_1/qualification_runner.py',
  'utf8',
)
const productionRunner = readFileSync(
  'docker/prod/gpu-worker/sam3_1/runner.py',
  'utf8',
)
const sourceLock = readFileSync(
  'docker/prod/gpu-worker/sam3_1/source-provenance.lock',
  'utf8',
)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-build-rope-cache-derivation-corrected-v1',
    'derive_only_fixed_real_rope_runtime_caches_from_complex_checkpoint_buffers',
    'failedAttemptAutomaticallyRetried: false',
  ] as const) assert.ok(
    source.includes(expected),
    `RoPE-cache successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /failedAttemptAutomaticallyRetried: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'rope_cache_derivation_corrected',
  'sam31-qualification-capsule-reproducibility-rope-cache-derivation-corrected-v1',
  'WEEDITPRO_SAM31_CAPSULE_PRIMARY_BUILD_ID',
  'WEEDITPRO_SAM31_CAPSULE_CONFIRMATION_BUILD_ID',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `RoPE-cache reproducibility publisher lost ${expected}`,
)

for (const source of [runner, productionRunner] as const) {
  for (const expected of [
    'sam3_1_real_rope_cache_from_complex_buffer_v1',
    'EXPECTED_DETECTOR_ROPE_BLOCKS = tuple(range(32))',
    'checkpoint already contains derived real RoPE cache',
    'checkpoint augmentation exceeded derived RoPE caches',
    'len(derived_keys) != 64',
    'torch.complex(real, imag)',
  ] as const) assert.ok(
    source.includes(expected),
    `RoPE-cache runner guard lost ${expected}`,
  )
}

for (const expected of [
  'checkpoint_unreviewed_key_rewrite_allowed=false',
  'checkpoint_deterministic_runtime_buffer_derivation_source_count=32',
  'checkpoint_deterministic_runtime_buffer_derivation_output_count=64',
  'checkpoint_deterministic_runtime_buffer_derivation_mutates_checkpoint_file=false',
  'checkpoint_deterministic_runtime_buffer_derivation_synthesizes_learned_parameters=false',
] as const) assert.ok(
  sourceLock.includes(expected),
  `RoPE-cache source policy lost ${expected}`,
)

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-rope-cache-derivation-authority'
  ],
  `tsx ${publicationPath}`,
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-rope-cache-derivation-build'
  ],
  `tsx ${startPath}`,
)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-qualification-image-rope-cache-derivation-successor',
  exactComplexRopeSourcesRequired: 32,
  exactDerivedRealAndImagRuntimeBuffersRequired: 64,
  sourceCheckpointFileMutationAllowed: false,
  learnedParameterOrCheckpointWeightSynthesisAllowed: false,
  predecessorAutomaticallyRetried: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
