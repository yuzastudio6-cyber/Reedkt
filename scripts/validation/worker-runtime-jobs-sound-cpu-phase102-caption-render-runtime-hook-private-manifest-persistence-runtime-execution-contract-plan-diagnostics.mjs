import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase101_caption_render_runtime_hook_private_manifest_persistence_runtime_binding_source_owner_review_passed_with_warnings_ready_for_runtime_execution_contract_plan_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase102_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_plan_completed_with_warnings_ready_for_contract_owner_review_no_execution'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase102_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_owner_review_passed_with_warnings_ready_for_contract_source_plan_no_execution'
const sourceHead = '152075d1abd09345108c2a4988f43458eec84734'
const sourceMergeCommit = '7f2eb72a92f7dc6970024ea13c49b7c40605b7c6'
const sourcePath = 'server/workers/sound-cpu/runtime/privateManifestPersistence.ts'

const docs = {
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-plan.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review-result.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-readiness-register.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-plan-result.md',
  contract:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-map.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-external-agent-call-boundary-register.md',
  status:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-blocked-result-status-contract.md',
  ownerGates:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-owner-gate-map.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-review.md',
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
    'externalAgentExecutionMayProceed',
    'workerDispatchMayProceed',
    'routeExecutionMayProceed',
    'toolExecutionMayProceed',
    'realUserMediaBetaMayProceed',
    'paidProductionMayProceed',
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
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-plan',
  ),
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-binding-source-owner-review-result',
  ),
  sourceReadiness: parseJsonBlock(
    docs.sourceReadiness,
    'worker-runtime-jobs-sound-cpu-phase101-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-readiness-register',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-plan-result',
  ),
  contract: parseJsonBlock(
    docs.contract,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-map',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-external-agent-call-boundary-register',
  ),
  status: parseJsonBlock(
    docs.status,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-blocked-result-status-contract',
  ),
  ownerGates: parseJsonBlock(
    docs.ownerGates,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-owner-gate-map',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-owner-review',
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
assert(parsed.prompt.planningScope.planRuntimeExecutionContractOnly === true, 'prompt plan only')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')
assertFalseFields(parsed.prompt.planningScope, 'prompt.planningScope', [
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
assert(parsed.sourceResult.sourceVerification.sourcePr === 2027, 'source result source PR')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '226492d1d6163dc5ffa9cf43376ff05d6d3f1cce', 'source result merge')
assert(parsed.sourceResult.ownerReview.runtimeExecutionContractPlanMayProceed === true, 'source allows contract plan')
assert(parsed.sourceResult.soundCpuTools.covered === 15, 'source tools')
assert(parsed.sourceResult.soundCpuTools.readyForRealExecutionToday === 0, 'source execution closed')
assertNoOpClassification(parsed.sourceResult.supabaseClassification, 'sourceResult.supabaseClassification')

assert(parsed.sourceReadiness.decision === sourceDecision, 'source readiness decision')
assert(parsed.sourceReadiness.readinessForNextPlanningGate.runtimeExecutionContractPlanMayProceed === true, 'source readiness plan')
assert(parsed.sourceReadiness.readinessForNextPlanningGate.externalAgentExecutionMayProceed === false, 'source readiness external execution')

assert(parsed.result.decision === decision, 'result decision')
assert(parsed.result.sourceVerification.sourcePr === 2029, 'result source PR')
assert(parsed.result.sourceVerification.sourceHead === sourceHead, 'result source head')
assert(parsed.result.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'result source merge')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision')
assert(parsed.result.runtimeExecutionContractPlan.contractPlanCreated === true, 'result plan created')
assert(parsed.result.runtimeExecutionContractPlan.sourcePath === sourcePath, 'result source path')
assert(parsed.result.runtimeExecutionContractPlan.requiredFailClosedBinding === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'result binding')
assert(parsed.result.runtimeExecutionContractPlan.requiredStatus === 'blocked_by_owner_gate', 'result status')
assert(parsed.result.soundCpuTools.covered === 15, 'result tools')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result execution closed')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assertFalseFields(parsed.result.runtimeExecutionContractPlan, 'result.runtimeExecutionContractPlan', [
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

assert(parsed.contract.decision === decision, 'contract decision')
assert(parsed.contract.contractMap.currentCallableSource === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'contract callable')
assert(parsed.contract.contractMap.inputContractType === 'SoundCpuPrivateManifestPersistenceInput', 'contract input')
assert(parsed.contract.contractMap.resultContractType === 'SoundCpuPrivateManifestPersistenceResult', 'contract result')
assert(parsed.contract.contractMap.requiredInputFields.includes('approvedPlanSnapshotId'), 'contract snapshot')
assert(parsed.contract.contractMap.requiredInputFields.includes('idempotencyKey'), 'contract idempotency')
assert(parsed.contract.contractMap.forbiddenInputFields.includes('rawPromptText'), 'contract rejects raw prompt')
assert(parsed.contract.contractMap.forbiddenInputFields.includes('signedUrls'), 'contract rejects signed URLs')
assert(parsed.contract.contractMap.requiredResultStatus === 'blocked_by_owner_gate', 'contract status')
assertFalseFields(parsed.contract.executionScopeToday, 'contract.executionScopeToday', [
  'externalAgentExecutionToday',
  'workerDispatchToday',
  'manifestPersistenceToday',
  'storageObjectCreationToday',
  'signedUrlCreationToday',
  'mediaOpenToday',
  'supabaseMutationToday',
  'sqlExecutionToday',
])

assert(parsed.boundary.externalAgentBoundary.idempotencyRequired === true, 'boundary idempotency')
assert(parsed.boundary.externalAgentBoundary.approvedPlanSnapshotRequired === true, 'boundary approved snapshot')
assert(parsed.boundary.externalAgentBoundary.currentResponseShape === 'blocked_result_only', 'boundary blocked response')
assertFalseFields(parsed.boundary.agentExecutionToday, 'boundary.agentExecutionToday', [
  'externalAgentExecutionMayProceed',
  'workerDispatchMayProceed',
  'routeExecutionMayProceed',
  'toolExecutionMayProceed',
  'realUserMediaBetaMayProceed',
  'paidProductionMayProceed',
])

assert(parsed.status.blockedResultContract.status === 'blocked_by_owner_gate', 'status contract status')
assert(parsed.status.blockedResultContract.defaultBlockedReason === 'supabase_owner_gate_required', 'status default reason')
assert(parsed.status.blockedResultContract.allowedBlockedReasons.length === 5, 'status reasons count')
assert(parsed.status.blockedResultContract.mustUseFailClosedBinding === 'createSoundCpuPrivateManifestPersistenceRuntimeBindingBlockedResult', 'status binding')
assertFalseFields(parsed.status.statusClaims, 'status.statusClaims', [
  'generatedLocalFixturePassedClaimed',
  'dryRunPassedClaimed',
  'externalAgentExecutionReadyClaimed',
  'workerReadinessClaimed',
  'runtimeReadinessClaimed',
  'realUserMediaBetaReadyClaimed',
  'productionReadinessClaimed',
])

assert(parsed.ownerGates.ownerGates.some((gate) => gate.owner === 'WORKER_RUNTIME_JOBS' && gate.status === 'next_required'), 'owner gate next')
assert(parsed.ownerGates.closedToday.workerDispatch === true, 'owner gate worker closed')
assert(parsed.ownerGates.closedToday.supabaseMutation === true, 'owner gate supabase closed')
assert(parsed.ownerGates.closedToday.betaUnlock === true, 'owner gate beta closed')

assert(parsed.blockers.blockers.length === 5, 'blocker count')
assert(parsed.blockers.runtimeExecutionMayProceedToday === false, 'blocker runtime closed')

assert(parsed.policy.allowedClaims.runtimeExecutionContractPlanned === true, 'policy plan claim')
assert(parsed.policy.allowedClaims.failClosedBlockedResultContractSpecified === true, 'policy blocked claim')
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
assert(parsed.next.reviewScope.reviewRuntimeExecutionContractOnly === true, 'next review only')
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
      sourcePr: 2029,
      sourceMergeCommit,
      docsChecked: Object.keys(docs).length,
      soundCpuToolsCovered: parsed.result.soundCpuTools.covered,
      readyForRealExecutionToday: parsed.result.soundCpuTools.readyForRealExecutionToday,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE102-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-RUNTIME-EXECUTION-CONTRACT-OWNER-REVIEW',
    },
    null,
    2,
  ),
)
