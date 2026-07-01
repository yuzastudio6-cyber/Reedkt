import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase97_caption_render_runtime_hook_private_manifest_persistence_static_integration_owner_review_passed_with_warnings_ready_for_static_integration_source_gate_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase98_caption_render_runtime_hook_private_manifest_persistence_static_integration_source_gate_completed_with_warnings_ready_for_static_integration_source_owner_review_no_execution'
const ownerReviewSourceHead = '38398cfab80f231a41e2686b88f59830beb5fd87'
const ownerReviewSourceMergeCommit = 'bf856750b4ad065ab0ee17ee47c373dd136fe07c'
const sourceHead = '55884457fd2bc5ccc82e1695a1ca0a6986878097'
const sourceMergeCommit = 'ffec91d54dbb35d3f6556bf2ed0d5086cbefa662'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-review-result.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate-result.md',
  surface:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-surface-register.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-safety-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-review.md',
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
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'openMediaFileToday',
    'unlockBetaToday',
    'unlockProductionToday',
    'runtimeExecutionEnabledToday',
    'supabaseClientImportAdded',
    'databaseWriteAdded',
    'storageWriteAdded',
    'signedUrlCreationAdded',
    'mediaReadAdded',
    'workerDispatchAdded',
    'routeExecutionAdded',
    'providerCallAdded',
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
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-review-result',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate-result',
  ),
  surface: parseJsonBlock(
    docs.surface,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-surface-register',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-safety-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const source = read(sourcePath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_STATIC_INTEGRATION_SOURCE_GATE',
  'SoundCpuPrivateManifestPersistenceStaticIntegrationSourceGate',
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
assert(parsed.prompt.sourceGateScope.allowFailClosedStaticSourceChange === true, 'prompt static source change')
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2017, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === ownerReviewSourceHead, 'source result source head')
assert(
  parsed.sourceResult.sourceVerification.sourceMergeCommit === ownerReviewSourceMergeCommit,
  'source result source merge',
)
assert(parsed.sourceResult.ownerReview.sourceGateMayProceed === true, 'source gate may proceed')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2019, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.staticSourceIntegration.sourcePath === sourcePath, 'result source path')
assert(parsed.result.staticSourceIntegration.failClosedStaticSourceChangeCreated === true, 'result source change')
assert(parsed.result.staticSourceIntegration.staticIntegrationSourceGateExported === true, 'result source gate exported')
assert(parsed.result.staticSourceIntegration.staticIntegrationBlockedResultAdapterExported === true, 'result adapter')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.staticSourceIntegration, 'result.staticSourceIntegration', [
  'runtimeExecutionEnabledToday',
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

assert(parsed.surface.sourceSurface.sourcePath === sourcePath, 'surface source path')
assert(parsed.surface.sourceSurface.blockedResultAdapterUsesExistingFailClosedFunction === true, 'surface adapter')
assert(parsed.surface.blockedBehavior.supabaseClientImportAdded === false, 'surface supabase')
for (const [key, value] of Object.entries(parsed.surface.blockedBehavior)) {
  assert(value === false, `surface.blockedBehavior.${key} must be false`)
}
for (const [key, value] of Object.entries(parsed.safety.sourceSafety)) {
  assert(value === true, `safety.sourceSafety.${key} must be true`)
}
for (const [key, value] of Object.entries(parsed.blockers.blockersPreserved)) {
  assert(value === true, `blockers.${key} must be true`)
}
assert(parsed.policy.allowedClaims.failClosedStaticSourceChangeCreated === true, 'policy source change')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tools')
for (const [key, value] of Object.entries(parsed.policy.forbiddenClaims)) {
  assert(value === false, `policy.forbiddenClaims.${key} must be false`)
}
assert(parsed.next.requiredSourceDecision === decision, 'next required source')
assert(
  parsed.next.expectedDecision ===
    'worker_runtime_jobs_sound_cpu_phase98_caption_render_runtime_hook_private_manifest_persistence_static_integration_source_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_runtime_binding_plan_no_execution',
  'next expected decision',
)
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

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2019,
      sourceHead,
      sourceMergeCommit,
      sourcePath,
      failClosedStaticSourceChangeCreated: true,
      runtimeExecutionEnabledToday: false,
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
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE98-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-STATIC-INTEGRATION-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
