#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37k_caption_render_runtime_hook_controlled_static_import_proof_owner_review_passed_with_warnings_ready_for_controlled_execution_plan_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37k_caption_render_runtime_hook_controlled_static_import_proof_passed_with_warnings_ready_for_import_proof_owner_review_no_execution'
const SOURCE_PR = 1633
const SOURCE_MERGE_COMMIT = 'e45255d62760f76d7c48a0652f7ba43353843093'
const PROOF_UPSTREAM_SOURCE_PR = 1628
const PROOF_UPSTREAM_SOURCE_MERGE_COMMIT = 'c61b0b13dfd012465e4c999bac1fca006ec1729d'
const INTEGRATION_TARGET = 'server/workers/sound-cpu/index.ts'
const HOOK_SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const TEMP_PROOF_FILE =
  'server/workers/sound-cpu/phase37k-caption-render-runtime-hook-controlled-static-import-proof.tmp.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37L-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-EXECUTION-PLAN'
const PACKAGE_SCRIPT =
  'worker-runtime-jobs:sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-review:diagnostics'
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
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-safety-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-safety-register',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-execution-plan-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-execution-plan-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForBlockedAssertionInvocationToday',
  'acceptedForHookFactoryInvocationToday',
  'acceptedForMediaProcessingToday',
  'acceptedForPaidProductionToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForRouteExecutionToday',
  'acceptedForRuntimeExecutionToday',
  'acceptedForToolExecutionToday',
  'acceptedForWorkerExecutionToday',
  'artifactCreation',
  'betaUnlock',
  'blockedAssertionInvocation',
  'blockedAssertionInvoked',
  'blockedAssertionInvocationAllowed',
  'captionRenderRuntimeExecution',
  'dockerOrGcpExecution',
  'dry_run_passed',
  'executionMayRunInNextGate',
  'generated_local_fixture_passed',
  'hookFactoryInvocation',
  'hookFactoryInvoked',
  'hookFactoryInvocationAllowed',
  'mediaProcessing',
  'ocrInference',
  'paidProductionAllowed',
  'productionUnlock',
  'providerCalls',
  'providerModelCall',
  'realOcrInference',
  'realUserMediaBetaAllowed',
  'renderExecution',
  'routeExecution',
  'runtimeExecution',
  'runtimeExecutionAllowed',
  'runtimeReady',
  'sqlExecution',
  'supabaseMutation',
  'supabaseSql',
  'toolCallReady',
  'toolExecution',
  'workerDispatch',
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

function walk(path, matches = []) {
  if (!existsSync(path)) return matches
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const next = join(path, entry.name)
    if (entry.isDirectory()) {
      walk(next, matches)
    } else if (entry.name.includes('phase37k-caption-render-runtime-hook-controlled-static-import-proof.tmp')) {
      matches.push(next)
    }
  }
  return matches
}

const parsed = Object.fromEntries(Object.entries(FILES).map(([key, info]) => [key, parseBlock(info)]))

