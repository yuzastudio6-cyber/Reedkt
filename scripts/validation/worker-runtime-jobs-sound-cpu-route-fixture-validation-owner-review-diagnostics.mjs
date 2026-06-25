#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_fixture_validation_owner_review_passed_with_warnings_ready_for_route_readiness_planning'
const gate2jDecision = 'sound_runtime_media_gate_2j_controlled_route_fixture_validation_passed_with_warnings_ready_for_fixture_validation_owner_review'
const hardeningOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_fixture_hardening_owner_review_passed_with_warnings_ready_for_controlled_fixture_validation'
const sourceHead = '8c9dd3e94bb5f0c2ba3e0a9c390b2b5516dcf18c'
const pr810MergeCommit = '0d700a3bdc36d4aa79063db30462d0d237e9f256'
const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-validation-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-fixture-validation-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-validation-review-register.md', 'worker-runtime-jobs-sound-cpu-route-fixture-validation-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-validation-boundary-register.md', 'worker-runtime-jobs-sound-cpu-route-fixture-validation-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-validation-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-fixture-validation-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-claim-policy'],
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
const gate2j = parseBlock('docs/sound-runtime-media-gate-2j-controlled-route-fixture-validation-result.md', 'sound-runtime-media-gate-2j-controlled-route-fixture-validation-result')
const gate2jReport = parseBlock('docs/sound-runtime-media-gate-2j-fixture-validation-report.md', 'sound-runtime-media-gate-2j-fixture-validation-report')
const hardeningOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-review')

