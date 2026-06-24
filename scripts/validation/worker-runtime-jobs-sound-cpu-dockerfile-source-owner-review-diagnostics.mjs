#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_source_owner_review_passed_with_warnings_ready_for_static_validation';
const SOURCE_HEAD = '90167c90a149173980e738152183f5b2e0bf5f74';
const PR703_DECISION = 'sound_runtime_media_gate_1g_actual_dockerfile_source_created_with_warnings_ready_for_dockerfile_source_owner_review';
const PR698_DECISION = 'sound_runtime_media_gate_1f_dockerfile_source_creation_plan_completed_with_warnings_ready_for_actual_dockerfile_source_gate';
const PR695_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_owner_review_passed_with_warnings_ready_for_gate_1f_source_creation_plan';
const PR691_DECISION = 'sound_runtime_media_gate_1e_dockerfile_static_plan_completed_with_warnings_ready_for_dockerfile_static_owner_review';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const NO_SCOPE = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const DOC_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-source-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-source-safety-register.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-safety-register'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-validation-readiness-register.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-validation-readiness-register'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-source-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-source-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-claim-policy']
];

const PROMPT_BLOCKS = [
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1h-dockerfile-static-validation.md', 'sound-runtime-media-gate-1h-dockerfile-static-validation'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-plan.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan']
];

