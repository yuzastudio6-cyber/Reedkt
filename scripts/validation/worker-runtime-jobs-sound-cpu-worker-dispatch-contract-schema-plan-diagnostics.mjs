import fs from 'node:fs'

const decision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_completed_with_warnings_ready_for_worker_dispatch_contract_schema_owner_review'
const criteriaOwnerReviewDecision =
  'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_criteria_owner_review_passed_with_warnings_ready_for_worker_dispatch_contract_schema_plan'
const gate2aoDecision =
  'sound_runtime_media_gate_2ao_worker_dispatch_contract_approval_criteria_plan_completed_with_warnings_ready_for_worker_dispatch_contract_criteria_owner_review'
const sourceHead = '01e545cb40ed2bf5983fe4e6f61636e6dcb91dba'

const docs = [
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-identity-fields-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-claim-lease-schema-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-retry-timeout-cancellation-schema-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-result-observability-schema-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-payload-guardrail-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-claim-policy.md',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

function parseJsonBlock(path) {
  const text = read(path)
  const match = text.match(/```json [^\n]+\n([\s\S]*?)\n```/)
  assert(match, `${path} missing fenced json block`)
  return JSON.parse(match[1])
}

const parsed = Object.fromEntries(docs.map((path) => [path, parseJsonBlock(path)]))
for (const [path, json] of Object.entries(parsed)) {
  assert(json.owner === 'WORKER_RUNTIME_JOBS', `${path} owner mismatch`)
  assert(json.decision === decision, `${path} decision mismatch`)
}

const plan = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-plan.md']
assert(plan.sourceVerification.sourceHead === sourceHead, 'source head mismatch')
assert(plan.sourceVerification.pr994.status === 'merged', 'PR #994 status mismatch')
assert(plan.sourceVerification.pr994.mergeCommit === sourceHead, 'PR #994 merge commit mismatch')
assert(plan.sourceVerification.pr994.decision === criteriaOwnerReviewDecision, 'PR #994 decision mismatch')
assert(plan.sourceVerification.pr991.decision === gate2aoDecision, 'PR #991 decision mismatch')
assert(plan.schemaPlanResult.workerDispatchContractSchemaPlanCreated === true, 'schema plan missing')
assert(plan.schemaPlanResult.futureWorkerDispatchContractSchemaOwnerReviewMayProceed === true, 'owner review flag missing')
assert(plan.schemaPlanResult.schemaSectionCount === 6, 'schema section count mismatch')
assert(plan.schemaPlanResult.closedGapCountToday === 0, 'closed gap count must be zero')
for (const [key, value] of Object.entries(plan.schemaPlanResult)) {
  if (
    key === 'workerDispatchContractSchemaPlanCreated' ||
    key === 'futureWorkerDispatchContractSchemaOwnerReviewMayProceed' ||
    key === 'schemaSectionCount' ||
    key === 'closedGapCountToday'
  ) continue
  assert(value === false, `${key} must be false`)
}

const criteriaReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-criteria-owner-review.md'
)
assert(criteriaReview.decision === criteriaOwnerReviewDecision, 'criteria owner review decision mismatch')
assert(criteriaReview.ownerReviewResult.futureWorkerDispatchContractSchemaPlanMayProceed === true, 'criteria review does not allow schema planning')
assert(criteriaReview.ownerReviewResult.dispatchContractApprovedToday === false, 'dispatch contract must remain false')

const identity = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-identity-fields-register.md']
for (const field of [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'jobType',
  'workerName',
  'imageName',
  'idempotencyKey',
  'attemptNumber',
  'maxAttempts',
]) {
  assert(identity.identityFields.includes(field), `${field} identity field missing`)
}
assert(identity.acceptedWorkerNames.length === 2, 'accepted worker name count mismatch')
assert(identity.acceptedImageNames.length === 2, 'accepted image name count mismatch')
assert(identity.acceptedJobTypes.length === 4, 'accepted job type count mismatch')
assert(identity.schemaApprovedToday === false, 'identity schema must remain unapproved')
assert(identity.workerDispatchApprovedToday === false, 'worker dispatch must remain false')

const claimLease = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-claim-lease-schema-register.md']
assert(claimLease.claimLeaseSchemaFields.includes('leaseExpiresAt'), 'lease expiry field missing')
assert(claimLease.claimLeaseSchemaFields.includes('duplicateClaimRejectionPolicy'), 'duplicate claim policy missing')
assert(claimLease.claimLeasePolicy.futureSchemaPlanningOnly === true, 'claim lease must be planning-only')
assert(claimLease.claimLeasePolicy.claimLeaseApprovedToday === false, 'claim lease must remain false')

