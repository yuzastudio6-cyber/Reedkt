import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase102_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_plan_completed_with_warnings_ready_for_contract_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase102_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_owner_review_passed_with_warnings_ready_for_contract_source_plan_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase103_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_source_plan_completed_with_warnings_ready_for_contract_source_gate_no_execution'
const planSourceHead = '152075d1abd09345108c2a4988f43458eec84734'
const planSourceMergeCommit = '7f2eb72a92f7dc6970024ea13c49b7c40605b7c6'
const ownerSourceHead = 'c787aadf7ed4f3a54998399d83038fdaf9128d57'
const ownerSourceMergeCommit = 'f88373d45859ca7d42586f541c34d4c244636d54'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-review.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-plan-result.md',
  sourceContract:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-map.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-external-agent-call-boundary-register.md',
  sourceStatus:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-blocked-result-status-contract.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-acceptance-register.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-evidence-register.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-readiness-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan.md',
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
    'externalAgentExecutionToday',
    'workerDispatchToday',
    'manifestPersistenceToday',
    'storageObjectCreationToday',
    'signedUrlCreationToday',
    'mediaOpenToday',
    'supabaseMutationToday',
    'sqlExecutionToday',
    'runSqlToday',
    'touchSupabaseEnvironmentToday',
    'createStorageObjectsToday',
    'persistManifestToday',
    'createSignedUrlToday',
    'openMediaFileToday',
    'unlockBetaToday',
    'unlockProductionToday',
    'acceptedForExternalAgentExecutionToday',
    'acceptedForWorkerDispatchToday',
    'acceptedForPersistenceToday',
    'acceptedForStorageObjectCreationToday',
    'acceptedForSignedUrlCreationToday',
    'acceptedForMediaOpenToday',
    'acceptedForBetaUnlockToday',
    'acceptedForProductionUnlockToday',
    'externalAgentExecutionMayProceed',
    'workerDispatchMayProceedToday',
    'realPersistenceMayProceed',
    'realUserMediaBetaMayProceed',
    'productionMayProceed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'externalAgentExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-review',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-plan-result',
  ),
  sourceContract: parseJsonBlock(
    docs.sourceContract,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-map',
  ),
  sourceBoundary: parseJsonBlock(
    docs.sourceBoundary,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-external-agent-call-boundary-register',
  ),
  sourceStatus: parseJsonBlock(
    docs.sourceStatus,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-blocked-result-status-contract',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-acceptance-register',
  ),
  evidence: parseJsonBlock(
    docs.evidence,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-evidence-register',
  ),
  readiness: parseJsonBlock(
    docs.readiness,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan-readiness-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase103-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-source-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

const source = read(sourcePath)
for (const snippet of [
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_RUNTIME_BINDING_SOURCE_GATE',
  'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult',
  'SoundCpuPrivateManifestPersistenceInput',
  'SoundCpuPrivateManifestPersistenceResult',
  "status: 'blocked_by_owner_gate'",
  'SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_REJECTED_INPUT_FIELDS',
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
assert(parsed.prompt.reviewScope.reviewRuntimeExecutionContractOnly === true, 'prompt review only')
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2029, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceHead === planSourceHead, 'source result source head')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === planSourceMergeCommit, 'source result source merge')
assert(parsed.sourceResult.runtimeExecutionContractPlan.contractPlanCreated === true, 'source plan created')
assert(parsed.sourceResult.runtimeExecutionContractPlan.requiredStatus === 'blocked_by_owner_gate', 'source required status')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceContract.contractMap.currentCallableSource === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'source contract callable')
assert(parsed.sourceContract.contractMap.forbiddenInputFields.includes('rawPromptText'), 'source contract raw prompt rejection')
assert(parsed.sourceContract.contractMap.forbiddenInputFields.includes('signedUrls'), 'source contract signed URL rejection')
assertFalseFields(parsed.sourceContract.executionScopeToday, 'sourceContract.executionScopeToday', [
  'externalAgentExecutionToday',
  'workerDispatchToday',
  'manifestPersistenceToday',
  'storageObjectCreationToday',
  'signedUrlCreationToday',
  'mediaOpenToday',
  'supabaseMutationToday',
  'sqlExecutionToday',
])

