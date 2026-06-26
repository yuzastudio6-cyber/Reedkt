import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_runtime_source_creation_plan_owner_review_passed_with_warnings_ready_for_actual_runtime_source_creation_gate'
const gate2aeDecision = 'sound_runtime_media_gate_2ae_worker_media_supabase_runtime_source_creation_plan_completed_with_warnings_ready_for_runtime_source_creation_owner_review'
const sourceHead = '92d1d9c33ff4c4d94f6df49de4c93c1f09519e64'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-creation-plan-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-file-list-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-disabled-runtime-defaults-owner-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-public-api-type-nochange-owner-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-creation-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-runtime-source-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-creation-plan-owner-review.md']
assert(review.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr933.status === 'merged', 'PR #933 evidence missing')
assert(review.sourceVerification.pr933.mergeCommit === sourceHead, 'PR #933 merge commit mismatch')
assert(review.sourceVerification.pr933.decision === gate2aeDecision, 'PR #933 decision mismatch')
assert(review.ownerReviewResult.gate2aeRuntimeSourceCreationPlanAcceptedForFutureSourceGate === true, 'Gate 2AE acceptance missing')
assert(review.ownerReviewResult.actualRuntimeSourceCreationMayProceedInFutureGate === true, 'future source gate flag missing')
assert(review.ownerReviewResult.actualRuntimeSourceCreatedToday === false, 'source created today must be false')
assert(review.ownerReviewResult.actualRuntimeSourceEditedToday === false, 'source edited today must be false')
assert(review.ownerReviewResult.workerExecutionApprovedToday === false, 'worker execution must remain false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const gate2ae = parseJsonBlock('docs/sound-runtime-media-gate-2ae-worker-media-supabase-runtime-source-creation-plan.md')
assert(gate2ae.decision === gate2aeDecision, 'Gate 2AE decision mismatch')
assert(gate2ae.runtimeSourceCreationPlanResult.futureRuntimeSourceFileListPlanned === true, 'Gate 2AE future file list missing')
assert(gate2ae.runtimeSourceCreationPlanResult.actualRuntimeSourceCreatedToday === false, 'Gate 2AE source creation must be false')
assert(gate2ae.runtimeSourceCreationPlanResult.supabaseSqlApprovedToday === false, 'Gate 2AE Supabase must remain false')

const files = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-file-list-acceptance-register.md']
assert(files.acceptedFutureSourceFiles.length === 6, 'accepted future source file count mismatch')
assert(files.acceptedFutureSourceFiles.includes('server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts'), 'runtime guards source missing')
assert(files.acceptedForCreationToday === false, 'accepted for creation today must be false')
assert(files.acceptedForExecutionToday === false, 'accepted for execution today must be false')

const defaults = parsed['docs/worker-runtime-jobs-sound-cpu-disabled-runtime-defaults-owner-review-register.md']
for (const value of Object.values(defaults.acceptedFutureDisabledDefaults)) {
  assert(value === '0', 'disabled defaults must be 0')
}
assert(defaults.acceptedFailClosedBehavior.failClosedWhenUnset === true, 'fail-closed acceptance missing')
assert(defaults.enabledToday === false, 'runtime must not be enabled today')

const noChange = parsed['docs/worker-runtime-jobs-sound-cpu-public-api-type-nochange-owner-register.md']
for (const value of Object.values(noChange.acceptedNoChangePolicy)) {
  assert(value === false, 'no-change policy values must remain false')
}

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-creation-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_source_creation_plan_owner_review_pending'), 'resolved owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'actual_runtime_source_creation_gate_pending' && row.status === 'next'), 'next source gate blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-runtime-source-claim-policy.md']
assert(policy.allowedClaims.gate2aeRuntimeSourceCreationPlanAcceptedForFutureSourceGate === true, 'allowed Gate 2AE claim missing')
assert(policy.allowedClaims.actualRuntimeSourceCreatedToday === false, 'actual source creation claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2af-actual-runtime-source-creation.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('must not execute server routes'), 'next prompt must block route execution')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-source-creation-plan-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-source-creation-plan-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_source_creation_plan_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr933Verified: true,
  futureSourceGateMayProceed: true,
  actualRuntimeSourceCreatedToday: false,
  actualRuntimeSourceEditedToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AF: actual runtime source creation gate, no execution'
}, null, 2))
