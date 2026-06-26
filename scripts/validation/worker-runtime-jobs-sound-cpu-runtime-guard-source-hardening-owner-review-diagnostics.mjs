import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_runtime_guard_source_hardening_owner_review_passed_with_warnings_ready_for_no_execution_regression_proof'
const gate2ajDecision =
  'sound_runtime_media_gate_2aj_runtime_guard_source_hardening_completed_with_warnings_ready_for_runtime_guard_source_hardening_owner_review'
const ownerSourceDecision =
  'worker_runtime_jobs_sound_cpu_runtime_guard_hardening_owner_review_passed_with_warnings_ready_for_runtime_guard_source_hardening'
const sourceHead = 'f1ec1dddbc40be210a3ccc83f0601e5a91a64c5b'
const runtimeGuardPath = 'server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-validation-review.md',
  'docs/worker-runtime-jobs-sound-cpu-no-execution-regression-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr960.status === 'merged', 'PR #960 evidence missing')
assert(review.sourceVerification.pr960.mergeCommit === sourceHead, 'PR #960 merge commit mismatch')
assert(review.sourceVerification.pr960.decision === gate2ajDecision, 'PR #960 decision mismatch')
assert(review.sourceVerification.pr956.decision === ownerSourceDecision, 'PR #956 decision mismatch')
assert(review.ownerReviewResult.runtimeGuardSourceHardeningAcceptedForNoExecutionRegressionProof === true, 'owner source-hardening acceptance missing')
assert(review.ownerReviewResult.disabledFlagKeyListAccepted === true, 'disabled flag key list acceptance missing')
assert(review.ownerReviewResult.disabledFlagAssertionHelperAccepted === true, 'disabled assertion helper acceptance missing')
assert(review.ownerReviewResult.gate2ahDiagnosticCompatibilityUpdateAccepted === true, 'Gate 2AH diagnostic update acceptance missing')
assert(review.ownerReviewResult.dependencyBackedValidationAccepted === true, 'dependency validation acceptance missing')
assert(review.ownerReviewResult.futureNoExecutionRegressionProofMayProceed === true, 'future regression proof flag missing')
assert(review.ownerReviewResult.runtimeExecutionEnabledToday === false, 'runtime execution must remain false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const gate2aj = parseJsonBlock('docs/sound-runtime-media-gate-2aj-runtime-guard-source-hardening-result.md')
assert(gate2aj.decision === gate2ajDecision, 'Gate 2AJ decision mismatch')
assert(gate2aj.sourceVerification.pr956.decision === ownerSourceDecision, 'Gate 2AJ PR #956 evidence mismatch')
assert(gate2aj.sourceHardeningResult.runtimeSourceFilesModified.includes(runtimeGuardPath), 'Gate 2AJ runtime guard path missing')
assert(gate2aj.sourceHardeningResult.disabledFlagAssertionHelperAdded === true, 'Gate 2AJ assertion helper evidence missing')
assert(gate2aj.sourceHardeningResult.runtimeExecutionEnabledToday === false, 'Gate 2AJ runtime execution must be false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-acceptance-register.md']
assert(acceptance.acceptedSourceEvidence.gate2ajDecisionAccepted === true, 'Gate 2AJ source acceptance missing')
assert(acceptance.acceptedSourceEvidence.modifiedRuntimeSourceFiles.length === 1, 'modified runtime source count mismatch')
assert(acceptance.acceptedSourceEvidence.modifiedRuntimeSourceFiles[0] === runtimeGuardPath, 'modified runtime source path mismatch')
assert(acceptance.acceptedSourceEvidence.dependencyBackedTypecheckPassed === true, 'typecheck acceptance missing')
assert(acceptance.acceptedSourceEvidence.lintAndBuildValidationPassed === true, 'lint/build acceptance missing')
assert(acceptance.acceptedForExecutionToday === false, 'accepted for execution today must be false')
assert(acceptance.acceptedForRuntimeReadinessToday === false, 'accepted for runtime readiness today must be false')

const validation = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-validation-review.md']
assert(validation.validationReview.npmCiValidationHydrationCompleted === true, 'validation hydration evidence missing')
assert(validation.validationReview.packageLockHash === 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3', 'package-lock hash mismatch')
assert(validation.validationReview.soundRuntimeMediaGate2ajDiagnosticsPassed === true, 'Gate 2AJ diagnostics missing')
assert(validation.validationReview.soundRuntimeMediaGate2ahDiagnosticsPassed === true, 'Gate 2AH diagnostics missing')
assert(validation.validationReview.ownershipConflicts === 0, 'ownership conflicts must be zero')
assert(validation.validationReview.serverTypecheckPassed === true, 'server typecheck missing')
assert(validation.validationReview.typescriptBuildPassed === true, 'typescript build missing')
assert(validation.validationReview.lintPassed === true, 'lint missing')
assert(validation.validationReview.clientBuildPassed === true, 'client build missing')
assert(validation.validationReview.serverBuildPassed === true, 'server build missing')
assert(validation.validationReview.productionReadinessSummaryStatus === 'blocked', 'production readiness must remain blocked')
assert(validation.validationReview.externalBetaAllowed === false, 'external beta must remain false')
assert(validation.validationReview.realUserMediaBetaAllowed === false, 'real user media beta must remain false')
assert(validation.validationReview.paidProductionAllowed === false, 'paid production must remain false')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-regression-readiness-register.md']
assert(readiness.futureGate2akReadiness.mayRunNoExecutionRegressionProof === true, 'future regression proof flag missing')
assert(readiness.futureGate2akReadiness.mayImportRuntimeModulesForExportInspectionOnly === true, 'future import proof flag missing')
assert(readiness.futureGate2akReadiness.mayAssertDisabledFlagDefaults === true, 'future disabled flag assertion missing')
assert(readiness.futureGate2akReadiness.mayAssertThrowingGuardsRemainFailClosed === true, 'future fail-closed assertion missing')
for (const [key, value] of Object.entries(readiness.futureGate2akReadiness)) {
  if (
    key === 'mayRunNoExecutionRegressionProof' ||
    key === 'mayImportRuntimeModulesForExportInspectionOnly' ||
    key.startsWith('mayAssert')
  ) {
    assert(value === true, `${key} must be true`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_guard_source_hardening_owner_review_pending'), 'resolved source owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'no_execution_regression_proof_pending' && row.status === 'next'), 'next regression proof blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-claim-policy.md']
assert(policy.allowedClaims.runtimeGuardSourceHardeningAcceptedForNoExecutionRegressionProof === true, 'allowed source-hardening claim missing')
assert(policy.allowedClaims.futureNoExecutionRegressionProofMayProceed === true, 'future regression proof allowed claim missing')
assert(policy.allowedClaims.runtimeExecutionEnabledToday === false, 'runtime execution claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const runtimeGuardSource = read(runtimeGuardPath)
assert(runtimeGuardSource.includes('SOUND_CPU_RUNTIME_DISABLED_FLAG_KEYS'), 'runtime guard key list missing')
assert(runtimeGuardSource.includes('assertSoundCpuRuntimeDisabledFlags'), 'disabled assertion helper missing')
assert(!/REEDITPRO_[A-Z_]+_ENABLED:\s*'1'/.test(runtimeGuardSource), 'runtime source must not enable flags')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2ak-runtime-guard-no-execution-regression-proof.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('Do not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-guard-source-hardening-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-guard-source-hardening-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_guard_source_hardening_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr960Verified: true,
  runtimeGuardSourceHardeningAcceptedForNoExecutionRegressionProof: true,
  futureNoExecutionRegressionProofMayProceed: true,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AK: runtime guard no-execution regression proof, no execution'
}, null, 2))