assert(parsed.sourceBoundary.externalAgentBoundary.currentResponseShape === 'blocked_result_only', 'source boundary blocked response')
assert(parsed.sourceStatus.blockedResultContract.status === 'blocked_by_owner_gate', 'source status contract')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2030, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === ownerSourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === ownerSourceMergeCommit, 'result source merge')
assert(parsed.result.ownerReview.runtimeExecutionContractAccepted === true, 'result contract accepted')
assert(parsed.result.ownerReview.contractSourcePlanMayProceed === true, 'result source plan')
assert(parsed.result.ownerReview.acceptedResultStatus === 'blocked_by_owner_gate', 'result status')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.ownerReview, 'result.ownerReview', [
  'acceptedForExternalAgentExecutionToday',
  'acceptedForWorkerDispatchToday',
  'acceptedForPersistenceToday',
  'acceptedForStorageObjectCreationToday',
  'acceptedForSignedUrlCreationToday',
  'acceptedForMediaOpenToday',
  'acceptedForBetaUnlockToday',
  'acceptedForProductionUnlockToday',
])

assert(parsed.acceptance.acceptedForSourcePlanning.requiredApprovedPlanSnapshot === true, 'acceptance approved snapshot')
assert(parsed.acceptance.acceptedForSourcePlanning.requiredIdempotencyKey === true, 'acceptance idempotency')
assert(parsed.acceptance.acceptedForSourcePlanning.requiredRejectedInputFields.includes('rawPromptText'), 'acceptance rejects raw prompt')
assert(parsed.acceptance.acceptedForToday.contractSourcePlanning === true, 'acceptance source planning')
assertFalseFields(parsed.acceptance.acceptedForToday, 'acceptance.acceptedForToday', [
  'externalAgentExecution',
  'workerDispatch',
  'manifestPersistence',
  'storageObjectCreation',
  'signedUrlCreation',
  'mediaOpen',
  'supabaseMutation',
  'sqlExecution',
])

assert(parsed.evidence.sourceEvidence.sourcePr === 2030, 'evidence source PR')
assert(parsed.evidence.validationHandoff.phase102DiagnosticsPassed === true, 'evidence phase102 diagnostics')
assert(parsed.evidence.validationHandoff.packageLockChanged === false, 'evidence lock unchanged')
assert(parsed.evidence.runtimeReadinessEvidence.realUserMediaBetaReady === false, 'evidence beta closed')
assert(parsed.evidence.runtimeReadinessEvidence.paidProductionReady === false, 'evidence production closed')

assert(parsed.readiness.readinessForNextPlanningGate.contractSourcePlanMayProceed === true, 'readiness source plan')
assertFalseFields(parsed.readiness.readinessForNextPlanningGate, 'readiness.readinessForNextPlanningGate', [
  'runtimeExecutionMayProceedToday',
  'externalAgentExecutionMayProceed',
  'workerDispatchMayProceedToday',
  'realPersistenceMayProceed',
  'realUserMediaBetaMayProceed',
  'productionMayProceed',
])

assert(parsed.blockers.inheritedBlockers.length === 5, 'blocker count')
assert(parsed.blockers.blockedToday.externalAgentExecution === true, 'blocker external execution closed')
assert(parsed.blockers.blockedToday.supabaseMutation === true, 'blocker supabase closed')

assert(parsed.policy.allowedClaims.runtimeExecutionContractAcceptedForSourcePlanning === true, 'policy accepted claim')
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
assert(parsed.next.planningScope.planContractSourceOnly === true, 'next planning only')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')
assertFalseFields(parsed.next.planningScope, 'next.planningScope', [
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
      sourcePr: 2030,
      sourceMergeCommit: ownerSourceMergeCommit,
      docsChecked: Object.keys(docs).length,
      contractSourcePlanMayProceed: parsed.result.ownerReview.contractSourcePlanMayProceed,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE103-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-SOURCE-PLAN',
    },
    null,
    2,
  ),
)
