import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase132_real_user_media_beta_gap_owner_review_passed_with_warnings_ready_for_real_user_media_safety_policy_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase133_real_user_media_safety_policy_plan_completed_with_warnings_ready_for_policy_owner_review'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-review-result.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan-result.md',
  input: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-input-classification-policy.md',
  stop: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-stop-rules-policy.md',
  privacy: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-privacy-retention-policy.md',
  owners: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-owner-handoff-policy.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-claim-policy.md',
  nextOwner: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-owner-review.md',
  nextManifest: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan.md',
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
  source: parseJsonBlock(docs.source, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-review-result'),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan-result'),
  input: parseJsonBlock(docs.input, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-input-classification-policy'),
  stop: parseJsonBlock(docs.stop, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-stop-rules-policy'),
  privacy: parseJsonBlock(docs.privacy, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-privacy-retention-policy'),
  owners: parseJsonBlock(docs.owners, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-owner-handoff-policy'),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-claim-policy'),
  nextOwner: parseJsonBlock(
    docs.nextOwner,
    'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-owner-review',
  ),
  nextManifest: parseJsonBlock(
    docs.nextManifest,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2127, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '325e259b77b33e21cebb9a3ae8de830c3bcac898', 'source merge mismatch')
assert(parsed.source.ownerReview.realUserMediaSafetyPolicyPlanMayProceed === true, 'source safety plan missing')
assert(parsed.source.ownerReview.realUserMediaBetaEnabled === false, 'source real media widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planningScope.planRealUserMediaSafetyPolicyOnly === true, 'prompt scope missing')
assert(parsed.prompt.planningScope.allowRealUserMediaBetaEnablement === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2128, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '3954b4166466da78e5eb5eb841ce1f648ee74d93', 'result source merge mismatch')
assert(parsed.result.policyPlanResult.realUserMediaSafetyPolicyPlanned === true, 'policy plan missing')
assert(parsed.result.policyPlanResult.realUserMediaBetaEnabled === false, 'result real media widened')
assert(parsed.result.policyPlanResult.nextBlockedGap === 'private_media_manifest_and_retention_policy', 'next gap mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.input.plannedInputClasses.syntheticNoRealUserMedia.mayUseCurrentLane === true, 'synthetic lane missing')
assert(parsed.input.plannedInputClasses.ownedUserMediaBetaCandidate.requiresExplicitUserConsent === true, 'consent missing')
assert(parsed.input.plannedInputClasses.thirdPartyOrSensitiveMedia.status === 'blocked', 'third-party media should be blocked')
assert(parsed.input.realUserMediaProcessingToday === false, 'input policy real media widened')

assert(parsed.stop.hardStopRules.length === 10, 'hard stop count mismatch')
for (const value of Object.values(parsed.stop.stopBehavior)) assert(value === true, 'stop behavior must be true')

assert(parsed.privacy.plannedPolicy.privateManifestRequired === true, 'private manifest missing')
assert(parsed.privacy.plannedPolicy.sourceMediaNeverPublicByDefault === true, 'private-by-default missing')
assert(parsed.privacy.realMediaOpened === false, 'privacy real media opened')
assert(parsed.owners.requiredOwnerHandoffsBeforeRealMediaBeta.length === 6, 'owner handoff count mismatch')

assert(parsed.policy.allowedClaims.realUserMediaSafetyPolicyPlanned === true, 'policy planned claim missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.nextOwner.requiredSourceDecision === decision, 'owner next source mismatch')
assert(parsed.nextOwner.reviewScope.allowRealUserMediaBetaEnablement === false, 'owner next real media widened')
assertNoOpClassification(parsed.nextOwner.supabaseClassification, 'owner next supabaseClassification')

assert(
  parsed.nextManifest.requiredSourceDecision ===
    'worker_runtime_jobs_sound_cpu_phase133_real_user_media_safety_policy_owner_review_passed_with_warnings_ready_for_private_media_manifest_retention_plan',
  'manifest next source mismatch',
)
assert(parsed.nextManifest.planningScope.allowRealUserMediaBetaEnablement === false, 'manifest next real media widened')
assertNoOpClassification(parsed.nextManifest.supabaseClassification, 'manifest next supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2128,
      realUserMediaSafetyPolicyPlanned: true,
      nextBlockedGap: 'private_media_manifest_and_retention_policy',
      realUserMediaBetaEnabled: false,
    },
    null,
    2,
  ),
)
