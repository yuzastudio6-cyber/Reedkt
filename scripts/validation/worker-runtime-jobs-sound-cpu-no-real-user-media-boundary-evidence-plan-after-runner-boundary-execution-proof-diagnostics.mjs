import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const decision =
  'worker_runtime_jobs_sound_cpu_no_real_user_media_boundary_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_no_artifact_storage_delivery_evidence_plan_after_runner_boundary_execution_proof';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceRegister: 'docs/worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-source-register-after-runner-boundary-execution-proof.md',
  boundaryPolicy: 'docs/worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-policy-after-runner-boundary-execution-proof.md',
  blockerRegister: 'docs/worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-blocker-register-after-runner-boundary-execution-proof.md',
  claimPolicy: 'docs/worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceApprovedSnapshot:
    'docs/worker-runtime-jobs-sound-cpu-approved-snapshot-payload-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceApprovedSnapshotBlockers:
    'docs/worker-runtime-jobs-sound-cpu-approved-snapshot-payload-blocker-register-after-runner-boundary-execution-proof.md',
  mediaOwnerGate: 'docs/worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register.md',
  mediaSourceReview: 'docs/worker-runtime-jobs-sound-cpu-supabase-media-source-review-register.md',
  artifactDeliveryGap: 'docs/worker-runtime-jobs-sound-cpu-artifact-delivery-gap-closure.md',
  soundGate0MediaPolicy: 'docs/sound-runtime-media-gate-0-media-runtime-policy-plan.md',
  soundGate1aRuntimeClaim: 'docs/sound-runtime-media-gate-1a-runtime-claim-policy.md',
  soundGate1aExclusion: 'docs/sound-runtime-media-gate-1a-exclusion-register.md'
};

const labels = {
  plan: 'worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-evidence-plan-after-runner-boundary-execution-proof',
  sourceRegister:
    'worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-source-register-after-runner-boundary-execution-proof',
  boundaryPolicy:
    'worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-policy-after-runner-boundary-execution-proof',
  blockerRegister:
    'worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-blocker-register-after-runner-boundary-execution-proof',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-no-real-user-media-boundary-claim-policy-after-runner-boundary-execution-proof'
};

const falseFlags = [
  'realUserMediaAcceptedToday',
  'mediaFileOpenApprovedToday',
  'uploadReadApprovedToday',
  'storageObjectReadApprovedToday',
  'signedUrlCreationApprovedToday',
  'ffmpegFfprobeApprovedToday',
  'pydubMediaOperationApprovedToday',
  'audioreadAudioOpenApprovedToday',
  'modelMediaPathApprovedToday',
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
  '"realUserMediaAcceptedToday": true',
  '"mediaFileOpenApprovedToday": true',
  '"uploadReadApprovedToday": true',
  '"storageObjectReadApprovedToday": true',
  '"signedUrlCreationApprovedToday": true',
  '"ffmpegFfprobeApprovedToday": true',
  '"pydubMediaOperationApprovedToday": true',
  '"audioreadAudioOpenApprovedToday": true',
  '"modelMediaPathApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"supabaseSqlApprovedToday": true',
  '"internalBetaUnlockApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"productionUnlockApprovedToday": true',
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
  Object.entries(labels).map(([key, label]) => [key, parseJsonFence(docs[key], label)])
);

assert(parsed.plan.decision === decision, 'Plan decision mismatch');
assert(parsed.plan.sourcePr === 1292, 'Source PR mismatch');
assert(
  parsed.plan.sourceMergeCommit === 'ed91c43cb51d673d78364577c44073b30615a66a',
  'Source merge commit mismatch'
);
assert(parsed.plan.noRealUserMediaBoundaryEvidenceResult.noRealUserMediaBoundaryEvidencePlanCreated === true, 'Plan not created');
assert(parsed.plan.noRealUserMediaBoundaryEvidenceResult.sanitizedFixtureOnlyBoundaryPreserved === true, 'Sanitized fixture boundary not preserved');
assert(parsed.plan.remainingEvidenceCount === 4, 'Remaining evidence count mismatch');
assert(parsed.plan.nextEvidenceItem === 'no_artifact_or_storage_delivery', 'Next evidence item mismatch');

for (const flag of falseFlags) {
  assert(parsed.plan.noRealUserMediaBoundaryEvidenceResult[flag] === false, `Plan flag must be false: ${flag}`);
  assert(parsed.boundaryPolicy.blockedToday[flag] === false, `Boundary flag must be false: ${flag}`);
  assert(parsed.claimPolicy.claimPolicy[flag] === false, `Claim flag must be false: ${flag}`);
}

