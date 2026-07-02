import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase128_limited_external_agent_product_tool_call_execution_no_real_user_media_passed_with_warnings_ready_for_execution_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase128_limited_external_agent_product_tool_call_execution_owner_review_passed_with_warnings_ready_for_no_real_user_media_beta_readiness_reconciliation'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE129-NO-REAL-USER-MEDIA-BETA-READINESS-RECONCILIATION'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media-result.md',
  sourceWhatHappened:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-what-happened-register-no-real-user-media.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-boundary-register-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-acceptance-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-reconciliation.md',
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

function assertAllBlocked(record, label) {
  for (const [key, value] of Object.entries(record)) {
    assert(value === 'blocked', `${label}.${key} must remain blocked`)
  }
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowExternalBetaUnlock',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
    'allowWorkerDispatch',
    'allowRouteExecution',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowArtifactCreation',
    'externalBetaUnlockClaimed',
    'productionReadinessClaimed',
    'realUserMediaExecutionReadyClaimed',
    'workerDispatchReadyClaimed',
    'routeExecutionReadyClaimed',
    'runtimeReadinessClaimed',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media-result',
  ),
  sourceWhatHappened: parseJsonBlock(
    docs.sourceWhatHappened,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-what-happened-register-no-real-user-media',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-boundary-register-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-acceptance-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-reconciliation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2112, 'source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'cb4fc67a6ecb6235abff28a4cc6a7777e1bd1a31', 'source merge mismatch')
assert(parsed.sourceResult.proof.controlledLimitedExternalAgentProductToolCallsRun === 4, 'source invocation count mismatch')
assert(parsed.sourceResult.proof.acceptedToolCount === 15, 'source tool count mismatch')
assert(parsed.sourceResult.proof.whatHappenedEvidenceRecorded === true, 'source whatHappened missing')
assertAllFalse(parsed.sourceResult.sideEffects, 'source side effects')
assert(parsed.sourceWhatHappened.whatHappenedRowsRecorded === 4, 'source whatHappened count mismatch')
assert(parsed.sourceWhatHappened.rows.every((row) => row.accepted === true), 'source whatHappened not accepted')
assertAllBlocked(parsed.sourceBoundary.blockedInThisGate, 'source boundary blocked')
assertAllFalse(parsed.sourceBoundary.observedSideEffects, 'source boundary side effects')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reviewScope.reviewControlledNoRealUserMediaProofOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.expectedInvocationCount === 4, 'prompt invocation count mismatch')
assert(parsed.prompt.reviewScope.expectedToolDescriptorCountPerInvocation === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.requireWhatHappenedRows === 4, 'prompt whatHappened mismatch')
assert(parsed.prompt.reviewScope.mayApproveNoRealUserMediaBetaReadinessReconciliationNext === true, 'prompt next reconciliation missing')
assert(parsed.prompt.reviewScope.allowExternalBetaUnlock === false, 'prompt beta widened')
assert(parsed.prompt.reviewScope.allowRealUserMediaExecution === false, 'prompt real media widened')
assert(parsed.prompt.reviewScope.allowWorkerDispatch === false, 'prompt worker dispatch widened')
assert(parsed.prompt.reviewScope.allowSupabaseMutation === false, 'prompt Supabase widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2114, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'f0f0f38f2e59a7b714a22d3be9c77e74db9f27f5', 'result source merge mismatch')
assert(parsed.result.ownerReview.controlledProofAccepted === true, 'result proof not accepted')
assert(parsed.result.ownerReview.acceptedInvocationCount === 4, 'result invocation count mismatch')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.ownerReview.whatHappenedRowsAccepted === 4, 'result whatHappened mismatch')
assert(parsed.result.ownerReview.readyForNoRealUserMediaBetaReadinessReconciliation === true, 'result next reconciliation missing')
assert(parsed.result.ownerReview.acceptedForExternalBetaUnlockToday === false, 'result beta widened')
assert(parsed.result.ownerReview.acceptedForRealUserMediaExecutionToday === false, 'result real media widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedProofEvidence.proofCommandRunCount === 1, 'acceptance proof count mismatch')
assert(parsed.acceptance.acceptedProofEvidence.controlledInvocationCount === 4, 'acceptance invocation count mismatch')
assert(parsed.acceptance.acceptedProofEvidence.toolCountCoveredPerInvocation === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedProofEvidence.whatHappenedRowsAccepted === 4, 'acceptance whatHappened mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.noRealUserMediaBetaReadinessReconciliationMayProceed === true, 'acceptance reconciliation missing')
assert(parsed.acceptance.acceptedForNextGateOnly.mayUnlockExternalBeta === false, 'acceptance beta widened')
assertAllBlocked(parsed.acceptance.stillBlocked, 'acceptance stillBlocked')

assert(parsed.blockers.readyForNoRealUserMediaBetaReadinessReconciliation === true, 'blockers reconciliation missing')
assert(parsed.blockers.readyForRealUserMediaBeta === false, 'blockers real media beta widened')
assert(parsed.blockers.readyForExternalBetaUnlock === false, 'blockers beta unlock widened')
assert(parsed.blockers.readyForPaidProduction === false, 'blockers production widened')
for (const [key, value] of Object.entries(parsed.blockers.remainingHardBlocks)) {
  assert(value === true, `remaining hard block ${key} must stay true`)
}

assert(parsed.policy.allowedClaims.controlledNoRealUserMediaProofOwnerReviewedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.acceptedInvocationCountClaimed === 4, 'policy invocation count mismatch')
assert(parsed.policy.allowedClaims.acceptedToolCountClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.allowedClaims.noRealUserMediaBetaReadinessReconciliationMayProceedClaimed === true, 'policy reconciliation missing')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunNoRealUserMediaBetaReadinessReconciliation === true, 'policy next gate missing')
assert(parsed.policy.nextGateMayUnlockExternalBeta === false, 'policy beta unlock widened')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'policy real media widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase129_no_real_user_media_beta_readiness_reconciliation_completed_with_warnings_ready_for_beta_readiness_owner_review', 'next expected decision mismatch')
assert(parsed.next.reconciliationScope.summarizeControlledNoRealUserMediaProof === true, 'next summary missing')
assert(parsed.next.reconciliationScope.acceptedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reconciliationScope.acceptedInvocationCount === 4, 'next invocation count mismatch')
assert(parsed.next.reconciliationScope.mayPrepareBoundedExternalBetaNoRealUserMediaReview === true, 'next bounded review missing')
assert(parsed.next.reconciliationScope.allowExternalBetaUnlock === false, 'next beta unlock widened')
assert(parsed.next.reconciliationScope.allowRealUserMediaBeta === false, 'next real media beta widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2114,
      acceptedInvocationCount: 4,
      acceptedToolCount: 15,
      whatHappenedRowsAccepted: 4,
      readyForNoRealUserMediaBetaReadinessReconciliation: true,
      externalBetaUnlockToday: false,
      realUserMediaBetaToday: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
