#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const decision = 'e2e_pr305_hydration_blocker_resolved_ready_for_validation_rerun';
const reportDir = 'docs/e2e-validation/pr-305-hydration-blocker-resolution';

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/source-of-truth-audit.md`,
  `${reportDir}/npm-ci-hydration-attempt-report.json`,
  `${reportDir}/npm-ci-hydration-attempt-report.md`,
  `${reportDir}/npm-log-environment-review.json`,
  `${reportDir}/npm-log-environment-review.md`,
  `${reportDir}/safe-retry-policy.json`,
  `${reportDir}/safe-retry-policy.md`,
  `${reportDir}/pr-305-validation-readiness-review.json`,
  `${reportDir}/pr-305-validation-readiness-review.md`,
  `${reportDir}/pr-305-hydration-blocker-resolution-decision.json`,
  `${reportDir}/pr-305-hydration-blocker-resolution-decision.md`,
  `${reportDir}/pr-305-hydration-blocker-resolution-readiness-report.json`,
  `${reportDir}/pr-305-hydration-blocker-resolution-private-artifact-manifest.json`,
  `${reportDir}/pr-305-hydration-blocker-resolution-validation-results.md`,
  'docs/implementation-prompts/prompt-reeditpro-e2e-validation-pr-305-rerun-after-hydration-resolution.md',
  'scripts/validation/reeditpro-e2e-pr-305-hydration-blocker-resolution-diagnostics.mjs',
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(file) {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    fail(`Missing required file: ${file}`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
}

function readJson(file) {
  const content = read(file);
  if (!content) return {};
  try {
    return JSON.parse(content);
  } catch (error) {
    fail(`Invalid JSON in ${file}: ${error.message}`);
    return {};
  }
}

for (const file of requiredFiles) read(file);

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`);
const attempt = readJson(`${reportDir}/npm-ci-hydration-attempt-report.json`);
const environment = readJson(`${reportDir}/npm-log-environment-review.json`);
const retryPolicy = readJson(`${reportDir}/safe-retry-policy.json`);
const readiness = readJson(`${reportDir}/pr-305-validation-readiness-review.json`);
const decisionReport = readJson(`${reportDir}/pr-305-hydration-blocker-resolution-decision.json`);
const readinessReport = readJson(`${reportDir}/pr-305-hydration-blocker-resolution-readiness-report.json`);
const manifest = readJson(`${reportDir}/pr-305-hydration-blocker-resolution-private-artifact-manifest.json`);
const packageJson = readJson('package.json');

if (sourceAudit?.centralSourceEvidence?.pr533?.state !== 'MERGED') fail('PR #533 merged evidence is missing.');
if (sourceAudit?.centralSourceEvidence?.pr533?.mergeCommit !== '1893ac00814971c7d2a05958dd6971052193f4e6') {
  fail('PR #533 merge commit evidence mismatch.');
}
if (sourceAudit?.e2eSourceEvidence?.pr523?.state !== 'MERGED') fail('PR #523 merged evidence is missing.');
if (sourceAudit?.e2eSourceEvidence?.pr523?.mergeCommit !== 'f258967676c4877d3e1627b5710b789cff04b451') {
  fail('PR #523 merge commit evidence mismatch.');
}
if (sourceAudit?.e2eSourceEvidence?.pr523?.pr305FixDecision !== 'pr_305_validation_blocked_npm_ci_failed') {
  fail('PR #305 source blocker from PR #523 is missing.');
}
if (sourceAudit?.targetPr?.number !== 305 || sourceAudit?.targetPr?.headRefOid !== '757686f49d85cb7d346b55a1712e1d34a6bdde03') {
  fail('PR #305 target metadata mismatch.');
}
if (sourceAudit?.targetPr?.mutatedByThisPacket !== false) fail('PR #305 must not be mutated by this packet.');

