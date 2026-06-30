#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase47_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_passed_with_warnings_ready_for_import_proof_owner_review_no_media_no_artifacts'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase46_caption_render_runtime_hook_blocked_state_source_static_validation_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_media_no_artifacts'
const SOURCE_PR = 1783
const SOURCE_HEAD = '88eb0b6a0953c7d019ef01d5d22e3ec50978a7e1'
const SOURCE_MERGE_COMMIT = 'ce9f218e4a0710a5072a170a91a8dd0eb0e51647'
const STATIC_VALIDATION_PR = 1780
const STATIC_VALIDATION_MERGE_COMMIT = '8d659c0e15a4b91ae69fc8e1a397e8755d81dee5'
const INTEGRATION_TARGET = 'server/workers/sound-cpu/index.ts'
const HOOK_SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts'
const BLOCKED_STATE_SOURCE_PATH =
  'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts'
const RUNTIME_SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const TEMP_PROOF_FILE =
  'server/workers/sound-cpu/phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof.tmp.ts'
const TEMP_PROOF_HASH = '665f4231682163d439517948924ab770a288d5fbecbf379d66d7fe625ab66bbe'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE47-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF-OWNER-REVIEW'
const PACKAGE_SCRIPT =
  'worker-runtime-jobs:sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof:diagnostics'

const EXPORTS = [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_HOOK_SOURCE_STATUS',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_BLOCKED_STATE_INTEGRATION_STATUS',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS',
  'SoundCpuOcrCaptionRenderSafeZoneHookInput',
  'SoundCpuOcrCaptionRenderSafeZoneHookResult',
  'SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationInput',
  'SoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult',
  'SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationInput',
  'SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationResult',
  'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult',
  'createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult',
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
  'assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked',
  'assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked',
]

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-result.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-result',
  },
  symbols: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-symbol-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-symbol-register',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-validation-report.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-validation-report',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-blocker-register.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-claim-policy.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review.md',
    label:
      'worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review',
  },
}

const FALSE_FIELDS = new Set([
  'artifactCreation',
  'artifactOutputAllowed',
  'blockedAssertionInvoked',
  'blockedAssertionInvocationAllowed',
  'captionRenderRuntimeExecution',
  'dockerOrGcpExecution',
  'dry_run_passed',
  'factoryInvoked',
  'factoryInvocationAllowed',
  'generated_local_fixture_passed',
  'mediaInputAllowed',
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
    } else if (entry.name.includes('phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof.tmp')) {
      matches.push(next)
    }
  }
  return matches
}

function assertAbsent(text, pattern, label) {
  assert(!pattern.test(text), `${label} must be absent`)
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
  path: 'docs/worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review.md',
  label:
    'worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review',
})
assert(sourceReview.decision === SOURCE_DECISION, 'Phase 46 owner-review decision mismatch')
assert(sourceReview.sourceVerification.sourcePr === STATIC_VALIDATION_PR, 'Phase 46 static validation PR mismatch')
assert(
  sourceReview.sourceVerification.sourceMergeCommit === STATIC_VALIDATION_MERGE_COMMIT,
  'Phase 46 static validation merge mismatch',
)

const indexText = read(INTEGRATION_TARGET)
for (const source of [
  './runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts',
  './runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts',
  './runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts',
]) {
  assert(indexText.includes(`} from '${source}'`), `index export block source mismatch: ${source}`)
}
for (const symbol of EXPORTS) {
  assert(indexText.includes(symbol), `index missing export ${symbol}`)
}
for (const forbiddenCall of [
  'createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult',
  'createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult',
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
  'assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked',
  'assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked',
]) {
  assert(!new RegExp(`${forbiddenCall}\\s*\\(`).test(indexText), `index must not call ${forbiddenCall}`)
}

