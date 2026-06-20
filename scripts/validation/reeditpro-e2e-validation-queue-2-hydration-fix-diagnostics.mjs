#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const decision = 'reeditpro_e2e_validation_queue_2_hydration_fix_passed_with_warnings_ready_for_merge_hygiene_4';
const noScopeStatement =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const expectedBlocks = [
  [
    'docs/reeditpro-e2e-validation-queue-2-hydration-fix-results.md',
    'reeditpro-e2e-validation-queue-2-hydration-fix-results',
  ],
  [
    'docs/reeditpro-e2e-validation-queue-2-hydration-fix-pr-results-register.md',
    'reeditpro-e2e-validation-queue-2-hydration-fix-pr-results-register',
  ],
  [
    'docs/reeditpro-e2e-validation-queue-2-hydration-fix-blocker-register.md',
    'reeditpro-e2e-validation-queue-2-hydration-fix-blocker-register',
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

function equalArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} mismatch: ${JSON.stringify(actual)}`);
  }
}

const parsed = Object.fromEntries(expectedBlocks.map(([file, label]) => [label, parseBlock(file, label)]));
const docsContent = expectedBlocks.map(([file]) => read(file)).join('\n');

const results = parsed['reeditpro-e2e-validation-queue-2-hydration-fix-results'];
const register = parsed['reeditpro-e2e-validation-queue-2-hydration-fix-pr-results-register'];
const blockers = parsed['reeditpro-e2e-validation-queue-2-hydration-fix-blocker-register'];

for (const [label, value] of Object.entries(parsed)) {
  if (value?.decision !== decision) fail(`${label} decision mismatch.`);
}

if (results?.targetPr !== 539) fail('Target PR #539 evidence missing.');
if (results?.pr539PreFixState?.mergeable !== 'CONFLICTING') fail('PR #539 dirty/conflicting pre-fix evidence missing.');
if (results?.conflictResolution?.pr538MergeCommit !== '698af943b30b0fd35aab76d546734c7787bda144') {
  fail('PR #538 merge commit evidence missing.');
}
if (results?.conflictResolution?.preservedPr538Evidence !== true) fail('PR #538 preservation evidence missing.');
if (results?.conflictResolution?.preservedPr539Queue2Diagnostics !== true) fail('PR #539 diagnostics preservation evidence missing.');
if (results?.sourceEvidence?.pr538Decision !== 'e2e_pr305_hydration_blocker_resolved_ready_for_validation_rerun') {
  fail('PR #538 decision missing.');
}
if (results?.sourceEvidence?.pr305StillNotMergeReady !== true) fail('PR #305 not-merge-ready evidence missing.');
if (results?.packetHydration?.result !== 'passed') fail('Packet hydration did not pass.');
if (results?.packetHydration?.packageLockStatus !== 'unchanged') fail('Packet package-lock status mismatch.');

equalArray(results?.candidateSummary?.passedFullAllowedValidation, [245, 263], 'Passed candidate list');
equalArray(results?.candidateSummary?.blocked, [264, 300], 'Blocked candidate list');
equalArray(register?.mergeReadyAfterValidation, [245, 263], 'Hydration-fix register merge-ready list');
equalArray(register?.blockedAfterFix, [264, 300], 'Hydration-fix register blocked list');
equalArray(blockers?.mergeReadyPrs, [245, 263], 'Hydration-fix blocker merge-ready list');

if (results?.candidateSummary?.mergeReadyCount !== 2) fail('Merge-ready count must be 2.');
if (results?.candidateSummary?.blockerCount !== 2) fail('Blocker count must be 2.');

for (const prNumber of [245, 263]) {
  const record = register?.records?.find((item) => item.prNumber === prNumber);
  if (record?.mergeReadinessRecommendation !== 'ready_for_merge_hygiene') fail(`PR #${prNumber} is not ready.`);
  if (record?.hydrationResult !== 'passed') fail(`PR #${prNumber} hydration did not pass.`);
  if (record?.packageLockStatus !== 'unchanged') fail(`PR #${prNumber} package-lock status mismatch.`);
}

const pr264 = register?.records?.find((item) => item.prNumber === 264);
if (pr264?.diffCheckResult !== 'failed_git_diff_check_whitespace') fail('PR #264 whitespace evidence missing.');
const pr300 = register?.records?.find((item) => item.prNumber === 300);
if (pr300?.hydrationResult !== 'blocked_enospc') fail('PR #300 ENOSPC evidence missing.');

for (const blocked of blockers?.blockedPrs || []) {
  if (blocked.executionAllowedNow !== false) fail(`Blocked PR execution allowed: ${blocked.prNumber}`);
}

for (const gateValue of Object.values(blockers?.runtimeGates || {})) {
  if (gateValue !== false) fail('A runtime gate is not false.');
}

for (const status of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime_ready',
  'media_processing_ready',
  'beta_ready',
  'production_ready',
]) {
  if (blockers?.forbiddenStatuses?.[status] !== 'blocked_unclaimed') fail(`Forbidden status not blocked: ${status}`);
  if (!docsContent.includes(status)) fail(`Forbidden status term missing: ${status}`);
}

const packageJson = JSON.parse(read('package.json'));
if (
  packageJson.scripts?.['reeditpro:e2e-validation-queue-2-hydration-fix:diagnostics'] !==
  'node scripts/validation/reeditpro-e2e-validation-queue-2-hydration-fix-diagnostics.mjs'
) {
  fail('Hydration-fix package script missing.');
}

for (const required of [
  'npm ci --ignore-scripts --no-audit --no-fund',
  'environment_owner_blocked_dependency_hydration_enospc',
  'git_diff_check_whitespace',
  'environment_owner_blocked_native_optional_hydration',
  'REEDITPRO-E2E-MERGE-HYGIENE-4: merge queue 2 validated PRs, no execution',
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
  /"productionUnlockAllowed"\s*:\s*true/,
  /postgres(?:ql)?:\/\/[^@\s]+@/i,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  new RegExp(`X-${'Goog'}-${'Signature'}|X-${'Amz'}-${'Signature'}`, 'i'),
]) {
  if (forbidden.test(docsContent)) fail(`Forbidden unsafe pattern present: ${forbidden}`);
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision,
  targetPr: 539,
  sourceEvidence: { pr523: 'merged', pr538: 'merged' },
  mergeReadyAfterValidation: [245, 263],
  blocked: [264, 300, 305],
  supabaseNoOpClassification: results?.supabaseNoOpClassification,
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
