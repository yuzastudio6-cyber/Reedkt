#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_review_owner_review_passed_with_warnings_ready_for_bounded_route_readiness_static_review'
const gate2sDecision = 'sound_runtime_media_gate_2s_bounded_route_readiness_review_plan_completed_with_warnings_ready_for_bounded_route_readiness_owner_review'
const gate2rOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_controlled_import_proof_owner_review_passed_with_warnings_ready_for_bounded_route_readiness_review'
const sourceHead = '39948af715cbdc943af7789362126a87cc20352b'
const integrationPath = 'server/workers/sound-cpu/route-readiness-evaluator-static-integration.mjs'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-owner-review.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-evidence-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-evidence-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-boundary-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-owner-claim-policy'],
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
const gate2s = parseBlock('docs/sound-runtime-media-gate-2s-bounded-route-readiness-review-plan.md', 'sound-runtime-media-gate-2s-bounded-route-readiness-review-plan')
const gate2sBoundary = parseBlock('docs/sound-runtime-media-gate-2s-review-boundary-register.md', 'sound-runtime-media-gate-2s-review-boundary-register')
const gate2sSource = parseBlock('docs/sound-runtime-media-gate-2s-source-evidence-register.md', 'sound-runtime-media-gate-2s-source-evidence-register')
const gate2rOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-review')

for (const entry of [review, acceptance, evidence, boundary, blockers, claimPolicy]) {
  assert(entry.decision === decision, 'bounded route-readiness owner-review decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr855.status === 'merged', 'PR #855 must be merged')
assert(review.sourceVerification.pr855.mergeCommit === sourceHead, 'PR #855 merge commit mismatch')
assert(review.sourceVerification.pr855.decision === gate2sDecision, 'PR #855 decision mismatch')
assert(review.sourceVerification.pr853.decision === gate2rOwnerDecision, 'PR #853 owner decision mismatch')

assert(gate2s.decision === gate2sDecision, 'Gate 2S decision mismatch')
assert(gate2s.sourceVerification.pr853.status === 'merged', 'Gate 2S must reference merged PR #853')
assert(gate2s.planScope.boundedRouteReadinessReviewPlanned === true, 'Gate 2S bounded review plan missing')
assert(gate2s.planScope.staticIntegrationSourcePath === integrationPath, 'Gate 2S integration path mismatch')
assert(gate2s.planScope.fixtureCount === 9, 'Gate 2S fixture count mismatch')
assert(gate2s.planScope.acceptedFixtureCount === 4, 'Gate 2S accepted fixture count mismatch')
assert(gate2s.planScope.rejectedPayloadFieldCount === 14, 'Gate 2S rejected field count mismatch')
assert(gate2s.planScope.mismatchCaseCount === 5, 'Gate 2S mismatch count mismatch')
for (const key of ['routeResolverImportPlanned', 'serverRouteExecutionPlanned', 'workerDispatchPlanned', 'workerExecutionPlanned', 'routeReadinessClaimed', 'workerReadinessClaimed', 'runtimeReadinessClaimed']) {
  assert(gate2s.planScope[key] === false, `Gate 2S ${key} must remain false`)
}

assert(gate2sBoundary.acceptedForToday.routeReadiness === false, 'Gate 2S route readiness must remain false')
assertAllFalse(gate2sBoundary.acceptedForToday, 'Gate 2S acceptedForToday')
assert(gate2sSource.acceptedSourceEvidence.canonicalRejectedPayloadFieldCount === 14, 'Gate 2S source evidence field count mismatch')
assert(gate2sSource.acceptedSourceEvidence.runtimeFlagsFalse === true, 'Gate 2S runtime flags evidence missing')
assert(gate2sSource.acceptedSourceEvidence.readinessClaimFalse === true, 'Gate 2S readiness closure missing')
assert(gate2rOwner.reviewResult.gate2rProofAcceptedForBoundedRouteReadinessReview === true, 'Gate 2R owner proof acceptance missing')

assert(review.reviewResult.gate2sPlanAcceptedForFutureStaticReview === true, 'Gate 2S plan acceptance missing')
assert(review.reviewResult.gate2rProofAcceptedAsStaticEvidence === true, 'Gate 2R evidence acceptance missing')
assert(review.reviewResult.canonicalRejectedPayloadFieldCount === 14, 'review canonical field count mismatch')
assert(review.reviewResult.fixtureCount === 9, 'review fixture count mismatch')
assert(review.reviewResult.acceptedFixtureCount === 4, 'review accepted fixture count mismatch')
assert(review.reviewResult.mismatchCaseCount === 5, 'review mismatch count mismatch')
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
  assert(review.reviewResult[key] === false, `reviewResult.${key} must remain false`)
}

assert(acceptance.acceptedForFuturePlanningOnly.boundedRouteReadinessStaticReviewMayProceed === true, 'bounded static review acceptance missing')
assertAllFalse(acceptance.acceptedForExecutionToday, 'acceptedForExecutionToday')
assert(evidence.acceptedGate2sEvidence.rejectedPayloadFieldCount === 14, 'evidence rejected field count mismatch')
assert(evidence.ownerReviewMode.routeResolverImported === false, 'owner review must not import route resolver')
assert(evidence.ownerReviewMode.routeExecutionRun === false, 'owner review must not execute route')
assert(evidence.ownerReviewMode.workerExecutionRun === false, 'owner review must not execute worker')

assert(boundary.acceptedBoundary.futureBoundedRouteReadinessStaticReviewPlanning === true, 'future bounded static review boundary missing')
for (const [key, value] of Object.entries(boundary.acceptedBoundary)) {
  if (!['futureBoundedRouteReadinessStaticReviewPlanning', 'staticEvaluatorCountsOnly', 'canonicalRejectedPayloadFieldCoverageOnly', 'runtimeFlagClosureOnly'].includes(key)) {
    assert(value === false, `acceptedBoundary.${key} must remain false`)
  }
}

assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'bounded_route_readiness_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'bounded_route_readiness_static_review_pending' && row.status === 'next'), 'next static review blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(claimPolicy.allowedClaims.boundedRouteReadinessStaticReviewMayProceed === true, 'allowed bounded static review claim missing')
assertAllFalse(claimPolicy.runtimeFlags, 'claim policy runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2t-bounded-route-readiness-static-review.md')
assert(nextPrompt.includes(decision), 'Gate 2T prompt must require this owner-review decision')
assert(nextPrompt.includes('no route execution'), 'Gate 2T prompt must preserve no-route-execution scope')
assert(nextPrompt.includes('must not import route resolvers'), 'Gate 2T prompt must block route resolver imports')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-bounded-route-readiness-review-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_review_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  gate2sPlanAcceptedForFutureStaticReview: review.reviewResult.gate2sPlanAcceptedForFutureStaticReview,
  boundedRouteReadinessStaticReviewMayProceed: acceptance.acceptedForFuturePlanningOnly.boundedRouteReadinessStaticReviewMayProceed,
  acceptedForRouteReadinessToday: review.reviewResult.acceptedForRouteReadinessToday,
  routeResolverImportedInOwnerReview: review.reviewResult.routeResolverImportedInOwnerReview,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
