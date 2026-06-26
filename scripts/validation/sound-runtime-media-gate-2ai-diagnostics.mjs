import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2ai_runtime_guard_hardening_plan_completed_with_warnings_ready_for_runtime_guard_hardening_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_no_execution_import_proof_owner_review_passed_with_warnings_ready_for_runtime_guard_hardening_plan'
const gate2ahDecision = 'sound_runtime_media_gate_2ah_controlled_no_execution_runtime_import_proof_passed_with_warnings_ready_for_import_proof_owner_review'
const sourceHead = '20bad9f638ede52fa2582218dbf7aae3d807868a'

const docs = [
  'docs/sound-runtime-media-gate-2ai-runtime-guard-hardening-plan.md',
  'docs/sound-runtime-media-gate-2ai-disabled-flag-assertion-plan.md',
  'docs/sound-runtime-media-gate-2ai-resolver-import-policy-hardening-plan.md',
  'docs/sound-runtime-media-gate-2ai-no-execution-regression-diagnostics-plan.md',
  'docs/sound-runtime-media-gate-2ai-runtime-guard-source-coverage-plan.md',
  'docs/sound-runtime-media-gate-2ai-runtime-guard-blocker-register.md',
  'docs/sound-runtime-media-gate-2ai-runtime-claim-policy.md',
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
  assert(json.decision === decision, `${path} decision mismatch`)
}

const result = parsed['docs/sound-runtime-media-gate-2ai-runtime-guard-hardening-plan.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr951.status === 'merged', 'PR #951 evidence missing')
assert(result.sourceVerification.pr951.mergeCommit === sourceHead, 'PR #951 merge commit mismatch')
assert(result.sourceVerification.pr951.decision === sourceDecision, 'PR #951 decision mismatch')
assert(result.sourceVerification.pr949.decision === gate2ahDecision, 'PR #949 decision mismatch')
assert(result.hardeningPlan.runtimeSourceFileCount === 6, 'runtime source count mismatch')
assert(result.hardeningPlan.planDisabledFlagAssertions === true, 'disabled flag assertion plan missing')
assert(result.hardeningPlan.planResolverImportPolicyHardening === true, 'resolver policy plan missing')
assert(result.hardeningPlan.planNoExecutionRegressionDiagnostics === true, 'regression diagnostics plan missing')
assert(result.hardeningPlan.runtimeSourceFilesModifiedToday === false, 'runtime source files must not be modified')
assert(result.hardeningPlan.runtimeExecutionEnabledToday === false, 'runtime execution must remain false')
assert(result.hardeningPlan.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-no-execution-import-proof-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(sourceReview.ownerReviewResult.futureRuntimeGuardHardeningPlanMayProceed === true, 'owner review must allow hardening planning')

const gate2ah = parseJsonBlock('docs/sound-runtime-media-gate-2ah-controlled-no-execution-import-proof-result.md')
assert(gate2ah.decision === gate2ahDecision, 'Gate 2AH decision mismatch')
assert(gate2ah.proofResult.controlledNoExecutionImportProofPassed === true, 'Gate 2AH proof pass missing')
assert(gate2ah.proofResult.runtimeExecutionEnabledToday === false, 'Gate 2AH runtime execution must be false')

const flags = parsed['docs/sound-runtime-media-gate-2ai-disabled-flag-assertion-plan.md']
for (const value of Object.values(flags.disabledFlagAssertions.requiredDisabledFlags)) {
  assert(value === '0', 'disabled flags must stay 0')
}
assert(flags.disabledFlagAssertions.futureDiagnosticMustNotReadProcessEnv === true, 'process.env read must stay blocked')
assert(flags.enabledToday === false, 'runtime must not be enabled today')

const resolver = parsed['docs/sound-runtime-media-gate-2ai-resolver-import-policy-hardening-plan.md']
assert(resolver.resolverImportPolicy.preserveGate2ahWarning === true, 'Gate 2AH warning must be preserved')
assert(resolver.resolverImportPolicy.runtimeSourceChangeRequiredNow === false, 'runtime source change must not be required now')
assert(resolver.resolverImportPolicy.dependenciesInstalledToday === false, 'dependencies must not be installed')
assert(resolver.resolverImportPolicy.runtimeFlagsEnabledToday === false, 'runtime flags must not be enabled')

const regression = parsed['docs/sound-runtime-media-gate-2ai-no-execution-regression-diagnostics-plan.md']
for (const value of Object.values(regression.regressionDiagnosticsPlan)) {
  assert(value === true, 'regression diagnostics plan checks must be true')
}
assert(regression.forceDependencyHydration === false, 'dependency hydration must not be forced')

const coverage = parsed['docs/sound-runtime-media-gate-2ai-runtime-guard-source-coverage-plan.md']
assert(coverage.sourceCoverageTargets.length === sourceFiles.length, 'coverage file count mismatch')
for (const path of sourceFiles) {
  assert(fs.existsSync(path), `${path} missing`)
  assert(coverage.sourceCoverageTargets.some((row) => row.file === path), `${path} missing from coverage`)
}
assert(coverage.runtimeSourceFilesModifiedToday === false, 'runtime source files must not be modified')

const blockers = parsed['docs/sound-runtime-media-gate-2ai-runtime-guard-blocker-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_guard_hardening_plan_pending'), 'resolved hardening plan blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_guard_hardening_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2ai-runtime-claim-policy.md']
assert(policy.allowedClaims.runtimeGuardHardeningPlanCreatedToday === true, 'allowed hardening plan claim missing')
assert(policy.allowedClaims.runtimeSourceFilesModifiedToday === false, 'runtime source modified claim must be false')
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-guard-hardening-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AI decision')
assert(nextPrompt.includes('must not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2ai:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2ai-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2ai_diagnostics_passed',
  decision,
  sourceHead,
  pr951Verified: true,
  runtimeGuardHardeningPlanCreatedToday: true,
  runtimeSourceFilesModifiedToday: false,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-GUARD-HARDENING-OWNER-REVIEW: review runtime guard hardening plan, no execution'
}, null, 2))