const SOURCE_BLOCKS = [
  ['docs/sound-runtime-media-gate-1g-actual-dockerfile-source-result.md', 'sound-runtime-media-gate-1g-actual-dockerfile-source-result'],
  ['docs/sound-runtime-media-gate-1g-dockerfile-source-content-register.md', 'sound-runtime-media-gate-1g-dockerfile-source-content-register'],
  ['docs/sound-runtime-media-gate-1g-no-build-validation-report.md', 'sound-runtime-media-gate-1g-no-build-validation-report'],
  ['docs/sound-runtime-media-gate-1g-excluded-runtime-register.md', 'sound-runtime-media-gate-1g-excluded-runtime-register'],
  ['docs/sound-runtime-media-gate-1g-runtime-claim-policy.md', 'sound-runtime-media-gate-1g-runtime-claim-policy'],
  ['docs/sound-runtime-media-gate-1f-dockerfile-source-creation-plan.md', 'sound-runtime-media-gate-1f-dockerfile-source-creation-plan'],
  ['docs/sound-runtime-media-gate-1e-proposed-dockerfile-spec.md', 'sound-runtime-media-gate-1e-proposed-dockerfile-spec'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review']
];

const REQUIRED_FILES = [
  DOCKERFILE_PATH,
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json',
  'scripts/validation/sound-runtime-media-gate-1g-diagnostics.mjs',
  'scripts/validation/sound-runtime-media-gate-1f-diagnostics.mjs',
  'scripts/validation/sound-runtime-media-gate-1e-diagnostics.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review-diagnostics.mjs'
];

const REQUIRED_ACCEPTANCE_ITEMS = [
  'Dockerfile path',
  'base image',
  'requirements copy',
  'pip install',
  'non-root user',
  'runtime-disabled env vars',
  'placeholder disabled command',
  'no FFmpeg/ffprobe',
  'no model weights',
  'no secrets',
  'no service account',
  'no media fixtures',
  'no Supabase credentials',
  'no provider credentials',
  'no Docker build',
  'no Docker push',
  'no GCP',
  'no runtime execution'
];

const REQUIRED_BLOCKERS = [
  'Docker build',
  'Docker push',
  'GCP/Cloud Run',
  'Secret Manager',
  'service account',
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

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`);
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`);
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`);
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`);
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`);
}

function assertClosed(value, label) {
  assert(value === false || value === 'no' || value === 'none' || value === 'blocked' || value === 'blocked_unclaimed', `${label} must stay closed`);
}

function assertRuntimeFlagsStayClosed(objects) {
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
    'acceptedForBuildToday',
    'acceptedForDockerPushToday',
    'acceptedForRuntimeExecutionToday',
    'acceptedForExecutionToday',
    'acceptedForActualDockerfileToday',
    'buildToday',
    'executionToday',
    'executionAllowedNow',
    'allowed'
  ]);

  function walk(value, trail = []) {
    if (value === null || value === undefined || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((child, index) => walk(child, trail.concat(String(index))));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (guarded.has(key)) assertClosed(child, trail.concat(key).join('.'));
      walk(child, trail.concat(key));
    }
  }

  objects.forEach((object) => walk(object));
}

function scanUnsafe(files) {
  const patterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    /\b(?:postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}\b/i,
    /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(dockerBuildRun|dockerPushRun|dockerRunRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|sqlExecuted|artifactCreated|dockerReadinessClaimed|imageReadinessClaimed|workerReadinessClaimed|routeReadinessClaimed|runtimeReadinessClaimed|mediaReadinessClaimed|supabaseReadinessClaimed|artifactReadinessClaimed|betaReadinessClaimed|productionReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
    /"(acceptedForDockerBuildToday|acceptedForBuildToday|acceptedForDockerPushToday|acceptedForRuntimeExecutionToday|buildToday|executionToday|executionAllowedNow)"\s*:\s*true/,
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
const dockerfile = read(DOCKERFILE_PATH);

assert(dockerfile.includes('SOUND-RUNTIME-MEDIA-GATE-1G source-only Dockerfile'), 'Dockerfile missing Gate 1G source-only comment');
assert(dockerfile.includes('FROM python:3.13-slim'), 'Dockerfile base image mismatch');
assert(dockerfile.includes(`COPY ${REQUIREMENTS_PATH} ./requirements.sound-oss-tools.txt`), 'Dockerfile requirements copy mismatch');
assert(dockerfile.includes('pip install --no-cache-dir --requirement ./requirements.sound-oss-tools.txt'), 'Dockerfile pip install mismatch');
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'Dockerfile missing runtime disabled env');
assert(dockerfile.includes('REEDITPRO_WORKER_EXECUTION_ENABLED=0'), 'Dockerfile missing worker disabled env');
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'Dockerfile missing media disabled env');
assert(dockerfile.includes('adduser --system'), 'Dockerfile missing non-root user creation');
assert(dockerfile.includes('USER reeditpro'), 'Dockerfile missing non-root USER');
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'Dockerfile missing fail-closed command');
assert(!/(?:apt-get|apt|apk|pip|COPY|ADD|curl|wget)[^\n]*(?:ffmpeg|ffprobe)/i.test(dockerfile), 'Dockerfile must not install, copy, or fetch FFmpeg or ffprobe');
assert(!/\b(safetensors|\.pt\b|\.onnx\b|huggingface)\b/i.test(dockerfile), 'Dockerfile must not include model weights');
assert(!/\b(SUPABASE|SERVICE_ACCOUNT|GOOGLE_APPLICATION_CREDENTIALS|SECRET|PROVIDER|API_KEY|\.wav|\.mp3|\.mp4|\.mov)\b/.test(dockerfile), 'Dockerfile includes blocked credential/media/provider marker');

const source = parsed['sound-runtime-media-gate-1g-actual-dockerfile-source-result'];
assert(source.decision === PR703_DECISION, 'PR #703 source decision mismatch');
assert(source.dockerfile?.path === DOCKERFILE_PATH, 'PR #703 Dockerfile path mismatch');
assert(source.dockerfile?.created === true, 'PR #703 must record Dockerfile source created');
assert(source.closedGates?.dockerBuildRun === false, 'PR #703 Docker build widened');
assert(source.closedGates?.workerExecutionRun === false, 'PR #703 worker execution widened');

const owner = parsed['worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'];
assert(owner.decision === DECISION, 'owner review decision mismatch');
assert(owner.sourceBase?.head === SOURCE_HEAD, 'owner source head mismatch');
assert(owner.sourceBase?.pr703?.mergeCommit === SOURCE_HEAD, 'PR #703 merge commit mismatch');
assert(owner.sourceBase?.pr703?.decision === PR703_DECISION, 'PR #703 decision missing');
assert(owner.sourceBase?.pr698?.decision === PR698_DECISION, 'PR #698 decision missing');
assert(owner.sourceBase?.pr695?.decision === PR695_DECISION, 'PR #695 decision missing');
assert(owner.sourceBase?.pr691?.decision === PR691_DECISION, 'PR #691 decision missing');
assert(owner.targetOwner === 'WORKER_RUNTIME_JOBS', 'owner boundary mismatch');
assert(owner.dockerfilePathReviewed === DOCKERFILE_PATH, 'reviewed Dockerfile path mismatch');
assert(owner.acceptedForStaticValidation === true, 'source should be accepted for static validation');
assert(owner.acceptedForExecutionToday === 'none', 'execution must remain none');
assert(owner.requiredNoScopeStatement === NO_SCOPE, 'owner no-scope mismatch');
assertSupabaseNoop(owner.supabaseClassification, 'owner review');

const acceptance = parsed['worker-runtime-jobs-sound-cpu-dockerfile-source-acceptance-register'];
assert(acceptance.decision === DECISION, 'acceptance decision mismatch');
assert(acceptance.sourceDecision === PR703_DECISION, 'acceptance source decision mismatch');
assert(acceptance.dockerfilePath === DOCKERFILE_PATH, 'acceptance Dockerfile path mismatch');
for (const item of REQUIRED_ACCEPTANCE_ITEMS) {
  const row = acceptance.acceptanceRows?.find((entry) => entry.item === item);
  assert(row, `acceptance missing ${item}`);
  assert(row.present === true, `${item} must be present`);
  assert(row.acceptedForSource === true, `${item} must be accepted for source`);
  assert(row.acceptedForStaticValidation === true, `${item} must be accepted for static validation`);
  assert(row.acceptedForBuildToday === false, `${item} build widened`);
  assert(row.acceptedForExecutionToday === false, `${item} execution widened`);
}
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance register');

const safety = parsed['worker-runtime-jobs-sound-cpu-dockerfile-source-safety-register'];
for (const item of ['source-only status', 'fail-closed command', 'runtime-disabled defaults', 'no secrets', 'no service accounts', 'no model weights', 'no media fixtures', 'no FFmpeg/ffprobe', 'no Supabase credentials', 'no provider credentials', 'no signed URLs', 'no public artifact paths', 'no Docker build', 'no GCP', 'no worker execution', 'no media processing']) {
  assert(safety.safetyRows?.some((entry) => entry.item === item && entry.verified === true), `safety missing ${item}`);
}

const readiness = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-validation-readiness-register'];
assert(readiness.decision === DECISION, 'readiness decision mismatch');
assert(readiness.staticValidationNextGate === 'SOUND-RUNTIME-MEDIA-GATE-1H', 'readiness next gate mismatch');
assert(readiness.acceptedForStaticValidation === true, 'readiness must accept static validation');
assertSupabaseNoop(readiness.supabaseClassification, 'readiness register');

const blockers = parsed['worker-runtime-jobs-sound-cpu-dockerfile-source-blocker-follow-up-register'];
for (const scope of REQUIRED_BLOCKERS) {
  assert(blockers.blockerRows?.some((entry) => entry.scope === scope && String(entry.status).startsWith('blocked')), `blocker missing ${scope}`);
}
assertSupabaseNoop(blockers.supabaseClassification, 'blocker register');

const claims = parsed['worker-runtime-jobs-sound-cpu-dockerfile-source-owner-claim-policy'];
for (const claim of ['Dockerfile source owner review is Docker build', 'Dockerfile source owner review is Docker push', 'Dockerfile source owner review is image readiness', 'Dockerfile source owner review is worker readiness', 'Dockerfile source owner review is route readiness', 'Dockerfile source owner review is runtime readiness', 'Dockerfile source owner review is media readiness', 'Dockerfile source owner review is GCP/Cloud Run readiness', 'Dockerfile source owner review is Supabase readiness', 'Dockerfile source owner review is artifact readiness', 'Dockerfile source owner review is beta readiness', 'Dockerfile source owner review is production readiness', 'Dockerfile source owner review is generated_local_fixture_passed', 'Dockerfile source owner review is dry_run_passed']) {
  assert(claims.notClaims?.some((entry) => entry.claim === claim && entry.allowed === false), `claim policy missing ${claim}`);
}
assertSupabaseNoop(claims.supabaseClassification, 'claim policy');

const gate1h = parsed['sound-runtime-media-gate-1h-dockerfile-static-validation'];
assert(gate1h.requiredSourceDecision === PR703_DECISION, 'Gate 1H source decision mismatch');
assert(gate1h.requiredSourceOwnerReviewDecision === DECISION, 'Gate 1H owner review decision mismatch');
assert(gate1h.requiredDockerfileSourcePath === DOCKERFILE_PATH, 'Gate 1H Dockerfile path mismatch');
assertSupabaseNoop(gate1h.supabaseClassification, 'Gate 1H prompt');

const validationOwner = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'];
assert(validationOwner.requiredSourceOwnerReviewDecision === DECISION, 'static validation owner prompt source mismatch');
assert(validationOwner.requiredDockerfileSourcePath === DOCKERFILE_PATH, 'static validation owner prompt path mismatch');
assertSupabaseNoop(validationOwner.supabaseClassification, 'static validation owner prompt');

const buildProof = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-plan'];
assert(buildProof.requiredDockerfileSourceOwnerReviewDecision === DECISION, 'build proof source owner review mismatch');
assert(buildProof.requiredStaticValidationMilestone === 'SOUND-RUNTIME-MEDIA-GATE-1H', 'build proof must require Gate 1H');
assert(buildProof.requiredStaticValidationOwnerReviewMilestone === 'WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-VALIDATION-OWNER-REVIEW', 'build proof must require static validation owner review');
assertSupabaseNoop(buildProof.supabaseClassification, 'build proof prompt');

const packageJson = JSON.parse(read('package.json'));
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-dockerfile-source-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review-diagnostics.mjs',
  'package script missing for source owner review diagnostics'
);

assert(read('docs/cross-chat-tool-ownership-registry.md').includes('WORKER_RUNTIME_JOBS'), 'ownership registry missing WORKER_RUNTIME_JOBS');
assertRuntimeFlagsStayClosed(Object.values(parsed));
scanUnsafe([...DOC_BLOCKS, ...PROMPT_BLOCKS].map(([file]) => file).concat([DOCKERFILE_PATH]));

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dockerfile_source_owner_review_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  pr703Decision: PR703_DECISION,
  dockerfilePath: DOCKERFILE_PATH,
  acceptedForStaticValidation: true,
  acceptedForDockerBuildToday: false,
  acceptedForExecutionToday: 'none',
  dockerBuildRun: false,
  dockerPushRun: false,
  gcpTouched: false,
  workerExecutionRun: false,
  mediaProcessingRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  modelWeightsDownloaded: false
}, null, 2));
