import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const requiredBlocks = [
  ['docs/reeditpro-e2e-validation-queue-6-results.md', 'reeditpro-e2e-validation-queue-6-results'],
  ['docs/reeditpro-e2e-validation-queue-6-pr-results-register.md', 'reeditpro-e2e-validation-queue-6-pr-results-register'],
  ['docs/reeditpro-e2e-validation-queue-6-merge-ready-after-validation.md', 'reeditpro-e2e-validation-queue-6-merge-ready-after-validation'],
  ['docs/reeditpro-e2e-validation-queue-6-blocker-fix-queue.md', 'reeditpro-e2e-validation-queue-6-blocker-fix-queue'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-8-merge-queue-6-validated-prs.md', 'reeditpro-e2e-merge-hygiene-8-merge-queue-6-validated-prs'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-validation-queue-7-run-next-batch.md', 'reeditpro-e2e-validation-queue-7-run-next-batch'],
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

function sameArray(value, expected) {
  return JSON.stringify(value ?? []) === JSON.stringify(expected);
}

function assertFalseGates(gates, context) {
  for (const [key, value] of Object.entries(gates ?? {})) {
    if (key.endsWith('Allowed') && value !== false) {
      failures.push(`${context}.${key} must be false.`);
    }
  }
}

function scanText(relativePath, text) {
  const unsafePatterns = [
    /\b(generated_local_fixture_passed|dry_run_passed)\b\s*[:=]\s*true/i,
    /\b(runtimeReady|mediaReady|betaReady|productionReady|supabaseReady|workerReady|routeReady|providerReady|artifactReady)"?\s*:\s*true/i,
    /\b(runtime_ready|media_processing_ready|beta_ready|production_ready)"?\s*:\s*true/i,
    /\bSQL executed:\s*`?(yes|true|local|staging|production)/i,
    /\bSupabase environment touched:\s*`?(yes|true|local|staging|production)/i,
    /\bpublic artifact(?:s)?:\s*`?(created|yes|true|enabled)/i,
    /\bsigned URL(?:s)?:\s*`?(created|yes|true|enabled)/i,
    /\bservice[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /\bpostgres(?:ql)?:\/\/[^@\s]+@/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}/i,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bghp_[A-Za-z0-9_]{30,}/,
    /\bgithub_pat_[A-Za-z0-9_]+/,
    /\bsk-[A-Za-z0-9]{20,}/,
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

const results = parsed['reeditpro-e2e-validation-queue-6-results'];
if (results.decision !== 'reeditpro_e2e_validation_queue_6_completed_with_warnings_ready_for_merge_hygiene') {
  failures.push('Queue 6 decision must be completed_with_warnings_ready_for_merge_hygiene.');
}
if (results.sourceHead !== '6b9457e0f9adf581f8f28dcb63c6f664200bc1f2') {
  failures.push('Queue 6 source head must be PR #610 merge commit.');
}
if (results.sourceEvidence?.pr610?.mergeCommit !== '6b9457e0f9adf581f8f28dcb63c6f664200bc1f2') {
  failures.push('PR #610 merge evidence missing.');
}
if (results.sourceEvidence?.pr235?.mergeCommit !== '4189ed974513d039931a817a56e67a699008acd6') {
  failures.push('PR #235 external merge evidence missing.');
}
if (!hasArrayValues(results.selectedCandidates, [231, 233, 229, 232])) {
  failures.push('Selected candidates must include PR #231, #233, #229, and #232.');
}
if (!hasArrayValues(results.attemptedValidation, [231, 233, 229])) {
  failures.push('Attempted validation must include PR #231, #233, and #229.');
}
if (!sameArray(results.passedValidation, [231, 233]) || results.mergeReadyAfterValidationCount !== 2) {
  failures.push('Queue 6 must record PR #231 and PR #233 as passed and merge-ready.');
}
if (!sameArray(results.failedValidation, [229])) {
  failures.push('Queue 6 must record PR #229 as failed.');
}
if (!hasArrayValues(results.skippedCandidates, [232, 237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234])) {
  failures.push('Queue 6 skipped candidates must preserve dependency-chain and inherited blockers.');
}
if (!sameArray(results.mergeReadyOrder, [231, 233])) {
  failures.push('Queue 6 merge-ready order must be [231, 233].');
}
assertFalseGates(results.runtimeGateStatus, 'results.runtimeGateStatus');

const register = parsed['reeditpro-e2e-validation-queue-6-pr-results-register'];
const recordByPr = new Map((register.records ?? []).map((entry) => [entry.prNumber, entry]));
for (const prNumber of [231, 233, 229, 232]) {
  if (!recordByPr.has(prNumber)) {
    failures.push(`Missing PR #${prNumber} register record.`);
  }
}
for (const prNumber of [231, 233]) {
  const record = recordByPr.get(prNumber);
  if (record?.validationResult !== 'passed_with_warnings') {
    failures.push(`PR #${prNumber} must be passed_with_warnings.`);
  }
  if (record?.packageJsonStatus !== 'unchanged' || record?.packageLockStatus !== 'unchanged') {
    failures.push(`PR #${prNumber} package files must be unchanged.`);
  }
  const failedCommands = (record?.commands ?? []).filter((command) => command.status === 'failed' || command.status === 'timeout');
  if (failedCommands.length > 0) {
    failures.push(`PR #${prNumber} has failed commands in register.`);
  }
}
const record229 = recordByPr.get(229);
if (record229?.validationResult !== 'validation_failed_typecheck_server') {
  failures.push('PR #229 must be classified as validation_failed_typecheck_server.');
}
const record232 = recordByPr.get(232);
if (record232?.validationResult !== 'skipped_dependency_chain_blocked_by_pr_229') {
  failures.push('PR #232 must be skipped because PR #229 blocks the chain.');
}
if (!sameArray(register.mergeReadyAfterValidation, [231, 233])) {
  failures.push('Register must list PR #231 and PR #233 as merge-ready.');
}
if (!sameArray(register.blockedAfterValidation, [229])) {
  failures.push('Register must list PR #229 as blocked.');
}
if (!sameArray(register.skippedAfterValidation, [232])) {
  failures.push('Register must list PR #232 as skipped.');
}

const mergeReady = parsed['reeditpro-e2e-validation-queue-6-merge-ready-after-validation'];
if (mergeReady.mergeReadyAfterValidationCount !== 2) {
  failures.push('Merge-ready artifact must list exactly two PRs.');
}
const mergeReadyPrs = (mergeReady.mergeReadyPrs ?? []).map((entry) => entry.prNumber);
if (!sameArray(mergeReadyPrs, [231, 233])) {
  failures.push('Merge-ready order must be [231, 233].');
}
if (mergeReady.mergeSafetyRules?.mergeOnly !== true || mergeReady.mergeSafetyRules?.requeryBeforeMerge !== true) {
  failures.push('Merge-ready artifact must preserve merge-only and requery-before-merge rules.');
}
assertFalseGates(mergeReady.mergeSafetyRules, 'mergeReady.mergeSafetyRules');
if (!hasArrayValues(mergeReady.doNotMergeInMergeHygiene8, [229, 232, 237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234])) {
  failures.push('Merge-ready artifact must preserve do-not-merge blockers.');
}

const blockers = parsed['reeditpro-e2e-validation-queue-6-blocker-fix-queue'];
if (!hasArrayValues((blockers.queue6Blockers ?? []).map((entry) => entry.prNumber), [229, 232])) {
  failures.push('Queue 6 blocker queue must include PR #229 and PR #232.');
}
if (!hasArrayValues((blockers.preservedBlockers ?? []).map((entry) => entry.prNumber), [237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234])) {
  failures.push('Blocker queue must preserve inherited blockers.');
}
assertFalseGates(blockers.runtimeGates, 'blockers.runtimeGates');

const mergePrompt = parsed['reeditpro-e2e-merge-hygiene-8-merge-queue-6-validated-prs'];
if (!sameArray((mergePrompt.mergeTargets ?? []).map((entry) => entry.prNumber), [231, 233])) {
  failures.push('Merge hygiene 8 prompt must target PR #231 and PR #233.');
}
if (!hasArrayValues(mergePrompt.doNotMerge, [229, 232, 237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234])) {
  failures.push('Merge hygiene 8 prompt must preserve do-not-merge blockers.');
}
assertFalseGates(mergePrompt.blockedScopes, 'mergePrompt.blockedScopes');

const queue7Prompt = parsed['reeditpro-e2e-validation-queue-7-run-next-batch'];
if (!hasArrayValues(queue7Prompt.doNotRetryWithoutFix, [229, 232, 237, 255, 260, 264, 300, 305, 304, 267, 281, 234])) {
  failures.push('Queue 7 prompt must preserve do-not-retry blockers.');
}
assertFalseGates(queue7Prompt.blockedScopes, 'queue7Prompt.blockedScopes');

const packageJson = JSON.parse(read('package.json'));
const expectedScript = 'node scripts/validation/reeditpro-e2e-validation-queue-6-diagnostics.mjs';
if (packageJson.scripts?.['reeditpro:e2e-validation-queue-6:diagnostics'] !== expectedScript) {
  failures.push('Missing package script reeditpro:e2e-validation-queue-6:diagnostics.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision: results.decision,
  selectedCandidates: results.selectedCandidates,
  passedValidation: results.passedValidation,
  failedValidation: results.failedValidation,
  skippedCandidates: results.skippedCandidates,
  mergeReadyAfterValidationCount: results.mergeReadyAfterValidationCount,
  nextRecommendedPrompt: results.nextRecommendedPrompt,
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
