import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_runtime_guard_hardening_owner_review_passed_with_warnings_ready_for_runtime_guard_source_hardening'
const gate2aiDecision = 'sound_runtime_media_gate_2ai_runtime_guard_hardening_plan_completed_with_warnings_ready_for_runtime_guard_hardening_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_no_execution_import_proof_owner_review_passed_with_warnings_ready_for_runtime_guard_hardening_plan'
const sourceHead = '4707fd5e5c20ce0ec0fdda093fdf4fcb1648ce6a'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-disabled-flag-owner-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr954.status === 'merged', 'PR #954 evidence missing')
assert(review.sourceVerification.pr954.mergeCommit === sourceHead, 'PR #954 merge commit mismatch')
assert(review.sourceVerification.pr954.decision === gate2aiDecision, 'PR #954 decision mismatch')
assert(review.sourceVerification.pr951.decision === sourceDecision, 'PR #951 decision mismatch')
assert(review.ownerReviewResult.runtimeGuardHardeningPlanAcceptedForSourceHardeningPlanning === true, 'owner review acceptance missing')
assert(review.ownerReviewResult.disabledFlagAssertionPlanAccepted === true, 'disabled flag plan acceptance missing')
assert(review.ownerReviewResult.resolverImportPolicyHardeningPlanAccepted === true, 'resolver plan acceptance missing')
assert(review.ownerReviewResult.noExecutionRegressionDiagnosticsPlanAccepted === true, 'regression plan acceptance missing')
assert(review.ownerReviewResult.runtimeGuardSourceCoveragePlanAccepted === true, 'source coverage plan acceptance missing')
assert(review.ownerReviewResult.futureRuntimeGuardSourceHardeningMayProceed === true, 'future source hardening flag missing')
assert(review.ownerReviewResult.runtimeSourceFilesModifiedToday === false, 'runtime source must not be modified today')
assert(review.ownerReviewResult.runtimeExecutionEnabledToday === false, 'runtime execution must stay false')
assert(review.ownerReviewResult.workerExecutionApprovedToday === false, 'worker execution must stay false')
assert(review.ownerReviewResult.mediaProcessingApprovedToday === false, 'media processing must stay false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must stay false')

const gate2ai = parseJsonBlock('docs/sound-runtime-media-gate-2ai-runtime-guard-hardening-plan.md')
assert(gate2ai.decision === gate2aiDecision, 'Gate 2AI decision mismatch')
assert(gate2ai.sourceVerification.pr951.decision === sourceDecision, 'Gate 2AI PR #951 evidence mismatch')
assert(gate2ai.hardeningPlan.runtimeSourceFileCount === 6, 'runtime source file count mismatch')
assert(gate2ai.hardeningPlan.runtimeSourceFilesModifiedToday === false, 'Gate 2AI runtime source modified unexpectedly')
assert(gate2ai.hardeningPlan.runtimeExecutionEnabledToday === false, 'Gate 2AI runtime execution must be false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-acceptance-register.md']
assert(acceptance.acceptedPlanningEvidence.gate2aiDecisionAccepted === true, 'Gate 2AI acceptance missing')
assert(acceptance.acceptedPlanningEvidence.runtimeModuleCount === 6, 'accepted module count mismatch')
for (const [key, value] of Object.entries(acceptance.acceptedPlanningEvidence)) {
  if (key.endsWith('Accepted') || key === 'gate2aiDecisionAccepted' || key === 'runtimeModuleCount') continue
  assert(value === false, `${key} must remain false`)
}
assert(acceptance.acceptedForExecutionToday === false, 'accepted for execution today must be false')
assert(acceptance.acceptedForBetaReadinessToday === false, 'accepted for beta readiness today must be false')

const disabled = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-disabled-flag-owner-register.md']
assert(disabled.disabledFlagReview.futureAssertionsMayRequireRuntimeDisabledByDefault === true, 'runtime disabled assertion missing')
assert(disabled.disabledFlagReview.futureAssertionsMayRequireWorkerExecutionDisabledByDefault === true, 'worker disabled assertion missing')
assert(disabled.disabledFlagReview.futureAssertionsMayRequireSupabaseSqlDisabledByDefault === true, 'Supabase disabled assertion missing')
assert(disabled.disabledFlagReview.runtimeFlagsEnabledToday === false, 'runtime flags must not be enabled today')
assert(disabled.acceptedRuntimeFlagDefaults.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime default flag mismatch')
assert(disabled.acceptedRuntimeFlagDefaults.REEDITPRO_WORKER_EXECUTION_ENABLED === '0', 'worker default flag mismatch')
assert(disabled.acceptedRuntimeFlagDefaults.REEDITPRO_MEDIA_PROCESSING_ENABLED === '0', 'media default flag mismatch')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-readiness-register.md']
assert(readiness.futureGate2ajReadiness.mayPlanRuntimeGuardSourceHardening === true, 'Gate 2AJ plan flag missing')
assert(readiness.futureGate2ajReadiness.mayModifyRuntimeSourceInFutureGate === true, 'future source modification planning flag missing')
for (const [key, value] of Object.entries(readiness.futureGate2ajReadiness)) {
  if (key.startsWith('mayPlan') || key === 'mayModifyRuntimeSourceInFutureGate') {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(readiness.runtimeSourceFilesInScopeForFutureReview.length === 6, 'future runtime source scope must list six files')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_guard_hardening_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_guard_source_hardening_pending' && row.status === 'next'), 'next source-hardening blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-claim-policy.md']
assert(policy.allowedClaims.runtimeGuardHardeningPlanAcceptedForSourceHardeningPlanning === true, 'allowed owner acceptance claim missing')
assert(policy.allowedClaims.futureRuntimeGuardSourceHardeningMayProceed === true, 'future source hardening allowed claim missing')
assert(policy.allowedClaims.runtimeSourceFilesModifiedToday === false, 'runtime source files modified claim must be false')
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

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2aj-runtime-guard-source-hardening.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('runtime guard source hardening'), 'next prompt must describe source hardening')
assert(nextPrompt.includes('must not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-guard-hardening-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-guard-hardening-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_guard_hardening_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr954Verified: true,
  runtimeGuardHardeningPlanAcceptedForSourceHardeningPlanning: true,
  futureRuntimeGuardSourceHardeningMayProceed: true,
  runtimeSourceFilesModifiedToday: false,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AJ: runtime guard source hardening, no execution'
}, null, 2))
