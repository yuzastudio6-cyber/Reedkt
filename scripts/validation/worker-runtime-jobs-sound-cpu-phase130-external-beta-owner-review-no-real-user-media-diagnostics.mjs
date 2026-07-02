import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase130_bounded_no_real_user_media_beta_gate_completed_with_warnings_ready_for_external_beta_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase130_external_beta_owner_review_passed_with_warnings_ready_for_bounded_no_real_user_media_external_beta_enablement'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE131-BOUNDED-NO-REAL-USER-MEDIA-EXTERNAL-BETA-ENABLEMENT'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-result.md',
  sourceScorecard:
    'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-scorecard.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-review-no-real-user-media.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-review-no-real-user-media-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-acceptance-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement.md',
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
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-result',
  ),
  sourceScorecard: parseJsonBlock(
    docs.sourceScorecard,
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-scorecard',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase130-bounded-no-real-user-media-beta-gate-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-review-no-real-user-media',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-review-no-real-user-media-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-acceptance-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2119, 'source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '8a19947f20e9e2330396186d3fa8c81d79ec1989', 'source merge mismatch')
assert(parsed.sourceResult.gateResult.externalBetaOwnerReviewMayProceedNext === true, 'source owner review missing')
assert(parsed.sourceResult.gateResult.externalBetaUnlockedInThisGate === false, 'source beta widened')
assert(parsed.sourceScorecard.gateDisposition.readyForExternalBetaOwnerReviewNoRealUserMedia === true, 'scorecard owner review missing')
assert(parsed.sourceScorecard.gateDisposition.externalBetaUnlockedToday === false, 'scorecard beta widened')
assert(parsed.sourcePolicy.allowedClaims.externalBetaOwnerReviewMayProceedClaimed === true, 'source policy owner review missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewBoundedNoRealUserMediaBetaGateOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.mayApproveBoundedNoRealUserMediaExternalBetaEnablementNext === true, 'prompt next enablement missing')
assert(parsed.prompt.reviewScope.allowExternalBetaUnlockInThisGate === false, 'prompt beta widened')
assert(parsed.prompt.reviewScope.allowRealUserMediaBeta === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2121, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '613cf6de6dc0fc08d5d17477e0fb0e69fb2abcdc', 'result source merge mismatch')
assert(parsed.result.ownerReview.boundedNoRealUserMediaBetaGateAccepted === true, 'result gate missing')
assert(parsed.result.ownerReview.boundedNoRealUserMediaExternalBetaEnablementMayProceedNext === true, 'result next enablement missing')
assert(parsed.result.ownerReview.externalBetaUnlockedInThisGate === false, 'result beta widened')
assert(parsed.result.ownerReview.realUserMediaBetaUnlocked === false, 'result real media widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'result next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedGateEvidence.phase130GatePr === 2121, 'acceptance source mismatch')
assert(parsed.acceptance.acceptedGateEvidence.toolCount === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedGateEvidence.invocationCount === 4, 'acceptance invocation mismatch')
assert(parsed.acceptance.acceptedForNextGateOnly.boundedNoRealUserMediaExternalBetaEnablementMayProceed === true, 'acceptance next enablement missing')
assert(parsed.acceptance.acceptedForNextGateOnly.externalBetaUnlockInThisGate === false, 'acceptance beta widened')

assert(parsed.blockers.readyForBoundedNoRealUserMediaExternalBetaEnablement === true, 'blockers enablement missing')
assert(parsed.blockers.externalBetaUnlockedToday === false, 'blockers beta widened')
assert(parsed.blockers.realUserMediaBetaReady === false, 'blockers real media widened')
assert(parsed.blockers.paidProductionReady === false, 'blockers production widened')
for (const [key, value] of Object.entries(parsed.blockers.remainingBlocks)) assert(value === true, `${key} should remain blocked`)

assert(parsed.policy.allowedClaims.externalBetaOwnerReviewedClaimed === true, 'policy owner review missing')
assert(parsed.policy.allowedClaims.boundedNoRealUserMediaExternalBetaEnablementMayProceedClaimed === true, 'policy next enablement missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase131_bounded_no_real_user_media_external_beta_enablement_completed_with_warnings_ready_for_enablement_owner_review', 'next expected mismatch')
assert(parsed.next.enablementScope.mayMarkBoundedNoRealUserMediaExternalBetaLaneEnabled === true, 'next enablement scope missing')
assert(parsed.next.enablementScope.externalBetaScope === 'bounded_no_real_user_media_sound_cpu_tools_only', 'next beta scope mismatch')
assert(parsed.next.enablementScope.allowRealUserMediaBeta === false, 'next real media widened')
assert(parsed.next.enablementScope.allowPaidProduction === false, 'next production widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2121,
      boundedNoRealUserMediaExternalBetaEnablementMayProceedNext: true,
      externalBetaUnlockedInThisGate: false,
      realUserMediaBetaReady: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
