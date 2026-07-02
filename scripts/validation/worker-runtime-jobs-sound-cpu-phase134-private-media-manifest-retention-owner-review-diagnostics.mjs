import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase134_private_media_manifest_retention_plan_completed_with_warnings_ready_for_manifest_owner_review'
const decision =
  'worker_runtime_jobs_sound_cpu_phase134_private_media_manifest_retention_owner_review_passed_with_warnings_ready_for_worker_dispatch_claim_lease_plan'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan-result.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-claim-policy.md',
  prompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review.md',
  result:
    'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review-result.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-acceptance-register.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-claim-policy.md',
  next: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan.md',
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
    'storageMutationEnabled',
    'artifactCreationEnabled',
    'allowWorkerDispatchExecution',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan-result',
  ),
  sourcePolicy: parseJsonBlock(
    docs.sourcePolicy,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-claim-policy',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review-result',
  ),
  acceptance: parseJsonBlock(
    docs.acceptance,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-acceptance-register',
  ),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-claim-policy',
  ),
  next: parseJsonBlock(docs.next, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2131, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === '18cbdf9f26c06c0aba88c7d15eb995b0775c4eab', 'source merge mismatch')
assert(parsed.source.manifestPlanResult.privateMediaManifestPlanned === true, 'source manifest missing')
assert(parsed.source.manifestPlanResult.retentionDeletionPolicyPlanned === true, 'source retention missing')
assert(parsed.source.manifestPlanResult.workerDispatchEnabled === false, 'source dispatch widened')
assert(parsed.sourcePolicy.allowedClaims.nextBlockedGap === 'worker_dispatch_claim_lease_policy', 'source next gap mismatch')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.reviewScope.mayProceedToWorkerDispatchClaimLeasePlan === true, 'prompt next missing')
assert(parsed.prompt.reviewScope.allowWorkerDispatch === false, 'prompt dispatch widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2133, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'aef77eb203631eccfadaab75eb546766140cd3fd', 'result source merge mismatch')
assert(parsed.result.ownerReview.privateMediaManifestPlanAccepted === true, 'result manifest acceptance missing')
assert(parsed.result.ownerReview.workerDispatchClaimLeasePlanMayProceed === true, 'result next missing')
assert(parsed.result.ownerReview.workerDispatchEnabled === false, 'result dispatch widened')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.acceptance.acceptedPlanning.nextGap === 'worker_dispatch_claim_lease_policy', 'acceptance next gap mismatch')
for (const [key, value] of Object.entries(parsed.acceptance.acceptedForExecutionToday)) assert(value === false, `${key} must be false`)

assert(parsed.policy.allowedClaims.workerDispatchClaimLeasePlanMayProceed === true, 'policy next missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.next.requiredSourceDecision === decision, 'next source mismatch')
assert(parsed.next.planningScope.planWorkerDispatchClaimLeaseOnly === true, 'next planning scope missing')
assert(parsed.next.planningScope.allowWorkerDispatchExecution === false, 'next dispatch widened')
assertNoOpClassification(parsed.next.supabaseClassification, 'next.supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2133,
      privateMediaManifestPlanAccepted: true,
      workerDispatchClaimLeasePlanMayProceed: true,
      workerDispatchEnabled: false,
    },
    null,
    2,
  ),
)
