import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase104_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_owner_review_passed_with_warnings_ready_for_controlled_contract_import_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase105_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_plan_completed_with_warnings_ready_for_controlled_import_owner_review_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase105_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_owner_review_passed_with_warnings_ready_for_controlled_import_proof_runner_source_plan_no_execution'
const sourceHead = '245b665c4af6eeb12db5786983a690ca9072152b'
const sourceMergeCommit = '9ea3aa836c31762f6825ee1b32a056937eefc2e1'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-acceptance-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-plan-result.md',
  target:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-target-register.md',
  proofPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-plan.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-safety-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-controlled-import-owner-review-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-review.md',
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
    'allowRuntimeImportToday',
    'allowExternalAgentExecutionToday',
    'allowWorkerDispatchToday',
    'proofMayRunToday',
    'runtimeImportRan',
    'moduleImported',
    'factoryCalled',
    'workerDispatched',
    'supabaseTouched',
    'controlledImportProofMayRunToday',
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
    'runtimeImportRanClaimed',
    'controlledImportProofPassedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-owner-acceptance-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-plan-result',
  ),
  target: parseJsonBlock(
    docs.target,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-target-register',
  ),
  proofPlan: parseJsonBlock(
    docs.proofPlan,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-plan',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-safety-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-controlled-import-owner-review-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const source = read(sourcePath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE',
  'createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult',
  'getSoundCpuPrivateManifestPersistenceRuntimeExecutionContractSourceGate',
  'acceptedForExternalAgentExecutionToday: false',
  'acceptedForRuntimeExecutionToday: false',
]) {
  assert(source.includes(snippet), `source missing ${snippet}`)
}
for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from', 'createSignedUrl', 'fs.readFile', 'fetch(', 'dispatch', 'executeRoute']) {
  assert(!source.includes(forbidden), `source contains forbidden ${forbidden}`)
}

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt required source')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision')
assert(parsed.prompt.planningScope.planControlledImportOnly === true, 'prompt planning only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.planningScope, 'prompt.planningScope', [
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

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2034, 'source result PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === '477f0568f49b7d8ec27cccd6a1e4ea888806e536', 'source result source head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'e3f2801cf2ff81c5e690dd05232a7fea54640ef4', 'source result source merge')
assert(parsed.sourceResult.ownerReview.controlledContractImportPlanMayProceed === true, 'source allows import plan')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')
assert(parsed.sourceAcceptance.acceptedForToday.controlledImportPlanning === true, 'source acceptance import planning')
assert(parsed.sourceAcceptance.acceptedForToday.runtimeImport === false, 'source runtime import closed')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2035, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.controlledImportPlan.planCreated === true, 'result plan created')
assert(parsed.result.controlledImportPlan.sourcePath === sourcePath, 'result source path')
assert(parsed.result.controlledImportPlan.plannedImportMode === 'dynamic_import_export_shape_and_fail_closed_gate_inspection_only', 'result import mode')
assert(parsed.result.controlledImportPlan.plannedImportedExports.includes('createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult'), 'result import export')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.controlledImportPlan, 'result.controlledImportPlan', [
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

assert(parsed.target.importTarget.runtimeDirectoryHasBarrelIndex === false, 'target barrel index')
assert(parsed.target.importTarget.runtimeImportTargetToday === 'none', 'target no runtime import')
assert(parsed.target.importTarget.plannedImportMustInspectExportsOnly === true, 'target inspect only')
assert(parsed.target.importTarget.plannedImportMustNotDispatchWorkers === true, 'target no dispatch')

assert(parsed.proofPlan.futureProofPlan.proofMayBePlannedAfterOwnerReview === true, 'proof plan after review')
assert(parsed.proofPlan.futureProofPlan.proofMayRunToday === false, 'proof not today')
assert(parsed.proofPlan.today.runtimeImportRan === false, 'today no import')
assert(parsed.proofPlan.today.moduleImported === false, 'today no module import')
assert(parsed.proofPlan.today.factoryCalled === false, 'today no factory call')

assert(parsed.safety.safetyPlan.importMustBeValidationOnly === true, 'safety validation only')
assert(parsed.safety.safetyPlan.importMustNotTouchSupabase === true, 'safety no supabase')
assertFalseFields(parsed.safety.unsafeClaimsToday, 'safety.unsafeClaimsToday', [
  'runtimeImportReadyClaimed',
  'externalAgentExecutionReadyClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'realUserMediaBetaReadyClaimed',
  'productionReadinessClaimed',
])

assert(parsed.readiness.readinessForNextGate.controlledImportOwnerReviewMayProceed === true, 'readiness owner review')
assertFalseFields(parsed.readiness.readinessForNextGate, 'readiness.readinessForNextGate', [
  'controlledImportProofMayRunToday',
  'runtimeImportMayProceedToday',
  'externalAgentExecutionMayProceed',
  'workerDispatchMayProceed',
  'manifestPersistenceMayProceed',
  'supabaseMutationMayProceed',
  'sqlExecutionMayProceed',
  'realUserMediaBetaMayProceed',
  'productionMayProceed',
])

assert(parsed.blockers.blockers.length === 7, 'blocker count')
assert(parsed.blockers.blockedToday.runtimeImport === true, 'blocker runtime import')
assert(parsed.blockers.blockedToday.controlledImportProof === true, 'blocker proof')

assert(parsed.policy.allowedClaims.controlledImportPlanCreated === true, 'policy plan')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
assertFalseFields(parsed.policy.forbiddenClaims, 'policy.forbiddenClaims', [
  'runtimeImportRanClaimed',
  'controlledImportProofPassedClaimed',
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
assert(parsed.next.reviewScope.reviewControlledImportPlanOnly === true, 'next review only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.reviewScope, 'next.reviewScope', [
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
      sourcePr: 2035,
      sourceMergeCommit,
      sourcePath,
      controlledImportPlanCreated: parsed.result.controlledImportPlan.planCreated,
      runtimeImportRanToday: parsed.proofPlan.today.runtimeImportRan,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE105-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-CONTROLLED-IMPORT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
