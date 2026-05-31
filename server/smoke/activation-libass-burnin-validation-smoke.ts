import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildLibassBurninCommandPlans,
  buildLibassBurninIamPlan,
  buildLibassBurninReport,
  libassBurninValidationConfig,
  validateLibassBurninExecutionEnv,
} from '../activation/libass-burnin-validation'

const report = buildLibassBurninReport()
assert.equal(libassBurninValidationConfig.phase, '45A')
assert.equal(libassBurninValidationConfig.approvedInputVideoGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4')
assert.equal(libassBurninValidationConfig.approvedCaptionAssGcsUri, 'gs://reeditpro-staging-reeditpro-transcripts/activation-real-video/phase28/phase28-20260528T01552/captions/captions.ass')
assert.equal(libassBurninValidationConfig.approvedCaptionSha256, 'a103dd9a1252c48de27d1b4daf4e87180786bbdb781426fcc2888718cf8bc6de')
assert.equal(libassBurninValidationConfig.previewDurationSeconds <= libassBurninValidationConfig.maxPreviewDurationSeconds, true)
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.trackBAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)

const validation = validateLibassBurninExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'false',
  runtimeMode: libassBurninValidationConfig.runtimeMode,
  sourceVideo: libassBurninValidationConfig.approvedInputVideoGcsUri,
  captionSource: libassBurninValidationConfig.approvedCaptionAssGcsUri,
  previewDurationSeconds: libassBurninValidationConfig.previewDurationSeconds,
})
assert.equal(validation.allowed, false)
assert.ok(validation.blockers.some((blocker) => blocker.includes('REEDITPRO_CONFIRM_LIBASS_BURNIN_VALIDATION')))

const plans = buildLibassBurninCommandPlans()
assert.ok(plans.some((plan) => plan.commandId === 'build-push-image'))
assert.ok(plans.some((plan) => plan.commandString.includes('staging-libass-burnin-validation-001')))
for (const plan of plans) {
  assert.equal(plan.textOnlyByDefault, true)
  assert.doesNotMatch(plan.commandString, /PROVIDER_EXECUTION_ENABLED=true|REVIDEO_ENABLED=true|FINAL_DELIVERY_ENABLED=true|REEDITPRO_PRODUCTION_READY=true/)
}

const iam = buildLibassBurninIamPlan()
assert.ok(iam.some((binding) => binding.bucket === 'reeditpro-staging-reeditpro-transcripts' && binding.role === 'roles/storage.objectViewer'))
assert.ok(iam.some((binding) => binding.bucket === 'reeditpro-staging-reeditpro-previews' && binding.role === 'roles/storage.objectCreator'))
assert.ok(iam.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iam.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/.test(binding.commandString)))

const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> }
for (const script of [
  'activation:libass-burnin-validation',
  'activation:libass-burnin-validation:report',
  'activation:libass-burnin-validation:iam-plan',
  'smoke:activation-libass-burnin-validation',
  'build:staging-libass-burnin-worker',
]) {
  assert.ok(packageJson.scripts[script], `${script} script must exist`)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'approved_source_and_caption_locks',
    'confirmation_gate',
    'bounded_preview_scope',
    'private_artifact_prefixes',
    'iam_conditions',
    'blocked_features',
    'package_scripts',
  ],
}))
