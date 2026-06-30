import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase59_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_plan_completed_with_warnings_ready_for_controlled_hook_execution_proof_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase58_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_factory_validation_passed_with_warnings_ready_for_controlled_hook_execution_plan_no_media_no_artifacts'
const sourceHead = 'e5317ebea5404e873f0fd8d68ddbdf2645597d7e'
const sourceMergeCommit = 'c527adfe5262d961f255a1708a05b411a986bbaa'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const runtimeIntegrationSource =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE60-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-CONTROLLED-HOOK-EXECUTION-PROOF'
const phase60Decision =
  'worker_runtime_jobs_sound_cpu_phase60_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_proof_passed_with_warnings_ready_for_controlled_hook_execution_owner_review_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan.md',
    'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-synthetic-hook-input-plan.md',
    'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-synthetic-hook-input-plan',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocked-assertion-boundary.md',
    'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocked-assertion-boundary',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-proof-readiness.md',
    'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-proof-readiness',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-register.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof',
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
const result = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan-result',
)
const inputPlan = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-synthetic-hook-input-plan',
)
const assertionBoundary = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-blocked-assertion-boundary',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-proof-readiness',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-claim-policy',
)
const phase60Register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-register',
)
const phase60Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof',
)

assert(result.owner === 'WORKER_RUNTIME_JOBS', 'result owner mismatch')
assert(result.decision === decision, 'result decision mismatch')
assert(result.sourceVerification.sourcePr === 1851, 'source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assertTrue(result.controlledHookExecutionPlan.planOnly, 'plan-only flag missing')
assert(result.controlledHookExecutionPlan.hookSource === hookSource, 'hook source mismatch')
assert(result.controlledHookExecutionPlan.runtimeIntegrationSource === runtimeIntegrationSource, 'runtime source mismatch')
assert(result.controlledHookExecutionPlan.allowedFutureProofFunction === 'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult', 'future proof function mismatch')
assertTrue(result.controlledHookExecutionPlan.syntheticInputOnly, 'synthetic input only missing')
for (const key of [
  'realMediaInputAllowed',
  'rawFramesAllowed',
  'rawOcrTextAllowed',
  'mediaFilePathsAllowed',
  'signedUrlsAsSourceOfTruthAllowed',
  'serviceRolePayloadsAllowed',
  'providerOutputBlobsAllowed',
  'artifactWriteTargetsAllowed',
  'hookExecutedToday',
  'blockedAssertionInvokedToday',
  'artifactCreatedToday',
  'workerDispatchedToday',
  'routeToolProviderCalledToday',
  'supabaseSqlToday',
  'betaUnlockedToday',
  'productionUnlockedToday',
]) {
  assertFalse(result.controlledHookExecutionPlan[key], `result.controlledHookExecutionPlan.${key}`)
}
assert(result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(inputPlan.decision === decision, 'input plan decision mismatch')
assert(inputPlan.futureProofInput.captionCandidateZones.length === 2, 'candidate zone count mismatch')
assert(inputPlan.futureProofInput.normalizedOcrRegionBoxes.length === 1, 'OCR region count mismatch')
assert(inputPlan.futureProofInput.lowerThirdCollisionFlags.length === 1, 'collision flag count mismatch')
assert(inputPlan.futureProofInput.manualReviewRequiredFlags.length === 1, 'manual review flag count mismatch')
assert(inputPlan.expectedFailClosedResultShape.blockedStatus === 'blocked_by_owner_gate', 'expected blocked status mismatch')
assert(inputPlan.expectedFailClosedResultShape.candidateZoneCount === 2, 'expected candidate count mismatch')
assert(inputPlan.expectedFailClosedResultShape.blockedCandidateZoneCount === 1, 'expected blocked zone count mismatch')
assertTrue(inputPlan.expectedFailClosedResultShape.manualCaptionLayoutReviewRequired, 'manual review expected')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
]) {
  assertFalse(inputPlan.expectedFailClosedResultShape[key], `inputPlan.expectedFailClosedResultShape.${key}`)
}
assertTrue(inputPlan.expectedFailClosedResultShape.noArtifactCreated, 'expected no artifact missing')
assertTrue(inputPlan.inputPolicy.syntheticMetadataOnly, 'synthetic policy missing')
for (const key of [
  'rawFramesAllowed',
  'rawOcrTextAllowed',
  'mediaFilePathsAllowed',
  'signedUrlsAllowed',
  'serviceRolePayloadsAllowed',
  'providerOutputBlobsAllowed',
  'artifactWriteTargetsAllowed',
]) {
  assertFalse(inputPlan.inputPolicy[key], `inputPlan.inputPolicy.${key}`)
}

assert(assertionBoundary.decision === decision, 'assertion boundary decision mismatch')
assert(assertionBoundary.blockedAssertion === 'assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked', 'blocked assertion mismatch')
assertTrue(assertionBoundary.phase59Boundary.blockedAssertionReviewed, 'blocked assertion review missing')
assertFalse(assertionBoundary.phase59Boundary.blockedAssertionInvocationAllowedToday, 'blocked assertion allowed today')
assertFalse(assertionBoundary.phase59Boundary.blockedAssertionInvocationAllowedInPhase60, 'blocked assertion allowed Phase 60')
assertTrue(assertionBoundary.phase59Boundary.blockedResultFactoryAllowedInPhase60, 'blocked result factory not allowed in Phase 60')
assertFalse(assertionBoundary.phase59Boundary.realRuntimeExecutionAllowed, 'real runtime execution allowed')

