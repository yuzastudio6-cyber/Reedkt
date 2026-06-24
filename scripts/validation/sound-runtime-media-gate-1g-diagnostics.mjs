#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'sound_runtime_media_gate_1g_actual_dockerfile_source_created_with_warnings_ready_for_dockerfile_source_owner_review';
const SOURCE_HEAD = '43d01f30a3564f961aaac50fed49f8d5ccbc925d';
const PR698_DECISION = 'sound_runtime_media_gate_1f_dockerfile_source_creation_plan_completed_with_warnings_ready_for_actual_dockerfile_source_gate';
const PR695_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_owner_review_passed_with_warnings_ready_for_gate_1f_source_creation_plan';
const PR691_DECISION = 'sound_runtime_media_gate_1e_dockerfile_static_plan_completed_with_warnings_ready_for_dockerfile_static_owner_review';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const NO_SCOPE = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const REQUIRED_DOC_BLOCKS = [
  ['docs/sound-runtime-media-gate-1g-actual-dockerfile-source-result.md', 'sound-runtime-media-gate-1g-actual-dockerfile-source-result'],
  ['docs/sound-runtime-media-gate-1g-dockerfile-source-content-register.md', 'sound-runtime-media-gate-1g-dockerfile-source-content-register'],
  ['docs/sound-runtime-media-gate-1g-no-build-validation-report.md', 'sound-runtime-media-gate-1g-no-build-validation-report'],
  ['docs/sound-runtime-media-gate-1g-excluded-runtime-register.md', 'sound-runtime-media-gate-1g-excluded-runtime-register'],
  ['docs/sound-runtime-media-gate-1g-runtime-claim-policy.md', 'sound-runtime-media-gate-1g-runtime-claim-policy'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-plan.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1h-dockerfile-static-validation.md', 'sound-runtime-media-gate-1h-dockerfile-static-validation']
];

const SOURCE_FILES = [
  'docs/sound-runtime-media-gate-1f-dockerfile-source-creation-plan.md',
  'docs/sound-runtime-media-gate-1f-dockerfile-source-path-register.md',
  'docs/sound-runtime-media-gate-1f-dockerfile-content-acceptance-checklist.md',
  'docs/sound-runtime-media-gate-1f-source-creation-blocker-register.md',
  'docs/sound-runtime-media-gate-1f-runtime-claim-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-dockerfile-static-acceptance-register.md',
  'docs/sound-runtime-media-gate-1e-proposed-dockerfile-spec.md',
  'docs/sound-runtime-media-gate-1e-package-install-layer-plan.md',
  'docs/sound-runtime-media-gate-1e-static-security-policy-plan.md',
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json'
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

function assertFalseLike(value, label) {
  assert(value === false || value === 'no' || value === 'none' || value === 'blocked' || value === 'blocked_unclaimed', `${label} must stay false/no/none/blocked`);
}

function assertClosedFlags(objects) {
  const guardedFalseKeys = new Set([
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
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
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
    'executionAllowedNow'
  ]);

  function walk(value, trail = []) {
    if (value === null || value === undefined || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, trail.concat(String(index))));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      const label = trail.concat(key).join('.');
      if (guardedFalseKeys.has(key)) assertFalseLike(child, label);
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
    /"(dockerBuildRun|dockerPushRun|dockerRunRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|sqlExecuted|artifactCreated|generatedLocalFixturePassedClaimed|dryRunPassedClaimed|dockerReadinessClaimed|imageReadinessClaimed|workerReadinessClaimed|routeReadinessClaimed|runtimeReadinessClaimed|mediaReadinessClaimed|gcpReadinessClaimed|cloudRunReadinessClaimed|supabaseReadinessClaimed|artifactReadinessClaimed|betaReadinessClaimed|productionReadinessClaimed)"\s*:\s*true/,
    /"(executionAllowedNow)"\s*:\s*true/
  ];

  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) {
      const match = text.match(pattern);
      assert(!match, `Unsafe marker ${match?.[0]} in ${file}`);
    }
  }
}

