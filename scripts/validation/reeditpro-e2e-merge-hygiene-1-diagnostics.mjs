#!/usr/bin/env node
import fs from 'node:fs';

const expectedBlocks = [
  ['docs/reeditpro-e2e-merge-hygiene-1-open-pr-ready-queue.md', 'reeditpro-e2e-merge-hygiene-1-open-pr-ready-queue'],
  ['docs/reeditpro-e2e-open-pr-classification-register.md', 'reeditpro-e2e-open-pr-classification-register'],
  ['docs/reeditpro-e2e-open-pr-merge-prompt-queue.md', 'reeditpro-e2e-open-pr-merge-prompt-queue'],
  ['docs/reeditpro-e2e-open-pr-validation-prompt-queue.md', 'reeditpro-e2e-open-pr-validation-prompt-queue'],
  ['docs/reeditpro-e2e-open-pr-owner-review-queue.md', 'reeditpro-e2e-open-pr-owner-review-queue'],
  ['docs/reeditpro-e2e-open-pr-conflict-superseded-register.md', 'reeditpro-e2e-open-pr-conflict-superseded-register'],
];

const promptFiles = [
  'docs/implementation-prompts/prompt-reeditpro-e2e-merge-hygiene-2-merge-ready-prs.md',
  'docs/implementation-prompts/prompt-reeditpro-e2e-validation-queue-1-run-missing-validations.md',
];

const expectedDecision = 'reeditpro_e2e_merge_hygiene_ready_queue_completed_with_warnings_ready_for_merge_ready_prs';
const noScopeStatement =
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.';

const failures = [];

function fail(message) {
  failures.push(message);
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Missing file: ${file}`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

function parseBlock(file, label) {
  const content = read(file);
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp('```json ' + escaped + '\\n([\\s\\S]*?)\\n```'));
  if (!match) {
    fail(`Missing JSON block ${label} in ${file}`);
    return null;
  }
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    fail(`Invalid JSON block ${label} in ${file}: ${error.message}`);
    return null;
  }
}

const parsed = Object.fromEntries(expectedBlocks.map(([file, label]) => [label, parseBlock(file, label)]));
const allContent = [
  ...expectedBlocks.map(([file]) => read(file)),
  ...promptFiles.map((file) => read(file)),
  read('scripts/validation/reeditpro-e2e-merge-hygiene-1-diagnostics.mjs'),
].join('\n');

const main = parsed['reeditpro-e2e-merge-hygiene-1-open-pr-ready-queue'];
const register = parsed['reeditpro-e2e-open-pr-classification-register'];
const mergeQueue = parsed['reeditpro-e2e-open-pr-merge-prompt-queue'];
const validationQueue = parsed['reeditpro-e2e-open-pr-validation-prompt-queue'];
const ownerQueue = parsed['reeditpro-e2e-open-pr-owner-review-queue'];
const conflictRegister = parsed['reeditpro-e2e-open-pr-conflict-superseded-register'];

if (main?.decision !== expectedDecision) fail('Unexpected decision value.');
if (main?.sourceEvidence?.pr512?.state !== 'MERGED') fail('PR #512 merged evidence missing.');
if (main?.sourceEvidence?.pr512?.decision !== 'reeditpro_e2e_blocker_audit_completed_with_warnings_ready_for_merge_queue') {
  fail('PR #512 decision missing.');
}
if (main?.sourceEvidence?.soundScopedLane?.completeWithWarnings !== true) fail('SOUND scoped lane completion missing.');
if (main?.sourceEvidence?.soundScopedLane?.scopedStatus !== 'sound_oss_tools_synthetic_fixture_validation_passed_with_warnings') {
  fail('SOUND scoped status mismatch.');
}
if (main?.sourceEvidence?.soundScopedLane?.humanWording !== 'SOUND OSS scoped synthetic fixture validation passed with warnings') {
  fail('SOUND human wording mismatch.');
}
if (main?.sourceEvidence?.soundScopedLane?.noSoundOssTools16PromptExists !== true) {
  fail('SOUND-OSS-TOOLS-16 no-prompt evidence missing.');
}
if (
  fs.existsSync('docs/implementation-prompts/prompt-sound-oss-tools-16.md') ||
  fs.existsSync('docs/implementation-prompts/prompt-sound-oss-tools-16-no-next-implementation.md')
) {
  fail('Unexpected SOUND-OSS-TOOLS-16 prompt file exists.');
}

const blockedClaims = main?.sourceEvidence?.blockedClaims || {};
for (const status of [
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime_ready',
  'media_processing_ready',
  'beta_ready',
  'production_ready',
]) {
  if (blockedClaims[status]?.claimed !== false) fail(`Forbidden status is not explicitly unclaimed: ${status}`);
}

const gates = main?.sourceEvidence?.runtimeGates || {};
for (const [key, value] of Object.entries(gates)) {
  if (value !== false) fail(`Runtime gate is not blocked false: ${key}`);
}

if (!Array.isArray(register?.records)) {
  fail('Classification register records missing.');
} else if (register.records.length !== main?.queueCounts?.liveOpenPrCount) {
  fail('Classification register record count does not match live open PR count.');
}

const allowedActions = new Set([
  'ready_to_merge',
  'validate_first',
  'keep_draft',
  'blocked_conflict',
  'owner_review_required',
  'superseded',
  'duplicate_risk',
]);
for (const record of register?.records || []) {
  if (!allowedActions.has(record.mergeAction)) {
    fail(`Invalid mergeAction for PR #${record.prNumber}: ${record.mergeAction}`);
  }
}

