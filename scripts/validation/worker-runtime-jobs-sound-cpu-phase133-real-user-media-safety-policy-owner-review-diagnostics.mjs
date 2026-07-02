import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase133_real_user_media_safety_policy_plan_completed_with_warnings_ready_for_policy_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase133_real_user_media_safety_policy_owner_review_passed_with_warnings_ready_for_private_media_manifest_retention_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan-result.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-owner-review.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-owner-review-result.md',
  acceptance: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-owner-acceptance-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan.md',
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
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan-result'),
  sourcePolicy: parseJsonBlock(docs.sourcePolicy, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-claim-policy'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-owner-review'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-owner-review-result'),
  acceptance: parseJsonBlock(docs.acceptance, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-owner-acceptance-register'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-owner-claim-policy'),
  next: parseJsonBlock(docs.next, 'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2128, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '3954b4166466da78e5eb5eb841ce1f648ee74d93', 'source merge mismatch')
assert(parsed.source.policyPlanResult.realUserMediaSafetyPolicyPlanned === true, 'source policy plan missing')
assert(parsed.source.policyPlanResult.realUserMediaBetaEnabled === false, 'source real media widened')

assert(parsed.sourcePolicy.allowedClaims.realUserMediaSafetyPolicyPlanned === true, 'source policy allowed claim missing')
assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.mayProceedToPrivateMediaManifestRetentionPlan === true, 'prompt manifest plan missing')
assert(parsed.prompt.reviewScope.allowRealUserMediaBetaEnablement === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2129, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'd93838869e4607622447209025b289e015c528ef', 'result source merge mismatch')
assert(parsed.result.ownerReview.realUserMediaSafetyPolicyAccepted === true, 'owner acceptance missing')
assert(parsed.result.ownerReview.privateMediaManifestRetentionPlanMayProceed === true, 'manifest plan missing')
assert(parsed.result.ownerReview.realUserMediaBetaEnabled === false, 'result real media widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPolicy.privateManifestRequiredBeforeBeta === true, 'private manifest requirement missing')
assert(parsed.acceptance.acceptedPolicy.realUserMediaProcessingToday === false, 'acceptance real media widened')
assert(parsed.acceptance.acceptedNextStepOnly.privateMediaManifestRetentionPlanMayProceed === true, 'acceptance next step missing')
assert(parsed.acceptance.acceptedNextStepOnly.realUserMediaBetaEnablement === false, 'acceptance real media widened')

assert(parsed.policy.allowedClaims.realUserMediaSafetyPolicyAccepted === true, 'policy acceptance missing')
assert(parsed.policy.allowedClaims.privateMediaManifestRetentionPlanMayProceed === true, 'policy next missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.planningScope.planPrivateMediaManifestAndRetentionOnly === true, 'next scope missing')
assert(parsed.next.planningScope.allowRealUserMediaBetaEnablement === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2129,
      realUserMediaSafetyPolicyAccepted: true,
      privateMediaManifestRetentionPlanMayProceed: true,
      realUserMediaBetaEnabled: false,
    },
    null,
    2,
  ),
)
