#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase42_caption_render_runtime_hook_blocked_state_controlled_execution_plan_completed_with_warnings_ready_for_plan_owner_review_no_media_no_artifacts'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase41_caption_render_runtime_hook_blocked_state_static_import_proof_owner_review_passed_with_warnings_ready_for_controlled_execution_plan_no_media_no_artifacts'
const SOURCE_PR = 1752
const SOURCE_MERGE_COMMIT = '62756b0eed1b1297a009e5dbd05bdde5e5796601'
const UPSTREAM_PROOF_PR = 1748
const UPSTREAM_PROOF_MERGE_COMMIT = '45621e40eb942a2d7b08153cfb8a5b6fc9dd38e5'
const IMPORT_TARGET = 'server/workers/sound-cpu/index.ts'
const RUNTIME_INTEGRATION_SOURCE =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE42-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-CONTROLLED-EXECUTION-PLAN-OWNER-REVIEW'
const FUTURE_PROOF_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE43-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-CONTROLLED-EXECUTION-PROOF'
const TEMP_PROOF_FILE =
  'server/workers/sound-cpu/phase43-caption-render-runtime-hook-blocked-state-controlled-execution-proof.tmp.ts'
const PACKAGE_SCRIPT =
  'worker-runtime-jobs:sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan:diagnostics'
const SCRIPT_COMMAND =
  'node scripts/validation/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-diagnostics.mjs'
const EXPORT_SOURCE =
  './runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const EXPORTED_SYMBOLS = [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked',
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
  'type SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationInput',
  'type SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationResult',
]

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan',
  },
  inputs: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-input-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-input-register',
  },
  boundaries: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-boundary-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-boundary-register',
  },
  proofDesign: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-proof-design.md',
    label: 'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-proof-design',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-review.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-review',
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
  'blockedResultFactoryInvoked',
  'blockedResultFactoryInvokedInThisGate',
  'blockedResultFactoryInvocationAllowed',
  'captionRenderRuntimeExecution',
  'dockerOrGcpExecution',
  'dry_run_passed',
  'executionRunInThisGate',
  'generated_local_fixture_passed',
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

const sourceReview = parseBlock({
  path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-review.md',
  label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-review',
})
assert(sourceReview.decision === SOURCE_DECISION, 'Phase 41 owner review decision mismatch')
assert(sourceReview.sourceVerification.sourcePr === UPSTREAM_PROOF_PR, 'Phase 41 owner review upstream PR mismatch')
assert(
  sourceReview.sourceVerification.sourceMergeCommit === UPSTREAM_PROOF_MERGE_COMMIT,
  'Phase 41 owner review upstream merge mismatch',
)
assert(sourceReview.reviewedProof.acceptedForControlledExecutionPlanning === true, 'source did not permit planning')
assert(sourceReview.reviewedProof.acceptedForRuntimeExecutionToday === false, 'source widened runtime execution')
assert(
  sourceReview.reviewedProof.acceptedForBlockedResultFactoryInvocationToday === false,
  'source widened factory invocation',
)
assert(
  sourceReview.reviewedProof.acceptedForBlockedAssertionInvocationToday === false,
  'source widened assertion invocation',
)

const previousReadiness = parseBlock({
  path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-controlled-execution-plan-readiness-register.md',
  label:
    'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-controlled-execution-plan-readiness-register',
})
assert(previousReadiness.decision === SOURCE_DECISION, 'Phase 41 readiness source mismatch')
assert(previousReadiness.planReadiness.controlledExecutionPlanMayProceed === true, 'Phase 41 readiness blocked planning')
assert(previousReadiness.planReadiness.executionMayRunInNextGate === false, 'Phase 41 readiness widened execution')
assert(
  previousReadiness.planReadiness.mustRequireExplicitOwnerReviewBeforeAnyExecutionProof === true,
  'Phase 41 readiness owner review guard missing',
)

const indexText = read(IMPORT_TARGET)
const runtimeText = read(RUNTIME_INTEGRATION_SOURCE)
assert(indexText.includes(`} from '${EXPORT_SOURCE}'`), 'index export block source mismatch')
for (const symbol of EXPORTED_SYMBOLS) {
  assert(indexText.includes(symbol), `index missing export ${symbol}`)
  assert(runtimeText.includes(symbol.replace('type ', '')), `runtime source missing ${symbol}`)
}
assert(
  runtimeText.includes('createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult'),
  'runtime integration factory source missing',
)
assert(
  runtimeText.includes('assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked'),
  'runtime integration blocked assertion source missing',
)
assert(runtimeText.includes("blockedStatus: 'blocked_by_owner_gate'"), 'blocked status missing')
for (const field of [
  'runtimeExecutionApproved: false',
  'workerExecutionApproved: false',
  'renderExecutionApproved: false',
  'mediaProcessingApproved: false',
  'artifactCreationApproved: false',
  'supabaseSqlApproved: false',
  'routeToolProviderApproved: false',
  'noArtifactCreated: true',
]) {
  assert(runtimeText.includes(field), `runtime integration fail-closed field missing: ${field}`)
}
assert(!existsSync(TEMP_PROOF_FILE), 'Phase 43 temporary proof file must not exist in Phase 42')

