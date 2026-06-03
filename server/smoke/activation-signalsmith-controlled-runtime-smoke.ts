import { existsSync, readFileSync } from 'node:fs'
import {
  SIGNALSMITH_CONTROLLED_EXPECTED_REPORT_FILES,
  SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX,
  SIGNALSMITH_CONTROLLED_REPORT_DIR,
  SIGNALSMITH_CONTROLLED_SAMPLE,
  getSignalsmithControlledRuntimePlan,
} from '../activation/signalsmith-stretch-runtime/controlled'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const moduleSource = readFileSync('server/activation/signalsmith-stretch-runtime/controlled.ts', 'utf8')
const workerSource = readFileSync('server/workers/signalsmith-stretch-runtime/run_signalsmith_controlled_suite.py', 'utf8')
const plan = getSignalsmithControlledRuntimePlan()

for (const script of [
  'activation:signalsmith-controlled-runtime:plan',
  'activation:signalsmith-controlled-runtime',
  'activation:signalsmith-controlled-runtime:report',
  'activation:signalsmith-controlled-runtime:iam-plan',
  'activation:signalsmith-controlled-runtime:cost-summary',
  'activation:signalsmith-controlled-runtime:summary',
  'smoke:activation-signalsmith-controlled-runtime',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(plan.signalsmithSource.selectedTag === '1.1.0', 'Signalsmith controlled source tag must remain pinned.')
assert(plan.signalsmithSource.selectedCommit === '44c8f865af9da8c29cc4a70a2d5a3ec83639c711', 'Signalsmith controlled source commit changed.')
assert(plan.privateArtifactPrefix === SIGNALSMITH_CONTROLLED_PRIVATE_GCS_PREFIX, 'Private artifact prefix mismatch.')
assert(SIGNALSMITH_CONTROLLED_REPORT_DIR.includes('phase-36j'), 'Phase 36J report directory mismatch.')
assert(plan.selectedSample.sampleId === SIGNALSMITH_CONTROLLED_SAMPLE.sampleId, 'Controlled sample id changed.')
assert(plan.selectedSample.privateOnly === true, 'Controlled sample must be private.')
assert(plan.selectedSample.windowStartSeconds === 6.9 && plan.selectedSample.windowEndSeconds === 8.9, 'Controlled window changed.')
assert(plan.controlledStretchFixtures.some((fixture) => fixture.fixtureId === 'controlled-stretch-expand-110' && fixture.stretchRatio === 1.1), '1.10x controlled stretch missing.')
assert(plan.controlledStretchFixtures.some((fixture) => fixture.fixtureId === 'controlled-stretch-contract-090' && fixture.stretchRatio === 0.9), '0.90x controlled stretch missing.')

for (const required of [
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_REAL_AUDIO',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_MEDIA_READ',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_PRIVATE_ARTIFACT_UPLOAD',
]) {
  assert(plan.executionConfirmations.includes(required), `Missing execution confirmation: ${required}`)
  assert(workerSource.includes(required), `Worker missing execution confirmation: ${required}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_SIGNALSMITH_GENERATED_AUDIO',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
]) {
  assert(plan.forbiddenConfirmations.includes(forbidden), `Forbidden confirmation is not blocked: ${forbidden}`)
  assert(workerSource.includes(forbidden), `Worker must block forbidden confirmation: ${forbidden}`)
}

assert(moduleSource.includes('phase36i_generated_fixture_evidence_missing'), 'Phase 36I evidence gate missing.')
assert(moduleSource.includes('approved_controlled_timing_stretch_sample_missing'), 'Controlled sample blocker missing.')
assert(moduleSource.includes('controlled_audio_window_not_timing_stretch_suitable') || workerSource.includes('controlled_audio_window_not_timing_stretch_suitable'), 'Timing suitability blocker missing.')
assert(moduleSource.includes('full-video processing'), 'Full-video blocked scope missing.')
assert(moduleSource.includes('Track A runtime/visual/render stack'), 'Track A blocked scope missing.')
assert(workerSource.includes('ffmpeg') && workerSource.includes('ffprobe'), 'Bounded extraction must use ffmpeg/ffprobe.')
assert(workerSource.includes('-ss') && workerSource.includes('-t'), 'Worker must use bounded extraction arguments.')
assert(workerSource.includes('MAX_DURATION_SECONDS'), 'Max duration enforcement missing.')
assert(workerSource.includes('gcloud') && workerSource.includes('storage') && workerSource.includes('cp'), 'Private GCS copy/upload missing.')
assert(workerSource.includes('source_prefix_not_allowed'), 'Approved source prefix guard missing.')
assert(workerSource.includes('controlled_sample_sha256_mismatch'), 'Controlled sample checksum guard missing.')
assert(workerSource.includes('publicOutput') && workerSource.includes('signedUrl'), 'Public/signed URL blocks missing.')
assert(workerSource.includes('boundedControlledAudioOnly'), 'Bounded controlled audio marker missing.')

for (const reportFile of SIGNALSMITH_CONTROLLED_EXPECTED_REPORT_FILES) {
  assert(reportFile.startsWith('phase_36j_'), `Unexpected Phase 36J report file: ${reportFile}`)
}

for (const forbiddenPath of [
  'server/activation/sam2',
  'server/activation/film',
  'server/activation/real-esrgan',
  'docker/prod/deepfilternet-runtime',
]) {
  assert(!moduleSource.includes(forbiddenPath), `Controlled Signalsmith module must not import/touch Track A or DeepFilterNet runtime path: ${forbiddenPath}`)
}

assert(existsSync('docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports/phase_36i_signalsmith_runtime_generated_fixture_report.json'), 'Phase 36I source evidence report missing.')
assert(existsSync('docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_deepfilternet_runtime_hardening_report.json'), 'Phase 36H source evidence report missing.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '36J',
  checkedReports: SIGNALSMITH_CONTROLLED_EXPECTED_REPORT_FILES.length,
  controlledSample: SIGNALSMITH_CONTROLLED_SAMPLE.sampleId,
  boundedControlledAudioOnly: true,
  arbitraryMedia: 'blocked',
  broadMedia: 'blocked',
  ocr: 'blocked',
  vlm: 'blocked',
  demucs: 'blocked',
  deepFilterNetRuntime: 'blocked',
  trackA: 'blocked',
}, null, 2))