for (const entry of [review, acceptance, reviewRegister, boundary, blockers, policy]) {
  assert(entry.decision === decision, 'fixture validation owner decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr812.status === 'merged', 'PR #812 must be merged')
assert(review.sourceVerification.pr812.mergeCommit === sourceHead, 'PR #812 merge commit mismatch')
assert(review.sourceVerification.pr812.decision === gate2jDecision, 'PR #812 decision mismatch')
assert(review.sourceVerification.pr810.status === 'merged', 'PR #810 must be merged')
assert(review.sourceVerification.pr810.mergeCommit === pr810MergeCommit, 'PR #810 merge commit mismatch')
assert(review.sourceVerification.pr810.decision === hardeningOwnerDecision, 'PR #810 decision mismatch')
assert(gate2j.decision === gate2jDecision, 'Gate 2J decision mismatch')
assert(hardeningOwner.decision === hardeningOwnerDecision, 'hardening owner decision mismatch')

assert(review.reviewResult.gate2jValidationAcceptedForRouteReadinessPlanning === true, 'Gate 2J validation must be accepted')
assert(review.reviewResult.futureGate2kRouteReadinessPlanMayProceed === true, 'Gate 2K may proceed missing')
assert(review.reviewResult.fixtureCount === 4, 'fixture count mismatch')
assert(review.reviewResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(review.reviewResult.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(review.reviewResult.mismatchCaseCount === 5, 'mismatch count mismatch')
assert(review.reviewResult.routeExecutionRunInThisOwnerReview === false, 'route execution in owner review must be false')
assert(review.reviewResult.workerExecutionRunInThisOwnerReview === false, 'worker execution in owner review must be false')
assert(review.reviewResult.acceptedForRouteExecutionToday === false, 'route execution today must be false')
assert(review.reviewResult.acceptedForWorkerExecutionToday === false, 'worker execution today must be false')
assert(review.reviewResult.acceptedForRuntimeReadinessToday === false, 'runtime readiness today must be false')
assert(review.reviewResult.acceptedForBetaOrProductionToday === false, 'beta/production today must be false')

assert(acceptance.acceptedValidationDecision === gate2jDecision, 'accepted validation decision mismatch')
assert(acceptance.acceptedForFutureGate2kOnly === true, 'Gate 2K-only acceptance missing')
assert(acceptance.acceptedValidationMode === 'local_in_memory_static_fixture_shape_only', 'validation mode mismatch')
assert(acceptance.acceptedValidationCounts.fixtureCount === 4, 'accepted fixture count mismatch')
assert(acceptance.acceptedValidationCounts.acceptedFixtureCount === 4, 'accepted fixture result count mismatch')
assert(acceptance.acceptedValidationCounts.rejectedPayloadFieldCount === 14, 'accepted rejected count mismatch')
assert(acceptance.acceptedValidationCounts.mismatchCaseCount === 5, 'accepted mismatch count mismatch')
for (const key of [
  'acceptedForRouteExecutionToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForWorkerExecutionToday',
  'acceptedForMediaProcessingToday',
  'acceptedForDockerOrGcpToday',
  'acceptedForSupabaseOrSqlToday',
  'acceptedForReadinessToday',
]) {
  assert(acceptance[key] === false, `${key} must remain false`)
}

assert(reviewRegister.acceptedEvidence.validationPassed === true, 'validation passed evidence missing')
for (const key of ['routeResolverImported', 'routeExecutionRun', 'serverRouteExecuted', 'workerDispatchRun', 'workerExecutionRun', 'mediaProcessingRun', 'externalServiceTouched', 'supabaseTouched', 'sqlExecuted', 'artifactCreated']) {
  assert(reviewRegister.acceptedEvidence[key] === false, `accepted evidence ${key} must remain false`)
}
assert(gate2j.validationPassed === true, 'Gate 2J validation must pass')
assert(gate2j.validationMode === 'local_in_memory_static_fixture_shape_only', 'Gate 2J validation mode mismatch')
for (const key of ['routeResolverImported', 'routeExecutionRun', 'serverRouteExecuted', 'workerExecutionRun', 'mediaProcessingRun', 'dockerRun', 'gcpTouched', 'supabaseTouched', 'sqlExecuted', 'artifactCreated']) {
  assert(gate2j[key] === false, `Gate 2J ${key} must remain false`)
}
assert(gate2jReport.fixtureCount === 4, 'Gate 2J report fixture count mismatch')
assert(gate2jReport.acceptedFixtureCount === 4, 'Gate 2J report accepted count mismatch')
assert(gate2jReport.rejectedPayloadFieldCount === 14, 'Gate 2J report rejected count mismatch')
assert(gate2jReport.mismatchCaseCount === 5, 'Gate 2J report mismatch count mismatch')

assert(boundary.futureGate2kMayAttempt.routeReadinessPlan === true, 'Gate 2K route readiness plan missing')
for (const [key, value] of Object.entries(boundary.futureGate2kMayAttempt)) {
  if (key !== 'routeReadinessPlan') {
    assert(value === false, `futureGate2kMayAttempt.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentOwnerReviewExecution, 'current owner review execution')
assert(blockers.blockers.some((row) => row.blockerId === 'route_readiness_plan_pending' && row.status === 'next'), 'Gate 2K next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2jValidationAcceptedForRouteReadinessPlanning === true, 'allowed Gate 2J claim missing')
assert(policy.allowedClaims.futureGate2kRouteReadinessPlanMayProceed === true, 'allowed Gate 2K claim missing')
assert(policy.allowedClaims.routeExecutionRunInOwnerReview === false, 'route execution claim must be false')
assert(policy.allowedClaims.workerExecutionRunInOwnerReview === false, 'worker execution claim must be false')
assertAllFalse(policy.runtimeFlags, 'runtime flag')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')

const gate2kPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2k-controlled-route-readiness-plan.md')
assert(gate2kPrompt.includes(decision), 'Gate 2K prompt must require owner-review decision')
assert(gate2kPrompt.includes('no execution'), 'Gate 2K prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-fixture-validation-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_fixture_validation_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr812Verified: true,
  gate2jValidationAcceptedForRouteReadinessPlanning: review.reviewResult.gate2jValidationAcceptedForRouteReadinessPlanning,
  fixtureCount: review.reviewResult.fixtureCount,
  acceptedFixtureCount: review.reviewResult.acceptedFixtureCount,
  rejectedPayloadFieldCount: review.reviewResult.rejectedPayloadFieldCount,
  mismatchCaseCount: review.reviewResult.mismatchCaseCount,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInThisOwnerReview,
  workerExecutionRunInOwnerReview: review.reviewResult.workerExecutionRunInThisOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
