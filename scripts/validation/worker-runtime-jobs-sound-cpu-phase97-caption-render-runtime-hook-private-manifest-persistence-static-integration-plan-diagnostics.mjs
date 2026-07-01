import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_static_integration_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase97_caption_render_runtime_hook_private_manifest_persistence_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review_no_execution'
const sourceHead = 'b8f024e33743720072e33eaadea0549d0a793f36'
const sourceMergeCommit = '3bb05ce2d52279b295091b29d97d837e563ef90e'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-review-result.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-static-integration-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-plan-result.md',
  surface:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-surface-register.md',
  importExport:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-import-export-plan.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-safety-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-review.md',
}

function filePath(file) {
  return path.join(process.cwd(), file)
}

function read(file) {
  const full = filePath(file)
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
    'integrationMayBeImplementedToday',
    'persistenceMayRunToday',
    'runtimeSourceModified',
    'supabaseClientIntroduced',
    'sqlIntroduced',
    'storageWriteIntroduced',
    'signedUrlCreationIntroduced',
    'mediaOpenIntroduced',
    'workerDispatchIntroduced',
    'routeExecutionIntroduced',
    'providerCallIntroduced',
    'artifactCreationIntroduced',
    'readinessClaimWidened',
    'externalAgentExecutionReadyClaimed',
    'realUserMediaBetaReadyClaimed',
    'productionReadinessClaimed',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-review-result',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-static-integration-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-plan-result',
  ),
  surface: parseJsonBlock(
    docs.surface,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-surface-register',
  ),
  importExport: parseJsonBlock(
    docs.importExport,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-import-export-plan',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-safety-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

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
assertFalseFields(parsed.prompt.planningScope, 'prompt.planningScope', [
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

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2015, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === '36f996a4ddf3b76775ffc78f6e9ad7c007ec21d3', 'source result source head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '6004b3e0082d873a607e30a2812ab7c7d86d88be', 'source result source merge')
assert(parsed.sourceResult.ownerReview.privateManifestPersistenceStaticIntegrationPlanMayProceed === true, 'source owner review readiness')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tools covered')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceReadiness.readinessForNextPlanningGate.staticIntegrationPlanMayProceed === true, 'source readiness plan')
assert(parsed.sourceReadiness.readinessForNextPlanningGate.allowedFutureIntegrationTarget === sourcePath, 'source readiness target')
assert(parsed.sourceReadiness.readinessForNextPlanningGate.externalAgentExecutionMayProceed === false, 'source readiness execution')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2016, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision')
assert(parsed.result.staticIntegrationPlan.integrationPlanCreated === true, 'result plan created')
assert(parsed.result.staticIntegrationPlan.integrationTarget === sourcePath, 'result target')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools covered')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.staticIntegrationPlan, 'result.staticIntegrationPlan', [
  'runtimeSourceModificationToday',
  'persistManifestToday',
  'touchSupabaseEnvironmentToday',
  'runSqlToday',
  'createStorageObjectsToday',
  'createSignedUrlToday',
  'dispatchWorkerToday',
  'openMediaFileToday',
  'unlockBetaToday',
  'unlockProductionToday',
])

assert(parsed.surface.acceptedSourceSurface.sourcePath === sourcePath, 'surface source path')
assert(parsed.surface.acceptedSourceSurface.integrationSurfaceMayBePlanned === true, 'surface may be planned')
assertFalseFields(parsed.surface.acceptedSourceSurface, 'surface.acceptedSourceSurface', [
  'integrationMayBeImplementedToday',
  'persistenceMayRunToday',
])
for (const exportName of [
  'createSoundCpuPrivateManifestPersistenceBlockedResult',
  'assertSoundCpuPrivateManifestPersistenceMutationBlocked',
]) {
  assert(parsed.surface.acceptedSourceSurface.requiredExports.includes(exportName), `surface export ${exportName}`)
  assert(parsed.importExport.futureStaticPlan.plannedExports.includes(exportName), `importExport export ${exportName}`)
}
assert(parsed.importExport.futureStaticPlan.requiresOwnerReviewBeforeSourceChange === true, 'owner review before source change')
assert(parsed.importExport.futureStaticPlan.plannedCallMode === 'fail_closed_guard_only', 'fail closed call mode')

for (const [key, value] of Object.entries(parsed.safety.safetyChecks)) {
  assert(value === false, `safety.${key} must be false`)
}
for (const [key, value] of Object.entries(parsed.blockers.blockersPreserved)) {
  assert(value === true, `blockers.${key} must be true`)
}
assert(parsed.policy.allowedClaims.staticIntegrationPlanCreated === true, 'policy allowed plan claim')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tools')
for (const [key, value] of Object.entries(parsed.policy.forbiddenClaims)) {
  assert(value === false, `policy.forbiddenClaims.${key} must be false`)
}

assert(parsed.next.requiredSourceDecision === decision, 'next required source')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase97_caption_render_runtime_hook_private_manifest_persistence_static_integration_owner_review_passed_with_warnings_ready_for_static_integration_source_gate_no_execution',
  'next expected decision',
)
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.reviewScope, 'next.reviewScope', [
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
      sourcePr: 2016,
      sourceHead,
      sourceMergeCommit,
      integrationTarget: sourcePath,
      staticIntegrationPlanCreated: true,
      runtimeSourceModificationToday: false,
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
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE97-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-STATIC-INTEGRATION-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
