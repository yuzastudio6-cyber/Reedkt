#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const reportDir = 'docs/e2e-validation/pr-305-validation-rerun-after-hydration';
const decision = 'e2e_pr305_validation_rerun_passed_ready_for_merge_hygiene';

const requiredFiles = [
  `${reportDir}/source-audit.json`,
  `${reportDir}/source-audit.md`,
  `${reportDir}/hydration-recheck-report.json`,
  `${reportDir}/hydration-recheck-report.md`,
  `${reportDir}/static-validation-report.json`,
  `${reportDir}/static-validation-report.md`,
  `${reportDir}/build-classification-report.json`,
  `${reportDir}/build-classification-report.md`,
  `${reportDir}/safety-scan-report.json`,
  `${reportDir}/safety-scan-report.md`,
  `${reportDir}/merge-readiness-review.json`,
  `${reportDir}/merge-readiness-review.md`,
  `${reportDir}/decision.json`,
  `${reportDir}/decision.md`,
  `${reportDir}/readiness-report.json`,
  `${reportDir}/private-manifest.json`,
  `${reportDir}/validation-results.md`,
  'docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-pr-305-after-validation-rerun.md',
  'scripts/validation/reeditpro-e2e-pr-305-validation-rerun-after-hydration-diagnostics.mjs'
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

function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
    }).trim();
  } catch (error) {
    fail(`git ${args.join(' ')} failed: ${error.message}`);
    return '';
  }
}

for (const file of requiredFiles) read(file);

const source = readJson(`${reportDir}/source-audit.json`);
const hydration = readJson(`${reportDir}/hydration-recheck-report.json`);
const statics = readJson(`${reportDir}/static-validation-report.json`);
const build = readJson(`${reportDir}/build-classification-report.json`);
const safety = readJson(`${reportDir}/safety-scan-report.json`);
const mergeReadiness = readJson(`${reportDir}/merge-readiness-review.json`);
const decisionReport = readJson(`${reportDir}/decision.json`);
const readiness = readJson(`${reportDir}/readiness-report.json`);
const manifest = readJson(`${reportDir}/private-manifest.json`);
const packageJson = readJson('package.json');

if (source?.sourceEvidence?.pr538?.state !== 'MERGED') fail('PR #538 merged source evidence missing.');
if (source?.sourceEvidence?.pr538?.mergeCommit !== '698af943b30b0fd35aab76d546734c7787bda144') fail('PR #538 merge commit mismatch.');
if (source?.sourceEvidence?.pr533?.state !== 'MERGED') fail('PR #533 merged source evidence missing.');
if (source?.sourceEvidence?.pr523?.state !== 'MERGED') fail('PR #523 merged source evidence missing.');
if (source?.sourceEvidence?.pr523?.priorPr305Blocker !== 'pr_305_validation_blocked_npm_ci_failed') fail('PR #523 PR #305 blocker evidence missing.');
if (source?.targetPr?.number !== 305 || source?.targetPr?.headRefOid !== '757686f49d85cb7d346b55a1712e1d34a6bdde03') fail('PR #305 target metadata mismatch.');
if (source?.targetPr?.sourceMutatedByThisPacket !== false || source?.targetPr?.mergedByThisPacket !== false) fail('PR #305 must remain unmutated and unmerged by this packet.');

if (hydration?.command !== 'npm ci --ignore-scripts --no-audit --no-fund') fail('Unexpected hydration command.');
if (hydration?.exitCode !== 0 || hydration?.completed !== true || hydration?.timedOut !== false || hydration?.interrupted !== false) fail('Hydration did not record a clean pass.');
for (const binary of ['tsx', 'eslint', 'tsc', 'vite']) {
  if (hydration?.requiredBinaries?.[binary] !== true) fail(`Missing required hydration binary: ${binary}`);
}
if (hydration?.packageHashes?.packageJsonChanged !== false || hydration?.packageHashes?.packageLockChanged !== false) fail('Hydration package hashes changed.');

if (statics?.allStaticValidationPassed !== true) fail('Static validation did not pass.');
for (const command of statics?.commands || []) {
  if (command.exitCode !== 0) fail(`Static validation command failed: ${command.command}`);
}
if (statics?.scriptsAbsent?.length) fail(`Required scripts absent: ${statics.scriptsAbsent.join(', ')}`);

for (const command of build?.commands || []) {
  if (command.exitCode !== 0 || command.classification !== 'passed') fail(`Build classification command failed: ${command.command}`);
}
if (build?.knownDarwinRolldownEnvironmentBlockerObserved !== false || build?.buildExceptionReviewNeeded !== false) fail('Build classification should not require environment exception review.');
if (build?.cleanupCompleted !== true || build?.generatedOutputsRemainAfterCleanup !== false) fail('Build output cleanup evidence is incomplete.');

if (safety?.passed !== true || safety?.forbiddenFindings !== 0) fail('Safety scan did not pass.');
if (mergeReadiness?.canEnterMergeHygiene !== true || mergeReadiness?.canMergeImmediately !== false) fail('Merge-readiness flags are incorrect.');
if (mergeReadiness?.mergeReadyValidationsAddedByThisPacket !== 1) fail('Expected one merge-ready validation for PR #305.');
if (mergeReadiness?.endToEndProductReadyTools !== 0) fail('End-to-end product-ready tool count must remain 0.');

