import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase60_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_proof_passed_with_warnings_ready_for_controlled_hook_execution_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase59_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_plan_completed_with_warnings_ready_for_controlled_hook_execution_proof_no_media_no_artifacts'
const sourceHead = 'e14fff60fa42fc179de7abac06aac8027526cde4'
const sourceMergeCommit = 'ea8e4631214253e0a34506df4c90c300472c18b4'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE60-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-CONTROLLED-HOOK-EXECUTION-PROOF-OWNER-REVIEW'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase60_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_owner_review_passed_with_warnings_ready_for_media_artifact_boundary_plan_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-result.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-result-register.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-result-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-validation-report.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-validation-report',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-owner-review-register.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-owner-review-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-owner-review',
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
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-result',
)
const register = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-result-register',
)
const report = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-validation-report',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-claim-policy',
)
const ownerReviewRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-owner-review-register',
)
const ownerReviewPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-owner-review',
)

assert(result.owner === 'WORKER_RUNTIME_JOBS', 'result owner mismatch')
assert(result.decision === decision, 'result decision mismatch')
assert(result.sourceVerification.sourcePr === 1853, 'source PR mismatch')
assert(result.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'source merge mismatch')
assert(result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assertTrue(result.controlledHookExecutionProof.hookBlockedResultInvocationPassed, 'hook proof missing')
assert(result.controlledHookExecutionProof.modulePath === hookSource, 'module path mismatch')
assert(result.controlledHookExecutionProof.function === 'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult', 'function mismatch')
assertTrue(result.controlledHookExecutionProof.syntheticMetadataOnly, 'synthetic metadata only missing')
assert(result.controlledHookExecutionProof.blockedStatus === 'blocked_by_owner_gate', 'blocked status mismatch')
assert(result.controlledHookExecutionProof.hookName === 'ocrCaptionRenderSafeZonePlanningHook', 'hook name mismatch')
assert(result.controlledHookExecutionProof.sourceStatus === 'source_created_execution_blocked', 'source status mismatch')
assert(result.controlledHookExecutionProof.ownerGateRequired === 'WORKER_RUNTIME_JOBS', 'owner gate mismatch')
assert(result.controlledHookExecutionProof.candidateZoneCount === 2, 'candidate count mismatch')
assert(result.controlledHookExecutionProof.ocrRegionCount === 1, 'OCR region count mismatch')
assert(result.controlledHookExecutionProof.blockedCandidateZoneCount === 1, 'blocked candidate count mismatch')
assert(result.controlledHookExecutionProof.saferCandidateZoneCount === 1, 'safer candidate count mismatch')
assertTrue(result.controlledHookExecutionProof.manualCaptionLayoutReviewRequired, 'manual review flag missing')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
  'blockedAssertionInvoked',
  'realMediaUsed',
  'artifactCreated',
  'workerDispatched',
  'routeToolProviderCalled',
  'supabaseSql',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assertFalse(result.controlledHookExecutionProof[key], `result.controlledHookExecutionProof.${key}`)
}
assertTrue(result.controlledHookExecutionProof.noArtifactCreated, 'no artifact flag missing')
assert(result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoop(result.supabaseClassification, 'result')

assert(register.decision === decision, 'register decision mismatch')
assert(register.syntheticInputUsed.captionCandidateZoneCount === 2, 'register candidate count mismatch')
assert(register.syntheticInputUsed.rawMediaInputs === 0, 'raw media inputs must be zero')
assert(register.syntheticInputUsed.artifactTargets === 0, 'artifact targets must be zero')
assert(register.observedResult.blockedStatus === 'blocked_by_owner_gate', 'register blocked status mismatch')
assert(register.observedResult.blockedCandidateZoneCount === 1, 'register blocked zone count mismatch')
assert(register.observedResult.saferCandidateZoneCount === 1, 'register safer zone count mismatch')
assert(register.observedResult.rejectedInputs.includes('rawFrames'), 'rawFrames rejected input missing')
assert(register.observedResult.rejectedInputs.includes('artifactWriteTargets'), 'artifactWriteTargets rejected input missing')
assertTrue(register.observedResult.manualCaptionLayoutReviewRequired, 'register manual review missing')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime flag mismatch')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_WORKER_EXECUTION_ENABLED === '0', 'worker flag mismatch')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_MEDIA_PROCESSING_ENABLED === '0', 'media flag mismatch')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_SUPABASE_MUTATION_ENABLED === '0', 'Supabase flag mismatch')
assert(register.observedResult.runtimeDisabledFlags.REEDITPRO_ARTIFACT_WRITE_ENABLED === '0', 'artifact flag mismatch')
for (const key of [
  'runtimeExecutionApproved',
  'workerExecutionApproved',
  'renderExecutionApproved',
  'mediaProcessingApproved',
  'artifactCreationApproved',
]) {
  assertFalse(register.observedResult[key], `register.observedResult.${key}`)
}
assertTrue(register.observedResult.noArtifactCreated, 'register no artifact missing')
assertTrue(register.proofInspectionOnly, 'proof inspection only missing')

assert(report.decision === decision, 'report decision mismatch')
assert(report.controlledHookProofCommand.result === 'passed', 'hook proof command did not pass')
assertTrue(report.controlledHookProofCommand.moduleImported, 'hook proof module import missing')
assertTrue(report.controlledHookProofCommand.hookBlockedResultFunctionInvokedWithSyntheticMetadata, 'synthetic hook invocation missing')
assertTrue(report.controlledHookProofCommand.failClosedResultInspectionPassed, 'fail-closed inspection missing')
assertFalse(report.controlledHookProofCommand.temporaryProofFileCreated, 'temporary proof file created')
assertFalse(report.controlledHookProofCommand.temporaryProofFileStaged, 'temporary proof file staged')
assertAllFalse(report.validationBoundaries, 'report.validationBoundaries')
assertNoop(report.supabaseClassification, 'report')

assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase60_controlled_hook_execution_proof_pending'),
  'Phase 60 blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase60_owner_review_pending'),
  'Phase 60 owner review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'external_agent_execution_pending'),
  'External execution blocker missing',
)

