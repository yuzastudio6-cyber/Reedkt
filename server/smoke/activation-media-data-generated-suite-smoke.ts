import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MEDIA_DATA_GENERATED_EXPECTED_REPORT_FILES,
  MEDIA_DATA_GENERATED_FIXTURES,
  buildMediaDataGeneratedSuiteStaticReports,
  getMediaDataGeneratedSuitePlan,
} from '../activation/media-data-generated-suite'

const plan = getMediaDataGeneratedSuitePlan()
assert.equal(plan.phase, '46B')
assert.equal(plan.branch, 'codex/rp-activation-46b-generated-media-data-analysis-suite')
assert.equal(plan.baseIfPr123Open, 'codex/rp-activation-46a-media-data-tool-readiness-audit')
assert.equal(plan.packageLockPolicy, 'unchanged_temp_runtime_only')
assert.equal(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_MEDIA_DATA_GENERATED_FIXTURES'), true)
assert.equal(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_MEDIA_DATA_RUNTIME_EXECUTE'), true)
assert.equal(plan.executionConfirmations.includes('REEDITPRO_CONFIRM_MEDIA_DATA_PRIVATE_ARTIFACT_UPLOAD'), true)

const requiredFixtures = [
  'generated-image-opencv-basic',
  'generated-container-pyav-probe',
  'generated-scene-cut-pyscenedetect',
  'generated-thumbnail-sharp-libvips',
  'generated-report-duckdb',
  'generated-report-polars',
  'generated-cross-tool-manifest',
]
assert.deepEqual(MEDIA_DATA_GENERATED_FIXTURES.map((fixture) => fixture.fixtureId), requiredFixtures)
assert.equal(MEDIA_DATA_GENERATED_FIXTURES.every((fixture) => fixture.generatedOnly), true)

const reports = buildMediaDataGeneratedSuiteStaticReports()
assert.equal(reports.fixtureManifest.realMedia, 'blocked')
assert.equal(reports.fixtureManifest.arbitraryMediaInput, 'blocked')
assert.equal(reports.storagePrivacyReport.publicArtifacts, 'blocked')
assert.equal(reports.storagePrivacyReport.signedUrlsAsSourceOfTruth, 'blocked')
assert.equal(reports.suiteReport.mediaDataToolFamilyBetaStatus, 'blocked')
assert.equal(reports.suiteReport.privateArtifactStatus, 'not_run')
assert.equal(MEDIA_DATA_GENERATED_EXPECTED_REPORT_FILES.includes('phase_46b_cross_tool_manifest.json'), true)

for (const blocked of [
  'Phase 46C controlled real-video metadata/scene/frame suite until Phase 46B passes',
  'Phase 46D reporting/QA integration until reporting integration phase',
  'controlled real media',
  'broad user media',
  'arbitrary media paths',
  'VLM runtime retries',
  'OCR runtime',
  'provider calls',
  'production',
  'internal beta',
  'external beta',
  'public output',
  'Track A runtime/visual/render stack',
]) {
  assert.equal(plan.blockedScopes.includes(blocked), true, `${blocked} must remain blocked`)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:media-data-generated-suite:plan'], 'tsx server/cli/activation-media-data-generated-suite-plan.ts')
assert.equal(packageJson.scripts['activation:media-data-generated-suite'], 'tsx server/cli/activation-media-data-generated-suite.ts')
assert.equal(packageJson.scripts['activation:media-data-generated-suite:report'], 'tsx server/cli/activation-media-data-generated-suite-report.ts')
assert.equal(packageJson.scripts['activation:media-data-generated-suite:iam-plan'], 'tsx server/cli/activation-media-data-generated-suite-iam-plan.ts')
assert.equal(packageJson.scripts['activation:media-data-generated-suite:cost-summary'], 'tsx server/cli/activation-media-data-generated-suite-cost-summary.ts')
assert.equal(packageJson.scripts['activation:media-data-generated-suite:summary'], 'tsx server/cli/activation-media-data-generated-suite-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-media-data-generated-suite'], 'tsx server/smoke/activation-media-data-generated-suite-smoke.ts')

const source = readFileSync(new URL('../activation/media-data-generated-suite/index.ts', import.meta.url), 'utf8')
assert.equal(/from_pretrained|REEDITPRO_CONFIRM_VLM_RUNTIME_EXECUTE=true|REEDITPRO_CONFIRM_TRACK_A_RUNTIME=true|Cloud Run jobs execute|gcloud builds submit|add-iam-policy-binding/.test(source), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase46b_fixture_registry_generated_only',
    'phase46a_evidence_referenced',
    'execution_confirmations_required',
    'private_artifact_prefix_only',
    'real_media_arbitrary_media_vlm_ocr_provider_track_a_blocked',
    'media_data_beta_status_not_external_ready',
  ],
}))
