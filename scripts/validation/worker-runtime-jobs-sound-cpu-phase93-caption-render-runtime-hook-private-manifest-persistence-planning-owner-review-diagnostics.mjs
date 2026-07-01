import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase93_caption_render_runtime_hook_private_manifest_persistence_planning_completed_with_warnings_ready_for_private_manifest_persistence_planning_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase93_caption_render_runtime_hook_private_manifest_persistence_planning_owner_review_passed_with_warnings_ready_for_supabase_rls_storage_database_handoff_no_execution'
const sourceMergeCommit = 'f49ae022f02f5ae7c4d7e4a25d13117068fbd9f9'
const sourceHead = '7cbec87dc383c69c55bae819fa064cc3efcb3d32'
const nextPrompt = 'SUPABASE-RLS-STORAGE-DATABASE-SOUND-CPU-PRIVATE-MANIFEST-PERSISTENCE-HANDOFF-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-result.md',
  sourceFields:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-allowed-persisted-fields-plan.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-boundary-plan.md',
  sourcePrivacy:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-privacy-retention-defaults-plan.md',
  sourceAudit:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-fields-plan.md',
  sourceHandoff:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-storage-owner-handoff-map.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-owner-acceptance-register.md',
  fieldsReview:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-persisted-fields-owner-review-register.md',
  privacyReview:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-privacy-retention-owner-review-register.md',
  auditReview:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-owner-review-register.md',
  handoffReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-supabase-handoff-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-supabase-rls-storage-database-sound-cpu-private-manifest-persistence-handoff-review.md',
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
  assert(value === false, message)
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record)) assertFalse(value, `${label}.${key} must be false`)
}

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'persistManifestToday": ' + 'true',
    'selectStorageBackendToday": ' + 'true',
    'writeDatabaseRowsToday": ' + 'true',
    'createStorageObjectsToday": ' + 'true',
    'manifestPersistedToday": ' + 'true',
    'databaseRowsWrittenToday": ' + 'true',
    'storageObjectsCreatedToday": ' + 'true',
    'createMigrationToday": ' + 'true',
    'runSqlToday": ' + 'true',
    'touchSupabaseEnvironmentToday": ' + 'true',
    'createStorageBucketToday": ' + 'true',
    'useRealMediaBytesToday": ' + 'true',
    'openMediaFileToday": ' + 'true',
    'createArtifactToday": ' + 'true',
    'createSignedUrlToday": ' + 'true',
    'dispatchWorkerToday": ' + 'true',
    'callRouteToolProviderToday": ' + 'true',
    'touchSupabaseSqlToday": ' + 'true',
    'unlockBetaToday": ' + 'true',
    'unlockProductionToday": ' + 'true',
    'generatedLocalFixturePassedClaimed": ' + 'true',
    'dryRunPassedClaimed": ' + 'true',
    'runtimeReadinessClaimed": ' + 'true',
    'workerReadinessClaimed": ' + 'true',
    'realUserMediaBetaReadyClaimed": ' + 'true',
    'productionReadinessClaimed": ' + 'true',
  ]
  for (const phrase of unsafe) assert(!text.includes(phrase), `${file} contains unsafe claim ${phrase}`)
}

