#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_remaining_blocker_selection_after_evaluation_only_semantics_completed_with_warnings_ready_for_model_license_live_refresh_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_evaluation_only_readiness_semantics_source_change_owner_review_passed_with_warnings_ready_for_next_blocker_reduction_no_runtime'
const SOURCE_HEAD = '4fa4d9b0e854542b9061be22570ae90974d41a79'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-MODEL-LICENSE-LIVE-REFRESH-AFTER-EVALUATION-ONLY-SEMANTICS'

const FILES = {
  selection: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-selection-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-selection-after-evaluation-only-semantics',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-live-readiness-register-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-live-readiness-register-after-evaluation-only-semantics',
  },
  duplicates: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-duplicate-lane-register-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-duplicate-lane-register-after-evaluation-only-semantics',
  },
  next: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-selected-next-step-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-selected-next-step-after-evaluation-only-semantics',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-claim-policy-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-claim-policy-after-evaluation-only-semantics',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-model-license-live-refresh-after-evaluation-only-semantics.md',
    label: 'worker-runtime-jobs-sound-cpu-model-license-live-refresh-after-evaluation-only-semantics',
  },
}

const FALSE_FIELDS = new Set([
  'artifactCreation',
  'createDuplicateAiBrollLane',
  'createDuplicateAiGraphicsLane',
  'createDuplicatePaddleocrLane',
  'createDuplicateQwenLane',
  'dockerBuildRunPush',
  'dockerBuild',
  'dockerPush',
  'dockerRun',
  'dry_run_passed',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'licenseApprovalGranted',
  'licenseApprovalGrantedToday',
  'mediaProcessing',
  'modelDownload',
  'modelWeightMount',
  'paidProductionAllowed',
  'productionAllowed',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'runtimeReady',
  'safeToCreateDuplicateGpuLane',
  'safeToCreateDuplicateModelWeightLane',
  'safeToCreateDuplicatePaddleocrLane',
  'sqlExecution',
  'supabaseMutation',
  'toolCallReady',
  'toolExecution',
  'workerExecution',
  'workerReady',
])

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
  assert(value?.sqlExecuted === 'no', `${label} SQL mismatch`)
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

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-evaluation-only-readiness-semantics-source-change-owner-review.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'source owner-review decision missing')

const sourcePrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-selection-after-evaluation-only-semantics.md',
)
assert(sourcePrompt.includes(SOURCE_DECISION), 'selection source prompt missing required decision')
assert(sourcePrompt.includes('inspect current readiness summary before choosing'), 'selection source prompt missing live-readiness rule')

const reportBuilder = read('server/workers/readiness-validation/production-readiness-report-builder.ts')
assert(reportBuilder.includes('evaluation_only_static_visibility'), 'evaluation-only warning semantics missing')

const specs = read('server/workers/production-readiness/production-tool-readiness-specs.ts')
assert(specs.includes('blocksProductionIfMissing'), 'readiness specs missing production blocking expression')

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

const selection = parsed.selection
assert(selection.sourcePr === 1564, 'source PR mismatch')
assert(selection.sourceMergeCommit === SOURCE_HEAD, 'source merge commit mismatch')
assert(selection.liveReadinessSnapshot.hardBlockers === 57, 'hard blocker count mismatch')
assert(selection.liveReadinessSnapshot.warnings === 32, 'warning count mismatch')
assert(selection.selectionResult.launchCoreGenericMissingBlockerRemaining === false, 'generic launch-core missing blocker mismatch')
assert(selection.selectionResult.cpuWorkerHardBlocker === 'paddleocr_model_weight_missing', 'CPU hard blocker mismatch')
assert(selection.selectionResult.selectedNextPrompt === NEXT_PROMPT, 'selected next prompt mismatch')

