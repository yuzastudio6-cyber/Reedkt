#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37f_caption_render_runtime_hook_plan_after_ocr_chain_reconciliation_completed_with_warnings_ready_for_runtime_hook_owner_review_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_ocr_activation_chain_reconciliation_after_source_readiness_completed_with_warnings_ready_for_phase37f_caption_render_runtime_hook_plan_no_runtime'
const SOURCE_MERGE_COMMIT = '4f4fe6b48ebf710a0ac3e766f873a4377bf9a090'
const NEXT_PROMPT = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37F-CAPTION-RENDER-RUNTIME-HOOK-OWNER-REVIEW'

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-plan-after-ocr-chain-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-plan-after-ocr-chain-reconciliation',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37f-caption-render-hook-contract-register-after-ocr-chain-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37f-caption-render-hook-contract-register-after-ocr-chain-reconciliation',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37f-runtime-claim-policy-after-ocr-chain-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37f-runtime-claim-policy-after-ocr-chain-reconciliation',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-owner-review',
  },
}

const FALSE_FIELDS = new Set([
  'artifactCreation',
  'captionRenderRuntimeHookExecution',
  'captionRenderRuntimeHookExecutionApprovedToday',
  'dockerBuildRunPush',
  'dry_run_passed',
  'frameExtraction',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'mediaByteProcessing',
  'ocrInference',
  'ocrRuntimeExecution',
  'paidProductionAllowed',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'remotionRenderWorkerExecution',
  'renderExecution',
  'renderExecutionApprovedToday',
  'routeExecution',
  'runtimeHookImplementation',
  'runtimeHookImplementationApprovedToday',
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

const reconciliation = read('docs/worker-runtime-jobs-sound-cpu-ocr-activation-chain-reconciliation-after-source-readiness.md')
assert(reconciliation.includes(SOURCE_DECISION), 'source reconciliation decision missing')
assert(reconciliation.includes('"sourcePr": 1586'), 'source reconciliation PR reference missing')

const captionEvidence = read('server/activation/ocr-caption-render-qa/approved-ocr-caption-render-qa-evidence.ts')
assert(captionEvidence.includes("runId: 'phase37e-20260531T011259'"), 'Phase 37E run id missing')
assert(captionEvidence.includes('framesChecked: 9'), 'Phase 37E frame count missing')
assert(captionEvidence.includes('textRegionCount: 16'), 'Phase 37E text region count missing')
assert(captionEvidence.includes('readyForCaptionRenderRuntimeHookPlanning: true'), 'Phase 37F readiness source missing')
assert(captionEvidence.includes('does not call Remotion, render workers, or Track A runtime modules'), 'Phase 37E runtime boundary warning missing')

const plan = parsed.plan
assert(plan.sourcePr === 1590, 'source PR mismatch')
assert(plan.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(plan.plannedHook.hookName === 'ocrCaptionRenderSafeZonePlanningHook', 'hook name mismatch')
assert(plan.plannedHook.hookMode === 'planning_only', 'hook mode mismatch')
assert(plan.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const contract = parsed.contract.contract
assert(contract.acceptedInputCategories.includes('normalizedOcrRegionBoxes'), 'contract missing OCR box input')
assert(contract.acceptedInputCategories.includes('hashedOcrRegionIds'), 'contract missing hashed region input')
assert(contract.plannedOutputCategories.includes('captionSafeZoneConstraintSet'), 'contract missing constraint output')
assert(contract.placeholderPolicies.artifactWrites === 'blocked', 'artifact placeholder policy mismatch')
assert(contract.rejectedInputs.includes('rawFrames'), 'contract must reject raw frames')
assert(contract.rejectedInputs.includes('rawOcrTextFromControlledMedia'), 'contract must reject raw controlled OCR text')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37f-caption-render-runtime-hook-plan-after-ocr-chain-reconciliation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-plan-after-ocr-chain-reconciliation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: 1590,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  hookName: plan.plannedHook.hookName,
  nextPrompt: NEXT_PROMPT,
  runtimeHookImplementationApprovedToday: false,
  renderExecutionApprovedToday: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
}, null, 2))