if (attempt?.command !== 'npm ci --ignore-scripts --no-audit --no-fund') fail('Unexpected npm ci command.');
if (attempt?.exitCode !== 0 || attempt?.completed !== true || attempt?.hung !== false || attempt?.interrupted !== false) {
  fail('Hydration attempt did not record a clean completion.');
}
for (const binary of ['tsx', 'eslint', 'tsc', 'vite']) {
  if (attempt?.toolBinariesAfterHydration?.[binary] !== 'present') fail(`Missing required binary evidence: ${binary}`);
  if (readiness?.requiredBinariesPresent?.[binary] !== true) fail(`Readiness binary evidence missing: ${binary}`);
}
if (attempt?.packageHashes?.packageJsonChanged !== false || attempt?.packageHashes?.packageLockChanged !== false) {
  fail('Hydration attempt must not mutate package files.');
}
if (attempt?.fullPr305ValidationRun !== false || readiness?.fullValidationRun !== false) {
  fail('Full PR #305 validation must not run in this phase.');
}
if (environment?.classification?.failureObserved !== false) fail('Environment review should record no failure for the completed attempt.');
if (retryPolicy?.retryPerformed !== false || retryPolicy?.retryAllowed !== false) fail('Retry policy should record no retry after successful hydration.');
if (readiness?.canReenterValidationQueue !== true) fail('PR #305 should be ready for a validation rerun.');
if (readiness?.canMovePr305ToMergeQueue !== false) fail('PR #305 must not be merge-ready from hydration alone.');
if (readiness?.mergeReadyValidations !== 0 || readinessReport?.mergeReadyValidations !== 0) {
  fail('Merge-ready validations must remain zero.');
}
if (decisionReport?.decision !== decision || readinessReport?.decision !== decision) fail('Decision string mismatch.');
if (decisionReport?.pr305MergeReady !== false) fail('Decision must not claim PR #305 is merge-ready.');
if (decisionReport?.nextPrompt !== 'REEDITPRO_E2E_VALIDATION_PR_305_RERUN_AFTER_HYDRATION_RESOLUTION') {
  fail('Next prompt mismatch.');
}
if (manifest?.publicArtifactsCreated !== false || manifest?.signedUrlsCreated !== false || manifest?.secretPayloadPrinted !== false) {
  fail('Private manifest must keep public/signed/secret artifacts false.');
}
if (
  packageJson?.scripts?.['reeditpro:e2e-pr-305-hydration-blocker-resolution:diagnostics'] !==
  'node scripts/validation/reeditpro-e2e-pr-305-hydration-blocker-resolution-diagnostics.mjs'
) {
  fail('Package diagnostics script missing.');
}

const allContent = requiredFiles.map(read).join('\n');
for (const forbidden of [
  /40\+[^.\n]*(installed|proven|end-to-end)/i,
  /E2E queue[^.\n]*(unblocked|merge-ready)/i,
  /workerExecutionAllowed"?\s*:\s*true/i,
  /routeExecutionAllowed"?\s*:\s*true/i,
  /providerCallAllowed"?\s*:\s*true/i,
  /supabaseMutationAllowed"?\s*:\s*true/i,
  /gcsUploadAllowed"?\s*:\s*true/i,
  /publicArtifact[^.\n]*created[^.\n]*true/i,
  /signedUrl[^.\n]*created[^.\n]*true/i,
  /betaUnlock[^.\n]*true/i,
  /productionUnlock[^.\n]*true/i,
  /rawPrompt[^.\n]*true/i,
]) {
  if (forbidden.test(allContent)) fail(`Forbidden claim matched: ${forbidden}`);
}

for (const [key, value] of Object.entries(decisionReport?.blockedScopeConfirmation || {})) {
  if (key === 'fullPr305Validation' && value !== false) fail('Full PR #305 validation scope must be false.');
  if (key !== 'fullPr305Validation' && value !== false) fail(`Blocked scope must remain false: ${key}`);
}

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    }).trim();
  } catch (error) {
    fail(`git ${args.join(' ')} failed: ${error.message}`);
    return '';
  }
}

const packageDiff = git(['diff', '--name-only', '--', 'package-lock.json']);
if (packageDiff) fail('package-lock.json has an unstaged diff.');
const stagedPackageDiff = git(['diff', '--cached', '--name-only', '--', 'package-lock.json']);
if (stagedPackageDiff) fail('package-lock.json has a staged diff.');

const stagedFiles = git(['diff', '--cached', '--name-only'])
  .split('\n')
  .filter(Boolean);
for (const file of stagedFiles) {
  if (/^(node_modules|dist|dist-|npm-cache|\.npm)/.test(file)) fail(`Generated output staged: ${file}`);
  if (file === 'package-lock.json' || file === '.dockerignore' || file === 'docker/prod/render-worker/Dockerfile') {
    fail(`Protected file staged unexpectedly: ${file}`);
  }
}

for (const generatedPath of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(root, generatedPath))) fail(`Generated output present in reporting worktree: ${generatedPath}`);
}

if (failures.length) {
  console.error('PR #305 hydration blocker diagnostics failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PR #305 hydration blocker diagnostics passed: ${decision}`);
