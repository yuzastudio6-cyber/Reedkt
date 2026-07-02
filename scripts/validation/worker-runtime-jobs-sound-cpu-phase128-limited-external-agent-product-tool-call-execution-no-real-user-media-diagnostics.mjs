import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase127_limited_external_agent_product_tool_call_execution_preflight_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase128_limited_external_agent_product_tool_call_execution_no_real_user_media_passed_with_warnings_ready_for_execution_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE128-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media-result.md',
  sourceHandoff:
    'docs/worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-execution-handoff-register-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media-result.md',
  whatHappened:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-what-happened-register-no-real-user-media.md',
  invocation:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-invocation-register-no-real-user-media.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-boundary-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-review-no-real-user-media.md',
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
    'allowRealExternalAgentExecution',
    'allowRealUserMediaExecution',
    'allowWorkerDispatch',
    'allowRouteExecution',
    'allowManifestPersistence',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowStorageObjectCreation',
    'allowSignedUrlCreation',
    'allowPublicArtifactCreation',
    'allowProviderCall',
    'allowModelCall',
    'allowExternalBetaUnlock',
    'allowProductionUnlock',
    'realExternalAgentExecutionReadyClaimed',
    'realUserMediaExecutionReadyClaimed',
    'workerDispatchReadyClaimed',
    'routeExecutionReadyClaimed',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'mediaReadinessClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-review-no-real-user-media-result',
  ),
  sourceHandoff: parseJsonBlock(
    docs.sourceHandoff,
    'worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-execution-handoff-register-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media-result',
  ),
  whatHappened: parseJsonBlock(
    docs.whatHappened,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-what-happened-register-no-real-user-media',
  ),
  invocation: parseJsonBlock(
    docs.invocation,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-invocation-register-no-real-user-media',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-boundary-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2111, 'source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '03720cba59ab55e5093bf06f53a2701bd2e9165a', 'source merge mismatch')
assert(parsed.sourceResult.ownerReview.limitedExternalAgentProductToolCallExecutionNoRealUserMediaMayProceedNext === true, 'source does not approve execution')
assert(parsed.sourceResult.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionNextNoRealUserMedia === 15, 'source tool count mismatch')
assert(parsed.sourceHandoff.nextExecutionTarget.mayRunControlledLimitedExternalAgentProductToolCallsNoRealUserMedia === true, 'source handoff missing execution')
assert(parsed.sourceHandoff.nextExecutionTarget.expectedInvocationCount === 4, 'source handoff invocation count mismatch')
assert(parsed.sourceHandoff.nextExecutionTarget.requireWhatHappenedRows === 4, 'source handoff whatHappened mismatch')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source decision mismatch')
assert(parsed.prompt.expectedDecisionOnPass === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.executionScope.runControlledLimitedExternalAgentProductToolCallsNoRealUserMedia === true, 'prompt proof disabled')
assert(parsed.prompt.executionScope.expectedInvocationCount === 4, 'prompt invocation count mismatch')
assert(parsed.prompt.executionScope.expectedToolDescriptorCountPerInvocation === 15, 'prompt tool count mismatch')
assert(parsed.prompt.executionScope.requireWhatHappenedForEveryInvocation === true, 'prompt whatHappened missing')
assert(parsed.prompt.executionScope.stopInsteadOfForceOnCriticalBlocker === true, 'prompt stop policy missing')
assert(parsed.prompt.executionScope.allowRealUserMedia === false, 'prompt real media widened')
assert(parsed.prompt.executionScope.allowWorkerDispatch === false, 'prompt worker dispatch widened')
assert(parsed.prompt.executionScope.allowRouteExecution === false, 'prompt route widened')
assert(parsed.prompt.executionScope.allowSupabaseMutation === false, 'prompt Supabase widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2112, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'cb4fc67a6ecb6235abff28a4cc6a7777e1bd1a31', 'result source merge mismatch')
assert(parsed.result.proof.proofCommandRunCount === 1, 'result proof command count mismatch')
assert(parsed.result.proof.controlledLimitedExternalAgentProductToolCallsRun === 4, 'result invocation count mismatch')
assert(parsed.result.proof.limitedExternalAgentProductToolCallBoundaryInvoked === true, 'result boundary not invoked')
assert(parsed.result.proof.whatHappenedEvidenceRecorded === true, 'result whatHappened missing')
assert(parsed.result.proof.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.proof.runtimeFlagsAllFalse === true, 'result runtime flags mismatch')
assertAllFalse(parsed.result.sideEffects, 'result.sideEffects')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.whatHappened.whatHappenedRowsRequired === 4, 'whatHappened required mismatch')
assert(parsed.whatHappened.whatHappenedRowsRecorded === 4, 'whatHappened recorded mismatch')
assert(parsed.whatHappened.rows.length === 4, 'whatHappened row count mismatch')
for (const row of parsed.whatHappened.rows) {
  assert(row.accepted === true, `${row.invocationId} not accepted`)
  assert(row.toolDescriptorCount === 15, `${row.invocationId} tool count mismatch`)
  assert(row.whatHappened === 'accepted_synthetic_limited_external_agent_product_tool_call_boundary_without_side_effects', `${row.invocationId} whatHappened mismatch`)
}

