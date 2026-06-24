#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_validation_owner_review_passed_with_warnings_ready_for_build_proof_readiness_plan';
const COMPAT_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_validation_owner_review_passed_with_warnings_ready_for_docker_build_proof_plan';
const PR712_DECISION = 'sound_runtime_media_gate_1h_dockerfile_static_validation_passed_with_warnings_ready_for_static_validation_owner_review';
const PR707_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_source_owner_review_passed_with_warnings_ready_for_static_validation';
const PR703_DECISION = 'sound_runtime_media_gate_1g_actual_dockerfile_source_created_with_warnings_ready_for_dockerfile_source_owner_review';
const SOURCE_HEAD = '567588539b0145af92c41d26e9b941616f018ec8';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const STATIC_VALIDATOR_PATH = 'scripts/validation/sound-runtime-media-gate-1h-dockerfile-static-validator.mjs';
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const NO_SCOPE = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const DOC_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-validation-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-validation-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-static-validator-evidence-register.md', 'worker-runtime-jobs-sound-cpu-static-validator-evidence-register'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-proof-readiness-blocker-register.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-readiness-blocker-register'],
  ['docs/worker-runtime-jobs-sound-cpu-static-validation-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-static-validation-owner-claim-policy']
];

const PROMPT_BLOCKS = [
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1i-docker-build-proof-readiness-plan.md', 'sound-runtime-media-gate-1i-docker-build-proof-readiness-plan'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-plan.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review']
];

