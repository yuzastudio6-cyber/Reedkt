#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DECISION =
  'worker_runtime_jobs_sound_cpu_phase41_caption_render_runtime_hook_blocked_state_static_import_proof_passed_with_warnings_ready_for_static_import_proof_owner_review_no_media_no_artifacts'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_phase40_caption_render_runtime_hook_blocked_state_index_export_source_gate_completed_with_warnings_ready_for_static_import_proof_no_media_no_artifacts'
const SOURCE_PR = 1746
const SOURCE_MERGE_COMMIT = 'f3002b202b961a1ad7a9d9ca48c84fa4ad6a1ae3'
const IMPORT_TARGET = 'server/workers/sound-cpu/index.ts'
const RUNTIME_SOURCE_PATH = 'server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'
const TEMP_PROOF_FILE =
  'server/workers/sound-cpu/phase41-caption-render-runtime-hook-blocked-state-static-import-proof.tmp.ts'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE41-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-STATIC-IMPORT-PROOF-OWNER-REVIEW'
const PACKAGE_SCRIPT =
  'worker-runtime-jobs:sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof:diagnostics'
const SCRIPT_COMMAND =
  'node scripts/validation/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-diagnostics.mjs'

const EXPORTED_SYMBOLS = [
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_BLOCKED_REASON',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_NAME',
  'SOUND_CPU_OCR_CAPTION_RENDER_SAFE_ZONE_RUNTIME_INTEGRATION_STATUS',
  'assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked',
  'createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult',
  'SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationInput',
  'SoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationResult',
]

const DOCS = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-result',
  },
  symbols: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-symbol-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-symbol-register',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-validation-report.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-validation-report',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof-owner-review',
  },
}

const FALSE_FIELDS = new Set([
  'artifactCreation',
  'artifactCreationApprovedToday',
  'artifactReadiness',
  'betaUnlock',
  'blockedAssertionInvoked',
  'blockedAssertionInvocationAllowed',
  'blockedResultFactoryInvoked',
  'blockedResultFactoryInvocationAllowed',
  'dispatchWiring',
  'dispatchWiringChanged',
  'dispatchWiringChangedToday',
  'distServerStaged',
  'distStaged',
  'dry_run_passed',
  'generated_local_fixture_passed',
  'hookExecuted',
  'hookExecution',
  'hookExecutionApprovedToday',
  'hookExecutionToday',
  'mediaProcessing',
  'mediaProcessingApprovedToday',
  'mediaReadiness',
  'nodeModulesStaged',
  'packageLockChanged',
  'paidProductionAllowed',
  'productionUnlock',
  'providerModelCall',
  'providerModelCallApprovedToday',
  'realUserMediaBetaAllowed',
  'routeExecution',
  'routeExecutionApprovedToday',
  'runtimeExecution',
  'runtimeExecutionAllowed',
  'runtimeExecutionApprovedToday',
  'runtimeReadiness',
  'sqlExecution',
  'supabaseMutation',
  'supabaseSql',
  'supabaseSqlApprovedToday',
  'toolExecution',
  'toolExecutionApprovedToday',
  'workerExecution',
  'workerExecutionApprovedToday',
  'workerReadiness',
])

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  assert(existsSync(relativePath), `Missing required file: ${relativePath}`)
  return readFileSync(relativePath, 'utf8')
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

function walkForTemporaryProof(path, matches = []) {
  if (!existsSync(path)) return matches
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const next = join(path, entry.name)
    if (entry.isDirectory()) {
      walkForTemporaryProof(next, matches)
    } else if (entry.name.includes('phase41-caption-render-runtime-hook-blocked-state-static-import-proof.tmp')) {
      matches.push(next)
    }
  }
  return matches
}

const parsed = Object.fromEntries(Object.entries(DOCS).map(([key, info]) => [key, parseBlock(info)]))

for (const [key, doc] of Object.entries(parsed)) {
  assert(doc.owner === 'WORKER_RUNTIME_JOBS', `${key} owner mismatch`)
  if (key === 'prompt') {
    assert(doc.requiredSourceDecision === DECISION, `${key} required source decision mismatch`)
  } else {
    assert(doc.decision === DECISION, `${key} decision mismatch`)
  }
  if (doc.supabaseClassification) assertSupabaseNoop(doc.supabaseClassification, key)
  scanFalse(doc, [key])
}

assert(!existsSync(TEMP_PROOF_FILE), 'temporary proof file must be removed before staging')
assert(walkForTemporaryProof('server/workers/sound-cpu').length === 0, 'temporary proof file remnant found')

const sourceResult = parseBlock({
  path: 'docs/worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate.md',
  label: 'worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate-result',
})
assert(sourceResult.decision === SOURCE_DECISION, 'Phase 40 source decision mismatch')

