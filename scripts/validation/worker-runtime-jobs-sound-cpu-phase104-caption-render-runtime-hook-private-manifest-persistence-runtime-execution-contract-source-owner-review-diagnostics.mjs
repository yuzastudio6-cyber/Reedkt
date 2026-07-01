import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase104_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_gate_completed_with_warnings_ready_for_contract_source_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase104_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_owner_review_passed_with_warnings_ready_for_controlled_contract_import_plan_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase105_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_plan_completed_with_warnings_ready_for_controlled_import_owner_review_no_execution'
const sourceHead = '477f0568f49b7d8ec27cccd6a1e4ea888806e536'
const sourceMergeCommit = 'e3f2801cf2ff81c5e690dd05232a7fea54640ef4'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate-result.md',
  sourceSurface:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-surface-register.md',
  sourceSafety:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-safety-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-evidence-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-controlled-import-plan-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-plan.md',
}

function read(file) {
  const full = path.join(process.cwd(), file)
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
    'allowRuntimeImportToday',
    'allowExternalAgentExecutionToday',
    'allowWorkerDispatchToday',
    'runtimeImportMayProceedToday',
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
    'runtimeImportReadyClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate-result',
  ),
  sourceSurface: parseJsonBlock(
    docs.sourceSurface,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-surface-register',
  ),
  sourceSafety: parseJsonBlock(
    docs.sourceSafety,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-safety-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-evidence-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-controlled-import-plan-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const source = read(sourcePath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE',
  'createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult',
  'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult(input, blockedReason)',
  'acceptedForExternalAgentExecutionToday: false',
  'acceptedForRuntimeExecutionToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(source.includes(snippet), `source missing ${snippet}`)
}
for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from', 'createSignedUrl', 'fs.readFile', 'fetch(', 'dispatch', 'executeRoute']) {
  assert(!source.includes(forbidden), `source contains forbidden ${forbidden}`)
}

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt required source')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision')
assert(parsed.prompt.reviewScope.reviewFailClosedContractSourceOnly === true, 'prompt review only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.reviewScope, 'prompt.reviewScope', [
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2033, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === '15d365f628c895edf1e41260a68afb122a6c750c', 'source result source head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '8afe0ed00eb4dd1443d32e6e30792ee5bcebbb7a', 'source result source merge')
assert(parsed.sourceResult.sourceGate.sourceCreated === true, 'source created')
assert(parsed.sourceResult.sourceGate.sourcePath === sourcePath, 'source path')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceSurface.sourceSurface.blockedResultFunctionDelegatesTo === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'source surface delegate')
assert(parsed.sourceSafety.sourceSafety.delegatesToBlockedResult === true, 'source safety delegate')
assert(parsed.sourceSafety.sourceSafety.dispatchesWorkers === false, 'source safety dispatch')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2034, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.ownerReview.failClosedContractSourceAccepted === true, 'result source accepted')
assert(parsed.result.ownerReview.controlledContractImportPlanMayProceed === true, 'result import plan')
assert(parsed.result.ownerReview.sourcePathAccepted === sourcePath, 'result source path')
assert(parsed.result.ownerReview.blockedResultExportAccepted === 'createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult', 'result export')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
  'acceptedForExternalAgentExecutionToday',
  'acceptedForRuntimeExecutionToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])

assert(parsed.acceptance.acceptedSource.safeForControlledImportPlanning === true, 'acceptance controlled import')
assertFalseFields(parsed.acceptance.acceptedForToday, 'acceptance.acceptedForToday', [
  'runtimeImport',
  'externalAgentExecution',
  'workerDispatch',
  'manifestPersistence',
  'storageObjectCreation',
  'signedUrlCreation',
  'mediaOpen',
  'supabaseMutation',
  'sqlExecution',
])

assert(parsed.evidence.sourceEvidence.sourcePr === 2034, 'evidence source PR')
assert(parsed.evidence.validationHandoff.phase104DiagnosticsPassed === true, 'evidence phase104 diagnostics')
assert(parsed.evidence.validationHandoff.phase103DiagnosticsPassedAfterSourceCreation === true, 'evidence phase103 durability')
assert(parsed.evidence.validationHandoff.packageLockChanged === false, 'evidence lock unchanged')

assert(parsed.readiness.readinessForNextPlanningGate.controlledContractImportPlanMayProceed === true, 'readiness import plan')
assertFalseFields(parsed.readiness.readinessForNextPlanningGate, 'readiness.readinessForNextPlanningGate', [
  'runtimeImportMayProceedToday',
  'externalAgentExecutionMayProceed',
  'workerDispatchMayProceed',
  'manifestPersistenceMayProceed',
  'supabaseMutationMayProceed',
  'sqlExecutionMayProceed',
  'realUserMediaBetaMayProceed',
  'productionMayProceed',
])

assert(parsed.blockers.blockers.length === 8, 'blocker count')
assert(parsed.blockers.blockedToday.runtimeImport === true, 'blocker runtime import closed')
assert(parsed.blockers.blockedToday.externalAgentExecution === true, 'blocker external closed')

assert(parsed.policy.allowedClaims.failClosedContractSourceAccepted === true, 'policy source accepted')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
assertFalseFields(parsed.policy.forbiddenClaims, 'policy.forbiddenClaims', [
  'runtimeImportReadyClaimed',
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
assert(parsed.next.planningScope.planControlledImportOnly === true, 'next planning only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.planningScope, 'next.planningScope', [
  'allowRuntimeImportToday',
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
      sourcePr: 2034,
      sourceMergeCommit,
      sourcePath,
      controlledContractImportPlanMayProceed: true,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE105-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-CONTROLLED-IMPORT-PLAN',
    },
    null,
    2,
  ),
)