const blocks = REQUIRED_DOC_BLOCKS.map(([file, label]) => ({ file, label, block: parseBlock(file, label) }));
for (const file of SOURCE_FILES) read(file);

const dockerfile = read(DOCKERFILE_PATH);
assert(dockerfile.includes('SOUND-RUNTIME-MEDIA-GATE-1G source-only Dockerfile'), 'Dockerfile missing Gate 1G source-only comment');
assert(dockerfile.includes('No Docker build has been run'), 'Dockerfile missing no-build comment');
assert(dockerfile.includes('FROM python:3.13-slim'), 'Dockerfile base image mismatch');
assert(dockerfile.includes(`COPY ${REQUIREMENTS_PATH} ./requirements.sound-oss-tools.txt`), 'Dockerfile must copy only approved requirements source');
assert(dockerfile.includes('pip install --no-cache-dir --requirement ./requirements.sound-oss-tools.txt'), 'Dockerfile pip install layer mismatch');
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'Dockerfile missing sound runtime disabled env');
assert(dockerfile.includes('REEDITPRO_WORKER_EXECUTION_ENABLED=0'), 'Dockerfile missing worker execution disabled env');
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'Dockerfile missing media processing disabled env');
assert(dockerfile.includes('adduser --system'), 'Dockerfile missing non-root user creation');
assert(dockerfile.includes('USER reeditpro'), 'Dockerfile missing non-root USER');
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'Dockerfile missing fail-closed placeholder command');
assert(!/(?:apt-get|apt|apk|pip|COPY|ADD|curl|wget)[^\n]*(?:ffmpeg|ffprobe)/i.test(dockerfile), 'Dockerfile must not install, copy, or fetch FFmpeg or ffprobe');
assert(!/\b(model weight|safetensors|\.pt\b|\.onnx\b|huggingface)\b/i.test(dockerfile), 'Dockerfile must not include model weight references');
assert(!/\b(SUPABASE|SERVICE_ACCOUNT|GOOGLE_APPLICATION_CREDENTIALS|SECRET|PROVIDER|API_KEY|\.wav|\.mp3|\.mp4|\.mov)\b/.test(dockerfile), 'Dockerfile includes blocked credential/media/provider marker');

const result = blocks.find((entry) => entry.label === 'sound-runtime-media-gate-1g-actual-dockerfile-source-result').block;
assert(result.decision === DECISION, 'Gate 1G decision mismatch');
assert(result.sourceHead === SOURCE_HEAD, 'Gate 1G source head mismatch');
assert(result.sourceEvidence.some((entry) => entry.pr === 698 && entry.decision === PR698_DECISION), 'PR #698 decision missing');
assert(result.sourceEvidence.some((entry) => entry.pr === 695 && entry.decision === PR695_DECISION), 'PR #695 decision missing');
assert(result.sourceEvidence.some((entry) => entry.pr === 691 && entry.decision === PR691_DECISION), 'PR #691 decision missing');
assert(result.dockerfile.path === DOCKERFILE_PATH, 'Gate 1G Dockerfile path mismatch');
assert(result.dockerfile.created === true, 'Dockerfile created flag must be true');
assert(result.dockerfile.requirementsPath === REQUIREMENTS_PATH, 'requirements path mismatch');
assertSupabaseNoop(result.supabaseClassification, 'Gate 1G result');
assert(read('docs/sound-runtime-media-gate-1g-actual-dockerfile-source-result.md').includes(NO_SCOPE), 'result doc missing no-scope statement');

const contentRegister = blocks.find((entry) => entry.label === 'sound-runtime-media-gate-1g-dockerfile-source-content-register').block;
for (const item of ['base image', 'requirements copy', 'pip install', 'non-root user', 'runtime-disabled env vars', 'placeholder disabled command', 'no FFmpeg/ffprobe install', 'no model weights', 'no secrets', 'no service account', 'no media fixtures', 'no Supabase credentials', 'no provider credentials']) {
  assert(contentRegister.contentItems.some((entry) => entry.item === item && entry.present === true), `content register missing ${item}`);
}

