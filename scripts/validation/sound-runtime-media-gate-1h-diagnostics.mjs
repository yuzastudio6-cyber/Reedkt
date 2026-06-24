#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'sound_runtime_media_gate_1h_dockerfile_static_validation_passed_with_warnings_ready_for_static_validation_owner_review';
const SOURCE_HEAD = 'b89832587985791b5c5d02fe81266e4d726d5e93';
const PR707_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_source_owner_review_passed_with_warnings_ready_for_static_validation';
const PR703_DECISION = 'sound_runtime_media_gate_1g_actual_dockerfile_source_created_with_warnings_ready_for_dockerfile_source_owner_review';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_SOURCE = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const NO_SCOPE = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const BLOCKS = [
  ['docs/sound-runtime-media-gate-1h-dockerfile-static-validation-result.md', 'sound-runtime-media-gate-1h-dockerfile-static-validation-result'],
  ['docs/sound-runtime-media-gate-1h-dockerfile-instruction-validation-register.md', 'sound-runtime-media-gate-1h-dockerfile-instruction-validation-register'],
  ['docs/sound-runtime-media-gate-1h-prohibited-instruction-scan-register.md', 'sound-runtime-media-gate-1h-prohibited-instruction-scan-register'],
  ['docs/sound-runtime-media-gate-1h-static-validation-blocker-follow-up-register.md', 'sound-runtime-media-gate-1h-static-validation-blocker-follow-up-register'],
  ['docs/sound-runtime-media-gate-1h-runtime-claim-policy.md', 'sound-runtime-media-gate-1h-runtime-claim-policy'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-plan.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1i-docker-build-proof-readiness-plan.md', 'sound-runtime-media-gate-1i-docker-build-proof-readiness-plan']
];

const REQUIRED_FILES = [
  'scripts/validation/sound-runtime-media-gate-1h-dockerfile-static-validator.mjs',
  DOCKERFILE_PATH,
  REQUIREMENTS_SOURCE,
  'docs/worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review.md',
  'docs/sound-runtime-media-gate-1g-actual-dockerfile-source-result.md',
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
  const match = text.match(new RegExp('```json\\s+' + escapeRegExp(label) + '\\n([\\s\\S]*?)\\n```'));
  assert(match, `Missing JSON block ${label} in ${file}`);
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Invalid JSON block ${label} in ${file}: ${error.message}`);
  }
}

function assertNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} updateRequired widened`);
  assert(value?.environmentTouched === 'no', `${label} environmentTouched widened`);
  assert(value?.sqlExecuted === 'no', `${label} sqlExecuted widened`);
  assert(value?.migrationDeployed === 'no', `${label} migrationDeployed widened`);
  assert(value?.nextAction === 'none', `${label} nextAction widened`);
}

function assertClosed(value, label) {
  assert(value === false || value === 'no' || value === 'none' || value === 'blocked' || value === 'blocked_unclaimed', `${label} must stay closed`);
}

function walkClosed(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkClosed(item, trail.concat(String(index))));
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
    'gcpReadinessClaimed',
    'cloudRunReadinessClaimed',
    'supabaseReadinessClaimed',
    'artifactReadinessClaimed',
    'betaReadinessClaimed',
    'productionReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'acceptedForDockerBuildToday',
    'acceptedForDockerPushToday',
    'acceptedForExecutionToday',
    'executionAllowedNow'
  ]);
  for (const [key, child] of Object.entries(value)) {
    if (guarded.has(key)) assertClosed(child, trail.concat(key).join('.'));
    walkClosed(child, trail.concat(key));
  }
}

