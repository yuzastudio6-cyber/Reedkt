import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_tsx_invocation_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_async_eval_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE107-CONTROLLED-IMPORT-PROOF-RETRY'
const proofRunnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner.mjs'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-async-eval-fix-result.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-async-eval-fix-claim-policy.md',
  retryPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoOpClassification(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowExternalAgentExecutionToday',
    'allowWorkerDispatchToday',
    'allowFactoryCallToday',
    'allowManifestPersistenceToday',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'openMediaFileToday',
    'unlockBetaToday',
    'unlockProductionToday',
    'controlledImportProofPassedClaimed',
    'moduleImportedClaimed',
    'runtimeImportReadyClaimed',
    'externalAgentExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'realUserMediaBetaReadyClaimed',
    'productionReadinessClaimed',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-async-eval-fix-result',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-async-eval-fix-claim-policy',
  ),
  retryPrompt: parseJsonBlock(
    docs.retryPrompt,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const proofRunner = read(proofRunnerPath)
for (const snippet of [
  'tsxImportInspectionSource',
  'async function main()',
  'await import(pathToFileURL(targetPath).href)',
  'main()',
  "proofHarnessExecutionPath: 'tsx'",
  'factoryCalled: false',
  'workerDispatched: false',
  'supabaseTouched: false',
  'externalAgentExecutionReady: false',
]) {
  assert(proofRunner.includes(snippet), `proof runner missing ${snippet}`)
}
assert(!proofRunner.includes('const importedModule = await import(pathToFileURL(targetPath).href)\\n  const missingExports'), 'proof runner still appears to use top-level await import outside async wrapper')

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.fixResult.fixedInvocationPath === 'tsx_controlled_import_inspection', 'source TSX fix missing')
assert(parsed.source.fixResult.proofRunnerExecutedInThisFixGate === false, 'source fix gate executed proof')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2048, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '2ce0d5f3af2007d6ba7addaec4ef825244cfbb86', 'source merge mismatch')
assert(parsed.result.fixResult.proofHarnessUpdated === true, 'async fix missing')
assert(parsed.result.fixResult.previousEvalFailure === 'top_level_await_not_supported_with_cjs_output_format', 'previous failure mismatch')
assert(parsed.result.fixResult.fixedBy === 'async_main_wrapper_inside_tsx_eval_payload', 'fixedBy mismatch')
assert(parsed.result.fixResult.staticScanBeforeImportPreserved === true, 'static scan not preserved')
assert(parsed.result.fixResult.proofRunnerExecutedInThisFixGate === false, 'proof runner executed in async fix gate')
assert(parsed.result.fixResult.controlledImportProofPassedClaimed === false, 'proof pass claim widened')
assert(parsed.result.fixResult.readyForRetry === true, 'retry readiness missing')
assert(parsed.result.soundCpuTools.covered === 15, 'tool coverage mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution readiness must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.policy.claimPolicy.proofHarnessAsyncEvalFixedClaimed === true, 'async eval fix claim missing')
assert(parsed.policy.claimPolicy.controlledImportProofPassedClaimed === false, 'proof pass claim widened')
assert(parsed.policy.nextGateMayRunProofRunnerOnce === true, 'next proof once missing')
assert(parsed.policy.nextGateMayRunExternalAgent === false, 'external agent widened')

assert(parsed.retryPrompt.requiredSourceDecision === sourceDecision, 'retry prompt still points to first fix decision')
assert(parsed.retryPrompt.controlledProofScope.runProofRunnerOnce === true, 'retry proof once missing')
assert(parsed.retryPrompt.controlledProofScope.allowExternalAgentExecutionToday === false, 'retry external agent widened')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2048,
      asyncEvalWrapperAdded: true,
      proofRunnerExecutedInFixGate: false,
      readyForControlledImportProofRetry: true,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
