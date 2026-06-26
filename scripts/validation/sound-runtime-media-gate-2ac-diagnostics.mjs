import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2ac_worker_media_supabase_execution_owner_gate_plan_completed_with_warnings_ready_for_execution_owner_gate_plan_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_route_readiness_claim_owner_review_passed_with_warnings_ready_for_worker_media_supabase_execution_owner_gate_plan'
const sourceHead = '742095bd4aebc7b27ee4379f39654910e68769e8'

const docs = [
  'docs/sound-runtime-media-gate-2ac-worker-media-supabase-execution-owner-gate-plan.md',
  'docs/sound-runtime-media-gate-2ac-owner-gate-dependency-map.md',
  'docs/sound-runtime-media-gate-2ac-worker-execution-boundary-register.md',
  'docs/sound-runtime-media-gate-2ac-media-supabase-boundary-register.md',
  'docs/sound-runtime-media-gate-2ac-execution-blocker-register.md',
  'docs/sound-runtime-media-gate-2ac-runtime-claim-policy.md',
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

const plan = parsed['docs/sound-runtime-media-gate-2ac-worker-media-supabase-execution-owner-gate-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr921.status === 'merged', 'PR #921 merge evidence missing')
assert(plan.sourceVerification.pr921.mergeCommit === sourceHead, 'PR #921 merge commit mismatch')
assert(plan.sourceVerification.pr921.decision === sourceDecision, 'PR #921 decision mismatch')
assert(plan.ownerGatePlanResult.executionOwnerGatePlanCreated === true, 'execution owner-gate plan missing')
assert(plan.ownerGatePlanResult.workerExecutionOwnerGateRequired === true, 'worker owner gate required missing')
assert(plan.ownerGatePlanResult.mediaOperationOwnerGateRequired === true, 'media owner gate required missing')
assert(plan.ownerGatePlanResult.supabaseSqlStorageOwnerGateRequired === true, 'Supabase owner gate required missing')
assert(plan.ownerGatePlanResult.executionApprovedToday === false, 'execution approval must remain false')
assert(plan.ownerGatePlanResult.workerExecutionApprovedToday === false, 'worker execution must remain false')
assert(plan.ownerGatePlanResult.mediaProcessingApprovedToday === false, 'media processing must remain false')
assert(plan.ownerGatePlanResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const source = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-route-readiness-claim-owner-review.md')
assert(source.decision === sourceDecision, 'source owner-review decision mismatch')
assert(source.ownerReviewResult.futureWorkerMediaSupabaseExecutionOwnerGatePlanMayProceed === true, 'source must allow Gate 2AC')
assert(source.ownerReviewResult.workerExecutionApprovedToday === false, 'source worker execution must remain false')
assert(source.ownerReviewResult.supabaseSqlApprovedToday === false, 'source Supabase/SQL must remain false')

const dependencyMap = parsed['docs/sound-runtime-media-gate-2ac-owner-gate-dependency-map.md']
assert(dependencyMap.requiredOwnerGatesBeforeExecution.length === 5, 'owner gate count mismatch')
assert(dependencyMap.requiredOwnerGatesBeforeExecution.some((gate) => gate.owner === 'WORKER_RUNTIME_JOBS'), 'worker owner gate missing')
assert(dependencyMap.requiredOwnerGatesBeforeExecution.some((gate) => gate.owner === 'SUPABASE_RLS_STORAGE_DATABASE'), 'Supabase owner gate missing')
assert(dependencyMap.allExecutionBlockedUntilOwnerGatesPass === true, 'execution block invariant missing')

const workerBoundary = parsed['docs/sound-runtime-media-gate-2ac-worker-execution-boundary-register.md']
assert(workerBoundary.acceptedForPlanningOnly.workerNames.includes('sound-cpu-analysis-worker'), 'sound CPU worker missing')
assert(workerBoundary.acceptedForPlanningOnly.jobTypes.includes('sound.package_import_smoke'), 'package import smoke job missing')
for (const value of Object.values(workerBoundary.blockedToday)) {
  assert(value === true, 'worker blockedToday values must stay true')
}

const mediaSupabase = parsed['docs/sound-runtime-media-gate-2ac-media-supabase-boundary-register.md']
for (const value of Object.values(mediaSupabase.mediaBoundary)) {
  assert(value === false, 'media boundary approvals must stay false')
}
assert(mediaSupabase.supabaseBoundary.updateRequired === 'no', 'Supabase update must be no')
assert(mediaSupabase.supabaseBoundary.sqlExecuted === 'no', 'SQL executed must be no')
assert(mediaSupabase.supabaseBoundary.storageWriteApprovedToday === false, 'Supabase storage write must stay false')
assert(mediaSupabase.artifactBoundary.publicArtifactCreationApprovedToday === false, 'public artifacts must stay false')

const blockers = parsed['docs/sound-runtime-media-gate-2ac-execution-blocker-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'worker_media_supabase_execution_owner_gate_plan_pending'), 'planning blocker resolution missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'execution_owner_gate_plan_review_pending' && row.status === 'next'), 'next owner review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2ac-runtime-claim-policy.md']
assert(policy.allowedClaims.executionOwnerGatePlanCreated === true, 'owner gate plan claim missing')
assert(policy.allowedClaims.executionApprovedToday === false, 'execution approved claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-execution-owner-gate-plan-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AC decision')
assert(nextPrompt.includes('must not edit runtime source'), 'next prompt must block source edits')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block widened readiness claims')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2ac:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2ac-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2ac_diagnostics_passed',
  decision,
  sourceHead,
  pr921Verified: true,
  executionOwnerGatePlanCreated: true,
  executionApprovedToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-EXECUTION-OWNER-GATE-PLAN-REVIEW: review worker/media/Supabase execution owner-gate plan, no execution'
}, null, 2))
