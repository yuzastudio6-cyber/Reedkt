#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase41_caption_render_runtime_hook_blocked_state_static_import_proof_owner_review_passed_with_warnings_ready_for_controlled_execution_plan_no_media_no_artifacts'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase41_caption_render_runtime_hook_blocked_state_static_import_proof_passed_with_warnings_ready_for_static_import_proof_owner_review_no_media_no_artifacts'
const SOURCE_PR = 1748
const SOURCE_MERGE_COMMIT = '45621e40eb942a2d7b08153cfb8a5b6fc9dd38e5'
const PROOF_UPSTREAM_SOURCE_PR = 1746
const PROOF_UPSTREAM_SOURCE_MERGE_COMMIT = 'f3002b202b961a1ad7a9d9ca48c84fa4ad6a1ae3'
const IMPORT_TARGET = 'server/workers/sound-cpu/index.ts'
const RUNTIME_SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const TEMP_PROOF_FILE =
  'server/workers/sound-cpu/phase41-caption-render-runtime-hook-blocked-state-static-import-proof.tmp.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE42-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-CONTROLLED-EXECUTION-PLAN'
const PACKAGE_SCRIPT =
  'worker-runtime-jobs:sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-review:diagnostics'
const SCRIPT_COMMAND =
  'node scripts/validation/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-review-diagnostics.mjs'

const EXPORTED_SYMBOLS = [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked',
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
  'SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationInput',
  'SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationResult',
]

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-safety-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-safety-register',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-controlled-execution-plan-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-controlled-execution-plan-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForBlockedAssertionInvocationToday',
  'acceptedForBlockedResultFactoryInvocationToday',
  'acceptedForMediaProcessingToday',
  'acceptedForPaidProductionToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForRouteExecutionToday',
  'acceptedForRuntimeExecutionToday',
  'acceptedForToolExecutionToday',
  'acceptedForWorkerExecutionToday',
  'artifactCreation',
  'artifactCreationAllowed',
  'blockedAssertionInvocation',
  'blockedAssertionInvocationAllowed',
  'blockedResultFactoryInvocation',
  'blockedResultFactoryInvocationAllowed',
  'dispatchWiringChanged',
  'dry_run_passed',
  'executionMayRunInNextGate',
  'generated_local_fixture_passed',
  'hookExecution',
  'mediaProcessing',
  'mediaProcessingAllowed',
  'mediaReady',
  'paidProductionAllowed',
  'providerCalls',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'routeExecutionAllowed',
  'runtimeExecution',
  'runtimeExecutionAllowed',
  'runtimeReady',
  'sqlExecution',
  'supabaseMutation',
  'supabaseSql',
  'toolExecution',
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

function walkForTemporaryProof(path, matches = []) {
  if (!existsSync(path)) return matches
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const next = join(path, entry.name)
    if (entry.isDirectory()) {
      walkForTemporaryProof(next, matches)
    } else if (entry.name.includes('phase41-caption-render-runtime-hook-blocked-state-static-import-proof.tmp')) {
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
  path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-result.md',
  label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-result',
})
assert(proof.decision === SOURCE_DECISION, 'Phase 41 proof source decision mismatch')
assert(proof.sourceVerification.sourcePr === PROOF_UPSTREAM_SOURCE_PR, 'Phase 41 proof upstream source PR mismatch')
assert(
  proof.sourceVerification.sourceMergeCommit === PROOF_UPSTREAM_SOURCE_MERGE_COMMIT,
  'Phase 41 proof upstream source merge mismatch',
)
assert(proof.proofResult.temporaryProofFileRemovedBeforeStaging === true, 'temporary proof cleanup missing')
assert(proof.proofResult.importedSymbolCount === EXPORTED_SYMBOLS.length, 'proof import count mismatch')
assert(proof.proofResult.proofCommandPassed === true, 'server typecheck proof not accepted')
assert(proof.proofResult.broadTypecheckPassed === true, 'broad typecheck proof not accepted')

assert(!existsSync(TEMP_PROOF_FILE), 'temporary proof file must be absent')
assert(walkForTemporaryProof('server/workers/sound-cpu').length === 0, 'temporary proof file remnant found')