const readiness = parsed.readiness
assert(readiness.readinessSnapshot.tools === 49, 'tool count mismatch')
assert(readiness.readinessSnapshot.modelWeightBlockers === 8, 'model-weight blocker count mismatch')
assert(readiness.readinessSnapshot.toolStatusCounts.warning === 14, 'warning status count mismatch')
assert(readiness.readinessSnapshot.toolStatusCounts.not_installed === 13, 'not_installed status count mismatch')
assert(readiness.readinessSnapshot.toolStatusCounts.future_only === 7, 'future_only status count mismatch')
assert(readiness.readinessSnapshot.toolStatusCounts.evaluation_only === 3, 'evaluation_only status count mismatch')
assert(readiness.readinessSnapshot.toolStatusCounts.needs_license_review === 2, 'needs_license_review status count mismatch')
assert(readiness.readinessSnapshot.toolStatusCounts.needs_model_weight_review === 10, 'needs_model_weight_review status count mismatch')
assert(readiness.workerSnapshot.cpu_analysis_worker.blockedTools.includes('paddleocr'), 'PaddleOCR CPU blocker missing')
for (const tool of MODEL_WEIGHT_TOOLS) {
  assert(readiness.remainingHardBlockerTools.modelWeightTools.includes(tool), `missing model-weight tool ${tool}`)
}
for (const tool of LICENSE_TOOLS) {
  assert(readiness.remainingHardBlockerTools.licenseReviewTools.includes(tool), `missing license tool ${tool}`)
}
for (const tool of EVALUATION_ONLY_TOOLS) {
  assert(readiness.remainingHardBlockerTools.evaluationOnlyVisibleTools.includes(tool), `missing evaluation-only tool ${tool}`)
}

const duplicates = parsed.duplicates
assert(duplicates.exactSamePurposeOpenPrCount === 0, 'same-purpose duplicate count mismatch')
for (const pr of [51, 53, 1542, 962, 856, 833]) {
  assert(duplicates.representativeAdjacentLanes.some((entry) => entry.pr === pr), `representative adjacent PR ${pr} missing`)
}
assert(duplicates.routingConclusion.safeToCreateLiveModelLicenseRefreshPacket === true, 'refresh packet selection missing')

const next = parsed.next
assert(next.selectedNextStep.prompt === NEXT_PROMPT, 'next-step prompt mismatch')
assert(next.deferredWork.length === 4, 'deferred work count mismatch')
assert(next.readinessClaim.boundedExternalBetaScorecardAllowed === true, 'bounded scorecard claim mismatch')
assert(next.readinessClaim.realUserMediaBetaAllowed === false, 'real-user media beta must remain false')

const claims = parsed.claims
assert(claims.allowedClaims.sourcePr1564Merged === true, 'source PR allowed claim missing')
assert(claims.allowedClaims.nextModelLicenseLiveRefreshSelected === true, 'next refresh claim missing')
assert(claims.blockedClaims.realUserMediaBetaAllowed === false, 'real-user media beta blocked claim mismatch')
assert(claims.blockedClaims.toolCallReady === false, 'tool-call readiness blocked claim mismatch')

const prompt = parsed.prompt
assert(prompt.sourceHeadAtPromptCreation === SOURCE_HEAD, 'prompt source head mismatch')
assert(prompt.liveSelectionSource.hardBlockers === 57, 'prompt hard blocker count mismatch')
assert(prompt.liveSelectionSource.cpuWorkerHardBlocker === 'paddleocr_model_weight_missing', 'prompt CPU blocker mismatch')
assert(prompt.scope.blocked.includes('model download'), 'prompt model download block missing')
assert(prompt.scope.blocked.includes('real-user media beta unlock'), 'prompt beta unlock block missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-launch-core-remaining-blocker-selection-after-evaluation-only-semantics:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-launch-core-remaining-blocker-selection-after-evaluation-only-semantics-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      sourcePr: 1564,
      hardBlockers: 57,
      warnings: 32,
      cpuWorkerHardBlocker: 'paddleocr_model_weight_missing',
      selectedNextPrompt: NEXT_PROMPT,
      duplicateModelLaneCreated: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
