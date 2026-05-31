import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { buildRemotionRenderCommandPlans, buildRemotionRenderIamPlan, buildRemotionRenderValidationReport, remotionRenderValidationConfig, validateRemotionRenderExecutionEnv } from '../activation/remotion-render-validation'

const report = buildRemotionRenderValidationReport()
const iam = buildRemotionRenderIamPlan()
const commandPlans = buildRemotionRenderCommandPlans()

assert.equal(remotionRenderValidationConfig.phase, '45B')
assert.equal(remotionRenderValidationConfig.approvedInputVideoGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(remotionRenderValidationConfig.approvedPhase45ARunId, 'phase45a-20260531T19033')
assert.equal(remotionRenderValidationConfig.approvedPhase45APreviewGcsUri, 'gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4')
assert.equal(remotionRenderValidationConfig.previewDurationSeconds <= 5, true)
assert.equal(remotionRenderValidationConfig.runtimeJobName, 'reeditpro-staging-remotion-render-validation-job')
assert.equal(remotionRenderValidationConfig.computeMode, 'cpu')
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.trackBAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(validateRemotionRenderExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'false',
  runtimeMode: remotionRenderValidationConfig.runtimeMode,
  sourceVideo: remotionRenderValidationConfig.approvedInputVideoGcsUri,
  phase45APreview: remotionRenderValidationConfig.approvedPhase45APreviewGcsUri,
  phase45AReport: remotionRenderValidationConfig.approvedPhase45AReportGcsUri,
  previewDurationSeconds: remotionRenderValidationConfig.previewDurationSeconds,
}).allowed, false)
assert.ok(iam.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iam.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/.test(binding.commandString)))
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(!JSON.stringify(commandPlans).includes('revideo'))
assert.ok(JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=false'))
assert.ok(!JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=true'))
assert.ok(existsSync('server/cli/activation-remotion-render-validation.ts'))
assert.ok(existsSync('server/cli/activation-remotion-render-validation-report.ts'))
assert.ok(existsSync('server/cli/activation-remotion-render-validation-iam-plan.ts'))

const scripts = JSON.parse(await import('node:fs/promises').then((fs) => fs.readFile('package.json', 'utf8'))).scripts as Record<string, string>
assert.ok(scripts['activation:remotion-render-validation'])
assert.ok(scripts['activation:remotion-render-validation:report'])
assert.ok(scripts['activation:remotion-render-validation:iam-plan'])
assert.ok(scripts['smoke:activation-remotion-render-validation'])
assert.ok(scripts['build:staging-remotion-render-validation-worker'])

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_source_and_phase45a_locks',
    'confirmation_gate',
    'bounded_preview_scope',
    'private_artifact_prefixes',
    'iam_conditions',
    'blocked_features',
    'package_scripts',
  ],
}))
