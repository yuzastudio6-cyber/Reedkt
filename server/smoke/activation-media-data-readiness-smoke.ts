import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildMediaDataReadinessReports,
  getMediaDataReadinessPlan,
} from '../activation/media-data-readiness'

const plan = getMediaDataReadinessPlan()
assert.equal(plan.phase, '46A')
assert.equal(plan.defaultMode, 'report_only_non_mutating')
assert.equal(plan.branch, 'codex/rp-activation-46a-media-data-tool-readiness-audit')
assert.equal(plan.baseIfPr120Open, 'codex/rp-activation-39c-vlm-decision-gate-recovery-plan')
assert.equal(plan.mediaDataToolFamilyBetaStatus, 'phase-complete but tool-family incomplete')
assert.equal(plan.requiredConfirmationsForReportGeneration.includes('REEDITPRO_CONFIRM_MEDIA_DATA_READINESS_AUDIT'), true)
assert.equal(plan.requiredConfirmationsForReportGeneration.includes('REEDITPRO_CONFIRM_MEDIA_DATA_WEB_RESEARCH'), true)

const reports = buildMediaDataReadinessReports()
const expectedTools = ['opencv', 'pyav', 'pyscenedetect', 'sharp_libvips', 'duckdb', 'polars'] as const
assert.deepEqual(reports.toolRegistry.tools.map((tool) => tool.toolId).sort(), [...expectedTools].sort())
assert.equal(reports.sourceEvidence.evidence.length, expectedTools.length)
assert.equal(reports.licenseEvidence.evidence.length, expectedTools.length)
assert.equal(reports.dependencyRiskReport.risks.some((risk) => risk.toolId === 'pyav' && risk.risk.includes('FFmpeg')), true)
assert.equal(reports.dependencyRiskReport.risks.some((risk) => risk.toolId === 'sharp_libvips' && risk.risk.includes('libvips')), true)
assert.equal(reports.runtimeInventory.repoInventoryStatus, 'complete_static_inventory')
assert.equal(reports.runtimeLocationPlan.locations.length, expectedTools.length)
assert.equal(reports.storagePrivacyPolicy.publicArtifacts, 'blocked')
assert.equal(reports.storagePrivacyPolicy.signedUrlsAsSourceOfTruth, 'blocked')
assert.equal(reports.generatedFixtureHandoff.fixtures.includes('generated-image-opencv-basic'), true)
assert.equal(reports.controlledRealMediaHandoff.status, 'blocked_until_phase46b_passes')
assert.equal(reports.reportingQaHandoff.status, 'blocked_until_phase46b_46c_evidence_exists')
assert.equal(reports.betaStatusReport.mediaDataToolFamilyBetaStatus, 'phase-complete but tool-family incomplete')

for (const value of Object.values(reports.readinessReport.noExecution)) {
  assert.equal(value, 'not_run')
}

for (const blocked of [
  'Phase 46B generated media/data analysis suite until implemented',
  'Phase 46C controlled real-video media/data suite until Phase 46B passes',
  'Phase 46D reporting/QA integration until Phase 46B/46C evidence exists',
  'VLM runtime retries',
  'provider calls',
  'production',
  'internal beta',
  'external beta',
  'public output',
  'broad user media',
  'arbitrary media paths',
  'real media processing',
  'Docker execution',
  'GCP mutation',
  'Track A runtime/visual/render stack',
]) {
  assert.equal(reports.blockerReport.blockedScopes.includes(blocked), true, `${blocked} must remain blocked`)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:media-data-readiness:plan'], 'tsx server/cli/activation-media-data-readiness-plan.ts')
assert.equal(packageJson.scripts['activation:media-data-readiness'], 'tsx server/cli/activation-media-data-readiness.ts')
assert.equal(packageJson.scripts['activation:media-data-readiness:report'], 'tsx server/cli/activation-media-data-readiness-report.ts')
assert.equal(packageJson.scripts['activation:media-data-readiness:iam-plan'], 'tsx server/cli/activation-media-data-readiness-iam-plan.ts')
assert.equal(packageJson.scripts['activation:media-data-readiness:cost-summary'], 'tsx server/cli/activation-media-data-readiness-cost-summary.ts')
assert.equal(packageJson.scripts['activation:media-data-readiness:summary'], 'tsx server/cli/activation-media-data-readiness-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-media-data-readiness'], 'tsx server/smoke/activation-media-data-readiness-smoke.ts')

const source = readFileSync(new URL('../activation/media-data-readiness/index.ts', import.meta.url), 'utf8')
assert.equal(/docker build|gcloud |Cloud Run jobs execute|add-iam-policy-binding|from_pretrained|VideoCapture|imread|imwrite|sharp\(|import cv2|import av|import scenedetect/.test(source), false)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase46a_tools_registered',
    'source_license_evidence_present',
    'dependency_caveats_present',
    'storage_privacy_policy_present',
    'phase46b_46c_46d_handoffs_present',
    'no_media_processing_runtime_cloud_vlm_track_a_actions',
    'media_data_beta_status_phase_complete_tool_family_incomplete',
  ],
}))
