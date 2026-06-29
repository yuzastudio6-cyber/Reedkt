import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase37v_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_owner_review_passed_with_warnings_ready_for_runtime_integration_precondition_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37v_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_plan_completed_with_warnings_ready_for_closure_owner_review_no_media_no_artifacts'
const phase37UOwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase37u_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_integration_readiness_closure_plan_no_media_no_artifacts'
const sourceMergeCommit = '670047e12458eb61671df142849377ebef64ec6b'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37W-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-PRECONDITION-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-register.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan.md',
    'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan',
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
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-claim-policy',
)
const phase37WRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-register',
)
const phase37WPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1703, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'phase37VClosurePlanAccepted',
  'sourceRegisterAccepted',
  'boundaryChecklistAccepted',
  'safetyRegisterAccepted',
  'blockerRegisterAccepted',
  'claimPolicyAccepted',
  'blockedStateSourceStillFailClosed',
  'temporaryProofFileAbsent',
  'runtimeIntegrationPreconditionPlanningMayProceed',
]) {
  assert(review.reviewedClosure[key] === true, `reviewedClosure.${key} must be true`)
}
for (const key of [
  'runtimeIntegrationApprovedToday',
  'realMediaAllowed',
  'artifactCreationAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(review.reviewedClosure[key], `review.reviewedClosure.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37VDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37VPr === 1703, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37VMergeCommit === sourceMergeCommit, 'Acceptance merge mismatch')
assert(acceptance.acceptedEvidence.phase37UOwnerReviewConsumed === true, 'Phase 37U owner-review acceptance missing')
assert(acceptance.acceptedEvidence.staticBoundaryChecklistAccepted === true, 'Boundary checklist acceptance missing')
assert(acceptance.acceptedEvidence.temporaryProofFileAbsent === true, 'Temporary proof absence acceptance missing')
assert(acceptance.acceptedEvidence.packageLockUnchanged === true, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedScope.runtimeIntegrationPreconditionPlanning === true, 'Precondition planning acceptance missing')
for (const key of [
  'runtimeExecution',
  'realMediaProcessing',
  'artifactDelivery',
  'workerDispatch',
  'routeToolProviderExecution',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.reviewSafety.allowedNextStep === 'runtime-integration precondition plan', 'Allowed next step mismatch')
assert(safety.reviewSafety.blockedStateSourceMustRemainFailClosed === true, 'Fail-closed requirement missing')
assert(safety.reviewSafety.temporaryProofFileMustRemainAbsent === true, 'Temp absence requirement missing')
assert(safety.reviewSafety.runtimeIntegrationMustRemainUnapprovedUntilLaterGate === true, 'Runtime unapproved requirement missing')
for (const key of [
  'realMediaInputAllowed',
  'ocrInferenceAllowed',
  'captionRenderExecutionAllowed',
  'artifactWriteAllowed',
  'workerDispatchAllowed',
  'routeToolProviderAllowed',
  'supabaseSqlAllowed',
  'betaUnlockAllowed',
  'productionUnlockAllowed',
]) {
  assertFalse(safety.reviewSafety[key], `safety.reviewSafety.${key}`)
}
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
  assertFalse(safety.mustRemainFalse[key], `safety.mustRemainFalse.${key}`)
}

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase37v_integration_readiness_closure_owner_review_pending',
  ),
  'Phase 37V owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37w_runtime_integration_precondition_plan_pending'),
  'Phase 37W precondition blocker missing',
)

assert(claimPolicy.allowedClaims.phase37VOwnerReviewPassed === true, 'Owner-review claim missing')
assert(
  claimPolicy.allowedClaims.runtimeIntegrationPreconditionPlanningMayProceed === true,
  'Precondition planning claim missing',
)
assert(claimPolicy.allowedClaims.closureEvidenceAccepted === true, 'Closure evidence accepted claim missing')
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

assert(phase37WRegister.sourceDecision === expectedDecision, 'Phase 37W register source mismatch')
assert(phase37WRegister.phase37WMayProceed === true, 'Phase 37W may proceed missing')
assert(phase37WRegister.phase37WAllowedScope.planRuntimeIntegrationPreconditions === true, 'Phase 37W planning scope missing')
assert(phase37WRegister.phase37WAllowedScope.noHookExecution === true, 'Phase 37W hook execution scope widened')
assert(phase37WRegister.phase37WStillBlocked.runtimeIntegration === true, 'Runtime integration blocker missing')
assert(phase37WRegister.phase37WStillBlocked.realUserMediaBeta === true, 'Real-user beta blocker missing')
assert(phase37WRegister.phase37WStillBlocked.paidProduction === true, 'Paid production blocker missing')
assert(phase37WRegister.nextPrompt === nextPrompt, 'Phase 37W next prompt mismatch')

assert(phase37WPrompt.requiredSourceDecision === expectedDecision, 'Phase 37W prompt source mismatch')
assert(phase37WPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 37W prompt source head mismatch')
assert(phase37WPrompt.integrationTarget === indexPath, 'Phase 37W prompt target mismatch')
assert(phase37WPrompt.integrationSourcePath === blockedSourcePath, 'Phase 37W prompt source path mismatch')
assert(phase37WPrompt.allowedScope.planRuntimeIntegrationPreconditions === true, 'Phase 37W prompt planning scope missing')
assert(phase37WPrompt.allowedScope.noHookExecution === true, 'Phase 37W prompt no hook execution missing')
assert(phase37WPrompt.supabaseClassification.updateRequired === 'no', 'Phase 37W prompt Supabase update must be no')

const phase37VPlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan-result',
)
assert(phase37VPlan.decision === sourceDecision, 'Phase 37V source plan decision missing')
assert(phase37VPlan.closureResult.closureOwnerReviewMayProceed === true, 'Phase 37V owner review source missing')
assertFalse(phase37VPlan.closureResult.runtimeIntegrationApprovedToday, 'Phase 37V source widened runtime')

const phase37UOwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
)
assert(phase37UOwnerReview.decision === phase37UOwnerDecision, 'Phase 37U owner-review decision missing')

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Worker execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Media processing false missing')
assert(blockedSource.includes('artifactCreationApproved: false'), 'Artifact false missing')
assert(blockedSource.includes('supabaseSqlApproved: false'), 'Supabase SQL false missing')
assert(blockedSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Blocked assertion missing')
const indexSource = readText(indexPath)
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37v-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1703,
      sourceMergeCommit,
      runtimeIntegrationPreconditionPlanningMayProceed: true,
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
