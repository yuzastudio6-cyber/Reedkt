#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_review_passed_with_warnings_ready_for_gate_1e_static_plan';
const CONTRACT_OWNER_DECISION = 'worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan';
const STATIC_CONTRACT_DECISION = 'worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review';
const HANDOFF_DECISION = 'worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan';
const SOURCE_HEAD = '1091f901729334389918f3b1ea28b584ebf7686b';

const DOCS = [
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-review'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-requirement-register.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-requirement-register'],
  ['docs/worker-runtime-jobs-sound-cpu-image-layer-owner-review.md', 'worker-runtime-jobs-sound-cpu-image-layer-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-docker-gcp-blocker-register.md', 'worker-runtime-jobs-sound-cpu-docker-gcp-blocker-register'],
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-claim-policy.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-claim-policy'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1e-dockerfile-static-plan.md', 'sound-runtime-media-gate-1e-dockerfile-static-plan'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review']
];

const SOURCE_DOCS = [
  ['docs/worker-runtime-jobs-sound-cpu-contract-owner-review.md', 'worker-runtime-jobs-sound-cpu-contract-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-contract-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-contract-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-schema-owner-approval-register.md', 'worker-runtime-jobs-sound-cpu-schema-owner-approval-register'],
  ['docs/worker-runtime-jobs-sound-cpu-contract-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-contract-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-contract-runtime-claim-policy.md', 'worker-runtime-jobs-sound-cpu-contract-runtime-claim-policy'],
  ['docs/worker-runtime-jobs-sound-cpu-static-contract-plan.md', 'worker-runtime-jobs-sound-cpu-static-contract-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-static-job-contract-register.md', 'worker-runtime-jobs-sound-cpu-static-job-contract-register'],
  ['docs/worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan.md', 'worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-static-runtime-policy-placeholders.md', 'worker-runtime-jobs-sound-cpu-static-runtime-policy-placeholders'],
  ['docs/worker-runtime-jobs-sound-cpu-static-blocker-register.md', 'worker-runtime-jobs-sound-cpu-static-blocker-register']
];

const REQUIRED_FILES = [
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json',
  'scripts/validation/worker-runtime-jobs-sound-cpu-contract-owner-review-diagnostics.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-static-contract-plan-diagnostics.mjs',
  'scripts/validation/worker-runtime-jobs-sound-cpu-handoff-review-diagnostics.mjs',
  'scripts/validation/sound-runtime-media-gate-1d-diagnostics.mjs',
  'scripts/validation/sound-runtime-media-gate-1c-diagnostics.mjs',
  'scripts/validation/sound-runtime-media-gate-1b-diagnostics.mjs',
  'scripts/validation/sound-runtime-media-gate-1a-diagnostics.mjs',
  'scripts/validation/sound-runtime-media-gate-1-diagnostics.mjs',
  'scripts/validation/sound-runtime-media-gate-0-diagnostics.mjs'
];

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

const REQUIRED_ITEMS = [
  'base image selection',
  'Python runtime layer',
  'requirements install layer',
  'worker code layer',
  'validation/smoke layer',
  'runtime-disabled policy layer',
  'non-root user policy',
  'file permissions policy',
  'package cache policy',
  'pinned requirements path',
  'no FFmpeg/ffprobe',
  'no model weights',
  'no media fixtures',
  'no secrets',
  'no service account files',
  'no artifact write paths',
  'no Supabase credentials',
  'no provider credentials'
];

const LAYERS = [
  'base OS layer',
  'Python runtime layer',
  'system dependencies layer',
  'Python requirements layer',
  'worker code layer',
  'validation/proof layer',
  'runtime-disabled default layer'
];

const BLOCKED_GATES = [
  'SOUND CPU Dockerfile creation',
  'Docker build',
  'Docker push',
  'Artifact Registry',
  'Cloud Run',
  'service account',
  'Secret Manager',
  'GCP APIs',
  'deployment',
  'worker execution',
  'route execution',
  'tool execution',
  'media processing',
  'model weight download',
  'Supabase/SQL',
  'artifact writes',
  'beta/production',
  'runtime readiness'
];

const REQUIREMENTS_PATH = 'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt';
const NO_SCOPE = 'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

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

