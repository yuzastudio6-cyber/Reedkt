import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  buildOpenTimelineIoCommandPlans,
  buildOpenTimelineIoIamPlan,
  buildOpenTimelineIoValidationReport,
  openTimelineIoQaGateIds,
  openTimelineIoValidationConfig,
  validateOpenTimelineIoExecutionEnv,
} from '../activation/opentimelineio-validation'

const report = buildOpenTimelineIoValidationReport()
const iam = buildOpenTimelineIoIamPlan()
const commandPlans = buildOpenTimelineIoCommandPlans()

assert.equal(openTimelineIoValidationConfig.phase, '45C')
assert.equal(openTimelineIoValidationConfig.track, 'A visual/video')
assert.equal(openTimelineIoValidationConfig.runtimeMode, 'opentimelineio_timeline_validation')
assert.equal(openTimelineIoValidationConfig.approvedInputVideoGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(openTimelineIoValidationConfig.approvedPhase45ARunId, 'phase45a-20260531T19033')
assert.equal(openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri, 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4')
assert.equal(openTimelineIoValidationConfig.approvedPhase45BRunId, 'phase45b-20260531T19552')
assert.equal(openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri, 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4')
assert.equal(openTimelineIoValidationConfig.timelineDurationSeconds <= openTimelineIoValidationConfig.maxTimelineDurationSeconds, true)
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.trackBAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(validateOpenTimelineIoExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'false',
  runtimeMode: openTimelineIoValidationConfig.runtimeMode,
  sourceVideo: openTimelineIoValidationConfig.approvedInputVideoGcsUri,
  phase45APreview: openTimelineIoValidationConfig.approvedPhase45APreviewGcsUri,
  phase45AReport: openTimelineIoValidationConfig.approvedPhase45AReportGcsUri,
  phase45BPreview: openTimelineIoValidationConfig.approvedPhase45BPreviewGcsUri,
  phase45BReport: openTimelineIoValidationConfig.approvedPhase45BReportGcsUri,
  timelineDurationSeconds: openTimelineIoValidationConfig.timelineDurationSeconds,
}).allowed, false)
assert.ok(iam.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iam.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/.test(binding.commandString)))
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=false'))
assert.ok(!JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('REVIDEO_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('FINAL_DELIVERY_ENABLED=true'))

const requiredGates = openTimelineIoQaGateIds
assert.deepEqual(requiredGates, [
  'source_integrity',
  'phase45a_evidence',
  'phase45b_evidence',
  'otio_timeline_created_or_resolved',
  'otio_schema_valid',
  'timeline_duration_bounds',
  'clip_reference_integrity',
  'caption_render_reference_integrity',
  'no_public_artifacts',
  'no_final_delivery',
  'blocked_features',
])

if (report.executionReport) {
  const gateIds = new Set(report.executionReport.qa.gates.map((gate) => gate.gateId))
  for (const gate of requiredGates) assert.ok(gateIds.has(gate), `missing QA gate ${gate}`)
}

assert.ok(existsSync('server/cli/activation-opentimelineio-validation.ts'))
assert.ok(existsSync('server/cli/activation-opentimelineio-validation-report.ts'))
assert.ok(existsSync('server/cli/activation-opentimelineio-validation-iam-plan.ts'))
assert.ok(existsSync('docs/activation-opentimelineio-validation-runbook.md'))
assert.ok(existsSync('docs/activation-opentimelineio-validation-policy.md'))
assert.ok(existsSync('docs/activation-opentimelineio-validation-artifact-policy.md'))
assert.ok(existsSync('docs/activation-opentimelineio-validation-qa-policy.md'))
assert.ok(existsSync('docs/activation-phase-45c-opentimelineio-validation-results.md'))

const scripts = JSON.parse(await readFile('package.json', 'utf8')).scripts as Record<string, string>
assert.equal(scripts['activation:opentimelineio-validation'], 'tsx server/cli/activation-opentimelineio-validation.ts')
assert.equal(scripts['activation:opentimelineio-validation:report'], 'tsx server/cli/activation-opentimelineio-validation-report.ts')
assert.equal(scripts['activation:opentimelineio-validation:iam-plan'], 'tsx server/cli/activation-opentimelineio-validation-iam-plan.ts')
assert.equal(scripts['smoke:activation-opentimelineio-validation'], 'tsx server/smoke/activation-opentimelineio-validation-smoke.ts')

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_phase32_phase45a_phase45b_locks',
    'confirmation_gate',
    'otio_metadata_only_scope',
    'private_artifact_prefixes',
    'qa_gate_contract',
    'blocked_features',
    'package_scripts',
  ],
}))
