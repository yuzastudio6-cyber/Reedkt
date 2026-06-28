#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_pending_manual_review_owner_review_passed_with_warnings_static_status_transition_to_warning_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_pending_manual_review_closure_plan_completed_with_warnings_ready_for_pending_manual_review_owner_review_no_media_no_production'
const SOURCE_HEAD = '51820c0434485abab9df2b629befac0b87b1fffa'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-HARD-BLOCKER-CLOSURE-PLAN: plan next launch-core hard blocker closure, no media/no production'

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
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-acceptance-register',
  },
  transition: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-status-transition-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-status-transition-register',
  },
  delta: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-readiness-delta-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-readiness-delta-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-claim-policy',
  },
  nextPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-closure-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-closure-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-closure-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-target-register.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-status-transition-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-readiness-status-delta-register.md',
  'server/workers/production-readiness/production-tool-readiness-runner.ts',
  'server/workers/readiness-validation/production-readiness-report-builder.ts',
  'package.json',
]

const MUST_BE_FALSE = [
  'acceptedForPassedStatus',
  'acceptedForNotCheckedStatus',
  'acceptedForExecutionToday',
  'acceptedForProductionToday',
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

const sourcePlan = read('docs/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-closure-plan.md')
assert(sourcePlan.includes(SOURCE_DECISION), 'source closure-plan decision missing')

const runner = read('server/workers/production-readiness/production-tool-readiness-runner.ts')
assert(runner.includes('pendingManualReviewClosedToolIds'), 'runner missing pending manual closed set')
assert(runner.includes("return 'warning'"), 'runner must return warning for closed reviewed tools')
assert(runner.includes("return 'pending_manual_review'"), 'runner must retain pending manual fallback')
assert(runner.includes("return 'source_install_review_required'"), 'runner must retain source install fallback')
assert(runner.includes('static readiness records warning'), 'runner warning text missing closed warning status')
for (const toolId of TARGET_TOOLS) assert(runner.includes(`'${toolId}'`), `runner missing target tool ${toolId}`)

const reportBuilder = read('server/workers/readiness-validation/production-readiness-report-builder.ts')
assert(reportBuilder.includes("status === 'not_checked'"), 'report builder must keep not_checked hard-blocker guard')
assert(reportBuilder.includes("'warning'"), 'report builder must keep warning status support')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const review = parsed.review
assert(review.decision === DECISION, 'review decision mismatch')
assert(review.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(review.sourceBase.closurePlanPr === 1494, 'source PR mismatch')
assert(review.sourceBase.closurePlanDecision === SOURCE_DECISION, 'source decision mismatch')
assert(review.reviewResult.reviewedToolCount === TARGET_TOOLS.length, 'reviewed tool count mismatch')
assert(review.reviewResult.acceptedStaticStatusTransition === true, 'static transition not accepted')
assert(review.reviewResult.fromStatus === 'pending_manual_review', 'from status mismatch')
assert(review.reviewResult.toStatus === 'warning', 'to status mismatch')
assert(review.reviewResult.pendingManualReviewCountBefore === 8, 'pending count before mismatch')
assert(review.reviewResult.pendingManualReviewCountAfter === 0, 'pending count after mismatch')
assert(review.reviewResult.sourceInstallReviewRequiredCountAfter === 0, 'source-install count after mismatch')
assert(review.reviewResult.boundedNoRuntimeExternalBetaAllowed === true, 'bounded external beta flag mismatch')
assert(review.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptedTools = parsed.acceptance.acceptedTools
assert(acceptedTools.length === TARGET_TOOLS.length, 'accepted tool count mismatch')
for (const toolId of TARGET_TOOLS) {
  const target = acceptedTools.find((entry) => entry.toolId === toolId)
  assert(target, `missing accepted target ${toolId}`)
  assert(target.acceptedStaticStatus === 'warning', `${toolId} status mismatch`)
}

const transition = parsed.transition.runnerUpdate
assert(transition.file === 'server/workers/production-readiness/production-tool-readiness-runner.ts', 'runner file mismatch')
assert(transition.closedManualReviewSet === 'pendingManualReviewClosedToolIds', 'closed set mismatch')
assert(transition.closedToolCount === TARGET_TOOLS.length, 'closed tool count mismatch')
assert(transition.statusReturnedForClosedTools === 'warning', 'closed status mismatch')
assert(transition.retainsPendingManualReviewFallback === true, 'pending fallback missing')
assert(transition.retainsSourceInstallReviewRequiredFallback === true, 'source fallback missing')
assert(parsed.transition.whyNotPassed.includes('stronger readiness claim'), 'why-not-passed rationale missing')
assert(parsed.transition.whyNotNotChecked.includes('hard blockers'), 'why-not-not-checked rationale missing')

const delta = parsed.delta.readinessDelta
assert(delta.before.pending_manual_review === 8, 'delta before pending mismatch')
assert(delta.after.pending_manual_review === 0, 'delta after pending mismatch')
assert(delta.after.warningIncreaseBy === 8, 'delta warning increase mismatch')
assert(delta.hardBlockersExpectedToRemain === true, 'hard blocker expectation missing')
assert(parsed.delta.gatesStillClosed.includes('ffmpeg_lgpl_safe_build_review'), 'FFmpeg gate must remain closed')
assert(parsed.delta.gatesStillClosed.includes('real_user_media_beta_runtime_boundary'), 'real media gate must remain closed')

const blockers = parsed.blockers
assert(blockers.blockersClosedByThisOwnerReview.includes('launch_core_manifest_backed_pending_manual_review'), 'closed blocker missing')
assert(blockers.blockersNotClosedByThisOwnerReview.includes('ffprobe_container_readiness'), 'ffprobe blocker missing')
assert(blockers.nextRecommendedClosurePrompt === NEXT_PROMPT, 'blocker next prompt mismatch')

const claims = parsed.claims
assert(claims.allowedClaims.pendingManualReviewClosedForManifestBackedLaunchCoreTools === true, 'closure claim missing')
assert(claims.allowedClaims.closedToolCount === TARGET_TOOLS.length, 'claim count mismatch')
assert(claims.allowedClaims.targetStatus === 'warning', 'claim target mismatch')
assert(claims.allowedClaims.boundedNoRuntimeExternalBetaAllowed === true, 'bounded external beta claim missing')

const prompt = parsed.nextPrompt
assert(prompt.requiredSourceDecision === DECISION, 'next prompt source decision mismatch')
assert(prompt.allowedPlanningScope.nextBlockerPlan === true, 'next blocker planning scope missing')
assert(prompt.allowedPlanningScope.runtimeExecution === false, 'next prompt runtime must remain false')
assert(prompt.candidateBlockerAreas.includes('ffmpeg_lgpl_safe_build_review'), 'next prompt FFmpeg area missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-pending-manual-review-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      targetTools: TARGET_TOOLS.length,
      statusTransition: 'pending_manual_review_to_warning',
      pendingManualReviewAfter: 0,
      sourceInstallReviewRequiredAfter: 0,
      boundedNoRuntimeExternalBetaAllowed: true,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
