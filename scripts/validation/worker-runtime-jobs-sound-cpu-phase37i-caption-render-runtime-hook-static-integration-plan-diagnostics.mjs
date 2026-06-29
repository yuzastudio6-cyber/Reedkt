#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37i_caption_render_runtime_hook_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37h_caption_render_runtime_hook_source_owner_review_passed_with_warnings_ready_for_static_integration_plan_no_execution'
const SOURCE_PR = 1612
const SOURCE_MERGE_COMMIT = '2bdea9a34cc553baa6a7f3911883d6a522c69f5c'
const SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const INTEGRATION_TARGET = 'server/workers/sound-cpu/index.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37I-CAPTION-RENDER-RUNTIME-HOOK-STATIC-INTEGRATION-OWNER-REVIEW'
const FUTURE_SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37j_caption_render_runtime_hook_static_integration_source_created_with_warnings_ready_for_source_owner_review_no_execution'
const FUTURE_SOURCE_RESULT =
  'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-result.md'

const FILES = {
  plan: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-plan',
  },
  boundary: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-boundary-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-boundary-register',
  },
  importProof: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-import-proof-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-import-proof-plan',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-review',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForDockerToday',
  'acceptedForExecutionToday',
  'acceptedForPaidProductionToday',
  'acceptedForRealUserMediaBetaToday',
  'acceptedForRenderExecutionToday',
  'acceptedForRuntimeExecutionToday',
  'acceptedForWorkerExecutionToday',
  'artifactCreation',
  'artifactCreationApprovedToday',
  'captionRenderRuntimeHookExecution',
  'captionRenderRuntimeHookExecutionApprovedToday',
  'dockerBuildRunPush',
  'dry_run_passed',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'indexExportCreatedInThisGate',
  'mediaByteProcessing',
  'mediaProcessing',
  'ocrInference',
  'paidProductionAllowed',
  'proofCreatedInThisGate',
  'proofRunInThisGate',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'renderExecution',
  'renderExecutionApprovedToday',
  'routeExecution',
  'runtimeHookExecutionApprovedToday',
  'runtimeHookImplementationApprovedToday',
  'runtimeReady',
  'sqlExecution',
  'staticImportProofCreatedInThisGate',
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

assert(existsSync(SOURCE_PATH), 'reviewed hook source missing')
assert(existsSync(INTEGRATION_TARGET), 'integration target missing')
const source = read(SOURCE_PATH)
const target = read(INTEGRATION_TARGET)
assert(source.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'blocked result factory missing')
if (target.includes('soundCpuOcrCaptionRenderSafeZoneHook')) {
  const futureResult = existsSync(FUTURE_SOURCE_RESULT) ? read(FUTURE_SOURCE_RESULT) : ''
  assert(
    futureResult.includes(FUTURE_SOURCE_DECISION) && futureResult.includes(INTEGRATION_TARGET),
    `${INTEGRATION_TARGET} must not export the hook without Phase 37J source-creation evidence`,
  )
}

const plan = parsed.plan
assert(plan.sourceOwnerReviewDecision === SOURCE_DECISION, 'source owner-review decision mismatch')
assert(plan.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(plan.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(plan.reviewedSource.path === SOURCE_PATH, 'reviewed source path mismatch')
assert(plan.staticIntegrationPlan.plannedIntegrationTarget === INTEGRATION_TARGET, 'integration target mismatch')
assert(plan.staticIntegrationPlan.indexExportCreatedInThisGate === false, 'index export created in plan gate')
assert(plan.staticIntegrationPlan.staticImportProofCreatedInThisGate === false, 'static proof created in plan gate')
assert(plan.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const boundary = parsed.boundary
assert(boundary.allowedFuturePlanning.indexExportPlanning === true, 'index export planning missing')
assert(boundary.allowedFuturePlanning.staticImportProofPlanning === true, 'static import proof planning missing')
assert(
  boundary.plannedFutureFiles.some((row) => row.path === INTEGRATION_TARGET && row.modifiedInThisGate === false),
  'future integration target row missing',
)

const importProof = parsed.importProof
assert(importProof.plannedProof.sourcePath === SOURCE_PATH, 'import proof source mismatch')
assert(importProof.plannedProof.futureExportTarget === INTEGRATION_TARGET, 'import proof target mismatch')
assert(importProof.plannedProof.proofRunInThisGate === false, 'proof run widened')
assert(importProof.requiredFutureAssertions.blockedResultFactoryImportable === true, 'blocked factory future assertion missing')

const blockers = parsed.blockers
assert(
  blockers.resolvedForPlanning.some((row) => row.blockerId === 'phase37i_static_integration_plan_pending'),
  'planning blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37i_static_integration_owner_review_pending'),
  'owner-review blocker missing',
)
assert(blockers.runtimeGates.indexExportCreatedInThisGate === false, 'index export gate widened')

const claims = parsed.claims
assert(claims.allowedClaims.phase37IStaticIntegrationPlanCompleted === true, 'Phase 37I claim missing')
assert(claims.blockedClaims.staticImportProofCreatedInThisGate === false, 'static proof claim widened')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness claim widened')
assert(claims.noScopeStatement.includes('Phase 37I planned static integration only'), 'Phase 37I no-scope clause missing')

const sourceReview = read('docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-owner-review.md')
assert(sourceReview.includes(SOURCE_DECISION), 'source review decision missing')
assert(sourceReview.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37I-CAPTION-RENDER-RUNTIME-HOOK-STATIC-INTEGRATION-PLAN'), 'source review next prompt missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37i-caption-render-runtime-hook-static-integration-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-plan-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: SOURCE_PR,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  reviewedSourcePath: SOURCE_PATH,
  plannedIntegrationTarget: INTEGRATION_TARGET,
  indexExportCreatedInThisGate: false,
  staticImportProofCreatedInThisGate: false,
  acceptedForRuntimeExecutionToday: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
