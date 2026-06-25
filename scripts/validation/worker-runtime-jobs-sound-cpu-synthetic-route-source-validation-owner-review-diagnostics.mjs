#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_synthetic_route_source_validation_owner_review_passed_with_warnings_ready_for_controlled_route_execution_planning'
const gate2fDecision = 'sound_runtime_media_gate_2f_controlled_synthetic_route_source_validation_passed_with_warnings_ready_for_validation_owner_review'
const gate2eDecision = 'sound_runtime_media_gate_2e_actual_synthetic_worker_route_source_created_with_warnings_ready_for_source_owner_review'
const pr777MergeCommit = '1952b53aa7e8302a5ae6fc5558843e24e227d0d5'
const pr772MergeCommit = '2690dec6bd5c9517fa61d21bf49b3d5bb9a6716e'
const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-runner-evidence-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-runner-evidence-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-execution-boundary-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-execution-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-claim-policy'],
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
const runnerEvidence = parseBlock(docs[2][0], docs[2][1])
const boundary = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2fResult = parseBlock('docs/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result.md', 'sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result')
const gate2fRunner = parseBlock('docs/sound-runtime-media-gate-2f-validation-runner-report.md', 'sound-runtime-media-gate-2f-validation-runner-report')
const gate2fContracts = parseBlock('docs/sound-runtime-media-gate-2f-contract-validation-register.md', 'sound-runtime-media-gate-2f-contract-validation-register')
const gate2fPolicy = parseBlock('docs/sound-runtime-media-gate-2f-runtime-claim-policy.md', 'sound-runtime-media-gate-2f-runtime-claim-policy')
const gate2e = parseBlock('docs/sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result.md', 'sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result')
const sourceOwnerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-review')

for (const entry of [review, acceptance, runnerEvidence, boundary, blockers, policy]) {
  assert(entry.decision === decision, 'owner validation decision mismatch')
}
assert(review.sourceVerification.sourceHead === pr777MergeCommit, 'source head mismatch')
assert(review.sourceVerification.pr777.status === 'merged', 'PR #777 must be merged')
assert(review.sourceVerification.pr777.mergeCommit === pr777MergeCommit, 'PR #777 merge commit mismatch')
assert(review.sourceVerification.pr777.decision === gate2fDecision, 'PR #777 decision mismatch')
assert(review.sourceVerification.pr772.status === 'merged', 'PR #772 must be merged')
assert(review.sourceVerification.pr772.mergeCommit === pr772MergeCommit, 'PR #772 merge commit mismatch')
assert(review.sourceVerification.pr772.decision === sourceOwnerReview.decision, 'PR #772 owner decision mismatch')
assert(review.sourceVerification.gate2eDecision === gate2eDecision, 'Gate 2E decision mismatch')

assert(gate2fResult.decision === gate2fDecision, 'Gate 2F decision mismatch')
assert(gate2fResult.validationPassed === true, 'Gate 2F validation must pass')
assert(gate2fResult.sourceImported === false, 'Gate 2F source import must be false')
assert(gate2fResult.workerExecutionRun === false, 'Gate 2F worker execution must be false')
assert(gate2fResult.routeExecutionRun === false, 'Gate 2F route execution must be false')
assert(gate2fRunner.runnerMode === 'node_builtins_static_source_read', 'Gate 2F runner mode mismatch')
assert(gate2fRunner.sourceImported === false, 'Gate 2F runner source import mismatch')
assert(gate2fRunner.routeContractCount === 4, 'Gate 2F route count mismatch')
assert(gate2fRunner.rejectedPayloadFieldCount === 14, 'Gate 2F rejection count mismatch')
assert(gate2fRunner.runtimeFlagFalseCount === 15, 'Gate 2F runtime flag count mismatch')
assert(gate2fRunner.unsafeSourceImportsDetected === false, 'Gate 2F unsafe imports detected')
assert(gate2e.decision === gate2eDecision, 'Gate 2E decision mismatch')

assert(review.reviewResult.validationAcceptedForFuturePlanning === true, 'validation must be accepted for future planning')
assert(review.reviewResult.validationModeAccepted === 'static_source_and_synthetic_contract_validation', 'validation mode mismatch')
assert(review.reviewResult.sourceImported === false, 'review sourceImported mismatch')
assert(review.reviewResult.sourceFilesValidated === 3, 'review source file count mismatch')
assert(review.reviewResult.routeContractCount === 4, 'review route contract count mismatch')
assert(review.reviewResult.rejectedPayloadFieldCount === 14, 'review rejected field count mismatch')
assert(review.reviewResult.runtimeFlagFalseCount === 15, 'review runtime false count mismatch')
assert(review.reviewResult.workerExecutionApprovedToday === false, 'worker execution approval must be false')
assert(review.reviewResult.routeExecutionApprovedToday === false, 'route execution approval must be false')
assert(review.reviewResult.betaOrProductionApprovedToday === false, 'beta/production approval must be false')

