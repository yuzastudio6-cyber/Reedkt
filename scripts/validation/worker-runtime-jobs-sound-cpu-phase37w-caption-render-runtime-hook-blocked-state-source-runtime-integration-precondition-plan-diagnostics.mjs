import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37w_caption_render_runtime_hook_blocked_state_source_runtime_integration_precondition_plan_completed_with_warnings_ready_for_precondition_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37v_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_owner_review_passed_with_warnings_ready_for_runtime_integration_precondition_plan_no_media_no_artifacts'
const phase37VPlanDecision =
  'worker_runtime_jobs_sound_cpu_phase37v_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_plan_completed_with_warnings_ready_for_closure_owner_review_no_media_no_artifacts'
const sourceMergeCommit = '97fd1e925dcee8f2d19827fd5bb24c66bfa37245'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37W-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-PRECONDITION-PLAN-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-source-register.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-source-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-checklist.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-checklist',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) throw new Error(`Missing required file: ${relativePath}`)
  return fs.readFileSync(absolutePath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const plan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-result',
)
const sourceRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-source-register',
)
const checklist = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-checklist',
)
const boundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-boundary-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review',
)

assert(plan.decision === expectedDecision, 'Phase 37W decision mismatch')
assert(plan.sourceVerification.sourcePr === 1708, 'Source PR mismatch')
assert(plan.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(plan.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(plan.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(plan.preconditionPlanResult.phase37VOwnerReviewAccepted === true, 'Phase 37V owner review not accepted')
assert(plan.preconditionPlanResult.runtimeIntegrationPreconditionsPlanned === true, 'Preconditions not planned')
assert(plan.preconditionPlanResult.preconditionCount === 8, 'Precondition count mismatch')
for (const key of [
  'allExecutionPreconditionsSatisfiedToday',
  'runtimeIntegrationApprovedToday',
  'hookExecutionApprovedToday',
  'realMediaApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(plan.preconditionPlanResult[key], `plan.preconditionPlanResult.${key}`)
}
assert(plan.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(plan.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(plan.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(sourceRegister.decision === expectedDecision, 'Source register decision mismatch')
assert(
  sourceRegister.acceptedSources.some(
    (source) => source.sourceId === 'phase37v_closure_owner_review' && source.decision === sourceDecision,
  ),
  'Phase 37V owner-review source missing',
)
assert(
  sourceRegister.acceptedSources.some(
    (source) => source.sourceId === 'phase37v_closure_plan' && source.decision === phase37VPlanDecision,
  ),
  'Phase 37V closure-plan source missing',
)
assert(sourceRegister.sourceFilesReviewed.integrationTarget === indexPath, 'Source register target mismatch')
assert(sourceRegister.sourceFilesReviewed.integrationSourcePath === blockedSourcePath, 'Source register path mismatch')
assert(sourceRegister.sourceFilesReviewed.temporaryProofFile === tempProofFile, 'Temp proof path mismatch')
assert(sourceRegister.sourceUseLimits.preconditionPlanningOnly === true, 'Precondition-only source limit missing')
for (const key of [
  'runtimeExecutionAuthorization',
  'mediaInputAuthorization',
  'artifactOutputAuthorization',
  'workerDispatchAuthorization',
  'supabaseSqlAuthorization',
  'betaProductionAuthorization',
]) {
  assertFalse(sourceRegister.sourceUseLimits[key], `sourceRegister.sourceUseLimits.${key}`)
}

assert(checklist.runtimeIntegrationPreconditions.length === 8, 'Checklist precondition count mismatch')
for (const row of checklist.runtimeIntegrationPreconditions) {
  assert(row.required === true, `${row.precondition} must be required`)
  assert(row.satisfiedToday === false, `${row.precondition} must be unsatisfied today`)
  assert(typeof row.owner === 'string' && row.owner.length > 0, `${row.precondition} owner missing`)
}
assert(checklist.approvalStateToday.runtimeIntegrationPreconditionsPlanned === true, 'Preconditions planned flag missing')
assert(checklist.approvalStateToday.preconditionCount === 8, 'Approval precondition count mismatch')
for (const key of [
  'allPreconditionsSatisfiedToday',
  'runtimeIntegrationAllowedToday',
  'realMediaAllowedToday',
  'artifactCreationAllowedToday',
  'workerDispatchAllowedToday',
  'supabaseSqlAllowedToday',
  'betaProductionAllowedToday',
]) {
  assertFalse(checklist.approvalStateToday[key], `checklist.approvalStateToday.${key}`)
}

assert(boundary.allowedThisGate.docsDiagnosticsOnly === true, 'Docs-only boundary missing')
assert(boundary.allowedThisGate.preconditionPlanning === true, 'Precondition planning boundary missing')
for (const [key, value] of Object.entries(boundary.blockedThisGate)) {
  assert(value === true, `Blocked gate must remain true: ${key}`)
}
assert(boundary.runtimeSourceStateToday.blockedStateSourceExists === true, 'Blocked source state missing')
assert(boundary.runtimeSourceStateToday.blockedStatusRemainsBlockedByOwnerGate === true, 'Blocked status state missing')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
  'supabaseSqlApproved',
]) {
  assertFalse(boundary.runtimeSourceStateToday[key], `boundary.runtimeSourceStateToday.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase37w_runtime_integration_precondition_plan_pending'),
  'Phase 37W precondition-plan blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase37w_runtime_integration_precondition_owner_review_pending',
  ),
  'Phase 37W owner-review blocker missing',
)
assertFalse(blockers.betaProductionStatus.realUserMediaBetaAllowed, 'blockers.realUserMediaBetaAllowed')
assertFalse(blockers.betaProductionStatus.paidProductionAllowed, 'blockers.paidProductionAllowed')

assert(claimPolicy.allowedClaims.phase37WPreconditionPlanCreated === true, 'Precondition plan claim missing')
assert(claimPolicy.allowedClaims.runtimeIntegrationPreconditionsPlanned === true, 'Preconditions planned claim missing')
assert(claimPolicy.allowedClaims.phase37VOwnerReviewConsumed === true, 'Phase 37V source claim missing')
assert(claimPolicy.allowedClaims.preconditionOwnerReviewMayProceed === true, 'Owner-review next claim missing')
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'artifactReadiness',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(claimPolicy.forbiddenClaims[key], `claimPolicy.forbiddenClaims.${key}`)
}
for (const key of [
  'dockerBuild',
  'dockerRun',
  'dockerPush',
  'gcpCloudRun',
  'workerDispatch',
  'routeExecution',
  'toolExecution',
  'providerModelCall',
  'mediaProcessing',
  'artifactCreation',
  'supabaseSql',
]) {
  assertFalse(claimPolicy.executionClaims[key], `claimPolicy.executionClaims.${key}`)
}

assert(ownerPrompt.requiredSourceDecision === expectedDecision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.integrationTarget === indexPath, 'Owner prompt target mismatch')
assert(ownerPrompt.integrationSourcePath === blockedSourcePath, 'Owner prompt source path mismatch')
assert(ownerPrompt.reviewFocus.phase37VOwnerReviewConsumed === true, 'Owner prompt source focus missing')
assert(ownerPrompt.reviewFocus.preconditionCountAccepted === 8, 'Owner prompt precondition count mismatch')
assertFalse(ownerPrompt.reviewFocus.allExecutionPreconditionsSatisfiedToday, 'Owner prompt all preconditions widened')
assert(ownerPrompt.reviewFocus.blockedStateSourceStillFailClosed === true, 'Owner prompt fail-closed focus missing')
assert(ownerPrompt.reviewFocus.temporaryProofFileAbsent === true, 'Owner prompt temp absence missing')
for (const key of [
  'runtimeIntegrationAllowedToday',
  'realMediaAllowed',
  'artifactCreationAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(ownerPrompt.reviewFocus[key], `ownerPrompt.reviewFocus.${key}`)
}

const phase37VOwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review-result',
)
assert(phase37VOwnerReview.decision === sourceDecision, 'Phase 37V owner-review source decision missing')
assert(
  phase37VOwnerReview.reviewedClosure.runtimeIntegrationPreconditionPlanningMayProceed === true,
  'Phase 37V source did not allow precondition planning',
)

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Worker execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Media processing false missing')
assert(blockedSource.includes('artifactCreationApproved: false'), 'Artifact false missing')
assert(blockedSource.includes('supabaseSqlApproved: false'), 'Supabase SQL false missing')
const indexSource = readText(indexPath)
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1708,
      sourceMergeCommit,
      preconditionCount: 8,
      allExecutionPreconditionsSatisfiedToday: false,
      runtimeIntegrationApprovedToday: false,
      realMediaAllowed: false,
      artifactCreationAllowed: false,
      workerDispatchAllowed: false,
      supabaseSqlAllowed: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
