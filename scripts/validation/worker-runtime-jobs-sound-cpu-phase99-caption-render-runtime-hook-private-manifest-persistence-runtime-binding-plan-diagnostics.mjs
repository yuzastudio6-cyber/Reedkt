import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase98_caption_render_runtime_hook_private_manifest_persistence_static_integration_source_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_runtime_binding_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase99_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_plan_completed_with_warnings_ready_for_runtime_binding_owner_review_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase100_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_owner_review_passed_with_warnings_ready_for_runtime_binding_source_gate_no_execution'
const sourceHead = '09bf543e6745406da479377f147400d4b5373493'
const sourceMergeCommit = '5707295620229a2f7ba08c83a1781823be1e242f'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-review-result.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan-result.md',
  target:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-target-register.md',
  contract:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-contract-map.md',
  ownerGates:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-gate-map.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review.md',
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
    'workerDispatchToday',
    'runtimeBindingImplementationToday',
    'persistenceToday',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'openMediaFileToday',
    'unlockBetaToday',
    'unlockProductionToday',
    'runtimeBindingImplementedToday',
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
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-owner-review-result',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan-result',
  ),
  target: parseJsonBlock(
    docs.target,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-target-register',
  ),
  contract: parseJsonBlock(
    docs.contract,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-contract-map',
  ),
  ownerGates: parseJsonBlock(
    docs.ownerGates,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-gate-map',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const source = read(sourcePath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_STATIC_INTEGRATION_SOURCE_GATE',
  'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult',
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
assert(parsed.prompt.planningScope.planRuntimeBindingOnly === true, 'prompt plan only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.planningScope, 'prompt.planningScope', [
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

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2021, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'd14ec33fb66b55b6089837ea88a95d29a287b18b', 'source result merge')
assert(parsed.sourceResult.ownerReview.runtimeBindingPlanMayProceed === true, 'source result binding plan')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceReadiness.decision === sourceDecision, 'source readiness decision')
assert(parsed.sourceReadiness.readinessForNextPlanningGate.runtimeBindingPlanMayProceed === true, 'source readiness plan')
assert(parsed.sourceReadiness.readinessForNextPlanningGate.runtimeBindingImplementationMayProceedToday === false, 'source readiness implementation')
assert(parsed.sourceReadiness.readinessForNextPlanningGate.externalAgentExecutionMayProceed === false, 'source readiness external execution')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2023, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision')
assert(parsed.result.runtimeBindingPlan.planCreated === true, 'result plan created')
assert(parsed.result.runtimeBindingPlan.sourcePath === sourcePath, 'result source path')
assert(parsed.result.runtimeBindingPlan.requiredAdapter === 'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult', 'result adapter')
assert(parsed.result.runtimeBindingPlan.requiredAssertion === 'assertSoundCpuPrivateManifestPersistenceMutationBlocked', 'result assertion')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.runtimeBindingPlan, 'result.runtimeBindingPlan', [
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

assert(parsed.target.bindingTarget.sourcePath === sourcePath, 'target source path')
assert(parsed.target.bindingTarget.requiredAdapter === 'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult', 'target adapter')
assert(parsed.target.bindingTarget.expectedStatus === 'blocked_by_owner_gate', 'target status')
assertFalseFields(parsed.target.bindingTarget, 'target.bindingTarget', [
  'runtimeBindingImplementationToday',
  'workerDispatchToday',
  'mediaOpenToday',
  'persistenceToday',
])
for (const rejected of ['rawPromptText', 'signedUrls', 'serviceRolePayloads', 'secretValues', 'publicArtifactUrls']) {
  assert(parsed.target.rejectedRuntimeInputSources.includes(rejected), `target rejected ${rejected}`)
}

assert(parsed.contract.contractMap.contractType === 'SoundCpuPrivateManifestPersistenceContract', 'contract type')
assert(parsed.contract.contractMap.resultType === 'SoundCpuPrivateManifestPersistenceResult', 'contract result')
assert(parsed.contract.futureBindingSteps.includes('return_blocked_by_owner_gate_without_side_effects'), 'contract fail closed')
for (const forbidden of ['call_supabase_client', 'run_sql', 'create_storage_object', 'create_signed_url', 'open_media_file', 'dispatch_worker']) {
  assert(parsed.contract.forbiddenBindingSteps.includes(forbidden), `contract forbidden ${forbidden}`)
}

assert(parsed.ownerGates.bindingPlanMayProceedToOwnerReview === true, 'owner gate owner review')
assert(parsed.ownerGates.ownerGates.WORKER_RUNTIME_JOBS.runtimeBindingPlanOwnerReviewRequired === true, 'worker owner review')
assert(parsed.ownerGates.ownerGates.SUPABASE_RLS_STORAGE_DATABASE.sqlExecutionToday === false, 'supabase sql')
assert(parsed.ownerGates.ownerGates.TRACK_B_MEDIA_PROCESSING.mediaOpenToday === false, 'media open')
assert(parsed.ownerGates.ownerGates.PRODUCT_BETA_READINESS.externalAgentExecutionReadyToday === false, 'external execution')

for (const [key, value] of Object.entries(parsed.blockers.blockersPreserved)) {
  assert(value === true, `blockers.${key} must be true`)
}
assert(parsed.blockers.recommendedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE100-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-BINDING-OWNER-REVIEW', 'blocker next prompt')

assert(parsed.policy.allowedClaims.runtimeBindingPlanCreated === true, 'policy plan')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tools')
for (const [key, value] of Object.entries(parsed.policy.forbiddenClaims)) {
  assert(value === false, `policy.forbiddenClaims.${key} must be false`)
}
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next required source')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assert(parsed.next.reviewScope.reviewRuntimeBindingPlanOnly === true, 'next review only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.reviewScope, 'next.reviewScope', [
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

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts[
    'worker-runtime-jobs:sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan-diagnostics.mjs',
  'package script missing',
)

const result = {
  ok: true,
  decision,
  sourcePr: 2023,
  sourceHead,
  sourceMergeCommit,
  sourcePath,
  runtimeBindingPlanCreated: true,
  runtimeBindingImplementationToday: false,
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
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE100-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-BINDING-OWNER-REVIEW',
}

console.log(JSON.stringify(result, null, 2))
