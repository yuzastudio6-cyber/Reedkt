#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const decision = 'reeditpro_e2e_validation_queue_1_blocked_validation_failures';
const noScopeStatement =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const expectedBlocks = [
  ['docs/reeditpro-e2e-validation-queue-1-results.md', 'reeditpro-e2e-validation-queue-1-results'],
  ['docs/reeditpro-e2e-validation-queue-1-pr-results-register.md', 'reeditpro-e2e-validation-queue-1-pr-results-register'],
  [
    'docs/reeditpro-e2e-validation-queue-1-merge-ready-after-validation.md',
    'reeditpro-e2e-validation-queue-1-merge-ready-after-validation',
  ],
  ['docs/reeditpro-e2e-validation-queue-1-blocker-fix-queue.md', 'reeditpro-e2e-validation-queue-1-blocker-fix-queue'],
  [
    'docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-3-merge-validated-prs.md',
    'reeditpro-e2e-merge-hygiene-3-merge-validated-prs',
  ],
  [
    'docs/implementation-prompts/prompt-reeditpro-e2e-validation-queue-2-run-next-batch.md',
    'reeditpro-e2e-validation-queue-2-run-next-batch',
  ],
  ['docs/reeditpro-e2e-validation-pr-305-fix-results.md', 'reeditpro-e2e-validation-pr-305-fix-results'],
  [
    'docs/implementation-prompts/prompt-reeditpro-e2e-validation-pr-305-fix-2.md',
    'reeditpro-e2e-validation-pr-305-fix-2',
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
const allContent = [
  ...expectedBlocks.map(([file]) => read(file)),
  read('scripts/validation/reeditpro-e2e-validation-queue-1-diagnostics.mjs'),
].join('\n');

const results = parsed['reeditpro-e2e-validation-queue-1-results'];
const register = parsed['reeditpro-e2e-validation-queue-1-pr-results-register'];
const mergeReady = parsed['reeditpro-e2e-validation-queue-1-merge-ready-after-validation'];
const blockerQueue = parsed['reeditpro-e2e-validation-queue-1-blocker-fix-queue'];
const mergePrompt = parsed['reeditpro-e2e-merge-hygiene-3-merge-validated-prs'];
const nextBatchPrompt = parsed['reeditpro-e2e-validation-queue-2-run-next-batch'];
const pr305Fix = parsed['reeditpro-e2e-validation-pr-305-fix-results'];
const pr305Fix2Prompt = parsed['reeditpro-e2e-validation-pr-305-fix-2'];

const nonQueueDecisionLabels = new Set(['reeditpro-e2e-validation-pr-305-fix-results']);
for (const [label, value] of Object.entries(parsed)) {
  if (nonQueueDecisionLabels.has(label)) continue;
  if (value?.decision && value.decision !== decision) {
    fail(`${label} decision mismatch: ${value.decision}`);
  }
}

if (results?.sourceEvidence?.pr519?.state !== 'MERGED') fail('PR #519 merged evidence missing.');
if (results?.sourceEvidence?.pr519?.mergeCommit !== '61dc4940340db9508012f74294fd6723accb3d36') {
  fail('PR #519 merge commit mismatch.');
}
if (
  results?.sourceEvidence?.pr519?.decision !==
  'reeditpro_e2e_merge_hygiene_ready_queue_completed_with_warnings_ready_for_merge_ready_prs'
) {
  fail('PR #519 decision missing.');
}
if (results?.sourceEvidence?.soundScopedLane?.scopedStatus !== 'sound_oss_tools_synthetic_fixture_validation_passed_with_warnings') {
  fail('SOUND scoped status mismatch.');
}
if (results?.sourceEvidence?.soundScopedLane?.humanWording !== 'SOUND OSS scoped synthetic fixture validation passed with warnings') {
  fail('SOUND human wording mismatch.');
}
if (results?.sourceEvidence?.soundScopedLane?.noSoundOssTools16PromptExists !== true) {
  fail('No SOUND-OSS-TOOLS-16 evidence missing.');
}
if (fs.existsSync(path.join(root, 'docs/implementation-prompts/prompt-sound-oss-tools-16.md'))) {
  fail('Unexpected SOUND-OSS-TOOLS-16 prompt exists.');
}

const expectedSelected = [305, 300, 264, 263, 245];
if (JSON.stringify(results?.selectedPrs) !== JSON.stringify(expectedSelected)) fail('Selected PR list mismatch in results.');
if (JSON.stringify(register?.selectedPrs) !== JSON.stringify(expectedSelected)) fail('Selected PR list mismatch in register.');
if (!Array.isArray(register?.records) || register.records.length !== expectedSelected.length) fail('Register record count mismatch.');

const pr305 = register?.records?.find((record) => record.prNumber === 305);
if (pr305?.decision !== 'validation_blocked_npm_ci_failed') fail('PR #305 blocker decision missing.');
if (pr305?.packageLockStatus !== 'unchanged') fail('PR #305 package-lock status mismatch.');
if (!pr305?.commandsRun?.some((entry) => entry.command === 'npm ci' && entry.result === 'blocked' && entry.exitCode === 130)) {
  fail('PR #305 npm ci blocked command evidence missing.');
}
if (!pr305?.commandsRun?.some((entry) => entry.runContext === 'fresh_pr_305_fix_worktree' && entry.blockerCategory === 'pr_305_validation_blocked_npm_ci_failed')) {
  fail('Fresh PR #305 fix blocker evidence missing in register.');
}
for (const prNumber of [300, 264, 263, 245]) {
  const record = register?.records?.find((item) => item.prNumber === prNumber);
  if (record?.decision !== 'skipped_after_batch_blocker') fail(`PR #${prNumber} skip decision missing.`);
  if (record?.packageLockStatus !== 'not_touched') fail(`PR #${prNumber} package-lock status mismatch.`);
}

if (results?.validationSummary?.mergeReadyAfterValidation !== 0) fail('Results merge-ready count must be zero.');
if (mergeReady?.mergeReadyAfterValidationCount !== 0) fail('Merge-ready doc count must be zero.');
if (Array.isArray(mergeReady?.mergeReadyPrs) && mergeReady.mergeReadyPrs.length !== 0) fail('Merge-ready PR list must be empty.');
if (blockerQueue?.blockerFixCount !== 1) fail('Blocker fix count mismatch.');
if (blockerQueue?.blockers?.[0]?.executionAllowedNow !== false) fail('Blocker execution must remain false.');
if (blockerQueue?.blockers?.[0]?.recommendedPrompt !== 'REEDITPRO-E2E-VALIDATION-PR-305-FIX-2: resolve repeated npm ci hydration blocker, no execution') {
  fail('Blocker queue follow-up prompt mismatch.');
}
if (mergePrompt?.currentMergeReadyCount !== 0) fail('Merge prompt must remain blocked with zero merge-ready PRs.');
if (nextBatchPrompt?.currentPrerequisiteDecision !== decision) fail('Next batch prompt prerequisite mismatch.');
if (pr305Fix?.decision !== 'pr_305_validation_blocked_npm_ci_failed') fail('PR #305 fix decision mismatch.');
if (pr305Fix?.targetPr?.headRefOid !== '757686f49d85cb7d346b55a1712e1d34a6bdde03') fail('PR #305 fix target head mismatch.');
if (pr305Fix?.hydrationRetry?.packageLockStatus !== 'unchanged') fail('PR #305 fix package-lock status mismatch.');
if (pr305Fix?.hydrationRetry?.exitCode !== 130) fail('PR #305 fix npm ci exit code mismatch.');
if (pr305Fix?.mergeQueueDecision?.canMovePr305ToMergeQueue !== false) fail('PR #305 must not be merge-ready.');
if (pr305Fix?.safetyScan?.result !== 'passed') fail('PR #305 fix safety scan must pass.');
if (pr305Fix2Prompt?.prompt !== 'REEDITPRO-E2E-VALIDATION-PR-305-FIX-2: resolve repeated npm ci hydration blocker, no execution') {
  fail('PR #305 fix-2 prompt mismatch.');
}

const gates = [results?.runtimeGates, blockerQueue?.runtimeGates, nextBatchPrompt?.runtimeGates];
for (const gateMap of gates) {
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

const packageJson = JSON.parse(read('package.json'));
if (
  packageJson.scripts?.['reeditpro:e2e-validation-queue-1:diagnostics'] !==
  'node scripts/validation/reeditpro-e2e-validation-queue-1-diagnostics.mjs'
) {
  fail('Package diagnostics script missing.');
}

for (const required of [
  'REEDITPRO-E2E-VALIDATION-PR-305-FIX: fix dependency hydration blocker, no execution',
  'REEDITPRO-E2E-VALIDATION-PR-305-FIX-2: resolve repeated npm ci hydration blocker, no execution',
  'REEDITPRO-E2E-VALIDATION-QUEUE-2: run next batch, no execution',
  'REEDITPRO-E2E-MERGE-HYGIENE-3: merge validated PRs, no execution',
  noScopeStatement,
]) {
  if (!allContent.includes(required)) fail(`Missing required wording: ${required}`);
}

const unsafeTrueKeys = [
  'supabaseMutationAllowed',
  'sqlExecutionAllowed',
  'googleCloudApiCallAllowed',
  'secretManagerApiCallAllowed',
  'providerCallAllowed',
  'modelCallAllowed',
  'workerExecutionAllowed',
  'routeExecutionAllowed',
  'toolExecutionAllowed',
  'mediaProcessingAllowed',
  'ffmpegOrFfprobeAllowed',
  'dockerOrCloudRunAllowed',
  'browserCaptureAllowed',
  'storageTransferAllowed',
  'signedUrlCreationAllowed',
  'publicArtifactCreationAllowed',
  'creditMutationAllowed',
  'stripePaymentProcessingAllowed',
  'internalBetaUnlockAllowed',
  'externalBetaUnlockAllowed',
  'productionUnlockAllowed',
  'rawPromptExecutionAllowed',
  'finalRenderExportAllowed',
  'broadServiceRoleHandlerAllowed',
];
for (const key of unsafeTrueKeys) {
  const pattern = new RegExp(`"${key}"\\s*:\\s*true`, 'i');
  if (pattern.test(allContent)) fail(`Unsafe true flag found: ${key}`);
}

const secretPatterns = [
  ['Bearer token', /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/i],
  ['JWT', /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/],
  [
    'provider key',
    /\b(?:sk-[A-Za-z0-9_-]{16,}|pk_(?:live|test)_[A-Za-z0-9_-]{16,}|rk_(?:live|test)_[A-Za-z0-9_-]{16,}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|glpat-[A-Za-z0-9_-]{16,}|AKIA[A-Z0-9]{16}|AIza[A-Za-z0-9_-]{20,})\b/,
  ],
  ['database URL', /postgres(?:ql)?:\/\//i],
  ['Supabase URL', /\bhttps?:\/\/[^\s"')]+\.supabase\.co\b/i],
  ['signed URL', /https?:\/\/[^\s"')]+(?:X-Amz-Signature|X-Goog-Signature|Signature=|signed|token=)[^\s"')]+/i],
];
for (const [label, pattern] of secretPatterns) {
  if (pattern.test(allContent)) fail(`Secret-shaped content found: ${label}`);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      selected: results.selectedPrs.length,
      validated: results.validationSummary.validated,
      passed: results.validationSummary.passed,
      blocked: results.validationSummary.failedOrBlocked,
      skippedOrDeferred: results.validationSummary.skippedOrDeferred,
      mergeReadyAfterValidation: results.validationSummary.mergeReadyAfterValidation,
      primaryBlocker: results.primaryBlocker.category,
    },
    null,
    2,
  ),
);
