#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37f_caption_render_runtime_hook_owner_review_passed_with_warnings_ready_for_runtime_hook_source_plan_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37f_caption_render_runtime_hook_plan_after_ocr_chain_reconciliation_completed_with_warnings_ready_for_runtime_hook_owner_review_no_execution'
const SOURCE_PR = 1592
const SOURCE_MERGE_COMMIT = 'b92abb58629a9368953b238f6230d454a0dbacec'
const NEXT_PROMPT = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37G-CAPTION-RENDER-RUNTIME-HOOK-SOURCE-PLAN'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-acceptance-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-owner-claim-policy',
  },
  nextPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-plan',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForDockerToday',
  'acceptedForExecutionToday',
  'acceptedForPaidProductionToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForRenderExecutionToday',
  'acceptedForRuntimeHookImplementationToday',
  'acceptedForWorkerExecutionToday',
  'artifactCreation',
  'captionRenderRuntimeHookExecution',
  'captionRenderRuntimeHookExecutionApprovedToday',
  'dockerBuildRunPush',
  'dry_run_passed',
  'frameExtraction',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'mediaByteProcessing',
  'ocrInference',
  'ocrRuntimeExecution',
  'paidProductionAllowed',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'remotionRenderWorkerExecution',
  'renderExecution',
  'renderExecutionApprovedToday',
  'routeExecution',
  'runtimeHookImplementation',
  'runtimeHookImplementationApprovedToday',
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

function scanFalse(value, trail = []) {
  if (!value || typeof value !== 'object') return
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

const parsed = Object.fromEntries(Object.entries(FILES).map(([key, info]) => [key, parseBlock(info)]))

for (const [key, doc] of Object.entries(parsed)) {
  if (key === 'nextPrompt') {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
    assert(doc.requiredSourceDecision === DECISION, `${key} source decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, key)
  } else {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
    assert(doc.decision === DECISION, `${key} decision mismatch`)
    if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  }
  scanFalse(doc, [key])
}

const review = parsed.review
assert(review.sourcePlanDecision === SOURCE_DECISION, 'source plan decision mismatch')
assert(review.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(review.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(review.reviewedHook.hookName === 'ocrCaptionRenderSafeZonePlanningHook', 'hook name mismatch')
assert(review.reviewedHook.hookModeAccepted === 'future_source_planning_only', 'hook mode mismatch')
assert(review.ownerReviewResult.acceptedForFutureRuntimeHookSourcePlan === true, 'future source planning acceptance missing')
assert(review.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(
  acceptance.acceptedForFutureSourcePlanning.some((row) => row.item === 'ocrCaptionRenderSafeZonePlanningHook' && row.acceptedForFutureSourcePlanning === true),
  'hook acceptance missing',
)
assert(acceptance.blockedForToday.some((row) => row.item === 'runtime hook source implementation'), 'source implementation blocker missing')
assert(acceptance.blockedForToday.some((row) => row.item === 'caption/render worker execution'), 'render execution blocker missing')

const blockers = parsed.blockers
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'phase37f_caption_render_runtime_hook_owner_review_pending'),
  'owner review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_hook_source_plan_pending'),
  'runtime source plan blocker missing',
)
assert(blockers.runtimeGates.workerExecution === false, 'worker execution gate widened')
assert(blockers.runtimeGates.renderExecution === false, 'render execution gate widened')

const claims = parsed.claims
assert(claims.allowedClaims.phase37FOwnerReviewCompleted === true, 'owner review completion claim missing')
assert(claims.allowedClaims.phase37FHookAcceptedForFutureSourcePlanning === true, 'source planning claim missing')
assert(claims.blockedClaims.runtimeHookImplementation === false, 'runtime hook implementation claim widened')
assert(claims.blockedClaims.realUserMediaBetaAllowed === false, 'beta claim widened')
assert(claims.noScopeStatement.includes('No Supabase mutation'), 'no-scope statement missing')
assert(claims.noScopeStatement.includes('No Docker build'), 'Docker no-scope clause missing')

const sourcePlan = read('docs/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-plan-after-ocr-chain-reconciliation.md')
assert(sourcePlan.includes(SOURCE_DECISION), 'source plan decision not present')
assert(sourcePlan.includes('"selectedNextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37F-CAPTION-RENDER-RUNTIME-HOOK-OWNER-REVIEW"'), 'source selected prompt missing')

const sourceDiagnostics = read(
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-plan-after-ocr-chain-reconciliation-diagnostics.mjs',
)
assert(sourceDiagnostics.includes(SOURCE_DECISION), 'source diagnostics decision missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37f-caption-render-runtime-hook-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: SOURCE_PR,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  acceptedForFutureRuntimeHookSourcePlan: true,
  runtimeHookImplementationApprovedToday: false,
  renderExecutionApprovedToday: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
