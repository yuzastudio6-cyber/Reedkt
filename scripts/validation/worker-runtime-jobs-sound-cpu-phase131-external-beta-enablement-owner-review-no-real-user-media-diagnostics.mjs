import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase131_bounded_no_real_user_media_external_beta_enablement_completed_with_warnings_ready_for_enablement_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase131_bounded_no_real_user_media_external_beta_enablement_owner_review_passed_with_warnings_ready_for_real_user_media_beta_gap_plan'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE132-REAL-USER-MEDIA-BETA-GAP-PLAN'

const docs = {
  source:
    'docs/worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement-result.md',
  sourceScope:
    'docs/worker-runtime-jobs-sound-cpu-phase131-bounded-external-beta-scope-register-no-real-user-media.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase131-external-beta-enablement-owner-review-result-no-real-user-media.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase131-external-beta-enablement-owner-acceptance-register-no-real-user-media.md',
  gaps:
    'docs/worker-runtime-jobs-sound-cpu-phase131-real-user-media-beta-gap-readiness-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase131-external-beta-enablement-owner-claim-policy-no-real-user-media.md',
  next:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-plan.md',
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
    'worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement-result',
  ),
  sourceScope: parseJsonBlock(
    docs.sourceScope,
    'worker-runtime-jobs-sound-cpu-phase131-bounded-external-beta-scope-register-no-real-user-media',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase131-bounded-no-real-user-media-external-beta-enablement-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase131-external-beta-enablement-owner-review-result-no-real-user-media',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase131-external-beta-enablement-owner-acceptance-register-no-real-user-media',
  ),
  gaps: parseJsonBlock(
    docs.gaps,
    'worker-runtime-jobs-sound-cpu-phase131-real-user-media-beta-gap-readiness-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase131-external-beta-enablement-owner-claim-policy-no-real-user-media',
  ),
  next: parseJsonBlock(docs.next, 'worker-runtime-jobs-sound-cpu-phase132-real-user-media-beta-gap-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2123, 'source source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '6b97b9e2ad5637f89d7774d302b19ba5896c7cc4', 'source merge mismatch')
assert(parsed.source.enablementResult.boundedNoRealUserMediaSoundCpuExternalBetaLaneEnabled === true, 'bounded lane not enabled')
assert(parsed.source.enablementResult.realUserMediaBetaEnabled === false, 'source real media widened')
assert(parsed.sourceScope.enabledScope.scopeId === 'bounded_no_real_user_media_sound_cpu_tools_only', 'source scope mismatch')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.reviewBoundedNoRealUserMediaLaneOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.reviewScope.mayPlanRealUserMediaGapNext === true, 'prompt gap planning missing')
assert(parsed.prompt.reviewScope.allowRealUserMediaBeta === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2124, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '51591dd566088bef863fc12c3ecf412bf68cff46', 'result source merge mismatch')
assert(parsed.result.ownerReview.boundedNoRealUserMediaSoundCpuExternalBetaLaneAccepted === true, 'owner review acceptance missing')
assert(parsed.result.ownerReview.realUserMediaBetaGapPlanMayProceedNext === true, 'gap plan missing')
assert(parsed.result.ownerReview.realUserMediaBetaEnabled === false, 'result real media widened')
assert(parsed.result.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedScope.acceptedForExternalBetaScorecard === true, 'acceptance scorecard missing')
assert(parsed.acceptance.acceptedScope.acceptedForRealUserMediaBeta === false, 'acceptance real media widened')
assert(parsed.acceptance.acceptedEvidence.toolCount === 15, 'acceptance tool count mismatch')
assert(parsed.acceptance.acceptedEvidence.syntheticInvocationCount === 4, 'acceptance invocation mismatch')

assert(parsed.gaps.gapPlanMayProceed === true, 'gap plan flag missing')
assert(parsed.gaps.readyToday.boundedNoRealUserMediaScorecard === true, 'bounded scorecard missing')
assert(parsed.gaps.readyToday.realUserMediaBeta === false, 'gaps real media widened')
for (const [key, value] of Object.entries(parsed.gaps.knownGaps)) assert(value === 'missing' || value === 'blocked', `${key} must remain missing/blocked`)

assert(parsed.policy.allowedClaims.boundedNoRealUserMediaSoundCpuExternalBetaLaneAccepted === true, 'policy acceptance missing')
assert(parsed.policy.allowedClaims.realUserMediaBetaGapPlanMayProceed === true, 'policy gap plan missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.expectedDecision === 'worker_runtime_jobs_sound_cpu_phase132_real_user_media_beta_gap_plan_completed_with_warnings_ready_for_gap_owner_review', 'next expected mismatch')
assert(parsed.next.planningScope.mapRealUserMediaBetaGapsOnly === true, 'next planning scope missing')
assert(parsed.next.planningScope.allowRealUserMediaBetaEnablement === false, 'next real media widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2124,
      boundedNoRealUserMediaSoundCpuExternalBetaLaneAccepted: true,
      realUserMediaBetaGapPlanMayProceedNext: true,
      realUserMediaBetaEnabled: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
