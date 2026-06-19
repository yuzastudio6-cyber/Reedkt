#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const decision = 'reeditpro_e2e_validation_queue_2_hydration_fix_passed_with_warnings_ready_for_merge_hygiene_4';
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

function assertArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} mismatch: ${JSON.stringify(actual)}`);
  }
}

const parsed = Object.fromEntries(expectedBlocks.map(([file, label]) => [label, parseBlock(file, label)]));
const docsContent = expectedBlocks.map(([file]) => read(file)).join('\n');

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
if (results?.sourceEvidence?.pr538?.mergeCommit !== '698af943b30b0fd35aab76d546734c7787bda144') {
  fail('PR #538 merge commit evidence missing.');
}
if (results?.sourceEvidence?.pr538?.safeHydrationCommand !== 'npm ci --ignore-scripts --no-audit --no-fund') {
  fail('PR #538 safe hydration command missing.');
}
if (results?.sourceEvidence?.pr305Excluded?.bucket !== 'environment_owner_blocked_native_optional_hydration') {
  fail('PR #305 excluded bucket missing.');
}
if (results?.sourceEvidence?.pr305Excluded?.retryHydration !== false) fail('PR #305 hydration retry must remain false.');

assertArray(results?.selectedPrs, [300, 264, 263, 245], 'Results selected PRs');
assertArray(register?.selectedPrs, [300, 264, 263, 245], 'Register selected PRs');
assertArray(results?.mergeReadyAfterValidation, [245, 263], 'Results merge-ready PRs');
assertArray(register?.mergeReadyAfterValidation, [245, 263], 'Register merge-ready PRs');
assertArray(mergeReady?.recommendedDependencySafeMergeOrder, [245, 263], 'Merge-ready order');
assertArray(mergePrompt?.dependencySafeMergeOrder, [245, 263], 'Merge prompt order');

if (results?.validationSummary?.mergeReadyAfterValidation !== 2) fail('Results merge-ready count must be 2.');
if (register?.mergeReadyAfterValidationCount !== 2) fail('Register merge-ready count must be 2.');
if (mergeReady?.mergeReadyAfterValidationCount !== 2) fail('Merge-ready doc count must be 2.');
if (blockerQueue?.blockerFixCount !== 2) fail('Blocker count must be 2.');
if (mergePrompt?.currentMergeReadyCount !== 2 || mergePrompt?.readyNow !== true) fail('Merge hygiene 4 prompt must be ready.');
if (nextBatchPrompt?.readyNow !== false) fail('Validation queue 3 must remain deferred.');

for (const prNumber of [245, 263]) {
  const record = register?.records?.find((item) => item.prNumber === prNumber);
  if (!record) {
    fail(`Missing register record for PR #${prNumber}`);
    continue;
  }
  if (record.decision !== 'ready_for_merge_hygiene') fail(`PR #${prNumber} must be ready for merge hygiene.`);
  if (record.hydrationResult !== 'passed') fail(`PR #${prNumber} hydration result mismatch.`);
  if (record.packageLockStatus !== 'unchanged') fail(`PR #${prNumber} package-lock status mismatch.`);
  for (const [bin, present] of Object.entries(record.requiredBins || {})) {
    if (present !== true) fail(`PR #${prNumber} required binary missing: ${bin}`);
  }
  for (const command of ['npm run lint', 'npm run typecheck:server', 'npx tsc -b', 'npm run build', 'npm run build:server']) {
    if (!record.commandsRun?.some((entry) => entry.command === command && entry.result === 'passed')) {
      fail(`PR #${prNumber} missing passed command: ${command}`);
    }
  }
}

const pr264 = register?.records?.find((item) => item.prNumber === 264);
if (pr264?.blockerCategory !== 'git_diff_check_whitespace') fail('PR #264 whitespace blocker missing.');
if (!pr264?.commandsRun?.some((entry) => entry.command === 'git diff --check' && entry.result === 'failed')) {
  fail('PR #264 failed diff-check evidence missing.');
}

const pr300 = register?.records?.find((item) => item.prNumber === 300);
if (pr300?.blockerCategory !== 'environment_owner_blocked_dependency_hydration_enospc') fail('PR #300 ENOSPC blocker missing.');
if (pr300?.hydrationResult !== 'blocked_enospc') fail('PR #300 hydration result mismatch.');

for (const blocker of blockerQueue?.blockers || []) {
  if (blocker.executionAllowedNow !== false) fail(`Blocker execution must remain false: ${blocker.blockerId}`);
}

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
  if (!docsContent.includes(status)) fail(`Forbidden status wording missing: ${status}`);
}

const packageJson = JSON.parse(read('package.json'));
if (
  packageJson.scripts?.['reeditpro:e2e-validation-queue-2:diagnostics'] !==
  'node scripts/validation/reeditpro-e2e-validation-queue-2-diagnostics.mjs'
) {
  fail('Queue 2 diagnostics package script missing.');
}

for (const required of [
  'REEDITPRO-E2E-MERGE-HYGIENE-4: merge queue 2 validated PRs, no execution',
  'REEDITPRO-E2E-VALIDATION-QUEUE-3: run next batch, no execution',
  'environment_owner_blocked_native_optional_hydration',
  'environment_owner_blocked_dependency_hydration_enospc',
  'git_diff_check_whitespace',
  noScopeStatement,
]) {
  if (!docsContent.includes(required)) fail(`Missing required term: ${required}`);
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
  new RegExp(`X-${'Goog'}-${'Signature'}|X-${'Amz'}-${'Signature'}`, 'i'),
]) {
  if (forbidden.test(docsContent)) fail(`Forbidden unsafe pattern present: ${forbidden}`);
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision,
  sourcePrs: [523, 538],
  selectedPrs: [300, 264, 263, 245],
  mergeReadyAfterValidation: [245, 263],
  blocked: [264, 300],
  packageLockStatus: 'unchanged_for_all_attempted_candidates',
  supabaseNoOpClassification: results?.supabaseNoOpClassification,
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
