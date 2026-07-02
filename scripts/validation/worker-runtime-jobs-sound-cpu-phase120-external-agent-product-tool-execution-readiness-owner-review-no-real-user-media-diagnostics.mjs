import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase120_external_agent_product_tool_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_external_agent_product_tool_execution_readiness_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase120_external_agent_product_tool_execution_readiness_owner_review_passed_with_warnings_ready_for_controlled_product_tool_call_execution_plan_no_real_user_media'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase121_controlled_product_tool_call_execution_plan_no_real_user_media_completed_with_warnings_ready_for_controlled_product_tool_call_execution_plan_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE121-CONTROLLED-PRODUCT-TOOL-CALL-EXECUTION-PLAN-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media-result.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-evidence-register-no-real-user-media.md',
  sourceScope:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-scope-register-no-real-user-media.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-blocker-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-acceptance-register-no-real-user-media.md',
  handoff:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-plan-handoff-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-no-real-user-media.md',
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
    'readyForProductToolCallExecutionToday',
    'readyForRealExternalAgentExecutionToday',
    'readyForRealUserMediaExecutionToday',
    'productToolCallExecutionReadyClaimed',
    'realExternalAgentExecutionReadyClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media-result',
  ),
  sourceEvidence: parseJsonBlock(
    docs.sourceEvidence,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-evidence-register-no-real-user-media',
  ),
  sourceScope: parseJsonBlock(
    docs.sourceScope,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-scope-register-no-real-user-media',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-blocker-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-acceptance-register-no-real-user-media',
  ),
  handoff: parseJsonBlock(
    docs.handoff,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-plan-handoff-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase121-controlled-product-tool-call-execution-plan-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2086, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === 'fb2334f0595f16afed9031001b9387ec04d17fce',
  'source merge mismatch',
)
assert(parsed.source.reconciliationResult.whatHappenedEvidenceRecorded === true, 'source what-happened missing')
assert(parsed.source.reconciliationResult.sourceNoSideEffectsAccepted === true, 'source no side effects missing')
assert(parsed.source.reconciliationResult.toolCountCovered === 15, 'source tool count mismatch')
assert(parsed.source.reconciliationResult.readyForExternalAgentProductToolExecutionReadinessOwnerReview === 15, 'source owner review count mismatch')
assert(parsed.source.reconciliationResult.readyForProductToolCallExecutionToday === 0, 'source product execution widened')
assert(parsed.source.reconciliationResult.readyForRealExternalAgentExecutionToday === 0, 'source real external widened')
assert(parsed.source.soundCpuTools.readyForExternalAgentProductToolExecutionReadinessOwnerReview === 15, 'source tool owner review count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source tool product widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')

assert(parsed.sourceEvidence.sourceEvidence.whatHappenedEvidenceRecorded === true, 'evidence what-happened missing')
assert(parsed.sourceEvidence.sourceEvidence.toolCountCovered === 15, 'evidence tool count mismatch')
assertArrayEquals(parsed.sourceEvidence.reconciledWorkers, expectedWorkers, 'evidence workers')
assertArrayEquals(parsed.sourceEvidence.reconciledImages, expectedImages, 'evidence images')
assertArrayEquals(parsed.sourceEvidence.reconciledJobTypes, expectedJobTypes, 'evidence job types')
for (const value of Object.values(parsed.sourceEvidence.evidenceLimitations)) {
  assert(value === true, 'evidence limitation must remain true')
}
assert(parsed.sourceScope.readinessScope.readyForExternalAgentProductToolExecutionReadinessOwnerReview === true, 'source scope owner review missing')
assert(parsed.sourceScope.readinessScope.productToolCallExecutionToday === false, 'source scope product widened')
assert(parsed.sourceBlockers.readyForExternalAgentProductToolExecutionReadinessOwnerReview === true, 'source blockers owner review missing')
assert(parsed.sourcePolicy.nextGateMayRunExternalAgentProductToolExecutionReadinessOwnerReview === true, 'source policy next missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecution === false, 'source policy product widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewReadinessReconciliationOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.allowedToolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.reviewScope.mayPlanControlledProductToolCallExecutionNext === true, 'prompt plan next missing')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product widened')
assert(parsed.prompt.reviewScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2087, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === 'd7a1986fe6133eb6f01d3414c88c80e42e2ff730',
  'result source merge mismatch',
)
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'result source decision mismatch')
assert(parsed.result.ownerReview.externalAgentProductToolExecutionReadinessReconciliationAccepted === true, 'result reconciliation acceptance missing')
assert(parsed.result.ownerReview.whatHappenedEvidenceRecorded === true, 'result what-happened missing')
assert(parsed.result.ownerReview.controlledProductToolCallExecutionPlanMayProceedNext === true, 'result next plan missing')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.ownerReview.acceptedForControlledProductToolCallExecutionPlanToday === false, 'result plan execution widened')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'result product widened')
assert(parsed.result.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'result real agent widened')
assert(parsed.result.soundCpuTools.externalAgentProductToolExecutionReadinessOwnerReviewed === 15, 'result owner reviewed count mismatch')
assert(parsed.result.soundCpuTools.readyForControlledProductToolCallExecutionPlanNoRealUserMedia === 15, 'result plan count mismatch')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedReadinessEvidence.phase120ReadinessReconciliationAccepted === true, 'acceptance reconciliation missing')
assert(parsed.acceptance.acceptedReadinessEvidence.whatHappenedEvidenceRecorded === true, 'acceptance what-happened missing')
assert(parsed.acceptance.acceptedReadinessEvidence.toolCountCovered === 15, 'acceptance tool count mismatch')
assertArrayEquals(parsed.acceptance.acceptedWorkers, expectedWorkers, 'acceptance workers')
assertArrayEquals(parsed.acceptance.acceptedImages, expectedImages, 'acceptance images')
assertArrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'acceptance job types')
assert(parsed.acceptance.acceptedForNextPlanOnly.controlledProductToolCallExecutionPlanMayProceed === true, 'acceptance next plan missing')
for (const value of Object.values(parsed.acceptance.notAcceptedForToday)) {
  assert(value === true, 'acceptance notAcceptedForToday must remain true')
}

