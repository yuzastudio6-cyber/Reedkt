import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_gate_completed_with_warnings_ready_for_controlled_import_proof_runner_source_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase107_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_passed_with_warnings_ready_for_controlled_import_proof_owner_review_no_external_execution'
const sourceHead = 'f5029979987144781856dd84c917d330a62ac873'
const sourceMergeCommit = 'fd7d17e48ba971e39683753da1487ee5981a7e21'
const proofRunnerPath =
  'scripts/validation/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner.mjs'
const targetSourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate-result.md',
  sourceRegister:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-register.md',
  sourceValidation:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-static-validation-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-evidence-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof.md',
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
    'allowProductRuntimeImport',
    'allowExternalAgentExecutionToday',
    'allowWorkerDispatchToday',
    'allowFactoryCallToday',
    'allowManifestPersistenceToday',
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
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-gate-result',
  ),
  sourceRegister: parseJsonBlock(
    docs.sourceRegister,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-register',
  ),
  sourceValidation: parseJsonBlock(
    docs.sourceValidation,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-static-validation-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-evidence-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-controlled-import-proof-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner-source-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const proofRunner = read(proofRunnerPath)
for (const snippet of [
  'await import(pathToFileURL(targetPath).href)',
  'factoryCalled: false',
  'workerDispatched: false',
  'supabaseTouched: false',
  'mediaOpened: false',
  'externalAgentExecutionReady: false',
  'realUserMediaBetaReady: false',
]) {
  assert(proofRunner.includes(snippet), `proof runner missing ${snippet}`)
}
for (const forbidden of ['createClient(', '.insert(', '.upsert(', 'storage.from(', 'createSignedUrl(', 'fetch(', 'executeRoute(']) {
  assert(!proofRunner.includes(forbidden), `proof runner contains forbidden ${forbidden}`)
}

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source')
assert(parsed.prompt.expectedDecision === decision, 'prompt decision')
assert(parsed.prompt.reviewScope.reviewProofRunnerSourceOnly === true, 'prompt review only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.reviewScope, 'prompt.reviewScope', [
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

assert(parsed.sourceResult.decision === sourceDecision, 'source result decision')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2040, 'source result PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === '73dbfab14a6884e66fda3a8a5052ad7fc6b5b333', 'source result head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '4b5091c54b8432d91a486f441e0c3a4e7dcb7013', 'source result merge')
assert(parsed.sourceResult.sourceGate.proofRunnerSourceCreated === true, 'source gate created')
assert(parsed.sourceResult.sourceGate.runProofToday === false, 'source gate no proof')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')
assert(parsed.sourceRegister.proofRunnerSource.path === proofRunnerPath, 'source register path')
assert(parsed.sourceValidation.staticValidation.proofRunnerSourceInspectedButNotExecuted === true, 'source static validation no execution')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2043, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.ownerReview.proofRunnerSourceAccepted === true, 'result accepts source')
assert(parsed.result.ownerReview.controlledImportProofMayProceedInNextGate === true, 'result proof next')
assert(parsed.result.ownerReview.proofRunnerPathAccepted === proofRunnerPath, 'result proof path')
assert(parsed.result.ownerReview.targetSourcePathAccepted === targetSourcePath, 'result target path')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
  'acceptedForControlledImportProofToday',
  'acceptedForProductRuntimeImportToday',
  'acceptedForExternalAgentExecutionToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForManifestPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])

assert(parsed.acceptance.acceptedForNextGate.controlledImportProof === true, 'acceptance proof next')
assert(parsed.acceptance.acceptedForNextGate.proofRunnerPath === proofRunnerPath, 'acceptance path')
assertFalseFields(parsed.acceptance.notAcceptedForToday, 'acceptance.notAcceptedForToday', [
  'proofRunnerExecution',
  'productRuntimeImport',
  'externalAgentExecution',
  'workerDispatch',
  'manifestPersistence',
  'storageObjectCreation',
  'signedUrlCreation',
  'mediaOpen',
  'supabaseMutation',
  'sqlExecution',
])

assert(parsed.evidence.acceptedEvidence.proofRunnerSourceCreated === true, 'evidence source created')
assert(parsed.evidence.acceptedEvidence.proofRunnerExecutedToday === false, 'evidence not executed')
assert(parsed.evidence.validationHandoff.sourceGateDiagnosticsPassed === true, 'evidence diagnostics')
assert(parsed.evidence.acceptedEvidence.packageLockUnchanged === true, 'evidence lock')

assert(parsed.readiness.readinessForNextGate.controlledImportProofMayProceed === true, 'readiness proof next')
assert(parsed.readiness.readinessForNextGate.proofRunnerMayExecuteInNextGate === true, 'readiness runner next')
assertFalseFields(parsed.readiness.readinessForNextGate, 'readiness.readinessForNextGate', [
  'productRuntimeImportMayProceedToday',
  'externalAgentExecutionMayProceed',
  'workerDispatchMayProceed',
  'manifestPersistenceMayProceed',
  'supabaseMutationMayProceed',
  'sqlExecutionMayProceed',
  'realUserMediaBetaMayProceed',
  'productionMayProceed',
])

assert(parsed.blockers.remainingBlockers.length === 7, 'blocker count')
assert(parsed.blockers.blockedToday.controlledImportProof === true, 'blocker proof')
assert(parsed.blockers.blockedToday.externalAgentExecution === true, 'blocker external')

assert(parsed.policy.allowedClaims.proofRunnerSourceAccepted === true, 'policy source accepted')
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
assert(parsed.next.controlledProofScope.runProofRunnerOnce === true, 'next runner once')
assert(parsed.next.controlledProofScope.proofRunnerPath === proofRunnerPath, 'next proof path')
assert(parsed.next.controlledProofScope.allowedModuleImport === 'validation_only_dynamic_import_of_fail_closed_contract_source', 'next allowed import')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.controlledProofScope, 'next.controlledProofScope', [
  'allowProductRuntimeImport',
  'allowExternalAgentExecutionToday',
  'allowWorkerDispatchToday',
  'allowFactoryCallToday',
  'allowManifestPersistenceToday',
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
      sourcePr: 2043,
      sourceMergeCommit,
      proofRunnerSourceAccepted: true,
      controlledImportProofMayProceedInNextGate: true,
      proofRunnerExecutedToday: false,
      runtimeImportRanToday: false,
      controlledImportProofRanToday: false,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE107-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-CONTROLLED-IMPORT-PROOF',
    },
    null,
    2,
  ),
)
