import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_internal_dry_run_execution_after_plan_review_completed_with_warnings_ready_for_dry_run_execution_owner_review_no_external_beta';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_plan_owner_review_after_planning_passed_with_warnings_ready_for_controlled_internal_dry_run_execution_prompt';
const descriptorDigest = '278afb2895eeebdbb433b858fa6df87e966d2dcf4d21826380e11956121ce81a';

const files = {
  result:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-result-after-plan-review.md',
  descriptor:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-synthetic-descriptor-register-after-plan-review.md',
  output:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-sanitized-output-after-plan-review.md',
  noMedia:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-no-media-no-artifact-policy-after-plan-review.md',
  ownerReadiness:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-owner-review-readiness-after-plan-review.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-claim-policy-after-plan-review.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-after-execution.md',
  runner:
    'scripts/validation/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-runner.mjs',
  sourceReview:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-after-planning.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-acceptance-register-after-planning.md',
  sourceInput:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-owner-review-after-planning.md',
  sourceExecutionReadiness:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-readiness-after-plan-review.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-claim-policy-after-planning.md'
};

const labels = {
  result:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-result-after-plan-review',
  descriptor:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-synthetic-descriptor-register-after-plan-review',
  output:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-sanitized-output-after-plan-review',
  noMedia:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-no-media-no-artifact-policy-after-plan-review',
  ownerReadiness:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-owner-review-readiness-after-plan-review',
  policy:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-claim-policy-after-plan-review',
  sourceReview:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-after-planning',
  sourceAcceptance:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-acceptance-register-after-planning',
  sourceInput:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-owner-review-after-planning',
  sourceExecutionReadiness:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-readiness-after-plan-review',
  sourcePolicy:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-claim-policy-after-planning'
};

