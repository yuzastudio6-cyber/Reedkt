#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2t_bounded_route_readiness_static_review_completed_with_warnings_ready_for_static_review_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_bounded_route_readiness_review_owner_review_passed_with_warnings_ready_for_bounded_route_readiness_static_review'
const gate2sDecision = 'sound_runtime_media_gate_2s_bounded_route_readiness_review_plan_completed_with_warnings_ready_for_bounded_route_readiness_owner_review'
const sourceHead = 'fd47c3d9ab003785fb7208ca052bdeeaafa88dc2'
const integrationPath = 'server/workers/sound-cpu/route-readiness-evaluator-static-integration.mjs'
const canonicalFields = [
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
  ['docs/sound-runtime-media-gate-2t-bounded-route-readiness-static-review-result.md', 'sound-runtime-media-gate-2t-bounded-route-readiness-static-review-result'],
  ['docs/sound-runtime-media-gate-2t-static-evidence-register.md', 'sound-runtime-media-gate-2t-static-evidence-register'],
  ['docs/sound-runtime-media-gate-2t-readiness-boundary-register.md', 'sound-runtime-media-gate-2t-readiness-boundary-register'],
  ['docs/sound-runtime-media-gate-2t-prohibited-execution-scan-register.md', 'sound-runtime-media-gate-2t-prohibited-execution-scan-register'],
  ['docs/sound-runtime-media-gate-2t-blocker-follow-up-register.md', 'sound-runtime-media-gate-2t-blocker-follow-up-register'],
  ['docs/sound-runtime-media-gate-2t-runtime-claim-policy.md', 'sound-runtime-media-gate-2t-runtime-claim-policy'],
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
const evidence = parseBlock(docs[1][0], docs[1][1])
const boundary = parseBlock(docs[2][0], docs[2][1])
const scan = parseBlock(docs[3][0], docs[3][1])
const blockers = parseBlock(docs[4][0], docs[4][1])
const policy = parseBlock(docs[5][0], docs[5][1])
const ownerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-owner-review.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-owner-review')
const ownerAcceptance = parseBlock('docs/worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-bounded-route-readiness-review-acceptance-register')
const gate2s = parseBlock('docs/sound-runtime-media-gate-2s-bounded-route-readiness-review-plan.md', 'sound-runtime-media-gate-2s-bounded-route-readiness-review-plan')
const gate2r = parseBlock('docs/sound-runtime-media-gate-2r-controlled-static-integration-import-proof-result.md', 'sound-runtime-media-gate-2r-controlled-static-integration-import-proof-result')

for (const entry of [result, evidence, boundary, scan, blockers, policy]) {
  assert(entry.decision === decision, 'Gate 2T decision mismatch')
}

assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr858.status === 'merged', 'PR #858 must be merged')
assert(result.sourceVerification.pr858.mergeCommit === sourceHead, 'PR #858 merge commit mismatch')
assert(result.sourceVerification.pr858.decision === ownerDecision, 'PR #858 decision mismatch')
assert(result.sourceVerification.pr855.decision === gate2sDecision, 'PR #855 decision mismatch')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(ownerReview.reviewResult.gate2sPlanAcceptedForFutureStaticReview === true, 'Gate 2S owner acceptance missing')
assert(ownerReview.reviewResult.acceptedForRouteReadinessToday === false, 'owner route readiness must remain false')
assert(ownerAcceptance.acceptedForFuturePlanningOnly.boundedRouteReadinessStaticReviewMayProceed === true, 'owner future static review acceptance missing')
assertAllFalse(ownerAcceptance.acceptedForExecutionToday, 'owner accepted for execution today')
assert(gate2s.decision === gate2sDecision, 'Gate 2S decision mismatch')
assert(gate2s.planScope.fixtureCount === 9, 'Gate 2S fixture count mismatch')
assert(gate2s.planScope.acceptedFixtureCount === 4, 'Gate 2S accepted fixture count mismatch')
assert(gate2s.planScope.rejectedPayloadFieldCount === 14, 'Gate 2S rejected field count mismatch')
assert(gate2s.planScope.mismatchCaseCount === 5, 'Gate 2S mismatch case count mismatch')
assert(gate2r.proofResult.matchesExpectedStaticShape === true, 'Gate 2R static shape must match')
assert(gate2r.proofResult.readinessClaim === false, 'Gate 2R readiness claim must remain false')