const SOURCE_BLOCKS = [
  ['docs/sound-runtime-media-gate-1h-dockerfile-static-validation-result.md', 'sound-runtime-media-gate-1h-dockerfile-static-validation-result'],
  ['docs/sound-runtime-media-gate-1h-dockerfile-instruction-validation-register.md', 'sound-runtime-media-gate-1h-dockerfile-instruction-validation-register'],
  ['docs/sound-runtime-media-gate-1h-prohibited-instruction-scan-register.md', 'sound-runtime-media-gate-1h-prohibited-instruction-scan-register'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review']
];

const REQUIRED_FILES = [
  DOCKERFILE_PATH,
  STATIC_VALIDATOR_PATH,
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json'
];

const ACCEPTANCE_ITEMS = [
  'Dockerfile exists',
  'static validator passed',
  'base image check',
  'requirements path check',
  'pip install check',
  'non-root user check',
  'runtime-disabled env vars',
  'fail-closed command',
  'no FFmpeg/ffprobe',
  'no model weights',
  'no media fixtures',
  'no secrets',
  'no service account files',
  'no Supabase credentials',
  'no provider credentials',
  'no Docker build',
  'no Docker push',
  'no GCP',
  'no worker execution'
];

const BLOCKED_SCOPES = [
  'Docker build proof',
  'Docker build',
  'Docker push',
  'Artifact Registry',
  'Cloud Run',
  'GCP APIs',
  'Secret Manager',
  'service accounts',
  'worker execution',
  'route/tool execution',
  'media processing',
  'FFmpeg/ffprobe',
  'Supabase/SQL',
  'artifacts',
  'model weights',
  'beta/production',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime readiness'
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
    'dockerBuildRun',
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
    'dockerReadinessClaimed',
    'imageReadinessClaimed',
    'workerReadinessClaimed',
    'routeReadinessClaimed',
    'runtimeReadinessClaimed',
    'mediaReadinessClaimed',
    'supabaseReadinessClaimed',
    'artifactReadinessClaimed',
    'betaReadinessClaimed',
    'productionReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'acceptedForDockerBuildToday',
    'acceptedForDockerPushToday',
    'acceptedForRuntimeExecutionToday',
    'acceptedForExecutionToday'
  ]);

  for (const [key, child] of Object.entries(value)) {
    if (guarded.has(key)) assertClosed(child, trail.concat(key).join('.'));
    if (key === 'allowed' && !trail.includes('positiveClaims')) assertClosed(child, trail.concat(key).join('.'));
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
    /"(dockerBuildRun|dockerPushRun|dockerRunRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|sqlExecuted|artifactCreated|dockerReadinessClaimed|imageReadinessClaimed|workerReadinessClaimed|runtimeReadinessClaimed|mediaReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
    /"(acceptedForDockerBuildToday|acceptedForDockerPushToday|acceptedForRuntimeExecutionToday|acceptedForExecutionToday)"\s*:\s*true/,
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

const ownerReview = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'];
assert(ownerReview.decision === DECISION, 'owner review decision mismatch');
assert(ownerReview.compatibilityDecisionAlias === COMPAT_DECISION, 'owner review compatibility decision missing');
assert(ownerReview.sourceBase.head === SOURCE_HEAD, 'source head mismatch');
assert(ownerReview.sourceBase.pr712.decision === PR712_DECISION, 'PR #712 decision missing');
assert(ownerReview.sourceBase.pr707.decision === PR707_DECISION, 'PR #707 decision missing');
assert(ownerReview.sourceBase.pr703.decision === PR703_DECISION, 'PR #703 decision missing');
assert(ownerReview.dockerfilePathReviewed === DOCKERFILE_PATH, 'Dockerfile path mismatch');
assert(ownerReview.staticValidatorReviewed === STATIC_VALIDATOR_PATH, 'static validator path mismatch');
assert(ownerReview.staticValidatorPassed === true, 'static validator passed must be represented');
assert(ownerReview.acceptedForBuildReadinessPlanning === true, 'build-readiness planning acceptance missing');
assert(ownerReview.acceptedForDockerBuildToday === false, 'Docker build must not be accepted today');
assertNoop(ownerReview.supabaseClassification, 'owner review');

const acceptance = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-validation-acceptance-register'];
for (const item of ACCEPTANCE_ITEMS) {
  const row = acceptance.register.find((entry) => entry.item === item);
  assert(row, `acceptance register missing ${item}`);
  assert(row.acceptedForStaticValidation === true, `${item} must be accepted for static validation`);
  assert(row.acceptedForBuildReadinessPlanning === true, `${item} must be accepted for build-readiness planning`);
  assert(row.acceptedForDockerBuildToday === false, `${item} must not be accepted for Docker build today`);
  assert(row.acceptedForExecutionToday === false, `${item} must not be accepted for execution today`);
}
assertNoop(acceptance.supabaseClassification, 'acceptance register');

const evidence = parsed['worker-runtime-jobs-sound-cpu-static-validator-evidence-register'];
assert(evidence.validatorScriptPath === STATIC_VALIDATOR_PATH, 'validator path not represented');
assert(evidence.dockerfilePath === DOCKERFILE_PATH, 'evidence Dockerfile path mismatch');
assert(evidence.validatorResult === 'passed', 'validator result must be passed');
assert(evidence.checksFailed.length === 0, 'validator evidence must have zero failed checks');
for (const required of ['base image', 'requirements copy', 'pip install', 'runtime-disabled env vars', 'non-root user', 'placeholder disabled command', 'prohibited instruction scan', 'credential-shaped string scan', 'unsafe readiness claim scan']) {
  assert(evidence.checksPerformed.includes(required), `validator evidence missing ${required}`);
}

const blockers = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-readiness-blocker-register'];
for (const scope of BLOCKED_SCOPES) {
  assert(blockers.blockers.some((row) => row.scope === scope && (row.status === 'blocked' || row.status === 'blocked_unclaimed')), `blocker register missing ${scope}`);
}
assertNoop(blockers.supabaseClassification, 'blocker register');

const policy = parsed['worker-runtime-jobs-sound-cpu-static-validation-owner-claim-policy'];
for (const claim of ['Docker build', 'Docker push', 'Docker run', 'image readiness', 'worker readiness', 'route readiness', 'runtime readiness', 'media readiness', 'GCP/Cloud Run readiness', 'Secret Manager readiness', 'Supabase readiness', 'artifact readiness', 'beta readiness', 'production readiness', 'generated_local_fixture_passed', 'dry_run_passed']) {
  assert(policy.notClaims.some((row) => row.claim === claim && row.allowed === false), `claim policy missing ${claim}`);
}
assertNoop(policy.supabaseClassification, 'claim policy');

const gate1h = parsed['sound-runtime-media-gate-1h-dockerfile-static-validation-result'];
assert(gate1h.decision === PR712_DECISION, 'Gate 1H result decision mismatch');
assert(gate1h.staticValidator.status === 'passed', 'Gate 1H static validator status missing');
assert(gate1h.dockerfilePath === DOCKERFILE_PATH, 'Gate 1H Dockerfile path mismatch');

const sourceOwner = parsed['worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'];
assert(sourceOwner.decision === PR707_DECISION, 'source owner decision mismatch');
assert(sourceOwner.dockerfilePathReviewed === DOCKERFILE_PATH, 'source owner path mismatch');

const gate1iPrompt = parsed['sound-runtime-media-gate-1i-docker-build-proof-readiness-plan'];
assert(gate1iPrompt.requiredStaticValidationDecision === PR712_DECISION, 'Gate 1I prompt must require PR #712 decision');
assert(gate1iPrompt.requiredStaticValidationOwnerReviewDecision === DECISION, 'Gate 1I prompt must require this owner review decision');
assert(gate1iPrompt.dockerBuildRun === false, 'Gate 1I must not run Docker build');
assertNoop(gate1iPrompt.supabaseClassification, 'Gate 1I prompt');

const buildProofPrompt = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-plan'];
assert(buildProofPrompt.requiredStaticValidationDecision === PR712_DECISION, 'build-proof prompt must require Gate 1H decision');
assert(buildProofPrompt.requiredStaticValidationOwnerReviewDecision === COMPAT_DECISION, 'build-proof compatibility decision mismatch');
assert(Array.isArray(buildProofPrompt.acceptedStaticValidationOwnerReviewDecisions), 'build-proof prompt must list accepted owner review decisions');
assert(buildProofPrompt.acceptedStaticValidationOwnerReviewDecisions.includes(DECISION), 'build-proof prompt missing build-readiness owner review decision');
assert(buildProofPrompt.acceptedStaticValidationOwnerReviewDecisions.includes(COMPAT_DECISION), 'build-proof prompt missing compatibility decision');

const readinessOwnerPrompt = parsed['worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'];
assert(readinessOwnerPrompt.requiredStaticValidationOwnerReviewDecision === DECISION, 'readiness owner prompt decision mismatch');
assert(readinessOwnerPrompt.dockerBuildRun === false, 'readiness owner prompt must not run Docker build');
assertNoop(readinessOwnerPrompt.supabaseClassification, 'readiness owner prompt');

const dockerfile = read(DOCKERFILE_PATH);
assert(dockerfile.includes('FROM python:3.13-slim'), 'Dockerfile base image missing');
assert(dockerfile.includes(`COPY ${REQUIREMENTS_PATH} ./requirements.sound-oss-tools.txt`), 'Dockerfile requirements copy mismatch');
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'Dockerfile runtime disabled flag missing');
assert(dockerfile.includes('REEDITPRO_WORKER_EXECUTION_ENABLED=0'), 'Dockerfile worker execution disabled flag missing');
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'Dockerfile media processing disabled flag missing');
assert(dockerfile.includes('USER reeditpro'), 'Dockerfile non-root user missing');
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'Dockerfile fail-closed command missing');

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-dockerfile-static-validation-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review-diagnostics.mjs', 'missing package script');
assert(read('docs/worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review.md').includes(NO_SCOPE), 'missing no-scope statement');

for (const object of Object.values(parsed)) walkClosed(object);
scanUnsafe([...DOC_BLOCKS.map(([file]) => file), ...PROMPT_BLOCKS.map(([file]) => file)]);

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dockerfile_static_validation_owner_review_diagnostics_passed',
  decision: DECISION,
  compatibilityDecisionAlias: COMPAT_DECISION,
  sourceHead: SOURCE_HEAD,
  pr712Verified: true,
  staticValidationOwnerReviewPassed: true,
  acceptedForBuildReadinessPlanning: true,
  acceptedForDockerBuildToday: false,
  dockerBuildRun: false,
  dockerPushRun: false,
  dockerRunRun: false,
  gcpTouched: false,
  workerExecutionRun: false,
  routeExecutionRun: false,
  toolExecutionRun: false,
  mediaProcessingRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  modelWeightsDownloaded: false
}, null, 2));
