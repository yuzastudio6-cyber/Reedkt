import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase103_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_plan_completed_with_warnings_ready_for_contract_source_gate_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase104_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_gate_completed_with_warnings_ready_for_contract_source_owner_review_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase104_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_owner_review_passed_with_warnings_ready_for_controlled_contract_import_plan_no_execution'
const planSourceHead = '697d4853f2e9f2900ac1d63d735f40b75a58b176'
const planSourceMergeCommit = '537f9174f03541b23b6ac7d0063fa6521a3c4e47'
const gateSourceHead = '15d365f628c895edf1e41260a68afb122a6c750c'
const gateSourceMergeCommit = '8afe0ed00eb4dd1443d32e6e30792ee5bcebbb7a'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts'
const bindingPath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-result.md',
  sourceTarget:
    'docs/worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-target-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate-result.md',
  surface:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-surface-register.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-safety-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review.md',
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

function assertFalseFields(record, label, fields) {
  for (const field of fields) assertFalse(record[field], `${label}.${field}`)
}

function assertNoOpClassification(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowExternalAgentExecutionToday',
    'allowWorkerDispatchToday',
    'externalAgentExecutionMayProceed',
    'workerDispatchMayProceed',
    'manifestPersistenceMayProceed',
    'supabaseMutationMayProceed',
    'sqlExecutionMayProceed',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'openMediaFileToday',
    'unlockBetaToday',
    'unlockProductionToday',
    'externalAgentExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-result',
  ),
  sourceTarget: parseJsonBlock(
    docs.sourceTarget,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-target-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate-result',
  ),
  surface: parseJsonBlock(
    docs.surface,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-surface-register',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-safety-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const source = read(sourcePath)
const binding = read(bindingPath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE',
  'createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult',
  'getSoundCpuPrivateManifestPersistenceRuntimeExecutionContractSourceGate',
  'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult(input, blockedReason)',
  'acceptedForExternalAgentExecutionToday: false',
  'acceptedForRuntimeExecutionToday: false',
  'acceptedForPersistenceToday: false',
  'acceptedForStorageObjectCreationToday: false',
  'acceptedForSignedUrlCreationToday: false',
  'acceptedForWorkerDispatchToday: false',
  'acceptedForMediaOpenToday: false',
]) {
  assert(source.includes(snippet), `source missing ${snippet}`)
}
for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from', 'createSignedUrl', 'fs.readFile', 'fetch(', 'dispatch', 'executeRoute']) {
  assert(!source.includes(forbidden), `source contains forbidden ${forbidden}`)
}
assert(binding.includes('createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult'), 'binding source remains available')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt required source')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision')
assert(parsed.prompt.sourceGateScope.createFailClosedContractSourceOnly === true, 'prompt source only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.sourceGateScope, 'prompt.sourceGateScope', [
  'allowExternalAgentExecutionToday',
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2032, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === planSourceHead, 'source result source head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === planSourceMergeCommit, 'source result source merge')
assert(parsed.sourceResult.contractSourcePlan.plannedSourcePath === sourcePath, 'source result planned path')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source result tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source result execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')
assert(parsed.sourceTarget.sourceTarget.pathCreatedToday === false, 'source target not created earlier')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2033, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === gateSourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === gateSourceMergeCommit, 'result source merge')
assert(parsed.result.sourceGate.sourceCreated === true, 'result source created')
assert(parsed.result.sourceGate.sourcePath === sourcePath, 'result source path')
assert(parsed.result.sourceGate.blockedResultExport === 'createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult', 'result blocked export')
assert(parsed.result.sourceGate.delegatesTo === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'result delegate')
assert(parsed.result.sourceGate.requiredStatus === 'blocked_by_owner_gate', 'result status')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.sourceGate, 'result.sourceGate', [
  'allowExternalAgentExecutionToday',
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

assert(parsed.surface.sourceSurface.path === sourcePath, 'surface path')
assert(parsed.surface.sourceSurface.importsOnlyFrom.length === 1, 'surface imports count')
assert(parsed.surface.sourceSurface.blockedResultFunctionDelegatesTo === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'surface delegate')
assert(parsed.surface.sourceSurface.acceptedForRuntimeExecutionToday === false, 'surface runtime closed')

assert(parsed.safety.sourceSafety.delegatesToBlockedResult === true, 'safety blocked delegate')
assert(parsed.safety.sourceSafety.importsSupabaseClient === false, 'safety supabase')
assert(parsed.safety.sourceSafety.dispatchesWorkers === false, 'safety workers')
assertFalseFields(parsed.safety.unsafeClaimsToday, 'safety.unsafeClaimsToday', [
  'externalAgentExecutionReadyClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'realUserMediaBetaReadyClaimed',
  'productionReadinessClaimed',
])

assert(parsed.readiness.readinessForNextGate.contractSourceOwnerReviewMayProceed === true, 'readiness owner review')
assertFalseFields(parsed.readiness.readinessForNextGate, 'readiness.readinessForNextGate', [
  'externalAgentExecutionMayProceed',
  'workerDispatchMayProceed',
  'manifestPersistenceMayProceed',
  'supabaseMutationMayProceed',
  'sqlExecutionMayProceed',
  'realUserMediaBetaMayProceed',
  'productionMayProceed',
])

assert(parsed.blockers.blockers.length === 7, 'blocker count')
assert(parsed.blockers.blockedToday.externalAgentExecution === true, 'blocker external closed')
assert(parsed.blockers.blockedToday.supabaseMutation === true, 'blocker supabase closed')

assert(parsed.policy.allowedClaims.failClosedContractSourceCreated === true, 'policy source claim')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
assertFalseFields(parsed.policy.forbiddenClaims, 'policy.forbiddenClaims', [
  'externalAgentExecutionReadyClaimed',
  'workerDispatchReadyClaimed',
  'runtimeReadinessClaimed',
  'workerReadinessClaimed',
  'generatedLocalFixturePassedClaimed',
  'dryRunPassedClaimed',
  'manifestPersistedClaimed',
  'storageObjectCreatedClaimed',
  'signedUrlCreatedClaimed',
  'realUserMediaBetaReadyClaimed',
  'productionReadinessClaimed',
])

assert(parsed.next.requiredSourceDecision === decision, 'next source decision')
assert(parsed.next.expectedDecision === nextDecision, 'next expected decision')
assert(parsed.next.reviewScope.reviewFailClosedContractSourceOnly === true, 'next review only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.reviewScope, 'next.reviewScope', [
  'allowExternalAgentExecutionToday',
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
      sourcePr: 2033,
      sourceMergeCommit: gateSourceMergeCommit,
      sourcePath,
      failClosedSourceCreated: parsed.result.sourceGate.sourceCreated,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE104-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