const plan = parsed.plan
assert(plan.sourceVerification.sourcePr === SOURCE_PR, 'plan source PR mismatch')
assert(plan.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'plan source merge mismatch')
assert(plan.sourceVerification.sourceDecision === SOURCE_DECISION, 'plan source decision mismatch')
assert(plan.sourceVerification.upstreamProofPr === UPSTREAM_PROOF_PR, 'plan upstream proof PR mismatch')
assert(
  plan.sourceVerification.upstreamProofMergeCommit === UPSTREAM_PROOF_MERGE_COMMIT,
  'plan upstream proof merge mismatch',
)
assert(plan.controlledExecutionPlan.planOnly === true, 'plan-only marker missing')
assert(
  plan.controlledExecutionPlan.futureProofMayInvokeRuntimeIntegrationBlockedResultFactory === true,
  'future factory planning missing',
)
assert(
  plan.controlledExecutionPlan.futureProofMayInvokeRuntimeIntegrationBlockedAssertion === true,
  'future assertion planning missing',
)
assert(plan.controlledExecutionPlan.futureProofRequiresOwnerReviewBeforeExecution === true, 'owner review before proof missing')
assert(plan.controlledExecutionPlan.executionRunInThisGate === false, 'execution ran in planning gate')
assert(plan.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const inputs = parsed.inputs
assert(inputs.futureControlledInputShape.source === 'static synthetic object only', 'synthetic source mismatch')
assert(inputs.futureControlledInputShape.allowedFields.includes('approvedPlanSnapshotId'), 'approved snapshot field missing')
assert(inputs.futureControlledInputShape.allowedFields.includes('runtimeIntegrationPlanId'), 'runtime integration plan field missing')
assert(inputs.futureControlledInputShape.allowedFields.includes('blockedStateIntegrationPlanId'), 'blocked state plan field missing')
assert(inputs.futureControlledInputShape.blockedFields.includes('mediaBytes'), 'media bytes must be blocked')
assert(inputs.futureControlledInputShape.blockedFields.includes('serviceRoleToken'), 'service-role token must be blocked')
assert(inputs.futureProofAllowedAssertions.factoryReturnsFailClosedResult === true, 'future factory assertion missing')
assert(inputs.executedInThisGate.blockedResultFactoryInvoked === false, 'factory invoked in this gate')

const boundaries = parsed.boundaries
assert(boundaries.futureProofBoundary.mayInvokeFailClosedRuntimeIntegrationFactory === true, 'future factory boundary missing')
assert(boundaries.futureProofBoundary.mustNotReadMedia === true, 'media-read ban missing')
assert(boundaries.futureProofBoundary.mustNotTouchSupabaseOrSql === true, 'Supabase ban missing')
assert(boundaries.currentGateBoundary.planOnly === true, 'current gate plan-only missing')
assert(boundaries.currentGateBoundary.runtimeExecutionAllowed === false, 'current gate runtime widened')

const proofDesign = parsed.proofDesign
assert(proofDesign.futureProofDesign.futurePrompt === FUTURE_PROOF_PROMPT, 'future proof prompt mismatch')
assert(proofDesign.futureProofDesign.temporaryProofFile === TEMP_PROOF_FILE, 'future temp proof mismatch')
assert(proofDesign.futureProofDesign.temporaryProofFileAllowed === true, 'future temp proof allowance missing')
assert(proofDesign.futureProofDesign.deleteTemporaryProofFileBeforeStaging === true, 'future cleanup requirement missing')
assert(proofDesign.futureProofDesign.executionAllowanceRequiresOwnerReview === true, 'future execution owner review missing')
assert(proofDesign.currentGateNoExecution.blockedResultFactoryInvoked === false, 'proof design executed factory')
assert(proofDesign.currentGateNoExecution.tsxProofRun === false, 'proof design ran tsx proof')

const blockers = parsed.blockers
assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase42_controlled_execution_plan_pending'),
  'Phase 42 planning blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase42_controlled_execution_plan_owner_review_pending'),
  'Phase 42 owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase43_controlled_execution_proof_pending'),
  'Phase 43 proof blocker missing',
)

const claims = parsed.claims
assert(claims.allowedClaims.phase42ControlledExecutionPlanCompleted === true, 'plan completion claim missing')
assert(claims.allowedClaims.ownerReviewRequiredBeforeExecutionProof === true, 'owner review claim missing')
assert(claims.blockedClaims.runtimeExecution === false, 'runtime claim widened')
assert(claims.noScopeStatement.includes('planned only a future no-media/no-artifact controlled execution proof'), 'no-scope phrase missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'owner review prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'owner review prompt source head mismatch')
assert(prompt.reviewFocus.noSupabaseSql === true, 'owner prompt Supabase review focus missing')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.[PACKAGE_SCRIPT] === SCRIPT_COMMAND, 'package diagnostics script missing')

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
