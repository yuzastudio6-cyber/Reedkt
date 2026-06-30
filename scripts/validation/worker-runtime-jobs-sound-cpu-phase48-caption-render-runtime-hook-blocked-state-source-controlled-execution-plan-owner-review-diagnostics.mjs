import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase48_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_execution_proof_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase48_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_completed_with_warnings_ready_for_controlled_execution_plan_owner_review_no_media_no_artifacts'
const phase47OwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase47_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_owner_review_passed_with_warnings_ready_for_controlled_execution_plan_no_media_no_artifacts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE49-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-EXECUTION-PROOF'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review:diagnostics'

const sourcePr = 1792
const sourceHead = '1cc41aa103ccab0144cd08bd481c692a2e406078'
const sourceMergeCommit = '72d6faf228cb8305896ade0b77ac6713c854f6c4'
const phase47OwnerPr = 1789
const phase47OwnerMergeCommit = 'c43f29453d82b7ecd0d105d0f2864e36aee0f2d1'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-plan-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof',
  ],
]

function readText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(fullPath)) throw new Error(`Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
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

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review')
const acceptance = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-acceptance-register')
const phase49Plan = parsed.get('worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-plan-register')
const safety = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-safety-register')
const blocker = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-blocker-register')
const claimPolicy = parsed.get('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-claim-policy')
const prompt = parsed.get('worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof')

assert(review.decision === decision, 'review decision mismatch')
assert(review.sourceVerification.sourcePr === sourcePr, 'source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(review.sourceVerification.phase47OwnerReviewPr === phase47OwnerPr, 'Phase 47 owner PR mismatch')
assert(review.sourceVerification.phase47OwnerReviewMergeCommit === phase47OwnerMergeCommit, 'Phase 47 owner merge mismatch')
for (const key of [
  'phase48ControlledExecutionPlanAccepted',
  'controlledExecutionProofMayProceed',
  'syntheticNoMediaNoArtifactInputAccepted',
  'blockedResultExpectationAccepted',
  'temporaryProofFileRemovalPolicyAccepted',
  'ownerReviewRequiredBeforeProofRun',
  'realMediaAndArtifactGatesRemainClosed',
]) {
  assertTrue(review.reviewDecision[key], `review.reviewDecision.${key}`)
}
for (const key of [
  'factoryInvocationApprovedToday',
  'blockedAssertionInvocationApprovedToday',
  'runtimeHookExecutionApprovedToday',
  'realMediaInputApprovedToday',
  'artifactCreationApprovedToday',
  'workerDispatchApprovedToday',
  'routeToolProviderApprovedToday',
  'supabaseSqlApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
]) {
  assertFalse(review.reviewDecision[key], `review.reviewDecision.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'selected next prompt mismatch')
assertSupabaseNoop(review.supabaseClassification, 'review')

