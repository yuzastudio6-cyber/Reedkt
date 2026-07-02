import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase126_limited_external_agent_product_tool_call_execution_readiness_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_preflight_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase127_limited_external_agent_product_tool_call_execution_preflight_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_preflight_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE127-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-PREFLIGHT-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-review-no-real-user-media-result.md',
  sourceHandoff:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-preflight-handoff-register-no-real-user-media.md',
  sourceWhatHappened:
    'docs/worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-what-happened-register-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-no-real-user-media-result.md',
  checklist:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-checklist-no-real-user-media.md',
  invocation:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-tool-invocation-plan-no-real-user-media.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-boundary-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media.md',
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
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-review-no-real-user-media-result',
  ),
  sourceHandoff: parseJsonBlock(
    docs.sourceHandoff,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-owner-preflight-handoff-register-no-real-user-media',
  ),
  sourceWhatHappened: parseJsonBlock(
    docs.sourceWhatHappened,
    'worker-runtime-jobs-sound-cpu-phase126-limited-external-agent-product-tool-call-execution-readiness-what-happened-register-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-no-real-user-media-result',
  ),
  checklist: parseJsonBlock(
    docs.checklist,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-checklist-no-real-user-media',
  ),
  invocation: parseJsonBlock(
    docs.invocation,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-tool-invocation-plan-no-real-user-media',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-boundary-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2107, 'source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'ee60aa4c0cefeebf8c93e4410f4221dc77ae2ee7', 'source merge mismatch')
assert(parsed.sourceResult.ownerReview.acceptedToolCount === 15, 'source tool count mismatch')
assert(parsed.sourceResult.ownerReview.acceptedInvocationCount === 4, 'source invocation mismatch')
assert(parsed.sourceResult.ownerReview.whatHappenedRowsAccepted === 4, 'source evidence mismatch')
assert(parsed.sourceResult.ownerReview.acceptedForLimitedExternalAgentProductToolCallExecutionToday === false, 'source execution widened')
assert(parsed.sourceResult.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionPreflightNoRealUserMedia === 15, 'source preflight count mismatch')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceHandoff.nextPreflightTarget.prompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE127-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-PREFLIGHT-NO-REAL-USER-MEDIA', 'source handoff prompt mismatch')
assert(parsed.sourceHandoff.nextPreflightTarget.mayRunLimitedExternalAgentProductToolCalls === false, 'source handoff execution widened')
assert(parsed.sourceHandoff.requiredEvidenceToCarryForward.toolCountReconciled === 15, 'source handoff tool count mismatch')
assert(parsed.sourceHandoff.requiredEvidenceToCarryForward.whatHappenedRowsCarriedForward === 4, 'source handoff evidence mismatch')

assert(parsed.sourceWhatHappened.whatHappenedRowsCarriedForward.length === 4, 'source whatHappened row count mismatch')
for (const row of parsed.sourceWhatHappened.whatHappenedRowsCarriedForward) {
  assert(row.accepted === true, `source whatHappened ${row.invocationId} not accepted`)
  assert(row.toolDescriptorCount === 15, `source whatHappened ${row.invocationId} tool count mismatch`)
  assert(typeof row.whatHappened === 'string' && row.whatHappened.length > 0, `source whatHappened ${row.invocationId} missing text`)
}

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecisionOnPass === decision, 'prompt expected mismatch')
assert(parsed.prompt.preflightScope.planLimitedExternalAgentProductToolCallExecutionPreflightOnly === true, 'prompt scope missing')
assert(parsed.prompt.preflightScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'prompt execution widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2109, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'a7dce70be4117f7ea8e0dcdfb8cc3c0da6401730', 'result source merge mismatch')
assert(parsed.result.preflight.toolCountPreflighted === 15, 'result tool count mismatch')
assert(parsed.result.preflight.whatHappenedRowsCarriedForward === 4, 'result evidence mismatch')
assert(parsed.result.preflight.readyForLimitedExternalAgentProductToolCallExecutionPreflightOwnerReviewNoRealUserMedia === 15, 'result owner review count mismatch')
assert(parsed.result.preflight.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'result execution widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.checklist.preflightChecks.toolCountAccepted === 15, 'checklist tool count mismatch')
assert(parsed.checklist.preflightChecks.workerNamesAccepted.length === 2, 'checklist worker count mismatch')
assert(parsed.checklist.preflightChecks.imageNamesAccepted.length === 2, 'checklist image count mismatch')
assert(parsed.checklist.preflightChecks.jobTypesAccepted.length === 4, 'checklist job type count mismatch')
assert(parsed.checklist.preflightChecks.whatHappenedEvidencePresent === true, 'checklist evidence missing')
assert(parsed.checklist.preflightExecutionAuthorization.mayProceedToOwnerReview === true, 'checklist owner review missing')
assert(parsed.checklist.preflightExecutionAuthorization.mayExecuteLimitedExternalAgentProductToolCallsInThisGate === false, 'checklist execution widened')

assert(parsed.invocation.plannedFutureExecutionOnly.expectedInvocationCount === 4, 'invocation count mismatch')
assert(parsed.invocation.plannedFutureExecutionOnly.expectedToolDescriptorCountPerInvocation === 15, 'invocation tool descriptor mismatch')
assert(parsed.invocation.plannedFutureExecutionOnly.invocations.length === 4, 'invocation plan length mismatch')
for (const value of Object.values(parsed.invocation.notExecutedInThisGate)) {
  assert(value === true, 'invocation notExecutedInThisGate must remain true')
}

assertAllBlocked(parsed.boundary.blockedToday, 'boundary blockedToday')
assertAllFalse(parsed.boundary.runtimeSideEffectsObserved, 'boundary runtime side effects')

assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionPreflightOwnerReviewNoRealUserMedia === true, 'blockers owner review missing')
assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionToday === false, 'blockers execution widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedExternalAgentProductToolCallExecutionPreflightOwnerReviewNoRealUserMedia === 15, 'blockers tool count mismatch')

assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionPreflightCompletedClaimed === true, 'policy preflight missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountPreflightedClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionPreflightOwnerReview === true, 'policy next owner review missing')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCallExecution === false, 'policy execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewPreflightOnly === true, 'next scope mismatch')
assert(parsed.next.reviewScope.mayApproveControlledLimitedExternalAgentProductToolCallExecutionNext === true, 'next controlled execution missing')
assert(parsed.next.reviewScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'next execution widened')
assert(parsed.next.reviewScope.allowRealExternalAgentExecutionToday === false, 'next real agent widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2109,
      toolCountPreflighted: 15,
      plannedFutureInvocationCount: 4,
      readyForLimitedExternalAgentProductToolCallExecutionPreflightOwnerReviewNoRealUserMedia: 15,
      readyForLimitedExternalAgentProductToolCallExecutionToday: 0,
      readyForRealExternalAgentExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
