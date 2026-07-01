import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase95_caption_render_runtime_hook_private_manifest_persistence_source_creation_plan_completed_with_warnings_ready_for_private_manifest_persistence_source_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase95_caption_render_runtime_hook_private_manifest_persistence_source_owner_review_passed_with_warnings_ready_for_actual_private_manifest_persistence_source_creation_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_actual_private_manifest_persistence_source_created_with_warnings_ready_for_private_manifest_persistence_source_static_validation_no_execution'
const sourceHead = 'ef60737a029f099ea52390d2b00dc458e24ad6ba'
const sourceMergeCommit = '0c353d43847b7d9a731b490f480d9514a939ca82'
const plannedSourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'
const existingManifestSourcePath = 'server/workers/sound-cpu/runtime/privateManifest.ts'
const supabaseGuardPath = 'server/workers/sound-cpu/runtime/soundCpuSupabaseGuards.ts'
const jobContractsPath = 'server/workers/sound-cpu/runtime/soundCpuJobContracts.ts'
const laterPhase96ResultPath =
  'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-creation-result.md'

const docs = {
  sourcePrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-plan-result.md',
  sourcePathPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-path-plan.md',
  sourceTypesPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-contract-types-plan.md',
  sourceAdapterPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-no-execution-adapter-boundary-plan.md',
  sourceIntegrationPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-boundary-plan.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-review-result.md',
  pathReview:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-path-owner-review-register.md',
  typeReview:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-types-owner-review-register.md',
  adapterReview:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-no-execution-adapter-owner-review-register.md',
  integrationReview:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-owner-review-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-actual-private-manifest-persistence-source-creation.md',
}

function filePath(file) {
  return path.join(process.cwd(), file)
}