const forbiddenText = [
  '"externalBetaUnlocked": true',
  '"realUserMediaBetaUnlocked": true',
  '"paidProductionUnlocked": true',
  '"productionUnlocked": true',
  '"workerExecutionEnabled": true',
  '"routeExecutionEnabled": true',
  '"mediaProcessingEnabled": true',
  '"artifactDeliveryEnabled": true',
  '"supabaseMutationEnabled": true',
  '"sqlExecutionEnabled": true',
  '"deploymentEnabled": true',
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"paidProductionAllowed": true',
  '"productionAllowed": true',
  '"mediaOpened": true',
  '"mediaProcessed": true',
  '"artifactWritten": true',
  '"workerDispatched": true',
  '"routeCalled": true',
  '"providerCalled": true',
  '"modelCalled": true',
  '"supabaseTouched": true',
  '"sqlExecuted": true',
  '"sqlExecuted": "yes"',
  '"signedUrlCreated": true',
  '"generatedLocalFixturePassedClaimed": true',
  '"dryRunPassedClaimed": true',
  '"migrationDeployed": "yes"',
  '"environmentTouched": "yes"',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'BEGIN RSA',
  'BEGIN OPENSSH'
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readRequired(relativePath) {
  const absolutePath = join(root, relativePath);
  assert(existsSync(absolutePath), `Missing required file: ${relativePath}`);
  return readFileSync(absolutePath, 'utf8');
}

function parseJsonFence(markdown, label) {
  const fence = '```json ' + label;
  const start = markdown.indexOf(fence);
  assert(start !== -1, `Missing JSON fence: ${label}`);
  const jsonStart = markdown.indexOf('\n', start);
  const end = markdown.indexOf('```', jsonStart + 1);
  assert(jsonStart !== -1 && end !== -1, `Unclosed JSON fence: ${label}`);
  return JSON.parse(markdown.slice(jsonStart + 1, end).trim());
}

const docs = Object.fromEntries(
  Object.entries(files).map(([key, relativePath]) => [key, readRequired(relativePath)])
);

for (const [key, text] of Object.entries(docs)) {
  if (key === 'runner') continue;
  for (const forbidden of forbiddenText) {
    assert(!text.includes(forbidden), `Forbidden widened claim or secret marker found in ${key}: ${forbidden}`);
  }
}

const parsed = Object.fromEntries(
  Object.entries(labels).map(([key, label]) => [key, parseJsonFence(docs[key], label)])
);

for (const key of ['result', 'descriptor', 'output', 'noMedia', 'ownerReadiness', 'policy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`);
}

assert(parsed.result.sourceDecision === sourceDecision, 'Source decision mismatch');
assert(parsed.result.sourcePr === 1349, 'Source PR mismatch');
assert(parsed.result.sourceMergeCommit === '7917e097170914bad3c1baeb5fca68b52f9b5b97', 'Source merge commit mismatch');
assert(parsed.result.sourceHeadCommit === '7bca125e3bf38b7102069ddb646f52b2e66a0f3f', 'Source head mismatch');
assert(parsed.result.controlledDryRunResult.attempted === true, 'Dry-run attempt missing');
assert(parsed.result.controlledDryRunResult.status === 'passed', 'Dry-run result not passed');
assert(parsed.result.controlledDryRunResult.acceptedSoundCpuToolCount === 15, 'Tool count mismatch');
assert(parsed.result.controlledDryRunResult.syntheticDescriptorCount === 15, 'Descriptor count mismatch');
assert(parsed.result.controlledDryRunResult.passed === 15, 'Passed count mismatch');
assert(parsed.result.controlledDryRunResult.failed === 0, 'Failed count mismatch');
assert(parsed.result.controlledDryRunResult.skipped === 0, 'Skipped count mismatch');
assert(parsed.result.controlledDryRunResult.descriptorDigest === descriptorDigest, 'Descriptor digest mismatch');
assert(parsed.result.controlledDryRunResult.runnerUsedNodeBuiltinsOnly === true, 'Runner builtins-only marker missing');
for (const key of [
  'mediaOpened',
  'mediaProcessed',
  'artifactWritten',
  'workerDispatched',
  'routeCalled',
  'providerCalled',
  'modelCalled',
  'supabaseTouched',
  'sqlExecuted',
  'signedUrlCreated',
  'externalBetaUnlocked',
  'productionUnlocked',
  'generatedLocalFixturePassedClaimed',
  'dryRunPassedClaimed'
]) {
  assert(parsed.result.controlledDryRunResult[key] === false, `Result flag widened: ${key}`);
}
assert(parsed.result.readinessRerun.prodReadinessOverallStatus === 'blocked', 'Readiness status mismatch');
assert(parsed.result.readinessRerun.prodReadinessHardBlockers === 101, 'Hard blockers mismatch');
assert(parsed.result.readinessRerun.internalDryRunAllowed === true, 'Internal dry-run not allowed');
assert(parsed.result.readinessRerun.externalBetaAllowed === false, 'External beta widened');

assert(parsed.descriptor.acceptedToolIds.length === 15, 'Accepted tool id count mismatch');
assert(parsed.descriptor.descriptorCounts.total === 15, 'Descriptor total mismatch');
assert(parsed.descriptor.descriptorCounts.passed === 15, 'Descriptor passed mismatch');
assert(parsed.descriptor.descriptorCounts.failed === 0, 'Descriptor failed mismatch');
assert(parsed.descriptor.descriptorDigest === descriptorDigest, 'Descriptor register digest mismatch');
assert(parsed.descriptor.runtimeFlagsRequiredFalse.includes('enableExternalBeta'), 'External beta false flag missing');

assert(parsed.output.sanitizedOutput.status === 'passed', 'Sanitized status mismatch');
assert(parsed.output.sanitizedOutput.artifactFileCreated === false, 'Artifact file was created');
assert(parsed.output.sanitizedOutput.secretOrTokenPresent === false, 'Secret marker present');
assert(parsed.output.sanitizedOutput.databaseUrlPresent === false, 'Database URL marker present');
assert(parsed.output.outputRedactionPolicy.keepOnlyCountsAndBooleans === true, 'Output redaction policy missing');

for (const value of Object.values(parsed.noMedia.observedDuringAttempt)) {
  assert(value === false, 'Observed no-media/no-artifact policy widened');
}
assert(parsed.noMedia.blockedDuringAttempt.mediaFileOpen === true, 'Media open not blocked');
assert(parsed.noMedia.blockedDuringAttempt.supabaseMutation === true, 'Supabase mutation not blocked');

assert(parsed.ownerReadiness.ownerReviewReadiness.dryRunExecutionOwnerReviewMayProceed === true, 'Owner review readiness missing');
for (const [key, value] of Object.entries(parsed.ownerReadiness.ownerReviewReadiness)) {
  if (key !== 'dryRunExecutionOwnerReviewMayProceed') assert(value === false, `Owner readiness widened: ${key}`);
}

assert(parsed.policy.allowedClaims.includes('external beta remains blocked'), 'Allowed external beta blocked claim missing');
for (const claim of [
  'external beta ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'worker execution readiness',
  'runtime readiness'
]) {
  assert(parsed.policy.forbiddenClaims.includes(claim), `Forbidden claim missing: ${claim}`);
}
assert(parsed.policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.policy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.policy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');

assert(parsed.sourceReview.decision === sourceDecision, 'Source review decision mismatch');
assert(parsed.sourceReview.sourcePr === 1348, 'Source review source PR mismatch');
assert(parsed.sourceAcceptance.counts.acceptedForControlledDryRunPromptCount === 15, 'Source accepted prompt count mismatch');
assert(parsed.sourceInput.ownerReviewOutcome.inputBoundaryAcceptedForNextControlledPrompt === true, 'Source input boundary not accepted');
assert(
  parsed.sourceExecutionReadiness.controlledExecutionPromptReadiness.controlledInternalDryRunExecutionPromptMayProceed === true,
  'Source execution prompt readiness missing'
);
assert(parsed.sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'Source policy SQL widened');

assert(docs.runner.includes("import { createHash } from 'node:crypto';"), 'Runner must use node:crypto');
assert(!docs.runner.includes("from 'node:fs'"), 'Runner must not import node:fs');
assert(!docs.runner.includes("from 'node:child_process'"), 'Runner must not import child_process');
assert(!docs.runner.includes('audioread.audio_open'), 'Runner must not open audio');
assert(!docs.runner.includes('ffmpeg'), 'Runner must not call ffmpeg');
assert(!docs.runner.includes('createClient'), 'Runner must not create a Supabase client');
assert(!docs.runner.includes('SUPABASE_'), 'Runner must not read Supabase environment variables');
assert(!docs.runner.includes('supabase.from'), 'Runner must not call Supabase query APIs');
assert(docs.runner.includes('syntheticDescriptors.length === 15'), 'Runner descriptor count assertion missing');
assert(/no external beta/i.test(docs.nextPrompt), 'Next prompt missing no-external-beta boundary');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-internal-dry-run-execution-after-plan-review:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-after-plan-review-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_controlled_internal_dry_run_execution_after_plan_review_diagnostics_passed',
      decision,
      sourcePr: 1349,
      sourceMergeCommit: '7917e097170914bad3c1baeb5fca68b52f9b5b97',
      acceptedSoundCpuToolCount: 15,
      syntheticDescriptorCount: 15,
      failed: 0,
      descriptorDigest,
      mediaOpened: false,
      artifactWritten: false,
      workerDispatched: false,
      routeCalled: false,
      supabaseTouched: false,
      externalBetaUnlocked: false,
      productionUnlocked: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-INTERNAL-DRY-RUN-EXECUTION-OWNER-REVIEW-AFTER-EXECUTION: review bounded internal dry-run evidence, no external beta'
    },
    null,
    2
  )
);
