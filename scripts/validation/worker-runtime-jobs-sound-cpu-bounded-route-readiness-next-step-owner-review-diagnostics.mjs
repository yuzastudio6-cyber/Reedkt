#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_next_step_owner_review_passed_with_warnings_ready_for_route_readiness_evaluator_plan'
const gate2lDecision = 'sound_runtime_media_gate_2l_bounded_route_readiness_next_step_plan_completed_with_warnings_ready_for_next_step_owner_review'
const gate2kOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_owner_review_passed_with_warnings_ready_for_bounded_route_readiness_next_step'
const sourceHead = '593010d0a04c5de122c5c6ce3044d931cd84e80a'
const pr819MergeCommit = '18b010c3a353643e026f6e3c339bbd7fd1da9a4a'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-next-step-owner-review.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-next-step-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-boundary-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-owner-claim-policy'],
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

const review = parseBlock(docs[0][0], docs[0][1])
const acceptance = parseBlock(docs[1][0], docs[1][1])
const boundary = parseBlock(docs[2][0], docs[2][1])
const reviewRegister = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2l = parseBlock('docs/sound-runtime-media-gate-2l-bounded-route-readiness-next-step-plan.md', 'sound-runtime-media-gate-2l-bounded-route-readiness-next-step-plan')
const gate2kOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-owner-review')

for (const entry of [review, acceptance, boundary, reviewRegister, blockers, policy]) {
  assert(entry.decision === decision, 'bounded route-readiness owner decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr821.status === 'merged', 'PR #821 must be merged')
assert(review.sourceVerification.pr821.mergeCommit === sourceHead, 'PR #821 merge commit mismatch')
assert(review.sourceVerification.pr821.decision === gate2lDecision, 'PR #821 decision mismatch')
assert(review.sourceVerification.pr819.status === 'merged', 'PR #819 must be merged')
assert(review.sourceVerification.pr819.mergeCommit === pr819MergeCommit, 'PR #819 merge commit mismatch')
assert(review.sourceVerification.pr819.decision === gate2kOwnerDecision, 'PR #819 decision mismatch')
assert(gate2l.decision === gate2lDecision, 'Gate 2L decision mismatch')
assert(gate2kOwner.decision === gate2kOwnerDecision, 'Gate 2K owner decision mismatch')

assert(review.reviewResult.gate2lPlanAcceptedForEvaluatorPlanning === true, 'Gate 2L plan must be accepted')
assert(review.reviewResult.futureRouteReadinessEvaluatorPlanMayProceed === true, 'future evaluator plan missing')
assert(review.reviewResult.routeContractCount === 4, 'route contract count mismatch')
assert(review.reviewResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(review.reviewResult.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(review.reviewResult.mismatchCaseCount === 5, 'mismatch count mismatch')
for (const key of [
  'routeResolverImportRunInThisOwnerReview',
  'routeExecutionRunInThisOwnerReview',
  'workerExecutionRunInThisOwnerReview',
  'acceptedForRouteExecutionToday',
  'acceptedForWorkerExecutionToday',
  'acceptedForRouteReadinessToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(review.reviewResult[key] === false, `reviewResult.${key} must remain false`)
}

assert(acceptance.acceptedSourceDecision === gate2lDecision, 'accepted source decision mismatch')
assert(acceptance.acceptedForFutureEvaluatorPlanningOnly === true, 'future evaluator-only acceptance missing')
assert(acceptance.acceptedPlanningInputs.routeContractCount === 4, 'accepted route count mismatch')
assert(acceptance.acceptedPlanningInputs.rejectedPayloadFieldCount === 14, 'accepted rejected payload count mismatch')
assert(acceptance.acceptedPlanningInputs.mismatchCaseCount === 5, 'accepted mismatch count mismatch')
assertAllFalse(acceptance.acceptedForExecutionToday, 'accepted for execution today')
assert(boundary.futureGate2mMayAttempt.routeReadinessEvaluatorPlan === true, 'Gate 2M evaluator plan missing')
for (const [key, value] of Object.entries(boundary.futureGate2mMayAttempt)) {
  if (key !== 'routeReadinessEvaluatorPlan') {
    assert(value === false, `futureGate2mMayAttempt.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentOwnerReviewExecution, 'current owner review execution')
assert(reviewRegister.acceptedEvidence.gate2lNextStepCreated === true, 'Gate 2L evidence missing')
for (const key of ['routeResolverImportedForExecution', 'routeExecutionRun', 'serverRouteExecuted', 'workerDispatchRun', 'workerExecutionRun', 'mediaProcessingRun', 'dockerOrGcpRun', 'supabaseOrSqlRun', 'artifactCreated']) {
  assert(reviewRegister.acceptedEvidence[key] === false, `accepted evidence ${key} must remain false`)
}
assert(blockers.blockers.some((row) => row.blockerId === 'route_readiness_evaluator_plan_pending' && row.status === 'next'), 'Gate 2M next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2lPlanAcceptedForEvaluatorPlanning === true, 'allowed Gate 2L claim missing')
assert(policy.allowedClaims.futureRouteReadinessEvaluatorPlanMayProceed === true, 'allowed evaluator plan claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2m-route-readiness-evaluator-plan.md')
assert(nextPrompt.includes(decision), 'Gate 2M prompt must require owner-review decision')
assert(nextPrompt.includes('no execution'), 'Gate 2M prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-bounded-route-readiness-next-step-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-route-readiness-next-step-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_next_step_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr821Verified: true,
  gate2lPlanAcceptedForEvaluatorPlanning: review.reviewResult.gate2lPlanAcceptedForEvaluatorPlanning,
  routeContractCount: review.reviewResult.routeContractCount,
  acceptedFixtureCount: review.reviewResult.acceptedFixtureCount,
  rejectedPayloadFieldCount: review.reviewResult.rejectedPayloadFieldCount,
  mismatchCaseCount: review.reviewResult.mismatchCaseCount,
  routeResolverImportRunInOwnerReview: review.reviewResult.routeResolverImportRunInThisOwnerReview,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInThisOwnerReview,
  workerExecutionRunInOwnerReview: review.reviewResult.workerExecutionRunInThisOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
