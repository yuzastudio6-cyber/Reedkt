#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan';
const STATIC_DECISION = 'worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review';
const HANDOFF_DECISION = 'worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan';
const SOURCE_HEAD = 'f39db99f89a21634b8edc4fee38af39d2df05fbb';
const PR670_MERGE = 'f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc';

const NEW_DOCS = [
  ['docs/worker-runtime-jobs-sound-cpu-contract-owner-review.md', 'worker-runtime-jobs-sound-cpu-contract-owner-review'],
  ['docs/worker-runtime-jobs-sound-cpu-contract-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-contract-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-schema-owner-approval-register.md', 'worker-runtime-jobs-sound-cpu-schema-owner-approval-register'],
  ['docs/worker-runtime-jobs-sound-cpu-contract-blocker-follow-up-register.md', 'worker-runtime-jobs-sound-cpu-contract-blocker-follow-up-register'],
  ['docs/worker-runtime-jobs-sound-cpu-contract-runtime-claim-policy.md', 'worker-runtime-jobs-sound-cpu-contract-runtime-claim-policy'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-dockerfile-static-review.md', 'worker-runtime-jobs-sound-cpu-dockerfile-static-review'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1e-dockerfile-static-plan.md', 'sound-runtime-media-gate-1e-dockerfile-static-plan']
];

const SOURCE_DOCS = [
  ['docs/worker-runtime-jobs-sound-cpu-static-contract-plan.md', 'worker-runtime-jobs-sound-cpu-static-contract-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-static-job-contract-register.md', 'worker-runtime-jobs-sound-cpu-static-job-contract-register'],
  ['docs/worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan.md', 'worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-static-runtime-policy-placeholders.md', 'worker-runtime-jobs-sound-cpu-static-runtime-policy-placeholders'],
  ['docs/worker-runtime-jobs-sound-cpu-static-blocker-register.md', 'worker-runtime-jobs-sound-cpu-static-blocker-register'],
  ['docs/worker-runtime-jobs-sound-cpu-handoff-review.md', 'worker-runtime-jobs-sound-cpu-handoff-review'],
  ['docs/worker-runtime-jobs-sound-cpu-acceptance-register.md', 'worker-runtime-jobs-sound-cpu-acceptance-register'],
  ['docs/worker-runtime-jobs-sound-cpu-runtime-blocker-map.md', 'worker-runtime-jobs-sound-cpu-runtime-blocker-map'],
  ['docs/worker-runtime-jobs-sound-cpu-job-schema-review.md', 'worker-runtime-jobs-sound-cpu-job-schema-review'],
  ['docs/sound-runtime-media-gate-1d-worker-runtime-owner-handoff.md', 'sound-runtime-media-gate-1d-worker-runtime-owner-handoff'],
  ['docs/sound-runtime-media-gate-1c-runtime-disabled-default-policy.md', 'sound-runtime-media-gate-1c-runtime-disabled-default-policy']
];