assert(readiness.decision === decision, 'readiness decision mismatch')
assertTrue(readiness.phase60Readiness.mayImportHookModule, 'Phase 60 import readiness missing')
assertTrue(readiness.phase60Readiness.mayInvokeBlockedResultFunctionWithSyntheticMetadata, 'Phase 60 synthetic function readiness missing')
assertTrue(readiness.phase60Readiness.mayInspectFailClosedResult, 'Phase 60 inspect readiness missing')
assertTrue(readiness.phase60Readiness.mustKeepRuntimeDisabledFlagsZero, 'runtime disabled flag requirement missing')
assertAllFalse(readiness.phase60Forbidden, 'readiness.phase60Forbidden')
assertTrue(readiness.readinessClaimsAfterPhase59.controlledHookExecutionProofReady, 'controlled hook proof readiness missing')
for (const key of [
  'hookExecutedToday',
  'runtimeReady',
  'workerReady',
  'mediaReady',
  'externalAgentExecutionReady',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(readiness.readinessClaimsAfterPhase59[key], `readinessClaimsAfterPhase59.${key}`)
}

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase59_controlled_hook_execution_plan_pending'),
  'Phase 59 blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase60_controlled_hook_execution_proof_pending'),
  'Phase 60 blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_agent_execution_pending'),
  'External execution blocker missing',
)

assertTrue(claims.allowedClaims.phase59ControlledHookExecutionPlanCompleted, 'Phase 59 claim missing')
assertTrue(claims.allowedClaims.phase60ControlledHookExecutionProofMayProceed, 'Phase 60 may proceed claim missing')
assertTrue(claims.allowedClaims.syntheticHookInputDefined, 'synthetic input claim missing')
assertTrue(claims.allowedClaims.blockedAssertionBoundaryReviewed, 'blocked assertion claim missing')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(phase60Register.sourceDecision === decision, 'Phase 60 register source mismatch')
assertTrue(phase60Register.phase60MayProceed, 'Phase 60 may proceed missing')
assertTrue(phase60Register.phase60AllowedScope.controlledHookExecutionProof, 'Phase 60 proof scope missing')
assertTrue(phase60Register.phase60AllowedScope.invokeHookBlockedResultFunctionWithSyntheticMetadata, 'Phase 60 synthetic invocation scope missing')
assertTrue(phase60Register.phase60AllowedScope.inspectFailClosedHookResult, 'Phase 60 inspect scope missing')
for (const key of [
  'invokeBlockedAssertion',
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(phase60Register.phase60AllowedScope[key], `phase60Register.phase60AllowedScope.${key}`)
}
assertTrue(phase60Register.phase60StillBlocked.externalAgentExecution, 'Phase 60 external execution blocker missing')
assert(phase60Register.nextPrompt === nextPrompt, 'Phase 60 next prompt mismatch')

assert(phase60Prompt.requiredSourceDecision === decision, 'Phase 60 prompt source mismatch')
assert(phase60Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 60 prompt source head mismatch')
assert(phase60Prompt.hookSource === hookSource, 'Phase 60 prompt hook source mismatch')
assertTrue(phase60Prompt.allowedScope.controlledHookExecutionProof, 'Phase 60 prompt proof scope missing')
assertTrue(phase60Prompt.allowedScope.invokeHookBlockedResultFunctionWithSyntheticMetadata, 'Phase 60 prompt synthetic invocation missing')
assertTrue(phase60Prompt.allowedScope.inspectFailClosedHookResult, 'Phase 60 prompt inspect scope missing')
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
  assertFalse(phase60Prompt.allowedScope[key], `phase60Prompt.allowedScope.${key}`)
}
assert(phase60Prompt.expectedDecision === phase60Decision, 'Phase 60 expected decision mismatch')
assertNoop(phase60Prompt.supabaseClassification, 'phase60Prompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-plan-diagnostics.mjs',
  'Package script missing',
)

const hookText = readText(hookSource)
for (const snippet of [
  'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult',
  'assertSoundCpuRuntimeDisabledFlags',
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'renderExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'noArtifactCreated: true',
  'rawFrames',
  'mediaFilePathsForExecution',
  'signedUrlsAsSourceOfTruth',
  'serviceRolePayloads',
  'providerOutputBlobs',
  'artifactWriteTargets',
]) {
  assert(hookText.includes(snippet), `Hook source missing expected fail-closed/planning snippet: ${snippet}`)
}
assert(!/audio_open|ffmpeg|ffprobe|pydub|writeArtifact|createSignedUrl|createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|service[_-]role/i.test(hookText), 'Hook source contains prohibited runtime/media/Supabase marker')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1851,
      sourceHead,
      sourceMergeCommit,
      phase60ControlledHookExecutionProofMayProceed: true,
      hookExecutedToday: false,
      blockedAssertionInvokedToday: false,
      realMediaAllowed: false,
      artifactCreated: false,
      workerDispatched: false,
      supabaseSql: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
