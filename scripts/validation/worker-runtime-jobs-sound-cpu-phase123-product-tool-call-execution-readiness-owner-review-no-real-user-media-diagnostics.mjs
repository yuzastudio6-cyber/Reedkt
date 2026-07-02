import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase123_product_tool_call_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_product_tool_call_execution_readiness_owner_review_no_real_user_media'
const decision =
  'worker_runtime_jobs_sound_cpu_phase123_product_tool_call_execution_readiness_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_plan_no_real_user_media'
const nextDecision =
  'worker_runtime_jobs_sound_cpu_phase124_limited_external_agent_product_tool_call_execution_plan_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_plan_owner_review_no_real_user_media'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE124-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-PLAN-NO-REAL-USER-MEDIA'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-reconciliation-no-real-user-media-result.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-evidence-register-no-real-user-media.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-blocker-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-acceptance-register-no-real-user-media.md',
  handoff:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-plan-handoff-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-no-real-user-media.md',
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
    'allowLimitedExternalAgentProductToolCallExecutionToday',
    'allowProductToolCallExecutionToday',
    'allowRealExternalAgentExecutionToday',
    'allowRealUserMedia',
    'allowWorkerDispatchToday',
    'allowRouteExecutionToday',
    'allowManifestPersistenceToday',
    'allowSupabaseMutationToday',
    'allowSqlExecutionToday',
    'allowArtifactCreationToday',
    'limitedExternalAgentProductToolCallExecutionReadyClaimed',
    'productToolCallExecutionReadyClaimed',
    'realExternalAgentExecutionReadyClaimed',
    'workerReadinessClaimed',
    'runtimeReadinessClaimed',
    'realUserMediaExecutionReadyClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
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
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-reconciliation-no-real-user-media-result',
  ),
  sourceEvidence: parseJsonBlock(
    docs.sourceEvidence,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-evidence-register-no-real-user-media',
  ),
  sourceBlockers: parseJsonBlock(
    docs.sourceBlockers,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-blocker-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-acceptance-register-no-real-user-media',
  ),
  handoff: parseJsonBlock(
    docs.handoff,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-plan-handoff-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase123-product-tool-call-execution-readiness-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase124-limited-external-agent-product-tool-call-execution-plan-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2095, 'source PR mismatch')
assert(
  parsed.source.sourceVerification.sourceMergeCommit === '450d6ad6e19fa5cde1bc7602ca9dfc335d080897',
  'source merge mismatch',
)
assert(parsed.source.reconciliationResult.toolCountReconciled === 15, 'source tool count mismatch')
assert(parsed.source.reconciliationResult.whatHappenedEvidenceCarriedForward === true, 'source evidence missing')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia === 15, 'source owner review count mismatch')
assert(parsed.source.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'source product widened')
assertNoOpClassification(parsed.source.supabaseClassification, 'source.supabaseClassification')
assert(parsed.sourceEvidence.reconciledToolCount === 15, 'source evidence tool count mismatch')
assert(parsed.sourceBlockers.readyForProductToolCallExecutionReadinessOwnerReviewNoRealUserMedia === true, 'source blocker readiness missing')
assert(parsed.sourcePolicy.nextGateMayRunProductToolCallExecutionReadinessOwnerReview === true, 'source policy owner review missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecisionOnPass === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewReadinessReconciliationOnly === true, 'prompt review scope missing')
assert(parsed.prompt.reviewScope.mayPlanLimitedExternalAgentProductToolCallsNext === true, 'prompt limited plan missing')
assert(parsed.prompt.reviewScope.allowProductToolCallExecutionToday === false, 'prompt product widened')
assert(parsed.prompt.reviewScope.allowRealExternalAgentExecutionToday === false, 'prompt real agent widened')
assert(parsed.prompt.reviewScope.allowRealUserMedia === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2096, 'result source PR mismatch')
assert(
  parsed.result.sourceVerification.sourceMergeCommit === 'c8287c37ba5d20f3811356372a108d2d6ac7860f',
  'result source merge mismatch',
)
assert(parsed.result.ownerReview.productToolCallExecutionReadinessReconciliationAccepted === true, 'result reconciliation missing')
assert(parsed.result.ownerReview.limitedExternalAgentProductToolCallExecutionPlanMayProceedNext === true, 'result limited plan missing')
assert(parsed.result.ownerReview.acceptedToolCount === 15, 'result tool count mismatch')
assert(parsed.result.ownerReview.acceptedForProductToolCallExecutionToday === false, 'result product widened')
assert(parsed.result.ownerReview.acceptedForRealExternalAgentExecutionToday === false, 'result real agent widened')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionPlanNoRealUserMedia === 15, 'result limited plan count mismatch')
assert(parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionToday === 0, 'result limited execution widened')
assert(parsed.result.soundCpuTools.readyForProductToolCallExecutionToday === 0, 'result product count widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')
assert(parsed.acceptance.acceptedReadinessEvidence.toolCountReconciled === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedForNextPlanOnly.limitedExternalAgentProductToolCallExecutionPlanMayProceed === true, 'acceptance next plan missing')
assert(parsed.handoff.nextPlanTarget.prompt === nextPrompt, 'handoff next prompt mismatch')
assert(parsed.handoff.nextPlanTarget.expectedDecision === nextDecision, 'handoff next decision mismatch')
assert(parsed.handoff.nextPlanTarget.mayRunLimitedExternalAgentProductToolCalls === false, 'handoff limited execution widened')
assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionPlanNoRealUserMedia === true, 'blocker plan readiness missing')
assert(parsed.blockers.readyForLimitedExternalAgentProductToolCallExecutionToday === false, 'blocker limited execution widened')
assert(parsed.blockers.soundCpuToolsReadyForLimitedExternalAgentPlan === 15, 'blocker tool count mismatch')
assert(parsed.policy.allowedClaims.limitedExternalAgentProductToolCallExecutionPlanMayProceedClaimed === true, 'policy next plan missing')
assert(Object.values(parsed.policy.blockedClaims).every((value) => value === false), 'policy blocked claims mismatch')
assert(parsed.policy.nextGateMayCreateLimitedExternalAgentProductToolCallExecutionPlan === true, 'policy next plan missing')
assert(parsed.policy.nextGateMayRunLimitedExternalAgentProductToolCalls === false, 'policy limited execution widened')
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')
assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecisionOnPass === nextDecision, 'next decision mismatch')
assert(parsed.next.planScope.planLimitedExternalAgentProductToolCalls === true, 'next plan scope missing')
assert(parsed.next.planScope.allowLimitedExternalAgentProductToolCallExecutionToday === false, 'next limited execution widened')
assert(parsed.next.planScope.allowRealUserMedia === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: parsed.result.sourceVerification.sourcePr,
      readyForLimitedExternalAgentProductToolCallExecutionPlanNoRealUserMedia:
        parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionPlanNoRealUserMedia,
      readyForLimitedExternalAgentProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForLimitedExternalAgentProductToolCallExecutionToday,
      readyForProductToolCallExecutionToday:
        parsed.result.soundCpuTools.readyForProductToolCallExecutionToday,
      readyForRealExternalAgentExecutionToday:
        parsed.result.soundCpuTools.readyForRealExternalAgentExecutionToday,
      nextPrompt,
    },
    null,
    2,
  ),
)
