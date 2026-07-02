import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase122_controlled_product_tool_call_execution_proof_owner_review_passed_with_warnings_ready_for_product_tool_call_execution_readiness_reconciliation_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase123_product_tool_call_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_product_tool_call_execution_readiness_owner_review_no_real_user_media'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase123_product_tool_call_execution_readiness_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_plan_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE123-PRODUCT-TOOL-CALL-EXECUTION-READINESS-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-review-no-real-user-media-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-acceptance-register-no-real-user-media.md',
  sourceHandoff:
    'docs/worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-readiness-reconciliation-handoff-register-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-reconciliation-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-reconciliation-no-real-user-media-result.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-evidence-register-no-real-user-media.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-boundary-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-review-no-real-user-media.md',
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
    'allowProductToolCallExecutionToday',
    'allowRealExternalAgentExecutionToday',
    'allowRealUserMedia',
    'allowWorkerDispatchToday',
    'allowRouteExecutionToday',
    'allowManifestPersistenceToday',
    'allowSupabaseMutationToday',
    'allowSqlExecutionToday',
    'allowArtifactCreationToday',
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
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-review-no-real-user-media-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-acceptance-register-no-real-user-media',
  ),
  sourceHandoff: parseJsonBlock(
    docs.sourceHandoff,
    'worker-runtime-jobs-sound-cpu-phase122-controlled-product-tool-call-execution-proof-owner-readiness-reconciliation-handoff-register-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-reconciliation-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-reconciliation-no-real-user-media-result',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-evidence-register-no-real-user-media',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-boundary-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2093, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === 'f15e3f338e13fc500e900e3ff696cb2d6e0fc7c9',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.productToolCallExecutionReadinessReconciliationMayProceedNext === true, 'source reconciliation missing')
assert(parsed.source.ownerReview.acceptedToolCount === 15, 'source tool count mismatch')
assert(parsed.source.ownerReview.acceptedInvocationCount === 4, 'source invocation mismatch')
assert(parsed.source.ownerReview.whatHappenedEvidenceAccepted === true, 'source evidence missing')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')
assert(parsed.sourceAcceptance.acceptedProofEvidence.toolCountCovered === 15, 'source acceptance tool count mismatch')
assert(parsed.sourceHandoff.nextReconciliationTarget.mayRunProductToolCalls === false, 'source handoff product widened')
assert(parsed.sourceHandoff.nextReconciliationTarget.mayUseRealExternalAgents === false, 'source handoff real agent widened')
assert(parsed.sourceHandoff.nextReconciliationTarget.mayUseRealUserMedia === false, 'source handoff real media widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecisionOnPass === decision, 'prompt expected mismatch')
assert(parsed.prompt.reconciliationScope.reconcileControlledProofEvidence === true, 'prompt controlled proof missing')
assert(parsed.prompt.reconciliationScope.reconcileExternalAgentReadinessWithoutRealAgents === true, 'prompt no-agent reconciliation missing')
assert(parsed.prompt.reconciliationScope.requireWhatHappenedEvidence === true, 'prompt evidence missing')
assert(parsed.prompt.reconciliationScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reconciliationScope.expectedInvocationCount === 4, 'prompt invocation mismatch')
assert(parsed.prompt.reconciliationScope.allowProductToolCallExecutionToday === false, 'prompt product widened')
assert(parsed.prompt.reconciliationScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assert(parsed.prompt.reconciliationScope.allowRealUserMedia === false, 'prompt real media widened')
assert(parsed.prompt.reconciliationScope.allowWorkerDispatchToday === false, 'prompt worker widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2095, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '450d6ad6e19fa5cde1bc7602ca9dfc335d080897',
  'result source merge mismatch',
)
assert(parsed.result.reconciliationResult.controlledProofEvidenceReconciled === true, 'result proof reconciliation missing')
assert(parsed.result.reconciliationResult.ownerReviewEvidenceReconciled === true, 'result owner reconciliation missing')
assert(parsed.result.reconciliationResult.whatHappenedEvidenceCarriedForward === true, 'result what-happened missing')
assert(parsed.result.reconciliationResult.toolCountReconciled === 15, 'result tool count mismatch')
assert(parsed.result.reconciliationResult.invocationCountReconciled === 4, 'result invocation mismatch')
assert(parsed.result.reconciliationResult.productToolCallExecutionToday === 0, 'result product widened')
assert(parsed.result.reconciliationResult.realExternalAgentExecutionToday === 0, 'result real agent widened')
assert(parsed.result.reconciliationResult.realUserMediaExecutionToday === 0, 'result real media widened')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia === 15, 'result owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionPlanNoRealUserMedia === 0, 'result limited plan widened')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.evidence.acceptedEvidenceChain.length === 4, 'evidence chain mismatch')
assert(parsed.evidence.reconciledToolCount === 15, 'evidence tool count mismatch')
assert(parsed.boundary.allowedForNextOwnerReview.reviewReadinessReconciliation === true, 'boundary owner review missing')
assert(Object.values(parsed.boundary.notAllowedToday).every(Boolean), 'boundary notAllowedToday mismatch')
assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'product_tool_call_execution_readiness_reconciliation_pending',
  ),
  'blocker resolution missing',
)
assert(parsed.blockers.readyForProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia === true, 'owner review blocker readiness missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.policy.allowedClaims.productToolCallExecutionReadinessReconciliationCompletedClaimed === true, 'policy reconciliation missing')
assert(Object.values(parsed.policy.blockedClaims).every((value) => value === false), 'policy blocked claims mismatch')
assert(parsed.policy.nextGateMayRunProductToolCallExecutionReadinessOwnerReview === true, 'policy next owner review missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecutionWithRealAgents === false, 'policy product widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecisionOnPass === nextDecision, 'next decision mismatch')
assert(parsed.next.reviewScope.reviewReadinessReconciliationOnly === true, 'next owner review scope missing')
assert(parsed.next.reviewScope.mayPlanLimitedExternalAgentProductToolCallsNext === true, 'next limited plan missing')
assert(parsed.next.reviewScope.allowProductToolCallExecutionToday === false, 'next product widened')
assert(parsed.next.reviewScope.allowRealExternalAgentExecutionToday === false, 'next real agent widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      readyForProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia,
      readyForLimitedExternalAgentProductToolCallExecutionPlanNoRealUserMedia:
        parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionPlanNoRealUserMedia,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExternalAgentExecutionToday:
        parsed.result.soundCpuTools.readyForRealExternalAgentExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
