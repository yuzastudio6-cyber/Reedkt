import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase102_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_owner_review_passed_with_warnings_ready_for_contract_source_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase103_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_plan_completed_with_warnings_ready_for_contract_source_gate_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase104_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_gate_completed_with_warnings_ready_for_contract_source_owner_review_no_execution'
const ownerReviewSourceHead = 'c787aadf7ed4f3a54998399d83038fdaf9128d57'
const ownerReviewSourceMergeCommit = 'f88373d45859ca7d42586f541c34d4c244636d54'
const sourcePlanSourceHead = '697d4853f2e9f2900ac1d63d735f40b75a58b176'
const sourcePlanSourceMergeCommit = '537f9174f03541b23b6ac7d0063fa6521a3c4e47'
const existingSourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'
const plannedSourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-acceptance-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-result.md',
  target:
    'docs/worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-target-register.md',
  shape:
    'docs/worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-shape-register.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-safety-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate.md',
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
    'createSourceFileToday',
    'sourceCreated',
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
    'sourceFileCreatedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-acceptance-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-result',
  ),
  target: parseJsonBlock(
    docs.target,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-target-register',
  ),
  shape: parseJsonBlock(
    docs.shape,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-shape-register',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-safety-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase104-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-gate',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const existingSource = read(existingSourcePath)
assert(existingSource.includes('createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult'), 'existing source has fail-closed binding')
assert(existingSource.includes('SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE'), 'existing source has gate')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt required source')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision')
assert(parsed.prompt.planningScope.planContractSourceOnly === true, 'prompt planning only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.planningScope, 'prompt.planningScope', [
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2030, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === ownerReviewSourceHead, 'source result source head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === ownerReviewSourceMergeCommit, 'source result source merge')
assert(parsed.sourceResult.ownerReview.contractSourcePlanMayProceed === true, 'source allows source plan')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceAcceptance.acceptedForToday.contractSourcePlanning === true, 'source acceptance planning')
assertFalseFields(parsed.sourceAcceptance.acceptedForToday, 'sourceAcceptance.acceptedForToday', [
  'externalAgentExecution',
  'workerDispatch',
  'manifestPersistence',
  'storageObjectCreation',
  'signedUrlCreation',
  'mediaOpen',
  'supabaseMutation',
  'sqlExecution',
])

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2032, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourcePlanSourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourcePlanSourceMergeCommit, 'result source merge')
assert(parsed.result.contractSourcePlan.sourcePlanCreated === true, 'result source plan')
assert(parsed.result.contractSourcePlan.plannedSourcePath === plannedSourcePath, 'result planned path')
assert(parsed.result.contractSourcePlan.plannedAdapterDelegatesTo === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'result delegation')
assert(parsed.result.contractSourcePlan.plannedResultStatus === 'blocked_by_owner_gate', 'result status')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.contractSourcePlan, 'result.contractSourcePlan', [
  'createSourceFileToday',
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

assert(parsed.target.sourceTarget.plannedPath === plannedSourcePath, 'target planned path')
assert(parsed.target.sourceTarget.pathCreatedToday === false, 'target not created')
assert(parsed.target.sourceTarget.plannedExports.includes('createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult'), 'target export')
assert(parsed.target.sourceTarget.forbiddenImports.includes('Supabase client'), 'target forbidden supabase')

assert(parsed.shape.plannedShape.requiredStatus === 'blocked_by_owner_gate', 'shape status')
assert(parsed.shape.plannedShape.requiredRejectedInputFields.includes('rawPromptText'), 'shape rejects raw prompt')
assert(parsed.shape.plannedShape.requiredRejectedInputFields.includes('signedUrls'), 'shape rejects signed URLs')
assert(parsed.shape.sourceCreationToday.sourceCreated === false, 'shape source not created')
assert(parsed.shape.sourceCreationToday.runtimeExecuted === false, 'shape runtime not executed')

assert(parsed.safety.safetyPolicy.mustDelegateToFailClosedBinding === true, 'safety delegation')
assert(parsed.safety.safetyPolicy.mustNotTouchSupabase === true, 'safety supabase')
assertFalseFields(parsed.safety.unsafeClaimsToday, 'safety.unsafeClaimsToday', [
  'externalAgentExecutionReadyClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'realUserMediaBetaReadyClaimed',
  'productionReadinessClaimed',
])

assert(parsed.readiness.readinessForNextGate.contractSourceGateMayProceed === true, 'readiness next')
assertFalseFields(parsed.readiness.readinessForNextGate, 'readiness.readinessForNextGate', [
  'externalAgentExecutionMayProceed',
  'workerDispatchMayProceed',
  'manifestPersistenceMayProceed',
  'supabaseMutationMayProceed',
  'sqlExecutionMayProceed',
  'realUserMediaBetaMayProceed',
  'productionMayProceed',
])

assert(parsed.blockers.blockers.length === 6, 'blocker count')
assert(parsed.blockers.blockedToday.sourceCreation === true, 'blocker source creation closed')
assert(parsed.blockers.blockedToday.externalAgentExecution === true, 'blocker external execution closed')

assert(parsed.policy.allowedClaims.contractSourcePlanCreated === true, 'policy source plan')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
assertFalseFields(parsed.policy.forbiddenClaims, 'policy.forbiddenClaims', [
  'sourceFileCreatedClaimed',
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
assert(parsed.next.sourceGateScope.createFailClosedContractSourceOnly === true, 'next source only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.sourceGateScope, 'next.sourceGateScope', [
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
      sourcePr: 2032,
      sourceMergeCommit: sourcePlanSourceMergeCommit,
      plannedSourcePath,
      docsChecked: Object.keys(docs).length,
      sourceCreatedToday: parsed.result.contractSourcePlan.createSourceFileToday,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE104-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-SOURCE-GATE',
    },
    null,
    2,
  ),
)