assert(parsed.handoff.nextPlanTarget.prompt === nextPrompt, 'handoff next prompt mismatch')
assert(parsed.handoff.nextPlanTarget.expectedDecision === nextDecision, 'handoff expected mismatch')
assert(parsed.handoff.nextPlanTarget.mayCreatePlan === true, 'handoff plan missing')
assert(parsed.handoff.nextPlanTarget.mayExecuteProductToolCalls === false, 'handoff product widened')
assert(parsed.handoff.nextPlanTarget.mayUseRealExternalAgents === false, 'handoff real agent widened')
assert(parsed.handoff.nextPlanTarget.mayUseRealUserMedia === false, 'handoff real media widened')
assert(parsed.handoff.requiredEvidenceToCarryForward.toolCountCovered === 15, 'handoff tool count mismatch')
assert(parsed.handoff.requiredEvidenceToCarryForward.whatHappenedEvidenceRecorded === true, 'handoff what-happened missing')
assert(parsed.handoff.requiredEvidenceToCarryForward.noSideEffectsVerified === true, 'handoff side effects missing')

assert(parsed.blockers.readyForControlledProductToolCallExecutionPlanNoRealUserMedia === true, 'blocker plan missing')
assert(parsed.blockers.readyForProductToolCallExecutionToday === false, 'blocker product widened')
assert(parsed.blockers.readyForRealExternalAgentExecutionToday === false, 'blocker real agent widened')
assert(parsed.blockers.soundCpuToolsReadyForControlledProductToolCallExecutionPlanNoRealUserMedia === 15, 'blocker plan count mismatch')
assert(parsed.blockers.soundCpuToolsReadyForProductToolCallExecutionToday === 0, 'blocker product count widened')

assert(parsed.policy.allowedClaims.externalAgentProductToolExecutionReadinessOwnerReviewedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.controlledProductToolCallExecutionPlanMayProceedClaimed === true, 'policy plan missing')
assert(parsed.policy.allowedClaims.whatHappenedEvidenceRecordedClaimed === true, 'policy what-happened missing')
assert(parsed.policy.blockedClaims.productToolCallExecutionReadyClaimed === false, 'policy product widened')
assert(parsed.policy.blockedClaims.realExternalAgentExecutionReadyClaimed === false, 'policy real agent widened')
assert(parsed.policy.nextGateMayRunControlledProductToolCallExecutionPlan === true, 'policy next missing')
assert(parsed.policy.nextGateMayRunProductToolCallExecution === false, 'policy product execution widened')
assert(parsed.policy.nextGateMayRunRealExternalAgentExecution === false, 'policy real agent widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next prompt source mismatch')
assert(parsed.next.expectedDecision === nextDecision, 'next prompt expected mismatch')
assert(parsed.next.planScope.planControlledProductToolCallExecutionOnly === true, 'next prompt plan scope mismatch')
assert(parsed.next.planScope.allowedToolCount === 15, 'next prompt tool count mismatch')
assert(parsed.next.planScope.useSyntheticOrNoMediaInputsOnly === true, 'next prompt no media missing')
assert(parsed.next.planScope.requireWhatHappenedEvidenceRecorded === true, 'next prompt what-happened missing')
assert(parsed.next.planScope.allowProductToolCallExecutionToday === false, 'next prompt product widened')
assert(parsed.next.planScope.allowRealExternalAgentExecutionToday === false, 'next prompt real agent widened')
assert(parsed.next.planScope.allowRealUserMedia === false, 'next prompt real media widened')
assert(parsed.next.planScope.allowWorkerDispatchToday === false, 'next prompt worker widened')
assert(parsed.next.planScope.allowSupabaseMutationToday === false, 'next prompt Supabase widened')
assert(parsed.next.planScope.allowArtifactCreationToday === false, 'next prompt artifact widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourceDecision,
      sourcePr: 2087,
      sourceMergeCommit: 'd7a1986fe6133eb6f01d3414c88c80e42e2ff730',
      acceptedToolCount: 15,
      controlledProductToolCallExecutionPlanMayProceedNext: true,
      productToolCallExecutionToday: 0,
      realExternalAgentExecutionToday: 0,
      realUserMediaExecutionToday: 0,
      nextPrompt,
      supabase: 'no-op',
    },
    null,
    2,
  ),
)
