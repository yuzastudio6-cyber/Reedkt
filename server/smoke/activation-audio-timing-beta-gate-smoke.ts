import { existsSync, readFileSync } from 'node:fs'
import {
  AUDIO_TIMING_BETA_GATE_EXPECTED_REPORT_FILES,
  AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX,
  AUDIO_TIMING_BETA_GATE_REPORT_DIR,
  getAudioTimingBetaGatePlan,
} from '../activation/audio-timing-beta-gate'

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
const moduleSource = readFileSync('server/activation/audio-timing-beta-gate/index.ts', 'utf8')
const plan = getAudioTimingBetaGatePlan()

for (const script of [
  'activation:audio-timing-beta-gate:plan',
  'activation:audio-timing-beta-gate',
  'activation:audio-timing-beta-gate:report',
  'activation:audio-timing-beta-gate:iam-plan',
  'activation:audio-timing-beta-gate:cost-summary',
  'activation:audio-timing-beta-gate:summary',
  'smoke:activation-audio-timing-beta-gate',
]) {
  assert(packageJson.scripts?.[script], `Missing package script: ${script}`)
}

for (const sourcePath of [
  'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_deepfilternet_runtime_hardening_report.json',
  'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_deepfilternet_generated_audio_qa_report.json',
  'docs/activation-phase-36h-deepfilternet-runtime-hardening-controlled-speech-reports/phase_36h_controlled_deepfilternet_qa_report.json',
  'docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports/phase_36i_signalsmith_runtime_generated_fixture_report.json',
  'docs/activation-phase-36i-signalsmith-stretch-generated-fixture-reports/phase_36i_signalsmith_generated_audio_qa_report.json',
  'docs/activation-phase-36j-controlled-real-media-timing-stretch-sample-reports/phase_36j_controlled_real_media_timing_stretch_report.json',
  'docs/activation-phase-36j-controlled-real-media-timing-stretch-sample-reports/phase_36j_controlled_audio_extraction_report.json',
  'docs/activation-phase-36k-demucs-provenance-approval-retry-reports/phase_36k_demucs_provenance_decision.json',
]) {
  assert(existsSync(sourcePath), `Required Phase 36 evidence missing: ${sourcePath}`)
}

assert(plan.privateArtifactUploadPrefix === AUDIO_TIMING_BETA_GATE_PRIVATE_GCS_PREFIX, 'Phase 36M private prefix mismatch.')
assert(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE'), 'Beta gate confirmation missing.')
assert(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE_PRIVATE_ARTIFACT_READ'), 'Private read confirmation missing.')
assert(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_AUDIO_TIMING_BETA_GATE_PRIVATE_ARTIFACT_UPLOAD'), 'Private upload confirmation missing.')

for (const requiredPrefix of [
  'phase36h/deepfilternet-controlled-speech/phase36h-linux-deepfilternet-runtime-completion-20260603-r5',
  'phase36i/signalsmith-stretch-generated-audio/phase36i-signalsmith-stretch-generated-fixture-20260603',
  'phase36j/controlled-real-media-timing-stretch/phase36j-controlled-real-media-timing-stretch-20260603',
]) {
  assert(plan.allowedPrivateJsonReadPrefixes.some((prefix) => prefix.includes(requiredPrefix)), `Missing exact private read prefix: ${requiredPrefix}`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_DEMUCS_MODEL_DOWNLOAD',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
]) {
  assert((plan.forbiddenConfirmations as readonly string[]).includes(forbidden), `Forbidden confirmation is not blocked: ${forbidden}`)
}

assert(moduleSource.includes('BLOCKED_PAYLOAD_EXTENSIONS'), 'Audio/media/model payload rejection guard missing.')
assert(moduleSource.includes('json_metadata_only'), 'JSON-only private metadata policy missing.')
assert(moduleSource.includes('internally beta-ready candidate'), 'Internal beta-ready candidate decision status missing.')
assert(moduleSource.includes('Demucs is explicitly excluded'), 'Demucs exclusion policy missing.')
assert(moduleSource.includes("productWideBeta: 'blocked'"), 'Product-wide beta block missing.')
assert(moduleSource.includes('Track A runtime/visual/render stack'), 'Track A blocked scope missing.')
assert(moduleSource.includes('VLM runtime retries'), 'VLM runtime retry blocked scope missing.')
assert(moduleSource.includes('OCR runtime outside approved OCR phases'), 'OCR blocked scope missing.')
assert(!existsSync('server/workers/audio-timing-beta-gate'), 'Phase 36M must not add a runtime worker.')
assert(AUDIO_TIMING_BETA_GATE_REPORT_DIR.includes('phase-36m'), 'Phase 36M report dir mismatch.')

for (const reportFile of AUDIO_TIMING_BETA_GATE_EXPECTED_REPORT_FILES) {
  assert(reportFile.startsWith('phase_36m_'), `Unexpected Phase 36M report file: ${reportFile}`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: '36M',
  checkedReports: AUDIO_TIMING_BETA_GATE_EXPECTED_REPORT_FILES.length,
  audioProcessing: 'blocked',
  mediaProcessing: 'blocked',
  demucs: 'excluded_and_blocked',
  privateReadOptionalPreferred: true,
  privateUploadRequiresConfirmation: true,
  externalBeta: 'blocked',
}, null, 2))
