#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37l_caption_render_runtime_hook_controlled_execution_plan_completed_with_warnings_ready_for_controlled_execution_plan_owner_review_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37k_caption_render_runtime_hook_controlled_static_import_proof_owner_review_passed_with_warnings_ready_for_controlled_execution_plan_no_execution'
const SOURCE_PR = 1635
const SOURCE_MERGE_COMMIT = '5dcb7d33c6d0bd2d273688efb3e5d2deacef35c2'
const INTEGRATION_TARGET = 'server/workers/sound-cpu/index.ts'
const HOOK_SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37L-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-EXECUTION-PLAN-OWNER-REVIEW'
const PACKAGE_SCRIPT =
  'worker-runtime-jobs:sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan:diagnostics'
const EXPORT_SOURCE = './runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const EXPORTS = [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS',
  'assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked',
  'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult',
  'type SoundCpuOcrCaptionRenderSafeZoneHookInput',
  'type SoundCpuOcrCaptionRenderSafeZoneHookResult',
]

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan',
  },
  inputs: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-input-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-input-register',
  },
  boundaries: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-boundary-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-boundary-register',
  },
  proofDesign: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-proof-design.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-proof-design',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-review',
  },
}

const FALSE_FIELDS = new Set([
  'artifactCreation',
  'artifactCreationAllowed',
  'artifactWrite',
  'artifactWrites',
  'betaUnlock',
  'blockedAssertionInvoked',
  'blockedAssertionInvokedInThisGate',
  'blockedAssertionInvocationAllowed',
  'captionRenderRuntimeExecution',
  'dockerOrGcpExecution',
  'dry_run_passed',
  'executionRunInThisGate',
  'generated_local_fixture_passed',
  'hookFactoryInvoked',
  'hookFactoryInvokedInThisGate',
  'hookFactoryInvocationAllowed',
  'mediaProcessing',
  'mediaProcessingAllowed',
  'mediaRead',
  'ocrInference',
  'paidProductionAllowed',
  'productionUnlock',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'runtimeExecution',
  'runtimeExecutionAllowed',
  'runtimeReady',
  'sqlExecution',
  'supabaseMutation',
  'supabaseSql',
  'toolCallReady',
  'toolExecution',
  'tsxProofRun',
  'workerExecution',
  'workerExecutionAllowed',
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

const ownerReview = parseBlock({
  path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-review.md',
  label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-review',
})
assert(ownerReview.decision === SOURCE_DECISION, 'Phase 37K owner review decision mismatch')
assert(ownerReview.sourceVerification.sourcePr === 1633, 'Phase 37K owner review source PR mismatch')
assert(ownerReview.reviewedProof.acceptedForControlledExecutionPlanning === true, 'source did not accept execution planning')
assert(ownerReview.reviewedProof.acceptedForRuntimeExecutionToday === false, 'source widened runtime execution')

const indexText = read(INTEGRATION_TARGET)
const hookText = read(HOOK_SOURCE_PATH)
assert(indexText.includes(`} from '${EXPORT_SOURCE}'`), 'index export block source mismatch')
assert(hookText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'hook factory source missing')
assert(hookText.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'blocked assertion source missing')
for (const symbol of EXPORTS) {
  assert(indexText.includes(symbol), `index missing export ${symbol}`)
}

const plan = parsed.plan
assert(plan.sourceVerification.sourcePr === SOURCE_PR, 'plan source PR mismatch')
assert(plan.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'plan source merge mismatch')
assert(plan.sourceVerification.sourceDecision === SOURCE_DECISION, 'plan source decision mismatch')
assert(plan.controlledExecutionPlan.planOnly === true, 'plan-only marker missing')
assert(plan.controlledExecutionPlan.futureProofMayInvokeHookFactory === true, 'future factory invocation planning missing')
assert(plan.controlledExecutionPlan.futureProofMayInvokeBlockedAssertion === true, 'future assertion planning missing')
assert(plan.controlledExecutionPlan.futureProofRequiresOwnerReviewBeforeExecution === true, 'owner review before proof missing')
assert(plan.controlledExecutionPlan.executionRunInThisGate === false, 'execution ran in planning gate')
assert(plan.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const inputs = parsed.inputs
assert(inputs.futureControlledInputShape.source === 'static synthetic object only', 'synthetic source mismatch')
assert(inputs.futureControlledInputShape.allowedFields.includes('approvedPlanSnapshotId'), 'approved snapshot field missing')
assert(inputs.futureControlledInputShape.blockedFields.includes('mediaBytes'), 'media bytes must be blocked')
assert(inputs.futureControlledInputShape.blockedFields.includes('serviceRoleToken'), 'service-role token must be blocked')
assert(inputs.futureProofAllowedAssertions.factoryReturnsFailClosedResult === true, 'future factory assertion missing')
assert(inputs.executedInThisGate.hookFactoryInvoked === false, 'factory invoked in this gate')

const boundaries = parsed.boundaries
assert(boundaries.futureProofBoundary.mayInvokeFailClosedHookFactory === true, 'future factory boundary missing')
assert(boundaries.futureProofBoundary.mustNotReadMedia === true, 'media-read ban missing')
assert(boundaries.futureProofBoundary.mustNotTouchSupabaseOrSql === true, 'Supabase ban missing')
assert(boundaries.currentGateBoundary.planOnly === true, 'current gate plan-only missing')
assert(boundaries.currentGateBoundary.runtimeExecutionAllowed === false, 'current gate runtime widened')

const proofDesign = parsed.proofDesign
assert(proofDesign.futureProofDesign.temporaryProofFileAllowed === true, 'future temp proof allowance missing')
assert(proofDesign.futureProofDesign.deleteTemporaryProofFileBeforeStaging === true, 'future cleanup requirement missing')
assert(proofDesign.futureProofDesign.executionAllowanceRequiresOwnerReview === true, 'future execution owner review missing')
assert(proofDesign.currentGateNoExecution.hookFactoryInvoked === false, 'proof design executed factory')
assert(proofDesign.currentGateNoExecution.tsxProofRun === false, 'proof design ran tsx proof')

const blockers = parsed.blockers
assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase37l_controlled_execution_plan_pending'),
  'Phase 37L planning blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37l_controlled_execution_plan_owner_review_pending'),
  'Phase 37L owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37m_controlled_execution_proof_pending'),
  'Phase 37M proof blocker missing',
)

const claims = parsed.claims
assert(claims.allowedClaims.phase37LControlledExecutionPlanCompleted === true, 'plan completion claim missing')
assert(claims.allowedClaims.ownerReviewRequiredBeforeExecutionProof === true, 'owner review claim missing')
assert(claims.blockedClaims.runtimeExecution === false, 'runtime claim widened')
assert(claims.noScopeStatement.includes('planned a future fail-closed controlled execution proof only'), 'no-scope phrase missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'owner review prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'owner review prompt source head mismatch')
assert(prompt.reviewFocus.noSupabaseSql === true, 'owner prompt Supabase review focus missing')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[PACKAGE_SCRIPT] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      sourcePr: SOURCE_PR,
      sourceMergeCommit: SOURCE_MERGE_COMMIT,
      controlledExecutionPlanMayProceed: true,
      executionRunInThisGate: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
