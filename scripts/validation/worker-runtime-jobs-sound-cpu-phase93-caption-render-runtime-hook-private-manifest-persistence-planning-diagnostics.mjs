import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase92_caption_render_runtime_hook_controlled_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_planning_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase93_caption_render_runtime_hook_private_manifest_persistence_planning_completed_with_warnings_ready_for_private_manifest_persistence_planning_owner_review_no_execution'
const sourceMergeCommit = '767dc07897254cd8a68065253c2b3e7d98447067'
const sourceHead = '9e25cbeb9e2ce076043829db9e001b651332b07c'
const sourceResultHead = 'c13219c9933d3d826f674b60c8ae432e910334f3'
const sourceResultMergeCommit = '7ee7c1edf4068f3b07b070e70c8e68e1333f015a'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE93-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-PLANNING-OWNER-REVIEW'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-review-result.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-private-manifest-persistence-planning-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-result.md',
  fields:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-allowed-persisted-fields-plan.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-boundary-plan.md',
  privacy:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-privacy-retention-defaults-plan.md',
  audit:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-fields-plan.md',
  handoff:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-storage-owner-handoff-map.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-owner-review.md',
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
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-controlled-manifest-instance-creation-owner-review-result',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase92-caption-render-runtime-hook-private-manifest-persistence-planning-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-result',
  ),
  fields: parseJsonBlock(
    docs.fields,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-allowed-persisted-fields-plan',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-boundary-plan',
  ),
  privacy: parseJsonBlock(
    docs.privacy,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-privacy-retention-defaults-plan',
  ),
  audit: parseJsonBlock(
    docs.audit,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-idempotency-audit-fields-plan',
  ),
  handoff: parseJsonBlock(
    docs.handoff,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-storage-owner-handoff-map',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-persistence-planning-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt source decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assert(parsed.sourcePrompt.planningScope.planPrivateManifestPersistenceBoundary === true, 'source prompt boundary planning')
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
  assertFalse(parsed.sourcePrompt.planningScope[key], `sourcePrompt.planningScope.${key}`)
}

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 1999, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceHead === sourceResultHead, 'source result source head mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === sourceResultMergeCommit, 'source result source merge mismatch')
assert(parsed.sourceResult.ownerReview.privateManifestPersistencePlanningMayProceed === true, 'source result planning')
assertFalse(parsed.sourceResult.ownerReview.persistManifestToday, 'source result persist')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tool count')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution count')
assert(parsed.sourceReadiness.readinessForNextPlanningGate.privateManifestPersistencePlanningMayProceed === true, 'source readiness')
assert(parsed.sourceReadiness.stillBlockedBeforeRealExecution.actualManifestPersistence === true, 'actual persistence still blocked')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2000, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.planningResult.privateManifestPersistenceBoundaryPlanned === true, 'result boundary')
assert(parsed.result.planningResult.allowedPersistedFieldsPlanned === true, 'result fields')
assert(parsed.result.planningResult.privacyRetentionDefaultsPlanned === true, 'result privacy')
assert(parsed.result.planningResult.idempotencyAndAuditFieldsPlanned === true, 'result audit')
for (const key of [
  'storageBackendSelectedToday',
  'manifestPersistedToday',
  'databaseRowsWrittenToday',
  'storageObjectsCreatedToday',
  'mediaOpenedToday',
  'artifactCreatedToday',
  'signedUrlCreatedToday',
  'workerDispatchedToday',
  'supabaseSqlTouchedToday',
]) {
  assertFalse(parsed.result.planningResult[key], `result.planningResult.${key}`)
}
assert(parsed.result.soundCpuTools.covered === 15, 'result tool count')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution count')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt')

const requiredFields = [
  'schemaVersion',
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'jobType',
  'privateMediaAssetIds',
  'plannedPrivateArtifactIds',
  'runtimeDefaults',
]
for (const field of requiredFields) {
  assert(parsed.fields.allowedFutureManifestFields.includes(field), `missing allowed field ${field}`)
}
assert(parsed.fields.allowedFutureManifestFields.length === requiredFields.length, 'unexpected allowed field count')
assert(parsed.fields.fieldPolicies.signedUrls === 'rejected', 'signed URL rejection')
assert(parsed.fields.fieldPolicies.serviceRolePayloads === 'rejected', 'service role rejection')
assert(parsed.boundary.futureBoundary.supabaseSchemaMigrationDeferred === true, 'boundary migration deferred')
assert(parsed.boundary.futureBoundary.serviceRoleWriteReviewRequired === true, 'boundary service role review')
assertAllFalse(parsed.boundary.currentGateState, 'boundary.currentGateState')
assert(parsed.privacy.privacyDefaults.privateByDefault === true, 'privacy private default')
assertFalse(parsed.privacy.privacyDefaults.signedUrlCreationDefault, 'privacy signed URLs')
assert(parsed.privacy.retentionDefaults.noRetentionPeriodSelectedToday === true, 'retention not selected')
assert(parsed.audit.requiredFutureIdempotencyFields.includes('idempotencyKey'), 'audit idempotency')
assert(parsed.audit.auditPolicy.auditEventAppendOnly === true, 'audit append-only')
assert(parsed.audit.auditPolicy.auditWriteImplementationDeferred === true, 'audit write deferred')
assert(parsed.handoff.ownerHandoffs.SUPABASE_RLS_STORAGE_DATABASE.requiredBeforePersistence === true, 'handoff supabase owner')
assert(parsed.handoff.currentGateState.supabaseEnvironmentTouched === false, 'handoff supabase untouched')
assertAllFalse(parsed.handoff.currentGateState, 'handoff.currentGateState')
assert(parsed.blockers.remainingBlockersBeforeExternalAgentExecution.privateManifestPersistencePlanningOwnerReview === 'required_next', 'blocker next')
assert(parsed.policy.allowedClaims.privateManifestPersistenceBoundaryPlanned === true, 'policy boundary claim')
assertAllFalse(parsed.policy.blockedClaims, 'policy.blockedClaims')
assert(parsed.next.requiredSourceDecision === decision, 'next source decision')
assert(parsed.next.reviewScope.reviewPersistenceBoundaryPlan === true, 'next review boundary')
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
  assertFalse(parsed.next.reviewScope[key], `next.reviewScope.${key}`)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceMergeCommit,
      reviewedSourcePr: parsed.result.sourceVerification.sourcePr,
      privateManifestPersistenceBoundaryPlanned: true,
      persistManifestToday: false,
      storageBackendSelectedToday: false,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      executionApprovalsToday: 'none',
      nextPrompt,
    },
    null,
    2,
  ),
)