function read(file) {
  const full = filePath(file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function exists(file) {
  return fs.existsSync(filePath(file))
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

function assertNoUnsafeClaims(file) {
  const text = read(file)
  const unsafe = [
    'createSourceFileToday',
    'sourceFileCreatedToday',
    'runtimeSourceModifiedToday',
    'createMigrationToday',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'supabaseEnvironmentTouched',
    'createStorageBucketToday',
    'writeDatabaseRowsToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'createPublicArtifactToday',
    'dispatchWorkerToday',
    'openMediaFileToday',
    'workerDispatchEnabledToday',
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
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-plan-result',
  ),
  sourcePathPlan: parseJsonBlock(
    docs.sourcePathPlan,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-path-plan',
  ),
  sourceTypesPlan: parseJsonBlock(
    docs.sourceTypesPlan,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-contract-types-plan',
  ),
  sourceAdapterPlan: parseJsonBlock(
    docs.sourceAdapterPlan,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-no-execution-adapter-boundary-plan',
  ),
  sourceIntegrationPlan: parseJsonBlock(
    docs.sourceIntegrationPlan,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-boundary-plan',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-creation-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-review-result',
  ),
  pathReview: parseJsonBlock(
    docs.pathReview,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-path-owner-review-register',
  ),
  typeReview: parseJsonBlock(
    docs.typeReview,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-static-types-owner-review-register',
  ),
  adapterReview: parseJsonBlock(
    docs.adapterReview,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-no-execution-adapter-owner-review-register',
  ),
  integrationReview: parseJsonBlock(
    docs.integrationReview,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-owner-review-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-actual-private-manifest-persistence-source-creation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeClaims(file)

assert(exists(existingManifestSourcePath), 'existing privateManifest.ts source context must exist')
assert(exists(supabaseGuardPath), 'Supabase guard source context must exist')
assert(exists(jobContractsPath), 'job contract source context must exist')
const sourceCreatedInLaterApprovedGate = exists(laterPhase96ResultPath)
if (sourceCreatedInLaterApprovedGate) {
  assert(exists(plannedSourcePath), `${plannedSourcePath} must exist after the approved Phase 96 source-creation gate`)
} else {
  assert(!exists(plannedSourcePath), `${plannedSourcePath} must not exist before Phase 96`)
}
assert(read(existingManifestSourcePath).includes('SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS'), 'manifest defaults missing')
assert(read(supabaseGuardPath).includes('assertSoundCpuSupabaseMutationBlocked'), 'Supabase mutation guard missing')
assert(read(jobContractsPath).includes('sound.package_import_smoke'), 'job contract context missing SOUND CPU job type')

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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2008, 'source result source PR mismatch')
assert(parsed.sourceResult.sourceCreationPlan.plannedSourcePath === plannedSourcePath, 'source result planned path mismatch')
assert(parsed.sourceResult.sourceCreationPlan.sourceFileCreatedToday === false, 'source result source file must not exist')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tools covered')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourcePathPlan.plannedSourcePath === plannedSourcePath, 'source path plan mismatch')
assert(parsed.sourcePathPlan.sourcePathPolicy.sourceFileCreatedToday === false, 'source path plan created today')
assert(parsed.sourcePathPlan.sourcePathPolicy.publicApiChangedToday === false, 'source path public API')
assert(parsed.sourceTypesPlan.futureTypeExports.includes('SoundCpuPrivateManifestPersistenceContract'), 'source type plan missing contract')
assert(parsed.sourceTypesPlan.rejectedInputFields.includes('signedUrls'), 'source type plan signed URLs rejected')
assert(parsed.sourceAdapterPlan.futureAdapterBoundary.returnBlockedStatusOnly === true, 'source adapter blocked result')
assert(parsed.sourceIntegrationPlan.futureImportsRejected.includes('supabase_client_instance'), 'source integration rejects Supabase client')
assert(parsed.sourceBlockers.blockersBeforeSourceCreation.privateManifestPersistenceSourceOwnerReview === 'required_next', 'source blocker mismatch')
assert(parsed.sourcePolicy.allowedClaims.privateManifestPersistenceSourceOwnerReviewMayProceed === true, 'source policy owner review may proceed')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2010, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.plannedSourcePathAccepted === true, 'result path accepted')
assert(parsed.result.ownerReview.staticContractTypesAccepted === true, 'result types accepted')
assert(parsed.result.ownerReview.noExecutionPersistenceAdapterBoundaryAccepted === true, 'result adapter accepted')
assert(parsed.result.ownerReview.sourceIntegrationBoundaryAccepted === true, 'result integration accepted')
assert(parsed.result.ownerReview.actualPrivateManifestPersistenceSourceCreationMayProceed === true, 'result source creation may proceed')
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

assert(parsed.pathReview.sourcePathReview.plannedSourcePath === plannedSourcePath, 'path review planned path')
assert(parsed.pathReview.sourcePathReview.plannedSourcePathAccepted === true, 'path review accepted')
assert(parsed.pathReview.sourcePathReview.plannedSourcePathExistsToday === false, 'path review exists today')
assert(parsed.pathReview.sourcePathReview.sourceFileCreatedToday === false, 'path review source file today')
assert(parsed.typeReview.acceptedFutureTypeExports.includes('SoundCpuPrivateManifestPersistenceResult'), 'type review result export')
assert(parsed.typeReview.rejectedInputFields.includes('serviceRolePayloads'), 'type review service role payloads')
assertFalseFields(parsed.typeReview.runtimeDefaultsMustRemainFalse, 'typeReview.runtimeDefaultsMustRemainFalse', [
  'workerExecutionEnabled',
  'mediaProcessingEnabled',
  'artifactWritesEnabled',
  'signedUrlCreationEnabled',
  'supabaseWritesEnabled',
])
assert(parsed.adapterReview.acceptedFutureAdapterBoundary.returnBlockedStatusOnly === true, 'adapter review blocked result')
assert(parsed.adapterReview.acceptedFutureAdapterBoundary.signedUrlCreationRejected === true, 'adapter signed URLs rejected')
assertFalseFields(parsed.adapterReview.currentGateState, 'adapterReview.currentGateState', [
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
assert(parsed.integrationReview.acceptedFutureImportsAllowed.includes('assertSoundCpuSupabaseMutationBlocked'), 'integration accepted guard import')
assert(parsed.integrationReview.futureImportsRejected.includes('worker_dispatcher'), 'integration rejects dispatcher')
assertFalseFields(parsed.integrationReview.currentGateState, 'integrationReview.currentGateState', [
  'sourceFileCreatedToday',
  'runtimeSourceModifiedToday',
  'supabaseEnvironmentTouched',
  'sqlExecuted',
  'migrationDeployed',
  'workerDispatchEnabledToday',
])
assert(parsed.blockers.blockersBeforeExternalAgentExecution.actualPrivateManifestPersistenceSourceCreation === 'required_next', 'blockers next source creation')
assert(parsed.blockers.blockersBeforeExternalAgentExecution.betaUnlock === 'blocked', 'beta remains blocked')
assertFalseFields(parsed.blockers.currentGateState, 'blockers.currentGateState', [
  'createSourceFileToday',
  'persistManifestToday',
  'touchSupabaseEnvironmentToday',
  'writeDatabaseRowsToday',
  'createStorageObjectsToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'openMediaFileToday',
  'unlockBetaToday',
  'unlockProductionToday',
])
assert(parsed.policy.allowedClaims.privateManifestPersistenceSourceOwnerReviewPassed === true, 'policy source owner passed')
assert(parsed.policy.allowedClaims.actualPrivateManifestPersistenceSourceCreationMayProceed === true, 'policy source creation may proceed')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assertFalse(value, `policy.blockedClaims.${key}`)

assert(parsed.next.requiredSourceDecision === decision, 'next prompt required source mismatch')
assert(parsed.next.expectedDecision === nextDecision, 'next prompt expected decision mismatch')
assert(parsed.next.allowedSourceCreationScope.createExactlyOneSourceFile === true, 'next prompt exact source scope')
assert(parsed.next.allowedSourceCreationScope.allowedSourcePath === plannedSourcePath, 'next prompt source path')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.allowedSourceCreationScope, 'next.allowedSourceCreationScope', [
  'modifyExistingPrivateManifestSource',
  'modifySupabaseGuardSource',
  'modifyJobContractSource',
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
assertFalseFields(parsed.next.requiredRuntimeDefaults, 'next.requiredRuntimeDefaults', [
  'workerExecutionEnabled',
  'mediaProcessingEnabled',
  'artifactWritesEnabled',
  'signedUrlCreationEnabled',
  'supabaseWritesEnabled',
])

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2010,
      sourceHead,
      sourceMergeCommit,
      plannedSourcePath,
      plannedSourcePathExistsToday: sourceCreatedInLaterApprovedGate,
      sourceFileCreatedToday: sourceCreatedInLaterApprovedGate,
      actualPrivateManifestPersistenceSourceCreationMayProceed: true,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      supabaseEnvironmentTouched: false,
      sqlExecuted: false,
      migrationDeployed: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE96-CAPTION-RENDER-RUNTIME-HOOK-ACTUAL-PRIVATE-MANIFEST-PERSISTENCE-SOURCE-CREATION',
    },
    null,
    2,
  ),
)
