import fs from 'node:fs'

const decision = 'worker_runtime_jobs_sound_cpu_execution_owner_gate_plan_review_passed_with_warnings_ready_for_worker_media_supabase_execution_gate_source_plan'
const gate2acDecision = 'sound_runtime_media_gate_2ac_worker_media_supabase_execution_owner_gate_plan_completed_with_warnings_ready_for_execution_owner_gate_plan_review'
const sourceHead = '239a1447b623aa5ca823bf41d6af677b4eaa302a'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-execution-owner-gate-plan-review.md',
  'docs/worker-runtime-jobs-sound-cpu-execution-owner-gate-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-execution-owner-gate-register.md',
  'docs/worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register.md',
  'docs/worker-runtime-jobs-sound-cpu-execution-owner-gate-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-execution-owner-gate-claim-policy.md',
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

const review = parsed['docs/worker-runtime-jobs-sound-cpu-execution-owner-gate-plan-review.md']
assert(review.owner === 'WORKER_RUNTIME_JOBS', 'owner mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.pr924.status === 'merged', 'PR #924 merge evidence missing')
assert(review.sourceVerification.pr924.mergeCommit === sourceHead, 'PR #924 merge commit mismatch')
assert(review.sourceVerification.pr924.decision === gate2acDecision, 'PR #924 decision mismatch')
assert(review.ownerReviewResult.gate2acPlanAcceptedForFutureSourcePlanning === true, 'Gate 2AC acceptance missing')
assert(review.ownerReviewResult.futureExecutionGateSourcePlanMayProceed === true, 'future source-plan flag missing')
assert(review.ownerReviewResult.executionApprovedToday === false, 'execution approval must remain false')
assert(review.ownerReviewResult.workerExecutionApprovedToday === false, 'worker execution must remain false')
assert(review.ownerReviewResult.mediaProcessingApprovedToday === false, 'media processing must remain false')
assert(review.ownerReviewResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')
assert(review.ownerReviewResult.betaOrProductionReadinessClaimedToday === false, 'beta/production claim must remain false')

const gate2ac = parseJsonBlock('docs/sound-runtime-media-gate-2ac-worker-media-supabase-execution-owner-gate-plan.md')
assert(gate2ac.decision === gate2acDecision, 'Gate 2AC decision mismatch')
assert(gate2ac.ownerGatePlanResult.executionOwnerGatePlanCreated === true, 'Gate 2AC plan missing')
assert(gate2ac.ownerGatePlanResult.executionApprovedToday === false, 'Gate 2AC execution must remain false')
assert(gate2ac.ownerGatePlanResult.workerExecutionApprovedToday === false, 'Gate 2AC worker execution must remain false')
assert(gate2ac.ownerGatePlanResult.supabaseSqlApprovedToday === false, 'Gate 2AC Supabase/SQL must remain false')

const acceptance = parsed['docs/worker-runtime-jobs-sound-cpu-execution-owner-gate-acceptance-register.md']
assert(acceptance.acceptedForFuturePlanningOnly.ownerGateSequence.length === 5, 'owner gate sequence count mismatch')
assert(acceptance.acceptedForFuturePlanningOnly.workerNames.includes('sound-cpu-analysis-worker'), 'sound CPU worker missing')
assert(acceptance.acceptedForFuturePlanningOnly.workerNames.includes('sound-audio-metadata-worker'), 'audio metadata worker missing')
assert(acceptance.acceptedForFuturePlanningOnly.jobTypes.includes('sound.package_import_smoke'), 'package import smoke missing')
assert(acceptance.acceptedForFuturePlanningOnly.nextPlanningArtifact === 'worker_media_supabase_execution_gate_source_plan', 'next planning artifact mismatch')
assertAllFalse(acceptance.acceptedForExecutionToday, 'acceptedForExecutionToday')

const workerGate = parsed['docs/worker-runtime-jobs-sound-cpu-worker-execution-owner-gate-register.md']
assert(workerGate.planningOnlyWorkers.includes('sound-cpu-analysis-worker'), 'planning worker missing')
assert(workerGate.planningOnlyJobTypes.includes('sound.loudness_synthetic_analysis'), 'loudness job missing')
for (const value of Object.values(workerGate.blockedToday)) {
  assert(value === true, 'worker blockedToday values must stay true')
}

const mediaSupabase = parsed['docs/worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register.md']
assert(mediaSupabase.mediaOwnerGate.owner === 'SOUND_RUNTIME_MEDIA_GATE', 'media owner mismatch')
assertAllFalse(Object.fromEntries(Object.entries(mediaSupabase.mediaOwnerGate).filter(([, value]) => typeof value === 'boolean')), 'mediaOwnerGate')
assert(mediaSupabase.supabaseOwnerGate.updateRequired === 'no', 'Supabase update must be no')
assert(mediaSupabase.supabaseOwnerGate.sqlExecuted === 'no', 'SQL executed must be no')
assert(mediaSupabase.supabaseOwnerGate.nextAction === 'none', 'Supabase next action must be none')
assert(mediaSupabase.supabaseOwnerGate.serviceRoleMutationApprovedToday === false, 'service role mutation must be false')
assert(mediaSupabase.artifactOwnerGate.publicArtifactCreationApprovedToday === false, 'public artifact creation must be false')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-execution-owner-gate-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'execution_owner_gate_plan_review_pending'), 'resolved planning blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'worker_media_supabase_execution_gate_source_plan_pending' && row.status === 'next'), 'next source-plan blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')
assert(blockers.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-execution-owner-gate-claim-policy.md']
assert(policy.allowedClaims.gate2acPlanAcceptedForFutureSourcePlanning === true, 'allowed planning claim missing')
assert(policy.allowedClaims.executionApprovedToday === false, 'execution allowed claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-sound-runtime-media-gate-2ad-worker-media-supabase-execution-gate-source-plan.md')
assert(nextPrompt.includes(decision), 'next prompt must require owner-review decision')
assert(nextPrompt.includes('must not edit runtime source'), 'next prompt must block runtime source edits')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-execution-owner-gate-plan-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-execution-owner-gate-plan-review-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_execution_owner_gate_plan_review_diagnostics_passed',
  decision,
  sourceHead,
  pr924Verified: true,
  gate2acPlanAcceptedForFutureSourcePlanning: true,
  futureExecutionGateSourcePlanMayProceed: true,
  executionApprovedToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-2AD: worker/media/Supabase execution gate source plan, no execution'
}, null, 2))
