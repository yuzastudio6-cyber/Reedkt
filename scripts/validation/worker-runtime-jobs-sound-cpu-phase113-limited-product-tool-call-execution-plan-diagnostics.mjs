import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase112_external_agent_readiness_owner_review_passed_with_warnings_ready_for_limited_product_tool_call_execution_plan_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase113_limited_product_tool_call_execution_plan_completed_with_warnings_ready_for_limited_product_tool_call_execution_owner_review_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE113-LIMITED-PRODUCT-TOOL-CALL-EXECUTION-OWNER-REVIEW'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-review-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-acceptance-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-plan.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-plan-result.md',
  scope:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-scope-register.md',
  stops:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-stop-conditions.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review.md',
}

const expectedWorkers = ['sound-cpu-analysis-worker', 'sound-audio-metadata-worker']
const expectedImages = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker',
]
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
    'allowProductToolCallExecutionToday',
    'allowRealExternalAgentExecutionToday',
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
    'productToolCallExecutionAllowedToday',
    'workerDispatchAllowedToday',
    'routeExecutionAllowedToday',
    'manifestPersistenceAllowedToday',
    'mediaOpenAllowedToday',
    'artifactWriteAllowedToday',
    'limitedProductToolCallExecutionProofPassedClaimed',
    'externalAgentExecutionReadyClaimed',
    'productToolCallExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'manifestPersistenceReadyClaimed',
    'realUserMediaExecutionReadyClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'realUserMediaBetaReadyClaimed',
    'externalBetaUnlockClaimed',
    'productionReadinessClaimed',
  ]
  for (const key of unsafe) {
    assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
  }
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-review-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-acceptance-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-plan',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-plan-result',
  ),
  scope: parseJsonBlock(
    docs.scope,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-scope-register',
  ),
  stops: parseJsonBlock(
    docs.stops,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-stop-conditions',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2066, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '3dc07c2ba17ff69f0b16701640689e9a3aa386eb',
  'source merge mismatch',
)
assert(parsed.source.ownerReview.externalAgentReadinessReconciliationAccepted === true, 'source acceptance missing')
assert(parsed.source.ownerReview.limitedProductToolCallExecutionPlanMayProceedNext === true, 'source next plan missing')
assert(parsed.source.ownerReview.acceptedForProductToolCallExecutionToday === false, 'source product execution widened')
assert(parsed.source.soundCpuTools.readyForLimitedProductToolCallExecutionPlan === 15, 'source plan count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')
assert(parsed.source.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE113-LIMITED-PRODUCT-TOOL-CALL-EXECUTION-PLAN', 'source next mismatch')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceAcceptance.acceptedEvidence.toolCountCovered === 15, 'source acceptance tool count mismatch')
assert(parsed.sourceAcceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'source acceptance real execution widened')
assertArrayEquals(parsed.sourceAcceptance.acceptedWorkers, expectedWorkers, 'source acceptance workers')
assertArrayEquals(parsed.sourceAcceptance.acceptedImages, expectedImages, 'source acceptance images')
assertArrayEquals(parsed.sourceAcceptance.acceptedJobTypes, expectedJobTypes, 'source acceptance job types')
for (const value of Object.values(parsed.sourceAcceptance.notAcceptedForToday)) {
  assert(value === true, 'source notAcceptedForToday must remain true')
}
assert(parsed.sourceBlockers.readyForLimitedProductToolCallExecutionPlan === true, 'source blocker plan missing')
assert(parsed.sourceBlockers.readyForRealExecutionToday === false, 'source blocker real execution widened')
assert(parsed.sourcePolicy.nextGateMayPlanLimitedProductToolCallExecution === true, 'source policy next plan missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product run widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planningScope.planLimitedProductToolCallExecutionOnly === true, 'prompt planning scope missing')
assert(parsed.prompt.planningScope.allowedToolCount === 15, 'prompt tool count mismatch')
assertArrayEquals(parsed.prompt.planningScope.allowedWorkers, expectedWorkers, 'prompt workers')
assertArrayEquals(parsed.prompt.planningScope.allowedImages, expectedImages, 'prompt images')
assertArrayEquals(parsed.prompt.planningScope.allowedJobTypes, expectedJobTypes, 'prompt job types')
assert(parsed.prompt.planningScope.allowProductToolCallExecutionToday === false, 'prompt product execution widened')
assert(parsed.prompt.planningScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2067, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '7fe47b567e444cad55bfe2546da59a0c0d972710',
  'result source merge mismatch',
)
assert(parsed.result.planResult.limitedProductToolCallExecutionPlanCreated === true, 'plan result missing')
assert(parsed.result.planResult.planUsesSyntheticOrNoMediaInputsOnly === true, 'synthetic/no-media plan missing')
assert(parsed.result.planResult.allowedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.planResult.readyForLimitedProductToolCallExecutionOwnerReview === 15, 'owner review count mismatch')
assert(parsed.result.planResult.readyForProductToolCallExecutionToday === 0, 'product execution count widened')
assert(parsed.result.planResult.readyForRealExternalAgentExecutionToday === 0, 'real execution count widened')
assert(parsed.result.planResult.realUserMediaAllowed === false, 'real media widened')
assert(parsed.result.soundCpuTools.limitedProductToolCallExecutionPlanCreated === 15, 'tool plan count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedProductToolCallExecutionOwnerReview === 15, 'tool owner review count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'tool real readiness widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.scope.limitedToolCallEnvelope.toolCount === 15, 'scope tool count mismatch')
assertArrayEquals(parsed.scope.limitedToolCallEnvelope.workers, expectedWorkers, 'scope workers')
assertArrayEquals(parsed.scope.limitedToolCallEnvelope.images, expectedImages, 'scope images')
assertArrayEquals(parsed.scope.limitedToolCallEnvelope.jobTypes, expectedJobTypes, 'scope job types')
assert(parsed.scope.limitedToolCallEnvelope.inputPolicy.syntheticOrNoMediaOnly === true, 'scope synthetic/no-media missing')
assert(parsed.scope.limitedToolCallEnvelope.inputPolicy.realUserMediaAllowed === false, 'scope real media widened')
assert(parsed.scope.limitedToolCallEnvelope.runtimePolicy.productToolCallExecutionAllowedToday === false, 'scope product execution widened')
assert(parsed.scope.limitedToolCallEnvelope.runtimePolicy.workerDispatchAllowedToday === false, 'scope worker dispatch widened')

assert(parsed.stops.futureGateMustStopOn.includes('real user media path'), 'stop real media missing')
assert(parsed.stops.futureGateMustStopOn.includes('Supabase mutation'), 'stop Supabase missing')
assert(parsed.stops.futureGateMustStopOn.includes('artifact creation'), 'stop artifact missing')
assert(parsed.stops.classificationOnStop.decision === 'worker_runtime_jobs_sound_cpu_phase113_blocked_limited_product_tool_call_execution_plan_safety_stop', 'stop decision mismatch')

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'limited_product_tool_call_execution_plan_pending',
  ),
  'plan blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'limited_product_tool_call_execution_owner_review_pending',
  ),
  'owner-review blocker missing',
)
assert(parsed.blockers.readyForLimitedProductToolCallExecutionOwnerReview === true, 'blocker owner review readiness missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product execution widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker real count widened')

