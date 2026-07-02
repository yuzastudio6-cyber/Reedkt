import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase135_worker_dispatch_claim_lease_plan_completed_with_warnings_ready_for_dispatch_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase135_worker_dispatch_claim_lease_owner_review_passed_with_warnings_ready_for_route_execution_boundary_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan-result.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-acceptance-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan.md',
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
    'workerDispatchExecutionEnabled',
    'routeExecutionEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'supabaseMutationEnabled',
    'artifactCreationEnabled',
    'allowRouteExecution',
    'allowWorkerDispatchExecution',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan-result'),
  sourcePolicy: parseJsonBlock(docs.sourcePolicy, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-policy'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-review-result'),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-acceptance-register',
  ),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-claim-policy'),
  next: parseJsonBlock(docs.next, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2134, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '12c21153dfd570dfa6d6a0ea623a954b77eba1b8', 'source merge mismatch')
assert(parsed.source.dispatchPlanResult.workerDispatchClaimLeasePlanned === true, 'source plan missing')
assert(parsed.source.dispatchPlanResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.sourcePolicy.allowedClaims.nextBlockedGap === 'route_execution_boundary', 'source next gap mismatch')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.mayProceedToRouteExecutionBoundaryPlan === true, 'prompt next missing')
assert(parsed.prompt.reviewScope.allowWorkerDispatchExecution === false, 'prompt dispatch widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2135, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'c014b444457300943816f653a707266a588fbc6f', 'result source merge mismatch')
assert(parsed.result.ownerReview.workerDispatchClaimLeasePlanAccepted === true, 'result acceptance missing')
assert(parsed.result.ownerReview.routeExecutionBoundaryPlanMayProceed === true, 'result next missing')
assert(parsed.result.ownerReview.workerDispatchExecutionEnabled === false, 'result dispatch widened')
assert(parsed.result.ownerReview.routeExecutionEnabled === false, 'result route widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPlanning.nextGap === 'route_execution_boundary', 'acceptance next gap mismatch')
for (const [key, value] of Object.entries(parsed.acceptance.acceptedForExecutionToday)) assert(value === false, `${key} must be false`)

assert(parsed.policy.allowedClaims.routeExecutionBoundaryPlanMayProceed === true, 'policy next missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.planningScope.planRouteExecutionBoundaryOnly === true, 'next scope missing')
assert(parsed.next.planningScope.allowRouteExecution === false, 'next route widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2135,
      workerDispatchClaimLeasePlanAccepted: true,
      routeExecutionBoundaryPlanMayProceed: true,
      workerDispatchExecutionEnabled: false,
    },
    null,
    2,
  ),
)
