#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const DECISION = 'sound_runtime_media_gate_1e_dockerfile_static_plan_completed_with_warnings_ready_for_dockerfile_static_owner_review';
const SOURCE_HEAD = '1188355ac866735f9ff9aa676c7bb30c4e9cb815';
const PR684_DECISION = 'worker_runtime_jobs_sound_cpu_dockerfile_static_review_passed_with_warnings_ready_for_gate_1e_static_plan';
const PR679_DECISION = 'worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan';
const PR672_DECISION = 'worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review';
const PR670_DECISION = 'worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan';
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

const PINNED_PACKAGES = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval'
];

const DOCS = [
  ['docs/sound-runtime-media-gate-1e-dockerfile-static-plan.md', 'sound-runtime-media-gate-1e-dockerfile-static-plan'],
  ['docs/sound-runtime-media-gate-1e-proposed-dockerfile-spec.md', 'sound-runtime-media-gate-1e-proposed-dockerfile-spec'],
  ['docs/sound-runtime-media-gate-1e-static-image-file-layout-plan.md', 'sound-runtime-media-gate-1e-static-image-file-layout-plan'],
  ['docs/sound-runtime-media-gate-1e-package-install-layer-plan.md', 'sound-runtime-media-gate-1e-package-install-layer-plan'],
  ['docs/sound-runtime-media-gate-1e-static-security-policy-plan.md', 'sound-runtime-media-gate-1e-static-security-policy-plan'],
  ['docs/sound-runtime-media-gate-1e-static-validation-ci-plan.md', 'sound-runtime-media-gate-1e-static-validation-ci-plan'],
  ['docs/sound-runtime-media-gate-1e-excluded-runtime-register.md', 'sound-runtime-media-gate-1e-excluded-runtime-register']
];

const PROMPTS = [
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1f-dockerfile-source-creation-plan.md', 'sound-runtime-media-gate-1f-dockerfile-source-creation-plan'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-docker-build-proof-plan.md', 'worker-runtime-jobs-sound-cpu-docker-build-proof-plan']
];

const SOURCE_BLOCKS = [
  ['docs/worker-runtime-jobs-sound-cpu-dockerfile-static-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-review'],
  ['docs/worker-runtime-jobs-sound-cpu-contract-owner-review.md', 'worker-runtime-jobs-sound-cpu-contract-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-static-contract-plan.md', 'worker-runtime-jobs-sound-cpu-static-contract-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-handoff-review.md', 'worker-runtime-jobs-sound-cpu-handoff-review'],
  ['docs/sound-runtime-media-gate-1d-worker-runtime-owner-handoff.md', 'sound-runtime-media-gate-1d-worker-runtime-owner-handoff'],
  ['docs/sound-runtime-media-gate-1c-cpu-worker-image-plan.md', 'sound-runtime-media-gate-1c-cpu-worker-image-plan'],
  ['docs/sound-runtime-media-gate-1b-worker-contract-owner-review.md', 'sound-runtime-media-gate-1b-worker-contract-owner-review'],
  ['docs/sound-runtime-media-gate-1a-controlled-cpu-install-proof-result.md', 'sound-runtime-media-gate-1a-controlled-cpu-install-proof-result'],
  ['docs/sound-runtime-media-gate-1-cpu-worker-install-plan.md', 'sound-runtime-media-gate-1-cpu-worker-install-plan'],
  ['docs/sound-runtime-media-gate-0-runtime-tool-inventory.md', 'sound-runtime-media-gate-0-runtime-tool-inventory']
];

