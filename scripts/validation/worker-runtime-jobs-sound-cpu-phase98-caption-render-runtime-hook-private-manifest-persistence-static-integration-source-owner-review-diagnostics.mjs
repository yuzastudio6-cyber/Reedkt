import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase98_caption_render_runtime_hook_private_manifest_persistence_static_integration_source_gate_completed_with_warnings_ready_for_static_integration_source_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase98_caption_render_runtime_hook_private_manifest_persistence_static_integration_source_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_runtime_binding_plan_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase99_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_plan_completed_with_warnings_ready_for_runtime_binding_owner_review_no_execution'
const sourceGateSourceHead = '55884457fd2bc5ccc82e1695a1ca0a6986878097'
const sourceGateSourceMergeCommit = 'ffec91d54dbb35d3f6556bf2ed0d5086cbefa662'
const sourceHead = '32eff665ca449e3107395693c6ec8762f5f1c763'
const sourceMergeCommit = 'd14ec33fb66b55b6089837ea88a95d29a287b18b'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate-result.md',
  sourceSurface:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-surface-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-evidence-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan.md',
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
    'allowRuntimeBindingImplementationToday',
    'allowWorkerDispatchToday',
    'workerDispatchEnabledToday',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'openMediaFileToday',
    'unlockBetaToday',
    'unlockProductionToday',
    'acceptedForWorkerDispatchToday',
    'acceptedForPersistenceToday',
    'acceptedForStorageObjectCreationToday',
    'acceptedForSignedUrlCreationToday',
    'acceptedForMediaOpenToday',
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
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate-result',
  ),
  sourceSurface: parseJsonBlock(
    docs.sourceSurface,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-surface-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-evidence-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const source = read(sourcePath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_STATIC_INTEGRATION_SOURCE_GATE',
  'getSoundCpuPrivateManifestPersistenceStaticIntegrationSourceGate',
  'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult',
  'createSoundCpuPrivateManifestPersistenceBlockedResult(input, blockedReason)',
  'acceptedForRuntimeExecutionToday: false',
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2019, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === sourceGateSourceHead, 'source result source head')
assert(
  parsed.sourceResult.sourceVerification.sourceMergeCommit === sourceGateSourceMergeCommit,
  'source result source merge',
)
assert(parsed.sourceResult.staticSourceIntegration.failClosedStaticSourceChangeCreated === true, 'source fail closed')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assert(parsed.sourceSurface.sourceSurface.blockedResultAdapterUsesExistingFailClosedFunction === true, 'source adapter')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2021, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.ownerReview.failClosedStaticSourceAccepted === true, 'result source accepted')
assert(parsed.result.ownerReview.runtimeBindingPlanMayProceed === true, 'result binding plan')
assert(parsed.result.ownerReview.sourcePathAccepted === sourcePath, 'result path')
assert(parsed.result.ownerReview.staticIntegrationSourceGateAccepted === true, 'result source gate')
assert(parsed.result.ownerReview.blockedResultAdapterAccepted === true, 'result adapter')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
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

assert(parsed.acceptance.acceptedForNextPlanningGateOnly.runtimeBindingPlanMayProceed === true, 'acceptance binding plan')
assert(parsed.acceptance.acceptedForNextPlanningGateOnly.sourcePath === sourcePath, 'acceptance source path')
assertFalseFields(parsed.acceptance.acceptedForNextPlanningGateOnly, 'acceptance.acceptedForNextPlanningGateOnly', [
  'acceptedForWorkerDispatchToday',
  'acceptedForPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])

assert(parsed.evidence.acceptedEvidence.sourcePr === 2021, 'evidence source PR')
assert(parsed.evidence.acceptedEvidence.sourceMergeCommit === sourceMergeCommit, 'evidence merge')
assert(parsed.evidence.acceptedEvidence.adapterDelegatesToExistingFailClosedResult === true, 'evidence adapter')
assert(parsed.evidence.acceptedEvidence.forbiddenPersistenceCallsAbsent === true, 'evidence forbidden calls')
assert(parsed.evidence.acceptedEvidence.runtimeFlagsRemainFalse === true, 'evidence runtime flags')

assert(parsed.readiness.readinessForNextPlanningGate.runtimeBindingPlanMayProceed === true, 'readiness plan')
assert(parsed.readiness.readinessForNextPlanningGate.runtimeBindingImplementationMayProceedToday === false, 'readiness implementation')
assert(parsed.readiness.readinessForNextPlanningGate.externalAgentExecutionMayProceed === false, 'readiness external execution')
for (const [key, value] of Object.entries(parsed.blockers.blockersPreserved)) {
  assert(value === true, `blockers.${key} must be true`)
}
assert(parsed.policy.allowedClaims.failClosedStaticSourceReviewed === true, 'policy source reviewed')
assert(parsed.policy.allowedClaims.runtimeBindingPlanMayProceed === true, 'policy binding plan')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tools')
for (const [key, value] of Object.entries(parsed.policy.forbiddenClaims)) {
  assert(value === false, `policy.forbiddenClaims.${key} must be false`)
}

assert(parsed.next.requiredSourceDecision === decision, 'next required source')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assert(parsed.next.planningScope.planRuntimeBindingOnly === true, 'next binding plan only')
assertFalseFields(parsed.next.planningScope, 'next.planningScope', [
  'allowRuntimeBindingImplementationToday',
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
      sourcePr: 2021,
      sourceHead,
      sourceMergeCommit,
      sourcePath,
      failClosedStaticSourceAccepted: true,
      runtimeBindingPlanMayProceed: true,
      runtimeBindingImplementedToday: false,
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
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE99-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-BINDING-PLAN',
    },
    null,
    2,
  ),
)
