import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase108_external_agent_execution_owner_review_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_no_runtime_side_effects'
const decision =
  'worker_runtime_jobs_sound_cpu_phase109_controlled_external_agent_execution_proof_passed_with_warnings_ready_for_external_agent_execution_proof_owner_review_no_runtime_side_effects'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE109-CONTROLLED-EXTERNAL-AGENT-EXECUTION-PROOF-OWNER-REVIEW'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-review-result.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof.md',
  runner:
    'scripts/validation/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-runner.mjs',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-result.md',
  output:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-proof-output-register.md',
  verification:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-no-side-effect-verification-register.md',
  coverage:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-tool-coverage-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-review.md',
}

const expectedWorkers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

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

function assertArrayEquals(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`)
  assert(actual.length === expected.length, `${label} length mismatch`)
  for (const item of expected) assert(actual.includes(item), `${label} missing ${item}`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowRealExternalAgentExecution',
    'allowProductToolCallExecution',
    'allowWorkerDispatch',
    'allowRouteExecution',
    'allowFactorySideEffects',
    'allowManifestPersistence',
    'allowMediaOpen',
    'allowProviderCall',
    'allowModelCall',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowStorageObjectCreation',
    'allowSignedUrlCreation',
    'allowArtifactCreation',
    'allowBetaUnlock',
    'allowProductionUnlock',
    'allowRealExternalAgentExecutionToday',
    'allowProductToolCallExecutionToday',
    'allowWorkerDispatchToday',
    'allowRouteExecutionToday',
    'allowManifestPersistenceToday',
    'allowMediaOpenToday',
    'allowProviderCallToday',
    'allowModelCallToday',
    'allowSupabaseMutationToday',
    'allowSqlExecutionToday',
    'allowStorageObjectCreationToday',
    'allowSignedUrlCreationToday',
    'allowArtifactCreationToday',
    'allowBetaUnlockToday',
    'allowProductionUnlockToday',
    'externalAgentExecutionReadyClaimed',
    'productToolCallExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'manifestPersistenceReadyClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-review-result',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-result',
  ),
  output: parseJsonBlock(
    docs.output,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-proof-output-register',
  ),
  verification: parseJsonBlock(
    docs.verification,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-no-side-effect-verification-register',
  ),
  coverage: parseJsonBlock(
    docs.coverage,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-tool-coverage-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2053, 'source sourcePr mismatch')
assert(parsed.source.soundCpuTools.readyForControlledExternalAgentProof === 15, 'source controlled proof count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.proofScope.runControlledExternalAgentBoundary === true, 'prompt boundary missing')
assert(parsed.prompt.proofScope.useSyntheticPayloadOnly === true, 'prompt synthetic missing')
assert(parsed.prompt.proofScope.allowedToolCount === 15, 'prompt tool count mismatch')
assertArrayEquals(parsed.prompt.proofScope.allowedWorkers, expectedWorkers, 'prompt workers')
assertArrayEquals(parsed.prompt.proofScope.allowedJobTypes, expectedJobTypes, 'prompt job types')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

const runnerText = read(docs.runner)
assert(runnerText.includes('invokeControlledExternalAgentBoundary'), 'runner boundary function missing')
assert(runnerText.includes('proofOutputWrittenToDisk: false'), 'runner disk guard missing')
assert(runnerText.includes('artifactCreated: false'), 'runner artifact guard missing')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2056, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '83ee854da0a79b51224bbc4f145f97c542ef8cf7',
  'result source merge mismatch',
)
assert(parsed.result.proofResult.status === 'passed', 'proof status mismatch')
assert(parsed.result.proofResult.agentBoundaryInvoked === true, 'agent boundary not invoked')
assert(parsed.result.proofResult.syntheticPayloadAccepted === true, 'synthetic payload not accepted')
assert(parsed.result.proofResult.toolCountCovered === 15, 'proof tool count mismatch')
assert(parsed.result.proofResult.runtimeFlagsAllFalse === true, 'runtime flags not all false')
for (const key of [
  'factoryCalled',
  'workerDispatched',
  'routeExecuted',
  'supabaseTouched',
  'sqlExecuted',
  'mediaOpened',
  'providerCalled',
  'modelCalled',
  'storageObjectCreated',
  'signedUrlCreated',
  'artifactCreated',
  'betaUnlocked',
  'productionUnlocked',
]) {
  assert(parsed.result.proofResult[key] === false, `result ${key} widened`)
}
assert(parsed.result.soundCpuTools.controlledExternalAgentProofPassed === 15, 'controlled proof count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real readiness widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.output.proofCommand === 'npm run worker-runtime-jobs:sound-cpu-phase109-controlled-external-agent-execution-proof:proof', 'proof command mismatch')
assert(parsed.output.sanitizedProofOutput.status === 'passed', 'output status mismatch')
assert(parsed.output.sanitizedProofOutput.toolCountCovered === 15, 'output tool count mismatch')
assert(parsed.output.sanitizedProofOutput.runtimeFlagsAllFalse === true, 'output flags mismatch')
assert(parsed.output.proofOutputWrittenToDisk === false, 'proof output written to disk')
assert(parsed.output.tempProofArtifactsCreated === false, 'temp proof artifacts created')

for (const value of Object.values(parsed.verification.verifiedFalse)) {
  assert(value === false, 'verified false value must remain false')
}
assert(parsed.verification.runtimeFlagsAllFalse === true, 'verification runtime flags missing')
assert(parsed.verification.noGeneratedArtifactsStaged === true, 'generated artifact staging guard missing')

assert(parsed.coverage.soundCpuToolSet.directPinnedPackages.length === 13, 'direct pinned count mismatch')
assert(parsed.coverage.soundCpuToolSet.aliasCoveredTools.length === 2, 'alias count mismatch')
assert(parsed.coverage.soundCpuToolSet.totalToolsInLane === 15, 'coverage total mismatch')
assert(parsed.coverage.soundCpuToolSet.controlledExternalAgentProofComplete === true, 'coverage proof missing')
assert(parsed.coverage.soundCpuToolSet.readyForRealExecutionToday === 0, 'coverage real readiness widened')
assertArrayEquals(parsed.coverage.allowedWorkers, expectedWorkers, 'coverage workers')
assertArrayEquals(parsed.coverage.allowedJobTypes, expectedJobTypes, 'coverage job types')

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase109_controlled_external_agent_execution_proof_pending',
  ),
  'proof blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'phase109_controlled_external_agent_execution_proof_owner_review_pending',
  ),
  'owner-review blocker missing',
)
assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker real execution widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker tool readiness widened')

assert(parsed.policy.allowedClaims.controlledExternalAgentProofPassedClaimed === true, 'proof claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.externalAgentExecutionReadyClaimed === false, 'policy readiness widened')
assert(parsed.policy.nextGateMayReviewControlledProof === true, 'next review missing')
assert(parsed.policy.nextGateMayPlanLimitedExternalAgentExecution === false, 'limited plan must wait for owner review')
assert(parsed.policy.nextGateMayRunRealExternalAgentExecution === false, 'real execution widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewControlledSyntheticProofOnly === true, 'next review scope missing')
assert(parsed.next.reviewScope.mayAcceptLimitedExternalAgentExecutionPlanNext === true, 'next planning permission missing')
assert(parsed.next.reviewScope.allowRealExternalAgentExecutionToday === false, 'next real execution widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2056,
      controlledExternalAgentProofPassed: true,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
