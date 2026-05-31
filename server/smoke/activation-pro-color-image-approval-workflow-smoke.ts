import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildProColorImageApprovalReport,
  proColorImageCommandPlans,
  proColorImageLicenseReviews,
  proColorImageRiskRegister,
  proColorImageToolEvidence,
  proColorImageToolScopeOwnership,
} from '../activation/pro-color-image-approval'

const report = buildProColorImageApprovalReport()

assert.equal(report.phase, '40A')
assert.equal(report.track, 'A visual/video')
assert.equal(report.status, 'approval_review_complete')
assert.equal(report.planningDecision, 'staging_planning_approved')
assert.equal(report.preferredBaseUnavailable, true)
assert.equal(report.baseBranch, 'origin/codex/rp-activation-38d-real-video-film-slowmotion-sample')

assert.deepEqual(proColorImageToolEvidence.map((tool) => tool.toolId), ['opencolorio', 'openimageio', 'kornia'])
for (const tool of proColorImageToolEvidence) {
  assert.equal(tool.noInstallPerformed, true)
  assert.equal(tool.noRuntimeExecuted, true)
  assert.equal(tool.noMediaProcessed, true)
  assert.ok(tool.upstreamRepo.startsWith('https://github.com/'))
  assert.ok(tool.sourceEvidence.some((evidence) => evidence.sourceType === 'readme'))
  assert.ok(tool.sourceEvidence.some((evidence) => evidence.sourceType === 'license'))
}

const licenseByTool = new Map(proColorImageLicenseReviews.map((review) => [review.toolId, review]))
assert.equal(licenseByTool.get('opencolorio')?.licenseName, 'BSD-3-Clause')
assert.equal(licenseByTool.get('openimageio')?.licenseName, 'Apache-2.0')
assert.equal(licenseByTool.get('kornia')?.licenseName, 'Apache-2.0')
for (const review of proColorImageLicenseReviews) {
  assert.equal(review.licenseIdentified, true)
  assert.equal(review.commercialUseAllowed, true)
  assert.equal(review.redistributionAllowed, true)
  assert.equal(review.runtimeUseAllowed, true)
  assert.equal(review.requiresHumanLegalReview, false)
  assert.equal(review.codexDecision, 'staging_planning_approved')
}

for (const riskId of [
  'license-provenance-records',
  'runtime-install-not-approved',
  'dependency-license-risk',
  'ocio-config-provenance',
  'lut-look-transform-risk',
  'oiio-format-metadata-risk',
  'kornia-model-provider-boundary',
  'color-shift-skin-tone-risk',
  'metadata-color-space-mismatch',
  'frame-sequence-mismatch',
  'generated-fixture-qa-missing',
  'real-video-qa-missing',
  'final-delivery-color-risk',
  'provider-public-output-risk',
  'revideo-path-risk',
  'broad-media-safety-risk',
]) {
  assert.ok(proColorImageRiskRegister.some((risk) => risk.riskId === riskId && risk.severity === 'blocker'), `${riskId} blocker risk must exist.`)
}

assert.deepEqual(report.futureScope.phaseSequence.map((phase) => phase.phase), ['40B', '40C', '40D'])
assert.equal(proColorImageToolScopeOwnership.find((scope) => scope.ownerTool === 'opencolorio')?.scopeId, 'opencolorio-color-management')
assert.equal(proColorImageToolScopeOwnership.find((scope) => scope.ownerTool === 'openimageio')?.scopeId, 'openimageio-image-io-metadata')
assert.equal(proColorImageToolScopeOwnership.find((scope) => scope.ownerTool === 'kornia')?.scopeId, 'kornia-local-visual-qa')
assert.equal(proColorImageToolScopeOwnership.find((scope) => scope.ownerTool === 'ffmpeg_ffprobe')?.phase40AStatus, 'existing_scope_preserved')

assert.equal(report.proColorImagePlanningAllowed, true)
assert.equal(report.openColorIOPlanningAllowed, true)
assert.equal(report.openImageIOPlanningAllowed, true)
assert.equal(report.korniaPlanningAllowed, true)
assert.equal(report.runtimeInstallAllowed, false)
assert.equal(report.proColorImageRuntimeAllowed, false)
assert.equal(report.generatedFixtureRuntimeAllowed, false)
assert.equal(report.realVideoProColorAllowed, false)
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)
assert.equal(report.phase40BReadiness.ready, true)
assert.equal(report.phase40BReadiness.nextPhase, 'Phase 40B generated-fixture pro color/image runtime verification')
assert.ok(report.phase40BReadiness.reason.includes('generated-fixture runtime planning only'))

const disallowedExecutablePattern = /docker\s+(build|push)|gcloud\s+.*(deploy|execute|jobs)|gsutil\s+|gcloud\s+storage\s+cp|curl\s+|wget\s+|provider|allUsers|allAuthenticatedUsers|revideo|python\s+-m\s+|ffmpeg\s+/i
for (const commandPlan of proColorImageCommandPlans) {
  assert.equal(commandPlan.textOnlyByDefault, true)
  assert.equal(commandPlan.allowedInPhase40A, false)
  assert.equal(commandPlan.executableCommand, null)
  assert.ok(commandPlan.blockedReason)
  assert.ok(commandPlan.commandText.startsWith('TEXT_ONLY'))
  assert.doesNotMatch(commandPlan.commandText, disallowedExecutablePattern)
}

const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> }
assert.equal(packageJson.scripts['activation:pro-color-image-approval:plan'], 'tsx server/cli/activation-pro-color-image-approval-plan.ts')
assert.equal(packageJson.scripts['activation:pro-color-image-approval:report'], 'tsx server/cli/activation-pro-color-image-approval-report.ts')
assert.equal(packageJson.scripts['activation:pro-color-tool:summary'], 'tsx server/cli/activation-pro-color-tool-summary.ts')
assert.equal(packageJson.scripts['smoke:activation-pro-color-image-approval-workflow'], 'tsx server/smoke/activation-pro-color-image-approval-workflow-smoke.ts')

const scriptText = [
  packageJson.scripts['activation:pro-color-image-approval:plan'],
  packageJson.scripts['activation:pro-color-image-approval:report'],
  packageJson.scripts['activation:pro-color-tool:summary'],
  packageJson.scripts['smoke:activation-pro-color-image-approval-workflow'],
].join('\n')
assert.doesNotMatch(scriptText, /docker|gcloud|curl|wget|provider|revideo/i)

const roadmap = readFileSync(new URL('../../docs/activation-phase-roadmap.md', import.meta.url), 'utf8')
assert.match(roadmap, /40A\. Pro color\/image approval workflow/)
assert.match(roadmap, /40B\. Generated-fixture pro color\/image runtime verification/)
assert.match(roadmap, /40C\. Controlled real-video pro color\/image sample/)
assert.match(roadmap, /40D\. Pro color\/image private feature E2E readiness gate/)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'pro_color_report_builds',
    'tool_evidence_exists',
    'license_reviews_exist',
    'required_blocker_risks',
    'tool_scope_ownership',
    'future_sequence_40b_40c_40d',
    'execution_gates_false',
    'command_plans_text_only_blocked',
    'phase40b_ready_with_limited_reason',
    'package_scripts',
  ],
}))
