#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_owner_review_passed_with_warnings_ready_for_gate_1f_source_creation_plan';
const SOURCE_HEAD = 'f8db4312f6a3e11899b381c08f6f3a53d2804171';
const PR691_DECISION = 'sound_runtime_media_gate_1e_dockerfile_static_plan_completed_with_warnings_ready_for_dockerfile_static_owner_review';
const PR684_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_review_passed_with_warnings_ready_for_gate_1e_static_plan';
const PR679_DECISION = 'worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan';
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

const BLOCKED_STATUS_STRINGS = [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'image_ready',
  'docker_ready',
  'cloud_run_ready',
  'worker_ready',
  'runtime_ready',
  'media_ready',
  'supabase_ready',
  'artifact_ready',
  'beta_ready',
  'production_ready'
];

const DOCS = [
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-image-layer-approval-register.md', 'worker-runtime-jobs-sound-cpu-image-layer-approval-register'],
  ['docs/worker-runtime-jobs-sound-cpu-static-security-approval-register.md', 'worker-runtime-jobs-sound-cpu-static-security-approval-register'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-owner-claim-policy.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-owner-claim-policy']
];

const PROMPTS = [
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1f-dockerfile-source-creation-plan.md', 'sound-runtime-media-gate-1f-dockerfile-source-creation-plan'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-plan.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan']
];

const SOURCE_BLOCKS = [
  ['docs/sound-runtime-media-gate-1e-dockerfile-static-plan.md', 'sound-runtime-media-gate-1e-dockerfile-static-plan'],
  ['docs/sound-runtime-media-gate-1e-proposed-dockerfile-spec.md', 'sound-runtime-media-gate-1e-proposed-dockerfile-spec'],
  ['docs/sound-runtime-media-gate-1e-static-image-file-layout-plan.md', 'sound-runtime-media-gate-1e-static-image-file-layout-plan'],
  ['docs/sound-runtime-media-gate-1e-package-install-layer-plan.md', 'sound-runtime-media-gate-1e-package-install-layer-plan'],
  ['docs/sound-runtime-media-gate-1e-static-security-policy-plan.md', 'sound-runtime-media-gate-1e-static-security-policy-plan'],
  ['docs/sound-runtime-media-gate-1e-static-validation-ci-plan.md', 'sound-runtime-media-gate-1e-static-validation-ci-plan'],
  ['docs/sound-runtime-media-gate-1e-excluded-runtime-register.md', 'sound-runtime-media-gate-1e-excluded-runtime-register'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-review'],
  ['docs/worker-runtime-jobs-sound-cpu-contract-owner-review.md', 'worker-runtime-jobs-sound-cpu-contract-owner-review']
];

const REQUIRED_FILES = [
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json',
  'scripts/validation/sound-runtime-media-gate-1e-diagnostics.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-static-review-diagnostics.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-contract-owner-review-diagnostics.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-static-contract-plan-diagnostics.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-handoff-review-diagnostics.mjs'
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

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`);
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`);
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`);
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`);
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`);
}

function assertClosed(value, label) {
  assert(value === false || value === 'no' || value === 'none' || value === 'blocked' || value === 'blocked_unclaimed' || value === 'blocked_until_gate_1f', `${label} must stay closed`);
}

function assertRuntimeFlagsStayClosed(objects) {
  const guardedKeys = new Set([
    'actualDockerfileCreated',
    'actualDockerfileModified',
    'dockerfileCreated',
    'dockerBuildRun',
    'dockerPushRun',
    'gcpTouched',
    'cloudRunTouched',
    'secretManagerTouched',
    'workerExecutionRun',
    'routeExecutionRun',
    'toolExecutionRun',
    'mediaProcessingRun',
    'supabaseTouched',
    'sqlExecuted',
    'modelWeightsDownloaded',
    'artifactCreated',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'dockerReadinessClaimed',
    'imageReadinessClaimed',
    'mediaReadinessClaimed',
    'supabaseReadinessClaimed',
    'artifactReadinessClaimed',
    'betaReadinessClaimed',
    'productionReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'acceptedForActualDockerfileToday',
    'acceptedForDockerBuildToday',
    'acceptedForBuildToday',
    'acceptedForDockerPushToday',
    'buildToday',
    'executionToday',
    'executionAllowedNow',
    'allowed'
  ]);

  function walk(value, trail = []) {
    if (value === null || value === undefined || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, trail.concat(String(index))));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (guardedKeys.has(key)) assertClosed(child, trail.concat(key).join('.'));
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
    /"(actualDockerfileCreated|actualDockerfileModified|dockerBuildRun|dockerPushRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|supabaseTouched|modelWeightsDownloaded|artifactCreated|runtimeReadinessClaimed|workerReadinessClaimed|dockerReadinessClaimed|imageReadinessClaimed|mediaReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
    /"(acceptedForActualDockerfileToday|acceptedForDockerBuildToday|acceptedForDockerPushToday|buildToday|executionToday|executionAllowedNow)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i
  ];
  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`);
  }
}

