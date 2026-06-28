import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_planning_after_operator_review_completed_with_warnings_ready_for_dry_run_plan_owner_review_no_execution';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_bounded_internal_beta_operator_review_after_runbook_passed_with_warnings_ready_for_internal_operator_dry_run_planning_no_execution';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-after-operator-review.md',
  inputBoundary:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-after-operator-review.md',
  stopConditions:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-stop-condition-register-after-operator-review.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-evidence-requirements-after-operator-review.md',
  ownerReview:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-readiness-after-operator-review.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-claim-policy-after-operator-review.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-after-planning.md',
  sourceReview:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-after-runbook.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-acceptance-register-after-runbook.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-readiness-after-runbook.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-claim-policy-after-runbook.md'
};

const labels = {
  plan: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-after-operator-review',
  inputBoundary:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-after-operator-review',
  stopConditions:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-stop-condition-register-after-operator-review',
  evidence:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-evidence-requirements-after-operator-review',
  ownerReview:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-plan-owner-review-readiness-after-operator-review',
  policy:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-claim-policy-after-operator-review',
  sourceReview: 'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-after-runbook',
  sourceAcceptance:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-acceptance-register-after-runbook',
  sourceReadiness:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-readiness-after-runbook',
  sourcePolicy:
    'worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-review-claim-policy-after-runbook'
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
  '"dryRunExecutionMayProceedToday": true',
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

const expectedToolIds = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm'
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

for (const key of ['plan', 'inputBoundary', 'stopConditions', 'evidence', 'ownerReview', 'policy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`);
}

assert(parsed.plan.sourceDecision === sourceDecision, 'Source decision mismatch');
assert(parsed.plan.sourcePr === 1347, 'Source PR mismatch');
assert(parsed.plan.sourceMergeCommit === '51f791c82ccc6ee6839a1a3e7a70bd8e5ecd064b', 'Source merge commit mismatch');
assert(parsed.plan.sourceHeadCommit === '2793dc0e81fdb07d82e0804b865e43f3c2f5ca76', 'Source head commit mismatch');
assert(parsed.plan.dryRunPlanningScope.planCreated === true, 'Plan was not created');
assert(parsed.plan.dryRunPlanningScope.acceptedSoundCpuToolCount === 15, 'Tool count mismatch');
assert(parsed.plan.dryRunPlanningScope.testEnvelope === 'synthetic_in_memory_no_media_no_artifact_no_supabase_no_worker_execution', 'Envelope mismatch');
assert(parsed.plan.dryRunPlanningScope.currentPromptRunsDryRun === false, 'Current prompt runs dry run');
assert(parsed.plan.dryRunPlanningScope.currentPromptExecutesWorker === false, 'Current prompt executes worker');
for (const toolId of expectedToolIds) {
  assert(parsed.plan.dryRunPlanningScope.acceptedToolIds.includes(toolId), `Missing accepted tool id: ${toolId}`);
}
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
  assert(parsed.plan.dryRunPlanningScope[flag] === false, `Scope flag widened: ${flag}`);
}

assert(parsed.plan.readinessRerun.prodReadinessOverallStatus === 'blocked', 'Readiness status mismatch');
assert(parsed.plan.readinessRerun.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');
assert(parsed.plan.readinessRerun.prodReadinessWarnings === 26, 'Warning count mismatch');
assert(parsed.plan.readinessRerun.prodBetaStatus === 'internal_testing_ready', 'Beta status mismatch');
assert(parsed.plan.readinessRerun.internalDryRunAllowed === true, 'Internal dry-run not allowed');
assert(parsed.plan.readinessRerun.externalBetaAllowed === false, 'External beta widened');
assert(parsed.plan.nextDecisionGate === 'dry_run_plan_owner_review_no_execution', 'Next gate mismatch');

for (const field of [
  'approvedPlanSnapshotId',
  'workspaceId',
  'projectId',
  'jobId',
  'idempotencyKey',
  'workerName',
  'jobType',
  'attempt',
  'runtimeFlags'
]) {
  assert(parsed.inputBoundary.requiredStaticFields.includes(field), `Missing required static field: ${field}`);
}
for (const forbidden of ['raw_user_prompt', 'real_user_media_path', 'signed_url', 'service_role_payload']) {
  assert(parsed.inputBoundary.forbiddenInputs.includes(forbidden), `Missing forbidden input: ${forbidden}`);
}
for (const value of Object.values(parsed.inputBoundary.acceptedForPlanningToday)) {
  assert(value === 'yes' || value === 'no', 'Unexpected planning value');
}
assert(parsed.inputBoundary.acceptedForPlanningToday.syntheticInMemoryPayloadPlan === 'yes', 'Synthetic plan not accepted');
for (const [key, value] of Object.entries(parsed.inputBoundary.acceptedForPlanningToday)) {
  if (key !== 'syntheticInMemoryPayloadPlan') assert(value === 'no', `Input boundary widened: ${key}`);
}

assert(parsed.stopConditions.mandatoryStopConditions.length === 13, 'Stop condition count mismatch');
assert(parsed.stopConditions.currentObservedSafeValues.internalDryRunAllowed === true, 'Internal dry-run safe value mismatch');
assert(parsed.stopConditions.currentObservedSafeValues.externalBetaAllowed === false, 'External beta safe value widened');
assert(parsed.stopConditions.currentObservedSafeValues.prodReadinessHardBlockers === 101, 'Stop condition hard blocker mismatch');

assert(parsed.evidence.sourceEvidence.length === 3, 'Source evidence count mismatch');
assert(parsed.evidence.futureOwnerReviewMustConfirm.sourcePr1347Merged === true, 'Future source PR check missing');
assert(parsed.evidence.futureOwnerReviewMustConfirm.externalBetaStillBlocked === true, 'Future external beta guard missing');
assert(parsed.evidence.futureDryRunExecutionEvidenceRequiredBeforeAnyPassClaim.includes('owner_review_accepts_this_plan'), 'Owner review proof missing');
assert(parsed.evidence.notAcceptedAsEvidenceFor.includes('dry_run_passed'), 'Dry-run pass non-evidence missing');
assert(parsed.evidence.notAcceptedAsEvidenceFor.includes('external_beta'), 'External beta non-evidence missing');

assert(parsed.ownerReview.ownerReviewReadiness.dryRunPlanOwnerReviewMayProceed === true, 'Owner review not ready');
for (const [key, value] of Object.entries(parsed.ownerReview.ownerReviewReadiness)) {
  if (key !== 'dryRunPlanOwnerReviewMayProceed') assert(value === false, `Owner readiness widened: ${key}`);
}
assert(parsed.ownerReview.supabaseClassification.sqlExecuted === 'no', 'Owner review SQL widened');
assert(parsed.ownerReview.reviewOutputsForbidden.includes('execute_dry_run'), 'Forbidden execute output missing');

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

assert(parsed.sourceReview.decision === sourceDecision, 'Source review decision mismatch');
assert(parsed.sourceReview.ownerReviewResult.internalOperatorDryRunPlanningMayProceedLater === true, 'Source review does not allow planning');
assert(parsed.sourceAcceptance.counts.acceptedForDryRunPlanningTodayCount === 15, 'Source accepted planning count mismatch');
assert(parsed.sourceAcceptance.counts.acceptedForDryRunExecutionTodayCount === 0, 'Source accepted execution count widened');
assert(parsed.sourceReadiness.readinessRerun.externalBetaAllowed === false, 'Source readiness external beta widened');
assert(parsed.sourceReadiness.planningReadinessDecision.boundedInternalDryRunExecutionMayProceed === false, 'Source execution readiness widened');
assert(parsed.sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'Source policy SQL widened');
assert(/no execution/i.test(docs.nextPrompt), 'Next prompt missing no-execution wording');
assert(/no external beta/i.test(docs.nextPrompt), 'Next prompt missing external-beta boundary');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-bounded-internal-beta-dry-run-planning-after-operator-review:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-planning-after-operator-review-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_planning_after_operator_review_diagnostics_passed',
      decision,
      sourcePr: 1347,
      sourceMergeCommit: '51f791c82ccc6ee6839a1a3e7a70bd8e5ecd064b',
      acceptedSoundCpuToolCount: 15,
      currentPromptRunsDryRun: false,
      dryRunPlanOwnerReviewMayProceed: true,
      externalBetaUnlocked: false,
      productionUnlocked: false,
      prodReadinessHardBlockers: 101,
      prodReadinessWarnings: 26,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-INTERNAL-BETA-DRY-RUN-PLAN-OWNER-REVIEW-AFTER-PLANNING: review bounded internal dry-run plan, no execution/no external beta'
    },
    null,
    2
  )
);
