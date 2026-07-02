import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase127_limited_external_agent_product_tool_call_execution_preflight_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_preflight_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase127_limited_external_agent_product_tool_call_execution_preflight_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE128-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-NO-REAL-USER-MEDIA'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-no-real-user-media-result.md',
  sourceChecklist:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-checklist-no-real-user-media.md',
  sourceInvocation:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-tool-invocation-plan-no-real-user-media.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-boundary-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-acceptance-register-no-real-user-media.md',
  handoff:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-execution-handoff-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media.md',
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
    'allowRealExternalAgentExecutionToday',
    'allowRealUserMedia',
    'allowWorkerDispatchToday',
    'allowRouteExecutionToday',
    'allowManifestPersistenceToday',
    'allowSupabaseMutationToday',
    'allowSqlExecutionToday',
    'allowArtifactCreationToday',
    'realExternalAgentExecutionReadyClaimed',
    'realUserMediaExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-no-real-user-media-result',
  ),
  sourceChecklist: parseJsonBlock(
    docs.sourceChecklist,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-checklist-no-real-user-media',
  ),
  sourceInvocation: parseJsonBlock(
    docs.sourceInvocation,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-tool-invocation-plan-no-real-user-media',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-boundary-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-acceptance-register-no-real-user-media',
  ),
  handoff: parseJsonBlock(
    docs.handoff,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-execution-handoff-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2109, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'a7dce70be4117f7ea8e0dcdfb8cc3c0da6401730', 'source result merge mismatch')
assert(parsed.sourceResult.preflight.toolCountPreflighted === 15, 'source result tool count mismatch')
assert(parsed.sourceResult.preflight.workerCountPreflighted === 2, 'source result worker count mismatch')
assert(parsed.sourceResult.preflight.imageCountPreflighted === 2, 'source result image count mismatch')
assert(parsed.sourceResult.preflight.jobTypeCountPreflighted === 4, 'source result job type count mismatch')
assert(parsed.sourceResult.preflight.whatHappenedRowsCarriedForward === 4, 'source result evidence rows mismatch')
assert(parsed.sourceResult.preflight.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'source result execution widened')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceChecklist.preflightChecks.toolCountAccepted === 15, 'source checklist tool count mismatch')
assert(parsed.sourceChecklist.preflightChecks.whatHappenedEvidencePresent === true, 'source checklist evidence missing')
assert(parsed.sourceChecklist.preflightExecutionAuthorization.mayProceedToOwnerReview === true, 'source checklist owner review missing')
assert(parsed.sourceChecklist.preflightExecutionAuthorization.mayExecuteLimitedExternalAgentProductToolCallsInThisGate === false, 'source checklist execution widened')

