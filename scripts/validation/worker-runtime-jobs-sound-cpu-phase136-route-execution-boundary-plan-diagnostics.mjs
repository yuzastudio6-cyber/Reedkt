import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase135_worker_dispatch_claim_lease_owner_review_passed_with_warnings_ready_for_route_execution_boundary_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase136_route_execution_boundary_plan_completed_with_warnings_ready_for_route_boundary_owner_review'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase136_route_execution_boundary_owner_review_passed_with_warnings_ready_for_supabase_private_storage_rls_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-acceptance-register.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan-result.md',
  entrypoint: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-entrypoint-boundary-plan.md',
  auth: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-auth-snapshot-policy.md',
  idempotency: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-idempotency-validation-policy.md',
  rejection: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-rejection-stop-rules.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-execution-claim-policy.md',
  ownerPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-owner-review.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan.md',
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
    'routeExecutionEnabled',
    'workerDispatchExecutionEnabled',
    'workerLeaseMutationEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'toolRuntimeExecutionAgainstUserAssetsEnabled',
    'mediaProcessingEnabled',
    'supabaseMutationEnabled',
    'sqlExecutionEnabled',
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
    'allowSqlExecution',
    'allowMigrationCreation',
    'allowStorageObjectCreation',
    'allowSignedUrlCreation',
    'allowPublicArtifactCreation',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-review-result'),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-acceptance-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-owner-claim-policy',
  ),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-plan-result'),
  entrypoint: parseJsonBlock(docs.entrypoint, 'worker-runtime-jobs-sound-cpu-phase136-route-entrypoint-boundary-plan'),
  auth: parseJsonBlock(docs.auth, 'worker-runtime-jobs-sound-cpu-phase136-route-auth-snapshot-policy'),
  idempotency: parseJsonBlock(
    docs.idempotency,
    'worker-runtime-jobs-sound-cpu-phase136-route-idempotency-validation-policy',
  ),
  rejection: parseJsonBlock(docs.rejection, 'worker-runtime-jobs-sound-cpu-phase136-route-rejection-stop-rules'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-claim-policy'),
  ownerPrompt: parseJsonBlock(
    docs.ownerPrompt,
    'worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-owner-review',
  ),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.ownerReview.routeExecutionBoundaryPlanMayProceed === true, 'source next gap missing')
