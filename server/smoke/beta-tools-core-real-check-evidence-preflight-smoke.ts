import assert from 'node:assert/strict'
import {
  buildBetaToolsCoreRealCheckEvidencePreflight,
} from '../cli/beta-tools-core-real-check-evidence-preflight'
import type { BetaToolsCoreRealCheckEvidenceEnv } from '../cli/beta-tools-core-real-check-evidence'

const completeEnv: BetaToolsCoreRealCheckEvidenceEnv = {
  REEDITPRO_BETA_TOOLS_API_BASE_URL: 'https://api.staging.reeditpro.example',
  REEDITPRO_BETA_TOOLS_BEARER_TOKEN: 'bearer-token-secret-for-smoke',
  REEDITPRO_BETA_TOOLS_WORKSPACE_ID: 'workspace-core-real-check-preflight-smoke',
  REEDITPRO_BETA_TOOLS_PROJECT_ID: 'project-core-real-check-preflight-smoke',
  REEDITPRO_BETA_TOOLS_SOURCE_ID: 'beta-tools-core-real-check-preflight-smoke',
  REEDITPRO_BETA_TOOLS_SOURCE_SHA: 'dddddddddddddddddddddddddddddddddddddddd',
  REEDITPRO_BETA_TOOLS_IDEMPOTENCY_KEY: 'beta-tools-core-real-check-preflight-smoke',
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_NOTES: 'Staging operator prepared bounded core tool evidence.',
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS: 'ffmpeg,ffprobe,sharp,remotion',
  REEDITPRO_BETA_TOOLS_INCLUDE_WARNINGS: 'false',
  REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCTION_READINESS: 'true',
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_ACCEPT_PRODUCT_READY_LOCAL_OSS: 'true',
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'true',
  REEDITPRO_BETA_TOOLS_REQUIRE_ACCEPTED_EVIDENCE: 'true',
}

const readyReport = buildBetaToolsCoreRealCheckEvidencePreflight(completeEnv)
assert.equal(readyReport.ok, true, 'complete input should be callable')
assert.equal(readyReport.readyToRunCli, true, 'complete input should be ready to run CLI')
assert.equal(readyReport.readyToRecordAcceptedEvidence, true, 'complete input should be ready to request accepted evidence')
assert.equal(readyReport.plannedEndpoint, 'https://api.staging.reeditpro.example/v1/beta-readiness/evidence/core-real-check')
assert.deepEqual(readyReport.requestShape.requestedToolIds, ['ffmpeg', 'ffprobe', 'sharp', 'remotion'])
assert.equal(readyReport.requestShape.acceptProductionReadiness, true)
assert.equal(readyReport.requestShape.acceptProductReadyLocalOss, true)
assert.equal(readyReport.requestShape.requireAcceptedEvidence, true)
assert.equal(readyReport.missingConfiguration.length, 0, 'complete input should have no missing configuration')
assert.equal(readyReport.confirmationGaps.length, 0, 'complete input should have no confirmation gaps')
assert.equal(readyReport.invalidToolIds.length, 0, 'complete input should have no invalid tool IDs')
assert.equal(readyReport.secretLikeInputPaths.length, 0, 'complete input should have no secret-like notes')
assert.equal(JSON.stringify(readyReport).includes('bearer-token-secret-for-smoke'), false, 'preflight report must not print bearer token')

const noEnvReport = buildBetaToolsCoreRealCheckEvidencePreflight({})
assert.equal(noEnvReport.readyToRunCli, false, 'missing core env should block CLI readiness')
assert.equal(noEnvReport.readyToRecordAcceptedEvidence, false, 'missing core env should block accepted-evidence readiness')
assert.ok(noEnvReport.missingConfiguration.some((item) => item.includes('API_BASE_URL')), 'missing core env should name API base URL')
assert.ok(noEnvReport.missingConfiguration.some((item) => item.includes('SOURCE_SHA')), 'missing source SHA should be named')
assert.ok(noEnvReport.missingConfiguration.some((item) => item.includes('ACCEPT_PRODUCTION_READINESS')), 'missing production-readiness acceptance should be named')
assert.ok(noEnvReport.missingConfiguration.some((item) => item.includes('ACCEPT_PRODUCT_READY_LOCAL_OSS')), 'missing product-ready acceptance should be named')
assert.ok(noEnvReport.missingConfiguration.some((item) => item.includes('REQUIRE_ACCEPTED_EVIDENCE')), 'missing require-accepted flag should be named')

const confirmationGapReport = buildBetaToolsCoreRealCheckEvidencePreflight({
  ...completeEnv,
  REEDITPRO_BETA_TOOLS_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE: 'false',
})
assert.equal(confirmationGapReport.readyToRunCli, false, 'request builder should block missing product-ready confirmation')
assert.equal(confirmationGapReport.readyToRecordAcceptedEvidence, false, 'missing confirmation should block accepted-evidence readiness')
assert.ok(confirmationGapReport.confirmationGaps.some((gap) => gap.includes('PRODUCT_READY_LOCAL_OSS_ACCEPTANCE')), 'confirmation gap should be reported')

const invalidToolReport = buildBetaToolsCoreRealCheckEvidencePreflight({
  ...completeEnv,
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_TOOL_IDS: 'ffmpeg,nope',
})
assert.equal(invalidToolReport.readyToRunCli, false, 'invalid tool IDs should block CLI readiness')
assert.deepEqual(invalidToolReport.invalidToolIds, ['nope'])

const secretNotesReport = buildBetaToolsCoreRealCheckEvidencePreflight({
  ...completeEnv,
  REEDITPRO_BETA_TOOLS_CORE_REAL_CHECK_NOTES: 'Bearer should-not-be-here',
})
assert.equal(secretNotesReport.readyToRunCli, false, 'secret-like notes should fail preflight')
assert.ok(secretNotesReport.secretLikeInputPaths.some((path) => path.includes('notes')), 'secret-like note path should be reported')

console.log(JSON.stringify({
  ok: true,
  readyToRecordAcceptedEvidence: readyReport.readyToRecordAcceptedEvidence,
  noEnvMissingConfigurationCount: noEnvReport.missingConfiguration.length,
  confirmationGapCount: confirmationGapReport.confirmationGaps.length,
  invalidToolRejected: invalidToolReport.invalidToolIds.length === 1,
  secretNotesRejected: secretNotesReport.secretLikeInputPaths.length > 0,
  tokenInSummary: JSON.stringify(readyReport).includes('bearer-token-secret-for-smoke'),
}, null, 2))