function assertNoTrueExecutionFlags(objects) {
  const guardedKeys = new Set([
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
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'acceptedForActualDockerfileToday',
    'acceptedForBuildToday',
    'acceptedForExecutionToday',
    'executionAllowedNow',
    'blockedFromBuild',
    'isDockerfileCreation',
    'isDockerBuild',
    'isDockerPush',
    'isImageReadiness',
    'isCloudRunReadiness',
    'isWorkerReadiness',
    'isRuntimeReadiness',
    'isMediaReadiness',
    'isSupabaseReadiness',
    'isArtifactReadiness',
    'isBetaReadiness',
    'isProductionReadiness',
    'isGeneratedLocalFixturePassed',
    'isDryRunPassed'
  ]);

  function walk(value, trail = []) {
    if (value === null || value === undefined || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, trail.concat(String(index))));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (guardedKeys.has(key)) {
        const label = trail.concat(key).join('.');
        if (key === 'blockedFromBuild') {
          assert(child === true, `${label} must stay true`);
        } else if (typeof child === 'boolean') {
          assert(child === false, `${label} must stay false`);
        } else {
          assert(child === 'none' || child === 'no' || child === 'blocked' || child === 'blocked_unclaimed', `${label} must stay false/no/none/blocked`);
        }
      }
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
    /"(dockerfileCreated|dockerBuildRun|dockerPushRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|supabaseTouched|modelWeightsDownloaded|artifactCreated|runtimeReadinessClaimed|workerReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
    /"(acceptedForActualDockerfileToday|acceptedForBuildToday|acceptedForExecutionToday|executionAllowedNow)"\s*:\s*true/,
    /"(isDockerfileCreation|isDockerBuild|isDockerPush|isImageReadiness|isCloudRunReadiness|isWorkerReadiness|isRuntimeReadiness|isMediaReadiness|isSupabaseReadiness|isArtifactReadiness|isBetaReadiness|isProductionReadiness|isGeneratedLocalFixturePassed|isDryRunPassed)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
    /\b(?:signedUrl|signed_url|publicUrl|public_url)\s*[:=]\s*['"][^'"]+['"]/i
  ];
  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) {
      assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`);
    }
  }
}

for (const file of REQUIRED_FILES) assert(existsSync(file), `Missing required source file: ${file}`);

const parsed = Object.fromEntries([...DOCS, ...SOURCE_DOCS].map(([file, label]) => [label, parseBlock(file, label)]));

const review = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-review'];
assert(review.decision === DECISION, 'Dockerfile static review decision mismatch');
assert(review.sourceBase?.head === SOURCE_HEAD, 'Source head mismatch');
assert(review.sourceBase?.pr679?.decision === CONTRACT_OWNER_DECISION, 'PR #679 source decision mismatch');
assert(review.sourceBase?.pr679?.mergeCommit === SOURCE_HEAD, 'PR #679 merge commit mismatch');
assert(review.sourceBase?.pr672?.decision === STATIC_CONTRACT_DECISION, 'PR #672 source decision mismatch');
assert(review.staticDockerfilePlanMayProceed === true, 'Static Dockerfile plan should be allowed to proceed');
assert(review.acceptedForActualDockerfileToday === false, 'Actual Dockerfile creation widened');
assert(review.acceptedForBuildToday === false, 'Build widened');
assert(review.acceptedForExecutionToday === 'none', 'Execution widened');
includeAll(review.acceptedForFutureStaticDockerfilePlanning?.workerNames, WORKERS, 'review workers');
includeAll(review.acceptedForFutureStaticDockerfilePlanning?.imageNames, IMAGES, 'review images');
includeAll(review.acceptedForFutureStaticDockerfilePlanning?.jobTypes, JOB_TYPES, 'review job types');
assert(review.acceptedForFutureStaticDockerfilePlanning?.requirementsPath === REQUIREMENTS_PATH, 'requirements path mismatch');
assert(review.requiredNoScopeStatement === NO_SCOPE, 'No-scope statement mismatch');
assertSupabaseNoop(review.supabaseClassification, 'review');

const requirement = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-requirement-register'];
assert(requirement.decision === DECISION, 'Requirement decision mismatch');
assert(requirement.sourceDecision === CONTRACT_OWNER_DECISION, 'Requirement source decision mismatch');
assert(requirement.acceptedForExecutionToday === 'none', 'Requirement execution widened');
includeAll(requirement.requirementRows.map((row) => row.item), REQUIRED_ITEMS, 'requirement rows');
for (const row of requirement.requirementRows) {
  assert(row.acceptedForStaticPlan === true, `${row.item} should be accepted for static plan`);
  assert(row.acceptedForActualDockerfileToday === false, `${row.item} Dockerfile creation widened`);
  assert(row.acceptedForBuildToday === false, `${row.item} build widened`);
}
assert(requirement.requirementsPath === REQUIREMENTS_PATH, 'requirement register path mismatch');
assertSupabaseNoop(requirement.supabaseClassification, 'requirement');

const layerReview = parsed['worker-runtime-jobs-sound-cpu-image-layer-owner-review'];
assert(layerReview.decision === DECISION, 'Layer review decision mismatch');
includeAll(layerReview.layerRows.map((row) => row.layer), LAYERS, 'layer rows');
for (const row of layerReview.layerRows) {
  assert(row.approvedForStaticPlanning === true, `${row.layer} static planning not approved`);
  assert(row.blockedFromBuild === true, `${row.layer} build not blocked`);
}
includeAll(layerReview.plannedImageNames, IMAGES, 'layer images');

const blocker = parsed['worker-runtime-jobs-sound-cpu-docker-gcp-blocker-register'];
assert(blocker.decision === DECISION, 'Blocker decision mismatch');
includeAll(blocker.blockedGates.map((row) => row.gate), BLOCKED_GATES, 'blocked gates');
for (const row of blocker.blockedGates) {
  assert(row.executionAllowedNow === false, `${row.gate} execution widened`);
}
includeAll(blocker.blockedStatusStringsPreserved, [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'worker_ready',
  'runtime_ready',
  'media_ready',
  'image_ready',
  'cloud_run_ready',
  'supabase_ready',
  'artifact_ready',
  'beta_ready',
  'production_ready'
], 'blocked status strings');
assertSupabaseNoop(blocker.supabaseClassification, 'blocker');

const claimPolicy = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-claim-policy'];
assert(claimPolicy.decision === DECISION, 'Claim policy decision mismatch');
assert(claimPolicy.policy === 'dockerfile_static_review_is_not_dockerfile_creation_build_or_readiness', 'Claim policy mismatch');
assert(claimPolicy.acceptedForExecutionToday === 'none', 'Claim policy execution widened');
assert(claimPolicy.nextAllowedGate === 'SOUND-RUNTIME-MEDIA-GATE-1E', 'Next gate mismatch');
assertSupabaseNoop(claimPolicy.supabaseClassification, 'claim policy');

const gate1e = parsed['sound-runtime-media-gate-1e-dockerfile-static-plan'];
assert(gate1e.contractOwnerReviewRequiredDecision === CONTRACT_OWNER_DECISION, 'Gate 1E contract owner decision mismatch');
assert(gate1e.dockerfileStaticReviewMilestone === 'WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW', 'Gate 1E missing Dockerfile static review milestone');
assert(gate1e.dockerfileStaticReviewRequiredDecision === DECISION, 'Gate 1E missing Dockerfile static review decision');
assert(gate1e.sourceEvidenceRequired?.includes('WORKER_RUNTIME_JOBS SOUND CPU Dockerfile static review'), 'Gate 1E missing Dockerfile static review evidence');
assert(gate1e.requiredNoScopeStatement === NO_SCOPE, 'Gate 1E no-scope mismatch');
assertSupabaseNoop(gate1e.supabaseClassification, 'Gate 1E');

const ownerPrompt = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review'];
assert(ownerPrompt.prerequisiteDecision === DECISION, 'Owner prompt prerequisite decision mismatch');
includeAll(ownerPrompt.acceptedPlanningOnly?.workerNames, WORKERS, 'owner prompt workers');
includeAll(ownerPrompt.acceptedPlanningOnly?.imageNames, IMAGES, 'owner prompt images');
includeAll(ownerPrompt.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'owner prompt job types');
assert(ownerPrompt.requiredNoScopeStatement === NO_SCOPE, 'Owner prompt no-scope mismatch');
assertSupabaseNoop(ownerPrompt.supabaseClassification, 'owner prompt');

const contractReview = parsed['worker-runtime-jobs-sound-cpu-contract-owner-review'];
assert(contractReview.decision === CONTRACT_OWNER_DECISION, 'Contract owner source decision mismatch');
includeAll(contractReview.acceptedPlanningOnly?.workerNames, WORKERS, 'contract review workers');
includeAll(contractReview.acceptedPlanningOnly?.imageNames, IMAGES, 'contract review images');
includeAll(contractReview.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'contract review job types');

const staticPlan = parsed['worker-runtime-jobs-sound-cpu-static-contract-plan'];
assert(staticPlan.decision === STATIC_CONTRACT_DECISION, 'Static contract source decision mismatch');
assert(staticPlan.sourceBase?.pr670?.decision === HANDOFF_DECISION, 'Handoff source decision mismatch');

const packageJson = JSON.parse(read('package.json'));
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-dockerfile-static-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-static-review-diagnostics.mjs',
  'package script mismatch'
);

const ownershipText = read('docs/cross-chat-tool-ownership-registry.md');
assert(ownershipText.includes('WORKER_RUNTIME_JOBS'), 'Ownership registry missing WORKER_RUNTIME_JOBS');

assertNoTrueExecutionFlags(Object.values(parsed));
scanUnsafe([...DOCS.map(([file]) => file), ...SOURCE_DOCS.map(([file]) => file)]);

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_dockerfile_static_review_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  sourceDecision: CONTRACT_OWNER_DECISION,
  staticDockerfilePlanMayProceed: true,
  acceptedWorkers: WORKERS,
  acceptedImages: IMAGES,
  acceptedJobTypes: JOB_TYPES,
  requirementRows: requirement.requirementRows.length,
  layerRows: layerReview.layerRows.length,
  blockedGateCount: blocker.blockedGates.length,
  dockerfileCreated: false,
  dockerBuildRun: false,
  dockerPushRun: false,
  gcpTouched: false,
  supabaseClassification: review.supabaseClassification
}, null, 2));
