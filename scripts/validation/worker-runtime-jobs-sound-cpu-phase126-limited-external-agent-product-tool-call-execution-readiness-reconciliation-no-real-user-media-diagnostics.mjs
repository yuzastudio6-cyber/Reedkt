import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase125_limited_external_agent_product_tool_call_execution_proof_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_readiness_reconciliation_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase126_limited_external_agent_product_tool_call_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_readiness_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE126-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-READINESS-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  sourceOwner:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-review-no-real-user-media-result.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-output-register-no-real-user-media.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-acceptance-register-no-real-user-media.md',
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-reconciliation-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-reconciliation-no-real-user-media-result.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-evidence-register-no-real-user-media.md',
  whatHappened:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-what-happened-register-no-real-user-media.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-boundary-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-review-no-real-user-media.md',
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
  sourceOwner: parseJsonBlock(
    docs.sourceOwner,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-review-no-real-user-media-result',
  ),
  sourceOutput: parseJsonBlock(
    docs.sourceOutput,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-output-register-no-real-user-media',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase125-limited-external-agent-product-tool-call-execution-proof-owner-acceptance-register-no-real-user-media',
  ),
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-reconciliation-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-reconciliation-no-real-user-media-result',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-evidence-register-no-real-user-media',
  ),
  whatHappened: parseJsonBlock(
    docs.whatHappened,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-what-happened-register-no-real-user-media',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-boundary-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceOwner.decision === sourceDecision, 'source owner decision mismatch')
assert(parsed.sourceOwner.sourceVerification.sourcePr === 2102, 'source owner PR mismatch')
assert(
  parsed.sourceOwner.sourceVerification.sourceMergeCommit === '738a7b5368a10b453d5ac9dcfad6b6c4249f2155',
  'source owner merge mismatch',
)
assert(parsed.sourceOwner.ownerReview.acceptedToolCount === 15, 'source accepted tool count mismatch')
assert(parsed.sourceOwner.ownerReview.acceptedInvocationCount === 4, 'source invocation count mismatch')
assert(parsed.sourceOwner.ownerReview.whatHappenedEvidenceAccepted === true, 'source evidence missing')
assert(parsed.sourceOwner.ownerReview.acceptedForLimitedExternalAgentProductToolCallExecutionToday === false, 'source execution widened')
assert(parsed.sourceOwner.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionReadinessReconciliationNoRealUserMedia === 15, 'source reconciliation count mismatch')
assertNoOpClassification(parsed.sourceOwner.supabaseClassification, 'sourceOwner.supabaseClassification')

assert(parsed.sourceOutput.sanitizedProofOutput.invocationCount === 4, 'source output invocation mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.toolCountCovered === 15, 'source output tool count mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.realExternalAgentUsed === false, 'source output real agent widened')
assert(parsed.sourceOutput.sanitizedProofOutput.realUserMediaUsed === false, 'source output real media widened')
assert(parsed.sourceOutput.whatHappened.length === 4, 'source whatHappened length mismatch')
for (const row of parsed.sourceOutput.whatHappened) {
  assert(row.accepted === true, `source whatHappened row ${row.invocationId} not accepted`)
  assert(row.toolDescriptorCount === 15, `source whatHappened row ${row.invocationId} tool count mismatch`)
  assert(typeof row.whatHappened === 'string' && row.whatHappened.length > 0, `source whatHappened row ${row.invocationId} missing text`)
}
assert(parsed.sourceAcceptance.acceptedProofEvidence.whatHappenedEvidenceRecorded === true, 'source acceptance evidence missing')
assertAllBlocked(parsed.sourceAcceptance.blockedToday, 'source acceptance blockedToday')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt required decision mismatch')
assert(parsed.sourcePrompt.expectedDecisionOnPass === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.reconciliationScope.requireWhatHappenedEvidence === true, 'source prompt evidence missing')
assert(parsed.sourcePrompt.reconciliationScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'source prompt execution widened')
assertNoOpClassification(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2105, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '9bdff3d6a9544d0343c471049e863a384d410cff',
  'result source merge mismatch',
)
assert(parsed.result.reconciliation.toolCountReconciled === 15, 'result tool count mismatch')
assert(parsed.result.reconciliation.invocationCountReconciled === 4, 'result invocation count mismatch')
assert(parsed.result.reconciliation.whatHappenedRowsCarriedForward === 4, 'result evidence row count mismatch')
assert(parsed.result.reconciliation.missingWhatHappenedEvidenceBlocksReadiness === true, 'result missing evidence policy mismatch')
assert(parsed.result.reconciliation.readyForLimitedExternalAgentProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia === 15, 'result owner review count mismatch')
assert(parsed.result.reconciliation.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'result execution count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.evidence.acceptedSourceEvidence.phase125ProofOwnerReviewPr === 2105, 'evidence source PR mismatch')
assert(parsed.evidence.acceptedSourceEvidence.toolCountCovered === 15, 'evidence tool count mismatch')
assert(parsed.evidence.acceptedSourceEvidence.invocationCount === 4, 'evidence invocation mismatch')
assert(parsed.evidence.acceptedSourceEvidence.whatHappenedEvidenceRecorded === true, 'evidence missing')
assert(parsed.evidence.reconciledForOwnerReviewOnly.soundCpuTools === 15, 'evidence reconciled tool count mismatch')
assert(parsed.evidence.reconciledForOwnerReviewOnly.realExternalAgentUsed === false, 'evidence real agent widened')
assert(parsed.evidence.reconciledForOwnerReviewOnly.realUserMediaUsed === false, 'evidence real media widened')

assert(parsed.whatHappened.whatHappenedRowsRequired === 4, 'whatHappened required rows mismatch')
assert(parsed.whatHappened.whatHappenedRowsCarriedForward.length === 4, 'whatHappened carried rows mismatch')
const sourceRows = JSON.stringify(parsed.sourceOutput.whatHappened)
const carriedRows = JSON.stringify(parsed.whatHappened.whatHappenedRowsCarriedForward)
assert(sourceRows === carriedRows, 'whatHappened rows were not carried forward exactly')
assert(parsed.whatHappened.missingWhatHappenedEvidencePolicy.missingRowsBlockReadiness === true, 'missing rows policy mismatch')
assert(parsed.whatHappened.missingWhatHappenedEvidencePolicy.emptyWhatHappenedBlockReadiness === true, 'empty rows policy mismatch')

assert(parsed.boundary.allowedForThisGate.writeReadinessReconciliationDocs === true, 'boundary docs permission missing')
assertAllBlocked(parsed.boundary.blockedToday, 'boundary blockedToday')
assertAllFalse(parsed.boundary.runtimeSideEffectsObserved, 'boundary runtime side effects')

assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia === true, 'blockers owner review missing')
assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionToday === false, 'blockers execution widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedExternalAgentProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia === 15, 'blockers tool count mismatch')

assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionReadinessReconciledClaimed === true, 'policy reconciliation claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountReconciledClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionReadinessOwnerReview === true, 'policy next owner review missing')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecution === false, 'policy execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next required decision mismatch')
assert(parsed.next.reviewScope.reviewReadinessReconciliationOnly === true, 'next review scope mismatch')
assert(parsed.next.reviewScope.requireWhatHappenedEvidence === true, 'next evidence requirement missing')
assert(parsed.next.reviewScope.expectedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reviewScope.expectedInvocationCount === 4, 'next invocation count mismatch')
assert(parsed.next.reviewScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'next execution widened')
assert(parsed.next.reviewScope.allowRealExternalAgentExecutionToday === false, 'next real agent widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2105,
      toolCountReconciled: 15,
      invocationCountReconciled: 4,
      whatHappenedRowsCarriedForward: 4,
      readyForLimitedExternalAgentProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia: 15,
      readyForLimitedExternalAgentProductToolCallExecutionToday: 0,
      readyForRealExternalAgentExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
