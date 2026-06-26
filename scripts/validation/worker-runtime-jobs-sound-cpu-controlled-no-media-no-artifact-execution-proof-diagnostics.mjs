import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const decision = 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_import_or_synthetic_failure'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_execution_plan_completed_with_warnings_ready_for_controlled_no_media_no_artifact_execution_proof'
const sourceHead = '861a9926b44dab3ee4af179b9818eb391a26eb9f'
const packageScript = 'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-diagnostics.mjs'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NO-MEDIA-NO-ARTIFACT-EXECUTION-PROOF-FIX: isolate SOUND CPU package import timeout, no media/artifacts'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-result.md', 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-result'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-package-proof-register.md', 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-package-proof-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-blocker-register.md', 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-blocker-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-cleanup-register.md', 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-cleanup-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-claim-policy.md', 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-claim-policy'],
]

const requiredFiles = [
  'scripts/validation/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-runner.py',
  'scripts/validation/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-diagnostics.mjs',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-execution-plan.md',
  'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt',
  'package.json',
]

const expectedPackages = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
]

function fullPath(relativePath) {
  return path.join(root, relativePath)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  assert(fs.existsSync(fullPath(relativePath)), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath(relativePath), 'utf8')
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

function assertAllFalse(value, keys, label) {
  for (const key of keys) assert(value?.[key] === false, `${label}.${key} must be false`)
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value?.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value?.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value?.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value?.nextAction === 'none', `${label}.nextAction must be none`)
}

function scanUnsafe(relativePaths) {
  const patterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}/,
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
    /\b(sk|pk)_(live|test)_[A-Za-z0-9]{16,}\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(runtimeReady|toolCallReady|mediaProcessingReady|betaReady|productionReady)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
  ]
  for (const relativePath of relativePaths) {
    const text = read(relativePath)
    for (const pattern of patterns) assert(!pattern.test(text), `Unsafe pattern ${pattern} matched ${relativePath}`)
  }
}

for (const file of requiredFiles) read(file)

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonFence(file, label)]))
const result = parsed.get('worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-result')
const register = parsed.get('worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-package-proof-register')
const blockers = parsed.get('worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-blocker-register')
const cleanup = parsed.get('worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-cleanup-register')
const claims = parsed.get('worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-claim-policy')

for (const doc of [result, register, blockers, cleanup, claims]) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
  assert(doc.decision === decision, 'decision mismatch')
}

assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr1101.mergeCommit === sourceHead, 'PR #1101 merge commit mismatch')
assert(result.sourceVerification.pr1101.decision === sourceDecision, 'PR #1101 decision mismatch')
assert(result.proofScope.disposableVenvOutsideRepo === true, 'venv must be outside repo')
assert(result.proofScope.requirementsPath === 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt', 'requirements path mismatch')
assertAllFalse(result.proofScope, [
  'mediaAllowed',
  'artifactsAllowed',
  'workerRouteToolRuntimeAllowed',
  'supabaseSqlAllowed',
  'providerModelAllowed',
  'dockerGcpAllowed',
], 'proofScope')

assert(result.proofResult.toolCandidateCount === 15, 'tool candidate count mismatch')
assert(result.proofResult.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(result.proofResult.aliasCoveredToolCount === 2, 'alias count mismatch')
assert(result.proofResult.expectedImportCount === 14, 'import count mismatch')
assert(result.proofResult.expectedSyntheticAssertionCount === 5, 'synthetic count mismatch')
assert(result.proofResult.pipInstallPassed === true, 'pip install must have passed')
assert(result.proofResult.metadataImportSyntheticPhaseCompleted === false, 'metadata/import/synthetic phase must not be marked complete')
assert(result.proofResult.metadataImportSyntheticTimedOut === true, 'metadata/import/synthetic timeout must be recorded')
assert(result.proofResult.tempVenvRemoved === true, 'temp venv cleanup must be recorded')
assert(result.proofResult.packageLockHash === 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3', 'package-lock hash mismatch')
assert(result.readinessOutcome.packageProofPassed === false, 'package proof must not be marked passed')
assertAllFalse(result.readinessOutcome, [
  'toolCallReadinessClaimed',
  'runtimeReadinessClaimed',
  'internalBetaUnlocked',
  'externalBetaUnlocked',
  'productionUnlocked',
], 'readinessOutcome')
assertAllFalse(result.runtimeFlags, Object.keys(result.runtimeFlags), 'runtimeFlags')
assertSupabaseNoop(result.supabaseClassification, 'result.supabaseClassification')
assert(result.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(register.directPinnedPackages.length === 13, 'direct pinned package list mismatch')
for (const packageName of expectedPackages) {
  assert(register.directPinnedPackages.some((item) => item.package === packageName), `missing package ${packageName}`)
}
assert(register.aliasCoveredTools.length === 2, 'alias covered tool count mismatch')
assert(register.installEvidence.pipInstallPassed === true, 'install evidence mismatch')
assert(register.installEvidence.requirementsInstalledIntoDisposableVenvOnly === true, 'venv-only install mismatch')
assert(register.installEvidence.packageLockChanged === false, 'package lock must not change')
assert(register.verificationEvidence.metadataVerified === false, 'metadata must not be verified')
assert(register.verificationEvidence.importsVerified === false, 'imports must not be verified')
assert(register.verificationEvidence.syntheticAssertionsVerified === false, 'synthetic assertions must not be verified')
assert(register.approvedForToolCallExecution === false, 'tool call execution must remain blocked')
assert(register.approvedForBeta === false, 'beta must remain blocked')

assert(blockers.currentBlockers.length === 1, 'current blocker count mismatch')
assert(blockers.currentBlockers[0].blockerId === 'metadata_import_synthetic_timeout', 'blocker id mismatch')
assert(blockers.currentBlockers[0].status === 'blocking', 'blocker status mismatch')
assert(blockers.recommendedNextPrompt === nextPrompt, 'blocker next prompt mismatch')
assertAllFalse(blockers.blockedReadiness, Object.keys(blockers.blockedReadiness), 'blockedReadiness')

assert(cleanup.tempVenvPolicy.location === '/private/tmp', 'cleanup temp location mismatch')
assert(cleanup.tempVenvPolicy.insideRepo === false, 'venv must be outside repo')
assert(cleanup.tempVenvPolicy.removed === true, 'venv removal mismatch')
assert(cleanup.tempVenvPolicy.remainingMatchingTempVenvs === 0, 'remaining temp venv count mismatch')
assert(cleanup.repoArtifactPolicy.packageLockChanged === false, 'cleanup package lock mismatch')
assert(cleanup.runnerHardening.processGroupTimeoutCleanupAdded === true, 'runner hardening missing')

for (const forbidden of [
  'package proof passed',
  'all 15 SOUND CPU tools are execution-ready',
  'tool-call readiness',
  'external beta readiness',
  'production readiness',
]) {
  assert(claims.forbiddenClaims.includes(forbidden), `forbidden claim missing: ${forbidden}`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claims.supabaseClassification')

const fixPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix.md')
for (const phrase of [
  decision,
  'Do not claim package proof passed',
  'per-module bounded subprocesses',
  'Do not open media files',
  'worker dispatch',
  'Docker/GCP',
]) {
  assert(fixPrompt.includes(phrase), `fix prompt missing phrase: ${phrase}`)
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-no-media-no-artifact-execution-proof:diagnostics'] === packageScript,
  'package diagnostics script missing',
)

scanUnsafe(docs.map(([file]) => file).concat([
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix.md',
]))

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_diagnostics_passed',
  decision,
  sourceHead,
  pipInstallPassed: result.proofResult.pipInstallPassed,
  metadataImportSyntheticTimedOut: result.proofResult.metadataImportSyntheticTimedOut,
  tempVenvRemoved: result.proofResult.tempVenvRemoved,
  packageProofPassed: result.readinessOutcome.packageProofPassed,
  nextPrompt,
}, null, 2))
