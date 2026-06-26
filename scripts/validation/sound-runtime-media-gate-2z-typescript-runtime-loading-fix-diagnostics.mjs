import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2z_typescript_runtime_loading_fix_passed_with_warnings_ready_for_server_route_execution_proof_owner_review'
const blockedDecision = 'sound_runtime_media_gate_2z_blocked_typescript_runtime_loading'
const ownerDecision = 'worker_runtime_jobs_sound_cpu_server_route_execution_proof_plan_owner_review_passed_with_warnings_ready_for_controlled_server_route_execution_proof'
const sourceHead = '0af8840a88850f284b029a357ce868d60ed4ae58'

const docs = [
  'docs/sound-runtime-media-gate-2z-typescript-runtime-loading-fix-result.md',
  'docs/sound-runtime-media-gate-2z-server-route-proof-output-register.md',
  'docs/sound-runtime-media-gate-2z-runtime-source-loading-fix-register.md',
  'docs/sound-runtime-media-gate-2z-server-route-proof-boundary-register.md',
  'docs/sound-runtime-media-gate-2z-blocker-resolution-register.md',
  'docs/sound-runtime-media-gate-2z-runtime-claim-policy-after-fix.md',
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

const result = parsed['docs/sound-runtime-media-gate-2z-typescript-runtime-loading-fix-result.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr898.status === 'merged', 'PR #898 merge evidence missing')
assert(result.sourceVerification.pr898.mergeCommit === sourceHead, 'PR #898 merge commit mismatch')
assert(result.sourceVerification.pr898.decision === blockedDecision, 'PR #898 decision mismatch')
assert(result.sourceVerification.pr895.decision === ownerDecision, 'PR #895 owner decision mismatch')
assert(result.loadingFix.blockerResolved === true, 'loading blocker must be resolved')
assert(result.loadingFix.specifierFixCount === 3, 'specifier fix count mismatch')
assert(result.loadingFix.moduleResolutionSupportedByRepoConfig === true, 'module resolution support missing')
assert(result.loadingFix.dependencyHydrationForced === false, 'dependency hydration must not be forced')
assert(result.loadingFix.npxTsxForced === false, 'npx tsx must not be forced')
assert(result.proofResult.proofStatus === 'passed', 'proof must pass')
assert(result.proofResult.imported === true, 'module import must pass')
assert(result.proofResult.exportCount === 9, 'export count mismatch')
assert(result.proofResult.resolverInvoked === true, 'resolver must be invoked')
assert(result.proofResult.assertionInvoked === true, 'assertion must be invoked')
assert(result.proofResult.acceptedCaseCount === 4, 'accepted case count mismatch')
assert(result.proofResult.rejectedCaseCount === 5, 'rejected case count mismatch')
assert(result.proofResult.serverRouteExecuted === false, 'server route execution must be false')
assert(result.proofResult.workerExecutionRun === false, 'worker execution must be false')
assert(result.proofResult.mediaProcessingRun === false, 'media processing must be false')
assert(result.proofResult.supabaseSqlRun === false, 'Supabase/SQL must be false')
assert(result.proofResult.routeReadinessClaimed === false, 'route readiness must remain unclaimed')

const blockedSource = parseJsonBlock('docs/sound-runtime-media-gate-2z-controlled-server-route-execution-proof-result.md')
assert(blockedSource.decision === blockedDecision, 'blocked source decision mismatch')
assert(blockedSource.proofAttempt.errorCode === 'ERR_MODULE_NOT_FOUND', 'blocked source error mismatch')
assert(blockedSource.proofAttempt.resolverInvoked === false, 'blocked source resolver state mismatch')

const output = parsed['docs/sound-runtime-media-gate-2z-server-route-proof-output-register.md']
assert(output.sanitizedOutput.nodeVersion === 'v26.3.0', 'node version mismatch')
assert(output.sanitizedOutput.proofStatus === 'passed', 'sanitized proof status mismatch')
assert(output.sanitizedOutput.exportCount === 9, 'sanitized export count mismatch')
assert(output.sanitizedOutput.fileArtifactsCreated === false, 'file artifacts must not be created')
assert(output.observedProofState.routeSourceImportCompleted === true, 'route import completion missing')
assert(output.observedProofState.acceptedCaseCount === 4, 'output accepted case count mismatch')
assert(output.observedProofState.rejectedCaseCount === 5, 'output rejected case count mismatch')
assert(output.observedProofState.rejectedReasons.includes('unsafe_runtime_flag'), 'unsafe runtime rejection missing')
assert(output.observedProofState.workerExecutionRun === false, 'output worker execution must be false')
assert(output.observedProofState.routeReadinessClaimed === false, 'output readiness must be false')

const fix = parsed['docs/sound-runtime-media-gate-2z-runtime-source-loading-fix-register.md']
assert(fix.sourceFix.publicApiChanged === false, 'public API must not change')
assert(fix.sourceFix.runtimeInterfaceChanged === false, 'runtime interface must not change')
assert(fix.sourceFix.filesChanged.length === 2, 'source fix file count mismatch')
assert(fix.sourceFix.filesChanged[0].specifierChanges.length === 2, 'index specifier count mismatch')
assert(fix.sourceFix.filesChanged[1].specifierChanges.length === 1, 'decision specifier count mismatch')
assert(fix.sourceFix.repoConfigSupportsTsImportSpecifiers.allowImportingTsExtensions === true, 'allowImportingTsExtensions missing')
for (const value of Object.values(fix.forbiddenFixPathsNotTouched)) {
  assert(value === true, 'forbidden fix paths must stay untouched')
}

const indexText = read('server/workers/sound-cpu/index.ts')
const decisionText = read('server/workers/sound-cpu/synthetic-route-decision.ts')
assert(indexText.includes("from './synthetic-route-decision.ts'"), 'index route-decision .ts specifier missing')
assert(indexText.includes("from './synthetic-route-types.ts'"), 'index route-types .ts specifier missing')
assert(!indexText.includes("from './synthetic-route-decision'"), 'index extensionless route-decision specifier remains')
assert(!indexText.includes("from './synthetic-route-types'"), 'index extensionless route-types specifier remains')
assert(decisionText.includes("from './synthetic-route-types.ts'"), 'decision route-types .ts specifier missing')
assert(!decisionText.includes("from './synthetic-route-types'"), 'decision extensionless route-types specifier remains')

const boundary = parsed['docs/sound-runtime-media-gate-2z-server-route-proof-boundary-register.md']
assert(boundary.allowedInThisFixGate.controlledRouteSourceImport === true, 'controlled import allowance missing')
assert(boundary.actuallyOccurredInThisFixGate.routeSourceImportCompleted === true, 'route source import completion missing')
assert(boundary.actuallyOccurredInThisFixGate.resolverInvocation === true, 'resolver invocation missing')
assert(boundary.actuallyOccurredInThisFixGate.assertionInvocation === true, 'assertion invocation missing')
assert(boundary.actuallyOccurredInThisFixGate.acceptedStaticCaseCount === 4, 'accepted static case count mismatch')
assert(boundary.actuallyOccurredInThisFixGate.rejectedStaticCaseCount === 5, 'rejected static case count mismatch')
assert(boundary.actuallyOccurredInThisFixGate.serverRouteExecution === false, 'server route execution must remain false')
assert(boundary.actuallyOccurredInThisFixGate.supabaseSql === false, 'Supabase/SQL must remain false')
assert(boundary.ownerReviewRequiredBeforeReadiness === true, 'owner review before readiness missing')

const blockers = parsed['docs/sound-runtime-media-gate-2z-blocker-resolution-register.md']
assert(blockers.resolvedBlockers.some((row) => row.blockerId === 'typescript_runtime_loading_extensionless_import_resolution'), 'loading blocker resolution missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'server_route_execution_proof_owner_review_pending'), 'owner review blocker missing')
assert(blockers.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(blockers.supabaseClassification.sqlExecuted === 'no', 'SQL execution must be no')

const policy = parsed['docs/sound-runtime-media-gate-2z-runtime-claim-policy-after-fix.md']
assert(policy.allowedClaims.typescriptRuntimeLoadingFixApplied === true, 'loading fix claim missing')
assert(policy.allowedClaims.staticInMemoryResolverProofPassed === true, 'static proof claim missing')
assert(policy.allowedClaims.serverRouteExecuted === false, 'server route execution claim must be false')
assert(policy.allowedClaims.workerExecutionRun === false, 'worker execution claim must be false')
assert(policy.allowedClaims.routeReadinessClaimed === false, 'readiness claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const ownerPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-server-route-execution-proof-owner-review.md')
assert(ownerPrompt.includes(decision), 'owner-review prompt must require fix decision')
assert(ownerPrompt.includes('must not edit source'), 'owner-review prompt must block source edits')
assert(ownerPrompt.includes('execute server routes beyond reviewing the recorded bounded proof'), 'owner-review prompt must block new route execution')
assert(ownerPrompt.includes('touch Supabase'), 'owner-review prompt must block Supabase')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2z:typescript-loading-fix:diagnostics'] ===
    'node scripts/validation/sound-runtime-media-gate-2z-typescript-runtime-loading-fix-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2z_typescript_runtime_loading_fix_diagnostics_passed',
  decision,
  sourceHead,
  blockerResolved: true,
  proofStatus: 'passed',
  imported: true,
  resolverInvoked: true,
  assertionInvoked: true,
  acceptedCaseCount: 4,
  rejectedCaseCount: 5,
  serverRouteExecuted: false,
  workerExecutionRun: false,
  mediaProcessingRun: false,
  supabaseSqlRun: false,
  routeReadinessClaimed: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-SERVER-ROUTE-EXECUTION-PROOF-OWNER-REVIEW: review controlled server route execution proof, no worker/media/Supabase execution'
}, null, 2))
