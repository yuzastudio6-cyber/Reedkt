import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase130_external_beta_owner_review_passed_with_warnings_ready_for_bounded_no_real_user_media_external_beta_enablement'
const decision =
  'worker_runtime_jobs_sound_cpu_phase131_bounded_no_real_user_media_external_beta_enablement_completed_with_warnings_ready_for_enablement_owner_review'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE131-BOUNDED-NO-REAL-USER-MEDIA-EXTERNAL-BETA-ENABLEMENT-OWNER-REVIEW'

const docs = {
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-review-no-real-user-media-result.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-acceptance-register-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement-result.md',
  scope:
    'docs/worker-runtime-jobs-sound-cpu-phase131-bounded-external-beta-scope-register-no-real-user-media.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-phase131-external-beta-blocker-register-no-real-user-media.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase131-external-beta-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement-owner-review.md',
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
    'realUserMediaBetaEnabled',
    'paidProductionEnabled',
    'workerDispatchEnabled',
    'routeExecutionEnabled',
    'supabaseMutationEnabled',
    'artifactCreationEnabled',
    'providerCallEnabled',
    'modelCallEnabled',
    'allowRealUserMediaBeta',
    'allowPaidProduction',
    'allowWorkerDispatch',
    'allowRouteExecution',
    'allowSupabaseMutation',
    'allowArtifactCreation',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  sourceResult: parseJsonBlock(
    docs.sourceResult,
    'worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-review-no-real-user-media-result',
  ),
  sourceAcceptance: parseJsonBlock(
    docs.sourceAcceptance,
    'worker-runtime-jobs-sound-cpu-phase130-external-beta-owner-acceptance-register-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement-result',
  ),
  scope: parseJsonBlock(
    docs.scope,
    'worker-runtime-jobs-sound-cpu-phase131-bounded-external-beta-scope-register-no-real-user-media',
  ),
  blockers: parseJsonBlock(
    docs.blockers,
    'worker-runtime-jobs-sound-cpu-phase131-external-beta-blocker-register-no-real-user-media',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase131-external-beta-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(
    docs.next,
    'worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement-owner-review',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.sourceResult.decision === sourceDecision, 'source decision mismatch')
assert(parsed.sourceResult.sourceVerification.sourcePr === 2121, 'source source PR mismatch')
assert(parsed.sourceResult.sourceVerification.sourceMergeCommit === '613cf6de6dc0fc08d5d17477e0fb0e69fb2abcdc', 'source merge mismatch')
assert(parsed.sourceResult.ownerReview.boundedNoRealUserMediaExternalBetaEnablementMayProceedNext === true, 'source did not approve next enablement')
assert(parsed.sourceResult.ownerReview.acceptedToolCount === 15, 'source tool count mismatch')
assert(parsed.sourceResult.ownerReview.acceptedInvocationCount === 4, 'source invocation count mismatch')
assert(parsed.sourceResult.ownerReview.externalBetaUnlockedInThisGate === false, 'source widened external beta')
assert(parsed.sourceResult.ownerReview.realUserMediaBetaUnlocked === false, 'source widened real media')
assert(parsed.sourceAcceptance.acceptedForNextGateOnly.boundedNoRealUserMediaExternalBetaEnablementMayProceed === true, 'source acceptance missing')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.enablementScope.mayMarkBoundedNoRealUserMediaExternalBetaLaneEnabled === true, 'prompt bounded enablement missing')
assert(parsed.prompt.enablementScope.externalBetaScope === 'bounded_no_real_user_media_sound_cpu_tools_only', 'prompt scope mismatch')
assert(parsed.prompt.enablementScope.toolCount === 15, 'prompt tool count mismatch')
assert(parsed.prompt.enablementScope.allowRealUserMediaBeta === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2123, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '6b97b9e2ad5637f89d7774d302b19ba5896c7cc4', 'result source merge mismatch')
assert(parsed.result.enablementResult.boundedNoRealUserMediaSoundCpuExternalBetaLaneEnabled === true, 'bounded lane not enabled')
assert(parsed.result.enablementResult.externalBetaScope === 'bounded_no_real_user_media_sound_cpu_tools_only', 'result scope mismatch')
assert(parsed.result.enablementResult.realUserMediaBetaEnabled === false, 'real media widened')
assert(parsed.result.enablementResult.paidProductionEnabled === false, 'production widened')
assert(parsed.result.enablementResult.workerDispatchEnabled === false, 'dispatch widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.scope.enabledScope.enabledForOwnerReview === true, 'scope not enabled for review')
assert(parsed.scope.enabledScope.scopeId === 'bounded_no_real_user_media_sound_cpu_tools_only', 'scope id mismatch')
assert(parsed.scope.enabledScope.toolsCovered === 15, 'scope tool count mismatch')
assert(parsed.scope.enabledScope.realUserMediaAllowed === false, 'scope real media widened')
assert(parsed.scope.enabledScope.workerDispatchAllowed === false, 'scope dispatch widened')
assert(parsed.scope.sourceEvidence.phase130OwnerReviewPr === 2123, 'scope source mismatch')

assert(parsed.blockers.readyForEnablementOwnerReview === true, 'blockers owner review missing')
assert(parsed.blockers.boundedNoRealUserMediaLaneEnabledForReview === true, 'blockers bounded lane missing')
for (const [key, value] of Object.entries(parsed.blockers.remainingBlocks)) assert(value === true, `${key} should remain blocked`)
for (const [key, value] of Object.entries(parsed.blockers.forbiddenReadinessClaims)) assert(value === 'unclaimed', `${key} must remain unclaimed`)

assert(parsed.policy.allowedClaims.boundedNoRealUserMediaSoundCpuExternalBetaLaneEnabled === true, 'policy bounded lane missing')
assert(parsed.policy.allowedClaims.toolCountCovered === 15, 'policy tool count mismatch')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase131_bounded_no_real_user_media_external_beta_enablement_owner_review_passed_with_warnings_ready_for_real_user_media_beta_gap_plan', 'next expected mismatch')
assert(parsed.next.reviewScope.reviewBoundedNoRealUserMediaLaneOnly === true, 'next scope missing')
assert(parsed.next.reviewScope.allowRealUserMediaBeta === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2123,
      boundedNoRealUserMediaSoundCpuExternalBetaLaneEnabled: true,
      externalBetaScope: 'bounded_no_real_user_media_sound_cpu_tools_only',
      realUserMediaBetaEnabled: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
