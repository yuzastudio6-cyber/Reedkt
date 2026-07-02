import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase132_real_user_media_beta_gap_plan_completed_with_warnings_ready_for_gap_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase132_real_user_media_beta_gap_owner_review_passed_with_warnings_ready_for_real_user_media_safety_policy_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-plan-result.md',
  sourceGaps: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-critical-gap-register.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-acceptance-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan.md',
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
    'allowRealUserMediaBetaEnablement',
    'allowPaidProduction',
    'allowWorkerDispatch',
    'allowRouteExecution',
    'allowSupabaseMutation',
    'allowArtifactCreation',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-plan-result'),
  sourceGaps: parseJsonBlock(
    docs.sourceGaps,
    'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-critical-gap-register',
  ),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-review-result'),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-acceptance-register',
  ),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-claim-policy'),
  next: parseJsonBlock(docs.next, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2126, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'ee8ea7c61f68b3404c91c86318c4f609cbb86068', 'source merge mismatch')
assert(parsed.source.gapPlanResult.criticalGapCount === 9, 'source gap count mismatch')
assert(parsed.source.gapPlanResult.realUserMediaBetaReady === false, 'source real media widened')

assert(parsed.sourceGaps.criticalGaps.length === 9, 'gap list count mismatch')
for (const gap of parsed.sourceGaps.criticalGaps) assert(gap.status === 'blocked', `${gap.id} should remain blocked`)

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.criticalGapCount === 9, 'prompt gap count mismatch')
assert(parsed.prompt.reviewScope.mayProceedToRealUserMediaSafetyPolicyPlan === true, 'prompt safety plan missing')
assert(parsed.prompt.reviewScope.allowRealUserMediaBetaEnablement === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2127, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '325e259b77b33e21cebb9a3ae8de830c3bcac898', 'result source merge mismatch')
assert(parsed.result.ownerReview.gapPlanAccepted === true, 'gap plan acceptance missing')
assert(parsed.result.ownerReview.realUserMediaSafetyPolicyPlanMayProceed === true, 'safety plan permission missing')
assert(parsed.result.ownerReview.realUserMediaBetaEnabled === false, 'result real media widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedGapPlan.criticalGapCount === 9, 'acceptance gap count mismatch')
assert(parsed.acceptance.acceptedNextStepOnly.realUserMediaSafetyPolicyPlanMayProceed === true, 'acceptance next step missing')
assert(parsed.acceptance.acceptedNextStepOnly.realUserMediaBetaEnablement === false, 'acceptance real media widened')

assert(parsed.policy.allowedClaims.gapPlanAccepted === true, 'policy acceptance missing')
assert(parsed.policy.allowedClaims.realUserMediaSafetyPolicyPlanMayProceed === true, 'policy next step missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.planningScope.planRealUserMediaSafetyPolicyOnly === true, 'next scope missing')
assert(parsed.next.planningScope.allowRealUserMediaBetaEnablement === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2127,
      gapPlanAccepted: true,
      criticalGapCount: 9,
      realUserMediaSafetyPolicyPlanMayProceed: true,
      realUserMediaBetaEnabled: false,
    },
    null,
    2,
  ),
)
