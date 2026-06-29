#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_model_gpu_evaluation_blocker_routing_after_launch_core_recheck_completed_with_warnings_ready_for_evaluation_only_policy_closure_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_readiness_recheck_after_signalsmith_bounded_reconciliation_completed_with_warnings_ready_for_model_gpu_evaluation_blocker_routing_no_runtime'
const SOURCE_HEAD = '9341b5ebf75179a50a9c193df163fb72ee66e235'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-EVALUATION-ONLY-PRODUCTION-SELECTION-POLICY-AFTER-MODEL-GPU-ROUTING'

const FILES = {
  routing: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck.md',
    label: 'worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck',
  },
  tools: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-tool-register.md',
    label: 'worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-tool-register',
  },
  lanes: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-existing-lane-register.md',
    label: 'worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-existing-lane-register',
  },
  next: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-next-closure-register.md',
    label: 'worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-next-closure-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-policy-after-model-gpu-routing.md',
    label: 'worker-runtime-jobs-sound-cpu-evaluation-only-production-selection-policy-after-model-gpu-routing',
  },
}

const FALSE_FIELDS = new Set([
  'allToolsReadyForToolCalls',
  'allToolsReadyForExecution',
  'artifactCreation',
  'createNewAiGraphicsLaneNow',
  'createNewAiVideoLaneNow',
  'createNewGpuRuntimeLaneNow',
  'createNewModelWeightLaneNow',
  'createNewQwenLaneNow',
  'dockerBuildRunPush',
  'dry_run_passed',
  'externalBetaOrProductionUnlockApprovedToday',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'mediaProcessing',
  'modelDownload',
  'modelWeightApproval',
  'modelWeightMount',
  'paidProductionAllowed',
  'productionReady',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'sqlExecution',
  'supabaseMutation',
  'toolExecution',
  'workerExecution',
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

const sourceDoc = read('docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation.md')
assert(sourceDoc.includes(SOURCE_DECISION), 'source launch-core recheck decision missing')
assert(sourceDoc.includes('"hardBlockers": 63'), 'source hard blocker count missing')
assert(sourceDoc.includes('"realUserMediaBetaAllowed": false'), 'source real-user beta block missing')

const promptSource = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck.md')
assert(promptSource.includes(SOURCE_DECISION), 'source prompt missing required decision')
assert(promptSource.includes('do not create a duplicate closure packet'), 'source prompt missing duplicate policy')

for (const existing of [
  'docs/production-model-weight-readiness-plan.md',
  'docs/production-gpu-model-weight-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-model-weight-blocker-register-after-launch-core-tool-readiness-closure.md',
  'docs/production-tool-install-matrix.md',
]) {
  read(existing)
}

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

const routing = parsed.routing
assert(routing.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(routing.sourceBase.sourcePr === 1545, 'source PR mismatch')
assert(routing.sourceBase.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(routing.routingSummary.hardBlockers === 63, 'hard blocker count mismatch')
assert(routing.routingSummary.warnings === 26, 'warning count mismatch')
assert(routing.routingSummary.genericMissingToolStatusCount === 0, 'generic missing count mismatch')
assert(routing.routingSummary.modelGpuBlockersRoutedToExistingOwnerLanes === true, 'model/GPU routing flag missing')
assert(routing.routingSummary.evaluationOnlyPolicySelectedAsNextSoundCpuClosure === true, 'evaluation-only selection flag missing')
assert(routing.selectedNextPrompt === NEXT_PROMPT, 'selected next prompt mismatch')

const tools = parsed.tools
assert(tools.currentReadiness.tools === 49, 'production tool count mismatch')
assert(tools.currentReadiness.toolStatusCounts.warning === 14, 'warning count mismatch')
assert(tools.currentReadiness.toolStatusCounts.not_installed === 13, 'not_installed count mismatch')
assert(tools.currentReadiness.toolStatusCounts.future_only === 7, 'future_only count mismatch')
assert(tools.currentReadiness.toolStatusCounts.evaluation_only === 3, 'evaluation_only count mismatch')
assert(tools.currentReadiness.toolStatusCounts.needs_license_review === 2, 'needs_license_review count mismatch')
assert(tools.currentReadiness.toolStatusCounts.needs_model_weight_review === 10, 'needs_model_weight_review count mismatch')
assert(tools.currentReadiness.toolStatusCounts.missing === 0, 'missing count mismatch')
for (const tool of MODEL_WEIGHT_TOOLS) {
  assert(tools.modelWeightBlockerTools.includes(tool), `missing model-weight tool ${tool}`)
}
for (const tool of EVALUATION_ONLY_TOOLS) {
  assert(tools.evaluationOnlyTools.includes(tool), `missing evaluation-only tool ${tool}`)
}
assert(tools.routingDisposition.soundCpuEvaluationOnlyPolicy === 'selected_next_non_duplicate_closure', 'routing disposition mismatch')

const lanes = parsed.lanes
assert(lanes.liveGithubDuplicateReview.exactSamePurposeOpenPrCount === 0, 'exact duplicate PR count mismatch')
assert(lanes.liveGithubDuplicateReview.qwenOpenPrMatches >= 1, 'QWEN lane evidence missing')
assert(lanes.liveGithubDuplicateReview.aiBrollOpenPrMatches >= 1, 'AI B-roll lane evidence missing')
assert(lanes.liveGithubDuplicateReview.aiGraphicsOpenPrMatches >= 1, 'AI graphics lane evidence missing')
for (const pr of [1542, 962, 856, 833]) {
  assert(lanes.representativeExistingLanes.some((entry) => entry.representativeOpenPr === pr), `representative PR ${pr} missing`)
}
assert(lanes.routingConclusion.createSoundCpuEvaluationOnlyPolicyLaneNext === true, 'next lane flag mismatch')

const next = parsed.next
assert(next.selectedNextClosure.prompt === NEXT_PROMPT, 'next closure prompt mismatch')
for (const tool of EVALUATION_ONLY_TOOLS) {
  assert(next.selectedNextClosure.targetTools.includes(tool), `next closure target missing ${tool}`)
}
assert(next.deferredClosures.length === 4, 'deferred closure count mismatch')

const claims = parsed.claims
assert(claims.allowedClaims.sourcePr1545Merged === true, 'source claim missing')
assert(claims.allowedClaims.duplicateModelGpuLaneAvoided === true, 'duplicate avoidance claim missing')
assert(claims.allowedClaims.evaluationOnlyPolicySelectedNext === true, 'evaluation-only next claim missing')

const prompt = parsed.prompt
for (const tool of EVALUATION_ONLY_TOOLS) {
  assert(prompt.targetTools.includes(tool), `prompt target missing ${tool}`)
}
assert(prompt.scope.blocked.includes('model download'), 'prompt model download boundary missing')
assert(prompt.scope.blocked.includes('real-user media beta unlock'), 'prompt real-user beta boundary missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      hardBlockers: 63,
      warnings: 26,
      routedToExistingLanes: {
        qwenRepresentativePr: 1542,
        aiBrollRepresentativePr: 962,
        aiGraphicsRepresentativePrs: [856, 833],
      },
      selectedNextPrompt: NEXT_PROMPT,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
