#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2j_controlled_route_fixture_validation_passed_with_warnings_ready_for_fixture_validation_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_route_fixture_hardening_owner_review_passed_with_warnings_ready_for_controlled_fixture_validation'
const gate2iDecision = 'sound_runtime_media_gate_2i_controlled_route_fixture_hardening_plan_completed_with_warnings_ready_for_fixture_hardening_owner_review'
const sourceHead = '0d700a3bdc36d4aa79063db30462d0d237e9f256'
const pr809MergeCommit = '7341047a26f18ccdafc28396fbe1f708a6a699c4'
const docs = [
  ['docs/sound-runtime-media-gate-2j-controlled-route-fixture-validation-result.md', 'sound-runtime-media-gate-2j-controlled-route-fixture-validation-result'],
  ['docs/sound-runtime-media-gate-2j-fixture-validation-report.md', 'sound-runtime-media-gate-2j-fixture-validation-report'],
  ['docs/sound-runtime-media-gate-2j-accepted-fixture-register.md', 'sound-runtime-media-gate-2j-accepted-fixture-register'],
  ['docs/sound-runtime-media-gate-2j-rejection-validation-register.md', 'sound-runtime-media-gate-2j-rejection-validation-register'],
  ['docs/sound-runtime-media-gate-2j-no-worker-media-gcp-policy.md', 'sound-runtime-media-gate-2j-no-worker-media-gcp-policy'],
  ['docs/sound-runtime-media-gate-2j-runtime-claim-policy.md', 'sound-runtime-media-gate-2j-runtime-claim-policy'],
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

const validation = spawnSync('npm', ['run', '--silent', 'sound-runtime-media-gate-2j:validation'], {
  cwd: root,
  encoding: 'utf8',
})
assert(validation.status === 0, `Gate 2J validation failed: ${validation.stderr || validation.stdout}`)
const validationOutput = JSON.parse(validation.stdout)
assert(validationOutput.decision === decision, 'validation decision mismatch')
assert(validationOutput.validationMode === 'local_in_memory_static_fixture_shape_only', 'validation mode mismatch')
assert(validationOutput.routeResolverImported === false, 'route resolver must not be imported')
assert(validationOutput.routeExecutionRun === false, 'route execution must be false')
assert(validationOutput.workerExecutionRun === false, 'worker execution must be false')
assert(validationOutput.mediaProcessingRun === false, 'media processing must be false')
assert(validationOutput.fixtureCount === 4, 'validation fixture count mismatch')
assert(validationOutput.acceptedFixtureCount === 4, 'validation accepted count mismatch')
assert(validationOutput.rejectedPayloadFieldCount === 14, 'validation rejected count mismatch')
assert(validationOutput.mismatchCaseCount === 5, 'validation mismatch count mismatch')

const result = parseBlock(docs[0][0], docs[0][1])
const report = parseBlock(docs[1][0], docs[1][1])
const accepted = parseBlock(docs[2][0], docs[2][1])
const rejection = parseBlock(docs[3][0], docs[3][1])
const noWorker = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-review')
const gate2i = parseBlock('docs/sound-runtime-media-gate-2i-controlled-route-fixture-hardening-plan-result.md', 'sound-runtime-media-gate-2i-controlled-route-fixture-hardening-plan-result')

for (const entry of [result, report, accepted, rejection, noWorker, policy]) {
  assert(entry.decision === decision, 'Gate 2J decision mismatch')
}
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr810.status === 'merged', 'PR #810 must be merged')
assert(result.sourceVerification.pr810.mergeCommit === sourceHead, 'PR #810 merge commit mismatch')
assert(result.sourceVerification.pr810.decision === ownerDecision, 'PR #810 decision mismatch')
assert(result.sourceVerification.pr809.status === 'merged', 'PR #809 must be merged')
assert(result.sourceVerification.pr809.mergeCommit === pr809MergeCommit, 'PR #809 merge commit mismatch')
assert(result.sourceVerification.pr809.decision === gate2iDecision, 'PR #809 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(gate2i.decision === gate2iDecision, 'Gate 2I decision mismatch')

assert(result.validationMode === 'local_in_memory_static_fixture_shape_only', 'result validation mode mismatch')
assert(result.validationPassed === true, 'validation must pass')
for (const key of ['routeResolverImported', 'routeExecutionRun', 'serverRouteExecuted', 'workerExecutionRun', 'mediaProcessingRun', 'dockerRun', 'gcpTouched', 'supabaseTouched', 'sqlExecuted', 'artifactCreated']) {
  assert(result[key] === false, `${key} must remain false`)
}
assert(report.fixtureCount === 4, 'report fixture count mismatch')
assert(report.acceptedFixtureCount === 4, 'report accepted count mismatch')
assert(report.rejectedPayloadFieldCount === 14, 'report rejected count mismatch')
assert(report.rejectedPayloadCaseCount === 14, 'report rejected case mismatch')
assert(report.mismatchCaseCount === 5, 'report mismatch count mismatch')
assert(report.runtimeFalseFlagCount === 15, 'report runtime false flag count mismatch')
for (const key of ['routeResolverImported', 'routeExecutionRun', 'serverRouteExecuted', 'workerDispatchRun', 'workerExecutionRun', 'mediaProcessingRun', 'externalServiceTouched']) {
  assert(report[key] === false, `report ${key} must remain false`)
}
assert(accepted.validatedFixtures.length === 4, 'accepted fixture count mismatch')
assert(accepted.fixtureOutputPolicy.writeArtifacts === false, 'artifact writes must be false')
assert(accepted.fixtureOutputPolicy.persistToSupabase === false, 'Supabase persistence must be false')
assert(rejection.rejectedPayloadFieldCount === 14, 'rejection field count mismatch')
assert(rejection.rejectedPayloadCaseCount === 14, 'rejection case count mismatch')
assert(rejection.mismatchCaseCount === 5, 'rejection mismatch count mismatch')
assert(rejection.unsafeRuntimeFlagAccepted === false, 'unsafe runtime flag accepted must be false')
assert(rejection.unsafePayloadAccepted === false, 'unsafe payload accepted must be false')
assert(rejection.mediaOrExternalPayloadAccepted === false, 'media/external accepted must be false')
assert(noWorker.allowedInGate2j.staticFixtureShapeValidation === true, 'static fixture validation must be allowed')
for (const [key, value] of Object.entries(noWorker.blockedInGate2j)) {
  assert(value === true, `blockedInGate2j.${key} must be true`)
}
assert(policy.allowedClaims.staticFixtureShapeValidationPassed === true, 'static fixture validation claim missing')
assert(policy.allowedClaims.routeExecutionRun === false, 'route execution claim must be false')
assert(policy.allowedClaims.workerExecutionRun === false, 'worker execution claim must be false')
assertAllFalse(policy.runtimeFlags, 'runtime flag')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')

const ownerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-fixture-validation-owner-review.md')
assert(ownerPrompt.includes(decision), 'owner prompt must require Gate 2J decision')
const gate2kPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2k-controlled-route-readiness-plan.md')
assert(gate2kPrompt.includes('worker_runtime_jobs_sound_cpu_route_fixture_validation_owner_review_passed_with_warnings_ready_for_route_readiness_planning'), 'Gate 2K prompt must require owner review')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2j:validation'] === 'node scripts/validation/sound-runtime-media-gate-2j-controlled-route-fixture-validation-runner.mjs', 'validation script missing')
assert(packageJson.scripts?.['sound-runtime-media-gate-2j:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2j-diagnostics.mjs', 'diagnostics script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2j_diagnostics_passed',
  decision,
  sourceHead,
  pr810Verified: true,
  validationPassed: result.validationPassed,
  fixtureCount: report.fixtureCount,
  acceptedFixtureCount: report.acceptedFixtureCount,
  rejectedPayloadFieldCount: report.rejectedPayloadFieldCount,
  mismatchCaseCount: report.mismatchCaseCount,
  routeExecutionRun: result.routeExecutionRun,
  workerExecutionRun: result.workerExecutionRun,
  mediaProcessingRun: result.mediaProcessingRun,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-ROUTE-FIXTURE-VALIDATION-OWNER-REVIEW: review controlled route fixture validation, no execution',
}, null, 2))
