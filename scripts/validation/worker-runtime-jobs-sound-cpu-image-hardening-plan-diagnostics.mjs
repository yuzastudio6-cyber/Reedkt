#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_image_hardening_plan_completed_with_warnings_ready_for_image_hardening_owner_review';
const SOURCE_HEAD = '6e588a93a52a9cd921e5b6834948b27925497346';
const PR734_DECISION = 'worker_runtime_jobs_sound_cpu_docker_build_proof_owner_review_passed_with_warnings_ready_for_image_hardening_plan';
const PR730_DECISION = 'sound_runtime_media_gate_1j_controlled_docker_build_proof_passed_with_warnings_ready_for_build_proof_owner_review';
const DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const IMAGE_ID = 'sha256:b9c202435f9037acddd7bd96b1daf790cea69623e1450128205c68472e506a2b';
const PACKAGE_LOCK_SHA = 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3';
const NEXT_PROMPT = 'WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-OWNER-REVIEW';

const DOC_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-plan.md', 'worker-runtime-jobs-sound-cpu-image-hardening-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-topic-register.md', 'worker-runtime-jobs-sound-cpu-image-hardening-topic-register'],
  ['docs/worker-runtime-jobs-sound-cpu-base-image-digest-pinning-plan.md', 'worker-runtime-jobs-sound-cpu-base-image-digest-pinning-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-vulnerability-sbom-plan.md', 'worker-runtime-jobs-sound-cpu-vulnerability-sbom-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-build-context-dockerignore-plan.md', 'worker-runtime-jobs-sound-cpu-build-context-dockerignore-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-image-metadata-labels-plan.md', 'worker-runtime-jobs-sound-cpu-image-metadata-labels-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-runtime-disabled-hardening-plan.md', 'worker-runtime-jobs-sound-cpu-runtime-disabled-hardening-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-blocker-register.md', 'worker-runtime-jobs-sound-cpu-image-hardening-blocker-register'],
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-claim-policy.md', 'worker-runtime-jobs-sound-cpu-image-hardening-claim-policy']
];

const PROMPT_BLOCKS = [
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-image-hardening-owner-review.md', 'worker-runtime-jobs-sound-cpu-image-hardening-owner-review'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1k-docker-build-proof-validation-review.md', 'sound-runtime-media-gate-1k-docker-build-proof-validation-review'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerignore-source-plan.md', 'worker-runtime-jobs-sound-cpu-dockerignore-source-plan'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-vulnerability-sbom-readiness-plan.md', 'worker-runtime-jobs-sound-cpu-vulnerability-sbom-readiness-plan']
];

const SOURCE_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-image-hardening-readiness-register.md', 'worker-runtime-jobs-sound-cpu-image-hardening-readiness-register'],
  ['docs/sound-runtime-media-gate-1j-controlled-docker-build-proof-result.md', 'sound-runtime-media-gate-1j-controlled-docker-build-proof-result'],
  ['docs/sound-runtime-media-gate-1j-image-metadata-register.md', 'sound-runtime-media-gate-1j-image-metadata-register']
];

