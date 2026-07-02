import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase129_no_real_user_media_beta_readiness_reconciliation_completed_with_warnings_ready_for_beta_readiness_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase129_beta_readiness_owner_review_passed_with_warnings_ready_for_bounded_no_real_user_media_beta_gate'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE130-BOUNDED-NO-REAL-USER-MEDIA-BETA-GATE'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-reconciliation-result.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-evidence-register.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-acceptance-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate.md',
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
    'allowExternalBetaUnlockInThisGate',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
    'allowWorkerDispatch',
    'allowRouteExecution',
    'allowSupabaseMutation',
    'allowArtifactCreation',
    'externalBetaUnlockClaimed',
    'realUserMediaBetaReadyClaimed',
    'paidProductionReadyClaimed',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-reconciliation-result',
  ),
  sourceEvidence: parseJsonBlock(
    docs.sourceEvidence,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-evidence-register',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase129-no-real-user-media-beta-readiness-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-acceptance-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2116, 'source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === 'b8aaea00118564fac51e83410382bf596142ff13', 'source merge mismatch')
assert(parsed.sourceResult.reconciliation.boundedExternalBetaNoRealUserMediaReviewMayProceed === true, 'source owner review missing')
assert(parsed.sourceResult.reconciliation.externalBetaUnlockToday === false, 'source beta widened')
assert(parsed.sourceResult.reconciliation.realUserMediaBetaToday === false, 'source real media widened')
assert(parsed.sourceEvidence.acceptedEvidence.controlledInvocationCount === 4, 'source evidence invocation mismatch')
assert(parsed.sourceEvidence.acceptedEvidence.toolCountCoveredPerInvocation === 15, 'source evidence tool mismatch')
assert(parsed.sourcePolicy.allowedClaims.noRealUserMediaBetaReadinessReconciliationCompletedClaimed === true, 'source policy reconciliation missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected decision mismatch')
assert(parsed.prompt.reviewScope.reviewNoRealUserMediaReadinessOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.mayApproveBoundedNoRealUserMediaBetaGateNext === true, 'prompt next gate missing')
assert(parsed.prompt.reviewScope.allowExternalBetaUnlockInThisGate === false, 'prompt beta widened')
assert(parsed.prompt.reviewScope.allowRealUserMediaBeta === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2118, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '5c576ea279ae30429db1d81fc7e24be965c41611', 'result source merge mismatch')
assert(parsed.result.ownerReview.noRealUserMediaBetaReadinessReconciliationAccepted === true, 'result reconciliation missing')
assert(parsed.result.ownerReview.boundedNoRealUserMediaBetaGateMayProceedNext === true, 'result next gate missing')
assert(parsed.result.ownerReview.externalBetaUnlockedInThisGate === false, 'result beta widened')
assert(parsed.result.ownerReview.realUserMediaBetaUnlocked === false, 'result real media widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedReadinessEvidence.phase129ReconciliationPr === 2118, 'acceptance PR mismatch')
assert(parsed.acceptance.acceptedReadinessEvidence.toolCount === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedReadinessEvidence.invocationCount === 4, 'acceptance invocation mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.boundedNoRealUserMediaBetaGateMayProceed === true, 'acceptance next gate missing')
assert(parsed.acceptance.acceptedForNextGateOnly.externalBetaUnlockInThisGate === false, 'acceptance beta widened')

assert(parsed.blockers.readyForBoundedNoRealUserMediaBetaGate === true, 'blockers next gate missing')
assert(parsed.blockers.externalBetaUnlockedToday === false, 'blockers beta widened')
assert(parsed.blockers.realUserMediaBetaReady === false, 'blockers real media widened')
assert(parsed.blockers.paidProductionReady === false, 'blockers production widened')
for (const [key, value] of Object.entries(parsed.blockers.remainingBlocks)) assert(value === true, `${key} should remain blocked`)

assert(parsed.policy.allowedClaims.betaReadinessOwnerReviewedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.boundedNoRealUserMediaBetaGateMayProceedClaimed === true, 'policy next gate missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase130_bounded_no_real_user_media_beta_gate_completed_with_warnings_ready_for_external_beta_owner_review', 'next expected mismatch')
assert(parsed.next.gateScope.mayEvaluateBoundedNoRealUserMediaBetaGate === true, 'next gate scope missing')
assert(parsed.next.gateScope.allowExternalBetaUnlockInThisGate === false, 'next beta widened')
assert(parsed.next.gateScope.allowRealUserMediaBeta === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2118,
      boundedNoRealUserMediaBetaGateMayProceedNext: true,
      externalBetaUnlockedInThisGate: false,
      realUserMediaBetaReady: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
