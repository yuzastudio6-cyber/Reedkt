#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_docker_build_readiness_owner_review_passed_with_warnings_ready_for_controlled_docker_build_proof';
const SOURCE_HEAD = 'a8ed3c09f003b687425ee9b33945dc212ab875b5';
const PR720_DECISION = 'sound_runtime_media_gate_1i_docker_build_proof_readiness_plan_completed_with_warnings_ready_for_build_readiness_owner_review';
const PR716_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_validation_owner_review_passed_with_warnings_ready_for_build_proof_readiness_plan';
const PR712_DECISION = 'sound_runtime_media_gate_1h_dockerfile_static_validation_passed_with_warnings_ready_for_static_validation_owner_review';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const NO_SCOPE = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const WORKERS = [
  'sound-cpu-analysis-worker',
  'sound-audio-metadata-worker'
];

const IMAGES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker'
];

const JOB_TYPES = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis'
];

const DOC_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-readiness-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-docker-build-readiness-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-preflight-owner-register.md', 'worker-runtime-jobs-sound-cpu-docker-build-preflight-owner-register'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-artifact-cache-policy-owner-register.md', 'worker-runtime-jobs-sound-cpu-docker-build-artifact-cache-policy-owner-register'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-readiness-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-docker-build-readiness-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-claim-policy']
];

const PROMPT_BLOCKS = [
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1j-controlled-docker-build-proof.md', 'sound-runtime-media-gate-1j-controlled-docker-build-proof'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-plan.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review']
];

