import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase99_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_plan_completed_with_warnings_ready_for_runtime_binding_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase100_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_owner_review_passed_with_warnings_ready_for_runtime_binding_source_gate_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase101_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_source_gate_completed_with_warnings_ready_for_source_owner_review_no_execution'
const sourceHead = '152ef01f5206a8c083832ca044c45724f122ede4'
const sourceMergeCommit = 'a78e78198e04a0c0df8097654b47d42e99c930eb'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan-result.md',
  sourceTarget:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-target-register.md',
  sourceContract:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-contract-map.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-evidence-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate.md',
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
    'acceptedForWorkerDispatchToday',
    'acceptedForPersistenceToday',
    'acceptedForStorageObjectCreationToday',
    'acceptedForSignedUrlCreationToday',
    'acceptedForMediaOpenToday',
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
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-plan-result',
  ),
  sourceTarget: parseJsonBlock(
    docs.sourceTarget,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-target-register',
  ),
  sourceContract: parseJsonBlock(
    docs.sourceContract,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-contract-map',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase99-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-evidence-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate',
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
assert(parsed.prompt.reviewScope.reviewRuntimeBindingPlanOnly === true, 'prompt review only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.reviewScope, 'prompt.reviewScope', [
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2023, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '5707295620229a2f7ba08c83a1781823be1e242f', 'source result source merge')
assert(parsed.sourceResult.runtimeBindingPlan.planCreated === true, 'source plan')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assert(parsed.sourceTarget.bindingTarget.requiredAdapter === 'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult', 'source target adapter')
assert(parsed.sourceContract.futureBindingSteps.includes('return_blocked_by_owner_gate_without_side_effects'), 'source contract fail closed')
assert(parsed.sourcePolicy.allowedClaims.runtimeBindingPlanMayProceedToOwnerReview === true, 'source policy owner review')
assertNoOpClassification(parsed.sourcePolicy.supabaseClassification, 'sourcePolicy.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2024, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision')
assert(parsed.result.ownerReview.runtimeBindingPlanAccepted === true, 'result plan accepted')
assert(parsed.result.ownerReview.runtimeBindingSourceGateMayProceed === true, 'result source gate')
assert(parsed.result.ownerReview.acceptedSourcePath === sourcePath, 'result source path')
assert(parsed.result.ownerReview.acceptedAdapter === 'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult', 'result adapter')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
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

assert(parsed.acceptance.acceptedForNextSourceGateOnly.runtimeBindingPlanAccepted === true, 'acceptance plan')
assert(parsed.acceptance.acceptedForNextSourceGateOnly.runtimeBindingSourceGateMayProceed === true, 'acceptance source gate')
assert(parsed.acceptance.acceptedForNextSourceGateOnly.sourcePath === sourcePath, 'acceptance source path')
assert(parsed.acceptance.acceptedForExecutionToday === 'none', 'acceptance execution today')
assertFalseFields(parsed.acceptance.acceptedForNextSourceGateOnly, 'acceptance.acceptedForNextSourceGateOnly', [
  'acceptedForWorkerDispatchToday',
  'acceptedForPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])

assert(parsed.evidence.acceptedEvidence.sourcePr === 2024, 'evidence source PR')
assert(parsed.evidence.acceptedEvidence.sourceMergeCommit === sourceMergeCommit, 'evidence source merge')
assert(parsed.evidence.acceptedEvidence.phase99PlanResultPresent === true, 'evidence phase99 result')
assert(parsed.evidence.acceptedEvidence.sourcePathStillFailClosed === true, 'evidence source fail closed')
assert(parsed.evidence.acceptedEvidence.forbiddenPersistenceCallsAbsent === true, 'evidence forbidden calls')
assert(parsed.evidence.validationHandoff.phase99DiagnosticsPassed === true, 'evidence diagnostics')
assert(parsed.evidence.validationHandoff.productionReadinessStillBlocked === true, 'evidence prod blocked')

assert(parsed.readiness.readinessForNextSourceGate.runtimeBindingSourceGateMayProceed === true, 'readiness source gate')
assert(parsed.readiness.readinessForNextSourceGate.allowedFutureSourcePath === sourcePath, 'readiness source path')
assert(parsed.readiness.readinessForNextSourceGate.runtimeBindingImplementationMayProceedToday === false, 'readiness implementation')
assert(parsed.readiness.readinessForNextSourceGate.externalAgentExecutionMayProceed === false, 'readiness external execution')

for (const [key, value] of Object.entries(parsed.blockers.blockersPreserved)) {
  assert(value === true, `blockers.${key} must be true`)
}
assert(parsed.blockers.recommendedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE101-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-BINDING-SOURCE-GATE', 'blocker next prompt')

assert(parsed.policy.allowedClaims.runtimeBindingPlanOwnerReviewed === true, 'policy owner reviewed')
assert(parsed.policy.allowedClaims.runtimeBindingSourceGateMayProceed === true, 'policy source gate')
assert(parsed.policy.allowedClaims.soundCpuToolsCovered === 15, 'policy tools')
for (const [key, value] of Object.entries(parsed.policy.forbiddenClaims)) {
  assert(value === false, `policy.forbiddenClaims.${key} must be false`)
}
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next required source')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assert(parsed.next.sourceGateScope.allowFailClosedSourceBindingOnly === true, 'next fail closed only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
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

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts[
    'worker-runtime-jobs:sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase100-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-owner-review-diagnostics.mjs',
  'package script missing',
)

const result = {
  ok: true,
  decision,
  sourcePr: 2024,
  sourceHead,
  sourceMergeCommit,
  sourcePath,
  runtimeBindingPlanAccepted: true,
  runtimeBindingSourceGateMayProceed: true,
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
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE101-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-BINDING-SOURCE-GATE',
}

console.log(JSON.stringify(result, null, 2))
