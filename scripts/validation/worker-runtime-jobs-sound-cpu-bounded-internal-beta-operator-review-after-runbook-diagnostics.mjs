import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_bounded_internal_beta_operator_review_after_runbook_passed_with_warnings_ready_for_internal_operator_dry_run_planning_no_execution';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_internal_beta_operator_runbook_after_owner_confirmation_completed_with_warnings_ready_for_internal_operator_review_no_execution';

const files = {
  review: 'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-after-runbook.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-acceptance-register-after-runbook.md',
  runbookReview:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-review-register-after-runbook.md',
  stopReview:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-stop-condition-review-after-runbook.md',
  planningReadiness:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-readiness-after-runbook.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-claim-policy-after-runbook.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-after-operator-review.md',
  sourceRunbook:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-after-owner-confirmation.md',
  sourceStop:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-stop-condition-register-after-owner-confirmation.md',
  sourceRollback:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-rollback-register-after-owner-confirmation.md',
  sourceHandoff:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-evidence-handoff-map-after-owner-confirmation.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-readiness-register-after-owner-confirmation.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-claim-policy-after-owner-confirmation.md'
};

const labels = {
  review: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-after-runbook',
  acceptance: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-acceptance-register-after-runbook',
  runbookReview: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-review-register-after-runbook',
  stopReview: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-stop-condition-review-after-runbook',
  planningReadiness: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-readiness-after-runbook',
  policy: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-claim-policy-after-runbook',
  sourceRunbook: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-after-owner-confirmation',
  sourceStop: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-stop-condition-register-after-owner-confirmation',
  sourceRollback: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-rollback-register-after-owner-confirmation',
  sourceHandoff: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-evidence-handoff-map-after-owner-confirmation',
  sourceReadiness:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-readiness-register-after-owner-confirmation',
  sourcePolicy: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-claim-policy-after-owner-confirmation'
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
  '"boundedInternalDryRunExecutionMayProceed": true',
  '"externalBetaMayProceed": true',
  '"realUserMediaBetaMayProceed": true',
  '"paidProductionMayProceed": true',
  '"productionMayProceed": true',
  '"workerExecutionMayProceed": true',
  '"routeExecutionMayProceed": true',
  '"mediaProcessingMayProceed": true',
  '"supabaseSqlMayProceed": true',
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

for (const key of ['review', 'acceptance', 'runbookReview', 'stopReview', 'planningReadiness', 'policy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`);
}

assert(parsed.review.sourceDecision === sourceDecision, 'Source decision mismatch');
assert(parsed.review.sourcePr === 1346, 'Source PR mismatch');
assert(parsed.review.sourceMergeCommit === '56324a3665baf1aab77120910f18e14b316baf6c', 'Source merge commit mismatch');
assert(parsed.review.sourceHeadCommit === '9cf18f22bf000b71d52d835035b83846d61318a5', 'Source head commit mismatch');
assert(parsed.review.ownerReviewResult.operatorRunbookAccepted === true, 'Runbook not accepted');
assert(parsed.review.ownerReviewResult.internalOperatorDryRunPlanningMayProceedLater === true, 'Dry-run planning next gate missing');
assert(parsed.review.ownerReviewResult.currentPromptRunsDryRun === false, 'Current prompt runs dry run');
assert(parsed.review.ownerReviewResult.currentPromptExecutesWorker === false, 'Current prompt executes worker');
assert(parsed.review.ownerReviewResult.acceptedSoundCpuToolCount === 15, 'Tool count mismatch');
assert(parsed.review.ownerReviewResult.representedEvidenceCount === 6, 'Evidence count mismatch');
assert(parsed.review.ownerReviewResult.remainingEvidenceCount === 0, 'Remaining evidence mismatch');
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

assert(parsed.acceptance.acceptedForNextGate.boundedInternalDryRunPlanningPrompt === 'yes', 'Next planning gate missing');
for (const value of Object.values(parsed.acceptance.acceptedForToday)) {
  assert(value === 'no', `Today acceptance widened: ${value}`);
}
assert(parsed.acceptance.counts.acceptedForDryRunPlanningTodayCount === 15, 'Dry-run planning count mismatch');
assert(parsed.acceptance.counts.acceptedForDryRunExecutionTodayCount === 0, 'Dry-run execution count widened');

assert(parsed.runbookReview.reviewedRunbookItems.length === 10, 'Reviewed runbook item count mismatch');
assert(parsed.runbookReview.reviewResult.runbookInternallyConsistent === true, 'Runbook consistency missing');
assert(parsed.runbookReview.reviewResult.externalBetaStillBlocked === true, 'External beta block missing');
assert(parsed.runbookReview.notAcceptedAsEvidenceFor.includes('dry_run_passed'), 'Dry-run passed non-evidence missing');
assert(parsed.runbookReview.notAcceptedAsEvidenceFor.includes('external_beta'), 'External beta non-evidence missing');

assert(parsed.stopReview.acceptedStopConditions.length === 10, 'Stop condition review count mismatch');
assert(parsed.stopReview.currentObservedSafeValues.internalDryRunAllowed === true, 'Internal dry-run value mismatch');
assert(parsed.stopReview.currentObservedSafeValues.externalBetaAllowed === false, 'External beta widened in stop review');
assert(parsed.stopReview.reviewDecision.stopConditionsAcceptedForNextPlanningGate === true, 'Stop conditions not accepted');
assert(parsed.stopReview.reviewDecision.mustStopBeforeAnyExecutionIfTriggered === true, 'Execution stop guard missing');

assert(parsed.planningReadiness.readinessRerun.prodReadinessOverallStatus === 'blocked', 'Readiness status mismatch');
assert(parsed.planningReadiness.readinessRerun.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');
assert(parsed.planningReadiness.readinessRerun.prodReadinessWarnings === 26, 'Warning count mismatch');
assert(parsed.planningReadiness.readinessRerun.prodBetaStatus === 'internal_testing_ready', 'Beta status mismatch');
assert(parsed.planningReadiness.readinessRerun.internalDryRunAllowed === true, 'Internal dry-run not allowed');
assert(parsed.planningReadiness.readinessRerun.externalBetaAllowed === false, 'External beta widened');
assert(parsed.planningReadiness.planningReadinessDecision.boundedInternalDryRunPlanningMayProceed === true, 'Dry-run planning not allowed');
for (const key of [
  'boundedInternalDryRunExecutionMayProceed',
  'externalBetaMayProceed',
  'realUserMediaBetaMayProceed',
  'paidProductionMayProceed',
  'productionMayProceed',
  'workerExecutionMayProceed',
  'routeExecutionMayProceed',
  'mediaProcessingMayProceed',
  'supabaseSqlMayProceed'
]) {
  assert(parsed.planningReadiness.planningReadinessDecision[key] === false, `Planning readiness widened: ${key}`);
}

assert(parsed.policy.allowedClaims.includes('SOUND CPU bounded internal beta operator review passed with warnings'), 'Allowed review claim missing');
for (const claim of [
  'product-wide internal beta unlocked',
  'external beta ready',
  'production ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'dry-run execution completed',
  'worker execution readiness'
]) {
  assert(parsed.policy.forbiddenClaims.includes(claim), `Forbidden claim missing: ${claim}`);
}
assert(parsed.policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.policy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.policy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');

assert(parsed.sourceRunbook.decision === sourceDecision, 'Source runbook decision mismatch');
assert(parsed.sourceRunbook.runbookScope.operatorRunbookCreated === true, 'Source runbook missing');
assert(parsed.sourceStop.currentObservedSafeValues.externalBetaAllowed === false, 'Source stop external beta widened');
assert(parsed.sourceRollback.rollbackPolicy.doNotRunWorkers === true, 'Source rollback worker guard missing');
assert(parsed.sourceHandoff.handoffRequirements.nextOwnerReviewMustRequerySourcePr === 1342, 'Source handoff mismatch');
assert(parsed.sourceReadiness.operatorReviewMayProceed.internalOperatorReviewMayProceed === true, 'Source operator review readiness missing');
assert(parsed.sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'Source SQL widened');
assert(/dry-run planning/i.test(docs.nextPrompt), 'Next prompt missing dry-run planning wording');
assert(/must not execute the dry run/i.test(docs.nextPrompt), 'Next prompt missing no-execution boundary');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-bounded-internal-beta-operator-review-after-runbook:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-after-runbook-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_bounded_internal_beta_operator_review_after_runbook_diagnostics_passed',
      decision,
      sourcePr: 1346,
      sourceMergeCommit: '56324a3665baf1aab77120910f18e14b316baf6c',
      internalOperatorDryRunPlanningMayProceedLater: true,
      currentPromptRunsDryRun: false,
      externalBetaUnlocked: false,
      productionUnlocked: false,
      prodReadinessHardBlockers: 101,
      prodReadinessWarnings: 26,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-INTERNAL-BETA-DRY-RUN-PLANNING-AFTER-OPERATOR-REVIEW: plan bounded internal dry-run, no execution/no external beta'
    },
    null,
    2
  )
);
