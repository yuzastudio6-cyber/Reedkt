import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase125_limited_external_agent_product_tool_call_execution_proof_no_real_user_media_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_proof_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase125_limited_external_agent_product_tool_call_execution_proof_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_readiness_reconciliation_no_real_user_media'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase126_limited_external_agent_product_tool_call_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_readiness_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE126-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-READINESS-RECONCILIATION-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-no-real-user-media-result.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-output-register-no-real-user-media.md',
  sourceSideEffects:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-no-side-effect-register.md',
  sourceCoverage:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-tool-coverage-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-acceptance-register-no-real-user-media.md',
  handoff:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-readiness-reconciliation-handoff-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-reconciliation-no-real-user-media.md',
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

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === false, `${label}.${key} must be false`)
  }
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowLimitedExternalAgentProductToolCallExecutionToday',
    'allowProductToolCallExecutionToday',
    'allowRealExternalAgentExecutionToday',
    'allowRealUserMedia',
    'allowWorkerDispatchToday',
    'allowRouteExecutionToday',
    'allowManifestPersistenceToday',
    'allowSupabaseMutationToday',
    'allowSqlExecutionToday',
    'allowArtifactCreationToday',
    'limitedExternalAgentProductToolCallExecutionReadyClaimed',
    'productToolCallExecutionReadyClaimed',
    'realExternalAgentExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'realUserMediaExecutionReadyClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-no-real-user-media-result',
  ),
  sourceOutput: parseJsonBlock(
    docs.sourceOutput,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-output-register-no-real-user-media',
  ),
  sourceSideEffects: parseJsonBlock(
    docs.sourceSideEffects,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-no-side-effect-register',
  ),
  sourceCoverage: parseJsonBlock(
    docs.sourceCoverage,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-tool-coverage-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-acceptance-register-no-real-user-media',
  ),
  handoff: parseJsonBlock(
    docs.handoff,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-readiness-reconciliation-handoff-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-reconciliation-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2101, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === 'aeecde77bc9b1b9876fd989810eac4cd61bd87d3',
  'source merge mismatch',
)
assert(parsed.source.proofResult.status === 'passed', 'source proof status mismatch')
assert(parsed.source.proofResult.proofCommandRunCount === 1, 'source proof run count mismatch')
assert(parsed.source.proofResult.invocationCount === 4, 'source invocation count mismatch')
assert(parsed.source.proofResult.toolCountCovered === 15, 'source tool count mismatch')
assert(parsed.source.proofResult.whatHappenedEvidenceRecorded === true, 'source evidence missing')
assert(parsed.source.proofResult.realExternalAgentUsed === false, 'source real agent widened')
assert(parsed.source.proofResult.realUserMediaUsed === false, 'source real media widened')
assert(parsed.source.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionProofOwnerReview === 15, 'source owner review count mismatch')
assert(parsed.source.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'source execution widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')
assert(parsed.sourceOutput.whatHappened.length === 4, 'source output evidence count mismatch')
assert(parsed.sourceOutput.proofOutputWrittenToDisk === false, 'source output written')
assertAllFalse(parsed.sourceSideEffects.verifiedFalse, 'source side effects')
assert(parsed.sourceCoverage.soundCpuToolSet.totalToolsInLane === 15, 'source coverage tool count mismatch')
assert(parsed.sourcePolicy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionProofOwnerReview === true, 'source policy owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionWithRealAgents === false, 'source policy execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewLimitedExternalAgentProductToolCallExecutionProofOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.requireWhatHappenedEvidence === true, 'prompt evidence missing')
assert(parsed.prompt.reviewScope.mayReconcileLimitedExternalAgentProductToolCallExecutionReadinessNext === true, 'prompt reconciliation missing')
assert(parsed.prompt.reviewScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'prompt limited execution widened')
assert(parsed.prompt.reviewScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2102, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '738a7b5368a10b453d5ac9dcfad6b6c4249f2155',
  'result source merge mismatch',
)
assert(parsed.result.ownerReview.limitedExternalAgentProductToolCallExecutionProofAccepted === true, 'result proof acceptance missing')
assert(parsed.result.ownerReview.limitedExternalAgentProductToolCallExecutionReadinessReconciliationMayProceedNext === true, 'result reconciliation missing')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.ownerReview.acceptedInvocationCount === 4, 'result invocation count mismatch')
assert(parsed.result.ownerReview.proofCommandRunCount === 1, 'result proof command count mismatch')
assert(parsed.result.ownerReview.whatHappenedEvidenceAccepted === true, 'result evidence accepted missing')
assert(parsed.result.ownerReview.acceptedForLimitedExternalAgentProductToolCallExecutionToday === false, 'result execution widened')
assert(parsed.result.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'result real agent widened')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionReadinessReconciliationNoRealUserMedia === 15, 'result reconciliation count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'result execution count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedProofEvidence.limitedExternalAgentProductToolCallExecutionProofPassed === true, 'acceptance proof missing')
assert(parsed.acceptance.acceptedProofEvidence.proofCommandRunCount === 1, 'acceptance proof count mismatch')
assert(parsed.acceptance.acceptedProofEvidence.invocationCount === 4, 'acceptance invocation mismatch')
assert(parsed.acceptance.acceptedProofEvidence.toolCountCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedProofEvidence.whatHappenedEvidenceRecorded === true, 'acceptance evidence missing')
assert(parsed.acceptance.acceptedForNextReconciliationOnly.limitedExternalAgentProductToolCallExecutionReadinessReconciliationMayProceed === true, 'acceptance reconciliation missing')
for (const value of Object.values(parsed.acceptance.blockedToday)) {
  assert(value === 'blocked', 'acceptance blockedToday must remain blocked')
}

