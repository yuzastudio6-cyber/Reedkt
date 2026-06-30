import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase61_caption_render_runtime_hook_blocked_state_source_runtime_integration_media_artifact_boundary_owner_review_passed_with_warnings_ready_for_controlled_boundary_validation_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase61_caption_render_runtime_hook_blocked_state_source_runtime_integration_media_artifact_boundary_plan_completed_with_warnings_ready_for_media_artifact_boundary_owner_review_no_media_no_artifacts'
const sourceHead = '4edfb55dca152b28c8cc398fe4d81619f89f8d91'
const sourceMergeCommit = '7432d0b1e675cce04f86edffb69bec7ea8ce4953'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE62-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-CONTROLLED-BOUNDARY-VALIDATION'
const phase62Decision =
  'worker_runtime_jobs_sound_cpu_phase62_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_boundary_validation_passed_with_warnings_ready_for_controlled_boundary_validation_owner_review_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation-register.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation.md',
    'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation',
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
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-media-artifact-boundary-owner-claim-policy',
)
const phase62Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation-register',
)
const phase62Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase62-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-boundary-validation',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1863, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(review.reviewedBoundaryPlan.acceptedSyntheticInputsAccepted, 'Synthetic input acceptance missing')
assertTrue(review.reviewedBoundaryPlan.rejectedRealMediaInputsAccepted, 'Rejected media acceptance missing')
assertTrue(review.reviewedBoundaryPlan.closedArtifactBoundaryAccepted, 'Closed artifact boundary acceptance missing')
assertTrue(review.reviewedBoundaryPlan.futureControlledBoundaryValidationAccepted, 'Future validation acceptance missing')
assert(review.reviewedBoundaryPlan.hookSource === hookSource, 'Hook source mismatch')
assertTrue(review.reviewedBoundaryPlan.controlledBoundaryValidationMayProceed, 'Controlled boundary validation may proceed missing')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(review.reviewedBoundaryPlan[key], `review.reviewedBoundaryPlan.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase61Pr === 1863, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase61Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase61MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase61Decision === sourceDecision, 'Acceptance source decision mismatch')
assertTrue(acceptance.acceptedEvidence.acceptedSyntheticInputsPlanned, 'Accepted synthetic evidence missing')
assertTrue(acceptance.acceptedEvidence.rejectedRealMediaInputsPlanned, 'Rejected media evidence missing')
assertTrue(acceptance.acceptedEvidence.artifactBoundaryClosed, 'Artifact boundary evidence missing')
assertTrue(acceptance.acceptedEvidence.futureControlledBoundaryValidationPlanned, 'Future validation evidence missing')
assertTrue(acceptance.acceptedEvidence.packageLockUnchanged, 'Package-lock evidence missing')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assertTrue(acceptance.acceptedScope.controlledBoundaryValidationPlanning, 'Controlled boundary planning scope missing')
assertTrue(acceptance.acceptedScope.futureSyntheticBoundaryValidation, 'Future synthetic validation scope missing')
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
assert(safety.reviewSafety.allowedNextStep === 'controlled boundary validation', 'Safety next step mismatch')
assertTrue(safety.reviewSafety.boundaryValidationMustRemainSyntheticOnly, 'Synthetic-only safety missing')
assertTrue(safety.reviewSafety.boundaryValidationMustCreateNoArtifacts, 'No-artifact safety missing')
for (const key of [
  'runtimeExecutionAllowedToday',
  'realMediaInputAllowedToday',
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
    (row) => row.blockerId === 'phase61_media_artifact_boundary_owner_review_pending',
  ),
  'Owner review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase62_controlled_boundary_validation_pending'),
  'Phase 62 blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_agent_execution_pending'),
  'External execution blocker missing',
)

assertTrue(claims.allowedClaims.phase61OwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.boundaryPlanAcceptedForSyntheticValidation, 'Boundary acceptance claim missing')
assertTrue(claims.allowedClaims.controlledBoundaryValidationMayProceed, 'Controlled validation claim missing')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(phase62Register.sourceDecision === expectedDecision, 'Phase 62 source decision mismatch')
assertTrue(phase62Register.phase62MayProceed, 'Phase 62 may proceed missing')
assertTrue(phase62Register.phase62AllowedScope.validateAcceptedSyntheticInputs, 'Phase 62 synthetic validation scope missing')
assertTrue(phase62Register.phase62AllowedScope.validateRejectedRealMediaInputs, 'Phase 62 rejected input scope missing')
assertTrue(phase62Register.phase62AllowedScope.validateArtifactBoundaryClosed, 'Phase 62 artifact boundary scope missing')
assertTrue(phase62Register.phase62AllowedScope.validateNoWorkerDispatch, 'Phase 62 no worker scope missing')
assertTrue(phase62Register.phase62AllowedScope.validateNoSupabaseSql, 'Phase 62 no Supabase scope missing')
for (const key of [
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase62Register.phase62AllowedScope[key], `phase62Register.phase62AllowedScope.${key}`)
}
assertTrue(phase62Register.phase62StillBlocked.externalAgentExecution, 'Phase 62 external execution blocker missing')
assert(phase62Register.nextPrompt === nextPrompt, 'Phase 62 next prompt mismatch')

assert(phase62Prompt.requiredSourceDecision === expectedDecision, 'Phase 62 prompt source decision mismatch')
assert(phase62Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 62 source head mismatch')
assert(phase62Prompt.hookSource === hookSource, 'Phase 62 hook source mismatch')
assertTrue(phase62Prompt.validationScope.validateAcceptedSyntheticInputs, 'Phase 62 prompt synthetic scope missing')
assertTrue(phase62Prompt.validationScope.validateRejectedRealMediaInputs, 'Phase 62 prompt rejected scope missing')
assertTrue(phase62Prompt.validationScope.validateArtifactBoundaryClosed, 'Phase 62 prompt artifact scope missing')
assertTrue(phase62Prompt.validationScope.validateNoWorkerDispatch, 'Phase 62 prompt no worker scope missing')
assertTrue(phase62Prompt.validationScope.validateNoSupabaseSql, 'Phase 62 prompt no Supabase scope missing')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(phase62Prompt.validationScope[key], `phase62Prompt.validationScope.${key}`)
}
assert(phase62Prompt.expectedDecision === phase62Decision, 'Phase 62 expected decision mismatch')
assertNoop(phase62Prompt.supabaseClassification, 'phase62Prompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase61-caption-render-runtime-hook-blocked-state-source-runtime-integration-media-artifact-boundary-plan-owner-review-diagnostics.mjs',
  'Package script missing',
)

const hookText = readText(hookSource)
for (const snippet of [
  'rawFrames',
  'rawOcrTextFromControlledMedia',
  'mediaFilePathsForExecution',
  'signedUrlsAsSourceOfTruth',
  'serviceRolePayloads',
  'providerOutputBlobs',
  'artifactWriteTargets',
  'artifactCreationApproved: false',
  'noArtifactCreated: true',
]) {
  assert(hookText.includes(snippet), `Hook source missing expected boundary snippet: ${snippet}`)
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
      sourcePr: 1863,
      sourceHead,
      sourceMergeCommit,
      boundaryPlanAcceptedForSyntheticValidation: true,
      controlledBoundaryValidationMayProceed: true,
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
