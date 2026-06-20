import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const requiredBlocks = [
  ['docs/reeditpro-e2e-validation-queue-7-results.md', 'reeditpro-e2e-validation-queue-7-results'],
  ['docs/reeditpro-e2e-validation-queue-7-pr-results-register.md', 'reeditpro-e2e-validation-queue-7-pr-results-register'],
  ['docs/reeditpro-e2e-validation-queue-7-merge-ready-after-validation.md', 'reeditpro-e2e-validation-queue-7-merge-ready-after-validation'],
  ['docs/reeditpro-e2e-validation-queue-7-blocker-fix-queue.md', 'reeditpro-e2e-validation-queue-7-blocker-fix-queue'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-9-merge-queue-7-validated-prs.md', 'reeditpro-e2e-merge-hygiene-9-merge-queue-7-validated-prs'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-validation-queue-8-run-next-batch.md', 'reeditpro-e2e-validation-queue-8-run-next-batch'],
];

const requiredPreserved = [229, 232, 237, 240, 243, 250, 253, 255, 260, 264, 300, 305, 304, 267, 281, 234, 218, 221, 224, 349];

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
    /\b(packageInstallAllowed|fontPackageInstallAllowed|ocrInferenceAllowed|dockerOrCloudRunAllowed)"?\s*:\s*true/i,
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

const results = parsed['reeditpro-e2e-validation-queue-7-results'];
if (results.decision !== 'reeditpro_e2e_validation_queue_7_blocked_no_eligible_prs') {
  failures.push('Queue 7 decision must be blocked_no_eligible_prs.');
}
if (results.sourceHead !== '9fff3974c113bf80f2b137eeac8630652b5e204b') {
  failures.push('Queue 7 source head must be PR #618 merge commit.');
}
if (results.sourceEvidence?.pr618?.mergeCommit !== '9fff3974c113bf80f2b137eeac8630652b5e204b') {
  failures.push('PR #618 merge evidence missing.');
}
if (results.sourceEvidence?.pr231?.mergeCommit !== '8fa59409cfeda91c1099a1041f0b0c8d71f59bf2') {
  failures.push('PR #231 external merge evidence missing.');
}
if (results.sourceEvidence?.pr233?.mergeCommit !== '3b9ec5624b93ace0ab1cf40cd233b9672113cb64') {
  failures.push('PR #233 external merge evidence missing.');
}
const pr620 = results.originallySelectedCandidate ?? {};
if (pr620.prNumber !== 620 || pr620.selectionStatus !== 'already_merged_before_queue7_validation') {
  failures.push('PR #620 must be recorded as already merged before queue-7 validation.');
}
if (pr620.mergeCommit !== 'a4574560fa04fde80f1473f837f98cdc757d177e') {
  failures.push('PR #620 merge commit evidence missing.');
}
if (!sameArray(results.selectedCandidates, [])) {
  failures.push('Queue 7 selected candidates must be empty after final drift.');
}
if (!sameArray(results.attemptedValidation, []) || !sameArray(results.validatedCandidates, []) || !sameArray(results.passedValidation, []) || !sameArray(results.failedValidation, [])) {
  failures.push('Queue 7 must not record candidate validation attempts.');
}
if (results.mergeReadyAfterValidationCount !== 0 || !sameArray(results.mergeReadyOrder, [])) {
  failures.push('Queue 7 merge-ready count and order must be empty.');
}
if (!hasArrayValues(results.skippedCandidates, [620, ...requiredPreserved])) {
  failures.push('Queue 7 skipped candidates must include PR #620 and all preserved blockers.');
}
assertFalseGates(results.runtimeGateStatus, 'results.runtimeGateStatus');
if (results.supabaseNoOpClassification?.updateRequired !== 'no' || results.supabaseNoOpClassification?.sqlExecuted !== 'no') {
  failures.push('Supabase classification must remain no-op.');
}