if (decisionReport?.decision !== decision || readiness?.decision !== decision) fail('Decision string mismatch.');
if (decisionReport?.nextPromptFile !== 'docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-pr-305-after-validation-rerun.md') fail('Next prompt file mismatch.');
if (decisionReport?.pr305?.canEnterMergeHygiene !== true || decisionReport?.pr305?.canMergeImmediately !== false) fail('Decision PR #305 readiness flags are incorrect.');
if (decisionReport?.pr305?.mergeReadyValidations !== 1 || readiness?.pr305?.mergeReadyValidations !== 1) fail('Decision/readiness merge-ready validation count mismatch.');
if (decisionReport?.pr305?.mergedByThisPacket !== false || decisionReport?.pr305?.sourceMutatedByThisPacket !== false) fail('Decision must not claim PR #305 mutation or merge.');

for (const [scope, value] of Object.entries(decisionReport?.blockedScopeConfirmation || {})) {
  if (value !== false) fail(`Blocked scope must remain false: ${scope}`);
}
if (decisionReport?.supabaseClassification?.updateRequired !== 'no write') fail('Supabase no-write classification missing.');
if (manifest?.publicArtifactsCreated !== false || manifest?.signedUrlsCreated !== false || manifest?.secretPayloadPrinted !== false) fail('Private manifest public/signed/secret flags must be false.');
if (manifest?.packageLockMutated !== false || manifest?.dockerFilesMutated !== false) fail('Private manifest protected-file mutation flags must be false.');

if (
  packageJson?.scripts?.['reeditpro:e2e-pr-305-validation-rerun-after-hydration:diagnostics'] !==
  'node scripts/validation/reeditpro-e2e-pr-305-validation-rerun-after-hydration-diagnostics.mjs'
) {
  fail('Package diagnostics script missing.');
}

const contentFiles = requiredFiles.filter((file) => !file.endsWith('reeditpro-e2e-pr-305-validation-rerun-after-hydration-diagnostics.mjs'));
const allContent = contentFiles.map(read).join('\n');
const lines = allContent.split(/\r?\n/);
for (const line of lines) {
  if (/40\+[^.\n]*(installed|proven|end-to-end)/i.test(line) && !/\b(?:do not|no|not|warning|never)\b/i.test(line)) {
    fail(`Forbidden 40+ end-to-end claim: ${line.trim()}`);
  }
  if (/end-to-end product-ready tools/i.test(line) && !/(?:remain|remains|:)\s*`?0`?/i.test(line)) {
    fail(`Forbidden product-ready tool count claim: ${line.trim()}`);
  }
  if (/pr #305[^.\n]*(merged by this packet|was merged in this phase)/i.test(line) && !/\b(?:not|false|did not)\b/i.test(line)) {
    fail(`Forbidden PR #305 merge claim: ${line.trim()}`);
  }
}

const forbiddenPatterns = [
  /worker[^.\n]*(execution|runtime)[^.\n]*(enabled|unlocked|approved: true)/i,
  /provider[^.\n]*(call|runtime)[^.\n]*(enabled|unlocked|approved: true)/i,
  /supabase[^.\n]*(write|mutation|sql)[^.\n]*(enabled|executed|approved: true)/i,
  /gcs[^.\n]*(upload|write)[^.\n]*(enabled|executed|approved: true)/i,
  /public artifact[^.\n]*(created|enabled|approved: true)/i,
  /signed url[^.\n]*(created|enabled|approved: true)/i,
  /beta[^.\n]*(unlocked|approved: true)/i,
  /production[^.\n]*(unlocked|approved: true)/i,
  /raw prompt[^.\n]*(executed|approved: true)/i,
  /-----BEGIN (?:RSA |EC |OPENSSH |DSA |)?PRIVATE KEY-----/i,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b|github_pat_[A-Za-z0-9_]{20,}/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /https?:\/\/[a-z0-9-]+\.supabase\.co\b/i,
  new RegExp(
    `https?:\\/\\/[^\\s)"']*(?:X-${'Amz'}-${'Signature'}|X-${'Goog'}-${'Signature'}|Google${'Access'}Id|AWS${'Access'}KeyId|${'Signature'}=|${'Expires'}=|${'sig'}=)[^\\s)"']*`,
    'i',
  )
];
for (const pattern of forbiddenPatterns) {
  if (pattern.test(allContent)) fail(`Forbidden content matched: ${pattern}`);
}

const protectedDiff = git(['diff', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']);
if (protectedDiff) fail(`Protected file has unstaged diff: ${protectedDiff}`);
const protectedStagedDiff = git(['diff', '--cached', '--name-only', '--', 'package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']);
if (protectedStagedDiff) fail(`Protected file has staged diff: ${protectedStagedDiff}`);

const stagedFiles = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean);
for (const file of stagedFiles) {
  if (/^(node_modules|dist|dist-|npm-cache|\.npm)/.test(file)) fail(`Generated output staged: ${file}`);
  if (/\.(?:mp4|mov|m4v|webm|mkv|avi|mp3|wav|flac|aac|ogg|png|jpe?g|gif|webp|avif)$/i.test(file)) fail(`Media/binary artifact staged: ${file}`);
}

for (const generatedPath of ['node_modules', 'dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker']) {
  if (fs.existsSync(path.join(root, generatedPath))) fail(`Generated output present in reporting worktree: ${generatedPath}`);
}

if (failures.length) {
  console.error('PR #305 validation rerun diagnostics failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PR #305 validation rerun diagnostics passed: ${decision}`);
