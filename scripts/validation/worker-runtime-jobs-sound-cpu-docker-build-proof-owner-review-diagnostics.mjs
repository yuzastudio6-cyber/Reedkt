#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_docker_build_proof_owner_review_passed_with_warnings_ready_for_image_hardening_plan';
const SOURCE_HEAD = '748a1d280f6005f736fbe0689283c067583a71a3';
const PR730_DECISION = 'sound_runtime_media_gate_1j_controlled_docker_build_proof_passed_with_warnings_ready_for_build_proof_owner_review';
const PR726_DECISION = 'worker_runtime_jobs_sound_cpu_docker_build_readiness_owner_review_passed_with_warnings_ready_for_controlled_docker_build_proof';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const IMAGE_TAG = 'reeditpro-sound-cpu:gate-1j-local';
const IMAGE_ID = 'sha256:b9c202435f9037acddd7bd96b1daf790cea69623e1450128205c68472e506a2b';
const FINAL_SCOPE = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. No Docker push or Docker run was enabled in this owner-review prompt.';

const DOC_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-proof-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-image-metadata-review-register.md', 'worker-runtime-jobs-sound-cpu-image-metadata-review-register'],
  ['docs/worker-runtime-jobs-sound-cpu-image-cleanup-verification-register.md', 'worker-runtime-jobs-sound-cpu-image-cleanup-verification-register'],
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-readiness-register.md', 'worker-runtime-jobs-sound-cpu-image-hardening-readiness-register'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-proof-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-owner-claim-policy']
];

const PROMPT_BLOCKS = [
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-image-hardening-plan.md', 'worker-runtime-jobs-sound-cpu-image-hardening-plan'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1k-docker-build-proof-validation-review.md', 'sound-runtime-media-gate-1k-docker-build-proof-validation-review'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-image-hardening-owner-review.md', 'worker-runtime-jobs-sound-cpu-image-hardening-owner-review']
];

