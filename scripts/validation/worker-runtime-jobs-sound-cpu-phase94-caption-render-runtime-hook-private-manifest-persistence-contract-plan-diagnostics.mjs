import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'supabase_rls_storage_database_sound_cpu_private_manifest_persistence_handoff_review_passed_with_warnings_ready_for_manifest_persistence_contract_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase94_caption_render_runtime_hook_private_manifest_persistence_contract_plan_completed_with_warnings_ready_for_manifest_persistence_contract_owner_review_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase94_caption_render_runtime_hook_private_manifest_persistence_contract_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_source_creation_plan_no_execution'
const sourceHead = '59b264e06767f219c6c3a17c8c1e5a30d0406021'
const sourceMergeCommit = '9e7462d3356151152cc75e24bd2a6f32e7c83663'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-plan.md',
  sourceResult:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-persistence-handoff-review-result.md',
  sourceRls:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-rls-ownership-review.md',
  sourceServiceRole:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-service-role-boundary-review.md',
  sourceStorage:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-storage-boundary-review.md',
  sourceRetention:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-retention-audit-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-plan-result.md',
  fields:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract.md',
  rlsStorage:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-rls-storage-dependency-contract.md',
  serviceRole:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-service-role-write-contract.md',
  retention:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-retention-audit-contract.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-review.md',
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

function assertFalse(value, message) {
  assert(value === false, `${message} must be false`)
}

function assertFalseFields(record, label, fields) {
  for (const field of fields) assertFalse(record[field], `${label}.${field}`)
}

function assertNoOpClassification(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'createSourceFileToday',
    'sourceFileCreatedToday',
    'createMigrationToday',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageBucketToday',
    'writeDatabaseRowsToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'createPublicArtifactToday',
    'dispatchWorkerToday',
    'openMediaFileToday',
    'callRouteToolProviderToday',
    'broadServiceRoleHandlerEnabledToday',
    'workerDispatchEnabledToday',
    'routeHandlerEnabledToday',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'realUserMediaBetaReadyClaimed',
    'productionReadinessClaimed',
    'unlockBetaToday',
    'unlockProductionToday',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'supabase-rls-storage-database-sound-cpu-private-manifest-persistence-handoff-review-result',
  ),
  sourceRls: parseJsonBlock(
    docs.sourceRls,
    'supabase-rls-storage-database-sound-cpu-private-manifest-rls-ownership-review',
  ),
  sourceServiceRole: parseJsonBlock(
    docs.sourceServiceRole,
    'supabase-rls-storage-database-sound-cpu-private-manifest-service-role-boundary-review',
  ),
  sourceStorage: parseJsonBlock(
    docs.sourceStorage,
    'supabase-rls-storage-database-sound-cpu-private-manifest-storage-boundary-review',
  ),
  sourceRetention: parseJsonBlock(
    docs.sourceRetention,
    'supabase-rls-storage-database-sound-cpu-private-manifest-retention-audit-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-plan-result',
  ),
  fields: parseJsonBlock(
    docs.fields,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract',
  ),
  rlsStorage: parseJsonBlock(
    docs.rlsStorage,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-rls-storage-dependency-contract',
  ),
  serviceRole: parseJsonBlock(
    docs.serviceRole,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-service-role-write-contract',
  ),
  retention: parseJsonBlock(
    docs.retention,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-retention-audit-contract',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assertNoOpClassification(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')
assertFalseFields(parsed.sourcePrompt.planningScope, 'sourcePrompt.planningScope', [
  'createMigrationToday',
  'runSqlToday',
  'touchSupabaseEnvironmentToday',
  'createStorageBucketToday',
  'writeDatabaseRowsToday',
  'createStorageObjectsToday',
  'persistManifestToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'openMediaFileToday',
  'unlockBetaToday',
  'unlockProductionToday',
])