assert(parsed.invocation.controlledInvocationCount === 4, 'invocation count mismatch')
assert(parsed.invocation.expectedToolDescriptorCountPerInvocation === 15, 'invocation descriptor count mismatch')
assert(parsed.invocation.workers.length === 2, 'worker count mismatch')
assert(parsed.invocation.images.length === 2, 'image count mismatch')
assert(parsed.invocation.jobTypes.length === 4, 'job type count mismatch')
assert(parsed.invocation.toolIds.length === 15, 'tool id count mismatch')
assert(parsed.invocation.inputKind === 'synthetic_no_real_user_media', 'input kind mismatch')
assert(parsed.invocation.runtimeFlagsAllFalse === true, 'invocation runtime flags mismatch')

assert(parsed.boundary.allowedInThisGate.controlledLimitedExternalAgentProductToolCallBoundaryInvocationsNoRealUserMedia === true, 'boundary allowed proof missing')
assertAllBlocked(parsed.boundary.blockedInThisGate, 'boundary.blockedInThisGate')
assertAllFalse(parsed.boundary.observedSideEffects, 'boundary.observedSideEffects')

assert(parsed.blockers.proofPassed === true, 'blockers proof not passed')
assert(parsed.blockers.readyForExecutionOwnerReviewNoRealUserMedia === true, 'blockers owner review missing')
assert(parsed.blockers.readyForRealUserMediaExecution === false, 'blockers real media widened')
assert(parsed.blockers.readyForWorkerDispatch === false, 'blockers worker dispatch widened')
assert(parsed.blockers.readyForRouteExecution === false, 'blockers route widened')
assert(parsed.blockers.readyForSupabaseMutation === false, 'blockers Supabase widened')
for (const [key, value] of Object.entries(parsed.blockers.blockersThatWouldStopLaterGates)) {
  assert(value === true, `later blocker ${key} must remain active`)
}

assert(parsed.policy.allowedClaims.controlledLimitedExternalAgentProductToolCallExecutionNoRealUserMediaPassedClaimed === true, 'policy pass claim missing')
assert(parsed.policy.allowedClaims.syntheticBoundaryInvocationCountClaimed === 4, 'policy invocation count mismatch')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assert(parsed.policy.nextGateMayRunExecutionOwnerReviewNoRealUserMedia === true, 'policy owner review missing')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'policy real media widened')
assert(parsed.policy.nextGateMayRunWorkerDispatch === false, 'policy worker dispatch widened')
assert(parsed.policy.nextGateMayRunRouteExecution === false, 'policy route widened')
assert(parsed.policy.nextGateMayMutateSupabase === false, 'policy Supabase widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewControlledNoRealUserMediaProofOnly === true, 'next review scope mismatch')
assert(parsed.next.reviewScope.expectedInvocationCount === 4, 'next invocation count mismatch')
assert(parsed.next.reviewScope.expectedToolDescriptorCountPerInvocation === 15, 'next tool count mismatch')
assert(parsed.next.reviewScope.requireWhatHappenedRows === 4, 'next whatHappened mismatch')
assert(parsed.next.reviewScope.mayApproveNoRealUserMediaBetaReadinessReconciliationNext === true, 'next beta reconciliation missing')
assert(parsed.next.reviewScope.allowRealUserMediaExecution === false, 'next real media widened')
assert(parsed.next.reviewScope.allowWorkerDispatch === false, 'next worker dispatch widened')
assert(parsed.next.reviewScope.allowRouteExecution === false, 'next route widened')
assert(parsed.next.reviewScope.allowSupabaseMutation === false, 'next Supabase widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2112,
      controlledLimitedExternalAgentProductToolCallsRun: 4,
      acceptedToolCount: 15,
      whatHappenedRowsRecorded: 4,
      realUserMediaUsed: false,
      workerDispatched: false,
      routeExecuted: false,
      supabaseTouched: false,
      publicArtifactCreated: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
