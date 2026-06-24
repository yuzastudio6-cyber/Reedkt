#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'sound_runtime_media_gate_1j_controlled_docker_build_proof_passed_with_warnings_ready_for_build_proof_owner_review';
const SOURCE_HEAD = 'a25094bb3870fe22d3fee8ffc2797198fea282ba';
const PR726_DECISION = 'worker_runtime_jobs_sound_cpu_docker_build_readiness_owner_review_passed_with_warnings_ready_for_controlled_docker_build_proof';
const PR720_DECISION = 'sound_runtime_media_gate_1i_docker_build_proof_readiness_plan_completed_with_warnings_ready_for_build_readiness_owner_review';
const PR716_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_validation_owner_review_passed_with_warnings_ready_for_build_proof_readiness_plan';
const PR712_DECISION = 'sound_runtime_media_gate_1h_dockerfile_static_validation_passed_with_warnings_ready_for_static_validation_owner_review';
const PR707_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_source_owner_review_passed_with_warnings_ready_for_static_validation';
const PR703_DECISION = 'sound_runtime_media_gate_1g_actual_dockerfile_source_created_with_warnings_ready_for_dockerfile_source_owner_review';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const IMAGE_TAG = 'reeditpro-sound-cpu:gate-1j-local';
const IMAGE_ID = 'sha256:b9c202435f9037acddd7bd96b1daf790cea69623e1450128205c68472e506a2b';
const FINAL_SCOPE = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Docker build was limited to the controlled local Gate 1J proof; no Docker push or Docker run was enabled.';

const DOC_BLOCKS = [
  ['docs/sound-runtime-media-gate-1j-controlled-docker-build-proof-result.md', 'sound-runtime-media-gate-1j-controlled-docker-build-proof-result'],
  ['docs/sound-runtime-media-gate-1j-build-log-summary.md', 'sound-runtime-media-gate-1j-build-log-summary'],
  ['docs/sound-runtime-media-gate-1j-image-metadata-register.md', 'sound-runtime-media-gate-1j-image-metadata-register'],
  ['docs/sound-runtime-media-gate-1j-no-push-no-run-policy.md', 'sound-runtime-media-gate-1j-no-push-no-run-policy'],
  ['docs/sound-runtime-media-gate-1j-build-failure-classification-register.md', 'sound-runtime-media-gate-1j-build-failure-classification-register'],
  ['docs/sound-runtime-media-gate-1j-runtime-claim-policy.md', 'sound-runtime-media-gate-1j-runtime-claim-policy']
];

const PROMPT_BLOCKS = [
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1k-docker-build-proof-validation-review.md', 'sound-runtime-media-gate-1k-docker-build-proof-validation-review'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-image-hardening-plan.md', 'worker-runtime-jobs-sound-cpu-image-hardening-plan']
];