assert(parsed.sourceRegister.sourceEvidenceCount === 7, 'Source evidence count mismatch');
assert(parsed.sourceRegister.sourceEvidenceAcceptedForExecutionToday === false, 'Source evidence must not allow execution');
assert(
  parsed.boundaryPolicy.allowedForFutureInternalBetaPlanning.includes('synthetic in-memory numeric arrays') &&
    parsed.boundaryPolicy.allowedForFutureInternalBetaPlanning.includes('package metadata'),
  'Allowed synthetic planning surface incomplete'
);
for (const source of [
  'real user media uploads',
  'uploaded audio or video file paths',
  'storage object paths',
  'signed URLs',
  'public URLs',
  'provider output blobs',
  'model media paths',
  'artifact write targets'
]) {
  assert(parsed.boundaryPolicy.blockedMediaSourcesToday.includes(source), `Missing blocked media source: ${source}`);
}
for (const operation of [
  'media file open',
  'audioread.audio_open',
  'pydub media operation',
  'FFmpeg execution',
  'ffprobe execution',
  'signed URL creation',
  'public artifact creation'
]) {
  assert(parsed.boundaryPolicy.blockedMediaOperationsToday.includes(operation), `Missing blocked media operation: ${operation}`);
}

assert(
  parsed.blockerRegister.closedEvidenceItems.some((item) => item.id === 'approved_plan_snapshot_policy_preserved') &&
    parsed.blockerRegister.closedEvidenceItems.some((item) => item.id === 'no_real_user_media_boundary'),
  'Closed evidence items incomplete'
);
assert(parsed.blockerRegister.remainingEvidenceCount === 4, 'Blocker remaining evidence count mismatch');
assert(parsed.blockerRegister.remainingEvidenceItems.includes('no_artifact_or_storage_delivery'), 'Next blocker missing');
assert(parsed.claimPolicy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');

assert(docs.sourceApprovedSnapshot.includes('sourcePr": 1286'), 'Approved snapshot source missing');
assert(docs.sourceApprovedSnapshotBlockers.includes('no_real_user_media_boundary'), 'Approved snapshot blocker source missing');
assert(docs.mediaOwnerGate.includes('"mediaFileOpenApprovedToday": false'), 'Media owner gate missing media-file-open false');
assert(docs.mediaOwnerGate.includes('"signedUrlCreationApprovedToday": false'), 'Media owner gate missing signed URL false');
assert(docs.mediaSourceReview.includes('"mediaSourceCreationApprovedToday": false'), 'Media source review missing source creation false');
assert(docs.soundGate0MediaPolicy.includes('"realUserData": "blocked"'), 'Gate 0 media policy missing real user data block');
assert(docs.soundGate0MediaPolicy.includes('"pydubOperation": "no"'), 'Gate 0 media policy missing pydub no');
assert(docs.soundGate1aRuntimeClaim.includes('"audioreadAudioOpen": "blocked"'), 'Gate 1A runtime claim missing audioread block');
assert(docs.soundGate1aRuntimeClaim.includes('"pydubMediaOperation": "blocked"'), 'Gate 1A runtime claim missing pydub block');
assert(docs.soundGate1aExclusion.includes('"ffmpegFfprobeExecution": "blocked"'), 'Gate 1A exclusion missing ffmpeg block');
assert(docs.artifactDeliveryGap.includes('"artifactDeliveryPlanningGapClosed": true'), 'Artifact delivery source missing planning closure');
assert(/no artifact\/storage delivery/i.test(docs.nextPrompt), 'Next prompt missing artifact/storage scope');

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_no_real_user_media_boundary_evidence_plan_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1292,
      sourceMergeCommit: 'ed91c43cb51d673d78364577c44073b30615a66a',
      sanitizedFixtureOnlyBoundaryPreserved: true,
      realUserMediaAcceptedToday: false,
      remainingEvidenceCount: 4,
      nextEvidenceItem: 'no_artifact_or_storage_delivery',
      internalBetaUnlockApprovedToday: false,
      externalBetaUnlockApprovedToday: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-NO-ARTIFACT-STORAGE-DELIVERY-EVIDENCE-PLAN-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: plan no artifact/storage delivery evidence for internal beta, no beta unlock'
    },
    null,
    2
  )
);
