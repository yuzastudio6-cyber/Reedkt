import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase134_private_media_manifest_retention_owner_review_passed_with_warnings_ready_for_worker_dispatch_claim_lease_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase135_worker_dispatch_claim_lease_plan_completed_with_warnings_ready_for_dispatch_owner_review'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review-result.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan-result.md',
  state: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-state-machine-plan.md',
  lease: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-claim-lease-policy.md',
  retry: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-retry-timeout-policy.md',
  duplicate: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-duplicate-prevention-policy.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-policy.md',
  nextOwner: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-review.md',
  nextRoute: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan.md',
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
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'supabaseMutationEnabled',
    'artifactCreationEnabled',
    'allowWorkerDispatchExecution',
    'allowRouteExecution',
    'allowSupabaseMutation',
    'allowArtifactCreation',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review-result',
  ),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan-result'),
  state: parseJsonBlock(docs.state, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-state-machine-plan'),
  lease: parseJsonBlock(docs.lease, 'worker-runtime-jobs-sound-cpu-phase135-worker-claim-lease-policy'),
  retry: parseJsonBlock(docs.retry, 'worker-runtime-jobs-sound-cpu-phase135-worker-retry-timeout-policy'),
  duplicate: parseJsonBlock(docs.duplicate, 'worker-runtime-jobs-sound-cpu-phase135-worker-duplicate-prevention-policy'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-policy'),
  nextOwner: parseJsonBlock(docs.nextOwner, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-review'),
  nextRoute: parseJsonBlock(docs.nextRoute, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2133, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'aef77eb203631eccfadaab75eb546766140cd3fd', 'source merge mismatch')
assert(parsed.source.ownerReview.workerDispatchClaimLeasePlanMayProceed === true, 'source next missing')
assert(parsed.source.ownerReview.workerDispatchEnabled === false, 'source dispatch widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planningScope.planWorkerDispatchClaimLeaseOnly === true, 'prompt scope missing')
assert(parsed.prompt.planningScope.allowWorkerDispatchExecution === false, 'prompt dispatch widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2134, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '12c21153dfd570dfa6d6a0ea623a954b77eba1b8', 'result source merge mismatch')
assert(parsed.result.dispatchPlanResult.workerDispatchClaimLeasePlanned === true, 'dispatch plan missing')
assert(parsed.result.dispatchPlanResult.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.dispatchPlanResult.nextBlockedGap === 'route_execution_boundary', 'next gap mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.state.plannedStates.length === 9, 'state count mismatch')
assert(parsed.state.requiredClaimFields.approvedPlanSnapshotId === 'required', 'approved snapshot required missing')
assert(parsed.state.stateMachineImplementedToday === false, 'state machine implemented unexpectedly')

assert(parsed.lease.plannedLeasePolicy.singleActiveLeasePerJob === true, 'single lease policy missing')
assert(parsed.lease.claimMutationImplementedToday === false, 'claim mutation widened')
assert(parsed.lease.workerDispatchExecutionToday === false, 'dispatch widened')

assert(parsed.retry.plannedRetryPolicy.timeoutPolicyRequired === true, 'timeout policy missing')
assert(parsed.retry.retryExecutionToday === false, 'retry execution widened')
assert(parsed.duplicate.plannedDuplicatePrevention.leaseTokenCompareAndSwapRequired === true, 'CAS missing')
assert(parsed.duplicate.duplicatePreventionImplementedToday === false, 'duplicate prevention implemented unexpectedly')

assert(parsed.policy.allowedClaims.workerDispatchClaimLeasePlanned === true, 'policy planned missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.nextOwner.requiredSourceDecision === decision, 'owner next source mismatch')
assert(parsed.nextOwner.reviewScope.allowWorkerDispatchExecution === false, 'owner next dispatch widened')
assertNoOpClassification(parsed.nextOwner.supabaseClassification, 'owner next supabaseClassification')

assert(
  parsed.nextRoute.requiredSourceDecision ===
    'worker_runtime_jobs_sound_cpu_phase135_worker_dispatch_claim_lease_owner_review_passed_with_warnings_ready_for_route_execution_boundary_plan',
  'route next source mismatch',
)
assert(parsed.nextRoute.planningScope.allowRouteExecution === false, 'route next execution widened')
assertNoOpClassification(parsed.nextRoute.supabaseClassification, 'route next supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2134,
      workerDispatchClaimLeasePlanned: true,
      nextBlockedGap: 'route_execution_boundary',
      workerDispatchExecutionEnabled: false,
    },
    null,
    2,
  ),
)
