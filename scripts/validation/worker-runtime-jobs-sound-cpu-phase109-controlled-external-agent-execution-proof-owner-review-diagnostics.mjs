import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase109_controlled_external_agent_execution_proof_passed_with_warnings_ready_for_external_agent_execution_proof_owner_review_no_runtime_side_effects'
const decision =
  'worker_runtime_jobs_sound_cpu_phase109_controlled_external_agent_execution_proof_owner_review_passed_with_warnings_ready_for_limited_external_agent_execution_plan_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE110-LIMITED-EXTERNAL-AGENT-EXECUTION-PLAN'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-result.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-proof-output-register.md',
  sourceVerification:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-no-side-effect-verification-register.md',
  sourceCoverage:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-tool-coverage-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-claim-policy.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-acceptance-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan.md',
}

const expectedWorkers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
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
    'allowExecutionToday',
    'allowRealUserMedia',
    'allowRealExternalAgentExecutionToday',
    'allowProductToolCallExecutionToday',
    'allowWorkerDispatchToday',
    'allowRouteExecutionToday',
    'allowManifestPersistenceToday',
    'allowMediaOpenToday',
    'allowProviderCallToday',
    'allowModelCallToday',
    'allowSupabaseMutationToday',
    'allowSqlExecutionToday',
    'allowStorageObjectCreationToday',
    'allowSignedUrlCreationToday',
    'allowArtifactCreationToday',
    'allowBetaUnlockToday',
    'allowProductionUnlockToday',
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
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-result',
  ),
  sourceOutput: parseJsonBlock(
    docs.sourceOutput,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-proof-output-register',
  ),
  sourceVerification: parseJsonBlock(
    docs.sourceVerification,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-no-side-effect-verification-register',
  ),
  sourceCoverage: parseJsonBlock(
    docs.sourceCoverage,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-tool-coverage-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-claim-policy',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-acceptance-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2056, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '83ee854da0a79b51224bbc4f145f97c542ef8cf7',
  'source merge mismatch',
)
assert(parsed.source.proofResult.agentBoundaryInvoked === true, 'source boundary missing')
assert(parsed.source.proofResult.toolCountCovered === 15, 'source tool count mismatch')
assert(parsed.source.proofResult.runtimeFlagsAllFalse === true, 'source flags mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')

assert(parsed.sourceOutput.sanitizedProofOutput.status === 'passed', 'source output status mismatch')
assert(parsed.sourceOutput.sanitizedProofOutput.toolCountCovered === 15, 'source output tool count mismatch')
assert(parsed.sourceOutput.proofOutputWrittenToDisk === false, 'source output written to disk')
assert(parsed.sourceOutput.tempProofArtifactsCreated === false, 'source temp artifacts created')
for (const value of Object.values(parsed.sourceVerification.verifiedFalse)) {
  assert(value === false, 'source verification false values must remain false')
}
assert(parsed.sourceCoverage.soundCpuToolSet.controlledExternalAgentProofComplete === true, 'source coverage proof missing')
assert(parsed.sourceCoverage.soundCpuToolSet.readyForRealExecutionToday === 0, 'source coverage real readiness widened')
assert(parsed.sourcePolicy.nextGateMayReviewControlledProof === true, 'source next review missing')
assert(parsed.sourcePolicy.nextGateMayPlanLimitedExternalAgentExecution === false, 'source limited plan must wait')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2057, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '563af52b2bb435fc42896e5deefb52e43726d6db',
  'result source merge mismatch',
)
assert(parsed.result.ownerReview.controlledSyntheticExternalAgentProofAccepted === true, 'proof acceptance missing')
assert(parsed.result.ownerReview.limitedExternalAgentExecutionPlanMayProceedNext === true, 'limited plan next missing')
assert(parsed.result.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'real execution widened')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentExecutionPlanning === 15, 'limited planning count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real readiness widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedEvidence.toolCountCovered === 15, 'acceptance tool count mismatch')
for (const value of Object.values(parsed.acceptance.acceptedEvidence)) {
  assert(value === true || value === 15, 'accepted evidence must remain true/count only')
}
assertArrayEquals(parsed.acceptance.acceptedPlanningSurface.workers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedPlanningSurface.jobTypes, expectedJobTypes, 'acceptance job types')
assert(parsed.acceptance.acceptedPlanningSurface.toolCount === 15, 'acceptance planning count mismatch')
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'notAcceptedForToday must remain true')
}

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'phase109_controlled_external_agent_execution_proof_owner_review_pending',
  ),
  'owner review blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some((row) => row.blockerId === 'limited_external_agent_execution_plan_pending'),
  'limited execution planning blocker missing',
)
assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker real execution widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker tool readiness widened')

assert(parsed.policy.allowedClaims.controlledExternalAgentProofOwnerReviewedClaimed === true, 'owner review claim missing')
assert(parsed.policy.allowedClaims.limitedExternalAgentExecutionPlanMayProceedClaimed === true, 'limited plan claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.externalAgentExecutionReadyClaimed === false, 'policy real execution widened')
assert(parsed.policy.nextGateMayPlanLimitedExternalAgentExecution === true, 'next limited plan missing')
assert(parsed.policy.nextGateMayRunRealExternalAgentExecution === false, 'next real execution widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source decision mismatch')
assert(parsed.next.planningScope.planLimitedExternalAgentExecution === true, 'next limited plan scope missing')
assert(parsed.next.planningScope.allowedToolCount === 15, 'next tool count mismatch')
assertArrayEquals(parsed.next.planningScope.allowedWorkers, expectedWorkers, 'next workers')
assertArrayEquals(parsed.next.planningScope.allowedJobTypes, expectedJobTypes, 'next job types')
assert(parsed.next.planningScope.allowExecutionToday === false, 'next execution today widened')
assert(parsed.next.planningScope.allowRealUserMedia === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2057,
      controlledExternalAgentProofAccepted: true,
      limitedExternalAgentExecutionPlanMayProceedNext: true,
      soundCpuToolsCovered: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
