import fs from 'node:fs'
import { runSoundCpuRuntimeGuardNoExecutionRegressionProof } from './sound-runtime-media-gate-2ak-no-execution-regression-proof-runner.mjs'

const decision =
  'sound_runtime_media_gate_2ak_no_execution_regression_proof_passed_with_warnings_ready_for_regression_proof_owner_review'
const ownerDecision =
  'worker_runtime_jobs_sound_cpu_runtime_guard_source_hardening_owner_review_passed_with_warnings_ready_for_no_execution_regression_proof'
const gate2ajDecision =
  'sound_runtime_media_gate_2aj_runtime_guard_source_hardening_completed_with_warnings_ready_for_runtime_guard_source_hardening_owner_review'
const sourceHead = '92f465e399288b01fdd674bad4e035f363c73dc8'

const docs = [
  'docs/sound-runtime-media-gate-2ak-no-execution-regression-proof-result.md',
  'docs/sound-runtime-media-gate-2ak-disabled-flag-regression-register.md',
  'docs/sound-runtime-media-gate-2ak-fail-closed-guard-register.md',
  'docs/sound-runtime-media-gate-2ak-no-execution-boundary-register.md',
  'docs/sound-runtime-media-gate-2ak-runtime-guard-blocker-register.md',
  'docs/sound-runtime-media-gate-2ak-runtime-claim-policy.md',
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

const proof = await runSoundCpuRuntimeGuardNoExecutionRegressionProof()
assert(proof.ok === true, 'no-execution regression proof failed')
assert(proof.importedRuntimeModuleCount === 6, 'runtime module count mismatch')
assert(proof.disabledFlagKeyCount === 5, 'disabled flag count mismatch')
assert(proof.defaultAssertionReturnedSameFlags === true, 'default disabled flag assertion missing')
for (const [key, value] of Object.entries(proof.disabledFlagValues)) {
  assert(value === '0', `${key} must remain disabled`)
}
for (const [key, value] of Object.entries(proof.failClosedAssertions)) {
  assert(value.threw === true, `${key} must throw fail-closed`)
  assert(value.messageIncludesBlocked === true, `${key} fail-closed message mismatch`)
}
for (const key of [
  'workerDispatchExecuted',
  'routeExecutionExecuted',
  'toolExecutionExecuted',
  'mediaProcessingExecuted',
  'supabaseSqlExecuted',
  'artifactCreated',
  'dockerGcpExecuted',
  'providerModelCalled',
  'generatedLocalFixturePassedClaimed',
  'dryRunPassedClaimed',
  'runtimeReadinessClaimed',
]) {
  assert(proof[key] === false, `${key} must remain false`)
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.decision === decision, `${path} decision mismatch`)
}

const result = parsed['docs/sound-runtime-media-gate-2ak-no-execution-regression-proof-result.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr963.status === 'merged', 'PR #963 evidence missing')
assert(result.sourceVerification.pr963.mergeCommit === sourceHead, 'PR #963 merge commit mismatch')
assert(result.sourceVerification.pr963.decision === ownerDecision, 'PR #963 decision mismatch')
assert(result.sourceVerification.pr960.decision === gate2ajDecision, 'PR #960 decision mismatch')
assert(result.proofResult.controlledNoExecutionRegressionProofPassed === true, 'proof pass missing')
assert(result.proofResult.importedRuntimeModuleCount === proof.importedRuntimeModuleCount, 'proof module count mismatch')
assert(result.proofResult.disabledFlagDefaultsAllZero === true, 'disabled flags evidence missing')
assert(result.proofResult.failClosedAssertionsThrew === true, 'fail-closed throw evidence missing')
assert(result.proofResult.runtimeReadinessClaimed === false, 'runtime readiness must be false')

const flags = parsed['docs/sound-runtime-media-gate-2ak-disabled-flag-regression-register.md']
assert(flags.disabledFlagRegression.flagKeyCount === proof.disabledFlagKeyCount, 'flag key count mismatch')
assert(flags.disabledFlagRegression.allDefaultValues === '0', 'flag defaults mismatch')
assert(flags.disabledFlagRegression.validDefaultAssertionPassed === true, 'valid assertion missing')
assert(flags.disabledFlagRegression.invalidRuntimeFlagRejected === true, 'invalid flag rejection missing')

const failClosed = parsed['docs/sound-runtime-media-gate-2ak-fail-closed-guard-register.md']
assert(failClosed.failClosedGuards.length === 5, 'fail-closed guard count mismatch')
for (const guard of failClosed.failClosedGuards) {
  assert(guard.messageSanitized === true, `${guard.guard} message must be sanitized`)
  assert(guard.throwsFailClosed === true || guard.invalidInputRejected === true, `${guard.guard} fail-closed evidence missing`)
}
assert(failClosed.workerDispatchExecuted === false, 'worker dispatch must be false')
assert(failClosed.supabaseSqlExecuted === false, 'Supabase/SQL must be false')

const boundary = parsed['docs/sound-runtime-media-gate-2ak-no-execution-boundary-register.md']
assert(boundary.noExecutionBoundary.runtimeModulesImportedForExportAndGuardInspectionOnly === true, 'import boundary missing')
assert(boundary.noExecutionBoundary.throwingGuardsCalledOnlyForFailClosedAssertion === true, 'throwing guard boundary missing')
for (const [key, value] of Object.entries(boundary.noExecutionBoundary)) {
  if (
    key === 'runtimeModulesImportedForExportAndGuardInspectionOnly' ||
    key === 'throwingGuardsCalledOnlyForFailClosedAssertion'
  ) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const blockers = parsed['docs/sound-runtime-media-gate-2ak-runtime-guard-blocker-register.md']
assert(blockers.resolvedForProof.some((row) => row.blockerId === 'no_execution_regression_proof_pending'), 'resolved proof blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'no_execution_regression_proof_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2ak-runtime-claim-policy.md']
assert(policy.allowedClaims.noExecutionRegressionProofPassedToday === true, 'proof pass claim missing')
assert(policy.allowedClaims.disabledFlagDefaultsAssertedToday === true, 'disabled flag assertion claim missing')
assert(policy.allowedClaims.failClosedGuardsAssertedToday === true, 'fail-closed guard claim missing')
assert(policy.allowedClaims.runtimeExecutionEnabledToday === false, 'runtime execution claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must remain true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-no-execution-regression-proof-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AK decision')
assert(nextPrompt.includes('Do not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2ak:diagnostics'] ===
    'node scripts/validation/sound-runtime-media-gate-2ak-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2ak_diagnostics_passed',
  decision,
  sourceHead,
  pr963Verified: true,
  controlledNoExecutionRegressionProofPassed: true,
  importedRuntimeModuleCount: proof.importedRuntimeModuleCount,
  disabledFlagKeyCount: proof.disabledFlagKeyCount,
  failClosedAssertionCount: Object.keys(proof.failClosedAssertions).length,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-NO-EXECUTION-REGRESSION-PROOF-OWNER-REVIEW: review runtime guard no-execution regression proof, no execution'
}, null, 2))
