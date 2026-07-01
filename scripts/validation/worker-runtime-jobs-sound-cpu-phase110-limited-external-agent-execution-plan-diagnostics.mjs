import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase109_controlled_external_agent_execution_proof_owner_review_passed_with_warnings_ready_for_limited_external_agent_execution_plan_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase110_limited_external_agent_execution_plan_completed_with_warnings_ready_for_limited_external_agent_execution_owner_review_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE110-LIMITED-EXTERNAL-AGENT-EXECUTION-OWNER-REVIEW'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-acceptance-register.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan-result.md',
  scope:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-scope-register.md',
  stops:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-stop-conditions.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-review.md',
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
    'allowExecutionToday',
    'allowRealUserMedia',
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
    'limitedExternalAgentExecutionProofPassedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof-owner-acceptance-register',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan-result',
  ),
  scope: parseJsonBlock(
    docs.scope,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-scope-register',
  ),
  stops: parseJsonBlock(
    docs.stops,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-stop-conditions',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2057, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '563af52b2bb435fc42896e5deefb52e43726d6db',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.limitedExternalAgentExecutionPlanMayProceedNext === true, 'source next plan missing')
assert(parsed.source.soundCpuTools.readyForLimitedExternalAgentExecutionPlanning === 15, 'source planning count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')
assert(parsed.sourceAcceptance.acceptedPlanningSurface.toolCount === 15, 'source acceptance tool count mismatch')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.planningScope.planLimitedExternalAgentExecution === true, 'prompt planning missing')
assert(parsed.prompt.planningScope.allowedToolCount === 15, 'prompt tool count mismatch')
assertArrayEquals(parsed.prompt.planningScope.allowedWorkers, expectedWorkers, 'prompt workers')
assertArrayEquals(parsed.prompt.planningScope.allowedJobTypes, expectedJobTypes, 'prompt job types')
assert(parsed.prompt.planningScope.allowExecutionToday === false, 'prompt execution widened')
assert(parsed.prompt.planningScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2058, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '286afc5bc89dc7c1cebe2959bef7afec577d67a0',
  'result source merge mismatch',
)
assert(parsed.result.planResult.limitedExternalAgentExecutionPlanCreated === true, 'result plan missing')
for (const [key, value] of Object.entries(parsed.result.planResult)) {
  if (key !== 'limitedExternalAgentExecutionPlanCreated') assert(value === false, `result ${key} widened`)
}
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentExecutionOwnerReview === 15, 'owner-review count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real readiness widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.scope.limitedExecutionEnvelope.allowedToolCount === 15, 'scope tool count mismatch')
assertArrayEquals(parsed.scope.limitedExecutionEnvelope.allowedWorkers, expectedWorkers, 'scope workers')
assertArrayEquals(parsed.scope.limitedExecutionEnvelope.allowedImages, expectedImages, 'scope images')
assertArrayEquals(parsed.scope.limitedExecutionEnvelope.allowedJobTypes, expectedJobTypes, 'scope job types')
assert(parsed.scope.limitedExecutionEnvelope.requiredEnvelopeFields.includes('stopConditions'), 'scope stop conditions missing')
assert(parsed.scope.runtimeFlagsMustRemainFalse.includes('allowRealUserMedia'), 'scope real media flag missing')
assert(parsed.scope.runtimeFlagsMustRemainFalse.includes('allowSupabaseMutation'), 'scope Supabase flag missing')

assert(parsed.stops.futureGateMustStopOn.includes('real user media path'), 'stop real media missing')
assert(parsed.stops.futureGateMustStopOn.includes('Supabase or SQL touch'), 'stop Supabase missing')
assert(parsed.stops.futureGateMustStopOn.includes('readiness widening'), 'stop readiness missing')
assert(parsed.stops.cleanupExpectations.keepNodeModulesUnstaged === true, 'node_modules staging guard missing')

assert(
  parsed.blockers.resolvedForThisGate.some((row) => row.blockerId === 'limited_external_agent_execution_plan_pending'),
  'plan blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'limited_external_agent_execution_owner_review_pending',
  ),
  'owner-review blocker missing',
)
assert(
  parsed.blockers.remainingBlockers.some((row) => row.blockerId === 'limited_external_agent_execution_proof_pending'),
  'proof blocker missing',
)
assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker real execution widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker tool readiness widened')

assert(parsed.policy.allowedClaims.limitedExternalAgentExecutionPlanCreatedClaimed === true, 'plan claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.limitedExternalAgentExecutionProofPassedClaimed === false, 'proof claim widened')
assert(parsed.policy.blockedClaims.externalAgentExecutionReadyClaimed === false, 'execution readiness widened')
assert(parsed.policy.nextGateMayReviewLimitedExecutionPlan === true, 'next review missing')
assert(parsed.policy.nextGateMayRunLimitedExecutionProof === false, 'proof run must wait for owner review')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'real media widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewLimitedExecutionPlanOnly === true, 'next review scope missing')
assert(parsed.next.reviewScope.mayAcceptLimitedExecutionProofNext === true, 'next proof permission missing')
assert(parsed.next.reviewScope.allowExecutionToday === false, 'next execution today widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2058,
      limitedExternalAgentExecutionPlanCreated: true,
      soundCpuToolsCovered: 15,
      readyForLimitedExternalAgentExecutionOwnerReview: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
