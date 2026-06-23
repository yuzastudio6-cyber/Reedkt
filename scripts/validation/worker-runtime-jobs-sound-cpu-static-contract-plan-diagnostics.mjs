import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review';
const SOURCE_DECISION = 'worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan';
const SOURCE_HEAD = 'f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc';

const REQUIRED_DOCS = [
  ['docs/worker-runtime-jobs-sound-cpu-static-contract-plan.md', 'worker-runtime-jobs-sound-cpu-static-contract-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-static-job-contract-register.md', 'worker-runtime-jobs-sound-cpu-static-job-contract-register'],
  ['docs/worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan.md', 'worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-static-runtime-policy-placeholders.md', 'worker-runtime-jobs-sound-cpu-static-runtime-policy-placeholders'],
  ['docs/worker-runtime-jobs-sound-cpu-static-blocker-register.md', 'worker-runtime-jobs-sound-cpu-static-blocker-register'],
  ['docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-contract-owner-review.md', 'worker-runtime-jobs-sound-cpu-contract-owner-review'],
  ['docs/implementation-prompts/prompt-sound-runtime-media-gate-1e-dockerfile-static-plan.md', 'sound-runtime-media-gate-1e-dockerfile-static-plan'],
  ['docs/worker-runtime-jobs-sound-cpu-handoff-review.md', 'worker-runtime-jobs-sound-cpu-handoff-review']
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

const REJECTED_PAYLOAD_SOURCES = [
  'raw prompts',
  'signed URLs as source of truth',
  'media file paths',
  'provider output blobs',
  'secrets',
  'service-role payloads',
  'model-weight locations',
  'artifact write targets'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  assert(existsSync(file), `Missing required file: ${file}`);
  return readFileSync(file, 'utf8');
}

function parseBlock(file, label) {
  const text = read(file);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp('```json\\s+' + escapedLabel + '\\n([\\s\\S]*?)\\n```');
  const match = text.match(pattern);
  assert(match, `Missing JSON block ${label} in ${file}`);
  return JSON.parse(match[1]);
}

function includesAll(values, required, label) {
  for (const item of required) {
    assert(values?.includes?.(item), `${label} missing ${item}`);
  }
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase updateRequired widened`);
  assert(value?.environmentTouched === 'no', `${label} Supabase environmentTouched widened`);
  assert(value?.sqlExecuted === 'no', `${label} Supabase sqlExecuted widened`);
  assert(value?.migrationDeployed === 'no', `${label} Supabase migrationDeployed widened`);
  assert(value?.nextAction === 'none', `${label} Supabase nextAction widened`);
}

function scanUnsafe(file) {
  const text = read(file);
  const unsafePatterns = [
    /"(workerExecutionRun|routeExecutionRun|toolExecutionRun|dockerBuildRun|gcpTouched|cloudRunTouched|secretManagerTouched|mediaProcessingRun|supabaseTouched|modelWeightsDownloaded|artifactCreated|runtimeReadinessClaimed|workerReadinessClaimed|generatedLocalFixturePassedClaimed|dryRunPassedClaimed)"\s*:\s*true/,
    /"acceptedForExecutionToday"\s*:\s*true/,
    /"executionAllowedNow"\s*:\s*true/,
    /generated_local_fixture_passed\s*[:=]\s*(true|passed|ready)/i,
    /dry_run_passed\s*[:=]\s*(true|passed|ready)/i,
    /runtime(_|\s)?ready\s*[:=]\s*(true|passed|ready)/i,
    /worker(_|\s)?ready\s*[:=]\s*(true|passed|ready)/i,
    /beta(_|\s)?ready\s*[:=]\s*(true|passed|ready)/i,
    /production(_|\s)?ready\s*[:=]\s*(true|passed|ready)/i,
    /\b[A-Za-z0-9.-]+\.supabase\.co\b/i,
    /\b(?:postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}\b/i,
    /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
    /\b(?:signedUrl|signed_url|publicUrl|public_url)\s*[:=]\s*['"][^'"]+['"]/i
  ];
  for (const pattern of unsafePatterns) {
    assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`);
  }
}

const parsed = Object.fromEntries(REQUIRED_DOCS.map(([file, label]) => [label, parseBlock(file, label)]));

const plan = parsed['worker-runtime-jobs-sound-cpu-static-contract-plan'];
assert(plan.decision === DECISION, 'Static contract decision mismatch');
assert(plan.sourceBase?.head === SOURCE_HEAD, 'Source head mismatch');
assert(plan.sourceBase?.pr670?.decision === SOURCE_DECISION, 'PR #670 source decision mismatch');
includesAll(plan.acceptedPlanningOnly?.workerNames, WORKERS, 'plan workers');
includesAll(plan.acceptedPlanningOnly?.imageNames, IMAGES, 'plan images');
includesAll(plan.acceptedPlanningOnly?.jobTypes, JOB_TYPES, 'plan job types');
includesAll(plan.requiredStaticContractFields, REQUIRED_FIELDS, 'required static fields');
includesAll(plan.placeholderOnlyPolicies, PLACEHOLDERS, 'placeholder policies');
includesAll(plan.explicitlyRejectedPayloadSources, REJECTED_PAYLOAD_SOURCES, 'rejected payload sources');
assert(plan.executionAllowedNow === false, 'execution must remain blocked');
assert(plan.runtimeReadinessClaimed === false, 'runtime readiness must remain unclaimed');
assert(plan.workerReadinessClaimed === false, 'worker readiness must remain unclaimed');
assert(plan.generatedLocalFixturePassedClaimed === false, 'generated local fixture pass must remain unclaimed');
assert(plan.dryRunPassedClaimed === false, 'dry-run pass must remain unclaimed');
assertSupabaseNoop(plan.supabaseClassification, 'plan');

