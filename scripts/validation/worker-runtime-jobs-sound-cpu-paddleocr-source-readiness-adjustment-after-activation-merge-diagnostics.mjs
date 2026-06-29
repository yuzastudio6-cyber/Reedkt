#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_paddleocr_source_readiness_adjustment_after_activation_merge_completed_with_warnings_ready_for_generated_ocr_runtime_verification_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_paddleocr_activation_lane_reconciliation_after_model_license_live_refresh_completed_with_warnings_ready_for_activation_merge_hygiene_no_runtime'
const SOURCE_HEAD = 'bcc5010e1bac2bcdee5aaa4182c4e61b50f30e2a'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-GENERATED-OCR-RUNTIME-VERIFICATION-PLAN-AFTER-PADDLEOCR-SOURCE-READINESS'
const AGGREGATE_SHA = '6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b'

const FILES = {
  adjustment: {
    path: 'docs/worker-runtime-jobs-sound-cpu-paddleocr-source-readiness-adjustment-after-activation-merge.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-source-readiness-adjustment-after-activation-merge',
  },
  delta: {
    path: 'docs/worker-runtime-jobs-sound-cpu-paddleocr-source-readiness-delta-register-after-activation-merge.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-source-readiness-delta-register-after-activation-merge',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-paddleocr-source-readiness-claim-policy-after-activation-merge.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-source-readiness-claim-policy-after-activation-merge',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-generated-ocr-runtime-verification-plan-after-paddleocr-source-readiness.md',
    label: 'worker-runtime-jobs-sound-cpu-generated-ocr-runtime-verification-plan-after-paddleocr-source-readiness',
  },
}

const FALSE_FIELDS = new Set([
  'artifactCreation',
  'captionRenderIntegration',
  'dockerBuildRunPush',
  'dry_run_passed',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'mediaProcessing',
  'ocrInference',
  'ocrInferenceApprovedToday',
  'ocrRuntimeExecution',
  'paidProductionAllowed',
  'providerModelCall',
  'realMediaOcr',
  'realMediaOcrAllowed',
  'realMediaOcrApprovedToday',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'runtimeExecutionAllowed',
  'runtimeExecutionApprovedToday',
  'runtimeReady',
  'runtimeServiceAccountMountApproved',
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
  if (value === null || value === undefined || typeof value !== 'object') return
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

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-paddleocr-activation-lane-reconciliation-after-model-license-live-refresh.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'source reconciliation decision missing')
const manifest = read('server/model-weights/model-weight-manifest-templates.ts')
assert(manifest.includes("toolId: 'paddleocr'"), 'PaddleOCR manifest missing')
assert(manifest.includes("modelVersion: 'paddle3.0.0-mobile-safe-zone-v1'"), 'PaddleOCR model version missing')
assert(manifest.includes("license: 'Apache-2.0'"), 'PaddleOCR license missing')
assert(manifest.includes("commercialUseAllowed: true"), 'PaddleOCR commercial use flag missing')
assert(manifest.includes("reviewStatus: 'approved'"), 'PaddleOCR approved model-weight review status missing')
assert(manifest.includes(AGGREGATE_SHA), 'PaddleOCR aggregate SHA evidence missing')
assert(read('server/workers/readiness-validation/production-readiness-report-builder.ts').includes('toolBlocksProduction(tool)'), 'image model-weight blocker filtering not updated')
assert(read('server/workers/production-readiness/production-tool-readiness-runner.ts').includes('buildProductionApprovedModelWeightToolSet'), 'approved model-weight tool set missing')

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

const adjustment = parsed.adjustment
assert(adjustment.sourcePr === 1578, 'source PR mismatch')
assert(adjustment.sourceMergeCommit === SOURCE_HEAD, 'source merge commit mismatch')
assert(adjustment.activationEvidence.pr51MergeCommit === '5772c2276878c712a3b29a7e2718e449fecf1a81', 'PR #51 merge commit mismatch')
assert(adjustment.activationEvidence.pr53MergeCommit === 'e7294ff44cbb7382759311972a141b5c8631bad1', 'PR #53 merge commit mismatch')
assert(adjustment.activationEvidence.selectedAssetAggregateSha256 === AGGREGATE_SHA, 'aggregate SHA mismatch')
assert(adjustment.sourceAdjustment.paddleocrToolReadinessStatus === 'warning', 'PaddleOCR status mismatch')
assert(adjustment.sourceAdjustment.paddleocrModelWeightHardBlockerRemoved === true, 'PaddleOCR blocker removal claim missing')
assert(adjustment.sourceAdjustment.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assert(adjustment.expectedReadinessDelta.hardBlockersAfter === 47, 'hard blocker delta mismatch')
assert(adjustment.expectedReadinessDelta.warningsAfter === 32, 'warning delta mismatch')
assert(adjustment.expectedReadinessDelta.modelWeightBlockersAfter === 7, 'model-weight blocker delta mismatch')

const delta = parsed.delta
assert(delta.readinessDelta.hardBlockers === 47, 'delta hard blocker count mismatch')
assert(delta.readinessDelta.warnings === 32, 'delta warning count mismatch')
assert(delta.readinessDelta.modelWeightBlockers === 7, 'delta model-weight blocker count mismatch')
assert(delta.readinessDelta.statusCounts.warning === 15, 'warning status count mismatch')
assert(delta.readinessDelta.statusCounts.needs_model_weight_review === 9, 'needs_model_weight_review count mismatch')
assert(delta.readinessDelta.cpuAnalysisWorker.productionAllowed === true, 'CPU worker should be unblocked by PaddleOCR source adjustment')
assert(delta.readinessDelta.paddleocr.status === 'warning', 'PaddleOCR delta status mismatch')

const claims = parsed.claims
assert(claims.allowedClaims.paddleocrModelWeightStaticEvidenceApproved === true, 'static evidence claim missing')
assert(claims.allowedClaims.generatedOcrRuntimeVerificationMayBePlanned === true, 'next gate planning claim missing')

const prompt = parsed.prompt
assert(prompt.sourceHeadAtPromptCreation === SOURCE_HEAD, 'prompt source head mismatch')
assert(prompt.blocked.includes('OCR inference'), 'prompt missing OCR inference block')
assert(prompt.blocked.includes('real-user media beta unlock'), 'prompt missing beta block')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-paddleocr-source-readiness-adjustment-after-activation-merge:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-paddleocr-source-readiness-adjustment-after-activation-merge-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: 1578,
  sourceMergeCommit: SOURCE_HEAD,
  paddleocrStatus: delta.readinessDelta.paddleocr.status,
  hardBlockers: delta.readinessDelta.hardBlockers,
  warnings: delta.readinessDelta.warnings,
  modelWeightBlockers: delta.readinessDelta.modelWeightBlockers,
  nextPrompt: NEXT_PROMPT,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
}, null, 2))