assertTrue(claims.allowedClaims.phase60ControlledHookExecutionProofPassed, 'Phase 60 allowed claim missing')
assertTrue(claims.allowedClaims.hookBlockedResultFunctionValidatedWithSyntheticMetadata, 'Hook validation allowed claim missing')
assertTrue(claims.allowedClaims.failClosedHookResultInspectable, 'Fail-closed result claim missing')
assertTrue(claims.allowedClaims.controlledHookExecutionOwnerReviewMayProceed, 'Owner review may proceed missing')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(ownerReviewRegister.sourceDecision === decision, 'owner-review register source mismatch')
assertTrue(ownerReviewRegister.ownerReviewMayProceed, 'owner review may proceed missing')
assertTrue(ownerReviewRegister.ownerReviewAllowedScope.reviewControlledHookBlockedResultProof, 'owner review proof scope missing')
assertTrue(ownerReviewRegister.ownerReviewAllowedScope.acceptSyntheticMetadataOnlyProof, 'owner review synthetic scope missing')
assertTrue(ownerReviewRegister.ownerReviewAllowedScope.planNextMediaArtifactBoundary, 'owner review next-boundary scope missing')
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
  assertFalse(ownerReviewRegister.ownerReviewAllowedScope[key], `ownerReviewRegister.ownerReviewAllowedScope.${key}`)
}
assertTrue(ownerReviewRegister.stillBlocked.externalAgentExecution, 'external execution still blocked missing')
assert(ownerReviewRegister.nextPrompt === nextPrompt, 'owner review register next prompt mismatch')

assert(ownerReviewPrompt.requiredSourceDecision === decision, 'owner-review prompt source mismatch')
assert(ownerReviewPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'owner-review prompt source head mismatch')
assert(ownerReviewPrompt.hookSource === hookSource, 'owner-review prompt hook source mismatch')
assertTrue(ownerReviewPrompt.reviewScope.reviewControlledHookBlockedResultProof, 'owner-review prompt proof scope missing')
assertTrue(ownerReviewPrompt.reviewScope.acceptSyntheticMetadataOnlyProof, 'owner-review prompt synthetic scope missing')
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
  assertFalse(ownerReviewPrompt.reviewScope[key], `ownerReviewPrompt.reviewScope.${key}`)
}
assert(ownerReviewPrompt.expectedDecision === ownerReviewDecision, 'owner review expected decision mismatch')
assertNoop(ownerReviewPrompt.supabaseClassification, 'ownerReviewPrompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-diagnostics.mjs',
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
  assert(hookText.includes(snippet), `Hook source missing expected fail-closed snippet: ${snippet}`)
}
assert(!/audio_open|ffmpeg|ffprobe|pydub|writeArtifact|createSignedUrl|createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|service[_-]role/i.test(hookText), 'Hook source contains prohibited runtime/media/Supabase marker')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1853,
      sourceHead,
      sourceMergeCommit,
      controlledHookProofPassed: true,
      syntheticMetadataOnly: true,
      blockedStatus: 'blocked_by_owner_gate',
      blockedAssertionInvoked: false,
      realMediaUsed: false,
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
