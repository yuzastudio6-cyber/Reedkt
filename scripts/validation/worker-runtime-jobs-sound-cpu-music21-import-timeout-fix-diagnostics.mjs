import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_music21_import_timeout_fix_passed_with_warnings_ready_for_package_proof_owner_review'
const sourceHead = 'd1544804da6ea3c1e90f1126e4a1d379c488b911'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PACKAGE-PROOF-OWNER-REVIEW: review bounded SOUND CPU package proof, no media/artifacts'
const packageScript = 'node scripts/validation/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-diagnostics.mjs'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result.md', 'worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result'],
  ['docs/worker-runtime-jobs-sound-cpu-music21-statistics-fallback-register.md', 'worker-runtime-jobs-sound-cpu-music21-statistics-fallback-register'],
  ['docs/worker-runtime-jobs-sound-cpu-no-media-no-artifact-package-proof-register.md', 'worker-runtime-jobs-sound-cpu-no-media-no-artifact-package-proof-register'],
  ['docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-cleanup-register.md', 'worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-cleanup-register'],
  ['docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-claim-policy.md', 'worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-claim-policy'],
]

const requiredFiles = [
  'scripts/validation/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-runner.py',
  'scripts/validation/worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-diagnostics.mjs',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-package-proof-owner-review.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-music21-import-timeout-fix.md',
  'docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-blocker.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-result.md',
  'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt',
  'package.json',
]

function fullPath(file) {
  return path.join(root, file)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(file) {
  assert(fs.existsSync(fullPath(file)), `Missing file: ${file}`)
  return fs.readFileSync(fullPath(file), 'utf8')
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```'))
  assert(match, `Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value?.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value?.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value?.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value?.nextAction === 'none', `${label}.nextAction must be none`)
}

function assertAllFalse(value, label) {
  for (const [key, actual] of Object.entries(value)) {
    assert(actual === false, `${label}.${key} must be false`)
  }
}

for (const file of requiredFiles) read(file)

const parsed = new Map(docs.map(([file, label]) => [label, parseBlock(file, label)]))
const result = parsed.get('worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-result')
const fallback = parsed.get('worker-runtime-jobs-sound-cpu-music21-statistics-fallback-register')
const proof = parsed.get('worker-runtime-jobs-sound-cpu-no-media-no-artifact-package-proof-register')
const cleanup = parsed.get('worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-cleanup-register')
const claims = parsed.get('worker-runtime-jobs-sound-cpu-music21-import-timeout-fix-claim-policy')

for (const doc of [result, fallback, proof, cleanup, claims]) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
  assert(doc.decision === decision, 'decision mismatch')
}

assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr1106.mergeCommit === sourceHead, 'PR #1106 merge commit mismatch')
assert(result.sourceVerification.pr1106.decision === 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_import_timeout', 'source decision mismatch')
assert(result.sourceVerification.priorBlocker.module === 'music21', 'prior blocker module mismatch')
assert(result.sourceVerification.priorBlocker.version === '10.3.0', 'music21 version mismatch')
assert(result.fix.rootCause.includes('_statistics'), 'root cause must mention _statistics')
assert(result.fix.safeResolution.includes('pure-Python'), 'safe resolution must mention pure-Python fallback')
for (const key of ['dependencyVersionChanged', 'candidateSetChanged', 'requirementsChanged', 'packageLockChanged']) {
  assert(result.fix[key] === false, `fix.${key} must be false`)
}
assert(result.proofResult.requirementsInstallPassed === true, 'requirements install must pass')
assert(result.proofResult.metadataPassedCount === 13, 'metadata pass count mismatch')
assert(result.proofResult.metadataFailedCount === 0, 'metadata failure count mismatch')
assert(result.proofResult.moduleImportsPassedCount === 14, 'module import pass count mismatch')
assert(result.proofResult.moduleImportsFailedCount === 0, 'module import failure count mismatch')
assert(result.proofResult.syntheticAssertionsPassedCount === 5, 'synthetic pass count mismatch')
assert(result.proofResult.syntheticAssertionsFailedCount === 0, 'synthetic failure count mismatch')
assert(result.proofResult.music21ImportPassed === true, 'music21 import must pass')
assert(result.proofResult.music21SymbolicNoteAssertionPassed === true, 'music21 note assertion must pass')
assert(result.proofResult.tempVenvRemoved === true, 'temp venv must be removed')
assert(result.readinessOutcome.boundedPackageProofPassed === true, 'bounded package proof must pass')
for (const key of ['toolCallReadinessClaimed', 'workerReadinessClaimed', 'routeReadinessClaimed', 'mediaReadinessClaimed', 'internalBetaUnlocked', 'externalBetaUnlocked', 'productionUnlocked']) {
  assert(result.readinessOutcome[key] === false, `readinessOutcome.${key} must remain false`)
}
assertSupabaseNoop(result.supabaseClassification, 'result.supabaseClassification')
assert(result.nextPrompt === nextPrompt, 'result next prompt mismatch')

assert(fallback.fallback.guardUsed === true, 'statistics guard missing')
assert(fallback.fallback.blockedExtension === '_statistics', 'blocked extension mismatch')
assert(fallback.fallback.guardScope === 'proof subprocess only', 'guard must remain proof scoped')
assert(fallback.fallback.unguardedStatisticsProbe.timedOut === true, 'unguarded statistics timeout must be recorded')
assert(fallback.fallback.guardedStatisticsProbe.passed === true, 'guarded statistics probe must pass')
assert(fallback.runtimeCaveat.runtimeReadinessClaimed === false, 'fallback must not claim runtime readiness')
assert(fallback.runtimeCaveat.toolCallReadinessClaimed === false, 'fallback must not claim tool-call readiness')

assert(proof.directPinnedPackages.length === 13, 'direct pinned package count mismatch')
assert(proof.aliasCoveredTools.includes('pydub_effects'), 'missing pydub_effects alias')
assert(proof.aliasCoveredTools.includes('ebu_r128_pyloudnorm'), 'missing ebu_r128 alias')
assert(proof.metadata.passed === true, 'metadata must pass')
assert(proof.metadata.passedCount === 13, 'metadata passed count mismatch')
assert(proof.metadata.failedCount === 0, 'metadata failed count mismatch')
assert(proof.moduleImports.length === 14, 'module imports count mismatch')
assert(proof.moduleImports.every((item) => item.passed === true), 'all module imports must pass')
assert(proof.moduleImports.find((item) => item.module === 'music21')?.durationSeconds < 45, 'music21 import must be under timeout')
assert(proof.syntheticAssertions.length === 5, 'synthetic assertions count mismatch')
assert(proof.syntheticAssertions.every((item) => item.passed === true), 'all synthetic assertions must pass')
assertAllFalse(proof.proofBoundaries, 'proof.proofBoundaries')

assert(cleanup.tempVenv.createdOutsideRepo === true, 'temp venv must be outside repo')
assert(cleanup.tempVenv.removed === true, 'temp venv removed mismatch')
assert(cleanup.repoState.packageLockChanged === false, 'package lock changed')
assert(cleanup.repoState.nodeModulesStaged === false, 'node_modules staged')
assert(cleanup.repoState.distStaged === false, 'dist staged')
assert(cleanup.repoState.sidecarsAllowed === false, 'sidecars must not be allowed')
assert(cleanup.proofOutput.staged === false, 'local proof output must not be staged')

for (const allowed of [
  'bounded package metadata proof passed',
  'bounded package import proof passed',
  'bounded in-memory synthetic assertions passed',
]) {
  assert(claims.allowedClaims.includes(allowed), `missing allowed claim: ${allowed}`)
}
for (const forbidden of [
  'tool-call readiness',
  'worker readiness',
  'route readiness',
  'media readiness',
  'runtime readiness',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'external beta readiness',
  'production readiness',
]) {
  assert(claims.forbiddenClaims.includes(forbidden), `missing forbidden claim: ${forbidden}`)
}
for (const [gate, closed] of Object.entries(claims.closedGates)) {
  assert(closed === true, `closedGates.${gate} must be true`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claims.supabaseClassification')
assert(claims.nextPrompt === nextPrompt, 'claims next prompt mismatch')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-package-proof-owner-review.md')
for (const phrase of [
  decision,
  'no media',
  'no artifacts',
  'pure-Python statistics fallback guard',
  'Do not claim tool-call readiness',
]) {
  assert(prompt.includes(phrase), `owner-review prompt missing phrase: ${phrase}`)
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-music21-import-timeout-fix:diagnostics'] === packageScript,
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_music21_import_timeout_fix_diagnostics_passed',
  decision,
  sourceHead,
  metadataPassedCount: result.proofResult.metadataPassedCount,
  moduleImportsPassedCount: result.proofResult.moduleImportsPassedCount,
  syntheticAssertionsPassedCount: result.proofResult.syntheticAssertionsPassedCount,
  music21ImportDurationSeconds: result.proofResult.music21ImportDurationSeconds,
  boundedPackageProofPassed: result.readinessOutcome.boundedPackageProofPassed,
  runtimeReadinessClaimed: result.readinessOutcome.workerReadinessClaimed,
  nextPrompt,
}, null, 2))