const SOURCE_BLOCKS = [
  ['docs/sound-runtime-media-gate-1i-docker-build-proof-readiness-plan.md', 'sound-runtime-media-gate-1i-docker-build-proof-readiness-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'],
  ['docs/sound-runtime-media-gate-1h-dockerfile-static-validation-result.md', 'sound-runtime-media-gate-1h-dockerfile-static-validation-result'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'],
  ['docs/sound-runtime-media-gate-1g-actual-dockerfile-source-result.md', 'sound-runtime-media-gate-1g-actual-dockerfile-source-result']
];

const REQUIRED_FILES = [
  DOCKERFILE_PATH,
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json',
  'scripts/validation/sound-runtime-media-gate-1j-diagnostics.mjs'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  assert(existsSync(file), `Missing required file: ${file}`);
  return readFileSync(file, 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseBlock(file, label) {
  const text = read(file);
  const pattern = new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```');
  const match = text.match(pattern);
  assert(match, `Missing JSON block ${label} in ${file}`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Invalid JSON block ${label} in ${file}: ${error.message}`);
  }
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`);
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`);
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`);
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`);
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`);
}

function assertClosed(value, label) {
  assert(value === false || value === 'no' || value === 'none' || value === 'blocked' || value === 'blocked_unclaimed', `${label} must stay closed`);
}

function walkClosed(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((child, index) => walkClosed(child, trail.concat(String(index))));
    return;
  }

  const guarded = new Set([
    'dockerPushRun',
    'dockerRunRun',
    'dockerComposeRun',
    'gcpTouched',
    'cloudRunTouched',
    'secretManagerTouched',
    'workerExecutionRun',
    'routeExecutionRun',
    'toolExecutionRun',
    'mediaProcessingRun',
    'ffmpegOrFfprobeRun',
    'modelWeightsDownloaded',
    'supabaseTouched',
    'sqlExecuted',
    'artifactCreated',
    'storageTransferRun',
    'signedUrlCreated',
    'publicArtifactCreated',
    'dockerReadinessClaimed',
    'imageReadinessClaimed',
    'workerReadinessClaimed',
    'routeReadinessClaimed',
    'runtimeReadinessClaimed',
    'mediaReadinessClaimed',
    'gcpReadinessClaimed',
    'cloudRunReadinessClaimed',
    'secretManagerReadinessClaimed',
    'supabaseReadinessClaimed',
    'artifactReadinessClaimed',
    'modelWeightReadinessClaimed',
    'billingReadinessClaimed',
    'betaReadinessClaimed',
    'productionReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'acceptedForDockerBuildToday',
    'acceptedForDockerPushToday',
    'acceptedForDockerRunToday',
    'acceptedForRuntimeExecutionToday',
    'acceptedForExecutionToday',
    'registryArtifactCreated',
    'publicArtifactCreated',
    'dockerPushAllowed',
    'dockerRunAllowed'
  ]);

  for (const [key, child] of Object.entries(value)) {
    const label = trail.concat(key).join('.');
    if (guarded.has(key)) assertClosed(child, label);
    if (key === 'allowed' && !trail.includes('positiveClaims')) assertClosed(child, label);
    walkClosed(child, trail.concat(key));
  }
}

function scanUnsafe(files) {
  const patterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    /\b(?:postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}\b/i,
    /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(dockerPushRun|dockerRunRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|sqlExecuted|artifactCreated|generatedLocalFixturePassedClaimed|dryRunPassedClaimed|dockerReadinessClaimed|imageReadinessClaimed|workerReadinessClaimed|runtimeReadinessClaimed|mediaReadinessClaimed)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i
  ];

  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`);
  }
}

for (const file of REQUIRED_FILES) read(file);
const parsed = Object.fromEntries([...DOC_BLOCKS, ...PROMPT_BLOCKS, ...SOURCE_BLOCKS].map(([file, label]) => [label, parseBlock(file, label)]));

