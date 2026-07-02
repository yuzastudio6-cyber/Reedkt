import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase128_limited_external_agent_product_tool_call_execution_owner_review_passed_with_warnings_ready_for_no_real_user_media_beta_readiness_reconciliation'
const decision =
  'worker_runtime_jobs_sound_cpu_phase129_no_real_user_media_beta_readiness_reconciliation_completed_with_warnings_ready_for_beta_readiness_owner_review'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE129-BETA-READINESS-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-review-no-real-user-media-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-acceptance-register-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-reconciliation.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-reconciliation-result.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-evidence-register.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-boundary-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-review-no-real-user-media.md',
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
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowExternalBetaUnlock',
    'allowExternalBetaUnlockInThisGate',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
    'allowWorkerDispatch',
    'allowRouteExecution',
    'allowSupabaseMutation',
    'allowArtifactCreation',
    'externalBetaUnlockClaimed',
    'realUserMediaBetaReadyClaimed',
    'paidProductionReadyClaimed',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-review-no-real-user-media-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-acceptance-register-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-reconciliation',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-reconciliation-result',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-evidence-register',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-boundary-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2114, 'source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'f0f0f38f2e59a7b714a22d3be9c77e74db9f27f5', 'source merge mismatch')
assert(parsed.sourceResult.ownerReview.controlledProofAccepted === true, 'source proof not accepted')
assert(parsed.sourceResult.ownerReview.readyForNoRealUserMediaBetaReadinessReconciliation === true, 'source reconciliation missing')
assert(parsed.sourceResult.ownerReview.acceptedForExternalBetaUnlockToday === false, 'source beta widened')
assert(parsed.sourceAcceptance.acceptedProofEvidence.controlledInvocationCount === 4, 'source acceptance invocation mismatch')
assert(parsed.sourceAcceptance.acceptedProofEvidence.toolCountCoveredPerInvocation === 15, 'source acceptance tool mismatch')
assert(parsed.sourceAcceptance.acceptedForNextGateOnly.noRealUserMediaBetaReadinessReconciliationMayProceed === true, 'source acceptance next gate missing')
assert(parsed.sourceAcceptance.acceptedForNextGateOnly.mayUnlockExternalBeta === false, 'source acceptance beta widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reconciliationScope.summarizeControlledNoRealUserMediaProof === true, 'prompt summary missing')
assert(parsed.prompt.reconciliationScope.acceptedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reconciliationScope.acceptedInvocationCount === 4, 'prompt invocation count mismatch')
assert(parsed.prompt.reconciliationScope.allowExternalBetaUnlock === false, 'prompt beta widened')
assert(parsed.prompt.reconciliationScope.allowRealUserMediaBeta === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2116, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'b8aaea00118564fac51e83410382bf596142ff13', 'result source merge mismatch')
assert(parsed.result.reconciliation.controlledNoRealUserMediaProofAccepted === true, 'result proof missing')
assert(parsed.result.reconciliation.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.reconciliation.acceptedInvocationCount === 4, 'result invocation mismatch')
assert(parsed.result.reconciliation.boundedExternalBetaNoRealUserMediaReviewMayProceed === true, 'result owner review missing')
assert(parsed.result.reconciliation.externalBetaUnlockToday === false, 'result beta widened')
assert(parsed.result.reconciliation.realUserMediaBetaToday === false, 'result real media widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.evidence.acceptedEvidence.controlledInvocationCount === 4, 'evidence invocation mismatch')
assert(parsed.evidence.acceptedEvidence.toolCountCoveredPerInvocation === 15, 'evidence tool mismatch')
assert(parsed.evidence.acceptedEvidence.whatHappenedRowsAccepted === 4, 'evidence whatHappened mismatch')
assert(parsed.evidence.acceptedEvidence.realUserMediaUsed === false, 'evidence real media widened')
assert(parsed.evidence.toolSet.length === 15, 'evidence tool set mismatch')

assert(parsed.boundary.mayProceedNext.boundedExternalBetaNoRealUserMediaOwnerReview === true, 'boundary next review missing')
for (const [key, value] of Object.entries(parsed.boundary.notEnabled)) assert(value === true, `${key} should remain not enabled`)

assert(parsed.blockers.readyForBetaReadinessOwnerReviewNoRealUserMedia === true, 'blockers owner review missing')
assert(parsed.blockers.readyForExternalBetaUnlockToday === false, 'blockers beta widened')
assert(parsed.blockers.readyForRealUserMediaBetaToday === false, 'blockers real media widened')
assert(parsed.blockers.readyForPaidProductionToday === false, 'blockers production widened')
for (const [key, value] of Object.entries(parsed.blockers.remainingBlocks)) assert(value === true, `${key} should remain blocked`)

assert(parsed.policy.allowedClaims.noRealUserMediaBetaReadinessReconciliationCompletedClaimed === true, 'policy reconciliation missing')
assert(parsed.policy.allowedClaims.acceptedToolCountClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase129_beta_readiness_owner_review_passed_with_warnings_ready_for_bounded_no_real_user_media_beta_gate', 'next expected mismatch')
assert(parsed.next.reviewScope.reviewNoRealUserMediaReadinessOnly === true, 'next review scope mismatch')
assert(parsed.next.reviewScope.mayApproveBoundedNoRealUserMediaBetaGateNext === true, 'next bounded gate missing')
assert(parsed.next.reviewScope.allowExternalBetaUnlockInThisGate === false, 'next beta widened')
assert(parsed.next.reviewScope.allowRealUserMediaBeta === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2116,
      acceptedToolCount: 15,
      acceptedInvocationCount: 4,
      boundedExternalBetaNoRealUserMediaReviewMayProceed: true,
      externalBetaUnlockToday: false,
      realUserMediaBetaToday: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