assert(parsed.handoff.nextReconciliationTarget.prompt === nextPrompt, 'handoff prompt mismatch')
assert(parsed.handoff.nextReconciliationTarget.expectedDecision === nextDecision, 'handoff expected mismatch')
assert(parsed.handoff.nextReconciliationTarget.mayCreateReadinessReconciliationDocs === true, 'handoff docs missing')
assert(parsed.handoff.nextReconciliationTarget.mayRunLimitedExternalAgentProductToolCalls === false, 'handoff execution widened')
assert(parsed.handoff.requiredEvidenceToCarryForward.toolCountCovered === 15, 'handoff tool count mismatch')
assert(parsed.handoff.requiredEvidenceToCarryForward.invocationCount === 4, 'handoff invocation mismatch')
assert(parsed.handoff.requiredEvidenceToCarryForward.whatHappenedEvidenceRecorded === true, 'handoff evidence missing')

assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionReadinessReconciliationNoRealUserMedia === true, 'blocker reconciliation missing')
assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionToday === false, 'blocker execution widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedExternalAgentProductToolCallExecutionReadinessReconciliationNoRealUserMedia === 15, 'blocker count mismatch')
assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionProofOwnerReviewedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionReadinessReconciliationMayProceedClaimed === true, 'policy reconciliation missing')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionReadinessReconciliation === true, 'policy next reconciliation missing')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecution === false, 'policy execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecisionOnPass === nextDecision, 'next decision mismatch')
assert(parsed.next.reconciliationScope.reconcileLimitedExternalAgentProofEvidence === true, 'next reconciliation scope missing')
assert(parsed.next.reconciliationScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'next execution widened')
assert(parsed.next.reconciliationScope.allowRealExternalAgentExecutionToday === false, 'next real agent widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2102,
      acceptedToolCount: 15,
      proofCommandRunCount: 1,
      invocationCount: 4,
      readyForLimitedExternalAgentProductToolCallExecutionReadinessReconciliationNoRealUserMedia: 15,
      readyForLimitedExternalAgentProductToolCallExecutionToday: 0,
      readyForRealExternalAgentExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
