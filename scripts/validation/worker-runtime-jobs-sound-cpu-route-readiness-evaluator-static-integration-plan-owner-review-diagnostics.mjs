#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_plan_owner_review_passed_with_warnings_ready_for_static_integration_source_creation'
const gate2pDecision = 'sound_runtime_media_gate_2p_route_readiness_evaluator_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review'
const sourceOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_source_owner_review_passed_with_warnings_ready_for_static_integration_plan'
const sourceHead = 'e31f0c44830bd70edfa87280680646d00b073248'
const pr835MergeCommit = 'fe03149ee0ba6f4ee38f5b183f5750adf440b235'
const evaluatorPath = 'server/workers/sound-cpu/route-readiness-evaluator.mjs'
const integrationPath = 'server/workers/sound-cpu/route-readiness-evaluator-static-integration.mjs'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-boundary-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-review-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-claim-policy'],
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
const gate2p = parseBlock('docs/sound-runtime-media-gate-2p-route-readiness-evaluator-static-integration-plan.md', 'sound-runtime-media-gate-2p-route-readiness-evaluator-static-integration-plan')
const sourceOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-owner-review')

for (const entry of [review, acceptance, boundary, reviewRegister, blockers, policy]) {
  assert(entry.decision === decision, 'static integration owner-review decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr837.status === 'merged', 'PR #837 must be merged')
assert(review.sourceVerification.pr837.mergeCommit === sourceHead, 'PR #837 merge commit mismatch')
assert(review.sourceVerification.pr837.decision === gate2pDecision, 'PR #837 decision mismatch')
assert(review.sourceVerification.pr835.status === 'merged', 'PR #835 must be merged')
assert(review.sourceVerification.pr835.mergeCommit === pr835MergeCommit, 'PR #835 merge commit mismatch')
assert(review.sourceVerification.pr835.decision === sourceOwnerDecision, 'PR #835 decision mismatch')
assert(gate2p.decision === gate2pDecision, 'Gate 2P decision mismatch')
assert(sourceOwner.decision === sourceOwnerDecision, 'source owner decision mismatch')

assert(fs.existsSync(path.join(root, evaluatorPath)), 'evaluator source must exist')
assert(!fs.existsSync(path.join(root, integrationPath)), 'integration source must not exist in owner review')
assert(review.reviewResult.gate2pStaticIntegrationPlanAcceptedForSourceCreation === true, 'Gate 2P plan acceptance missing')
assert(review.reviewResult.evaluatorSourcePath === evaluatorPath, 'evaluator source path mismatch')
assert(review.reviewResult.plannedIntegrationSourcePath === integrationPath, 'integration source path mismatch')
for (const key of [
  'integrationSourceCreatedInOwnerReview',
  'evaluatorImportedInOwnerReview',
  'routeResolverImportedInOwnerReview',
  'routeExecutionRunInOwnerReview',
  'workerExecutionRunInOwnerReview',
  'acceptedForRouteExecutionToday',
  'acceptedForRouteReadinessToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(review.reviewResult[key] === false, `reviewResult.${key} must remain false`)
}

assert(acceptance.acceptedSourceDecision === gate2pDecision, 'accepted source decision mismatch')
assert(acceptance.acceptedForFutureStaticIntegrationSourceCreationOnly === true, 'future integration source only missing')
assert(acceptance.acceptedIntegrationPlan.plannedIntegrationSourcePath === integrationPath, 'accepted integration path mismatch')
assertAllFalse(acceptance.acceptedForExecutionToday, 'accepted for execution today')
assert(boundary.futureGate2qMayAttempt.staticIntegrationSourceCreation === true, 'Gate 2Q source creation missing')
assert(boundary.futureGate2qMayAttempt.nodeBuiltinsOnlyStaticIntegration === true, 'Gate 2Q builtins guard missing')
assert(boundary.futureGate2qMayAttempt.staticFixtureWiring === true, 'Gate 2Q fixture wiring missing')
assert(boundary.futureGate2qMayAttempt.evaluatorImportPlanningOnly === true, 'Gate 2Q evaluator import planning missing')
for (const [key, value] of Object.entries(boundary.futureGate2qMayAttempt)) {
  if (!['staticIntegrationSourceCreation', 'nodeBuiltinsOnlyStaticIntegration', 'staticFixtureWiring', 'evaluatorImportPlanningOnly'].includes(key)) {
    assert(value === false, `futureGate2qMayAttempt.${key} must remain false`)
  }
}
assertAllFalse(boundary.currentOwnerReviewExecution, 'current owner review execution')
assert(reviewRegister.acceptedEvidence.gate2pStaticIntegrationBoundaryPlanned === true, 'Gate 2P evidence missing')
assert(reviewRegister.acceptedEvidence.integrationSourceCreated === false, 'integration source evidence must remain false')
assert(blockers.blockers.some((row) => row.blockerId === 'static_integration_source_creation_pending' && row.status === 'next'), 'Gate 2Q next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2pStaticIntegrationPlanAcceptedForSourceCreation === true, 'allowed Gate 2P claim missing')
assert(policy.allowedClaims.futureStaticIntegrationSourceCreationMayProceed === true, 'allowed Gate 2Q claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2q-route-readiness-evaluator-static-integration-source-creation.md')
assert(nextPrompt.includes(decision), 'Gate 2Q prompt must require owner-review decision')
assert(nextPrompt.includes('no execution'), 'Gate 2Q prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-readiness-evaluator-static-integration-plan-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_plan_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr837Verified: true,
  gate2pStaticIntegrationPlanAcceptedForSourceCreation: review.reviewResult.gate2pStaticIntegrationPlanAcceptedForSourceCreation,
  plannedIntegrationSourcePath: review.reviewResult.plannedIntegrationSourcePath,
  integrationSourceCreatedInOwnerReview: review.reviewResult.integrationSourceCreatedInOwnerReview,
  evaluatorImportedInOwnerReview: review.reviewResult.evaluatorImportedInOwnerReview,
  routeResolverImportedInOwnerReview: review.reviewResult.routeResolverImportedInOwnerReview,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
