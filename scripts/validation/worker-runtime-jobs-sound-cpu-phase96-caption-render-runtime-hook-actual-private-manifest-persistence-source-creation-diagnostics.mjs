import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase95_caption_render_runtime_hook_private_manifest_persistence_source_owner_review_passed_with_warnings_ready_for_actual_private_manifest_persistence_source_creation_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_actual_private_manifest_persistence_source_created_with_warnings_ready_for_private_manifest_persistence_source_static_validation_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_passed_with_warnings_ready_for_private_manifest_persistence_source_owner_review_no_execution'
const sourceHead = '8af4f143dfdbc1f78bd66e96eed21bc2c2cd6ce1'
const sourceMergeCommit = '06326bf1e9cdd3438029360133bb1123d7fc4cd6'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-actual-private-manifest-persistence-source-creation.md',
  sourceOwnerResult:
    'docs/worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-review-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-creation-result.md',
  content:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-content-register.md',
  noExecution:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-no-execution-source-register.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-safety-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation.md',
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

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'persistManifestToday',
    'createMigrationToday',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageBucketToday',
    'writeDatabaseRowsToday',
    'createStorageObjectsToday',
    'createSignedUrlToday',
    'createPublicArtifactToday',
    'dispatchWorkerToday',
    'openMediaFileToday',
    'routeExecutionEnabledToday',
    'providerCallEnabledToday',
    'modelCallEnabledToday',
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
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-actual-private-manifest-persistence-source-creation',
  ),
  sourceOwnerResult: parseJsonBlock(
    docs.sourceOwnerResult,
    'worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-creation-result',
  ),
  content: parseJsonBlock(
    docs.content,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-content-register',
  ),
  noExecution: parseJsonBlock(
    docs.noExecution,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-no-execution-source-register',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-safety-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)
assert(exists(sourcePath), `${sourcePath} must exist after Phase 96 source creation`)

const source = read(sourcePath)
const requiredSourceSnippets = [
  "SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_SCHEMA_VERSION",
  "sound-cpu-private-manifest-persistence-v1",
  "SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_REJECTED_INPUT_FIELDS",
  "SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_BLOCKED_REASONS",
  "SoundCpuPrivateManifestPersistenceContract",
  "SoundCpuPrivateManifestPersistenceInput",
  "SoundCpuPrivateManifestPersistenceResult",
  "SoundCpuPrivateManifestPersistenceAuditShape",
  "createSoundCpuPrivateManifestPersistenceBlockedResult",
  "assertSoundCpuPrivateManifestPersistenceMutationBlocked",
  "SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS",
  "getSoundCpuSupabaseGuardState",
  "assertSoundCpuSupabaseMutationBlocked",
  "acceptedForPersistenceToday: false",
  "acceptedForStorageObjectCreationToday: false",
  "acceptedForSignedUrlCreationToday: false",
  "acceptedForWorkerDispatchToday: false",
  "acceptedForMediaOpenToday: false",
  "acceptedForBetaUnlockToday: false",
  "acceptedForProductionUnlockToday: false",
]
for (const snippet of requiredSourceSnippets) assert(source.includes(snippet), `source missing ${snippet}`)

const forbiddenSourceSnippets = [
  'createClient(',
  'from(',
  'insert(',
  'upsert(',
  'storage.from',
  'createSignedUrl',
  'fs.readFile',
  'fetch(',
  'exec(',
  'spawn(',
  'workerDispatch',
]
for (const snippet of forbiddenSourceSnippets) assert(!source.includes(snippet), `source contains forbidden snippet ${snippet}`)

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt required source decision')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision')
assert(parsed.prompt.allowedSourceCreationScope.allowedSourcePath === sourcePath, 'prompt source path')
assert(parsed.prompt.allowedSourceCreationScope.createExactlyOneSourceFile === true, 'prompt exact source file scope')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.allowedSourceCreationScope, 'prompt.allowedSourceCreationScope', [
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

assert(parsed.sourceOwnerResult.decision === sourceDecision, 'source owner result decision')
assert(parsed.sourceOwnerResult.sourceVerification.sourcePr === 2010, 'source owner source PR')
assert(parsed.sourceOwnerResult.ownerReview.actualPrivateManifestPersistenceSourceCreationMayProceed === true, 'source owner may proceed')
assert(parsed.sourceOwnerResult.soundCpuTools.covered === 15, 'source owner tools')
assert(parsed.sourceOwnerResult.soundCpuTools.readyForRealExecutionToday === 0, 'source owner execution closed')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2012, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result merge')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision')
assert(parsed.result.sourceCreation.createdSourcePath === sourcePath, 'result created path')
assert(parsed.result.sourceCreation.sourceFileCreatedToday === true, 'result source file created')
assert(parsed.result.sourceCreation.staticContractTypesCreated === true, 'result static types')
assert(parsed.result.sourceCreation.failClosedBlockedResultHelperCreated === true, 'result helper')
assert(parsed.result.sourceCreation.supabaseGuardReferenceCreated === true, 'result guard reference')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.sourceCreation, 'result.sourceCreation', [
  'modifiedExistingPrivateManifestSource',
  'modifiedSupabaseGuardSource',
  'modifiedJobContractSource',
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

assert(parsed.content.sourcePath === sourcePath, 'content source path')
assert(parsed.content.createdExports.includes('SoundCpuPrivateManifestPersistenceContract'), 'content contract export')
assert(parsed.content.createdExports.includes('createSoundCpuPrivateManifestPersistenceBlockedResult'), 'content helper export')
assert(parsed.content.acceptedImports.includes('assertSoundCpuSupabaseMutationBlocked'), 'content guard import')
assert(parsed.content.rejectedInputs.includes('signedUrls'), 'content signed URLs rejected')
assert(parsed.noExecution.failClosedBehavior.blockedResultFactoryCreated === true, 'no execution helper')
assert(parsed.noExecution.failClosedBehavior.referencesSupabaseGuardStateOnly === true, 'no execution guard state')
assert(parsed.noExecution.acceptedForToday.staticTypes === true, 'static types accepted')
assertFalseFields(parsed.noExecution.acceptedForToday, 'noExecution.acceptedForToday', [
  'supabaseMutation',
  'sqlExecution',
  'storageObjectCreation',
  'manifestPersistence',
  'signedUrlCreation',
  'workerDispatch',
  'mediaFileOpen',
  'routeExecution',
  'providerCall',
  'modelCall',
  'betaUnlock',
  'productionUnlock',
])
assert(parsed.safety.sourceSafety.actualSourcePath === sourcePath, 'safety source path')
assert(parsed.safety.sourceSafety.onlyRuntimeSourceFileCreated === true, 'safety source only')
assertFalseFields(parsed.safety.sourceSafety, 'safety.sourceSafety', [
  'packageLockChanged',
  'nodeModulesStaged',
  'distStaged',
  'distServerStaged',
  'migrationCreated',
  'sqlCreated',
  'supabaseFileChanged',
  'dockerFileChanged',
  'envSecretChanged',
  'mediaArtifactChanged',
  'modelWeightChanged',
])
for (const [key, value] of Object.entries(parsed.safety.runtimeClaims)) assertFalse(value, `safety.runtimeClaims.${key}`)
assert(parsed.blockers.blockersBeforeExternalAgentExecution.privateManifestPersistenceSourceStaticValidation === 'required_next', 'blockers next')
assert(parsed.policy.allowedClaims.actualPrivateManifestPersistenceSourceCreated === true, 'policy source created')
assert(parsed.policy.allowedClaims.privateManifestPersistenceSourceStaticValidationMayProceed === true, 'policy static validation may proceed')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assertFalse(value, `policy.blockedClaims.${key}`)

assert(parsed.next.requiredSourceDecision === decision, 'next required decision')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assert(parsed.next.staticValidationScope.validateSourcePath === sourcePath, 'next validation source path')
assert(parsed.next.staticValidationScope.validateFailClosedBlockedResult === true, 'next validate helper')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.staticValidationScope, 'next.staticValidationScope', [
  'runSqlToday',
  'touchSupabaseEnvironmentToday',
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
      sourcePr: 2012,
      sourceHead,
      sourceMergeCommit,
      sourcePath,
      sourceFileCreatedToday: true,
      persistManifestToday: false,
      supabaseEnvironmentTouched: false,
      sqlExecuted: false,
      storageObjectsCreated: false,
      signedUrlsCreated: false,
      workerDispatched: false,
      mediaOpened: false,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE96-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-SOURCE-STATIC-VALIDATION',
    },
    null,
    2,
  ),
)
