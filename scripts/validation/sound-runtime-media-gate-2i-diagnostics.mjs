#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2i_controlled_route_fixture_hardening_plan_completed_with_warnings_ready_for_fixture_hardening_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_controlled_route_execution_proof_owner_review_passed_with_warnings_ready_for_route_fixture_hardening_plan'
const gate2hDecision = 'sound_runtime_media_gate_2h_controlled_synthetic_route_execution_proof_passed_with_warnings_ready_for_proof_owner_review'
const sourceHead = '453adebc8a6880447c57ecc37b79d1c88a7ed788'
const pr800MergeCommit = '440aebfdd38b0274bae0200005e8b18f5b8f8f81'
const docs = [
  ['docs/sound-runtime-media-gate-2i-controlled-route-fixture-hardening-plan-result.md', 'sound-runtime-media-gate-2i-controlled-route-fixture-hardening-plan-result'],
  ['docs/sound-runtime-media-gate-2i-fixture-hardening-topic-register.md', 'sound-runtime-media-gate-2i-fixture-hardening-topic-register'],
  ['docs/sound-runtime-media-gate-2i-synthetic-fixture-case-plan-register.md', 'sound-runtime-media-gate-2i-synthetic-fixture-case-plan-register'],
  ['docs/sound-runtime-media-gate-2i-rejection-fixture-hardening-register.md', 'sound-runtime-media-gate-2i-rejection-fixture-hardening-register'],
  ['docs/sound-runtime-media-gate-2i-no-execution-policy.md', 'sound-runtime-media-gate-2i-no-execution-policy'],
  ['docs/sound-runtime-media-gate-2i-runtime-claim-policy.md', 'sound-runtime-media-gate-2i-runtime-claim-policy'],
]
const jobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]
const rejectedFields = [
  'rawPrompt',
  'uploadedMediaUri',
  'signedUrl',
  'publicArtifactUrl',
  'mediaFilePath',
  'providerOutputBlob',
  'secretValue',
  'serviceRolePayload',
  'modelWeightPath',
  'artifactWriteTarget',
  'supabaseMutation',
  'sqlText',
  'dockerCommand',
  'gcpCommand',
]
const mismatchCases = [
  'unsafe_runtime_flag',
  'worker_mismatch',
  'image_mismatch',
  'fixture_mismatch',
  'unknown_job_type',
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

const result = parseBlock(docs[0][0], docs[0][1])
const topics = parseBlock(docs[1][0], docs[1][1])
const fixtureCases = parseBlock(docs[2][0], docs[2][1])
const rejection = parseBlock(docs[3][0], docs[3][1])
const noExecution = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-review')
const gate2h = parseBlock('docs/sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof-result.md', 'sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof-result')

for (const entry of [result, topics, fixtureCases, rejection, noExecution, policy]) {
  assert(entry.decision === decision, 'Gate 2I decision mismatch')
}

assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr805.status === 'merged', 'PR #805 must be merged')
assert(result.sourceVerification.pr805.mergeCommit === sourceHead, 'PR #805 merge commit mismatch')
assert(result.sourceVerification.pr805.decision === ownerDecision, 'PR #805 decision mismatch')
assert(result.sourceVerification.pr800.status === 'merged', 'PR #800 must be merged')
assert(result.sourceVerification.pr800.mergeCommit === pr800MergeCommit, 'PR #800 merge commit mismatch')
assert(result.sourceVerification.pr800.decision === gate2hDecision, 'PR #800 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(gate2h.decision === gate2hDecision, 'Gate 2H decision mismatch')

assert(result.planCreated === true, 'planCreated must be true')
assert(result.fixtureHardeningPlanOnly === true, 'fixture hardening must be plan-only')
for (const key of [
  'routeExecutionRun',
  'serverRouteExecuted',
  'workerExecutionRun',
  'mediaProcessingRun',
  'dockerRun',
  'gcpTouched',
  'supabaseTouched',
  'sqlExecuted',
  'artifactCreated',
]) {
  assert(result[key] === false, `${key} must remain false`)
}

assert(topics.routeContractCount === 4, 'topic route count mismatch')
assert(topics.rejectedPayloadFieldCount === 14, 'topic rejected count mismatch')
assert(topics.mismatchCaseCount === 5, 'topic mismatch count mismatch')
assert(topics.futureFixtureValidationStatus === 'planned_not_executed', 'future validation status mismatch')
assert(topics.acceptedForWorkerExecutionToday === false, 'worker execution today must be false')
assert(topics.acceptedForReadinessToday === false, 'readiness today must be false')
for (const topic of ['valid_minimal_payloads', 'runtime_flag_false_matrix', 'rejected_payload_field_cases', 'mismatch_case_coverage']) {
  assert(topics.hardeningTopics.includes(topic), `missing topic ${topic}`)
}

assert(fixtureCases.fixtureMode === 'static_planning_only', 'fixture mode mismatch')
assert(fixtureCases.plannedValidCases.length === 4, 'planned valid case count mismatch')
includesAll(fixtureCases.plannedValidCases.map((row) => row.jobType), jobTypes, 'planned job types')
for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey', 'staticRuntimeFlags']) {
  assert(fixtureCases.requiredPayloadFields.includes(field), `missing required field ${field}`)
}
assertAllFalse(fixtureCases.fixtureOutputPolicy, 'fixture output policy')

