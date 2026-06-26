import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_no_execution_import_proof_owner_review_passed_with_warnings_ready_for_runtime_guard_hardening_plan'
const gate2ahDecision = 'sound_runtime_media_gate_2ah_controlled_no_execution_runtime_import_proof_passed_with_warnings_ready_for_import_proof_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_runtime_source_static_integration_owner_review_passed_with_warnings_ready_for_no_execution_import_proof'
const sourceHead = '76061bfcf60d2973aa740d79bf3b92999a68060d'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-import-proof-resolver-warning-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-claim-policy.md',
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
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${path} owner mismatch`)
  assert(json.decision === decision, `${path} decision mismatch`)
}

const review = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr949.status === 'merged', 'PR #949 evidence missing')
assert(review.sourceVerification.pr949.mergeCommit === sourceHead, 'PR #949 merge commit mismatch')
assert(review.sourceVerification.pr949.decision === gate2ahDecision, 'PR #949 decision mismatch')
assert(review.sourceVerification.pr946.decision === sourceDecision, 'PR #946 decision mismatch')
assert(review.ownerReviewResult.noExecutionImportProofAcceptedForRuntimeGuardHardeningPlanning === true, 'owner review acceptance missing')
assert(review.ownerReviewResult.runtimeModuleLoadProofAccepted === true, 'module load proof acceptance missing')
assert(review.ownerReviewResult.runtimeModuleCount === 6, 'runtime module count mismatch')
assert(review.ownerReviewResult.resolverWarningAccepted === true, 'resolver warning acceptance missing')
assert(review.ownerReviewResult.futureRuntimeGuardHardeningPlanMayProceed === true, 'future hardening flag missing')
assert(review.ownerReviewResult.runtimeExecutionEnabledToday === false, 'runtime execution must remain false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const gate2ah = parseJsonBlock('docs/sound-runtime-media-gate-2ah-controlled-no-execution-import-proof-result.md')
assert(gate2ah.decision === gate2ahDecision, 'Gate 2AH decision mismatch')
assert(gate2ah.proofResult.controlledNoExecutionImportProofPassed === true, 'Gate 2AH proof pass missing')
assert(gate2ah.proofResult.runtimeModuleCount === 6, 'Gate 2AH module count mismatch')
assert(gate2ah.proofResult.runtimeExecutionEnabledToday === false, 'Gate 2AH runtime execution must be false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-acceptance-register.md']
assert(acceptance.acceptedProofEvidence.controlledNoExecutionImportProofPassed === true, 'proof acceptance missing')
assert(acceptance.acceptedProofEvidence.runtimeModuleCount === 6, 'accepted module count mismatch')
for (const [key, value] of Object.entries(acceptance.acceptedProofEvidence)) {
  if (['controlledNoExecutionImportProofPassed', 'runtimeModuleCount', 'moduleExportInspectionOnly'].includes(key)) continue
  assert(value === false, `${key} must remain false`)
}
assert(acceptance.acceptedForExecutionToday === false, 'accepted for execution today must be false')

const resolver = parsed['docs/worker-runtime-jobs-sound-cpu-import-proof-resolver-warning-review.md']
assert(resolver.resolverWarning.accepted === true, 'resolver warning must be accepted')
assert(resolver.resolverWarning.runtimeSourceChangeRequiredNow === false, 'runtime source change must not be required now')
assert(resolver.resolverBoundary.scopedToSoundCpuRuntimeDirectory === true, 'resolver scope missing')
assert(resolver.resolverBoundary.externalPackageResolutionChanged === false, 'external package resolution must not change')
assert(resolver.resolverBoundary.dependenciesInstalled === false, 'dependencies must not be installed')
assert(resolver.resolverBoundary.runtimeFlagsEnabled === false, 'runtime flags must not be enabled')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-readiness-register.md']
assert(readiness.futureGate2aiReadiness.mayPlanRuntimeGuardHardening === true, 'Gate 2AI plan flag missing')
for (const [key, value] of Object.entries(readiness.futureGate2aiReadiness)) {
  if (key.startsWith('mayPlan')) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'no_execution_import_proof_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_guard_hardening_plan_pending' && row.status === 'next'), 'next hardening blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-claim-policy.md']
assert(policy.allowedClaims.noExecutionImportProofAcceptedForRuntimeGuardHardeningPlanning === true, 'allowed acceptance claim missing')
assert(policy.allowedClaims.futureRuntimeGuardHardeningPlanMayProceed === true, 'future hardening allowed claim missing')
assert(policy.allowedClaims.runtimeExecutionEnabledToday === false, 'runtime execution claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL classification mismatch')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2ai-runtime-guard-hardening-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('must not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-no-execution-import-proof-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-no-execution-import-proof-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_no_execution_import_proof_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr949Verified: true,
  noExecutionImportProofAcceptedForRuntimeGuardHardeningPlanning: true,
  futureRuntimeGuardHardeningPlanMayProceed: true,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AI: runtime guard hardening plan, no execution'
}, null, 2))
