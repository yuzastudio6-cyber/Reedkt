import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import {
  buildTrackAVisualEvidenceChain,
  buildTrackAVisualReadinessClosureCommandPlans,
  buildTrackAVisualReadinessClosureIamPlan,
  buildTrackAVisualReadinessClosureReport,
  trackAVisualReadinessConfig,
  trackAVisualReadinessGateIds,
  trackAVisualReadinessRequiredDocs,
  trackAVisualReadinessRequiredScripts,
  validateTrackAVisualReadinessExecutionEnv,
} from '../activation/track-a-visual-readiness-closure'

const report = buildTrackAVisualReadinessClosureReport()
const iam = buildTrackAVisualReadinessClosureIamPlan()
const commandPlans = buildTrackAVisualReadinessClosureCommandPlans()
const evidenceChain = buildTrackAVisualEvidenceChain()

assert.equal(trackAVisualReadinessConfig.phase, '45F')
assert.equal(trackAVisualReadinessConfig.track, 'A visual/video')
assert.equal(trackAVisualReadinessConfig.runtimeMode, 'track_a_visual_readiness_closure')
assert.equal(trackAVisualReadinessConfig.approvedPhase45ERunId, 'phase45e-20260531T23580')
assert.equal(trackAVisualReadinessConfig.approvedPhase45EManifestGcsUri, 'gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45e/phase45e-20260531T23580/review/e2e-review-manifest.json')
assert.equal(trackAVisualReadinessConfig.canonicalPrivateReviewExportGcsUri, 'gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4')
assert.equal(report.finalDeliveryAllowed, false)
assert.equal(report.privateReviewOnly, true)
assert.equal(report.providerAllowed, false)
assert.equal(report.revideoAllowed, false)
assert.equal(report.trackBAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealUserMediaAllowed, false)

assert.equal(validateTrackAVisualReadinessExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'false',
  runtimeMode: trackAVisualReadinessConfig.runtimeMode,
}).allowed, false)
assert.equal(validateTrackAVisualReadinessExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  runtimeMode: trackAVisualReadinessConfig.runtimeMode,
  providerExecutionEnabled: 'false',
  revideoEnabled: 'false',
  trackBEnabled: 'false',
  publicAccessEnabled: 'false',
  finalDeliveryEnabled: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
}).allowed, true)

assert.ok(iam.every((binding) => binding.reportOnly))
assert.ok(iam.every((binding) => binding.conditionExpression.includes('resource.name.startsWith')))
assert.ok(iam.every((binding) => !/allUsers|allAuthenticatedUsers|storage\.admin|storage\.objectAdmin|roles\/owner|roles\/editor/.test(binding.commandString)))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45f-generated-create'))
assert.ok(iam.some((binding) => binding.bindingId === 'phase45f-qa-create'))
assert.ok(commandPlans.every((plan) => plan.textOnlyByDefault))
assert.ok(JSON.stringify(commandPlans).includes('REEDITPRO_CONFIRM_TRACK_A_VISUAL_READINESS_CLOSURE=true'))
assert.ok(JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=false'))
assert.ok(!JSON.stringify(commandPlans).includes('PROVIDER_EXECUTION_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('REVIDEO_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('TRACK_B_TOOLS_ENABLED=true'))
assert.ok(!JSON.stringify(commandPlans).includes('FINAL_DELIVERY_ENABLED=true'))

assert.deepEqual(trackAVisualReadinessGateIds, [
  'track_a_evidence_chain',
  'tool_scope_integrity',
  'report_consistency',
  'artifact_privacy',
  'private_e2e_review_integrity',
  'scripts_validation',
  'docs_consistency',
  'blocked_features',
  'no_public_access',
  'no_final_delivery',
])
assert.ok(evidenceChain.some((item) => item.phase === '35F' && item.label.includes('SAM2')))
assert.ok(evidenceChain.some((item) => item.phase === '34D/34E' && item.label.includes('Real-ESRGAN')))
assert.ok(evidenceChain.some((item) => item.phase === '38D' && item.label.includes('FILM')))
assert.ok(evidenceChain.some((item) => item.phase === '40D' && item.label.includes('Pro color')))
assert.ok(evidenceChain.some((item) => item.phase === '45A'))
assert.ok(evidenceChain.some((item) => item.phase === '45B'))
assert.ok(evidenceChain.some((item) => item.phase === '45C'))
assert.ok(evidenceChain.some((item) => item.phase === '45D'))
assert.ok(evidenceChain.some((item) => item.phase === '45E'))
const realEsrgan = evidenceChain.find((item) => item.phase === '34D/34E')
assert.ok(realEsrgan)
assert.equal(realEsrgan?.readyForInternalTrackA, true)
assert.ok((realEsrgan?.expectedScopeBlockers.length ?? 0) > 0)
assert.ok(evidenceChain.every((item) => item.artifactUris.every((uri) => uri.startsWith('gs://reeditpro-staging-reeditpro-'))))

for (const doc of trackAVisualReadinessRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const scripts = JSON.parse(await readFile('package.json', 'utf8')).scripts as Record<string, string>
for (const script of trackAVisualReadinessRequiredScripts) assert.ok(scripts[script], `missing package script ${script}`)
assert.equal(scripts['activation:track-a-visual-readiness-closure'], 'tsx server/cli/activation-track-a-visual-readiness-closure.ts')
assert.equal(scripts['activation:track-a-visual-readiness-closure:report'], 'tsx server/cli/activation-track-a-visual-readiness-closure-report.ts')
assert.equal(scripts['activation:track-a-visual-readiness-closure:iam-plan'], 'tsx server/cli/activation-track-a-visual-readiness-closure-iam-plan.ts')
assert.equal(scripts['smoke:activation-track-a-visual-readiness-closure'], 'tsx server/smoke/activation-track-a-visual-readiness-closure-smoke.ts')

if (report.executionReport) {
  const gateIds = new Set(report.executionReport.qa.gates.map((gate) => gate.gateId))
  for (const gate of trackAVisualReadinessGateIds) assert.ok(gateIds.has(gate), `missing QA gate ${gate}`)
}

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase45f_policy',
    'phase45e_evidence_lock',
    'track_a_evidence_chain',
    'real_esrgan_expected_scope_blockers_do_not_block_internal_readiness',
    'confirmation_gate',
    'private_artifact_prefixes',
    'qa_gate_contract',
    'blocked_features',
    'package_scripts',
  ],
}))