includesAll(rejection.plannedRejectedPayloadFields, rejectedFields, 'rejected payload fields')
includesAll(rejection.plannedMismatchCases, mismatchCases, 'mismatch cases')
assert(rejection.plannedRejectedPayloadFieldCount === 14, 'rejected payload count mismatch')
assert(rejection.plannedMismatchCaseCount === 5, 'mismatch case count mismatch')
assert(rejection.unsafeRuntimeFlagAcceptanceAllowed === false, 'unsafe runtime acceptance must be false')
assert(rejection.mediaOrExternalPayloadAcceptanceAllowed === false, 'media/external acceptance must be false')
assert(rejection.futureValidationStatus === 'planned_not_executed', 'rejection future validation status mismatch')

assert(noExecution.allowedInGate2i.fixtureHardeningPlan === true, 'fixture plan must be allowed')
for (const [key, value] of Object.entries(noExecution.blockedInGate2i)) {
  assert(value === true, `blockedInGate2i.${key} must be true`)
}
assert(policy.allowedClaims.fixtureHardeningPlanCreated === true, 'fixture hardening claim missing')
assert(policy.allowedClaims.futureFixtureValidationMayBePlannedAfterOwnerReview === true, 'future fixture validation claim missing')
assert(policy.allowedClaims.routeExecutionRun === false, 'route execution claim must be false')
assert(policy.allowedClaims.workerExecutionRun === false, 'worker execution claim must be false')
assert(policy.allowedClaims.mediaProcessingRun === false, 'media processing claim must be false')
assertAllFalse(policy.runtimeFlags, 'runtime flag')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')

const ownerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-fixture-hardening-owner-review.md')
assert(ownerPrompt.includes(decision), 'owner review prompt must require Gate 2I decision')
assert(ownerPrompt.includes('future controlled fixture validation planning'), 'owner review prompt must keep future planning scope')
const gate2jPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2j-controlled-route-fixture-validation.md')
assert(gate2jPrompt.includes('worker_runtime_jobs_sound_cpu_route_fixture_hardening_owner_review_passed_with_warnings_ready_for_controlled_fixture_validation'), 'Gate 2J prompt must require owner decision')
assert(gate2jPrompt.includes('no worker/media/GCP'), 'Gate 2J prompt must preserve no worker/media/GCP')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2i:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2i-diagnostics.mjs',
  'package script missing',
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2i_diagnostics_passed',
  decision,
  sourceHead,
  pr805Verified: true,
  fixtureHardeningPlanCreated: result.planCreated,
  routeContractCount: topics.routeContractCount,
  rejectedPayloadFieldCount: rejection.plannedRejectedPayloadFieldCount,
  mismatchCaseCount: rejection.plannedMismatchCaseCount,
  routeExecutionRun: result.routeExecutionRun,
  workerExecutionRun: result.workerExecutionRun,
  mediaProcessingRun: result.mediaProcessingRun,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-ROUTE-FIXTURE-HARDENING-OWNER-REVIEW: review route fixture hardening plan, no execution',
}, null, 2))
