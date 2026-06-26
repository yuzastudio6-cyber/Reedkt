import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_execution_gate_source_owner_review_passed_with_warnings_ready_for_runtime_source_creation_plan'
const gate2adDecision = 'sound_runtime_media_gate_2ad_worker_media_supabase_execution_gate_source_plan_completed_with_warnings_ready_for_execution_gate_source_owner_review'
const sourceHead = 'c21b00715d4a05b5fd94150b8487b78ff0198956'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-execution-gate-source-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-execution-source-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-execution-source-boundary-approval-register.md',
  'docs/worker-runtime-jobs-sound-cpu-supabase-media-source-review-register.md',
  'docs/worker-runtime-jobs-sound-cpu-execution-source-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-execution-source-claim-policy.md',
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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must remain false`)
  }
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.decision === decision, `${path} decision mismatch`)
}

const review = parsed['docs/worker-runtime-jobs-sound-cpu-execution-gate-source-owner-review.md']
assert(review.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr929.status === 'merged', 'PR #929 evidence missing')
assert(review.sourceVerification.pr929.mergeCommit === sourceHead, 'PR #929 merge commit mismatch')
assert(review.sourceVerification.pr929.decision === gate2adDecision, 'PR #929 decision mismatch')
assert(review.ownerReviewResult.gate2adSourcePlanAcceptedForFutureRuntimeSourcePlanning === true, 'Gate 2AD acceptance missing')
assert(review.ownerReviewResult.futureRuntimeSourceCreationPlanMayProceed === true, 'future runtime-source plan flag missing')
assert(review.ownerReviewResult.runtimeSourceCreationApprovedToday === false, 'source creation must remain false')
assert(review.ownerReviewResult.runtimeSourceEditedToday === false, 'source editing must remain false')
assert(review.ownerReviewResult.workerExecutionApprovedToday === false, 'worker execution must remain false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const gate2ad = parseJsonBlock('docs/sound-runtime-media-gate-2ad-worker-media-supabase-execution-gate-source-plan.md')
assert(gate2ad.decision === gate2adDecision, 'Gate 2AD decision mismatch')
assert(gate2ad.sourcePlanResult.executionGateSourcePlanCreated === true, 'Gate 2AD source plan missing')
assert(gate2ad.sourcePlanResult.runtimeSourceEditedToday === false, 'Gate 2AD source edit must remain false')
assert(gate2ad.sourcePlanResult.publicApiChangedToday === false, 'Gate 2AD public API change must remain false')
assert(gate2ad.sourcePlanResult.supabaseSqlApprovedToday === false, 'Gate 2AD Supabase/SQL must remain false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-execution-source-acceptance-register.md']
assert(acceptance.acceptedForFuturePlanningOnly.sourceContractCategories.includes('media_operation_guard'), 'media guard category missing')
assert(acceptance.acceptedForFuturePlanningOnly.sourceContractCategories.includes('supabase_operation_guard'), 'Supabase guard category missing')
assert(acceptance.acceptedForFuturePlanningOnly.workerNames.includes('sound-cpu-analysis-worker'), 'worker missing')
assert(acceptance.acceptedForFuturePlanningOnly.jobTypes.includes('sound.loudness_synthetic_analysis'), 'job type missing')
assert(acceptance.acceptedForFuturePlanningOnly.nextPlanningArtifact === 'runtime_source_creation_plan', 'next artifact mismatch')
assertAllFalse(acceptance.acceptedForImplementationToday, 'acceptedForImplementationToday')
assertAllFalse(acceptance.acceptedForExecutionToday, 'acceptedForExecutionToday')

const boundary = parsed['docs/worker-runtime-jobs-sound-cpu-execution-source-boundary-approval-register.md']
assert(boundary.acceptedPlanningBoundaries.length === 5, 'accepted boundary count mismatch')
assert(boundary.acceptedPlanningBoundaries.includes('supabase_sql_storage_contracts'), 'Supabase planning boundary missing')
for (const value of Object.values(boundary.blockedToday)) {
  assert(value === true, 'blockedToday values must stay true')
}

const mediaSupabase = parsed['docs/worker-runtime-jobs-sound-cpu-supabase-media-source-review-register.md']
assert(mediaSupabase.mediaSourceReview.mediaGuardCategoryAcceptedForPlanning === true, 'media planning acceptance missing')
assert(mediaSupabase.mediaSourceReview.mediaSourceCreationApprovedToday === false, 'media source creation must be false')
assert(mediaSupabase.supabaseSourceReview.supabaseGuardCategoryAcceptedForPlanning === true, 'Supabase planning acceptance missing')
assert(mediaSupabase.supabaseSourceReview.updateRequired === 'no', 'Supabase update must be no')
assert(mediaSupabase.supabaseSourceReview.sqlExecuted === 'no', 'SQL executed must be no')
assert(mediaSupabase.supabaseSourceReview.nextAction === 'none', 'Supabase next action must be none')
assert(mediaSupabase.supabaseSourceReview.serviceRoleMutationApprovedToday === false, 'service role mutation must be false')
assert(mediaSupabase.artifactSourceReview.publicArtifactCreationApprovedToday === false, 'public artifact creation must be false')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-execution-source-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'execution_gate_source_owner_review_pending'), 'resolved source owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_source_creation_plan_pending' && row.status === 'next'), 'next runtime-source plan blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_source_owner_approval_missing'), 'Supabase source blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-execution-source-claim-policy.md']
assert(policy.allowedClaims.gate2adSourcePlanAcceptedForFutureRuntimeSourcePlanning === true, 'allowed source planning claim missing')
assert(policy.allowedClaims.runtimeSourceCreationApprovedToday === false, 'source creation claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2ae-worker-media-supabase-runtime-source-creation-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('must not create or edit runtime source'), 'next prompt must block source edits')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-execution-gate-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-execution-gate-source-owner-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_execution_gate_source_owner_review_diagnostics_passed',
  decision,
  sourceHead,
  pr929Verified: true,
  gate2adSourcePlanAcceptedForFutureRuntimeSourcePlanning: true,
  futureRuntimeSourceCreationPlanMayProceed: true,
  runtimeSourceCreationApprovedToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AE: worker/media/Supabase runtime source creation plan, no execution'
}, null, 2))