for (const file of REQUIRED_FILES) assert(existsSync(file), `Missing source file: ${file}`);

const parsed = Object.fromEntries([...DOCS, ...PROMPTS, ...SOURCE_BLOCKS].map(([file, label]) => [label, parseBlock(file, label)]));

const owner = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review'];
assert(owner.decision === DECISION, 'owner review decision mismatch');
assert(owner.sourceBase?.head === SOURCE_HEAD, 'owner source head mismatch');
assert(owner.sourceBase?.pr691?.mergeCommit === SOURCE_HEAD, 'PR #691 merge commit mismatch');
assert(owner.sourceBase?.pr691?.decision === PR691_DECISION, 'PR #691 decision mismatch');
assert(owner.sourceBase?.pr684?.decision === PR684_DECISION, 'PR #684 decision mismatch');
assert(owner.sourceBase?.pr679?.decision === PR679_DECISION, 'PR #679 decision mismatch');
assert(owner.targetOwner === 'WORKER_RUNTIME_JOBS', 'owner boundary mismatch');
assert(owner.staticDockerfilePlanAccepted === true, 'static plan should be accepted');
assert(owner.actualDockerfileSourceCreationMayBePlannedNext === true, 'Gate 1F source planning should be allowed');
assert(owner.acceptedForExecutionToday === 'none', 'execution widened');
includeAll(owner.acceptedPlanningSurface?.workers, WORKERS, 'owner workers');
includeAll(owner.acceptedPlanningSurface?.images, IMAGES, 'owner images');
includeAll(owner.acceptedPlanningSurface?.jobTypes, JOB_TYPES, 'owner job types');
assert(owner.acceptedPlanningSurface?.requirementsSource === REQUIREMENTS_PATH, 'requirements source mismatch');
assert(owner.requiredNoScopeStatement === NO_SCOPE, 'owner no-scope mismatch');
assertSupabaseNoop(owner.supabaseClassification, 'owner');

const acceptance = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-acceptance-register'];
assert(acceptance.decision === DECISION, 'acceptance decision mismatch');
assert(acceptance.sourceDecision === PR691_DECISION, 'acceptance source decision mismatch');
assert(acceptance.acceptanceRows?.length >= 19, 'acceptance rows incomplete');
includeAll(acceptance.acceptanceRows.map((row) => row.item), [
  'proposed Dockerfile sections',
  'base image recommendation',
  'Python runtime expectation',
  'requirements copy step',
  'pip install step',
  'worker source copy placeholder',
  'non-root user expectation',
  'runtime-disabled env vars',
  'healthcheck placeholder',
  'command/entrypoint placeholder',
  'excluded commands',
  'excluded system packages',
  'excluded secrets',
  'excluded media/model/artifact paths',
  'no FFmpeg/ffprobe',
  'no model weights',
  'no service account files',
  'no Supabase credentials',
  'no provider credentials'
], 'acceptance items');
assert(acceptance.requirementsSource === REQUIREMENTS_PATH, 'acceptance requirements mismatch');
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance');

const layers = parsed['worker-runtime-jobs-sound-cpu-image-layer-approval-register'];
assert(layers.decision === DECISION, 'layer decision mismatch');
includeAll(layers.layerRows.map((row) => row.layer), [
  'base OS layer',
  'Python runtime layer',
  'system dependencies layer',
  'Python requirements layer',
  'worker code layer',
  'validation/proof layer',
  'runtime-disabled default policy layer'
], 'layer rows');
includeAll(layers.plannedImages, IMAGES, 'layer images');

const security = parsed['worker-runtime-jobs-sound-cpu-static-security-approval-register'];
assert(security.decision === DECISION, 'security decision mismatch');
includeAll(security.securityRows.map((row) => row.item), [
  'non-root runtime',
  'no secrets in image',
  'no service account files',
  'no signed URLs as source of truth',
  'no raw prompts',
  'no provider output blobs',
  'no media file paths in payload',
  'no model-weight locations',
  'no artifact write paths',
  'runtime-disabled default',
  'future owner handoffs'
], 'security rows');
assertSupabaseNoop(security.supabaseClassification, 'security');

