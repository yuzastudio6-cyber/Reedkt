#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_owner_review_passed_with_warnings_ready_for_bounded_route_readiness_next_step'
const gate2kDecision = 'sound_runtime_media_gate_2k_controlled_route_readiness_plan_completed_with_warnings_ready_for_route_readiness_owner_review'
const gate2jOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_fixture_validation_owner_review_passed_with_warnings_ready_for_route_readiness_planning'
const sourceHead = '102e2195d6f00c8805f8d151b2537308465c7ac6'
const pr814MergeCommit = '772709293711ea92f7b5be311e3335c25dbd6cb4'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-review-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-boundary-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-readiness-owner-claim-policy'],
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
const reviewRegister = parseBlock(docs[2][0], docs[2][1])
const boundary = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2k = parseBlock('docs/sound-runtime-media-gate-2k-controlled-route-readiness-plan.md', 'sound-runtime-media-gate-2k-controlled-route-readiness-plan')
const gate2jOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-review')

for (const entry of [review, acceptance, reviewRegister, boundary, blockers, policy]) {
  assert(entry.decision === decision, 'route readiness owner decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr816.status === 'merged', 'PR #816 must be merged')
assert(review.sourceVerification.pr816.mergeCommit === sourceHead, 'PR #816 merge commit mismatch')
assert(review.sourceVerification.pr816.decision === gate2kDecision, 'PR #816 decision mismatch')
assert(review.sourceVerification.pr814.status === 'merged', 'PR #814 must be merged')
assert(review.sourceVerification.pr814.mergeCommit === pr814MergeCommit, 'PR #814 merge commit mismatch')
assert(review.sourceVerification.pr814.decision === gate2jOwnerDecision, 'PR #814 decision mismatch')
assert(gate2k.decision === gate2kDecision, 'Gate 2K decision mismatch')
assert(gate2jOwner.decision === gate2jOwnerDecision, 'Gate 2J owner decision mismatch')

assert(review.reviewResult.gate2kPlanAcceptedForBoundedNextStep === true, 'Gate 2K must be accepted')
assert(review.reviewResult.futureBoundedRouteReadinessStepMayProceed === true, 'future bounded step missing')
assert(review.reviewResult.fixtureCount === 4, 'fixture count mismatch')
assert(review.reviewResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(review.reviewResult.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(review.reviewResult.mismatchCaseCount === 5, 'mismatch count mismatch')
for (const key of [
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

assert(acceptance.acceptedSourceDecision === gate2kDecision, 'accepted source decision mismatch')
assert(acceptance.acceptedForFutureNextStepOnly === true, 'future-only acceptance missing')
assert(acceptance.acceptedPlanningInputs.fixtureCount === 4, 'accepted planning fixture count mismatch')
assert(acceptance.acceptedPlanningInputs.routeContracts.length === 4, 'accepted route contract count mismatch')
assertAllFalse(acceptance.acceptedForExecutionToday, 'accepted for execution today')
assert(reviewRegister.acceptedEvidence.gate2kRouteReadinessPlanCreated === true, 'Gate 2K plan evidence missing')
for (const key of ['routeResolverImported', 'routeExecutionRun', 'serverRouteExecuted', 'workerDispatchRun', 'workerExecutionRun', 'mediaProcessingRun', 'dockerOrGcpRun', 'supabaseOrSqlRun', 'artifactCreated']) {
  assert(reviewRegister.acceptedEvidence[key] === false, `accepted evidence ${key} must remain false`)
}
assert(boundary.futureNextStepMayAttempt.boundedRouteReadinessPlanning === true, 'future bounded planning missing')
for (const [key, value] of Object.entries(boundary.futureNextStepMayAttempt)) {
  if (key !== 'boundedRouteReadinessPlanning') {
    assert(value === false, `futureNextStepMayAttempt.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentOwnerReviewExecution, 'current owner review execution')
assert(blockers.blockers.some((row) => row.blockerId === 'bounded_route_readiness_next_step_pending' && row.status === 'next'), 'next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2kPlanAcceptedForBoundedNextStep === true, 'allowed Gate 2K claim missing')
assert(policy.allowedClaims.futureBoundedRouteReadinessStepMayProceed === true, 'allowed future step claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2l-bounded-route-readiness-next-step-plan.md')
assert(nextPrompt.includes(decision), 'Gate 2L prompt must require owner-review decision')
assert(nextPrompt.includes('no execution'), 'Gate 2L prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-readiness-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr816Verified: true,
  gate2kPlanAcceptedForBoundedNextStep: review.reviewResult.gate2kPlanAcceptedForBoundedNextStep,
  fixtureCount: review.reviewResult.fixtureCount,
  acceptedFixtureCount: review.reviewResult.acceptedFixtureCount,
  rejectedPayloadFieldCount: review.reviewResult.rejectedPayloadFieldCount,
  mismatchCaseCount: review.reviewResult.mismatchCaseCount,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInThisOwnerReview,
  workerExecutionRunInOwnerReview: review.reviewResult.workerExecutionRunInThisOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
