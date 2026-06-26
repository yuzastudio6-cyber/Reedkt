import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_actual_runtime_source_owner_review_passed_with_warnings_ready_for_runtime_source_static_integration_plan'
const gate2afDecision = 'sound_runtime_media_gate_2af_actual_runtime_source_created_with_warnings_ready_for_runtime_source_owner_review'
const sourceHead = '4b7c31faca11232bbbdb612d1da0aa8e690d581e'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-actual-runtime-source-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-actual-runtime-source-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-safety-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-readiness-register.md',
  'docs/worker-runtime-jobs-sound-cpu-actual-runtime-source-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-actual-runtime-source-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-actual-runtime-source-owner-review.md']
assert(review.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr937.status === 'merged', 'PR #937 evidence missing')
assert(review.sourceVerification.pr937.mergeCommit === sourceHead, 'PR #937 merge commit mismatch')
assert(review.sourceVerification.pr937.decision === gate2afDecision, 'PR #937 decision mismatch')
assert(review.ownerReviewResult.actualRuntimeSourceAcceptedForStaticIntegrationPlanning === true, 'source acceptance missing')
assert(review.ownerReviewResult.createdSourceFileCount === 6, 'source file count mismatch')
assert(review.ownerReviewResult.futureStaticIntegrationPlanMayProceed === true, 'future static integration flag missing')
assert(review.ownerReviewResult.runtimeExecutionEnabledToday === false, 'runtime execution must remain false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const gate2af = parseJsonBlock('docs/sound-runtime-media-gate-2af-actual-runtime-source-creation-result.md')
assert(gate2af.decision === gate2afDecision, 'Gate 2AF decision mismatch')
assert(gate2af.sourceCreationResult.runtimeSourceFilesCreated === 6, 'Gate 2AF source count mismatch')
assert(gate2af.sourceCreationResult.runtimeExecutionEnabledToday === false, 'Gate 2AF runtime execution must be false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-actual-runtime-source-acceptance-register.md']
assert(acceptance.acceptedSourceFilesForFutureStaticIntegrationPlanning.length === sourceFiles.length, 'accepted source count mismatch')
for (const path of sourceFiles) {
  assert(fs.existsSync(path), `${path} missing`)
  assert(acceptance.acceptedSourceFilesForFutureStaticIntegrationPlanning.includes(path), `${path} missing from acceptance register`)
}
assert(acceptance.acceptedForExecutionToday === false, 'accepted for execution today must be false')

const safety = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-safety-review-register.md']
for (const value of Object.values(safety.safetyReview)) {
  assert(value === true, 'safety review checks must be true')
}
assert(safety.remainingReviewRequiredBeforeExecution.includes('controlled import proof'), 'controlled import proof blocker missing')

const readiness = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-static-integration-readiness-register.md']
assert(readiness.futureStaticIntegrationPlan.mayPlanStaticImports === true, 'static import plan flag missing')
assert(readiness.futureStaticIntegrationPlan.mayEnableRuntimeExecution === false, 'runtime execution must not be enabled')
assert(readiness.futureStaticIntegrationPlan.mayTouchSupabase === false, 'Supabase must not be touched')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-actual-runtime-source-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'actual_runtime_source_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_source_static_integration_plan_pending' && row.status === 'next'), 'next static integration blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-actual-runtime-source-claim-policy.md']
assert(policy.allowedClaims.actualRuntimeSourceAcceptedForStaticIntegrationPlanning === true, 'allowed source acceptance claim missing')
assert(policy.allowedClaims.runtimeExecutionEnabledToday === false, 'runtime execution claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const combinedSource = sourceFiles.map((path) => read(path)).join('\n')
assert(!/process\.env/.test(combinedSource), 'runtime source must not read environment yet')
assert(!/createClient\s*\(/.test(combinedSource), 'runtime source must not create Supabase client')
assert(!/from ['"]node:fs/.test(combinedSource), 'runtime source must not import filesystem')
assert(!/from ['"]node:child_process/.test(combinedSource), 'runtime source must not import child process')
assert(!/fetch\s*\(/.test(combinedSource), 'runtime source must not fetch')
assert(!/docker\s+(build|run|push)/i.test(combinedSource), 'runtime source must not run Docker')
assert(!/\b(ffmpeg|ffprobe)\s+[-./\w]/i.test(combinedSource), 'runtime source must not run FFmpeg/ffprobe')
assert(!/REEDITPRO_[A-Z_]+_ENABLED['"]?:\s*['"]1['"]/.test(combinedSource), 'runtime source must not enable runtime flags')

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2ag-runtime-source-static-integration-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('must not enable runtime flags'), 'next prompt must block runtime enabling')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-actual-runtime-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-actual-runtime-source-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_actual_runtime_source_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr937Verified: true,
  actualRuntimeSourceAcceptedForStaticIntegrationPlanning: true,
  futureStaticIntegrationPlanMayProceed: true,
  runtimeExecutionEnabledToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AG: runtime source static integration plan, no execution'
}, null, 2))
