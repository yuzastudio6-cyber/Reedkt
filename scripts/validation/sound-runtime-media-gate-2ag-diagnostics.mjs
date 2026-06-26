import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2ag_runtime_source_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_actual_runtime_source_owner_review_passed_with_warnings_ready_for_runtime_source_static_integration_plan'
const gate2afDecision = 'sound_runtime_media_gate_2af_actual_runtime_source_created_with_warnings_ready_for_runtime_source_owner_review'
const sourceHead = '4e76ac8b193ce5956f103c030c09749d927cd9f6'

const docs = [
  'docs/sound-runtime-media-gate-2ag-runtime-source-static-integration-plan.md',
  'docs/sound-runtime-media-gate-2ag-static-import-map.md',
  'docs/sound-runtime-media-gate-2ag-diagnostics-coverage-plan.md',
  'docs/sound-runtime-media-gate-2ag-no-execution-import-proof-plan.md',
  'docs/sound-runtime-media-gate-2ag-static-integration-blocker-register.md',
  'docs/sound-runtime-media-gate-2ag-runtime-claim-policy.md',
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

const result = parsed['docs/sound-runtime-media-gate-2ag-runtime-source-static-integration-plan.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr938.status === 'merged', 'PR #938 evidence missing')
assert(result.sourceVerification.pr938.mergeCommit === sourceHead, 'PR #938 merge commit mismatch')
assert(result.sourceVerification.pr938.decision === sourceDecision, 'PR #938 decision mismatch')
assert(result.sourceVerification.pr937.decision === gate2afDecision, 'PR #937 decision mismatch')
assert(result.staticIntegrationPlan.targetRuntimeSourceFileCount === 6, 'runtime source count mismatch')
assert(result.staticIntegrationPlan.planStaticImports === true, 'static import plan missing')
assert(result.staticIntegrationPlan.planDiagnosticsCoverage === true, 'diagnostics coverage plan missing')
assert(result.staticIntegrationPlan.planNoExecutionImportProof === true, 'no-execution import proof plan missing')
assert(result.staticIntegrationPlan.runtimeFilesImportedInThisGate === false, 'runtime files must not be imported in Gate 2AG')
assert(result.staticIntegrationPlan.runtimeExecutionEnabledToday === false, 'runtime execution must remain false')
assert(result.staticIntegrationPlan.workerExecutionApprovedToday === false, 'worker execution must remain false')
assert(result.staticIntegrationPlan.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-actual-runtime-source-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(sourceReview.ownerReviewResult.futureStaticIntegrationPlanMayProceed === true, 'owner review must allow static integration planning')

const gate2af = parseJsonBlock('docs/sound-runtime-media-gate-2af-actual-runtime-source-creation-result.md')
assert(gate2af.decision === gate2afDecision, 'Gate 2AF decision mismatch')
assert(gate2af.sourceCreationResult.runtimeSourceFilesCreated === 6, 'Gate 2AF source count mismatch')
assert(gate2af.sourceCreationResult.runtimeExecutionEnabledToday === false, 'Gate 2AF runtime execution must be false')

const importMap = parsed['docs/sound-runtime-media-gate-2ag-static-import-map.md']
assert(importMap.runtimeSourceFiles.length === sourceFiles.length, 'import map source count mismatch')
for (const path of sourceFiles) {
  assert(fs.existsSync(path), `${path} missing`)
  assert(importMap.runtimeSourceFiles.includes(path), `${path} missing from import map`)
}
assert(importMap.plannedStaticImportCoverage.every((row) => row.importedInThisGate === false), 'Gate 2AG must not import runtime files')
assert(importMap.integrationStyle === 'future_static_imports_only_after_owner_review', 'integration style mismatch')
assert(importMap.runtimeExecutionApprovedToday === false, 'runtime execution must remain false in import map')

const coverage = parsed['docs/sound-runtime-media-gate-2ag-diagnostics-coverage-plan.md']
for (const value of Object.values(coverage.diagnosticsCoverage)) {
  assert(value === true, 'diagnostics coverage checks must be true')
}
assert(coverage.dependencyHydrationPolicy.forceNpmCi === false, 'Gate 2AG must not force npm ci')
assert(coverage.dependencyHydrationPolicy.packageLockMustRemainUnchanged === true, 'package-lock invariant missing')

const importProof = parsed['docs/sound-runtime-media-gate-2ag-no-execution-import-proof-plan.md']
assert(importProof.noExecutionImportProofPlan.importProofExecutedInThisGate === false, 'import proof must not execute in Gate 2AG')
assert(importProof.noExecutionImportProofPlan.futureProofMayBePlannedAfterOwnerReview === true, 'future import proof owner-review handoff missing')
for (const value of Object.values(importProof.closedToday)) {
  assert(value === true, 'closed gate must stay true')
}

const blockers = parsed['docs/sound-runtime-media-gate-2ag-static-integration-blocker-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'actual_runtime_source_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_source_static_integration_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2ag-runtime-claim-policy.md']
assert(policy.allowedClaims.runtimeSourceStaticIntegrationPlanCreatedToday === true, 'allowed static integration plan claim missing')
assert(policy.allowedClaims.runtimeSourceFilesImportedToday === false, 'runtime imports must be false')
assert(policy.allowedClaims.noExecutionImportProofPassedToday === false, 'import proof pass must be false')
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
assert(combinedSource.includes('runtimeExecutionApproved: false'), 'runtime execution false guard missing')
assert(combinedSource.includes('mediaProcessingApproved: false'), 'media processing false guard missing')
assert(combinedSource.includes('supabaseMutationApproved: false'), 'Supabase mutation false guard missing')
assert(combinedSource.includes('publicArtifactCreationApproved: false'), 'artifact false guard missing')
assert(combinedSource.includes('noWorkerExecution: true'), 'audit no-worker-execution invariant missing')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-source-static-integration-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AG decision')
assert(nextPrompt.includes('must not import runtime modules'), 'next prompt must block runtime imports')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2ag:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2ag-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2ag_diagnostics_passed',
  decision,
  sourceHead,
  pr938Verified: true,
  runtimeSourceFileCount: 6,
  runtimeSourceFilesImportedToday: false,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-SOURCE-STATIC-INTEGRATION-OWNER-REVIEW: review runtime source static integration plan, no execution'
}, null, 2))
