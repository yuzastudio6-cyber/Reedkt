import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const decision =
  'worker_runtime_jobs_sound_cpu_approved_snapshot_payload_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_no_real_user_media_boundary_evidence_plan_after_runner_boundary_execution_proof';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-approved-snapshot-payload-evidence-plan-after-runner-boundary-execution-proof.md',
  fieldRegister: 'docs/worker-runtime-jobs-sound-cpu-approved-snapshot-payload-field-register-after-runner-boundary-execution-proof.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-approved-snapshot-payload-source-evidence-register-after-runner-boundary-execution-proof.md',
  boundaryPolicy: 'docs/worker-runtime-jobs-sound-cpu-approved-snapshot-payload-boundary-policy-after-runner-boundary-execution-proof.md',
  blockerRegister: 'docs/worker-runtime-jobs-sound-cpu-approved-snapshot-payload-blocker-register-after-runner-boundary-execution-proof.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-approved-snapshot-payload-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceRequiredEvidence:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceRequiredEvidenceMap:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-map-after-runner-boundary-execution-proof.md',
  approvedSnapshotPolicy: 'approved-plan-snapshot-policy.md',
  staticPayloadPlan: 'docs/worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan.md',
  staticJobRegister: 'docs/worker-runtime-jobs-sound-cpu-static-job-contract-register.md',
  contractOwnerReview: 'docs/worker-runtime-jobs-sound-cpu-contract-owner-review.md',
  dispatchReadiness:
    'docs/worker-runtime-jobs-sound-cpu-worker-dispatch-contract-schema-readiness-register.md'
};

const requiredLabels = {
  plan: 'worker-runtime-jobs-sound-cpu-approved-snapshot-payload-evidence-plan-after-runner-boundary-execution-proof',
  fieldRegister:
    'worker-runtime-jobs-sound-cpu-approved-snapshot-payload-field-register-after-runner-boundary-execution-proof',
  sourceRegister:
    'worker-runtime-jobs-sound-cpu-approved-snapshot-payload-source-evidence-register-after-runner-boundary-execution-proof',
  boundaryPolicy:
    'worker-runtime-jobs-sound-cpu-approved-snapshot-payload-boundary-policy-after-runner-boundary-execution-proof',
  blockerRegister:
    'worker-runtime-jobs-sound-cpu-approved-snapshot-payload-blocker-register-after-runner-boundary-execution-proof',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-approved-snapshot-payload-claim-policy-after-runner-boundary-execution-proof'
};

const requiredIdentityFields = [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'imageName',
  'jobType',
  'toolId'
];

const blockedFlags = [
  'rawChatExecutionAllowedToday',
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseSqlApprovedToday',
  'dockerGcpApprovedToday',
  'billingStripeApprovedToday',
  'internalBetaUnlockApprovedToday',
  'externalBetaUnlockApprovedToday',
  'productionUnlockApprovedToday'
];

const forbiddenText = [
  '"rawChatExecutionAllowedToday": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseSqlApprovedToday": true',
  '"dockerGcpApprovedToday": true',
  '"billingStripeApprovedToday": true',
  '"internalBetaUnlockApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"productionUnlockApprovedToday": true',
  '"acceptedForExecutionToday": true',
  '"sqlExecuted": "yes"',
  'SUPABASE_URL',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'BEGIN RSA',
  'BEGIN OPENSSH'
];

function readRequired(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf8');
}

function parseJsonFence(markdown, label) {
  const fence = '```json ' + label;
  const start = markdown.indexOf(fence);
  if (start === -1) {
    throw new Error(`Missing JSON fence: ${label}`);
  }
  const jsonStart = markdown.indexOf('\n', start);
  const end = markdown.indexOf('```', jsonStart + 1);
  if (jsonStart === -1 || end === -1) {
    throw new Error(`Unclosed JSON fence: ${label}`);
  }
  return JSON.parse(markdown.slice(jsonStart + 1, end).trim());
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const docs = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [key, readRequired(relativePath)])
);

for (const text of Object.values(docs)) {
  for (const forbidden of forbiddenText) {
    assert(!text.includes(forbidden), `Forbidden widened claim or secret marker found: ${forbidden}`);
  }
}

const parsed = Object.fromEntries(
  Object.entries(requiredLabels).map(([key, label]) => [key, parseJsonFence(docs[key], label)])
);

