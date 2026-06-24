#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'sound_runtime_media_gate_1f_dockerfile_source_creation_plan_completed_with_warnings_ready_for_actual_dockerfile_source_gate';
const SOURCE_HEAD = 'a02aae02c5a9fd50316a2e714385199c60c8a0e8';
const PR695_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_owner_review_passed_with_warnings_ready_for_gate_1f_source_creation_plan';
const PR691_DECISION = 'sound_runtime_media_gate_1e_dockerfile_static_plan_completed_with_warnings_ready_for_dockerfile_static_owner_review';
const PR684_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_review_passed_with_warnings_ready_for_gate_1e_static_plan';
const PROPOSED_DOCKERFILE_PATH = 'server/workers/sound-cpu/Dockerfile';
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
  ['docs/sound-runtime-media-gate-1f-dockerfile-source-creation-plan.md', 'sound-runtime-media-gate-1f-dockerfile-source-creation-plan'],
  ['docs/sound-runtime-media-gate-1f-dockerfile-source-path-register.md', 'sound-runtime-media-gate-1f-dockerfile-source-path-register'],
  ['docs/sound-runtime-media-gate-1f-dockerfile-content-acceptance-checklist.md', 'sound-runtime-media-gate-1f-dockerfile-content-acceptance-checklist'],
  ['docs/sound-runtime-media-gate-1f-source-creation-blocker-register.md', 'sound-runtime-media-gate-1f-source-creation-blocker-register'],
  ['docs/sound-runtime-media-gate-1f-runtime-claim-policy.md', 'sound-runtime-media-gate-1f-runtime-claim-policy'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1g-actual-dockerfile-source-creation.md', 'sound-runtime-media-gate-1g-actual-dockerfile-source-creation'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-plan.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan']
];

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-dockerfile-static-acceptance-register.md',
  'docs/worker-runtime-jobs-sound-cpu-image-layer-approval-register.md',
  'docs/worker-runtime-jobs-sound-cpu-static-security-approval-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dockerfile-static-blocker-follow-up-register.md',
  'docs/worker-runtime-jobs-sound-cpu-dockerfile-static-owner-claim-policy.md',
  'docs/sound-runtime-media-gate-1e-dockerfile-static-plan.md',
  'docs/sound-runtime-media-gate-1e-proposed-dockerfile-spec.md',
  'docs/sound-runtime-media-gate-1e-static-image-file-layout-plan.md',
  'docs/sound-runtime-media-gate-1e-package-install-layer-plan.md',
  'docs/sound-runtime-media-gate-1e-static-security-policy-plan.md',
  'docs/sound-runtime-media-gate-1e-static-validation-ci-plan.md',
  'docs/sound-runtime-media-gate-1e-excluded-runtime-register.md',
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

function includeAll(values, required, label) {
  assert(Array.isArray(values), `${label} must be an array`);
  for (const item of required) {
    assert(values.includes(item), `${label} missing ${item}`);
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
  assert(
    value === false || value === 'no' || value === 'none' || value === 'blocked' || value === 'blocked_unclaimed',
    `${label} must stay false/no/none/blocked`
  );
}

function assertClosedFlags(objects) {
  const guardedFalseKeys = new Set([
    'actualDockerfileCreated',
    'actualDockerfileModified',
    'actualDockerfileSourceCreatedInGate1F',
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
    'acceptedInGate1F',
    'allowedInCurrentGate',
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
    /"(actualDockerfileCreated|actualDockerfileModified|actualDockerfileSourceCreatedInGate1F|dockerfileCreated|dockerBuildRun|dockerPushRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|ffmpegOrFfprobeRun|modelWeightsDownloaded|supabaseTouched|artifactCreated|generatedLocalFixturePassedClaimed|dryRunPassedClaimed|dockerReadinessClaimed|imageReadinessClaimed|workerReadinessClaimed|routeReadinessClaimed|runtimeReadinessClaimed|mediaReadinessClaimed|gcpReadinessClaimed|cloudRunReadinessClaimed|supabaseReadinessClaimed|artifactReadinessClaimed|betaReadinessClaimed|productionReadinessClaimed)"\s*:\s*true/,
    /"(acceptedInGate1F|allowedInCurrentGate|executionAllowedNow)"\s*:\s*true/
  ];

  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) {
      const match = text.match(pattern);
      assert(!match, `Unsafe marker ${match?.[0]} in ${file}`);
    }
  }
}

const parsed = DOC_BLOCKS.map(([file, label]) => {
  const block = parseBlock(file, label);
  assert(read(file).includes(NO_SCOPE) || !file.includes('prompt-'), `${file} missing no-scope statement`);
  return { file, label, block };
});

for (const file of SOURCE_FILES) read(file);

assert(!existsSync(PROPOSED_DOCKERFILE_PATH), `${PROPOSED_DOCKERFILE_PATH} must not exist in Gate 1F`);

