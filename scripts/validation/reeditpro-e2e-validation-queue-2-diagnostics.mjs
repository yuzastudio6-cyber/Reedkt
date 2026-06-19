#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const decision = 'reeditpro_e2e_validation_queue_2_blocked_dependency_hydration_failures';
const noScopeStatement =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const expectedBlocks = [
  ['docs/reeditpro-e2e-validation-queue-2-results.md', 'reeditpro-e2e-validation-queue-2-results'],
  ['docs/reeditpro-e2e-validation-queue-2-pr-results-register.md', 'reeditpro-e2e-validation-queue-2-pr-results-register'],
  [
    'docs/reeditpro-e2e-validation-queue-2-merge-ready-after-validation.md',
    'reeditpro-e2e-validation-queue-2-merge-ready-after-validation',
  ],
  ['docs/reeditpro-e2e-validation-queue-2-blocker-fix-queue.md', 'reeditpro-e2e-validation-queue-2-blocker-fix-queue'],
  [
    'docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-4-merge-queue-2-validated-prs.md',
    'reeditpro-e2e-merge-hygiene-4-merge-queue-2-validated-prs',
  ],
  [
    'docs/implementation-prompts/prompt-reeditpro-e2e-validation-queue-3-run-next-batch.md',
    'reeditpro-e2e-validation-queue-3-run-next-batch',
  ],
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(file) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    fail(`Missing file: ${file}`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
}

function parseBlock(file, label) {
  const content = read(file);
  const marker = `\`\`\`json ${label}\n`;
  const start = content.indexOf(marker);
  if (start === -1) {
    fail(`Missing JSON block ${label} in ${file}`);
    return null;
  }
  const jsonStart = start + marker.length;
  const end = content.indexOf('\n```', jsonStart);
  if (end === -1) {
    fail(`Missing closing fence for ${label} in ${file}`);
    return null;
  }
  try {
    return JSON.parse(content.slice(jsonStart, end));
  } catch (error) {
    fail(`Invalid JSON for ${label} in ${file}: ${error.message}`);
    return null;
  }
}

const parsed = Object.fromEntries(expectedBlocks.map(([file, label]) => [label, parseBlock(file, label)]));
const docsContent = expectedBlocks.map(([file]) => read(file)).join('\n');
const allContent = [docsContent, read('scripts/validation/reeditpro-e2e-validation-queue-2-diagnostics.mjs')].join('\n');

const results = parsed['reeditpro-e2e-validation-queue-2-results'];
const register = parsed['reeditpro-e2e-validation-queue-2-pr-results-register'];
const mergeReady = parsed['reeditpro-e2e-validation-queue-2-merge-ready-after-validation'];
const blockerQueue = parsed['reeditpro-e2e-validation-queue-2-blocker-fix-queue'];
const mergePrompt = parsed['reeditpro-e2e-merge-hygiene-4-merge-queue-2-validated-prs'];
const nextBatchPrompt = parsed['reeditpro-e2e-validation-queue-3-run-next-batch'];

for (const [label, value] of Object.entries(parsed)) {
  if (value?.decision && value.decision !== decision) {
    fail(`${label} decision mismatch: ${value.decision}`);
  }
}

if (results?.sourceEvidence?.pr523?.state !== 'MERGED') fail('PR #523 merged evidence missing.');
if (results?.sourceEvidence?.pr523?.mergeCommit !== 'f258967676c4877d3e1627b5710b789cff04b451') {
  fail('PR #523 merge commit mismatch.');
}
if (results?.sourceEvidence?.pr523?.decision !== 'dependency_validation_passed_with_inherited_readiness_blockers_ready_to_merge') {
  fail('PR #523 validation handoff decision missing.');
}
if (results?.sourceEvidence?.pr305Excluded?.bucket !== 'environment_owner_blocked_native_optional_hydration') {
  fail('PR #305 excluded bucket missing.');
}
if (results?.sourceEvidence?.pr305Excluded?.retryHydration !== false) fail('PR #305 hydration retry must remain false.');

const expectedSelected = [300, 264, 263, 245];
if (JSON.stringify(results?.selectedPrs) !== JSON.stringify(expectedSelected)) fail('Selected PR list mismatch in results.');
if (JSON.stringify(register?.selectedPrs) !== JSON.stringify(expectedSelected)) fail('Selected PR list mismatch in register.');
if (!Array.isArray(register?.records) || register.records.length !== expectedSelected.length) fail('Register record count mismatch.');

for (const prNumber of expectedSelected) {
  const record = register?.records?.find((item) => item.prNumber === prNumber);
  if (!record) {
    fail(`Missing register record for PR #${prNumber}`);
    continue;
  }
  if (record.state !== 'OPEN') fail(`PR #${prNumber} must remain open in queue evidence.`);
  if (record.draft !== false) fail(`PR #${prNumber} draft state mismatch.`);
  if (record.mergeable !== 'MERGEABLE' || record.mergeStateStatus !== 'CLEAN') {
    fail(`PR #${prNumber} mergeability evidence mismatch.`);
  }
  if (record.packageLockStatus !== 'unchanged') fail(`PR #${prNumber} package-lock status mismatch.`);
  if (record.packageJsonStatus !== 'unchanged') fail(`PR #${prNumber} package.json status mismatch.`);
  if (record.nodeModulesStatus !== 'removed_after_interrupted_hydration') {
    fail(`PR #${prNumber} node_modules cleanup status mismatch.`);
  }
  if (record.safetyScanResult !== 'passed_no_secret_shaped_markers') fail(`PR #${prNumber} safety scan mismatch.`);
  if (record.decision !== 'validation_failed') fail(`PR #${prNumber} decision must be validation_failed.`);
  if (!record.commandsRun?.some((entry) => entry.command === 'npm ci' && entry.result === 'blocked')) {
    fail(`PR #${prNumber} npm ci blocked evidence missing.`);
  }
}

for (const prNumber of [264, 300]) {
  const record = register?.records?.find((item) => item.prNumber === prNumber);
  if (!record?.commandsRun?.some((entry) => entry.command === 'git diff --check' && entry.result === 'failed')) {
    fail(`PR #${prNumber} whitespace blocker evidence missing.`);
  }
}

for (const prNumber of [245, 263]) {
  const record = register?.records?.find((item) => item.prNumber === prNumber);
  if (!record?.commandsRun?.some((entry) => entry.command === 'git diff --check' && entry.result === 'passed')) {
    fail(`PR #${prNumber} diff check pass evidence missing.`);
  }
}

if (results?.validationSummary?.mergeReadyAfterValidation !== 0) fail('Results merge-ready count must be zero.');
if (mergeReady?.mergeReadyAfterValidationCount !== 0) fail('Merge-ready doc count must be zero.');
if (Array.isArray(mergeReady?.mergeReadyPrs) && mergeReady.mergeReadyPrs.length !== 0) fail('Merge-ready PR list must be empty.');
if (mergeReady?.mergeHygienePromptStatus?.readyNow !== false) fail('Merge hygiene prompt must not be ready.');
if (blockerQueue?.blockerFixCount !== 4) fail('Blocker count mismatch.');
for (const blocker of blockerQueue?.blockers || []) {
  if (blocker.executionAllowedNow !== false) fail(`Blocker execution must remain false: ${blocker.blockerId}`);
  if (blocker.packageLockStatus !== 'unchanged') fail(`Blocker package-lock status mismatch: ${blocker.blockerId}`);
}
if (mergePrompt?.currentMergeReadyCount !== 0 || mergePrompt?.readyNow !== false) {
  fail('Merge hygiene 4 prompt must remain blocked.');
}
if (nextBatchPrompt?.readyNow !== false) fail('Validation queue 3 prompt must remain deferred.');

const gateMaps = [
  results?.runtimeGates,
  blockerQueue?.runtimeGates,
  mergePrompt?.runtimeGates,
  nextBatchPrompt?.runtimeGates,
];
for (const gateMap of gateMaps) {
  for (const [key, value] of Object.entries(gateMap || {})) {
    if (value !== false) fail(`Runtime gate is not false: ${key}`);
  }
}

for (const status of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime_ready',
  'media_processing_ready',
  'beta_ready',
  'production_ready',
]) {
  if (results?.forbiddenStatuses?.[status] !== 'blocked_unclaimed') {
    fail(`Forbidden status not blocked_unclaimed: ${status}`);
  }
  if (!allContent.includes(status)) fail(`Forbidden status wording missing: ${status}`);
}

