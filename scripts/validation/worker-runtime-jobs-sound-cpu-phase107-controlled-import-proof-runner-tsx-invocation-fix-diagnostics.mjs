import fs from 'node:fs'
import path from 'node:path'

const blockedDecision =
  'worker_runtime_jobs_sound_cpu_phase107_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_blocked_module_resolution_failure_no_external_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_tsx_invocation_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE107-CONTROLLED-IMPORT-PROOF-RETRY'
const proofRunnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner.mjs'

const docs = {
  blocked:
    'docs/worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-blocked-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-result.md',
  harness:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-harness-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-retry-readiness-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-claim-policy.md',
  next:
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
  blocked: parseJsonBlock(
    docs.blocked,
    'worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-blocked-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-result',
  ),
  harness: parseJsonBlock(
    docs.harness,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-harness-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-retry-readiness-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const proofRunner = read(proofRunnerPath)
for (const snippet of [
  'spawnSync(command',
  'tsxImportInspectionSource',
  'REEDITPRO_SOUND_CPU_CONTROLLED_IMPORT_TARGET',
  'await import(pathToFileURL(targetPath).href)',
  "proofHarnessExecutionPath: 'tsx'",
  'factoryCalled: false',
  'workerDispatched: false',
  'supabaseTouched: false',
  'externalAgentExecutionReady: false',
  'realUserMediaBetaReady: false',
]) {
  assert(proofRunner.includes(snippet), `proof runner missing ${snippet}`)
}
for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from(', 'createSignedUrl(', 'fetch(', 'executeRoute(']) {
  assert(!proofRunner.includes(forbidden), `proof runner contains forbidden ${forbidden}`)
}

assert(parsed.blocked.decision === blockedDecision, 'blocked source decision mismatch')
assert(parsed.blocked.blocker.kind === 'module_resolution_failure', 'blocked source kind mismatch')

assert(parsed.result.decision === decision, 'fix result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2046, 'fix result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '9bcc736384290081b4b1bf071b2e64c91b263163', 'fix result source merge mismatch')
assert(parsed.result.fixResult.proofHarnessUpdated === true, 'proof harness update missing')
assert(parsed.result.fixResult.fixedInvocationPath === 'tsx_controlled_import_inspection', 'fixed invocation mismatch')
assert(parsed.result.fixResult.staticScanBeforeImportPreserved === true, 'static scan not preserved')
assert(parsed.result.fixResult.proofRunnerExecutedInThisFixGate === false, 'proof runner must not execute in fix gate')
assert(parsed.result.fixResult.controlledImportProofPassedClaimed === false, 'proof pass claim widened')
assert(parsed.result.fixResult.readyForRetry === true, 'retry readiness missing')
assert(parsed.result.soundCpuTools.covered === 15, 'tool coverage mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution readiness must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.harness.harnessUpdate.usesRepoTypescriptExecutionConvention === true, 'repo TS convention missing')
assert(parsed.harness.harnessUpdate.typescriptExecutionPath === 'tsx', 'tsx path missing')
assert(parsed.harness.harnessUpdate.staticScanBeforeImport === true, 'harness static scan missing')
assert(parsed.harness.blockedStill.externalAgentExecution === true, 'external agent block missing')

assert(parsed.readiness.retryReadiness.controlledImportProofRetryMayProceed === true, 'retry may proceed missing')
assert(parsed.readiness.retryReadiness.proofRunnerMayExecuteOnceInRetryGate === true, 'runner once missing')
assert(parsed.readiness.retryReadiness.proofRunnerExecutedInFixGate === false, 'runner executed in fix gate')
assert(parsed.readiness.retryReadiness.externalAgentExecutionMayProceed === false, 'external agent widened')
assert(parsed.readiness.retryReadiness.workerDispatchMayProceed === false, 'worker dispatch widened')
assert(parsed.readiness.retryReadiness.realUserMediaBetaMayProceed === false, 'beta widened')

assert(parsed.policy.claimPolicy.proofHarnessFixedClaimed === true, 'harness fix claim missing')
assert(parsed.policy.claimPolicy.controlledImportProofPassedClaimed === false, 'proof pass claim widened')
assert(parsed.policy.nextGateMayRunProofRunnerOnce === true, 'next proof once missing')
assert(parsed.policy.nextGateMayRunExternalAgent === false, 'external agent next gate widened')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_retry_passed_with_warnings_ready_for_controlled_import_proof_owner_review_no_external_execution', 'next prompt decision mismatch')
assert(parsed.next.controlledProofScope.runProofRunnerOnce === true, 'next prompt proof once missing')
assert(parsed.next.controlledProofScope.requiredExecutionPath === 'tsx_controlled_import_inspection', 'next prompt tsx path missing')
assert(parsed.next.controlledProofScope.allowExternalAgentExecutionToday === false, 'next prompt external agent widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2046,
      proofHarnessUpdated: true,
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
