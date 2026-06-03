import { existsSync, readFileSync } from 'node:fs'
import {
  MEDIA_DATA_REPORTING_QA_EXPECTED_REPORT_FILES,
  MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX,
  MEDIA_DATA_REPORTING_QA_REPORT_DIR,
  getMediaDataReportingQaPlan,
} from '../activation/media-data-reporting-qa'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const plan = getMediaDataReportingQaPlan()
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const moduleSource = readFileSync('server/activation/media-data-reporting-qa/index.ts', 'utf8')
const workerSource = readFileSync('server/workers/media-data-reporting-qa/run_media_data_reporting_qa.py', 'utf8')

for (const script of [
  'activation:media-data-reporting-qa:plan',
  'activation:media-data-reporting-qa',
  'activation:media-data-reporting-qa:report',
  'activation:media-data-reporting-qa:iam-plan',
  'activation:media-data-reporting-qa:cost-summary',
  'activation:media-data-reporting-qa:summary',
  'smoke:activation-media-data-reporting-qa',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(plan.sourcePhase46aPr.includes('/pull/123'), 'Phase 46A evidence PR must be referenced.')
assert(plan.sourcePhase46bPr.includes('/pull/125'), 'Phase 46B evidence PR must be referenced.')
assert(plan.sourcePhase46cPr.includes('/pull/128'), 'Phase 46C evidence PR must be referenced.')
assert(plan.privateArtifactPrefix === MEDIA_DATA_REPORTING_QA_PRIVATE_GCS_PREFIX, 'Phase 46D private prefix mismatch.')
assert(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA'), 'Reporting QA confirmation missing.')
assert(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_READ'), 'Private read confirmation missing.')
assert(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD'), 'Private upload confirmation missing.')

for (const forbidden of [
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_REAL_VIDEO',
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_FRAME_SAMPLING',
  'REEDITPRO_CONFIRM_MEDIA_DATA_GENERATED_FIXTURES',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]) {
  assert(plan.forbiddenConfirmations.includes(forbidden), `Forbidden confirmation not blocked: ${forbidden}`)
}

for (const reportFile of MEDIA_DATA_REPORTING_QA_EXPECTED_REPORT_FILES) {
  assert(reportFile.startsWith('phase_46d_'), `Unexpected report file name: ${reportFile}`)
}

for (const sourcePath of [
  'docs/activation-phase-46a-media-data-readiness-reports/phase_46a_media_data_readiness_report.json',
  'docs/activation-phase-46b-generated-media-data-suite-reports/phase_46b_generated_media_data_suite_report.json',
  'docs/activation-phase-46c-controlled-real-video-media-data-suite-reports/phase_46c_controlled_real_video_media_data_suite_report.json',
]) {
  assert(existsSync(sourcePath), `Required source evidence missing: ${sourcePath}`)
}

for (const blockedPattern of ['opencv-python-headless', 'av==', 'scenedetect', 'sharp@', 'Cloud Run', 'Cloud Build']) {
  assert(!workerSource.includes(blockedPattern), `Reporting worker must not include media/runtime dependency or cloud action: ${blockedPattern}`)
}

for (const requiredPattern of ['duckdb==1.4.4', 'polars==1.36.1']) {
  assert(readFileSync('server/workers/media-data-reporting-qa/requirements.media-data-reporting.txt', 'utf8').includes(requiredPattern), `Missing reporting requirement: ${requiredPattern}`)
}

assert(moduleSource.includes('MEDIA_PAYLOAD_EXTENSIONS'), 'Media payload rejection guard missing.')
assert(moduleSource.includes('Blocked non-JSON private artifact read'), 'Private artifact JSON-only guard missing.')
assert(workerSource.includes('networkExtensionsLoaded'), 'DuckDB network extension use must be reported disabled.')
assert(workerSource.includes('cloudObjectStoreReadsUsed'), 'Polars cloud/object-store reads must be reported disabled.')
assert(moduleSource.includes('mediaDataToolFamilyBetaStatus'), 'Media/data beta status must be reported.')
assert(moduleSource.includes('phase-complete but tool-family incomplete'), 'Phase 46D must not claim external beta readiness.')
assert(plan.blockedScopes.includes('Track A runtime/visual/render stack'), 'Track A must remain blocked.')
assert(plan.blockedScopes.includes('VLM runtime retries'), 'VLM runtime retries must remain blocked.')
assert(plan.blockedScopes.includes('OCR runtime'), 'OCR runtime must remain blocked.')
assert(MEDIA_DATA_REPORTING_QA_REPORT_DIR.includes('phase-46d'), 'Phase 46D report dir mismatch.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '46D',
  checkedReports: MEDIA_DATA_REPORTING_QA_EXPECTED_REPORT_FILES.length,
  mediaProcessing: 'blocked',
  privateReadRequiresConfirmation: true,
  privateUploadRequiresConfirmation: true,
}, null, 2))
