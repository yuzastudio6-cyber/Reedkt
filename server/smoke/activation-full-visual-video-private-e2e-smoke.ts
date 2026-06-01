import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  buildFullVisualVideoPrivateE2eCommandPlans,
  buildFullVisualVideoPrivateE2eIamPlan,
  buildFullVisualVideoPrivateE2eReport,
  fullVisualVideoPrivateE2eConfig,
  fullVisualVideoPrivateE2eQaGateIds,
  validateFullVisualVideoPrivateE2eExecutionEnv,
} from '../activation/full-visual-video-private-e2e'

const report = buildFullVisualVideoPrivateE2eReport()
const iam = buildFullVisualVideoPrivateE2eIamPlan()
const commandPlans = buildFullVisualVideoPrivateE2eCommandPlans()

assert.equal(fullVisualVideoPrivateE2eConfig.phase, '45E')
assert.equal(fullVisualVideoPrivateE2eConfig.track, 'A visual/video')
assert.equal(fullVisualVideoPrivateE2eConfig.runtimeMode, 'full_visual_video_private_e2e')
assert.equal(fullVisualVideoPrivateE2eConfig.approvedInputVideoGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(fullVisualVideoPrivateE2eConfig.approvedPhase45ARunId, 'phase45a-20260531T19033')
assert.equal(fullVisualVideoPrivateE2eConfig.approvedPhase45APreviewGcsUri, 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4')
assert.equal(fullVisualVideoPrivateE2eConfig.approvedPhase45BRunId, 'phase45b-20260531T19552')
assert.equal(fullVisualVideoPrivateE2eConfig.approvedPhase45BPreviewGcsUri, 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4')
assert.equal(fullVisualVideoPrivateE2eConfig.approvedPhase45CRunId, 'phase45c-20260531T20404')
assert.equal(fullVisualVideoPrivateE2eConfig.approvedPhase45COtioGcsUri, 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json')
assert.equal(fullVisualVideoPrivateE2eConfig.approvedPhase45DRunId, 'phase45d-20260531T22235')
assert.equal(fullVisualVideoPrivateE2eConfig.approvedPhase45DReviewExportGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4')
assert.equal(fullVisualVideoPrivateE2eConfig.maxReviewDurationSeconds <= 6, true)
assert.equal(fullVisualVideoPrivateE2eConfig.maxWidth <= 768, true)
assert.equal(fullVisualVideoPrivateE2eConfig.maxHeight <= 768, true)
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.privateReviewOnly, true)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.trackBAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)

assert.equal(validateFullVisualVideoPrivateE2eExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'false',
  runtimeMode: fullVisualVideoPrivateE2eConfig.runtimeMode,
  sourceVideo: fullVisualVideoPrivateE2eConfig.approvedInputVideoGcsUri,
  phase45APreview: fullVisualVideoPrivateE2eConfig.approvedPhase45APreviewGcsUri,
  phase45AReport: fullVisualVideoPrivateE2eConfig.approvedPhase45AReportGcsUri,
  phase45BPreview: fullVisualVideoPrivateE2eConfig.approvedPhase45BPreviewGcsUri,
  phase45BReport: fullVisualVideoPrivateE2eConfig.approvedPhase45BReportGcsUri,
  phase45COtio: fullVisualVideoPrivateE2eConfig.approvedPhase45COtioGcsUri,
  phase45CReport: fullVisualVideoPrivateE2eConfig.approvedPhase45CReportGcsUri,
  phase45DReviewExport: fullVisualVideoPrivateE2eConfig.approvedPhase45DReviewExportGcsUri,
  phase45DFfprobeValidation: fullVisualVideoPrivateE2eConfig.approvedPhase45DFfprobeValidationGcsUri,
  phase45DReport: fullVisualVideoPrivateE2eConfig.approvedPhase45DReportGcsUri,
}).allowed, false)

assert.ok(iam.every((binding) => binding.reportOnly))
assert.ok(iam.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iam.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/.test(binding.commandString)))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45e-source-and-review-read'))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45e-render-preview-read'))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45e-otio-read'))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45e-qa-read'))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45e-qa-create'))
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(JSON.stringify(commandPlans).includes('REEDITPRO_CONFIRM_FULL_VISUAL_VIDEO_PRIVATE_E2E=true'))
assert.ok(JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=false'))
assert.ok(!JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('REVIDEO_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('TRACK_B_TOOLS_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('FINAL_DELIVERY_ENABLED=true'))

assert.deepEqual(fullVisualVideoPrivateE2eQaGateIds, [
  'source_integrity',
  'phase45a_libass_evidence',
  'phase45b_remotion_evidence',
  'phase45c_otio_evidence',
  'phase45d_ffmpeg_ffprobe_evidence',
  'private_review_export_integrity',
  'ffprobe_review_export_validation',
  'evidence_manifest_created',
  'artifact_privacy',
  'no_public_access',
  'no_final_delivery',
  'blocked_features',
])

if (report.executionReport) {
  const gateIds = new Set(report.executionReport.qa.gates.map((gate) => gate.gateId))
  for (const gate of fullVisualVideoPrivateE2eQaGateIds) assert.ok(gateIds.has(gate), `missing QA gate ${gate}`)
}

assert.ok(existsSync('server/cli/activation-full-visual-video-private-e2e.ts'))
assert.ok(existsSync('server/cli/activation-full-visual-video-private-e2e-report.ts'))
assert.ok(existsSync('server/cli/activation-full-visual-video-private-e2e-iam-plan.ts'))
assert.ok(existsSync('docs/activation-full-visual-video-private-e2e-runbook.md'))
assert.ok(existsSync('docs/activation-full-visual-video-private-e2e-policy.md'))
assert.ok(existsSync('docs/activation-full-visual-video-private-e2e-artifact-policy.md'))
assert.ok(existsSync('docs/activation-full-visual-video-private-e2e-qa-policy.md'))
assert.ok(existsSync('docs/activation-phase-45e-full-visual-video-private-e2e-results.md'))

const scripts = JSON.parse(await readFile('package.json', 'utf8')).scripts as Record<string, string>
assert.equal(scripts['activation:full-visual-video-private-e2e'], 'tsx server/cli/activation-full-visual-video-private-e2e.ts')
assert.equal(scripts['activation:full-visual-video-private-e2e:report'], 'tsx server/cli/activation-full-visual-video-private-e2e-report.ts')
assert.equal(scripts['activation:full-visual-video-private-e2e:iam-plan'], 'tsx server/cli/activation-full-visual-video-private-e2e-iam-plan.ts')
assert.equal(scripts['smoke:activation-full-visual-video-private-e2e'], 'tsx server/smoke/activation-full-visual-video-private-e2e-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_phase32_phase45a_phase45b_phase45c_phase45d_locks',
    'private_e2e_evidence_package_scope',
    'confirmation_gate',
    'private_artifact_prefixes',
    'qa_gate_contract',
    'blocked_features',
    'package_scripts',
  ],
}))
