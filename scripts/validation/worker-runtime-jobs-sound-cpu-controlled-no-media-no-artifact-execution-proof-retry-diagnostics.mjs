import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_retry_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_decision_review_completed_with_warnings_ready_for_controlled_no_media_no_artifact_execution_proof_retry'
const sourceHead = 'ef777045c17b31b8bd06f315fd798b98945f4936'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-BETA-READINESS-RECONCILIATION: reconcile retry package proof with runtime/beta gates, no execution'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-package-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-import-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-synthetic-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-cleanup-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-claim-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-blocker-register.md',
]

const requiredFiles = [
  ...docs,
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-decision-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-count-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-next-gate-register.md',
  'docs/worker-runtime-jobs-sound-cpu-current-lane-status-review.md',
  'docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-result.md',
  'scripts/validation/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-runner.py',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation.md',
  'package.json',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(file) {
  assert(fs.existsSync(file), `Missing file: ${file}`)
  return fs.readFileSync(file, 'utf8')
}

function parseJsonBlock(file) {
  const text = read(file)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${file} missing fenced json block`)
  return JSON.parse(match[1])
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value?.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value?.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value?.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value?.nextAction === 'none', `${label}.nextAction must be none`)
}

for (const file of requiredFiles) read(file)

const parsed = Object.fromEntries(docs.map((file) => [file, parseJsonBlock(file)]))
for (const [file, json] of Object.entries(parsed)) {
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${file} owner mismatch`)
  assert(json.decision === decision, `${file} decision mismatch`)
}

