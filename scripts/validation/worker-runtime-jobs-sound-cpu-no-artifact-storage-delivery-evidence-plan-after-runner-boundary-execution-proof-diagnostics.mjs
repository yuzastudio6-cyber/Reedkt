import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const decision =
  'worker_runtime_jobs_sound_cpu_no_artifact_storage_delivery_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_worker_route_dispatch_gate_evidence_plan_after_runner_boundary_execution_proof';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceRegister:
    'docs/worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-source-register-after-runner-boundary-execution-proof.md',
  boundaryPolicy:
    'docs/worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-policy-after-runner-boundary-execution-proof.md',
  blockerRegister:
    'docs/worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-blocker-register-after-runner-boundary-execution-proof.md',
  claimPolicy:
    'docs/worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceNoRealUserMedia:
    'docs/worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceNoRealUserMediaPolicy:
    'docs/worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-policy-after-runner-boundary-execution-proof.md',
  sourceNoRealUserMediaBlockers:
    'docs/worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-blocker-register-after-runner-boundary-execution-proof.md',
  sourceArtifactDeliveryGap: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-closure.md',
  sourceArtifactDeliveryReadiness:
    'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-readiness-boundary.md',
  sourceArtifactDeliveryAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-acceptance-register.md',
  sourceSupabaseStorageGap: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-closure.md',
  mediaOwnerGate: 'docs/worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register.md',
  mediaSourceReview: 'docs/worker-runtime-jobs-sound-cpu-supabase-media-source-review-register.md'
};

const labels = {
  plan: 'worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-evidence-plan-after-runner-boundary-execution-proof',
  sourceRegister:
    'worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-source-register-after-runner-boundary-execution-proof',
  boundaryPolicy:
    'worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-policy-after-runner-boundary-execution-proof',
  blockerRegister:
    'worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-blocker-register-after-runner-boundary-execution-proof',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-claim-policy-after-runner-boundary-execution-proof'
};

const falseFlags = [
  'privateArtifactWriteApprovedToday',
  'publicArtifactCreationApprovedToday',
  'storageTransferApprovedToday',
  'signedUrlCreationApprovedToday',
  'previewArtifactApprovedToday',
  'exportArtifactApprovedToday',
  'supabaseStorageMutationApprovedToday',
  'serviceRoleDeliveryApprovedToday',
  'artifactDeliveryApprovedToday',
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'supabaseSqlApprovedToday',
  'internalBetaUnlockApprovedToday',
  'externalBetaUnlockApprovedToday',
  'productionUnlockApprovedToday'
];

