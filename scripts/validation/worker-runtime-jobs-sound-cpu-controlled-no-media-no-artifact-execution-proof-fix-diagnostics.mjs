import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision = 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_import_timeout'
const sourceHead = 'd12a0f11c9a5640be6dddcc80310c3575332a9e2'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-MUSIC21-IMPORT-TIMEOUT-FIX: fix music21 import timeout, no media/artifacts'
const packageScript = 'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-diagnostics.mjs'

const docs = [
  ['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-result.md', 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-result'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-import-isolation-register.md', 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-import-isolation-register'],
  ['docs/worker-runtime-jobs-sound-cpu-music21-import-timeout-blocker.md', 'worker-runtime-jobs-sound-cpu-music21-import-timeout-blocker'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-fix-cleanup-register.md', 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-fix-cleanup-register'],
  ['docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-fix-claim-policy.md', 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-fix-claim-policy'],
]

const requiredFiles = [
  'scripts/validation/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-runner.py',
  'scripts/validation/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-diagnostics.mjs',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-music21-import-timeout-fix.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-blocker-register.md',
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

function assertFalseObject(value, label) {
  for (const [key, actual] of Object.entries(value)) {
    assert(actual === false, `${label}.${key} must remain false`)
  }
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value?.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value?.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value?.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value?.nextAction === 'none', `${label}.nextAction must be none`)
}

for (const file of requiredFiles) read(file)

const parsed = new Map(docs.map(([file, label]) => [label, parseBlock(file, label)]))
const result = parsed.get('worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-fix-result')
const isolation = parsed.get('worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-import-isolation-register')
const blocker = parsed.get('worker-runtime-jobs-sound-cpu-music21-import-timeout-blocker')
const cleanup = parsed.get('worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-fix-cleanup-register')
const claims = parsed.get('worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-fix-claim-policy')

for (const doc of [result, isolation, blocker, cleanup, claims]) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
  assert(doc.decision === decision, 'decision mismatch')
}

assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr1104.mergeCommit === sourceHead, 'PR #1104 merge mismatch')
assert(result.fixScope.disposableVenvOutsideRepo === true, 'venv must be outside repo')
assert(result.fixScope.perModuleBoundedSubprocesses === true, 'per-module bounded subprocesses required')
assert(result.fixScope.moduleImportTimeoutSeconds === 45, 'module timeout mismatch')
for (const key of ['mediaAllowed', 'artifactsAllowed', 'workerRouteToolRuntimeAllowed', 'supabaseSqlAllowed', 'providerModelAllowed', 'dockerGcpAllowed']) {
  assert(result.fixScope[key] === false, `fixScope.${key} must be false`)
}
assert(result.fixResult.directPinnedPackageCount === 13, 'direct package count mismatch')
assert(result.fixResult.metadataPassedCount === 13, 'metadata pass count mismatch')
assert(result.fixResult.metadataFailedCount === 0, 'metadata failure count mismatch')
assert(result.fixResult.importsPassedBeforeBlocker === 8, 'passed import count mismatch')
assert(result.fixResult.blockingModule === 'music21', 'blocking module mismatch')
assert(result.fixResult.blockingPackageVersion === '10.3.0', 'blocking package version mismatch')
assert(result.fixResult.blockingImportTimedOut === true, 'blocking timeout missing')
assert(result.fixResult.syntheticAssertionsRun === 0, 'synthetic checks must not run after blocker')
assert(result.fixResult.tempVenvRemoved === true, 'temp venv cleanup missing')
assert(result.readinessOutcome.packageProofPassed === false, 'package proof must remain false')
for (const key of ['toolCallReadinessClaimed', 'runtimeReadinessClaimed', 'internalBetaUnlocked', 'externalBetaUnlocked', 'productionUnlocked']) {
  assert(result.readinessOutcome[key] === false, `readinessOutcome.${key} must be false`)
}
assertSupabaseNoop(result.supabaseClassification, 'result.supabaseClassification')
assert(result.nextPrompt === nextPrompt, 'next prompt mismatch')

assert(isolation.metadataChecks.passed === true, 'metadata checks must pass')
assert(isolation.metadataChecks.passedCount === 13, 'metadata count mismatch')
assert(isolation.moduleImports.length === 9, 'module import isolation list mismatch')
assert(isolation.moduleImports.find((item) => item.module === 'music21')?.timedOut === true, 'music21 timeout missing')
assert(isolation.notRunAfterBlocker.includes('pretty_midi'), 'downstream not-run list missing pretty_midi')

assert(blocker.blocker.id === 'music21_import_timeout', 'blocker id mismatch')
assert(blocker.blocker.status === 'blocking', 'blocker status mismatch')
assert(blocker.requiredFix.prompt === nextPrompt, 'blocker next prompt mismatch')
assertFalseObject(blocker.impact, 'blocker.impact')

assert(cleanup.tempVenvPolicy.removed === true, 'cleanup venv removal mismatch')
assert(cleanup.tempVenvPolicy.remainingMatchingTempVenvs === 0, 'cleanup temp venv count mismatch')
assert(cleanup.repoArtifactPolicy.packageLockChanged === false, 'cleanup package lock mismatch')
assert(cleanup.processCleanup.perModuleProcessGroupCleanupEnabled === true, 'process cleanup guard missing')

for (const forbidden of [
  'all 15 SOUND CPU tools are execution-ready',
  'package proof passed',
  'tool-call readiness',
  'external beta readiness',
  'production readiness',
]) {
  assert(claims.forbiddenClaims.includes(forbidden), `missing forbidden claim: ${forbidden}`)
}
assertSupabaseNoop(claims.supabaseClassification, 'claims.supabaseClassification')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-music21-import-timeout-fix.md')
for (const phrase of [
  decision,
  'music21',
  '10.3.0',
  '45 second',
  'Do not open media files',
  'worker dispatch',
  'Docker/GCP',
]) {
  assert(prompt.includes(phrase), `prompt missing phrase: ${phrase}`)
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-controlled-no-media-no-artifact-execution-proof-fix:diagnostics'] === packageScript,
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_diagnostics_passed',
  decision,
  sourceHead,
  metadataPassedCount: result.fixResult.metadataPassedCount,
  blockingModule: result.fixResult.blockingModule,
  tempVenvRemoved: result.fixResult.tempVenvRemoved,
  packageProofPassed: result.readinessOutcome.packageProofPassed,
  nextPrompt,
}, null, 2))
