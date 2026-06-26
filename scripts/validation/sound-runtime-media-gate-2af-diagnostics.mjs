import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2af_actual_runtime_source_created_with_warnings_ready_for_runtime_source_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_runtime_source_creation_plan_owner_review_passed_with_warnings_ready_for_actual_runtime_source_creation_gate'
const sourceHead = '50a6b0032299634bed21cc0eac033575bdd1ea9b'

const docs = [
  'docs/sound-runtime-media-gate-2af-actual-runtime-source-creation-result.md',
  'docs/sound-runtime-media-gate-2af-runtime-source-file-manifest.md',
  'docs/sound-runtime-media-gate-2af-disabled-runtime-defaults-validation.md',
  'docs/sound-runtime-media-gate-2af-no-execution-validation.md',
  'docs/sound-runtime-media-gate-2af-runtime-source-blocker-register.md',
  'docs/sound-runtime-media-gate-2af-runtime-claim-policy.md',
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

for (const path of sourceFiles) {
  assert(fs.existsSync(path), `${path} missing`)
}

const result = parsed['docs/sound-runtime-media-gate-2af-actual-runtime-source-creation-result.md']
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.pr935.status === 'merged', 'PR #935 evidence missing')
assert(result.sourceVerification.pr935.mergeCommit === sourceHead, 'PR #935 merge commit mismatch')
assert(result.sourceVerification.pr935.decision === sourceDecision, 'PR #935 decision mismatch')
assert(result.sourceCreationResult.runtimeSourceFilesCreated === 6, 'created file count mismatch')
assert(result.sourceCreationResult.actualRuntimeSourceCreatedToday === true, 'source creation claim missing')
assert(result.sourceCreationResult.runtimeExecutionEnabledToday === false, 'runtime execution must remain false')
assert(result.sourceCreationResult.workerExecutionApprovedToday === false, 'worker execution must remain false')
assert(result.sourceCreationResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-runtime-source-creation-plan-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(sourceReview.ownerReviewResult.actualRuntimeSourceCreationMayProceedInFutureGate === true, 'source owner review must allow Gate 2AF')
assert(sourceReview.ownerReviewResult.actualRuntimeSourceCreatedToday === false, 'source owner review must not have created files')

const manifest = parsed['docs/sound-runtime-media-gate-2af-runtime-source-file-manifest.md']
assert(manifest.createdRuntimeSourceFiles.length === sourceFiles.length, 'manifest file count mismatch')
for (const path of sourceFiles) {
  assert(manifest.createdRuntimeSourceFiles.includes(path), `${path} missing from manifest`)
}
assert(manifest.exactSourceOnly === true, 'exact source only invariant missing')

const defaults = parsed['docs/sound-runtime-media-gate-2af-disabled-runtime-defaults-validation.md']
for (const value of Object.values(defaults.disabledDefaultsInSource)) {
  assert(value === '0', 'disabled defaults must be 0')
}
assert(defaults.enabledToday === false, 'runtime must not be enabled today')

const noExecution = parsed['docs/sound-runtime-media-gate-2af-no-execution-validation.md']
for (const value of Object.values(noExecution.noExecutionObserved)) {
  assert(value === true, 'no-execution observations must stay true')
}
for (const value of Object.values(noExecution.readinessClaims)) {
  assert(value === false, 'readiness claims must stay false')
}

const blockers = parsed['docs/sound-runtime-media-gate-2af-runtime-source-blocker-register.md']
assert(blockers.resolvedForSourceCreation.some((row) => row.blockerId === 'actual_runtime_source_creation_gate_pending'), 'source creation blocker resolution missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'actual_runtime_source_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2af-runtime-claim-policy.md']
assert(policy.allowedClaims.actualRuntimeSourceCreatedToday === true, 'source created allowed claim missing')
assert(policy.allowedClaims.runtimeExecutionEnabledToday === false, 'runtime execution claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const combinedSource = sourceFiles.map((path) => read(path)).join('\n')
const forbiddenSourcePatterns = [
  /from ['"]node:fs['"]/,
  /from ['"]node:child_process['"]/,
  /createClient\s*\(/,
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

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-actual-runtime-source-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AF decision')
assert(nextPrompt.includes('must not enable runtime flags'), 'next prompt must block runtime enabling')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2af:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2af-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2af_diagnostics_passed',
  decision,
  sourceHead,
  pr935Verified: true,
  runtimeSourceFilesCreated: 6,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-ACTUAL-RUNTIME-SOURCE-OWNER-REVIEW: review actual runtime source, no execution'
}, null, 2))
