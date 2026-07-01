import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase105_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_plan_completed_with_warnings_ready_for_controlled_import_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase105_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_owner_review_passed_with_warnings_ready_for_controlled_import_proof_runner_source_plan_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_plan_completed_with_warnings_ready_for_controlled_import_proof_runner_source_gate_no_execution'
const sourceMergeCommit = '890f2cf845ba52f2d65debc15e61b48d244b0bcf'
const sourceHead = '763d692eeabe0fec769920d43428025e2ffdd4c9'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts'
const proofRunnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner.mjs'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-plan-result.md',
  sourceTarget:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-target-register.md',
  sourceProofPlan:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-plan.md',
  sourceSafety:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-safety-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-evidence-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-runner-source-plan-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan.md',
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
    'runProofToday',
    'importModuleToday',
    'callFactoryToday',
    'dispatchWorkersToday',
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
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-plan-result',
  ),
  sourceTarget: parseJsonBlock(
    docs.sourceTarget,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-target-register',
  ),
  sourceProofPlan: parseJsonBlock(
    docs.sourceProofPlan,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-plan',
  ),
  sourceSafety: parseJsonBlock(
    docs.sourceSafety,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-safety-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-evidence-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-runner-source-plan-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan',
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
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(source.includes(snippet), `source missing ${snippet}`)
}
for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from', 'createSignedUrl', 'fs.readFile', 'fetch(', 'dispatch', 'executeRoute']) {
  assert(!source.includes(forbidden), `source contains forbidden ${forbidden}`)
}

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt required source')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision')
assert(parsed.prompt.reviewScope.reviewControlledImportPlanOnly === true, 'prompt review only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.reviewScope, 'prompt.reviewScope', [
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2035, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === '245b665c4af6eeb12db5786983a690ca9072152b', 'source result source head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '9ea3aa836c31762f6825ee1b32a056937eefc2e1', 'source result source merge')
assert(parsed.sourceResult.controlledImportPlan.planCreated === true, 'source plan created')
assert(parsed.sourceResult.controlledImportPlan.sourcePath === sourcePath, 'source path')
assert(parsed.sourceResult.controlledImportPlan.plannedProofRunnerPath === proofRunnerPath, 'source proof path')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceTarget.importTarget.runtimeDirectoryHasBarrelIndex === false, 'source target barrel')
assert(parsed.sourceTarget.importTarget.runtimeImportTargetToday === 'none', 'source target runtime import')
assert(parsed.sourceProofPlan.futureProofPlan.proofMayBePlannedAfterOwnerReview === true, 'source proof future')
assert(parsed.sourceProofPlan.futureProofPlan.proofMayRunToday === false, 'source proof today')
assert(parsed.sourceSafety.safetyPlan.importMustBeValidationOnly === true, 'source safety validation')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2038, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.ownerReview.controlledImportPlanAccepted === true, 'result owner accepts plan')
assert(parsed.result.ownerReview.controlledImportProofRunnerSourcePlanMayProceed === true, 'result next source plan')
assert(parsed.result.ownerReview.acceptedSourcePath === sourcePath, 'result accepted path')
assert(parsed.result.ownerReview.acceptedFutureProofRunnerPath === proofRunnerPath, 'result proof runner path')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
  'acceptedForRuntimeImportToday',
  'acceptedForControlledImportProofToday',
  'acceptedForExternalAgentExecutionToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForManifestPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])

assert(parsed.acceptance.acceptedForNextGatePlanning.controlledImportProofRunnerSourcePlan === true, 'acceptance source plan')
assert(parsed.acceptance.acceptedForNextGatePlanning.controlledImportProofRunnerPath === proofRunnerPath, 'acceptance proof path')
assertFalseFields(parsed.acceptance.notAcceptedForToday, 'acceptance.notAcceptedForToday', [
  'runtimeImport',
  'controlledImportProof',
  'externalAgentExecution',
  'workerDispatch',
  'manifestPersistence',
  'storageObjectCreation',
  'signedUrlCreation',
  'mediaOpen',
  'supabaseMutation',
  'sqlExecution',
])

assert(parsed.evidence.sourceEvidence.phase105PlanPr === 2038, 'evidence source PR')
assert(parsed.evidence.sourceEvidence.phase105PlanMergeCommit === sourceMergeCommit, 'evidence source merge')
assert(parsed.evidence.acceptedEvidence.controlledImportPlanCreated === true, 'evidence plan created')
assert(parsed.evidence.acceptedEvidence.runtimeImportRanToday === false, 'evidence no runtime import')
assert(parsed.evidence.acceptedEvidence.packageLockUnchanged === true, 'evidence lock')
assert(parsed.evidence.validationHandoff.phase105PlanDiagnosticsPassed === true, 'evidence phase105 diagnostics')

assert(parsed.readiness.readinessForNextPlanningGate.controlledImportProofRunnerSourcePlanMayProceed === true, 'readiness source plan')
assert(parsed.readiness.readinessForNextPlanningGate.proofRunnerSourceMayBePlanned === true, 'readiness proof source')
assertFalseFields(parsed.readiness.readinessForNextPlanningGate, 'readiness.readinessForNextPlanningGate', [
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

assert(parsed.blockers.remainingBlockers.length === 8, 'blocker count')
assert(parsed.blockers.blockedToday.runtimeImport === true, 'blocker runtime import closed')
assert(parsed.blockers.blockedToday.controlledImportProof === true, 'blocker import proof closed')
assert(parsed.blockers.blockedToday.externalAgentExecution === true, 'blocker external closed')

assert(parsed.policy.allowedClaims.proofRunnerSourcePlanMayProceed === true, 'policy next source plan')
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

assert(parsed.next.requiredSourceDecision === decision, 'next source')
assert(parsed.next.expectedDecision === nextDecision, 'next decision')
assert(parsed.next.plannedProofRunner.path === proofRunnerPath, 'next proof runner path')
assert(parsed.next.plannedProofRunner.nodeBuiltInsOnly === true, 'next built-ins only')
assert(parsed.next.plannedProofRunner.proofRunnerSourceOnly === true, 'next source only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.plannedProofRunner, 'next.plannedProofRunner', [
  'runProofToday',
  'importModuleToday',
  'callFactoryToday',
  'dispatchWorkersToday',
])
assertFalseFields(parsed.next.scope, 'next.scope', [
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
      sourcePr: 2038,
      sourceMergeCommit,
      controlledImportPlanAccepted: true,
      proofRunnerSourcePlanMayProceed: true,
      runtimeImportRanToday: false,
      controlledImportProofRanToday: false,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE106-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-CONTROLLED-IMPORT-PROOF-RUNNER-SOURCE-PLAN',
    },
    null,
    2,
  ),
)
