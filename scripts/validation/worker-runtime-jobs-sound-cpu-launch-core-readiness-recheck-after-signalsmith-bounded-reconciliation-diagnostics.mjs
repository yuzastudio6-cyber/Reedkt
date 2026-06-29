#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_readiness_recheck_after_signalsmith_bounded_reconciliation_completed_with_warnings_ready_for_model_gpu_evaluation_blocker_routing_no_runtime'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_signalsmith_bounded_readiness_reconciliation_completed_with_warnings_ready_for_launch_core_readiness_recheck_no_media_no_production'
const SOURCE_HEAD = '29602c9203d663768525585edd5d7b153a0db8e1'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-MODEL-GPU-EVALUATION-BLOCKER-ROUTING-AFTER-LAUNCH-CORE-RECHECK'

const FILES = {
  recheck: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation',
  },
  toolStatus: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-tool-status-register-after-signalsmith.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-tool-status-register-after-signalsmith',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-remaining-blocker-register-after-signalsmith.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-remaining-blocker-register-after-signalsmith',
  },
  duplicate: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-duplicate-lane-register-after-signalsmith.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-duplicate-lane-register-after-signalsmith',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-claim-policy-after-signalsmith.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-claim-policy-after-signalsmith',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck.md',
    label: 'worker-runtime-jobs-sound-cpu-model-gpu-evaluation-blocker-routing-after-launch-core-recheck',
  },
}