assert(parsed.sourceInvocation.plannedFutureExecutionOnly.expectedInvocationCount === 4, 'source invocation count mismatch')
assert(parsed.sourceInvocation.plannedFutureExecutionOnly.expectedToolDescriptorCountPerInvocation === 15, 'source invocation tool count mismatch')
assert(parsed.sourceInvocation.plannedFutureExecutionOnly.invocations.length === 4, 'source invocation rows mismatch')
for (const invocation of parsed.sourceInvocation.plannedFutureExecutionOnly.invocations) {
  assert(invocation.inputKind === 'synthetic_no_real_user_media', `source invocation ${invocation.jobType} input widened`)
}
assertAllBlocked(parsed.sourceBoundary.blockedToday, 'source boundary blockedToday')
assertAllFalse(parsed.sourceBoundary.runtimeSideEffectsObserved, 'source boundary runtime side effects')
assert(parsed.sourcePolicy.nextGateMayRunLimitedExternalAgentProductToolCallExecutionPreflightOwnerReview === true, 'source policy owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunLimitedExternalAgentProductToolCallExecution === false, 'source policy execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reviewScope.reviewPreflightOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.mayApproveControlledLimitedExternalAgentProductToolCallExecutionNext === true, 'prompt next execution missing')
assert(parsed.prompt.reviewScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'prompt execution widened')
assert(parsed.prompt.reviewScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2111, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '03720cba59ab55e5093bf06f53a2701bd2e9165a', 'result source merge mismatch')
assert(parsed.result.ownerReview.preflightAccepted === true, 'result preflight not accepted')
assert(parsed.result.ownerReview.limitedExternalAgentProductToolCallExecutionNoRealUserMediaMayProceedNext === true, 'result next execution missing')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.ownerReview.acceptedInvocationCount === 4, 'result invocation count mismatch')
assert(parsed.result.ownerReview.whatHappenedRowsCarriedForward === 4, 'result evidence rows mismatch')
assert(parsed.result.ownerReview.acceptedForExecutionInThisOwnerReview === false, 'result owner review executed')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionNextNoRealUserMedia === 15, 'result next tool count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionInThisOwnerReview === 0, 'result in-gate execution widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPreflightEvidence.toolCountPreflighted === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedPreflightEvidence.plannedInvocationCount === 4, 'acceptance invocation count mismatch')
assert(parsed.acceptance.acceptedPreflightEvidence.whatHappenedRowsCarriedForward === 4, 'acceptance evidence rows mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.controlledLimitedExternalAgentProductToolCallExecutionNoRealUserMedia === true, 'acceptance next gate missing')
assert(parsed.acceptance.acceptedForNextGateOnly.stopOnCriticalBlocker === true, 'acceptance stop policy missing')
assertAllBlocked(parsed.acceptance.blockedToday, 'acceptance blockedToday')

assert(parsed.handoff.nextExecutionTarget.prompt === nextPrompt, 'handoff prompt mismatch')
assert(parsed.handoff.nextExecutionTarget.mayRunControlledLimitedExternalAgentProductToolCallsNoRealUserMedia === true, 'handoff execution missing')
assert(parsed.handoff.nextExecutionTarget.expectedInvocationCount === 4, 'handoff invocation count mismatch')
assert(parsed.handoff.nextExecutionTarget.requireWhatHappenedRows === 4, 'handoff whatHappened mismatch')
assert(parsed.handoff.invocationsApprovedForNextGate.length === 4, 'handoff invocation rows mismatch')
for (const invocation of parsed.handoff.invocationsApprovedForNextGate) {
  assert(invocation.inputKind === 'synthetic_no_real_user_media', `handoff invocation ${invocation.jobType} input widened`)
}

assert(parsed.blockers.readyForNextControlledExecutionGateNoRealUserMedia === true, 'blockers next gate missing')
assert(parsed.blockers.soundCpuToolsReadyForNextControlledExecutionGateNoRealUserMedia === 15, 'blockers tool count mismatch')
assert(parsed.blockers.plannedInvocationCount === 4, 'blockers invocation count mismatch')
for (const [key, value] of Object.entries(parsed.blockers.criticalBlockersForNextGate)) {
  assert(value === true, `critical blocker ${key} must remain active`)
}
for (const [key, value] of Object.entries(parsed.blockers.stillBlocked)) {
  assert(value === true, `still blocked ${key} must remain true`)
}

assert(parsed.policy.allowedClaims.phase127PreflightOwnerReviewedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.controlledLimitedExternalAgentProductToolCallExecutionMayProceedNextNoRealUserMediaClaimed === true, 'policy next execution missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountAcceptedClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy blocked claims')
assert(parsed.policy.nextGateMayRunControlledLimitedExternalAgentProductToolCallExecutionNoRealUserMedia === true, 'policy next gate missing')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'policy real media widened')
assert(parsed.policy.nextGateMayRunWorkerDispatch === false, 'policy worker dispatch widened')
assert(parsed.policy.nextGateMayRunRouteExecution === false, 'policy route widened')
assert(parsed.policy.nextGateMayMutateSupabase === false, 'policy Supabase widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecisionOnPass === 'worker_runtime_jobs_sound_cpu_phase128_limited_external_agent_product_tool_call_execution_no_real_user_media_passed_with_warnings_ready_for_execution_owner_review_no_real_user_media', 'next expected decision mismatch')
assert(parsed.next.executionScope.runControlledLimitedExternalAgentProductToolCallsNoRealUserMedia === true, 'next execution scope missing')
assert(parsed.next.executionScope.expectedInvocationCount === 4, 'next invocation count mismatch')
assert(parsed.next.executionScope.requireWhatHappenedForEveryInvocation === true, 'next whatHappened missing')
assert(parsed.next.executionScope.stopInsteadOfForceOnCriticalBlocker === true, 'next stop policy missing')
assert(parsed.next.executionScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.executionScope.allowWorkerDispatch === false, 'next worker dispatch widened')
assert(parsed.next.executionScope.allowRouteExecution === false, 'next route widened')
assert(parsed.next.executionScope.allowSupabaseMutation === false, 'next Supabase widened')
assert(parsed.next.executionScope.allowStorageObjectCreation === false, 'next storage widened')
assert(parsed.next.executionScope.allowSignedUrlCreation === false, 'next signed URL widened')
assert(parsed.next.executionScope.allowPublicArtifactCreation === false, 'next public artifact widened')
assert(parsed.next.approvedInvocations.length === 4, 'next approved invocation rows mismatch')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2111,
      acceptedToolCount: 15,
      acceptedInvocationCount: 4,
      nextGateMayRunControlledLimitedExternalAgentProductToolCallExecutionNoRealUserMedia: true,
      readyForLimitedExternalAgentProductToolCallExecutionInThisOwnerReview: 0,
      readyForRealUserMediaExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
