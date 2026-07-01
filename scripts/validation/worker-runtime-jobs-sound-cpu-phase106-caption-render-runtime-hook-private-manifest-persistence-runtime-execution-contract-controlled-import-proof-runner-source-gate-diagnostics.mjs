import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_plan_completed_with_warnings_ready_for_controlled_import_proof_runner_source_gate_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_gate_completed_with_warnings_ready_for_controlled_import_proof_runner_source_owner_review_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_execution'
const sourceHead = '73dbfab14a6884e66fda3a8a5052ad7fc6b5b333'
const sourceMergeCommit = '4b5091c54b8432d91a486f441e0c3a4e7dcb7013'
const proofRunnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner.mjs'
const targetSourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan-result.md',
  sourceDesign:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-design-register.md',
  sourceScan:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-static-scan-plan.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate-result.md',
  sourceRegister:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-register.md',
  staticValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-static-validation-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-runner-source-owner-review-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-review.md',
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
    'allowControlledImportProofToday',
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
    'proofRunnerExecutedClaimed',
    'runtimeImportRanClaimed',
    'moduleImportedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-plan-result',
  ),
  sourceDesign: parseJsonBlock(
    docs.sourceDesign,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-design-register',
  ),
  sourceScan: parseJsonBlock(
    docs.sourceScan,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-static-scan-plan',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate-result',
  ),
  sourceRegister: parseJsonBlock(
    docs.sourceRegister,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-register',
  ),
  staticValidation: parseJsonBlock(
    docs.staticValidation,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-static-validation-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-runner-source-owner-review-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const proofRunner = read(proofRunnerPath)
for (const snippet of [
  "import fs from 'node:fs'",
  "import path from 'node:path'",
  "import { pathToFileURL } from 'node:url'",
  'await import(pathToFileURL(targetPath).href)',
  'factoryCalled: false',
  'workerDispatched: false',
  'supabaseTouched: false',
  'mediaOpened: false',
  'sqlExecuted: false',
  'externalAgentExecutionReady: false',
  'realUserMediaBetaReady: false',
  'productionReady: false',
]) {
  assert(proofRunner.includes(snippet), `proof runner missing ${snippet}`)
}
for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from(', 'createSignedUrl(', 'fetch(', 'executeRoute(']) {
  assert(!proofRunner.includes(forbidden), `proof runner contains forbidden ${forbidden}`)
}

const targetSource = read(targetSourcePath)
for (const snippet of [
  'acceptedForExternalAgentExecutionToday: false',
  'acceptedForRuntimeExecutionToday: false',
  'acceptedForWorkerDispatchToday: false',
]) {
  assert(targetSource.includes(snippet), `target source missing ${snippet}`)
}

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source')
assert(parsed.prompt.expectedDecision === decision, 'prompt decision')
assert(parsed.prompt.allowedSourceCreation.proofRunnerPath === proofRunnerPath, 'prompt proof path')
assert(parsed.prompt.allowedSourceCreation.nodeBuiltInsOnly === true, 'prompt built-ins')
assert(parsed.prompt.allowedSourceCreation.createProofRunnerSourceOnly === true, 'prompt source only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.allowedSourceCreation, 'prompt.allowedSourceCreation', [
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2039, 'source result PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === 'e25d0f28079dcce12c25dd694a212a9fc80bfdae', 'source result head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'c0dccf8bd12f3b37a8a830b156d56210344261ac', 'source result merge')
assert(parsed.sourceResult.sourcePlan.proofRunnerPath === proofRunnerPath, 'source proof path')
assert(parsed.sourceResult.sourcePlan.proofRunnerSourceCreatedInThisPlan === false, 'source plan did not create source')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')
assert(parsed.sourceDesign.proofRunnerDesign.path === proofRunnerPath, 'source design path')
assert(parsed.sourceScan.staticScanPlan.scanBeforeDynamicImport === true, 'source scan before import')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2040, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.sourceGate.proofRunnerSourceCreated === true, 'result source created')
assert(parsed.result.sourceGate.proofRunnerPath === proofRunnerPath, 'result proof path')
assert(parsed.result.sourceGate.nodeBuiltInsOnly === true, 'result built-ins')
assert(parsed.result.sourceGate.performsStaticScanBeforeImport === true, 'result scan')
assert(parsed.result.sourceGate.importsTargetOnlyWhenExecutedLater === true, 'result later import only')
assert(parsed.result.sourceGate.runProofToday === false, 'result proof not run')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.sourceGate, 'result.sourceGate', [
  'callsBlockedResultFactory',
  'dispatchesWorkers',
  'touchesSupabase',
  'runsSql',
  'opensMedia',
  'createsArtifacts',
  'runProofToday',
])

assert(parsed.sourceRegister.proofRunnerSource.path === proofRunnerPath, 'register proof path')
assert(parsed.sourceRegister.proofRunnerSource.nodeBuiltIns.length === 3, 'register built-ins')
assert(parsed.sourceRegister.proofRunnerSource.sourceGateInspectionOnly === true, 'register inspection')
assertFalseFields(parsed.sourceRegister.proofRunnerSource, 'register.proofRunnerSource', [
  'factoryCallPresent',
  'workerDispatchPresent',
  'supabaseMutationPresent',
  'mediaOpenPresent',
])

assert(parsed.staticValidation.staticValidation.sourceGateDiagnosticsPassed === true, 'static validation diagnostics')
assert(parsed.staticValidation.staticValidation.proofRunnerSourceInspectedButNotExecuted === true, 'static validation no execution')
assert(parsed.staticValidation.staticValidation.targetSourceInspectedButNotImported === true, 'static validation no import')
assertFalseFields(parsed.staticValidation.today, 'staticValidation.today', [
  'proofRunnerExecuted',
  'targetModuleImported',
  'factoryCalled',
  'workerDispatched',
])

assert(parsed.readiness.readinessForNextGate.controlledImportProofRunnerSourceOwnerReviewMayProceed === true, 'readiness owner')
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
assert(parsed.blockers.blockedToday.controlledImportProof === true, 'blocker proof')
assert(parsed.blockers.blockedToday.externalAgentExecution === true, 'blocker external')

assert(parsed.policy.allowedClaims.proofRunnerSourceCreated === true, 'policy source created')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
assertFalseFields(parsed.policy.forbiddenClaims, 'policy.forbiddenClaims', [
  'proofRunnerExecutedClaimed',
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
assert(parsed.next.reviewScope.reviewProofRunnerSourceOnly === true, 'next review only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.reviewScope, 'next.reviewScope', [
  'allowControlledImportProofToday',
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
      sourcePr: 2040,
      sourceMergeCommit,
      proofRunnerSourceCreated: true,
      proofRunnerExecutedToday: false,
      runtimeImportRanToday: false,
      controlledImportProofRanToday: false,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE106-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-CONTROLLED-IMPORT-PROOF-RUNNER-SOURCE-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
