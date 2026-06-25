#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_controlled_route_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_route_execution_proof'
const gate2gDecision = 'sound_runtime_media_gate_2g_controlled_synthetic_route_execution_plan_completed_with_warnings_ready_for_execution_plan_owner_review'
const validationOwnerDecision = 'worker_runtime_jobs_sound_cpu_synthetic_route_source_validation_owner_review_passed_with_warnings_ready_for_controlled_route_execution_planning'
const sourceHead = '85389d1c86e8ec801c60f973aa19ba5de3f1a86e'
const pr782MergeCommit = '73b357c698f143a16a421cb830de2ff11b341c16'
const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-review.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-review-register.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-boundary-owner-register.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-boundary-owner-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-claim-policy'],
]
const sourceFiles = [
  'server/workers/sound-cpu/synthetic-route-types.ts',
  'server/workers/sound-cpu/synthetic-route-decision.ts',
  'server/workers/sound-cpu/index.ts',
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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must remain false`)
  }
}

function includesAll(actual, expected, label) {
  for (const item of expected) {
    assert(actual.includes(item), `${label} missing ${item}`)
  }
}

for (const [file, label] of docs) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
  parseBlock(file, label)
}
for (const file of sourceFiles) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
}

const review = parseBlock(docs[0][0], docs[0][1])
const acceptance = parseBlock(docs[1][0], docs[1][1])
const planReview = parseBlock(docs[2][0], docs[2][1])
const boundary = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2g = parseBlock('docs/sound-runtime-media-gate-2g-controlled-synthetic-route-execution-plan-result.md', 'sound-runtime-media-gate-2g-controlled-synthetic-route-execution-plan-result')
const gate2gPlan = parseBlock('docs/sound-runtime-media-gate-2g-route-execution-proof-plan-register.md', 'sound-runtime-media-gate-2g-route-execution-proof-plan-register')
const gate2gPayload = parseBlock('docs/sound-runtime-media-gate-2g-synthetic-payload-plan-register.md', 'sound-runtime-media-gate-2g-synthetic-payload-plan-register')
const validationOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-review')

for (const entry of [review, acceptance, planReview, boundary, blockers, policy]) {
  assert(entry.decision === decision, 'owner review decision mismatch')
}
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr789.status === 'merged', 'PR #789 must be merged')
assert(review.sourceVerification.pr789.mergeCommit === sourceHead, 'PR #789 merge commit mismatch')
assert(review.sourceVerification.pr789.decision === gate2gDecision, 'PR #789 decision mismatch')
assert(review.sourceVerification.pr782.status === 'merged', 'PR #782 must be merged')
assert(review.sourceVerification.pr782.mergeCommit === pr782MergeCommit, 'PR #782 merge commit mismatch')
assert(review.sourceVerification.pr782.decision === validationOwnerDecision, 'PR #782 decision mismatch')
assert(gate2g.decision === gate2gDecision, 'Gate 2G decision mismatch')
assert(gate2g.planCreated === true, 'Gate 2G plan must be created')
assert(gate2g.routeExecutionRun === false, 'Gate 2G route execution must be false')
assert(gate2g.workerExecutionRun === false, 'Gate 2G worker execution must be false')
assert(validationOwner.decision === validationOwnerDecision, 'validation owner decision mismatch')

assert(review.reviewResult.gate2gPlanAcceptedForGate2h === true, 'Gate 2G plan must be accepted')
assert(review.reviewResult.futureGate2hRouteProofMayProceed === true, 'Gate 2H may proceed missing')
assert(review.reviewResult.routeExecutionRunInThisOwnerReview === false, 'route execution in owner review must be false')
assert(review.reviewResult.workerExecutionRunInThisOwnerReview === false, 'worker execution in owner review must be false')
assert(review.reviewResult.routeContractCount === 4, 'route contract count mismatch')
assert(review.reviewResult.rejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(review.reviewResult.runtimeFlagFalseCount === 15, 'runtime false count mismatch')
assert(review.reviewResult.acceptedForWorkerExecutionToday === false, 'worker execution today must be false')
assert(review.reviewResult.acceptedForMediaOrRuntimeReadinessToday === false, 'media/runtime readiness today must be false')
assert(review.reviewResult.acceptedForBetaOrProductionToday === false, 'beta/production today must be false')

assert(acceptance.acceptedPlanDecision === gate2gDecision, 'accepted plan decision mismatch')
assert(acceptance.acceptedForFutureGate2hOnly === true, 'Gate 2H-only acceptance missing')
assert(acceptance.acceptedForRouteExecutionInGate2h === 'bounded_synthetic_only_after_gate_2h_preflight', 'Gate 2H execution boundary mismatch')
assert(acceptance.acceptedForWorkerExecutionToday === false, 'worker execution must not be accepted')
assert(acceptance.acceptedForRouteExecutionInThisOwnerReview === false, 'route execution in owner review must not be accepted')
assert(acceptance.acceptedForDockerOrGcpToday === false, 'Docker/GCP must not be accepted')
assert(acceptance.acceptedForSupabaseOrSqlToday === false, 'Supabase/SQL must not be accepted')
includesAll(acceptance.acceptedJobTypes, jobTypes, 'accepted job types')
includesAll(acceptance.acceptedSourceFiles, sourceFiles, 'accepted source files')

assert(planReview.reviewedGate2gPlan.futureProofStatus === 'planned_not_executed', 'Gate 2G future proof status mismatch')
assert(planReview.reviewedGate2gPlan.plannedRouteContracts === 4, 'planned contracts mismatch')
assert(planReview.reviewedGate2gPlan.plannedRejectedPayloadFieldCount === 14, 'planned rejected count mismatch')
assert(planReview.reviewedGate2gPlan.plannedRuntimeFalseFlagCount === 15, 'planned false flags mismatch')
for (const control of ['local synthetic payloads only', 'no worker dispatch', 'no media file open', 'all runtime flags false']) {
  assert(planReview.acceptedControlsForGate2h.includes(control), `missing accepted control ${control}`)
}
for (const stopCase of ['source drift', 'unsafe payload acceptance', 'worker dispatch path', 'readiness claim widening']) {
  assert(planReview.requiresGate2hToStopOn.includes(stopCase), `missing stop case ${stopCase}`)
}

assert(gate2gPlan.futureProofStatus === 'planned_not_executed', 'Gate 2G plan status mismatch')
assert(gate2gPlan.futureRouteExecutionAuthorizedByGate2g === false, 'Gate 2G must not authorize route execution itself')
assert(gate2gPayload.payloadMode === 'static_in_memory_synthetic_only', 'Gate 2G payload mode mismatch')
assert(gate2gPayload.plannedRejectedPayloadFieldCount === 14, 'Gate 2G payload rejected count mismatch')
assert(boundary.gate2hMayAttempt.boundedLocalSyntheticRouteProof === true, 'Gate 2H bounded proof missing')
assert(boundary.gate2hMayAttempt.workerDispatch === false, 'Gate 2H worker dispatch must be false')
assert(boundary.gate2hMayAttempt.mediaProcessing === false, 'Gate 2H media processing must be false')
assert(boundary.gate2hMayAttempt.externalService === false, 'Gate 2H external service must be false')
assertAllFalse(boundary.currentOwnerReviewExecution, 'current owner review execution')
assert(blockers.blockers.some((row) => row.blockerId === 'controlled_route_execution_proof_pending' && row.status === 'next'), 'Gate 2H next blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_dispatch_not_approved' && row.status === 'blocked'), 'worker dispatch blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2gPlanAcceptedForGate2h === true, 'allowed Gate 2G acceptance claim missing')
assert(policy.allowedClaims.futureGate2hControlledSyntheticRouteProofMayProceed === true, 'allowed Gate 2H claim missing')
assert(policy.allowedClaims.routeExecutionRunInOwnerReview === false, 'route execution in owner review claim must be false')
assertAllFalse(policy.runtimeFlags, 'runtime flag')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')

const gate2hPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof.md')
assert(gate2hPrompt.includes(decision), 'Gate 2H prompt must require owner-review decision')
assert(gate2hPrompt.includes('must not dispatch workers'), 'Gate 2H prompt must prohibit worker dispatch')
const proofOwnerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-review.md')
assert(proofOwnerPrompt.includes(decision), 'proof owner-review prompt must reference decision')
assert(proofOwnerPrompt.includes('avoids worker dispatch'), 'proof owner-review prompt must preserve worker boundary')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-route-execution-plan-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_controlled_route_execution_plan_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr789Verified: true,
  gate2gPlanAcceptedForGate2h: review.reviewResult.gate2gPlanAcceptedForGate2h,
  routeContractCount: review.reviewResult.routeContractCount,
  rejectedPayloadFieldCount: review.reviewResult.rejectedPayloadFieldCount,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInThisOwnerReview,
  workerExecutionRunInOwnerReview: review.reviewResult.workerExecutionRunInThisOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
