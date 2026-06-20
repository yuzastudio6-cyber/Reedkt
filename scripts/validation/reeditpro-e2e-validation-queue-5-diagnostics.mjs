import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const requiredBlocks = [
  ['docs/reeditpro-e2e-validation-queue-5-results.md', 'reeditpro-e2e-validation-queue-5-results'],
  ['docs/reeditpro-e2e-validation-queue-5-pr-results-register.md', 'reeditpro-e2e-validation-queue-5-pr-results-register'],
  ['docs/reeditpro-e2e-validation-queue-5-merge-ready-after-validation.md', 'reeditpro-e2e-validation-queue-5-merge-ready-after-validation'],
  ['docs/reeditpro-e2e-validation-queue-5-blocker-fix-queue.md', 'reeditpro-e2e-validation-queue-5-blocker-fix-queue'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-7-merge-queue-5-validated-prs.md', 'reeditpro-e2e-merge-hygiene-7-merge-queue-5-validated-prs'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-validation-queue-6-run-next-batch.md', 'reeditpro-e2e-validation-queue-6-run-next-batch'],
];

function read(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function parseBlock(relativePath, label) {
  const text = read(relativePath);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp('```json\\s+' + escapedLabel + '\\n([\\s\\S]*?)\\n```');
  const match = text.match(pattern);
  if (!match) {
    failures.push(`Missing JSON block ${label} in ${relativePath}`);
    return {};
  }
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    failures.push(`Invalid JSON block ${label} in ${relativePath}: ${error.message}`);
    return {};
  }
}

function hasArrayValues(value, expected) {
  return Array.isArray(value) && expected.every((entry) => value.includes(entry));
}

function assertFalseGates(gates, context) {
  for (const [key, value] of Object.entries(gates ?? {})) {
    if (value !== false) {
      failures.push(`${context}.${key} must be false.`);
    }
  }
}

function scanText(relativePath, text) {
  const unsafePatterns = [
    /\b(runtime|media|beta|production|worker|route|tool|provider|model|supabase|sql|artifact|billing)[A-Za-z]*(Ready|Allowed|Enabled|Executed|Unlocked)"?\s*:\s*true/i,
    /\b(generated_local_fixture_passed|dry_run_passed)\b\s*[:=]\s*true/i,
    /\bmergeReadyAfterValidationCount"?\s*:\s*[2-9]/i,
    /\bSQL executed:\s*`?(yes|true|local|staging|production)/i,
    /\bSupabase environment touched:\s*`?(yes|true|local|staging|production)/i,
    /\bpublic artifact(?:s)?:\s*`?(created|yes|true|enabled)/i,
    /\bsigned URL(?:s)?:\s*`?(created|yes|true|enabled)/i,
    /\bservice[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /\bpostgres(?:ql)?:\/\/[^@\s]+@/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}/i,
  ];

  for (const pattern of unsafePatterns) {
    if (pattern.test(text)) {
      failures.push(`Unsafe marker in ${relativePath}: ${pattern}`);
    }
  }
}

const parsed = Object.fromEntries(
  requiredBlocks.map(([file, label]) => [label, parseBlock(file, label)]),
);

for (const [file] of requiredBlocks) {
  scanText(file, read(file));
}

const results = parsed['reeditpro-e2e-validation-queue-5-results'];
if (results.decision !== 'reeditpro_e2e_validation_queue_5_completed_with_warnings_ready_for_merge_hygiene') {
  failures.push('Queue 5 decision must be completed_with_warnings_ready_for_merge_hygiene.');
}
if (results.sourceHead !== '5e8a1a7af19268d9704eb9687365fc2c6a179f31') {
  failures.push('Queue 5 source head must be PR #596 merge commit.');
}
if (results.sourceEvidence?.pr596?.mergeCommit !== '5e8a1a7af19268d9704eb9687365fc2c6a179f31') {
  failures.push('PR #596 merge evidence missing.');
}
if (results.sourceEvidence?.pr69?.mergeCommit !== '968cb5aa7c85cdac6fa20b6039634991e6d8a7f7') {
  failures.push('PR #69 external merge evidence missing.');
}
if (results.sourceEvidence?.pr70?.mergeCommit !== '870bb74d25dad40f5671fd261c3a46f2a7e9c7cc') {
  failures.push('PR #70 external merge evidence missing.');
}
if (!hasArrayValues(results.selectedCandidates, [235, 237, 240, 243])) {
  failures.push('Selected candidates must include PR #235, #237, #240, and #243.');
}
if (!hasArrayValues(results.attemptedValidation, [235, 237])) {
  failures.push('Attempted validation must include PR #235 and PR #237.');
}
if (!hasArrayValues(results.passedValidation, [235]) || results.mergeReadyAfterValidationCount !== 1) {
  failures.push('Queue 5 must record only PR #235 as passed and merge-ready.');
}
if (!hasArrayValues(results.failedValidation, [237])) {
  failures.push('Queue 5 must record PR #237 as failed or blocked.');
}
if (!hasArrayValues(results.skippedCandidates, [240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234])) {
  failures.push('Queue 5 skipped candidates must preserve the dependency-chain and inherited blockers.');
}
if (JSON.stringify(results.mergeReadyOrder ?? []) !== JSON.stringify([235])) {
  failures.push('Queue 5 merge-ready order must be [235].');
}
assertFalseGates(results.runtimeGateStatus, 'results.runtimeGateStatus');

