#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2g_controlled_synthetic_route_execution_plan_completed_with_warnings_ready_for_execution_plan_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_synthetic_route_source_validation_owner_review_passed_with_warnings_ready_for_controlled_route_execution_planning'
const gate2fDecision = 'sound_runtime_media_gate_2f_controlled_synthetic_route_source_validation_passed_with_warnings_ready_for_validation_owner_review'
const sourceHead = '73b357c698f143a16a421cb830de2ff11b341c16'
const pr777MergeCommit = '1952b53aa7e8302a5ae6fc5558843e24e227d0d5'
const docs = [
  ['docs/sound-runtime-media-gate-2g-controlled-synthetic-route-execution-plan-result.md', 'sound-runtime-media-gate-2g-controlled-synthetic-route-execution-plan-result'],
  ['docs/sound-runtime-media-gate-2g-route-execution-proof-plan-register.md', 'sound-runtime-media-gate-2g-route-execution-proof-plan-register'],
  ['docs/sound-runtime-media-gate-2g-synthetic-payload-plan-register.md', 'sound-runtime-media-gate-2g-synthetic-payload-plan-register'],
  ['docs/sound-runtime-media-gate-2g-execution-safety-boundary-register.md', 'sound-runtime-media-gate-2g-execution-safety-boundary-register'],
  ['docs/sound-runtime-media-gate-2g-blocked-execution-register.md', 'sound-runtime-media-gate-2g-blocked-execution-register'],
  ['docs/sound-runtime-media-gate-2g-runtime-claim-policy.md', 'sound-runtime-media-gate-2g-runtime-claim-policy'],
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

const result = parseBlock(docs[0][0], docs[0][1])
const proofPlan = parseBlock(docs[1][0], docs[1][1])
const payloadPlan = parseBlock(docs[2][0], docs[2][1])
const boundary = parseBlock(docs[3][0], docs[3][1])
const blocked = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-review')
const ownerClaimPolicy = parseBlock('docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-claim-policy')
const gate2fResult = parseBlock('docs/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result.md', 'sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result')
const gate2fRunner = parseBlock('docs/sound-runtime-media-gate-2f-validation-runner-report.md', 'sound-runtime-media-gate-2f-validation-runner-report')

for (const entry of [result, proofPlan, payloadPlan, boundary, blocked, policy]) {
  assert(entry.decision === decision, 'Gate 2G decision mismatch')
}
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr782.status === 'merged', 'PR #782 must be merged')
assert(result.sourceVerification.pr782.mergeCommit === sourceHead, 'PR #782 merge commit mismatch')
assert(result.sourceVerification.pr782.decision === ownerDecision, 'PR #782 decision mismatch')
assert(result.sourceVerification.pr777.mergeCommit === pr777MergeCommit, 'PR #777 merge commit mismatch')
assert(result.sourceVerification.pr777.decision === gate2fDecision, 'PR #777 decision mismatch')
assert(result.planningMode === 'controlled_synthetic_route_execution_proof_plan_only', 'planning mode mismatch')
assert(result.planCreated === true, 'plan must be created')
assert(result.sourceImported === false, 'source import must remain false')
assert(result.workerExecutionRun === false, 'worker execution must remain false')
assert(result.routeExecutionRun === false, 'route execution must remain false')
assert(result.supabaseTouched === false, 'Supabase must remain untouched')
assert(result.sqlExecuted === false, 'SQL must remain false')

assert(ownerReview.decision === ownerDecision, 'owner review source decision mismatch')
assert(ownerReview.sourceVerification.pr777.mergeCommit === pr777MergeCommit, 'owner review PR #777 commit mismatch')
assert(ownerClaimPolicy.allowedClaims.controlledRouteExecutionPlanningMayProceed === true, 'owner claim policy must allow planning')
assert(gate2fResult.decision === gate2fDecision, 'Gate 2F decision mismatch')
assert(gate2fRunner.sourceImported === false, 'Gate 2F runner source import mismatch')
assert(gate2fRunner.routeContractCount === 4, 'Gate 2F route count mismatch')
assert(gate2fRunner.rejectedPayloadFieldCount === 14, 'Gate 2F rejected count mismatch')
assert(gate2fRunner.runtimeFlagFalseCount === 15, 'Gate 2F false flag count mismatch')

