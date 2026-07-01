import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase94_caption_render_runtime_hook_private_manifest_persistence_contract_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_source_creation_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase95_caption_render_runtime_hook_private_manifest_persistence_source_creation_plan_completed_with_warnings_ready_for_private_manifest_persistence_source_owner_review_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase95_caption_render_runtime_hook_private_manifest_persistence_source_owner_review_passed_with_warnings_ready_for_actual_private_manifest_persistence_source_creation_no_execution'
const sourceHead = 'ff6ea80b75ae352085c5ae3aed664b32cc5b6558'
const sourceMergeCommit = 'aa986cc56a6c40dc1a88e4caf7f4a6b639d9395c'
const plannedSourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'
const existingManifestSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-acceptance-register.md',
  sourceFields:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract-owner-review-register.md',
  sourceServiceRole:
    'docs/worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-service-role-contract-owner-review-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-plan-result.md',
  pathPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-path-plan.md',
  typePlan:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-contract-types-plan.md',
  adapterPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-no-execution-adapter-boundary-plan.md',
  integrationPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-boundary-plan.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-review.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function exists(file) {
  return fs.existsSync(path.join(process.cwd(), file))
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
    'runtimeSourceModifiedToday',
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
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-persistence-contract-owner-acceptance-register',
  ),
  sourceFields: parseJsonBlock(
    docs.sourceFields,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-field-contract-owner-review-register',
  ),
  sourceServiceRole: parseJsonBlock(
    docs.sourceServiceRole,
    'worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-service-role-contract-owner-review-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-plan-result',
  ),
  pathPlan: parseJsonBlock(
    docs.pathPlan,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-path-plan',
  ),
  typePlan: parseJsonBlock(
    docs.typePlan,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-contract-types-plan',
  ),
  adapterPlan: parseJsonBlock(
    docs.adapterPlan,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-no-execution-adapter-boundary-plan',
  ),
  integrationPlan: parseJsonBlock(
    docs.integrationPlan,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-boundary-plan',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)
assert(exists(existingManifestSourcePath), 'existing privateManifest.ts source context must exist')
assert(!exists(plannedSourcePath), `${plannedSourcePath} must not exist in the source-creation planning gate`)
assert(read(existingManifestSourcePath).includes('SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS'), 'existing manifest source context missing runtime defaults')
assert(read('server/workers/sound-cpu/runtime/soundCpuSupabaseGuards.ts').includes('assertSoundCpuSupabaseMutationBlocked'), 'Supabase guard source must remain available')

assert(parsed.sourcePrompt.requiredSourceDecision === sourceDecision, 'source prompt required decision mismatch')
assert(parsed.sourcePrompt.expectedDecision === decision, 'source prompt expected decision mismatch')
assertNoOpClassification(parsed.sourcePrompt.supabaseClassification, 'sourcePrompt.supabaseClassification')
assertFalseFields(parsed.sourcePrompt.planningScope, 'sourcePrompt.planningScope', [
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

assert(parsed.sourceResult.decision === sourceDecision, 'source owner-review decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2007, 'source owner-review source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'd1e3c862f82e527a3f355d39497ef9793bafc85e', 'source owner-review previous merge mismatch')
assert(parsed.sourceResult.ownerReview.privateManifestPersistenceSourceCreationPlanMayProceed === true, 'source plan may proceed')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools covered')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')
assertFalse(parsed.sourceAcceptance.acceptedForNextGateOnly.acceptedForSourceCreationToday, 'source acceptance source creation today')
assert(parsed.sourceFields.fieldContractReview.signedUrlsRejected === true, 'source signed URLs rejected')
assert(parsed.sourceServiceRole.serviceRoleContractReview.broadServiceRoleHandlerRejected === true, 'source broad service role rejected')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2008, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceCreationPlan.plannedSourcePath === plannedSourcePath, 'planned source path mismatch')
assert(parsed.result.sourceCreationPlan.existingManifestSourceContext === existingManifestSourcePath, 'existing source context mismatch')
assert(parsed.result.sourceCreationPlan.privateManifestPersistenceSourceFilePlanned === true, 'source file planned')
assert(parsed.result.sourceCreationPlan.sourceFileCreatedToday === false, 'source file must not be created today')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.sourceCreationPlan, 'result.sourceCreationPlan', [
  'sourceFileCreatedToday',
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

assert(parsed.pathPlan.plannedSourcePath === plannedSourcePath, 'path plan source path')
assertFalse(parsed.pathPlan.sourcePathPolicy.modifyExistingPrivateManifestSourceToday, 'path plan modify privateManifest today')
assertFalse(parsed.pathPlan.sourcePathPolicy.sourceFileCreatedToday, 'path plan source file today')
assert(parsed.typePlan.futureTypeExports.includes('SoundCpuPrivateManifestPersistenceContract'), 'type plan contract export')
assert(parsed.typePlan.rejectedInputFields.includes('signedUrls'), 'type plan signed URLs rejected')
assertFalseFields(parsed.typePlan.runtimeDefaultsMustRemainFalse, 'typePlan.runtimeDefaultsMustRemainFalse', [
  'workerExecutionEnabled',
  'mediaProcessingEnabled',
  'artifactWritesEnabled',
  'signedUrlCreationEnabled',
  'supabaseWritesEnabled',
])
assert(parsed.adapterPlan.futureAdapterBoundary.returnBlockedStatusOnly === true, 'adapter return blocked status')
assertFalseFields(parsed.adapterPlan.currentGateState, 'adapterPlan.currentGateState', [
  'sourceFileCreatedToday',
  'createMigrationToday',
  'runSqlToday',
  'touchSupabaseEnvironmentToday',
  'writeDatabaseRowsToday',
  'createStorageObjectsToday',
  'persistManifestToday',
  'dispatchWorkerToday',
  'openMediaFileToday',
])
assert(parsed.integrationPlan.futureImportsRejected.includes('supabase_client_instance'), 'integration rejects Supabase client')
assertFalse(parsed.integrationPlan.currentGateState.runtimeSourceModifiedToday, 'integration runtime source modified today')
assert(parsed.blockers.blockersBeforeSourceCreation.privateManifestPersistenceSourceOwnerReview === 'required_next', 'owner review required next')
assert(parsed.policy.allowedClaims.privateManifestPersistenceSourceOwnerReviewMayProceed === true, 'policy owner review may proceed')
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
      sourcePr: 2008,
      sourceHead,
      sourceMergeCommit,
      plannedSourcePath,
      plannedSourcePathExistsToday: false,
      existingManifestSourceContext: existingManifestSourcePath,
      sourceFileCreatedToday: false,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      supabaseEnvironmentTouched: false,
      sqlExecuted: false,
      migrationDeployed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE95-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
