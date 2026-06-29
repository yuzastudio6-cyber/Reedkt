#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase37k_caption_render_runtime_hook_controlled_static_import_proof_passed_with_warnings_ready_for_import_proof_owner_review_no_execution'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase37j_caption_render_runtime_hook_static_integration_source_owner_review_passed_with_warnings_ready_for_controlled_static_import_proof_no_execution'
const SOURCE_PR = 1628
const SOURCE_MERGE_COMMIT = 'c61b0b13dfd012465e4c999bac1fca006ec1729d'
const STATIC_EXPORT_SOURCE_PR = 1625
const STATIC_EXPORT_SOURCE_MERGE_COMMIT = '7809828ff16bb0f676c501a790a5b8e68aaabdae'
const INTEGRATION_TARGET = 'server/workers/sound-cpu/index.ts'
const HOOK_SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const TEMP_PROOF_FILE =
  'server/workers/sound-cpu/phase37k-caption-render-runtime-hook-controlled-static-import-proof.tmp.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37K-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-STATIC-IMPORT-PROOF-OWNER-REVIEW'
const PACKAGE_SCRIPT =
  'worker-runtime-jobs:sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof:diagnostics'
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
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-result',
  },
  symbols: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-symbol-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-symbol-register',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-validation-report.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-validation-report',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-review',
  },
}

