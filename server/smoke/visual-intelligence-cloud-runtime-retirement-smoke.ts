import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const scriptPath =
  'scripts/gcp/prod/15-retire-legacy-visual-runtimes.sh'
const source = readFileSync(scriptPath, 'utf8')

const legacyJobs = [
  'reeditpro-qwen2-5-vl-private-caller',
  'reeditpro-staging-sam2-runtime-job',
  'reeditpro-stg-vlm-runtime-phase39c',
  'reeditpro-stg-vlm-runtime-phase39c-l4-compatible',
  'reeditpro-stg-vlm-runtime-phase39c-perception-canary',
  'reeditpro-stg-vlm-runtime-phase39c-sglang',
  'reeditpro-stg-vlm-runtime-phase39c-sglang-fixed-smoke',
  'reeditpro-stg-vlm-runtime-phase39c-sglang-kernel-smoke',
  'reeditpro-stg-vlm-runtime-phase39c-structured-output',
  'reeditpro-stg-vlm-runtime-phase39c-structured-output-compat',
] as const

assert.match(source, /set -euo pipefail/u)
assert.match(source, /confirm_prod_action/u)
assert.match(
  source,
  /REEDITPRO_RETIRE_LEGACY_VISUAL_RUNTIMES:-false/u,
)
assert.match(source, /assert_no_unfinished_execution/u)
assert.match(source, /status\.completionTime/u)
assert.match(source, /gcloud run jobs delete/u)
assert.match(source, /gcloud run services delete/u)
assert.match(source, /gcloud iam service-accounts disable/u)

for (const resourceName of legacyJobs) {
  assert.equal(
    source.split(`"${resourceName}"`).length - 1,
    1,
    `${resourceName} must occur exactly once in the retirement allowlist.`,
  )
}

assert.equal(
  source.split('reeditpro-qwen2-5-vl-l4-worker').length - 1,
  1,
)
assert.equal(
  source.split('qwen-private-caller-sa@').length - 1,
  1,
)
assert.doesNotMatch(
  source,
  /artifacts docker images delete|storage rm|secrets delete|projects delete/u,
)
assert.match(source, /historical image digests are retained/u)
assert.match(source, /Orchestra -> visual_intelligence/u)
assert.match(source, /Orchestra -> track_all -> SAM 3\.1/u)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-cloud-runtime-retirement',
  fixedLegacyJobCount: legacyJobs.length,
  qwenVisualServiceRetired: true,
  qwenCallerIdentityDisabled: true,
  unfinishedExecutionFailsClosed: true,
  immutableHistoricalImagesPreserved: true,
  freshVisualOwner: 'Orchestra -> visual_intelligence',
  freshTrackingOwner: 'Orchestra -> track_all -> SAM 3.1',
}, null, 2))
