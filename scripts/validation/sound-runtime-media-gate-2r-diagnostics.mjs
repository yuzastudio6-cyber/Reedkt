#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'sound_runtime_media_gate_2r_controlled_static_integration_import_proof_passed_with_warnings_ready_for_import_proof_owner_review'
const sourceOwnerDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_evaluator_static_integration_source_owner_review_passed_with_warnings_ready_for_controlled_static_import_proof'
const baseSourceHead = '938e808aaf9d4fdab475ec5be0ef671f46ad1b86'
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
  ['docs/sound-runtime-media-gate-2r-controlled-static-integration-import-proof-result.md', 'sound-runtime-media-gate-2r-controlled-static-integration-import-proof-result'],
  ['docs/sound-runtime-media-gate-2r-rejected-payload-field-proof-register.md', 'sound-runtime-media-gate-2r-rejected-payload-field-proof-register'],
  ['docs/sound-runtime-media-gate-2r-import-boundary-register.md', 'sound-runtime-media-gate-2r-import-boundary-register'],
  ['docs/sound-runtime-media-gate-2r-blocker-follow-up-register.md', 'sound-runtime-media-gate-2r-blocker-follow-up-register'],
  ['docs/sound-runtime-media-gate-2r-runtime-claim-policy.md', 'sound-runtime-media-gate-2r-runtime-claim-policy'],
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

const resultDoc = parseBlock(docs[0][0], docs[0][1])
const fieldRegister = parseBlock(docs[1][0], docs[1][1])
const importBoundary = parseBlock(docs[2][0], docs[2][1])
const blockers = parseBlock(docs[3][0], docs[3][1])
const claimPolicy = parseBlock(docs[4][0], docs[4][1])
const sourceOwnerReview = parseBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-route-readiness-evaluator-static-integration-source-owner-review')

for (const entry of [resultDoc, fieldRegister, importBoundary, blockers, claimPolicy]) {
  assert(entry.decision === decision, 'Gate 2R decision mismatch')
}

assert(resultDoc.sourceVerification.baseSourceHead === baseSourceHead, 'base source head mismatch')
assert(resultDoc.sourceVerification.pr846.status === 'merged', 'PR #846 must be merged')
assert(resultDoc.sourceVerification.pr846.mergeCommit === baseSourceHead, 'PR #846 merge commit mismatch')
assert(resultDoc.sourceVerification.pr846.decision === sourceOwnerDecision, 'PR #846 decision mismatch')
assert(sourceOwnerReview.decision === sourceOwnerDecision, 'source owner review decision mismatch')
assert(resultDoc.proofResult.staticIntegrationSourcePath === integrationPath, 'integration path mismatch')
assert(resultDoc.proofResult.evaluatorSourcePath === evaluatorPath, 'evaluator path mismatch')
assert(resultDoc.proofResult.sourceFixAppliedInThisPacket === true, 'source fix must be recorded')
assert(resultDoc.proofResult.moduleImported === true, 'module import proof missing')
assert(resultDoc.proofResult.staticEvaluationFunctionCalled === true, 'function call proof missing')

