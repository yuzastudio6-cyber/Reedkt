import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase93_caption_render_runtime_hook_private_manifest_persistence_planning_owner_review_passed_with_warnings_ready_for_supabase_rls_storage_database_handoff_no_execution'
const decision =
  'supabase_rls_storage_database_sound_cpu_private_manifest_persistence_handoff_review_passed_with_warnings_ready_for_manifest_persistence_contract_plan_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase94_caption_render_runtime_hook_private_manifest_persistence_contract_plan_completed_with_warnings_ready_for_manifest_persistence_contract_owner_review_no_execution'
const sourceHead = 'f979f264640d0244b901a69251b25accaca05793'
const sourceMergeCommit = 'f758d829dcdad49d3014c253d5b346884c9d1114'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-supabase-rls-storage-database-sound-cpu-private-manifest-persistence-handoff-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-owner-review-result.md',
  sourceHandoffReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-supabase-handoff-readiness-register.md',
  sourceStorageHandoff:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-storage-owner-handoff-map.md',
  supabaseBridge: 'supabase-schema-planning-bridge.md',
  migrationChecklist: 'database-migration-readiness-checklist.md',
  tableSpecification: 'supabase-table-specification.md',
  migrationDraftReview: 'sql-migration-draft-review.md',
  rlsPolicyDraft: 'supabase-rls-policy-draft.md',
  storageBucketDraft: 'supabase-storage-bucket-draft.md',
  result:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-persistence-handoff-review-result.md',
  rls:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-rls-ownership-review.md',
  serviceRole:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-service-role-boundary-review.md',
  storage:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-storage-boundary-review.md',
  retention:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-retention-audit-review.md',
  blockers:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-handoff-blocker-register.md',
  policy:
    'docs/supabase-rls-storage-database-sound-cpu-private-manifest-handoff-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-plan.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parseJsonBlock(file, label) {
  const text = read(file)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, message) {
  assert(value === false, `${message} must be false`)
}

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafeTrueClaims = [
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
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'realUserMediaBetaReadyClaimed',
    'productionReadinessClaimed',
    'unlockBetaToday',
    'unlockProductionToday',
  ]
  for (const key of unsafeTrueClaims) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

