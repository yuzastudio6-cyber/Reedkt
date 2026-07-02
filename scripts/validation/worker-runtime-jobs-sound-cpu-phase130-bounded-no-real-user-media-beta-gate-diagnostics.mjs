import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase129_beta_readiness_owner_review_passed_with_warnings_ready_for_bounded_no_real_user_media_beta_gate'
const decision =
  'worker_runtime_jobs_sound_cpu_phase130_bounded_no_real_user_media_beta_gate_completed_with_warnings_ready_for_external_beta_owner_review'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE130-EXTERNAL-BETA-OWNER-REVIEW-NO-REAL-USER-MEDIA'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-review-no-real-user-media-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-acceptance-register-no-real-user-media.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-claim-policy-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-result.md',
  scorecard:
    'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-scorecard.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-boundary-register.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-blocker-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-claim-policy.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-review-no-real-user-media.md',
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
    'worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-review-no-real-user-media-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-acceptance-register-no-real-user-media',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase129-beta-readiness-owner-claim-policy-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-result',
  ),
  scorecard: parseJsonBlock(
    docs.scorecard,
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-scorecard',
  ),
  boundary: parseJsonBlock(
    docs.boundary,
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-boundary-register',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-blocker-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-claim-policy',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-review-no-real-user-media',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2118, 'source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '5c576ea279ae30429db1d81fc7e24be965c41611', 'source merge mismatch')
assert(parsed.sourceResult.ownerReview.boundedNoRealUserMediaBetaGateMayProceedNext === true, 'source did not open gate')
assert(parsed.sourceResult.ownerReview.externalBetaUnlockedInThisGate === false, 'source beta widened')
assert(parsed.sourceAcceptance.acceptedForNextGateOnly.boundedNoRealUserMediaBetaGateMayProceed === true, 'source acceptance missing')
assert(parsed.sourceAcceptance.acceptedForNextGateOnly.externalBetaUnlockInThisGate === false, 'source acceptance beta widened')
assert(parsed.sourcePolicy.allowedClaims.boundedNoRealUserMediaBetaGateMayProceedClaimed === true, 'source policy missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.gateScope.mayEvaluateBoundedNoRealUserMediaBetaGate === true, 'prompt gate missing')
assert(parsed.prompt.gateScope.mayClaimBoundedNoRealUserMediaBetaGateCompleted === true, 'prompt completion missing')
assert(parsed.prompt.gateScope.allowExternalBetaUnlockInThisGate === false, 'prompt beta widened')
assert(parsed.prompt.gateScope.allowRealUserMediaBeta === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2119, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '8a19947f20e9e2330396186d3fa8c81d79ec1989', 'result source merge mismatch')
assert(parsed.result.gateResult.boundedNoRealUserMediaBetaGateCompleted === true, 'result gate not completed')
assert(parsed.result.gateResult.externalBetaOwnerReviewMayProceedNext === true, 'result owner review missing')
assert(parsed.result.gateResult.externalBetaUnlockedInThisGate === false, 'result beta widened')
assert(parsed.result.gateResult.realUserMediaBetaUnlocked === false, 'result real media widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.scorecard.scorecard.controlledNoRealUserMediaProductToolCallProof === 'passed', 'scorecard proof mismatch')
assert(parsed.scorecard.scorecard.toolCountCovered === 15, 'scorecard tool count mismatch')
assert(parsed.scorecard.scorecard.invocationCountCovered === 4, 'scorecard invocation mismatch')
assert(parsed.scorecard.scorecard.realUserMediaUsed === false, 'scorecard real media widened')
assert(parsed.scorecard.scorecard.workerDispatched === false, 'scorecard worker dispatch widened')
assert(parsed.scorecard.gateDisposition.readyForExternalBetaOwnerReviewNoRealUserMedia === true, 'scorecard owner review missing')
assert(parsed.scorecard.gateDisposition.externalBetaUnlockedToday === false, 'scorecard beta widened')

assert(parsed.boundary.enabledByThisGate.externalBetaOwnerReviewMayProceed === true, 'boundary owner review missing')
assert(parsed.boundary.enabledByThisGate.boundedNoRealUserMediaBetaGateCompletedClaimMayProceed === true, 'boundary claim missing')
for (const [key, value] of Object.entries(parsed.boundary.notEnabledByThisGate)) assert(value === true, `${key} should remain not enabled`)

assert(parsed.blockers.readyForExternalBetaOwnerReviewNoRealUserMedia === true, 'blockers owner review missing')
assert(parsed.blockers.externalBetaUnlockedToday === false, 'blockers beta widened')
assert(parsed.blockers.realUserMediaBetaReady === false, 'blockers real media widened')
assert(parsed.blockers.paidProductionReady === false, 'blockers production widened')
for (const [key, value] of Object.entries(parsed.blockers.remainingBlocks)) assert(value === true, `${key} should remain blocked`)

assert(parsed.policy.allowedClaims.boundedNoRealUserMediaBetaGateCompletedClaimed === true, 'policy completed claim missing')
assert(parsed.policy.allowedClaims.externalBetaOwnerReviewMayProceedClaimed === true, 'policy owner review missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase130_external_beta_owner_review_passed_with_warnings_ready_for_bounded_no_real_user_media_external_beta_enablement', 'next expected mismatch')
assert(parsed.next.reviewScope.reviewBoundedNoRealUserMediaBetaGateOnly === true, 'next review scope mismatch')
assert(parsed.next.reviewScope.mayApproveBoundedNoRealUserMediaExternalBetaEnablementNext === true, 'next enablement missing')
assert(parsed.next.reviewScope.allowExternalBetaUnlockInThisGate === false, 'next beta widened')
assert(parsed.next.reviewScope.allowRealUserMediaBeta === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2119,
      boundedNoRealUserMediaBetaGateCompleted: true,
      readyForExternalBetaOwnerReviewNoRealUserMedia: true,
      externalBetaUnlockedInThisGate: false,
      realUserMediaBetaReady: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
