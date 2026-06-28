import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_bounded_internal_beta_operator_runbook_after_owner_confirmation_completed_with_warnings_ready_for_internal_operator_review_no_execution';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_internal_beta_unlock_owner_confirmation_after_runner_boundary_execution_proof_passed_with_warnings_bounded_internal_beta_metadata_enabled';

const files = {
  runbook: 'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-after-owner-confirmation.md',
  stopConditions:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-stop-condition-register-after-owner-confirmation.md',
  rollback:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-rollback-register-after-owner-confirmation.md',
  handoff:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-evidence-handoff-map-after-owner-confirmation.md',
  reviewReadiness:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-readiness-register-after-owner-confirmation.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-claim-policy-after-owner-confirmation.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-after-runbook.md',
  sourceConfirmation:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-after-runner-boundary-execution-proof.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-acceptance-register-after-runner-boundary-execution-proof.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-readiness-register-after-runner-boundary-execution-proof.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-boundary-register-after-runner-boundary-execution-proof.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-claim-policy-after-runner-boundary-execution-proof.md'
};

const labels = {
  runbook: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-after-owner-confirmation',
  stopConditions:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-stop-condition-register-after-owner-confirmation',
  rollback: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-rollback-register-after-owner-confirmation',
  handoff: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-evidence-handoff-map-after-owner-confirmation',
  reviewReadiness:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-readiness-register-after-owner-confirmation',
  policy: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-claim-policy-after-owner-confirmation',
  sourceConfirmation:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-after-runner-boundary-execution-proof',
  sourceAcceptance:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-acceptance-register-after-runner-boundary-execution-proof',
  sourceReadiness:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-readiness-register-after-runner-boundary-execution-proof',
  sourceBoundary:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-boundary-register-after-runner-boundary-execution-proof',
  sourcePolicy:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-claim-policy-after-runner-boundary-execution-proof'
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
  '"externalBetaReviewMayProceed": true',
  '"productionReviewMayProceed": true',
  '"runtimeExecutionReviewMayProceed": true',
  '"workerExecutionReviewMayProceed": true',
  '"mediaProcessingReviewMayProceed": true',
  '"supabaseSqlReviewMayProceed": true',
  '"productToolCallExecutionAllowed": true',
  '"workerExecutionAllowed": true',
  '"routeExecutionAllowed": true',
  '"mediaProcessingAllowed": true',
  '"artifactDeliveryAllowed": true',
  '"supabaseMutationAllowed": true',
  '"sqlExecutionAllowed": true',
  '"providerModelCallsAllowed": true',
  '"deploymentAllowed": true',
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

for (const key of ['runbook', 'stopConditions', 'rollback', 'handoff', 'reviewReadiness', 'policy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`);
}

assert(parsed.runbook.sourceDecision === sourceDecision, 'Source decision mismatch');
assert(parsed.runbook.sourcePr === 1342, 'Source PR mismatch');
assert(parsed.runbook.sourceMergeCommit === '8fce69475b865259aa7e8f8d3335d91acf9c0efc', 'Source merge commit mismatch');
assert(parsed.runbook.sourceHeadCommit === '9b7f70121a9f9aac3dc906ff3d186df6f49b966c', 'Source head commit mismatch');
assert(parsed.runbook.runbookScope.operatorRunbookCreated === true, 'Runbook not created');
assert(
  parsed.runbook.runbookScope.soundCpuInternalBetaState === 'bounded_internal_testing_enabled_metadata_only',
  'Runbook state mismatch'
);
assert(parsed.runbook.runbookScope.acceptedSoundCpuToolCount === 15, 'Tool count mismatch');
assert(parsed.runbook.runbookScope.representedEvidenceCount === 6, 'Evidence count mismatch');
assert(parsed.runbook.runbookScope.remainingEvidenceCount === 0, 'Remaining evidence mismatch');
assert(parsed.runbook.runbookScope.currentPromptExecutesTests === false, 'Runbook executes tests');
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
  assert(parsed.runbook.runbookScope[flag] === false, `Runbook flag widened: ${flag}`);
}
for (const step of [
  'confirm_source_owner_confirmation_pr_merged',
  'rerun_readiness_and_beta_summaries',
  'verify_no_duplicate_or_superseding_operator_packet',
  'stop_on_any_readiness_or_scope_widening_signal'
]) {
  assert(parsed.runbook.operatorSteps.includes(step), `Missing operator step: ${step}`);
}

assert(parsed.stopConditions.mandatoryStopConditions.length === 10, 'Stop condition count mismatch');
assert(
  parsed.stopConditions.mandatoryStopConditions.includes('prod_beta_summary_no_longer_reports_internal_testing_ready'),
  'Internal testing stop condition missing'
);
for (const value of Object.values(parsed.stopConditions.blockedIfSeen)) {
  assert(value === 'stop', `Blocked-if-seen sentinel mismatch: ${value}`);
}
assert(parsed.stopConditions.currentObservedSafeValues.internalDryRunAllowed === true, 'Internal dry-run not preserved');
assert(parsed.stopConditions.currentObservedSafeValues.externalBetaAllowed === false, 'External beta widened in stop values');
assert(parsed.stopConditions.currentObservedSafeValues.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');

assert(parsed.rollback.rollbackPolicy.doNotRunWorkers === true, 'Worker rollback guard missing');
assert(parsed.rollback.rollbackPolicy.doNotTouchSupabase === true, 'Supabase rollback guard missing');
assert(parsed.rollback.rollbackPolicy.doNotRunSql === true, 'SQL rollback guard missing');
assert(/RUNBOOK-FIX/.test(parsed.rollback.safeRecoveryPrompt), 'Safe recovery prompt missing');

assert(parsed.handoff.sourceEvidence.length === 4, 'Source evidence chain count mismatch');
assert(parsed.handoff.sourceEvidence[0].pr === 1342, 'Latest source evidence missing');
assert(parsed.handoff.handoffRequirements.nextOwnerReviewMustRequerySourcePr === 1342, 'Next review source PR mismatch');
assert(parsed.handoff.handoffRequirements.nextOwnerReviewMustConfirmNoExternalBeta === true, 'External beta handoff guard missing');
assert(parsed.handoff.notAcceptedAsEvidenceFor.includes('external_beta'), 'External beta non-evidence missing');
assert(parsed.handoff.notAcceptedAsEvidenceFor.includes('worker_execution'), 'Worker execution non-evidence missing');

assert(parsed.reviewReadiness.readinessRerun.prodReadinessOverallStatus === 'blocked', 'Review readiness status mismatch');
assert(parsed.reviewReadiness.readinessRerun.prodReadinessHardBlockers === 101, 'Review hard blocker mismatch');
assert(parsed.reviewReadiness.readinessRerun.prodReadinessWarnings === 26, 'Review warning count mismatch');
assert(parsed.reviewReadiness.readinessRerun.prodBetaStatus === 'internal_testing_ready', 'Review beta status mismatch');
assert(parsed.reviewReadiness.readinessRerun.internalDryRunAllowed === true, 'Review internal dry-run missing');
assert(parsed.reviewReadiness.readinessRerun.externalBetaAllowed === false, 'Review external beta widened');
assert(parsed.reviewReadiness.operatorReviewMayProceed.internalOperatorReviewMayProceed === true, 'Operator review not allowed');
assert(parsed.reviewReadiness.operatorReviewMayProceed.operatorRunbookReadyForReview === true, 'Runbook readiness missing');
for (const key of [
  'externalBetaReviewMayProceed',
  'productionReviewMayProceed',
  'runtimeExecutionReviewMayProceed',
  'workerExecutionReviewMayProceed',
  'mediaProcessingReviewMayProceed',
  'supabaseSqlReviewMayProceed'
]) {
  assert(parsed.reviewReadiness.operatorReviewMayProceed[key] === false, `Review readiness widened: ${key}`);
}

assert(parsed.policy.allowedClaims.includes('SOUND CPU bounded internal beta operator runbook is documented'), 'Allowed runbook claim missing');
for (const claim of [
  'product-wide internal beta unlocked',
  'external beta ready',
  'production ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'worker execution readiness'
]) {
  assert(parsed.policy.forbiddenClaims.includes(claim), `Forbidden claim missing: ${claim}`);
}
assert(parsed.policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.policy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.policy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');

assert(parsed.sourceConfirmation.decision === sourceDecision, 'Source confirmation decision mismatch');
assert(parsed.sourceConfirmation.ownerConfirmationResult.boundedSoundCpuInternalBetaMetadataConfirmed === true, 'Source confirmation missing');
assert(parsed.sourceAcceptance.acceptedForToday.externalBetaUnlock === 'no', 'Source external beta acceptance widened');
assert(parsed.sourceReadiness.readinessRerun.externalBetaAllowed === false, 'Source readiness external beta widened');
assert(parsed.sourceBoundary.boundaryGuards.workerExecutionAllowed === false, 'Source worker execution widened');
assert(parsed.sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'Source SQL widened');
assert(/operator runbook/i.test(docs.nextPrompt), 'Next prompt missing operator runbook wording');
assert(/No product-wide internal beta unlock/i.test(docs.nextPrompt), 'Next prompt missing product-wide closure');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-bounded-internal-beta-operator-runbook-after-owner-confirmation:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-after-owner-confirmation-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_bounded_internal_beta_operator_runbook_after_owner_confirmation_diagnostics_passed',
      decision,
      sourcePr: 1342,
      sourceMergeCommit: '8fce69475b865259aa7e8f8d3335d91acf9c0efc',
      operatorRunbookCreated: true,
      internalOperatorReviewMayProceed: true,
      externalBetaUnlocked: false,
      productionUnlocked: false,
      prodReadinessHardBlockers: 101,
      prodReadinessWarnings: 26,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-INTERNAL-BETA-OPERATOR-REVIEW-AFTER-RUNBOOK: review bounded internal beta operator runbook, no external beta/no execution'
    },
    null,
    2
  )
);
