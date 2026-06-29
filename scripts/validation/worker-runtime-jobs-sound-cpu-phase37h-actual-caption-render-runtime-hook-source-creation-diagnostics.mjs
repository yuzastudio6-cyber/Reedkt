#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37h_actual_caption_render_runtime_hook_source_created_with_warnings_ready_for_source_owner_review_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37g_caption_render_runtime_hook_source_owner_review_passed_with_warnings_ready_for_actual_source_creation_no_execution'
const SOURCE_PR = 1602
const SOURCE_MERGE_COMMIT = '4c192b78d316b97bdf9558fad23225e3ee5139ae'
const SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37H-ACTUAL-CAPTION-RENDER-RUNTIME-HOOK-SOURCE-OWNER-REVIEW'

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-actual-caption-render-runtime-hook-source-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-actual-caption-render-runtime-hook-source-result',
  },
  content: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-content-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-source-content-register',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-no-execution-validation.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-no-execution-validation',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-caption-render-runtime-hook-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37h-actual-caption-render-runtime-hook-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37h-actual-caption-render-runtime-hook-source-owner-review',
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
  'artifactCreationApproved',
  'artifactCreationApprovedToday',
  'captionRenderRuntimeHookExecution',
  'captionRenderRuntimeHookExecutionApprovedToday',
  'childProcessImport',
  'dockerCommand',
  'dockerBuildRunPush',
  'dry_run_passed',
  'frameExtraction',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'mediaByteProcessing',
  'mediaProcessing',
  'mediaProcessingApproved',
  'networkFetch',
  'nodeFilesystemImport',
  'ocrInference',
  'ocrRuntimeExecution',
  'paidProductionAllowed',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'remotionRenderWorkerExecution',
  'renderExecution',
  'renderExecutionApproved',
  'renderExecutionApprovedToday',
  'routeExecution',
  'runtimeHookImplementationApprovedToday',
  'runtimeReady',
  'sqlExecution',
  'supabaseMutation',
  'toolCallReady',
  'toolExecution',
  'workerDispatch',
  'workerExecution',
  'workerExecutionApproved',
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
assert(source.includes('SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME'), 'hook name constant missing')
assert(source.includes('ocrCaptionRenderSafeZonePlanningHook'), 'hook name value missing')
assert(source.includes('source_created_execution_blocked'), 'source status missing')
assert(source.includes('SoundCpuOcrCaptionRenderSafeZoneHookInput'), 'input type missing')
assert(source.includes('SoundCpuOcrCaptionRenderSafeZoneHookResult'), 'result type missing')
assert(source.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'blocked result factory missing')
assert(source.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'blocked execution assertion missing')
assert(source.includes('assertSoundCpuRuntimeDisabledFlags'), 'runtime disabled guard missing')
assert(source.includes('runtimeExecutionApproved: false'), 'runtime execution false default missing')
assert(source.includes('workerExecutionApproved: false'), 'worker execution false default missing')
assert(source.includes('renderExecutionApproved: false'), 'render execution false default missing')
assert(source.includes('mediaProcessingApproved: false'), 'media processing false default missing')
assert(source.includes('artifactCreationApproved: false'), 'artifact creation false default missing')
assert(source.includes('rawFrames'), 'raw frame rejection missing')
assert(source.includes('rawOcrTextFromControlledMedia'), 'raw OCR rejection missing')
assert(source.includes('mediaFilePathsForExecution'), 'media path rejection missing')

assertSourceDoesNotContain(source, [
  ['node fs import', /from ['"]node:fs['"]|from ['"]fs['"]/],
  ['child_process import', /child_process/],
  ['network fetch call', /\bfetch\s*\(/],
  ['Docker command execution', /\bdocker\s+(build|run|push|image)/i],
  ['GCP command execution', /\bgcloud\b|Cloud Run execution/i],
  ['Supabase client usage', /\bsupabase\b/i],
  ['SQL execution', /\bsql\b/i],
  ['worker dispatch call', /\bdispatch\b|\bclaim\b|\blease\b/],
  ['artifact write call', /\bwriteFile\b|\bcreateWriteStream\b/],
])

const result = parsed.result
assert(result.sourceOwnerReviewDecision === SOURCE_DECISION, 'source owner-review decision mismatch')
assert(result.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(result.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(result.createdSource.path === SOURCE_PATH, 'created source path mismatch')
assert(result.createdSource.sourceCreatedInThisGate === true, 'source creation claim missing')
assert(result.createdSource.sourceStatus === 'source_created_execution_blocked', 'source status mismatch')
assert(result.selectedNextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const content = parsed.content
assert(content.sourceFile === SOURCE_PATH, 'content register source path mismatch')
assert(content.exportedFunctions.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'content register factory missing')
assert(content.requiredRuntimeGuards.includes('assertSoundCpuRuntimeDisabledFlags'), 'content register guard missing')
assert(content.resultShape.ownerGateRequired === 'WORKER_RUNTIME_JOBS', 'content register owner gate mismatch')

const validation = parsed.validation
assert(validation.validatedSourcePath === SOURCE_PATH, 'validation source path mismatch')
assert(validation.staticSafetyAssertions.nodeFilesystemImport === false, 'filesystem import widened')
assert(validation.staticSafetyAssertions.ocrInference === false, 'OCR inference widened')
assert(validation.requiredFalseDefaults.runtimeReady === false, 'runtime readiness widened')
assert(validation.packageLockStatus.changed === false, 'package-lock changed claim mismatch')

const blockers = parsed.blockers
assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'actual_runtime_hook_source_creation_pending'),
  'source creation blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37h_source_owner_review_pending'),
  'source owner-review blocker missing',
)
assert(blockers.runtimeGates.sourceCreatedInThisGate === true, 'source-created runtime gate missing')
assert(blockers.runtimeGates.workerExecution === false, 'worker execution gate widened')

const claims = parsed.claims
assert(claims.allowedClaims.phase37HSourceCreated === true, 'source-created claim missing')
assert(claims.allowedClaims.sourceOwnerReviewMayProceed === true, 'source owner-review handoff missing')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness claim widened')
assert(claims.noScopeStatement.includes('Phase 37H created only a fail-closed'), 'Phase 37H no-scope clause missing')

const sourceReview = read('docs/worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-review.md')
assert(sourceReview.includes(SOURCE_DECISION), 'source review decision missing')
assert(
  sourceReview.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37H-ACTUAL-CAPTION-RENDER-RUNTIME-HOOK-SOURCE-CREATION'),
  'source review next prompt missing',
)

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37h-actual-caption-render-runtime-hook-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37h-actual-caption-render-runtime-hook-source-creation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: SOURCE_PR,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  createdSourcePath: SOURCE_PATH,
  sourceCreatedInThisGate: true,
  runtimeHookImplementationApprovedToday: false,
  captionRenderRuntimeHookExecutionApprovedToday: false,
  workerExecutionApprovedToday: false,
  renderExecutionApprovedToday: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