const result = parsed['sound-runtime-media-gate-1j-controlled-docker-build-proof-result'];
assert(result.decision === DECISION, 'Gate 1J decision mismatch');
assert(result.sourceBase.head === SOURCE_HEAD, 'Gate 1J source head mismatch');
assert(result.sourceBase.pr726.decision === PR726_DECISION, 'PR #726 decision missing');
assert(result.sourceBase.pr726.mergeCommit === SOURCE_HEAD, 'PR #726 merge commit mismatch');
assert(result.sourceBase.pr720.decision === PR720_DECISION, 'PR #720 decision missing');
assert(result.sourceBase.pr716.decision === PR716_DECISION, 'PR #716 decision missing');
assert(result.sourceBase.pr712.decision === PR712_DECISION, 'PR #712 decision missing');
assert(result.sourceBase.pr707.decision === PR707_DECISION, 'PR #707 decision missing');
assert(result.sourceBase.pr703.decision === PR703_DECISION, 'PR #703 decision missing');
assert(result.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch');
assert(result.requirementsSource === REQUIREMENTS_PATH, 'requirements path mismatch');
assert(result.hashes.packageLockSha256 === 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3', 'package-lock hash mismatch');
assert(result.preflight.dockerDaemonAvailable === true, 'Docker daemon preflight missing');
assert(result.preflight.backupVolumeAvailable === '81Gi', 'disk evidence mismatch');
assert(result.controlledBuildProof.attemptCount === 1, 'Gate 1J must record exactly one build attempt');
assert(result.controlledBuildProof.dockerBuildRun === true, 'controlled local build proof must be recorded');
assert(result.controlledBuildProof.status === 'passed', 'controlled build proof did not pass');
assert(result.controlledBuildProof.imageInspectRun === true, 'image inspect proof missing');
assert(result.controlledBuildProof.imageRemoved === true, 'image cleanup proof missing');
assert(result.controlledBuildProof.dockerPushRun === false, 'Docker push must stay blocked');
assert(result.controlledBuildProof.dockerRunRun === false, 'Docker run must stay blocked');
assertNoop(result.supabaseClassification, 'Gate 1J result');

const summary = parsed['sound-runtime-media-gate-1j-build-log-summary'];
assert(summary.logPolicy.rawLogStoredInRepo === false, 'raw build log must not be committed');
assert(summary.sanitizedBuildSummary.pipInstallCompleted === true, 'pip install evidence missing');
assert(summary.sanitizedBuildSummary.buildStatus === 'passed', 'build log summary status mismatch');
assert(summary.installedPinnedPackageEvidence.length === 13, 'expected 13 pinned package evidence entries');
assertNoop(summary.supabaseClassification, 'build log summary');

const image = parsed['sound-runtime-media-gate-1j-image-metadata-register'];
assert(image.imageTag === IMAGE_TAG, 'image tag mismatch');
assert(image.metadata.id === IMAGE_ID, 'image ID mismatch');
assert(image.metadata.sizeBytes === 333375027, 'image size mismatch');
assert(image.metadata.user === 'reeditpro', 'non-root image user mismatch');
assert(image.metadata.envFlags.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime disabled env missing');
assert(image.metadata.envFlags.REEDITPRO_WORKER_EXECUTION_ENABLED === '0', 'worker disabled env missing');
assert(image.metadata.envFlags.REEDITPRO_MEDIA_PROCESSING_ENABLED === '0', 'media disabled env missing');
assert(image.imageLifecycle.imageRemoved === true, 'image removal evidence missing');
assert(image.imageLifecycle.imageTagStillPresentAfterCleanup === false, 'image tag must be absent after cleanup');
assertNoop(image.supabaseClassification, 'image metadata');

const noPush = parsed['sound-runtime-media-gate-1j-no-push-no-run-policy'];
assert(noPush.policy === 'controlled_local_build_only', 'no-push/no-run policy mismatch');
assert(noPush.observed.dockerBuildRun === true, 'controlled build should be recorded');
assert(noPush.observed.dockerPushRun === false, 'Docker push must be false');
assert(noPush.observed.dockerRunRun === false, 'Docker run must be false');
assertNoop(noPush.supabaseClassification, 'no-push/no-run policy');

const failures = parsed['sound-runtime-media-gate-1j-build-failure-classification-register'];
assert(failures.result === 'passed', 'failure register result mismatch');
assert(failures.appliedFailureClass === 'none', 'unexpected failure class');
for (const category of [
  'sound_runtime_media_gate_1j_blocked_docker_unavailable',
  'sound_runtime_media_gate_1j_blocked_insufficient_disk',
  'sound_runtime_media_gate_1j_controlled_docker_build_proof_failed_blocked_for_fix',
  'sound_runtime_media_gate_1j_blocked_safety_scan'
]) {
  assert(failures.failureCategories.some((row) => row.category === category && row.observed === false), `missing failure category ${category}`);
}
assert(failures.successfulPath.trackedBuildOutputAllowed !== true, 'tracked build outputs must stay disallowed');
assertNoop(failures.supabaseClassification, 'failure register');

const claimPolicy = parsed['sound-runtime-media-gate-1j-runtime-claim-policy'];
assert(claimPolicy.positiveClaims.some((row) => row.claim === 'controlled local Docker build proof completed' && row.allowed === true), 'positive controlled build claim missing');
for (const claim of ['Docker push', 'Docker run', 'Cloud Run or GCP readiness', 'worker execution', 'media processing', 'Supabase readiness', 'generated_local_fixture_passed', 'dry_run_passed', 'runtime readiness', 'production readiness']) {
  assert(claimPolicy.notClaims.some((row) => row.claim === claim && row.allowed === false), `claim policy missing ${claim}`);
}
assertNoop(claimPolicy.supabaseClassification, 'claim policy');

const gate1i = parsed['sound-runtime-media-gate-1i-docker-build-proof-readiness-plan'];
assert(gate1i.decision === PR720_DECISION, 'Gate 1I source decision mismatch');

const owner = parsed['worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'];
assert(owner.decision === PR726_DECISION, 'build-readiness owner review source decision mismatch');
assert(owner.controlledDockerBuildProofMayProceedAfterOwnerReview === true, 'owner review did not allow Gate 1J proof');

const gate1h = parsed['sound-runtime-media-gate-1h-dockerfile-static-validation-result'];
assert(gate1h.decision === PR712_DECISION, 'Gate 1H source decision mismatch');
assert(gate1h.staticValidator.status === 'passed', 'Gate 1H static validator must have passed');

const sourceOwner = parsed['worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'];
assert(sourceOwner.decision === PR707_DECISION, 'PR #707 source decision mismatch');

const gate1g = parsed['sound-runtime-media-gate-1g-actual-dockerfile-source-result'];
assert(gate1g.decision === PR703_DECISION, 'PR #703 source decision mismatch');

const ownerPrompt = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review'];
assert(ownerPrompt.requiredGate1JDecision === DECISION, 'owner-review prompt must require Gate 1J decision');
assert(ownerPrompt.requiredGate1JObservedResult.controlledLocalDockerBuildPassed === true, 'owner-review prompt missing Gate 1J passed evidence');
assert(ownerPrompt.requiredGate1JObservedResult.dockerPushRun === false, 'owner-review prompt must keep push false');
assertNoop(ownerPrompt.supabaseClassification, 'owner-review prompt');

const gate1kPrompt = parsed['sound-runtime-media-gate-1k-docker-build-proof-validation-review'];
assert(gate1kPrompt.requiredGate1JDecision === DECISION, 'Gate 1K prompt must require Gate 1J decision');
assert(gate1kPrompt.acceptedForDockerBuildToday === false, 'Gate 1K prompt must not authorize build');
assertNoop(gate1kPrompt.supabaseClassification, 'Gate 1K prompt');

const hardeningPrompt = parsed['worker-runtime-jobs-sound-cpu-image-hardening-plan'];
assert(hardeningPrompt.requiredGate1JDecision === DECISION, 'image hardening prompt must require Gate 1J decision');
assert(hardeningPrompt.hardeningInputs.observedWarning === 'pip_root_user_warning', 'image hardening prompt must carry build warning');
assert(hardeningPrompt.acceptedForDockerBuildToday === false, 'image hardening prompt must not authorize build');
assertNoop(hardeningPrompt.supabaseClassification, 'image hardening prompt');

const dockerfile = read(DOCKERFILE_PATH);
assert(dockerfile.includes('FROM python:3.13-slim'), 'Dockerfile base image missing');
assert(dockerfile.includes(`COPY ${REQUIREMENTS_PATH} ./requirements.sound-oss-tools.txt`), 'Dockerfile requirements copy missing');
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'Dockerfile runtime disabled flag missing');
assert(dockerfile.includes('REEDITPRO_WORKER_EXECUTION_ENABLED=0'), 'Dockerfile worker disabled flag missing');
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'Dockerfile media disabled flag missing');
assert(dockerfile.includes('USER reeditpro'), 'Dockerfile non-root user missing');
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'Dockerfile fail-closed command missing');

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['sound-runtime-media-gate-1j:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-1j-diagnostics.mjs', 'missing Gate 1J package script');
assert(read('docs/sound-runtime-media-gate-1j-controlled-docker-build-proof-result.md').includes(FINAL_SCOPE), 'missing final scope statement');

for (const object of Object.values(parsed)) walkClosed(object);
scanUnsafe([...DOC_BLOCKS.map(([file]) => file), ...PROMPT_BLOCKS.map(([file]) => file)]);

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_1j_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  controlledDockerBuildProofPassed: true,
  buildAttemptCount: 1,
  imageTag: IMAGE_TAG,
  imageRemoved: true,
  dockerPushRun: false,
  dockerRunRun: false,
  gcpTouched: false,
  workerExecutionRun: false,
  mediaProcessingRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  artifactCreated: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKER-BUILD-PROOF-OWNER-REVIEW'
}, null, 2));