if (mergeQueue?.readyToMergeCount !== main?.queueCounts?.readyToMerge) fail('Merge queue count mismatch.');
if (validationQueue?.needsValidationCount !== main?.queueCounts?.needsValidation) fail('Validation queue count mismatch.');
if (ownerQueue?.ownerReviewOrDraftCount !== main?.queueCounts?.ownerReviewOrDraft) fail('Owner queue count mismatch.');
if (
  conflictRegister?.conflictOrDuplicateCount !==
  (main?.queueCounts?.dirtyConflicted || 0) + (main?.queueCounts?.supersededDuplicateRisk || 0)
) {
  fail('Conflict/superseded register count mismatch.');
}

for (const required of [
  'REEDITPRO-E2E-MERGE-HYGIENE-2: merge ready PRs, no execution',
  'REEDITPRO-E2E-VALIDATION-QUEUE-1: run missing validations, no execution',
  noScopeStatement,
]) {
  if (!allContent.includes(required)) fail(`Missing required wording: ${required}`);
}

const unsafeTrue =
  /"(?:supabaseMutationAllowed|sqlExecutionAllowed|googleCloudApiCallAllowed|secretManagerApiCallAllowed|providerCallAllowed|modelCallAllowed|workerExecutionAllowed|routeExecutionAllowed|toolExecutionAllowed|mediaProcessingAllowed|ffmpegOrFfprobeAllowed|dockerOrCloudRunAllowed|browserCaptureAllowed|storageTransferAllowed|signedUrlCreationAllowed|publicArtifactCreationAllowed|creditMutationAllowed|stripePaymentProcessingAllowed|internalBetaUnlockAllowed|externalBetaUnlockAllowed|productionUnlockAllowed|rawPromptExecutionAllowed|finalRenderExportAllowed|broadServiceRoleHandlerAllowed)"\s*:\s*true/i;
if (unsafeTrue.test(allContent)) fail('Unsafe runtime or readiness true flag found.');

const secretPatterns = [
  /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/i,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /\b(?:sk|pk|rk|ghp|github_pat|glpat|AKIA|AIza)[A-Za-z0-9_-]{16,}\b/,
  /postgres(?:ql)?:\/\//i,
  /\bhttps?:\/\/[^\s"')]+\.supabase\.co\b/i,
  /https?:\/\/[^\s"')]+(?:X-Amz-Signature|Signature=|signed|token=)[^\s"')]+/i,
];
for (const pattern of secretPatterns) {
  if (pattern.test(allContent)) fail(`Secret-shaped content found: ${pattern}`);
}

if (/signedUrlCreationAllowed"\s*:\s*true|publicArtifactCreationAllowed"\s*:\s*true|supabaseMutationAllowed"\s*:\s*true/i.test(allContent)) {
  fail('Signed/public artifact or Supabase mutation claim found.');
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: main.decision,
      liveOpenPrCount: main.queueCounts.liveOpenPrCount,
      readyToMerge: main.queueCounts.readyToMerge,
      needsValidation: main.queueCounts.needsValidation,
      ownerReviewOrDraft: main.queueCounts.ownerReviewOrDraft,
      dirtyConflicted: main.queueCounts.dirtyConflicted,
      supersededDuplicateRisk: main.queueCounts.supersededDuplicateRisk,
    },
    null,
    2,
  ),
);