assert(result.staticReviewResult.boundedRouteReadinessStaticReviewCompleted === true, 'static review not completed')
assert(result.staticReviewResult.reviewedStaticIntegrationSourcePath === integrationPath, 'integration path mismatch')
assert(result.staticReviewResult.canonicalRejectedPayloadFieldCount === 14, 'canonical field count mismatch')
assert(result.staticReviewResult.fixtureCount === 9, 'fixture count mismatch')
assert(result.staticReviewResult.acceptedFixtureCount === 4, 'accepted fixture count mismatch')
assert(result.staticReviewResult.mismatchCaseCount === 5, 'mismatch case count mismatch')
for (const key of [
  'moduleImportedInGate2t',
  'routeResolverImportedInGate2t',
  'serverRouteExecutedInGate2t',
  'workerExecutionRunInGate2t',
  'toolExecutionRunInGate2t',
  'acceptedForRouteReadinessToday',
  'acceptedForWorkerReadinessToday',
  'acceptedForRuntimeReadinessToday',
  'acceptedForBetaOrProductionToday',
]) {
  assert(result.staticReviewResult[key] === false, `staticReviewResult.${key} must remain false`)
}

assert(evidence.acceptedStaticEvidence.canonicalRejectedPayloadFieldCount === 14, 'evidence canonical field count mismatch')
for (const field of canonicalFields) {
  assert(evidence.acceptedStaticEvidence.canonicalRejectedPayloadFields.includes(field), `evidence missing field ${field}`)
}
for (const [key, value] of Object.entries(evidence.evidenceNotAcceptedFor)) {
  assert(value === true, `evidenceNotAcceptedFor.${key} must remain true`)
}

assert(boundary.staticReviewMayConsider.staticIntegrationSourceText === true, 'static source text review missing')
assertAllFalse(boundary.acceptedForToday, 'acceptedForToday')
for (const [key, value] of Object.entries(boundary.staticReviewMustNotDo)) {
  assert(value === true, `staticReviewMustNotDo.${key} must be true`)
}
for (const [key, value] of Object.entries(scan.scanResult)) {
  if (key === 'changedFilesStaticOnly') {
    assert(value === true, 'scanResult.changedFilesStaticOnly must be true')
  } else {
    assert(value === false, `scanResult.${key} must remain false`)
  }
}
assert(scan.sourceInspection.sourceTextReadOnly === true, 'source text inspection must be read-only')
assert(scan.sourceInspection.sourceModuleImported === false, 'source module must not be imported')
assert(scan.sourceInspection.routeResolverImported === false, 'route resolver must not be imported')
assert(scan.sourceInspection.routeExecuted === false, 'route must not execute')

const integrationText = read(integrationPath)
assert((integrationText.match(/(^|\n)\s*import\s+/g) || []).length === 1, 'static integration source must have exactly one import')
assert(integrationText.includes("from './route-readiness-evaluator.mjs'"), 'static integration source must only import evaluator module')
for (const field of canonicalFields) {
  assert(integrationText.includes(`'${field}'`), `static integration source missing canonical field ${field}`)
}

assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'bounded_route_readiness_static_review_pending'), 'resolved static review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'bounded_route_readiness_static_review_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(policy.allowedClaims.boundedRouteReadinessStaticReviewCompleted === true, 'allowed static review claim missing')
assert(policy.allowedClaims.futureOwnerReviewRequired === true, 'future owner review claim missing')
assertAllFalse(policy.runtimeFlags, 'runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-route-readiness-static-review-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2T decision')
assert(nextPrompt.includes('no route execution'), 'next prompt must preserve no-route-execution scope')
assert(nextPrompt.includes('must not import route resolvers'), 'next prompt must block route resolver imports')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2t:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2t-diagnostics.mjs', 'Gate 2T package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2t_diagnostics_passed',
  decision,
  sourceHead,
  boundedRouteReadinessStaticReviewCompleted: result.staticReviewResult.boundedRouteReadinessStaticReviewCompleted,
  canonicalRejectedPayloadFieldCount: result.staticReviewResult.canonicalRejectedPayloadFieldCount,
  sourceTextInspected: result.staticReviewResult.sourceTextInspected,
  moduleImportedInGate2t: result.staticReviewResult.moduleImportedInGate2t,
  routeResolverImportedInGate2t: result.staticReviewResult.routeResolverImportedInGate2t,
  serverRouteExecutedInGate2t: result.staticReviewResult.serverRouteExecutedInGate2t,
  acceptedForRouteReadinessToday: result.staticReviewResult.acceptedForRouteReadinessToday,
  nextPrompt: result.nextPrompt,
}, null, 2))
