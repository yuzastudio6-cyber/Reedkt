#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2q_route_readiness_evaluator_static_integration_source_created_with_warnings_ready_for_static_integration_source_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_plan_owner_review_passed_with_warnings_ready_for_static_integration_source_creation'
const gate2pDecision = 'sound_runtime_media_gate_2p_route_readiness_evaluator_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review'
const sourceHead = '6bf0131d7872f0883183ab7b091b0f8cbb807e28'
const pr837MergeCommit = 'e31f0c44830bd70edfa87280680646d00b073248'
const evaluatorPath = 'server/workers/sound-cpu/route-readiness-evaluator.mjs'
const integrationPath = 'server/workers/sound-cpu/route-readiness-evaluator-static-integration.mjs'
const canonicalRejectedPayloadFields = [
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
const nonCanonicalRejectedPayloadFields = [
  'modelWeightLocation',
  'ffmpegInput',
  'supabaseRow',
  'cloudRunJob',
  'workerExecutionLease',
  'billingMutation',
]

const docs = [
  ['docs/sound-runtime-media-gate-2q-static-integration-source-result.md', 'sound-runtime-media-gate-2q-static-integration-source-result'],
  ['docs/sound-runtime-media-gate-2q-static-fixture-register.md', 'sound-runtime-media-gate-2q-static-fixture-register'],
  ['docs/sound-runtime-media-gate-2q-source-static-validation-report.md', 'sound-runtime-media-gate-2q-source-static-validation-report'],
  ['docs/sound-runtime-media-gate-2q-owner-handoff.md', 'sound-runtime-media-gate-2q-owner-handoff'],
  ['docs/sound-runtime-media-gate-2q-blocker-register.md', 'sound-runtime-media-gate-2q-blocker-register'],
  ['docs/sound-runtime-media-gate-2q-runtime-claim-policy.md', 'sound-runtime-media-gate-2q-runtime-claim-policy'],
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

const result = parseBlock(docs[0][0], docs[0][1])
const fixtures = parseBlock(docs[1][0], docs[1][1])
const validation = parseBlock(docs[2][0], docs[2][1])
const handoff = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-owner-review')
const gate2p = parseBlock('docs/sound-runtime-media-gate-2p-route-readiness-evaluator-static-integration-plan.md', 'sound-runtime-media-gate-2p-route-readiness-evaluator-static-integration-plan')

for (const entry of [result, fixtures, validation, handoff, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2Q decision mismatch')
}

assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr840.status === 'merged', 'PR #840 must be merged')
assert(result.sourceVerification.pr840.mergeCommit === sourceHead, 'PR #840 merge commit mismatch')
assert(result.sourceVerification.pr840.decision === ownerDecision, 'PR #840 decision mismatch')
assert(result.sourceVerification.pr837.status === 'merged', 'PR #837 must be merged')
assert(result.sourceVerification.pr837.mergeCommit === pr837MergeCommit, 'PR #837 merge commit mismatch')
assert(result.sourceVerification.pr837.decision === gate2pDecision, 'PR #837 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(gate2p.decision === gate2pDecision, 'Gate 2P decision mismatch')

assert(result.sourceResult.staticIntegrationSourceCreated === true, 'integration source must be created')
assert(result.sourceResult.staticIntegrationSourcePath === integrationPath, 'integration path mismatch')
assert(result.sourceResult.evaluatorSourcePath === evaluatorPath, 'evaluator path mismatch')
assert(result.sourceResult.allowedEvaluatorImportOnly === true, 'allowed evaluator import flag missing')
assert(result.sourceResult.fixtureCount === 9, 'fixture count mismatch')
assert(result.sourceResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(result.sourceResult.rejectedPayloadFieldCount === 14, 'rejected field count mismatch')
assert(result.sourceResult.mismatchCaseCount === 5, 'mismatch count mismatch')
for (const key of [
  'integrationSourceImportedInGate2q',
  'routeResolverImported',
  'routeExecutionRun',
  'serverRouteExecuted',
  'workerDispatchRun',
  'workerExecutionRun',
  'toolExecutionRun',
  'mediaProcessingRun',
  'dockerOrGcpRun',
  'supabaseOrSqlRun',
  'artifactCreated',
  'routeReadinessClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'mediaReadinessClaimed',
  'betaOrProductionReadinessClaimed',
]) {
  assert(result.sourceResult[key] === false, `sourceResult.${key} must remain false`)
}

assert(fs.existsSync(path.join(root, evaluatorPath)), 'evaluator source missing')
assert(fs.existsSync(path.join(root, integrationPath)), 'integration source missing')
const integrationText = fs.readFileSync(path.join(root, integrationPath), 'utf8')
assert(integrationText.includes('SOUND-RUNTIME-MEDIA-GATE-2Q'), 'integration source missing gate marker')
assert((integrationText.match(/(^|\n)\s*import\s+/g) || []).length === 1, 'integration source must have exactly one static import')
assert(integrationText.includes("from './route-readiness-evaluator.mjs'"), 'integration source must import only evaluator source')
assert(!/\brequire\s*\(/.test(integrationText), 'integration source must not require dependencies')
assert(!/\bfetch\s*\(/.test(integrationText), 'integration source must not call fetch')
assert(!/child_process|execFile|execSync|spawn|spawnSync|new\s+Worker|process\.env|Deno\.|Bun\./i.test(integrationText), 'integration source contains prohibited runtime execution marker')
assert(integrationText.includes('readinessClaim: false'), 'integration source readiness claim must remain false')
for (const field of canonicalRejectedPayloadFields) {
  assert(integrationText.includes(`'${field}'`), `integration source missing canonical rejected payload field ${field}`)
}
for (const field of nonCanonicalRejectedPayloadFields) {
  assert(!integrationText.includes(`'${field}'`), `integration source retains non-canonical rejected payload field ${field}`)
}

assert(fixtures.staticFixtures.fixtureCount === 9, 'fixture register count mismatch')
assert(fixtures.staticFixtures.acceptedJobTypes.length === 4, 'accepted job type count mismatch')
for (const key of ['mediaFileInputs', 'routeResolverOutputs', 'serverRouteResponses', 'workerExecutionOutputs', 'supabaseRows', 'signedOrPublicUrls']) {
  assert(fixtures.staticFixtures[key] === false, `staticFixtures.${key} must remain false`)
}
assert(validation.staticValidation.integrationSourceExists === true, 'validation integration exists missing')
assert(validation.staticValidation.evaluatorSourceExists === true, 'validation evaluator exists missing')
assert(validation.staticValidation.nodeCheckPassed === true, 'node check missing')
assert(validation.staticValidation.onlyAllowedEvaluatorImportDetected === true, 'allowed import validation missing')
for (const [key, value] of Object.entries(validation.staticValidation)) {
  if (!['integrationSourceExists', 'evaluatorSourceExists', 'nodeCheckPassed', 'diagnosticsPassed', 'onlyAllowedEvaluatorImportDetected'].includes(key)) {
    assert(value === false, `staticValidation.${key} must remain false`)
  }
}
assertAllFalse(validation.validationMode, 'validation mode')
assert(handoff.handoffTarget === 'WORKER_RUNTIME_JOBS', 'handoff target mismatch')
assert(handoff.acceptedInputs.staticIntegrationSourcePath === integrationPath, 'handoff integration path mismatch')
assertAllFalse(handoff.acceptedForExecutionToday, 'accepted for execution today')
assert(blockers.blockers.some((row) => row.blockerId === 'worker_runtime_jobs_static_integration_source_owner_review_pending' && row.status === 'next'), 'source owner review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.staticIntegrationSourceCreated === true, 'allowed integration source claim missing')
assert(policy.allowedClaims.staticSourceValidationPassed === true, 'allowed static validation claim missing')
assert(policy.allowedClaims.futureOwnerReviewRequired === true, 'allowed owner review claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-owner-review.md')
assert(nextPrompt.includes(decision), 'owner-review prompt must require Gate 2Q decision')
assert(nextPrompt.includes('no execution'), 'owner-review prompt must preserve no-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2q:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2q-diagnostics.mjs', 'Gate 2Q package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2q_diagnostics_passed',
  decision,
  sourceHead,
  pr840Verified: true,
  staticIntegrationSourceCreated: result.sourceResult.staticIntegrationSourceCreated,
  staticIntegrationSourcePath: result.sourceResult.staticIntegrationSourcePath,
  fixtureCount: result.sourceResult.fixtureCount,
  acceptedFixtureCount: result.sourceResult.acceptedFixtureCount,
  rejectedPayloadFieldCount: result.sourceResult.rejectedPayloadFieldCount,
  mismatchCaseCount: result.sourceResult.mismatchCaseCount,
  integrationSourceImportedInGate2q: result.sourceResult.integrationSourceImportedInGate2q,
  routeResolverImported: result.sourceResult.routeResolverImported,
  routeExecutionRun: result.sourceResult.routeExecutionRun,
  nextPrompt: result.nextPrompt,
}, null, 2))