const indexText = read(IMPORT_TARGET)
const runtimeText = read(RUNTIME_SOURCE_PATH)
assert(
  indexText.includes("from './runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'"),
  'index export block source mismatch',
)
for (const symbol of EXPORTED_SYMBOLS) {
  assert(indexText.includes(symbol), `index missing export ${symbol}`)
  assert(runtimeText.includes(symbol), `runtime source missing ${symbol}`)
}
assert(
  !/createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult\s*\(/.test(indexText),
  'index must not call blocked-result factory',
)
assert(
  !/assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked\s*\(/.test(indexText),
  'index must not call blocked assertion',
)

const review = parsed.review
assert(review.sourceVerification.sourcePr === SOURCE_PR, 'review source PR mismatch')
assert(review.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'review source merge mismatch')
assert(review.sourceVerification.sourceDecision === SOURCE_DECISION, 'review source decision mismatch')
assert(review.reviewedProof.acceptedForControlledExecutionPlanning === true, 'controlled execution planning acceptance missing')
assert(review.reviewedProof.acceptedForRuntimeExecutionToday === false, 'runtime execution widened')
assert(review.selectedNextPrompt === NEXT_PROMPT, 'review next prompt mismatch')

const acceptance = parsed.acceptance
assert(acceptance.acceptedEvidence.sourcePr === SOURCE_PR, 'acceptance source PR mismatch')
assert(acceptance.acceptedEvidence.importedSymbolCount === EXPORTED_SYMBOLS.length, 'acceptance symbol count mismatch')
assert(acceptance.acceptedForNextGateOnly.controlledExecutionPlanMayProceed === true, 'next-gate acceptance missing')
assert(acceptance.acceptedForNextGateOnly.planMustRemainNoExecution === true, 'plan no-execution requirement missing')
assert(acceptance.rejectedForToday.includes('blocked-result factory invocation'), 'blocked-result factory rejection missing')

const safety = parsed.safety
assert(safety.sourceSafetyEvidence.indexExportsRemainStatic === true, 'static export safety missing')
assert(safety.sourceSafetyEvidence.runtimeIntegrationSourceRemainsFailClosed === true, 'fail-closed safety missing')
assert(safety.closedExecutionSurface.workerExecution === false, 'worker execution widened')
assert(safety.readinessClaims.realUserMediaBetaAllowed === false, 'beta readiness widened')

const readiness = parsed.readiness
assert(readiness.planReadiness.controlledExecutionPlanMayProceed === true, 'controlled execution plan readiness missing')
assert(readiness.planReadiness.executionMayRunInNextGate === false, 'next gate cannot run execution')
assert(readiness.planReadiness.mustRequireExplicitOwnerReviewBeforeAnyExecutionProof === true, 'owner review before proof missing')
assert(readiness.requiredPlanInputs.ownerReviewDecision === DECISION, 'readiness owner decision mismatch')
assert(readiness.nextPrompt === NEXT_PROMPT, 'readiness next prompt mismatch')

const blockers = parsed.blockers
assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'static_import_proof_owner_review_pending'),
  'owner review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase42_controlled_execution_plan_pending'),
  'Phase 42 blocker missing',
)
assertSupabaseNoop(blockers.supabaseClassification, 'blockers')

const claims = parsed.claims
assert(claims.allowedClaims.phase41StaticImportProofOwnerReviewPassed === true, 'owner-review allowed claim missing')
assert(claims.allowedClaims.controlledExecutionPlanMayProceed === true, 'controlled execution planning claim missing')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness widened')
assert(claims.noScopeStatement.includes('static import proof evidence only'), 'no-scope owner-review clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'Phase 42 prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'Phase 42 prompt source head mismatch')
assert(prompt.allowedInPlanningGate.runtimeExecutionAllowed === false, 'Phase 42 runtime execution widened')
assert(prompt.allowedInPlanningGate.blockedResultFactoryInvocationAllowed === false, 'Phase 42 factory invocation widened')
assert(prompt.allowedInPlanningGate.blockedAssertionInvocationAllowed === false, 'Phase 42 assertion invocation widened')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.[PACKAGE_SCRIPT] === SCRIPT_COMMAND, 'package diagnostics script missing')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      sourcePr: SOURCE_PR,
      sourceMergeCommit: SOURCE_MERGE_COMMIT,
      acceptedForControlledExecutionPlanning: true,
      runtimeExecution: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
