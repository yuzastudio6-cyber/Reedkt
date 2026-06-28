#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_source_install_review_after_readiness_reconciliation_passed_with_warnings_ready_for_native_runtime_source_install_review_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_readiness_reconciliation_after_persistent_manifest_review_completed_with_warnings_ready_for_source_install_review_no_runtime_no_production'
const SOURCE_HEAD = 'b3aa7c7d0486b32e44a0bea50c329b22323846b8'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-NATIVE-RUNTIME-SOURCE-INSTALL-REVIEW: review native/runtime-sensitive source installs, no runtime/no production'

const ACCEPTED_TOOLS = ['duckdb', 'polars', 'opentimelineio']
const REMAINING_TOOLS = ['pyav', 'pyscenedetect', 'opencv', 'sharp', 'remotion']

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-install-review-after-readiness-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-source-install-review-after-readiness-reconciliation-result',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-install-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-source-install-acceptance-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-install-remaining-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-source-install-remaining-blocker-register',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-install-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-source-install-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-native-runtime-source-install-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-native-runtime-source-install-review',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-after-persistent-manifest-review.md',
  'server/workers/sound-cpu/requirements.launch-core.txt',
  'package.json',
  'package-lock.json',
]

const MUST_BE_FALSE = [
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'imageProcessingApprovedToday',
  'remotionRenderingApprovedToday',
  'dockerBuildRunPushApprovedToday',
  'gcpCloudRunSecretManagerApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
  'externalProductBetaReady',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'runtimeExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'imageProcessing',
  'remotionRendering',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'externalBetaUnlock',
  'productionUnlock',
]

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
    if (MUST_BE_FALSE.includes(key)) assert(child === false, `${trail.concat(key).join('.')} must remain false`)
    scanFalse(child, trail.concat(key))
  }
}

for (const source of SOURCE_FILES) read(source)

const runner = read('server/workers/production-readiness/production-tool-readiness-runner.ts')
assert(runner.includes('sourceInstallReviewedToolIds'), 'runner missing source install reviewed set')
for (const toolId of ACCEPTED_TOOLS) assert(runner.includes(`'${toolId}'`), `runner missing accepted tool ${toolId}`)
for (const toolId of REMAINING_TOOLS) assert(runner.includes(`'${toolId}'`), `runner missing remaining manifest-backed tool ${toolId}`)
assert(runner.includes("return 'pending_manual_review'"), 'runner must map accepted tools to pending_manual_review')
assert(runner.includes("return 'source_install_review_required'"), 'runner must keep remaining tools source_install_review_required')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.readinessReconciliationPr === 1460, 'source PR mismatch')
assert(result.sourceBase.readinessReconciliationDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.reviewResult.reviewedTargets === 8, 'review target count mismatch')
assert(result.reviewResult.sourceInstallReviewClosedCount === 3, 'closed source-install count mismatch')
assert(result.reviewResult.sourceInstallReviewStillRequiredCount === 5, 'remaining source-install count mismatch')
assert(result.reviewResult.pendingManualReviewCountAfter === 3, 'pending manual count mismatch')
assert(result.reviewResult.sourceInstallReviewRequiredCountAfter === 5, 'source-install count after mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(acceptance.acceptedForPendingManualReview.length === 3, 'accepted tool count mismatch')
for (const toolId of ACCEPTED_TOOLS) {
  assert(acceptance.acceptedForPendingManualReview.some((entry) => entry.toolId === toolId), `missing accepted tool ${toolId}`)
}
assert(Array.isArray(acceptance.acceptedForExecutionToday) && acceptance.acceptedForExecutionToday.length === 0, 'execution acceptance must be empty')

const blockers = parsed.blockers
assert(blockers.sourceInstallReviewStillRequired.length === 5, 'remaining blocker count mismatch')
for (const toolId of REMAINING_TOOLS) {
  assert(blockers.sourceInstallReviewStillRequired.some((entry) => entry.toolId === toolId), `missing remaining tool ${toolId}`)
}
assert(blockers.separateMissingLaunchCoreTargets.includes('ffmpeg'), 'ffmpeg must remain separate')

const claim = parsed.claim
assert(claim.claimConclusion.nativeRuntimeSourceInstallReviewMayProceed === true, 'native source review handoff missing')
assert(claim.claimConclusion.realUserMediaBetaStillBlocked === true, 'real user beta blocker missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.reviewTargets.length === 5, 'prompt review target count mismatch')
assert(prompt.alreadyClosedSourceInstallReview.length === 3, 'prompt closed target count mismatch')
assert(prompt.allowedInNativeRuntimeSourceInstallReview.runtimeExecution === false, 'prompt runtime must remain false')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-source-install-review-after-readiness-reconciliation:diagnostics'],
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      readinessReconciliationPr: 1460,
      sourceInstallReviewClosedCount: 3,
      sourceInstallReviewStillRequiredCount: 5,
      pendingManualReviewCountAfter: 3,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
