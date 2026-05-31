import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  buildFinalRenderHardeningCommandPlans,
  buildFinalRenderHardeningIamPlan,
  buildFinalRenderHardeningReport,
  finalRenderHardeningConfig,
  finalRenderHardeningQaGateIds,
  validateFinalRenderHardeningExecutionEnv,
} from '../activation/final-render-hardening'

const report = buildFinalRenderHardeningReport()
const iam = buildFinalRenderHardeningIamPlan()
const commandPlans = buildFinalRenderHardeningCommandPlans()

assert.equal(finalRenderHardeningConfig.phase, '45D')
assert.equal(finalRenderHardeningConfig.track, 'A visual/video')
assert.equal(finalRenderHardeningConfig.runtimeMode, 'ffmpeg_final_render_hardening')
assert.equal(finalRenderHardeningConfig.approvedInputVideoGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(finalRenderHardeningConfig.approvedPhase45ARunId, 'phase45a-20260531T19033')
assert.equal(finalRenderHardeningConfig.approvedPhase45BRunId, 'phase45b-20260531T19552')
assert.equal(finalRenderHardeningConfig.approvedPhase45CRunId, 'phase45c-20260531T20404')
assert.equal(finalRenderHardeningConfig.approvedPhase45BPreviewGcsUri, 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4')
assert.equal(finalRenderHardeningConfig.approvedPhase45COtioGcsUri, 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json')
assert.equal(finalRenderHardeningConfig.exportDurationSeconds <= finalRenderHardeningConfig.maxExportDurationSeconds, true)
assert.equal(finalRenderHardeningConfig.runtimeTargetImage.includes('staging-final-render-hardening-001'), true)
assert.equal(finalRenderHardeningConfig.runtimeJobName, 'reeditpro-staging-final-render-hardening-job')
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.privateReviewOnly, true)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.trackBAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)

assert.equal(validateFinalRenderHardeningExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'false',
  runtimeMode: finalRenderHardeningConfig.runtimeMode,
  sourceVideo: finalRenderHardeningConfig.approvedInputVideoGcsUri,
  phase45APreview: finalRenderHardeningConfig.approvedPhase45APreviewGcsUri,
  phase45AReport: finalRenderHardeningConfig.approvedPhase45AReportGcsUri,
  phase45BPreview: finalRenderHardeningConfig.approvedPhase45BPreviewGcsUri,
  phase45BReport: finalRenderHardeningConfig.approvedPhase45BReportGcsUri,
  phase45COtio: finalRenderHardeningConfig.approvedPhase45COtioGcsUri,
  phase45CReport: finalRenderHardeningConfig.approvedPhase45CReportGcsUri,
  exportDurationSeconds: finalRenderHardeningConfig.exportDurationSeconds,
}).allowed, false)

assert.ok(iam.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iam.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/.test(binding.commandString)))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45d-source-read'))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45d-review-export-create'))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45d-qa-create'))
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(JSON.stringify(commandPlans).includes('REEDITPRO_CONFIRM_FFMPEG_FINAL_RENDER_HARDENING=true'))
assert.ok(JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=false'))
assert.ok(!JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('REVIDEO_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('TRACK_B_TOOLS_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('FINAL_DELIVERY_ENABLED=true'))

assert.deepEqual(finalRenderHardeningQaGateIds, [
  'source_integrity',
  'phase45a_evidence',
  'phase45b_evidence',
  'phase45c_evidence',
  'ffmpeg_export_invoked',
  'ffprobe_export_validation',
  'codec_container_integrity',
  'duration_bounds',
  'audio_video_integrity',
  'private_artifacts',
  'no_public_access',
  'no_final_delivery',
  'blocked_features',
])

if (report.executionReport) {
  const gateIds = new Set(report.executionReport.qa.gates.map((gate) => gate.gateId))
  for (const gate of finalRenderHardeningQaGateIds) assert.ok(gateIds.has(gate), `missing QA gate ${gate}`)
}

assert.ok(existsSync('server/cli/activation-final-render-hardening.ts'))
assert.ok(existsSync('server/cli/activation-final-render-hardening-report.ts'))
assert.ok(existsSync('server/cli/activation-final-render-hardening-iam-plan.ts'))
assert.ok(existsSync('src/backend/staging-final-render-hardening-worker/staging-final-render-hardening-worker-cli.ts'))
assert.ok(existsSync('docker/prod/final-render-hardening/Dockerfile'))
assert.ok(existsSync('vite.staging-final-render-hardening-worker.config.ts'))
assert.ok(existsSync('docs/activation-final-render-hardening-runbook.md'))
assert.ok(existsSync('docs/activation-final-render-hardening-policy.md'))
assert.ok(existsSync('docs/activation-final-render-hardening-artifact-policy.md'))
assert.ok(existsSync('docs/activation-final-render-hardening-qa-policy.md'))
assert.ok(existsSync('docs/activation-phase-45d-ffmpeg-ffprobe-final-render-hardening-results.md'))

const scripts = JSON.parse(await readFile('package.json', 'utf8')).scripts as Record<string, string>
assert.equal(scripts['build:staging-final-render-hardening-worker'], 'npm run typecheck:server && vite build --config vite.staging-final-render-hardening-worker.config.ts')
assert.equal(scripts['activation:final-render-hardening'], 'tsx server/cli/activation-final-render-hardening.ts')
assert.equal(scripts['activation:final-render-hardening:report'], 'tsx server/cli/activation-final-render-hardening-report.ts')
assert.equal(scripts['activation:final-render-hardening:iam-plan'], 'tsx server/cli/activation-final-render-hardening-iam-plan.ts')
assert.equal(scripts['smoke:activation-final-render-hardening'], 'tsx server/smoke/activation-final-render-hardening-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_phase32_phase45a_phase45b_phase45c_locks',
    'ffmpeg_ffprobe_private_review_scope',
    'confirmation_gate',
    'private_artifact_prefixes',
    'qa_gate_contract',
    'blocked_features',
    'package_scripts',
  ],
}))
