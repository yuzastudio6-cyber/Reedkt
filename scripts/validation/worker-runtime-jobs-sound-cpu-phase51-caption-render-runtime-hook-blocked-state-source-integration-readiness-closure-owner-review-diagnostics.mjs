import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase51_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_owner_review_passed_with_warnings_ready_for_runtime_integration_precondition_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase51_caption_render_runtime_hook_blocked_state_source_integration_readiness_closure_plan_completed_with_warnings_ready_for_closure_owner_review_no_media_no_artifacts'
const phase50OwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase50_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_owner_review_passed_with_warnings_ready_for_source_integration_readiness_closure_plan_no_media_no_artifacts'
const sourceHead = '1dcc69df96f59ff65b5a06d283f5d4e84f588895'
const sourceMergeCommit = '5be5533395267eae4ef377bc6608c06ea0e4a35c'
const blockedSourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE52-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-PRECONDITION-PLAN'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-register.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan.md',
    'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan',
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
  try {
    return JSON.parse(match[1])
  } catch (error) {
    throw new Error(`Invalid JSON in ${relativePath}: ${error.message}`)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-claim-policy',
)
const phase52Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-register',
)
const phase52Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase52-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1809, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'phase51ClosurePlanAccepted',
  'sourceRegisterAccepted',
  'boundaryChecklistAccepted',
  'safetyRegisterAccepted',
  'blockerRegisterAccepted',
  'claimPolicyAccepted',
  'phase50OwnerReviewConsumed',
  'blockedStateSourceStillFailClosed',
  'temporaryProofFileAbsent',
  'runtimeIntegrationPreconditionPlanningMayProceed',
]) {
  assertTrue(review.reviewedClosure[key], `review.reviewedClosure.${key}`)
}
for (const key of [
  'sourceIntegrationApprovedToday',
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
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase51Decision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase51Pr === 1809, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase51MergeCommit === sourceMergeCommit, 'Acceptance merge mismatch')
assertTrue(acceptance.acceptedEvidence.phase50OwnerReviewConsumed, 'Phase 50 owner-review acceptance missing')
assertTrue(acceptance.acceptedEvidence.staticBoundaryChecklistAccepted, 'Boundary checklist acceptance missing')
assertTrue(acceptance.acceptedEvidence.temporaryProofFileAbsent, 'Temporary proof absence acceptance missing')
assertTrue(acceptance.acceptedEvidence.packageLockUnchanged, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assertTrue(acceptance.acceptedScope.runtimeIntegrationPreconditionPlanning, 'Precondition planning acceptance missing')
for (const key of [
  'sourceIntegrationExecution',
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
assertTrue(safety.reviewSafety.blockedStateSourceMustRemainFailClosed, 'Fail-closed requirement missing')
assertTrue(safety.reviewSafety.temporaryProofFileMustRemainAbsent, 'Temp absence requirement missing')
assertTrue(
  safety.reviewSafety.runtimeIntegrationMustRemainUnapprovedUntilLaterGate,
  'Runtime unapproved requirement missing',
)
for (const key of [
  'sourceIntegrationAllowedToday',
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
  'sourceIntegrationReadinessUnlock',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(safety.mustRemainFalse[key], `safety.mustRemainFalse.${key}`)
}

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase51_source_integration_readiness_closure_owner_review_pending',
  ),
  'Phase 51 owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase52_runtime_integration_precondition_plan_pending'),
  'Phase 52 precondition blocker missing',
)
assertFalse(blockers.betaProductionStatus.realUserMediaBetaAllowed, 'blockers.realUserMediaBetaAllowed')
assertFalse(blockers.betaProductionStatus.paidProductionAllowed, 'blockers.paidProductionAllowed')

assertTrue(claimPolicy.allowedClaims.phase51OwnerReviewPassed, 'Owner-review claim missing')
assertTrue(
  claimPolicy.allowedClaims.runtimeIntegrationPreconditionPlanningMayProceed,
  'Precondition planning claim missing',
)
assertTrue(claimPolicy.allowedClaims.closureEvidenceAccepted, 'Closure evidence accepted claim missing')
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'artifactReadiness',
  'sourceIntegrationReadinessUnlock',
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

assert(phase52Register.sourceDecision === expectedDecision, 'Phase 52 register source mismatch')
assertTrue(phase52Register.phase52MayProceed, 'Phase 52 may proceed missing')
assertTrue(
  phase52Register.phase52AllowedScope.planRuntimeIntegrationPreconditions,
  'Phase 52 planning scope missing',
)
assertTrue(phase52Register.phase52AllowedScope.noHookExecution, 'Phase 52 hook execution scope widened')
assertTrue(phase52Register.phase52StillBlocked.runtimeIntegration, 'Runtime integration blocker missing')
assertTrue(phase52Register.phase52StillBlocked.realUserMediaBeta, 'Real-user beta blocker missing')
assertTrue(phase52Register.phase52StillBlocked.paidProduction, 'Paid production blocker missing')
assert(phase52Register.nextPrompt === nextPrompt, 'Phase 52 next prompt mismatch')

assert(phase52Prompt.requiredSourceDecision === expectedDecision, 'Phase 52 prompt source mismatch')
assert(phase52Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 52 prompt source head mismatch')
assert(phase52Prompt.integrationTarget === indexPath, 'Phase 52 prompt target mismatch')
assert(phase52Prompt.integrationSourcePath === blockedSourcePath, 'Phase 52 prompt source path mismatch')
assertTrue(phase52Prompt.allowedScope.planRuntimeIntegrationPreconditions, 'Phase 52 prompt planning scope missing')
assertTrue(phase52Prompt.allowedScope.noHookExecution, 'Phase 52 prompt no hook execution missing')
assertNoop(phase52Prompt.supabaseClassification, 'phase52 prompt')

const phase51Plan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan.md',
  'worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-plan-result',
)
assert(phase51Plan.decision === sourceDecision, 'Phase 51 source plan decision missing')
assertTrue(phase51Plan.closureResult.closureOwnerReviewMayProceed, 'Phase 51 owner review source missing')
assertFalse(phase51Plan.closureResult.runtimeIntegrationApprovedToday, 'Phase 51 source widened runtime')

const phase50OwnerReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review',
)
assert(phase50OwnerReview.decision === phase50OwnerDecision, 'Phase 50 owner-review decision missing')

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent')
const blockedSource = readText(blockedSourcePath)
assert(blockedSource.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
assert(blockedSource.includes('runtimeExecutionApproved: false'), 'Runtime execution false missing')
assert(blockedSource.includes('workerExecutionApproved: false'), 'Worker execution false missing')
assert(blockedSource.includes('mediaProcessingApproved: false'), 'Media processing false missing')
assert(blockedSource.includes('artifactCreationApproved: false'), 'Artifact false missing')
assert(blockedSource.includes('supabaseSqlApproved: false'), 'Supabase SQL false missing')
assert(
  blockedSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'),
  'Blocked assertion missing',
)
const indexSource = readText(indexPath)
assert(indexSource.includes('createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult'), 'Index factory export missing')
assert(indexSource.includes('assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked'), 'Index assertion export missing')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase51-caption-render-runtime-hook-blocked-state-source-integration-readiness-closure-owner-review-diagnostics.mjs',
  'Missing package diagnostics script',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1809,
      sourceHead,
      sourceMergeCommit,
      runtimeIntegrationPreconditionPlanningMayProceed: true,
      sourceIntegrationApprovedToday: false,
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
