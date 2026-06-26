import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_runtime_source_static_integration_owner_review_passed_with_warnings_ready_for_no_execution_import_proof'
const gate2agDecision = 'sound_runtime_media_gate_2ag_runtime_source_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_actual_runtime_source_owner_review_passed_with_warnings_ready_for_runtime_source_static_integration_plan'
const sourceHead = '96c0e4890ed391cb5a2e1ffbea7aa9630e63e593'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-static-integration-safety-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-claim-policy.md',
]

const sourceFiles = [
  'server/workers/sound-cpu/runtime/soundCpuJobContracts.ts',
  'server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts',
  'server/workers/sound-cpu/runtime/soundCpuMediaGuards.ts',
  'server/workers/sound-cpu/runtime/soundCpuSupabaseGuards.ts',
  'server/workers/sound-cpu/runtime/soundCpuArtifactPolicy.ts',
  'server/workers/sound-cpu/runtime/soundCpuObservability.ts',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-owner-review.md']
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr944.status === 'merged', 'PR #944 evidence missing')
assert(review.sourceVerification.pr944.mergeCommit === sourceHead, 'PR #944 merge commit mismatch')
assert(review.sourceVerification.pr944.decision === gate2agDecision, 'PR #944 decision mismatch')
assert(review.sourceVerification.pr938.decision === sourceDecision, 'PR #938 decision mismatch')
assert(review.ownerReviewResult.staticIntegrationPlanAcceptedForNoExecutionImportProofPlanning === true, 'owner review acceptance missing')
assert(review.ownerReviewResult.runtimeSourceFileCount === 6, 'runtime source count mismatch')
assert(review.ownerReviewResult.futureNoExecutionImportProofMayProceed === true, 'future proof flag missing')
assert(review.ownerReviewResult.runtimeFilesImportedToday === false, 'runtime imports must be false')
assert(review.ownerReviewResult.runtimeExecutionEnabledToday === false, 'runtime execution must remain false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const gate2ag = parseJsonBlock('docs/sound-runtime-media-gate-2ag-runtime-source-static-integration-plan.md')
assert(gate2ag.decision === gate2agDecision, 'Gate 2AG decision mismatch')
assert(gate2ag.staticIntegrationPlan.runtimeFilesImportedInThisGate === false, 'Gate 2AG must not have imported runtime files')
assert(gate2ag.staticIntegrationPlan.runtimeExecutionEnabledToday === false, 'Gate 2AG runtime execution must be false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-acceptance-register.md']
assert(acceptance.acceptedForFutureNoExecutionImportProofPlanning.length === sourceFiles.length, 'accepted source count mismatch')
for (const path of sourceFiles) {
  assert(fs.existsSync(path), `${path} missing`)
  assert(acceptance.acceptedForFutureNoExecutionImportProofPlanning.includes(path), `${path} missing from acceptance register`)
}
assert(acceptance.acceptedForExecutionToday === false, 'accepted for execution today must be false')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-readiness-register.md']
assert(readiness.futureGate2ahReadiness.mayRunNoExecutionImportProof === true, 'Gate 2AH readiness missing')
for (const [key, value] of Object.entries(readiness.futureGate2ahReadiness)) {
  if (key !== 'mayRunNoExecutionImportProof') assert(value === true, `${key} must remain true`)
}
assert(readiness.runtimeExecutionEnabledByThisReview === false, 'owner review must not enable runtime execution')

const safety = parsed['docs/worker-runtime-jobs-sound-cpu-static-integration-safety-register.md']
assert(safety.safetyReview.runtimeSourceFilesRemainDisabledByDefault === true, 'disabled runtime source safety check missing')
assert(safety.safetyReview.runtimeSourceFilesImportedToday === false, 'runtime files must not be imported today')
assert(safety.safetyReview.runtimeSourceFilesExecutedToday === false, 'runtime files must not be executed today')
for (const [key, value] of Object.entries(safety.safetyReview)) {
  if (!['runtimeSourceFilesImportedToday', 'runtimeSourceFilesExecutedToday'].includes(key)) {
    assert(value === true, `${key} safety check must be true`)
  }
}
assert(safety.remainingReviewRequiredBeforeExecution.includes('controlled no-execution import proof'), 'controlled import proof blocker missing')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_source_static_integration_owner_review_pending'), 'resolved static integration owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'controlled_no_execution_runtime_import_proof_pending' && row.status === 'next'), 'next import proof blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-claim-policy.md']
assert(policy.allowedClaims.staticIntegrationPlanAcceptedForNoExecutionImportProofPlanning === true, 'allowed acceptance claim missing')
assert(policy.allowedClaims.futureNoExecutionImportProofMayProceed === true, 'future proof allowed claim missing')
assert(policy.allowedClaims.runtimeFilesImportedToday === false, 'runtime import claim must be false')
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

const combinedSource = sourceFiles.map((path) => read(path)).join('\n')
const forbiddenSourcePatterns = [
  /process\.env/,
  /from ['"]node:fs/,
  /from ['"]node:child_process/,
  /createClient\s*\(/,
  /fetch\s*\(/,
  /docker\s+(build|run|push)/i,
  /\b(ffmpeg|ffprobe)\s+[-./\w]/i,
  /REEDITPRO_[A-Z_]+_ENABLED['"]?:\s*['"]1['"]/,
  /runtimeExecutionApproved:\s*true/,
  /workerExecutionApproved:\s*true/,
  /mediaProcessingApproved:\s*true/,
  /supabaseMutationApproved:\s*true/,
  /artifactWriteApproved:\s*true/,
]
for (const pattern of forbiddenSourcePatterns) {
  assert(!pattern.test(combinedSource), `runtime source contains forbidden pattern: ${pattern}`)
}

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2ah-controlled-no-execution-runtime-import-proof.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('must not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-source-static-integration-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_source_static_integration_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr944Verified: true,
  staticIntegrationPlanAcceptedForNoExecutionImportProofPlanning: true,
  futureNoExecutionImportProofMayProceed: true,
  runtimeFilesImportedToday: false,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AH: controlled no-execution runtime import proof, no worker execution'
}, null, 2))
