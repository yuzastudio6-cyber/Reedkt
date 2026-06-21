import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const requiredBlocks = [
  ['docs/reeditpro-e2e-validation-queue-8-results.md', 'reeditpro-e2e-validation-queue-8-results'],
  ['docs/reeditpro-e2e-validation-queue-8-pr-results-register.md', 'reeditpro-e2e-validation-queue-8-pr-results-register'],
  ['docs/reeditpro-e2e-validation-queue-8-merge-ready-after-validation.md', 'reeditpro-e2e-validation-queue-8-merge-ready-after-validation'],
  ['docs/reeditpro-e2e-validation-queue-8-blocker-fix-queue.md', 'reeditpro-e2e-validation-queue-8-blocker-fix-queue'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-10-merge-queue-8-validated-prs.md', 'reeditpro-e2e-merge-hygiene-10-merge-queue-8-validated-prs'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-validation-queue-9-run-next-batch.md', 'reeditpro-e2e-validation-queue-9-run-next-batch'],
];

const preservedBlockers = [229, 232, 237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234];
const preservedDuplicateRisk = [218, 221, 224, 349];
const strictSkips = [72, 78, 79, 94, 95, 99, 101, 215, 236, 239, 242, 258, 261, 266, 268, 270, 273];
const alreadyMerged = [69, 70, 231, 233, 235, 245, 263, 620];
const allDoNotMerge = [...strictSkips, ...preservedBlockers, ...preservedDuplicateRisk];

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

function valuesFromRecords(records) {
  return (records ?? []).map((entry) => entry.prNumber);
}

function assertFalseGates(gates, context) {
  for (const [key, value] of Object.entries(gates ?? {})) {
    if ((key.endsWith('Allowed') || key.endsWith('UnlockAllowed')) && value !== false) {
      failures.push(`${context}.${key} must be false.`);
    }
  }
}