const SOURCE_BLOCKS = [
  ['docs/sound-runtime-media-gate-1j-controlled-docker-build-proof-result.md', 'sound-runtime-media-gate-1j-controlled-docker-build-proof-result'],
  ['docs/sound-runtime-media-gate-1j-image-metadata-register.md', 'sound-runtime-media-gate-1j-image-metadata-register'],
  ['docs/sound-runtime-media-gate-1j-no-push-no-run-policy.md', 'sound-runtime-media-gate-1j-no-push-no-run-policy'],
  ['docs/sound-runtime-media-gate-1j-runtime-claim-policy.md', 'sound-runtime-media-gate-1j-runtime-claim-policy'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review']
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
    'dockerBuildRerunInOwnerReview',
    'dockerPushRun',
    'dockerRunRun',
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
    'registryArtifactCreated',
    'publicArtifactCreated',
    'dockerReadinessClaimed',
    'imageReadinessClaimed',
    'workerReadinessClaimed',
    'routeReadinessClaimed',
    'runtimeReadinessClaimed',
    'mediaReadinessClaimed',
    'gcpReadinessClaimed',
    'cloudRunReadinessClaimed',
    'supabaseReadinessClaimed',
    'artifactReadinessClaimed',
    'betaReadinessClaimed',
    'productionReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'acceptedForDockerPushToday',
    'acceptedForPushToday',
    'acceptedForDockerRunToday',
    'acceptedForRunToday',
    'acceptedForDeploymentToday',
    'acceptedForCloudRunToday',
    'acceptedForGcpToday',
    'acceptedForWorkerExecutionToday'
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

const review = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review'];
assert(review.decision === DECISION, 'owner review decision mismatch');
assert(review.sourceBase.head === SOURCE_HEAD, 'source head mismatch');
assert(review.sourceBase.pr730.mergeCommit === SOURCE_HEAD, 'PR #730 merge commit mismatch');
assert(review.sourceBase.pr730.decision === PR730_DECISION, 'PR #730 decision missing');
assert(review.sourceBase.pr726.decision === PR726_DECISION, 'PR #726 decision missing');
assert(review.targetOwner === 'WORKER_RUNTIME_JOBS', 'owner boundary mismatch');
assert(review.dockerfilePathReviewed === DOCKERFILE_PATH, 'Dockerfile path mismatch');
assert(review.requirementsSource === REQUIREMENTS_PATH, 'requirements path mismatch');
assert(review.ownerReviewResult.buildProofOwnerReviewPassed === true, 'owner review pass missing');
assert(review.ownerReviewResult.controlledLocalDockerBuildProofAccepted === true, 'controlled proof acceptance missing');
assert(review.ownerReviewResult.imageInspectProofAccepted === true, 'image inspect acceptance missing');
assert(review.ownerReviewResult.imageCleanupProofAccepted === true, 'cleanup acceptance missing');
assert(review.ownerReviewResult.acceptedForImageHardeningPlanning === true, 'image hardening readiness missing');
assert(review.reviewedEvidence.imageTagRemoved === IMAGE_TAG, 'image tag evidence mismatch');
assert(review.reviewedEvidence.imageId === IMAGE_ID, 'image ID mismatch');
assert(review.reviewedEvidence.imageSizeBytes === 333375027, 'image size mismatch');
assertNoop(review.supabaseClassification, 'owner review');

const acceptance = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-acceptance-register'];
assert(acceptance.decision === DECISION, 'acceptance decision mismatch');
assert(acceptance.sourceDecision === PR730_DECISION, 'acceptance source decision mismatch');
for (const item of ['Dockerfile path', 'controlled local build proof', 'image inspect proof', 'image metadata', 'image cleanup proof', 'local image tag removed', 'no Docker push', 'no Docker run', 'no GCP or Cloud Run', 'no worker execution', 'no media execution', 'no Supabase or SQL', 'no model weights', 'package-lock unchanged']) {
  const row = acceptance.register.find((entry) => entry.item === item);
  assert(row, `acceptance register missing ${item}`);
  assert(row.accepted === true, `${item} must be accepted as reviewed evidence`);
  assert(row.acceptedForImageHardeningPlanning === true, `${item} must feed image-hardening planning`);
  assert(row.acceptedForPushToday === false, `${item} must not approve push`);
  assert(row.acceptedForRunToday === false, `${item} must not approve run`);
  assert(row.acceptedForDeploymentToday === false, `${item} must not approve deployment`);
}
assertNoop(acceptance.supabaseClassification, 'acceptance register');

const metadata = parsed['worker-runtime-jobs-sound-cpu-image-metadata-review-register'];
assert(metadata.imageTag === IMAGE_TAG, 'metadata image tag mismatch');
assert(metadata.imageId === IMAGE_ID, 'metadata image ID mismatch');
assert(metadata.imageSizeBytes === 333375027, 'metadata image size mismatch');
assert(metadata.user === 'reeditpro', 'metadata user mismatch');
assert(metadata.envFlags.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'runtime env missing');
assert(metadata.envFlags.REEDITPRO_WORKER_EXECUTION_ENABLED === '0', 'worker env missing');
assert(metadata.envFlags.REEDITPRO_MEDIA_PROCESSING_ENABLED === '0', 'media env missing');
assert(metadata.accepted === true, 'metadata acceptance missing');
assertNoop(metadata.supabaseClassification, 'metadata register');

const cleanup = parsed['worker-runtime-jobs-sound-cpu-image-cleanup-verification-register'];
assert(cleanup.localImageTag === IMAGE_TAG, 'cleanup image tag mismatch');
assert(cleanup.cleanupAttempted === true, 'cleanup attempted missing');
assert(cleanup.cleanupPassed === true, 'cleanup pass missing');
assert(cleanup.imageRemaining === 'no', 'image remaining must be no');
assertNoop(cleanup.supabaseClassification, 'cleanup register');

const hardening = parsed['worker-runtime-jobs-sound-cpu-image-hardening-readiness-register'];
assert(hardening.imageHardeningPlanningMayProceed === true, 'image hardening planning must proceed');
assert(hardening.dockerBuildProofAccepted === true, 'build proof must be accepted');
for (const topic of ['base image pinning', 'digest pinning', 'package cache cleanup', 'vulnerability scanning', 'SBOM planning', '.dockerignore plan', 'no secrets or service accounts', 'no media or model artifacts']) {
  assert(hardening.hardeningTopicsRequired.includes(topic), `hardening topic missing ${topic}`);
}
assertNoop(hardening.supabaseClassification, 'hardening register');

const blockers = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-blocker-follow-up-register'];
for (const scope of ['Docker push', 'Docker run', 'Cloud Run', 'GCP APIs', 'Artifact Registry', 'Secret Manager', 'service accounts', 'worker execution', 'route/tool execution', 'media processing', 'FFmpeg/ffprobe', 'Supabase/SQL', 'artifacts', 'model weights', 'beta/production', 'generated_local_fixture_passed', 'dry_run_passed', 'runtime readiness']) {
  assert(blockers.blockers.some((row) => row.scope === scope && (row.status === 'blocked' || row.status === 'blocked_unclaimed')), `blocker missing ${scope}`);
}
assertNoop(blockers.supabaseClassification, 'blocker register');

const policy = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-owner-claim-policy'];
assert(policy.positiveClaims.some((row) => row.claim === 'Gate 1J controlled local build proof accepted for image-hardening planning' && row.allowed === true), 'positive owner-review claim missing');
for (const claim of ['Docker push readiness', 'Docker run readiness', 'Cloud Run readiness', 'deployment readiness', 'worker readiness', 'runtime readiness', 'media readiness', 'GCP readiness', 'Supabase readiness', 'artifact readiness', 'beta readiness', 'production readiness', 'generated_local_fixture_passed', 'dry_run_passed']) {
  assert(policy.notClaims.some((row) => row.claim === claim && row.allowed === false), `claim policy missing ${claim}`);
}
assertNoop(policy.supabaseClassification, 'claim policy');

const gate1j = parsed['sound-runtime-media-gate-1j-controlled-docker-build-proof-result'];
assert(gate1j.decision === PR730_DECISION, 'Gate 1J source decision mismatch');
assert(gate1j.controlledBuildProof.status === 'passed', 'Gate 1J build proof did not pass');
assert(gate1j.controlledBuildProof.imageInspectRun === true, 'Gate 1J image inspect missing');
assert(gate1j.controlledBuildProof.imageRemoved === true, 'Gate 1J image cleanup missing');
assert(gate1j.controlledBuildProof.dockerPushRun === false, 'Gate 1J source push widened');
assert(gate1j.controlledBuildProof.dockerRunRun === false, 'Gate 1J source run widened');

const gate1jImage = parsed['sound-runtime-media-gate-1j-image-metadata-register'];
assert(gate1jImage.metadata.id === IMAGE_ID, 'Gate 1J image ID mismatch');
assert(gate1jImage.metadata.sizeBytes === 333375027, 'Gate 1J image size mismatch');
assert(gate1jImage.imageLifecycle.imageRemoved === true, 'Gate 1J image lifecycle cleanup missing');

const readinessOwner = parsed['worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'];
assert(readinessOwner.decision === PR726_DECISION, 'PR #726 source decision mismatch');

const imageHardeningPrompt = parsed['worker-runtime-jobs-sound-cpu-image-hardening-plan'];
assert(imageHardeningPrompt.requiredBuildProofOwnerReviewDecision === DECISION, 'image hardening prompt must require owner review');
assert(imageHardeningPrompt.requiredGate1JDecision === PR730_DECISION, 'image hardening prompt must require Gate 1J');
assertNoop(imageHardeningPrompt.supabaseClassification, 'image hardening prompt');

const gate1kPrompt = parsed['sound-runtime-media-gate-1k-docker-build-proof-validation-review'];
assert(gate1kPrompt.requiredBuildProofOwnerReviewDecision === DECISION, 'Gate 1K prompt must require owner review');
assert(gate1kPrompt.requiredGate1JDecision === PR730_DECISION, 'Gate 1K prompt must require Gate 1J');
assertNoop(gate1kPrompt.supabaseClassification, 'Gate 1K prompt');

const hardeningOwnerPrompt = parsed['worker-runtime-jobs-sound-cpu-image-hardening-owner-review'];
assert(hardeningOwnerPrompt.requiredBuildProofOwnerReviewDecision === DECISION, 'image hardening owner prompt must require owner review');
assert(hardeningOwnerPrompt.acceptedForDockerBuildToday === false, 'image hardening owner prompt must not approve build');
assertNoop(hardeningOwnerPrompt.supabaseClassification, 'image hardening owner prompt');

const ownership = read('docs/cross-chat-tool-ownership-registry.md');
assert(ownership.includes('WORKER_RUNTIME_JOBS'), 'WORKER_RUNTIME_JOBS ownership missing');

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-docker-build-proof-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review-diagnostics.mjs', 'missing package script');
assert(read('docs/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md').includes(FINAL_SCOPE), 'missing final no-scope statement');

for (const object of [...DOC_BLOCKS, ...PROMPT_BLOCKS].map(([file, label]) => parsed[label])) walkClosed(object);
scanUnsafe([...DOC_BLOCKS.map(([file]) => file), ...PROMPT_BLOCKS.map(([file]) => file)]);

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_docker_build_proof_owner_review_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  pr730Verified: true,
  buildProofOwnerReviewPassed: true,
  imageHardeningPlanningMayProceed: true,
  dockerPushRun: false,
  dockerRunRun: false,
  gcpTouched: false,
  workerExecutionRun: false,
  routeExecutionRun: false,
  toolExecutionRun: false,
  mediaProcessingRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  modelWeightsDownloaded: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-PLAN'
}, null, 2));
