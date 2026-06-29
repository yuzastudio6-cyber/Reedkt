#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_ocr_activation_chain_reconciliation_after_source_readiness_completed_with_warnings_ready_for_phase37f_caption_render_runtime_hook_plan_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_paddleocr_source_readiness_adjustment_after_activation_merge_completed_with_warnings_ready_for_generated_ocr_runtime_verification_no_runtime'
const SOURCE_MERGE_COMMIT = '36d7787bd2c92d0f2a1e441a97bb7dae5a585a97'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37F-CAPTION-RENDER-RUNTIME-HOOK-PLAN-AFTER-OCR-CHAIN-RECONCILIATION'
const PHASE_37C_RUN = 'phase37c-20260530T230413'
const PHASE_37D_RUN = 'phase37d-20260531T002046'
const PHASE_37E_RUN = 'phase37e-20260531T011259'
const AGGREGATE_SHA = '6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b'

const FILES = {
  reconciliation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ocr-activation-chain-reconciliation-after-source-readiness.md',
    label: 'worker-runtime-jobs-sound-cpu-ocr-activation-chain-reconciliation-after-source-readiness',
  },
  evidence: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ocr-activation-chain-evidence-register-after-source-readiness.md',
    label: 'worker-runtime-jobs-sound-cpu-ocr-activation-chain-evidence-register-after-source-readiness',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-ocr-activation-chain-claim-policy-after-source-readiness.md',
    label: 'worker-runtime-jobs-sound-cpu-ocr-activation-chain-claim-policy-after-source-readiness',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-plan-after-ocr-chain-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-plan-after-ocr-chain-reconciliation',
  },
}