const retry = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-retry-timeout-cancellation-schema-register.md']
assert(retry.retryTimeoutCancellationFields.includes('executionTimeoutSeconds'), 'execution timeout field missing')
assert(retry.retryTimeoutCancellationFields.includes('cancellationCheckpointPolicy'), 'cancellation checkpoint field missing')
assert(retry.retryTimeoutCancellationPolicy.futureSchemaPlanningOnly === true, 'retry schema must be planning-only')
assert(retry.retryTimeoutCancellationPolicy.workerExecutionApprovedToday === false, 'worker execution must remain false')

const result = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-result-observability-schema-register.md']
assert(result.resultObservabilityFields.includes('sanitizedErrorCode'), 'sanitized error field missing')
assert(result.resultObservabilityFields.includes('dependencyReadinessSnapshot'), 'dependency readiness field missing')
assert(result.observabilityPolicy.artifactWriteApprovedToday === false, 'artifact write must remain false')

const guardrail = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-payload-guardrail-register.md']
for (const field of [
  'runtimeFlags',
  'blockedMediaPolicy',
  'privateStorageReferenceIds',
  'supabaseServiceRoleBoundaryStatus',
  'creditReservationReference',
  'ownerApprovalSnapshot',
]) {
  assert(guardrail.requiredPlaceholderFields.includes(field), `${field} placeholder missing`)
}
for (const forbidden of ['secrets or API keys', 'Supabase service-role keys', 'signed URLs as source of truth', 'SQL text']) {
  assert(guardrail.forbiddenPayloadContents.includes(forbidden), `${forbidden} forbidden payload missing`)
}
assert(guardrail.guardrailPolicy.supabaseMutationApprovedToday === false, 'Supabase mutation must remain false')
assert(guardrail.guardrailPolicy.providerModelCallApprovedToday === false, 'provider/model call must remain false')

const blockers = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-blocker-follow-up-register.md']
assert(blockers.resolvedForPlanning.some((row) => row.blockerId === 'worker_dispatch_contract_schema_plan_pending'), 'resolved schema plan blocker missing')
assert(
  blockers.remainingBlockers.some((row) => row.blockerId === 'worker_dispatch_contract_schema_owner_review_pending' && row.status === 'next'),
  'next schema owner review blocker missing'
)
assert(blockers.remainingBlockers.some((row) => row.blockerId === 'runtime_execution_owner_signoffs_missing'), 'runtime owner signoff blocker missing')

const policy = parsed['docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-claim-policy.md']
for (const [key, value] of Object.entries(policy.allowedClaims)) {
  if (key === 'workerDispatchContractSchemaPlanCreated' || key === 'futureWorkerDispatchContractSchemaOwnerReviewMayProceed') {
    assert(value === true, `${key} must be true`)
  } else if (key === 'schemaSectionCount') {
    assert(value === 6, `${key} must be 6`)
  } else if (key === 'closedGapCountToday') {
    assert(value === 0, `${key} must be zero`)
  } else {
    assert(value === false, `${key} must be false`)
  }
}
assert(policy.forbiddenClaims.includes('generated_local_fixture_passed'), 'generated fixture forbidden claim missing')
assert(policy.forbiddenClaims.includes('dry_run_passed'), 'dry run forbidden claim missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification mismatch')

const nextPrompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-owner-review.md')
assert(nextPrompt.includes(decision), 'next prompt must require schema plan decision')
assert(nextPrompt.includes('Do not approve the schema for execution'), 'next prompt must block execution approval')
assert(nextPrompt.includes('touch Supabase'), 'next prompt must block Supabase')
assert(nextPrompt.includes('claim worker/runtime/media/beta/production readiness'), 'next prompt must block readiness widening')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-worker-dispatch-contract-schema-plan:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-plan-diagnostics.mjs',
  'package script missing'
)

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_worker_dispatch_contract_schema_plan_diagnostics_passed',
  decision,
  sourceHead,
  pr994Verified: true,
  workerDispatchContractSchemaPlanCreated: true,
  schemaSectionCount: 6,
  closedGapCountToday: 0,
  schemaApprovedToday: false,
  dispatchContractApprovedToday: false,
  workerDispatchApprovedToday: false,
  workerExecutionApprovedToday: false,
  runtimeExecutionApprovedToday: false,
  supabaseSqlApprovedToday: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-WORKER-DISPATCH-CONTRACT-SCHEMA-OWNER-REVIEW: review worker dispatch contract schema plan, no execution'
}, null, 2))
