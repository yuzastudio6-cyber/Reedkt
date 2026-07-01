import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_async_eval_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_retry_passed_with_warnings_ready_for_controlled_import_proof_owner_review_no_external_execution'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE107-CONTROLLED-IMPORT-PROOF-OWNER-REVIEW'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-async-eval-fix-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-result.md',
  output:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-output-register.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-safety-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-review.md',
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

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-async-eval-fix-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-result',
  ),
  output: parseJsonBlock(
    docs.output,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-output-register',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-safety-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-owner-review',
  ),
}

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.fixResult.readyForRetry === true, 'source retry readiness missing')
assert(parsed.source.fixResult.proofRunnerExecutedInThisFixGate === false, 'source fix gate executed proof')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2049, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'd234b908c8a8713a1c21150d2f92b71f2211e278', 'source merge mismatch')
assert(parsed.result.proofResult.proofRunnerExecutedOnce === true, 'proof not recorded')
assert(parsed.result.proofResult.proofHarnessExecutionPath === 'tsx', 'proof path mismatch')
assert(parsed.result.proofResult.ok === true, 'proof not ok')
assert(parsed.result.proofResult.staticScanPassed === true, 'static scan missing')
assert(parsed.result.proofResult.moduleImported === true, 'module import missing')
assert(parsed.result.proofResult.exportsPresent === true, 'exports missing')
assert(parsed.result.proofResult.failClosedGateConfirmed === true, 'fail closed gate missing')
for (const key of [
  'factoryCalled',
  'workerDispatched',
  'supabaseTouched',
  'mediaOpened',
  'sqlExecuted',
  'storageObjectCreated',
  'signedUrlCreated',
]) {
  assert(parsed.result.proofResult[key] === false, `proof widened ${key}`)
}
assert(parsed.result.readinessBoundary.controlledImportProofPassed === true, 'proof pass boundary missing')
assert(parsed.result.readinessBoundary.externalAgentExecutionReadyToday === false, 'external agent widened')
assert(parsed.result.readinessBoundary.realUserMediaBetaReadyToday === false, 'beta widened')
assert(parsed.result.soundCpuTools.covered === 15, 'tool coverage mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'real execution readiness must remain zero')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.output.sanitizedProofOutput.ok === true, 'output ok mismatch')
assert(parsed.output.sanitizedProofOutput.missingExportsCount === 0, 'missing exports count mismatch')
assert(parsed.output.sanitizedProofOutput.tsxExitStatus === 0, 'tsx status mismatch')
for (const value of Object.values(parsed.output.failClosedFlagConfirmation)) {
  assert(value === true, 'fail closed flag confirmation mismatch')
}

for (const [key, value] of Object.entries(parsed.safety.safetyBoundaries)) {
  if (key === 'factoryCall') assert(value === 'not_called', 'factory call boundary mismatch')
  else assert(value === 'not_enabled', `${key} boundary mismatch`)
}

assert(parsed.policy.claimPolicy.controlledImportProofPassedClaimed === true, 'proof pass claim missing')
assert(parsed.policy.claimPolicy.moduleImportedClaimed === true, 'module import claim missing')
assert(parsed.policy.claimPolicy.externalAgentExecutionReadyClaimed === false, 'external agent claim widened')
assert(parsed.policy.claimPolicy.realUserMediaBetaReadyClaimed === false, 'beta claim widened')
assert(parsed.policy.nextGateMayRunExternalAgent === false, 'next gate external agent widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewControlledImportProofOnly === true, 'next review scope mismatch')
assert(parsed.next.reviewScope.allowExternalAgentExecutionToday === false, 'next external agent widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2049,
      controlledImportProofPassed: true,
      moduleImported: true,
      failClosedGateConfirmed: true,
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
