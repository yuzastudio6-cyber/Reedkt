#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_controlled_import_proof_owner_review_passed_with_warnings_ready_for_bounded_route_readiness_review'
const gate2rDecision = 'sound_runtime_media_gate_2r_controlled_static_integration_import_proof_passed_with_warnings_ready_for_import_proof_owner_review'
const sourceHead = '52e966f05eea1dc7b16a61029acbfcd13004f86e'
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

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-evidence-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-evidence-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-boundary-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-boundary-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-claim-policy'],
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
const evidence = parseBlock(docs[2][0], docs[2][1])
const boundary = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const claimPolicy = parseBlock(docs[5][0], docs[5][1])
const gate2r = parseBlock('docs/sound-runtime-media-gate-2r-controlled-static-integration-import-proof-result.md', 'sound-runtime-media-gate-2r-controlled-static-integration-import-proof-result')
const gate2rFields = parseBlock('docs/sound-runtime-media-gate-2r-rejected-payload-field-proof-register.md', 'sound-runtime-media-gate-2r-rejected-payload-field-proof-register')

for (const entry of [review, acceptance, evidence, boundary, blockers, claimPolicy]) {
  assert(entry.decision === decision, 'controlled import proof owner-review decision mismatch')
}

assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr850.status === 'merged', 'PR #850 must be merged')
assert(review.sourceVerification.pr850.mergeCommit === sourceHead, 'PR #850 merge commit mismatch')
assert(review.sourceVerification.pr850.decision === gate2rDecision, 'PR #850 decision mismatch')
assert(gate2r.decision === gate2rDecision, 'Gate 2R decision mismatch')
assert(gate2r.sourceVerification.pr846.status === 'merged', 'PR #846 must be merged')
assert(gate2r.proofResult.sourceFixAppliedInThisPacket === true, 'Gate 2R source fix missing')
assert(gate2r.proofResult.moduleImported === true, 'Gate 2R import proof missing')
assert(gate2r.proofResult.staticEvaluationFunctionCalled === true, 'Gate 2R function call proof missing')
assert(gate2r.proofResult.fixtureCount === 9, 'Gate 2R fixture count mismatch')
assert(gate2r.proofResult.acceptedFixtureCount === 4, 'Gate 2R accepted fixture count mismatch')
assert(gate2r.proofResult.rejectedPayloadFieldCount === 14, 'Gate 2R rejected field count mismatch')
assert(gate2r.proofResult.mismatchCaseCount === 5, 'Gate 2R mismatch count mismatch')
assert(gate2r.proofResult.matchesExpectedStaticShape === true, 'Gate 2R static shape mismatch')
assert(gate2r.proofResult.readinessClaim === false, 'Gate 2R readiness claim must be false')

assert(review.reviewResult.gate2rProofAcceptedForBoundedRouteReadinessReview === true, 'Gate 2R proof acceptance missing')
assert(review.reviewResult.staticIntegrationSourcePath === integrationPath, 'integration path mismatch')
assert(review.reviewResult.canonicalRejectedPayloadFieldCount === 14, 'canonical field count mismatch')
assert(review.reviewResult.moduleImportedInGate2r === true, 'Gate 2R module import evidence missing')
assert(review.reviewResult.staticEvaluationFunctionCalledInGate2r === true, 'Gate 2R function call evidence missing')
for (const key of [
  'moduleImportedInOwnerReview',
  'routeResolverImportedInOwnerReview',
  'routeExecutionRunInOwnerReview',
  'workerExecutionRunInOwnerReview',
  'acceptedForRouteExecutionToday',
  'acceptedForRouteReadinessToday',
  'acceptedForWorkerReadinessToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(review.reviewResult[key] === false, `reviewResult.${key} must remain false`)
}

assert(fs.existsSync(path.join(root, integrationPath)), 'integration source missing')
const integrationText = read(integrationPath)
assert((integrationText.match(/(^|\n)\s*import\s+/g) || []).length === 1, 'integration source must have exactly one import')
assert(integrationText.includes("from './route-readiness-evaluator.mjs'"), 'integration source must import only evaluator source')
for (const field of canonicalRejectedPayloadFields) {
  assert(integrationText.includes(`'${field}'`), `integration source missing canonical rejected payload field ${field}`)
  assert(gate2rFields.canonicalRejectedPayloadFields.includes(field), `Gate 2R field register missing ${field}`)
}

assert(acceptance.acceptedForFuturePlanningOnly.gate2rControlledStaticImportProof === true, 'acceptance missing Gate 2R proof')
assert(acceptance.acceptedForFuturePlanningOnly.boundedRouteReadinessReviewMayProceed === true, 'bounded review acceptance missing')
assertAllFalse(acceptance.acceptedForExecutionToday, 'accepted for execution today')
assert(evidence.acceptedGate2rEvidence.rejectedPayloadFieldCount === 14, 'evidence rejected field count mismatch')
assert(evidence.acceptedGate2rEvidence.runtimeFlagsAllFalse === true, 'evidence runtime flags not closed')
assert(evidence.ownerReviewMode.staticIntegrationSourceImported === false, 'owner review must not import source')
assert(evidence.ownerReviewMode.routeResolverImported === false, 'owner review must not import route resolver')
assert(evidence.ownerReviewMode.routeExecutionRun === false, 'owner review must not execute route')
assert(boundary.acceptedBoundary.boundedRouteReadinessReviewPlanningOnly === true, 'bounded planning boundary missing')
for (const [key, value] of Object.entries(boundary.acceptedBoundary)) {
  if (!['staticIntegrationProofEvidenceOnly', 'boundedRouteReadinessReviewPlanningOnly'].includes(key)) {
    assert(value === false, `acceptedBoundary.${key} must remain false`)
  }
}
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'static_integration_rejected_payload_field_count_mismatch'), 'resolved mismatch blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'bounded_route_readiness_review_pending' && row.status === 'next'), 'bounded review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(claimPolicy.allowedClaims.gate2rProofAcceptedForFuturePlanning === true, 'allowed Gate 2R proof claim missing')
assert(claimPolicy.allowedClaims.boundedRouteReadinessReviewMayProceed === true, 'allowed bounded review claim missing')
assertAllFalse(claimPolicy.runtimeFlags, 'claim policy runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2s-bounded-route-readiness-review-plan.md')
assert(nextPrompt.includes(decision), 'Gate 2S prompt must require owner-review decision')
assert(nextPrompt.includes('no route execution'), 'Gate 2S prompt must preserve no-route-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-review-diagnostics.mjs', 'owner-review package script missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_controlled_import_proof_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr850Verified: true,
  gate2rProofAcceptedForBoundedRouteReadinessReview: review.reviewResult.gate2rProofAcceptedForBoundedRouteReadinessReview,
  canonicalRejectedPayloadFieldCount: review.reviewResult.canonicalRejectedPayloadFieldCount,
  moduleImportedInOwnerReview: review.reviewResult.moduleImportedInOwnerReview,
  routeResolverImportedInOwnerReview: review.reviewResult.routeResolverImportedInOwnerReview,
  routeExecutionRunInOwnerReview: review.reviewResult.routeExecutionRunInOwnerReview,
  acceptedForRouteReadinessToday: review.reviewResult.acceptedForRouteReadinessToday,
  nextPrompt: review.nextPrompt,
}, null, 2))
