import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase49_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_readiness_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase49_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts'
const sourceHead = '14bff2e6cbec8c6b7b29932672752d7af3629e24'
const sourceMergeCommit = '120c97f650f59e7e26a86037a7a398f59a2fb833'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review:diagnostics'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE50-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-READINESS-PLAN'
const tempProofFile =
  'server/workers/sound-cpu/phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan.md',
    'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
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
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-safety-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-claim-policy',
)
const prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase50-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1796, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
for (const key of [
  'controlledProofPassed',
  'temporaryProofFileRemovedBeforeStaging',
  'blockedAssertionsMatchedExpectedReasons',
  'syntheticNoMediaInputOnly',
  'expectedBlockedResultOnly',
  'serverTypecheckPassedWithTemporaryProof',
  'tscBuildPassedWithTemporaryProof',
  'phase49DiagnosticsPassed',
  'noArtifactCreated',
]) {
  assertTrue(review.reviewedEvidence[key], `review.reviewedEvidence.${key}`)
}
assert(review.reviewedEvidence.factoryInvocationCount === 3, 'Factory count mismatch')
assert(review.reviewedEvidence.blockedAssertionInvocationCount === 3, 'Assertion count mismatch')
for (const key of [
  'realMediaInput',
  'captionRenderRuntimeExecutionOverMedia',
  'workerDispatch',
  'routeToolProviderCall',
  'supabaseSql',
]) {
  assertFalse(review.reviewedEvidence[key], `review.reviewedEvidence.${key}`)
}
assertTrue(
  review.acceptedForNextPlanning.blockedStateSourceIntegrationReadinessPlanningMayProceed,
  'Next planning not accepted',
)
for (const key of [
  'realMediaExecutionToday',
  'captionRenderRuntimeExecutionToday',
  'workerExecutionToday',
  'routeExecutionToday',
  'toolExecutionToday',
  'providerModelCallToday',
  'artifactCreationToday',
  'supabaseSqlToday',
  'realUserMediaBetaToday',
  'paidProductionToday',
]) {
  assertFalse(review.acceptedForNextPlanning[key], `review.acceptedForNextPlanning.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Review next prompt mismatch')
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase49SourcePr === 1796, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase49Decision === sourceDecision, 'Acceptance source decision mismatch')
for (const key of [
  'controlledProofCommandPassed',
  'phase49DiagnosticsPassed',
  'typecheckServerPassed',
  'tscBuildPassed',
  'lintPassed',
  'buildPassed',
  'serverBuildPassed',
  'temporaryProofFileRemovedBeforeStaging',
  'blockedAssertionsMatchedExpectedReasons',
  'packageLockUnchanged',
]) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.blockedResultsCreated === 3, 'Accepted blocked result count mismatch')
assert(acceptance.acceptedEvidence.factoryInvocationCount === 3, 'Accepted factory count mismatch')
assert(acceptance.acceptedEvidence.blockedAssertionInvocationCount === 3, 'Accepted assertion count mismatch')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be 0')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assertTrue(
  acceptance.acceptedScope.futureBlockedStateSourceIntegrationReadinessPlanning,
  'Future planning acceptance missing',
)
assertTrue(acceptance.acceptedScope.controlledProofOwnerReviewPassed, 'Owner review acceptance missing')
for (const key of [
  'runtimeExecution',
  'realMediaProcessing',
  'artifactDelivery',
  'workerDispatch',
  'routeToolProviderCalls',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}
assertNoop(acceptance.supabaseClassification, 'acceptance')

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assertTrue(safety.proofBoundary.syntheticNoMediaInputOnly, 'Safety synthetic no-media missing')
assertTrue(safety.proofBoundary.expectedBlockedResultOnly, 'Safety expected blocked missing')
for (const key of [
  'temporaryProofFileCommitted',
  'mediaInputObserved',
  'mediaOutputObserved',
  'artifactOutputObserved',
  'providerOutputObserved',
  'serviceRolePayloadObserved',
  'signedUrlObserved',
  'modelWeightObserved',
]) {
  assertFalse(safety.proofBoundary[key], `safety.proofBoundary.${key}`)
}
for (const value of Object.values(safety.executionBlocks)) assertFalse(value, 'execution block value')
assertTrue(safety.reviewOutcome.proofAcceptedForFuturePlanningOnly, 'Future planning only review outcome missing')
assertTrue(safety.reviewOutcome.ownerReviewPassedWithWarnings, 'Owner review warning pass missing')
assertTrue(safety.reviewOutcome.phase50PlanningMayProceed, 'Phase 50 may proceed missing')

assert(readiness.sourceDecision === expectedDecision, 'Phase 50 readiness source mismatch')
assertTrue(readiness.phase50MayProceed, 'Phase 50 may proceed missing')
for (const value of Object.values(readiness.phase50AllowedScope)) assertTrue(value, 'Phase 50 allowed scope value')
for (const value of Object.values(readiness.phase50StillBlocked)) assertTrue(value, 'Phase 50 still-blocked value')
assert(readiness.selectedNextPrompt === nextPrompt, 'Readiness next prompt mismatch')

assert(blocker.decision === expectedDecision, 'Blocker decision mismatch')
assertTrue(blocker.ownerReviewPassedWithWarnings, 'Blocker warning pass missing')
assert(Array.isArray(blocker.blockingItems) && blocker.blockingItems.length === 0, 'Blocking items must be empty')
assert(blocker.remainingBlocked.includes('real media input'), 'Real media blocker missing')
assert(blocker.remainingBlocked.includes('paid production unlock'), 'Paid production blocker missing')
assert(blocker.selectedNextPrompt === nextPrompt, 'Blocker next prompt mismatch')

assert(claimPolicy.decision === expectedDecision, 'Claim policy decision mismatch')
for (const value of Object.values(claimPolicy.allowedClaims)) assertTrue(value, 'Allowed claim value')
for (const value of Object.values(claimPolicy.disallowedClaims)) assertFalse(value, 'Disallowed claim value')
assertNoop(claimPolicy.supabaseClassification, 'claim policy')

assert(prompt.requiredSourceDecision === expectedDecision, 'Prompt required source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Prompt source head mismatch')
for (const value of Object.values(prompt.allowedScope)) assertTrue(value, 'Prompt allowed scope value')
assert(prompt.blocked.includes('real media input'), 'Prompt real media blocker missing')
assert(prompt.blocked.includes('paid production unlock'), 'Prompt paid production blocker missing')
assertNoop(prompt.supabaseClassification, 'prompt')

assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'temporary proof file must not exist')

const sourcePacket = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-result.md',
  'worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-result',
)
assert(sourcePacket.decision === sourceDecision, 'Source packet decision mismatch')
assert(sourcePacket.sourceVerification.sourceMergeCommit === '80578bf3dbfbdd63069726e0f762069b5e5636ab', 'Source packet merge mismatch')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review-diagnostics.mjs',
  'package script mismatch',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: expectedDecision,
      sourcePr: 1796,
      sourceMergeCommit,
      phase50MayProceed: true,
      nextPrompt,
      supabaseClassification: review.supabaseClassification,
    },
    null,
    2,
  ),
)
