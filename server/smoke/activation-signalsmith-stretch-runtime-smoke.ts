import { existsSync, readFileSync } from 'node:fs'
import {
  SIGNALSMITH_PRIVATE_GCS_PREFIX,
  SIGNALSMITH_RUNTIME_EXPECTED_REPORT_FILES,
  SIGNALSMITH_RUNTIME_REPORT_DIR,
  getSignalsmithRuntimePlan,
} from '../activation/signalsmith-stretch-runtime'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const moduleSource = readFileSync('server/activation/signalsmith-stretch-runtime/index.ts', 'utf8')
const workerSource = readFileSync('server/workers/signalsmith-stretch-runtime/run_signalsmith_generated_suite.py', 'utf8')
const cppSource = readFileSync('server/workers/signalsmith-stretch-runtime/signalsmith_fixture_main.cpp', 'utf8')
const plan = getSignalsmithRuntimePlan()

for (const script of [
  'activation:signalsmith-stretch-runtime:plan',
  'activation:signalsmith-stretch-runtime',
  'activation:signalsmith-stretch-runtime:report',
  'activation:signalsmith-stretch-runtime:iam-plan',
  'activation:signalsmith-stretch-runtime:cost-summary',
  'activation:signalsmith-stretch-runtime:summary',
  'smoke:activation-signalsmith-stretch-runtime',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

assert(plan.sourceEvidence.selectedTag === '1.1.0', 'Signalsmith selected tag must be pinned.')
assert(plan.sourceEvidence.selectedCommit === '44c8f865af9da8c29cc4a70a2d5a3ec83639c711', 'Signalsmith selected commit changed.')
assert(plan.sourceEvidence.upstreamMainHeadForReferenceOnly === '57b93f4e9206a089a45387eaa39bdc9f310d3308', 'Signalsmith upstream-current evidence changed.')
assert(plan.privateArtifactPrefix === SIGNALSMITH_PRIVATE_GCS_PREFIX, 'Private artifact prefix mismatch.')
assert(SIGNALSMITH_RUNTIME_REPORT_DIR.includes('phase-36i'), 'Phase 36I report directory mismatch.')
assert(plan.generatedFixtures.length === 3, 'Required generated fixtures missing.')
assert(plan.generatedFixtures.every((fixture) => fixture.sampleRate === 48000 && fixture.channels === 1), 'Generated fixtures must be 48 kHz mono.')
assert(plan.generatedFixtures.some((fixture) => fixture.fixtureId === 'generated-stretch-sine-noise-125' && fixture.stretchRatio === 1.25), '1.25x sine/noise fixture missing.')
assert(plan.generatedFixtures.some((fixture) => fixture.fixtureId === 'generated-stretch-chirp-075' && fixture.stretchRatio === 0.75), '0.75x chirp fixture missing.')
assert(plan.generatedFixtures.some((fixture) => fixture.fixtureId === 'generated-stretch-click-track-150' && fixture.stretchRatio === 1.5), '1.5x click stress fixture missing.')

for (const required of [
  'REEDITPRO_CONFIRM_SIGNALSMITH_APPROVAL',
  'REEDITPRO_CONFIRM_SIGNALSMITH_SOURCE_FETCH',
  'REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_BUILD',
  'REEDITPRO_CONFIRM_SIGNALSMITH_GENERATED_AUDIO',
  'REEDITPRO_CONFIRM_SIGNALSMITH_PRIVATE_ARTIFACT_UPLOAD',
]) {
  assert(plan.executionConfirmations.includes(required), `Missing execution confirmation: ${required}`)
  assert(workerSource.includes(required), `Worker missing execution confirmation: ${required}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_REAL_AUDIO',
  'REEDITPRO_CONFIRM_SIGNALSMITH_CONTROLLED_MEDIA_READ',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]) {
  assert(plan.forbiddenConfirmations.includes(forbidden), `Forbidden confirmation is not blocked: ${forbidden}`)
  assert(workerSource.includes(forbidden), `Worker must block forbidden confirmation: ${forbidden}`)
}

assert(moduleSource.includes('temp_fetch_exact_tag_no_vendoring'), 'Temp source fetch policy missing.')
assert(moduleSource.includes('signalsmith_exact_source_fetch_or_verification_incomplete'), 'Source fetch blocker missing.')
assert(moduleSource.includes('phase-complete but tool-family incomplete'), 'Phase-complete audio/timing status missing.')
assert(moduleSource.includes('externally') === false, 'Unexpected external beta wording in module.')
assert(moduleSource.includes('Track A runtime/visual/render stack'), 'Track A blocked scope missing.')
assert(moduleSource.includes('Demucs until provenance/legal approval'), 'Demucs blocker missing.')
assert(moduleSource.includes('controlled real media'), 'Controlled media blocked scope missing.')
assert(workerSource.includes('"git", "clone"') && workerSource.includes('--recurse-submodules'), 'Exact source fetch with submodules missing.')
assert(workerSource.includes('signalsmith_selected_commit_mismatch'), 'Selected commit guard missing.')
assert(workerSource.includes('generatedAudioOnly'), 'Generated-only QA marker missing.')
assert(workerSource.includes('realMedia') && workerSource.includes('controlledMedia'), 'Real/controlled media blocks missing.')
assert(workerSource.includes('gcloud') && workerSource.includes('storage') && workerSource.includes('cp'), 'Private artifact upload path missing.')
assert(cppSource.includes('SignalsmithStretch<float>'), 'C++ runner must use SignalsmithStretch<float>.')
assert(cppSource.includes('presetDefault'), 'C++ runner must configure Signalsmith preset.')
assert(cppSource.includes('process(inputBuffers'), 'C++ runner must call Signalsmith process.')

for (const reportFile of SIGNALSMITH_RUNTIME_EXPECTED_REPORT_FILES) {
  assert(reportFile.startsWith('phase_36i_'), `Unexpected Phase 36I report file: ${reportFile}`)
}

for (const forbiddenPath of [
  'server/activation/sam2',
  'server/activation/film',
  'server/activation/real-esrgan',
  'docker/prod/deepfilternet-runtime/Dockerfile.phase36h',
]) {
  assert(!moduleSource.includes(forbiddenPath), `Signalsmith module must not import/touch Track A or DeepFilterNet runtime path: ${forbiddenPath}`)
}

assert(existsSync('docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_deepfilternet_runtime_hardening_report.json'), 'Phase 36H source evidence report missing.')

console.log(JSON.stringify({
  status: 'passed',
  phase: '36I',
  checkedReports: SIGNALSMITH_RUNTIME_EXPECTED_REPORT_FILES.length,
  generatedAudioOnly: true,
  controlledMedia: 'blocked',
  realMedia: 'blocked',
  demucs: 'blocked',
  deepFilterNetRuntime: 'blocked',
  trackA: 'blocked',
}, null, 2))
