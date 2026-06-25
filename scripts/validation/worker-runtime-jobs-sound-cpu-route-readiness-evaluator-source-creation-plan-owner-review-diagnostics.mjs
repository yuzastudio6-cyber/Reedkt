#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_source_creation_plan_owner_review_passed_with_warnings_ready_for_actual_evaluator_source_creation'
const gate2nDecision = 'sound_runtime_media_gate_2n_route_readiness_evaluator_source_creation_plan_completed_with_warnings_ready_for_source_plan_owner_review'
const gate2mOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_owner_review_passed_with_warnings_ready_for_evaluator_source_creation_plan'
const sourceHead = 'dd1f133eecbe9a963a82f8e92be7526f2c951699'
const pr827MergeCommit = '0b7b1cbc4b26fdc5973653fc19790cca3a428354'
const plannedPath = 'server/workers/sound-cpu/route-readiness-evaluator.mjs'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-boundary-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-review-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-claim-policy'],
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
const gate2n = parseBlock('docs/sound-runtime-media-gate-2n-route-readiness-evaluator-source-creation-plan.md', 'sound-runtime-media-gate-2n-route-readiness-evaluator-source-creation-plan')
const gate2mOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-owner-review')

for (const entry of [review, acceptance, boundary, reviewRegister, blockers, policy]) {
  assert(entry.decision === decision, 'source plan owner-review decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr828.status === 'merged', 'PR #828 must be merged')
assert(review.sourceVerification.pr828.mergeCommit === sourceHead, 'PR #828 merge commit mismatch')
assert(review.sourceVerification.pr828.decision === gate2nDecision, 'PR #828 decision mismatch')
assert(review.sourceVerification.pr827.status === 'merged', 'PR #827 must be merged')
assert(review.sourceVerification.pr827.mergeCommit === pr827MergeCommit, 'PR #827 merge commit mismatch')
assert(review.sourceVerification.pr827.decision === gate2mOwnerDecision, 'PR #827 decision mismatch')
assert(gate2n.decision === gate2nDecision, 'Gate 2N decision mismatch')
assert(gate2mOwner.decision === gate2mOwnerDecision, 'Gate 2M owner decision mismatch')

assert(review.reviewResult.gate2nSourceCreationPlanAcceptedForActualSourceGate === true, 'Gate 2N plan must be accepted')
assert(review.reviewResult.futureEvaluatorSourcePath === plannedPath, 'planned path mismatch')
assert(review.reviewResult.actualEvaluatorSourceCreatedInOwnerReview === false, 'actual source must not be created')
assert(review.reviewResult.futureActualSourceCreationGateMayProceed === true, 'future source gate missing')
assert(review.reviewResult.routeContractCount === 4, 'route count mismatch')
assert(review.reviewResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(review.reviewResult.rejectedPayloadFieldCount === 14, 'rejected field count mismatch')
assert(review.reviewResult.mismatchCaseCount === 5, 'mismatch count mismatch')
for (const key of [
  'routeResolverImportRunInOwnerReview',
  'routeExecutionRunInOwnerReview',
  'workerExecutionRunInOwnerReview',
  'toolExecutionRunInOwnerReview',
  'acceptedForRouteExecutionToday',
  'acceptedForRouteReadinessToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(review.reviewResult[key] === false, `reviewResult.${key} must remain false`)
}

const gate2oSourceResultExists = fs.existsSync(path.join(root, 'docs/sound-runtime-media-gate-2o-actual-route-readiness-evaluator-source-result.md'))
if (gate2oSourceResultExists) {
  assert(fs.existsSync(path.join(root, plannedPath)), 'planned evaluator source should exist after Gate 2O source creation')
} else {
  assert(!fs.existsSync(path.join(root, plannedPath)), 'planned evaluator source must not exist in owner review')
}
assert(acceptance.acceptedSourceDecision === gate2nDecision, 'accepted source decision mismatch')
assert(acceptance.acceptedForFutureActualSourceCreationOnly === true, 'future actual source only missing')
assert(acceptance.acceptedEvaluatorSourcePlan.futureEvaluatorSourcePath === plannedPath, 'acceptance path mismatch')
assert(acceptance.acceptedEvaluatorSourcePlan.moduleType === 'node_builtins_only_static_evaluator', 'module type mismatch')
assertAllFalse(acceptance.acceptedForExecutionToday, 'accepted for execution today')
assert(boundary.futureGate2oMayAttempt.actualEvaluatorSourceCreation === true, 'Gate 2O source creation missing')
assert(boundary.futureGate2oMayAttempt.nodeBuiltinsOnlyStaticEvaluator === true, 'Gate 2O node-builtins guard missing')
assert(boundary.futureGate2oMayAttempt.staticFixtureEvaluationHelpers === true, 'Gate 2O static fixture helper missing')
for (const [key, value] of Object.entries(boundary.futureGate2oMayAttempt)) {
  if (!['actualEvaluatorSourceCreation', 'nodeBuiltinsOnlyStaticEvaluator', 'staticFixtureEvaluationHelpers'].includes(key)) {
    assert(value === false, `futureGate2oMayAttempt.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentOwnerReviewExecution, 'current owner review execution')
assert(reviewRegister.acceptedEvidence.gate2nSourceCreationPlanCreated === true, 'Gate 2N evidence missing')
assert(reviewRegister.acceptedEvidence.actualEvaluatorSourceCreated === false, 'actual source evidence must remain false')
assert(blockers.blockers.some((row) => row.blockerId === 'actual_evaluator_source_creation_pending' && row.status === 'next'), 'Gate 2O next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2nSourceCreationPlanAcceptedForActualSourceGate === true, 'allowed Gate 2N claim missing')
assert(policy.allowedClaims.futureActualSourceCreationGateMayProceed === true, 'allowed Gate 2O claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2o-actual-route-readiness-evaluator-source-creation.md')
assert(nextPrompt.includes(decision), 'Gate 2O prompt must require owner-review decision')
assert(nextPrompt.includes('no execution'), 'Gate 2O prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-readiness-evaluator-source-creation-plan-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_source_creation_plan_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr828Verified: true,
  gate2nSourceCreationPlanAcceptedForActualSourceGate: review.reviewResult.gate2nSourceCreationPlanAcceptedForActualSourceGate,
  futureEvaluatorSourcePath: review.reviewResult.futureEvaluatorSourcePath,
  actualEvaluatorSourceCreatedInOwnerReview: review.reviewResult.actualEvaluatorSourceCreatedInOwnerReview,
  routeContractCount: review.reviewResult.routeContractCount,
  acceptedFixtureCount: review.reviewResult.acceptedFixtureCount,
  rejectedPayloadFieldCount: review.reviewResult.rejectedPayloadFieldCount,
  mismatchCaseCount: review.reviewResult.mismatchCaseCount,
  routeResolverImportRunInOwnerReview: review.reviewResult.routeResolverImportRunInOwnerReview,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
