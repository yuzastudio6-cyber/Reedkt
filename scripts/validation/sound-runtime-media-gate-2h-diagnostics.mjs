#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2h_controlled_synthetic_route_execution_proof_passed_with_warnings_ready_for_proof_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_controlled_route_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_route_execution_proof'
const gate2gDecision = 'sound_runtime_media_gate_2g_controlled_synthetic_route_execution_plan_completed_with_warnings_ready_for_execution_plan_owner_review'
const sourceHead = '78500c700920dadbe4078ce8a852bc803c82c306'
const pr789MergeCommit = '85389d1c86e8ec801c60f973aa19ba5de3f1a86e'
const docs = [
  ['docs/sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof-result.md', 'sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof-result'],
  ['docs/sound-runtime-media-gate-2h-route-proof-execution-report.md', 'sound-runtime-media-gate-2h-route-proof-execution-report'],
  ['docs/sound-runtime-media-gate-2h-rejection-proof-register.md', 'sound-runtime-media-gate-2h-rejection-proof-register'],
  ['docs/sound-runtime-media-gate-2h-no-worker-media-gcp-policy.md', 'sound-runtime-media-gate-2h-no-worker-media-gcp-policy'],
  ['docs/sound-runtime-media-gate-2h-blocked-runtime-readiness-register.md', 'sound-runtime-media-gate-2h-blocked-runtime-readiness-register'],
  ['docs/sound-runtime-media-gate-2h-runtime-claim-policy.md', 'sound-runtime-media-gate-2h-runtime-claim-policy'],
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

const result = parseBlock(docs[0][0], docs[0][1])
const executionReport = parseBlock(docs[1][0], docs[1][1])
const rejection = parseBlock(docs[2][0], docs[2][1])
const policy = parseBlock(docs[3][0], docs[3][1])
const blocked = parseBlock(docs[4][0], docs[4][1])
const claims = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-review.md', 'worker-runtime-jobs-sound-cpu-controlled-route-execution-plan-owner-review')
const gate2g = parseBlock('docs/sound-runtime-media-gate-2g-controlled-synthetic-route-execution-plan-result.md', 'sound-runtime-media-gate-2g-controlled-synthetic-route-execution-plan-result')

for (const entry of [result, executionReport, rejection, policy, blocked, claims]) {
  assert(entry.decision === decision, 'Gate 2H decision mismatch')
}
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr793.status === 'merged', 'PR #793 must be merged')
assert(result.sourceVerification.pr793.mergeCommit === sourceHead, 'PR #793 merge commit mismatch')
assert(result.sourceVerification.pr793.decision === ownerDecision, 'PR #793 decision mismatch')
assert(result.sourceVerification.pr789.mergeCommit === pr789MergeCommit, 'PR #789 merge commit mismatch')
assert(result.sourceVerification.pr789.decision === gate2gDecision, 'PR #789 decision mismatch')
assert(result.proofPassed === true, 'proof must pass')
assert(result.sourceImported === true, 'source must be imported in Gate 2H proof')
assert(result.routeResolverImported === true, 'route resolver must be imported')
assert(result.syntheticRouteResolverExecuted === true, 'synthetic route resolver must execute')
assert(result.serverRouteExecuted === false, 'server route must not execute')
assert(result.workerExecutionRun === false, 'worker execution must be false')
assert(result.mediaProcessingRun === false, 'media processing must be false')
assert(result.supabaseTouched === false, 'Supabase must be false')
assert(result.sqlExecuted === false, 'SQL must be false')

assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(ownerReview.sourceVerification.pr789.mergeCommit === pr789MergeCommit, 'owner review PR #789 commit mismatch')
assert(gate2g.decision === gate2gDecision, 'Gate 2G decision mismatch')
assert(gate2g.planCreated === true, 'Gate 2G plan must be created')

assert(executionReport.runnerCommand === 'npm run sound-runtime-media-gate-2h:proof', 'runner command mismatch')
assert(executionReport.routeContractCount === 4, 'route count mismatch')
assert(executionReport.acceptedRouteResultCount === 4, 'accepted count mismatch')
assert(executionReport.rejectedPayloadFieldCount === 14, 'rejected count mismatch')
assert(executionReport.mismatchCaseCount === 5, 'mismatch count mismatch')
includesAll(executionReport.acceptedJobTypes, jobTypes, 'accepted job types')
assert(executionReport.serverRouteExecuted === false, 'server route must be false')
assert(executionReport.workerDispatchRun === false, 'worker dispatch must be false')
assert(executionReport.externalServiceTouched === false, 'external service must be false')

