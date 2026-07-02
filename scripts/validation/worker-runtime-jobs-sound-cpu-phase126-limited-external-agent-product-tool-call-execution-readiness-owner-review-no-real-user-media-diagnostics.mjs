import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase126_limited_external_agent_product_tool_call_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_readiness_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase126_limited_external_agent_product_tool_call_execution_readiness_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_preflight_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE127-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-PREFLIGHT-NO-REAL-USER-MEDIA'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-reconciliation-no-real-user-media-result.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-evidence-register-no-real-user-media.md',
  sourceWhatHappened:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-what-happened-register-no-real-user-media.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-boundary-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-acceptance-register-no-real-user-media.md',
  handoff:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-preflight-handoff-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-no-real-user-media.md',
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
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-reconciliation-no-real-user-media-result',
  ),
  sourceEvidence: parseJsonBlock(
    docs.sourceEvidence,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-evidence-register-no-real-user-media',
  ),
  sourceWhatHappened: parseJsonBlock(
    docs.sourceWhatHappened,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-what-happened-register-no-real-user-media',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-boundary-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-acceptance-register-no-real-user-media',
  ),
  handoff: parseJsonBlock(
    docs.handoff,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-preflight-handoff-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2105, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '9bdff3d6a9544d0343c471049e863a384d410cff', 'source result merge mismatch')
assert(parsed.sourceResult.reconciliation.toolCountReconciled === 15, 'source result tool count mismatch')
assert(parsed.sourceResult.reconciliation.invocationCountReconciled === 4, 'source result invocation count mismatch')
assert(parsed.sourceResult.reconciliation.whatHappenedRowsCarriedForward === 4, 'source result evidence rows mismatch')
assert(parsed.sourceResult.reconciliation.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'source result execution widened')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceEvidence.acceptedSourceEvidence.phase125ProofOwnerReviewPr === 2105, 'source evidence PR mismatch')
assert(parsed.sourceEvidence.acceptedSourceEvidence.toolCountCovered === 15, 'source evidence tool count mismatch')
assert(parsed.sourceEvidence.acceptedSourceEvidence.invocationCount === 4, 'source evidence invocation mismatch')
assert(parsed.sourceEvidence.acceptedSourceEvidence.whatHappenedEvidenceAccepted === true, 'source evidence missing')
assert(parsed.sourceEvidence.reconciledForOwnerReviewOnly.realExternalAgentUsed === false, 'source evidence real agent widened')
assert(parsed.sourceEvidence.reconciledForOwnerReviewOnly.realUserMediaUsed === false, 'source evidence real media widened')

assert(parsed.sourceWhatHappened.whatHappenedRowsRequired === 4, 'source whatHappened required mismatch')
assert(parsed.sourceWhatHappened.whatHappenedRowsCarriedForward.length === 4, 'source whatHappened rows mismatch')
for (const row of parsed.sourceWhatHappened.whatHappenedRowsCarriedForward) {
  assert(row.accepted === true, `whatHappened row ${row.invocationId} not accepted`)
  assert(row.toolDescriptorCount === 15, `whatHappened row ${row.invocationId} tool count mismatch`)
  assert(typeof row.whatHappened === 'string' && row.whatHappened.length > 0, `whatHappened row ${row.invocationId} missing text`)
}
assert(parsed.sourceWhatHappened.missingWhatHappenedEvidencePolicy.missingRowsBlockReadiness === true, 'missing evidence policy mismatch')
assertAllBlocked(parsed.sourceBoundary.blockedToday, 'source boundary blockedToday')
assertAllFalse(parsed.sourceBoundary.runtimeSideEffectsObserved, 'source boundary runtime side effects')
assert(parsed.sourcePolicy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionReadinessOwnerReview === true, 'source policy owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunLimitedExternalAgentProductToolCallExecution === false, 'source policy execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewReadinessReconciliationOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.requireWhatHappenedEvidence === true, 'prompt evidence missing')
assert(parsed.prompt.reviewScope.expectedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.expectedInvocationCount === 4, 'prompt invocation mismatch')
assert(parsed.prompt.reviewScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'prompt execution widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2107, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'ee60aa4c0cefeebf8c93e4410f4221dc77ae2ee7', 'result source merge mismatch')
assert(parsed.result.ownerReview.readinessReconciliationAccepted === true, 'result owner review missing')
assert(parsed.result.ownerReview.limitedExternalAgentProductToolCallExecutionPreflightMayProceedNext === true, 'result preflight missing')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.ownerReview.acceptedInvocationCount === 4, 'result invocation count mismatch')
assert(parsed.result.ownerReview.whatHappenedRowsAccepted === 4, 'result evidence rows mismatch')
assert(parsed.result.ownerReview.acceptedForLimitedExternalAgentProductToolCallExecutionToday === false, 'result execution widened')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionPreflightNoRealUserMedia === 15, 'result preflight count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'result execution count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedReconciliationEvidence.toolCountReconciled === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedReconciliationEvidence.invocationCountReconciled === 4, 'acceptance invocation mismatch')
assert(parsed.acceptance.acceptedReconciliationEvidence.whatHappenedRowsAccepted === true, 'acceptance evidence missing')
assert(parsed.acceptance.acceptedForNextPreflightOnly.limitedExternalAgentProductToolCallExecutionPreflightMayProceed === true, 'acceptance preflight missing')
assertAllBlocked(parsed.acceptance.blockedToday, 'acceptance blockedToday')

assert(parsed.handoff.nextPreflightTarget.prompt === nextPrompt, 'handoff prompt mismatch')
assert(parsed.handoff.nextPreflightTarget.mayCreatePreflightDocs === true, 'handoff docs missing')
assert(parsed.handoff.nextPreflightTarget.mayRunLimitedExternalAgentProductToolCalls === false, 'handoff execution widened')
assert(parsed.handoff.requiredEvidenceToCarryForward.toolCountReconciled === 15, 'handoff tool count mismatch')
assert(parsed.handoff.requiredEvidenceToCarryForward.whatHappenedRowsCarriedForward === 4, 'handoff evidence rows mismatch')

assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionPreflightNoRealUserMedia === true, 'blockers preflight missing')
assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionToday === false, 'blockers execution widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedExternalAgentProductToolCallExecutionPreflightNoRealUserMedia === 15, 'blockers tool count mismatch')

assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionReadinessOwnerReviewedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountAcceptedClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionPreflight === true, 'policy next preflight missing')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecution === false, 'policy execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.preflightScope.planLimitedExternalAgentProductToolCallExecutionPreflightOnly === true, 'next scope missing')
assert(parsed.next.preflightScope.requireWhatHappenedEvidence === true, 'next evidence requirement missing')
assert(parsed.next.preflightScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'next execution widened')
assert(parsed.next.preflightScope.allowRealExternalAgentExecutionToday === false, 'next real agent widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2107,
      acceptedToolCount: 15,
      acceptedInvocationCount: 4,
      whatHappenedRowsAccepted: 4,
      readyForLimitedExternalAgentProductToolCallExecutionPreflightNoRealUserMedia: 15,
      readyForLimitedExternalAgentProductToolCallExecutionToday: 0,
      readyForRealExternalAgentExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