assert(parsed.source.ownerReview.workerDispatchExecutionEnabled === false, 'source dispatch widened')
assert(parsed.source.ownerReview.routeExecutionEnabled === false, 'source route widened')
assert(parsed.sourceAcceptance.acceptedPlanning.nextGap === 'route_execution_boundary', 'source next gap mismatch')
assert(parsed.sourcePolicy.allowedClaims.routeExecutionBoundaryPlanMayProceed === true, 'source policy next missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planningScope.planRouteExecutionBoundaryOnly === true, 'prompt planning scope missing')
assert(parsed.prompt.planningScope.allowRouteExecution === false, 'prompt route widened')
assert(parsed.prompt.planningScope.allowWorkerDispatchExecution === false, 'prompt dispatch widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2136, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'baaaf7465cfe7e0e62130514ff3d6d00c61e0e97', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.routeBoundaryPlanResult.routeExecutionBoundaryPlanned === true, 'route boundary plan missing')
assert(parsed.result.routeBoundaryPlanResult.routeBoundaryOwnerReviewMayProceed === true, 'owner review next missing')
assert(parsed.result.routeBoundaryPlanResult.futureRouteSourceCreated === false, 'route source created unexpectedly')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.entrypoint.futureRouteEntrypoints.length === 2, 'entrypoint count mismatch')
assert(parsed.entrypoint.requiredFutureInputs.includes('approvedPlanSnapshotId'), 'approved snapshot input missing')
assert(parsed.entrypoint.requiredFutureInputs.includes('privateMediaManifestId'), 'manifest input missing')
assert(parsed.entrypoint.allowedWorkers.length === 2, 'worker count mismatch')
assert(parsed.entrypoint.allowedImages.length === 2, 'image count mismatch')
assert(parsed.entrypoint.allowedJobTypes.length === 4, 'job type count mismatch')
assertFalseMap(parsed.entrypoint.blockedToday, 'entrypoint.blockedToday')

assert(parsed.auth.futureAuthRequirements.requiresApprovedPlanSnapshot === true, 'approved snapshot auth missing')
assert(parsed.auth.snapshotRules.workersExecuteApprovedSnapshotOnly === true, 'snapshot worker rule missing')
assert(parsed.auth.snapshotRules.rawPromptExecutionAllowed === false, 'raw prompt widened')
assert(parsed.auth.snapshotRules.serviceRolePayloadFromClientAllowed === false, 'service role widened')
assertFalseMap(parsed.auth.blockedToday, 'auth.blockedToday')

assert(parsed.idempotency.futureIdempotencyRequirements.idempotencyKeyRequired === true, 'idempotency key missing')
assert(parsed.idempotency.futureIdempotencyRequirements.claimLeasePlanMustBeAccepted === true, 'claim lease requirement missing')
assert(parsed.idempotency.duplicatePrevention.routeMustNotStartWorkerWithoutLease === true, 'lease prevention missing')
assertFalseMap(parsed.idempotency.blockedToday, 'idempotency.blockedToday')

assert(parsed.rejection.futureHardRejectConditions.includes('supabase_private_storage_rls_not_reviewed'), 'RLS stop rule missing')
assert(parsed.rejection.stopRules.stopBeforeRouteExecution === true, 'route stop rule missing')
assert(parsed.rejection.stopRules.stopBeforeSupabaseMutation === true, 'Supabase stop rule missing')
assertFalseMap(parsed.rejection.blockedToday, 'rejection.blockedToday')

assert(parsed.policy.allowedClaims.routeExecutionBoundaryPlanCreated === true, 'policy plan claim missing')
assert(parsed.policy.allowedClaims.routeBoundaryOwnerReviewMayProceed === true, 'policy owner next missing')
assert(parsed.policy.allowedClaims.supabasePrivateStorageRlsPlanningMayProceedAfterOwnerReview === true, 'policy next gap missing')
assertFalseMap(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.ownerPrompt.requiredSourceDecision === decision, 'owner prompt source mismatch')
assert(parsed.ownerPrompt.expectedDecision === ownerReviewDecision, 'owner prompt expected mismatch')
assert(parsed.ownerPrompt.reviewScope.acceptRouteExecutionBoundaryPlanningOnly === true, 'owner prompt scope missing')
assert(parsed.ownerPrompt.reviewScope.mayProceedToSupabasePrivateStorageRlsPlan === true, 'owner prompt next missing')
assert(parsed.ownerPrompt.reviewScope.allowRouteExecution === false, 'owner prompt route widened')
assertNoOpClassification(parsed.ownerPrompt.supabaseClassification, 'ownerPrompt.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === ownerReviewDecision, 'phase137 prompt source mismatch')
assert(
  parsed.nextPrompt.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase137_supabase_private_storage_rls_plan_completed_with_warnings_ready_for_rls_owner_review',
  'phase137 prompt expected mismatch',
)
assert(parsed.nextPrompt.planningScope.planSupabasePrivateStorageRlsOnly === true, 'phase137 scope missing')
assert(parsed.nextPrompt.planningScope.allowSupabaseMutation === false, 'phase137 Supabase widened')
assert(parsed.nextPrompt.planningScope.allowSqlExecution === false, 'phase137 SQL widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'phase137 route widened')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2136,
      routeExecutionBoundaryPlanned: true,
      routeBoundaryOwnerReviewMayProceed: true,
      routeExecutionEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE136-ROUTE-EXECUTION-BOUNDARY-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
