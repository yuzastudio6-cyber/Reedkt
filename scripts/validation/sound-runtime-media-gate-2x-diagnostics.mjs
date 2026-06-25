import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2x_controlled_route_resolver_import_proof_passed_with_warnings_ready_for_import_proof_owner_review'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_route_resolver_import_owner_review_passed_with_warnings_ready_for_controlled_import_proof'
const gate2wDecision = 'sound_runtime_media_gate_2w_route_resolver_import_owner_approval_plan_completed_with_warnings_ready_for_import_approval_owner_review'
const sourceHead = '6ff8028189b4f60552e61cfd2161d2b4e5c47d44'

const docs = [
  'docs/sound-runtime-media-gate-2x-controlled-route-resolver-import-proof-result.md',
  'docs/sound-runtime-media-gate-2x-import-proof-module-register.md',
  'docs/sound-runtime-media-gate-2x-side-effect-scan-register.md',
  'docs/sound-runtime-media-gate-2x-import-proof-output-register.md',
  'docs/sound-runtime-media-gate-2x-blocked-readiness-register.md',
  'docs/sound-runtime-media-gate-2x-runtime-claim-policy.md',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function parseJsonBlock(path) {
  const text = read(path)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${path} missing fenced json block`)
  return JSON.parse(match[1])
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.decision === decision, `${path} decision mismatch`)
}

const result = parsed['docs/sound-runtime-media-gate-2x-controlled-route-resolver-import-proof-result.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr881.status === 'merged', 'PR #881 merge evidence missing')
assert(result.sourceVerification.pr881.mergeCommit === sourceHead, 'PR #881 merge commit mismatch')
assert(result.sourceVerification.pr881.decision === ownerDecision, 'PR #881 decision mismatch')
assert(result.sourceVerification.pr878.decision === gate2wDecision, 'PR #878 decision mismatch')
assert(result.controlledImportProof.proofStatus === 'passed', 'controlled import proof did not pass')
assert(result.controlledImportProof.imported === true, 'module import proof missing')
assert(result.controlledImportProof.exportCount === 3, 'export count mismatch')
assert(result.controlledImportProof.fixtureCount === 9, 'fixture count mismatch')
assert(result.controlledImportProof.functionExportPresent === true, 'function export missing')
assert(result.controlledImportProof.functionInvoked === false, 'function must not be invoked')
assert(result.controlledImportProof.serverRouteExecuted === false, 'server route must not execute')
assert(result.controlledImportProof.workerExecutionRun === false, 'worker execution must not run')
assert(result.controlledImportProof.routeReadinessClaimed === false, 'route readiness must remain unclaimed')

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-route-resolver-import-owner-review.md')
assert(ownerReview.decision === ownerDecision, 'source owner-review decision mismatch')
assert(ownerReview.ownerReviewResult.controlledImportProofMayProceed === true, 'source owner review did not approve proof')
assert(ownerReview.ownerReviewResult.routeResolverImportApprovedForFutureProofOnly === true, 'future proof-only import approval missing')
assert(ownerReview.ownerReviewResult.serverRouteExecutedToday === false, 'source owner review must not execute route')

const moduleRegister = parsed['docs/sound-runtime-media-gate-2x-import-proof-module-register.md']
assert(moduleRegister.moduleInspection.staticInspectionPassed === true, 'static inspection must pass')
assert(moduleRegister.moduleInspection.forbiddenApisDetected === false, 'forbidden APIs must not be detected')
assert(moduleRegister.moduleInspection.exports.length === 3, 'export list mismatch')
assert(moduleRegister.proofBoundaries.moduleImportedForProof === true, 'module import proof boundary missing')
assert(moduleRegister.proofBoundaries.exportedFunctionInvoked === false, 'function invocation must be false')
assert(moduleRegister.proofBoundaries.serverRouteExecuted === false, 'server route execution must be false')

const sideEffects = parsed['docs/sound-runtime-media-gate-2x-side-effect-scan-register.md']
for (const value of Object.values(sideEffects.staticSideEffectScan)) {
  if (typeof value === 'boolean') assert(value === false || value === true, 'side effect scan values must be booleans')
}
assert(sideEffects.staticSideEffectScan.fsReadWriteApisDetected === false, 'fs APIs must not be detected')
assert(sideEffects.staticSideEffectScan.networkApisDetected === false, 'network APIs must not be detected')
assert(sideEffects.staticSideEffectScan.childProcessApisDetected === false, 'child process APIs must not be detected')
assert(sideEffects.staticSideEffectScan.supabaseSqlDetected === false, 'Supabase/SQL must not be detected')
assert(sideEffects.controlledImportSideEffectResult.serverRouteExecuted === false, 'controlled import must not execute routes')
assert(sideEffects.controlledImportSideEffectResult.workerExecutionRun === false, 'controlled import must not execute workers')
assert(sideEffects.controlledImportSideEffectResult.artifactCreated === false, 'controlled import must not create artifacts')

const output = parsed['docs/sound-runtime-media-gate-2x-import-proof-output-register.md']
assert(output.sanitizedOutput.imported === true, 'sanitized output import missing')
assert(output.sanitizedOutput.routeResolverImported === true, 'sanitized output import flag missing')
assert(output.sanitizedOutput.functionInvoked === false, 'sanitized output function invocation must be false')
assert(output.sanitizedOutput.serverRouteExecuted === false, 'sanitized output route execution must be false')
assert(output.sanitizedOutput.readinessClaimed === false, 'sanitized output readiness must be false')

const blocked = parsed['docs/sound-runtime-media-gate-2x-blocked-readiness-register.md']
for (const value of Object.values(blocked.blockedReadinessClaims)) {
  assert(value === 'blocked_unclaimed', 'readiness claims must remain blocked_unclaimed')
}
assert(blocked.stillRequiredBeforeAnyReadinessClaim.includes('controlled server route execution proof'), 'route execution proof requirement missing')

const policy = parsed['docs/sound-runtime-media-gate-2x-runtime-claim-policy.md']
assert(policy.allowedClaims.controlledRouteResolverImportProofPassed === true, 'import proof pass claim missing')
assert(policy.allowedClaims.routeResolverImportedForProofOnly === true, 'proof-only import claim missing')
assert(policy.allowedClaims.serverRouteExecuted === false, 'server route execution claim must be false')
assert(policy.allowedClaims.routeReadinessClaimed === false, 'route readiness claim must be false')
for (const value of Object.values(policy.forbiddenInGate2x)) {
  assert(value === true, 'forbidden Gate 2X scope must remain true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-route-resolver-import-proof-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2X decision')
assert(nextPrompt.includes('no route execution'), 'next prompt must preserve no route execution')
assert(nextPrompt.includes('must not execute server routes'), 'next prompt must block server route execution')
assert(nextPrompt.includes('SOUND-RUNTIME-MEDIA-GATE-2Y'), 'next Gate 2Y prompt missing')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2x:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2x-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2x_diagnostics_passed',
  decision,
  sourceHead,
  controlledImportProofPassed: true,
  routeResolverImportedForProofOnly: true,
  functionInvoked: false,
  serverRouteExecuted: false,
  routeReadinessClaimed: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-ROUTE-RESOLVER-IMPORT-PROOF-OWNER-REVIEW: review controlled import proof, no route execution'
}, null, 2))
