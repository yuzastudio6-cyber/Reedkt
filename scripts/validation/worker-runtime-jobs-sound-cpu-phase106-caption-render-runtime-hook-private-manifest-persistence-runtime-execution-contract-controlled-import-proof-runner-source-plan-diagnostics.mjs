import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase105_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_owner_review_passed_with_warnings_ready_for_controlled_import_proof_runner_source_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_plan_completed_with_warnings_ready_for_controlled_import_proof_runner_source_gate_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_gate_completed_with_warnings_ready_for_controlled_import_proof_runner_source_owner_review_no_execution'
const sourceHead = 'e25d0f28079dcce12c25dd694a212a9fc80bfdae'
const sourceMergeCommit = 'c0dccf8bd12f3b37a8a830b156d56210344261ac'
const planHead = '763d692eeabe0fec769920d43428025e2ffdd4c9'
const planMergeCommit = '890f2cf845ba52f2d65debc15e61b48d244b0bcf'
const targetSourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts'
const proofRunnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner.mjs'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-acceptance-register.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-runner-source-plan-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan-result.md',
  design:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-design-register.md',
  staticScan:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-static-scan-plan.md',
  safety:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-safety-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-runner-source-gate-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate.md',
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
    'proofRunnerSourceCreatedClaimed',
    'controlledImportProofPassedClaimed',
    'moduleImportedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-owner-acceptance-register',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase105-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-runner-source-plan-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan-result',
  ),
  design: parseJsonBlock(
    docs.design,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-design-register',
  ),
  staticScan: parseJsonBlock(
    docs.staticScan,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-static-scan-plan',
  ),
  safety: parseJsonBlock(
    docs.safety,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-safety-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-runner-source-gate-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const targetSource = read(targetSourcePath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_EXECUTION_CONTRACT_SOURCE_GATE',
  'createSoundCpuPrivateManifestPersistenceRuntimeExecutionContractBlockedResult',
  'getSoundCpuPrivateManifestPersistenceRuntimeExecutionContractSourceGate',
  'acceptedForExternalAgentExecutionToday: false',
  'acceptedForRuntimeExecutionToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(targetSource.includes(snippet), `target source missing ${snippet}`)
}
for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from', 'createSignedUrl', 'fs.readFile', 'fetch(', 'dispatch', 'executeRoute']) {
  assert(!targetSource.includes(forbidden), `target source contains forbidden ${forbidden}`)
}

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source')
assert(parsed.prompt.expectedDecision === decision, 'prompt decision')
assert(parsed.prompt.plannedProofRunner.path === proofRunnerPath, 'prompt proof path')
assert(parsed.prompt.plannedProofRunner.nodeBuiltInsOnly === true, 'prompt built-ins')
assert(parsed.prompt.plannedProofRunner.proofRunnerSourceOnly === true, 'prompt source only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.plannedProofRunner, 'prompt.plannedProofRunner', [
  'runProofToday',
  'importModuleToday',
  'callFactoryToday',
  'dispatchWorkersToday',
])
assertFalseFields(parsed.prompt.scope, 'prompt.scope', [
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2038, 'source result PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === planHead, 'source result head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === planMergeCommit, 'source result merge')
assert(parsed.sourceResult.ownerReview.controlledImportProofRunnerSourcePlanMayProceed === true, 'source allows source plan')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')
assert(parsed.sourceAcceptance.acceptedForNextGatePlanning.controlledImportProofRunnerSourcePlan === true, 'source acceptance')
assert(parsed.sourceReadiness.readinessForNextPlanningGate.controlledImportProofRunnerSourcePlanMayProceed === true, 'source readiness')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2039, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.sourcePlan.planCreated === true, 'result plan created')
assert(parsed.result.sourcePlan.proofRunnerPath === proofRunnerPath, 'result proof path')
assert(parsed.result.sourcePlan.targetSourcePath === targetSourcePath, 'result target path')
assert(parsed.result.sourcePlan.proofRunnerSourceCreatedInThisPlan === false, 'result source not created')
assert(parsed.result.sourcePlan.nodeBuiltInsOnly === true, 'result built-ins')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.sourcePlan, 'result.sourcePlan', [
  'runProofToday',
  'importModuleToday',
  'callFactoryToday',
  'dispatchWorkersToday',
])

