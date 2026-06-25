#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_controlled_route_execution_proof_owner_review_passed_with_warnings_ready_for_route_fixture_hardening_plan'
const gate2hDecision = 'sound_runtime_media_gate_2h_controlled_synthetic_route_execution_proof_passed_with_warnings_ready_for_proof_owner_review'
const planOwnerDecision = 'worker_runtime_jobs_sound_cpu_controlled_route_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_route_execution_proof'
const sourceHead = '440aebfdd38b0274bae0200005e8b18f5b8f8f81'
const pr793MergeCommit = '78500c700920dadbe4078ce8a852bc803c82c306'
const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-evidence-review-register.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-evidence-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-boundary-review-register.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-boundary-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-claim-policy'],
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

const review = parseBlock(docs[0][0], docs[0][1])
const acceptance = parseBlock(docs[1][0], docs[1][1])
const evidence = parseBlock(docs[2][0], docs[2][1])
const boundary = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2h = parseBlock('docs/sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof-result.md', 'sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof-result')
const gate2hReport = parseBlock('docs/sound-runtime-media-gate-2h-route-proof-execution-report.md', 'sound-runtime-media-gate-2h-route-proof-execution-report')
const gate2hRejection = parseBlock('docs/sound-runtime-media-gate-2h-rejection-proof-register.md', 'sound-runtime-media-gate-2h-rejection-proof-register')
const gate2hPolicy = parseBlock('docs/sound-runtime-media-gate-2h-runtime-claim-policy.md', 'sound-runtime-media-gate-2h-runtime-claim-policy')
const planOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-review.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-review')