assert(acceptance.acceptedEvidence.phase48SourcePr === sourcePr, 'acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase48Decision === sourceDecision, 'acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase47OwnerReviewDecision === phase47OwnerDecision, 'acceptance Phase 47 decision mismatch')
for (const key of [
  'controlledExecutionPlanExists',
  'syntheticNoMediaNoArtifactInputPlanned',
  'blockedResultExpectationPlanned',
  'temporaryProofFileRemovalPolicyPlanned',
  'phase49OwnerGateRequired',
  'realMediaGateClosed',
  'artifactGateClosed',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'duplicate risk count mismatch')
assertTrue(acceptance.acceptedScope.futureControlledExecutionProofPlanning, 'future proof planning scope')
assertTrue(acceptance.acceptedScope.phase48OwnerReviewPassed, 'owner review scope')
for (const key of [
  'factoryInvocationToday',
  'blockedAssertionInvocationToday',
  'runtimeExecutionToday',
  'realMediaProcessingToday',
  'artifactDeliveryToday',
  'workerDispatchToday',
  'routeToolProviderCallsToday',
  'supabaseSqlToday',
  'realUserMediaBetaToday',
  'paidProductionToday',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(phase49Plan.sourceDecision === decision, 'phase49 source decision mismatch')
assertTrue(phase49Plan.phase49MayProceed, 'Phase 49 may proceed missing')
for (const key of [
  'temporaryProofFileMayBeCreated',
  'factoryInvocationMayBeAttemptedAgainstSyntheticNoMediaInput',
  'blockedAssertionInvocationMayBeAttemptedAgainstSyntheticNoMediaInput',
  'expectedOutcomeMustRemainBlocked',
  'temporaryProofFileMustBeRemovedBeforeStaging',
]) {
  assertTrue(phase49Plan.futureProofAllowedOnlyInPhase49[key], `phase49Plan.futureProofAllowedOnlyInPhase49.${key}`)
}
for (const key of [
  'realMediaInputAllowed',
  'artifactOutputAllowed',
  'workerDispatchAllowed',
  'routeToolProviderCallsAllowed',
  'supabaseSqlAllowed',
  'betaProductionUnlockAllowed',
]) {
  assertFalse(phase49Plan.futureProofAllowedOnlyInPhase49[key], `phase49Plan.futureProofAllowedOnlyInPhase49.${key}`)
}
assertTrue(phase49Plan.stillRequiresPhase49Implementation, 'Phase 49 implementation flag missing')

assert(safety.sourceDecision === decision, 'safety source decision mismatch')
assert(safety.approvedNextStep === 'controlled execution proof with synthetic no-media input', 'safety next step mismatch')
for (const key of Object.keys(safety.futureProofSafetyRequirements)) {
  assertTrue(safety.futureProofSafetyRequirements[key], `safety.futureProofSafetyRequirements.${key}`)
}
for (const key of Object.keys(safety.prohibitedToday)) {
  assertTrue(safety.prohibitedToday[key], `safety.prohibitedToday.${key}`)
}

assert(blocker.decision === decision, 'blocker decision mismatch')
assert(Array.isArray(blocker.blockingItems) && blocker.blockingItems.length === 0, 'blocker register must be empty')
assert(blocker.selectedNextPrompt === nextPrompt, 'blocker next prompt mismatch')

assert(claimPolicy.decision === decision, 'claim policy decision mismatch')
for (const key of Object.keys(claimPolicy.allowedClaims)) assertTrue(claimPolicy.allowedClaims[key], `claimPolicy.allowedClaims.${key}`)
for (const key of Object.keys(claimPolicy.disallowedClaims)) assertFalse(claimPolicy.disallowedClaims[key], `claimPolicy.disallowedClaims.${key}`)
assertSupabaseNoop(claimPolicy.supabaseClassification, 'claim policy')

assert(prompt.requiredSourceDecision === decision, 'prompt required source mismatch')
assert(prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'prompt source head mismatch')
assertTrue(prompt.allowedProofSurface.syntheticNoMediaInputOnly, 'prompt synthetic input only')
assertTrue(prompt.allowedProofSurface.expectedBlockedResultOnly, 'prompt blocked result only')
assertTrue(prompt.allowedProofSurface.temporaryProofFileMustBeRemovedBeforeStaging, 'prompt temp removal')
assertTrue(prompt.allowedProofSurface.factoryInvocationAllowedOnlyInsideTemporaryProof, 'prompt factory boundary')
assertTrue(prompt.allowedProofSurface.blockedAssertionInvocationAllowedOnlyInsideTemporaryProof, 'prompt assertion boundary')
assertSupabaseNoop(prompt.supabaseClassification, 'prompt')

const sourcePlan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan.md',
  'worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan',
)
assert(sourcePlan.decision === sourceDecision, 'source plan decision mismatch')
assert(sourcePlan.sourceVerification.sourcePr === phase47OwnerPr, 'source plan source PR mismatch')
assert(sourcePlan.sourceVerification.sourceMergeCommit === phase47OwnerMergeCommit, 'source plan merge mismatch')
assertTrue(sourcePlan.plan.planningOnly, 'source plan must be planning-only')

const packageJson = JSON.parse(readText('package.json'))
assert(packageJson.scripts?.[packageScript]?.includes('worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review-diagnostics.mjs'), 'package script missing or incorrect')

for (const forbiddenPath of [
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts',
  'node_modules',
  'dist',
  'dist-server',
]) {
  assert(!fs.existsSync(path.join(repoRoot, forbiddenPath)), `${forbiddenPath} must not exist`)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr,
      sourceMergeCommit,
      controlledExecutionProofMayProceed: true,
      factoryInvocationApprovedToday: false,
      blockedAssertionInvocationApprovedToday: false,
      runtimeExecutionApprovedToday: false,
      realMediaInputApprovedToday: false,
      artifactCreationApprovedToday: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