for (const sourcePath of [HOOK_SOURCE_PATH, BLOCKED_STATE_SOURCE_PATH, RUNTIME_SOURCE_PATH]) {
  const sourceText = read(sourcePath)
  for (const snippet of [
    'runtimeExecutionApproved: false',
    'workerExecutionApproved: false',
    'mediaProcessingApproved: false',
    'artifactCreationApproved: false',
    'noArtifactCreated: true',
  ]) {
    assert(sourceText.includes(snippet), `Missing fail-closed snippet in ${sourcePath}: ${snippet}`)
  }
  assertAbsent(sourceText, /\bfs\./, `${sourcePath} filesystem operation`)
  assertAbsent(sourceText, /fetch\s*\(/, `${sourcePath} fetch call`)
  assertAbsent(sourceText, /child_process|exec\s*\(|spawn\s*\(/, `${sourcePath} process spawn`)
  assertAbsent(
    sourceText,
    /audio_open|ffmpeg|ffprobe|pydub|ocrInference|renderCaption|writeArtifact|createSignedUrl/,
    `${sourcePath} media or artifact operation`,
  )
  assertAbsent(
    sourceText,
    /createClient\(|\.from\(|\.insert\(|\.update\(|\.delete\(|sql`|executeSql|service[_-]role/i,
    `${sourcePath} Supabase or SQL-like operation`,
  )
}

const result = parsed.result
assert(result.sourceVerification.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceVerification.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(result.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge commit mismatch')
assert(result.sourceVerification.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.sourceVerification.staticValidationPr === STATIC_VALIDATION_PR, 'static validation PR mismatch')
assert(result.sourceVerification.staticValidationMergeCommit === STATIC_VALIDATION_MERGE_COMMIT, 'static validation merge mismatch')
assert(result.proofResult.temporaryProofFile === TEMP_PROOF_FILE, 'temporary proof path mismatch')
assert(result.proofResult.temporaryProofFileCreated === true, 'temporary proof creation not recorded')
assert(result.proofResult.temporaryProofFileSha256 === TEMP_PROOF_HASH, 'temporary proof hash mismatch')
assert(result.proofResult.temporaryProofFileLineCount === 60, 'temporary proof line count mismatch')
assert(result.proofResult.temporaryProofFileRemovedBeforeStaging === true, 'temporary proof cleanup not recorded')
assert(result.proofResult.temporaryProofFileCallExpressionsFound === false, 'temporary proof call scan widened')
assert(result.proofResult.importedFrom === INTEGRATION_TARGET, 'proof import target mismatch')
assert(result.proofResult.hookSourcePath === HOOK_SOURCE_PATH, 'hook path mismatch')
assert(result.proofResult.blockedStateIntegrationPath === BLOCKED_STATE_SOURCE_PATH, 'blocked-state path mismatch')
assert(result.proofResult.runtimeIntegrationPath === RUNTIME_SOURCE_PATH, 'runtime path mismatch')
assert(result.proofResult.importedSymbolCount === EXPORTS.length, 'proof symbol count mismatch')
assert(result.proofResult.expectedCommand === 'npx tsc -b', 'expected proof command mismatch')
assert(result.proofResult.expectedCommandPassed === true, 'npx tsc proof result missing')
assert(result.proofResult.serverTypecheckCommand === 'npm run typecheck:server', 'server proof command mismatch')
assert(result.proofResult.serverTypecheckCoveredTemporaryProofFile === true, 'server typecheck coverage missing')
assert(result.proofResult.serverTypecheckPassed === true, 'server typecheck pass missing')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const symbols = parsed.symbols
assert(symbols.integrationTarget === INTEGRATION_TARGET, 'symbol register target mismatch')
assert(symbols.importedSymbols.length === EXPORTS.length, 'symbol register count mismatch')
for (const symbol of EXPORTS) {
  const row = symbols.importedSymbols.find((entry) => entry.symbol === symbol)
  assert(row, `symbol register missing ${symbol}`)
  assert(row.imported === true, `${symbol} import missing`)
  assert(row.usedForTypeOrConstVisibilityOnly === true, `${symbol} visibility marker missing`)
  assert(row.invoked === false, `${symbol} must not be invoked`)
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
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'phase47_controlled_import_proof_pending'),
  'Phase 47 proof blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'phase47_import_proof_owner_review_pending'),
  'Phase 47 owner review blocker missing',
)

const claims = parsed.claims
assert(claims.allowedClaims.phase47ControlledImportProofPassed === true, 'allowed proof claim missing')
assert(claims.allowedClaims.captionHookExportsImportableFromSoundCpuIndex === true, 'hook importable claim missing')
assert(claims.allowedClaims.blockedStateIntegrationExportsImportableFromSoundCpuIndex === true, 'blocked-state importable claim missing')
assert(claims.allowedClaims.runtimeIntegrationExportsImportableFromSoundCpuIndex === true, 'runtime importable claim missing')
assert(claims.allowedClaims.temporaryProofFileRemovedBeforeStaging === true, 'cleanup claim missing')
assert(claims.blockedClaims.runtimeReady === false, 'runtime readiness widened')
assert(claims.blockedClaims.realUserMediaBetaAllowed === false, 'beta claim widened')
assert(claims.noScopeStatement.includes('static import/type visibility only'), 'no-scope proof clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'owner review prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'owner review prompt source head mismatch')
assert(prompt.integrationTarget === INTEGRATION_TARGET, 'owner review prompt target mismatch')
assert(prompt.proofEvidence.temporaryProofFileRemovedBeforeStaging === true, 'prompt cleanup evidence missing')
assert(prompt.proofEvidence.temporaryProofFileSha256 === TEMP_PROOF_HASH, 'prompt temporary proof hash mismatch')
assert(prompt.proofEvidence.expectedCommand === 'npx tsc -b', 'prompt expected command mismatch')
assert(prompt.proofEvidence.importedSymbolCount === EXPORTS.length, 'prompt imported symbol count mismatch')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[PACKAGE_SCRIPT] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-diagnostics.mjs',
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
      realMediaInput: false,
      artifactCreation: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
