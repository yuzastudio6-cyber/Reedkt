import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_passed_with_warnings_ready_for_private_manifest_persistence_source_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_static_integration_plan_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase97_caption_render_runtime_hook_private_manifest_persistence_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review_no_execution'
const sourceHead = '36f996a4ddf3b76775ffc78f6e9ad7c007ec21d3'
const sourceMergeCommit = '6004b3e0082d873a607e30a2812ab7c7d86d88be'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-evidence-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-static-integration-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-plan.md',
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
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-evidence-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-static-integration-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)
assert(exists(sourcePath), `${sourcePath} must exist for owner review`)
const source = read(sourcePath)
for (const snippet of [
  'createSoundCpuPrivateManifestPersistenceBlockedResult',
  'assertSoundCpuPrivateManifestPersistenceMutationBlocked',
  'acceptedForPersistenceToday: false',
  'acceptedForStorageObjectCreationToday: false',
  'acceptedForSignedUrlCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
  'acceptedForMediaOpenToday: false',
]) {
  assert(source.includes(snippet), `source missing ${snippet}`)
}
for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from', 'createSignedUrl', 'fs.readFile', 'fetch(']) {
  assert(!source.includes(forbidden), `source contains forbidden ${forbidden}`)
}

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt required source')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.reviewScope, 'prompt.reviewScope', [
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

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2013, 'source result source PR')
assert(parsed.sourceResult.staticValidation.validatedSourcePath === sourcePath, 'source result path')
assert(parsed.sourceResult.staticValidation.forbiddenPersistenceCallsAbsent === true, 'source result forbidden calls')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2015, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision')
assert(parsed.result.ownerReview.validatedSourcePathAccepted === true, 'result path accepted')
assert(parsed.result.ownerReview.failClosedBlockedResultAccepted === true, 'result fail closed')
assert(parsed.result.ownerReview.privateManifestPersistenceStaticIntegrationPlanMayProceed === true, 'result integration may proceed')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
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

assert(parsed.acceptance.acceptedForNextGateOnly.sourcePath === sourcePath, 'acceptance source path')
assert(parsed.acceptance.acceptedForNextGateOnly.staticIntegrationPlanMayProceed === true, 'acceptance plan may proceed')
assertFalseFields(parsed.acceptance.acceptedForNextGateOnly, 'acceptance.acceptedForNextGateOnly', [
  'acceptedForPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])
assert(parsed.evidence.acceptedEvidence.sourcePr === 2015, 'evidence source PR')
assert(parsed.evidence.acceptedEvidence.validatedSourcePath === sourcePath, 'evidence path')
assert(parsed.evidence.acceptedEvidence.staticValidationPassed === true, 'evidence static validation')
assert(parsed.evidence.sourceFacts.status === 'blocked_by_owner_gate', 'evidence status')
assert(parsed.readiness.readinessForNextPlanningGate.staticIntegrationPlanMayProceed === true, 'readiness integration plan')
assert(parsed.readiness.readinessForNextPlanningGate.realPersistenceMayProceed === false, 'readiness persistence closed')
assert(parsed.readiness.readinessForNextPlanningGate.externalAgentExecutionMayProceed === false, 'readiness external execution closed')
assert(parsed.blockers.blockersBeforeExternalAgentExecution.privateManifestPersistenceStaticIntegrationPlan === 'required_next', 'blocker next')
assert(parsed.policy.allowedClaims.privateManifestPersistenceSourceStaticValidationOwnerReviewPassed === true, 'policy owner review passed')
assert(parsed.policy.allowedClaims.privateManifestPersistenceStaticIntegrationPlanMayProceed === true, 'policy integration plan')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assertFalse(value, `policy.blockedClaims.${key}`)

assert(parsed.next.requiredSourceDecision === decision, 'next required source')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assert(parsed.next.planningScope.integrationTarget === sourcePath, 'next integration target')
assert(parsed.next.planningScope.planStaticIntegrationOnly === true, 'next static only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.planningScope, 'next.planningScope', [
  'allowRuntimeSourceModificationToday',
  'allowWorkerDispatchToday',
  'runSqlToday',
  'touchSupabaseEnvironmentToday',
  'createStorageObjectsToday',
  'persistManifestToday',
  'createSignedUrlToday',
  'openMediaFileToday',
  'unlockBetaToday',
  'unlockProductionToday',
])

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2015,
      sourceHead,
      sourceMergeCommit,
      validatedSourcePath: sourcePath,
      ownerReviewPassed: true,
      staticIntegrationPlanMayProceed: true,
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
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE97-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-STATIC-INTEGRATION-PLAN',
    },
    null,
    2,
  ),
)