const indexText = read(IMPORT_TARGET)
const runtimeSourceText = read(RUNTIME_SOURCE_PATH)
assert(
  indexText.includes("from './runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts'"),
  'index export block source mismatch',
)
for (const symbol of EXPORTED_SYMBOLS) {
  assert(indexText.includes(symbol), `index missing export ${symbol}`)
  assert(runtimeSourceText.includes(symbol), `runtime source missing symbol ${symbol}`)
}
assert(
  !/createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult\s*\(/.test(indexText),
  'index must not call blocked-result factory',
)
assert(
  !/assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked\s*\(/.test(indexText),
  'index must not call blocked assertion',
)

const result = parsed.result
assert(result.sourceVerification.sourcePr === SOURCE_PR, 'source PR mismatch')
assert(result.sourceVerification.sourceHead === SOURCE_MERGE_COMMIT, 'source head mismatch')
assert(result.sourceVerification.sourceMergeCommit === SOURCE_MERGE_COMMIT, 'source merge mismatch')
assert(result.sourceVerification.sourceDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.proofResult.temporaryProofFile === TEMP_PROOF_FILE, 'temporary proof path mismatch')
assert(result.proofResult.temporaryProofFileCreated === true, 'temporary proof creation not recorded')
assert(result.proofResult.temporaryProofFileRemovedBeforeStaging === true, 'temporary proof cleanup not recorded')
assert(result.proofResult.importedFrom === IMPORT_TARGET, 'proof import target mismatch')
assert(result.proofResult.runtimeIntegrationSourcePath === RUNTIME_SOURCE_PATH, 'proof source path mismatch')
assert(result.proofResult.importedSymbolCount === EXPORTED_SYMBOLS.length, 'proof symbol count mismatch')
assert(result.proofResult.proofCommand === 'npm run typecheck:server', 'proof command mismatch')
assert(result.proofResult.proofCommandPassed === true, 'proof command pass missing')
assert(result.proofResult.broadTypecheckCommand === 'npx tsc -b', 'broad typecheck command mismatch')
assert(result.proofResult.broadTypecheckPassed === true, 'broad typecheck pass missing')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const symbols = parsed.symbols
assert(symbols.importTarget === IMPORT_TARGET, 'symbol register target mismatch')
assert(symbols.runtimeIntegrationSourcePath === RUNTIME_SOURCE_PATH, 'symbol register runtime path mismatch')
assert(symbols.importedSymbols.length === EXPORTED_SYMBOLS.length, 'symbol register count mismatch')
for (const symbol of EXPORTED_SYMBOLS) {
  const row = symbols.importedSymbols.find((entry) => entry.symbol === symbol)
  assert(row, `symbol register missing ${symbol}`)
  assert(row.imported === true, `${symbol} import missing`)
  assert(row.usedForTypeQueryOnly === true, `${symbol} type query marker missing`)
  assert(row.invoked === false, `${symbol} must not be invoked`)
}

const validation = parsed.validation
const commands = validation.controlledProofCommands.map((entry) => entry.command)
assert(commands.includes('npm run typecheck:server'), 'validation report missing proof command')
assert(commands.includes('npx tsc -b'), 'validation report missing broad typecheck')
assert(validation.controlledProofCommands.every((entry) => entry.result === 'passed'), 'controlled proof command did not pass')
assert(validation.validationBoundaries.temporaryProofFileRemovedBeforeStaging === true, 'validation cleanup marker missing')

const blockers = parsed.blockers
assert(
  blockers.resolvedForThisGate.some((row) => row.blockerId === 'static_import_proof_pending'),
  'static import proof blocker resolution missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'static_import_proof_owner_review_pending'),
  'static import proof owner-review blocker missing',
)
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'real_user_media_beta_and_paid_production_pending'),
  'product readiness blocker missing',
)

const claims = parsed.claims
assert(claims.allowedClaims.phase41StaticImportProofPassed === true, 'allowed proof claim missing')
assert(
  claims.allowedClaims.failClosedRuntimeIntegrationExportsImportableFromSoundCpuIndex === true,
  'importable claim missing',
)
assert(claims.allowedClaims.temporaryProofFileRemovedBeforeStaging === true, 'cleanup claim missing')
assert(claims.noScopeStatement.includes('static import/type visibility'), 'no-scope proof clause missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'owner review prompt source decision mismatch')
assert(prompt.sourceHeadAtPromptCreation === SOURCE_MERGE_COMMIT, 'owner review prompt source head mismatch')
assert(prompt.importTarget === IMPORT_TARGET, 'owner review prompt target mismatch')
assert(prompt.runtimeIntegrationSourcePath === RUNTIME_SOURCE_PATH, 'owner review prompt runtime path mismatch')
assert(prompt.proofEvidence.temporaryProofFileRemovedBeforeStaging === true, 'prompt cleanup evidence missing')
assert(prompt.proofEvidence.proofCommand === 'npm run typecheck:server', 'prompt proof command mismatch')
assert(prompt.proofEvidence.broadTypecheckCommand === 'npx tsc -b', 'prompt broad typecheck mismatch')
assert(prompt.proofEvidence.importedSymbolCount === EXPORTED_SYMBOLS.length, 'prompt symbol count mismatch')

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.[PACKAGE_SCRIPT] === SCRIPT_COMMAND, 'package diagnostics script missing')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: DECISION,
      sourcePr: SOURCE_PR,
      sourceMergeCommit: SOURCE_MERGE_COMMIT,
      importedSymbolCount: EXPORTED_SYMBOLS.length,
      temporaryProofFileRemoved: true,
      blockedResultFactoryInvoked: false,
      blockedAssertionInvoked: false,
      runtimeExecution: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