assert(parsed.design.proofRunnerDesign.path === proofRunnerPath, 'design path')
assert(parsed.design.proofRunnerDesign.nodeBuiltInsOnly === true, 'design built-ins')
assert(parsed.design.proofRunnerDesign.usesDynamicImport === true, 'design dynamic import')
assert(parsed.design.proofRunnerDesign.importTarget === targetSourcePath, 'design target')
assert(parsed.design.proofRunnerDesign.plannedChecks.includes('module import resolves'), 'design checks')
assert(parsed.design.proofRunnerDesign.forbiddenInProofRunnerSourceGate.includes('Supabase mutation'), 'design forbids supabase')

assert(parsed.staticScan.staticScanPlan.scanBeforeDynamicImport === true, 'scan before import')
assert(parsed.staticScan.staticScanPlan.scanTargetSource === targetSourcePath, 'scan target')
assert(parsed.staticScan.staticScanPlan.forbiddenPatterns.includes('storage.from'), 'scan forbidden')
assert(parsed.staticScan.today.proofRunnerSourceCreated === false, 'scan no source today')
assert(parsed.staticScan.today.dynamicImportRan === false, 'scan no import today')

assert(parsed.safety.safetyPlan.proofRunnerMustBeValidationOnly === true, 'safety validation')
assert(parsed.safety.safetyPlan.proofRunnerMustNotTouchSupabase === true, 'safety no supabase')
assertFalseFields(parsed.safety.unsafeClaimsToday, 'safety.unsafeClaimsToday', [
  'proofRunnerSourceCreatedClaimed',
  'controlledImportProofPassedClaimed',
  'moduleImportedClaimed',
  'runtimeImportReadyClaimed',
  'externalAgentExecutionReadyClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'realUserMediaBetaReadyClaimed',
  'productionReadinessClaimed',
])

assert(parsed.readiness.readinessForNextGate.controlledImportProofRunnerSourceGateMayProceed === true, 'readiness gate')
assert(parsed.readiness.readinessForNextGate.proofRunnerSourceMayBeCreated === true, 'readiness source')
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

assert(parsed.blockers.remainingBlockers.length === 8, 'blocker count')
assert(parsed.blockers.blockedToday.proofRunnerSourceCreation === true, 'blocker source creation today')
assert(parsed.blockers.blockedToday.controlledImportProof === true, 'blocker proof')
assert(parsed.blockers.blockedToday.externalAgentExecution === true, 'blocker external')

assert(parsed.policy.allowedClaims.proofRunnerSourcePlanCreated === true, 'policy source plan')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
assertFalseFields(parsed.policy.forbiddenClaims, 'policy.forbiddenClaims', [
  'proofRunnerSourceCreatedClaimed',
  'runtimeImportRanClaimed',
  'moduleImportedClaimed',
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
assert(parsed.next.allowedSourceCreation.proofRunnerPath === proofRunnerPath, 'next proof path')
assert(parsed.next.allowedSourceCreation.nodeBuiltInsOnly === true, 'next built-ins')
assert(parsed.next.allowedSourceCreation.createProofRunnerSourceOnly === true, 'next source only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.allowedSourceCreation, 'next.allowedSourceCreation', [
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
      sourcePr: 2039,
      sourceMergeCommit,
      proofRunnerSourcePlanCreated: true,
      proofRunnerSourceCreatedToday: false,
      runtimeImportRanToday: false,
      controlledImportProofRanToday: false,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE106-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-CONTROLLED-IMPORT-PROOF-RUNNER-SOURCE-GATE',
    },
    null,
    2,
  ),
)
