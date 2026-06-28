import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_plan_owner_review_after_planning_passed_with_warnings_ready_for_controlled_internal_dry_run_execution_prompt';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_planning_after_operator_review_completed_with_warnings_ready_for_dry_run_plan_owner_review_no_execution';

const files = {
  review:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-after-planning.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-acceptance-register-after-planning.md',
  inputBoundary:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-owner-review-after-planning.md',
  stopReview:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-stop-condition-owner-review-after-planning.md',
  executionReadiness:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-readiness-after-plan-review.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-claim-policy-after-planning.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-after-plan-review.md',
  sourcePlan:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-after-operator-review.md',
  sourceInput:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-after-operator-review.md',
  sourceStop:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-stop-condition-register-after-operator-review.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-evidence-requirements-after-operator-review.md',
  sourceOwnerReadiness:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-readiness-after-operator-review.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-claim-policy-after-operator-review.md'
};

const labels = {
  review:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-after-planning',
  acceptance:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-acceptance-register-after-planning',
  inputBoundary:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-owner-review-after-planning',
  stopReview:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-stop-condition-owner-review-after-planning',
  executionReadiness:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-readiness-after-plan-review',
  policy:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-claim-policy-after-planning',
  sourcePlan:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-after-operator-review',
  sourceInput:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-after-operator-review',
  sourceStop:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-stop-condition-register-after-operator-review',
  sourceEvidence:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-evidence-requirements-after-operator-review',
  sourceOwnerReadiness:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-readiness-after-operator-review',
  sourcePolicy:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-claim-policy-after-operator-review'
};

const forbiddenText = [
  '"productWideInternalBetaUnlocked": true',
  '"externalBetaUnlocked": true',
  '"realUserMediaBetaUnlocked": true',
  '"paidProductionUnlocked": true',
  '"productionUnlocked": true',
  '"productToolCallExecutionEnabled": true',
  '"workerExecutionEnabled": true',
  '"routeExecutionEnabled": true',
  '"mediaProcessingEnabled": true',
  '"artifactDeliveryEnabled": true',
  '"supabaseMutationEnabled": true',
  '"sqlExecutionEnabled": true',
  '"creditMutationEnabled": true',
  '"stripePaymentProcessingEnabled": true',
  '"deploymentEnabled": true',
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"paidProductionAllowed": true',
  '"productionAllowed": true',
  '"dryRunExecution": "yes"',
  '"externalBetaMayProceedToday": true',
  '"realUserMediaBetaMayProceedToday": true',
  '"paidProductionMayProceedToday": true',
  '"productionMayProceedToday": true',
  '"workerExecutionMayProceedToday": true',
  '"routeExecutionMayProceedToday": true',
  '"mediaProcessingMayProceedToday": true',
  '"supabaseSqlMayProceedToday": true',
  '"sqlExecuted": "yes"',
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
  for (const forbidden of forbiddenText) {
    assert(!text.includes(forbidden), `Forbidden widened claim or secret marker found in ${key}: ${forbidden}`);
  }
}

const parsed = Object.fromEntries(
  Object.entries(labels).map(([key, label]) => [key, parseJsonFence(docs[key], label)])
);

