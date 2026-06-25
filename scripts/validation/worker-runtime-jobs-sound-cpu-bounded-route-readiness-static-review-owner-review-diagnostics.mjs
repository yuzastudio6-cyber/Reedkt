#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_static_review_owner_review_passed_with_warnings_ready_for_route_readiness_criteria_plan'
const gate2tDecision = 'sound_runtime_media_gate_2t_bounded_route_readiness_static_review_completed_with_warnings_ready_for_static_review_owner_review'
const sourceHead = 'b76d58eb059aa2413af68795de4226a52bde974f'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-owner-review.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-evidence-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-evidence-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-execution-boundary-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-execution-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-owner-claim-policy'],
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
const evidence = parseBlock(docs[2][0], docs[2][1])
const boundary = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const claimPolicy = parseBlock(docs[5][0], docs[5][1])
const gate2t = parseBlock('docs/sound-runtime-media-gate-2t-bounded-route-readiness-static-review-result.md', 'sound-runtime-media-gate-2t-bounded-route-readiness-static-review-result')
const gate2tBoundary = parseBlock('docs/sound-runtime-media-gate-2t-readiness-boundary-register.md', 'sound-runtime-media-gate-2t-readiness-boundary-register')
const gate2tPolicy = parseBlock('docs/sound-runtime-media-gate-2t-runtime-claim-policy.md', 'sound-runtime-media-gate-2t-runtime-claim-policy')

for (const entry of [review, acceptance, evidence, boundary, blockers, claimPolicy]) {
  assert(entry.decision === decision, 'bounded static review owner decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr861.status === 'merged', 'PR #861 must be merged')
assert(review.sourceVerification.pr861.mergeCommit === sourceHead, 'PR #861 merge commit mismatch')
assert(review.sourceVerification.pr861.decision === gate2tDecision, 'PR #861 decision mismatch')
assert(gate2t.decision === gate2tDecision, 'Gate 2T decision mismatch')
assert(gate2t.sourceVerification.pr858.status === 'merged', 'Gate 2T must reference merged PR #858')
assert(gate2t.staticReviewResult.boundedRouteReadinessStaticReviewCompleted === true, 'Gate 2T static review missing')
assert(gate2t.staticReviewResult.canonicalRejectedPayloadFieldCount === 14, 'Gate 2T canonical field count mismatch')
assert(gate2t.staticReviewResult.fixtureCount === 9, 'Gate 2T fixture count mismatch')
assert(gate2t.staticReviewResult.acceptedFixtureCount === 4, 'Gate 2T accepted fixture count mismatch')
assert(gate2t.staticReviewResult.mismatchCaseCount === 5, 'Gate 2T mismatch count mismatch')
for (const key of [
  'moduleImportedInGate2t',
  'routeResolverImportedInGate2t',
  'serverRouteExecutedInGate2t',
  'workerExecutionRunInGate2t',
  'toolExecutionRunInGate2t',
  'acceptedForRouteReadinessToday',
  'acceptedForWorkerReadinessToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(gate2t.staticReviewResult[key] === false, `Gate 2T ${key} must remain false`)
}

assertAllFalse(gate2tBoundary.acceptedForToday, 'Gate 2T acceptedForToday')
assertAllFalse(gate2tPolicy.runtimeFlags, 'Gate 2T runtime flags')

assert(review.ownerReviewResult.gate2tStaticReviewAcceptedForCriteriaPlanning === true, 'Gate 2T acceptance missing')
assert(review.ownerReviewResult.gate2sOwnerAcceptancePreserved === true, 'Gate 2S acceptance preservation missing')
assert(review.ownerReviewResult.gate2rProofAcceptedAsStaticEvidence === true, 'Gate 2R static evidence acceptance missing')
assert(review.ownerReviewResult.canonicalRejectedPayloadFieldCount === 14, 'owner canonical field count mismatch')
for (const key of [
  'routeResolverImportedInOwnerReview',
  'routeExecutionRunInOwnerReview',
  'workerExecutionRunInOwnerReview',
  'toolExecutionRunInOwnerReview',
  'acceptedForRouteReadinessToday',
  'acceptedForWorkerReadinessToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(review.ownerReviewResult[key] === false, `ownerReviewResult.${key} must remain false`)
}

assert(acceptance.acceptedForFuturePlanningOnly.routeReadinessCriteriaPlanMayProceed === true, 'criteria plan acceptance missing')
assertAllFalse(acceptance.acceptedForExecutionToday, 'acceptedForExecutionToday')
assert(evidence.acceptedGate2tEvidence.gate2tDecision === gate2tDecision, 'evidence Gate 2T decision mismatch')
assert(evidence.acceptedGate2tEvidence.acceptedForRouteReadinessToday === false, 'evidence route readiness must remain false')
for (const [key, value] of Object.entries(evidence.evidenceNotAcceptedFor)) {
  assert(value === true, `evidenceNotAcceptedFor.${key} must remain true`)
}
assert(boundary.acceptedBoundary.futureRouteReadinessCriteriaPlanning === true, 'future criteria planning boundary missing')
for (const [key, value] of Object.entries(boundary.acceptedBoundary)) {
  if (!['futureRouteReadinessCriteriaPlanning', 'staticEvidenceReviewOnly'].includes(key)) {
    assert(value === false, `acceptedBoundary.${key} must remain false`)
  }
}
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'bounded_route_readiness_static_review_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'route_readiness_criteria_plan_pending' && row.status === 'next'), 'next criteria blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(claimPolicy.allowedClaims.routeReadinessCriteriaPlanMayProceed === true, 'allowed criteria plan claim missing')
assertAllFalse(claimPolicy.runtimeFlags, 'claim policy runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2u-route-readiness-criteria-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('no route execution'), 'next prompt must preserve no-route-execution scope')
assert(nextPrompt.includes('must not import route resolvers'), 'next prompt must block route resolver imports')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-bounded-route-readiness-static-review-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_static_review_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  gate2tStaticReviewAcceptedForCriteriaPlanning: review.ownerReviewResult.gate2tStaticReviewAcceptedForCriteriaPlanning,
  routeReadinessCriteriaPlanMayProceed: acceptance.acceptedForFuturePlanningOnly.routeReadinessCriteriaPlanMayProceed,
  acceptedForRouteReadinessToday: review.ownerReviewResult.acceptedForRouteReadinessToday,
  routeResolverImportedInOwnerReview: review.ownerReviewResult.routeResolverImportedInOwnerReview,
  routeExecutionRunInOwnerReview: review.ownerReviewResult.routeExecutionRunInOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