for (const entry of [review, acceptance, evidence, boundary, blockers, policy]) {
  assert(entry.decision === decision, 'owner proof review decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr800.status === 'merged', 'PR #800 must be merged')
assert(review.sourceVerification.pr800.mergeCommit === sourceHead, 'PR #800 merge commit mismatch')
assert(review.sourceVerification.pr800.decision === gate2hDecision, 'PR #800 decision mismatch')
assert(review.sourceVerification.pr793.status === 'merged', 'PR #793 must be merged')
assert(review.sourceVerification.pr793.mergeCommit === pr793MergeCommit, 'PR #793 merge commit mismatch')
assert(review.sourceVerification.pr793.decision === planOwnerDecision, 'PR #793 decision mismatch')
assert(gate2h.decision === gate2hDecision, 'Gate 2H decision mismatch')
assert(planOwner.decision === planOwnerDecision, 'plan owner decision mismatch')

assert(review.reviewResult.gate2hProofAcceptedForFixtureHardeningPlan === true, 'Gate 2H proof must be accepted')
assert(review.reviewResult.futureGate2iFixtureHardeningPlanMayProceed === true, 'Gate 2I may proceed missing')
assert(review.reviewResult.syntheticRouteResolverExecutedInGate2h === true, 'Gate 2H route resolver proof missing')
assert(review.reviewResult.routeExecutionRunInThisOwnerReview === false, 'owner review must not rerun route proof')
assert(review.reviewResult.serverRouteExecutedInGate2h === false, 'server route must remain false')
assert(review.reviewResult.workerExecutionRunInGate2h === false, 'worker execution must remain false')
assert(review.reviewResult.workerExecutionRunInThisOwnerReview === false, 'worker execution in owner review must remain false')
assert(review.reviewResult.routeContractCount === 4, 'route contract count mismatch')
assert(review.reviewResult.acceptedRouteResultCount === 4, 'accepted route result count mismatch')
assert(review.reviewResult.rejectedPayloadFieldCount === 14, 'rejected payload field count mismatch')
assert(review.reviewResult.rejectedPayloadCaseCount === 14, 'rejected payload case count mismatch')
assert(review.reviewResult.mismatchCaseCount === 5, 'mismatch case count mismatch')
assert(review.reviewResult.acceptedForWorkerExecutionToday === false, 'worker execution today must be false')
assert(review.reviewResult.acceptedForMediaOrRuntimeReadinessToday === false, 'media/runtime readiness today must be false')
assert(review.reviewResult.acceptedForBetaOrProductionToday === false, 'beta/production today must be false')

assert(acceptance.acceptedProofDecision === gate2hDecision, 'accepted proof decision mismatch')
assert(acceptance.acceptedForFutureGate2iOnly === true, 'Gate 2I-only acceptance missing')
assert(acceptance.acceptedProofMode === 'local_in_memory_synthetic_route_resolver_only', 'proof mode mismatch')
assert(acceptance.acceptedProofCounts.routeContractCount === 4, 'accepted contract count mismatch')
assert(acceptance.acceptedProofCounts.rejectedPayloadFieldCount === 14, 'accepted rejected field count mismatch')
assert(acceptance.acceptedProofCounts.mismatchCaseCount === 5, 'accepted mismatch count mismatch')
includesAll(acceptance.acceptedJobTypes, jobTypes, 'accepted job types')
for (const key of [
  'acceptedForRouteExecutionInThisOwnerReview',
  'acceptedForWorkerDispatchToday',
  'acceptedForWorkerExecutionToday',
  'acceptedForMediaProcessingToday',
  'acceptedForDockerOrGcpToday',
  'acceptedForSupabaseOrSqlToday',
  'acceptedForArtifactsToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(acceptance[key] === false, `${key} must remain false`)
}

assert(evidence.acceptedEvidence.sourceImported === true, 'source import evidence missing')
assert(evidence.acceptedEvidence.routeResolverImported === true, 'route resolver import evidence missing')
assert(evidence.acceptedEvidence.syntheticRouteResolverExecuted === true, 'synthetic route resolver evidence missing')
assert(evidence.acceptedEvidence.proofPassed === true, 'proof passed evidence missing')
assert(evidence.acceptedEvidence.serverRouteExecuted === false, 'server route must be false')
assert(evidence.acceptedEvidence.workerDispatchRun === false, 'worker dispatch must be false')
assert(evidence.acceptedEvidence.workerExecutionRun === false, 'worker execution must be false')
assert(evidence.acceptedEvidence.mediaProcessingRun === false, 'media processing must be false')
assert(evidence.acceptedEvidence.externalServiceTouched === false, 'external service must be false')
assert(evidence.acceptedEvidence.supabaseTouched === false, 'Supabase must be false')
assert(evidence.acceptedEvidence.sqlExecuted === false, 'SQL must be false')
assert(evidence.acceptedEvidence.artifactCreated === false, 'artifact must be false')

assert(gate2h.proofMode === 'local_in_memory_synthetic_route_resolver_only', 'Gate 2H proof mode mismatch')
assert(gate2h.proofPassed === true, 'Gate 2H proof passed missing')
assert(gate2h.syntheticRouteResolverExecuted === true, 'Gate 2H synthetic route resolver missing')
assert(gate2h.serverRouteExecuted === false, 'Gate 2H server route must be false')
assert(gate2h.workerExecutionRun === false, 'Gate 2H worker execution must be false')
assert(gate2h.mediaProcessingRun === false, 'Gate 2H media processing must be false')
assert(gate2h.supabaseTouched === false, 'Gate 2H Supabase must be false')
assert(gate2h.sqlExecuted === false, 'Gate 2H SQL must be false')
assert(gate2h.artifactCreated === false, 'Gate 2H artifact must be false')
assert(gate2hReport.routeContractCount === 4, 'Gate 2H report contract count mismatch')
assert(gate2hReport.acceptedRouteResultCount === 4, 'Gate 2H report accepted count mismatch')
assert(gate2hReport.rejectedPayloadFieldCount === 14, 'Gate 2H report rejected field count mismatch')
assert(gate2hReport.rejectedPayloadCaseCount === 14, 'Gate 2H report rejected case count mismatch')
assert(gate2hReport.mismatchCaseCount === 5, 'Gate 2H report mismatch count mismatch')
assert(gate2hReport.serverRouteExecuted === false, 'Gate 2H report server route must be false')
assert(gate2hReport.workerDispatchRun === false, 'Gate 2H report worker dispatch must be false')
assert(gate2hReport.workerExecutionRun === false, 'Gate 2H report worker execution must be false')
assert(gate2hReport.toolExecutionRun === false, 'Gate 2H report tool execution must be false')
assert(gate2hReport.mediaProcessingRun === false, 'Gate 2H report media processing must be false')
assert(gate2hReport.externalServiceTouched === false, 'Gate 2H report external service must be false')
assert(gate2hRejection.rejectedPayloadFieldCount === 14, 'Gate 2H rejection count mismatch')
assert(gate2hRejection.rejectedPayloadFieldsValidated.length === 14, 'Gate 2H rejected payload list mismatch')
assert(gate2hRejection.mismatchCasesValidated.length === 5, 'Gate 2H mismatch list mismatch')
assert(gate2hPolicy.allowedClaims.syntheticRouteResolverExecuted === true, 'Gate 2H policy must allow synthetic resolver claim')
assert(gate2hPolicy.allowedClaims.serverRouteExecuted === false, 'Gate 2H policy server route must be false')
assertAllFalse(gate2hPolicy.runtimeFlags, 'Gate 2H runtime flag')

assert(boundary.gate2hAcceptedBoundary.localInMemorySyntheticRouteResolverOnly === true, 'accepted Gate 2H local boundary missing')
for (const [key, value] of Object.entries(boundary.gate2hAcceptedBoundary)) {
  if (key !== 'localInMemorySyntheticRouteResolverOnly') {
    assert(value === false, `gate2hAcceptedBoundary.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentOwnerReviewExecution, 'current owner review execution')
assert(boundary.futureGate2iBoundary.fixtureHardeningPlanMayProceed === true, 'Gate 2I fixture plan missing')
for (const [key, value] of Object.entries(boundary.futureGate2iBoundary)) {
  if (key !== 'fixtureHardeningPlanMayProceed') {
    assert(value === false, `futureGate2iBoundary.${key} must remain false`)
  }
}

assert(blockers.blockers.some((row) => row.blockerId === 'route_fixture_hardening_plan_pending' && row.status === 'next'), 'Gate 2I next blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_dispatch_not_approved' && row.status === 'blocked'), 'worker dispatch blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2hProofAcceptedForFixtureHardeningPlan === true, 'allowed Gate 2H acceptance claim missing')
assert(policy.allowedClaims.futureGate2iFixtureHardeningPlanMayProceed === true, 'allowed Gate 2I claim missing')
assert(policy.allowedClaims.routeExecutionRunInOwnerReview === false, 'route execution in owner review claim must be false')
assert(policy.allowedClaims.workerExecutionRunInOwnerReview === false, 'worker execution in owner review claim must be false')
assertAllFalse(policy.runtimeFlags, 'runtime flag')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')

const gate2iPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2i-controlled-route-fixture-hardening-plan.md')
assert(gate2iPrompt.includes(decision), 'Gate 2I prompt must require owner proof review decision')
assert(gate2iPrompt.includes('no execution'), 'Gate 2I prompt must remain no execution')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-route-execution-proof-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_controlled_route_execution_proof_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr800Verified: true,
  gate2hProofAcceptedForFixtureHardeningPlan: review.reviewResult.gate2hProofAcceptedForFixtureHardeningPlan,
  routeContractCount: review.reviewResult.routeContractCount,
  acceptedRouteResultCount: review.reviewResult.acceptedRouteResultCount,
  rejectedPayloadFieldCount: review.reviewResult.rejectedPayloadFieldCount,
  mismatchCaseCount: review.reviewResult.mismatchCaseCount,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInThisOwnerReview,
  workerExecutionRunInOwnerReview: review.reviewResult.workerExecutionRunInThisOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
