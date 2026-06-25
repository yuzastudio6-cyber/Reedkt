#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2p_route_readiness_evaluator_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review'
const sourceOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_source_owner_review_passed_with_warnings_ready_for_static_integration_plan'
const gate2oDecision = 'sound_runtime_media_gate_2o_actual_route_readiness_evaluator_source_created_with_warnings_ready_for_source_owner_review'
const sourceHead = 'fe03149ee0ba6f4ee38f5b183f5750adf440b235'
const pr834MergeCommit = 'c013169d226ede36e92fc1a448f3ed99e7bb3ad5'
const evaluatorPath = 'server/workers/sound-cpu/route-readiness-evaluator.mjs'
const integrationPath = 'server/workers/sound-cpu/route-readiness-evaluator-static-integration.mjs'

const docs = [
  ['docs/sound-runtime-media-gate-2p-route-readiness-evaluator-static-integration-plan.md', 'sound-runtime-media-gate-2p-route-readiness-evaluator-static-integration-plan'],
  ['docs/sound-runtime-media-gate-2p-static-import-boundary-plan.md', 'sound-runtime-media-gate-2p-static-import-boundary-plan'],
  ['docs/sound-runtime-media-gate-2p-fixture-wiring-plan.md', 'sound-runtime-media-gate-2p-fixture-wiring-plan'],
  ['docs/sound-runtime-media-gate-2p-diagnostics-shape-plan.md', 'sound-runtime-media-gate-2p-diagnostics-shape-plan'],
  ['docs/sound-runtime-media-gate-2p-owner-handoff.md', 'sound-runtime-media-gate-2p-owner-handoff'],
  ['docs/sound-runtime-media-gate-2p-blocker-register.md', 'sound-runtime-media-gate-2p-blocker-register'],
  ['docs/sound-runtime-media-gate-2p-runtime-claim-policy.md', 'sound-runtime-media-gate-2p-runtime-claim-policy'],
]

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function parseBlock(file, label) {
  const text = read(file)
  const marker = `\`\`\`json ${label}`
  const start = text.indexOf(marker)
  assert(start >= 0, `${file} missing JSON block ${label}`)
  const jsonStart = start + marker.length
  const end = text.indexOf('```', jsonStart)
  assert(end >= 0, `${file} missing JSON close`)
  return JSON.parse(text.slice(jsonStart, end).trim())
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must remain false`)
  }
}

for (const [file, label] of docs) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
  parseBlock(file, label)
}

const plan = parseBlock(docs[0][0], docs[0][1])
const boundary = parseBlock(docs[1][0], docs[1][1])
const wiring = parseBlock(docs[2][0], docs[2][1])
const diagnosticsShape = parseBlock(docs[3][0], docs[3][1])
const handoff = parseBlock(docs[4][0], docs[4][1])
const blockers = parseBlock(docs[5][0], docs[5][1])
const policy = parseBlock(docs[6][0], docs[6][1])
const sourceOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-owner-review')
const gate2o = parseBlock('docs/sound-runtime-media-gate-2o-actual-route-readiness-evaluator-source-result.md', 'sound-runtime-media-gate-2o-actual-route-readiness-evaluator-source-result')

for (const entry of [plan, boundary, wiring, diagnosticsShape, handoff, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2P decision mismatch')
}

assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr835.status === 'merged', 'PR #835 must be merged')
assert(plan.sourceVerification.pr835.mergeCommit === sourceHead, 'PR #835 merge commit mismatch')
assert(plan.sourceVerification.pr835.decision === sourceOwnerDecision, 'PR #835 decision mismatch')
assert(plan.sourceVerification.pr834.status === 'merged', 'PR #834 must be merged')
assert(plan.sourceVerification.pr834.mergeCommit === pr834MergeCommit, 'PR #834 merge commit mismatch')
assert(plan.sourceVerification.pr834.decision === gate2oDecision, 'PR #834 decision mismatch')
assert(sourceOwner.decision === sourceOwnerDecision, 'source owner decision mismatch')
assert(gate2o.decision === gate2oDecision, 'Gate 2O decision mismatch')

assert(fs.existsSync(path.join(root, evaluatorPath)), 'evaluator source must exist')
const gate2qSourceResultExists = fs.existsSync(path.join(root, 'docs/sound-runtime-media-gate-2q-static-integration-source-result.md'))
if (gate2qSourceResultExists) {
  assert(fs.existsSync(path.join(root, integrationPath)), 'integration source should exist after Gate 2Q source creation')
} else {
  assert(!fs.existsSync(path.join(root, integrationPath)), 'integration source must not exist in Gate 2P')
}
assert(plan.staticIntegrationPlan.evaluatorSourcePath === evaluatorPath, 'evaluator path mismatch')
assert(plan.staticIntegrationPlan.futureIntegrationBoundaryPlanned === true, 'future integration boundary missing')
assert(plan.staticIntegrationPlan.futureStaticImportPlanOnly === true, 'static import plan-only flag missing')
for (const key of [
  'actualIntegrationSourceCreatedInGate2p',
  'evaluatorImportedInGate2p',
  'routeResolverImported',
  'routeExecutionRun',
  'serverRouteExecuted',
  'workerDispatchRun',
  'workerExecutionRun',
  'toolExecutionRun',
  'mediaProcessingRun',
  'dockerOrGcpRun',
  'supabaseOrSqlRun',
  'artifactCreated',
  'routeReadinessClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'mediaReadinessClaimed',
  'betaOrProductionReadinessClaimed',
]) {
  assert(plan.staticIntegrationPlan[key] === false, `staticIntegrationPlan.${key} must remain false`)
}

assert(boundary.futureStaticImportBoundary.mayPlanImportOfEvaluatorSource === true, 'import planning missing')
assert(boundary.futureStaticImportBoundary.mayPlanStaticFixtureWiring === true, 'fixture wiring planning missing')
assert(boundary.futureStaticImportBoundary.mayPlanDiagnosticsOnlyInvocation === true, 'diagnostics planning missing')
for (const [key, value] of Object.entries(boundary.futureStaticImportBoundary)) {
  if (!['mayPlanImportOfEvaluatorSource', 'mayPlanStaticFixtureWiring', 'mayPlanDiagnosticsOnlyInvocation'].includes(key)) {
    assert(value === false, `futureStaticImportBoundary.${key} must remain false`)
  }
}
assert(boundary.plannedIntegrationShape.integrationModulePath === integrationPath, 'integration path mismatch')
assert(boundary.plannedIntegrationShape.integrationModuleCreatedToday === false, 'integration module must not be created')
assert(boundary.plannedIntegrationShape.sourceModuleImportedToday === false, 'source module must not be imported')
assert(wiring.futureFixtureWiring.fixtureMode === 'static_records_only', 'fixture mode mismatch')
assert(wiring.futureFixtureWiring.routeContractCount === 4, 'route count mismatch')
assert(wiring.futureFixtureWiring.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(wiring.futureFixtureWiring.mayUseInMemoryStaticRecords === true, 'static record usage missing')
for (const [key, value] of Object.entries(wiring.futureFixtureWiring)) {
  if (!['fixtureMode', 'routeContractCount', 'acceptedFixtureCount', 'rejectedPayloadFieldCount', 'mismatchCaseCount', 'mayUseInMemoryStaticRecords'].includes(key)) {
    assert(value === false, `futureFixtureWiring.${key} must remain false`)
  }
}
assert(diagnosticsShape.currentGateDiagnostics.evaluatorImportedInGate2p === false, 'evaluator import must remain false')
assert(diagnosticsShape.currentGateDiagnostics.integrationModuleCreatedInGate2p === false, 'integration module creation must remain false')
assertAllFalse(diagnosticsShape.currentGateDiagnostics, 'current gate diagnostics')
assert(handoff.handoffTarget === 'WORKER_RUNTIME_JOBS', 'handoff target mismatch')
assert(handoff.acceptedInputs.evaluatorSourcePath === evaluatorPath, 'handoff evaluator path mismatch')
assert(handoff.acceptedInputs.plannedIntegrationModulePath === integrationPath, 'handoff integration path mismatch')
assertAllFalse(handoff.acceptedForExecutionToday, 'accepted for execution today')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_runtime_jobs_static_integration_plan_owner_review_pending' && row.status === 'next'), 'owner review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.futureStaticIntegrationBoundaryPlanned === true, 'allowed static integration claim missing')
assert(policy.allowedClaims.futureOwnerReviewRequired === true, 'allowed owner review claim missing')
assert(policy.allowedClaims.evaluatorSourceCreatedPreviously === true, 'allowed previous source claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-owner-review.md')
assert(nextPrompt.includes(decision), 'owner-review prompt must require Gate 2P decision')
assert(nextPrompt.includes('no execution'), 'owner-review prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2p:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2p-diagnostics.mjs', 'Gate 2P package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2p_diagnostics_passed',
  decision,
  sourceHead,
  pr835Verified: true,
  evaluatorSourcePath: plan.staticIntegrationPlan.evaluatorSourcePath,
  futureIntegrationBoundaryPlanned: plan.staticIntegrationPlan.futureIntegrationBoundaryPlanned,
  integrationSourceCreatedInGate2p: plan.staticIntegrationPlan.actualIntegrationSourceCreatedInGate2p,
  evaluatorImportedInGate2p: plan.staticIntegrationPlan.evaluatorImportedInGate2p,
  routeResolverImported: plan.staticIntegrationPlan.routeResolverImported,
  routeExecutionRun: plan.staticIntegrationPlan.routeExecutionRun,
  nextPrompt: plan.nextPrompt,
}, null, 2))
