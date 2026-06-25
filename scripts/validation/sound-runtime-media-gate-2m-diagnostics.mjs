#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2m_route_readiness_evaluator_plan_completed_with_warnings_ready_for_evaluator_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_next_step_owner_review_passed_with_warnings_ready_for_route_readiness_evaluator_plan'
const gate2lDecision = 'sound_runtime_media_gate_2l_bounded_route_readiness_next_step_plan_completed_with_warnings_ready_for_next_step_owner_review'
const sourceHead = 'cb055695f3330a206830fe565b99ee054996dd61'
const pr821MergeCommit = '593010d0a04c5de122c5c6ce3044d931cd84e80a'

const docs = [
  ['docs/sound-runtime-media-gate-2m-route-readiness-evaluator-plan.md', 'sound-runtime-media-gate-2m-route-readiness-evaluator-plan'],
  ['docs/sound-runtime-media-gate-2m-evaluator-contract-register.md', 'sound-runtime-media-gate-2m-evaluator-contract-register'],
  ['docs/sound-runtime-media-gate-2m-evaluator-boundary-register.md', 'sound-runtime-media-gate-2m-evaluator-boundary-register'],
  ['docs/sound-runtime-media-gate-2m-negative-fixture-evaluator-register.md', 'sound-runtime-media-gate-2m-negative-fixture-evaluator-register'],
  ['docs/sound-runtime-media-gate-2m-owner-handoff.md', 'sound-runtime-media-gate-2m-owner-handoff'],
  ['docs/sound-runtime-media-gate-2m-blocker-register.md', 'sound-runtime-media-gate-2m-blocker-register'],
  ['docs/sound-runtime-media-gate-2m-runtime-claim-policy.md', 'sound-runtime-media-gate-2m-runtime-claim-policy'],
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
const contract = parseBlock(docs[1][0], docs[1][1])
const boundary = parseBlock(docs[2][0], docs[2][1])
const negative = parseBlock(docs[3][0], docs[3][1])
const handoff = parseBlock(docs[4][0], docs[4][1])
const blockers = parseBlock(docs[5][0], docs[5][1])
const policy = parseBlock(docs[6][0], docs[6][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-next-step-owner-review.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-next-step-owner-review')
const gate2l = parseBlock('docs/sound-runtime-media-gate-2l-bounded-route-readiness-next-step-plan.md', 'sound-runtime-media-gate-2l-bounded-route-readiness-next-step-plan')

for (const entry of [plan, contract, boundary, negative, handoff, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2M decision mismatch')
}

assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr822.status === 'merged', 'PR #822 must be merged')
assert(plan.sourceVerification.pr822.mergeCommit === sourceHead, 'PR #822 merge commit mismatch')
assert(plan.sourceVerification.pr822.decision === ownerDecision, 'PR #822 decision mismatch')
assert(plan.sourceVerification.pr821.status === 'merged', 'PR #821 must be merged')
assert(plan.sourceVerification.pr821.mergeCommit === pr821MergeCommit, 'PR #821 merge commit mismatch')
assert(plan.sourceVerification.pr821.decision === gate2lDecision, 'PR #821 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(gate2l.decision === gate2lDecision, 'Gate 2L decision mismatch')

assert(plan.evaluatorPlan.routeReadinessEvaluatorShapePlanned === true, 'evaluator shape must be planned')
assert(plan.evaluatorPlan.futureOwnerReviewRequired === true, 'owner review required missing')
assert(plan.evaluatorPlan.futureExecutionGateRequiredBeforeAnyRouteExecution === true, 'execution gate requirement missing')
assert(plan.evaluatorPlan.inputMode === 'static_fixture_records_only', 'input mode mismatch')
assert(plan.evaluatorPlan.outputMode === 'planning_only_readiness_report_shape', 'output mode mismatch')
assert(plan.evaluatorPlan.routeContractCount === 4, 'route count mismatch')
assert(plan.evaluatorPlan.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(plan.evaluatorPlan.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(plan.evaluatorPlan.mismatchCaseCount === 5, 'mismatch count mismatch')
for (const key of [
  'routeResolverImported',
  'routeExecutionRun',
  'serverRouteExecuted',
  'workerDispatchRun',
  'workerExecutionRun',
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
  assert(plan.evaluatorPlan[key] === false, `evaluatorPlan.${key} must remain false`)
}

assert(contract.plannedEvaluatorContract.inputRecords.length >= 8, 'input contract incomplete')
assert(contract.plannedEvaluatorContract.outputRecords.length >= 5, 'output contract incomplete')
for (const value of Object.values(contract.notAccepted)) {
  assert(value === true, 'notAccepted entries must be true')
}
assert(boundary.futureOwnerReviewMayConsider.acceptEvaluatorShapePlanning === true, 'owner review evaluator planning missing')
for (const [key, value] of Object.entries(boundary.futureOwnerReviewMayConsider)) {
  if (key !== 'acceptEvaluatorShapePlanning') {
    assert(value === false, `futureOwnerReviewMayConsider.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentGateExecution, 'current gate execution')
assert(negative.negativeFixturePlanning.rejectedPayloadFieldCount === 14, 'negative rejected count mismatch')
assert(negative.negativeFixturePlanning.mismatchCaseCount === 5, 'negative mismatch count mismatch')
assertAllFalse(negative.executionBoundaries, 'negative execution boundaries')
assert(handoff.handoffTarget === 'WORKER_RUNTIME_JOBS', 'handoff target mismatch')
assert(handoff.acceptedInputs.routeContractCount === 4, 'handoff route count mismatch')
assertAllFalse(handoff.acceptedForExecutionToday, 'handoff execution today')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_runtime_jobs_evaluator_owner_review_pending' && row.status === 'next'), 'owner review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.routeReadinessEvaluatorShapePlanned === true, 'allowed evaluator claim missing')
assert(policy.allowedClaims.futureOwnerReviewRequired === true, 'allowed owner review claim missing')
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (!['routeReadinessEvaluatorShapePlanned', 'futureOwnerReviewRequired'].includes(key)) {
    assert(value === false, `allowedClaims.${key} must remain false`)
  }
}
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-review.md')
assert(nextPrompt.includes(decision), 'owner-review prompt must require Gate 2M decision')
assert(nextPrompt.includes('no execution'), 'owner-review prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2m:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2m-diagnostics.mjs', 'Gate 2M package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2m_diagnostics_passed',
  decision,
  sourceHead,
  pr822Verified: true,
  routeReadinessEvaluatorShapePlanned: plan.evaluatorPlan.routeReadinessEvaluatorShapePlanned,
  routeContractCount: plan.evaluatorPlan.routeContractCount,
  acceptedFixtureCount: plan.evaluatorPlan.acceptedFixtureCount,
  rejectedPayloadFieldCount: plan.evaluatorPlan.rejectedPayloadFieldCount,
  mismatchCaseCount: plan.evaluatorPlan.mismatchCaseCount,
  routeResolverImported: plan.evaluatorPlan.routeResolverImported,
  routeExecutionRun: plan.evaluatorPlan.routeExecutionRun,
  workerExecutionRun: plan.evaluatorPlan.workerExecutionRun,
  nextPrompt: plan.nextPrompt,
}, null, 2))
