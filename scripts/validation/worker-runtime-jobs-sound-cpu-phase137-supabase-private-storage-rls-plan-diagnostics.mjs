import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase136_route_execution_boundary_owner_review_passed_with_warnings_ready_for_supabase_private_storage_rls_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase137_supabase_private_storage_rls_plan_completed_with_warnings_ready_for_rls_owner_review'
const ownerReviewDecision =
  'worker_runtime_jobs_sound_cpu_phase137_supabase_private_storage_rls_owner_review_passed_with_warnings_ready_for_route_source_creation_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-owner-review-result.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase136-route-boundary-owner-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan-result.md',
  bucket: 'docs/worker-runtime-jobs-sound-cpu-phase137-private-bucket-policy-plan.md',
  manifest: 'docs/worker-runtime-jobs-sound-cpu-phase137-private-media-manifest-rls-plan.md',
  serviceRole: 'docs/worker-runtime-jobs-sound-cpu-phase137-service-role-worker-boundary-plan.md',
  signedUrl: 'docs/worker-runtime-jobs-sound-cpu-phase137-signed-url-delivery-boundary-plan.md',
  blocker: 'docs/worker-runtime-jobs-sound-cpu-phase137-migration-sql-blocker-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase137-supabase-rls-claim-policy.md',
  ownerPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-owner-review.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan.md',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase136-route-execution-boundary-owner-review-result'),
  sourcePolicy: parseJsonBlock(docs.sourcePolicy, 'worker-runtime-jobs-sound-cpu-phase136-route-boundary-owner-claim-policy'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-plan-result'),
  bucket: parseJsonBlock(docs.bucket, 'worker-runtime-jobs-sound-cpu-phase137-private-bucket-policy-plan'),
  manifest: parseJsonBlock(docs.manifest, 'worker-runtime-jobs-sound-cpu-phase137-private-media-manifest-rls-plan'),
  serviceRole: parseJsonBlock(docs.serviceRole, 'worker-runtime-jobs-sound-cpu-phase137-service-role-worker-boundary-plan'),
  signedUrl: parseJsonBlock(docs.signedUrl, 'worker-runtime-jobs-sound-cpu-phase137-signed-url-delivery-boundary-plan'),
  blocker: parseJsonBlock(docs.blocker, 'worker-runtime-jobs-sound-cpu-phase137-migration-sql-blocker-register'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase137-supabase-rls-claim-policy'),
  ownerPrompt: parseJsonBlock(
    docs.ownerPrompt,
    'worker-runtime-jobs-sound-cpu-phase137-supabase-private-storage-rls-owner-review',
  ),
  nextPrompt: parseJsonBlock(docs.nextPrompt, 'worker-runtime-jobs-sound-cpu-phase138-route-source-creation-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2138, 'source owner review source mismatch')
assert(parsed.source.ownerReview.supabasePrivateStorageRlsPlanMayProceed === true, 'source next gate missing')
assert(parsed.source.ownerReview.routeExecutionEnabled === false, 'source route widened')
assert(parsed.source.ownerReview.supabaseMutationEnabled === false, 'source Supabase widened')
assert(parsed.sourcePolicy.allowedClaims.supabasePrivateStorageRlsPlanMayProceed === true, 'source policy next missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planningScope.planSupabasePrivateStorageRlsOnly === true, 'prompt scope missing')
assert(parsed.prompt.planningScope.allowSupabaseMutation === false, 'prompt Supabase widened')
assert(parsed.prompt.planningScope.allowSqlExecution === false, 'prompt SQL widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2140, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'eeaaa04a1186bc0b145f9668f1694e1902648ba3', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.supabasePrivateStorageRlsPlanResult.privateStorageRlsBoundaryPlanned === true, 'plan missing')
assert(parsed.result.supabasePrivateStorageRlsPlanResult.rlsOwnerReviewMayProceed === true, 'owner review missing')
assert(parsed.result.supabasePrivateStorageRlsPlanResult.sqlExecuted === false, 'SQL flag widened')
assert(parsed.result.supabasePrivateStorageRlsPlanResult.supabaseEnvironmentTouched === false, 'Supabase touched unexpectedly')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.bucket.plannedBuckets.length === 4, 'bucket count mismatch')
for (const bucket of parsed.bucket.plannedBuckets) {
  assert(bucket.access === 'private', `${bucket.bucket} must be private`)
  assert(bucket.publicAccessAllowed === false, `${bucket.bucket} public access widened`)
  assert(bucket.createdInThisGate === false, `${bucket.bucket} created unexpectedly`)
}
assert(parsed.bucket.storageDefaults.allBucketsPrivateByDefault === true, 'private default missing')
assert(parsed.bucket.storageDefaults.storageObjectCreationEnabled === false, 'storage object creation widened')

assert(parsed.manifest.plannedTables.length === 4, 'table count mismatch')
for (const table of parsed.manifest.plannedTables) {
  assert(table.userInsertAllowed === false, `${table.table} user insert widened`)
  assert(table.userUpdateAllowed === false, `${table.table} user update widened`)
  assert(table.serviceWriteRequired === true, `${table.table} service write boundary missing`)
  assert(table.migrationCreatedInThisGate === false, `${table.table} migration created unexpectedly`)
}
assert(parsed.manifest.manifestRequirements.approvedPlanSnapshotIdRequired === true, 'snapshot requirement missing')
assert(parsed.manifest.manifestRequirements.signedUrlAsSourceOfTruthAllowed === false, 'signed URL source widened')

assert(parsed.serviceRole.serviceRoleBoundary.serviceRoleAllowedInFrontend === false, 'frontend service role widened')
assert(parsed.serviceRole.serviceRoleBoundary.workerWritesMustUseBackendServiceBoundary === true, 'service boundary missing')
assert(parsed.serviceRole.futureServiceWriteTargets.includes('worker_events'), 'worker events target missing')
assertFalseMap(parsed.serviceRole.blockedToday, 'serviceRole.blockedToday')

assert(parsed.signedUrl.signedUrlPolicy.signedUrlsCreatedInThisGate === false, 'signed URL flag widened')
assert(parsed.signedUrl.signedUrlPolicy.publicArtifactUrlsAllowed === false, 'public artifact URL widened')
assertFalseMap(parsed.signedUrl.blockedToday, 'signedUrl.blockedToday')

assert(parsed.blocker.blockedBeforeRealMigration.includes('rls_policy_owner_review'), 'RLS owner blocker missing')
assertFalseMap(parsed.blocker.migrationOutputsCreatedInThisGate, 'blocker.migrationOutputsCreatedInThisGate')
assert(parsed.blocker.nextAllowedAction === 'rls_owner_review_only', 'next action mismatch')

assert(parsed.policy.allowedClaims.supabasePrivateStorageRlsBoundaryPlanned === true, 'policy plan claim missing')
assert(parsed.policy.allowedClaims.rlsOwnerReviewMayProceed === true, 'policy owner next missing')
assertFalseMap(parsed.policy.blockedClaims, 'policy.blockedClaims')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.ownerPrompt.requiredSourceDecision === decision, 'owner prompt source mismatch')
assert(parsed.ownerPrompt.expectedDecision === ownerReviewDecision, 'owner prompt expected mismatch')
assert(parsed.ownerPrompt.reviewScope.acceptSupabasePrivateStorageRlsPlanningOnly === true, 'owner prompt scope missing')
assert(parsed.ownerPrompt.reviewScope.allowSupabaseMutation === false, 'owner prompt Supabase widened')
assertNoOpClassification(parsed.ownerPrompt.supabaseClassification, 'ownerPrompt.supabaseClassification')

assert(parsed.nextPrompt.requiredSourceDecision === ownerReviewDecision, 'next prompt source mismatch')
assert(parsed.nextPrompt.planningScope.planRouteSourceCreationOnly === true, 'next prompt route plan missing')
assert(parsed.nextPrompt.planningScope.allowRouteSourceCreation === false, 'next prompt route source widened')
assert(parsed.nextPrompt.planningScope.allowRouteExecution === false, 'next prompt route widened')
assert(parsed.nextPrompt.planningScope.allowSupabaseMutation === false, 'next prompt Supabase widened')
assertNoOpClassification(parsed.nextPrompt.supabaseClassification, 'nextPrompt.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2140,
      privateStorageRlsBoundaryPlanned: true,
      rlsOwnerReviewMayProceed: true,
      sqlExecuted: false,
      supabaseEnvironmentTouched: false,
      nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE137-SUPABASE-PRIVATE-STORAGE-RLS-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
