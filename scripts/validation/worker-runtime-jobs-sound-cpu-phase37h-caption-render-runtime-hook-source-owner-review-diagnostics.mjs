#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37h_caption_render_runtime_hook_source_owner_review_passed_with_warnings_ready_for_static_integration_plan_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37h_actual_caption_render_runtime_hook_source_created_with_warnings_ready_for_source_owner_review_no_execution'
const SOURCE_PR = 1608
const SOURCE_MERGE_COMMIT = 'be732de9542abd24396526ae3b636f5e31600630'
const SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37I-CAPTION-RENDER-RUNTIME-HOOK-STATIC-INTEGRATION-PLAN'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-acceptance-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-safety-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-safety-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-plan',
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
  'childProcessImport',
  'dockerCommand',
  'dry_run_passed',
  'filesystemOrNetworkExecutionCodePresent',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'mediaByteProcessing',
  'mediaProcessing',
  'mediaRenderArtifactExecutionCodePresent',
  'networkFetch',
  'nodeFilesystemImport',
  'ocrInference',
  'paidProductionAllowed',
  'providerModelCall',
  'rawFrameOrRawOcrInputAccepted',
  'realUserMediaBetaAllowed',
  'renderExecution',
  'renderExecutionApprovedToday',
  'routeExecution',
  'runtimeHookImplementationApprovedToday',
  'runtimeReady',
  'serviceRolePayloadAccepted',
  'signedUrlSourceAccepted',
  'sqlExecution',
  'supabaseMutation',
  'toolCallReady',
  'toolExecution',
  'workerDispatch',
  'workerExecution',
  'workerExecutionApprovedToday',
  'workerReady',
  'workerRouteToolProviderExecutionCodePresent',
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

function assertSourceDoesNotContain(source, patterns) {
  for (const [label, pattern] of patterns) {
    assert(!pattern.test(source), `${SOURCE_PATH} contains forbidden ${label}`)
  }
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

const source = read(SOURCE_PATH)
assert(source.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'blocked result factory missing')
assert(source.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'execution blocked assertion missing')
assert(source.includes('assertSoundCpuRuntimeDisabledFlags'), 'disabled flag assertion missing')
assert(source.includes('rawFrames'), 'raw frame rejection missing')
assert(source.includes('runtimeExecutionApproved: false'), 'runtime execution false default missing')
assert(source.includes('workerExecutionApproved: false'), 'worker execution false default missing')
assert(source.includes('renderExecutionApproved: false'), 'render execution false default missing')
assert(source.includes('artifactCreationApproved: false'), 'artifact creation false default missing')
assertSourceDoesNotContain(source, [
  ['node fs import', /from ['"]node:fs['"]|from ['"]fs['"]/],
  ['child_process import', /child_process/],
  ['network fetch call', /\bfetch\s*\(/],
  ['Docker command execution', /\bdocker\s+(build|run|push|image)/i],
  ['GCP command execution', /\bgcloud\b|Cloud Run execution/i],
  ['Supabase client usage', /\bsupabase\b/i],
  ['SQL execution', /\bsql\b/i],
  ['artifact write call', /\bwriteFile\b|\bcreateWriteStream\b/],
])

const review = parsed.review
assert(review.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(review.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(review.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(review.reviewedSource.path === SOURCE_PATH, 'reviewed path mismatch')
assert(review.reviewedSource.acceptedForStaticIntegrationPlanning === true, 'static integration acceptance missing')
assert(review.sourceReviewFindings.blockedResultFactoryPresent === true, 'blocked result finding missing')
assert(review.sourceReviewFindings.disabledRuntimeFlagsAsserted === true, 'disabled flags finding missing')
assert(review.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(
  acceptance.acceptedForFuturePlanning.some((row) => row.item === SOURCE_PATH && row.accepted === true),
  'source acceptance row missing',
)
assert(acceptance.rejectedForToday.includes('real-user media beta'), 'beta rejection missing')
assert(acceptance.requiredFalseDefaults.runtimeHookImplementationApprovedToday === false, 'implementation gate widened')

const safety = parsed.safety
assert(safety.reviewedSourcePath === SOURCE_PATH, 'safety source path mismatch')
assert(safety.requiredSourceProperties.importsRuntimeGuards === true, 'runtime guard property missing')
assert(safety.requiredSourceProperties.rawFramesAccepted === false, 'raw frames accepted')
assert(safety.forbiddenExecutionSurface.ocrInference === false, 'OCR inference widened')

const blockers = parsed.blockers
assert(
  blockers.resolvedForOwnerReview.some((row) => row.blockerId === 'phase37h_source_owner_review_pending'),
  'owner-review blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37i_static_integration_plan_pending'),
  'static integration blocker missing',
)

const claims = parsed.claims
assert(claims.allowedClaims.phase37HSourceOwnerReviewCompleted === true, 'owner-review claim missing')
assert(claims.allowedClaims.phase37IStaticIntegrationPlanMayProceed === true, 'static integration handoff missing')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness widened')
assert(claims.noScopeStatement.includes('Phase 37H owner review accepted only static-integration planning'), 'no-scope clause missing')

const sourceResult = read('docs/worker-runtime-jobs-sound-cpu-phase37h-actual-caption-render-runtime-hook-source-result.md')
assert(sourceResult.includes(SOURCE_DECISION), 'source result decision missing')
assert(sourceResult.includes(SOURCE_PATH), 'source result path missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37h-caption-render-runtime-hook-source-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-owner-review-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: SOURCE_PR,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  reviewedSourcePath: SOURCE_PATH,
  acceptedForStaticIntegrationPlanning: true,
  acceptedForRuntimeExecutionToday: false,
  acceptedForWorkerExecutionToday: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