function scanUnsafe(files) {
  const patterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    /\b(?:postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i,
    /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(dockerBuildRun|dockerPushRun|dockerRunRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|sqlExecuted|artifactCreated|dockerReadinessClaimed|imageReadinessClaimed|workerReadinessClaimed|routeReadinessClaimed|runtimeReadinessClaimed|mediaReadinessClaimed|gcpReadinessClaimed|cloudRunReadinessClaimed|supabaseReadinessClaimed|artifactReadinessClaimed|betaReadinessClaimed|productionReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
    /"(acceptedForDockerBuildToday|acceptedForDockerPushToday|acceptedForExecutionToday|executionAllowedNow)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i
  ];
  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`);
  }
}

for (const file of REQUIRED_FILES) read(file);
const parsed = Object.fromEntries(BLOCKS.map(([file, label]) => [label, parseBlock(file, label)]));

const result = parsed['sound-runtime-media-gate-1h-dockerfile-static-validation-result'];
assert(result.decision === DECISION, 'Gate 1H result decision mismatch');
assert(result.sourceHead === SOURCE_HEAD, 'Gate 1H source head mismatch');
assert(result.sourceEvidence.pr707.decision === PR707_DECISION, 'PR #707 decision missing');
assert(result.sourceEvidence.pr703.decision === PR703_DECISION, 'PR #703 decision missing');
assert(result.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch');
assert(result.staticValidator.status === 'passed', 'static validator result not represented as passed');
assert(result.checks.baseImage.passed === true, 'base image check missing');
assert(result.checks.requirementsCopy.passed === true, 'requirements copy check missing');
assert(result.checks.pipInstall.passed === true, 'pip install check missing');
assert(result.checks.runtimeDisabledEnv.passed === true, 'runtime disabled env check missing');
assert(result.checks.nonRootUser.passed === true, 'non-root user check missing');
assert(result.checks.failClosedCommand.passed === true, 'fail-closed command check missing');
assert(result.prohibitedInstructionScan.passed === true, 'prohibited scan not represented as passed');
assertNoop(result.supabaseClassification, 'Gate 1H result Supabase classification');

const instruction = parsed['sound-runtime-media-gate-1h-dockerfile-instruction-validation-register'];
for (const item of ['FROM/base image', 'WORKDIR', 'COPY requirements', 'RUN pip install', 'ENV runtime-disabled flags', 'USER non-root', 'CMD fail-closed placeholder', 'no FFmpeg/ffprobe', 'no model weights', 'no secrets', 'no media fixtures', 'no Supabase credentials', 'no provider credentials']) {
  assert(instruction.instructions.some((row) => row.instruction === item && row.found === true && row.accepted === true), `instruction register missing ${item}`);
}

const prohibited = parsed['sound-runtime-media-gate-1h-prohibited-instruction-scan-register'];
for (const marker of ['apt install ffmpeg', 'ffprobe', 'curl/wget model weights', 'gcloud', 'docker', 'secret manager', 'service account', 'supabase credential', 'provider credential', 'media fixture', 'artifact write path', 'public URL/signed URL', 'runtime enabled true flags', 'production/beta readiness claims']) {
  assert(prohibited.scans.some((row) => row.marker === marker && row.found === false), `prohibited scan missing ${marker}`);
}

const blockers = parsed['sound-runtime-media-gate-1h-static-validation-blocker-follow-up-register'];
for (const scope of ['Docker build', 'Docker push', 'GCP/Cloud Run', 'Secret Manager', 'service accounts', 'worker execution', 'route/tool execution', 'media processing', 'FFmpeg/ffprobe', 'Supabase/SQL', 'artifacts', 'model weights', 'beta/production', 'generated_local_fixture_passed', 'dry_run_passed', 'runtime readiness', 'static owner review']) {
  assert(blockers.blockers.some((row) => row.scope === scope), `blocker register missing ${scope}`);
}

const policy = parsed['sound-runtime-media-gate-1h-runtime-claim-policy'];
for (const claim of ['Docker build', 'Docker push', 'image readiness', 'worker readiness', 'route readiness', 'runtime readiness', 'media readiness', 'GCP/Cloud Run readiness', 'Supabase readiness', 'artifact readiness', 'beta readiness', 'production readiness', 'generated_local_fixture_passed', 'dry_run_passed']) {
  assert(policy.notClaims.some((row) => row.claim === claim && row.allowed === false), `runtime claim policy missing ${claim}`);
}

const ownerPrompt = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'];
assert(ownerPrompt.requiredStaticValidationDecision === DECISION, 'owner-review prompt must require Gate 1H decision');
assert(ownerPrompt.requiredDockerfileSourcePath === DOCKERFILE_PATH, 'owner-review prompt path mismatch');

const buildProofPrompt = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-plan'];
assert(buildProofPrompt.requiredStaticValidationDecision === DECISION, 'build-proof prompt must require Gate 1H decision');
assert(buildProofPrompt.requiredStaticValidationOwnerReviewDecision === 'worker_runtime_jobs_sound_cpu_dockerfile_static_validation_owner_review_passed_with_warnings_ready_for_docker_build_proof_plan', 'build-proof prompt owner review decision mismatch');

const gate1iPrompt = parsed['sound-runtime-media-gate-1i-docker-build-proof-readiness-plan'];
assert(gate1iPrompt.requiredStaticValidationDecision === DECISION, 'Gate 1I prompt must require Gate 1H decision');
assert(gate1iPrompt.dockerBuildRun === false, 'Gate 1I must not run Docker build');
assertNoop(gate1iPrompt.supabaseClassification, 'Gate 1I Supabase classification');

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['sound-runtime-media-gate-1h:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-1h-diagnostics.mjs', 'missing package script');
assert(read('docs/sound-runtime-media-gate-1h-dockerfile-static-validation-result.md').includes(NO_SCOPE), 'missing no-scope statement');

for (const block of Object.values(parsed)) walkClosed(block);
scanUnsafe([...BLOCKS.map(([file]) => file), ...REQUIRED_FILES]);

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_1h_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  dockerfilePath: DOCKERFILE_PATH,
  staticValidatorPassed: true,
  dockerBuildRun: false,
  dockerPushRun: false,
  gcpTouched: false,
  workerExecutionRun: false,
  mediaProcessingRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  modelWeightsDownloaded: false
}, null, 2));