for (const [key, doc] of Object.entries(parsed)) {
  if (key === 'prompt') {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
    assert(doc.requiredSourceDecision === DECISION, `${key} required source decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, key)
  } else {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
    assert(doc.decision === DECISION, `${key} decision mismatch`)
    if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  }
  scanFalse(doc, [key])
}

const proof = parseBlock({
  path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-result.md',
  label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-result',
})
assert(proof.decision === SOURCE_DECISION, 'Phase 37K proof source decision mismatch')
assert(proof.sourceVerification.sourcePr === PROOF_UPSTREAM_SOURCE_PR, 'Phase 37K proof upstream source PR mismatch')
assert(
  proof.sourceVerification.sourceMergeCommit === PROOF_UPSTREAM_SOURCE_MERGE_COMMIT,
  'Phase 37K proof upstream source merge mismatch',
)
assert(proof.proofResult.temporaryProofFileRemovedBeforeStaging === true, 'temporary proof cleanup missing')
assert(proof.proofResult.importedSymbolCount === EXPORTS.length, 'proof export count mismatch')
assert(proof.proofResult.expectedCommandPassed === true, 'npx tsc proof not accepted')
assert(proof.proofResult.serverTypecheckPassed === true, 'server typecheck proof not accepted')

assert(!existsSync(TEMP_PROOF_FILE), 'temporary proof file must be absent')
assert(walk('server/workers/sound-cpu').length === 0, 'temporary proof file remnant found')

const indexText = read(INTEGRATION_TARGET)
const hookText = read(HOOK_SOURCE_PATH)
assert(indexText.includes(`} from '${EXPORT_SOURCE}'`), 'index export block source mismatch')
assert(hookText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'hook factory source missing')
assert(hookText.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'blocked assertion source missing')
for (const symbol of EXPORTS) {
  assert(indexText.includes(symbol), `index missing export ${symbol}`)
}
assert(!/createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult\s*\(/.test(indexText), 'index must not call hook factory')
assert(!/assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked\s*\(/.test(indexText), 'index must not call blocked assertion')

const review = parsed.review
assert(review.sourceVerification.sourcePr === SOURCE_PR, 'review source PR mismatch')
assert(review.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'review source merge mismatch')
assert(review.sourceVerification.sourceDecision === SOURCE_DECISION, 'review source decision mismatch')
assert(review.reviewedProof.acceptedForControlledExecutionPlanning === true, 'controlled execution planning acceptance missing')
assert(review.reviewedProof.acceptedForRuntimeExecutionToday === false, 'runtime execution widened')
assert(review.selectedNextPrompt === NEXT_PROMPT, 'review next prompt mismatch')
assertSupabaseNoop(review.supabaseClassification, 'review')

const acceptance = parsed.acceptance
assert(acceptance.acceptedEvidence.sourcePr === SOURCE_PR, 'acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.importedSymbolCount === EXPORTS.length, 'acceptance symbol count mismatch')
assert(acceptance.acceptedForNextGateOnly.controlledExecutionPlanMayProceed === true, 'next-gate acceptance missing')
assert(acceptance.acceptedForNextGateOnly.planMustRemainNoExecution === true, 'plan no-execution requirement missing')
assert(acceptance.rejectedForToday.includes('hook factory invocation'), 'hook factory rejection missing')

const safety = parsed.safety
assert(safety.sourceSafetyEvidence.hookExportsRemainStatic === true, 'static export safety missing')
assert(safety.sourceSafetyEvidence.hookSourceRemainsFailClosed === true, 'fail-closed safety missing')
assert(safety.closedExecutionSurface.workerExecution === false, 'worker execution widened')
assert(safety.readinessClaims.realUserMediaBetaAllowed === false, 'beta readiness widened')

const readiness = parsed.readiness
assert(readiness.planReadiness.controlledExecutionPlanMayProceed === true, 'controlled execution plan readiness missing')
assert(readiness.planReadiness.executionMayRunInNextGate === false, 'next gate cannot run execution')
assert(readiness.planReadiness.mustRequireExplicitOwnerReviewBeforeAnyExecutionProof === true, 'owner review before execution proof missing')
assert(readiness.requiredPlanInputs.ownerReviewDecision === DECISION, 'readiness owner decision mismatch')

const blockers = parsed.blockers
assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase37k_import_proof_owner_review_pending'),
  'owner review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37l_controlled_execution_plan_pending'),
  'Phase 37L blocker missing',
)
assertSupabaseNoop(blockers.supabaseClassification, 'blockers')

const claims = parsed.claims
assert(claims.allowedClaims.phase37KControlledStaticImportProofOwnerReviewPassed === true, 'owner-review allowed claim missing')
assert(claims.allowedClaims.controlledExecutionPlanMayProceed === true, 'controlled execution planning claim missing')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness widened')
assert(claims.noScopeStatement.includes('static import proof evidence only'), 'no-scope owner-review clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'Phase 37L prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'Phase 37L prompt source head mismatch')
assert(prompt.allowedInPlanningGate.runtimeExecutionAllowed === false, 'Phase 37L runtime execution widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[PACKAGE_SCRIPT] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      sourcePr: SOURCE_PR,
      sourceMergeCommit: SOURCE_MERGE_COMMIT,
      acceptedForControlledExecutionPlanning: true,
      runtimeExecution: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