assert(parsed.policy.allowedClaims.limitedProductToolCallExecutionPlanCreatedClaimed === true, 'policy plan claim missing')
assert(parsed.policy.allowedClaims.limitedProductToolCallExecutionOwnerReviewMayProceedClaimed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.limitedProductToolCallExecutionProofPassedClaimed === false, 'policy proof widened')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product readiness widened')
assert(parsed.policy.nextGateMayRunLimitedProductToolCallExecutionOwnerReview === true, 'policy next owner review missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution widened')
assert(parsed.policy.nextGateMayDispatchWorkers === false, 'policy dispatch widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.reviewScope.reviewLimitedProductToolCallExecutionPlanOnly === true, 'next review scope missing')
assert(parsed.next.reviewScope.mayAcceptLimitedProductToolCallExecutionProofNext === true, 'next proof permission missing')
assert(parsed.next.reviewScope.allowedToolCount === 15, 'next tool count mismatch')
assert(parsed.next.reviewScope.allowProductToolCallExecutionToday === false, 'next product execution widened')
assert(parsed.next.reviewScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.reviewScope.allowWorkerDispatchToday === false, 'next dispatch widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2067,
      limitedProductToolCallExecutionPlanCreated: true,
      readyForLimitedProductToolCallExecutionOwnerReview: 15,
      readyForProductToolCallExecutionToday: 0,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