const SOURCE_BLOCKS = [
  ['docs/sound-runtime-media-gate-1i-docker-build-proof-readiness-plan.md', 'sound-runtime-media-gate-1i-docker-build-proof-readiness-plan'],
  ['docs/sound-runtime-media-gate-1i-docker-build-preflight-checklist.md', 'sound-runtime-media-gate-1i-docker-build-preflight-checklist'],
  ['docs/sound-runtime-media-gate-1i-proposed-build-command-plan.md', 'sound-runtime-media-gate-1i-proposed-build-command-plan'],
  ['docs/sound-runtime-media-gate-1i-build-output-artifact-policy.md', 'sound-runtime-media-gate-1i-build-output-artifact-policy'],
  ['docs/sound-runtime-media-gate-1i-no-build-blocker-register.md', 'sound-runtime-media-gate-1i-no-build-blocker-register'],
  ['docs/sound-runtime-media-gate-1i-runtime-claim-policy.md', 'sound-runtime-media-gate-1i-runtime-claim-policy'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'],
  ['docs/sound-runtime-media-gate-1h-dockerfile-static-validation-result.md', 'sound-runtime-media-gate-1h-dockerfile-static-validation-result']
];

const REQUIRED_FILES = [
  DOCKERFILE_PATH,
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json',
  'scripts/validation/sound-runtime-media-gate-1i-diagnostics.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review-diagnostics.mjs'
];

const ACCEPTANCE_ITEMS = [
  'Gate 1I readiness plan',
  'Gate 1I preflight checklist',
  'Gate 1I proposed local build commands',
  'Gate 1I build environment requirements',
  'Gate 1I build output artifact policy',
  'Gate 1I build failure classification',
  'Gate 1I no-build blocker register',
  'Gate 1I runtime claim policy',
  'Dockerfile path server/workers/sound-cpu/Dockerfile',
  'SOUND CPU requirements source',
  'workers sound-cpu-analysis-worker and sound-audio-metadata-worker',
  'images reeditpro/sound-cpu-analysis-worker and reeditpro/sound-audio-metadata-worker',
  'future local-only Docker build proof gate',
  'no registry push policy',
  'no Docker run policy',
  'no GCP or Cloud Run policy',
  'no worker, route, tool, media, Supabase, SQL, model, artifact, beta, or production execution policy'
];

const BLOCKED_SCOPES = [
  'Docker build in this owner review',
  'Docker run',
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
  'billing or Stripe',
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

function includeAll(values, required, label) {
  assert(Array.isArray(values), `${label} must be an array`);
  for (const item of required) assert(values.includes(item), `${label} missing ${item}`);
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
    'acceptedForDockerBuildBeforeGate1J',
    'acceptedForDockerPushToday',
    'acceptedForDockerRunToday',
    'acceptedForRuntimeExecutionToday',
    'acceptedForExecutionToday',
    'registryPushAllowed',
    'dockerRunAllowed',
    'containerRuntimeExecutionAllowed',
    'storageTransferAllowed',
    'signedUrlAllowed',
    'publicArtifactAllowed',
    'trackedBuildOutputAllowed',
    'dockerCacheMutationAllowedInThisOwnerReview',
    'dockerPushAllowed',
    'gcpAllowed',
    'workerExecutionAllowed',
    'mediaProcessingAllowed',
    'supabaseAllowed',
    'sqlAllowed'
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
    /"(dockerBuildRun|dockerPushRun|dockerRunRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|sqlExecuted|artifactCreated|dockerReadinessClaimed|imageReadinessClaimed|workerReadinessClaimed|runtimeReadinessClaimed|mediaReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
    /"(acceptedForDockerBuildToday|acceptedForDockerBuildBeforeGate1J|acceptedForDockerPushToday|acceptedForDockerRunToday|acceptedForRuntimeExecutionToday|acceptedForExecutionToday)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i
  ];

  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`);
  }
}

for (const file of REQUIRED_FILES) read(file);
const parsed = Object.fromEntries([...PROMPT_BLOCKS, ...SOURCE_BLOCKS, ...DOC_BLOCKS].map(([file, label]) => [label, parseBlock(file, label)]));

const owner = parsed['worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'];
assert(owner.decision === DECISION, 'owner review decision mismatch');
assert(owner.sourceBase.head === SOURCE_HEAD, 'source head mismatch');
assert(owner.sourceBase.pr720.mergeCommit === SOURCE_HEAD, 'PR #720 merge commit mismatch');
assert(owner.sourceBase.pr720.decision === PR720_DECISION, 'PR #720 decision mismatch');
assert(owner.sourceBase.pr716.decision === PR716_DECISION, 'PR #716 decision mismatch');
assert(owner.sourceBase.pr712.decision === PR712_DECISION, 'PR #712 decision mismatch');
assert(owner.targetOwner === 'WORKER_RUNTIME_JOBS', 'target owner mismatch');
assert(owner.dockerfilePathReviewed === DOCKERFILE_PATH, 'Dockerfile path mismatch');
assert(owner.requirementsSource === REQUIREMENTS_PATH, 'requirements source mismatch');
assert(owner.gate1IReadinessPlanAccepted === true, 'Gate 1I plan acceptance missing');
assert(owner.buildReadinessOwnerReviewPassed === true, 'owner review pass missing');
assert(owner.acceptedForControlledDockerBuildProofPlanning === true, 'controlled proof planning acceptance missing');
assert(owner.controlledDockerBuildProofMayProceedAfterOwnerReview === true, 'controlled proof next gate not allowed');
assert(owner.acceptedForDockerBuildToday === false, 'Docker build must not be accepted today');
assert(owner.acceptedForDockerPushToday === false, 'Docker push must not be accepted today');
assert(owner.acceptedForDockerRunToday === false, 'Docker run must not be accepted today');
assert(owner.acceptedForRuntimeExecutionToday === 'none', 'runtime execution widened');
includeAll(owner.acceptedPlanningSurface.workers, WORKERS, 'owner workers');
includeAll(owner.acceptedPlanningSurface.images, IMAGES, 'owner images');
includeAll(owner.acceptedPlanningSurface.jobTypes, JOB_TYPES, 'owner job types');
assert(owner.requiredNoScopeStatement === NO_SCOPE, 'owner no-scope statement mismatch');
assertNoop(owner.supabaseClassification, 'owner review');

const acceptance = parsed['worker-runtime-jobs-sound-cpu-docker-build-readiness-acceptance-register'];
assert(acceptance.decision === DECISION, 'acceptance decision mismatch');
assert(acceptance.sourceDecision === PR720_DECISION, 'acceptance source decision mismatch');
assert(acceptance.acceptedForControlledDockerBuildProofPlanning === true, 'acceptance controlled proof planning missing');
assert(acceptance.acceptedForDockerBuildToday === false, 'acceptance Docker build today widened');
assert(acceptance.acceptedForDockerPushToday === false, 'acceptance Docker push today widened');
assert(acceptance.acceptedForDockerRunToday === false, 'acceptance Docker run today widened');
assert(acceptance.acceptedForExecutionToday === false, 'acceptance execution widened');
for (const item of ACCEPTANCE_ITEMS) {
  const row = acceptance.register.find((entry) => entry.item === item);
  assert(row, `acceptance register missing ${item}`);
  assert(row.acceptedForControlledProofPlanning === true, `${item} should be accepted for controlled proof planning`);
  assert(row.acceptedForDockerBuildToday === false, `${item} must not be accepted for Docker build today`);
  assert(row.acceptedForExecutionToday === false, `${item} must not be accepted for execution today`);
}
for (const jobType of JOB_TYPES) {
  assert(acceptance.register.some((entry) => entry.item === `job type ${jobType}`), `acceptance register missing job type ${jobType}`);
}
assertNoop(acceptance.supabaseClassification, 'acceptance register');

const preflight = parsed['worker-runtime-jobs-sound-cpu-docker-build-preflight-owner-register'];
assert(preflight.decision === DECISION, 'preflight decision mismatch');
assert(preflight.preflightOwnerDecision === 'accepted_for_gate_1j_only', 'preflight owner decision mismatch');
for (const item of ['local Docker CLI version readback', 'local Docker daemon availability readback', 'local disk and Docker cache inventory', 'clean tracked worktree and index', 'no Docker login, registry push target, or publication credentials', 'no GCP credentials, service accounts, Cloud Run targets, or Secret Manager references']) {
  assert(preflight.requiredBeforeControlledBuildProof.some((row) => row.item === item && row.gate1JExecutionStatus === 'required_before_any_build'), `preflight missing ${item}`);
}
for (const item of ['Docker build', 'Docker run', 'Docker push']) {
  assert(preflight.notRunInThisOwnerReview.includes(item), `preflight must say ${item} was not run`);
}
assertNoop(preflight.supabaseClassification, 'preflight');

const artifact = parsed['worker-runtime-jobs-sound-cpu-docker-build-artifact-cache-policy-owner-register'];
assert(artifact.decision === DECISION, 'artifact policy decision mismatch');
assert(artifact.artifactPolicy === 'no_artifacts_created_in_owner_review', 'artifact policy widened');
assert(artifact.futureGate1JLocalProofPolicy.registryPushAllowed === false, 'registry push widened');
assert(artifact.futureGate1JLocalProofPolicy.dockerRunAllowed === false, 'docker run widened');
assert(artifact.futureGate1JLocalProofPolicy.signedUrlAllowed === false, 'signed URL widened');
assert(artifact.futureGate1JLocalProofPolicy.publicArtifactAllowed === false, 'public artifact widened');
assert(artifact.futureGate1JLocalProofPolicy.trackedBuildOutputAllowed === false, 'tracked build output widened');
assert(artifact.cachePolicy.dockerCacheMutationAllowedInThisOwnerReview === false, 'Docker cache mutation in owner review widened');
assertNoop(artifact.supabaseClassification, 'artifact policy');

const blockers = parsed['worker-runtime-jobs-sound-cpu-docker-build-readiness-blocker-follow-up-register'];
assert(blockers.decision === DECISION, 'blocker decision mismatch');
assert(blockers.readyFollowUps.some((row) => row.scope === 'controlled local Docker build proof' && row.status === 'ready_for_next_gate_only'), 'controlled build proof next gate not represented');
for (const scope of BLOCKED_SCOPES) {
  assert(blockers.blockers.some((row) => row.scope === scope && (row.status === 'blocked' || row.status === 'blocked_unclaimed')), `blocker register missing ${scope}`);
}
assertNoop(blockers.supabaseClassification, 'blocker register');

const policy = parsed['worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-claim-policy'];
assert(policy.decision === DECISION, 'claim policy decision mismatch');
for (const claim of ['Gate 1I readiness plan reviewed', 'controlled Docker build proof may proceed in Gate 1J only', 'accepted for controlled build-proof planning']) {
  assert(policy.positiveClaims.some((row) => row.claim === claim && row.allowed === true), `positive claim missing ${claim}`);
}
for (const claim of ['Docker build', 'Docker push', 'Docker run', 'image readiness', 'worker readiness', 'route readiness', 'runtime readiness', 'media readiness', 'GCP/Cloud Run readiness', 'Secret Manager readiness', 'Supabase readiness', 'artifact readiness', 'model-weight readiness', 'billing readiness', 'beta readiness', 'production readiness', 'generated_local_fixture_passed', 'dry_run_passed']) {
  assert(policy.notClaims.some((row) => row.claim === claim && row.allowed === false), `claim policy missing ${claim}`);
}
assertNoop(policy.supabaseClassification, 'claim policy');

const gate1i = parsed['sound-runtime-media-gate-1i-docker-build-proof-readiness-plan'];
assert(gate1i.decision === PR720_DECISION, 'Gate 1I source decision mismatch');
assert(gate1i.sourceBase.head === '045e67a51e7b1d333ec8116d9aec334aebf7bbeb', 'Gate 1I source-head evidence mismatch');
assert(gate1i.dockerfilePath === DOCKERFILE_PATH, 'Gate 1I Dockerfile path mismatch');
assert(gate1i.requirementsSource === REQUIREMENTS_PATH, 'Gate 1I requirements source mismatch');
assert(gate1i.readinessPlanScope.dockerBuildRun === false, 'Gate 1I must not have run Docker build');
assertNoop(gate1i.supabaseClassification, 'Gate 1I plan');

const gate1iCommands = parsed['sound-runtime-media-gate-1i-proposed-build-command-plan'];
assert(gate1iCommands.commandPolicy === 'proposed_not_executed_in_gate_1i', 'Gate 1I command policy mismatch');
for (const command of gate1iCommands.proposedCommands) {
  assert(command.executionStatus === 'proposed_not_executed_in_gate_1i', 'Gate 1I command execution widened');
  assert(command.pushAllowed === false, 'Gate 1I push must be blocked');
  assert(command.runAllowed === false, 'Gate 1I run must be blocked');
}

const gate1iArtifact = parsed['sound-runtime-media-gate-1i-build-output-artifact-policy'];
assert(gate1iArtifact.artifactPolicy === 'no_artifacts_created', 'Gate 1I artifact policy mismatch');

const sourceOwner = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review'];
assert(sourceOwner.decision === PR716_DECISION, 'PR #716 source decision mismatch');
assert(sourceOwner.acceptedForBuildReadinessPlanning === true, 'PR #716 build readiness acceptance missing');
assert(sourceOwner.acceptedForDockerBuildToday === false, 'PR #716 Docker build today widened');

const gate1h = parsed['sound-runtime-media-gate-1h-dockerfile-static-validation-result'];
assert(gate1h.decision === PR712_DECISION, 'PR #712 source decision mismatch');
assert(gate1h.staticValidator.status === 'passed', 'Gate 1H static validator did not pass');

const readinessPrompt = parseBlock(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review.md',
  'worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review'
);
assert(readinessPrompt.decisionTarget === DECISION, 'readiness prompt decision target mismatch');
assert(readinessPrompt.sourceVerification.requiredSourceHead === SOURCE_HEAD, 'readiness prompt source head mismatch');
assert(readinessPrompt.controlledDockerBuildProofMayProceedAfterOwnerReview === true, 'readiness prompt next gate allowance missing');
assert(readinessPrompt.acceptedForDockerBuildToday === false, 'readiness prompt Docker build today widened');
assertNoop(readinessPrompt.supabaseClassification, 'readiness prompt');

const gate1j = parsed['sound-runtime-media-gate-1j-controlled-docker-build-proof'];
assert(gate1j.requiredBuildReadinessOwnerReviewDecision === DECISION, 'Gate 1J must require owner review decision');
assert(gate1j.requiredBuildReadinessOwnerReviewSourceHead === SOURCE_HEAD, 'Gate 1J owner review source head mismatch');
assert(gate1j.controlledDockerBuildProofMayProceedAfterOwnerReview === true, 'Gate 1J next gate allowance missing');
assert(gate1j.allowedFutureBuildScopeAfterOwnerReview.localDockerBuildOnly === true, 'Gate 1J must remain local build only');
assert(gate1j.allowedFutureBuildScopeAfterOwnerReview.dockerPushAllowed === false, 'Gate 1J push widened');
assert(gate1j.allowedFutureBuildScopeAfterOwnerReview.dockerRunAllowed === false, 'Gate 1J run widened');
assertNoop(gate1j.supabaseClassification, 'Gate 1J prompt');

const buildProofPlan = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-plan'];
assert(buildProofPlan.requiredBuildReadinessOwnerReviewDecision === DECISION, 'build proof plan owner review decision mismatch');
assert(buildProofPlan.requiredBuildReadinessOwnerReviewSourceHead === SOURCE_HEAD, 'build proof plan source head mismatch');
assert(buildProofPlan.controlledDockerBuildProofMayProceedAfterOwnerReview === true, 'build proof plan next gate allowance missing');
assert(buildProofPlan.acceptedForDockerBuildToday === false, 'build proof plan Docker build today widened');
assertNoop(buildProofPlan.supabaseClassification, 'build proof plan');

const proofOwnerPrompt = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review'];
assert(proofOwnerPrompt.requiredBuildReadinessOwnerReviewDecision === DECISION, 'proof owner prompt must require readiness owner review');
assert(proofOwnerPrompt.acceptedForDockerBuildToday === false, 'proof owner prompt Docker build today widened');
assert(proofOwnerPrompt.acceptedForDockerPushToday === false, 'proof owner prompt Docker push today widened');
assert(proofOwnerPrompt.acceptedForDockerRunToday === false, 'proof owner prompt Docker run today widened');
assertNoop(proofOwnerPrompt.supabaseClassification, 'proof owner prompt');

const dockerfile = read(DOCKERFILE_PATH);
assert(dockerfile.includes('FROM python:3.13-slim'), 'Dockerfile base image missing');
assert(dockerfile.includes(`COPY ${REQUIREMENTS_PATH} ./requirements.sound-oss-tools.txt`), 'Dockerfile requirements copy mismatch');
assert(dockerfile.includes('REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0'), 'Dockerfile runtime disabled flag missing');
assert(dockerfile.includes('REEDITPRO_WORKER_EXECUTION_ENABLED=0'), 'Dockerfile worker disabled flag missing');
assert(dockerfile.includes('REEDITPRO_MEDIA_PROCESSING_ENABLED=0'), 'Dockerfile media disabled flag missing');
assert(dockerfile.includes('USER reeditpro'), 'Dockerfile non-root user missing');
assert(dockerfile.includes('runtime execution is disabled pending owner gates'), 'Dockerfile fail-closed command missing');

const ownership = read('docs/cross-chat-tool-ownership-registry.md');
assert(ownership.includes('WORKER_RUNTIME_JOBS'), 'WORKER_RUNTIME_JOBS ownership missing');

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-docker-build-readiness-owner-review:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review-diagnostics.mjs', 'missing package script');
assert(read('docs/worker-runtime-jobs-sound-cpu-docker-build-readiness-owner-review.md').includes(NO_SCOPE), 'missing no-scope statement');

for (const object of Object.values(parsed)) walkClosed(object);
scanUnsafe([...DOC_BLOCKS.map(([file]) => file), ...PROMPT_BLOCKS.map(([file]) => file)]);

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_docker_build_readiness_owner_review_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  pr720Verified: true,
  buildReadinessOwnerReviewPassed: true,
  controlledDockerBuildProofMayProceed: true,
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
  modelWeightsDownloaded: false,
  artifactCreated: false,
  nextPrompt: 'SOUND-RUNTIME-MEDIA-GATE-1J'
}, null, 2));