const FALSE_FIELDS = new Set([
  'allToolsReadyForToolCalls',
  'allToolsReadyForExecution',
  'acceptedForProductionToday',
  'acceptedForRealUserMediaBetaToday',
  'artifactCreation',
  'dockerBuildRunPush',
  'dry_run_passed',
  'externalBetaAuthorized',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'mediaProcessing',
  'modelDownload',
  'modelWeightMount',
  'paidProductionAllowed',
  'productionReady',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'sqlExecution',
  'supabaseMutation',
  'toolExecution',
  'workerExecution',
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

const source = read('docs/worker-runtime-jobs-sound-cpu-signalsmith-bounded-readiness-reconciliation.md')
assert(source.includes(SOURCE_DECISION), 'source Signalsmith decision missing')
assert(source.includes('signalsmith_stretch'), 'source Signalsmith tool missing')

const runner = read('server/workers/production-readiness/production-tool-readiness-runner.ts')
for (const marker of [
  'dockerfileBackedSystemPackages',
  'dockerfileBackedPythonRequirementPackages',
  'boundedActivationEvidenceWarningToolIds',
  "['signalsmith_stretch'",
  "['audioflux', 'audioflux==0.1.9']",
  "['ffmpeg', ['ffmpeg']]",
  "['ffprobe', ['ffmpeg']]",
  "['libass', ['libass9', 'fontconfig', 'fonts-dejavu-core']]",
]) {
  assert(runner.includes(marker), `readiness runner missing marker ${marker}`)
}

const parsed = Object.fromEntries(Object.entries(FILES).map(([key, info]) => [key, parseBlock(info)]))

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  if (key === 'prompt') {
    assert(doc.requiredSourceDecision === DECISION, `${key} source decision mismatch`)
  } else {
    assert(doc.decision === DECISION, `${key} decision mismatch`)
  }
  if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  scanFalse(doc, [key])
}

const recheck = parsed.recheck
assert(recheck.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(recheck.sourceBase.sourcePr === 1541, 'source PR mismatch')
assert(recheck.sourceBase.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(recheck.recheckSummary.productionReadinessStatus === 'blocked', 'readiness status must remain blocked')
assert(recheck.recheckSummary.tools === 49, 'tool count mismatch')
assert(recheck.recheckSummary.hardBlockers === 63, 'hard blocker count mismatch')
assert(recheck.recheckSummary.warnings === 26, 'warning count mismatch')
assert(recheck.recheckSummary.genericMissingToolStatusCount === 0, 'generic missing count must be zero')
assert(recheck.recheckSummary.boundedExternalBetaScorecardAllowed === true, 'bounded scorecard should remain allowed')
assert(recheck.recheckSummary.realUserMediaBetaAllowed === false, 'real user media beta must remain blocked')
assert(recheck.recheckSummary.paidProductionAllowed === false, 'paid production must remain blocked')
assert(recheck.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const expectedStatuses = {
  warning: 14,
  not_installed: 13,
  future_only: 7,
  evaluation_only: 3,
  needs_license_review: 2,
  needs_model_weight_review: 10,
}
for (const [status, count] of Object.entries(expectedStatuses)) {
  assert(recheck.toolStatusCounts[status] === count, `recheck status count mismatch ${status}`)
  assert(parsed.toolStatus.toolStatusCounts[status] === count, `tool register status count mismatch ${status}`)
}
assert(parsed.toolStatus.toolStatusCounts.missing === 0, 'tool register missing count must be zero')
assert(parsed.toolStatus.cpuInstallProofScope.directPinnedPackagesCount === 13, 'direct pinned package count mismatch')
assert(parsed.toolStatus.cpuInstallProofScope.aliasCoveredTools.length === 2, 'alias-covered tool count mismatch')
assert(parsed.toolStatus.cpuInstallProofScope.readyForUnboundedToolCallExecutionToday === 0, 'unbounded tool call count must be zero')
assert(parsed.toolStatus.staticWarningEvidence.dockerfileSystemPackageWarnings.includes('ffmpeg'), 'ffmpeg warning missing')
assert(parsed.toolStatus.staticWarningEvidence.dockerfilePipRequirementWarnings.includes('audioflux'), 'audioflux warning missing')
assert(parsed.toolStatus.staticWarningEvidence.boundedActivationEvidenceWarnings.includes('signalsmith_stretch'), 'Signalsmith warning missing')

const blockers = parsed.blockers
assert(blockers.hardBlockers.total === 63, 'blocker total mismatch')
assert(blockers.hardBlockers.byStatus.model_weight_missing === 33, 'model_weight_missing count mismatch')
assert(blockers.hardBlockers.byStatus.evaluation_only === 6, 'evaluation_only count mismatch')
for (const tool of ['faster_whisper', 'paddleocr', 'birefnet', 'sam2', 'deepfilternet', 'demucs', 'real_esrgan', 'film']) {
  assert(blockers.hardBlockers.byTool[tool] === 6, `${tool} blocker count mismatch`)
}
assert(
  blockers.selectedNextClosureClass ===
    'route_model_gpu_evaluation_blockers_without_model_download_or_runtime_execution',
  'selected next closure mismatch',
)

assert(parsed.duplicate.duplicateReview.samePurposeBranchFoundBeforePacket === false, 'same-purpose branch duplicate mismatch')
assert(parsed.duplicate.duplicateReview.samePurposeOpenPrFoundBeforePacket === false, 'same-purpose open PR duplicate mismatch')
assert(parsed.duplicate.adjacentLanePolicy.qwenBackendRuntimePersistenceLanes === 'do_not_duplicate', 'QWEN duplicate policy mismatch')
assert(parsed.duplicate.allowedNextLane.prompt === NEXT_PROMPT, 'duplicate register next prompt mismatch')

assert(parsed.claims.allowedClaims.genericMissingToolStatusCountIsZero === true, 'allowed missing-zero claim missing')
assert(parsed.claims.allowedClaims.boundedExternalBetaScorecardAllowedNoRuntimeNoRealUserMedia === true, 'bounded external beta claim missing')
assert(parsed.claims.blockedClaims.allToolsReadyForToolCalls === false, 'tool-call readiness must remain false')

const prompt = parsed.prompt
assert(prompt.requiredInputs.hardBlockers === 63, 'prompt hard blocker count mismatch')
assert(prompt.requiredInputs.toolStatusCounts.warning === 14, 'prompt warning count mismatch')
assert(prompt.scope.blocked.includes('model download'), 'prompt model download boundary missing')
assert(prompt.scope.blocked.includes('real-user media beta unlock'), 'prompt real-user beta boundary missing')
assert(prompt.requiredDuplicateReview.includes('inspect open QWEN backend/runtime persistence PRs'), 'prompt duplicate review missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-after-signalsmith-bounded-reconciliation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      productionReadinessStatus: 'blocked',
      hardBlockers: 63,
      warnings: 26,
      toolStatuses: expectedStatuses,
      genericMissingToolStatusCount: 0,
      boundedExternalBetaScorecardAllowed: true,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
