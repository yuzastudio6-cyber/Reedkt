import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase94_caption_render_runtime_hook_private_manifest_persistence_contract_plan_completed_with_warnings_ready_for_manifest_persistence_contract_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase94_caption_render_runtime_hook_private_manifest_persistence_contract_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_source_creation_plan_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase95_caption_render_runtime_hook_private_manifest_persistence_source_creation_plan_completed_with_warnings_ready_for_private_manifest_persistence_source_owner_review_no_execution'
const sourceHead = '0b297ec6f889ee360e1e2eec3061ab452b5b0e12'
const sourceMergeCommit = 'd1e3c862f82e527a3f355d39497ef9793bafc85e'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-plan-result.md',
  sourceFields:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract.md',
  sourceRlsStorage:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-rls-storage-dependency-contract.md',
  sourceServiceRole:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-service-role-write-contract.md',
  sourceRetention:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-retention-audit-contract.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-acceptance-register.md',
  fields:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract-owner-review-register.md',
  rlsStorage:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-rls-storage-contract-owner-review-register.md',
  serviceRole:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-service-role-contract-owner-review-register.md',
  retention:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-retention-audit-contract-owner-review-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-plan.md',
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
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-plan-result',
  ),
  sourceFields: parseJsonBlock(
    docs.sourceFields,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract',
  ),
  sourceRlsStorage: parseJsonBlock(
    docs.sourceRlsStorage,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-rls-storage-dependency-contract',
  ),
  sourceServiceRole: parseJsonBlock(
    docs.sourceServiceRole,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-service-role-write-contract',
  ),
  sourceRetention: parseJsonBlock(
    docs.sourceRetention,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-retention-audit-contract',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-acceptance-register',
  ),
  fields: parseJsonBlock(
    docs.fields,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract-owner-review-register',
  ),
  rlsStorage: parseJsonBlock(
    docs.rlsStorage,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-rls-storage-contract-owner-review-register',
  ),
  serviceRole: parseJsonBlock(
    docs.serviceRole,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-service-role-contract-owner-review-register',
  ),
  retention: parseJsonBlock(
    docs.retention,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-retention-audit-contract-owner-review-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt required decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assertNoOpClassification(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')
assertFalseFields(parsed.sourcePrompt.reviewScope, 'sourcePrompt.reviewScope', [
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

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2005, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === '59b264e06767f219c6c3a17c8c1e5a30d0406021', 'source result previous head mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '9e7462d3356151152cc75e24bd2a6f32e7c83663', 'source result previous merge mismatch')
assert(parsed.sourceResult.contractPlan.privateManifestPersistenceContractPlanned === true, 'source contract planned')
assert(parsed.sourceResult.contractPlan.sourceFileCreationDeferred === true, 'source file creation deferred')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools covered')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')
assert(parsed.sourceFields.rejectedFields.includes('signedUrls'), 'source signed URLs rejected')
assert(parsed.sourceRlsStorage.futureDatabaseDependencies.publicManifestReadRejected === true, 'source public manifest read rejected')
assert(parsed.sourceServiceRole.futureWriteContract.broadServiceRoleHandlerRejected === true, 'source broad service role rejected')
assert(parsed.sourceRetention.futureRetentionAuditContract.appendOnlyAuditRequired === true, 'source append audit')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2007, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.ownerReview.privateManifestPersistenceSourceCreationPlanMayProceed === true, 'source plan may proceed')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
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

assert(parsed.acceptance.acceptedForNextGateOnly.privateManifestPersistenceContractAccepted === true, 'acceptance contract')
assertFalse(parsed.acceptance.acceptedForNextGateOnly.acceptedForSourceCreationToday, 'acceptance source today')
assertFalse(parsed.acceptance.acceptedForNextGateOnly.acceptedForPersistenceToday, 'acceptance persistence today')
assert(parsed.fields.fieldContractReview.requiredFutureFieldsAccepted === true, 'fields accepted')
assert(parsed.fields.fieldContractReview.signedUrlsRejected === true, 'fields signed URLs rejected')
assert(parsed.rlsStorage.rlsStorageContractReview.workspaceScopedRlsAccepted === true, 'RLS accepted')
assert(parsed.rlsStorage.rlsStorageContractReview.signedUrlsRejectedAsSourceOfTruth === true, 'RLS signed URLs rejected')
assert(parsed.serviceRole.serviceRoleContractReview.broadServiceRoleHandlerRejected === true, 'service role broad rejected')
assert(parsed.retention.retentionAuditContractReview.appendOnlyAuditAccepted === true, 'retention audit accepted')
assert(parsed.blockers.blockersBeforeExecution.privateManifestPersistenceSourceCreationPlan === 'required_next', 'next blocker mismatch')
assert(parsed.policy.allowedClaims.privateManifestPersistenceSourceCreationPlanMayProceed === true, 'policy source plan')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assertFalse(value, `policy.blockedClaims.${key}`)

assert(parsed.next.requiredSourceDecision === decision, 'next prompt required source mismatch')
assert(parsed.next.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.planningScope, 'next.planningScope', [
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
      sourcePr: 2007,
      sourceHead,
      sourceMergeCommit,
      privateManifestPersistenceSourceCreationPlanMayProceed: true,
      sourceFileCreatedToday: false,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      supabaseEnvironmentTouched: false,
      sqlExecuted: false,
      migrationDeployed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE95-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-SOURCE-CREATION-PLAN',
    },
    null,
    2,
  ),
)
