import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase137_supabase_private_storage_rls_plan_completed_with_warnings_ready_for_rls_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase137_supabase_private_storage_rls_owner_review_passed_with_warnings_ready_for_route_source_creation_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan-result.md',
  sourceBucket: 'docs/worker-runtime-jobs-sound-cpu-phase137-private-bucket-policy-plan.md',
  sourceManifest: 'docs/worker-runtime-jobs-sound-cpu-phase137-private-media-manifest-rls-plan.md',
  sourceService: 'docs/worker-runtime-jobs-sound-cpu-phase137-service-role-worker-boundary-plan.md',
  sourceSignedUrl: 'docs/worker-runtime-jobs-sound-cpu-phase137-signed-url-delivery-boundary-plan.md',
  sourceBlocker: 'docs/worker-runtime-jobs-sound-cpu-phase137-migration-sql-blocker-register.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase137-supabase-rls-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase137-rls-owner-acceptance-register.md',
  bucket: 'docs/worker-runtime-jobs-sound-cpu-phase137-bucket-rls-owner-register.md',
  service: 'docs/worker-runtime-jobs-sound-cpu-phase137-service-role-boundary-owner-register.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase137-migration-sql-owner-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase137-rls-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan.md',
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
    'supabaseMigrationCreated',
    'sqlExecutionEnabled',
    'supabaseMutationEnabled',
    'supabaseEnvironmentTouched',
    'storageBucketCreated',
    'storageObjectCreationEnabled',
    'signedUrlCreationEnabled',
    'publicArtifactCreationEnabled',
    'routeSourceCreated',
    'routeSourceCreationEnabled',
    'routeExecutionEnabled',
    'workerDispatchExecutionEnabled',
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'productionUnlockEnabled',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowMigrationCreation',
    'allowStorageObjectCreation',
    'allowSignedUrlCreation',
    'allowRouteSourceCreation',
    'allowRouteExecution',
    'allowWorkerDispatchExecution',
    'allowRealUserMediaBetaEnablement',
    'allowPaidProduction',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan-result'),
  sourceBucket: parseJsonBlock(docs.sourceBucket, 'worker-runtime-jobs-sound-cpu-phase137-private-bucket-policy-plan'),
  sourceManifest: parseJsonBlock(docs.sourceManifest, 'worker-runtime-jobs-sound-cpu-phase137-private-media-manifest-rls-plan'),
  sourceService: parseJsonBlock(docs.sourceService, 'worker-runtime-jobs-sound-cpu-phase137-service-role-worker-boundary-plan'),
  sourceSignedUrl: parseJsonBlock(docs.sourceSignedUrl, 'worker-runtime-jobs-sound-cpu-phase137-signed-url-delivery-boundary-plan'),
  sourceBlocker: parseJsonBlock(docs.sourceBlocker, 'worker-runtime-jobs-sound-cpu-phase137-migration-sql-blocker-register'),
  sourcePolicy: parseJsonBlock(docs.sourcePolicy, 'worker-runtime-jobs-sound-cpu-phase137-supabase-rls-claim-policy'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase137-rls-owner-acceptance-register'),
  bucket: parseJsonBlock(docs.bucket, 'worker-runtime-jobs-sound-cpu-phase137-bucket-rls-owner-register'),
  service: parseJsonBlock(docs.service, 'worker-runtime-jobs-sound-cpu-phase137-service-role-boundary-owner-register'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase137-migration-sql-owner-blocker-register'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase137-rls-owner-claim-policy'),
  next: parseJsonBlock(docs.next, 'worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2140, 'source plan source PR mismatch')
assert(parsed.source.supabasePrivateStorageRlsPlanResult.privateStorageRlsBoundaryPlanned === true, 'source plan missing')
assert(parsed.source.supabasePrivateStorageRlsPlanResult.sqlExecuted === false, 'source SQL widened')
assert(parsed.source.supabasePrivateStorageRlsPlanResult.supabaseEnvironmentTouched === false, 'source env widened')
assert(parsed.sourceBucket.plannedBuckets.length === 4, 'source bucket count mismatch')
assert(parsed.sourceManifest.plannedTables.length === 4, 'source table count mismatch')
assert(parsed.sourceService.serviceRoleBoundary.workerWritesMustUseBackendServiceBoundary === true, 'source service boundary missing')
assert(parsed.sourceSignedUrl.signedUrlPolicy.signedUrlsCreatedInThisGate === false, 'source signed URL widened')
assert(parsed.sourceBlocker.nextAllowedAction === 'rls_owner_review_only', 'source next mismatch')
assert(parsed.sourcePolicy.allowedClaims.rlsOwnerReviewMayProceed === true, 'source policy owner next missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.acceptSupabasePrivateStorageRlsPlanningOnly === true, 'prompt scope missing')
assert(parsed.prompt.reviewScope.mayProceedToRouteSourceCreationPlan === true, 'prompt next missing')
assert(parsed.prompt.reviewScope.allowSupabaseMutation === false, 'prompt Supabase widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2141, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '1a9bd932f8d3430810bfd875d3c4091785d68f21', 'source merge mismatch')
assert(parsed.result.ownerReview.supabasePrivateStorageRlsPlanAccepted === true, 'owner plan acceptance missing')
assert(parsed.result.ownerReview.routeSourceCreationPlanMayProceed === true, 'route source next missing')
assert(parsed.result.ownerReview.sqlExecutionEnabled === false, 'result SQL widened')
assert(parsed.result.ownerReview.supabaseMutationEnabled === false, 'result Supabase widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPlanning.nextGap === 'route_source_creation_plan', 'next gap mismatch')
assertFalseMap(parsed.acceptance.acceptedForExecutionToday, 'acceptance.acceptedForExecutionToday')

assert(parsed.bucket.acceptedBucketsForFuturePlanning.length === 4, 'bucket accepted count mismatch')
assert(parsed.bucket.acceptedTableRlsPlanning.includes('approved_plan_snapshots'), 'approved snapshots table missing')
assert(parsed.bucket.privacyDefaults.allBucketsPrivateByDefault === true, 'private default missing')
assertFalseMap(parsed.bucket.createdInThisReview, 'bucket.createdInThisReview')

assert(parsed.service.acceptedServiceRoleBoundary.serviceRoleAllowedInFrontend === false, 'frontend service role widened')
assert(parsed.service.acceptedServiceRoleBoundary.workerWritesMustUseBackendServiceBoundary === true, 'service boundary missing')
assert(parsed.service.futureServiceWriteTargetsAccepted.includes('worker_events'), 'worker event target missing')
assertFalseMap(parsed.service.enabledToday, 'service.enabledToday')

assert(parsed.blocker.stillBlockedBeforeRealMigration.includes('tested_rls_policy_in_supabase'), 'tested RLS blocker missing')
assertFalseMap(parsed.blocker.ownerReviewOutputsCreated, 'blocker.ownerReviewOutputsCreated')
assert(parsed.blocker.nextAllowedAction === 'route_source_creation_plan_only', 'next action mismatch')

assert(parsed.policy.allowedClaims.supabasePrivateStorageRlsPlanAccepted === true, 'policy accepted missing')
assert(parsed.policy.allowedClaims.routeSourceCreationPlanMayProceed === true, 'policy next missing')
assertFalseMap(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.planningScope.planRouteSourceCreationOnly === true, 'next scope missing')
assert(parsed.next.planningScope.allowRouteSourceCreation === false, 'next route source widened')
assert(parsed.next.planningScope.allowRouteExecution === false, 'next route widened')
assert(parsed.next.planningScope.allowSupabaseMutation === false, 'next Supabase widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2141,
      supabasePrivateStorageRlsPlanAccepted: true,
      routeSourceCreationPlanMayProceed: true,
      sqlExecuted: false,
      supabaseMutationEnabled: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE138-ROUTE-SOURCE-CREATION-PLAN',
    },
    null,
    2,
  ),
)
