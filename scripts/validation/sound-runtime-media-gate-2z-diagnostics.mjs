import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2z_blocked_typescript_runtime_loading'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_server_route_execution_proof_plan_owner_review_passed_with_warnings_ready_for_controlled_server_route_execution_proof'
const sourceHead = '063e2ea122cde4941629c86ccb89f09c0574f939'

const docs = [
  'docs/sound-runtime-media-gate-2z-controlled-server-route-execution-proof-result.md',
  'docs/sound-runtime-media-gate-2z-typescript-runtime-loading-blocker.md',
  'docs/sound-runtime-media-gate-2z-proof-output-register.md',
  'docs/sound-runtime-media-gate-2z-execution-boundary-register.md',
  'docs/sound-runtime-media-gate-2z-blocker-follow-up-register.md',
  'docs/sound-runtime-media-gate-2z-runtime-claim-policy.md',
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

const result = parsed['docs/sound-runtime-media-gate-2z-controlled-server-route-execution-proof-result.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr895.status === 'merged', 'PR #895 evidence missing')
assert(result.sourceVerification.pr895.mergeCommit === sourceHead, 'PR #895 merge commit mismatch')
assert(result.sourceVerification.pr895.decision === ownerDecision, 'PR #895 decision mismatch')
assert(result.proofAttempt.attempted === true, 'proof attempt flag missing')
assert(result.proofAttempt.command === 'node --experimental-strip-types --input-type=module', 'proof command mismatch')
assert(result.proofAttempt.modulePath === 'server/workers/sound-cpu/index.ts', 'module path mismatch')
assert(result.proofAttempt.proofStatus === 'blocked', 'proof status must be blocked')
assert(result.proofAttempt.blockedReason === 'typescript_runtime_loading_extensionless_import_resolution', 'blocked reason mismatch')
assert(result.proofAttempt.errorCode === 'ERR_MODULE_NOT_FOUND', 'error code mismatch')
assert(result.proofAttempt.missingSpecifier === './synthetic-route-decision', 'missing specifier mismatch')
assert(result.proofAttempt.routeSourceImportCompleted === false, 'route source import must not complete')
assert(result.proofAttempt.resolverInvoked === false, 'resolver must not be invoked')
assert(result.proofAttempt.serverRouteExecuted === false, 'server route execution must be false')
assert(result.proofAttempt.routeReadinessClaimed === false, 'readiness claim must be false')

const ownerReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-server-route-execution-proof-plan-owner-review.md')
assert(ownerReview.decision === ownerDecision, 'owner review decision mismatch')
assert(ownerReview.sourceVerification.sourceHead === 'e9458954f1f85d6efd924df64a197bc15bd8c6a9', 'owner review source head mismatch')
assert(ownerReview.sourceVerification.pr892.mergeCommit === 'e9458954f1f85d6efd924df64a197bc15bd8c6a9', 'owner review PR #892 source mismatch')
assert(ownerReview.reviewResult.controlledServerRouteExecutionProofMayProceed === true, 'owner review did not allow proof attempt')
assert(ownerReview.reviewResult.serverRouteExecutionRunInThisOwnerReview === false, 'owner review must not execute route')

const blocker = parsed['docs/sound-runtime-media-gate-2z-typescript-runtime-loading-blocker.md']
assert(blocker.blocker.blockerId === 'typescript_runtime_loading_extensionless_import_resolution', 'blocker id mismatch')
assert(blocker.blocker.importFailure.errorCode === 'ERR_MODULE_NOT_FOUND', 'blocker error code mismatch')
assert(blocker.blocker.dependencyHydrationForced === false, 'dependency hydration must not be forced')
assert(blocker.blocker.npxTsxForced === false, 'npx tsx must not be forced')
assert(blocker.blocker.runtimeSourceEdited === false, 'runtime source must not be edited')
assert(blocker.blockedOutcome.resolverInvoked === false, 'blocked outcome resolver must be false')
assert(blocker.blockedOutcome.serverRouteExecuted === false, 'blocked outcome route execution must be false')

const output = parsed['docs/sound-runtime-media-gate-2z-proof-output-register.md']
assert(output.sanitizedOutput.nodeVersion === 'v26.3.0', 'node version mismatch')
assert(output.sanitizedOutput.errorCode === 'ERR_MODULE_NOT_FOUND', 'sanitized output error code mismatch')
assert(output.sanitizedOutput.secretsRedacted === true, 'secrets redaction flag missing')
assert(output.sanitizedOutput.fileArtifactsCreated === false, 'file artifacts must not be created')
assert(output.observedProofState.routeSourceImportAttempted === true, 'route import attempt missing')
assert(output.observedProofState.routeSourceImportCompleted === false, 'route import completion must be false')
assert(output.observedProofState.acceptedCaseCount === 0, 'accepted case count must be zero')
assert(output.observedProofState.routeReadinessClaimed === false, 'readiness must remain false')

const boundary = parsed['docs/sound-runtime-media-gate-2z-execution-boundary-register.md']
assert(boundary.allowedInGate2z.controlledRouteSourceImportAttempt === true, 'controlled import attempt allowance missing')
assert(boundary.actuallyOccurredInGate2z.controlledRouteSourceImportAttempt === true, 'actual import attempt missing')
assert(boundary.actuallyOccurredInGate2z.routeSourceImportCompleted === false, 'actual route import completion must be false')
assert(boundary.actuallyOccurredInGate2z.resolverInvocation === false, 'actual resolver invocation must be false')
assert(boundary.actuallyOccurredInGate2z.serverRouteExecution === false, 'actual server route execution must be false')
assert(boundary.actuallyOccurredInGate2z.supabaseSql === false, 'actual Supabase/SQL must be false')

const blockers = parsed['docs/sound-runtime-media-gate-2z-blocker-follow-up-register.md']
assert(blockers.unresolvedBlockers.some((row) => row.blockerId === 'typescript_runtime_loading_extensionless_import_resolution'), 'TS runtime blocker missing')
assert(blockers.unresolvedBlockers.some((row) => row.blockerId === 'controlled_server_route_execution_proof_not_passed'), 'proof-not-passed blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must be no')

const policy = parsed['docs/sound-runtime-media-gate-2z-runtime-claim-policy.md']
assert(policy.allowedClaims.controlledRouteSourceImportAttempted === true, 'import attempt claim missing')
assert(policy.allowedClaims.typescriptRuntimeLoadingBlocked === true, 'runtime loading blocked claim missing')
assert(policy.allowedClaims.routeSourceImportCompleted === false, 'route source import completion claim must be false')
assert(policy.allowedClaims.resolverInvoked === false, 'resolver invoked claim must be false')
assert(policy.allowedClaims.serverRouteExecuted === false, 'server route executed claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const prompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2z-typescript-runtime-loading-fix.md')
assert(prompt.includes(decision), 'fix prompt must require blocked decision')
assert(prompt.includes('extensionless `./synthetic-route-decision` import'), 'fix prompt must name missing specifier')
assert(prompt.includes('must not force broad dependency hydration'), 'fix prompt must not force hydration')
assert(prompt.includes('must not execute workers'), 'fix prompt must block workers')
assert(prompt.includes('must not touch Supabase'), 'fix prompt must block Supabase')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2z:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2z-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2z_diagnostics_passed',
  decision,
  sourceHead,
  proofAttempted: true,
  proofStatus: 'blocked',
  blockedReason: 'typescript_runtime_loading_extensionless_import_resolution',
  routeSourceImportCompleted: false,
  resolverInvoked: false,
  serverRouteExecuted: false,
  routeReadinessClaimed: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2Z-TYPESCRIPT-RUNTIME-LOADING-FIX: fix controlled server route TypeScript loading blocker, no worker/media/Supabase execution'
}, null, 2))
