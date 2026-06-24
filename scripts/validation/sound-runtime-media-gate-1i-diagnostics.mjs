#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'sound_runtime_media_gate_1i_docker_build_proof_readiness_plan_completed_with_warnings_ready_for_build_readiness_owner_review';
const SOURCE_HEAD = '045e67a51e7b1d333ec8116d9aec334aebf7bbeb';
const PR716_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_validation_owner_review_passed_with_warnings_ready_for_build_proof_readiness_plan';
const PR712_DECISION = 'sound_runtime_media_gate_1h_dockerfile_static_validation_passed_with_warnings_ready_for_static_validation_owner_review';
const PR707_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_source_owner_review_passed_with_warnings_ready_for_static_validation';
const PR703_DECISION = 'sound_runtime_media_gate_1g_actual_dockerfile_source_created_with_warnings_ready_for_dockerfile_source_owner_review';
const BUILD_READINESS_OWNER_DECISION = 'worker_runtime_jobs_sound_cpu_docker_build_readiness_owner_review_passed_with_warnings_ready_for_controlled_docker_build_proof';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const NO_SCOPE = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const GATE_1I_BLOCKS = [
  ['docs/sound-runtime-media-gate-1i-docker-build-proof-readiness-plan.md', 'sound-runtime-media-gate-1i-docker-build-proof-readiness-plan'],
  ['docs/sound-runtime-media-gate-1i-docker-build-preflight-checklist.md', 'sound-runtime-media-gate-1i-docker-build-preflight-checklist'],
  ['docs/sound-runtime-media-gate-1i-proposed-build-command-plan.md', 'sound-runtime-media-gate-1i-proposed-build-command-plan'],
  ['docs/sound-runtime-media-gate-1i-build-environment-requirements.md', 'sound-runtime-media-gate-1i-build-environment-requirements'],
  ['docs/sound-runtime-media-gate-1i-build-output-artifact-policy.md', 'sound-runtime-media-gate-1i-build-output-artifact-policy'],
  ['docs/sound-runtime-media-gate-1i-build-failure-classification-register.md', 'sound-runtime-media-gate-1i-build-failure-classification-register'],
  ['docs/sound-runtime-media-gate-1i-no-build-blocker-register.md', 'sound-runtime-media-gate-1i-no-build-blocker-register'],
  ['docs/sound-runtime-media-gate-1i-runtime-claim-policy.md', 'sound-runtime-media-gate-1i-runtime-claim-policy']
];

const PROMPT_BLOCKS = [
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-plan.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1j-controlled-docker-build-proof.md', 'sound-runtime-media-gate-1j-controlled-docker-build-proof']
];

const SOURCE_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'],
  ['docs/sound-runtime-media-gate-1h-dockerfile-static-validation-result.md', 'sound-runtime-media-gate-1h-dockerfile-static-validation-result'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'],
  ['docs/sound-runtime-media-gate-1g-actual-dockerfile-source-result.md', 'sound-runtime-media-gate-1g-actual-dockerfile-source-result']
];

const REQUIRED_FILES = [
  DOCKERFILE_PATH,
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'scripts/validation/sound-runtime-media-gate-1h-dockerfile-static-validator.mjs',
  'package.json'
];

const BLOCKED_SCOPES = [
  'Docker build',
  'Docker run',
  'Docker push',
  'GCP/Cloud Run',
  'worker execution',
  'route/tool execution',
  'media processing',
  'model weights',
  'Supabase/SQL',
  'artifacts',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime readiness',
  'beta/production'
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
    'supabaseReadinessClaimed',
    'artifactReadinessClaimed',
    'betaReadinessClaimed',
    'productionReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'acceptedForDockerBuildToday',
    'acceptedForDockerPushToday',
    'acceptedForRuntimeExecutionToday',
    'acceptedForExecutionToday',
    'pushAllowed',
    'runAllowed'
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
    /"(dockerBuildRun|dockerPushRun|dockerRunRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|sqlExecuted|artifactCreated|generatedLocalFixturePassedClaimed|dryRunPassedClaimed|dockerReadinessClaimed|imageReadinessClaimed|workerReadinessClaimed|runtimeReadinessClaimed|mediaReadinessClaimed)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i
  ];

  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) {
      const match = text.match(pattern);
      assert(!match, `Unsafe marker ${match?.[0]} in ${file}`);
    }
  }
}

for (const file of REQUIRED_FILES) read(file);
const parsed = Object.fromEntries([...GATE_1I_BLOCKS, ...PROMPT_BLOCKS, ...SOURCE_BLOCKS].map(([file, label]) => [label, parseBlock(file, label)]));

