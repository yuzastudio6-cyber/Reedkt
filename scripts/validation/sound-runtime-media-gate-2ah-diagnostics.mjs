import fs from 'node:fs'
import { runSoundCpuNoExecutionImportProof } from './sound-runtime-media-gate-2ah-no-execution-import-proof-runner.mjs'

const decision = 'sound_runtime_media_gate_2ah_controlled_no_execution_runtime_import_proof_passed_with_warnings_ready_for_import_proof_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_runtime_source_static_integration_owner_review_passed_with_warnings_ready_for_no_execution_import_proof'
const gate2agDecision = 'sound_runtime_media_gate_2ag_runtime_source_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review'
const sourceHead = '31ac19144ab238f7a72a9154107e532a05c8c966'

const docs = [
  'docs/sound-runtime-media-gate-2ah-controlled-no-execution-import-proof-result.md',
  'docs/sound-runtime-media-gate-2ah-import-proof-register.md',
  'docs/sound-runtime-media-gate-2ah-module-export-register.md',
  'docs/sound-runtime-media-gate-2ah-resolver-policy-register.md',
  'docs/sound-runtime-media-gate-2ah-no-execution-validation.md',
  'docs/sound-runtime-media-gate-2ah-blocker-follow-up-register.md',
  'docs/sound-runtime-media-gate-2ah-runtime-claim-policy.md',
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

const proof = await runSoundCpuNoExecutionImportProof()
assert(proof.ok === true, 'import proof failed')
assert(proof.moduleCount === 6, 'import proof module count mismatch')
assert(proof.resolverHookUsedForExtensionlessRuntimeImports === true, 'resolver hook evidence missing')
for (const key of [
  'workerDispatchExecuted',
  'routeExecutionExecuted',
  'toolExecutionExecuted',
  'mediaProcessingExecuted',
  'supabaseSqlExecuted',
  'artifactCreated',
  'dockerGcpExecuted',
  'providerModelCalled',
]) {
  assert(proof[key] === false, `${key} must be false`)
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.decision === decision, `${path} decision mismatch`)
}

const result = parsed['docs/sound-runtime-media-gate-2ah-controlled-no-execution-import-proof-result.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr946.status === 'merged', 'PR #946 evidence missing')
assert(result.sourceVerification.pr946.mergeCommit === sourceHead, 'PR #946 merge commit mismatch')
assert(result.sourceVerification.pr946.decision === sourceDecision, 'PR #946 decision mismatch')
assert(result.sourceVerification.pr944.decision === gate2agDecision, 'PR #944 decision mismatch')
assert(result.proofResult.controlledNoExecutionImportProofPassed === true, 'proof pass missing')
assert(result.proofResult.runtimeModuleCount === proof.moduleCount, 'proof count mismatch')
assert(result.proofResult.resolverHookUsedForExtensionlessRuntimeImports === true, 'resolver warning missing')
assert(result.proofResult.runtimeExecutionEnabledToday === false, 'runtime execution must remain false')
assert(result.proofResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(sourceReview.ownerReviewResult.futureNoExecutionImportProofMayProceed === true, 'owner review must allow proof')

const gate2ag = parseJsonBlock('docs/sound-runtime-media-gate-2ag-runtime-source-static-integration-plan.md')
assert(gate2ag.decision === gate2agDecision, 'Gate 2AG decision mismatch')
assert(gate2ag.staticIntegrationPlan.runtimeExecutionEnabledToday === false, 'Gate 2AG runtime execution must be false')

const register = parsed['docs/sound-runtime-media-gate-2ah-import-proof-register.md']
assert(register.importedRuntimeModules.length === proof.moduleCount, 'register module count mismatch')
for (const path of sourceFiles) {
  assert(fs.existsSync(path), `${path} missing`)
  assert(register.sourceFiles.includes(path), `${path} missing from proof register`)
}
for (const [key, value] of Object.entries(register.proofBoundary)) {
  if (key.endsWith('Executed') || key === 'artifactCreated' || key === 'exportedThrowingGuardsCalled') {
    assert(value === false, `${key} must be false`)
  } else {
    assert(value === true, `${key} must be true`)
  }
}

const exportsDoc = parsed['docs/sound-runtime-media-gate-2ah-module-export-register.md']
assert(exportsDoc.moduleExports.length === proof.moduleCount, 'exports doc count mismatch')
for (const moduleResult of proof.importedModules) {
  const docEntry = exportsDoc.moduleExports.find((entry) => entry.moduleName === moduleResult.moduleName)
  assert(docEntry, `${moduleResult.moduleName} missing from export register`)
  assert(JSON.stringify(docEntry.exportNames) === JSON.stringify(moduleResult.exportNames), `${moduleResult.moduleName} export names mismatch`)
}

const resolver = parsed['docs/sound-runtime-media-gate-2ah-resolver-policy-register.md']
assert(resolver.resolverPolicy.usesNodeBuiltInRegisterHooks === true, 'resolver hook policy missing')
assert(resolver.resolverPolicy.doesNotInstallDependencies === true, 'no dependency install invariant missing')
assert(resolver.resolverPolicy.doesNotModifyRuntimeSource === true, 'runtime source must not be modified')
assert(resolver.warning.directNodeImportWithoutResolverFullyPassed === false, 'resolver warning must be preserved')

const noExecution = parsed['docs/sound-runtime-media-gate-2ah-no-execution-validation.md']
for (const value of Object.values(noExecution.noExecutionObserved)) {
  assert(value === true, 'no-execution observations must stay true')
}
for (const value of Object.values(noExecution.readinessClaims)) {
  assert(value === false, 'readiness claims must stay false')
}

const blockers = parsed['docs/sound-runtime-media-gate-2ah-blocker-follow-up-register.md']
assert(blockers.resolvedForProof.some((row) => row.blockerId === 'controlled_no_execution_runtime_import_proof_pending'), 'resolved import proof blocker missing')
assert(blockers.warnings.some((row) => row.warningId === 'extensionless_runtime_relative_import_resolver_required'), 'resolver warning missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'no_execution_import_proof_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2ah-runtime-claim-policy.md']
assert(policy.allowedClaims.controlledNoExecutionImportProofPassedToday === true, 'proof pass allowed claim missing')
assert(policy.allowedClaims.runtimeModuleLoadPassedToday === true, 'module load allowed claim missing')
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-no-execution-import-proof-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AH decision')
assert(nextPrompt.includes('must not dispatch workers'), 'next prompt must block worker dispatch')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2ah:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2ah-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2ah_diagnostics_passed',
  decision,
  sourceHead,
  pr946Verified: true,
  controlledNoExecutionImportProofPassed: true,
  runtimeModuleCount: proof.moduleCount,
  resolverHookUsedForExtensionlessRuntimeImports: true,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-NO-EXECUTION-IMPORT-PROOF-OWNER-REVIEW: review no-execution runtime import proof, no execution'
}, null, 2))
