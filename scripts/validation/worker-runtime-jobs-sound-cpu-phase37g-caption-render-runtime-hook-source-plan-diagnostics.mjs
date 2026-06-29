#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37g_caption_render_runtime_hook_source_plan_completed_with_warnings_ready_for_source_owner_review_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37f_caption_render_runtime_hook_owner_review_passed_with_warnings_ready_for_runtime_hook_source_plan_no_execution'
const SOURCE_PR = 1595
const SOURCE_MERGE_COMMIT = 'c0ec29cc7eeaebbddac415d1f7ab3d1c6d2a3281'
const FUTURE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const NEXT_PROMPT = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37G-CAPTION-RENDER-RUNTIME-HOOK-SOURCE-OWNER-REVIEW'
const PHASE37H_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37h_actual_caption_render_runtime_hook_source_created_with_warnings_ready_for_source_owner_review_no_execution'
const PHASE37H_RESULT_PATH =
  'docs/worker-runtime-jobs-sound-cpu-phase37h-actual-caption-render-runtime-hook-source-result.md'

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-plan',
  },
  paths: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-path-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-path-register',
  },
  contract: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-contract-shape-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-contract-shape-plan',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-review',
  },
}

const FALSE_FIELDS = new Set([
  'approvedForRuntimeExecutionToday',
  'artifactCreation',
  'artifactCreationApprovedToday',
  'captionRenderRuntimeHookExecution',
  'captionRenderRuntimeHookExecutionApprovedToday',
  'createdInThisGate',
  'dockerBuildRunPush',
  'dry_run_passed',
  'executionApprovedToday',
  'frameExtraction',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'implementationApprovedToday',
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

if (existsSync(FUTURE_PATH)) {
  const phase37HResult = existsSync(PHASE37H_RESULT_PATH) ? read(PHASE37H_RESULT_PATH) : ''
  assert(
    phase37HResult.includes(PHASE37H_DECISION) && phase37HResult.includes(FUTURE_PATH),
    `${FUTURE_PATH} must not be created in Phase 37G without Phase 37H source-creation evidence`,
  )
}
assert(existsSync('server/workers/sound-cpu/runtime/soundCpuRuntimeGuards.ts'), 'runtime guard context missing')
assert(existsSync('server/workers/captions/caption-safe-zone-policy.ts'), 'caption safe-zone context missing')
assert(existsSync('server/activation/ocr-caption-render-qa/approved-ocr-caption-render-qa-evidence.ts'), 'Phase 37E evidence context missing')

const plan = parsed.plan
assert(plan.sourceOwnerReviewDecision === SOURCE_DECISION, 'source owner-review decision mismatch')
assert(plan.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(plan.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(plan.plannedSource.futurePath === FUTURE_PATH, 'future source path mismatch')
assert(plan.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const paths = parsed.paths
assert(paths.plannedFutureFiles.some((row) => row.path === FUTURE_PATH && row.createdInThisGate === false), 'future path register missing')
assert(paths.notPlannedInThisGate.includes('server/routes/* source changes'), 'route source exclusion missing')

const contract = parsed.contract
assert(contract.plannedTypes.inputType === 'SoundCpuOcrCaptionRenderSafeZoneHookInput', 'input type plan mismatch')
assert(contract.plannedInputCategories.includes('normalizedOcrRegionBoxes'), 'OCR box input category missing')
assert(contract.plannedResultCategories.includes('captionSafeZoneConstraintPlan'), 'constraint result category missing')
assert(contract.rejectedInputs.includes('rawFrames'), 'raw frame rejection missing')
assert(contract.requiredFailClosedDefaults.runtimeHookImplementationApprovedToday === false, 'fail-closed runtime implementation default widened')

const blockers = parsed.blockers
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'runtime_hook_source_plan_pending'), 'source-plan blocker resolution missing')
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_hook_source_owner_review_pending'), 'source owner-review blocker missing')

const claims = parsed.claims
assert(claims.allowedClaims.phase37GSourcePlanCompleted === true, 'source plan claim missing')
assert(claims.blockedClaims.sourceCreatedInThisGate === false, 'source creation claim widened')
assert(claims.noScopeStatement.includes('No Supabase mutation'), 'no-scope statement missing')
assert(claims.noScopeStatement.includes('source file creation'), 'source creation no-scope clause missing')

const sourceReview = read('docs/worker-runtime-jobs-sound-cpu-phase37f-caption-render-runtime-hook-owner-review.md')
assert(sourceReview.includes(SOURCE_DECISION), 'source owner-review decision missing')
assert(sourceReview.includes(`"selectedNextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37G-CAPTION-RENDER-RUNTIME-HOOK-SOURCE-PLAN"`), 'source selected prompt missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37g-caption-render-runtime-hook-source-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: SOURCE_PR,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  futurePath: FUTURE_PATH,
  sourceCreatedInThisGate: false,
  runtimeHookImplementationApprovedToday: false,
  renderExecutionApprovedToday: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
