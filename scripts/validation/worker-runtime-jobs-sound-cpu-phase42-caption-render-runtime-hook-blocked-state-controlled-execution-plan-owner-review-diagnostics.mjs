#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase42_caption_render_runtime_hook_blocked_state_controlled_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_execution_proof_no_media_no_artifacts'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase42_caption_render_runtime_hook_blocked_state_controlled_execution_plan_completed_with_warnings_ready_for_plan_owner_review_no_media_no_artifacts'
const SOURCE_PR = 1754
const SOURCE_HEAD = '7144cfbdf6875dc0c135461da27a1602bc8faebf'
const SOURCE_MERGE_COMMIT = 'b99eaeab48546c9f3c8bc009f19c0c924f4e2d4b'
const IMPORT_TARGET = 'server/workers/sound-cpu/index.ts'
const RUNTIME_INTEGRATION_SOURCE =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE43-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-CONTROLLED-EXECUTION-PROOF'
const TEMP_PROOF_FILE =
  'server/workers/sound-cpu/phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof.tmp.ts'
const PACKAGE_SCRIPT =
  'worker-runtime-jobs:sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-review:diagnostics'
const SCRIPT_COMMAND =
  'node scripts/validation/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-review-diagnostics.mjs'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-review.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-acceptance-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-safety-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-safety-register',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-readiness-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-blocker-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-claim-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForArtifactCreationToday',
  'acceptedForPaidProductionToday',
  'acceptedForProviderModelCallToday',
  'acceptedForRealMediaExecutionToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForRouteExecutionToday',
  'acceptedForSupabaseSqlToday',
  'acceptedForToolExecutionToday',
  'acceptedForWorkerExecutionToday',
  'artifactCreation',
  'artifactWriteAllowed',
  'artifactWriteAllowed',
  'captionRenderRuntimeExecution',
  'dockerOrGcpAllowed',
  'dry_run_passed',
  'generated_local_fixture_passed',
  'mediaProcessing',
  'mediaReadAllowed',
  'ocrInference',
  'paidProductionAllowed',
  'phase43ProofRun',
  'providerModelCall',
  'providerModelCallAllowed',
  'realMediaAllowed',
  'realMediaExecution',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'routeExecutionAllowed',
  'runtimeExecutionOverMedia',
  'runtimeReady',
  'sqlExecution',
  'supabaseMutation',
  'supabaseSql',
  'supabaseSqlAllowed',
  'toolCallReady',
  'toolExecution',
  'toolExecutionAllowed',
  'workerDispatchAllowed',
  'workerExecution',
  'workerReady',
])

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function parseBlock(info) {
  const text = read(info.path)
  const marker = '```json ' + info.label
  const start = text.indexOf(marker)
  assert(start >= 0, `${info.path} missing fenced JSON label ${info.label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${info.path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function scanFalse(value, trail = []) {
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanFalse(entry, trail.concat(String(index))))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (FALSE_FIELDS.has(key)) assert(child === false, `${trail.concat(key).join('.')} must be false`)
    scanFalse(child, trail.concat(key))
  }
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value?.sqlExecuted === 'no', `${label} SQL execution mismatch`)
  assert(value?.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value?.nextAction === 'none', `${label} Supabase next action mismatch`)
}

const parsed = Object.fromEntries(Object.entries(FILES).map(([key, info]) => [key, parseBlock(info)]))

for (const [key, doc] of Object.entries(parsed)) {
  if (key === 'prompt') {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
    assert(doc.requiredSourceDecision === DECISION, `${key} source decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, key)
  } else {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
    assert(doc.decision === DECISION, `${key} decision mismatch`)
    if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  }
  scanFalse(doc, [key])
}

const sourcePlan = parseBlock({
  path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan.md',
  label: 'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan',
})
assert(sourcePlan.decision === SOURCE_DECISION, 'Phase 42 plan source decision mismatch')
assert(sourcePlan.sourceVerification.sourcePr === 1752, 'Phase 42 plan upstream owner-review PR mismatch')
assert(
  sourcePlan.sourceVerification.sourceMergeCommit === '62756b0eed1b1297a009e5dbd05bdde5e5796601',
  'Phase 42 plan upstream owner-review merge mismatch',
)
assert(
  sourcePlan.controlledExecutionPlan.futureProofRequiresOwnerReviewBeforeExecution === true,
  'source owner review requirement missing',
)
assert(sourcePlan.controlledExecutionPlan.executionRunInThisGate === false, 'source gate executed proof')
assert(
  sourcePlan.controlledExecutionPlan.blockedResultFactoryInvokedInThisGate === false,
  'source gate invoked factory',
)
assert(sourcePlan.controlledExecutionPlan.blockedAssertionInvokedInThisGate === false, 'source gate invoked assertion')

const sourceProofDesign = parseBlock({
  path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-proof-design.md',
  label:
    'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-proof-design',
})
assert(sourceProofDesign.futureProofDesign.futurePrompt === NEXT_PROMPT, 'source future prompt mismatch')
assert(sourceProofDesign.futureProofDesign.temporaryProofFile === TEMP_PROOF_FILE, 'source temp proof path mismatch')
assert(sourceProofDesign.futureProofDesign.executionAllowanceRequiresOwnerReview === true, 'source owner review guard missing')
assert(sourceProofDesign.currentGateNoExecution.blockedResultFactoryInvoked === false, 'source proof design invoked factory')

