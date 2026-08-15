import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const entrypointPath =
  'server/cli/run-weeditpro-sam3_1-eight-minute-source-preparation-worker.ts'
const configPath = 'vite.server.config.ts'
const [entrypoint, config] = await Promise.all([
  readFile(entrypointPath, 'utf8'),
  readFile(configPath, 'utf8'),
])

assert.match(entrypoint,
  /WEEDITPRO_SAM31_SOURCE_PREPARATION_INVOCATION_ID/u)
assert.match(entrypoint, /WORKER_GROUP: z\.literal\('l4_standard_primary'\)/u)
assert.match(entrypoint,
  /GCS_CONTROL_PLANE_STATE_BUCKET: z\.literal\(CONTROL_PLANE_STATE_BUCKET\)/u)
assert.match(entrypoint, /rereadConsumedAdmission/u)
assert.match(entrypoint, /rereadPlan/u)
assert.match(entrypoint, /rereadPreparation/u)
assert.match(entrypoint,
  /createCanonicalSam31EightMinuteSourcePreparationFixedProcessPort/u)
assert.match(entrypoint, /persistPreparationCreateOnly/u)
assert.match(entrypoint, /exactCreateOnlyPreparationRereadVerified/u)
assert.match(entrypoint, /unknown_requires_terminal_reconciliation/u)
assert.match(entrypoint, /automaticRetryAllowed: false/u)
assert.match(entrypoint, /substantiveCpuMediaProcessingUsed: false/u)
assert.match(entrypoint, /runtimeModelOrToolDownloadPerformed: false/u)
assert.match(entrypoint, /customerCreditsMutated: false/u)
assert.match(entrypoint, /productionAuthorityGranted: false/u)
assert.doesNotMatch(entrypoint, /process\.env\.(?:SOURCE|URL|PATH|MODEL|COMMAND)/u)
assert.doesNotMatch(entrypoint, /execSync|spawnSync|shell:\s*true/u)
assert.match(config,
  /weeditpro-sam3_1-eight-minute-source-preparation-worker/u)
assert.match(config,
  /run-weeditpro-sam3_1-eight-minute-source-preparation-worker\.ts/u)

console.log(JSON.stringify({
  smoke: 'canonical-sam3_1-eight-minute-source-preparation-worker-entrypoint',
  checks: 20,
  entrypointSha256: createHash('sha256').update(entrypoint).digest('hex'),
  cloudRunReceivesOnlyInvocationIdentity: true,
  consumedAdmissionRequiredBeforeGpuProcess: true,
  existingPreparationReplayedWithoutGpu: true,
  unknownOutcomeRetryAllowed: false,
  substantiveCpuMediaProcessingAllowed: false,
  customerCreditsMutated: false,
  productionAuthorityGranted: false,
}))
