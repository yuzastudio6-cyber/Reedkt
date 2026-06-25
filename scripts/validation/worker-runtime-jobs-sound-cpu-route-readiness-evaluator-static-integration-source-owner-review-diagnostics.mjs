#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_source_owner_review_passed_with_warnings_ready_for_controlled_static_import_proof'
const gate2qDecision = 'sound_runtime_media_gate_2q_route_readiness_evaluator_static_integration_source_created_with_warnings_ready_for_static_integration_source_owner_review'
const staticPlanOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_plan_owner_review_passed_with_warnings_ready_for_static_integration_source_creation'
const sourceHead = '7972a9dfe3586f2d86d93eba7149a44b556b2de0'
const pr840MergeCommit = '6bf0131d7872f0883183ab7b091b0f8cbb807e28'
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
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-safety-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-safety-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-readiness-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-readiness-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-claim-policy'],
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
const safety = parseBlock(docs[2][0], docs[2][1])
const readiness = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const gate2q = parseBlock('docs/sound-runtime-media-gate-2q-static-integration-source-result.md', 'sound-runtime-media-gate-2q-static-integration-source-result')
const staticPlanOwner = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-plan-owner-review')

for (const entry of [review, acceptance, safety, readiness, blockers, policy]) {
  assert(entry.decision === decision, 'static integration source owner-review decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr842.status === 'merged', 'PR #842 must be merged')
assert(review.sourceVerification.pr842.mergeCommit === sourceHead, 'PR #842 merge commit mismatch')
assert(review.sourceVerification.pr842.decision === gate2qDecision, 'PR #842 decision mismatch')
assert(review.sourceVerification.pr840.status === 'merged', 'PR #840 must be merged')
assert(review.sourceVerification.pr840.mergeCommit === pr840MergeCommit, 'PR #840 merge commit mismatch')
assert(review.sourceVerification.pr840.decision === staticPlanOwnerDecision, 'PR #840 decision mismatch')
assert(gate2q.decision === gate2qDecision, 'Gate 2Q decision mismatch')
assert(staticPlanOwner.decision === staticPlanOwnerDecision, 'static plan owner decision mismatch')

assert(fs.existsSync(path.join(root, evaluatorPath)), 'evaluator source missing')
assert(fs.existsSync(path.join(root, integrationPath)), 'integration source missing')
assert(review.reviewResult.gate2qStaticIntegrationSourceAcceptedForControlledImportProof === true, 'Gate 2Q source acceptance missing')
assert(review.reviewResult.staticIntegrationSourcePath === integrationPath, 'integration path mismatch')
assert(review.reviewResult.evaluatorSourcePath === evaluatorPath, 'evaluator path mismatch')
assert(review.reviewResult.sourceImportedInOwnerReview === false, 'source must not be imported in owner review')
assert(review.reviewResult.controlledImportProofMayProceed === true, 'controlled import proof readiness missing')
for (const key of ['routeResolverImportedInOwnerReview', 'routeExecutionRunInOwnerReview', 'workerExecutionRunInOwnerReview', 'acceptedForRouteExecutionToday', 'acceptedForRouteReadinessToday', 'acceptedForRuntimeReadinessToday', 'acceptedForBetaOrProductionToday']) {
  assert(review.reviewResult[key] === false, `reviewResult.${key} must remain false`)
}

const integrationText = read(integrationPath)
assert(integrationText.includes('SOUND-RUNTIME-MEDIA-GATE-2Q'), 'integration source missing gate marker')
assert((integrationText.match(/(^|\n)\s*import\s+/g) || []).length === 1, 'integration source must have exactly one import')
assert(integrationText.includes("from './route-readiness-evaluator.mjs'"), 'integration source must import only evaluator source')
assert(!/\brequire\s*\(/.test(integrationText), 'integration source must not require dependencies')
assert(!/\bfetch\s*\(/.test(integrationText), 'integration source must not call fetch')
assert(!/child_process|execFile|execSync|spawn|spawnSync|new\s+Worker|process\.env|Deno\.|Bun\./i.test(integrationText), 'integration source contains prohibited runtime execution marker')
for (const field of canonicalRejectedPayloadFields) {
  assert(integrationText.includes(`'${field}'`), `integration source missing canonical rejected payload field ${field}`)
}
for (const field of nonCanonicalRejectedPayloadFields) {
  assert(!integrationText.includes(`'${field}'`), `integration source retains non-canonical rejected payload field ${field}`)
}
assert(acceptance.acceptedForControlledStaticImportProofOnly === true, 'controlled import proof only missing')
assertAllFalse(acceptance.acceptedForExecutionToday, 'accepted for execution today')
assert(safety.sourceSafety.sourceImportedInOwnerReview === false, 'source import safety must remain false')
assert(safety.sourceSafety.hasOnlyAllowedEvaluatorImport === true, 'allowed evaluator import safety missing')
assert(readiness.controlledImportProofMayProceed.importStaticIntegrationSource === true, 'controlled import source missing')
assert(readiness.controlledImportProofMayProceed.callStaticIntegrationEvaluationFunction === true, 'controlled evaluation function missing')
assert(readiness.controlledImportProofMayProceed.assertFixtureCounts === true, 'fixture assertion missing')
assert(readiness.controlledImportProofMayProceed.assertReadinessClaimFalse === true, 'readiness false assertion missing')
for (const [key, value] of Object.entries(readiness.controlledImportProofMayProceed)) {
  if (!['importStaticIntegrationSource', 'callStaticIntegrationEvaluationFunction', 'assertFixtureCounts', 'assertReadinessClaimFalse'].includes(key)) {
    assert(value === false, `controlledImportProofMayProceed.${key} must remain false`)
  }
}
assert(readiness.expectedControlledProofCounts.fixtureCount === 9, 'expected fixture count mismatch')
assert(readiness.expectedControlledProofCounts.rejectedPayloadFieldCount === 14, 'expected rejected field count mismatch')
assert(blockers.blockers.some((row) => row.blockerId === 'controlled_static_import_proof_pending' && row.status === 'next'), 'controlled import proof next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.gate2qStaticIntegrationSourceAcceptedForControlledImportProof === true, 'allowed Gate 2Q claim missing')
assert(policy.allowedClaims.controlledImportProofMayProceed === true, 'allowed import proof claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2r-controlled-static-integration-import-proof.md')
assert(nextPrompt.includes(decision), 'Gate 2R prompt must require owner-review decision')
assert(nextPrompt.includes('no route execution'), 'Gate 2R prompt must preserve no-route-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-readiness-evaluator-static-integration-source-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-owner-review-diagnostics.mjs', 'package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_source_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr842Verified: true,
  gate2qStaticIntegrationSourceAcceptedForControlledImportProof: review.reviewResult.gate2qStaticIntegrationSourceAcceptedForControlledImportProof,
  staticIntegrationSourcePath: review.reviewResult.staticIntegrationSourcePath,
  sourceImportedInOwnerReview: review.reviewResult.sourceImportedInOwnerReview,
  controlledImportProofMayProceed: review.reviewResult.controlledImportProofMayProceed,
  routeResolverImportedInOwnerReview: review.reviewResult.routeResolverImportedInOwnerReview,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInOwnerReview,
  nextPrompt: review.nextPrompt,
}, null, 2))