const indexText = read(IMPORT_TARGET)
const runtimeText = read(RUNTIME_INTEGRATION_SOURCE)
assert(indexText.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'), 'index missing runtime integration factory export')
assert(indexText.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'), 'index missing runtime integration assertion export')
assert(runtimeText.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'), 'factory source missing')
assert(runtimeText.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'), 'assertion source missing')
assert(runtimeText.includes("blockedStatus: 'blocked_by_owner_gate'"), 'runtime integration blocked status missing')
assert(!existsSync(TEMP_PROOF_FILE), 'Phase 43 temporary proof file must not exist in owner review')

const review = parsed.review
assert(review.sourceVerification.sourcePr === SOURCE_PR, 'review source PR mismatch')
assert(review.sourceVerification.sourceHead === SOURCE_HEAD, 'review source head mismatch')
assert(review.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'review source merge mismatch')
assert(review.sourceVerification.sourceDecision === SOURCE_DECISION, 'review source decision mismatch')
assert(review.reviewedPlan.acceptedForControlledNoMediaNoArtifactExecutionProof === true, 'controlled proof acceptance missing')
assert(
  review.reviewedPlan.acceptedForRuntimeIntegrationBlockedResultFactoryInvocationInNextGate === true,
  'factory proof acceptance missing',
)
assert(
  review.reviewedPlan.acceptedForRuntimeIntegrationBlockedAssertionInvocationInNextGate === true,
  'assertion proof acceptance missing',
)
assert(review.reviewedPlan.acceptedForRealMediaExecutionToday === false, 'real media execution widened')
assert(review.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(acceptance.acceptedPlanEvidence.sourcePr === SOURCE_PR, 'acceptance source PR mismatch')
assert(
  acceptance.acceptedPlanEvidence.futureProofMayInvokeRuntimeIntegrationBlockedResultFactory === true,
  'future factory proof not accepted',
)
assert(acceptance.acceptedPlanEvidence.futureProofMayInvokeRuntimeIntegrationBlockedAssertion === true, 'future assertion proof not accepted')
assert(acceptance.acceptedPlanEvidence.executionRunInSourceGate === false, 'source execution widened')
assert(acceptance.acceptedForNextGateOnly.controlledExecutionProofMayProceed === true, 'next proof acceptance missing')
assert(
  acceptance.acceptedForNextGateOnly.runtimeIntegrationBlockedResultFactoryInvocationAllowed === true,
  'next factory proof allowance missing',
)
assert(acceptance.acceptedForNextGateOnly.mustUseSyntheticNoMediaInput === true, 'synthetic input requirement missing')
assert(acceptance.rejectedForToday.includes('real media input'), 'real media rejection missing')

const safety = parsed.safety
assert(safety.nextGateSafetyRequirements.syntheticInputOnly === true, 'synthetic safety missing')
assert(safety.nextGateSafetyRequirements.noMediaByteRead === true, 'media byte safety missing')
assert(safety.nextGateSafetyRequirements.noSupabaseSql === true, 'Supabase safety missing')
assert(safety.closedToday.realMediaExecution === false, 'real media execution widened')

const readiness = parsed.readiness
assert(readiness.phase43Readiness.controlledExecutionProofMayProceed === true, 'Phase 43 readiness missing')
assert(
  readiness.phase43Readiness.allowedRuntimeIntegrationBlockedResultFactoryInvocation === true,
  'Phase 43 factory proof allowance missing',
)
assert(
  readiness.phase43Readiness.allowedRuntimeIntegrationBlockedAssertionInvocation === true,
  'Phase 43 assertion proof allowance missing',
)
assert(readiness.phase43Readiness.realMediaAllowed === false, 'real media widened')
assert(readiness.currentGateExecution.phase43ProofRun === false, 'Phase 43 proof ran in owner review')

const blockers = parsed.blockers
assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase42_controlled_execution_plan_owner_review_pending'),
  'Phase 42 owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase43_controlled_execution_proof_pending'),
  'Phase 43 proof blocker missing',
)

const claims = parsed.claims
assert(claims.allowedClaims.phase42ControlledExecutionPlanOwnerReviewPassed === true, 'owner review allowed claim missing')
assert(claims.allowedClaims.phase43NoMediaNoArtifactProofMayProceed === true, 'Phase 43 proof claim missing')
assert(claims.blockedClaims.phase43ProofRun === false, 'proof run claim widened')
assert(claims.noScopeStatement.includes('future no-media/no-artifact fail-closed runtime-integration proof only'), 'no-scope clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'Phase 43 prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'Phase 43 prompt source head mismatch')
assert(
  prompt.allowedProof.runtimeIntegrationBlockedResultFactoryInvocationAllowed === true,
  'Phase 43 factory proof allowance missing',
)
assert(prompt.allowedProof.mediaReadAllowed === false, 'Phase 43 media read widened')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.[PACKAGE_SCRIPT] === SCRIPT_COMMAND, 'package diagnostics script missing')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      sourcePr: SOURCE_PR,
      sourceMergeCommit: SOURCE_MERGE_COMMIT,
      phase43ProofMayProceed: true,
      proofRunInThisGate: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
