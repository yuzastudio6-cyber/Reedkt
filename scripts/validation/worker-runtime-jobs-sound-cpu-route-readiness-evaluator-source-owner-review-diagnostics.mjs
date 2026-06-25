#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_source_owner_review_passed_with_warnings_ready_for_static_integration_plan'
const gate2oDecision = 'sound_runtime_media_gate_2o_actual_route_readiness_evaluator_source_created_with_warnings_ready_for_source_owner_review'
const sourcePlanOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_source_creation_plan_owner_review_passed_with_warnings_ready_for_actual_evaluator_source_creation'
const sourceHead = 'c013169d226ede36e92fc1a448f3ed99e7bb3ad5'
const pr830MergeCommit = '24dbf1f4efded0a7bc0c654e3b5b600d84d5eb1a'
const evaluatorPath = 'server/workers/sound-cpu/route-readiness-evaluator.mjs'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-readiness-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-readiness-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-safety-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-safety-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-claim-policy'],
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
const readiness = parseBlock(docs[2][0], docs[2][1])
const safety = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2o = parseBlock('docs/sound-runtime-media-gate-2o-actual-route-readiness-evaluator-source-result.md', 'sound-runtime-media-gate-2o-actual-route-readiness-evaluator-source-result')
const sourcePlanOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-creation-plan-owner-review')

for (const entry of [review, acceptance, readiness, safety, blockers, policy]) {
  assert(entry.decision === decision, 'source owner-review decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr834.status === 'merged', 'PR #834 must be merged')
assert(review.sourceVerification.pr834.mergeCommit === sourceHead, 'PR #834 merge commit mismatch')
assert(review.sourceVerification.pr834.decision === gate2oDecision, 'PR #834 decision mismatch')
assert(review.sourceVerification.pr830.status === 'merged', 'PR #830 must be merged')
assert(review.sourceVerification.pr830.mergeCommit === pr830MergeCommit, 'PR #830 merge commit mismatch')
assert(review.sourceVerification.pr830.decision === sourcePlanOwnerDecision, 'PR #830 decision mismatch')
assert(gate2o.decision === gate2oDecision, 'Gate 2O decision mismatch')
assert(sourcePlanOwner.decision === sourcePlanOwnerDecision, 'source plan owner decision mismatch')

assert(review.reviewResult.gate2oStaticEvaluatorSourceAcceptedForStaticIntegrationPlanning === true, 'source acceptance missing')
assert(review.reviewResult.evaluatorSourcePath === evaluatorPath, 'source path mismatch')
assert(review.reviewResult.sourceImportedInOwnerReview === false, 'source must not be imported')
assert(review.reviewResult.routeResolverImportedInOwnerReview === false, 'route resolver must not be imported')
assert(review.reviewResult.routeExecutionRunInOwnerReview === false, 'route execution must remain false')
assert(review.reviewResult.workerExecutionRunInOwnerReview === false, 'worker execution must remain false')
assert(review.reviewResult.toolExecutionRunInOwnerReview === false, 'tool execution must remain false')
assert(review.reviewResult.acceptedForStaticIntegrationPlanningOnly === true, 'static integration planning acceptance missing')
for (const key of ['acceptedForRouteExecutionToday', 'acceptedForRouteReadinessToday', 'acceptedForRuntimeReadinessToday', 'acceptedForBetaOrProductionToday']) {
  assert(review.reviewResult[key] === false, `reviewResult.${key} must remain false`)
}

const sourceFile = path.join(root, evaluatorPath)
assert(fs.existsSync(sourceFile), 'evaluator source file missing')
const sourceText = fs.readFileSync(sourceFile, 'utf8')
assert(sourceText.includes('SOUND-RUNTIME-MEDIA-GATE-2O'), 'source missing Gate 2O marker')
assert(sourceText.includes('readinessClaim: false'), 'source readiness claim must remain false')
assert(!/(^|\n)\s*import\s+/.test(sourceText), 'source must not import dependencies')
assert(!/\brequire\s*\(/.test(sourceText), 'source must not require dependencies')
assert(!/\bfetch\s*\(/.test(sourceText), 'source must not call fetch')
assert(!/child_process|execFile|execSync|spawn|spawnSync|new\s+Worker|process\.env|Deno\.|Bun\./i.test(sourceText), 'source contains prohibited runtime execution marker')

assert(acceptance.acceptedSourceDecision === gate2oDecision, 'accepted source decision mismatch')
assert(acceptance.acceptedForStaticIntegrationPlanningOnly === true, 'acceptance must be planning-only')
assert(acceptance.acceptedSource.path === evaluatorPath, 'acceptance path mismatch')
assert(acceptance.acceptedSource.failClosedReadinessClaim === true, 'fail-closed claim missing')
assertAllFalse(acceptance.acceptedForExecutionToday, 'accepted for execution today')
assert(readiness.staticIntegrationPlanningMayProceed.planStaticImportBoundary === true, 'static import boundary planning missing')
assert(readiness.staticIntegrationPlanningMayProceed.planStaticFixtureWiring === true, 'static fixture wiring missing')
assert(readiness.staticIntegrationPlanningMayProceed.planNoExecutionDiagnostics === true, 'no-execution diagnostics planning missing')
for (const [key, value] of Object.entries(readiness.staticIntegrationPlanningMayProceed)) {
  if (!['planStaticImportBoundary', 'planStaticFixtureWiring', 'planNoExecutionDiagnostics'].includes(key)) {
    assert(value === false, `staticIntegrationPlanningMayProceed.${key} must remain false`)
  }
}
assert(safety.sourceSafety.sourceExists === true, 'safety source exists missing')
assert(safety.sourceSafety.sourceImportedInOwnerReview === false, 'source import safety must remain false')
assert(safety.sourceSafety.readinessClaimDefault === false, 'readiness default must remain false')
assert(blockers.blockers.some((row) => row.blockerId === 'static_integration_plan_pending' && row.status === 'next'), 'static integration next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2oStaticEvaluatorSourceAcceptedForStaticIntegrationPlanning === true, 'allowed source acceptance claim missing')
assert(policy.allowedClaims.staticIntegrationPlanningMayProceed === true, 'allowed static integration claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2p-route-readiness-evaluator-static-integration-plan.md')
assert(nextPrompt.includes(decision), 'Gate 2P prompt must require owner-review decision')
assert(nextPrompt.includes('no execution'), 'Gate 2P prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-readiness-evaluator-source-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-source-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_source_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr834Verified: true,
  gate2oStaticEvaluatorSourceAcceptedForStaticIntegrationPlanning: review.reviewResult.gate2oStaticEvaluatorSourceAcceptedForStaticIntegrationPlanning,
  evaluatorSourcePath: review.reviewResult.evaluatorSourcePath,
  sourceImportedInOwnerReview: review.reviewResult.sourceImportedInOwnerReview,
  routeResolverImportedInOwnerReview: review.reviewResult.routeResolverImportedInOwnerReview,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