assert(parsed.sourceResult.decision === sourceDecision, 'source handoff decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2004, 'source handoff reviewed source PR mismatch')
assert(parsed.sourceResult.handoffReview.manifestPersistenceContractPlanMayProceed === true, 'source handoff permits contract plan')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source handoff sound CPU coverage')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source handoff real execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')
assert(parsed.sourceRls.futureRlsOwnership.workspaceScopedAccessRequired === true, 'source RLS workspace scope')
assert(parsed.sourceServiceRole.serviceRoleBoundary.futureWorkerScopedServiceRoleWriteReviewRequired === true, 'source service role future review')
assert(parsed.sourceStorage.privateStorageBoundary.manifestStoresOpaqueReferencesOnly === true, 'source storage opaque refs')
assert(parsed.sourceRetention.retentionAuditPolicy.futureAuditAppendOnlyRequired === true, 'source retention audit')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2005, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.contractPlan.privateManifestPersistenceContractPlanned === true, 'result contract plan')
assert(parsed.result.contractPlan.sourceFileCreationDeferred === true, 'source file creation must be deferred')
assert(parsed.result.soundCpuTools.covered === 15, 'result sound CPU coverage')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.contractPlan, 'result.contractPlan', [
  'createMigrationToday',
  'runSqlToday',
  'touchSupabaseEnvironmentToday',
  'createStorageBucketToday',
  'writeDatabaseRowsToday',
  'createStorageObjectsToday',
  'persistManifestToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'openMediaFileToday',
  'unlockBetaToday',
  'unlockProductionToday',
])

for (const field of ['schemaVersion', 'approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey']) {
  assert(parsed.fields.requiredFutureFields.includes(field), `missing required field ${field}`)
}
for (const rejected of ['rawPromptText', 'rawMediaPaths', 'signedUrls', 'secretValues', 'publicArtifactUrls']) {
  assert(parsed.fields.rejectedFields.includes(rejected), `missing rejected field ${rejected}`)
}
assertFalseFields(parsed.fields.runtimeDefaults, 'fields.runtimeDefaults', [
  'workerExecutionEnabled',
  'mediaProcessingEnabled',
  'artifactWritesEnabled',
  'signedUrlCreationEnabled',
  'supabaseWritesEnabled',
])

assert(parsed.rlsStorage.futureDatabaseDependencies.workspaceScopedRlsRequired === true, 'RLS dependency workspace')
assert(parsed.rlsStorage.futureDatabaseDependencies.publicManifestReadRejected === true, 'public manifest read rejected')
assert(parsed.rlsStorage.futureStorageDependencies.opaqueStorageReferencesOnly === true, 'opaque storage references')
assertFalseFields(parsed.rlsStorage.currentGateState, 'rlsStorage.currentGateState', [
  'createMigrationToday',
  'runSqlToday',
  'touchSupabaseEnvironmentToday',
  'createStorageBucketToday',
  'writeDatabaseRowsToday',
  'createStorageObjectsToday',
  'persistManifestToday',
  'createSignedUrlToday',
])

assert(parsed.serviceRole.futureWriteContract.narrowWorkerScopedServiceRoleBoundaryRequired === true, 'service role narrow boundary')
assert(parsed.serviceRole.futureWriteContract.broadServiceRoleHandlerRejected === true, 'broad service role rejected')
assertFalseFields(parsed.serviceRole.currentGateState, 'serviceRole.currentGateState', [
  'broadServiceRoleHandlerEnabledToday',
  'serviceRoleSecretCreatedToday',
  'serviceRoleSecretReadToday',
  'routeHandlerEnabledToday',
  'workerDispatchEnabledToday',
  'writeDatabaseRowsToday',
  'persistManifestToday',
])

assert(parsed.retention.futureRetentionAuditContract.appendOnlyAuditRequired === true, 'append-only audit')
assertFalseFields(parsed.retention.futureRetentionAuditContract, 'retention.futureRetentionAuditContract', [
  'retentionPeriodSelectedToday',
  'auditTableCreatedToday',
  'auditRowsWrittenToday',
  'retentionJobEnabledToday',
])
assert(parsed.blockers.blockersBeforePersistence.manifestPersistenceContractOwnerReview === 'required_next', 'owner review required next')
assert(parsed.policy.allowedClaims.privateManifestPersistenceContractPlanned === true, 'policy allows contract plan claim')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assertFalse(value, `policy.blockedClaims.${key}`)

assert(parsed.next.requiredSourceDecision === decision, 'next prompt required source mismatch')
assert(parsed.next.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.reviewScope, 'next.reviewScope', [
  'createSourceFileToday',
  'createMigrationToday',
  'runSqlToday',
  'touchSupabaseEnvironmentToday',
  'createStorageBucketToday',
  'writeDatabaseRowsToday',
  'createStorageObjectsToday',
  'persistManifestToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'openMediaFileToday',
  'unlockBetaToday',
  'unlockProductionToday',
])

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2005,
      sourceHead,
      sourceMergeCommit,
      privateManifestPersistenceContractPlanned: true,
      sourceFileCreatedToday: false,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      supabaseEnvironmentTouched: false,
      sqlExecuted: false,
      migrationDeployed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE94-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-CONTRACT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
