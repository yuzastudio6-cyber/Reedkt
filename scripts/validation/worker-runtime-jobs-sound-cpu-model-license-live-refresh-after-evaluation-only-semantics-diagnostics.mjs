#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_model_license_live_refresh_after_evaluation_only_semantics_completed_with_warnings_ready_for_paddleocr_activation_lane_reconciliation_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_remaining_blocker_selection_after_evaluation_only_semantics_completed_with_warnings_ready_for_model_license_live_refresh_no_runtime'
const SOURCE_MERGE_COMMIT = 'c87f969cdfb5212ad402bbdf83e96d750e0f8613'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PADDLEOCR-ACTIVATION-LANE-RECONCILIATION-AFTER-MODEL-LICENSE-LIVE-REFRESH'

const FILES = {
  refresh: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-live-refresh-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-live-refresh-after-evaluation-only-semantics',
  },
  weights: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-live-model-weight-register-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-live-model-weight-register-after-evaluation-only-semantics',
  },
  licenses: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-live-license-register-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-live-license-register-after-evaluation-only-semantics',
  },
  adjacent: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-live-adjacent-lane-register-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-live-adjacent-lane-register-after-evaluation-only-semantics',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-license-live-claim-policy-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-live-claim-policy-after-evaluation-only-semantics',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-paddleocr-activation-lane-reconciliation-after-model-license-live-refresh.md',
    label: 'worker-runtime-jobs-sound-cpu-paddleocr-activation-lane-reconciliation-after-model-license-live-refresh',
  },
}

const MODEL_WEIGHT_TOOLS = [
  'faster_whisper',
  'whisper_cpp',
  'paddleocr',
  'mediapipe',
  'birefnet',
  'sam2',
  'transparent_background',
  'rembg',
  'deepfilternet',
  'demucs',
  'real_esrgan',
  'film',
]

const LICENSE_TOOLS = ['rubber_band', 'essentia']
const EVALUATION_ONLY_TOOLS = ['whisper_cpp', 'transparent_background', 'revideo']
const ADJACENT_PRS = [51, 53, 1542, 962, 856, 833]

const FALSE_FIELDS = new Set([
  'artifactCreation',
  'createDuplicateAdjacentLane',
  'createNewAiBrollLane',
  'createNewAiGraphicsLane',
  'createNewDownloadLane',
  'createNewGpuLane',
  'createNewQwenLane',
  'createNewRuntimeLane',
  'dockerBuildRunPush',
  'dry_run_passed',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'licenseApprovalGranted',
  'licenseApprovalGrantedToday',
  'mediaProcessing',
  'mergeAdjacentPrs',
  'modelDownload',
  'modelDownloadApprovedToday',
  'modelWeightMount',
  'modelWeightMountApprovedToday',
  'mutateAdjacentPrs',
  'paidProductionAllowed',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'retargetAdjacentPrs',
  'routeExecution',
  'runtimeExecutionApprovedToday',
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

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value?.sqlExecuted === 'no', `${label} SQL execution mismatch`)
  assert(value?.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value?.nextAction === 'none', `${label} Supabase next action mismatch`)
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

function includesAll(actual, expected, label) {
  for (const item of expected) assert(actual.includes(item), `${label} missing ${item}`)
}

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-selection-after-evaluation-only-semantics.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'source decision missing from remaining blocker selection doc')
assert(sourceDoc.includes('paddleocr_model_weight_missing'), 'source doc missing PaddleOCR blocker')

const sourcePrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-model-license-live-refresh-after-evaluation-only-semantics.md',
)
assert(sourcePrompt.includes(SOURCE_DECISION), 'source prompt missing required source decision')
assert(sourcePrompt.includes('inspect open PRs'), 'source prompt missing duplicate-lane inspection rule')

const parsed = Object.fromEntries(Object.entries(FILES).map(([key, info]) => [key, parseBlock(info)]))

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  if (key === 'prompt') {
    assert(doc.requiredSourceDecision === DECISION, `${key} required source decision mismatch`)
  } else {
    assert(doc.decision === DECISION, `${key} decision mismatch`)
  }
  if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  scanFalse(doc, [key])
}

