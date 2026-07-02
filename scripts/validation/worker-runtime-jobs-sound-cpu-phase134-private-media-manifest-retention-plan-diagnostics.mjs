import fs from 'node:fs'
import path from 'node:path'

const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase133_real_user_media_safety_policy_owner_review_passed_with_warnings_ready_for_private_media_manifest_retention_plan'
const decision =
  'worker_runtime_jobs_sound_cpu_phase134_private_media_manifest_retention_plan_completed_with_warnings_ready_for_manifest_owner_review'

const docs = {
  source: 'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-owner-review-result.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan.md',
  result: 'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan-result.md',
  schema: 'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-schema-plan.md',
  retention: 'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-retention-deletion-policy.md',
  access: 'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-access-boundary-plan.md',
  owners: 'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-owner-handoff-plan.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-claim-policy.md',
  nextOwner:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review.md',
  nextDispatch:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan.md',
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
    'allowWorkerDispatchExecution',
    'allowRouteExecution',
    'allowSupabaseMutation',
    'allowArtifactCreation',
  ]
  for (const key of unsafe) assert(!text.includes(`"${key}": true`), `${file} contains unsafe true claim: ${key}`)
}

const parsed = {
  source: parseJsonBlock(
    docs.source,
    'worker-runtime-jobs-sound-cpu-phase133-real-user-media-safety-policy-owner-review-result',
  ),
  prompt: parseJsonBlock(
    docs.prompt,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan',
  ),
  result: parseJsonBlock(
    docs.result,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-plan-result',
  ),
  schema: parseJsonBlock(docs.schema, 'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-schema-plan'),
  retention: parseJsonBlock(
    docs.retention,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-retention-deletion-policy',
  ),
  access: parseJsonBlock(docs.access, 'worker-runtime-jobs-sound-cpu-phase134-private-media-access-boundary-plan'),
  owners: parseJsonBlock(docs.owners, 'worker-runtime-jobs-sound-cpu-phase134-private-media-owner-handoff-plan'),
  policy: parseJsonBlock(
    docs.policy,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-claim-policy',
  ),
  nextOwner: parseJsonBlock(
    docs.nextOwner,
    'worker-runtime-jobs-sound-cpu-phase134-private-media-manifest-retention-owner-review',
  ),
  nextDispatch: parseJsonBlock(docs.nextDispatch, 'worker-runtime-jobs-sound-cpu-phase135-worker-dispatch-claim-lease-plan'),
}

for (const file of Object.values(docs)) assertNoUnsafeTrueClaims(file)

assert(parsed.source.decision === sourceDecision, 'source decision mismatch')
assert(parsed.source.sourceVerification.sourcePr === 2129, 'source PR mismatch')
assert(parsed.source.sourceVerification.sourceMergeCommit === 'd93838869e4607622447209025b289e015c528ef', 'source merge mismatch')
assert(parsed.source.ownerReview.privateMediaManifestRetentionPlanMayProceed === true, 'source next plan missing')
assert(parsed.source.ownerReview.realUserMediaBetaEnabled === false, 'source real media widened')

assert(parsed.prompt.requiredSourceDecision === sourceDecision, 'prompt source mismatch')
assert(parsed.prompt.expectedDecision === decision, 'prompt expected mismatch')
assert(parsed.prompt.planningScope.planPrivateMediaManifestAndRetentionOnly === true, 'prompt scope mismatch')
assert(parsed.prompt.planningScope.allowRealUserMediaBetaEnablement === false, 'prompt real media widened')
assertNoOpClassification(parsed.prompt.supabaseClassification, 'prompt.supabaseClassification')

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2131, 'result source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '18cbdf9f26c06c0aba88c7d15eb995b0775c4eab', 'result source merge mismatch')
assert(parsed.result.manifestPlanResult.privateMediaManifestPlanned === true, 'manifest plan missing')
assert(parsed.result.manifestPlanResult.retentionDeletionPolicyPlanned === true, 'retention plan missing')
assert(parsed.result.manifestPlanResult.realUserMediaBetaEnabled === false, 'result real media widened')
assert(parsed.result.manifestPlanResult.nextBlockedGap === 'worker_dispatch_claim_lease_policy', 'next gap mismatch')
assertNoOpClassification(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.schema.plannedManifestFields.approvedPlanSnapshotId === 'required_placeholder', 'approved snapshot missing')
assert(parsed.schema.plannedManifestFields.privateStorageRef === 'placeholder_only', 'private storage placeholder mismatch')
assert(parsed.schema.forbiddenManifestFields.includes('service_role_secret'), 'forbidden service role field missing')
assert(parsed.schema.schemaImplementedToday === false, 'schema should not be implemented')

assert(parsed.retention.plannedRetentionPolicy.sourceMediaPublicByDefault === false, 'source media public widened')
assert(parsed.retention.deletionExecutionToday === false, 'deletion execution widened')
assert(parsed.retention.storageMutationToday === false, 'storage mutation widened')

assert(parsed.access.plannedAccessBoundary.privateStorageOnly === true, 'private storage boundary missing')
assert(parsed.access.supabasePolicyImplementedToday === false, 'supabase policy should not be implemented')
assert(parsed.access.signedUrlCreatedToday === false, 'signed URL widened')
assert(parsed.access.publicArtifactCreatedToday === false, 'public artifact widened')

assert(parsed.owners.requiredOwnerHandoffsBeforeRealMediaBeta.length === 5, 'owner handoff count mismatch')
assert(parsed.owners.nextWorkerRuntimeGap === 'worker_dispatch_claim_lease_policy', 'owner next gap mismatch')

assert(parsed.policy.allowedClaims.privateMediaManifestPlanned === true, 'policy manifest claim missing')
for (const [key, value] of Object.entries(parsed.policy.blockedClaims)) assert(value === false, `${key} must be false`)
assertNoOpClassification(parsed.policy.supabaseClassification, 'policy.supabaseClassification')

assert(parsed.nextOwner.requiredSourceDecision === decision, 'owner next source mismatch')
assert(parsed.nextOwner.reviewScope.allowRealUserMediaBetaEnablement === false, 'owner next real media widened')
assertNoOpClassification(parsed.nextOwner.supabaseClassification, 'owner next supabaseClassification')

assert(
  parsed.nextDispatch.requiredSourceDecision ===
    'worker_runtime_jobs_sound_cpu_phase134_private_media_manifest_retention_owner_review_passed_with_warnings_ready_for_worker_dispatch_claim_lease_plan',
  'dispatch next source mismatch',
)
assert(parsed.nextDispatch.planningScope.allowWorkerDispatchExecution === false, 'dispatch next execution widened')
assertNoOpClassification(parsed.nextDispatch.supabaseClassification, 'dispatch next supabaseClassification')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2131,
      privateMediaManifestPlanned: true,
      retentionDeletionPolicyPlanned: true,
      nextBlockedGap: 'worker_dispatch_claim_lease_policy',
      realUserMediaBetaEnabled: false,
    },
    null,
    2,
  ),
)
