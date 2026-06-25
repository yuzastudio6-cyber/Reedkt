#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_owner_review_passed_with_warnings_ready_for_evaluator_source_creation_plan'
const gate2mDecision = 'sound_runtime_media_gate_2m_route_readiness_evaluator_plan_completed_with_warnings_ready_for_evaluator_owner_review'
const gate2lOwnerDecision = 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_next_step_owner_review_passed_with_warnings_ready_for_route_readiness_evaluator_plan'
const sourceHead = '3b65169d4d48b02bc1f4e581fc74b6e3cacfd243'
const pr822MergeCommit = 'cb055695f3330a206830fe565b99ee054996dd61'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-boundary-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-review-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-claim-policy'],
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
const gate2m = parseBlock('docs/sound-runtime-media-gate-2m-route-readiness-evaluator-plan.md', 'sound-runtime-media-gate-2m-route-readiness-evaluator-plan')
const gate2lOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-next-step-owner-review.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-next-step-owner-review')

for (const entry of [review, acceptance, boundary, reviewRegister, blockers, policy]) {
  assert(entry.decision === decision, 'evaluator owner decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr824.status === 'merged', 'PR #824 must be merged')
assert(review.sourceVerification.pr824.mergeCommit === sourceHead, 'PR #824 merge commit mismatch')
assert(review.sourceVerification.pr824.decision === gate2mDecision, 'PR #824 decision mismatch')
assert(review.sourceVerification.pr822.status === 'merged', 'PR #822 must be merged')
assert(review.sourceVerification.pr822.mergeCommit === pr822MergeCommit, 'PR #822 merge commit mismatch')
assert(review.sourceVerification.pr822.decision === gate2lOwnerDecision, 'PR #822 decision mismatch')
assert(gate2m.decision === gate2mDecision, 'Gate 2M decision mismatch')
assert(gate2lOwner.decision === gate2lOwnerDecision, 'Gate 2L owner decision mismatch')

assert(review.reviewResult.gate2mEvaluatorShapeAcceptedForSourceCreationPlanning === true, 'Gate 2M shape must be accepted')
assert(review.reviewResult.futureEvaluatorSourceCreationPlanMayProceed === true, 'future source-creation plan missing')
assert(review.reviewResult.routeContractCount === 4, 'route count mismatch')
assert(review.reviewResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(review.reviewResult.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(review.reviewResult.mismatchCaseCount === 5, 'mismatch count mismatch')
for (const key of [
  'evaluatorSourceCreatedInThisOwnerReview',
  'routeResolverImportRunInThisOwnerReview',
  'routeExecutionRunInThisOwnerReview',
  'workerExecutionRunInThisOwnerReview',
  'acceptedForEvaluatorSourceCreationToday',
  'acceptedForRouteExecutionToday',
  'acceptedForRouteReadinessToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(review.reviewResult[key] === false, `reviewResult.${key} must remain false`)
}

assert(acceptance.acceptedSourceDecision === gate2mDecision, 'accepted source decision mismatch')
assert(acceptance.acceptedForFutureSourceCreationPlanningOnly === true, 'future source-creation only missing')
assert(acceptance.acceptedEvaluatorShape.inputMode === 'static_fixture_records_only', 'accepted input mode mismatch')
assert(acceptance.acceptedEvaluatorShape.outputMode === 'planning_only_readiness_report_shape', 'accepted output mode mismatch')
assertAllFalse(acceptance.acceptedForExecutionToday, 'accepted for execution today')
assert(boundary.futureGate2nMayAttempt.evaluatorSourceCreationPlan === true, 'Gate 2N plan missing')
for (const [key, value] of Object.entries(boundary.futureGate2nMayAttempt)) {
  if (key !== 'evaluatorSourceCreationPlan') {
    assert(value === false, `futureGate2nMayAttempt.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentOwnerReviewExecution, 'current owner review execution')
assert(reviewRegister.acceptedEvidence.routeReadinessEvaluatorShapePlanned === true, 'Gate 2M evidence missing')
for (const key of ['routeResolverImported', 'routeExecutionRun', 'serverRouteExecuted', 'workerDispatchRun', 'workerExecutionRun', 'mediaProcessingRun', 'dockerOrGcpRun', 'supabaseOrSqlRun', 'artifactCreated']) {
  assert(reviewRegister.acceptedEvidence[key] === false, `accepted evidence ${key} must remain false`)
}
assert(blockers.blockers.some((row) => row.blockerId === 'evaluator_source_creation_plan_pending' && row.status === 'next'), 'Gate 2N next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2mEvaluatorShapeAcceptedForSourceCreationPlanning === true, 'allowed Gate 2M claim missing')
assert(policy.allowedClaims.futureEvaluatorSourceCreationPlanMayProceed === true, 'allowed source-creation plan claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2n-route-readiness-evaluator-source-creation-plan.md')
assert(nextPrompt.includes(decision), 'Gate 2N prompt must require owner-review decision')
assert(nextPrompt.includes('no execution'), 'Gate 2N prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-readiness-evaluator-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr824Verified: true,
  gate2mEvaluatorShapeAcceptedForSourceCreationPlanning: review.reviewResult.gate2mEvaluatorShapeAcceptedForSourceCreationPlanning,
  routeContractCount: review.reviewResult.routeContractCount,
  acceptedFixtureCount: review.reviewResult.acceptedFixtureCount,
  rejectedPayloadFieldCount: review.reviewResult.rejectedPayloadFieldCount,
  mismatchCaseCount: review.reviewResult.mismatchCaseCount,
  evaluatorSourceCreatedInOwnerReview: review.reviewResult.evaluatorSourceCreatedInThisOwnerReview,
  routeResolverImportRunInOwnerReview: review.reviewResult.routeResolverImportRunInThisOwnerReview,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInThisOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