const FALSE_FIELDS = new Set([
  'arbitraryMediaOcr',
  'artifactCreation',
  'artifactCreationInThisPrompt',
  'broadRealVideoOcr',
  'captionRenderRuntimeHookExecution',
  'captionRenderRuntimeHookExecutionApprovedToday',
  'dockerBuildRunPush',
  'dry_run_passed',
  'fullVideoOcr',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'mediaProcessingInThisPrompt',
  'ocrRuntimeExecutionInThisPrompt',
  'overlayUpload',
  'paidProductionAllowed',
  'phase37FMayExecuteRuntime',
  'phase37FRuntimeExecution',
  'providerModelCall',
  'rawFrameUpload',
  'realUserMediaBetaAllowed',
  'renderExecution',
  'routeExecution',
  'runtimeReady',
  'sqlExecution',
  'supabaseMutation',
  'toolCallReady',
  'toolExecution',
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
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  if (key === 'prompt') {
    assert(doc.requiredSourceDecision === DECISION, `${key} required source decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, key)
  } else {
    assert(doc.decision === DECISION, `${key} decision mismatch`)
    if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  }
  scanFalse(doc, [key])
}

const sourceReadiness = read('docs/worker-runtime-jobs-sound-cpu-paddleocr-source-readiness-adjustment-after-activation-merge.md')
assert(sourceReadiness.includes(SOURCE_DECISION), 'source-readiness decision missing')
assert(sourceReadiness.includes('"sourcePr": 1578'), 'source-readiness PR reference missing')

const ocrRuntimeEvidence = read('server/activation/ocr-runtime/approved-ocr-runtime-evidence.ts')
assert(ocrRuntimeEvidence.includes(PHASE_37C_RUN), 'Phase 37C run id missing')
assert(ocrRuntimeEvidence.includes(AGGREGATE_SHA), 'Phase 37C aggregate SHA missing')
assert(ocrRuntimeEvidence.includes('readyForControlledRealVideoOcrSafeZone: true'), 'Phase 37C readiness handoff missing')

const controlledEvidence = read('server/activation/controlled-real-video-ocr-safe-zone/approved-controlled-real-video-ocr-execution-evidence.ts')
assert(controlledEvidence.includes(PHASE_37D_RUN), 'Phase 37D run id missing')
assert(controlledEvidence.includes('frameCount: 6'), 'Phase 37D frame count missing')
assert(controlledEvidence.includes('totalTextRegionCount: 11'), 'Phase 37D text region count missing')
assert(controlledEvidence.includes('readyForControlledCaptionRenderQaPlanning: true'), 'Phase 37D readiness handoff missing')

const captionEvidence = read('server/activation/ocr-caption-render-qa/approved-ocr-caption-render-qa-evidence.ts')
assert(captionEvidence.includes(PHASE_37E_RUN), 'Phase 37E run id missing')
assert(captionEvidence.includes('framesChecked: 9'), 'Phase 37E frame count missing')
assert(captionEvidence.includes('textRegionCount: 16'), 'Phase 37E text region count missing')
assert(captionEvidence.includes('readyForCaptionRenderRuntimeHookPlanning: true'), 'Phase 37E readiness handoff missing')

const reconciliation = parsed.reconciliation
assert(reconciliation.sourcePr === 1586, 'source PR mismatch')
assert(reconciliation.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(reconciliation.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assert(reconciliation.duplicatePrevention.phase37CNewPrNeeded === false, 'Phase 37C duplicate prevention mismatch')
assert(reconciliation.duplicatePrevention.phase37DNewPrNeeded === false, 'Phase 37D duplicate prevention mismatch')
assert(reconciliation.duplicatePrevention.phase37ENewPrNeeded === false, 'Phase 37E duplicate prevention mismatch')
assert(reconciliation.duplicatePrevention.phase37FOpenPrFound === false, 'Phase 37F duplicate prevention mismatch')
assert(reconciliation.mergedActivationChain.length === 4, 'merged activation chain count mismatch')

const evidence = parsed.evidence.evidence
assert(evidence.phase37C.mergeCommit === 'b9882b3998f1e37242ec06fba564fce4d5b4cd72', 'PR #56 merge commit mismatch')
assert(evidence.phase37DMetadataGate.mergeCommit === 'a1442dcd8ba34bec09eb294f64c4570a0afb5169', 'PR #57 merge commit mismatch')
assert(evidence.phase37DControlledExecution.mergeCommit === 'f2bae41ce5d7d163bcaa2de27435469b581d30d8', 'PR #59 merge commit mismatch')
assert(evidence.phase37ECaptionRenderQa.mergeCommit === '36746d84f5562334a59a3fd4f7c4add2612cd024', 'PR #61 merge commit mismatch')
assert(parsed.evidence.readiness.phase37FMayBePlanned === true, 'Phase 37F planning should be allowed')

const claims = parsed.claims
assert(claims.allowedClaims.phase37CGeneratedOcrRuntimeEvidenceMerged === true, 'Phase 37C claim missing')
assert(claims.allowedClaims.phase37DControlledSafeZoneMetadataGateMerged === true, 'Phase 37D metadata claim missing')
assert(claims.allowedClaims.phase37DControlledPrivateSampleExecutionEvidenceMerged === true, 'Phase 37D execution claim missing')
assert(claims.allowedClaims.phase37ECaptionRenderQaMetadataEvidenceMerged === true, 'Phase 37E claim missing')
assert(claims.allowedClaims.phase37FPlanningMayProceed === true, 'Phase 37F planning claim missing')

const prompt = parsed.prompt
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'prompt source head mismatch')
assert(prompt.acceptedEvidence.phase37CPr === 56, 'prompt Phase 37C PR mismatch')
assert(prompt.blocked.includes('caption/render runtime execution'), 'prompt missing caption/render execution block')
assert(prompt.blocked.includes('real-user media beta unlock'), 'prompt missing beta block')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-ocr-activation-chain-reconciliation-after-source-readiness:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-ocr-activation-chain-reconciliation-after-source-readiness-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: 1586,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  mergedPrs: [56, 57, 59, 61],
  phase37CRun: PHASE_37C_RUN,
  phase37DRun: PHASE_37D_RUN,
  phase37ERun: PHASE_37E_RUN,
  nextPrompt: NEXT_PROMPT,
  phase37FMayBePlanned: true,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
}, null, 2))
