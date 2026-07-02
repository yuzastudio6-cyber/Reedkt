import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase136_route_execution_boundary_plan_completed_with_warnings_ready_for_route_boundary_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase136_route_execution_boundary_owner_review_passed_with_warnings_ready_for_supabase_private_storage_rls_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan-result.md',
  sourceEntrypoint: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-entrypoint-boundary-plan.md',
  sourceAuth: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-auth-snapshot-policy.md',
  sourceIdempotency: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-idempotency-validation-policy.md',
  sourceRejection: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-rejection-stop-rules.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-execution-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-boundary-owner-acceptance-register.md',
  entrypoint: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-entrypoint-owner-register.md',
  authIdempotency: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-auth-idempotency-owner-register.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-boundary-owner-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-boundary-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan.md',
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
    'routeSourceCreated',
    'routeSourceCreationEnabled',
    'routeExecutionEnabled',
    'workerDispatchExecutionEnabled',
    'workerLeaseMutationEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'toolRuntimeExecutionAgainstUserAssetsEnabled',
    'mediaProcessingEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
    'storageObjectCreationEnabled',
    'artifactCreationEnabled',
    'signedUrlCreationEnabled',
    'publicArtifactCreationEnabled',
    'creditMutationEnabled',
    'productionUnlockEnabled',
    'allowRouteSourceCreation',
    'allowRouteExecution',
    'allowWorkerDispatchExecution',
    'allowRealUserMediaBetaEnablement',
    'allowPaidProduction',
    'allowSupabaseMutation',
    'allowArtifactCreation',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan-result'),
  sourceEntrypoint: parseJsonBlock(
    docs.sourceEntrypoint,
    'worker-runtime-jobs-sound-cpu-phase136-route-entrypoint-boundary-plan',
  ),
  sourceAuth: parseJsonBlock(docs.sourceAuth, 'worker-runtime-jobs-sound-cpu-phase136-route-auth-snapshot-policy'),
  sourceIdempotency: parseJsonBlock(
    docs.sourceIdempotency,
    'worker-runtime-jobs-sound-cpu-phase136-route-idempotency-validation-policy',
  ),
  sourceRejection: parseJsonBlock(docs.sourceRejection, 'worker-runtime-jobs-sound-cpu-phase136-route-rejection-stop-rules'),
  sourcePolicy: parseJsonBlock(docs.sourcePolicy, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-claim-policy'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase136-route-boundary-owner-acceptance-register'),
  entrypoint: parseJsonBlock(docs.entrypoint, 'worker-runtime-jobs-sound-cpu-phase136-route-entrypoint-owner-register'),
  authIdempotency: parseJsonBlock(
    docs.authIdempotency,
    'worker-runtime-jobs-sound-cpu-phase136-route-auth-idempotency-owner-register',
  ),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase136-route-boundary-owner-blocker-register'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase136-route-boundary-owner-claim-policy'),
  next: parseJsonBlock(docs.next, 'worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2136, 'source plan source PR mismatch')
assert(parsed.source.routeBoundaryPlanResult.routeExecutionBoundaryPlanned === true, 'source boundary missing')
assert(parsed.source.routeBoundaryPlanResult.routeExecutionEnabled === false, 'source route widened')
assert(parsed.source.routeBoundaryPlanResult.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.sourceEntrypoint.futureRouteEntrypoints.length === 2, 'source entrypoint count mismatch')
assert(parsed.sourceAuth.snapshotRules.workersExecuteApprovedSnapshotOnly === true, 'source snapshot rule missing')
assert(parsed.sourceIdempotency.futureIdempotencyRequirements.idempotencyKeyRequired === true, 'source idempotency missing')
assert(parsed.sourceRejection.stopRules.stopBeforeSupabaseMutation === true, 'source Supabase stop rule missing')
assert(parsed.sourcePolicy.allowedClaims.routeBoundaryOwnerReviewMayProceed === true, 'source policy owner next missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.acceptRouteExecutionBoundaryPlanningOnly === true, 'prompt scope missing')
assert(parsed.prompt.reviewScope.mayProceedToSupabasePrivateStorageRlsPlan === true, 'prompt next missing')
assert(parsed.prompt.reviewScope.allowRouteExecution === false, 'prompt route widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2138, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '8ec31efbcb98007f60f6115b697889348babc1f1', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.ownerReview.routeExecutionBoundaryPlanAccepted === true, 'owner acceptance missing')
assert(parsed.result.ownerReview.supabasePrivateStorageRlsPlanMayProceed === true, 'next planning missing')
assert(parsed.result.ownerReview.routeSourceCreationEnabled === false, 'route source widened')
assert(parsed.result.ownerReview.routeExecutionEnabled === false, 'route widened')
assert(parsed.result.ownerReview.workerDispatchExecutionEnabled === false, 'dispatch widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPlanning.nextGap === 'supabase_private_storage_rls_plan', 'next gap mismatch')
assertFalseMap(parsed.acceptance.acceptedForExecutionToday, 'acceptance.acceptedForExecutionToday')

assert(parsed.entrypoint.acceptedFutureRouteEntrypoints.length === 2, 'owner entrypoint count mismatch')
assert(parsed.entrypoint.acceptedWorkerSet.length === 2, 'owner worker count mismatch')
assert(parsed.entrypoint.acceptedImageSet.length === 2, 'owner image count mismatch')
assert(parsed.entrypoint.acceptedJobTypes.length === 4, 'owner job count mismatch')

assert(parsed.authIdempotency.acceptedFuturePreconditions.approvedPlanSnapshotIdRequired === true, 'approved snapshot missing')
assert(parsed.authIdempotency.rejectedPayloadSources.rawPromptPayload === true, 'raw prompt rejection missing')
assertFalseMap(parsed.authIdempotency.blockedToday, 'authIdempotency.blockedToday')

assert(parsed.blocker.blockingBeforeExecution.includes('supabase_private_storage_rls_plan'), 'RLS blocker missing')
assert(parsed.blocker.criticalStopIfMissing.includes('storage_rls_boundary'), 'RLS stop missing')
assertFalseMap(parsed.blocker.notUnblockedByThisReview, 'blocker.notUnblockedByThisReview')

assert(parsed.policy.allowedClaims.routeExecutionBoundaryPlanAccepted === true, 'policy accepted missing')
assert(parsed.policy.allowedClaims.supabasePrivateStorageRlsPlanMayProceed === true, 'policy next missing')
assertFalseMap(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.next.planningScope.planSupabasePrivateStorageRlsOnly === true, 'next prompt scope missing')
assert(parsed.next.planningScope.allowSupabaseMutation === false, 'next prompt Supabase widened')
assert(parsed.next.planningScope.allowSqlExecution === false, 'next prompt SQL widened')
assert(parsed.next.planningScope.allowRouteExecution === false, 'next prompt route widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2138,
      routeExecutionBoundaryPlanAccepted: true,
      supabasePrivateStorageRlsPlanMayProceed: true,
      routeExecutionEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE137-SUPABASE-PRIVATE-STORAGE-RLS-PLAN',
    },
    null,
    2,
  ),
)