const report = blocks.find((entry) => entry.label === 'sound-runtime-media-gate-1g-no-build-validation-report').block;
assert(report.staticChecks.fileExists === true, 'no-build report missing file existence check');
assert(report.staticChecks.packageLockUnchanged === true, 'no-build report package-lock should be unchanged');
assertSupabaseNoop(report.supabaseClassification, 'no-build report');

const excluded = blocks.find((entry) => entry.label === 'sound-runtime-media-gate-1g-excluded-runtime-register').block;
for (const scope of ['Docker build', 'Docker push', 'GCP/Cloud Run', 'Secret Manager', 'service accounts', 'worker execution', 'route/tool execution', 'media processing', 'FFmpeg/ffprobe', 'model weights', 'Supabase/SQL', 'artifacts/signed/public URLs', 'billing/credits', 'beta/production', 'generated_local_fixture_passed', 'dry_run_passed', 'runtime readiness']) {
  assert(excluded.excludedScopes.some((entry) => entry.scope === scope), `excluded register missing ${scope}`);
}

const claimPolicy = blocks.find((entry) => entry.label === 'sound-runtime-media-gate-1g-runtime-claim-policy').block;
assert(claimPolicy.claimFlags.actualDockerfileCreated === true, 'claim policy must acknowledge Dockerfile source creation');
for (const claim of ['Docker build', 'Docker push', 'image readiness', 'worker readiness', 'route readiness', 'runtime readiness', 'media readiness', 'GCP/Cloud Run readiness', 'Supabase readiness', 'artifact readiness', 'beta readiness', 'production readiness', 'generated_local_fixture_passed', 'dry_run_passed']) {
  assert(claimPolicy.notClaims.some((entry) => entry.claim === claim && entry.allowed === false), `claim policy missing ${claim}`);
}

const ownerPrompt = blocks.find((entry) => entry.label === 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review').block;
assert(ownerPrompt.requiredGate1GDecision === DECISION, 'source owner prompt must require Gate 1G decision');
assert(ownerPrompt.requiredDockerfileSourcePath === DOCKERFILE_PATH, 'source owner prompt path mismatch');

const buildProofPrompt = blocks.find((entry) => entry.label === 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan').block;
assert(buildProofPrompt.requiredActualDockerfileSourceDecision === DECISION, 'build proof prompt must require Gate 1G decision');
assert(buildProofPrompt.requiredDockerfileSourceOwnerReviewDecision === 'worker_runtime_jobs_sound_cpu_dockerfile_source_owner_review_passed_with_warnings_ready_for_docker_build_proof_plan', 'build proof prompt must require owner review');

const staticPrompt = blocks.find((entry) => entry.label === 'sound-runtime-media-gate-1h-dockerfile-static-validation').block;
assert(staticPrompt.requiredSourceDecision === DECISION, 'Gate 1H prompt source decision mismatch');
assert(staticPrompt.requiredDockerfileSourcePath === DOCKERFILE_PATH, 'Gate 1H prompt path mismatch');
assertSupabaseNoop(staticPrompt.supabaseClassification, 'Gate 1H prompt');

const packageJson = JSON.parse(read('package.json'));
assert(
  packageJson.scripts?.['sound-runtime-media-gate-1g:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-1g-diagnostics.mjs',
  'package script missing for Gate 1G diagnostics'
);

assertClosedFlags(blocks.map((entry) => entry.block));
scanUnsafe(REQUIRED_DOC_BLOCKS.map(([file]) => file).concat(SOURCE_FILES, [DOCKERFILE_PATH]));

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_1g_diagnostics_passed',
  decision: DECISION,
  dockerfilePath: DOCKERFILE_PATH,
  actualDockerfileCreated: true,
  dockerBuildRun: false,
  dockerPushRun: false,
  gcpTouched: false,
  workerExecutionRun: false,
  mediaProcessingRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  modelWeightsDownloaded: false
}, null, 2));