const plan = parsed.find((entry) => entry.label === 'sound-runtime-media-gate-1f-dockerfile-source-creation-plan').block;
assert(plan.decision === DECISION, 'Gate 1F decision mismatch');
assert(plan.sourceHead === SOURCE_HEAD, 'Gate 1F source head mismatch');
assert(plan.sourceEvidence.some((entry) => entry.pr === 695 && entry.decision === PR695_DECISION), 'PR #695 decision missing');
assert(plan.sourceEvidence.some((entry) => entry.pr === 691 && entry.decision === PR691_DECISION), 'PR #691 decision missing');
assert(plan.sourceEvidence.some((entry) => entry.pr === 684 && entry.decision === PR684_DECISION), 'PR #684 decision missing');
includeAll(plan.acceptedPlanningSurface.workers, WORKERS, 'Gate 1F workers');
includeAll(plan.acceptedPlanningSurface.images, IMAGES, 'Gate 1F images');
includeAll(plan.acceptedPlanningSurface.jobTypes, JOB_TYPES, 'Gate 1F job types');
assert(plan.acceptedPlanningSurface.requirementsSource === REQUIREMENTS_PATH, 'requirements source mismatch');
assert(plan.futureDockerfileSourcePlan.proposedFutureDockerfilePath === PROPOSED_DOCKERFILE_PATH, 'future Dockerfile path mismatch');
assert(plan.futureDockerfileSourcePlan.actualDockerfileSourceMayBePlanned === true, 'source path planning should be allowed');
assertSupabaseNoop(plan.supabaseClassification, 'Gate 1F plan');

const pathRegister = parsed.find((entry) => entry.label === 'sound-runtime-media-gate-1f-dockerfile-source-path-register').block;
assert(pathRegister.proposedPath === PROPOSED_DOCKERFILE_PATH, 'path register proposed path mismatch');
assert(pathRegister.requiredNextGate === 'SOUND-RUNTIME-MEDIA-GATE-1G', 'path register next gate mismatch');
assert(pathRegister.duplicateRiskReview.existingDockerfileAtProposedPath === false, 'path register duplicate review widened');

const checklist = parsed.find((entry) => entry.label === 'sound-runtime-media-gate-1f-dockerfile-content-acceptance-checklist').block;
for (const item of ['base image', 'Python runtime', 'requirements source', 'pip install layer', 'worker code placeholder', 'non-root user', 'no secrets', 'no service account files', 'no media fixtures', 'no model weights', 'no FFmpeg or ffprobe', 'no provider credentials', 'no Supabase credentials', 'runtime-disabled default', 'command or entrypoint placeholder', 'healthcheck placeholder', 'future static lint', 'future build proof']) {
  assert(checklist.checklist.some((entry) => entry.item === item), `checklist missing ${item}`);
}

const blockers = parsed.find((entry) => entry.label === 'sound-runtime-media-gate-1f-source-creation-blocker-register').block;
for (const scope of ['Docker build', 'Docker push', 'GCP/Cloud Run', 'Secret Manager', 'worker execution', 'route/tool execution', 'media processing', 'FFmpeg/ffprobe', 'Supabase/SQL', 'artifacts and storage', 'model weights', 'beta/production', 'generated_local_fixture_passed', 'dry_run_passed', 'runtime readiness']) {
  assert(blockers.blockers.some((entry) => entry.scope === scope), `blocker register missing ${scope}`);
}
assertSupabaseNoop(blockers.supabaseClassification, 'blocker register');

const claimPolicy = parsed.find((entry) => entry.label === 'sound-runtime-media-gate-1f-runtime-claim-policy').block;
for (const claim of ['actual Dockerfile creation', 'Docker build', 'Docker push', 'image readiness', 'worker readiness', 'route readiness', 'runtime readiness', 'media readiness', 'GCP/Cloud Run readiness', 'Supabase readiness', 'artifact readiness', 'beta readiness', 'production readiness', 'generated_local_fixture_passed', 'dry_run_passed']) {
  assert(claimPolicy.notClaims.some((entry) => entry.claim === claim && entry.allowed === false), `claim policy missing ${claim}`);
}

const gate1g = parsed.find((entry) => entry.label === 'sound-runtime-media-gate-1g-actual-dockerfile-source-creation').block;
assert(gate1g.requiredSourceDecision === DECISION, 'Gate 1G prompt source decision mismatch');
assert(gate1g.allowedFutureSourcePath === PROPOSED_DOCKERFILE_PATH, 'Gate 1G path mismatch');
assertSupabaseNoop(gate1g.supabaseClassification, 'Gate 1G prompt');

const sourceOwnerPrompt = parsed.find((entry) => entry.label === 'worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review').block;
assert(sourceOwnerPrompt.requiredGate1FDecision === DECISION, 'source owner prompt missing Gate 1F decision');
assert(sourceOwnerPrompt.requiredGate1GDecision === gate1g.expectedDecision, 'source owner prompt missing Gate 1G decision');
assert(sourceOwnerPrompt.requiredDockerfileSourcePath === PROPOSED_DOCKERFILE_PATH, 'source owner prompt path mismatch');

const buildProofPrompt = parsed.find((entry) => entry.label === 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan').block;
assert(buildProofPrompt.requiredDockerfileSourcePlanDecision === DECISION, 'build proof prompt missing Gate 1F decision');
assert(buildProofPrompt.requiredActualDockerfileSourceDecision === gate1g.expectedDecision, 'build proof prompt missing Gate 1G decision');
assert(buildProofPrompt.requiredDockerfileSourcePath === PROPOSED_DOCKERFILE_PATH, 'build proof prompt path mismatch');

const packageJson = JSON.parse(read('package.json'));
assert(
  packageJson.scripts?.['sound-runtime-media-gate-1f:diagnostics'] === 'node scripts/validation/sound-runtime-media-gate-1f-diagnostics.mjs',
  'package script missing for Gate 1F diagnostics'
);

assertClosedFlags(parsed.map((entry) => entry.block));
scanUnsafe(DOC_BLOCKS.map(([file]) => file).concat(SOURCE_FILES));

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_1f_diagnostics_passed',
  decision: DECISION,
  proposedFutureDockerfilePath: PROPOSED_DOCKERFILE_PATH,
  actualDockerfileCreated: false,
  dockerBuildRun: false,
  gcpTouched: false,
  supabaseTouched: false,
  sqlExecuted: false
}, null, 2));