const FALSE_FIELDS = new Set([
  'artifactCreation',
  'blockedAssertionInvoked',
  'blockedAssertionInvocationAllowed',
  'captionRenderRuntimeExecution',
  'dockerOrGcpExecution',
  'dry_run_passed',
  'generated_local_fixture_passed',
  'hookFactoryInvoked',
  'hookFactoryInvocationAllowed',
  'mediaProcessing',
  'nodeModulesStaged',
  'ocrInference',
  'packageLockChanged',
  'paidProductionAllowed',
  'providerModelCall',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'runtimeExecution',
  'runtimeExecutionAllowed',
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

function walk(path, matches = []) {
  if (!existsSync(path)) return matches
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const next = join(path, entry.name)
    if (entry.isDirectory()) {
      walk(next, matches)
    } else if (entry.name.includes('phase37k-caption-render-runtime-hook-controlled-static-import-proof.tmp')) {
      matches.push(next)
    }
  }
  return matches
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

assert(!existsSync(TEMP_PROOF_FILE), 'temporary proof file must be removed before staging')
assert(walk('server/workers/sound-cpu').length === 0, 'temporary proof file remnant found')

const sourceReview = parseBlock({
  path: 'docs/worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-review.md',
  label: 'worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-review',
})
assert(sourceReview.decision === SOURCE_DECISION, 'Phase 37J source owner-review decision mismatch')
assert(sourceReview.sourcePr === STATIC_EXPORT_SOURCE_PR, 'Phase 37J static export source PR mismatch')
assert(sourceReview.sourceMergeCommit === STATIC_EXPORT_SOURCE_MERGE_COMMIT, 'Phase 37J static export merge mismatch')

const indexText = read(INTEGRATION_TARGET)
const hookText = read(HOOK_SOURCE_PATH)
assert(indexText.includes(`} from '${EXPORT_SOURCE}'`), 'index export block source mismatch')
assert(hookText.includes('createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult'), 'hook factory source missing')
assert(hookText.includes('assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked'), 'blocked assertion source missing')
for (const symbol of EXPORTS) {
  assert(indexText.includes(symbol), `index missing export ${symbol}`)
}
assert(!/createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult\s*\(/.test(indexText), 'index must not call hook factory')
assert(!/assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked\s*\(/.test(indexText), 'index must not call blocked assertion')

const result = parsed.result
assert(result.sourceVerification.sourceHead === SOURCE_MERGE_COMMIT, 'source head mismatch')
assert(result.sourceVerification.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(result.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(result.sourceVerification.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.sourceVerification.staticExportSourcePr === STATIC_EXPORT_SOURCE_PR, 'static export source PR mismatch')
assert(result.proofResult.temporaryProofFile === TEMP_PROOF_FILE, 'temporary proof path mismatch')
assert(result.proofResult.temporaryProofFileCreated === true, 'temporary proof creation not recorded')
assert(result.proofResult.temporaryProofFileRemovedBeforeStaging === true, 'temporary proof cleanup not recorded')
assert(result.proofResult.importedFrom === INTEGRATION_TARGET, 'proof import target mismatch')
assert(result.proofResult.hookSourcePath === HOOK_SOURCE_PATH, 'hook source path mismatch')
assert(result.proofResult.importedSymbolCount === EXPORTS.length, 'proof symbol count mismatch')
assert(result.proofResult.expectedCommand === 'npx tsc -b', 'expected proof command mismatch')
assert(result.proofResult.expectedCommandPassed === true, 'npx tsc proof result missing')
assert(result.proofResult.serverTypecheckCommand === 'npm run typecheck:server', 'server proof command mismatch')
assert(result.proofResult.serverTypecheckCoveredTemporaryProofFile === true, 'server typecheck coverage missing')
assert(result.proofResult.serverTypecheckPassed === true, 'server typecheck pass missing')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const symbols = parsed.symbols
assert(symbols.integrationTarget === INTEGRATION_TARGET, 'symbol register target mismatch')
assert(symbols.hookSourcePath === HOOK_SOURCE_PATH, 'symbol register hook path mismatch')
assert(symbols.importedSymbols.length === EXPORTS.length, 'symbol register count mismatch')
for (const symbol of EXPORTS) {
  const normalized = symbol.replace(/^type /, '')
  const row = symbols.importedSymbols.find((entry) => entry.symbol === normalized)
  assert(row, `symbol register missing ${normalized}`)
  assert(row.imported === true, `${normalized} import missing`)
  assert(row.invoked === false, `${normalized} must not be invoked`)
}

const validation = parsed.validation
const commands = validation.controlledProofCommands.map((entry) => entry.command)
assert(commands.includes('npx tsc -b'), 'validation report missing npx tsc -b')
assert(commands.includes('npm run typecheck:server'), 'validation report missing server typecheck')
assert(validation.controlledProofCommands.every((entry) => entry.result === 'passed'), 'controlled proof command did not pass')
assert(validation.validationBoundaries.temporaryProofFileRemovedBeforeStaging === true, 'validation cleanup marker missing')
assert(validation.validationBoundaries.distStaged === false, 'dist staged marker widened')
assert(validation.validationBoundaries.distServerStaged === false, 'dist-server staged marker widened')

const blockers = parsed.blockers
assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase37k_controlled_static_import_proof_pending'),
  'Phase 37K proof blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase37k_import_proof_owner_review_pending'),
  'Phase 37K owner review blocker missing',
)
assertSupabaseNoop(blockers.supabaseClassification, 'blockers')

const claims = parsed.claims
assert(claims.allowedClaims.phase37KControlledStaticImportProofPassed === true, 'allowed proof claim missing')
assert(claims.allowedClaims.hookExportsImportableFromSoundCpuIndex === true, 'importable claim missing')
assert(claims.allowedClaims.temporaryProofFileRemovedBeforeStaging === true, 'cleanup claim missing')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness widened')
assert(claims.blockedClaims.realUserMediaBetaAllowed === false, 'beta claim widened')
assert(claims.noScopeStatement.includes('static import/type visibility only'), 'no-scope proof clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'owner review prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'owner review prompt source head mismatch')
assert(prompt.integrationTarget === INTEGRATION_TARGET, 'owner review prompt target mismatch')
assert(prompt.hookSourcePath === HOOK_SOURCE_PATH, 'owner review prompt hook path mismatch')
assert(prompt.proofEvidence.temporaryProofFileRemovedBeforeStaging === true, 'prompt cleanup evidence missing')
assert(prompt.proofEvidence.expectedCommand === 'npx tsc -b', 'prompt expected command mismatch')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[PACKAGE_SCRIPT] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      sourcePr: SOURCE_PR,
      sourceMergeCommit: SOURCE_MERGE_COMMIT,
      importedSymbolCount: EXPORTS.length,
      temporaryProofFileRemoved: true,
      runtimeExecution: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
