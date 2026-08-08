import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const publicationPath =
  'server/cli/publish-canonical-sam3_1-qualification-image-build-multiplex-session-compatibility-authority.ts'
const startPath =
  'server/cli/start-canonical-sam3_1-qualification-image-build-multiplex-session-compatibility.ts'
const publication = readFileSync(publicationPath, 'utf8')
const start = readFileSync(startPath, 'utf8')
const capsulePublisher = readFileSync(
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
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
  readonly scripts?: Readonly<Record<string, string>>
}

for (const source of [publication, start] as const) {
  for (const expected of [
    'sam31-qualification-image-build-multiplex-session-api-compatibility-corrected-v1',
    'bridge_pinned_sam31_base_predictor_to_multiplex_init_without_cpu_state_offload',
    'failedAttemptAutomaticallyRetried: false',
  ] as const) assert.ok(
    source.includes(expected),
    `multiplex-session successor lost ${expected}`,
  )
  assert.doesNotMatch(
    source,
    /failedAttemptAutomaticallyRetried: true|secretEnv|availableSecrets/u,
  )
}

for (const expected of [
  'sam31-a100-rope-cache-corrected-20260808-v10',
  'sam31-vertex-terminal.84f928e77a70566e1c89c65b7c9bbbf8',
  '84f928e77a70566e1c89c65b7c9bbbf8a97806ad3e886d55b08e316b24e6e96f',
  'cpuStateOffloadAllowed: false',
  'officialSourceFilesMutated: false',
] as const) assert.ok(
  publication.includes(expected),
  `multiplex-session failure lineage lost ${expected}`,
)

for (const expected of [
  'multiplex_session_api_compatibility_corrected',
  'sam31-qualification-capsule-reproducibility-multiplex-session-api-compatibility-corrected-v1',
  'WEEDITPRO_SAM31_CAPSULE_PRIMARY_BUILD_ID',
  'WEEDITPRO_SAM31_CAPSULE_CONFIRMATION_BUILD_ID',
] as const) assert.ok(
  capsulePublisher.includes(expected),
  `multiplex-session reproducibility publisher lost ${expected}`,
)

for (const source of [qualificationRunner, productionRunner] as const) {
  assert.equal(
    (source.match(/install_sam31_multiplex_session_compatibility_guard/gmu)
      ?? []).length,
    2,
  )
  for (const expected of [
    'SAM 3.1 multiplex init_state signature changed',
    'SAM 3.1 multiplex init_state became open-ended',
    'kwargs.pop("offload_state_to_cpu", None) is not False',
    'SAM 3.1 state offload is forbidden',
  ] as const) assert.ok(
    source.includes(expected),
    `multiplex-session runtime guard lost ${expected}`,
  )
}

assert.equal(
  packageJson.scripts?.[
    'publish:sam3_1-qualification-image-multiplex-session-compatibility-authority'
  ],
  `tsx ${publicationPath}`,
)
assert.equal(
  packageJson.scripts?.[
    'start:sam3_1-qualification-image-multiplex-session-compatibility-build'
  ],
  `tsx ${startPath}`,
)

console.log(JSON.stringify({
  smoke:
    'canonical-sam3_1-qualification-image-multiplex-session-compatibility-successor',
  officialSam31SourceMutated: false,
  cpuStateOffloadAllowed: false,
  legacyFalseOptionRemovedOnlyAtMultiplexBoundary: true,
  predecessorAutomaticallyRetried: false,
  modelExecuted: false,
  gpuJobStarted: false,
  customerCreditsMutated: false,
  runtimeReleaseGranted: false,
  productionReady: false,
}, null, 2))
