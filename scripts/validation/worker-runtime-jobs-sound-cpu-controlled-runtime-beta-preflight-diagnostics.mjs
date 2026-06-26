import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const decision = 'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_passed_with_warnings_ready_for_runtime_execution_approval_gate'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_completed_with_warnings_ready_for_validation_disk_cleanup_and_controlled_runtime_preflight'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-EXECUTION-APPROVAL-GATE: review limited SOUND CPU runtime execution approval criteria, no execution'
const expectedLockHash = 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3'

const files = {
  preflight: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight.md',
  validation: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-validation-register.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-readiness-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-blocker-register.md',
  claims: 'docs/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md',
  source: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution.md',
  productBeta: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  packageJson: 'package.json',
  packageLock: 'package-lock.json',
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseJsonFence(relativePath, label) {
  const text = read(relativePath)
  const match = text.match(new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```'))
  assert(match, `Missing JSON fence ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assertFalseFlags(value, keys, label) {
  for (const key of keys) assert(value?.[key] === false, `${label}.${key} must remain false`)
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update classification widened`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment classification widened`)
  assert(value?.sqlExecuted === 'no', `${label} Supabase SQL classification widened`)
  assert(value?.migrationDeployed === 'no', `${label} Supabase migration classification widened`)
  assert(value?.nextAction === 'none', `${label} Supabase next action widened`)
}

const preflight = parseJsonFence(files.preflight, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight')
const validation = parseJsonFence(files.validation, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-validation-register')
const readiness = parseJsonFence(files.readiness, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-readiness-register')
const blockers = parseJsonFence(files.blockers, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-blocker-register')
const claims = parseJsonFence(files.claims, 'worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-claim-policy')
const source = parseJsonFence(files.source, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution')
const productBeta = parseJsonFence(files.productBeta, 'worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure')
const promptText = read(files.prompt)

assert(preflight.owner === 'WORKER_RUNTIME_JOBS', 'preflight owner mismatch')
assert(preflight.decision === decision, 'preflight decision mismatch')
assert(preflight.sourceVerification.sourceHead === '65123c44225e6460fad1f044f202bc5785e605db', 'source head mismatch')
assert(preflight.sourceVerification.pr1093.mergeCommit === '65123c44225e6460fad1f044f202bc5785e605db', 'PR #1093 merge commit mismatch')
assert(preflight.sourceVerification.pr1093.decision === sourceDecision, 'PR #1093 decision mismatch')
assert(source.decision === sourceDecision, 'source decision mismatch')
assert(productBeta.gapClosureResult.toolCandidateCount === 15, 'product beta tool count mismatch')
assert(productBeta.gapClosureResult.remainingGapCount === 0, 'product beta remaining planning gaps mismatch')

assert(preflight.preflightResult.toolCandidateCount === 15, 'preflight tool count mismatch')
assert(preflight.preflightResult.directPinnedPackageCount === 13, 'direct pinned package count mismatch')
assert(preflight.preflightResult.aliasCoveredToolCount === 2, 'alias-covered tool count mismatch')
assert(preflight.preflightResult.planningGapCountClosed === 8, 'planning gap count mismatch')
assert(preflight.preflightResult.remainingPlanningGapCount === 0, 'remaining planning gap mismatch')
assert(preflight.preflightResult.dependencyHydrationPassed === true, 'dependency hydration should pass')
assert(preflight.preflightResult.dependencyHydrationMode === 'validation_only', 'dependency hydration mode mismatch')
assert(preflight.preflightResult.packageLockUnchanged === true, 'package-lock unchanged flag mismatch')
assert(preflight.preflightResult.packageLockSha256 === expectedLockHash, 'package-lock hash mismatch')
assert(preflight.preflightResult.readinessSummariesPassed === true, 'readiness summary flag mismatch')
assert(preflight.preflightResult.lintPassed === true, 'lint flag mismatch')
assert(preflight.preflightResult.serverTypecheckPassed === true, 'server typecheck flag mismatch')
assert(preflight.preflightResult.typescriptBuildPassed === true, 'TypeScript build flag mismatch')
assert(preflight.preflightResult.clientBuildPassed === true, 'client build flag mismatch')
assert(preflight.preflightResult.serverBuildPassed === true, 'server build flag mismatch')
assert(preflight.preflightResult.buildOutputsRemovedAfterValidation === true, 'build output removal flag mismatch')
assert(preflight.preflightResult.nodeModulesIgnoredAndUnstaged === true, 'node_modules ignored flag mismatch')
assert(preflight.preflightResult.internalTestingSummaryStatus === 'internal_testing_ready', 'internal testing summary status mismatch')
assertFalseFlags(preflight.preflightResult, [
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'providerCallsApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
  'creditMutationApprovedToday',
  'stripePaymentProcessingApprovedToday',
  'internalBetaAllowed',
  'externalBetaAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionAllowed',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
], 'preflight.preflightResult')
assert(preflight.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(validation.cleanupEvidence.cleanInactiveWorktreesRemoved === 14, 'cleanup removal count mismatch')
assert(validation.cleanupEvidence.sidecarsRemovedFromPreflightWorktree === 7013, 'sidecar removal count mismatch')
assert(validation.cleanupEvidence.dirtyMainCheckoutTouched === false, 'dirty checkout must not be touched')
assert(validation.dependencyHydration.command === 'npm ci --no-audit --no-fund', 'hydration command mismatch')
assert(validation.dependencyHydration.passed === true, 'hydration result mismatch')
assert(validation.dependencyHydration.allowScriptsChanged === false, 'allowScripts policy must not change')
assert(validation.commands.length === 14, 'validation command count mismatch')
for (const command of validation.commands) assert(command.status !== 'failed', `command failed in register: ${command.command}`)
assert(validation.summary.dependencyHydrationReadyToday === true, 'dependency hydration readiness mismatch')
assert(validation.summary.dependencyBackedStaticChecksPassed === true, 'static checks flag mismatch')
assertFalseFlags(validation.summary, ['runtimeExecutionAllowed', 'externalBetaAllowed', 'productionAllowed'], 'validation.summary')

assert(readiness.soundCpuCandidates.candidateCount === 15, 'readiness candidate count mismatch')
assert(readiness.soundCpuCandidates.directPinnedPackages.length === 13, 'readiness direct pinned package count mismatch')
assert(readiness.soundCpuCandidates.aliasCoveredTools.length === 2, 'readiness alias count mismatch')
assert(readiness.productionReadinessSummary.overallStatus === 'blocked', 'production readiness must remain blocked')
assert(readiness.productionReadinessSummary.missingTools === 10, 'missing tool count mismatch')
assert(readiness.productionReadinessSummary.notInstalledTools === 17, 'not installed tool count mismatch')
assert(readiness.betaReadinessSummary.status === 'internal_testing_ready', 'beta summary status mismatch')
assert(readiness.betaReadinessSummary.internalDryRunAllowed === true, 'internal dry-run summary mismatch')
assertFalseFlags(readiness.preflightBoundaries, [
  'acceptedForRuntimeExecutionToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForRouteExecutionToday',
  'acceptedForToolExecutionToday',
  'acceptedForMediaProcessingToday',
  'acceptedForExternalBetaToday',
  'acceptedForProductionToday',
], 'readiness.preflightBoundaries')

assert(blockers.resolvedBlockers.length === 2, 'resolved blocker count mismatch')
assert(blockers.currentBlockers.length === 5, 'current blocker count mismatch')
assert(blockers.summary.nextPrompt === nextPrompt, 'blocker next prompt mismatch')
assertFalseFlags(blockers.summary, ['runtimeExecutionAllowed', 'externalBetaAllowed', 'productionAllowed'], 'blockers.summary')

for (const claim of [
  'dependency hydration passed for validation only',
  'static diagnostics passed',
  'the 15 SOUND CPU candidates remain planning/preflight evidence only',
]) {
  assert(claims.allowedClaims.includes(claim), `allowed claim missing: ${claim}`)
}
for (const claim of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'live tool-call readiness',
  'worker execution readiness',
  'external beta readiness',
  'production readiness',
]) {
  assert(claims.forbiddenClaims.includes(claim), `forbidden claim missing: ${claim}`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claims')

for (const phrase of [
  decision,
  'do not execute workers',
  'Decision options:',
  'no real media',
  'no Supabase mutation',
]) {
  assert(promptText.includes(phrase), `next prompt missing phrase: ${phrase}`)
}

const packageJson = JSON.parse(read(files.packageJson))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-runtime-beta-preflight:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-diagnostics.mjs',
  'package script missing',
)
assert(fs.existsSync(path.join(root, files.packageLock)), 'package-lock missing')

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_diagnostics_passed',
  decision,
  toolCandidateCount: preflight.preflightResult.toolCandidateCount,
  dependencyHydrationPassed: preflight.preflightResult.dependencyHydrationPassed,
  dependencyBackedStaticChecksPassed: validation.summary.dependencyBackedStaticChecksPassed,
  productionReadinessOverallStatus: readiness.productionReadinessSummary.overallStatus,
  betaReadinessStatus: readiness.betaReadinessSummary.status,
  externalBetaAllowed: preflight.preflightResult.externalBetaAllowed,
  productionAllowed: preflight.preflightResult.productionAllowed,
  runtimeExecutionApprovedToday: preflight.preflightResult.runtimeExecutionApprovedToday,
  nextPrompt,
}, null, 2))