assert(acceptance.acceptedSourceValidationDecision === gate2fDecision, 'accepted source validation decision mismatch')
includesAll(acceptance.acceptedSourceFiles, sourceFiles, 'accepted source files')
includesAll(acceptance.acceptedJobTypes, jobTypes, 'accepted job types')
assert(acceptance.acceptedForControlledRouteExecutionPlanning === true, 'route execution planning must be accepted')
assert(acceptance.acceptedForControlledRouteExecutionToday === false, 'route execution today must remain false')
assert(acceptance.acceptedForWorkerExecutionToday === false, 'worker execution today must remain false')
assert(acceptance.acceptedForToolExecutionToday === false, 'tool execution today must remain false')
assert(acceptance.acceptedForBetaUnlockToday === false, 'beta unlock today must remain false')
assert(acceptance.acceptedValidationProperties.nodeBuiltinsOnly === true, 'validation must be node built-ins only')
assert(acceptance.acceptedValidationProperties.staticSourceReadOnly === true, 'validation must be static source read only')
assert(acceptance.acceptedValidationProperties.sourceImported === false, 'accepted validation source import mismatch')

assert(runnerEvidence.runnerEvidence.runner === 'scripts/validation/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-runner.mjs', 'runner path mismatch')
assert(runnerEvidence.runnerEvidence.validationPassed === true, 'runner evidence must pass')
assert(runnerEvidence.runnerEvidence.sourceImported === false, 'runner evidence source import mismatch')
assert(runnerEvidence.runnerEvidence.routeContractCount === gate2fRunner.routeContractCount, 'runner route count mismatch')
assert(runnerEvidence.runnerEvidence.rejectedPayloadFieldCount === gate2fRunner.rejectedPayloadFieldCount, 'runner rejected field count mismatch')
assert(runnerEvidence.runnerEvidence.runtimeFlagFalseCount === gate2fRunner.runtimeFlagFalseCount, 'runner false flag count mismatch')
includesAll(runnerEvidence.runnerEvidence.sourceFilesValidated, sourceFiles, 'runner source files')
includesAll(gate2fContracts.validatedContracts, jobTypes, 'Gate 2F contracts')
assert(gate2fContracts.acceptedForExecution === false, 'Gate 2F contracts must not be accepted for execution')

assert(boundary.acceptedBoundaryForNextPlanning.routePlanningMayProceed === true, 'route planning may proceed missing')
assert(boundary.acceptedBoundaryForNextPlanning.mustRemainNoExecution === true, 'no-execution boundary missing')
assert(boundary.acceptedBoundaryForNextPlanning.mustRequireOwnerReviewBeforeExecution === true, 'owner review before execution missing')
assertAllFalse(boundary.closedExecutionAreas, 'closed execution area')
for (const [claim, value] of Object.entries(boundary.readinessClaims)) {
  assert(value === 'unclaimed', `${claim} must remain unclaimed`)
}

assert(blockers.blockers.some((row) => row.blockerId === 'controlled_route_execution_plan_pending' && row.status === 'next'), 'next route planning blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'route_execution_owner_review_required' && row.status === 'blocked'), 'route execution owner blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.allowedClaims.gate2fStaticSourceValidationAccepted === true, 'allowed validation acceptance claim missing')
assert(policy.allowedClaims.controlledRouteExecutionPlanningMayProceed === true, 'allowed planning claim missing')
assert(policy.allowedClaims.routeExecutionRun === false, 'route execution claim must be false')
assert(policy.allowedClaims.workerExecutionRun === false, 'worker execution claim must be false')
assertAllFalse(policy.runtimeFlags, 'runtime flag')
assert(policy.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')

for (const [key, value] of Object.entries(gate2fPolicy.runtimeFlags)) {
  assert(value === false, `Gate 2F policy ${key} must remain false`)
}

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2g-controlled-synthetic-route-execution-plan.md')
assert(nextPrompt.includes(decision), 'Gate 2G prompt must require owner-review decision')
assert(nextPrompt.includes('planning-only'), 'Gate 2G prompt must remain planning-only')
assert(nextPrompt.includes('Do not execute workers'), 'Gate 2G prompt must prohibit execution')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-synthetic-route-source-validation-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_synthetic_route_source_validation_owner_review_diagnostics_passed',
  decision,
  sourceHead: pr777MergeCommit,
  gate2fVerified: true,
  validationAcceptedForFuturePlanning: review.reviewResult.validationAcceptedForFuturePlanning,
  routeContractCount: review.reviewResult.routeContractCount,
  rejectedPayloadFieldCount: review.reviewResult.rejectedPayloadFieldCount,
  routeExecutionApprovedToday: review.reviewResult.routeExecutionApprovedToday,
  workerExecutionApprovedToday: review.reviewResult.workerExecutionApprovedToday,
  nextPrompt: review.nextPrompt,
}, null, 2))
