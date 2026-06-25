#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2f_controlled_synthetic_route_source_validation_passed_with_warnings_ready_for_validation_owner_review'
const sourceHead = '2690dec6bd5c9517fa61d21bf49b3d5bb9a6716e'
const docs = [
  ['docs/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result.md', 'sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-result'],
  ['docs/sound-runtime-media-gate-2f-validation-runner-report.md', 'sound-runtime-media-gate-2f-validation-runner-report'],
  ['docs/sound-runtime-media-gate-2f-contract-validation-register.md', 'sound-runtime-media-gate-2f-contract-validation-register'],
  ['docs/sound-runtime-media-gate-2f-rejection-validation-register.md', 'sound-runtime-media-gate-2f-rejection-validation-register'],
  ['docs/sound-runtime-media-gate-2f-blocked-execution-register.md', 'sound-runtime-media-gate-2f-blocked-execution-register'],
  ['docs/sound-runtime-media-gate-2f-runtime-claim-policy.md', 'sound-runtime-media-gate-2f-runtime-claim-policy'],
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

for (const [file, label] of docs) {
  assert(fs.existsSync(path.join(root, file)), `${file} missing`)
  parseBlock(file, label)
}

const result = parseBlock(docs[0][0], docs[0][1])
const runnerReport = parseBlock(docs[1][0], docs[1][1])
const contracts = parseBlock(docs[2][0], docs[2][1])
const rejection = parseBlock(docs[3][0], docs[3][1])
const blocked = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-actual-synthetic-route-source-owner-review')
const gate2e = parseBlock('docs/sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result.md', 'sound-runtime-media-gate-2e-actual-synthetic-worker-route-source-result')

assert(result.decision === decision, 'Gate 2F decision mismatch')
assert(result.sourceVerification.pr772MergedSourceHead === sourceHead, 'PR #772 source head mismatch')
assert(result.sourceVerification.ownerReviewDecision === ownerReview.decision, 'owner review decision mismatch')
assert(result.sourceVerification.gate2eDecision === gate2e.decision, 'Gate 2E decision mismatch')
assert(result.validationPassed === true, 'validation must pass')
assert(result.sourceImported === false, 'source must not be imported by this gate')
assert(result.workerExecutionRun === false, 'worker execution must not run')
assert(result.routeExecutionRun === false, 'route execution must not run')
assert(result.supabaseTouched === false, 'Supabase must not be touched')
assert(result.sqlExecuted === false, 'SQL must not execute')
assert(runnerReport.runnerMode === 'node_builtins_static_source_read', 'runner mode mismatch')
assert(runnerReport.sourceImported === false, 'runner must not import source')
assert(runnerReport.routeContractCount === 4, 'runner route count mismatch')
assert(runnerReport.rejectedPayloadFieldCount === 14, 'runner rejected field count mismatch')
assert(runnerReport.runtimeFlagFalseCount === 15, 'runtime flag count mismatch')
assert(runnerReport.unsafeSourceImportsDetected === false, 'unsafe imports detected')

for (const jobType of jobTypes) {
  assert(contracts.validatedContracts.includes(jobType), `missing contract ${jobType}`)
}
assert(contracts.acceptedForExecution === false, 'contracts must not be accepted for execution')
assert(rejection.rejectionValidationPassed === true, 'rejection validation must pass')
assert(rejection.validatedRejectedPayloadFields.length === 14, 'rejected field count mismatch')

for (const [key, value] of Object.entries(blocked.blockedExecution)) {
  assert(value === false, `${key} must remain false`)
}
for (const [key, value] of Object.entries(policy.runtimeFlags)) {
  assert(value === false, `${key} must remain false`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')

const runner = spawnSync(process.execPath, ['scripts/validation/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-runner.mjs'], {
  cwd: root,
  encoding: 'utf8',
})
assert(runner.status === 0, `Gate 2F runner failed: ${runner.stderr || runner.stdout}`)
const runnerOutput = JSON.parse(runner.stdout)
assert(runnerOutput.status === 'sound_runtime_media_gate_2f_controlled_source_validation_runner_passed', 'runner output status mismatch')
assert(runnerOutput.sourceImported === false, 'runner output source import mismatch')

const ownerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-owner-review.md')
assert(ownerPrompt.includes('Gate 2F'), 'validation owner-review prompt missing Gate 2F reference')
const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2f:validation'] === 'node scripts/validation/sound-runtime-media-gate-2f-controlled-synthetic-route-source-validation-runner.mjs',
  'validation package script missing',
)
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2f:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2f-diagnostics.mjs',
  'diagnostics package script missing',
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2f_diagnostics_passed',
  decision,
  sourceHead,
  routeContractCount: runnerOutput.routeContractCount,
  rejectedPayloadFieldCount: runnerOutput.rejectedPayloadFieldCount,
  sourceImported: runnerOutput.sourceImported,
  workerExecutionRun: runnerOutput.workerExecutionRun,
  routeExecutionRun: runnerOutput.routeExecutionRun,
  supabaseTouched: runnerOutput.supabaseTouched,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-SYNTHETIC-ROUTE-SOURCE-VALIDATION-OWNER-REVIEW: review controlled route source validation, no execution',
}, null, 2))
