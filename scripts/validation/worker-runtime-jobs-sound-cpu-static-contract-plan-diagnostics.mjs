import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const DECISION = 'worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review';
const SOURCE_DECISION = 'worker_runtime_jobs_sound_cpu_handoff_review_passed_with_warnings_ready_for_static_contract_plan';
const SOURCE_HEAD = 'f0cb0000fcc49f9b5c5e76394be9578f5d6d29dc';
const MATRIX_SCHEMA = 'reeditpro.workerRuntimeJobsSoundCpuStaticContractPlanMatrix.v1';
const MATRIX_FILE = 'docs/worker-runtime-jobs/sound-cpu-static-contract-plan-matrix.json';
const STATIC_PLAN_DOC = 'docs/worker-runtime-jobs/sound-cpu-static-contract-plan.v1.md';
const STATIC_PLAN_REPORT = 'docs/worker-runtime-jobs/sound-cpu-static-contract-plan-report.md';

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

const PLANNED_IMAGES = [
  'reeditpro/sound-cpu-analysis-worker',
  'reeditpro/sound-audio-metadata-worker'
];

const INPUT_CONTRACT_ROWS = [
  'input_contract_package_import_smoke',
  'input_contract_numeric_array_analysis',
  'input_contract_symbolic_midi_analysis',
  'input_contract_loudness_synthetic_analysis'
];

const OUTPUT_CONTRACT_ROWS = [
  'output_contract_package_import_smoke_result',
  'output_contract_numeric_array_analysis_result',
  'output_contract_symbolic_midi_analysis_result',
  'output_contract_loudness_synthetic_analysis_result'
];

const POLICY_PLACEHOLDER_ROWS = [
  'idempotency_policy_placeholder',
  'retry_policy_placeholder',
  'artifact_policy_placeholder',
  'observability_policy_placeholder'
];

const BLOCKED_GATE_ROWS = [
  'worker_dispatch',
  'worker_claim',
  'worker_lease',
  'route_execution',
  'worker_execution',
  'tool_execution',
  'media_open_process_write',
  'pydub_operations',
  'ffmpeg',
  'artifact_write',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'worker_readiness',
  'runtime_readiness',
  'supabase_sql',
  'public_artifacts',
  'signed_urls',
  'provider_model_calls',
  'model_weights_gpu',
  'billing',
  'beta',
  'production'
];

const ALLOWED_MATRIX_ITEM_TYPES = new Set([
  'static_worker_contract',
  'accepted_worker_name',
  'planned_image_name',
  'accepted_job_type',
  'input_contract',
  'output_contract',
  'retry_policy_placeholder',
  'artifact_policy_placeholder',
  'idempotency_policy_placeholder',
  'blocked_execution_gate',
  'owner_handoff_surface',
  'next_prompt'
]);

const FORBIDDEN_KEYS = new Set([
  'rawPrompt',
  'raw_prompt',
  'signedUrl',
  'signed_url',
  'serviceRole',
  'service_role',
  'arbitraryArgs',
  'arbitrary_args',
  'command',
  'exec',
  'spawn',
  'localPath',
  'local_path'
]);

const FORBIDDEN_VALUE_PATTERNS = [
  /\brawPrompt\b/,
  /\bsignedUrl\b/,
  /\bserviceRole\b/,
  /\barbitraryArgs\b/,
  /\blocalPath\b/,
  /\bexec\s*\(/,
  /\bspawn\s*\(/
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

function readJson(file) {
  return JSON.parse(read(file));
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

function gitOutput(args) {
  const env = { ...process.env };
  delete env.DEVELOPER_DIR;
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env
  }).trim();
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

function collectForbidden(value, path = '$', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectForbidden(entry, `${path}[${index}]`, findings));
    return findings;
  }

  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') {
      for (const pattern of FORBIDDEN_VALUE_PATTERNS) {
        if (pattern.test(value)) findings.push(`${path}:unsafe_value:${pattern}`);
      }
    }
    return findings;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) findings.push(`${path}.${key}:forbidden_key`);
    collectForbidden(entry, `${path}.${key}`, findings);
  }

  return findings;
}

