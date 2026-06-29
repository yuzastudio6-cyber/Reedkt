#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37j_caption_render_runtime_hook_static_integration_source_owner_review_passed_with_warnings_ready_for_controlled_static_import_proof_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37j_caption_render_runtime_hook_static_integration_source_created_with_warnings_ready_for_source_owner_review_no_execution'
const SOURCE_PR = 1625
const SOURCE_MERGE_COMMIT = '7809828ff16bb0f676c501a790a5b8e68aaabdae'
const INTEGRATION_TARGET = 'server/workers/sound-cpu/index.ts'
const HOOK_SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37K-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-STATIC-IMPORT-PROOF'
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
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-safety-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-safety-register',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-controlled-static-import-proof-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-controlled-static-import-proof-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForPaidProductionToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForRenderExecutionToday',
  'acceptedForRuntimeExecutionToday',
  'acceptedForWorkerExecutionToday',
  'artifactCreation',
  'artifactCreationApprovedToday',
  'blockedAssertionCalledInThisGate',
  'blockedAssertionInvocationAllowed',
  'callBlockedAssertion',
  'callHookFactory',
  'captionRenderRuntimeHookExecution',
  'captionRenderRuntimeHookExecutionApprovedToday',
  'controlledStaticImportProofRunInThisGate',
  'dockerBuildRunPush',
  'dry_run_passed',
  'executeRoutes',
  'executeTools',
  'executeWorkers',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'hookFactoryCalledInThisGate',
  'hookFactoryInvocationAllowed',
  'mediaByteProcessing',
  'mediaProcessing',
  'ocrInference',
  'ownerReviewCreatedImportProof',
  'ownerReviewImportedIndex',
  'ownerReviewRanImportProof',
  'paidProductionAllowed',
  'processMedia',
  'providerModelCall',
  'proofMayCallBlockedAssertion',
  'proofMayCallHookFactory',
  'proofMayExecuteWorkers',
  'proofMayProcessMedia',
  'realUserMediaBetaAllowed',
  'renderExecution',
  'routeExecution',
  'runtimeExecutionAllowed',
  'runtimeHookExecutionApprovedToday',
  'runtimeReady',
  'sqlExecution',
  'staticImportProofCreatedInThisGate',
  'staticImportProofRunInThisGate',
  'supabaseMutation',
  'toolCallReady',
  'toolExecution',
  'touchSupabaseOrSql',
  'workerExecution',
  'workerExecutionApprovedToday',
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
    assert(doc.requiredSourceDecision === DECISION, `${key} required source decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, key)
  } else {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
    assert(doc.decision === DECISION, `${key} decision mismatch`)
    if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  }
  scanFalse(doc, [key])
}

const indexText = read(INTEGRATION_TARGET)
const sourceText = read(HOOK_SOURCE_PATH)
assert(sourceText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'hook blocked result source missing')
assert(sourceText.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'hook blocked assertion source missing')
assert(indexText.includes(`} from '${EXPORT_SOURCE}'`), 'index export block source mismatch')
for (const symbol of EXPORTS) {
  assert(indexText.includes(symbol), `index missing export ${symbol}`)
}
assert(!/createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult\s*\(/.test(indexText), 'index must not call hook factory')
assert(!/assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked\s*\(/.test(indexText), 'index must not call blocked assertion')

const review = parsed.review
assert(review.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(review.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(review.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(review.reviewedSource.integrationTarget === INTEGRATION_TARGET, 'review target mismatch')
assert(review.reviewedSource.hookSourcePath === HOOK_SOURCE_PATH, 'review hook path mismatch')
assert(review.reviewedSource.acceptedForControlledStaticImportProof === true, 'controlled proof acceptance missing')
assert(review.reviewedSource.indexExportSourceCreated === true, 'index source creation not accepted')
assert(review.reviewedSource.exportedSymbolCount === EXPORTS.length, 'review export count mismatch')
assert(review.reviewedSource.staticImportProofRunInThisGate === false, 'owner review ran proof')
assert(review.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assertSupabaseNoop(review.supabaseClassification, 'review')

const acceptance = parsed.acceptance
assert(acceptance.acceptedForControlledStaticImportProofOnly.integrationTarget === INTEGRATION_TARGET, 'acceptance target mismatch')
assert(acceptance.acceptedForControlledStaticImportProofOnly.expectedImportedSymbolCount === EXPORTS.length, 'acceptance symbol count mismatch')
assert(acceptance.acceptedForControlledStaticImportProofOnly.proofMayImportIndex === true, 'proof import allowance missing')
assert(acceptance.acceptedForControlledStaticImportProofOnly.proofMayTypecheckOnly === true, 'typecheck-only allowance missing')
for (const symbol of EXPORTS) {
  assert(acceptance.acceptedExportedSymbols.includes(symbol.replace(/^type /, '')), `acceptance missing ${symbol}`)
}
assert(acceptance.rejectedForToday.includes('controlled static import proof execution in this owner-review gate'), 'proof rejection missing')

const safety = parsed.safety
assert(safety.sourceEvidence.phase37jSourceDecision === SOURCE_DECISION, 'safety source decision mismatch')
assert(safety.sourceEvidence.phase37jSourcePr === SOURCE_PR, 'safety source PR mismatch')
assert(safety.sourceEvidence.phase37jSourceMergeCommit === SOURCE_MERGE_COMMIT, 'safety source merge mismatch')
assert(safety.reviewedSourceProperties.indexExportBlockPresent === true, 'index export block review missing')
assert(safety.reviewedSourceProperties.exportsOnlyAcceptedHookSymbols === true, 'accepted symbol review missing')
assert(safety.reviewedSourceProperties.hookSourceRemainsFailClosed === true, 'fail-closed review missing')
assert(safety.forbiddenExecutionSurface.ocrInference === false, 'OCR execution widened')
assert(safety.readinessClaims.realUserMediaBetaAllowed === false, 'beta claim widened')

const readiness = parsed.readiness
assert(readiness.controlledStaticImportProofMayProceed.createTemporaryImportProofFile === true, 'temp proof file allowance missing')
assert(readiness.controlledStaticImportProofMayProceed.importFromSoundCpuIndex === true, 'index import allowance missing')
assert(readiness.controlledStaticImportProofMayProceed.runTypecheckOnly === true, 'typecheck allowance missing')
assert(readiness.controlledStaticImportProofMayProceed.callHookFactory === false, 'hook factory call widened')
assert(readiness.expectedProofInputs.expectedExportedSymbolCount === EXPORTS.length, 'expected proof export count mismatch')
assert(readiness.proofNotRunInThisGate === true, 'proof not run marker missing')

const blockers = parsed.blockers
assert(
  blockers.resolvedForOwnerReview.some((row) => row.blockerId === 'phase37j_static_integration_source_owner_review_pending'),
  'source owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37k_controlled_static_import_proof_pending'),
  'Phase 37K proof blocker missing',
)
assertSupabaseNoop(blockers.supabaseClassification, 'blockers')

const claims = parsed.claims
assert(claims.allowedClaims.phase37JStaticIntegrationSourceOwnerReviewCompleted === true, 'owner-review allowed claim missing')
assert(claims.allowedClaims.controlledStaticImportProofMayProceed === true, 'controlled proof allowed claim missing')
assert(claims.blockedClaims.controlledStaticImportProofRunInThisGate === false, 'proof run claim widened')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness widened')
assert(claims.noScopeStatement.includes('Phase 37J source owner review accepted only a future controlled static import/typecheck proof'), 'no-scope clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'Phase 37K prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'Phase 37K prompt source head mismatch')
assert(prompt.integrationTarget === INTEGRATION_TARGET, 'Phase 37K prompt target mismatch')
assert(prompt.hookSourcePath === HOOK_SOURCE_PATH, 'Phase 37K prompt hook path mismatch')
assert(prompt.allowedProof.typecheckOnly === true, 'Phase 37K typecheck proof missing')
assert(prompt.allowedProof.runtimeExecutionAllowed === false, 'Phase 37K runtime execution widened')

const sourceResult = read('docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-result.md')
assert(sourceResult.includes(SOURCE_DECISION), 'Phase 37J source result decision missing')
assert(sourceResult.includes(INTEGRATION_TARGET), 'Phase 37J source target missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: SOURCE_PR,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  integrationTarget: INTEGRATION_TARGET,
  hookSourcePath: HOOK_SOURCE_PATH,
  acceptedForControlledStaticImportProof: true,
  staticImportProofRunInThisGate: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