assert(fs.existsSync(path.join(root, evaluatorPath)), 'evaluator source missing')
assert(fs.existsSync(path.join(root, integrationPath)), 'integration source missing')
const integrationText = read(integrationPath)
assert((integrationText.match(/(^|\n)\s*import\s+/g) || []).length === 1, 'integration source must have exactly one import')
assert(integrationText.includes("from './route-readiness-evaluator.mjs'"), 'integration source must import only evaluator source')
assert(!/\brequire\s*\(/.test(integrationText), 'integration source must not require dependencies')
assert(!/\bfetch\s*\(/.test(integrationText), 'integration source must not call fetch')
assert(!/child_process|execFile|execSync|spawn|spawnSync|new\s+Worker|process\.env|Deno\.|Bun\./i.test(integrationText), 'integration source contains prohibited runtime execution marker')
for (const field of canonicalRejectedPayloadFields) {
  assert(integrationText.includes(`'${field}'`), `integration source missing canonical rejected payload field ${field}`)
  assert(fieldRegister.canonicalRejectedPayloadFields.includes(field), `field register missing ${field}`)
}
for (const field of nonCanonicalRejectedPayloadFields) {
  assert(!integrationText.includes(`'${field}'`), `integration source retains non-canonical rejected payload field ${field}`)
  assert(fieldRegister.sourceFix.nonCanonicalFieldsRemoved.includes(field), `field register missing removed field ${field}`)
}
assert(fieldRegister.canonicalRejectedPayloadFieldCount === 14, 'canonical field count mismatch')
assert(fieldRegister.sourceFix.fixedCountFrom === 13, 'fixed-from count mismatch')
assert(fieldRegister.sourceFix.fixedCountTo === 14, 'fixed-to count mismatch')
assert(fieldRegister.sourceFix.canonicalFieldsCovered === true, 'canonical field coverage missing')

const mod = await import(path.join(root, integrationPath))
const proof = mod.evaluateSoundCpuStaticRouteReadinessIntegration()
const counts = proof.evaluatorSummary.counts
assert(proof.fixtureCount === 9, 'import proof fixture count mismatch')
assert(counts.acceptedFixtureCount === 4, 'import proof accepted fixture count mismatch')
assert(counts.rejectedPayloadFieldCount === 14, 'import proof rejected payload field count mismatch')
assert(counts.mismatchCaseCount === 5, 'import proof mismatch case count mismatch')
assert(proof.evaluatorSummary.matchesExpectedStaticShape === true, 'import proof static shape mismatch')
assert(proof.readinessClaim === false, 'readiness claim must remain false')
assertAllFalse(proof.runtimeFlags, 'import proof runtime flag')
assertAllFalse(proof.closedClaims, 'import proof closed claim')

assert(importBoundary.allowedInGate2r.importStaticIntegrationSource === true, 'allowed static import missing')
assert(importBoundary.allowedInGate2r.callStaticEvaluationFunction === true, 'allowed function call missing')
assert(importBoundary.allowedInGate2r.inspectReturnedStaticSummary === true, 'allowed summary inspection missing')
assert(importBoundary.observedInGate2r.importStaticIntegrationSource === true, 'observed import missing')
assert(importBoundary.observedInGate2r.callStaticEvaluationFunction === true, 'observed function call missing')
for (const [key, value] of Object.entries(importBoundary.observedInGate2r)) {
  if (!['importStaticIntegrationSource', 'callStaticEvaluationFunction'].includes(key)) {
    assert(value === false, `observedInGate2r.${key} must remain false`)
  }
}
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'static_integration_rejected_payload_field_count_mismatch' && row.status === 'resolved_by_canonical_payload_field_source_fix'), 'resolved count blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'worker_runtime_jobs_import_proof_owner_review_pending' && row.status === 'next'), 'owner review next blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assert(claimPolicy.allowedClaims.controlledStaticIntegrationImportProofPassed === true, 'allowed import proof claim missing')
assertAllFalse(claimPolicy.runtimeFlags, 'claim policy runtime flag')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-route-readiness-evaluator-controlled-import-proof-owner-review.md')
assert(nextPrompt.includes(decision), 'owner-review prompt must require Gate 2R decision')
assert(nextPrompt.includes('no route execution'), 'owner-review prompt must preserve no-route-execution scope')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['sound-runtime-media-gate-2r:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2r-diagnostics.mjs', 'Gate 2R package script missing')

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2r_diagnostics_passed',
  decision,
  baseSourceHead,
  pr846Verified: true,
  sourceFixAppliedInThisPacket: resultDoc.proofResult.sourceFixAppliedInThisPacket,
  moduleImported: resultDoc.proofResult.moduleImported,
  staticEvaluationFunctionCalled: resultDoc.proofResult.staticEvaluationFunctionCalled,
  fixtureCount: proof.fixtureCount,
  acceptedFixtureCount: counts.acceptedFixtureCount,
  rejectedPayloadFieldCount: counts.rejectedPayloadFieldCount,
  mismatchCaseCount: counts.mismatchCaseCount,
  matchesExpectedStaticShape: proof.evaluatorSummary.matchesExpectedStaticShape,
  readinessClaim: proof.readinessClaim,
  runtimeFlagsAllFalse: Object.values(proof.runtimeFlags).every((value) => value === false),
  routeExecutionRun: false,
  nextPrompt: resultDoc.nextPrompt,
}, null, 2))
