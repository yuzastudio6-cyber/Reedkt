import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const failures = [];

const requiredBlocks = [
  ['docs/reeditpro-e2e-validation-queue-3-results.md', 'reeditpro-e2e-validation-queue-3-results'],
  ['docs/reeditpro-e2e-validation-queue-3-pr-results-register.md', 'reeditpro-e2e-validation-queue-3-pr-results-register'],
  ['docs/reeditpro-e2e-validation-queue-3-merge-ready-after-validation.md', 'reeditpro-e2e-validation-queue-3-merge-ready-after-validation'],
  ['docs/reeditpro-e2e-validation-queue-3-blocker-fix-queue.md', 'reeditpro-e2e-validation-queue-3-blocker-fix-queue'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-5-merge-queue-3-validated-prs.md', 'reeditpro-e2e-merge-hygiene-5-merge-queue-3-validated-prs'],
  ['docs/implementation-prompts/prompt-reeditpro-e2e-validation-queue-4-run-next-batch.md', 'reeditpro-e2e-validation-queue-4-run-next-batch'],
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

function hasArrayValue(value, expected) {
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
  const unsafeTruePatterns = [
    /\b(runtime|media|beta|production|worker|route|tool|provider|model|supabase|sql|artifact|billing)[A-Za-z]*(Ready|Allowed|Enabled|Executed|Unlocked)"?\s*:\s*true/i,
    /\b(generated_local_fixture_passed|dry_run_passed)\b\s*[:=]\s*true/i,
    /\bmergeReadyAfterValidationCount"?\s*:\s*[1-9]/i,
    /\bSQL executed:\s*`?(yes|true|local|staging|production)/i,
    /\bSupabase environment touched:\s*`?(yes|true|local|staging|production)/i,
    /\bpublic artifact(?:s)?:\s*`?(created|yes|true|enabled)/i,
    /\bsigned URL(?:s)?:\s*`?(created|yes|true|enabled)/i,
    /\bservice[_-]?role[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{12,}/i,
    /\bpostgres(?:ql)?:\/\/[^@\s]+@/i,
    /\bBearer\s+[A-Za-z0-9._-]{20,}/i,
  ];

  for (const pattern of unsafeTruePatterns) {
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

const results = parsed['reeditpro-e2e-validation-queue-3-results'];
if (results.decision !== 'reeditpro_e2e_validation_queue_3_blocked_validation_failures') {
  failures.push('Queue 3 results decision must remain blocked_validation_failures.');
}
if (results.sourceHead !== '76b0ee3a016cb233fa4a636f8c4d35bec5581c80') {
  failures.push('Queue 3 source head must reference PR #539 merge commit.');
}
if (results.sourceEvidence?.pr539?.mergeCommit !== '76b0ee3a016cb233fa4a636f8c4d35bec5581c80') {
  failures.push('PR #539 merge evidence missing.');
}
if (results.sourceEvidence?.pr245?.mergeCommit !== '3fa6e53293e371ec9aef52a6dbd529f963e9c6b4') {
  failures.push('PR #245 external merge evidence missing.');
}
if (results.sourceEvidence?.pr263?.mergeCommit !== 'c20c2e5cc0a9cf66bebcdcc14989663f58eae68b') {
  failures.push('PR #263 external merge evidence missing.');
}
if (!hasArrayValue(results.selectedCandidates, [255, 260])) {
  failures.push('Selected candidates must include PR #255 and PR #260.');
}
if ((results.passedValidation ?? []).length !== 0) {
  failures.push('Queue 3 must not record passed validation.');
}
if (results.mergeReadyAfterValidationCount !== 0) {
  failures.push('Queue 3 merge-ready count must be 0.');
}
assertFalseGates(results.runtimeGateStatus, 'results.runtimeGateStatus');

const register = parsed['reeditpro-e2e-validation-queue-3-pr-results-register'];
const records = register.records ?? [];
for (const prNumber of [255, 260]) {
  const record = records.find((entry) => entry.prNumber === prNumber);
  if (!record) {
    failures.push(`Missing PR #${prNumber} validation record.`);
    continue;
  }
  if (!String(record.hydrationResult ?? '').includes('blocked_dependency_hydration_timeout')) {
    failures.push(`PR #${prNumber} must remain hydration-timeout blocked.`);
  }
  if (record.packageJsonStatus !== 'unchanged' || record.packageLockStatus !== 'unchanged') {
    failures.push(`PR #${prNumber} package files must be unchanged.`);
  }
  if (record.validationResult !== 'not_run_hydration_failed') {
    failures.push(`PR #${prNumber} validation result must be not_run_hydration_failed.`);
  }
}
if ((register.mergeReadyAfterValidation ?? []).length !== 0) {
  failures.push('PR register must not list merge-ready PRs.');
}

const mergeReady = parsed['reeditpro-e2e-validation-queue-3-merge-ready-after-validation'];
if (mergeReady.mergeReadyAfterValidationCount !== 0 || (mergeReady.mergeReadyPrs ?? []).length !== 0) {
  failures.push('Merge-ready artifact must remain empty.');
}
if (mergeReady.mergeHygiene5Status?.readyNow !== false) {
  failures.push('Merge hygiene 5 must not be ready now.');
}

const blockers = parsed['reeditpro-e2e-validation-queue-3-blocker-fix-queue'];
if (!hasArrayValue((blockers.newBlockers ?? []).map((entry) => entry.prNumber), [255, 260])) {
  failures.push('Blocker queue must include new blockers for PR #255 and PR #260.');
}
if (!hasArrayValue((blockers.preservedBlockers ?? []).map((entry) => entry.prNumber), [264, 300, 305])) {
  failures.push('Blocker queue must preserve PR #264, #300, and #305 blockers.');
}
assertFalseGates(blockers.runtimeGates, 'blockers.runtimeGates');

const packageJson = JSON.parse(read('package.json'));
const expectedScript = 'node scripts/validation/reeditpro-e2e-validation-queue-3-diagnostics.mjs';
if (packageJson.scripts?.['reeditpro:e2e-validation-queue-3:diagnostics'] !== expectedScript) {
  failures.push('Missing package script reeditpro:e2e-validation-queue-3:diagnostics.');
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