const refresh = parsed.refresh
assert(refresh.sourcePr === 1571, 'source PR mismatch')
assert(refresh.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(refresh.refreshResult.liveReadinessRefreshed === true, 'live readiness refresh claim missing')
assert(refresh.refreshResult.modelLicenseBlockersStillLive === true, 'model/license blocker live claim missing')
assert(refresh.refreshResult.selectedNextPrompt === NEXT_PROMPT, 'selected next prompt mismatch')
assert(refresh.liveReadinessSnapshot.tools === 49, 'tool count mismatch')
assert(refresh.liveReadinessSnapshot.hardBlockers === 57, 'hard blocker count mismatch')
assert(refresh.liveReadinessSnapshot.warnings === 32, 'warning count mismatch')
assert(refresh.liveReadinessSnapshot.modelWeightBlockers === 8, 'model-weight blocker count mismatch')

const weights = parsed.weights
includesAll(weights.modelWeightBlockerTools, MODEL_WEIGHT_TOOLS, 'modelWeightBlockerTools')
assert(weights.primaryCpuWorkerBlocker.toolId === 'paddleocr', 'primary CPU blocker must be paddleocr')
assert(weights.primaryCpuWorkerBlocker.status === 'needs_model_weight_review', 'PaddleOCR status mismatch')
assert(weights.primaryCpuWorkerBlocker.worker === 'cpu_analysis_worker', 'PaddleOCR worker mismatch')
includesAll(weights.primaryCpuWorkerBlocker.existingLanePrs, [51, 53], 'PaddleOCR existing lane PRs')
includesAll(weights.gpuAndAdjacentModelBlockers.representativeExistingPrs, [1542, 962, 856, 833], 'adjacent model PRs')

const licenses = parsed.licenses
assert(licenses.licenseReviewStatusCounts.needs_license_review === 2, 'needs_license_review count mismatch')
assert(licenses.licenseReviewStatusCounts.needs_model_weight_review === 10, 'needs_model_weight_review count mismatch')
includesAll(
  licenses.licenseReviewTools.map((tool) => tool.toolId),
  LICENSE_TOOLS,
  'license review tools',
)
includesAll(
  licenses.evaluationOnlyTools.map((tool) => tool.toolId),
  EVALUATION_ONLY_TOOLS,
  'evaluation-only tools',
)

const adjacent = parsed.adjacent
assert(adjacent.samePurposeOpenPrCount === 0, 'same-purpose duplicate count mismatch')
includesAll(
  adjacent.adjacentOwnerLanes.map((lane) => lane.pr),
  ADJACENT_PRS,
  'adjacent owner lanes',
)
assert(adjacent.reconciliationPolicy.selectedNextLane === 'paddleocr_activation_lane_reconciliation', 'selected lane mismatch')

const claims = parsed.claims
assert(claims.allowedClaims.sourcePr1571Merged === true, 'source PR claim missing')
assert(claims.allowedClaims.liveModelLicenseBlockersRefreshed === true, 'refresh claim missing')
assert(claims.allowedClaims.paddleocrSelectedForEvidenceReconciliation === true, 'PaddleOCR claim missing')
assert(claims.allowedClaims.duplicateModelLaneAvoided === true, 'duplicate avoidance claim missing')

const prompt = parsed.prompt
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'prompt source head mismatch')
assert(prompt.goal.includes('PR #51') && prompt.goal.includes('PR #53'), 'prompt missing PaddleOCR PR references')
assert(prompt.requiredLiveChecks.includes('re-query PR #51 and PR #53 read-only'), 'prompt missing read-only PR check')
assert(prompt.scope.blocked.includes('model download'), 'prompt missing model download block')
assert(prompt.scope.blocked.includes('real-user media beta unlock'), 'prompt missing beta unlock block')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-model-license-live-refresh-after-evaluation-only-semantics:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-model-license-live-refresh-after-evaluation-only-semantics-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourcePr: 1571,
      sourceMergeCommit: SOURCE_MERGE_COMMIT,
      hardBlockers: refresh.liveReadinessSnapshot.hardBlockers,
      warnings: refresh.liveReadinessSnapshot.warnings,
      primaryCpuWorkerBlocker: weights.primaryCpuWorkerBlocker.toolId,
      adjacentOwnerLanes: ADJACENT_PRS,
      selectedNextPrompt: NEXT_PROMPT,
      duplicateModelLaneCreated: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