const blockers = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-blocker-follow-up-register'];
assert(blockers.decision === DECISION, 'blocker decision mismatch');
includeAll(blockers.blockedFollowUps.map((row) => row.item), [
  'actual Dockerfile creation',
  'Docker build',
  'Docker push',
  'Artifact Registry',
  'Cloud Run',
  'GCP APIs',
  'Secret Manager',
  'service accounts',
  'worker dispatch',
  'worker claim/lease',
  'worker execution',
  'route/tool execution',
  'media processing',
  'Supabase/SQL',
  'artifact writes',
  'model weights',
  'beta/production',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime readiness'
], 'blocked follow-ups');
assertSupabaseNoop(blockers.supabaseClassification, 'blockers');

const claimPolicy = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-owner-claim-policy'];
assert(claimPolicy.decision === DECISION, 'claim policy decision mismatch');
includeAll(claimPolicy.blockedStatusStringsPreserved, BLOCKED_STATUS_STRINGS, 'blocked status strings');
assert(claimPolicy.nextAllowedGate === 'SOUND-RUNTIME-MEDIA-GATE-1F', 'next gate mismatch');
assertSupabaseNoop(claimPolicy.supabaseClassification, 'claim policy');

const gate1e = parsed['sound-runtime-media-gate-1e-dockerfile-static-plan'];
assert(gate1e.decision === PR691_DECISION, 'Gate 1E source decision mismatch');
includeAll(gate1e.acceptedPlanningSurface?.workers, WORKERS, 'Gate 1E workers');
includeAll(gate1e.acceptedPlanningSurface?.images, IMAGES, 'Gate 1E images');
includeAll(gate1e.acceptedPlanningSurface?.jobTypes, JOB_TYPES, 'Gate 1E job types');

const sourceReview = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-review'];
assert(sourceReview.decision === PR684_DECISION, 'PR #684 source decision mismatch');

const gate1f = parsed['sound-runtime-media-gate-1f-dockerfile-source-creation-plan'];
assert(gate1f.requiredOwnerReviewDecision === DECISION, 'Gate 1F owner decision mismatch');
assert(gate1f.requiredSourceMergeCommit === SOURCE_HEAD, 'Gate 1F source merge mismatch');
assert(gate1f.requiredNoScopeStatement === NO_SCOPE, 'Gate 1F no-scope mismatch');
assertSupabaseNoop(gate1f.supabaseClassification, 'Gate 1F');

const sourceOwner = parsed['worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'];
assert(sourceOwner.requiredPriorDecision === DECISION, 'source owner prompt prior decision mismatch');
includeAll(sourceOwner.acceptedPlanningOnly?.workers, WORKERS, 'source owner workers');
includeAll(sourceOwner.acceptedPlanningOnly?.images, IMAGES, 'source owner images');
includeAll(sourceOwner.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'source owner job types');
assert(sourceOwner.requiredNoScopeStatement === NO_SCOPE, 'source owner no-scope mismatch');
assertSupabaseNoop(sourceOwner.supabaseClassification, 'source owner');

const buildProof = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-plan'];
assert(buildProof.requiredStaticOwnerReviewDecision === DECISION, 'build proof owner decision mismatch');
includeAll(buildProof.acceptedPlanningOnly?.workers, WORKERS, 'build proof workers');
includeAll(buildProof.acceptedPlanningOnly?.images, IMAGES, 'build proof images');
includeAll(buildProof.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'build proof job types');
assert(buildProof.requiredNoScopeStatement === NO_SCOPE, 'build proof no-scope mismatch');
assertSupabaseNoop(buildProof.supabaseClassification, 'build proof');

const packageJson = JSON.parse(read('package.json'));
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-dockerfile-static-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review-diagnostics.mjs',
  'package script mismatch'
);

assert(read('docs/cross-chat-tool-ownership-registry.md').includes('WORKER_RUNTIME_JOBS'), 'ownership registry missing WORKER_RUNTIME_JOBS');

assertRuntimeFlagsStayClosed(Object.values(parsed));
scanUnsafe([...DOCS.map(([file]) => file), ...PROMPTS.map(([file]) => file)]);

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dockerfile_static_owner_review_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  pr691Decision: PR691_DECISION,
  pr684Decision: PR684_DECISION,
  docsVerified: DOCS.length,
  promptsVerified: PROMPTS.length,
  workers: WORKERS,
  images: IMAGES,
  jobTypes: JOB_TYPES,
  requirementsSource: REQUIREMENTS_PATH,
  staticDockerfilePlanAccepted: true,
  actualDockerfileSourceCreationMayBePlannedNext: true,
  actualDockerfileCreated: false,
  dockerBuildRun: false,
  dockerPushRun: false,
  gcpTouched: false,
  workerExecutionRun: false,
  mediaProcessingRun: false,
  supabaseClassification: owner.supabaseClassification
}, null, 2));
