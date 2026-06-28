#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_readiness_reconciliation_after_persistent_manifest_review_completed_with_warnings_ready_for_source_install_review_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_owner_review_after_source_creation_passed_with_warnings_ready_for_readiness_reconciliation_no_runtime_no_production'
const SOURCE_HEAD = '965f0ae5d00ea562ef139ebb45dc32c08039691a'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-SOURCE-INSTALL-REVIEW-AFTER-READINESS-RECONCILIATION: review source-install readiness blockers, no runtime/no production'

const MANIFEST_BACKED_TOOLS = [
  'pyav',
  'pyscenedetect',
  'opencv',
  'duckdb',
  'polars',
  'opentimelineio',
  'sharp',
  'remotion',
]

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-after-persistent-manifest-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-after-persistent-manifest-review-result',
  },
  status: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-status-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-status-register',
  },
  delta: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-blocker-delta-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-blocker-delta-register',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-runtime-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-source-install-review-after-readiness-reconciliation.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-source-install-review-after-readiness-reconciliation',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-owner-review-after-source-creation.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-acceptance-register-after-source-creation.md',
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
assert(runner.includes('source_install_review_required'), 'runner must map manifest-backed tools to source_install_review_required')
assert(runner.includes('manifestBackedPythonPackages'), 'runner missing Python manifest-backed map')
assert(runner.includes('manifestBackedNodePackages'), 'runner missing Node manifest-backed map')
assert(runner.includes("baseStatus === 'missing' || baseStatus === 'not_installed'"), 'runner missing missing/not_installed reconciliation')

const types = read('server/workers/production-readiness/production-tool-readiness-types.ts')
assert(types.includes("| 'source_install_review_required'"), 'production readiness status type missing source_install_review_required')
const summary = read('server/workers/production-readiness/production-tool-readiness-summary.ts')
assert(summary.includes("'source_install_review_required'"), 'tool readiness summary missing source_install_review_required')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))

for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.manifestOwnerReviewPr === 1455, 'source owner review PR mismatch')
assert(result.sourceBase.manifestOwnerReviewDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.reconciliationResult.persistentManifestEntriesRecognized === 8, 'persistent manifest count mismatch')
assert(result.reconciliationResult.sourceInstallReviewRequiredCount === 8, 'source-install review count mismatch')
assert(result.reconciliationResult.hardBlockersBefore === 101, 'hard blocker before mismatch')
assert(result.reconciliationResult.hardBlockersAfter === 84, 'hard blocker after mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const status = parsed.status
assert(status.manifestBackedSourceInstallReviewTools.length === 8, 'manifest-backed tool count mismatch')
for (const toolId of MANIFEST_BACKED_TOOLS) {
  assert(status.manifestBackedSourceInstallReviewTools.includes(toolId), `missing manifest-backed tool ${toolId}`)
}
assert(status.stillMissingLaunchCoreTools.includes('ffmpeg'), 'ffmpeg must remain missing')
assert(status.stillMissingLaunchCoreTools.includes('ffprobe'), 'ffprobe must remain missing')
assert(status.stillMissingLaunchCoreTools.includes('libass'), 'libass must remain missing')
assert(status.validationSnapshot.sourceInstallReviewRequired === 8, 'validation snapshot source-install count mismatch')

const delta = parsed.delta
assert(delta.blockerDelta.hardBlockerReduction === 17, 'hard blocker reduction mismatch')
assert(delta.deltaConclusion.falseMissingLaunchCoreStatusesReduced === true, 'delta conclusion mismatch')
assert(delta.deltaConclusion.realUserMediaBetaStillBlocked === true, 'real user beta blocker mismatch')

const claim = parsed.claim
assert(claim.claimConclusion.sourceInstallReviewMayProceed === true, 'source install review handoff missing')
assert(claim.claimConclusion.realUserMediaBetaStillBlocked === true, 'claim real user beta blocker missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.sourceInstallReviewTargets.length === 8, 'prompt review target count mismatch')
assert(prompt.blockedOrSeparateTargets.includes('ffmpeg'), 'prompt must keep ffmpeg separate')
assert(prompt.allowedInSourceInstallReview.staticSourceReview === true, 'prompt static source review allowance missing')
assert(prompt.allowedInSourceInstallReview.runtimeExecution === false, 'prompt runtime must remain false')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-readiness-reconciliation-after-persistent-manifest-review:diagnostics'],
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      manifestOwnerReviewPr: 1455,
      sourceInstallReviewRequiredCount: 8,
      hardBlockersBefore: 101,
      hardBlockersAfter: 84,
      missingToolsAfter: 6,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
