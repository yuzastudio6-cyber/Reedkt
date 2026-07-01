import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase97_caption_render_runtime_hook_private_manifest_persistence_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase97_caption_render_runtime_hook_private_manifest_persistence_static_integration_owner_review_passed_with_warnings_ready_for_static_integration_source_gate_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase98_caption_render_runtime_hook_private_manifest_persistence_static_integration_source_gate_completed_with_warnings_ready_for_static_integration_source_owner_review_no_execution'
const sourceHead = '38398cfab80f231a41e2686b88f59830beb5fd87'
const sourceMergeCommit = 'bf856750b4ad065ab0ee17ee47c373dd136fe07c'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-plan-result.md',
  sourceSurface:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-surface-register.md',
  sourceImportExport:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-import-export-plan.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-evidence-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate.md',
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
    'acceptedForRuntimeSourceModificationToday',
    'acceptedForPersistenceToday',
    'acceptedForStorageObjectCreationToday',
    'acceptedForSignedUrlCreationToday',
    'acceptedForWorkerDispatchToday',
    'acceptedForMediaOpenToday',
    'runtimeSourceModifiedToday',
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
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-plan-result',
  ),
  sourceSurface: parseJsonBlock(
    docs.sourceSurface,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-surface-register',
  ),
  sourceImportExport: parseJsonBlock(
    docs.sourceImportExport,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-import-export-plan',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-evidence-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate',
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
assertFalseFields(parsed.prompt.reviewScope, 'prompt.reviewScope', [
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2016, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === 'b8f024e33743720072e33eaadea0549d0a793f36', 'source result head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '3bb05ce2d52279b295091b29d97d837e563ef90e', 'source result merge')
assert(parsed.sourceResult.staticIntegrationPlan.integrationPlanCreated === true, 'source plan created')
assert(parsed.sourceResult.staticIntegrationPlan.integrationTarget === sourcePath, 'source plan target')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceSurface.acceptedSourceSurface.integrationSurfaceMayBePlanned === true, 'source surface planned')
assert(parsed.sourceSurface.acceptedSourceSurface.integrationMayBeImplementedToday === false, 'source surface not implemented')
assert(parsed.sourceImportExport.futureStaticPlan.requiresOwnerReviewBeforeSourceChange === true, 'source change owner review')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2017, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision')
assert(parsed.result.ownerReview.staticIntegrationPlanAccepted === true, 'result plan accepted')
assert(parsed.result.ownerReview.sourceGateMayProceed === true, 'result source gate')
assert(parsed.result.ownerReview.integrationTargetAccepted === sourcePath, 'result target')
assert(parsed.result.ownerReview.requiredExportsAccepted === true, 'result exports')
assert(parsed.result.ownerReview.failClosedGuardOnlyAccepted === true, 'result fail closed')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
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

assert(parsed.acceptance.acceptedForNextGateOnly.sourceGateMayProceed === true, 'acceptance source gate')
assert(parsed.acceptance.acceptedForNextGateOnly.plannedIntegrationTarget === sourcePath, 'acceptance target')
assert(parsed.acceptance.acceptedForNextGateOnly.requiredExports.length === 2, 'acceptance exports')
assertFalseFields(parsed.acceptance.acceptedForNextGateOnly, 'acceptance.acceptedForNextGateOnly', [
  'acceptedForRuntimeSourceModificationToday',
  'acceptedForPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])

assert(parsed.evidence.acceptedEvidence.sourcePr === 2017, 'evidence source PR')
assert(parsed.evidence.acceptedEvidence.sourceMergeCommit === sourceMergeCommit, 'evidence source merge')
assert(parsed.evidence.acceptedEvidence.forbiddenPersistenceCallsAbsent === true, 'evidence forbidden calls')
assert(parsed.evidence.validationHandoff.packageLockUnchanged === true, 'evidence package lock')

assert(parsed.readiness.readinessForNextGate.staticIntegrationSourceGateMayProceed === true, 'readiness source gate')
assert(parsed.readiness.readinessForNextGate.sourceGateMustRemainNoExecution === true, 'readiness no execution')
assert(parsed.readiness.readinessForNextGate.allowedFutureTarget === sourcePath, 'readiness target')
assert(parsed.readiness.readinessForNextGate.externalAgentExecutionMayProceed === false, 'readiness external execution')
for (const [key, value] of Object.entries(parsed.blockers.blockersPreserved)) {
  assert(value === true, `blockers.${key} must be true`)
}
assert(parsed.policy.allowedClaims.staticIntegrationPlanReviewed === true, 'policy reviewed claim')
assert(parsed.policy.allowedClaims.sourceGateMayProceed === true, 'policy source gate claim')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tools')
for (const [key, value] of Object.entries(parsed.policy.forbiddenClaims)) {
  assert(value === false, `policy.forbiddenClaims.${key} must be false`)
}

assert(parsed.next.requiredSourceDecision === decision, 'next required source')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assert(parsed.next.sourceGateScope.staticSourceIntegrationGateOnly === true, 'next static source gate')
assert(parsed.next.sourceGateScope.allowFailClosedStaticSourceChange === true, 'next static source change')
assertFalseFields(parsed.next.sourceGateScope, 'next.sourceGateScope', [
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
      sourcePr: 2017,
      sourceHead,
      sourceMergeCommit,
      integrationTarget: sourcePath,
      staticIntegrationPlanAccepted: true,
      sourceGateMayProceed: true,
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
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE98-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-STATIC-INTEGRATION-SOURCE-GATE',
    },
    null,
    2,
  ),
)