for (const key of ['review', 'acceptance', 'inputBoundary', 'stopReview', 'executionReadiness', 'policy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`);
}

assert(parsed.review.sourceDecision === sourceDecision, 'Source decision mismatch');
assert(parsed.review.sourcePr === 1348, 'Source PR mismatch');
assert(parsed.review.sourceMergeCommit === '42d4ece2c1901642eed32294531cd4d8d1ba7dc4', 'Source merge commit mismatch');
assert(parsed.review.sourceHeadCommit === 'b1699882fbc0ea3536915f9a9b490949c524adbf', 'Source head commit mismatch');
assert(parsed.review.ownerReviewResult.dryRunPlanAccepted === true, 'Dry-run plan not accepted');
assert(parsed.review.ownerReviewResult.controlledInternalDryRunExecutionPromptMayProceedLater === true, 'Controlled execution prompt handoff missing');
assert(parsed.review.ownerReviewResult.currentPromptRunsDryRun === false, 'Current prompt runs dry run');
assert(parsed.review.ownerReviewResult.currentPromptExecutesWorker === false, 'Current prompt executes worker');
assert(parsed.review.ownerReviewResult.acceptedSoundCpuToolCount === 15, 'Accepted tool count mismatch');
assert(parsed.review.ownerReviewResult.acceptedForExecutionTodayCount === 0, 'Execution today count widened');
for (const flag of [
  'productWideInternalBetaUnlocked',
  'externalBetaUnlocked',
  'realUserMediaBetaUnlocked',
  'paidProductionUnlocked',
  'productionUnlocked',
  'productToolCallExecutionEnabled',
  'workerExecutionEnabled',
  'routeExecutionEnabled',
  'mediaProcessingEnabled',
  'artifactDeliveryEnabled',
  'supabaseMutationEnabled',
  'sqlExecutionEnabled',
  'creditMutationEnabled',
  'stripePaymentProcessingEnabled',
  'deploymentEnabled'
]) {
  assert(parsed.review.ownerReviewResult[flag] === false, `Review flag widened: ${flag}`);
}
assert(parsed.review.readinessRerun.prodReadinessOverallStatus === 'blocked', 'Readiness status mismatch');
assert(parsed.review.readinessRerun.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');
assert(parsed.review.readinessRerun.prodReadinessWarnings === 26, 'Warning count mismatch');
assert(parsed.review.readinessRerun.internalDryRunAllowed === true, 'Internal dry-run not allowed');
assert(parsed.review.readinessRerun.externalBetaAllowed === false, 'External beta widened');

assert(parsed.acceptance.acceptedForNextGate.controlledInternalDryRunExecutionPrompt === 'yes', 'Next execution prompt not accepted');
for (const [key, value] of Object.entries(parsed.acceptance.acceptedForToday)) {
  assert(value === 'no', `Today acceptance widened: ${key}`);
}
assert(parsed.acceptance.counts.acceptedSoundCpuToolCount === 15, 'Acceptance tool count mismatch');
assert(parsed.acceptance.counts.acceptedForExecutionTodayCount === 0, 'Acceptance execution count widened');
assert(parsed.acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'Acceptance external beta count widened');

assert(parsed.inputBoundary.ownerReviewOutcome.inputBoundaryAcceptedForNextControlledPrompt === true, 'Input boundary not accepted');
for (const [key, value] of Object.entries(parsed.inputBoundary.ownerReviewOutcome)) {
  if (key !== 'inputBoundaryAcceptedForNextControlledPrompt') assert(value === false, `Input boundary widened: ${key}`);
}
assert(parsed.inputBoundary.acceptedSyntheticInputCategories.length === 5, 'Synthetic input count mismatch');
assert(parsed.inputBoundary.forbiddenInputsStillBlocked.includes('real_user_media_path'), 'Real media input not blocked');
assert(parsed.inputBoundary.forbiddenInputsStillBlocked.includes('service_role_payload'), 'Service-role input not blocked');

assert(parsed.stopReview.acceptedStopConditions.length === 13, 'Stop condition count mismatch');
assert(parsed.stopReview.ownerReviewOutcome.stopConditionsAcceptedForNextControlledPrompt === true, 'Stop conditions not accepted');
assert(parsed.stopReview.ownerReviewOutcome.mustStopBeforeAnyExecutionIfTriggered === true, 'Stop guard missing');
assert(parsed.stopReview.currentObservedSafeValues.externalBetaAllowed === false, 'Stop review external beta widened');

assert(parsed.executionReadiness.controlledExecutionPromptReadiness.controlledInternalDryRunExecutionPromptMayProceed === true, 'Controlled prompt readiness missing');
for (const [key, value] of Object.entries(parsed.executionReadiness.controlledExecutionPromptReadiness)) {
  if (key !== 'controlledInternalDryRunExecutionPromptMayProceed') assert(value === false, `Execution readiness widened: ${key}`);
}
assert(
  parsed.executionReadiness.requiredPreflightForFutureExecutionPrompt.includes('require_internal_dry_run_allowed_true'),
  'Future execution preflight missing internal dry-run guard'
);
assert(
  parsed.executionReadiness.futurePromptMayNotClaimWithoutSeparateOwnerReview.includes('dry_run_passed'),
  'Dry-run pass owner-review guard missing'
);

assert(parsed.policy.allowedClaims.includes('external beta remains blocked'), 'Allowed blocked beta claim missing');
for (const claim of [
  'external beta ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'dry-run execution completed',
  'worker execution readiness',
  'runtime readiness'
]) {
  assert(parsed.policy.forbiddenClaims.includes(claim), `Forbidden claim missing: ${claim}`);
}
assert(parsed.policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.policy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.policy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');

assert(parsed.sourcePlan.decision === sourceDecision, 'Source plan decision mismatch');
assert(parsed.sourcePlan.sourcePr === 1347, 'Source plan source PR mismatch');
assert(parsed.sourceInput.acceptedForPlanningToday.syntheticInMemoryPayloadPlan === 'yes', 'Source input boundary missing');
assert(parsed.sourceStop.currentObservedSafeValues.externalBetaAllowed === false, 'Source stop external beta widened');
assert(parsed.sourceEvidence.futureOwnerReviewMustConfirm.sourcePr1347Merged === true, 'Source evidence owner-review source mismatch');
assert(parsed.sourceOwnerReadiness.ownerReviewReadiness.dryRunPlanOwnerReviewMayProceed === true, 'Source owner-review readiness missing');
assert(parsed.sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'Source policy SQL widened');
assert(/controlled bounded SOUND CPU internal dry-run/i.test(docs.nextPrompt), 'Next prompt missing controlled dry-run wording');
assert(/No product-wide internal beta unlock/i.test(docs.nextPrompt), 'Next prompt missing no-unlock boundary');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-after-planning:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-after-planning-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_plan_owner_review_after_planning_diagnostics_passed',
      decision,
      sourcePr: 1348,
      sourceMergeCommit: '42d4ece2c1901642eed32294531cd4d8d1ba7dc4',
      acceptedSoundCpuToolCount: 15,
      currentPromptRunsDryRun: false,
      controlledInternalDryRunExecutionPromptMayProceedLater: true,
      acceptedForExecutionTodayCount: 0,
      externalBetaUnlocked: false,
      productionUnlocked: false,
      prodReadinessHardBlockers: 101,
      prodReadinessWarnings: 26,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-INTERNAL-DRY-RUN-EXECUTION-AFTER-PLAN-REVIEW: run one controlled bounded internal dry run only if preflight passes, no external beta'
    },
    null,
    2
  )
);
