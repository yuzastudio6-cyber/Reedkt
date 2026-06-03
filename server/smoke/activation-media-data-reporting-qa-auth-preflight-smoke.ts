import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import {
  getMediaDataReportingQaAuthPreflightPlan,
  getMediaDataReportingQaAuthSmokeExpectations,
} from '../activation/media-data-reporting-qa/auth-preflight'

const plan = getMediaDataReportingQaAuthPreflightPlan()
const expectations = getMediaDataReportingQaAuthSmokeExpectations()
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const authSource = readFileSync('server/activation/media-data-reporting-qa/auth-preflight.ts', 'utf8')
const reportingSource = readFileSync('server/activation/media-data-reporting-qa/index.ts', 'utf8')

assert.equal(plan.phase, '46D-AUTH-RERUN')
assert.equal(plan.tokenOutput, 'not_printed')
assert.equal(plan.serviceAccountKeys, 'blocked_not_created_not_committed')
assert.equal(plan.browserLoginInsideCodex, 'blocked')
assert.equal(plan.requiredConfirmationForAuthPreflightExecute, 'REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA_AUTH_PREFLIGHT')
assert.equal(plan.requiredConfirmationForReportingRerun, 'REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA')
assert.equal(plan.requiredConfirmationForPrivateMetadataRead, 'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_READ')
assert.equal(plan.requiredConfirmationForPrivateArtifactUpload, 'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD')
assert.equal(plan.sourcePhase46dPr.includes('/pull/132'), true)
assert.equal(plan.allowedPrivateReadPrefixes.length, 2)
assert.equal(plan.privateReads, 'json_metadata_only')
assert.equal(plan.mediaProcessing, 'blocked')

for (const script of expectations.scripts) {
  assert.equal(Boolean(packageJson.scripts?.[script]), true, `Missing script: ${script}`)
}

for (const reportFile of expectations.reportFiles) {
  assert.equal(reportFile.startsWith('phase_46d_'), true, `Unexpected report file: ${reportFile}`)
}

for (const required of [
  'REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT',
  'REEDITPRO_GCP_ACCESS_TOKEN_FILE',
  'CLOUDSDK_AUTH_ACCESS_TOKEN',
  'REEDITPRO_GCP_WIF_CREDENTIAL_FILE',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'print-access-token',
  'not_printed',
  'not_used_not_created',
  'phase46b/generated-media-data-suite/phase46b-generated-media-data-suite-20260603',
  'phase46c/controlled-real-video-media-data/phase46c-controlled-real-video-media-data-suite-20260603',
  'Blocked fixes:',
]) {
  assert.equal(authSource.includes(required), true, `Auth source missing: ${required}`)
}

for (const forbidden of [
  'iam service-accounts keys create',
  'gcloud auth login',
  'allUsers',
  'allAuthenticatedUsers',
  'roles/storage.admin',
  'roles/storage.objectAdmin',
]) {
  assert.equal(authSource.includes(forbidden), false, `Forbidden auth pattern present: ${forbidden}`)
}

for (const blocked of [
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_REAL_VIDEO',
  'REEDITPRO_CONFIRM_MEDIA_DATA_GENERATED_FIXTURES',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]) {
  assert.equal(expectations.forbiddenConfirmations.includes(blocked), true, `Forbidden confirmation not tracked: ${blocked}`)
}

assert.equal(reportingSource.includes('Blocked non-JSON private artifact read'), true)
assert.equal(reportingSource.includes('MEDIA_PAYLOAD_EXTENSIONS'), true)
assert.equal(existsSync('server/cli/activation-media-data-reporting-qa-auth-rerun.ts'), true)

console.log(JSON.stringify({
  status: 'passed',
  phase: '46D-AUTH-RERUN',
  authPreflight: 'present',
  tokenOutput: 'not_printed',
  privateMetadataRead: 'exact_json_prefixes_only',
  mediaProcessing: 'blocked',
  serviceAccountKeys: 'blocked',
}, null, 2))