assert(proofPlan.futureProofStatus === 'planned_not_executed', 'future proof must not execute')
assert(proofPlan.futureRouteExecutionAuthorizedByGate2g === false, 'Gate 2G cannot authorize route execution')
assert(proofPlan.sourceFilesImportedInGate2g === false, 'Gate 2G must not import source files')
includesAll(proofPlan.plannedRouteContracts, jobTypes, 'planned route contracts')
includesAll(proofPlan.sourceFilesInScope, sourceFiles, 'source files in scope')

assert(payloadPlan.payloadMode === 'static_in_memory_synthetic_only', 'payload mode mismatch')
assert(payloadPlan.plannedRejectedPayloadFieldCount === 14, 'planned rejected field count mismatch')
assert(payloadPlan.plannedRuntimeFalseFlagCount === 15, 'planned runtime false flag count mismatch')
assert(payloadPlan.payloadsCreatedInGate2g === false, 'payloads must not be created in Gate 2G')
assert(payloadPlan.payloadsExecutedInGate2g === false, 'payloads must not execute in Gate 2G')
includesAll(payloadPlan.plannedAcceptedJobTypes, jobTypes, 'planned accepted job types')
includesAll(payloadPlan.rejectedPayloadSources, ['rawPrompt', 'signedUrl', 'mediaPath', 'serviceRoleKey', 'databaseUrl', 'artifactWriteTarget', 'dockerCommand'], 'rejected payload sources')

assert(boundary.ownerReviewRequiredBeforeAnyExecution === true, 'owner review before execution required')
assertAllFalse(boundary.plannedExecutionBoundary, 'planned execution boundary')
assert(boundary.futureProofMustRemain.includes('synthetic'), 'future proof must remain synthetic')
assert(blocked.blockers.some((row) => row.blockerId === 'execution_plan_owner_review_pending' && row.status === 'next'), 'owner review next blocker missing')
assert(blocked.blockers.some((row) => row.blockerId === 'controlled_route_execution_proof_not_authorized' && row.status === 'blocked'), 'route proof blocker missing')
assertAllFalse(blocked.blockedExecution, 'blocked execution')
assert(policy.allowedClaims.controlledSyntheticRouteExecutionPlanCreated === true, 'allowed plan claim missing')
assert(policy.allowedClaims.routeExecutionRun === false, 'route execution allowed claim must be false')
assert(policy.allowedClaims.workerExecutionRun === false, 'worker execution allowed claim must be false')
assertAllFalse(policy.runtimeFlags, 'runtime flags')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')

const ownerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-review.md')
assert(ownerPrompt.includes(decision), 'owner-review prompt must require Gate 2G decision')
assert(ownerPrompt.includes('Do not approve worker dispatch'), 'owner-review prompt must prohibit execution approval')
const gate2hPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof.md')
assert(gate2hPrompt.includes('owner review'), 'Gate 2H prompt must require owner review')
assert(gate2hPrompt.includes('must not dispatch workers'), 'Gate 2H prompt must prohibit worker dispatch')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2g:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2g-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2g_diagnostics_passed',
  decision,
  sourceHead,
  pr782Verified: true,
  plannedRouteContracts: proofPlan.plannedRouteContracts.length,
  rejectedPayloadFieldCount: payloadPlan.plannedRejectedPayloadFieldCount,
  routeExecutionRun: result.routeExecutionRun,
  workerExecutionRun: result.workerExecutionRun,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-ROUTE-EXECUTION-PLAN-OWNER-REVIEW: review controlled synthetic route execution plan, no execution',
}, null, 2))