const plan = parsed['sound-runtime-media-gate-1i-docker-build-proof-readiness-plan'];
assert(plan.decision === DECISION, 'Gate 1I decision mismatch');
assert(plan.sourceBase.head === SOURCE_HEAD, 'Gate 1I source head mismatch');
assert(plan.sourceBase.pr716.decision === PR716_DECISION, 'PR #716 decision missing');
assert(plan.sourceBase.pr716.mergeCommit === SOURCE_HEAD, 'PR #716 merge commit mismatch');
assert(plan.sourceBase.pr712.decision === PR712_DECISION, 'PR #712 decision missing');
assert(plan.sourceBase.pr707.decision === PR707_DECISION, 'PR #707 decision missing');
assert(plan.sourceBase.pr703.decision === PR703_DECISION, 'PR #703 decision missing');
assert(plan.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch');
assert(plan.requirementsSource === REQUIREMENTS_PATH, 'requirements source mismatch');
assert(plan.readinessPlanScope.buildProofReadinessPlanCreated === true, 'readiness plan claim missing');
assertNoop(plan.supabaseClassification, 'Gate 1I plan');

const preflight = parsed['sound-runtime-media-gate-1i-docker-build-preflight-checklist'];
for (const item of ['Docker CLI version readback', 'Docker daemon availability readback', 'source branch and Dockerfile hash readback', 'requirements file hash readback', 'no GCP credentials or service accounts loaded']) {
  assert(preflight.requiredBeforeFutureBuildProof.some((row) => row.item === item && row.executionStatus === 'proposed_not_executed_in_gate_1i'), `preflight checklist missing ${item}`);
}
assertNoop(preflight.supabaseClassification, 'preflight checklist');

const commands = parsed['sound-runtime-media-gate-1i-proposed-build-command-plan'];
assert(commands.commandPolicy === 'proposed_not_executed_in_gate_1i', 'command policy mismatch');
assert(commands.proposedCommands.length === 2, 'expected two proposed image-tag commands');
for (const command of commands.proposedCommands) {
  assert(command.command.includes('docker build --file server/workers/sound-cpu/Dockerfile'), 'proposed command must target approved Dockerfile path');
  assert(command.executionStatus === 'proposed_not_executed_in_gate_1i', 'proposed command must not be executed');
  assert(command.pushAllowed === false, 'push must stay blocked');
  assert(command.runAllowed === false, 'run must stay blocked');
}
assertNoop(commands.supabaseClassification, 'command plan');

const environment = parsed['sound-runtime-media-gate-1i-build-environment-requirements'];
for (const requirement of ['local Docker CLI available', 'local Docker daemon available', 'no Docker login or registry credentials required', 'no GCP project, Cloud Run service, or Artifact Registry target required']) {
  assert(environment.futureRequirements.some((row) => row.requirement === requirement), `environment requirements missing ${requirement}`);
}

const artifactPolicy = parsed['sound-runtime-media-gate-1i-build-output-artifact-policy'];
assert(artifactPolicy.artifactPolicy === 'no_artifacts_created', 'artifact policy must remain no_artifacts_created');
assert(artifactPolicy.futureLocalBuildProofPolicy.registryPushAllowed === false, 'registry push must stay blocked');
assert(artifactPolicy.futureLocalBuildProofPolicy.signedUrlAllowed === false, 'signed URL must stay blocked');
assertNoop(artifactPolicy.supabaseClassification, 'artifact policy');

const failures = parsed['sound-runtime-media-gate-1i-build-failure-classification-register'];
for (const category of ['docker_unavailable', 'source_conflict', 'base_image_pull_failed', 'pip_install_failed', 'forbidden_instruction_detected', 'artifact_policy_violation', 'runtime_readiness_widening', 'unknown_build_failure']) {
  assert(failures.futureFailureCategories.some((row) => row.category === category), `failure register missing ${category}`);
}

const blockers = parsed['sound-runtime-media-gate-1i-no-build-blocker-register'];
for (const scope of BLOCKED_SCOPES) {
  assert(blockers.blockers.some((row) => row.scope === scope && (row.status === 'blocked' || row.status === 'blocked_unclaimed')), `blocker register missing ${scope}`);
}
assertNoop(blockers.supabaseClassification, 'blocker register');

const claimPolicy = parsed['sound-runtime-media-gate-1i-runtime-claim-policy'];
for (const claim of ['Docker build', 'Docker push', 'Docker run', 'image readiness', 'worker readiness', 'runtime readiness', 'media readiness', 'GCP/Cloud Run readiness', 'Supabase readiness', 'artifact readiness', 'beta readiness', 'production readiness', 'generated_local_fixture_passed', 'dry_run_passed']) {
  assert(claimPolicy.notClaims.some((row) => row.claim === claim && row.allowed === false), `claim policy missing ${claim}`);
}
assertNoop(claimPolicy.supabaseClassification, 'claim policy');

const ownerReview = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'];
assert(ownerReview.decision === PR716_DECISION, 'PR #716 source decision mismatch');
assert(ownerReview.acceptedForBuildReadinessPlanning === true, 'PR #716 build readiness planning acceptance missing');

const gate1h = parsed['sound-runtime-media-gate-1h-dockerfile-static-validation-result'];
assert(gate1h.decision === PR712_DECISION, 'PR #712 source decision mismatch');
assert(gate1h.staticValidator.status === 'passed', 'Gate 1H static validator status missing');

const sourceOwner = parsed['worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'];
assert(sourceOwner.decision === PR707_DECISION, 'PR #707 source decision mismatch');

const gate1g = parsed['sound-runtime-media-gate-1g-actual-dockerfile-source-result'];
assert(gate1g.decision === PR703_DECISION, 'PR #703 source decision mismatch');
assert(gate1g.dockerfile?.path === DOCKERFILE_PATH, 'Gate 1G Dockerfile path mismatch');

const readinessOwnerPrompt = parsed['worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'];
assert(readinessOwnerPrompt.requiredGate1IDecision === DECISION, 'readiness owner prompt must require Gate 1I decision');
assert(readinessOwnerPrompt.requiredStaticValidationOwnerReviewDecision === PR716_DECISION, 'readiness owner prompt must preserve PR #716 requirement');
assert(readinessOwnerPrompt.dockerBuildRun === false, 'readiness owner prompt must not run Docker build');
assertNoop(readinessOwnerPrompt.supabaseClassification, 'readiness owner prompt');

const buildProofPrompt = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-plan'];
assert(buildProofPrompt.requiredBuildReadinessPlanMilestone === 'SOUND-RUNTIME-MEDIA-GATE-1I', 'build proof prompt must require Gate 1I milestone');
assert(buildProofPrompt.requiredBuildReadinessPlanDecision === DECISION, 'build proof prompt must require Gate 1I decision');
assert(buildProofPrompt.requiredBuildReadinessOwnerReviewDecision === BUILD_READINESS_OWNER_DECISION, 'build proof prompt must require owner review before build proof');

const gate1jPrompt = parsed['sound-runtime-media-gate-1j-controlled-docker-build-proof'];
assert(gate1jPrompt.requiredGate1IDecision === DECISION, 'Gate 1J prompt must require Gate 1I decision');
assert(gate1jPrompt.requiredBuildReadinessOwnerReviewDecision === BUILD_READINESS_OWNER_DECISION, 'Gate 1J prompt must require build-readiness owner review');
assert(gate1jPrompt.allowedFutureBuildScopeAfterOwnerReview.dockerPushAllowed === false, 'Gate 1J prompt must keep push blocked');
assertNoop(gate1jPrompt.supabaseClassification, 'Gate 1J prompt');

const dockerfile = read(DOCKERFILE_PATH);
assert(dockerfile.includes('FROM python:3.13-slim'), 'Dockerfile base image missing');
assert(dockerfile.includes(`COPY ${REQUIREMENTS_PATH} ./requirements.sound-oss-tools.txt`), 'Dockerfile requirements copy mismatch');
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'Dockerfile runtime disabled flag missing');
assert(dockerfile.includes('REEDITPRO_WORKER_EXECUTION_ENABLED=0'), 'Dockerfile worker disabled flag missing');
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'Dockerfile media disabled flag missing');
assert(dockerfile.includes('USER reeditpro'), 'Dockerfile non-root user missing');
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'Dockerfile fail-closed command missing');

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['sound-runtime-media-gate-1i:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-1i-diagnostics.mjs', 'missing Gate 1I package script');
assert(read('docs/sound-runtime-media-gate-1i-docker-build-proof-readiness-plan.md').includes(NO_SCOPE), 'missing no-scope statement');

for (const object of Object.values(parsed)) walkClosed(object);
scanUnsafe([...GATE_1I_BLOCKS.map(([file]) => file), ...PROMPT_BLOCKS.map(([file]) => file)]);

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_1i_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  pr716Verified: true,
  dockerfilePath: DOCKERFILE_PATH,
  dockerBuildRun: false,
  dockerPushRun: false,
  dockerRunRun: false,
  gcpTouched: false,
  workerExecutionRun: false,
  mediaProcessingRun: false,
  supabaseTouched: false,
  sqlExecuted: false,
  artifactCreated: false,
  nextPrompt: 'WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKER-BUILD-READINESS-OWNER-REVIEW'
}, null, 2));