const register = parsed['reeditpro-e2e-validation-queue-5-pr-results-register'];
const record235 = (register.records ?? []).find((entry) => entry.prNumber === 235);
if (!record235) {
  failures.push('Missing PR #235 register record.');
} else {
  if (record235.validationResult !== 'passed_with_warnings') {
    failures.push('PR #235 must be passed_with_warnings.');
  }
  if (record235.packageJsonStatus !== 'unchanged' || record235.packageLockStatus !== 'unchanged') {
    failures.push('PR #235 package files must be unchanged.');
  }
  const failedCommands = (record235.commands ?? []).filter((command) => command.status === 'failed' || command.status === 'timeout');
  if (failedCommands.length > 0) {
    failures.push('PR #235 has failed commands in register.');
  }
}

const record237 = (register.records ?? []).find((entry) => entry.prNumber === 237);
if (!record237) {
  failures.push('Missing PR #237 register record.');
} else if (record237.validationResult !== 'environment_owner_blocked_dependency_hydration_timeout') {
  failures.push('PR #237 must be classified as dependency hydration timeout.');
}
for (const prNumber of [240, 243]) {
  const record = (register.records ?? []).find((entry) => entry.prNumber === prNumber);
  if (!record || record.validationResult !== 'skipped_dependency_chain_blocked_by_pr_237') {
    failures.push(`PR #${prNumber} must be skipped because PR #237 blocks the chain.`);
  }
}
if (!hasArrayValues(register.mergeReadyAfterValidation, [235]) || (register.mergeReadyAfterValidation ?? []).length !== 1) {
  failures.push('Register must list only PR #235 as merge-ready.');
}

const mergeReady = parsed['reeditpro-e2e-validation-queue-5-merge-ready-after-validation'];
if (mergeReady.mergeReadyAfterValidationCount !== 1) {
  failures.push('Merge-ready artifact must list exactly one PR.');
}
const mergeReadyPrs = (mergeReady.mergeReadyPrs ?? []).map((entry) => entry.prNumber);
if (JSON.stringify(mergeReadyPrs) !== JSON.stringify([235])) {
  failures.push('Merge-ready order must be [235].');
}
if (mergeReady.mergeSafetyRules?.mergeOnly !== true || mergeReady.mergeSafetyRules?.requeryBeforeMerge !== true) {
  failures.push('Merge-ready artifact must preserve merge-only and requery-before-merge rules.');
}
const mergeSafetyBlockedGates = Object.fromEntries(
  Object.entries(mergeReady.mergeSafetyRules ?? {}).filter(([key]) => key.endsWith('Allowed')),
);
assertFalseGates(mergeSafetyBlockedGates, 'mergeReady.mergeSafetyRules');

const blockers = parsed['reeditpro-e2e-validation-queue-5-blocker-fix-queue'];
if (!hasArrayValues((blockers.queue5Blockers ?? []).map((entry) => entry.prNumber), [237, 240, 243, 250, 253])) {
  failures.push('Queue 5 blocker queue must include PR #237, #240, #243, #250, and #253.');
}
if (!hasArrayValues((blockers.preservedBlockers ?? []).map((entry) => entry.prNumber), [255, 260, 264, 300, 305])) {
  failures.push('Blocker queue must preserve PR #255, #260, #264, #300, and #305.');
}
if (!hasArrayValues((blockers.skippedCandidates ?? []).map((entry) => entry.prNumber), [304, 267, 281, 234])) {
  failures.push('Blocker queue must preserve skipped candidates #304, #267, #281, and #234.');
}
assertFalseGates(blockers.runtimeGates, 'blockers.runtimeGates');

const mergePrompt = parsed['reeditpro-e2e-merge-hygiene-7-merge-queue-5-validated-prs'];
if (JSON.stringify(mergePrompt.mergeTargets?.map((entry) => entry.prNumber) ?? []) !== JSON.stringify([235])) {
  failures.push('Merge hygiene 7 prompt must target only PR #235.');
}
if (!hasArrayValues(mergePrompt.doNotMerge, [237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234])) {
  failures.push('Merge hygiene 7 prompt must preserve do-not-merge blockers.');
}
assertFalseGates(mergePrompt.blockedScopes, 'mergePrompt.blockedScopes');

const queue6Prompt = parsed['reeditpro-e2e-validation-queue-6-run-next-batch'];
if (!hasArrayValues(queue6Prompt.doNotRetryWithoutFix, [237, 255, 260, 264, 300, 305, 304, 267, 281, 234])) {
  failures.push('Queue 6 prompt must preserve do-not-retry blockers.');
}
assertFalseGates(queue6Prompt.blockedScopes, 'queue6Prompt.blockedScopes');

const packageJson = JSON.parse(read('package.json'));
const expectedScript = 'node scripts/validation/reeditpro-e2e-validation-queue-5-diagnostics.mjs';
if (packageJson.scripts?.['reeditpro:e2e-validation-queue-5:diagnostics'] !== expectedScript) {
  failures.push('Missing package script reeditpro:e2e-validation-queue-5:diagnostics.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision: results.decision,
  selectedCandidates: results.selectedCandidates,
  passedValidation: results.passedValidation,
  failedValidation: results.failedValidation,
  mergeReadyAfterValidationCount: results.mergeReadyAfterValidationCount,
  nextRecommendedPrompt: results.nextRecommendedPrompt,
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
