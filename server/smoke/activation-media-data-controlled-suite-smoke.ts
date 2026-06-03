import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MEDIA_DATA_CONTROLLED_EXPECTED_REPORT_FILES,
  MEDIA_DATA_CONTROLLED_SAMPLE,
  buildMediaDataControlledSuiteStaticReports,
  getMediaDataControlledSuitePlan,
} from '../activation/media-data-controlled-suite'

const plan = getMediaDataControlledSuitePlan()
assert.equal(plan.phase, '46C')
assert.equal(plan.branch, 'codex/rp-activation-46c-controlled-real-video-media-data-suite')
assert.equal(plan.baseIfPr125Open, 'codex/rp-activation-46b-generated-media-data-analysis-suite')
assert.equal(plan.packageLockPolicy, 'unchanged_temp_runtime_only')
assert.equal(plan.controlledOnly, true)
assert.equal(plan.selectedSample.sampleId, 'phase37d-phase32-color-export-safe-zone-window-v1')
assert.equal(plan.selectedSample.sourceGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(plan.selectedSample.sourceSha256, '78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa')
assert.deepEqual(plan.selectedSample.frameOffsetsSeconds, [6.9, 7.3, 7.7, 8.1, 8.5, 8.9])
assert.equal(MEDIA_DATA_CONTROLLED_SAMPLE.maxSampledFrames, 6)

for (const required of [
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_REAL_VIDEO',
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_MEDIA_READ',
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_FRAME_SAMPLING',
  'REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD',
]) {
  assert.equal(plan.executionConfirmations.includes(required), true, `${required} must gate Phase 46C execution`)
}

for (const forbidden of [
  'REEDITPRO_CONFIRM_BROAD_MEDIA_PROCESSING',
  'REEDITPRO_CONFIRM_ARBITRARY_MEDIA_INPUT',
  'REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE',
  'REEDITPRO_CONFIRM_TRACK_A_RUNTIME',
]) {
  assert.equal(plan.forbiddenConfirmations.includes(forbidden), true, `${forbidden} must be forbidden`)
}

const reports = buildMediaDataControlledSuiteStaticReports()
assert.equal(reports.sampleEvidence.arbitraryMediaInput, 'blocked')
assert.equal(reports.mediaResolverReport.publicMediaUrls, 'blocked')
assert.equal(reports.mediaResolverReport.signedUrlsAsSourceOfTruth, 'blocked')
assert.equal(reports.storagePrivacyReport.publicArtifacts, 'blocked')
assert.equal(reports.storagePrivacyReport.committedFramesOrThumbnails, 'blocked')
assert.equal(reports.suiteReport.mediaDataToolFamilyBetaStatus, 'blocked')
assert.equal(reports.suiteReport.privateArtifactStatus, 'not_run')
assert.equal(MEDIA_DATA_CONTROLLED_EXPECTED_REPORT_FILES.includes('phase_46c_cross_tool_manifest.json'), true)

for (const blocked of [
  'Phase 46D reporting/QA integration until Phase 46C passes',
  'VLM runtime retries',
  'OCR runtime',
  'provider calls',
  'production',
  'internal beta',
  'external beta',
  'public output',
  'broad user media',
  'arbitrary media paths',
  'Track A runtime/visual/render stack',
]) {
  assert.equal(plan.blockedScopes.includes(blocked), true, `${blocked} must remain blocked`)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:media-data-controlled-suite:plan'], 'tsx server/cli/activation-media-data-controlled-suite-plan.ts')
assert.equal(packageJson.scripts['activation:media-data-controlled-suite'], 'tsx server/cli/activation-media-data-controlled-suite.ts')
assert.equal(packageJson.scripts['activation:media-data-controlled-suite:report'], 'tsx server/cli/activation-media-data-controlled-suite-report.ts')
assert.equal(packageJson.scripts['activation:media-data-controlled-suite:iam-plan'], 'tsx server/cli/activation-media-data-controlled-suite-iam-plan.ts')
assert.equal(packageJson.scripts['activation:media-data-controlled-suite:cost-summary'], 'tsx server/cli/activation-media-data-controlled-suite-cost-summary.ts')
assert.equal(packageJson.scripts['activation:media-data-controlled-suite:summary'], 'tsx server/cli/activation-media-data-controlled-suite-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-media-data-controlled-suite'], 'tsx server/smoke/activation-media-data-controlled-suite-smoke.ts')

const source = readFileSync(new URL('../activation/media-data-controlled-suite/index.ts', import.meta.url), 'utf8')
assert.equal(/REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE=true|REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE=true|REEDITPRO_CONFIRM_TRACK_A_RUNTIME=true|gcloud builds submit|run jobs execute|add-iam-policy-binding/.test(source), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase46c_approved_sample_locked',
    'bounded_window_offsets_locked',
    'execution_confirmations_required',
    'broad_arbitrary_vlm_ocr_track_a_confirmations_forbidden',
    'private_artifact_prefix_only',
    'media_data_beta_status_not_external_ready',
  ],
}))
