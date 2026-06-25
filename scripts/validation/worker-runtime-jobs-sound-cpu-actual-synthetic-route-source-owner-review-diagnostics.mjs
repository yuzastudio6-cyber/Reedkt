#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_actual_synthetic_route_source_owner_review_passed_with_warnings_ready_for_controlled_source_validation'
const gate2eDecision = 'sound_runtime_media_gate_2e_actual_synthetic_worker_route_source_created_with_warnings_ready_for_source_owner_review'
const sourceHead = '630d2ea841116fa50fb7fbf657ede09359f6b7be'
const sourceFiles = [
  'server/workers/sound-cpu/synthetic-route-types.ts',
  'server/workers/sound-cpu/synthetic-route-decision.ts',
  'server/workers/sound-cpu/index.ts',
]
const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-safety-register.md', 'worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-safety-register'],
  ['docs/worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-validation-readiness-register.md', 'worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-validation-readiness-register'],
  ['docs/worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-claim-policy'],
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

for (const file of sourceFiles) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
}
for (const [file, label] of docs) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
  parseBlock(file, label)
}

const review = parseBlock(docs[0][0], docs[0][1])
const acceptance = parseBlock(docs[1][0], docs[1][1])
const safety = parseBlock(docs[2][0], docs[2][1])
const validation = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2e = parseBlock('docs/sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result.md', 'sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result')
const gate2eContracts = parseBlock('docs/sound-runtime-media-gate-2e-route-contract-implementation-register.md', 'sound-runtime-media-gate-2e-route-contract-implementation-register')

assert(review.decision === decision, 'owner-review decision mismatch')
assert(acceptance.decision === decision, 'acceptance decision mismatch')
assert(safety.decision === decision, 'safety decision mismatch')
assert(validation.decision === decision, 'validation readiness decision mismatch')
assert(blockers.decision === decision, 'blocker decision mismatch')
assert(policy.decision === decision, 'claim policy decision mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr768.status === 'merged', 'PR #768 must be merged')
assert(review.sourceVerification.pr768.decision === gate2eDecision, 'PR #768 decision mismatch')
assert(gate2e.decision === gate2eDecision, 'Gate 2E decision mismatch')
assert(gate2e.actualSourceCreated === true, 'Gate 2E source must be created')
assert(gate2e.sourceFileCount === 3, 'Gate 2E source file count mismatch')
assert(gate2e.routeContractCount === 4, 'Gate 2E route contract count mismatch')
assert(gate2e.rejectedPayloadFieldCount === 14, 'Gate 2E rejected field count mismatch')

for (const file of sourceFiles) {
  assert(acceptance.acceptedSourceFiles.includes(file), `missing accepted source file ${file}`)
}
for (const jobType of jobTypes) {
  assert(acceptance.acceptedJobTypes.includes(jobType), `missing accepted job type ${jobType}`)
  assert(gate2eContracts.routeContracts.some((row) => row.jobType === jobType), `missing Gate 2E contract ${jobType}`)
}

assert(acceptance.acceptedForControlledSourceValidationGate === true, 'Gate 2F validation must be allowed')
assert(acceptance.acceptedForWorkerExecutionToday === 'none', 'worker execution must not be accepted')
assert(acceptance.acceptedForRouteExecutionToday === 'none', 'route execution must not be accepted')
assert(safety.acceptedSafetyProperties.failClosedResolver === true, 'fail-closed resolver not accepted')
assert(safety.acceptedSafetyProperties.publicRouteCreated === false, 'public route must remain absent')
assert(safety.acceptedSafetyProperties.serverRouteCreated === false, 'server route must remain absent')
assert(safety.acceptedSafetyProperties.workerImplementationCreated === false, 'worker implementation must remain absent')
assert(safety.sourceMayBeValidatedByGate2f === true, 'Gate 2F validation must proceed')
assert(safety.sourceMayBeExecutedByGate2f === false, 'Gate 2F must not execute source')
assert(validation.controlledValidationReadiness.gate2fMayProceed === true, 'Gate 2F readiness missing')
assert(blockers.blockers.some((row) => row.blockerId === 'controlled_source_validation_pending' && row.status === 'next'), 'Gate 2F next blocker missing')
assert(blockers.blockers.some((row) => row.blockerId === 'controlled_route_execution_not_approved' && row.status === 'blocked'), 'route execution blocker missing')

for (const [flag, value] of Object.entries(policy.runtimeFlags)) {
  assert(value === false, `${flag} must remain false`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')

const gate2fPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation.md')
assert(gate2fPrompt.includes(decision), 'Gate 2F prompt must require owner-review decision')
const ownerValidationPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-review.md')
assert(ownerValidationPrompt.includes('Gate 2F'), 'validation owner-review prompt missing Gate 2F reference')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-actual-synthetic-route-source-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_actual_synthetic_route_source_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr768Verified: true,
  sourceAcceptedForControlledValidation: review.reviewResult.sourceAcceptedForControlledValidation,
  sourceFileCount: review.reviewResult.sourceFileCount,
  routeContractCount: review.reviewResult.routeContractCount,
  workerExecutionApprovedToday: review.reviewResult.executionApprovedToday,
  nextPrompt: review.nextPrompt,
}, null, 2))
