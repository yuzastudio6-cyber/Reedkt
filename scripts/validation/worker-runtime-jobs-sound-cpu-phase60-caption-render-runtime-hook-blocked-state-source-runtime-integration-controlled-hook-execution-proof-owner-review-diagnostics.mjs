import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase60_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_owner_review_passed_with_warnings_ready_for_media_artifact_boundary_plan_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase60_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_proof_passed_with_warnings_ready_for_controlled_hook_execution_owner_review_no_media_no_artifacts'
const sourceHead = '52a6df94d8cf30343f8c1eacb8494b8dd2afc114'
const sourceMergeCommit = '508724d1fce7940a3a090418bcc1e57c6b28fb37'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE61-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-MEDIA-ARTIFACT-BOUNDARY-PLAN'
const phase61Decision =
  'worker_runtime_jobs_sound_cpu_phase61_caption_render_runtime_hook_blocked_state_source_runtime_integration_media_artifact_boundary_plan_completed_with_warnings_ready_for_media_artifact_boundary_owner_review_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-register.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan',
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

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

function assertTrue(value, label) {
  assert(value === true, `${label} must be true`)
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update must be no`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment must be no`)
  assert(value?.sqlExecuted === 'no', `${label} SQL executed must be no`)
  assert(value?.migrationDeployed === 'no', `${label} migration deployed must be no`)
  assert(value?.nextAction === 'none', `${label} Supabase next action must be none`)
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record ?? {})) {
    assertFalse(value, `${label}.${key}`)
  }
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const review = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-controlled-proof-owner-claim-policy',
)
const phase61Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-register',
)
const phase61Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1857, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(review.reviewedControlledHookProof.controlledHookProofAccepted, 'Controlled hook proof acceptance missing')
assertTrue(review.reviewedControlledHookProof.syntheticMetadataOnlyAccepted, 'Synthetic metadata acceptance missing')
assertTrue(review.reviewedControlledHookProof.hookBlockedResultFunctionAccepted, 'Hook function acceptance missing')
assert(review.reviewedControlledHookProof.hookBlockedResultFunction === 'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult', 'Hook function mismatch')
assert(review.reviewedControlledHookProof.hookSource === hookSource, 'Hook source mismatch')
assert(review.reviewedControlledHookProof.blockedStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
assert(review.reviewedControlledHookProof.candidateZoneCount === 2, 'Candidate zone count mismatch')
assert(review.reviewedControlledHookProof.ocrRegionCount === 1, 'OCR region count mismatch')
assert(review.reviewedControlledHookProof.blockedCandidateZoneCount === 1, 'Blocked candidate count mismatch')
assert(review.reviewedControlledHookProof.saferCandidateZoneCount === 1, 'Safer candidate count mismatch')
assertTrue(review.reviewedControlledHookProof.manualCaptionLayoutReviewRequired, 'Manual review flag missing')
assertTrue(review.reviewedControlledHookProof.mediaArtifactBoundaryPlanMayProceed, 'Boundary planning may proceed missing')
for (const key of [
  'invokeBlockedAssertionToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(review.reviewedControlledHookProof[key], `review.reviewedControlledHookProof.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase60Pr === 1857, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase60Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase60MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase60Decision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.hookSource === hookSource, 'Acceptance hook source mismatch')
assert(acceptance.acceptedEvidence.hookBlockedResultFunction === 'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult', 'Acceptance hook function mismatch')
assertTrue(acceptance.acceptedEvidence.syntheticMetadataOnly, 'Acceptance synthetic metadata missing')
assert(acceptance.acceptedEvidence.blockedStatus === 'blocked_by_owner_gate', 'Acceptance blocked status mismatch')
assertTrue(acceptance.acceptedEvidence.runtimeDisabledFlagsPreserved, 'Runtime disabled preservation missing')
assertTrue(acceptance.acceptedEvidence.noArtifactCreatedPreserved, 'No artifact preservation missing')
assertTrue(acceptance.acceptedEvidence.packageLockUnchanged, 'Package-lock acceptance missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assertTrue(acceptance.acceptedScope.mediaArtifactBoundaryPlanning, 'Boundary planning scope missing')
assertTrue(acceptance.acceptedScope.futureOwnerReviewOfBoundaryPlan, 'Future owner review scope missing')
for (const key of [
  'realMediaProcessing',
  'artifactCreation',
  'workerDispatch',
  'routeToolProviderExecution',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedScope[key], `acceptance.acceptedScope.${key}`)
}

assert(safety.decision === expectedDecision, 'Safety decision mismatch')
assert(safety.reviewSafety.allowedNextStep === 'media artifact boundary planning', 'Allowed next step mismatch')
assertTrue(safety.reviewSafety.hookProofMustRemainSyntheticOnly, 'Synthetic-only safety missing')
assertTrue(safety.reviewSafety.boundaryPlanMayDescribeAllowedAndRejectedInputs, 'Boundary description safety missing')
for (const key of [
  'runtimeExecutionAllowedToday',
  'blockedAssertionAllowedToday',
  'realMediaInputAllowedToday',
  'captionRenderExecutionAllowedToday',
  'artifactWriteAllowedToday',
  'workerDispatchAllowedToday',
  'routeToolProviderAllowedToday',
  'supabaseSqlAllowedToday',
  'betaUnlockAllowedToday',
  'productionUnlockAllowedToday',
]) {
  assertFalse(safety.reviewSafety[key], `safety.reviewSafety.${key}`)
}
assertAllFalse(safety.mustRemainFalse, 'safety.mustRemainFalse')

assert(
  blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase60_controlled_hook_execution_owner_review_pending',
  ),
  'Phase 60 owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase61_media_artifact_boundary_plan_pending'),
  'Phase 61 boundary planning blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_agent_execution_pending'),
  'External execution blocker missing',
)

assertTrue(claimPolicy.allowedClaims.phase60OwnerReviewPassed, 'Owner-review claim missing')
assertTrue(claimPolicy.allowedClaims.controlledHookBlockedResultProofAccepted, 'Controlled proof claim missing')
assertTrue(claimPolicy.allowedClaims.syntheticMetadataOnlyProofAccepted, 'Synthetic proof claim missing')
assertTrue(claimPolicy.allowedClaims.mediaArtifactBoundaryPlanMayProceed, 'Boundary may proceed claim missing')
assertAllFalse(claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertAllFalse(claimPolicy.executionClaims, 'claimPolicy.executionClaims')

assert(phase61Register.sourceDecision === expectedDecision, 'Phase 61 register source decision mismatch')
assertTrue(phase61Register.phase61MayProceed, 'Phase 61 may proceed missing')
assertTrue(phase61Register.phase61AllowedScope.planAcceptedSyntheticInputs, 'Phase 61 accepted synthetic planning missing')
assertTrue(phase61Register.phase61AllowedScope.planRejectedRealMediaInputs, 'Phase 61 rejected input planning missing')
assertTrue(phase61Register.phase61AllowedScope.planArtifactBoundary, 'Phase 61 artifact boundary planning missing')
assertTrue(phase61Register.phase61AllowedScope.planFutureProofRequirements, 'Phase 61 future proof planning missing')
for (const key of [
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase61Register.phase61AllowedScope[key], `phase61Register.phase61AllowedScope.${key}`)
}
assertTrue(phase61Register.phase61StillBlocked.externalAgentExecution, 'Phase 61 external execution blocker missing')
assert(phase61Register.nextPrompt === nextPrompt, 'Phase 61 register next prompt mismatch')

assert(phase61Prompt.requiredSourceDecision === expectedDecision, 'Phase 61 prompt source decision mismatch')
assert(phase61Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 61 prompt source head mismatch')
assert(phase61Prompt.hookSource === hookSource, 'Phase 61 prompt hook source mismatch')
assertTrue(phase61Prompt.planningScope.planAcceptedSyntheticInputs, 'Phase 61 prompt synthetic planning missing')
assertTrue(phase61Prompt.planningScope.planRejectedRealMediaInputs, 'Phase 61 prompt rejected planning missing')
assertTrue(phase61Prompt.planningScope.planArtifactBoundary, 'Phase 61 prompt artifact planning missing')
for (const key of [
  'invokeHookToday',
  'invokeBlockedAssertionToday',
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(phase61Prompt.planningScope[key], `phase61Prompt.planningScope.${key}`)
}
assert(phase61Prompt.expectedDecision === phase61Decision, 'Phase 61 expected decision mismatch')
assertNoop(phase61Prompt.supabaseClassification, 'phase61Prompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-owner-review-diagnostics.mjs',
  'Package script missing',
)

const hookText = readText(hookSource)
for (const snippet of [
  'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult',
  'blocked_by_owner_gate',
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'renderExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'noArtifactCreated: true',
  'rawFrames',
  'artifactWriteTargets',
]) {
  assert(hookText.includes(snippet), `Hook source missing expected fail-closed snippet: ${snippet}`)
}
assert(
  !/audio_open|ffmpeg|ffprobe|pydub|writeArtifact|createSignedUrl|createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|service[_-]role/i.test(
    hookText,
  ),
  'Hook source contains prohibited runtime/media/Supabase marker',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1857,
      sourceHead,
      sourceMergeCommit,
      controlledHookProofAccepted: true,
      syntheticMetadataOnlyAccepted: true,
      mediaArtifactBoundaryPlanMayProceed: true,
      realMediaUsed: false,
      artifactCreated: false,
      workerDispatched: false,
      routeToolProviderCalled: false,
      supabaseSql: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
