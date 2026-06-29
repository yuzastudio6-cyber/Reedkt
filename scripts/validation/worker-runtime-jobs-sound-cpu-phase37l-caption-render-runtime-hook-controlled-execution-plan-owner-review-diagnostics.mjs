#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37l_caption_render_runtime_hook_controlled_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_execution_proof_no_media_no_artifacts'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37l_caption_render_runtime_hook_controlled_execution_plan_completed_with_warnings_ready_for_controlled_execution_plan_owner_review_no_execution'
const SOURCE_PR = 1637
const SOURCE_MERGE_COMMIT = '9f834444f124b2ccdedb7de059eee48da80efa35'
const INTEGRATION_TARGET = 'server/workers/sound-cpu/index.ts'
const HOOK_SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37M-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-EXECUTION-PROOF'
const PACKAGE_SCRIPT =
  'worker-runtime-jobs:sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-review:diagnostics'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-safety-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-safety-register',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof',
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
  'artifactCreationAllowed',
  'artifactWriteAllowed',
  'captionRenderRuntimeExecution',
  'dry_run_passed',
  'generated_local_fixture_passed',
  'mediaProcessing',
  'ocrInference',
  'paidProductionAllowed',
  'phase37MProofRun',
  'providerModelCall',
  'realMediaAllowed',
  'realMediaExecution',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'runtimeReady',
  'sqlExecution',
  'supabaseMutation',
  'supabaseSql',
  'supabaseSqlAllowed',
  'toolCallReady',
  'toolExecution',
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
  path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan.md',
  label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan',
})
assert(sourcePlan.decision === SOURCE_DECISION, 'Phase 37L plan source decision mismatch')
assert(sourcePlan.sourceVerification.sourcePr === 1635, 'Phase 37L plan source PR mismatch')
assert(sourcePlan.controlledExecutionPlan.futureProofRequiresOwnerReviewBeforeExecution === true, 'source owner review requirement missing')
assert(sourcePlan.controlledExecutionPlan.executionRunInThisGate === false, 'source gate executed proof')

const indexText = read(INTEGRATION_TARGET)
const hookText = read(HOOK_SOURCE_PATH)
assert(indexText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'index missing hook factory export')
assert(indexText.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'index missing blocked assertion export')
assert(hookText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'hook factory source missing')
assert(hookText.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'hook assertion source missing')

const review = parsed.review
assert(review.sourceVerification.sourcePr === SOURCE_PR, 'review source PR mismatch')
assert(review.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'review source merge mismatch')
assert(review.sourceVerification.sourceDecision === SOURCE_DECISION, 'review source decision mismatch')
assert(review.reviewedPlan.acceptedForControlledNoMediaNoArtifactExecutionProof === true, 'controlled proof acceptance missing')
assert(review.reviewedPlan.acceptedForRealMediaExecutionToday === false, 'real media execution widened')
assert(review.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(acceptance.acceptedPlanEvidence.sourcePr === SOURCE_PR, 'acceptance source PR mismatch')
assert(acceptance.acceptedPlanEvidence.futureProofMayInvokeHookFactory === true, 'future factory proof not accepted')
assert(acceptance.acceptedForNextGateOnly.controlledExecutionProofMayProceed === true, 'next proof acceptance missing')
assert(acceptance.acceptedForNextGateOnly.mustUseSyntheticNoMediaInput === true, 'synthetic input requirement missing')
assert(acceptance.rejectedForToday.includes('real media input'), 'real media rejection missing')

const safety = parsed.safety
assert(safety.nextGateSafetyRequirements.syntheticInputOnly === true, 'synthetic safety missing')
assert(safety.nextGateSafetyRequirements.noMediaByteRead === true, 'media byte safety missing')
assert(safety.nextGateSafetyRequirements.noSupabaseSql === true, 'Supabase safety missing')
assert(safety.closedToday.realMediaExecution === false, 'real media execution widened')

const readiness = parsed.readiness
assert(readiness.phase37MReadiness.controlledExecutionProofMayProceed === true, 'Phase 37M readiness missing')
assert(readiness.phase37MReadiness.allowedHookFactoryInvocation === true, 'hook factory proof allowance missing')
assert(readiness.phase37MReadiness.allowedBlockedAssertionInvocation === true, 'blocked assertion proof allowance missing')
assert(readiness.phase37MReadiness.realMediaAllowed === false, 'real media widened')
assert(readiness.currentGateExecution.phase37MProofRun === false, 'Phase 37M proof ran in owner review')

const blockers = parsed.blockers
assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase37l_controlled_execution_plan_owner_review_pending'),
  'Phase 37L owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37m_controlled_execution_proof_pending'),
  'Phase 37M proof blocker missing',
)

const claims = parsed.claims
assert(claims.allowedClaims.phase37LControlledExecutionPlanOwnerReviewPassed === true, 'owner review allowed claim missing')
assert(claims.allowedClaims.phase37MNoMediaNoArtifactProofMayProceed === true, 'Phase 37M proof claim missing')
assert(claims.blockedClaims.phase37MProofRun === false, 'proof run claim widened')
assert(claims.noScopeStatement.includes('future no-media/no-artifact fail-closed execution proof only'), 'no-scope clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'Phase 37M prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'Phase 37M prompt source head mismatch')
assert(prompt.allowedProof.hookFactoryInvocationAllowed === true, 'Phase 37M factory proof allowance missing')
assert(prompt.allowedProof.mediaReadAllowed === false, 'Phase 37M media read widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[PACKAGE_SCRIPT] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      sourcePr: SOURCE_PR,
      sourceMergeCommit: SOURCE_MERGE_COMMIT,
      phase37MProofMayProceed: true,
      proofRunInThisGate: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
