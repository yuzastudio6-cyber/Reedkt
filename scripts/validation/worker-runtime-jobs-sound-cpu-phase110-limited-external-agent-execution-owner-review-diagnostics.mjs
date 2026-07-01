import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase110_limited_external_agent_execution_plan_completed_with_warnings_ready_for_limited_external_agent_execution_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase110_limited_external_agent_execution_owner_review_passed_with_warnings_ready_for_limited_external_agent_execution_proof_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE111-LIMITED-EXTERNAL-AGENT-EXECUTION-PROOF'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan-result.md',
  sourceScope:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-scope-register.md',
  sourceStops:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-stop-conditions.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-acceptance-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof.md',
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
    'allowRealUserMedia',
    'allowWorkerDispatch',
    'allowRouteExecution',
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
    'acceptedForExecutionToday',
    'acceptedForRealUserMediaToday',
    'acceptedForWorkerDispatchToday',
    'acceptedForRouteExecutionToday',
    'acceptedForManifestPersistenceToday',
    'acceptedForMediaOpenToday',
    'acceptedForSupabaseMutationToday',
    'acceptedForSqlExecutionToday',
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
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-plan-result',
  ),
  sourceScope: parseJsonBlock(
    docs.sourceScope,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-scope-register',
  ),
  sourceStops: parseJsonBlock(
    docs.sourceStops,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-stop-conditions',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-acceptance-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2058, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '286afc5bc89dc7c1cebe2959bef7afec577d67a0',
  'source merge mismatch',
)
assert(parsed.source.planResult.limitedExternalAgentExecutionPlanCreated === true, 'source plan missing')
assert(parsed.source.soundCpuTools.readyForLimitedExternalAgentExecutionOwnerReview === 15, 'source owner review count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')
assert(parsed.sourceScope.limitedExecutionEnvelope.allowedToolCount === 15, 'source scope count mismatch')
assert(parsed.sourceStops.futureGateMustStopOn.includes('real user media path'), 'source stop real media missing')
assert(parsed.sourcePolicy.nextGateMayReviewLimitedExecutionPlan === true, 'source next review missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.reviewScope.reviewLimitedExecutionPlanOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.mayAcceptLimitedExecutionProofNext === true, 'prompt next proof missing')
assert(parsed.prompt.reviewScope.allowExecutionToday === false, 'prompt execution today widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2061, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === 'e74d6a44b2a9b442efd40178af91f6230a40f894',
  'result source merge mismatch',
)
assert(parsed.result.ownerReview.limitedExternalAgentExecutionPlanAccepted === true, 'plan acceptance missing')
assert(parsed.result.ownerReview.limitedExternalAgentExecutionProofMayProceedNext === true, 'next proof missing')
assert(parsed.result.ownerReview.acceptedForExecutionToday === false, 'execution today widened')
assert(parsed.result.ownerReview.acceptedForRealUserMediaToday === false, 'real media today widened')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentExecutionProof === 15, 'proof readiness count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real readiness widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPlanElements.toolCount === 15, 'acceptance tool count mismatch')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
for (const value of Object.values(parsed.acceptance.acceptedForNextProofOnly)) {
  assert(value === true, 'acceptedForNextProofOnly must remain true')
}
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'notAcceptedForToday must remain true')
}

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'limited_external_agent_execution_owner_review_pending',
  ),
  'owner-review blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some((row) => row.blockerId === 'limited_external_agent_execution_proof_pending'),
  'proof blocker missing',
)
assert(parsed.blockers.readyForLimitedExternalAgentExecutionProof === true, 'limited proof readiness missing')
assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker real execution widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker real tool readiness widened')

assert(parsed.policy.allowedClaims.limitedExternalAgentExecutionPlanOwnerReviewedClaimed === true, 'owner review claim missing')
assert(parsed.policy.allowedClaims.limitedExternalAgentExecutionProofMayProceedClaimed === true, 'proof may proceed claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.limitedExternalAgentExecutionProofPassedClaimed === false, 'proof pass claim widened')
assert(parsed.policy.blockedClaims.externalAgentExecutionReadyClaimed === false, 'execution readiness widened')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProof === true, 'next proof permission missing')
assert(parsed.policy.nextGateMayRunRealUserMedia === false, 'real media widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.proofScope.runLimitedExternalAgentBoundary === true, 'next limited boundary missing')
assert(parsed.next.proofScope.useSyntheticOrNoMediaInputsOnly === true, 'next synthetic/no-media missing')
assert(parsed.next.proofScope.allowedToolCount === 15, 'next tool count mismatch')
assertArrayEquals(parsed.next.proofScope.allowedWorkers, expectedWorkers, 'next workers')
assertArrayEquals(parsed.next.proofScope.allowedJobTypes, expectedJobTypes, 'next job types')
assert(parsed.next.proofScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.proofScope.allowSupabaseMutation === false, 'next Supabase widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2061,
      limitedExternalAgentExecutionProofMayProceedNext: true,
      soundCpuToolsCovered: 15,
      readyForLimitedExternalAgentExecutionProof: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
