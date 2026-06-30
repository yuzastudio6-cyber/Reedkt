import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_phase63_caption_render_runtime_hook_blocked_state_source_runtime_integration_external_agent_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase63_caption_render_runtime_hook_blocked_state_source_runtime_integration_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_plan_owner_review_no_media_no_artifacts'
const sourceHead = 'edf3d1c883260fc75811f04402303bf7d7cf399b'
const sourceMergeCommit = '8048f67b1239342c3dd87a9261c6e5d8152eff59'
const hookSource = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE64-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-CONTROLLED-EXTERNAL-AGENT-EXECUTION-PROOF'
const phase64Decision =
  'worker_runtime_jobs_sound_cpu_phase64_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_external_agent_execution_proof_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_owner_review_no_media_no_artifacts'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-review-result.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-review-result',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-claim-policy',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-controlled-external-agent-proof-register.md',
    'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-controlled-external-agent-proof-register',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof.md',
    'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof',
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
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-review-result',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-acceptance-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-safety-register',
)
const blockers = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-blocker-register',
)
const claims = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-external-agent-execution-plan-owner-claim-policy',
)
const proofRegister = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-controlled-external-agent-proof-register',
)
const phase64Prompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase64-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-external-agent-execution-proof',
)

assert(review.decision === expectedDecision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1874, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceHead, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assertTrue(review.reviewedExecutionPlan.syntheticInputMapAccepted, 'Synthetic input map acceptance missing')
assertTrue(review.reviewedExecutionPlan.agentCallBoundaryAccepted, 'Agent call boundary acceptance missing')
assertTrue(review.reviewedExecutionPlan.noArtifactOutputPlanAccepted, 'No-artifact output acceptance missing')
assert(review.reviewedExecutionPlan.soundCpuToolCountAccepted === 15, 'Tool count acceptance mismatch')
assertTrue(review.reviewedExecutionPlan.controlledExternalAgentExecutionProofMayProceed, 'Controlled proof may proceed missing')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(review.reviewedExecutionPlan[key], `review.reviewedExecutionPlan.${key}`)
}
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assertNoop(review.supabaseClassification, 'review')

assert(acceptance.decision === expectedDecision, 'Acceptance decision mismatch')
assert(acceptance.acceptedEvidence.phase63Pr === 1874, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase63Head === sourceHead, 'Acceptance source head mismatch')
assert(acceptance.acceptedEvidence.phase63MergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase63Decision === sourceDecision, 'Acceptance source decision mismatch')
for (const key of ['syntheticInputMapPlanned', 'agentCallBoundaryPlanned', 'noArtifactOutputPlanned', 'packageLockUnchanged']) {
  assertTrue(acceptance.acceptedEvidence[key], `acceptance.acceptedEvidence.${key}`)
}
assert(acceptance.acceptedEvidence.soundCpuToolCountCovered === 15, 'Acceptance tool count mismatch')
assert(acceptance.acceptedEvidence.readyForExecutionToday === 0, 'Ready for execution must remain zero')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assertTrue(acceptance.acceptedScope.controlledSyntheticExternalAgentProof, 'Controlled proof scope missing')
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
assert(safety.reviewSafety.allowedNextStep === 'controlled synthetic external-agent execution proof', 'Safety next step mismatch')
assertTrue(safety.reviewSafety.controlledProofMustUseSyntheticInputsOnly, 'Synthetic-only proof safety missing')
assertTrue(safety.reviewSafety.controlledProofMustCreateNoArtifacts, 'No-artifact proof safety missing')
assertTrue(safety.reviewSafety.controlledProofMustNotDispatchWorkers, 'No-worker proof safety missing')
for (const key of [
  'runtimeExecutionAllowedForRealMediaToday',
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
    (row) => row.blockerId === 'phase63_external_agent_execution_plan_owner_review_pending',
  ),
  'Owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase64_controlled_external_agent_execution_proof_pending'),
  'Phase 64 proof blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'real_media_execution_pending'),
  'Real media blocker missing',
)