const result = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr1119.mergeCommit === sourceHead, 'PR #1119 merge commit mismatch')
assert(result.sourceVerification.pr1119.decision === sourceDecision, 'PR #1119 decision mismatch')
assert(result.proofScope.singleRetryAttempt === true, 'single retry flag missing')
assert(result.proofScope.disposableVenvOutsideRepo === true, 'disposable venv flag missing')
assert(result.proofScope.requirementsPath === 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt', 'requirements path mismatch')
for (const key of ['mediaAllowed', 'artifactsAllowed', 'workerRouteToolRuntimeAllowed', 'supabaseSqlAllowed', 'providerModelAllowed', 'dockerGcpAllowed']) {
  assert(result.proofScope[key] === false, `${key} must remain false`)
}
assert(result.proofResult.toolCandidateCount === 15, 'tool candidate count mismatch')
assert(result.proofResult.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(result.proofResult.aliasCoveredToolCount === 2, 'alias count mismatch')
assert(result.proofResult.metadataPassedCount === 13, 'metadata pass count mismatch')
assert(result.proofResult.moduleImportsPassedCount === 14, 'module import pass count mismatch')
assert(result.proofResult.syntheticAssertionsPassedCount === 5, 'synthetic pass count mismatch')
assert(result.proofResult.pipInstallPassed === true, 'pip install pass missing')
assert(result.proofResult.music21ImportDurationSeconds < 45, 'music21 import duration must be below timeout')
assert(result.proofResult.tempVenvRemoved === true, 'temp venv must be removed')
assert(result.proofResult.packageProofPassed === true, 'package proof must pass')
assert(result.proofResult.packageLockChanged === false, 'package lock must be unchanged')
for (const key of ['toolCallReadinessClaimed', 'runtimeReadinessClaimed', 'workerReadinessClaimed', 'routeReadinessClaimed', 'mediaReadinessClaimed', 'internalBetaUnlocked', 'externalBetaUnlocked', 'productionUnlocked']) {
  assert(result.readinessOutcome[key] === false, `${key} must remain false`)
}
assert(result.nextPrompt === nextPrompt, 'next prompt mismatch')

const packages = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-package-register.md']
assert(packages.packageRows.length === 13, 'package row count mismatch')
assert(packages.packageRows.every((row) => row.metadataPassed === true), 'all metadata rows must pass')
assert(packages.aliasCoveredTools.length === 2, 'alias row count mismatch')
assert(packages.counts.candidateToolCount === 15, 'candidate count mismatch')
assert(packages.counts.metadataFailedCount === 0, 'metadata failures must be zero')

const imports = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-import-register.md']
assert(imports.moduleImports.length === 14, 'import row count mismatch')
assert(imports.moduleImports.every((row) => row.passed === true && row.timedOut === false), 'all imports must pass without timeout')
assert(imports.counts.moduleImportsFailedCount === 0, 'import failure count must be zero')
assert(imports.statisticsFallback.guardUsed === true, 'statistics guard missing')
assert(imports.statisticsFallback.guardedStatisticsPassed === true, 'guarded statistics proof missing')
assert(imports.statisticsFallback.runtimeReadinessClaimed === false, 'statistics guard must not claim runtime readiness')

const synthetic = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-synthetic-register.md']
assert(synthetic.syntheticAssertions.length === 5, 'synthetic row count mismatch')
assert(synthetic.syntheticAssertions.every((row) => row.passed === true && row.timedOut === false), 'all synthetic assertions must pass without timeout')
assert(synthetic.boundaries.inMemoryOnly === true, 'synthetic assertions must be in-memory only')
assert(synthetic.boundaries.mediaFileOpenAttempted === false, 'media must not open')
assert(synthetic.boundaries.artifactCreationAttempted === false, 'artifacts must not be created')

const cleanup = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-cleanup-register.md']
assert(cleanup.cleanup.tempVenvCreatedOutsideRepo === true, 'temp venv source missing')
assert(cleanup.cleanup.tempVenvRemoved === true, 'temp venv removal missing')
assert(cleanup.cleanup.packageLockChanged === false, 'package-lock changed')
for (const value of Object.values(cleanup.runtimeFlags)) assert(value === false, 'all runtime flags must be false')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-claim-policy.md']
for (const value of Object.values(policy.allowedClaims)) assert(value === true, 'allowed claims must be true')
for (const claim of ['tool-call execution ready', 'worker execution ready', 'route execution ready', 'external beta ready', 'production ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assertNoop(policy.supabaseClassification, 'policy.supabaseClassification')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-blocker-register.md']
assert(blockers.resolvedBlockers.length === 1, 'resolved blocker count mismatch')
assert(blockers.resolvedBlockers[0].blocker === 'music21_import_timeout', 'resolved blocker mismatch')
assert(blockers.remainingBlockers.length === 6, 'remaining blocker count mismatch')
assert(blockers.remainingBlockers.every((row) => row.status === 'blocked'), 'remaining blockers must stay blocked')
assert(blockers.nextPrompt === nextPrompt, 'blocker register next prompt mismatch')

const sourceDecisionReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-decision-review.md')
assert(sourceDecisionReview.decision === sourceDecision, 'source decision-review mismatch')
assert(sourceDecisionReview.decisionReviewResult.nextSafeGate === 'controlled_no_media_no_artifact_execution_proof_retry_after_music21_fix', 'source next safe gate mismatch')

const currentCounts = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-count-register.md')
assert(currentCounts.toolCounts.packageProofReadyForPlanningCount === 15, 'source package count mismatch')
assert(currentCounts.toolCounts.persistentRuntimeInstallReadyCount === 0, 'source runtime install count mismatch')
assert(currentCounts.toolCounts.toolCallExecutionReadyCount === 0, 'source tool-call count mismatch')

const oldFix = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-result.md')
assert(oldFix.fixResult.blockingModule === 'music21', 'old blocking module mismatch')
assert(oldFix.readinessOutcome.packageProofPassed === false, 'old blocked proof must remain failed')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation.md')
assert(prompt.includes(decision), 'reconciliation prompt must require retry decision')
assert(prompt.includes('This prompt is no-execution and decision-only'), 'reconciliation prompt must remain no-execution')
assert(prompt.includes('Do not run package installation'), 'reconciliation prompt must block installs')
assert(prompt.includes('stop with a blocker instead of forcing progress'), 'reconciliation prompt must stop on unsupported readiness')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-controlled-no-media-no-artifact-execution-proof-retry:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_retry_diagnostics_passed',
  decision,
  sourceHead,
  metadataPassedCount: 13,
  moduleImportsPassedCount: 14,
  syntheticAssertionsPassedCount: 5,
  tempVenvRemoved: true,
  nextPrompt,
}, null, 2))
