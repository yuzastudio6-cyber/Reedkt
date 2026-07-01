import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase101_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_source_gate_completed_with_warnings_ready_for_source_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase101_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_source_owner_review_passed_with_warnings_ready_for_runtime_execution_contract_plan_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase102_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_plan_completed_with_warnings_ready_for_contract_owner_review_no_execution'
const sourceHead = '0eddbace33c32ba89a0bd495eac05eefb1879987'
const sourceMergeCommit = '226492d1d6163dc5ffa9cf43376ff05d6d3f1cce'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate-result.md',
  sourceSurface:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-surface-register.md',
  sourceSafety:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-safety-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-evidence-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-plan.md',
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
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-gate-result',
  ),
  sourceSurface: parseJsonBlock(
    docs.sourceSurface,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-surface-register',
  ),
  sourceSafety: parseJsonBlock(
    docs.sourceSafety,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-safety-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-evidence-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const source = read(sourcePath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE',
  'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult',
  'getSoundCpuPrivateManifestPersistenceRuntimeBindingSourceGate',
  'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult(input, blockedReason)',
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
assert(parsed.prompt.reviewScope.reviewFailClosedSourceBindingOnly === true, 'prompt review only')
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2025, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '491a0530c24dcf0e15e4218d0c6388170503e546', 'source result merge')
assert(parsed.sourceResult.runtimeBindingSourceGate.failClosedSourceBindingCreated === true, 'source created')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assert(parsed.sourceSurface.sourceSurface.blockedResultFunctionDelegatesTo === 'createSoundCpuPrivateManifestPersistenceStaticIntegrationBlockedResult', 'source delegate')
assert(parsed.sourceSafety.sourceChangeClassification === 'fail_closed_static_runtime_binding_surface_only', 'source safety classification')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2027, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.ownerReview.failClosedRuntimeBindingSourceAccepted === true, 'result source accepted')
assert(parsed.result.ownerReview.runtimeExecutionContractPlanMayProceed === true, 'result contract plan')
assert(parsed.result.ownerReview.sourcePathAccepted === sourcePath, 'result source path')
assert(parsed.result.ownerReview.blockedResultExportAccepted === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'result export')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
  'acceptedForWorkerDispatchToday',
  'acceptedForPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])

assert(parsed.acceptance.acceptedForNextPlanningGateOnly.failClosedRuntimeBindingSourceAccepted === true, 'acceptance source')
assert(parsed.acceptance.acceptedForNextPlanningGateOnly.runtimeExecutionContractPlanMayProceed === true, 'acceptance plan')
assert(parsed.acceptance.acceptedForExecutionToday === 'none', 'acceptance execution')
assert(parsed.evidence.acceptedEvidence.sourcePr === 2027, 'evidence source PR')
assert(parsed.evidence.acceptedEvidence.sourcePathStillFailClosed === true, 'evidence fail closed')
assert(parsed.evidence.validationHandoff.realUserMediaBetaStillBlocked === true, 'evidence beta blocked')
assert(parsed.readiness.readinessForNextPlanningGate.runtimeExecutionContractPlanMayProceed === true, 'readiness plan')
assert(parsed.readiness.readinessForNextPlanningGate.externalAgentExecutionMayProceed === false, 'readiness external')
for (const [key, value] of Object.entries(parsed.blockers.blockersPreserved)) {
  assert(value === true, `blockers.${key} must be true`)
}
assert(parsed.policy.allowedClaims.failClosedRuntimeBindingSourceOwnerReviewed === true, 'policy reviewed')
for (const [key, value] of Object.entries(parsed.policy.forbiddenClaims)) {
  assert(value === false, `policy.forbiddenClaims.${key} must be false`)
}
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next required source')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assert(parsed.next.planningScope.planRuntimeExecutionContractOnly === true, 'next plan only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.planningScope, 'next.planningScope', [
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
    'worker-runtime-jobs:sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review-diagnostics.mjs',
  'package script missing',
)

const result = {
  ok: true,
  decision,
  sourcePr: 2027,
  sourceHead,
  sourceMergeCommit,
  sourcePath,
  failClosedRuntimeBindingSourceAccepted: true,
  runtimeExecutionContractPlanMayProceed: true,
  runtimeExecutionReadyToday: false,
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
    'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE102-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-PLAN',
}

console.log(JSON.stringify(result, null, 2))
