import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase143_controlled_disabled_route_request_validation_passed_with_warnings_ready_for_disabled_route_request_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase143_disabled_route_request_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_gap_review'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase144_worker_dispatch_contract_gap_review_completed_with_warnings_ready_for_dispatch_source_plan_or_blocker_fix'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation-result.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-acceptance-register.md',
  handoff: 'docs/worker-runtime-jobs-sound-cpu-phase143-worker-dispatch-gap-handoff.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-blocker-register.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-claim-policy.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review.md',
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

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'routeRequestExecutionEnabled',
    'workerDispatchExecutionEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'toolRuntimeExecutionAgainstUserAssetsEnabled',
    'mediaProcessingEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'storageObjectCreationEnabled',
    'signedUrlCreationEnabled',
    'publicArtifactCreationEnabled',
    'creditMutationEnabled',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase143-controlled-disabled-route-request-validation-result'),
  sourcePrompt: parseJsonBlock(docs.sourcePrompt, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-acceptance-register'),
  handoff: parseJsonBlock(docs.handoff, 'worker-runtime-jobs-sound-cpu-phase143-worker-dispatch-gap-handoff'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-blocker-register'),
  claimPolicy: parseJsonBlock(docs.claimPolicy, 'worker-runtime-jobs-sound-cpu-phase143-disabled-route-request-owner-claim-policy'),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase144-worker-dispatch-contract-gap-review'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2159, 'source PR mismatch')
assert(parsed.source.proofResult.postStatus === 409, 'source post status mismatch')
assert(parsed.source.proofResult.getStatus === 409, 'source get status mismatch')
assert(parsed.source.proofResult.workerDispatchExecutionEnabled === false, 'source worker widened')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected mismatch')
assert(parsed.sourcePrompt.reviewScope.acceptControlledDisabledRouteProof === true, 'source prompt review missing')
assert(parsed.sourcePrompt.reviewScope.allowWorkerDispatchExecution === false, 'source prompt worker widened')
assertNoOpClassification(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2160, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '10db5c14b667c13a47da320fc0f728f6115f0801', 'source merge mismatch')
assert(parsed.result.ownerReviewResult.controlledDisabledRouteProofAccepted === true, 'proof not accepted')
assert(parsed.result.ownerReviewResult.workerDispatchContractGapReviewMayProceed === true, 'gap review not unblocked')
assert(parsed.result.ownerReviewResult.postDisabledStatus === 409, 'post status mismatch')
assert(parsed.result.ownerReviewResult.getDisabledStatus === 409, 'get status mismatch')
assert(parsed.result.ownerReviewResult.workerDispatchExecutionEnabled === false, 'owner worker widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedEvidence.localLoopbackOnly === true, 'acceptance local-only missing')
assert(parsed.acceptance.acceptedEvidence.postRequestReturned409 === true, 'acceptance post missing')
assert(parsed.acceptance.acceptedEvidence.getRequestReturned409 === true, 'acceptance get missing')
assert(parsed.acceptance.acceptedEvidence.workerDispatchStarted === false, 'acceptance worker started')
assert(parsed.acceptance.acceptedForNextPlanningOnly.workerDispatchContractGapReview === true, 'gap review not accepted')
assert(parsed.acceptance.acceptedForNextPlanningOnly.workerDispatchImplementation === false, 'dispatch implementation accepted unexpectedly')

assert(parsed.handoff.nextGate === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE144-WORKER-DISPATCH-CONTRACT-GAP-REVIEW', 'handoff next gate mismatch')
assert(parsed.handoff.nextExpectedDecision === nextDecision, 'handoff decision mismatch')
assert(parsed.handoff.executionAllowedInNextGate === false, 'handoff allowed execution')

assert(parsed.blocker.unblockedForNextGate.includes('worker_dispatch_contract_gap_review'), 'gap review not unblocked')
assert(parsed.blocker.stillBlockedBeforeExecution.includes('worker_dispatch_claim_lease_execution'), 'worker dispatch blocker missing')
assertFalseMap(parsed.blocker.blockedClaims, 'blocker.blockedClaims')

assert(parsed.claimPolicy.allowedClaims.controlledDisabledRouteProofAccepted === true, 'claim proof missing')
assert(parsed.claimPolicy.allowedClaims.workerDispatchContractGapReviewMayProceed === true, 'claim next missing')
assertFalseMap(parsed.claimPolicy.blockedClaims, 'claimPolicy.blockedClaims')
assertNoOpClassification(parsed.claimPolicy.supabaseClassification, 'claimPolicy.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.nextPrompt.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.nextPrompt.reviewScope.inspectWorkerDispatchContractsOnly === true, 'next prompt scope missing')
assert(parsed.nextPrompt.reviewScope.allowWorkerDispatchExecution === false, 'next prompt worker widened')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2160,
      controlledDisabledRouteProofAccepted: true,
      workerDispatchContractGapReviewMayProceed: true,
      workerDispatchExecutionEnabled: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE144-WORKER-DISPATCH-CONTRACT-GAP-REVIEW',
    },
    null,
    2,
  ),
)
