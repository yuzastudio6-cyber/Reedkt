import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2ad_worker_media_supabase_execution_gate_source_plan_completed_with_warnings_ready_for_execution_gate_source_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_execution_owner_gate_plan_review_passed_with_warnings_ready_for_worker_media_supabase_execution_gate_source_plan'
const sourceHead = '3788890f2323aaeb227812e93fec869712e4d45a'

const docs = [
  'docs/sound-runtime-media-gate-2ad-worker-media-supabase-execution-gate-source-plan.md',
  'docs/sound-runtime-media-gate-2ad-source-boundary-register.md',
  'docs/sound-runtime-media-gate-2ad-worker-media-supabase-contract-map.md',
  'docs/sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register.md',
  'docs/sound-runtime-media-gate-2ad-execution-source-blocker-register.md',
  'docs/sound-runtime-media-gate-2ad-runtime-claim-policy.md',
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

const plan = parsed['docs/sound-runtime-media-gate-2ad-worker-media-supabase-execution-gate-source-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr927.status === 'merged', 'PR #927 merge evidence missing')
assert(plan.sourceVerification.pr927.mergeCommit === sourceHead, 'PR #927 merge commit mismatch')
assert(plan.sourceVerification.pr927.decision === sourceDecision, 'PR #927 decision mismatch')
assert(plan.sourcePlanResult.executionGateSourcePlanCreated === true, 'source plan missing')
assert(plan.sourcePlanResult.futureWorkerBoundarySourceCategoriesPlanned === true, 'worker boundary plan missing')
assert(plan.sourcePlanResult.futureMediaBoundarySourceCategoriesPlanned === true, 'media boundary plan missing')
assert(plan.sourcePlanResult.futureSupabaseArtifactBoundarySourceCategoriesPlanned === true, 'Supabase/artifact boundary plan missing')
assert(plan.sourcePlanResult.runtimeSourceEditedToday === false, 'runtime source must not be edited')
assert(plan.sourcePlanResult.publicApiChangedToday === false, 'public API must not change')
assert(plan.sourcePlanResult.workerExecutionApprovedToday === false, 'worker execution must remain false')
assert(plan.sourcePlanResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-execution-owner-gate-plan-review.md')
assert(sourceReview.decision === sourceDecision, 'source owner review decision mismatch')
assert(sourceReview.ownerReviewResult.futureExecutionGateSourcePlanMayProceed === true, 'source must allow Gate 2AD')
assert(sourceReview.ownerReviewResult.workerExecutionApprovedToday === false, 'source worker execution must remain false')
assert(sourceReview.ownerReviewResult.supabaseSqlApprovedToday === false, 'source Supabase/SQL must remain false')

const boundaries = parsed['docs/sound-runtime-media-gate-2ad-source-boundary-register.md']
assert(boundaries.plannedFutureSourceBoundaries.length === 5, 'source boundary count mismatch')
assert(boundaries.plannedFutureSourceBoundaries.some((row) => row.owner === 'WORKER_RUNTIME_JOBS'), 'worker owner boundary missing')
assert(boundaries.plannedFutureSourceBoundaries.some((row) => row.owner === 'SUPABASE_RLS_STORAGE_DATABASE'), 'Supabase owner boundary missing')
assert(boundaries.currentGateOutputs.docsOnly === true, 'current gate must be docs-only')
assert(boundaries.currentGateOutputs.runtimeSourceCreated === false, 'runtime source must not be created')
assert(boundaries.currentGateOutputs.runtimeSourceEdited === false, 'runtime source must not be edited')

const contractMap = parsed['docs/sound-runtime-media-gate-2ad-worker-media-supabase-contract-map.md']
assert(contractMap.acceptedPlanningSurface.workerNames.includes('sound-cpu-analysis-worker'), 'sound CPU worker missing')
assert(contractMap.acceptedPlanningSurface.jobTypes.includes('sound.numeric_array_analysis'), 'numeric job missing')
assert(contractMap.acceptedPlanningSurface.sourceContractCategories.includes('supabase_operation_guard'), 'Supabase guard category missing')
assert(contractMap.rejectedPayloadInputs.includes('raw_prompt'), 'raw prompt rejection missing')
assert(contractMap.rejectedPayloadInputs.includes('service_role_payload'), 'service role payload rejection missing')
assert(contractMap.executionApprovedToday === false, 'execution must remain false')

const supabaseArtifact = parsed['docs/sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register.md']
assert(supabaseArtifact.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(supabaseArtifact.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')
assert(supabaseArtifact.supabaseClassification.nextAction === 'none', 'Supabase next action must be none')
assertAllFalse(supabaseArtifact.supabaseBoundaries, 'supabaseBoundaries')
assertAllFalse(supabaseArtifact.artifactBoundaries, 'artifactBoundaries')

const blockers = parsed['docs/sound-runtime-media-gate-2ad-execution-source-blocker-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'worker_media_supabase_execution_gate_source_plan_pending'), 'source-plan blocker resolution missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'execution_gate_source_owner_review_pending' && row.status === 'next'), 'next owner-review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_sql_storage_owner_approval_missing'), 'Supabase blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2ad-runtime-claim-policy.md']
assert(policy.allowedClaims.executionGateSourcePlanCreated === true, 'source plan claim missing')
assert(policy.allowedClaims.runtimeSourceEditedToday === false, 'runtime source edit claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-execution-gate-source-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AD decision')
assert(nextPrompt.includes('must not edit runtime source'), 'next prompt must block runtime source edits')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block widened readiness')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2ad:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2ad-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2ad_diagnostics_passed',
  decision,
  sourceHead,
  pr927Verified: true,
  executionGateSourcePlanCreated: true,
  runtimeSourceEditedToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-EXECUTION-GATE-SOURCE-OWNER-REVIEW: review worker/media/Supabase execution gate source plan, no execution'
}, null, 2))