const REQUIRED_FILES = [
  DOCKERFILE_PATH,
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json',
  'scripts/validation/worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review-diagnostics.mjs',
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
  assert(value === false || value === 'no' || value === 'none' || value === 'blocked' || value === 'blocked_unclaimed' || value === 'unclaimed', `${label} must stay closed`);
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
    'scannerExecutionRun',
    'dockerImageScanRun',
    'sbomGenerated',
    'acceptedForDockerBuildToday',
    'acceptedForDockerPushToday',
    'acceptedForDockerRunToday',
    'dockerReadiness',
    'imageReadiness',
    'workerReadiness',
    'runtimeReadiness',
    'mediaReadiness',
    'runtimeReadinessClaim',
    'workerReadinessClaim',
    'mediaReadinessClaim'
  ]);

  for (const [key, child] of Object.entries(value)) {
    const label = trail.concat(key).join('.');
    if (guarded.has(key)) assertClosed(child, label);
    if (key === 'allowed' && !trail.includes('positiveClaims')) assertClosed(child, label);
    if (key === 'executionToday' || key === 'approvedToday') assertClosed(child, label);
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
    /"(dockerBuildRun|dockerPushRun|dockerRunRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|sqlExecuted|artifactCreated)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
    /(docker|image|worker|runtime|media)\s+readiness\s*[:=]\s*(true|passed|ready)/i
  ];

  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`);
  }
}

for (const file of REQUIRED_FILES) read(file);
const parsed = Object.fromEntries([...DOC_BLOCKS, ...PROMPT_BLOCKS, ...SOURCE_BLOCKS].map(([file, label]) => [label, parseBlock(file, label)]));

const plan = parsed['worker-runtime-jobs-sound-cpu-image-hardening-plan'];
assert(plan.decision === DECISION, 'image-hardening decision mismatch');
assert(plan.sourceBase.head === SOURCE_HEAD, 'source head mismatch');
assert(plan.sourceBase.pr734.mergeCommit === SOURCE_HEAD, 'PR #734 merge commit mismatch');
assert(plan.sourceBase.pr734.decision === PR734_DECISION, 'PR #734 decision missing');
assert(plan.sourceBase.pr730.decision === PR730_DECISION, 'PR #730 decision missing');
assert(plan.dockerfilePath === DOCKERFILE_PATH, 'Dockerfile path mismatch');
assert(plan.requirementsSource === REQUIREMENTS_PATH, 'requirements path mismatch');
assert(plan.acceptedSourceEvidence.imageId === IMAGE_ID, 'image ID mismatch');
assert(plan.acceptedSourceEvidence.imageSizeBytes === 333375027, 'image size mismatch');
assert(plan.acceptedSourceEvidence.packageLockSha256 === PACKAGE_LOCK_SHA, 'package-lock hash mismatch');
assert(plan.imageHardeningPlanCreated === 'yes', 'image hardening plan creation missing');
assert(plan.nextPrompt.startsWith(NEXT_PROMPT), 'next prompt mismatch');
assertNoop(plan.supabaseClassification, 'image-hardening plan');

const sourceReview = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review'];
assert(sourceReview.decision === PR734_DECISION, 'PR #734 owner-review source decision mismatch');
assert(sourceReview.ownerReviewResult.acceptedForImageHardeningPlanning === true, 'PR #734 did not authorize image-hardening planning');
assert(sourceReview.reviewedEvidence.imageId === IMAGE_ID, 'PR #734 image ID mismatch');

const gate1j = parsed['sound-runtime-media-gate-1j-controlled-docker-build-proof-result'];
assert(gate1j.decision === PR730_DECISION, 'Gate 1J decision mismatch');
assert(gate1j.controlledBuildProof.status === 'passed', 'Gate 1J build proof not passed');
assert(gate1j.controlledBuildProof.dockerPushRun === false, 'Gate 1J push widened');
assert(gate1j.controlledBuildProof.dockerRunRun === false, 'Gate 1J run widened');

const topicRegister = parsed['worker-runtime-jobs-sound-cpu-image-hardening-topic-register'];
const requiredTopics = [
  'base image pinning',
  'digest pinning',
  'package cache cleanup',
  'vulnerability scanning',
  'SBOM planning',
  'labels/metadata',
  'non-root verification',
  'runtime-disabled flags',
  'healthcheck review',
  'command/entrypoint review',
  'build context minimization',
  '.dockerignore plan',
  'no secrets/service accounts',
  'no media/model artifacts',
  'no Supabase credentials',
  'no provider credentials'
];
for (const topic of requiredTopics) {
  const row = topicRegister.topicRegister.find((entry) => entry.topic === topic);
  assert(row, `missing hardening topic ${topic}`);
  assert(row.planned === 'yes', `${topic} not planned`);
  assert(row.approvedToday === 'no', `${topic} approved too early`);
  assert(row.executionToday === 'no', `${topic} execution widened`);
}
assertNoop(topicRegister.supabaseClassification, 'topic register');

const base = parsed['worker-runtime-jobs-sound-cpu-base-image-digest-pinning-plan'];
assert(base.currentBaseImage === 'python:3.13-slim', 'base image mismatch');
assert(base.digestPinningRecommendation === 'plan_future_digest_pin_after_owner_review', 'digest recommendation mismatch');
assert(base.noDockerPullInThisGate === 'yes', 'Docker pull must be prohibited');
assert(base.noDockerBuildInThisGate === 'yes', 'Docker build must be prohibited');
assert(base.noImageReadinessClaim === 'yes', 'image readiness must be unclaimed');

const sbom = parsed['worker-runtime-jobs-sound-cpu-vulnerability-sbom-plan'];
assert(sbom.vulnerabilityScannerCandidates.length >= 3, 'scanner candidates missing');
assert(sbom.sbomToolCandidates.length >= 2, 'SBOM candidates missing');
assert(sbom.runtimeFlags.scannerExecutionRun === 'no', 'scanner execution widened');
assert(sbom.runtimeFlags.sbomGenerated === 'no', 'SBOM generation widened');

const context = parsed['worker-runtime-jobs-sound-cpu-build-context-dockerignore-plan'];
assert(context.actualDockerignoreCreatedInThisGate === 'no', '.dockerignore source must not be created');
for (const excluded of ['node_modules', 'dist', 'dist-server', 'media artifacts', 'model weights']) {
  assert(context.blockedContextEntries.includes(excluded), `blocked context missing ${excluded}`);
}

const labels = parsed['worker-runtime-jobs-sound-cpu-image-metadata-labels-plan'];
assert(labels.proposedLabels.includes('org.opencontainers.image.revision'), 'revision label missing');
assert(labels.privacyAndSecretPolicy.secretsInLabels === 'no', 'secrets in labels widened');
assert(labels.privacyAndSecretPolicy.userDataInLabels === 'no', 'user data in labels widened');

const runtime = parsed['worker-runtime-jobs-sound-cpu-runtime-disabled-hardening-plan'];
assert(runtime.runtimeDisabledEnvFlags.REEDITPRO_SOUND_CPU_RUNTIME_ENABLED === '0', 'sound runtime flag mismatch');
assert(runtime.runtimeDisabledEnvFlags.REEDITPRO_WORKER_EXECUTION_ENABLED === '0', 'worker flag mismatch');
assert(runtime.runtimeDisabledEnvFlags.REEDITPRO_MEDIA_PROCESSING_ENABLED === '0', 'media flag mismatch');
assert(runtime.failClosedCommand.includes('disabled-runtime'), 'fail-closed command missing');

const blockers = parsed['worker-runtime-jobs-sound-cpu-image-hardening-blocker-register'];
for (const scope of ['Docker build', 'Docker push', 'Docker run', 'Cloud Run', 'GCP APIs', 'Secret Manager', 'service accounts', 'worker execution', 'route/tool execution', 'media processing', 'FFmpeg/ffprobe', 'Supabase/SQL', 'artifacts', 'model weights', 'beta/production', 'generated_local_fixture_passed', 'dry_run_passed', 'runtime readiness']) {
  assert(blockers.blockers.some((row) => row.scope === scope && (row.status === 'blocked' || row.status === 'blocked_unclaimed')), `blocker missing ${scope}`);
}

const claimPolicy = parsed['worker-runtime-jobs-sound-cpu-image-hardening-claim-policy'];
for (const claim of ['Docker build', 'Docker push', 'Docker run', 'image readiness', 'Cloud Run readiness', 'worker readiness', 'route readiness', 'runtime readiness', 'media readiness', 'GCP readiness', 'Supabase readiness', 'artifact readiness', 'beta readiness', 'production readiness', 'generated_local_fixture_passed', 'dry_run_passed']) {
  assert(claimPolicy.notClaims.some((row) => row.claim === claim && row.allowed === 'no'), `claim policy missing ${claim}`);
}

const ownerPrompt = parsed['worker-runtime-jobs-sound-cpu-image-hardening-owner-review'];
assert(ownerPrompt.requiredImageHardeningPlanDecision === DECISION, 'owner-review prompt missing hardening plan decision');
assert(ownerPrompt.requiredImageHardeningPlanDocs?.includes('docs/worker-runtime-jobs-sound-cpu-image-hardening-plan.md'), 'owner-review prompt missing plan doc');

const gate1kPrompt = parsed['sound-runtime-media-gate-1k-docker-build-proof-validation-review'];
assert(gate1kPrompt.requiredImageHardeningPlanDecision === DECISION, 'Gate 1K prompt missing image-hardening decision');
assert(gate1kPrompt.requiredImageHardeningOwnerReviewPrompt === NEXT_PROMPT, 'Gate 1K prompt missing owner-review prompt');

const dockerignorePrompt = parsed['worker-runtime-jobs-sound-cpu-dockerignore-source-plan'];
assert(dockerignorePrompt.requiredImageHardeningPlanDecision === DECISION, 'dockerignore prompt missing source decision');
assert(dockerignorePrompt.actualDockerignoreCreatedByThisPrompt === 'no', 'dockerignore prompt creates source too early');

const sbomPrompt = parsed['worker-runtime-jobs-sound-cpu-vulnerability-sbom-readiness-plan'];
assert(sbomPrompt.requiredImageHardeningPlanDecision === DECISION, 'SBOM prompt missing source decision');
assert(sbomPrompt.scannerExecutionRun === 'no', 'SBOM prompt scanner execution widened');

for (const [, label] of [...DOC_BLOCKS, ...PROMPT_BLOCKS]) {
  walkClosed(parsed[label], [label]);
  assertNoop(parsed[label].supabaseClassification, label);
}

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts?.['worker-runtime-jobs:sound-cpu-image-hardening-plan:diagnostics'] === 'node scripts/validation/worker-runtime-jobs-sound-cpu-image-hardening-plan-diagnostics.mjs', 'package script missing');

scanUnsafe([...DOC_BLOCKS, ...PROMPT_BLOCKS].map(([file]) => file));

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_image_hardening_plan_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  pr734Verified: true,
  pr730Verified: true,
  imageHardeningPlanCreated: true,
  dockerBuildRun: false,
  dockerPushRun: false,
  dockerRunRun: false,
  workerExecutionRun: false,
  routeExecutionRun: false,
  toolExecutionRun: false,
  mediaProcessingRun: false,
  gcpTouched: false,
  supabaseTouched: false,
  sqlExecuted: false,
  modelWeightsDownloaded: false,
  nextPrompt: NEXT_PROMPT
}, null, 2));
