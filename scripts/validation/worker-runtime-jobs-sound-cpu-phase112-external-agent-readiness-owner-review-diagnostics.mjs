import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase112_external_agent_readiness_reconciliation_completed_with_warnings_ready_for_external_agent_readiness_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase112_external_agent_readiness_owner_review_passed_with_warnings_ready_for_limited_product_tool_call_execution_plan_no_real_user_media'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE113-LIMITED-PRODUCT-TOOL-CALL-EXECUTION-PLAN'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-reconciliation-result.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-evidence-register.md',
  sourceScope:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-scope-register.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-blocker-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-acceptance-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-plan.md',
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
    'acceptedForRealExternalAgentExecutionToday',
    'acceptedForProductToolCallExecutionToday',
    'acceptedForWorkerDispatchToday',
    'acceptedForRouteExecutionToday',
    'acceptedForManifestPersistenceToday',
    'acceptedForMediaOpenToday',
    'acceptedForSupabaseMutationToday',
    'acceptedForSqlExecutionToday',
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
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-reconciliation-result',
  ),
  sourceEvidence: parseJsonBlock(
    docs.sourceEvidence,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-evidence-register',
  ),
  sourceScope: parseJsonBlock(
    docs.sourceScope,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-scope-register',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-blocker-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-acceptance-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase112-external-agent-readiness-owner-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2064, 'source sourcePr mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '103ca34f5bda2dc80df3bd86b15a9b35a056456b',
  'source merge mismatch',
)
assert(parsed.source.reconciliationResult.limitedExternalAgentProofReconciled === true, 'source reconciliation missing')
assert(parsed.source.reconciliationResult.toolCountCovered === 15, 'source tool count mismatch')
assert(parsed.source.reconciliationResult.readyForExternalAgentReadinessOwnerReview === 15, 'source owner review count mismatch')
assert(parsed.source.reconciliationResult.readyForRealExternalAgentExecutionToday === 0, 'source real execution widened')
assert(parsed.source.soundCpuTools.readyForExternalAgentReadinessOwnerReview === 15, 'source tool owner review count mismatch')
assert(parsed.source.soundCpuTools.readyForRealExecutionToday === 0, 'source real readiness widened')
assert(parsed.source.selectedNextPrompt === 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE112-EXTERNAL-AGENT-READINESS-OWNER-REVIEW', 'source next prompt mismatch')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceEvidence.sourceEvidence.phase112ReadinessReconciliationCompleted === true, 'source evidence phase112 missing')
assert(parsed.sourceEvidence.reconciledToolCount === 15, 'source evidence tool count mismatch')
assertArrayEquals(parsed.sourceEvidence.reconciledWorkers, expectedWorkers, 'source evidence workers')
assertArrayEquals(parsed.sourceEvidence.reconciledImages, expectedImages, 'source evidence images')
assertArrayEquals(parsed.sourceEvidence.reconciledJobTypes, expectedJobTypes, 'source evidence job types')
for (const value of Object.values(parsed.sourceEvidence.evidenceLimitations)) {
  assert(value === true, 'source evidence limitations must remain true')
}
assert(parsed.sourceScope.readinessScope.readyForExternalAgentReadinessOwnerReview === true, 'source scope owner review missing')
assert(parsed.sourceScope.readinessScope.readyForLimitedProductToolCallPlanning === false, 'source scope product planning widened')
assert(parsed.sourceScope.readinessScope.readyForRealExternalAgentExecutionToday === false, 'source scope real execution widened')
assert(parsed.sourceScope.countSummary.toolsReadyForOwnerReview === 15, 'source scope owner review count mismatch')
assert(parsed.sourceScope.countSummary.toolsReadyForRealExecutionToday === 0, 'source scope real count mismatch')
assert(parsed.sourceBlockers.readyForExternalAgentReadinessOwnerReview === true, 'source blocker owner review missing')
assert(parsed.sourceBlockers.readyForRealExecutionToday === false, 'source blocker real execution widened')
assert(parsed.sourcePolicy.nextGateMayRunExternalAgentReadinessOwnerReview === true, 'source policy owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunRealExternalAgentExecution === false, 'source policy real execution widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reviewScope.reviewExternalAgentReadinessReconciliationOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.mayAcceptLimitedProductToolCallExecutionPlanNext === true, 'prompt next plan missing')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.allowExecutionToday === false, 'prompt execution widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2066, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === '3dc07c2ba17ff69f0b16701640689e9a3aa386eb',
  'result source merge mismatch',
)
assert(parsed.result.ownerReview.externalAgentReadinessReconciliationAccepted === true, 'owner review acceptance missing')
assert(parsed.result.ownerReview.limitedProductToolCallExecutionPlanMayProceedNext === true, 'next plan missing')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'product execution widened')
assert(parsed.result.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'real execution widened')
assert(parsed.result.ownerReview.acceptedForWorkerDispatchToday === false, 'worker dispatch widened')
assert(parsed.result.ownerReview.acceptedForRouteExecutionToday === false, 'route execution widened')
assert(parsed.result.soundCpuTools.readyForLimitedProductToolCallExecutionPlan === 15, 'plan count mismatch')
assert(parsed.result.soundCpuTools.readyForRealExecutionToday === 0, 'result real execution widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedEvidence.externalAgentReadinessReconciliationCompleted === true, 'acceptance reconciliation missing')
assert(parsed.acceptance.acceptedEvidence.limitedExternalAgentProofReconciled === true, 'acceptance proof missing')
assert(parsed.acceptance.acceptedEvidence.toolCountCovered === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedEvidence.readyForRealExecutionToday === 0, 'acceptance real execution widened')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
for (const value of Object.values(parsed.acceptance.acceptedForNextPlanningOnly)) {
  assert(value === true, 'acceptedForNextPlanningOnly must remain true')
}
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'notAcceptedForToday must remain true')
}

