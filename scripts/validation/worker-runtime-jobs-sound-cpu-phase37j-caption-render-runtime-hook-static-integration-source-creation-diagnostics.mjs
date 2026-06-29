#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37j_caption_render_runtime_hook_static_integration_source_created_with_warnings_ready_for_source_owner_review_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37i_caption_render_runtime_hook_static_integration_owner_review_passed_with_warnings_ready_for_static_integration_source_creation_no_execution'
const SOURCE_PR = 1621
const SOURCE_MERGE_COMMIT = '347c0546e53b070a89f233bf5fafc7c21b2c9eeb'
const SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const INTEGRATION_TARGET = 'server/workers/sound-cpu/index.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37J-CAPTION-RENDER-RUNTIME-HOOK-STATIC-INTEGRATION-SOURCE-OWNER-REVIEW'
const EXPORT_SOURCE = './runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const EXPORTS = [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_BLOCKED_REASON',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS',
  'assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked',
  'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult',
  'type SoundCpuOcrCaptionRenderSafeZoneHookInput',
  'type SoundCpuOcrCaptionRenderSafeZoneHookResult',
]

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-result',
  },
  exports: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-export-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-export-register',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-validation-report.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-validation-report',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-review',
  },
}

const FALSE_FIELDS = new Set([
  'acceptedForPaidProductionToday',
  'acceptedForRealUserMediaBetaToday',
  'artifactCreated',
  'artifactCreation',
  'artifactCreationAllowed',
  'blockedAssertionCalledInThisGate',
  'callsBlockedAssertion',
  'callsHookFactory',
  'captionRenderRuntimeHookExecution',
  'captionRenderRuntimeHookExecutionRun',
  'controlled static import proof execution',
  'dockerBuildRunPush',
  'dry_run_passed',
  'gcpCloudRunSecretManager',
  'generated_local_fixture_passed',
  'hookFactoryCalledInThisGate',
  'hookFunctionCalledInThisGate',
  'importsMediaOrFilesystem',
  'mediaProcessing',
  'mediaProcessingAllowed',
  'mediaProcessingRun',
  'ocrInference',
  'ocrInferenceRun',
  'paidProductionAllowed',
  'paidProductionClaimed',
  'providerModelCall',
  'providerModelCallRun',
  'realUserMediaBetaAllowed',
  'realUserMediaBetaClaimed',
  'renderExecution',
  'renderExecutionAllowed',
  'routeExecution',
  'routeExecutionRun',
  'runsDockerOrGcp',
  'spawnsProcess',
  'sqlExecution',
  'staticImportProofCreatedInThisGate',
  'staticImportProofRunInThisGate',
  'supabaseMutation',
  'supabaseOrSqlRun',
  'toolCallReady',
  'toolExecution',
  'toolExecutionRun',
  'touchesSupabaseOrSql',
  'workerExecution',
  'workerExecutionAllowed',
  'workerExecutionRun',
  'workerReady',
  'writesArtifact',
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

const indexText = read(INTEGRATION_TARGET)
const sourceText = read(SOURCE_PATH)
assert(sourceText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'hook blocked result source missing')
assert(sourceText.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'hook blocked assertion source missing')
assert(indexText.includes(`} from '${EXPORT_SOURCE}'`), 'index export block source mismatch')
for (const symbol of EXPORTS) {
  assert(indexText.includes(symbol), `index missing export ${symbol}`)
}
assert(!/createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult\s*\(/.test(indexText), 'index must not call hook factory')
assert(!/assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked\s*\(/.test(indexText), 'index must not call blocked assertion')
assert(!/from ['"]node:fs['"]|from ['"]fs['"]|child_process|fetch\s*\(|writeFile|createWriteStream/.test(indexText), 'index contains forbidden runtime I/O marker')

const result = parsed.result
assert(result.sourceVerification.sourceHead === SOURCE_MERGE_COMMIT, 'source head mismatch')
assert(result.sourceVerification.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(result.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(result.sourceVerification.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.sourceResult.indexExportSourceCreated === true, 'index export source not recorded')
assert(result.sourceResult.integrationTarget === INTEGRATION_TARGET, 'integration target mismatch')
assert(result.sourceResult.hookSourcePath === SOURCE_PATH, 'hook source path mismatch')
assert(result.sourceResult.exportedSymbolCount === EXPORTS.length, 'export count mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const exportRegister = parsed.exports
assert(exportRegister.integrationTarget === INTEGRATION_TARGET, 'export register target mismatch')
assert(exportRegister.hookSourcePath === SOURCE_PATH, 'export register source mismatch')
assert(exportRegister.exportedSymbols.length === EXPORTS.length, 'export register symbol count mismatch')
for (const symbol of EXPORTS) {
  const normalized = symbol.replace(/^type /, '')
  assert(exportRegister.exportedSymbols.some((row) => row.symbol === normalized), `export register missing ${symbol}`)
}
assert(exportRegister.sourceCreationBoundaries.indexExportCreatedInThisGate === true, 'index export source creation not recorded')
assert(exportRegister.sourceCreationBoundaries.staticImportProofRunInThisGate === false, 'static import proof widened')

const validation = parsed.validation
assert(validation.staticSourceChecks.integrationTargetExists === true, 'validation target exists missing')
assert(validation.staticSourceChecks.hookSourceExists === true, 'validation hook exists missing')
assert(validation.staticSourceChecks.exportBlockPresent === true, 'validation export block missing')
assert(validation.staticSourceChecks.exportedSymbolCount === EXPORTS.length, 'validation export count mismatch')
assert(validation.staticSourceChecks.usesStaticReExportOnly === true, 'static re-export check missing')

const blockers = parsed.blockers
assert(
  blockers.resolvedForSourceCreation.some((row) => row.blockerId === 'phase37j_static_integration_source_creation_pending'),
  'source-creation blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37j_static_integration_source_owner_review_pending'),
  'source owner-review blocker missing',
)
assertSupabaseNoop(blockers.supabaseClassification, 'blockers')

const claims = parsed.claims
assert(claims.allowedClaims.phase37JStaticIntegrationSourceCreated === true, 'source-created allowed claim missing')
assert(claims.allowedClaims.futureSourceOwnerReviewRequired === true, 'future owner review allowed claim missing')
assert(claims.blockedClaims.staticImportProofRunInThisGate === false, 'static import proof claim widened')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness widened')
assert(claims.noScopeStatement.includes('Phase 37J created static index export source only'), 'no-scope source clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'owner-review prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'owner-review prompt source head mismatch')
assert(prompt.sourcePath === SOURCE_PATH, 'owner-review prompt source path mismatch')
assert(prompt.integrationTarget === INTEGRATION_TARGET, 'owner-review prompt target mismatch')

const ownerReview = read('docs/worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-review.md')
assert(ownerReview.includes(SOURCE_DECISION), 'Phase 37I owner-review decision missing')
assert(ownerReview.includes(NEXT_PROMPT.replace('PHASE37J', 'PHASE37J').replace('SOURCE-OWNER-REVIEW', 'SOURCE-CREATION')), 'Phase 37J source-creation handoff missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-creation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-creation-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  sourcePr: SOURCE_PR,
  sourceMergeCommit: SOURCE_MERGE_COMMIT,
  integrationTarget: INTEGRATION_TARGET,
  hookSourcePath: SOURCE_PATH,
  indexExportSourceCreated: true,
  exportedSymbolCount: EXPORTS.length,
  staticImportProofRunInThisGate: false,
  realUserMediaBetaAllowed: false,
  paidProductionAllowed: false,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