const parsed = {
  sourcePrompt: parseJsonBlock(
    docs.sourcePrompt,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-result',
  ),
  sourceFields: parseJsonBlock(
    docs.sourceFields,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-allowed-persisted-fields-plan',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-boundary-plan',
  ),
  sourcePrivacy: parseJsonBlock(
    docs.sourcePrivacy,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-privacy-retention-defaults-plan',
  ),
  sourceAudit: parseJsonBlock(
    docs.sourceAudit,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-fields-plan',
  ),
  sourceHandoff: parseJsonBlock(
    docs.sourceHandoff,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-storage-owner-handoff-map',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-owner-acceptance-register',
  ),
  fieldsReview: parseJsonBlock(
    docs.fieldsReview,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-persisted-fields-owner-review-register',
  ),
  privacyReview: parseJsonBlock(
    docs.privacyReview,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-privacy-retention-owner-review-register',
  ),
  auditReview: parseJsonBlock(
    docs.auditReview,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-owner-review-register',
  ),
  handoffReadiness: parseJsonBlock(
    docs.handoffReadiness,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-supabase-handoff-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'supabase-rls-storage-database-sound-cpu-private-manifest-persistence-handoff-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.reviewScope.acceptForPersistenceOwnerHandoffOnly === true, 'source prompt handoff only')
for (const key of [
  'persistManifestToday',
  'selectStorageBackendToday',
  'writeDatabaseRowsToday',
  'createStorageObjectsToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.sourcePrompt.reviewScope[key], `sourcePrompt.reviewScope.${key}`)
}

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2000, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === '9e25cbeb9e2ce076043829db9e001b651332b07c', 'source result source head mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '767dc07897254cd8a68065253c2b3e7d98447067', 'source result source merge mismatch')
assert(parsed.sourceResult.planningResult.privateManifestPersistenceBoundaryPlanned === true, 'source result boundary')
assertFalse(parsed.sourceResult.planningResult.storageBackendSelectedToday, 'source storage selected')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution')

assert(parsed.sourceFields.fieldPolicies.signedUrls === 'rejected', 'source fields signed URL rejected')
assert(parsed.sourceBoundary.futureBoundary.serviceRoleWriteReviewRequired === true, 'source boundary service role')
assertAllFalse(parsed.sourceBoundary.currentGateState, 'sourceBoundary.currentGateState')
assertFalse(parsed.sourcePrivacy.privacyDefaults.signedUrlCreationDefault, 'source privacy signed URL')
assert(parsed.sourceAudit.auditPolicy.auditWriteImplementationDeferred === true, 'source audit deferred')
assert(parsed.sourceHandoff.ownerHandoffs.SUPABASE_RLS_STORAGE_DATABASE.requiredBeforePersistence === true, 'source handoff')
assertAllFalse(parsed.sourceHandoff.currentGateState, 'sourceHandoff.currentGateState')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2003, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.ownerReview.supabaseRlsStorageDatabaseHandoffMayProceed === true, 'result handoff')
for (const key of [
  'persistManifestToday',
  'selectStorageBackendToday',
  'writeDatabaseRowsToday',
  'createStorageObjectsToday',
  'useRealMediaBytesToday',
  'openMediaFileToday',
  'createArtifactToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'callRouteToolProviderToday',
  'touchSupabaseSqlToday',
  'unlockBetaToday',
  'unlockProductionToday',
]) {
  assertFalse(parsed.result.ownerReview[key], `result.ownerReview.${key}`)
}
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt')

assert(parsed.acceptance.acceptedForNextGateOnly.supabaseRlsStorageDatabaseHandoffMayProceed === true, 'acceptance handoff')
assertFalse(parsed.acceptance.acceptedForNextGateOnly.actualManifestPersistenceMayProceed, 'acceptance persistence')
assert(parsed.fieldsReview.acceptedFutureManifestFields.includes('runtimeDefaults'), 'fields runtime defaults')
assert(parsed.fieldsReview.rejectedFutureManifestFields.includes('signedUrls'), 'fields signed URLs rejected')
assertFalse(parsed.privacyReview.acceptedRetentionPlanning.retentionPeriodSelectedToday, 'privacy retention today')
assert(parsed.auditReview.auditPoliciesAccepted.auditWriteImplementationDeferred === true, 'audit deferred')
assert(parsed.handoffReadiness.handoffReadiness.SUPABASE_RLS_STORAGE_DATABASE === 'ready_for_no_execution_handoff_review', 'handoff readiness')
assertAllFalse(parsed.handoffReadiness.currentGateState, 'handoffReadiness.currentGateState')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentExecution.supabaseRlsStorageDatabaseHandoffReview === 'required_next', 'blockers next')
assert(parsed.policy.allowedClaims.supabaseRlsStorageDatabaseHandoffMayProceed === true, 'policy handoff')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assert(parsed.next.requiredSourceDecision === decision, 'next source decision')
assert(parsed.next.reviewScope.reviewRlsStorageDatabaseOwnership === true, 'next rls review')
for (const key of [
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
]) {
  assertFalse(parsed.next.reviewScope[key], `next.reviewScope.${key}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      reviewedSourcePr: parsed.result.sourceVerification.sourcePr,
      supabaseRlsStorageDatabaseHandoffMayProceed: true,
      persistManifestToday: false,
      touchSupabaseSqlToday: false,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      executionApprovalsToday: 'none',
      nextPrompt,
    },
    null,
    2,
  ),
)