if (fs.existsSync(path.join(root, 'docs/implementation-prompts/prompt-sound-oss-tools-16.md'))) {
  fail('Unexpected SOUND-OSS-TOOLS-16 prompt exists.');
}

const packageJson = JSON.parse(read('package.json'));
if (
  packageJson.scripts?.['reeditpro:e2e-validation-queue-2:diagnostics'] !==
  'node scripts/validation/reeditpro-e2e-validation-queue-2-diagnostics.mjs'
) {
  fail('Package diagnostics script missing.');
}

for (const required of [
  'REEDITPRO-E2E-VALIDATION-QUEUE-2-HYDRATION-FIX: resolve queue 2 dependency hydration blocker, no execution',
  'REEDITPRO-E2E-MERGE-HYGIENE-4: merge queue 2 validated PRs, no execution',
  'REEDITPRO-E2E-VALIDATION-QUEUE-3: run next batch, no execution',
  'environment_owner_blocked_native_optional_hydration',
  'dependency_hydration_no_completion',
  noScopeStatement,
]) {
  if (!allContent.includes(required)) fail(`Missing required term: ${required}`);
}

for (const forbidden of [
  /"supabaseMutationAllowed"\s*:\s*true/,
  /"sqlExecutionAllowed"\s*:\s*true/,
  /"providerCallAllowed"\s*:\s*true/,
  /"modelCallAllowed"\s*:\s*true/,
  /"workerExecutionAllowed"\s*:\s*true/,
  /"routeExecutionAllowed"\s*:\s*true/,
  /"toolExecutionAllowed"\s*:\s*true/,
  /"mediaProcessingAllowed"\s*:\s*true/,
  /"internalBetaUnlockAllowed"\s*:\s*true/,
  /"externalBetaUnlockAllowed"\s*:\s*true/,
  /"productionUnlockAllowed"\s*:\s*true/,
  /postgres(?:ql)?:\/\/[^@\s]+@/i,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /service[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
  /X-Goog-Signature|X-Amz-Signature|sig=|signature=/i,
]) {
  if (forbidden.test(docsContent)) fail(`Forbidden unsafe pattern present: ${forbidden}`);
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision,
  sourcePr: 523,
  selectedPrs: expectedSelected,
  passed: 0,
  failedOrBlocked: 4,
  mergeReadyAfterValidation: 0,
  packageLockStatus: 'unchanged_for_all_attempted_candidates',
  supabaseNoOpClassification: results?.supabaseNoOpClassification,
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
