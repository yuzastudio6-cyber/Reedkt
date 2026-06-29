#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37g_caption_render_runtime_hook_source_owner_review_passed_with_warnings_ready_for_actual_source_creation_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37g_caption_render_runtime_hook_source_plan_completed_with_warnings_ready_for_source_owner_review_no_execution'
const SOURCE_PR = 1598
const SOURCE_MERGE_COMMIT = 'b8798dc330d98bfe86f7ccc462197ec0816b1ab2'
const FUTURE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const NEXT_PROMPT = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37H-ACTUAL-CAPTION-RENDER-RUNTIME-HOOK-SOURCE-CREATION'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-safety-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-safety-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37h-actual-caption-render-runtime-hook-source-creation.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-actual-caption-render-runtime-hook-source-creation',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForDockerToday',
  'acceptedForExecutionToday',
  'acceptedForPaidProductionToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForRenderExecutionToday',
  'acceptedForRuntimeExecutionToday',
  'acceptedForRuntimeHookImplementationToday',
  'acceptedForWorkerExecutionToday',
  'artifactCreation',
  'artifactCreationApprovedToday',
  'captionRenderRuntimeHookExecution',
  'captionRenderRuntimeHookExecutionApprovedToday',
  'createdInThisGate',
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
  'sourceCreatedInThisGate',
  'sqlExecution',
  'supabaseMutation',
  'toolCallReady',
  'toolExecution',
  'workerExecution',
  'workerExecutionApprovedToday',
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
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  if (key === 'prompt') {
    assert(doc.requiredSourceDecision === DECISION, `${key} required source decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, key)
  } else {
    assert(doc.decision === DECISION, `${key} decision mismatch`)
    if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  }
  scanFalse(doc, [key])
}

assert(!existsSync(FUTURE_PATH), `${FUTURE_PATH} must not be created in source owner review`)

const review = parsed.review
assert(review.sourcePlanDecision === SOURCE_DECISION, 'source plan decision mismatch')
assert(review.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(review.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(review.reviewedFutureSource.path === FUTURE_PATH, 'reviewed path mismatch')
assert(review.reviewedFutureSource.acceptedForFutureActualSourceCreation === true, 'future source creation acceptance missing')
assert(review.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(
  acceptance.acceptedForFutureSourceCreation.some((row) => row.item === FUTURE_PATH && row.accepted === true && row.createdInThisGate === false),
  'future source path acceptance missing',
)
assert(acceptance.rejectedForToday.includes('OCR runtime execution'), 'OCR execution rejection missing')
assert(acceptance.rejectedForToday.includes('real-user media beta'), 'beta rejection missing')

const safety = parsed.safety
assert(safety.futureSourceRequirements.mustRemainFailClosed === true, 'fail-closed requirement missing')
assert(safety.futureSourceRequirements.mustNotOpenFiles === true, 'file-open rejection missing')
assert(safety.requiredFalseDefaults.sourceCreatedInThisGate === false, 'source-created default widened')
assert(safety.rejectedFutureInputs.includes('rawFrames'), 'raw frame rejection missing')

const blockers = parsed.blockers
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_hook_source_owner_review_pending'),
  'owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'actual_runtime_hook_source_creation_pending'),
  'actual source creation blocker missing',
)
assert(blockers.runtimeGates.sourceCreatedInThisGate === false, 'source creation gate widened')
assert(blockers.runtimeGates.workerExecution === false, 'worker execution gate widened')

const claims = parsed.claims
assert(claims.allowedClaims.phase37GSourceOwnerReviewCompleted === true, 'owner-review claim missing')
assert(claims.allowedClaims.futureActualSourceCreationMayProceed === true, 'future actual source creation claim missing')
assert(claims.blockedClaims.sourceCreatedInThisGate === false, 'source-created claim widened')
assert(claims.noScopeStatement.includes('No Supabase mutation'), 'no-scope statement missing')
assert(claims.noScopeStatement.includes('source file creation'), 'source creation no-scope clause missing')

const sourcePlan = read('docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-plan.md')
assert(sourcePlan.includes(SOURCE_DECISION), 'source plan decision missing')
assert(sourcePlan.includes(FUTURE_PATH), 'source plan future path missing')

const sourceDiagnostics = read('scripts/validation/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-plan-diagnostics.mjs')
assert(sourceDiagnostics.includes(SOURCE_DECISION), 'source diagnostics decision missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37g-caption-render-runtime-hook-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: SOURCE_PR,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  acceptedFutureSourcePath: FUTURE_PATH,
  sourceCreatedInThisGate: false,
  runtimeHookImplementationApprovedToday: false,
  renderExecutionApprovedToday: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
