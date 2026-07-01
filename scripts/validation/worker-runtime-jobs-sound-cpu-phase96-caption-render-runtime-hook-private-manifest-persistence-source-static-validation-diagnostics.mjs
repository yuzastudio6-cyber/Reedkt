import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_actual_private_manifest_persistence_source_created_with_warnings_ready_for_private_manifest_persistence_source_static_validation_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_passed_with_warnings_ready_for_private_manifest_persistence_source_owner_review_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_static_integration_plan_no_execution'
const sourceHead = 'ec9b349955dd0877a688e3e41065057a9cbcf1d7'
const sourceMergeCommit = '00e3d0d3524b234f93a67a63cffbaa18f465e062'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation.md',
  sourceCreationResult:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-creation-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-result.md',
  instructions:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-instruction-register.md',
  prohibited:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-prohibited-scan-register.md',
  blockedResult:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-blocked-result-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-review.md',
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
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation',
  ),
  sourceCreationResult: parseJsonBlock(
    docs.sourceCreationResult,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-creation-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-result',
  ),
  instructions: parseJsonBlock(
    docs.instructions,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-instruction-register',
  ),
  prohibited: parseJsonBlock(
    docs.prohibited,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-prohibited-scan-register',
  ),
  blockedResult: parseJsonBlock(
    docs.blockedResult,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-blocked-result-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)
assert(exists(sourcePath), `${sourcePath} must exist for static validation`)
const source = read(sourcePath)

const requiredSnippets = [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_SCHEMA_VERSION',
  'sound-cpu-private-manifest-persistence-v1',
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_REJECTED_INPUT_FIELDS',
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_BLOCKED_REASONS',
  'SoundCpuPrivateManifestPersistenceContract',
  'SoundCpuPrivateManifestPersistenceInput',
  'SoundCpuPrivateManifestPersistenceResult',
  'SoundCpuPrivateManifestPersistenceAuditShape',
  'createSoundCpuPrivateManifestPersistenceBlockedResult',
  'assertSoundCpuPrivateManifestPersistenceMutationBlocked',
  'SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS',
  'SOUND_CPU_SUPABASE_OWNER_GATE',
  'getSoundCpuSupabaseGuardState',
  'assertSoundCpuSupabaseMutationBlocked',
  'acceptedForPersistenceToday: false',
  'acceptedForStorageObjectCreationToday: false',
  'acceptedForSignedUrlCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
  'acceptedForMediaOpenToday: false',
  'acceptedForBetaUnlockToday: false',
  'acceptedForProductionUnlockToday: false',
]
for (const snippet of requiredSnippets) assert(source.includes(snippet), `source missing required snippet: ${snippet}`)

const forbiddenSnippets = [
  'createClient(',
  '.from(',
  '.insert(',
  '.upsert(',
  'storage.from',
  'createSignedUrl',
  'fs.readFile',
  'fetch(',
  'spawn(',
  'exec(',
  'workerDispatch',
]
for (const snippet of forbiddenSnippets) assert(!source.includes(snippet), `source contains forbidden snippet: ${snippet}`)

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt required source decision')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision')
assert(parsed.prompt.staticValidationScope.validateSourcePath === sourcePath, 'prompt source path')
assert(parsed.prompt.staticValidationScope.validateFailClosedBlockedResult === true, 'prompt fail-closed validation')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.staticValidationScope, 'prompt.staticValidationScope', [
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

assert(parsed.sourceCreationResult.decision === sourceDecision, 'source creation decision')
assert(parsed.sourceCreationResult.sourceVerification.sourcePr === 2012, 'source creation source PR')
assert(parsed.sourceCreationResult.sourceCreation.createdSourcePath === sourcePath, 'source creation path')
assert(parsed.sourceCreationResult.sourceCreation.sourceFileCreatedToday === true, 'source was created')
assert(parsed.sourceCreationResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assertNoOpClassification(parsed.sourceCreationResult.supabaseClassification, 'sourceCreationResult.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2013, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.staticValidation.validatedSourcePath === sourcePath, 'result source path')
assert(parsed.result.staticValidation.sourceExists === true, 'result source exists')
assert(parsed.result.staticValidation.forbiddenPersistenceCallsAbsent === true, 'result persistence calls absent')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.currentGateState, 'result.currentGateState', [
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

assert(parsed.instructions.validatedSourcePath === sourcePath, 'instructions source path')
for (const required of parsed.instructions.requiredExportsValidated) assert(source.includes(required), `source export missing ${required}`)
for (const field of parsed.instructions.requiredFalseResultFieldsValidated) assert(source.includes(`${field}: false`), `false field missing ${field}`)
for (const guard of parsed.instructions.requiredGuardReferencesValidated) assert(source.includes(guard), `guard reference missing ${guard}`)
assert(parsed.prohibited.validatedSourcePath === sourcePath, 'prohibited source path')
for (const snippet of parsed.prohibited.forbiddenSnippetsAbsent) assert(!source.includes(snippet), `source contains prohibited scan snippet ${snippet}`)
for (const [key, value] of Object.entries(parsed.prohibited.forbiddenArtifactsAbsent)) assert(value === true, `prohibited.${key}`)
assert(parsed.blockedResult.blockedResultValidation.factoryName === 'createSoundCpuPrivateManifestPersistenceBlockedResult', 'blocked factory')
assert(parsed.blockedResult.blockedResultValidation.status === 'blocked_by_owner_gate', 'blocked status')
assert(parsed.blockedResult.blockedResultValidation.ownerGateRequired === 'SUPABASE_RLS_STORAGE_DATABASE', 'blocked owner gate')
assertFalseFields(parsed.blockedResult.blockedResultValidation, 'blockedResult.blockedResultValidation', [
  'acceptedForPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])
assert(parsed.blockers.blockersBeforeExternalAgentExecution.privateManifestPersistenceSourceOwnerReview === 'required_next', 'blockers next')
assert(parsed.policy.allowedClaims.privateManifestPersistenceSourceStaticValidationPassed === true, 'policy validation passed')
assert(parsed.policy.allowedClaims.privateManifestPersistenceSourceOwnerReviewMayProceed === true, 'policy owner review may proceed')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assertFalse(value, `policy.blockedClaims.${key}`)

assert(parsed.next.requiredSourceDecision === decision, 'next required decision')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.reviewScope, 'next.reviewScope', [
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
      sourcePr: 2013,
      sourceHead,
      sourceMergeCommit,
      validatedSourcePath: sourcePath,
      staticValidationPassed: true,
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
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE96-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-SOURCE-STATIC-VALIDATION-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