function assertNoOpClassification(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertFalseFields(record, label, fields) {
  for (const field of fields) assertFalse(record[field], `${label}.${field}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'supabase-rls-storage-database-sound-cpu-private-manifest-persistence-handoff-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-owner-review-result',
  ),
  sourceHandoffReadiness: parseJsonBlock(
    docs.sourceHandoffReadiness,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-supabase-handoff-readiness-register',
  ),
  sourceStorageHandoff: parseJsonBlock(
    docs.sourceStorageHandoff,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-storage-owner-handoff-map',
  ),
  result: parseJsonBlock(
    docs.result,
    'supabase-rls-storage-database-sound-cpu-private-manifest-persistence-handoff-review-result',
  ),
  rls: parseJsonBlock(
    docs.rls,
    'supabase-rls-storage-database-sound-cpu-private-manifest-rls-ownership-review',
  ),
  serviceRole: parseJsonBlock(
    docs.serviceRole,
    'supabase-rls-storage-database-sound-cpu-private-manifest-service-role-boundary-review',
  ),
  storage: parseJsonBlock(
    docs.storage,
    'supabase-rls-storage-database-sound-cpu-private-manifest-storage-boundary-review',
  ),
  retention: parseJsonBlock(
    docs.retention,
    'supabase-rls-storage-database-sound-cpu-private-manifest-retention-audit-review',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'supabase-rls-storage-database-sound-cpu-private-manifest-handoff-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'supabase-rls-storage-database-sound-cpu-private-manifest-handoff-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

const supabaseDocs = [
  docs.supabaseBridge,
  docs.migrationChecklist,
  docs.tableSpecification,
  docs.migrationDraftReview,
  docs.rlsPolicyDraft,
  docs.storageBucketDraft,
]
for (const file of supabaseDocs) {
  const text = read(file).toLowerCase()
  assert(text.includes('supabase') || text.includes('rls') || text.includes('storage'), `${file} must be Supabase related`)
}
assert(read(docs.migrationDraftReview).includes('database/migration-drafts'), 'migration draft review must keep drafts out of live migrations')
assert(read(docs.rlsPolicyDraft).toLowerCase().includes('service role'), 'RLS policy draft must discuss service role boundaries')
assert(read(docs.storageBucketDraft).toLowerCase().includes('private'), 'storage bucket draft must preserve private storage defaults')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt required decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assertNoOpClassification(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')
assertFalseFields(parsed.sourcePrompt.reviewScope, 'sourcePrompt.reviewScope', [
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

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2003, 'source result upstream PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === '7cbec87dc383c69c55bae819fa064cc3efcb3d32', 'source result upstream head mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'f49ae022f02f5ae7c4d7e4a25d13117068fbd9f9', 'source result upstream merge mismatch')
assert(parsed.sourceResult.ownerReview.supabaseRlsStorageDatabaseHandoffMayProceed === true, 'source handoff may proceed')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source sound CPU tool coverage')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution remains closed')

assert(parsed.sourceHandoffReadiness.handoffReadiness.SUPABASE_RLS_STORAGE_DATABASE === 'ready_for_no_execution_handoff_review', 'source handoff readiness')
assert(parsed.sourceStorageHandoff.ownerHandoffs.SUPABASE_RLS_STORAGE_DATABASE.requiredBeforePersistence === true, 'source storage handoff required')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2004, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.handoffReview.manifestPersistenceContractPlanMayProceed === true, 'contract plan may proceed')
assert(parsed.result.soundCpuTools.covered === 15, 'result sound CPU tool coverage')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution remains closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.handoffReview, 'result.handoffReview', [
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

assert(parsed.rls.futureRlsOwnership.workspaceScopedAccessRequired === true, 'RLS workspace scope')
assert(parsed.rls.futureRlsOwnership.projectScopedAccessRequired === true, 'RLS project scope')
assert(parsed.rls.futureRlsOwnership.userDirectWorkerTableWritesRejected === true, 'RLS direct writes rejected')
assertFalseFields(parsed.rls.currentGateState, 'rls.currentGateState', [
  'createMigrationToday',
  'runSqlToday',
  'touchSupabaseEnvironmentToday',
  'writeDatabaseRowsToday',
  'persistManifestToday',
  'unlockBetaToday',
  'unlockProductionToday',
])

assert(parsed.serviceRole.serviceRoleBoundary.futureWorkerScopedServiceRoleWriteReviewRequired === true, 'service role future review')
assertFalseFields(parsed.serviceRole.serviceRoleBoundary, 'serviceRole.serviceRoleBoundary', [
  'broadServiceRoleHandlerEnabledToday',
  'serviceRoleSecretCreatedToday',
  'serviceRoleSecretReadToday',
  'routeHandlerEnabledToday',
  'workerDispatchEnabledToday',
])
assert(parsed.storage.privateStorageBoundary.manifestStoresOpaqueReferencesOnly === true, 'storage opaque refs')
assert(parsed.storage.privateStorageBoundary.signedUrlsRejectedAsSourceOfTruth === true, 'storage signed URLs rejected')
assertFalseFields(parsed.storage.privateStorageBoundary, 'storage.privateStorageBoundary', [
  'createStorageBucketToday',
  'createStorageObjectsToday',
  'createSignedUrlToday',
  'createPublicArtifactToday',
  'openMediaFileToday',
  'storageTransferToday',
])
assert(parsed.retention.retentionAuditPolicy.futureAuditAppendOnlyRequired === true, 'retention audit append-only')
assertFalseFields(parsed.retention.retentionAuditPolicy, 'retention.retentionAuditPolicy', [
  'retentionPeriodSelectedToday',
  'auditTableCreatedToday',
  'auditRowsWrittenToday',
  'retentionJobEnabledToday',
])
assert(parsed.blockers.blockersBeforeManifestPersistence.manifestPersistenceContractPlan === 'required_next', 'blockers require next contract plan')
assert(parsed.policy.allowedClaims.manifestPersistenceContractPlanMayProceed === true, 'policy allows contract handoff')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assertFalse(value, `policy.blockedClaims.${key}`)

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source decision mismatch')
assert(parsed.next.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.planningScope, 'next.planningScope', [
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
      sourcePr: 2004,
      sourceHead,
      sourceMergeCommit,
      manifestPersistenceContractPlanMayProceed: true,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      supabaseEnvironmentTouched: false,
      sqlExecuted: false,
      migrationDeployed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE94-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-CONTRACT-PLAN',
    },
    null,
    2,
  ),
)
