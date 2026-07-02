import assert from 'node:assert/strict'
import {
  buildBetaToolsLibassSyntheticBurninQaEvidencePreflight,
  type BetaToolsLibassSyntheticBurninQaEvidenceEnv,
} from '../cli/beta-tools-libass-synthetic-burnin-qa-evidence-preflight'

const completeEnv: BetaToolsLibassSyntheticBurninQaEvidenceEnv = {
  REEDITPRO_BETA_LIBASS_BURNIN_QA_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_BEARER_TOKEN: 'libass-burnin-qa-bearer-token-secret-for-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_IDEMPOTENCY_KEY: 'libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID: 'workspace-libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_PROJECT_ID: 'project-libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID: 'beta-tools-libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA: 'bfdd73f8fadfe9b7a5d38a1ddd78f689edaf4c9c',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_NOTES: 'Smoke validates libass synthetic burn-in QA evidence inputs.',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_MODE: 'docker',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE: 'reeditpro-render-worker:libass-burnin-qa-evidence-smoke',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE: 'true',
  REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE: 'true',
}

const ready = buildBetaToolsLibassSyntheticBurninQaEvidencePreflight(completeEnv)
assert.equal(ready.ok, true, 'complete evidence preflight should pass')
assert.equal(ready.readyToRunCli, true, 'complete evidence preflight should be runnable')
assert.equal(ready.readyToRecordAcceptedEvidence, true, 'complete evidence preflight should be ready to record evidence')
assert.equal(ready.plannedEndpoint, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence', 'preflight should plan generic evidence endpoint')
assert.equal(ready.collectorCommand, 'npm run beta:tools:libass-synthetic-burnin-qa-evidence', 'preflight should name collector command')
assert.equal(ready.duplicateContext.openHistoricalPr, 73, 'preflight should preserve PR #73 historical context')
assert.equal(ready.requestShape.mode, 'docker', 'preflight should preserve docker mode')
assert.equal(ready.requestShape.containerImagePresent, true, 'preflight should require container image in docker mode')
assert.equal(ready.requestShape.acceptProductReadyLocalOss, true, 'preflight should require product-ready acceptance for this blocker-reducing lane')
assert.equal(JSON.stringify(ready).includes('libass-burnin-qa-bearer-token-secret-for-smoke'), false, 'preflight must not print bearer token')

const missing = buildBetaToolsLibassSyntheticBurninQaEvidencePreflight({})
assert.equal(missing.ok, false, 'missing evidence preflight should fail closed')
assert.ok(missing.missingConfiguration.includes('REEDITPRO_BETA_LIBASS_BURNIN_QA_API_BASE_URL is required.'), 'missing API URL should be named')
assert.ok(missing.missingConfiguration.includes('REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_RECORDED_EVIDENCE=true is required so the collector fails closed when deployed readback does not include libass evidence.'), 'missing require-recorded guard should be named')
assert.ok(missing.confirmationGaps.some((gap) => gap.includes('ACCEPT_PRODUCT_READY_LOCAL_OSS')), 'missing product-ready confirmation should be named')

const retainAttempt = buildBetaToolsLibassSyntheticBurninQaEvidencePreflight({
  ...completeEnv,
  REEDITPRO_BETA_LIBASS_BURNIN_QA_RETAIN_TEMP_OUTPUTS: 'true',
})
assert.equal(retainAttempt.ok, false, 'retaining temp outputs should fail preflight')
assert.ok(retainAttempt.confirmationGaps.some((gap) => gap.includes('Retaining temp outputs is not allowed')), 'retain temp output gap should be named')

console.log(JSON.stringify({
  ok: true,
  readyToRunCli: ready.readyToRunCli,
  readyToRecordAcceptedEvidence: ready.readyToRecordAcceptedEvidence,
  plannedEndpoint: ready.plannedEndpoint,
  historicalDuplicateContext: ready.duplicateContext.openHistoricalPr,
  tokenInSummary: JSON.stringify(ready).includes('bearer-token-secret-for-smoke'),
}, null, 2))
