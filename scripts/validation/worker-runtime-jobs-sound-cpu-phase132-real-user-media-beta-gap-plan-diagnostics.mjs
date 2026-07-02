import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase131_bounded_no_real_user_media_external_beta_enablement_owner_review_passed_with_warnings_ready_for_real_user_media_beta_gap_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase132_real_user_media_beta_gap_plan_completed_with_warnings_ready_for_gap_owner_review'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase131-external-beta-enablement-owner-review-result-no-real-user-media.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-plan-result.md',
  gaps: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-critical-gap-register.md',
  sequence: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-closure-sequence.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-claim-policy.md',
  nextOwner: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-review.md',
  nextSafety: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan.md',
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
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase131-external-beta-enablement-owner-review-result-no-real-user-media',
  ),
  prompt: parseJsonBlock(docs.prompt, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-plan'),
  result: parseJsonBlock(docs.result, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-plan-result'),
  gaps: parseJsonBlock(docs.gaps, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-critical-gap-register'),
  sequence: parseJsonBlock(
    docs.sequence,
    'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-closure-sequence',
  ),
  policy: parseJsonBlock(docs.policy, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-claim-policy'),
  nextOwner: parseJsonBlock(
    docs.nextOwner,
    'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-owner-review',
  ),
  nextSafety: parseJsonBlock(
    docs.nextSafety,
    'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-plan',
  ),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2124, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '51591dd566088bef863fc12c3ecf412bf68cff46', 'source merge mismatch')
assert(parsed.source.ownerReview.realUserMediaBetaGapPlanMayProceedNext === true, 'source gap permission missing')
assert(parsed.source.ownerReview.realUserMediaBetaEnabled === false, 'source real media widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planningScope.mapRealUserMediaBetaGapsOnly === true, 'prompt planning scope missing')
assert(parsed.prompt.planningScope.allowRealUserMediaBetaEnablement === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2126, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'ee8ea7c61f68b3404c91c86318c4f609cbb86068', 'result source merge mismatch')
assert(parsed.result.gapPlanResult.boundedNoRealUserMediaSoundCpuLaneReady === true, 'bounded lane missing')
assert(parsed.result.gapPlanResult.realUserMediaBetaReady === false, 'result real media widened')
assert(parsed.result.gapPlanResult.criticalGapCount === 9, 'gap count mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.gaps.criticalGaps.length === 9, 'critical gap count mismatch')
for (const gap of parsed.gaps.criticalGaps) assert(gap.status === 'blocked', `${gap.id} should remain blocked`)
assert(parsed.gaps.realUserMediaBetaEnablementToday === false, 'gap register real media widened')

assert(parsed.sequence.orderedClosurePlan.length === 9, 'closure sequence count mismatch')
assert(parsed.sequence.orderedClosurePlan[0] === 'real_user_media_safety_policy', 'first gap should be safety policy')
assert(parsed.sequence.parallelizationPolicy.mayInspectAdjacentOwnerLanes === true, 'parallel lane inspection missing')
assert(parsed.sequence.parallelizationPolicy.mustAvoidDuplicateSamePurposePrs === true, 'duplicate avoidance missing')

assert(parsed.policy.allowedClaims.realUserMediaBetaGapPlanCompleted === true, 'policy gap claim missing')
assert(parsed.policy.allowedClaims.criticalGapCount === 9, 'policy gap count mismatch')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.nextOwner.requiredSourceDecision === decision, 'owner next source mismatch')
assert(parsed.nextOwner.reviewScope.allowRealUserMediaBetaEnablement === false, 'owner next real media widened')
assertNoOpClassification(parsed.nextOwner.supabaseClassification, 'owner next supabaseClassification')

assert(
  parsed.nextSafety.requiredSourceDecision ===
    'worker_runtime_jobs_sound_cpu_phase132_real_user_media_beta_gap_owner_review_passed_with_warnings_ready_for_real_user_media_safety_policy_plan',
  'safety next source mismatch',
)
assert(parsed.nextSafety.planningScope.allowRealUserMediaBetaEnablement === false, 'safety next real media widened')
assertNoOpClassification(parsed.nextSafety.supabaseClassification, 'safety next supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2126,
      boundedNoRealUserMediaSoundCpuLaneReady: true,
      realUserMediaBetaReady: false,
      criticalGapCount: 9,
      firstPlannedPrompt: parsed.sequence.firstPlannedPrompt,
    },
    null,
    2,
  ),
)
