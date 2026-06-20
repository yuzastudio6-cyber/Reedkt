import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const requiredBlocks = [
  ['docs/reeditpro-e2e-validation-queue-4-results.md', 'reeditpro-e2e-validation-queue-4-results'],
  ['docs/reeditpro-e2e-validation-queue-4-pr-results-register.md', 'reeditpro-e2e-validation-queue-4-pr-results-register'],
  ['docs/reeditpro-e2e-validation-queue-4-merge-ready-after-validation.md', 'reeditpro-e2e-validation-queue-4-merge-ready-after-validation'],
  ['docs/reeditpro-e2e-validation-queue-4-blocker-fix-queue.md', 'reeditpro-e2e-validation-queue-4-blocker-fix-queue'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-6-merge-queue-4-validated-prs.md', 'reeditpro-e2e-merge-hygiene-6-merge-queue-4-validated-prs'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-validation-queue-5-run-next-batch.md', 'reeditpro-e2e-validation-queue-5-run-next-batch'],
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
    /\bmergeReadyAfterValidationCount"?\s*:\s*[3-9]/i,
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

const results = parsed['reeditpro-e2e-validation-queue-4-results'];
if (results.decision !== 'reeditpro_e2e_validation_queue_4_completed_with_warnings_ready_for_merge_hygiene') {
  failures.push('Queue 4 decision must be completed_with_warnings_ready_for_merge_hygiene.');
}
if (results.sourceHead !== '7c1901c9a08ec4e39f05d65decccb86113bd3084') {
  failures.push('Queue 4 source head must be PR #590 merge commit.');
}
if (results.sourceEvidence?.pr590?.mergeCommit !== '7c1901c9a08ec4e39f05d65decccb86113bd3084') {
  failures.push('PR #590 merge evidence missing.');
}
if (!hasArrayValues(results.selectedCandidates, [69, 70])) {
  failures.push('Selected candidates must include PR #69 and PR #70.');
}
if (!hasArrayValues(results.passedValidation, [69, 70]) || (results.failedValidation ?? []).length !== 0) {
  failures.push('Queue 4 must record PR #69 and PR #70 as passed with no failed selected candidates.');
}
if (results.mergeReadyAfterValidationCount !== 2 || !hasArrayValues(results.mergeReadyOrder, [69, 70])) {
  failures.push('Queue 4 merge-ready count/order must be #69 then #70.');
}
assertFalseGates(results.runtimeGateStatus, 'results.runtimeGateStatus');

const register = parsed['reeditpro-e2e-validation-queue-4-pr-results-register'];
for (const prNumber of [69, 70]) {
  const record = (register.records ?? []).find((entry) => entry.prNumber === prNumber);
  if (!record) {
    failures.push(`Missing PR #${prNumber} register record.`);
    continue;
  }
  if (record.validationResult !== 'passed_with_warnings') {
    failures.push(`PR #${prNumber} must be passed_with_warnings.`);
  }
  if (record.packageJsonStatus !== 'unchanged' || record.packageLockStatus !== 'unchanged') {
    failures.push(`PR #${prNumber} package files must be unchanged.`);
  }
  if (record.statusAfterCleanup !== 'clean') {
    failures.push(`PR #${prNumber} cleanup status must be clean.`);
  }
  const failedCommands = (record.commands ?? []).filter((command) => command.status === 'failed' || command.status === 'timeout');
  if (failedCommands.length > 0) {
    failures.push(`PR #${prNumber} has failed commands in register.`);
  }
}

const mergeReady = parsed['reeditpro-e2e-validation-queue-4-merge-ready-after-validation'];
if (mergeReady.mergeReadyAfterValidationCount !== 2) {
  failures.push('Merge-ready artifact must list exactly two PRs.');
}
const mergeReadyPrs = (mergeReady.mergeReadyPrs ?? []).map((entry) => entry.prNumber);
if (JSON.stringify(mergeReadyPrs) !== JSON.stringify([69, 70])) {
  failures.push('Merge-ready order must be [69, 70].');
}

const blockers = parsed['reeditpro-e2e-validation-queue-4-blocker-fix-queue'];
if (!hasArrayValues((blockers.preservedBlockers ?? []).map((entry) => entry.prNumber), [255, 260, 264, 300, 305])) {
  failures.push('Blocker queue must preserve PR #255, #260, #264, #300, and #305.');
}
if (!hasArrayValues((blockers.skippedCandidates ?? []).map((entry) => entry.prNumber), [304, 267, 281, 234])) {
  failures.push('Blocker queue must preserve skipped candidates #304, #267, #281, and #234.');
}
assertFalseGates(blockers.runtimeGates, 'blockers.runtimeGates');

const mergePrompt = parsed['reeditpro-e2e-merge-hygiene-6-merge-queue-4-validated-prs'];
if (JSON.stringify(mergePrompt.mergeOrder ?? []) !== JSON.stringify([69, 70])) {
  failures.push('Merge hygiene 6 prompt must preserve merge order [69, 70].');
}

const queue5Prompt = parsed['reeditpro-e2e-validation-queue-5-run-next-batch'];
if (!hasArrayValues(queue5Prompt.doNotRetryWithoutFix, [255, 260, 264, 300, 305, 304, 267, 281, 234])) {
  failures.push('Queue 5 prompt must preserve do-not-retry blockers.');
}

const packageJson = JSON.parse(read('package.json'));
const expectedScript = 'node scripts/validation/reeditpro-e2e-validation-queue-4-diagnostics.mjs';
if (packageJson.scripts?.['reeditpro:e2e-validation-queue-4:diagnostics'] !== expectedScript) {
  failures.push('Missing package script reeditpro:e2e-validation-queue-4:diagnostics.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision: results.decision,
  selectedCandidates: results.selectedCandidates,
  passedValidation: results.passedValidation,
  mergeReadyAfterValidationCount: results.mergeReadyAfterValidationCount,
  nextRecommendedPrompt: results.nextRecommendedPrompt,
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