assert(rejection.rejectedPayloadFieldCount === 14, 'rejected field count mismatch')
includesAll(rejection.rejectedPayloadFieldsValidated, rejectedFields, 'rejected fields')
includesAll(rejection.mismatchCasesValidated, ['unsafe_runtime_flag', 'worker_mismatch', 'image_mismatch', 'fixture_mismatch', 'unknown_job_type'], 'mismatch cases')
assert(rejection.unsafeRuntimeFlagAccepted === false, 'unsafe runtime flag must be rejected')
assert(rejection.unsafePayloadAccepted === false, 'unsafe payload must be rejected')

assert(policy.proofAllowed.sourceImport === true, 'source import must be allowed')
assert(policy.proofAllowed.syntheticRouteResolverExecution === true, 'resolver execution must be allowed')
for (const [key, value] of Object.entries(policy.proofDisallowed)) {
  assert(value === true, `proofDisallowed.${key} must be true`)
}
for (const [claim, value] of Object.entries(blocked.blockedClaims)) {
  assert(value === 'unclaimed', `${claim} must remain unclaimed`)
}
assert(blocked.blockedNextSteps.some((row) => row.blockerId === 'proof_owner_review_pending' && row.status === 'next'), 'proof owner-review next blocker missing')
assert(claims.allowedClaims.controlledSyntheticRouteResolverProofPassed === true, 'allowed proof claim missing')
assert(claims.allowedClaims.syntheticRouteResolverExecuted === true, 'allowed resolver execution claim missing')
assert(claims.allowedClaims.serverRouteExecuted === false, 'server route allowed claim must be false')
assert(claims.allowedClaims.workerExecutionRun === false, 'worker execution allowed claim must be false')
assertAllFalse(claims.runtimeFlags, 'runtime flag')
assert(claims.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')

const runner = spawnSync('npm', ['run', '--silent', 'sound-runtime-media-gate-2h:proof'], {
  cwd: root,
  encoding: 'utf8',
})
assert(runner.status === 0, `Gate 2H runner failed: ${runner.stderr || runner.stdout}`)
const runnerOutput = JSON.parse(runner.stdout)
assert(runnerOutput.status === 'sound_runtime_media_gate_2h_controlled_synthetic_route_execution_proof_passed', 'runner status mismatch')
assert(runnerOutput.decision === decision, 'runner decision mismatch')
assert(runnerOutput.sourceHead === sourceHead, 'runner source head mismatch')
assert(runnerOutput.sourceImported === true, 'runner source import mismatch')
assert(runnerOutput.syntheticRouteResolverExecuted === true, 'runner resolver execution mismatch')
assert(runnerOutput.serverRouteExecuted === false, 'runner server route mismatch')
assert(runnerOutput.workerExecutionRun === false, 'runner worker execution mismatch')
assert(runnerOutput.mediaProcessingRun === false, 'runner media processing mismatch')
assert(runnerOutput.supabaseTouched === false, 'runner Supabase mismatch')
assert(runnerOutput.routeContractCount === 4, 'runner route count mismatch')
assert(runnerOutput.acceptedRouteResultCount === 4, 'runner accepted count mismatch')
assert(runnerOutput.rejectedPayloadFieldCount === 14, 'runner rejected count mismatch')
assert(runnerOutput.mismatchCaseCount === 5, 'runner mismatch count mismatch')

const proofOwnerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-route-execution-proof-owner-review.md')
assert(proofOwnerPrompt.includes(decision), 'proof owner-review prompt must require Gate 2H decision')
const gate2iPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2i-controlled-route-fixture-hardening-plan.md')
assert(gate2iPrompt.includes('no execution'), 'Gate 2I prompt must remain no execution')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2h:proof'] === 'tsx scripts/validation/sound-runtime-media-gate-2h-controlled-synthetic-route-execution-proof-runner.ts',
  'proof package script missing',
)
assert(
  packageJson.scripts?.['sound-runtime-media-gate-2h:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2h-diagnostics.mjs',
  'diagnostics package script missing',
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2h_diagnostics_passed',
  decision,
  sourceHead,
  proofPassed: true,
  routeContractCount: runnerOutput.routeContractCount,
  rejectedPayloadFieldCount: runnerOutput.rejectedPayloadFieldCount,
  syntheticRouteResolverExecuted: runnerOutput.syntheticRouteResolverExecuted,
  workerExecutionRun: runnerOutput.workerExecutionRun,
  mediaProcessingRun: runnerOutput.mediaProcessingRun,
  supabaseTouched: runnerOutput.supabaseTouched,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-ROUTE-EXECUTION-PROOF-OWNER-REVIEW: review controlled route execution proof, no worker/media/GCP',
}, null, 2))