const REQUIRED_FILES = [
  'docs/cross-chat-tool-ownership-registry.md',
  'package.json',
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

const REQUIRED_FIELDS = [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'imageName',
  'jobType',
  'attempt',
  'maxAttempts',
  'staticRuntimeFlags'
];

const PLACEHOLDERS = [
  'dispatch',
  'claim',
  'lease',
  'retry',
  'timeout',
  'idempotency',
  'observability',
  'cost',
  'artifact',
  'supabase'
];

const REJECTED_SOURCES = [
  'raw prompts',
  'signed URLs as source of truth',
  'media file paths',
  'provider output blobs',
  'secrets',
  'service-role payloads',
  'model-weight locations',
  'artifact write targets'
];

const BLOCKED_JOB_TYPES = [
  'sound.open_media_file',
  'sound.process_real_audio',
  'sound.pydub_media_operation',
  'sound.ffmpeg_audio_extract',
  'sound.write_audio_artifact',
  'sound.generate_music',
  'sound.generate_sfx',
  'sound.download_model_weights'
];

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

function strings(value) {
  if (value === null || value === undefined) return [];
  if (typeof value !== 'object') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(strings);
  return Object.values(value).flatMap(strings);
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`);
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`);
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`);
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`);
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`);
}

function assertNoExecutionFlags(objects) {
  const guardedKeys = new Set([
    'workerExecutionRun',
    'routeExecutionRun',
    'toolExecutionRun',
    'dockerBuildRun',
    'gcpTouched',
    'cloudRunTouched',
    'secretManagerTouched',
    'mediaProcessingRun',
    'supabaseTouched',
    'sqlExecuted',
    'modelWeightsDownloaded',
    'artifactCreated',
    'runtimeReadinessClaimed',
    'workerReadinessClaimed',
    'generatedLocalFixturePassedClaimed',
    'dryRunPassedClaimed',
    'acceptedForExecutionToday',
    'executionAllowedNow',
    'approvedForRuntimeSchemaImplementation',
    'isWorkerReadiness',
    'isRuntimeReadiness',
    'isRouteReadiness',
    'isToolExecutionReadiness',
    'isMediaReadiness',
    'isDockerReadiness',
    'isGcpReadiness',
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
        if (typeof child === 'boolean') {
          assert(child === false, `${label} must be false`);
        } else {
          assert(child === 'none' || child === 'no' || child === 'blocked_unclaimed', `${label} must stay false/no/none/blocked_unclaimed`);
        }
      }
      walk(child, trail.concat(key));
    }
  }

  for (const object of objects) walk(object);
}

function scanUnsafe(files) {
  const patterns = [
    /https:\/\/[a-z0-9.-]+\.supabase\.co/i,
    /\b(?:postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}\b/i,
    /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
    /\bAIza[0-9A-Za-z_-]{20,}\b/,
    /"(workerExecutionRun|routeExecutionRun|toolExecutionRun|dockerBuildRun|gcpTouched|cloudRunTouched|secretManagerTouched|mediaProcessingRun|supabaseTouched|modelWeightsDownloaded|artifactCreated|runtimeReadinessClaimed|workerReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
    /"(isWorkerReadiness|isRuntimeReadiness|isRouteReadiness|isToolExecutionReadiness|isMediaReadiness|isDockerReadiness|isGcpReadiness|isSupabaseReadiness|isArtifactReadiness|isBetaReadiness|isProductionReadiness|isGeneratedLocalFixturePassed|isDryRunPassed)"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
    /"(runtimeReadiness|workerReadiness|mediaProcessingReadiness|dockerBuild|cloudRun|modelWeightDownload|productionReadiness|betaReadiness)"\s*:\s*"(enabled|passed|ready|unlocked|executed|deployed|called|completed)"/i,
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
assert(!existsSync('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-contract-fix.md'), 'Unexpected contract fix prompt exists');

const parsed = Object.fromEntries([...NEW_DOCS, ...SOURCE_DOCS].map(([file, label]) => [label, parseBlock(file, label)]));

const review = parsed['worker-runtime-jobs-sound-cpu-contract-owner-review'];
assert(review.decision === DECISION, 'Owner review decision mismatch');
assert(review.sourceBase?.head === SOURCE_HEAD, 'Source head mismatch');
assert(review.sourceBase?.pr672?.decision === STATIC_DECISION, 'PR #672 decision mismatch');
assert(review.sourceBase?.pr672?.mergeCommit === SOURCE_HEAD, 'PR #672 merge commit mismatch');
assert(review.sourceBase?.pr670?.decision === HANDOFF_DECISION, 'PR #670 decision mismatch');
assert(review.sourceBase?.pr670?.mergeCommit === PR670_MERGE, 'PR #670 merge commit mismatch');
includeAll(review.acceptedPlanningOnly?.workerNames, WORKERS, 'review workers');
includeAll(review.acceptedPlanningOnly?.imageNames, IMAGES, 'review images');
includeAll(review.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'review job types');
includeAll(review.acceptedRequiredStaticFields, REQUIRED_FIELDS, 'review required fields');
includeAll(review.acceptedRejectedUnsafePayloadSources, REJECTED_SOURCES, 'review rejected sources');
includeAll(review.acceptedPlaceholderOnlyPolicies, PLACEHOLDERS, 'review placeholder policies');
assert(review.acceptedForExecutionToday === 'none', 'Owner review must accept no execution today');
assert(review.fixPromptCreated === false, 'Fix prompt must not be created for passing review');
assert(review.requiredNoScopeStatement === NO_SCOPE, 'No-scope statement mismatch');
assertSupabaseNoop(review.supabaseClassification, 'review');

const acceptance = parsed['worker-runtime-jobs-sound-cpu-contract-acceptance-register'];
assert(acceptance.decision === DECISION, 'Acceptance decision mismatch');
assert(acceptance.sourceDecision === STATIC_DECISION, 'Acceptance source decision mismatch');
assert(acceptance.acceptedForExecutionToday === 'none', 'Acceptance must accept no execution today');
const acceptedItems = acceptance.acceptanceRows.map((row) => row.item);
includeAll(acceptedItems, [...WORKERS, ...IMAGES, ...JOB_TYPES, ...REQUIRED_FIELDS], 'acceptance items');
for (const row of acceptance.acceptanceRows) {
  assert(row.acceptedForStaticContract === true, `${row.item} should be accepted for static contract`);
  assert(row.acceptedForExecutionToday === false, `${row.item} execution widened`);
}
includeAll(acceptance.rejectedUnsafeSourcesAcceptedForStaticRejection, REJECTED_SOURCES, 'acceptance rejected sources');
assertSupabaseNoop(acceptance.supabaseClassification, 'acceptance');

const schema = parsed['worker-runtime-jobs-sound-cpu-schema-owner-approval-register'];
assert(schema.decision === DECISION, 'Schema owner decision mismatch');
assert(schema.sourceDecision === STATIC_DECISION, 'Schema source decision mismatch');
assert(schema.schemaImplementationAdded === false, 'Schema implementation must not be added');
assert(schema.acceptedForExecutionToday === 'none', 'Schema must accept no execution today');
assert(schema.acceptedSchemaRows?.length === 4, 'Expected four accepted schema rows');
for (const jobType of JOB_TYPES) {
  const row = schema.acceptedSchemaRows.find((item) => item.jobType === jobType);
  assert(row, `Missing schema row for ${jobType}`);
  assert(WORKERS.includes(row.workerName), `${jobType} worker not accepted`);
  assert(IMAGES.includes(row.imageName), `${jobType} image not accepted`);
  assert(row.approvedForStaticPlanning === true, `${jobType} not approved for static planning`);
  assert(row.approvedForRuntimeSchemaImplementation === false, `${jobType} runtime schema implementation widened`);
}
includeAll(schema.requiredStaticFieldsAccepted, REQUIRED_FIELDS, 'schema required fields');
includeAll(schema.placeholderPoliciesAcceptedAsPlaceholdersOnly, PLACEHOLDERS, 'schema placeholder policies');
includeAll(schema.unsafePayloadSourcesRejected, REJECTED_SOURCES, 'schema rejected sources');

const blocker = parsed['worker-runtime-jobs-sound-cpu-contract-blocker-follow-up-register'];
assert(blocker.decision === DECISION, 'Blocker decision mismatch');
assert(blocker.fixPromptCreated === false, 'Blocker register should not create fix prompt');
assert(blocker.acceptedForExecutionToday === 'none', 'Blocker register must accept no execution today');
includeAll(blocker.blockedJobTypes.map((row) => row.jobType), BLOCKED_JOB_TYPES, 'blocked job types');
for (const row of [...blocker.blockedJobTypes, ...blocker.blockedGates]) {
  assert(row.executionAllowedNow === false, `${row.jobType ?? row.gate} execution widened`);
}
includeAll(blocker.blockedStatusStringsPreserved, [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'worker_ready',
  'runtime_ready',
  'media_ready',
  'docker_ready',
  'gcp_ready',
  'supabase_ready',
  'artifact_ready',
  'beta_ready',
  'production_ready'
], 'blocked status strings');
assertSupabaseNoop(blocker.supabaseClassification, 'blocker');

const policy = parsed['worker-runtime-jobs-sound-cpu-contract-runtime-claim-policy'];
assert(policy.decision === DECISION, 'Runtime claim policy decision mismatch');
assert(policy.policy === 'static_contract_acceptance_is_not_runtime_readiness', 'Runtime claim policy mismatch');
assert(policy.acceptedForExecutionToday === 'none', 'Runtime policy must accept no execution today');
includeAll(policy.allowedLanguage, [
  'accepted for future static planning',
  'placeholder-only policy',
  'blocked or unclaimed',
  'owner review passed with warnings',
  'no execution enabled'
], 'allowed language');
includeAll(policy.forbiddenClaimLanguage, [
  'worker readiness passed',
  'runtime readiness passed',
  'Docker build ready',
  'Cloud Run ready',
  'media processing ready',
  'Supabase ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'beta ready',
  'production ready'
], 'forbidden claim language');
assertSupabaseNoop(policy.supabaseClassification, 'policy');

const nextPrompt = parsed['worker-runtime-jobs-sound-cpu-dockerfile-static-review'];
assert(nextPrompt.requiredDecision === DECISION, 'Next prompt required decision mismatch');
assert(nextPrompt.staticContractRequiredDecision === STATIC_DECISION, 'Next prompt static contract decision mismatch');
includeAll(nextPrompt.acceptedPlanningOnly?.workerNames, WORKERS, 'next prompt workers');
includeAll(nextPrompt.acceptedPlanningOnly?.imageNames, IMAGES, 'next prompt images');
includeAll(nextPrompt.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'next prompt job types');
assert(nextPrompt.requiredNoScopeStatement === NO_SCOPE, 'Next prompt no-scope mismatch');
assertSupabaseNoop(nextPrompt.supabaseClassification, 'next prompt');

const gate1e = parsed['sound-runtime-media-gate-1e-dockerfile-static-plan'];
assert(gate1e.staticContractRequiredDecision === STATIC_DECISION, 'Gate 1E static contract decision mismatch');
assert(gate1e.contractOwnerReviewMilestone === 'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTRACT-OWNER-REVIEW', 'Gate 1E missing contract owner review milestone');
assert(gate1e.contractOwnerReviewRequiredDecision === DECISION, 'Gate 1E missing contract owner review decision');
assert(gate1e.sourceEvidenceRequired?.includes('WORKER_RUNTIME_JOBS SOUND CPU contract owner review'), 'Gate 1E missing contract owner review evidence');
assert(gate1e.requiredNoScopeStatement === NO_SCOPE, 'Gate 1E no-scope mismatch');
assertSupabaseNoop(gate1e.supabaseClassification, 'Gate 1E');

const staticPlan = parsed['worker-runtime-jobs-sound-cpu-static-contract-plan'];
assert(staticPlan.decision === STATIC_DECISION, 'Static contract source decision mismatch');
includeAll(staticPlan.acceptedPlanningOnly?.workerNames, WORKERS, 'static plan workers');
includeAll(staticPlan.acceptedPlanningOnly?.imageNames, IMAGES, 'static plan images');
includeAll(staticPlan.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'static plan job types');
includeAll(staticPlan.requiredStaticContractFields, REQUIRED_FIELDS, 'static plan fields');
includeAll(staticPlan.placeholderOnlyPolicies, PLACEHOLDERS, 'static plan placeholders');
includeAll(staticPlan.explicitlyRejectedPayloadSources, REJECTED_SOURCES, 'static plan rejected sources');

const handoff = parsed['worker-runtime-jobs-sound-cpu-handoff-review'];
assert(handoff.decision === HANDOFF_DECISION, 'Handoff source decision mismatch');

const ownershipText = read('docs/cross-chat-tool-ownership-registry.md');
assert(ownershipText.includes('WORKER_RUNTIME_JOBS'), 'Ownership registry missing WORKER_RUNTIME_JOBS');

const packageJson = JSON.parse(read('package.json'));
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-contract-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-contract-owner-review-diagnostics.mjs',
  'package script mismatch'
);

const parsedObjects = Object.values(parsed);
assertNoExecutionFlags(parsedObjects);

for (const object of parsedObjects) {
  const values = strings(object);
  for (const value of values) {
    assert(!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(value), 'Supabase URL leaked in JSON');
  }
}

scanUnsafe([...NEW_DOCS.map(([file]) => file), ...SOURCE_DOCS.map(([file]) => file)]);

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_contract_owner_review_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  sourceDecision: STATIC_DECISION,
  acceptedWorkers: WORKERS,
  acceptedImages: IMAGES,
  acceptedJobTypes: JOB_TYPES,
  requiredStaticFields: REQUIRED_FIELDS.length,
  blockedJobTypes: BLOCKED_JOB_TYPES.length,
  acceptedForExecutionToday: 'none',
  fixPromptCreated: false,
  supabaseClassification: review.supabaseClassification
}, null, 2));
