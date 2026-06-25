#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2l_bounded_route_readiness_next_step_plan_completed_with_warnings_ready_for_next_step_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_owner_review_passed_with_warnings_ready_for_bounded_route_readiness_next_step'
const gate2kDecision = 'sound_runtime_media_gate_2k_controlled_route_readiness_plan_completed_with_warnings_ready_for_route_readiness_owner_review'
const sourceHead = '18b010c3a353643e026f6e3c339bbd7fd1da9a4a'
const pr816MergeCommit = '102e2195d6f00c8805f8d151b2537308465c7ac6'

const docs = [
  ['docs/sound-runtime-media-gate-2l-bounded-route-readiness-next-step-plan.md', 'sound-runtime-media-gate-2l-bounded-route-readiness-next-step-plan'],
  ['docs/sound-runtime-media-gate-2l-readiness-evaluator-scope-register.md', 'sound-runtime-media-gate-2l-readiness-evaluator-scope-register'],
  ['docs/sound-runtime-media-gate-2l-negative-case-preservation-register.md', 'sound-runtime-media-gate-2l-negative-case-preservation-register'],
  ['docs/sound-runtime-media-gate-2l-owner-handoff.md', 'sound-runtime-media-gate-2l-owner-handoff'],
  ['docs/sound-runtime-media-gate-2l-blocker-register.md', 'sound-runtime-media-gate-2l-blocker-register'],
  ['docs/sound-runtime-media-gate-2l-runtime-claim-policy.md', 'sound-runtime-media-gate-2l-runtime-claim-policy'],
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
const evaluator = parseBlock(docs[1][0], docs[1][1])
const negativeCases = parseBlock(docs[2][0], docs[2][1])
const handoff = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-owner-review')
const gate2k = parseBlock('docs/sound-runtime-media-gate-2k-controlled-route-readiness-plan.md', 'sound-runtime-media-gate-2k-controlled-route-readiness-plan')

for (const entry of [plan, evaluator, negativeCases, handoff, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2L decision mismatch')
}

assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr819.status === 'merged', 'PR #819 must be merged')
assert(plan.sourceVerification.pr819.mergeCommit === sourceHead, 'PR #819 merge commit mismatch')
assert(plan.sourceVerification.pr819.decision === ownerDecision, 'PR #819 decision mismatch')
assert(plan.sourceVerification.pr816.status === 'merged', 'PR #816 must be merged')
assert(plan.sourceVerification.pr816.mergeCommit === pr816MergeCommit, 'PR #816 merge commit mismatch')
assert(plan.sourceVerification.pr816.decision === gate2kDecision, 'PR #816 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(gate2k.decision === gate2kDecision, 'Gate 2K decision mismatch')

assert(plan.nextStepPlan.boundedRouteReadinessNextStepCreated === true, 'next step must be created')
assert(plan.nextStepPlan.futureOwnerReviewRequired === true, 'owner review required missing')
assert(plan.nextStepPlan.futureExecutionGateRequiredBeforeAnyRouteExecution === true, 'execution gate requirement missing')
assert(plan.nextStepPlan.routeContractsRetained === 4, 'route contract count mismatch')
assert(plan.nextStepPlan.fixtureCount === 4, 'fixture count mismatch')
assert(plan.nextStepPlan.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(plan.nextStepPlan.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(plan.nextStepPlan.mismatchCaseCount === 5, 'mismatch count mismatch')
for (const key of [
  'routeExecutionRun',
  'serverRouteExecuted',
  'routeResolverImportedForExecution',
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
  assert(plan.nextStepPlan[key] === false, `nextStepPlan.${key} must remain false`)
}

assert(evaluator.plannedEvaluatorScope.futureEvaluatorMayBePlanned === true, 'future evaluator planning missing')
assert(evaluator.plannedEvaluatorScope.futureEvaluatorMayInspectStaticFixtureShape === true, 'static fixture shape planning missing')
for (const [key, value] of Object.entries(evaluator.plannedEvaluatorScope)) {
  if (!['futureEvaluatorMayBePlanned', 'futureEvaluatorMayInspectStaticFixtureShape'].includes(key)) {
    assert(value === false, `plannedEvaluatorScope.${key} must remain false`)
  }
}
assert(evaluator.retainedFixtureEvidence.fixtureCount === 4, 'retained fixture count mismatch')
assert(evaluator.retainedFixtureEvidence.rejectedPayloadFieldCount === 14, 'retained rejected field count mismatch')
assert(evaluator.retainedFixtureEvidence.mismatchCaseCount === 5, 'retained mismatch count mismatch')
assert(evaluator.routeContracts.length === 4, 'route contract list mismatch')

assert(negativeCases.negativeCasesPreservedForFuturePlanning.rejectedPayloadFieldCount === 14, 'negative rejected field count mismatch')
assert(negativeCases.negativeCasesPreservedForFuturePlanning.mismatchCaseCount === 5, 'negative mismatch count mismatch')
assertAllFalse(negativeCases.executionBoundaries, 'negative case execution boundary')
assert(handoff.handoffTarget === 'WORKER_RUNTIME_JOBS', 'handoff target mismatch')
assert(handoff.acceptedInputs.routeContractCount === 4, 'handoff route count mismatch')
assertAllFalse(handoff.acceptedForExecutionToday, 'handoff execution today')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_runtime_jobs_next_step_owner_review_pending' && row.status === 'next'), 'owner review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.boundedRouteReadinessNextStepCreated === true, 'allowed next-step claim missing')
assert(policy.allowedClaims.futureOwnerReviewRequired === true, 'allowed owner-review claim missing')
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (!['boundedRouteReadinessNextStepCreated', 'futureOwnerReviewRequired'].includes(key)) {
    assert(value === false, `allowedClaims.${key} must remain false`)
  }
}
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-route-readiness-next-step-owner-review.md')
assert(nextPrompt.includes(decision), 'owner-review prompt must require Gate 2L decision')
assert(nextPrompt.includes('no execution'), 'owner-review prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2l:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2l-diagnostics.mjs', 'Gate 2L package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2l_diagnostics_passed',
  decision,
  sourceHead,
  pr819Verified: true,
  boundedRouteReadinessNextStepCreated: plan.nextStepPlan.boundedRouteReadinessNextStepCreated,
  fixtureCount: plan.nextStepPlan.fixtureCount,
  acceptedFixtureCount: plan.nextStepPlan.acceptedFixtureCount,
  rejectedPayloadFieldCount: plan.nextStepPlan.rejectedPayloadFieldCount,
  mismatchCaseCount: plan.nextStepPlan.mismatchCaseCount,
  routeExecutionRun: plan.nextStepPlan.routeExecutionRun,
  workerExecutionRun: plan.nextStepPlan.workerExecutionRun,
  mediaProcessingRun: plan.nextStepPlan.mediaProcessingRun,
  nextPrompt: plan.nextPrompt,
}, null, 2))
