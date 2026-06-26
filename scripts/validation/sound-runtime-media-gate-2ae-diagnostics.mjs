import fs from 'node:fs'

const decision = 'sound_runtime_media_gate_2ae_worker_media_supabase_runtime_source_creation_plan_completed_with_warnings_ready_for_runtime_source_creation_owner_review'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_execution_gate_source_owner_review_passed_with_warnings_ready_for_runtime_source_creation_plan'
const sourceHead = '1b647c884058bedece19771fdb46d4b4374b198a'

const docs = [
  'docs/sound-runtime-media-gate-2ae-worker-media-supabase-runtime-source-creation-plan.md',
  'docs/sound-runtime-media-gate-2ae-future-source-file-list-register.md',
  'docs/sound-runtime-media-gate-2ae-disabled-runtime-defaults-register.md',
  'docs/sound-runtime-media-gate-2ae-public-api-type-nochange-register.md',
  'docs/sound-runtime-media-gate-2ae-worker-media-supabase-guard-contract-plan.md',
  'docs/sound-runtime-media-gate-2ae-runtime-source-blocker-register.md',
  'docs/sound-runtime-media-gate-2ae-runtime-claim-policy.md',
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

const plan = parsed['docs/sound-runtime-media-gate-2ae-worker-media-supabase-runtime-source-creation-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr931.status === 'merged', 'PR #931 evidence missing')
assert(plan.sourceVerification.pr931.mergeCommit === sourceHead, 'PR #931 merge commit mismatch')
assert(plan.sourceVerification.pr931.decision === sourceDecision, 'PR #931 decision mismatch')
assert(plan.runtimeSourceCreationPlanResult.futureRuntimeSourceFileListPlanned === true, 'future file list missing')
assert(plan.runtimeSourceCreationPlanResult.disabledByDefaultRuntimeGuardsPlanned === true, 'disabled defaults missing')
assert(plan.runtimeSourceCreationPlanResult.actualRuntimeSourceCreatedToday === false, 'runtime source creation must be false')
assert(plan.runtimeSourceCreationPlanResult.actualRuntimeSourceEditedToday === false, 'runtime source edit must be false')
assert(plan.runtimeSourceCreationPlanResult.supabaseSqlApprovedToday === false, 'Supabase/SQL must remain false')

const sourceReview = parseJsonBlock('docs/worker-runtime-jobs-sound-cpu-execution-gate-source-owner-review.md')
assert(sourceReview.decision === sourceDecision, 'source owner-review decision mismatch')
assert(sourceReview.ownerReviewResult.futureRuntimeSourceCreationPlanMayProceed === true, 'source must allow Gate 2AE')
assert(sourceReview.ownerReviewResult.runtimeSourceCreationApprovedToday === false, 'source creation must remain false')
assert(sourceReview.ownerReviewResult.supabaseSqlApprovedToday === false, 'source Supabase/SQL must remain false')

const fileList = parsed['docs/sound-runtime-media-gate-2ae-future-source-file-list-register.md']
assert(fileList.futureSourceFilesProposedNotCreated.length === 6, 'future source file count mismatch')
assert(fileList.futureSourceFilesProposedNotCreated.includes('server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts'), 'runtime guard file missing')
assert(fileList.currentGateFileCreation.runtimeSourceFilesCreated === 0, 'runtime files created must be zero')
assert(fileList.currentGateFileCreation.supabaseFilesCreated === 0, 'Supabase files created must be zero')
assert(fileList.creationRequiresFutureOwnerReview === true, 'future owner review requirement missing')

const defaults = parsed['docs/sound-runtime-media-gate-2ae-disabled-runtime-defaults-register.md']
for (const value of Object.values(defaults.futureDisabledDefaults)) {
  assert(value === '0', 'future disabled defaults must be 0')
}
assert(defaults.futureGuardBehavior.failClosedWhenUnset === true, 'fail-closed behavior missing')
for (const value of Object.values(defaults.currentGateExecution)) {
  assert(value === false, 'current gate execution must stay false')
}

const noChange = parsed['docs/sound-runtime-media-gate-2ae-public-api-type-nochange-register.md']
for (const value of Object.values(noChange.currentGatePublicSurface)) {
  assert(value === false, 'public surface values must stay false')
}

const contracts = parsed['docs/sound-runtime-media-gate-2ae-worker-media-supabase-guard-contract-plan.md']
assert(contracts.planningOnlyContractInputs.includes('approvedPlanSnapshotId'), 'approved snapshot input missing')
assert(contracts.planningOnlyContractInputs.includes('runtimeDisabledFlags'), 'runtime disabled flags input missing')
assert(contracts.rejectedContractInputs.includes('service_role_payload'), 'service role payload rejection missing')
assert(contracts.executionApprovedToday === false, 'execution must remain false')

const blockers = parsed['docs/sound-runtime-media-gate-2ae-runtime-source-blocker-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_source_creation_plan_pending'), 'runtime source plan resolution missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_source_creation_plan_owner_review_pending' && row.status === 'next'), 'next owner review blocker missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'supabase_source_owner_approval_missing'), 'Supabase source blocker missing')

const policy = parsed['docs/sound-runtime-media-gate-2ae-runtime-claim-policy.md']
assert(policy.allowedClaims.futureRuntimeSourceFileListPlanned === true, 'future file list claim missing')
assert(policy.allowedClaims.actualRuntimeSourceCreatedToday === false, 'actual source creation claim must be false')
assert(policy.allowedClaims.workerExecutionApprovedToday === false, 'worker execution claim must be false')
assert(policy.allowedClaims.supabaseSqlApprovedToday === false, 'Supabase claim must be false')
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
for (const value of Object.values(policy.closedGates)) {
  assert(value === true, 'closed gates must stay true')
}

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-source-creation-plan-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require Gate 2AE decision')
assert(nextPrompt.includes('must not create or edit runtime source'), 'next prompt must block source edits')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['sound-runtime-media-gate-2ae:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-2ae-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_2ae_diagnostics_passed',
  decision,
  sourceHead,
  pr931Verified: true,
  futureRuntimeSourceFileListPlanned: true,
  actualRuntimeSourceCreatedToday: false,
  actualRuntimeSourceEditedToday: false,
  workerExecutionApprovedToday: false,
  mediaProcessingApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-RUNTIME-SOURCE-CREATION-PLAN-OWNER-REVIEW: review runtime source creation plan, no execution'
}, null, 2))