const register = parsed['reeditpro-e2e-validation-queue-7-pr-results-register'];
const recordByPr = new Map((register.records ?? []).map((entry) => [entry.prNumber, entry]));
const register620 = recordByPr.get(620);
if (!register620) {
  failures.push('Missing PR #620 register record.');
} else {
  if (register620.liveStateAtValidationReadback !== 'merged') {
    failures.push('PR #620 register record must show merged final readback.');
  }
  if (register620.validationResult !== 'not_run_already_merged_external_source_drift') {
    failures.push('PR #620 register record must not claim validation.');
  }
  if (!sameArray(register620.commands, [])) {
    failures.push('PR #620 commands must be empty.');
  }
  assertFalseGates(register620.bodyBoundarySummary, 'register620.bodyBoundarySummary');
}
if (!sameArray(register.mergeReadyAfterValidation, []) || !sameArray(register.blockedAfterValidation, []) || !sameArray(register.skippedAfterValidation, [620])) {
  failures.push('Queue 7 register merge-ready/blocked/skipped arrays are incorrect.');
}
if (!hasArrayValues(valuesFromRecords(register.preservedBlockersAndExclusions), requiredPreserved)) {
  failures.push('Queue 7 register must preserve all inherited blockers and duplicate-risk records.');
}

const mergeReady = parsed['reeditpro-e2e-validation-queue-7-merge-ready-after-validation'];
if (mergeReady.mergeReadyAfterValidationCount !== 0 || !sameArray(mergeReady.mergeReadyPrs, [])) {
  failures.push('Queue 7 merge-ready artifact must list zero PRs.');
}
if (mergeReady.alreadyMergedExternalEvidence?.[0]?.prNumber !== 620) {
  failures.push('Queue 7 merge-ready artifact must record PR #620 as already merged evidence.');
}
if (!hasArrayValues(mergeReady.doNotMergeInMergeHygiene9, requiredPreserved)) {
  failures.push('Queue 7 merge-ready artifact must preserve do-not-merge blockers.');
}
assertFalseGates(mergeReady.mergeSafetyRules, 'mergeReady.mergeSafetyRules');

const blockers = parsed['reeditpro-e2e-validation-queue-7-blocker-fix-queue'];
if (!hasArrayValues(valuesFromRecords(blockers.queue7Blockers), [620])) {
  failures.push('Queue 7 blocker queue must include PR #620 drift.');
}
if (!hasArrayValues(valuesFromRecords(blockers.preservedBlockers), requiredPreserved)) {
  failures.push('Queue 7 blocker queue must preserve inherited blockers.');
}
assertFalseGates(blockers.runtimeGates, 'blockers.runtimeGates');

const mergePrompt = parsed['reeditpro-e2e-merge-hygiene-9-merge-queue-7-validated-prs'];
if (!sameArray(mergePrompt.mergeTargets, []) || mergePrompt.mergeReadyAfterValidationCount !== 0) {
  failures.push('Merge hygiene 9 prompt must have no merge targets.');
}
if (mergePrompt.action !== 'do_not_merge_any_queue7_pr') {
  failures.push('Merge hygiene 9 prompt must be guarded.');
}
if (!hasArrayValues(mergePrompt.doNotMerge, requiredPreserved)) {
  failures.push('Merge hygiene 9 prompt must preserve do-not-merge blockers.');
}
assertFalseGates(mergePrompt.blockedScopes, 'mergePrompt.blockedScopes');

const queue8Prompt = parsed['reeditpro-e2e-validation-queue-8-run-next-batch'];
if (queue8Prompt.sourceDecision !== 'reeditpro_e2e_validation_queue_7_blocked_no_eligible_prs') {
  failures.push('Queue 8 prompt must consume the queue-7 blocked/no-eligible decision.');
}
if (!hasArrayValues(queue8Prompt.doNotRetryWithoutFix, requiredPreserved)) {
  failures.push('Queue 8 prompt must preserve do-not-retry blockers.');
}
if (!hasArrayValues(queue8Prompt.explicitlyAlreadyMergedBeforeQueue8, [620])) {
  failures.push('Queue 8 prompt must record PR #620 as already merged.');
}
assertFalseGates(queue8Prompt.blockedScopes, 'queue8Prompt.blockedScopes');

const packageJson = JSON.parse(read('package.json'));
const expectedScript = 'node scripts/validation/reeditpro-e2e-validation-queue-7-diagnostics.mjs';
if (packageJson.scripts?.['reeditpro:e2e-validation-queue-7:diagnostics'] !== expectedScript) {
  failures.push('Missing package script reeditpro:e2e-validation-queue-7:diagnostics.');
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
