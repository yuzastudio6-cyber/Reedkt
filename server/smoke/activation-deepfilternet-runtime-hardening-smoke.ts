import { existsSync, readFileSync } from 'node:fs'
import {
  DEEPFILTERNET_RUNTIME_HARDENING_EXPECTED_REPORT_FILES,
  DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX,
  DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR,
  getDeepFilterNetRuntimeHardeningPlan,
} from '../activation/deepfilternet-runtime-hardening'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const moduleSource = readFileSync('server/activation/deepfilternet-runtime-hardening/index.ts', 'utf8')
const workerSource = readFileSync('server/workers/deepfilternet-runtime-hardening/run_deepfilternet_runtime_hardening.py', 'utf8')
const plan = getDeepFilterNetRuntimeHardeningPlan()

for (const script of [
  'activation:deepfilternet-runtime-hardening:plan',
  'activation:deepfilternet-runtime-hardening',
  'activation:deepfilternet-runtime-hardening:report',
  'activation:deepfilternet-runtime-hardening:iam-plan',
  'activation:deepfilternet-runtime-hardening:cost-summary',
  'activation:deepfilternet-runtime-hardening:summary',
  'smoke:activation-deepfilternet-runtime-hardening',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const preservedScript of [
  'activation:deepfilternet-runtime',
  'activation:deepfilternet-runtime:report',
  'activation:deepfilternet-runtime:iam-plan',
  'smoke:activation-deepfilternet-runtime',
]) {
  assert(packageJson.scripts?.[preservedScript], `Historical Phase 36C script must remain: ${preservedScript}`)
}

for (const sourcePath of [
  'docs/activation-phase-36g-audio-stack-demucs-results.md',
  'docs/activation-phase-36c-deepfilternet-runtime-verification-results.md',
  'docs/activation-phase-36d-real-video-deepfilternet-audio-cleanup-results.md',
  'docs/activation-phase-46c-controlled-real-video-media-data-suite-reports/phase_46c_controlled_sample_evidence.json',
  'server/workers/deepfilternet-runtime-hardening/run_deepfilternet_runtime_hardening.py',
]) {
  assert(existsSync(sourcePath), `Required Phase 36H evidence/source missing: ${sourcePath}`)
}

assert(plan.privateArtifactPrefix === DEEPFILTERNET_RUNTIME_HARDENING_PRIVATE_GCS_PREFIX, 'Private artifact prefix mismatch.')
assert(DEEPFILTERNET_RUNTIME_HARDENING_REPORT_DIR.includes('phase-36h'), 'Phase 36H report dir mismatch.')
assert(plan.approvedRuntimeArtifacts.cliFile === 'deep-filter-0.5.6-x86_64-unknown-linux-musl', 'Approved DeepFilterNet CLI changed.')
assert(plan.approvedRuntimeArtifacts.modelArchive === 'DeepFilterNet3_onnx.tar.gz', 'Approved DeepFilterNet model archive changed.')
assert(plan.approvedRuntimeArtifacts.aggregateSha256 === 'eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b', 'Aggregate checksum changed.')
assert(plan.controlledSample.sampleId === 'phase37d-phase32-color-export-safe-zone-window-v1', 'Controlled sample id changed.')
assert(plan.controlledSample.windowStartSeconds === 6.9, 'Controlled window start changed.')
assert(plan.controlledSample.windowEndSeconds === 8.9, 'Controlled window end changed.')

for (const required of [
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_GENERATED_AUDIO',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_REAL_AUDIO',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_CONTROLLED_MEDIA_READ',
  'REEDITPRO_CONFIRM_DEEPFILTERNET_PRIVATE_ARTIFACT_UPLOAD',
]) {
  assert(plan.executionConfirmations.includes(required), `Missing execution confirmation: ${required}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_SIGNALSMITH_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]) {
  assert(plan.forbiddenConfirmations.includes(forbidden), `Forbidden confirmation is not blocked: ${forbidden}`)
}

assert(moduleSource.includes('approved_deepfilternet_binary_platform_incompatible'), 'Approved binary platform guard missing.')
assert(workerSource.includes('controlled_audio_window_not_speech_suitable'), 'Controlled speech suitability blocker missing.')
assert(moduleSource.includes('DeepFilterNet3_onnx.tar.gz'), 'Model archive guard missing.')
assert(moduleSource.includes('phase-complete but tool-family incomplete'), 'Phase-complete beta status missing.')
assert(moduleSource.includes('Demucs until provenance/legal approval'), 'Demucs blocked scope missing.')
assert(moduleSource.includes('Signalsmith Stretch until implemented'), 'Signalsmith blocked scope missing.')
assert(moduleSource.includes('Track A runtime/visual/render stack'), 'Track A blocked scope missing.')
assert(workerSource.includes('generated_fixture'), 'Generated fixture worker path missing.')
assert(workerSource.includes('extract_controlled_audio'), 'Controlled extraction worker path missing.')
assert(workerSource.includes('def metrics'), 'Audio metrics worker path missing.')

for (const reportFile of DEEPFILTERNET_RUNTIME_HARDENING_EXPECTED_REPORT_FILES) {
  assert(reportFile.startsWith('phase_36h_'), `Unexpected Phase 36H report file: ${reportFile}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: '36H',
  checkedReports: DEEPFILTERNET_RUNTIME_HARDENING_EXPECTED_REPORT_FILES.length,
  runtimeArtifactPath: 'approved_private_v0.5.6_only',
  generatedAudio: 'guarded',
  controlledRealAudio: 'single_bounded_sample_only',
  demucs: 'blocked',
  signalsmith: 'blocked',
  trackA: 'blocked',
}, null, 2))