function scanText(relativePath, text) {
  const unsafePatterns = [
    /\b(generated_local_fixture_passed|dry_run_passed)\b\s*[:=]\s*true/i,
    /\b(runtimeReady|mediaReady|betaReady|productionReady|supabaseReady|workerReady|routeReady|providerReady|artifactReady)"?\s*:\s*true/i,
    /\b(runtime_ready|media_processing_ready|beta_ready|production_ready)"?\s*:\s*true/i,
    /\b(runtimeExecutionAllowed|toolExecutionAllowed|workerExecutionAllowed|routeExecutionAllowed|mediaProcessingAllowed|providerOrModelCallAllowed|supabaseMutationAllowed|sqlExecutionAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|billingMutationAllowed|betaUnlockAllowed|productionUnlockAllowed)"?\s*:\s*true/i,
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

const results = parsed['reeditpro-e2e-validation-queue-8-results'];
if (results.decision !== 'reeditpro_e2e_validation_queue_8_completed_with_warnings_ready_for_merge_hygiene') {
  failures.push('Queue 8 decision must be completed_with_warnings_ready_for_merge_hygiene.');
}
if (results.sourceHead !== '8c0fdfc4eaa869b6e940117bc474d09e16476c7d') {
  failures.push('Queue 8 source head must be PR #622 merge commit.');
}
if (results.sourceEvidence?.pr622?.mergeCommit !== '8c0fdfc4eaa869b6e940117bc474d09e16476c7d') {
  failures.push('PR #622 merge evidence missing.');
}
if (results.sourceEvidence?.pr620?.mergeCommit !== 'a4574560fa04fde80f1473f837f98cdc757d177e') {
  failures.push('PR #620 external source drift evidence missing.');
}
if (results.sourceEvidence?.pr70?.mergeCommit !== '870bb74d25dad40f5671fd261c3a46f2a7e9c7cc') {
  failures.push('PR #70 merged base evidence missing.');
}
if (!sameArray(results.selectedCandidates, [71]) || !sameArray(results.attemptedValidation, [71]) || !sameArray(results.validatedCandidates, [71]) || !sameArray(results.passedValidation, [71])) {
  failures.push('Queue 8 must select, attempt, validate, and pass only PR #71.');
}
if (!sameArray(results.failedValidation, [])) {
  failures.push('Queue 8 failed validation list must be empty.');
}
if (!hasArrayValues(results.skippedCandidates, strictSkips)) {
  failures.push('Queue 8 skipped candidates must include all strict-filter skips.');
}
if (!hasArrayValues(results.preservedAlreadyMerged, alreadyMerged)) {
  failures.push('Queue 8 must preserve already-merged evidence.');
}
if (!hasArrayValues(results.preservedBlockersAndExclusions, preservedBlockers)) {
  failures.push('Queue 8 must preserve inherited blockers and exclusions.');
}
if (!hasArrayValues(results.preservedDuplicateRisk, preservedDuplicateRisk)) {
  failures.push('Queue 8 must preserve duplicate-risk records.');
}
if (results.mergeReadyAfterValidationCount !== 1 || !sameArray(results.mergeReadyOrder, [71])) {
  failures.push('Queue 8 merge-ready count/order must be PR #71 only.');
}
if (results.validationSummary?.pr71Hydration !== 'passed' || results.validationSummary?.pr71SafetyScan !== 'passed') {
  failures.push('PR #71 hydration and safety scan must pass.');
}
if (results.validationSummary?.pr71ReadinessSummaries !== 'not_available_at_pr_71_head') {
  failures.push('PR #71 readiness summaries must be recorded as unavailable at its older head.');
}
if (results.packageLockStatus?.pr71Candidate !== 'unchanged_after_npm_ci_ignore_scripts') {
  failures.push('PR #71 package-lock status must be unchanged.');
}
assertFalseGates(results.runtimeGateStatus, 'results.runtimeGateStatus');
if (results.supabaseNoOpClassification?.updateRequired !== 'no' || results.supabaseNoOpClassification?.sqlExecuted !== 'no' || results.supabaseNoOpClassification?.migrationDeployed !== 'no') {
  failures.push('Supabase classification must remain no-op.');
}

const register = parsed['reeditpro-e2e-validation-queue-8-pr-results-register'];
const recordByPr = new Map((register.records ?? []).map((entry) => [entry.prNumber, entry]));
const register71 = recordByPr.get(71);
if (!register71) {
  failures.push('Missing PR #71 register record.');
} else {
  if (register71.validationResult !== 'passed_with_warnings') {
    failures.push('PR #71 must be passed_with_warnings.');
  }
  if (register71.mergeReadinessRecommendation !== 'ready_for_merge_hygiene') {
    failures.push('PR #71 must be recommended for merge hygiene.');
  }
  if (register71.head !== '59d088b6af6069cbef0b0d89f8012c6f5b01c016' || register71.base !== '2c40c4e3f12164a6b97ac17d89e77ef963ccf6bb') {
    failures.push('PR #71 head/base evidence mismatch.');
  }
  if (register71.packageLockStatus !== 'unchanged' || register71.packageJsonStatus !== 'unchanged') {
    failures.push('PR #71 package files must be unchanged.');
  }
  const failedCommands = (register71.commands ?? []).filter((command) => !['passed', 'passed_with_vite_chunk_size_and_plugin_timing_warnings', 'not_available_at_pr_71_head'].includes(command.status));
  if (failedCommands.length > 0) {
    failures.push(`PR #71 command failures recorded: ${failedCommands.map((command) => command.name).join(', ')}`);
  }
  assertFalseGates(register71.bodyBoundarySummary, 'register71.bodyBoundarySummary');
}
if (!sameArray(register.mergeReadyAfterValidation, [71]) || !sameArray(register.blockedAfterValidation, [])) {
  failures.push('Queue 8 register merge-ready/blocked arrays are incorrect.');
}
if (!hasArrayValues(register.skippedAfterValidation, strictSkips)) {
  failures.push('Queue 8 register skipped array must include strict-filter skips.');
}
if (!hasArrayValues(valuesFromRecords(register.preservedAlreadyMerged), alreadyMerged)) {
  failures.push('Queue 8 register must preserve already-merged PRs.');
}
if (!hasArrayValues(valuesFromRecords(register.preservedBlockersAndExclusions), preservedBlockers)) {
  failures.push('Queue 8 register must preserve inherited blockers.');
}
if (!hasArrayValues(valuesFromRecords(register.preservedDuplicateRisk), preservedDuplicateRisk)) {
  failures.push('Queue 8 register must preserve duplicate-risk PRs.');
}

const mergeReady = parsed['reeditpro-e2e-validation-queue-8-merge-ready-after-validation'];
if (mergeReady.mergeReadyAfterValidationCount !== 1 || !sameArray(valuesFromRecords(mergeReady.mergeReadyPrs), [71])) {
  failures.push('Queue 8 merge-ready artifact must list PR #71 only.');
}
if (!hasArrayValues(mergeReady.doNotMergeInMergeHygiene10, allDoNotMerge)) {
  failures.push('Queue 8 merge-ready artifact must preserve do-not-merge records.');
}
assertFalseGates(mergeReady.mergeSafetyRules, 'mergeReady.mergeSafetyRules');

const blockers = parsed['reeditpro-e2e-validation-queue-8-blocker-fix-queue'];
if (!sameArray(blockers.newQueue8ValidationFailures, [])) {
  failures.push('Queue 8 blocker queue must have no new validation failures.');
}
if (!hasArrayValues(valuesFromRecords(blockers.strictFilterSkips), strictSkips)) {
  failures.push('Queue 8 blocker queue must include strict-filter skips.');
}
if (!hasArrayValues(valuesFromRecords(blockers.preservedBlockers), preservedBlockers)) {
  failures.push('Queue 8 blocker queue must preserve inherited blockers.');
}
if (!hasArrayValues(valuesFromRecords(blockers.duplicateRiskRecords), preservedDuplicateRisk)) {
  failures.push('Queue 8 blocker queue must preserve duplicate-risk records.');
}
assertFalseGates(blockers.runtimeGates, 'blockers.runtimeGates');

const mergePrompt = parsed['reeditpro-e2e-merge-hygiene-10-merge-queue-8-validated-prs'];
if (mergePrompt.sourceDecision !== results.decision || mergePrompt.mergeReadyAfterValidationCount !== 1 || !sameArray(valuesFromRecords(mergePrompt.mergeTargets), [71])) {
  failures.push('Merge hygiene 10 prompt must target PR #71 only.');
}
if (!hasArrayValues(mergePrompt.doNotMerge, allDoNotMerge)) {
  failures.push('Merge hygiene 10 prompt must preserve do-not-merge records.');
}
assertFalseGates(mergePrompt.blockedScopes, 'mergePrompt.blockedScopes');

const queue9Prompt = parsed['reeditpro-e2e-validation-queue-9-run-next-batch'];
if (queue9Prompt.sourceDecision !== results.decision) {
  failures.push('Queue 9 prompt must consume the queue-8 decision.');
}
if (!sameArray(queue9Prompt.queue8MergeReady, [71])) {
  failures.push('Queue 9 prompt must record PR #71 as queue-8 merge-ready.');
}
if (!hasArrayValues(queue9Prompt.preserveBlockers, preservedBlockers) || !hasArrayValues(queue9Prompt.preserveDuplicateRisk, preservedDuplicateRisk)) {
  failures.push('Queue 9 prompt must preserve blockers and duplicate-risk records.');
}
assertFalseGates(queue9Prompt.blockedScopes, 'queue9Prompt.blockedScopes');

const packageJson = JSON.parse(read('package.json'));
const expectedScript = 'node scripts/validation/reeditpro-e2e-validation-queue-8-diagnostics.mjs';
if (packageJson.scripts?.['reeditpro:e2e-validation-queue-8:diagnostics'] !== expectedScript) {
  failures.push('Missing package script reeditpro:e2e-validation-queue-8:diagnostics.');
}

const summary = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision: results.decision,
  sourceHead: results.sourceHead,
  selectedCandidates: results.selectedCandidates,
  attemptedValidation: results.attemptedValidation,
  passedValidation: results.passedValidation,
  skippedCandidates: results.skippedCandidates,
  mergeReadyAfterValidationCount: results.mergeReadyAfterValidationCount,
  nextRecommendedPrompt: results.nextRecommendedPrompt,
  failures,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
