import fs from 'node:fs'
import path from 'node:path'

const decision =
  'worker_runtime_jobs_sound_cpu_phase107_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_blocked_module_resolution_failure_no_external_execution'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_execution'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE107-CONTROLLED-IMPORT-PROOF-RUNNER-TSX-INVOCATION-FIX'

const docs = {
  sourceOwnerResult:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-review-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-blocked-result.md',
  runRegister:
    'docs/worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-sanitized-run-register.md',
  blocker:
    'docs/worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-module-resolution-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-claim-policy.md',
  fixPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix.md',
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
  sourceOwnerResult: parseJsonBlock(
    docs.sourceOwnerResult,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-blocked-result',
  ),
  runRegister: parseJsonBlock(
    docs.runRegister,
    'worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-sanitized-run-register',
  ),
  blocker: parseJsonBlock(
    docs.blocker,
    'worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-module-resolution-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-claim-policy',
  ),
  fixPrompt: parseJsonBlock(
    docs.fixPrompt,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceOwnerResult.decision === sourceDecision, 'source owner decision mismatch')
assert(parsed.sourceOwnerResult.ownerReview.controlledImportProofMayProceedInNextGate === true, 'source owner did not allow controlled proof')

assert(parsed.result.decision === decision, 'blocked result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2045, 'blocked result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '952fc78d413b5d25dbf2563a350de90b3c4e101d', 'blocked result source merge mismatch')
assert(parsed.result.proofAttempt.proofRunnerExecutedOnce === true, 'proof attempt not recorded')
assert(parsed.result.proofAttempt.ok === false, 'blocked proof should not be ok')
assert(parsed.result.proofAttempt.moduleImported === false, 'module import must remain false')
assert(parsed.result.proofAttempt.factoryCalled === false, 'factory call must remain false')
assert(parsed.result.proofAttempt.workerDispatched === false, 'worker dispatch must remain false')
assert(parsed.result.proofAttempt.supabaseTouched === false, 'Supabase touch must remain false')
assert(parsed.result.blocker.kind === 'module_resolution_failure', 'blocker kind mismatch')
assert(parsed.result.blocker.fixRequired === true, 'fix required missing')
assert(parsed.result.soundCpuTools.covered === 15, 'tool coverage mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution readiness must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.runRegister.sanitizedRun.proofRunnerExecutedOnce === true, 'run register proof attempt missing')
assert(parsed.runRegister.sanitizedRun.runnerOutputOk === false, 'run register must be blocked')
assert(parsed.runRegister.observedSafetyFlags.externalAgentExecutionReady === false, 'external agent readiness widened')
assert(parsed.runRegister.observedSafetyFlags.realUserMediaBetaReady === false, 'beta widened')
assert(parsed.runRegister.notRetriedInThisGate === true, 'run register must preserve no retry')

const [blocker] = parsed.blocker.blockers
assert(blocker.id === 'phase107_plain_node_extensionless_typescript_import_blocker', 'blocker id mismatch')
assert(blocker.recommendedFix.includes('tsx'), 'tsx fix recommendation missing')
assert(parsed.blocker.nextFixPrompt === nextPrompt, 'blocker next prompt mismatch')

assert(parsed.policy.claimPolicy.controlledImportProofPassedClaimed === false, 'proof pass claim widened')
assert(parsed.policy.claimPolicy.moduleImportedClaimed === false, 'module import claim widened')
assert(parsed.policy.claimPolicy.externalAgentExecutionReadyClaimed === false, 'external agent claim widened')
assert(parsed.policy.nextGateMayFixProofHarness === true, 'next gate fix missing')
assert(parsed.policy.nextGateMayRunExternalAgent === false, 'next gate external agent widened')

assert(parsed.fixPrompt.requiredSourceDecision === decision, 'fix prompt source mismatch')
assert(parsed.fixPrompt.fixScope.fixProofHarnessOnly === true, 'fix prompt scope mismatch')
assert(parsed.fixPrompt.fixScope.recommendedExecutionPath === 'tsx', 'fix prompt tsx recommendation missing')
assert(parsed.fixPrompt.fixScope.preserveStaticScanBeforeImport === true, 'fix prompt static scan missing')
assertNoOpClassification(parsed.fixPrompt.supabaseClassification, 'fixPrompt.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2045,
      proofRunnerExecutedOnce: true,
      controlledImportProofPassed: false,
      blockedReason: 'module_resolution_failure',
      factoryCalled: false,
      workerDispatched: false,
      supabaseTouched: false,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
