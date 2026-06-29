#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37i_caption_render_runtime_hook_static_integration_owner_review_passed_with_warnings_ready_for_static_integration_source_creation_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37i_caption_render_runtime_hook_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review_no_execution'
const SOURCE_PR = 1617
const SOURCE_MERGE_COMMIT = 'd9facf0a2fad8493a19c42873da7d24c036107f9'
const SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const INTEGRATION_TARGET = 'server/workers/sound-cpu/index.ts'
const SOURCE_OWNER_REVIEW_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37I-CAPTION-RENDER-RUNTIME-HOOK-STATIC-INTEGRATION-OWNER-REVIEW'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37J-CAPTION-RENDER-RUNTIME-HOOK-STATIC-INTEGRATION-SOURCE-CREATION'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-safety-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-safety-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-creation.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-creation',
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
  'ownerReviewCreatedStaticImportProof',
  'ownerReviewImportedSource',
  'ownerReviewModifiedIndex',
  'paidProductionAllowed',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'renderExecution',
  'renderExecutionApprovedToday',
  'routeExecution',
  'runtimeExecutionAllowed',
  'runtimeHookExecutionApprovedToday',
  'runtimeReady',
  'sqlExecution',
  'staticImportProofCreatedInThisGate',
  'staticImportProofRunInThisGate',
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
  if (key === 'prompt') {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
    assert(doc.requiredSourceDecision === DECISION, `${key} required source decision mismatch`)
    assertSupabaseNoop(doc.supabaseClassification, key)
  } else {
    assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
    assert(doc.decision === DECISION, `${key} decision mismatch`)
    if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  }
  scanFalse(doc, [key])
}

assert(existsSync(SOURCE_PATH), 'hook source missing')
assert(existsSync(INTEGRATION_TARGET), 'integration target missing')

const source = read(SOURCE_PATH)
assert(source.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'blocked result factory missing')
assert(source.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'blocked assertion missing')
assert(source.includes('runtimeExecutionApproved: false'), 'runtime false default missing')
assert(source.includes('workerExecutionApproved: false'), 'worker false default missing')
assert(source.includes('renderExecutionApproved: false'), 'render false default missing')

const review = parsed.review
assert(review.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(review.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(review.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(review.reviewedPlan.plannedIntegrationTarget === INTEGRATION_TARGET, 'planned integration target mismatch')
assert(review.reviewedPlan.reviewedSource === SOURCE_PATH, 'reviewed source mismatch')
assert(review.reviewedPlan.acceptedForStaticIntegrationSourceCreation === true, 'source creation acceptance missing')
assert(review.reviewedPlan.indexExportCreatedInThisGate === false, 'index export created in owner review')
assert(review.reviewedPlan.staticImportProofCreatedInThisGate === false, 'static import proof created in owner review')
assert(review.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')
assertSupabaseNoop(review.supabaseClassification, 'review')

const acceptance = parsed.acceptance
assert(
  acceptance.acceptedForFutureSourceCreation.some((row) => row.item === INTEGRATION_TARGET && row.accepted === true),
  'integration target acceptance row missing',
)
assert(acceptance.acceptedForToday.staticIntegrationSourceCreationMayProceedNext === true, 'source creation next acceptance missing')
assert(acceptance.acceptedForToday.ownerReviewCompleted === true, 'owner-review completion claim missing')
assert(acceptance.rejectedForToday.includes('static import proof execution'), 'static proof rejection missing')
assert(acceptance.requiredFalseDefaults.indexExportCreatedInThisGate === false, 'index export false default widened')

const safety = parsed.safety
assert(safety.sourceEvidence.phase37iPlanDecision === SOURCE_DECISION, 'safety source decision mismatch')
assert(safety.sourceEvidence.phase37iPlanPr === SOURCE_PR, 'safety PR mismatch')
assert(safety.sourceEvidence.phase37iPlanMergeCommit === SOURCE_MERGE_COMMIT, 'safety merge commit mismatch')
assert(safety.reviewedBoundaries.plannedIntegrationTargetExists === true, 'target existence review missing')
assert(safety.reviewedBoundaries.hookSourceExists === true, 'source existence review missing')
assert(safety.reviewedBoundaries.hookSourceRemainsFailClosed === true, 'fail-closed source review missing')
assert(safety.forbiddenExecutionSurface.ocrInference === false, 'OCR execution widened')
assert(safety.readinessClaims.realUserMediaBetaAllowed === false, 'beta readiness widened')

const blockers = parsed.blockers
assert(
  blockers.resolvedForOwnerReview.some((row) => row.blockerId === 'phase37i_static_integration_owner_review_pending'),
  'owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37j_static_integration_source_creation_pending'),
  'Phase 37J source blocker missing',
)
assertSupabaseNoop(blockers.supabaseClassification, 'blockers')

const claims = parsed.claims
assert(claims.allowedClaims.phase37IStaticIntegrationPlanOwnerReviewCompleted === true, 'owner-review allowed claim missing')
assert(claims.allowedClaims.phase37JStaticIntegrationSourceCreationMayProceed === true, 'Phase 37J allowed claim missing')
assert(claims.blockedClaims.staticImportProofRunInThisGate === false, 'static proof run claim widened')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness widened')
assert(claims.noScopeStatement.includes('Phase 37I owner review accepted only future static integration source creation'), 'no-scope clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'Phase 37J prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'Phase 37J prompt source head mismatch')
assert(prompt.sourcePath === SOURCE_PATH, 'Phase 37J prompt source path mismatch')
assert(prompt.plannedIntegrationTarget === INTEGRATION_TARGET, 'Phase 37J prompt target mismatch')
assert(prompt.allowedSourceChange.path === INTEGRATION_TARGET, 'Phase 37J allowed source path mismatch')
assert(prompt.allowedSourceChange.runtimeExecutionAllowed === false, 'Phase 37J runtime execution widened')

const plan = read('docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-plan.md')
assert(plan.includes(SOURCE_DECISION), 'Phase 37I plan decision missing')
assert(plan.includes(INTEGRATION_TARGET), 'Phase 37I integration target missing')
assert(plan.includes(SOURCE_OWNER_REVIEW_PROMPT), 'Phase 37I owner-review handoff missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: SOURCE_PR,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  reviewedSourcePath: SOURCE_PATH,
  plannedIntegrationTarget: INTEGRATION_TARGET,
  acceptedForStaticIntegrationSourceCreation: true,
  indexExportCreatedInThisGate: false,
  staticImportProofCreatedInThisGate: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
