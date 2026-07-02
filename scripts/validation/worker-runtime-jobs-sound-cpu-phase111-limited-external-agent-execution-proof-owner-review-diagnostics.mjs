import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase111_limited_external_agent_execution_proof_passed_with_warnings_ready_for_limited_external_agent_execution_proof_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase111_limited_external_agent_execution_proof_owner_review_passed_with_warnings_ready_for_external_agent_readiness_reconciliation_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE112-EXTERNAL-AGENT-READINESS-RECONCILIATION'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-result.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-proof-output-register.md',
  sourceVerification:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-no-side-effect-verification-register.md',
  sourceCoverage:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-tool-coverage-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-acceptance-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-reconciliation.md',
}

const expectedWorkers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const expectedImages = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
]
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
    'allowExecutionToday',
    'allowRealUserMedia',
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
    'realUserMediaExecutionReadyClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'realUserMediaBetaReadyClaimed',
    'externalBetaUnlockClaimed',
    'productionReadinessClaimed',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-result',
  ),
  sourceOutput: parseJsonBlock(
    docs.sourceOutput,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-proof-output-register',
  ),
  sourceVerification: parseJsonBlock(
    docs.sourceVerification,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-no-side-effect-verification-register',
  ),
  sourceCoverage: parseJsonBlock(
    docs.sourceCoverage,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-tool-coverage-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-acceptance-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-reconciliation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2062, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '55908b1293a211ab070c05e5e4876be55c309ea7',
  'source merge mismatch',
)
assert(parsed.source.proofResult.status === 'passed', 'source proof status mismatch')
assert(parsed.source.proofResult.limitedBoundaryInvoked === true, 'source limited boundary missing')
assert(parsed.source.proofResult.syntheticOrNoMediaInputAccepted === true, 'source synthetic/no-media missing')
assert(parsed.source.proofResult.invocationCount === 4, 'source invocation count mismatch')
assert(parsed.source.proofResult.toolCountCovered === 15, 'source tool count mismatch')
assert(parsed.source.proofResult.runtimeFlagsAllFalse === true, 'source flags mismatch')
assert(parsed.source.proofResult.realUserMediaUsed === false, 'source real media used')
assert(parsed.source.soundCpuTools.readyForLimitedExternalAgentProofOwnerReview === 15, 'source owner review count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')

assert(parsed.sourceOutput.sanitizedProofOutput.status === 'passed', 'source output status mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.invocationCount === 4, 'source output invocation count mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.toolCountCovered === 15, 'source output tool count mismatch')
assert(parsed.sourceOutput.proofOutputWrittenToDisk === false, 'source output written to disk')
assert(parsed.sourceOutput.tempProofArtifactsCreated === false, 'source temp artifacts created')
for (const value of Object.values(parsed.sourceVerification.verifiedFalse)) {
  assert(value === false, 'source verification false values must remain false')
}
assert(parsed.sourceCoverage.soundCpuToolSet.limitedExternalAgentProofComplete === true, 'source limited proof missing')
assert(parsed.sourceCoverage.soundCpuToolSet.readyForRealExecutionToday === 0, 'source coverage real readiness widened')
assert(parsed.sourcePolicy.nextGateMayReviewLimitedProof === true, 'source next review missing')
assert(parsed.sourcePolicy.nextGateMayRunRealUserMedia === false, 'source real media widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reviewScope.reviewLimitedProofOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.mayAcceptReadinessReconciliationNext === true, 'prompt next reconciliation missing')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assert(parsed.prompt.reviewScope.allowSupabaseMutationToday === false, 'prompt Supabase widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2063, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '2f811c6614eb39b3f25c10ee1e5a9a486a23e194',
  'result source merge mismatch',
)
assert(parsed.result.ownerReview.limitedExternalAgentExecutionProofAccepted === true, 'proof acceptance missing')
assert(
  parsed.result.ownerReview.externalAgentReadinessReconciliationMayProceedNext === true,
  'next reconciliation missing',
)
assert(parsed.result.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'real execution widened')
assert(parsed.result.ownerReview.acceptedForWorkerDispatchToday === false, 'worker dispatch widened')
assert(parsed.result.ownerReview.acceptedForRouteExecutionToday === false, 'route execution widened')
assert(parsed.result.soundCpuTools.readyForExternalAgentReadinessReconciliation === 15, 'reconciliation count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real readiness widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedEvidence.sourceDecisionVerified === true, 'acceptance source missing')
assert(parsed.acceptance.acceptedEvidence.limitedBoundaryInvoked === true, 'acceptance boundary missing')
assert(parsed.acceptance.acceptedEvidence.syntheticOrNoMediaInputAccepted === true, 'acceptance synthetic/no-media missing')
assert(parsed.acceptance.acceptedEvidence.invocationCount === 4, 'acceptance invocation mismatch')
assert(parsed.acceptance.acceptedEvidence.toolCountCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedEvidence.runtimeFlagsAllFalse === true, 'acceptance runtime flags missing')
assert(parsed.acceptance.acceptedEvidence.realUserMediaUsed === false, 'acceptance real media used')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
for (const value of Object.values(parsed.acceptance.acceptedForNextReconciliationOnly)) {
  assert(value === true, 'acceptedForNextReconciliationOnly must remain true')
}
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'notAcceptedForToday must remain true')
}

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'limited_external_agent_execution_proof_owner_review_pending',
  ),
  'owner-review blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'external_agent_readiness_reconciliation_pending',
  ),
  'readiness reconciliation blocker missing',
)
assert(parsed.blockers.readyForExternalAgentReadinessReconciliation === true, 'reconciliation readiness missing')
assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker real execution widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker real tool readiness widened')

assert(parsed.policy.allowedClaims.limitedExternalAgentExecutionProofOwnerReviewedClaimed === true, 'owner review claim missing')
assert(parsed.policy.allowedClaims.externalAgentReadinessReconciliationMayProceedClaimed === true, 'reconciliation claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.externalAgentExecutionReadyClaimed === false, 'execution readiness widened')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'tool-call readiness widened')
assert(parsed.policy.nextGateMayRunExternalAgentReadinessReconciliation === true, 'next reconciliation missing')
assert(parsed.policy.nextGateMayRunRealExternalAgentExecution === false, 'next real execution widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reconciliationScope.reconcileLimitedExternalAgentProofOnly === true, 'next reconciliation scope missing')
assert(parsed.next.reconciliationScope.allowedToolCount === 15, 'next tool count mismatch')
assertArrayEquals(parsed.next.reconciliationScope.allowedWorkers, expectedWorkers, 'next workers')
assertArrayEquals(parsed.next.reconciliationScope.allowedImages, expectedImages, 'next images')
assertArrayEquals(parsed.next.reconciliationScope.allowedJobTypes, expectedJobTypes, 'next job types')
assert(parsed.next.reconciliationScope.allowExecutionToday === false, 'next execution today widened')
assert(parsed.next.reconciliationScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.reconciliationScope.allowWorkerDispatchToday === false, 'next dispatch widened')
assert(parsed.next.reconciliationScope.allowSupabaseMutationToday === false, 'next Supabase widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2063,
      limitedExternalAgentExecutionProofAccepted: true,
      externalAgentReadinessReconciliationMayProceedNext: true,
      soundCpuToolsCovered: 15,
      readyForExternalAgentReadinessReconciliation: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
