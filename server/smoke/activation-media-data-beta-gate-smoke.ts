import { existsSync, readFileSync } from 'node:fs'
import {
  MEDIA_DATA_BETA_GATE_EXPECTED_REPORT_FILES,
  MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX,
  MEDIA_DATA_BETA_GATE_REPORT_DIR,
  getMediaDataBetaGatePlan,
} from '../activation/media-data-beta-gate'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const moduleSource = readFileSync('server/activation/media-data-beta-gate/index.ts', 'utf8')
const plan = getMediaDataBetaGatePlan()

for (const script of [
  'activation:media-data-beta-gate:plan',
  'activation:media-data-beta-gate',
  'activation:media-data-beta-gate:report',
  'activation:media-data-beta-gate:iam-plan',
  'activation:media-data-beta-gate:cost-summary',
  'activation:media-data-beta-gate:summary',
  'smoke:activation-media-data-beta-gate',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const sourcePath of [
  'docs/activation-phase-46a-media-data-readiness-reports/phase_46a_media_data_readiness_report.json',
  'docs/activation-phase-46b-generated-media-data-suite-reports/phase_46b_generated_media_data_suite_report.json',
  'docs/activation-phase-46c-controlled-real-video-media-data-suite-reports/phase_46c_controlled_real_video_media_data_suite_report.json',
  'docs/activation-phase-46d-duckdb-polars-reporting-qa-reports/phase_46d_auth_rerun_recovery_report.json',
]) {
  assert(existsSync(sourcePath), `Required Phase 46 evidence missing: ${sourcePath}`)
}

assert(plan.privateArtifactUploadPrefix === MEDIA_DATA_BETA_GATE_PRIVATE_GCS_PREFIX, 'Phase 46E private prefix mismatch.')
assert(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE'), 'Beta gate confirmation missing.')
assert(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE_PRIVATE_ARTIFACT_READ'), 'Private read confirmation missing.')
assert(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_MEDIA_DATA_BETA_GATE_PRIVATE_ARTIFACT_UPLOAD'), 'Private upload confirmation missing.')

for (const requiredPrefix of [
  'phase46b/generated-media-data-suite/phase46b-generated-media-data-suite-20260603',
  'phase46c/controlled-real-video-media-data/phase46c-controlled-real-video-media-data-suite-20260603',
  'phase46d/reporting-qa-integration/phase46d-duckdb-polars-reporting-qa-integration-20260603',
]) {
  assert(plan.allowedPrivateJsonReadPrefixes.some((prefix) => prefix.includes(requiredPrefix)), `Missing exact private read prefix: ${requiredPrefix}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_MEDIA_DATA_GENERATED_FIXTURES',
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_REAL_VIDEO',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_CLOUD_RUN_EXECUTE',
  'REEDITPRO_CONFIRM_CLOUD_BUILD_EXECUTE',
]) {
  assert(plan.forbiddenConfirmations.includes(forbidden), `Forbidden confirmation is not blocked: ${forbidden}`)
}

assert(moduleSource.includes('MEDIA_PAYLOAD_EXTENSIONS'), 'Media payload extension rejection guard missing.')
assert(moduleSource.includes('json_metadata_only'), 'JSON-only private metadata policy missing.')
assert(moduleSource.includes('internally beta-ready candidate'), 'Internal beta-ready candidate decision status missing.')
assert(moduleSource.includes("productWideBeta: 'blocked'"), 'Product-wide beta block missing.')
assert(moduleSource.includes('Track A runtime/visual/render stack'), 'Track A blocked scope missing.')
assert(moduleSource.includes('VLM runtime retries'), 'VLM runtime retry blocked scope missing.')
assert(moduleSource.includes('OCR runtime outside approved phases'), 'OCR blocked scope missing.')
assert(MEDIA_DATA_BETA_GATE_REPORT_DIR.includes('phase-46e'), 'Phase 46E report dir mismatch.')

for (const reportFile of MEDIA_DATA_BETA_GATE_EXPECTED_REPORT_FILES) {
  assert(reportFile.startsWith('phase_46e_'), `Unexpected Phase 46E report file: ${reportFile}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: '46E',
  checkedReports: MEDIA_DATA_BETA_GATE_EXPECTED_REPORT_FILES.length,
  mediaProcessing: 'blocked',
  privateReadRequiresConfirmation: true,
  privateUploadRequiresConfirmation: true,
  externalBeta: 'blocked',
}, null, 2))
