import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase108_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_owner_review_no_execution'
const decision =
  'worker_runtime_jobs_sound_cpu_phase108_external_agent_execution_owner_review_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_no_runtime_side_effects'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE109-CONTROLLED-EXTERNAL-AGENT-EXECUTION-PROOF'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-plan-result.md',
  sourceSurface: 'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-surface-register.md',
  sourceRequirements:
    'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-proof-requirements.md',
  sourceBlocked:
    'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-blocked-effects-register.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-acceptance-register.md',
  duplicate:
    'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-duplicate-reconciliation-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof.md',
}

const expectedWorkers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const expectedImages = ['reeditpro/sound-cpu-analysis-worker', 'reeditpro/sound-audio-metadata-worker']
const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis',
]

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

function assertNoOpClassification(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed`)
  assert(record.nextAction === 'none', `${label}.nextAction`)
}

function assertArrayEquals(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`)
  assert(actual.length === expected.length, `${label} length mismatch`)
  for (const item of expected) assert(actual.includes(item), `${label} missing ${item}`)
}

function assertNoUnsafeTrueClaims(file) {
  const text = read(file)
  const unsafe = [
    'allowRealExternalAgentExecution',
    'allowProductToolCallExecution',
    'allowWorkerDispatch',
    'allowRouteExecution',
    'allowFactorySideEffects',
    'allowManifestPersistence',
    'allowMediaOpen',
    'allowProviderCall',
    'allowModelCall',
    'allowSupabaseMutation',
    'allowSqlExecution',
    'allowStorageObjectCreation',
    'allowSignedUrlCreation',
    'allowArtifactCreation',
    'allowBetaUnlock',
    'allowProductionUnlock',
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
    'externalAgentExecutionReadyClaimed',
    'productToolCallExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'manifestPersistenceReadyClaimed',
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
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-plan-result',
  ),
  sourceSurface: parseJsonBlock(
    docs.sourceSurface,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-surface-register',
  ),
  sourceRequirements: parseJsonBlock(
    docs.sourceRequirements,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-proof-requirements',
  ),
  sourceBlocked: parseJsonBlock(
    docs.sourceBlocked,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-blocked-effects-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-acceptance-register',
  ),
  duplicate: parseJsonBlock(
    docs.duplicate,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-duplicate-reconciliation-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase108-external-agent-execution-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2051, 'Phase108 source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit ===
    '4732ed44b47245bfada6e2b46a3adb7594b7c719',
  'Phase108 source merge mismatch',
)
assert(parsed.source.planResult.externalAgentExecutionSurfacePlanned === true, 'source plan missing')
assert(parsed.source.planResult.acceptedToolCount === 15, 'source tool count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real execution widened')

assert(parsed.sourceSurface.plannedSurface.allowedToolCount === 15, 'source surface tool count mismatch')
assertArrayEquals(parsed.sourceSurface.plannedSurface.allowedWorkers, expectedWorkers, 'source workers')
assertArrayEquals(parsed.sourceSurface.plannedSurface.allowedImages, expectedImages, 'source images')
assertArrayEquals(parsed.sourceSurface.plannedSurface.allowedJobTypes, expectedJobTypes, 'source job types')
assert(
  parsed.sourceRequirements.futureProofRequirements.requiresOwnerReviewBeforeProof === true,
  'source proof owner review requirement missing',
)
assert(parsed.sourceRequirements.expectedFirstProofResultIfSuccessful.toolCountCovered === 15, 'expected proof count mismatch')
for (const value of Object.values(parsed.sourceBlocked.blockedEffects)) {
  assert(value === true, 'source blocked effects must remain true')
}
assert(parsed.sourcePolicy.claimPolicy.externalAgentExecutionReadyClaimed === false, 'source readiness widened')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2053, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === 'f22b2debccfbc5913d722aefde557abd6fe8e3ce',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.externalAgentExecutionPlanAccepted === true, 'owner plan acceptance missing')
assert(
  parsed.result.ownerReview.controlledExternalAgentExecutionProofMayProceedNext === true,
  'controlled proof next missing',
)
for (const [key, value] of Object.entries(parsed.result.ownerReview)) {
  if (key.startsWith('acceptedFor') && key !== 'acceptedForRealExternalAgentExecutionToday') {
    assert(value === false, `${key} must remain false`)
  }
}
assert(parsed.result.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'real execution widened')
assert(parsed.result.soundCpuTools.covered === 15, 'result tool coverage mismatch')
assert(parsed.result.soundCpuTools.installedImportProven === 15, 'installed import count mismatch')
assert(parsed.result.soundCpuTools.syntheticToolCallCovered === 15, 'synthetic tool call count mismatch')
assert(parsed.result.soundCpuTools.readyForControlledExternalAgentProof === 15, 'controlled proof count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assertArrayEquals(parsed.acceptance.acceptedPlanningSurface.workers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedPlanningSurface.images, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedPlanningSurface.jobTypes, expectedJobTypes, 'acceptance job types')
assert(parsed.acceptance.acceptedPlanningSurface.toolCount === 15, 'acceptance tool count mismatch')
for (const value of Object.values(parsed.acceptance.acceptedForNextProofOnly)) {
  assert(value === true, 'acceptedForNextProofOnly must remain true')
}
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'notAcceptedForToday must remain true')
}

assert(parsed.duplicate.samePurposeOpenPrFound === false, 'same purpose duplicate found')
assert(parsed.duplicate.reconciliationDecision.createOwnerReview === true, 'owner review not selected')
assert(parsed.duplicate.reconciliationDecision.doNotRestartEarlierLanes === true, 'earlier lane restart not blocked')
assert(
  parsed.duplicate.duplicateRiskDisposition.phase108PlanPr2053 === 'source_of_truth_for_this_owner_review',
  'Phase108 source disposition missing',
)

assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker real execution widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker tool readiness widened')
assert(parsed.blockers.remainingExternalAgentReadinessBlockers.controlledExternalAgentProofMissing === true, 'proof blocker missing')
assert(parsed.blockers.remainingExternalAgentReadinessBlockers.realUserMediaPolicyBlocked === true, 'real media blocker missing')

assert(parsed.policy.claimPolicy.phase108PlanOwnerReviewedClaimed === true, 'owner review claim missing')
assert(parsed.policy.claimPolicy.controlledExternalAgentProofMayProceedClaimed === true, 'controlled proof claim missing')
assert(parsed.policy.claimPolicy.externalAgentExecutionReadyClaimed === false, 'policy real execution widened')
assert(parsed.policy.nextGateMayRunControlledExternalAgentProof === true, 'next proof permission missing')
assert(parsed.policy.nextGateMayRunRealExternalAgentExecution === false, 'next real execution widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source decision mismatch')
assert(parsed.next.proofScope.runControlledExternalAgentBoundary === true, 'next controlled boundary missing')
assert(parsed.next.proofScope.useSyntheticPayloadOnly === true, 'next synthetic payload missing')
assert(parsed.next.proofScope.allowedToolCount === 15, 'next tool count mismatch')
assertArrayEquals(parsed.next.proofScope.allowedWorkers, expectedWorkers, 'next workers')
assertArrayEquals(parsed.next.proofScope.allowedJobTypes, expectedJobTypes, 'next job types')
assert(parsed.next.requiredOutputEvidence.includes('readinessClaimsUnchanged'), 'readiness evidence missing')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2053,
      controlledExternalAgentExecutionProofMayProceedNext: true,
      soundCpuToolsCovered: 15,
      installedImportProven: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
