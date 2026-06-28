#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_hard_blocker_closure_plan_completed_with_warnings_ready_for_hyperframe_package_identity_owner_review_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_pending_manual_review_owner_review_passed_with_warnings_static_status_transition_to_warning_no_media_no_production'
const SOURCE_HEAD = '4c7fc6bffea58c95cf3e5cd57d172b8430c8c3a5'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-HYPERFRAME-PACKAGE-IDENTITY-OWNER-REVIEW: resolve Hyperframe package identity, no runtime/no production'

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-closure-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-closure-plan',
  },
  snapshot: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-snapshot-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-snapshot-register',
  },
  evidence: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-evidence-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-evidence-register',
  },
  duplicates: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-duplicate-risk-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-duplicate-risk-register',
  },
  nextLane: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-next-lane-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-next-lane-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-hyperframe-package-identity-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-package-identity-owner-review',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-readiness-delta-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-closure-plan.md',
  'server/tool-registry/production-tool-profiles.ts',
  'server/workers/production-readiness/core-tool-node-import-checks.ts',
  'server/workers/production-readiness/core-tool-command-checks.ts',
  'server/workers/readiness-validation/production-readiness-report-builder.ts',
  'package.json',
]

const MUST_BE_FALSE = [
  'packageInstall',
  'packageLockMutation',
  'runtimeExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'realUserMediaBetaUnlock',
  'productionUnlock',
  'hyperframeResolved',
  'ffmpegCommercialLgplReady',
  'ffprobeContainerReady',
  'libassReady',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadinessClaimed',
  'workerReadinessClaimed',
  'mediaReadinessClaimed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'dockerBuildRunPushApprovedToday',
  'gcpCloudRunSecretManagerApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
  'installApproved',
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

for (const file of SOURCE_FILES) read(file)

const sourceReview = read('docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-review.md')
assert(sourceReview.includes(SOURCE_DECISION), 'source owner-review decision missing')

const profiles = read('server/tool-registry/production-tool-profiles.ts')
assert(profiles.includes("toolId: 'hyperframe'"), 'Hyperframe production tool profile missing')
assert(profiles.includes("executionMode: 'preview_boundary'"), 'Hyperframe preview boundary semantics missing')

const nodeChecks = read('server/workers/production-readiness/core-tool-node-import-checks.ts')
assert(nodeChecks.includes("packageName: 'hyperframe'"), 'Hyperframe package metadata check missing')
assert(nodeChecks.includes("packageJsonPath: 'hyperframe/package.json'"), 'Hyperframe package path check missing')

const commandChecks = read('server/workers/production-readiness/core-tool-command-checks.ts')
assert(commandChecks.includes("toolId: 'ffmpeg'"), 'FFmpeg command check missing')
assert(commandChecks.includes("toolId: 'ffprobe'"), 'ffprobe command check missing')
assert(commandChecks.includes("toolId: 'libass'"), 'libass command check missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const plan = parsed.plan
assert(plan.decision === DECISION, 'plan decision mismatch')
assert(plan.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(plan.sourceBase.pendingManualReviewOwnerReviewPr === 1498, 'source PR mismatch')
assert(plan.sourceBase.pendingManualReviewOwnerReviewDecision === SOURCE_DECISION, 'source decision mismatch')
assert(plan.planResult.planningOnly === true, 'planning-only flag missing')
assert(plan.planResult.hardBlockerCount === 84, 'hard blocker count mismatch')
assert(plan.planResult.warnings === 26, 'warning count mismatch')
assert(plan.planResult.pendingManualReviewCount === 0, 'pending manual count mismatch')
assert(plan.planResult.sourceInstallReviewRequiredCount === 0, 'source install count mismatch')
assert(plan.planResult.boundedNoRuntimeExternalBetaAllowed === true, 'bounded external beta flag mismatch')
assert(plan.selectedNextClosureLane.id === 'hyperframe_package_identity_owner_review', 'selected lane mismatch')
assert(plan.selectedNextClosureLane.nextPrompt === NEXT_PROMPT, 'plan next prompt mismatch')

const snapshot = parsed.snapshot
assert(snapshot.readinessSnapshot.overallStatus === 'blocked', 'overall status mismatch')
assert(snapshot.readinessSnapshot.hardBlockers === 84, 'snapshot hard blocker count mismatch')
assert(snapshot.readinessSnapshot.toolStatuses.warning === 8, 'warning tool count mismatch')
for (const toolId of ['ffmpeg', 'ffprobe', 'hyperframe', 'libass']) {
  assert(snapshot.topLaunchCoreBlockers.some((entry) => entry.toolId === toolId), `missing blocker ${toolId}`)
}
assert(snapshot.betaSnapshot.externalBetaAllowed === true, 'bounded external beta mismatch')
assert(snapshot.betaSnapshot.realUserMediaBetaAllowed === false, 'real media beta must remain false')

const evidence = parsed.evidence.safeInspectionEvidence
assert(evidence.some((entry) => entry.id === 'prod_readiness_summary_after_pr_1498'), 'readiness evidence missing')
const core = evidence.find((entry) => entry.id === 'core_cpu_real_check_safe_command_probe')
assert(core.ffmpegVersionCheck === 'passed', 'FFmpeg version evidence mismatch')
assert(core.ffprobeVersionCheck === 'passed', 'ffprobe version evidence mismatch')
assert(core.libassFilterInspection === 'warning', 'libass evidence mismatch')
assert(core.hyperframePackageMetadata === 'not_installed', 'Hyperframe metadata evidence mismatch')
assert(core.mediaProcessed === false, 'media processing must remain false')
const npmLookup = evidence.find((entry) => entry.id === 'npm_hyperframe_registry_lookup')
assert(npmLookup.result === 'not_found', 'npm hyperframe lookup mismatch')
assert(parsed.evidence.evidenceNotAcceptedForProduction.some((entry) => entry.includes('GPL')), 'GPL caution missing')

const duplicates = parsed.duplicates
assert(duplicates.duplicateChecks.samePurposeOpenPrFound === false, 'same purpose PR must be false')
assert(duplicates.adjacentOpenWork.some((entry) => entry.pr === 80), 'adjacent FFmpeg PR reference missing')
assert(duplicates.coordinationDecision.includes('do not merge'), 'coordination decision mismatch')

const nextLane = parsed.nextLane.selectedLane
assert(nextLane.id === 'hyperframe_package_identity_owner_review', 'next lane id mismatch')
assert(nextLane.blockedNextActions.includes('install guessed Hyperframe package'), 'blocked guessed install missing')
assert(parsed.nextLane.deferredLanes.some((entry) => entry.id === 'ffmpeg_ffprobe_commercial_lgpl_and_container_policy'), 'deferred FFmpeg lane missing')
assert(parsed.nextLane.nextPrompt === NEXT_PROMPT, 'next lane prompt mismatch')

const claims = parsed.claims
assert(claims.allowedClaims.hardBlockerClosurePlanCreated === true, 'plan claim missing')
assert(claims.allowedClaims.nextLaneSelected === 'hyperframe_package_identity_owner_review', 'claim selected lane mismatch')
assert(claims.allowedClaims.boundedNoRuntimeExternalBetaAllowed === true, 'bounded external beta claim missing')
assert(claims.blockedClaims.hyperframeResolved === false, 'Hyperframe must not be resolved here')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(prompt.allowedOwnerReviewScope.sourceOfTruthDecision === true, 'source decision scope missing')
assert(prompt.allowedOwnerReviewScope.packageInstall === false, 'prompt must block package install')
assert(prompt.allowedOwnerReviewScope.productionUnlock === false, 'prompt must block production unlock')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-hard-blocker-closure-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-closure-plan-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      hardBlockers: 84,
      warnings: 26,
      selectedNextLane: 'hyperframe_package_identity_owner_review',
      boundedNoRuntimeExternalBetaAllowed: true,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