assert(
  parsed.blockers.resolvedForThisGate.some(
    (row) => row.blockerId === 'external_agent_readiness_owner_review_pending',
  ),
  'owner review blocker resolution missing',
)
assert(
  parsed.blockers.remainingBlockers.some(
    (row) => row.blockerId === 'limited_product_tool_call_execution_plan_pending',
  ),
  'limited product tool-call plan blocker missing',
)
assert(parsed.blockers.readyForLimitedProductToolCallExecutionPlan === true, 'limited plan readiness missing')
assert(parsed.blockers.readyForRealExecutionToday === false, 'blocker real execution widened')
assert(parsed.blockers.soundCpuToolsReadyForRealExecutionToday === 0, 'blocker real count widened')

assert(parsed.policy.allowedClaims.externalAgentReadinessOwnerReviewedClaimed === true, 'policy owner review claim missing')
assert(parsed.policy.allowedClaims.limitedProductToolCallExecutionPlanMayProceedClaimed === true, 'policy plan claim missing')
assert(parsed.policy.allowedClaims.soundCpuToolCountCoveredClaimed === 15, 'policy tool count mismatch')
assert(parsed.policy.blockedClaims.externalAgentExecutionReadyClaimed === false, 'policy external execution widened')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product execution widened')
assert(parsed.policy.nextGateMayPlanLimitedProductToolCallExecution === true, 'policy next plan missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution run widened')
assert(parsed.policy.nextGateMayRunRealExternalAgentExecution === false, 'policy real execution widened')
assert(parsed.policy.nextGateMayDispatchWorkers === false, 'policy dispatch widened')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.planningScope.planLimitedProductToolCallExecutionOnly === true, 'next planning scope missing')
assert(parsed.next.planningScope.allowedToolCount === 15, 'next tool count mismatch')
assertArrayEquals(parsed.next.planningScope.allowedWorkers, expectedWorkers, 'next workers')
assertArrayEquals(parsed.next.planningScope.allowedImages, expectedImages, 'next images')
assertArrayEquals(parsed.next.planningScope.allowedJobTypes, expectedJobTypes, 'next job types')
assert(parsed.next.planningScope.allowExecutionToday === false, 'next execution today widened')
assert(parsed.next.planningScope.allowProductToolCallExecutionToday === false, 'next product execution widened')
assert(parsed.next.planningScope.allowRealExternalAgentExecutionToday === false, 'next real execution widened')
assert(parsed.next.planningScope.allowRealUserMedia === false, 'next real media widened')
assert(parsed.next.planningScope.allowWorkerDispatchToday === false, 'next worker dispatch widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2066,
      externalAgentReadinessOwnerReviewed: true,
      limitedProductToolCallExecutionPlanMayProceedNext: true,
      readyForLimitedProductToolCallExecutionPlan: 15,
      readyForRealExecutionToday: 0,
      nextPrompt,
    },
    null,
    2,
  ),
)