function validateMatrix() {
  const matrix = readJson(MATRIX_FILE);
  assert(matrix.schema === MATRIX_SCHEMA, 'Static contract matrix schema mismatch');
  assert(matrix.sourceEvidenceSummary?.sourcePr === 670, 'Static contract matrix must reference PR #670');
  assert(matrix.sourceEvidenceSummary?.mergeCommit === SOURCE_HEAD, 'Static contract matrix merge commit mismatch');
  assert(matrix.sourceEvidenceSummary?.sourceDecision === SOURCE_DECISION, 'Static contract matrix source decision mismatch');
  assert(matrix.sourceEvidenceSummary?.nextRecommendedMilestone === 'WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-OWNER-REVIEW', 'Static contract matrix next milestone mismatch');
  assert(Array.isArray(matrix.rows), 'Static contract matrix rows must be an array');

  const rows = matrix.rows;
  const byId = new Map(rows.map((row) => [row.normalizedItemId, row]));
  includesAll([...byId.keys()], WORKERS, 'matrix worker contracts');
  includesAll([...byId.keys()], PLANNED_IMAGES, 'matrix planned images');
  includesAll([...byId.keys()], JOB_TYPES, 'matrix job types');
  includesAll([...byId.keys()], INPUT_CONTRACT_ROWS, 'matrix input contract placeholders');
  includesAll([...byId.keys()], OUTPUT_CONTRACT_ROWS, 'matrix output contract placeholders');
  includesAll([...byId.keys()], POLICY_PLACEHOLDER_ROWS, 'matrix policy placeholders');
  includesAll([...byId.keys()], BLOCKED_GATE_ROWS, 'matrix blocked gates');
  includesAll([...byId.keys()], ['WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-OWNER-REVIEW'], 'matrix next prompt');

  for (const row of rows) {
    assert(row && typeof row === 'object' && !Array.isArray(row), 'Matrix row must be an object');
    assert(typeof row.normalizedItemId === 'string' && row.normalizedItemId.length > 0, 'Matrix row missing normalizedItemId');
    assert(typeof row.displayName === 'string' && row.displayName.length > 0, `${row.normalizedItemId} missing displayName`);
    assert(ALLOWED_MATRIX_ITEM_TYPES.has(row.itemType), `${row.normalizedItemId} has unsupported itemType ${row.itemType}`);
    assert(Array.isArray(row.sourceEvidence) && row.sourceEvidence.some((entry) => entry.includes('PR #670')), `${row.normalizedItemId} missing PR #670 source evidence`);
    assert(Array.isArray(row.staticContractFields), `${row.normalizedItemId} missing staticContractFields`);
    assert(typeof row.blockedReason === 'string' && row.blockedReason.length > 0, `${row.normalizedItemId} missing blockedReason`);
    assert(typeof row.notes === 'string' && row.notes.length > 0, `${row.normalizedItemId} missing notes`);
    assert(row.ownerReviewRequiredBeforeExecution === true, `${row.normalizedItemId} must require owner review before execution`);
    assert(row.acceptedForRuntimeExecution === false, `${row.normalizedItemId} accepted runtime execution`);
    assert(row.workerDispatchAllowedNow === false, `${row.normalizedItemId} allowed worker dispatch`);
    assert(row.workerClaimAllowedNow === false, `${row.normalizedItemId} allowed worker claim`);
    assert(row.workerLeaseAllowedNow === false, `${row.normalizedItemId} allowed worker lease`);
    assert(row.routeExecutionAllowedNow === false, `${row.normalizedItemId} allowed route execution`);
    assert(row.toolExecutionAllowedNow === false, `${row.normalizedItemId} allowed tool execution`);
    assert(row.mediaProcessingAllowedNow === false, `${row.normalizedItemId} allowed media processing`);
    assert(row.supabaseMutationAllowedNow === false, `${row.normalizedItemId} allowed Supabase mutation`);
    assert(row.sqlAllowedNow === false, `${row.normalizedItemId} allowed SQL`);
    assert(row.publicArtifactsAllowedNow === false, `${row.normalizedItemId} allowed public artifacts`);
    assert(row.betaProductionAllowedNow === false, `${row.normalizedItemId} allowed beta/production`);
  }

  const forbiddenFindings = collectForbidden(matrix);
  assert(forbiddenFindings.length === 0, `Static contract matrix has forbidden fields or values: ${forbiddenFindings.join(', ')}`);

  return {
    matrix,
    staticContractRowCount: rows.length,
    workerNameCount: rows.filter((row) => row.itemType === 'static_worker_contract').length,
    plannedImageCount: rows.filter((row) => row.itemType === 'planned_image_name').length,
    jobTypeCount: rows.filter((row) => row.itemType === 'accepted_job_type').length,
    inputContractPlaceholderCount: rows.filter((row) => row.itemType === 'input_contract').length,
    outputContractPlaceholderCount: rows.filter((row) => row.itemType === 'output_contract').length,
    blockedGateCount: rows.filter((row) => row.itemType === 'blocked_execution_gate').length
  };
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
for (const file of [MATRIX_FILE, STATIC_PLAN_DOC, STATIC_PLAN_REPORT]) scanUnsafe(file);

const matrixSummary = validateMatrix();
assert(existsSync(STATIC_PLAN_DOC), `Missing static contract plan doc: ${STATIC_PLAN_DOC}`);
assert(existsSync(STATIC_PLAN_REPORT), `Missing static contract plan report: ${STATIC_PLAN_REPORT}`);

const changedFiles = gitOutput(['status', '--short'])
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.slice(3));
const stagedFiles = gitOutput(['diff', '--cached', '--name-only'])
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean);
const forbiddenChangedFiles = changedFiles.filter((filePath) => (
  filePath === 'package-lock.json' ||
  filePath.startsWith('docker/') ||
  filePath.startsWith('supabase/') ||
  filePath.startsWith('database/') ||
  filePath.startsWith('migrations/') ||
  filePath.endsWith('.sql') ||
  filePath.includes('Dockerfile')
));
assert(forbiddenChangedFiles.length === 0, `Forbidden files changed: ${forbiddenChangedFiles.join(', ')}`);
assert(!stagedFiles.includes('package-lock.json'), 'package-lock.json must not be staged');

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_static_contract_plan_diagnostics_passed',
  decision: DECISION,
  sourceHead: SOURCE_HEAD,
  sourceDecision: SOURCE_DECISION,
  matrixSchema: MATRIX_SCHEMA,
  staticContractRowCount: matrixSummary.staticContractRowCount,
  workerNameCount: matrixSummary.workerNameCount,
  plannedImageCount: matrixSummary.plannedImageCount,
  jobTypeCount: matrixSummary.jobTypeCount,
  inputContractPlaceholderCount: matrixSummary.inputContractPlaceholderCount,
  outputContractPlaceholderCount: matrixSummary.outputContractPlaceholderCount,
  blockedGateCount: matrixSummary.blockedGateCount,
  acceptedWorkers: WORKERS,
  acceptedImages: IMAGES,
  acceptedJobTypes: JOB_TYPES,
  contractRowCount: register.contractRows.length,
  requiredStaticFieldCount: plan.requiredStaticContractFields.length,
  placeholderPolicyCount: policies.placeholderPolicies.length,
  blockerCount: blockers.blockers.length,
  workerDispatchAllowedNow: false,
  workerClaimAllowedNow: false,
  workerLeaseAllowedNow: false,
  routeExecutionAllowedNow: false,
  toolExecutionAllowedNow: false,
  mediaProcessingAllowedNow: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  packageLockStaged: stagedFiles.includes('package-lock.json'),
  betaProductionAllowedNow: false,
  productionAllowedNow: false,
  executionAllowedNow: false,
  runtimeReadinessClaimed: false,
  supabaseClassification: plan.supabaseClassification,
  nextPrompt: plan.nextPrompt,
  decisionTarget: 'worker_runtime_jobs_sound_cpu_static_contract_plan_ready_for_owner_review'
}, null, 2));