const REQUIRED_FILES = [
  REQUIREMENTS_PATH,
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json',
  'scripts/validation/worker-runtime-jobs-sound-cpu-dockerfile-static-review-diagnostics.mjs',
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

const BLOCKED_STATUS_STRINGS = [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime_ready',
  'worker_ready',
  'media_ready',
  'docker_ready',
  'cloud_run_ready',
  'supabase_ready',
  'artifact_ready',
  'beta_ready',
  'production_ready'
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

function assertFalse(value, label) {
  assert(value === false || value === 'no' || value === 'none' || value === 'blocked', `${label} must stay false/no/none/blocked`);
}

function assertRuntimeFlagsStayClosed(objects) {
  const guardedFalseKeys = new Set([
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
    'mediaReadinessClaimed',
    'dockerReadinessClaimed',
    'cloudRunReadinessClaimed',
    'supabaseReadinessClaimed',
    'artifactReadinessClaimed',
    'betaReadinessClaimed',
    'productionReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'implementedNow',
    'createdNow',
    'copiedNow',
    'executionAllowedNow',
    'installCommandExecutedNow',
    'containerLayerCreatedNow',
    'packageCachePersistedNow',
    'importSmokeExecutedInContainerNow',
    'mediaOpenAllowed',
    'pydubMediaOperationAllowed',
    'artifactWritePathsPlanned',
    'mediaFixturePathsPlanned',
    'modelWeightPathsPlanned',
    'secretPathsPlanned',
    'serviceAccountPathsPlanned'
  ]);

  function walk(value, trail = []) {
    if (value === null || value === undefined || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, trail.concat(String(index))));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      const label = trail.concat(key).join('.');
      if (guardedFalseKeys.has(key)) assertFalse(child, label);
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
    /"(actualDockerfileCreated|actualDockerfileModified|dockerfileCreated|dockerBuildRun|dockerPushRun|gcpTouched|cloudRunTouched|secretManagerTouched|workerExecutionRun|routeExecutionRun|toolExecutionRun|mediaProcessingRun|supabaseTouched|modelWeightsDownloaded|artifactCreated|runtimeReadinessClaimed|workerReadinessClaimed|mediaReadinessClaimed|dockerReadinessClaimed|cloudRunReadinessClaimed|supabaseReadinessClaimed|artifactReadinessClaimed|betaReadinessClaimed|productionReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
    /"(executionAllowedNow|implementedNow|createdNow|copiedNow|installCommandExecutedNow|containerLayerCreatedNow|importSmokeExecutedInContainerNow|mediaOpenAllowed|pydubMediaOperationAllowed)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i
  ];
  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) {
      assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`);
    }
  }
}

function findForbiddenGate1eOutputs() {
  const forbiddenBasenames = new Set([
    'Dockerfile',
    'Dockerfile.sound-cpu-analysis-worker',
    'Dockerfile.sound-audio-metadata-worker',
    '.dockerignore',
    'cloudbuild.sound-cpu-analysis-worker.yaml',
    'cloudbuild.sound-audio-metadata-worker.yaml'
  ]);
  const roots = ['.', 'docker', 'server', 'cloudbuild'];
  const findings = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      if (entry === '.git' || entry === 'node_modules' || entry === 'dist' || entry === 'dist-server') continue;
      const path = join(dir, entry);
      let stats;
      try {
        stats = statSync(path);
      } catch {
        continue;
      }
      if (stats.isDirectory()) {
        walk(path);
      } else if (forbiddenBasenames.has(basename(path)) && path.includes('sound-cpu')) {
        findings.push(path);
      }
    }
  }
  roots.forEach(walk);
  return findings;
}

for (const file of REQUIRED_FILES) assert(existsSync(file), `Missing source file: ${file}`);

const parsed = Object.fromEntries([...DOCS, ...PROMPTS, ...SOURCE_BLOCKS].map(([file, label]) => [label, parseBlock(file, label)]));

const staticPlan = parsed['sound-runtime-media-gate-1e-dockerfile-static-plan'];
assert(staticPlan.decision === DECISION, 'Gate 1E decision mismatch');
assert(staticPlan.sourceBase?.head === SOURCE_HEAD, 'Gate 1E source head mismatch');
assert(staticPlan.sourceBase?.pr684?.mergeCommit === SOURCE_HEAD, 'PR #684 merge commit mismatch');
assert(staticPlan.sourceBase?.pr684?.decision === PR684_DECISION, 'PR #684 decision mismatch');
assert(staticPlan.sourceBase?.pr679?.decision === PR679_DECISION, 'PR #679 decision mismatch');
assert(staticPlan.sourceBase?.pr672?.decision === PR672_DECISION, 'PR #672 decision mismatch');
assert(staticPlan.sourceBase?.pr670?.decision === PR670_DECISION, 'PR #670 decision mismatch');
includeAll(staticPlan.acceptedPlanningSurface?.workers, WORKERS, 'Gate 1E workers');
includeAll(staticPlan.acceptedPlanningSurface?.images, IMAGES, 'Gate 1E images');
includeAll(staticPlan.acceptedPlanningSurface?.jobTypes, JOB_TYPES, 'Gate 1E job types');
assert(staticPlan.acceptedPlanningSurface?.requirementsSource === REQUIREMENTS_PATH, 'Gate 1E requirements source mismatch');
assert(staticPlan.gate1eArtifacts?.length === 7, 'Gate 1E doc count mismatch');
assert(staticPlan.requiredNoScopeStatement === NO_SCOPE, 'Gate 1E no-scope statement mismatch');
assertSupabaseNoop(staticPlan.supabaseClassification, 'Gate 1E');

const spec = parsed['sound-runtime-media-gate-1e-proposed-dockerfile-spec'];
assert(spec.decision === DECISION, 'spec decision mismatch');
assert(spec.sourceDecision === PR684_DECISION, 'spec source decision mismatch');
includeAll(spec.plannedImages, IMAGES, 'spec images');
includeAll(spec.plannedWorkers, WORKERS, 'spec workers');
assert(spec.specStatus === 'static_planning_only_no_source_file_created', 'spec status mismatch');
assert(spec.instructionFamilies?.length >= 6, 'spec instruction families incomplete');
includeAll(spec.explicitNonOutputs, ['Dockerfile', '.dockerignore', 'Cloud Build config', 'worker entrypoint'], 'spec nonoutputs');

const layout = parsed['sound-runtime-media-gate-1e-static-image-file-layout-plan'];
assert(layout.decision === DECISION, 'layout decision mismatch');
assert(layout.layoutStatus === 'static_layout_plan_only', 'layout status mismatch');
assert(layout.plannedLayoutRows?.length >= 5, 'layout rows incomplete');
includeAll(layout.forbiddenLayoutInputs, ['raw prompts', 'signed URLs as source of truth', 'media file paths', 'model-weight locations'], 'layout forbidden inputs');

const packageLayer = parsed['sound-runtime-media-gate-1e-package-install-layer-plan'];
assert(packageLayer.decision === DECISION, 'package layer decision mismatch');
assert(packageLayer.requirementsSource === REQUIREMENTS_PATH, 'package layer requirements mismatch');
assert(packageLayer.directPinnedPackageCount === 13, 'pinned package count mismatch');
includeAll(packageLayer.directPinnedPackages, PINNED_PACKAGES, 'pinned packages');
assert(packageLayer.cpuInstallCandidateCount === 15, 'CPU install candidate count mismatch');
assert(packageLayer.excludedToolCounts?.modelWeightGpuTools === 12, 'model/GPU exclusion count mismatch');
assert(packageLayer.excludedToolCounts?.systemBinaryHandoffTools === 15, 'system/binary exclusion count mismatch');
assert(packageLayer.excludedToolCounts?.blockedEvaluationTools === 5, 'blocked/evaluation exclusion count mismatch');
assert(packageLayer.excludedToolCounts?.providerTools === 3, 'provider exclusion count mismatch');

const security = parsed['sound-runtime-media-gate-1e-static-security-policy-plan'];
assert(security.decision === DECISION, 'security decision mismatch');
assert(security.requiredFuturePolicies?.length >= 6, 'security policies incomplete');
includeAll(security.rejectedDataClasses, ['secrets', 'service account JSON', 'signed URLs', 'database URLs'], 'security rejected data classes');
assertSupabaseNoop(security.supabaseClassification, 'security');

const ci = parsed['sound-runtime-media-gate-1e-static-validation-ci-plan'];
assert(ci.decision === DECISION, 'CI decision mismatch');
assert(ci.futureStaticValidationRows?.length >= 6, 'CI rows incomplete');
assert(ci.currentValidationCommands?.includes('npm run sound-runtime-media-gate-1e:diagnostics'), 'CI missing Gate 1E diagnostics');

const excluded = parsed['sound-runtime-media-gate-1e-excluded-runtime-register'];
assert(excluded.decision === DECISION, 'excluded register decision mismatch');
assert(excluded.excludedRows?.length >= 16, 'excluded rows incomplete');
includeAll(excluded.blockedStatusStringsPreserved, BLOCKED_STATUS_STRINGS, 'blocked status strings');
assert(excluded.excludedToolCounts?.modelWeightGpuTools === 12, 'excluded model count mismatch');
assert(excluded.excludedToolCounts?.systemBinaryHandoffTools === 15, 'excluded system count mismatch');
assert(excluded.excludedToolCounts?.blockedEvaluationTools === 5, 'excluded eval count mismatch');
assertSupabaseNoop(excluded.supabaseClassification, 'excluded');

const ownerPrompt = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-owner-review'];
assert(ownerPrompt.requiredSourceDecision === DECISION, 'owner prompt required source decision mismatch');
assert(ownerPrompt.requiredSourceHead === SOURCE_HEAD, 'owner prompt required source head mismatch');
assert(ownerPrompt.prerequisiteDecision === PR684_DECISION, 'owner prompt prerequisite mismatch');
includeAll(ownerPrompt.acceptedPlanningOnly?.workerNames, WORKERS, 'owner prompt workers');
includeAll(ownerPrompt.acceptedPlanningOnly?.imageNames, IMAGES, 'owner prompt images');
includeAll(ownerPrompt.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'owner prompt job types');
assert(ownerPrompt.requiredNoScopeStatement === NO_SCOPE, 'owner prompt no-scope mismatch');
assertSupabaseNoop(ownerPrompt.supabaseClassification, 'owner prompt');

const gate1f = parsed['sound-runtime-media-gate-1f-dockerfile-source-creation-plan'];
assert(gate1f.requiredSourceDecision === DECISION, 'Gate 1F prompt source decision mismatch');
includeAll(gate1f.acceptedPlanningOnly?.workers, WORKERS, 'Gate 1F workers');
includeAll(gate1f.acceptedPlanningOnly?.images, IMAGES, 'Gate 1F images');
includeAll(gate1f.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'Gate 1F job types');
assert(gate1f.requiredNoScopeStatement === NO_SCOPE, 'Gate 1F no-scope mismatch');
assertSupabaseNoop(gate1f.supabaseClassification, 'Gate 1F');

const buildProof = parsed['worker-runtime-jobs-sound-cpu-docker-build-proof-plan'];
assert(buildProof.requiredPriorDecision === DECISION, 'Docker build proof prompt prior decision mismatch');
includeAll(buildProof.acceptedPlanningOnly?.workers, WORKERS, 'build proof workers');
includeAll(buildProof.acceptedPlanningOnly?.images, IMAGES, 'build proof images');
includeAll(buildProof.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'build proof job types');
includeAll(buildProof.readinessClaimsRemainBlocked, BLOCKED_STATUS_STRINGS, 'build proof blocked statuses');
assert(buildProof.requiredNoScopeStatement === NO_SCOPE, 'build proof no-scope mismatch');
assertSupabaseNoop(buildProof.supabaseClassification, 'build proof');

const sourceReview = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-review'];
assert(sourceReview.decision === PR684_DECISION, 'source PR #684 decision mismatch');
assert(sourceReview.sourceBase?.pr679?.decision === PR679_DECISION, 'source PR #679 decision mismatch');
includeAll(sourceReview.acceptedForFutureStaticDockerfilePlanning?.workerNames, WORKERS, 'source review workers');
includeAll(sourceReview.acceptedForFutureStaticDockerfilePlanning?.imageNames, IMAGES, 'source review images');
includeAll(sourceReview.acceptedForFutureStaticDockerfilePlanning?.jobTypes, JOB_TYPES, 'source review job types');

assert(parsed['worker-runtime-jobs-sound-cpu-contract-owner-review'].decision === PR679_DECISION, 'contract owner source decision mismatch');
assert(parsed['worker-runtime-jobs-sound-cpu-static-contract-plan'].decision === PR672_DECISION, 'static contract source decision mismatch');
assert(parsed['worker-runtime-jobs-sound-cpu-handoff-review'].decision === PR670_DECISION, 'handoff source decision mismatch');

const packageJson = JSON.parse(read('package.json'));
assert(
  packageJson.scripts?.['sound-runtime-media-gate-1e:diagnostics'] ===
    'node scripts/validation/sound-runtime-media-gate-1e-diagnostics.mjs',
  'package script mismatch'
);

assert(read('docs/cross-chat-tool-ownership-registry.md').includes('WORKER_RUNTIME_JOBS'), 'ownership registry missing WORKER_RUNTIME_JOBS');

const forbiddenGateOutputs = findForbiddenGate1eOutputs();
assert(forbiddenGateOutputs.length === 0, `Unexpected SOUND CPU Dockerfile output(s): ${forbiddenGateOutputs.join(', ')}`);

assertRuntimeFlagsStayClosed(Object.values(parsed));
scanUnsafe([...DOCS.map(([file]) => file), ...PROMPTS.map(([file]) => file)]);

console.log(JSON.stringify({
  status: 'sound_runtime_media_gate_1e_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  pr684Decision: PR684_DECISION,
  docsVerified: DOCS.length,
  promptsVerified: PROMPTS.length,
  workers: WORKERS,
  images: IMAGES,
  jobTypes: JOB_TYPES,
  pinnedPackageCount: packageLayer.directPinnedPackageCount,
  cpuInstallCandidateCount: packageLayer.cpuInstallCandidateCount,
  actualDockerfileCreated: false,
  dockerBuildRun: false,
  dockerPushRun: false,
  gcpTouched: false,
  supabaseClassification: staticPlan.supabaseClassification
}, null, 2));
