#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_pending_manual_review_closure_plan_completed_with_warnings_ready_for_pending_manual_review_owner_review_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_isolated_proof_owner_review_passed_with_warnings_source_install_review_closed_ready_for_pending_manual_review_closure_plan_no_media_no_production'
const SOURCE_HEAD = '48a3001ef447ddd435acba461eb955bd4d3146e3'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PENDING-MANUAL-REVIEW-OWNER-REVIEW: review launch-core pending manual status closure, no media/no production'

const TARGET_TOOLS = [
  'duckdb',
  'polars',
  'opentimelineio',
  'pyav',
  'pyscenedetect',
  'opencv',
  'sharp',
  'remotion',
]

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-closure-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-closure-plan',
  },
  targets: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-target-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-target-register',
  },
  evidence: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-evidence-map.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-evidence-map',
  },
  transition: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-status-transition-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-status-transition-plan',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-review',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-readiness-status-delta-register.md',
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-source-install-closure-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-lane-proof-register.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof-result.md',
  'server/workers/production-readiness/production-tool-readiness-runner.ts',
  'server/workers/readiness-validation/production-readiness-report-builder.ts',
  'package.json',
]

const MUST_BE_FALSE = [
  'pendingManualReviewClosedToday',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadinessClaimed',
  'workerReadinessClaimed',
  'mediaReadinessClaimed',
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

const sourceReview = read('docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-review.md')
assert(sourceReview.includes(SOURCE_DECISION), 'source owner-review decision missing')

const runner = read('server/workers/production-readiness/production-tool-readiness-runner.ts')
for (const toolId of TARGET_TOOLS) assert(runner.includes(`'${toolId}'`), `runner missing launch-core tool ${toolId}`)
assert(runner.includes("return 'pending_manual_review'") || runner.includes("return 'warning'"), 'runner must retain a safe static status mapping')

const reportBuilder = read('server/workers/readiness-validation/production-readiness-report-builder.ts')
assert(reportBuilder.includes("status === 'not_checked'"), 'report builder must still treat not_checked launch-core status carefully')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const plan = parsed.plan
assert(plan.decision === DECISION, 'decision mismatch')
assert(plan.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(plan.sourceBase.isolatedProofOwnerReviewPr === 1492, 'source PR mismatch')
assert(plan.sourceBase.isolatedProofOwnerReviewDecision === SOURCE_DECISION, 'source decision mismatch')
assert(plan.planResult.planningOnly === true, 'planning-only flag missing')
assert(plan.planResult.targetStatusAfterFutureOwnerReview === 'warning', 'target status mismatch')
assert(plan.planResult.targetTools === TARGET_TOOLS.length, 'target tool count mismatch')
assert(plan.planResult.pendingManualReviewCountBefore === 8, 'pending count before mismatch')
assert(plan.planResult.pendingManualReviewCountAfterThisPlan === 8, 'plan must not close pending review')
assert(plan.planResult.sourceInstallReviewRequiredCountBefore === 0, 'source-install count before mismatch')
assert(plan.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const targets = parsed.targets.targetTools
assert(targets.length === TARGET_TOOLS.length, 'target register count mismatch')
for (const toolId of TARGET_TOOLS) {
  const target = targets.find((entry) => entry.toolId === toolId)
  assert(target, `missing target ${toolId}`)
  assert(target.currentStatus === 'pending_manual_review', `${toolId} current status mismatch`)
  assert(target.futureOwnerReviewTargetStatus === 'warning', `${toolId} target status mismatch`)
}

const evidence = parsed.evidence.evidenceSources
for (const toolId of TARGET_TOOLS) {
  assert(evidence.some((entry) => entry.covers.includes(toolId)), `missing evidence coverage for ${toolId}`)
}
assert(parsed.evidence.evidenceGapsNotClosedHere.includes('FFmpeg commercial LGPL-safe package review'), 'FFmpeg gap must remain')

const transition = parsed.transition.plannedFutureTransition
assert(transition.fromStatus === 'pending_manual_review', 'transition from status mismatch')
assert(transition.toStatus === 'warning', 'transition target mismatch')
assert(transition.whyNotPassed.includes('Dry-run static readiness'), 'why-not-passed rationale missing')
assert(transition.whyNotNotChecked.includes('hard'), 'why-not-not-checked rationale missing')
assert(transition.ownerReviewRequiredBeforeCodeChange === true, 'owner-review requirement missing')
assert(transition.runnerChangeAllowedInThisPlan === false, 'this plan must not change runner mapping')

const blockers = parsed.blockers
assert(blockers.blockersClosedByThisPlan.length === 0, 'plan must close no blockers')
assert(blockers.blockersPlannedForFutureOwnerReview.includes('launch_core_manifest_backed_pending_manual_review'), 'future blocker missing')
assert(blockers.blockersStillOutOfScope.includes('ffmpeg_lgpl_safe_build_review'), 'FFmpeg blocker missing')

const claims = parsed.claims
assert(claims.allowedClaims.pendingManualReviewClosurePlanCreated === true, 'plan claim missing')
assert(claims.allowedClaims.targetStatusAfterFutureOwnerReview === 'warning', 'claim target mismatch')
assert(claims.allowedClaims.sourceInstallReviewRequiredAlreadyZero === true, 'source install zero claim missing')
assert(claims.allowedClaims.ownerReviewRequiredBeforeRunnerChange === true, 'owner review claim missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.reviewTargets.length === TARGET_TOOLS.length, 'prompt target count mismatch')
assert(prompt.allowedOwnerReviewScope.staticStatusTransitionToWarning === true, 'prompt transition scope missing')
assert(prompt.allowedOwnerReviewScope.runtimeExecution === false, 'prompt runtime must remain false')
assert(prompt.allowedOwnerReviewScope.productionUnlock === false, 'prompt production must remain false')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-pending-manual-review-closure-plan:diagnostics'],
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      isolatedProofOwnerReviewPr: 1492,
      targetTools: TARGET_TOOLS.length,
      pendingManualReviewCountBefore: 8,
      pendingManualReviewCountAfterThisPlan: 8,
      sourceInstallReviewRequiredCountBefore: 0,
      targetStatusAfterFutureOwnerReview: 'warning',
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
