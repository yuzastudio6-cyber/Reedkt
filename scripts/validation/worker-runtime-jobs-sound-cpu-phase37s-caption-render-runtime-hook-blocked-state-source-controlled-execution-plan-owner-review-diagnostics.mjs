#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase37s_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_execution_proof_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37s_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_completed_with_warnings_ready_for_controlled_execution_plan_owner_review_no_execution'
const previousOwnerDecision =
  'worker_runtime_jobs_sound_cpu_phase37r_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_owner_review_passed_with_warnings_ready_for_controlled_execution_plan_no_media_no_artifacts'
const sourceMergeCommit = 'd07ec899bf97ca03ecad92fea12e609affeafcb0'
const phase37SPlanSourceMerge = '1ba8d94beb390140dcaae0258eb92950f68a898e'
const sourcePath =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const indexPath = 'server/workers/sound-cpu/index.ts'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37T-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-EXECUTION-PROOF'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-acceptance-register.md',
    'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-acceptance-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-readiness-register.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-readiness-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-safety-register.md',
    'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-safety-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
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
  'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review',
)
const acceptance = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-acceptance-register',
)
const readiness = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-readiness-register',
)
const safety = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-safety-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-claim-policy',
)
const proofPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof',
)

assert(review.decision === decision, 'Owner-review decision mismatch')
assert(review.sourceVerification.sourcePr === 1684, 'Source PR mismatch')
assert(review.sourceVerification.sourceHead === sourceMergeCommit, 'Source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Source merge commit mismatch')
assert(review.sourceVerification.sourceDecision === sourceDecision, 'Source decision mismatch')
assert(review.reviewDecision.phase37SControlledExecutionPlanAccepted === true, 'Phase 37S plan acceptance missing')
assert(review.reviewDecision.phase37TControlledExecutionProofMayProceed === true, 'Phase 37T proof readiness missing')
assert(review.reviewDecision.integrationTarget === indexPath, 'Integration target mismatch')
assert(review.reviewDecision.integrationSourcePath === sourcePath, 'Integration source path mismatch')
assert(review.reviewDecision.futureProofTemporaryFile === tempProofFile, 'Future proof temp file mismatch')
assert(review.reviewDecision.futureProofMustUseSyntheticNoMediaInput === true, 'Synthetic input review missing')
assert(review.reviewDecision.futureProofMustRemoveTemporaryFileBeforeStaging === true, 'Future cleanup review missing')
assert(review.reviewDecision.futureProofMayInvokeFactory === true, 'Future factory review missing')
assert(review.reviewDecision.futureProofMayInvokeBlockedAssertion === true, 'Future blocked assertion review missing')
for (const key of [
  'proofRunInThisGate',
  'factoryInvokedInThisGate',
  'blockedAssertionInvokedInThisGate',
  'runtimeExecutionApprovedToday',
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
assert(review.selectedNextPrompt === nextPrompt, 'Selected next prompt mismatch')
assert(review.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(review.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(acceptance.acceptedEvidence.phase37SPr === 1684, 'Acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.phase37SMergeCommit === sourceMergeCommit, 'Acceptance source merge mismatch')
assert(acceptance.acceptedEvidence.phase37SDecision === sourceDecision, 'Acceptance source decision mismatch')
assert(acceptance.acceptedEvidence.phase37RSourceDecision === previousOwnerDecision, 'Phase 37R source decision mismatch')
assert(acceptance.acceptedEvidence.planOnlyGatePassed === true, 'Plan-only evidence missing')
assert(acceptance.acceptedEvidence.futureSyntheticNoMediaProofPlanned === true, 'Future proof planning missing')
assertFalse(acceptance.acceptedEvidence.factoryInvokedInPlanGate, 'acceptance factoryInvokedInPlanGate')
assertFalse(acceptance.acceptedEvidence.blockedAssertionInvokedInPlanGate, 'acceptance blockedAssertionInvokedInPlanGate')
assert(acceptance.acceptedEvidence.crossChatOwnershipConflicts === 0, 'Ownership conflicts must be zero')
assert(acceptance.acceptedEvidence.duplicateRisksChecked === 13, 'Duplicate risk count mismatch')
assert(acceptance.acceptedForNextGateOnly.controlledExecutionProof === true, 'Next gate proof acceptance missing')
assert(acceptance.acceptedForNextGateOnly.syntheticNoMediaInput === true, 'Synthetic proof acceptance missing')
assert(acceptance.acceptedForNextGateOnly.temporaryProofFileWithCleanup === true, 'Temp proof cleanup acceptance missing')
for (const key of [
  'runtimeExecution',
  'realMediaProcessing',
  'artifactDelivery',
  'workerDispatch',
  'supabaseSql',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assertFalse(acceptance.acceptedForNextGateOnly[key], `acceptance.acceptedForNextGateOnly.${key}`)
}

assert(readiness.sourceDecision === decision, 'Phase 37T readiness source mismatch')
assert(readiness.phase37TMayProceed === true, 'Phase 37T may proceed missing')
for (const key of [
  'controlledExecutionProofOnly',
  'syntheticNoMediaInputOnly',
  'factoryInvocationAllowed',
  'blockedAssertionInvocationAllowed',
  'temporaryProofFileAllowed',
  'temporaryProofFileMustBeRemovedBeforeStaging',
  'typecheckRequired',
  'noRealMediaInput',
  'noArtifactOutput',
  'noWorkerDispatch',
  'noRouteToolProviderCalls',
  'noSupabaseSql',
  'noBetaUnlock',
  'noProductionUnlock',
]) {
  assert(readiness.phase37TAllowedScope[key] === true, `phase37TAllowedScope.${key} must be true`)
}
for (const key of [
  'realMediaExecution',
  'ocrInferenceOverUploadedMedia',
  'captionRenderRuntimeExecutionOverMedia',
  'workerExecution',
  'artifactCreation',
  'realUserMediaBeta',
  'paidProduction',
]) {
  assert(readiness.phase37TStillBlocked[key] === true, `phase37TStillBlocked.${key} must be true`)
}

assert(safety.decision === decision, 'Safety decision mismatch')
assert(safety.sourceSafety.allowedNextStep === 'controlled execution proof', 'Allowed next step mismatch')
assert(safety.sourceSafety.integrationSourceMustRemainFailClosed === true, 'Fail-closed source flag missing')
assert(safety.sourceSafety.temporaryProofFileMustBeAbsentUntilPhase37T === true, 'Temporary proof absence flag missing')
for (const key of [
  'actualRuntimeWiringAllowed',
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
  assertFalse(safety.sourceSafety[key], `safety.sourceSafety.${key}`)
}
for (const key of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadiness',
  'workerReadiness',
  'mediaReadiness',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(safety.mustRemainFalse[key], `safety.mustRemainFalse.${key}`)
}

assert(
  blocker.resolvedForThisGate.some((row) => row.blockerId === 'phase37s_controlled_execution_plan_owner_review_pending'),
  'Owner-review blocker resolution missing',
)
assert(
  blocker.remainingBlockers.some((row) => row.blockerId === 'phase37t_controlled_execution_proof_pending'),
  'Phase 37T proof blocker missing',
)

assert(claimPolicy.allowedClaims.phase37SControlledExecutionPlanOwnerReviewPassed === true, 'Owner review claim missing')
assert(claimPolicy.allowedClaims.phase37TControlledExecutionProofMayProceed === true, 'Phase 37T proceed claim missing')
for (const key of [
  'runtimeExecution',
  'realMediaProcessing',
  'workerExecution',
  'artifactCreation',
  'supabaseSql',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(claimPolicy.allowedClaims[key], `claimPolicy.allowedClaims.${key}`)
}
assert(claimPolicy.noScopeStatement.includes('accepted a future fail-closed synthetic no-media controlled proof only'), 'No-scope phrase missing')

assert(proofPrompt.requiredSourceDecision === decision, 'Phase 37T prompt source decision mismatch')
assert(proofPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Phase 37T prompt source head mismatch')
assert(proofPrompt.allowedProof.temporaryProofFile === tempProofFile, 'Phase 37T temp proof mismatch')
assert(proofPrompt.allowedProof.factoryInvocationAllowed === true, 'Phase 37T factory proof allowance missing')
assert(proofPrompt.allowedProof.blockedAssertionInvocationAllowed === true, 'Phase 37T assertion proof allowance missing')
assertFalse(proofPrompt.allowedProof.mediaReadAllowed, 'proofPrompt.allowedProof.mediaReadAllowed')
assertFalse(proofPrompt.allowedProof.artifactWriteAllowed, 'proofPrompt.allowedProof.artifactWriteAllowed')
assertFalse(proofPrompt.allowedProof.workerDispatchAllowed, 'proofPrompt.allowedProof.workerDispatchAllowed')
assertFalse(proofPrompt.allowedProof.routeToolProviderAllowed, 'proofPrompt.allowedProof.routeToolProviderAllowed')
assertFalse(proofPrompt.allowedProof.supabaseSqlAllowed, 'proofPrompt.allowedProof.supabaseSqlAllowed')

const plan = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan.md',
  'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan',
)
assert(plan.decision === sourceDecision, 'Source Phase 37S plan decision mismatch')
assert(plan.sourceVerification.sourcePr === 1681, 'Source Phase 37S plan source PR mismatch')
assert(plan.sourceVerification.sourceMergeCommit === phase37SPlanSourceMerge, 'Source Phase 37S plan merge mismatch')
assert(plan.controlledExecutionPlan.executionRunInThisGate === false, 'Source plan execution widened')

const sourceText = readText(sourcePath)
const indexText = readText(indexPath)
assert(sourceText.includes("blockedStatus: 'blocked_by_owner_gate'"), 'Blocked status source missing')
for (const field of [
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'renderExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'supabaseSqlApproved: false',
  'noArtifactCreated: true',
]) {
  assert(sourceText.includes(field), `Fail-closed source field missing: ${field}`)
}
assert(indexText.includes("} from './runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'"), 'Index export missing')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Phase 37T temporary proof file must not exist before Phase 37T')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1684,
      sourceMergeCommit,
      phase37TControlledExecutionProofMayProceed: true,
      proofRunInThisGate: false,
      runtimeExecutionApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
