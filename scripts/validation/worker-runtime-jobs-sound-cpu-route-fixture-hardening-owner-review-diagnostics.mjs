#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_fixture_hardening_owner_review_passed_with_warnings_ready_for_controlled_fixture_validation'
const gate2iDecision = 'sound_runtime_media_gate_2i_controlled_route_fixture_hardening_plan_completed_with_warnings_ready_for_fixture_hardening_owner_review'
const proofOwnerDecision = 'worker_runtime_jobs_sound_cpu_controlled_route_execution_proof_owner_review_passed_with_warnings_ready_for_route_fixture_hardening_plan'
const sourceHead = '7341047a26f18ccdafc28396fbe1f708a6a699c4'
const pr805MergeCommit = '453adebc8a6880447c57ecc37b79d1c88a7ed788'
const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-hardening-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-fixture-hardening-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-hardening-review-register.md', 'worker-runtime-jobs-sound-cpu-route-fixture-hardening-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-hardening-boundary-register.md', 'worker-runtime-jobs-sound-cpu-route-fixture-hardening-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-hardening-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-fixture-hardening-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-claim-policy'],
]
const jobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
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

function includesAll(actual, expected, label) {
  for (const item of expected) {
    assert(actual.includes(item), `${label} missing ${item}`)
  }
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
const gate2i = parseBlock('docs/sound-runtime-media-gate-2i-controlled-route-fixture-hardening-plan-result.md', 'sound-runtime-media-gate-2i-controlled-route-fixture-hardening-plan-result')
const gate2iTopics = parseBlock('docs/sound-runtime-media-gate-2i-fixture-hardening-topic-register.md', 'sound-runtime-media-gate-2i-fixture-hardening-topic-register')
const gate2iCases = parseBlock('docs/sound-runtime-media-gate-2i-synthetic-fixture-case-plan-register.md', 'sound-runtime-media-gate-2i-synthetic-fixture-case-plan-register')
const gate2iRejection = parseBlock('docs/sound-runtime-media-gate-2i-rejection-fixture-hardening-register.md', 'sound-runtime-media-gate-2i-rejection-fixture-hardening-register')
const proofOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-review')

for (const entry of [review, acceptance, reviewRegister, boundary, blockers, policy]) {
  assert(entry.decision === decision, 'fixture hardening owner decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr809.status === 'merged', 'PR #809 must be merged')
assert(review.sourceVerification.pr809.mergeCommit === sourceHead, 'PR #809 merge commit mismatch')
assert(review.sourceVerification.pr809.decision === gate2iDecision, 'PR #809 decision mismatch')
assert(review.sourceVerification.pr805.status === 'merged', 'PR #805 must be merged')
assert(review.sourceVerification.pr805.mergeCommit === pr805MergeCommit, 'PR #805 merge commit mismatch')
assert(review.sourceVerification.pr805.decision === proofOwnerDecision, 'PR #805 decision mismatch')
assert(gate2i.decision === gate2iDecision, 'Gate 2I decision mismatch')
assert(proofOwner.decision === proofOwnerDecision, 'proof owner decision mismatch')

assert(review.reviewResult.gate2iPlanAcceptedForControlledFixtureValidation === true, 'Gate 2I plan must be accepted')
assert(review.reviewResult.futureGate2jControlledFixtureValidationMayProceed === true, 'Gate 2J may proceed missing')
assert(review.reviewResult.routeContractCount === 4, 'route contract count mismatch')
assert(review.reviewResult.rejectedPayloadFieldCount === 14, 'rejected field count mismatch')
assert(review.reviewResult.mismatchCaseCount === 5, 'mismatch count mismatch')
assert(review.reviewResult.routeExecutionRunInThisOwnerReview === false, 'route execution in owner review must be false')
assert(review.reviewResult.workerExecutionRunInThisOwnerReview === false, 'worker execution in owner review must be false')
assert(review.reviewResult.acceptedForWorkerExecutionToday === false, 'worker execution today must be false')
assert(review.reviewResult.acceptedForRuntimeReadinessToday === false, 'runtime readiness today must be false')
assert(review.reviewResult.acceptedForBetaOrProductionToday === false, 'beta/production today must be false')

assert(acceptance.acceptedPlanDecision === gate2iDecision, 'accepted plan decision mismatch')
assert(acceptance.acceptedForFutureGate2jOnly === true, 'Gate 2J-only acceptance missing')
includesAll(acceptance.acceptedJobTypes, jobTypes, 'accepted job types')
for (const key of [
  'acceptedForRouteExecutionInThisOwnerReview',
  'acceptedForWorkerDispatchToday',
  'acceptedForWorkerExecutionToday',
  'acceptedForMediaProcessingToday',
  'acceptedForDockerOrGcpToday',
  'acceptedForSupabaseOrSqlToday',
  'acceptedForReadinessToday',
]) {
  assert(acceptance[key] === false, `${key} must remain false`)
}

assert(reviewRegister.reviewedGate2iPlan.fixtureHardeningPlanOnly === true, 'Gate 2I must be plan-only')
assert(reviewRegister.reviewedGate2iPlan.routeContractCount === 4, 'review route count mismatch')
assert(reviewRegister.reviewedGate2iPlan.rejectedPayloadFieldCount === 14, 'review rejected count mismatch')
assert(reviewRegister.reviewedGate2iPlan.mismatchCaseCount === 5, 'review mismatch count mismatch')
assert(reviewRegister.reviewedGate2iPlan.futureFixtureValidationStatus === 'planned_not_executed', 'review future status mismatch')
assert(reviewRegister.acceptedForGate2j.staticInMemoryFixtureShapeValidation === true, 'Gate 2J static fixture validation missing')
assert(reviewRegister.requiresGate2jToStopOn.includes('worker dispatch path'), 'Gate 2J worker stop case missing')
assert(reviewRegister.requiresGate2jToStopOn.includes('readiness claim widening'), 'Gate 2J readiness stop case missing')

assert(gate2i.planCreated === true, 'Gate 2I plan must be created')
assert(gate2i.fixtureHardeningPlanOnly === true, 'Gate 2I must be plan-only')
for (const key of ['routeExecutionRun', 'serverRouteExecuted', 'workerExecutionRun', 'mediaProcessingRun', 'dockerRun', 'gcpTouched', 'supabaseTouched', 'sqlExecuted', 'artifactCreated']) {
  assert(gate2i[key] === false, `Gate 2I ${key} must remain false`)
}
assert(gate2iTopics.routeContractCount === 4, 'Gate 2I topic route count mismatch')
assert(gate2iTopics.rejectedPayloadFieldCount === 14, 'Gate 2I topic rejected count mismatch')
assert(gate2iTopics.mismatchCaseCount === 5, 'Gate 2I topic mismatch count mismatch')
assert(gate2iTopics.futureFixtureValidationStatus === 'planned_not_executed', 'Gate 2I topic future status mismatch')
assert(gate2iCases.plannedValidCases.length === 4, 'Gate 2I valid case count mismatch')
includesAll(gate2iCases.plannedValidCases.map((row) => row.jobType), jobTypes, 'Gate 2I planned job types')
assert(gate2iRejection.plannedRejectedPayloadFieldCount === 14, 'Gate 2I rejected field count mismatch')
assert(gate2iRejection.plannedMismatchCaseCount === 5, 'Gate 2I mismatch count mismatch')
assert(gate2iRejection.futureValidationStatus === 'planned_not_executed', 'Gate 2I rejection future status mismatch')

assert(boundary.futureGate2jMayAttempt.staticInMemoryFixtureShapeValidation === true, 'Gate 2J static validation missing')
for (const [key, value] of Object.entries(boundary.futureGate2jMayAttempt)) {
  if (key !== 'staticInMemoryFixtureShapeValidation') {
    assert(value === false, `futureGate2jMayAttempt.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentOwnerReviewExecution, 'current owner review execution')
assert(blockers.blockers.some((row) => row.blockerId === 'controlled_fixture_validation_pending' && row.status === 'next'), 'Gate 2J next blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_dispatch_not_approved' && row.status === 'blocked'), 'worker dispatch blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2iPlanAcceptedForControlledFixtureValidation === true, 'allowed Gate 2I claim missing')
assert(policy.allowedClaims.futureGate2jControlledFixtureValidationMayProceed === true, 'allowed Gate 2J claim missing')
assert(policy.allowedClaims.routeExecutionRunInOwnerReview === false, 'route execution in owner review claim must be false')
assert(policy.allowedClaims.workerExecutionRunInOwnerReview === false, 'worker execution in owner review claim must be false')
assertAllFalse(policy.runtimeFlags, 'runtime flag')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')

const gate2jPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2j-controlled-route-fixture-validation.md')
assert(gate2jPrompt.includes(decision), 'Gate 2J prompt must require owner-review decision')
assert(gate2jPrompt.includes('no worker/media/GCP'), 'Gate 2J prompt must keep no worker/media/GCP')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-fixture-hardening-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_fixture_hardening_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr809Verified: true,
  gate2iPlanAcceptedForControlledFixtureValidation: review.reviewResult.gate2iPlanAcceptedForControlledFixtureValidation,
  routeContractCount: review.reviewResult.routeContractCount,
  rejectedPayloadFieldCount: review.reviewResult.rejectedPayloadFieldCount,
  mismatchCaseCount: review.reviewResult.mismatchCaseCount,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInThisOwnerReview,
  workerExecutionRunInOwnerReview: review.reviewResult.workerExecutionRunInThisOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
