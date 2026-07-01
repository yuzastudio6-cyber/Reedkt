import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase100_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_owner_review_passed_with_warnings_ready_for_runtime_binding_source_gate_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase101_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_source_gate_completed_with_warnings_ready_for_source_owner_review_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase101_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_source_owner_review_passed_with_warnings_ready_for_runtime_execution_contract_plan_no_execution'
const sourceHead = '351bcb8c99706ca71a66e4ce16c9b87ec22bf153'
const sourceMergeCommit = '491a0530c24dcf0e15e4218d0c6388170503e546'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review-result.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate-result.md',
  surface:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-surface-register.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-safety-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review.md',
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
    'allowWorkerDispatchToday',
    'workerDispatchMayProceedToday',
    'runtimeBindingImplementationMayProceedToday',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'openMediaFileToday',
    'unlockBetaToday',
    'unlockProductionToday',
    'supabaseClientIntroduced',
    'sqlIntroduced',
    'storageWriteIntroduced',
    'signedUrlCreationIntroduced',
    'mediaOpenIntroduced',
    'workerDispatchIntroduced',
    'supabaseEnvironmentTouched',
    'sqlExecuted',
    'storageObjectsCreated',
    'signedUrlsCreated',
    'workerDispatched',
    'routeExecuted',
    'toolExecuted',
    'mediaOpened',
    'artifactsCreated',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review-result',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate-result',
  ),
  surface: parseJsonBlock(
    docs.surface,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-surface-register',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-safety-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const source = read(sourcePath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE',
  'worker_runtime_jobs_sound_cpu_phase101_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_source_gate',
  'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult',
  'getSoundCpuPrivateManifestPersistenceRuntimeBindingSourceGate',
  'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult(input, blockedReason)',
  'assertSoundCpuPrivateManifestPersistenceMutationBlocked',
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
assert(parsed.prompt.sourceGateScope.allowFailClosedSourceBindingOnly === true, 'prompt fail closed')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.sourceGateScope, 'prompt.sourceGateScope', [
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2024, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'a78e78198e04a0c0df8097654b47d42e99c930eb', 'source result source merge')
assert(parsed.sourceResult.ownerReview.runtimeBindingSourceGateMayProceed === true, 'source result source gate')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceReadiness.readinessForNextSourceGate.runtimeBindingSourceGateMayProceed === true, 'source readiness gate')
assert(parsed.sourceReadiness.readinessForNextSourceGate.allowedFutureSourcePath === sourcePath, 'source readiness path')
assert(parsed.sourceReadiness.readinessForNextSourceGate.externalAgentExecutionMayProceed === false, 'source readiness external execution')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2025, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision')
assert(parsed.result.runtimeBindingSourceGate.failClosedSourceBindingCreated === true, 'result source created')
assert(parsed.result.runtimeBindingSourceGate.sourcePath === sourcePath, 'result path')
assert(parsed.result.runtimeBindingSourceGate.newGateExport === 'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE', 'result gate export')
assert(parsed.result.runtimeBindingSourceGate.newBlockedResultExport === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'result function')
assert(parsed.result.runtimeBindingSourceGate.delegatesTo === 'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult', 'result delegate')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.runtimeBindingSourceGate, 'result.runtimeBindingSourceGate', [
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

assert(parsed.surface.sourceSurface.sourcePath === sourcePath, 'surface path')
assert(parsed.surface.sourceSurface.gateConstant === 'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE', 'surface gate')
assert(parsed.surface.sourceSurface.blockedResultFunctionDelegatesTo === 'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult', 'surface delegate')
assert(parsed.surface.sourceSurface.statusReturned === 'blocked_by_owner_gate', 'surface status')
assertFalseFields(parsed.surface.sourceSurface, 'surface.sourceSurface', [
  'supabaseClientIntroduced',
  'sqlIntroduced',
  'storageWriteIntroduced',
  'signedUrlCreationIntroduced',
  'mediaOpenIntroduced',
  'workerDispatchIntroduced',
])

for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from', 'createSignedUrl']) {
  assert(parsed.safety.prohibitedCallsAbsent.includes(forbidden), `safety prohibited ${forbidden}`)
}
for (const [key, value] of Object.entries(parsed.safety.runtimeActionsDisabled)) {
  assert(value === false, `safety.runtimeActionsDisabled.${key} must be false`)
}

assert(parsed.readiness.readinessForSourceOwnerReview.sourceOwnerReviewMayProceed === true, 'readiness owner review')
assert(parsed.readiness.readinessForSourceOwnerReview.runtimeBindingExecutionMayProceedToday === false, 'readiness execution')
assert(parsed.readiness.readinessForSourceOwnerReview.externalAgentExecutionMayProceed === false, 'readiness external')
for (const [key, value] of Object.entries(parsed.blockers.blockersPreserved)) {
  assert(value === true, `blockers.${key} must be true`)
}
assert(parsed.policy.allowedClaims.failClosedRuntimeBindingSourceCreated === true, 'policy source created')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tools')
for (const [key, value] of Object.entries(parsed.policy.forbiddenClaims)) {
  assert(value === false, `policy.forbiddenClaims.${key} must be false`)
}
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next required source')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assert(parsed.next.reviewScope.reviewFailClosedSourceBindingOnly === true, 'next review only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.reviewScope, 'next.reviewScope', [
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

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts[
    'worker-runtime-jobs:sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate-diagnostics.mjs',
  'package script missing',
)

const result = {
  ok: true,
  decision,
  sourcePr: 2025,
  sourceHead,
  sourceMergeCommit,
  sourcePath,
  failClosedRuntimeBindingSourceCreated: true,
  runtimeBindingExecutionReadyToday: false,
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
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE101-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-BINDING-SOURCE-OWNER-REVIEW',
}

console.log(JSON.stringify(result, null, 2))