const register = parsed['worker-runtime-jobs-sound-cpu-static-job-contract-register'];
assert(register.decision === DECISION, 'Register decision mismatch');
assert(register.contractRows?.length === 4, 'Expected four contract rows');
for (const jobType of JOB_TYPES) {
  const row = register.contractRows.find((item) => item.jobType === jobType);
  assert(row, `Missing contract row for ${jobType}`);
  assert(WORKERS.includes(row.workerName), `${jobType} worker name not accepted`);
  assert(IMAGES.includes(row.imageName), `${jobType} image name not accepted`);
  assert(row.mediaAccessAllowed === false, `${jobType} media access widened`);
  assert(row.artifactWriteAllowed === false, `${jobType} artifact write widened`);
  assert(row.supabaseWriteAllowed === false, `${jobType} Supabase write widened`);
  assert(row.acceptedForFutureStaticPlanning === true, `${jobType} future static planning not accepted`);
  assert(row.acceptedForExecutionToday === false, `${jobType} execution allowed`);
}

const schema = parsed['worker-runtime-jobs-sound-cpu-static-payload-result-schema-plan'];
assert(schema.decision === DECISION, 'Schema decision mismatch');
includesAll(schema.sharedPayloadRequirements?.requiredIds, REQUIRED_FIELDS.slice(0, 5), 'schema required ids');
includesAll(schema.sharedPayloadRequirements?.requiredRuntimeLabels, ['workerName', 'imageName', 'jobType'], 'schema runtime labels');
assert(schema.schemaImplementationAdded === false, 'Schema implementation should not be added');
for (const rejected of ['prompt', 'rawPrompt', 'signedUrl', 'mediaPath', 'serviceRoleKey', 'databaseUrl', 'modelWeightPath', 'artifactWriteTarget']) {
  assert(schema.rejectedPayloadFields?.includes(rejected), `Schema missing rejected field ${rejected}`);
}

const policies = parsed['worker-runtime-jobs-sound-cpu-static-runtime-policy-placeholders'];
assert(policies.decision === DECISION, 'Policy decision mismatch');
for (const policy of PLACEHOLDERS) {
  const row = policies.placeholderPolicies.find((item) => item.policy === policy);
  assert(row?.status === 'placeholder_only', `Policy ${policy} not placeholder-only`);
  assert(row?.executionAllowedNow === false, `Policy ${policy} execution widened`);
}
assertSupabaseNoop(policies.supabaseClassification, 'policies');

const blockers = parsed['worker-runtime-jobs-sound-cpu-static-blocker-register'];
assert(blockers.decision === DECISION, 'Blocker decision mismatch');
assert(blockers.blockers?.length >= 15, 'Expected blocker register entries');
for (const item of blockers.blockers) {
  assert(item.executionAllowedNow === false, `Blocker ${item.blocker} execution widened`);
}
includesAll(blockers.blockedStatusStringsPreserved, [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime_ready',
  'worker_ready',
  'beta_ready',
  'production_ready'
], 'blocked status strings');
assertSupabaseNoop(blockers.supabaseClassification, 'blockers');

const prompt = parsed['worker-runtime-jobs-sound-cpu-contract-owner-review'];
assert(prompt.requiredDecision === DECISION, 'Next prompt required decision mismatch');
includesAll(prompt.acceptedPlanningOnlyWorkerNames, WORKERS, 'prompt workers');
includesAll(prompt.acceptedPlanningOnlyImageNames, IMAGES, 'prompt images');
includesAll(prompt.acceptedPlanningOnlyJobTypes, JOB_TYPES, 'prompt job types');
assertSupabaseNoop(prompt.supabaseClassification, 'prompt');

const gate1e = parsed['sound-runtime-media-gate-1e-dockerfile-static-plan'];
assert(gate1e.staticContractMilestone === 'WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-PLAN', 'Gate 1E missing static contract milestone');
assert(gate1e.staticContractRequiredDecision === DECISION, 'Gate 1E missing static contract decision');
assert(gate1e.sourceEvidenceRequired?.includes('WORKER_RUNTIME_JOBS SOUND CPU static contract plan'), 'Gate 1E missing static contract source evidence');
assertSupabaseNoop(gate1e.supabaseClassification, 'Gate 1E');

const handoff = parsed['worker-runtime-jobs-sound-cpu-handoff-review'];
assert(handoff.decision === SOURCE_DECISION, 'Handoff source decision mismatch');

for (const [file] of REQUIRED_DOCS) scanUnsafe(file);

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_static_contract_plan_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  sourceDecision: SOURCE_DECISION,
  acceptedWorkers: WORKERS,
  acceptedImages: IMAGES,
  acceptedJobTypes: JOB_TYPES,
  contractRowCount: register.contractRows.length,
  requiredStaticFieldCount: plan.requiredStaticContractFields.length,
  placeholderPolicyCount: policies.placeholderPolicies.length,
  blockerCount: blockers.blockers.length,
  executionAllowedNow: false,
  runtimeReadinessClaimed: false,
  supabaseClassification: plan.supabaseClassification,
  nextPrompt: plan.nextPrompt
}, null, 2));