assert(parsed.plan.decision === decision, 'Plan decision mismatch');
assert(parsed.plan.sourcePr === 1286, 'Source PR mismatch');
assert(
  parsed.plan.sourceMergeCommit === '4d39178a449a413181c79ad914d91c9a7d2c823b',
  'Source merge commit mismatch'
);
assert(parsed.plan.approvedSnapshotPayloadEvidenceResult.requiredIdentityFieldCount === 9, 'Plan field count mismatch');
assert(parsed.plan.approvedSnapshotPayloadEvidenceResult.requiredIdentityFieldsRepresented === true, 'Fields not represented');

for (const flag of blockedFlags) {
  assert(parsed.plan.approvedSnapshotPayloadEvidenceResult[flag] === false, `Plan flag must stay false: ${flag}`);
}

const fieldNames = parsed.fieldRegister.requiredIdentityFields.map((row) => row.field);
for (const field of requiredIdentityFields) {
  assert(fieldNames.includes(field), `Missing identity field: ${field}`);
}
assert(parsed.fieldRegister.counts.requiredIdentityFieldCount === 9, 'Field register required count mismatch');
assert(parsed.fieldRegister.counts.representedIdentityFieldCount === 9, 'Field register represented count mismatch');
assert(parsed.fieldRegister.counts.acceptedForExecutionTodayCount === 0, 'Field register execution count must be zero');

assert(parsed.sourceRegister.sourceEvidenceCount === 6, 'Source evidence count mismatch');
assert(parsed.sourceRegister.sourceEvidenceAcceptedForExecutionToday === false, 'Source evidence must not allow execution');
assert(
  parsed.boundaryPolicy.rejectedPayloadSources.includes('raw chat') &&
    parsed.boundaryPolicy.rejectedPayloadSources.includes('signed URLs as source of truth') &&
    parsed.boundaryPolicy.rejectedPayloadSources.includes('real user media file paths') &&
    parsed.boundaryPolicy.rejectedPayloadSources.includes('service-role payloads'),
  'Boundary rejected payload sources incomplete'
);

for (const flag of blockedFlags) {
  assert(parsed.boundaryPolicy.blockedToday[flag] === false, `Boundary flag must stay false: ${flag}`);
  assert(parsed.claimPolicy.claimPolicy[flag] === false, `Claim-policy flag must stay false: ${flag}`);
}

assert(
  parsed.blockerRegister.closedEvidenceItem.id === 'approved_plan_snapshot_policy_preserved',
  'Closed evidence item mismatch'
);
assert(parsed.blockerRegister.closedEvidenceItem.acceptedForInternalBetaUnlockToday === false, 'Closed evidence must not unlock beta');
assert(parsed.blockerRegister.remainingEvidenceCount === 5, 'Remaining evidence count mismatch');
assert(parsed.blockerRegister.remainingEvidenceItems.includes('no_real_user_media_boundary'), 'Next evidence item missing');
assert(parsed.claimPolicy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');

assert(
  docs.approvedSnapshotPolicy.includes('Workers execute approved snapshots, not raw chat'),
  'Approved snapshot policy source is missing worker rule'
);
for (const field of requiredIdentityFields.filter((field) => field !== 'toolId')) {
  assert(docs.staticPayloadPlan.includes(field) || docs.staticJobRegister.includes(field), `Source docs missing ${field}`);
}
assert(docs.sourceRequiredEvidence.includes('requiredEvidenceCount": 6'), 'Source required evidence count missing');
assert(docs.sourceRequiredEvidenceMap.includes('approved_plan_snapshot_policy_preserved'), 'Source evidence map missing approved snapshot item');
assert(docs.nextPrompt.includes('No real user media'), 'Next prompt missing no-real-user-media scope');

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_approved_snapshot_payload_evidence_plan_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1286,
      sourceMergeCommit: '4d39178a449a413181c79ad914d91c9a7d2c823b',
      requiredIdentityFieldCount: 9,
      representedIdentityFieldCount: 9,
      remainingEvidenceCount: 5,
      nextEvidenceItem: 'no_real_user_media_boundary',
      internalBetaUnlockApprovedToday: false,
      externalBetaUnlockApprovedToday: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-NO-REAL-USER-MEDIA-BOUNDARY-EVIDENCE-PLAN-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: plan no-real-user-media boundary evidence for internal beta, no beta unlock'
    },
    null,
    2
  )
);