const forbiddenText = [
  ...falseFlags.map((flag) => `"${flag}": true`),
  '"sqlExecuted": "yes"',
  '"storageWriteApprovedToday": true',
  '"storageWriteAllowed": true',
  '"signedUrlCreationAllowed": true',
  '"artifactDeliveryAllowed": true',
  '"acceptedForExecutionToday": true',
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

for (const [key, text] of Object.entries(docs)) {
  for (const forbidden of forbiddenText) {
    assert(!text.includes(forbidden), `Forbidden widened claim or secret marker found in ${key}: ${forbidden}`);
  }
}

const parsed = Object.fromEntries(
  Object.entries(labels).map(([key, label]) => [key, parseJsonFence(docs[key], label)])
);

assert(parsed.plan.decision === decision, 'Plan decision mismatch');
assert(parsed.plan.sourcePr === 1296, 'Source PR mismatch');
assert(
  parsed.plan.sourceMergeCommit === 'c32e683834b557455d0d913e38eafb85e223f5ea',
  'Source merge commit mismatch'
);
assert(
  parsed.plan.noArtifactStorageDeliveryEvidenceResult.noArtifactStorageDeliveryEvidencePlanCreated === true,
  'Plan not created'
);
assert(
  parsed.plan.noArtifactStorageDeliveryEvidenceResult.artifactStorageBoundaryAcceptedForInternalBetaEvidencePlanning ===
    true,
  'Artifact/storage boundary not accepted for evidence planning'
);
assert(parsed.plan.closedEvidenceItem === 'no_artifact_or_storage_delivery', 'Closed evidence item mismatch');
assert(parsed.plan.remainingEvidenceCount === 3, 'Remaining evidence count mismatch');
assert(parsed.plan.nextEvidenceItem === 'worker_route_dispatch_gate', 'Next evidence item mismatch');

for (const flag of falseFlags) {
  assert(parsed.plan.noArtifactStorageDeliveryEvidenceResult[flag] === false, `Plan flag must be false: ${flag}`);
  assert(parsed.boundaryPolicy.blockedToday[flag] === false, `Boundary flag must be false: ${flag}`);
  assert(parsed.claimPolicy.claimPolicy[flag] === false, `Claim-policy flag must be false: ${flag}`);
}

assert(parsed.sourceRegister.sourceEvidenceCount === 8, 'Source evidence count mismatch');
assert(parsed.sourceRegister.sourceEvidenceAcceptedForExecutionToday === false, 'Source evidence must not allow execution');

for (const source of [
  'private artifact write targets',
  'public artifact URLs',
  'signed URLs',
  'storage object paths',
  'preview artifact paths',
  'export artifact paths',
  'service-role delivery payloads'
]) {
  assert(parsed.boundaryPolicy.blockedArtifactSourcesToday.includes(source), `Missing blocked artifact source: ${source}`);
}

for (const operation of [
  'private artifact write',
  'public artifact creation',
  'storage transfer',
  'signed URL creation',
  'Supabase storage mutation',
  'service-role artifact delivery',
  'preview artifact creation',
  'export artifact creation'
]) {
  assert(
    parsed.boundaryPolicy.blockedArtifactOperationsToday.includes(operation),
    `Missing blocked artifact operation: ${operation}`
  );
}

assert(
  parsed.blockerRegister.closedEvidenceItems.some((item) => item.id === 'approved_plan_snapshot_policy_preserved') &&
    parsed.blockerRegister.closedEvidenceItems.some((item) => item.id === 'no_real_user_media_boundary') &&
    parsed.blockerRegister.closedEvidenceItems.some((item) => item.id === 'no_artifact_or_storage_delivery'),
  'Closed evidence items incomplete'
);
assert(parsed.blockerRegister.remainingEvidenceCount === 3, 'Blocker remaining evidence count mismatch');
for (const item of ['worker_route_dispatch_gate', 'supabase_sql_gate', 'security_cost_support_gate']) {
  assert(parsed.blockerRegister.remainingEvidenceItems.includes(item), `Missing remaining evidence item: ${item}`);
}

assert(parsed.claimPolicy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.claimPolicy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');

assert(
  docs.sourceNoRealUserMedia.includes('"sourcePr": 1292') &&
    docs.sourceNoRealUserMedia.includes('"remainingEvidenceCount": 4') &&
    docs.sourceNoRealUserMedia.includes('"artifactDeliveryApprovedToday": false'),
  'No-real-user-media source evidence incomplete'
);
assert(
  docs.sourceNoRealUserMediaPolicy.includes('"artifact write targets"') &&
    docs.sourceNoRealUserMediaPolicy.includes('"storage transfer"') &&
    docs.sourceNoRealUserMediaPolicy.includes('"public artifact creation"'),
  'No-real-user-media policy source incomplete'
);
assert(docs.sourceNoRealUserMediaBlockers.includes('no_artifact_or_storage_delivery'), 'Source blocker item missing');
assert(
  docs.sourceArtifactDeliveryGap.includes('"artifactDeliveryPlanningGapClosed": true') &&
    docs.sourceArtifactDeliveryGap.includes('"privateArtifactWriteApprovedToday": false') &&
    docs.sourceArtifactDeliveryGap.includes('"signedUrlCreationApprovedToday": false') &&
    docs.sourceArtifactDeliveryGap.includes('"externalBetaAllowed": false'),
  'Artifact delivery gap source incomplete'
);
assert(
  docs.sourceArtifactDeliveryReadiness.includes('"storageWriteAllowed": false') &&
    docs.sourceArtifactDeliveryReadiness.includes('"artifactDeliveryAllowed": false'),
  'Artifact readiness boundary source incomplete'
);
assert(
  docs.sourceArtifactDeliveryAcceptance.includes('remain closed'),
  'Artifact acceptance source must preserve closed boundary'
);
assert(
  docs.sourceSupabaseStorageGap.includes('"storageWriteApprovedToday": false') &&
    docs.sourceSupabaseStorageGap.includes('"artifactDeliveryApprovedToday": false'),
  'Supabase/storage gap source incomplete'
);
assert(docs.mediaOwnerGate.includes('"storageTransferApprovedToday": false'), 'Media owner gate missing storage transfer false');
assert(
  docs.mediaSourceReview.includes('"artifactSourceCreationApprovedToday": false'),
  'Media source review missing artifact source false'
);
assert(/worker\/route dispatch gate evidence/i.test(docs.nextPrompt), 'Next prompt missing worker/route scope');

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_no_artifact_storage_delivery_evidence_plan_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1296,
      sourceMergeCommit: 'c32e683834b557455d0d913e38eafb85e223f5ea',
      noArtifactStorageDeliveryEvidencePlanCreated: true,
      artifactDeliveryApprovedToday: false,
      storageTransferApprovedToday: false,
      signedUrlCreationApprovedToday: false,
      remainingEvidenceCount: 3,
      nextEvidenceItem: 'worker_route_dispatch_gate',
      internalBetaUnlockApprovedToday: false,
      externalBetaUnlockApprovedToday: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-WORKER-ROUTE-DISPATCH-GATE-EVIDENCE-PLAN-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: plan worker/route dispatch gate evidence for internal beta, no execution'
    },
    null,
    2
  )
);
