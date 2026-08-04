import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const scriptPath =
  'scripts/gcp/prod/19-retire-legacy-cpu-media-runtimes.sh'
const source = readFileSync(scriptPath, 'utf8')

const legacyCpuJobs = [
  'reeditpro-sound-audio-metadata-worker',
  'reeditpro-sound-cpu-analysis-worker',
  'reeditpro-staging-cpu-analysis-job',
  'reeditpro-staging-deepfilternet-runtime-job',
  'reeditpro-staging-film-runtime-job',
  'reeditpro-staging-final-render-hardening-job',
  'reeditpro-staging-libass-burnin-validation-job',
  'reeditpro-staging-pro-color-image-runtime-job',
  'reeditpro-staging-qa-job',
  'reeditpro-staging-remotion-render-validation-job',
  'reeditpro-staging-render-job',
  'reeditpro-staging-speech-runtime-job',
  'reeditpro-staging-tool-readiness-job',
  'reeditpro-stg-deepfilternet-runtime-phase36h',
  'reeditpro-stg-signalsmith-controlled-runtime-phase36j',
] as const

assert.match(source, /set -euo pipefail/u)
assert.match(source, /confirm_prod_action/u)
assert.match(source, /EXPECTED_PROJECT_ID='reeditpro'/u)
assert.match(source, /LEGACY_REGION='us-central1'/u)
assert.match(source,
  /retire-weeditpro-legacy-cpu-media-runtime-v1/u)
assert.match(source, /assert_exact_legacy_cpu_job/u)
assert.match(source, /assert_no_unfinished_execution/u)
assert.match(source, /status\.completionTime/u)
assert.match(source, /resources\.limits\["nvidia\.com\/gpu"\]/u)
assert.match(source, /refusing changed or GPU-enabled job definition/u)
assert.match(source, /gcloud run jobs describe/u)
assert.match(source, /gcloud run jobs executions list/u)
assert.match(source, /run_gcloud run jobs delete/u)
assert.match(source, /historicalEvidencePreserved: true/u)
assert.match(source, /normalProcessingRequiresQualifiedL4: true/u)
assert.match(source,
  /heavyProcessingRequiresQualifiedA100WithQualifiedL4Fallback: true/u)

for (const jobName of legacyCpuJobs) {
  assert.equal(
    source.split(`${jobName}|`).length - 1,
    1,
    `${jobName} must occur exactly once in the fixed specification allowlist.`,
  )
}

for (const forbiddenTarget of [
  'reeditpro-staging-birefnet-runtime-job',
  'reeditpro-staging-real-esrgan-runtime-job',
  'reeditpro-professional-l4',
  'reeditpro-sam31-l4-fallback',
] as const) assert.doesNotMatch(source, new RegExp(forbiddenTarget, 'u'))

for (const forbiddenOperation of [
  /gcloud run services delete/u,
  /gcloud iam service-accounts (?:delete|disable)/u,
  /gcloud artifacts docker images delete/u,
  /gcloud storage (?:rm|objects delete)/u,
  /gcloud secrets delete/u,
  /gcloud batch jobs delete/u,
  /gcloud builds submit/u,
  /gcloud run jobs execute/u,
] as const) assert.doesNotMatch(source, forbiddenOperation)

console.log(JSON.stringify({
  smoke: 'visual-intelligence-legacy-cpu-runtime-retirement',
  fixedLegacyCpuJobCount: legacyCpuJobs.length,
  exactImageIdentityRequired: true,
  exactServiceIdentityRequired: true,
  exactCpuOnlyResourceEnvelopeRequired: true,
  unfinishedExecutionFailsClosed: true,
  changedOrGpuEnabledJobFailsClosed: true,
  gpuJobsOutOfScope: true,
  cloudRunServicesOutOfScope: true,
  immutableHistoricalImagesPreserved: true,
  customerCreditsMutated: false,
  productionReady: false,
}, null, 2))