assertTrue(claims.allowedClaims.phase63OwnerReviewPassed, 'Owner review claim missing')
assertTrue(claims.allowedClaims.externalAgentExecutionPlanAccepted, 'Execution plan acceptance claim missing')
assertTrue(claims.allowedClaims.controlledSyntheticProofMayProceed, 'Controlled proof claim missing')
assert(claims.allowedClaims.soundCpuToolCountCovered === 15, 'Claim tool count mismatch')
assertAllFalse(claims.blockedClaims, 'claims.blockedClaims')
assertAllFalse(claims.executionClaims, 'claims.executionClaims')

assert(proofRegister.sourceDecision === expectedDecision, 'Proof register source decision mismatch')
assertTrue(proofRegister.controlledProofMayProceed, 'Controlled proof may proceed missing')
assertTrue(proofRegister.proofScope.invokeSyntheticExternalAgentBoundary, 'Synthetic boundary invocation scope missing')
assertTrue(proofRegister.proofScope.useSyntheticInputsOnly, 'Synthetic input proof scope missing')
assertTrue(proofRegister.proofScope.expectBlockedMetadataResult, 'Blocked metadata result scope missing')
assertTrue(proofRegister.proofScope.verifyNoArtifactCreated, 'No artifact verification scope missing')
assertTrue(proofRegister.proofScope.verifyNoWorkerDispatch, 'No worker verification scope missing')
assertTrue(proofRegister.proofScope.verifyNoSupabaseSql, 'No Supabase verification scope missing')
assert(proofRegister.proofScope.coverSoundCpuToolCount === 15, 'Proof register tool count mismatch')
for (const key of [
  'useRealMedia',
  'createArtifact',
  'dispatchWorker',
  'callRouteToolProvider',
  'touchSupabaseSql',
  'unlockBeta',
  'unlockProduction',
]) {
  assertFalse(proofRegister.proofScope[key], `proofRegister.proofScope.${key}`)
}
assert(proofRegister.nextPrompt === nextPrompt, 'Proof register next prompt mismatch')

assert(phase64Prompt.requiredSourceDecision === expectedDecision, 'Phase 64 prompt source decision mismatch')
assert(phase64Prompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 64 source head mismatch')
assert(phase64Prompt.hookSource === hookSource, 'Phase 64 hook source mismatch')
assertTrue(phase64Prompt.proofScope.invokeSyntheticExternalAgentBoundary, 'Phase 64 prompt invocation scope missing')
assertTrue(phase64Prompt.proofScope.useSyntheticInputsOnly, 'Phase 64 prompt synthetic scope missing')
assertTrue(phase64Prompt.proofScope.expectBlockedMetadataResult, 'Phase 64 prompt result scope missing')
assertTrue(phase64Prompt.proofScope.verifyNoArtifactCreated, 'Phase 64 prompt no-artifact scope missing')
assertTrue(phase64Prompt.proofScope.verifyNoWorkerDispatch, 'Phase 64 prompt no-worker scope missing')
assertTrue(phase64Prompt.proofScope.verifyNoSupabaseSql, 'Phase 64 prompt no-Supabase scope missing')
assert(phase64Prompt.proofScope.coverSoundCpuToolCount === 15, 'Phase 64 prompt tool count mismatch')
for (const key of [
  'useRealMediaToday',
  'createArtifactToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(phase64Prompt.proofScope[key], `phase64Prompt.proofScope.${key}`)
}
assert(phase64Prompt.expectedDecision === phase64Decision, 'Phase 64 expected decision mismatch')
assertNoop(phase64Prompt.supabaseClassification, 'phase64Prompt')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-blocked-state-source-runtime-integration-external-agent-execution-plan-owner-review-diagnostics.mjs',
  'Package script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: expectedDecision,
      sourcePr: 1874,
      sourceHead,
      sourceMergeCommit,
      totalToolsInLane: 15,
      readyForRealExecutionToday: 0,
      controlledSyntheticProofMayProceed: true,
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
