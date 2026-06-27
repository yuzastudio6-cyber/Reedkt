import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_unlock_owner_review_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_internal_beta_state_change_no_execution';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_internal_beta_unlock_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_unlock_owner_review_no_execution';

const files = {
  review:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-review-after-runner-boundary-execution-proof.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-acceptance-register-after-runner-boundary-execution-proof.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-readiness-review-after-runner-boundary-execution-proof.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-execution-boundary-after-runner-boundary-execution-proof.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-blocker-register-after-runner-boundary-execution-proof.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-state-change-after-runner-boundary-execution-proof.md',
  sourcePlan:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-after-runner-boundary-execution-proof.md',
  sourceScope:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-scope-register-after-runner-boundary-execution-proof.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-readiness-register-after-runner-boundary-execution-proof.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-execution-boundary-after-runner-boundary-execution-proof.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-blocker-register-after-runner-boundary-execution-proof.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-claim-policy-after-runner-boundary-execution-proof.md'
};

const labels = {
  review:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-review-after-runner-boundary-execution-proof',
  acceptance:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-acceptance-register-after-runner-boundary-execution-proof',
  readiness:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-readiness-review-after-runner-boundary-execution-proof',
  boundary:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-execution-boundary-after-runner-boundary-execution-proof',
  blockers:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-blocker-register-after-runner-boundary-execution-proof',
  policy:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-claim-policy-after-runner-boundary-execution-proof',
  sourcePlan:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-after-runner-boundary-execution-proof',
  sourceScope:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-scope-register-after-runner-boundary-execution-proof',
  sourceReadiness:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-readiness-register-after-runner-boundary-execution-proof',
  sourceBoundary:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-execution-boundary-after-runner-boundary-execution-proof',
  sourceBlockers:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-blocker-register-after-runner-boundary-execution-proof',
  sourcePolicy:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-claim-policy-after-runner-boundary-execution-proof'
};

const forbiddenText = [
  '"internalBetaUnlockApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
  '"realUserMediaBetaApprovedToday": true',
  '"paidProductionApprovedToday": true',
  '"productionUnlockApprovedToday": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"creditMutationApprovedToday": true',
  '"stripePaymentProcessingApprovedToday": true',
  '"deploymentApprovedToday": true',
  '"externalBetaAllowed": true',
  '"realUserMediaBetaAllowed": true',
  '"paidProductionAllowed": true',
  '"externalBetaAllowedToday": true',
  '"realUserMediaBetaAllowedToday": true',
  '"paidProductionAllowedToday": true',
  '"productionAllowedToday": true',
  '"productToolCallExecutionEnabled": true',
  '"workerExecutionEnabled": true',
  '"routeExecutionEnabled": true',
  '"providerModelCallsEnabled": true',
  '"mediaProcessingEnabled": true',
  '"artifactDeliveryEnabled": true',
  '"supabaseMutationEnabled": true',
  '"sqlExecutionEnabled": true',
  '"creditMutationEnabled": true',
  '"stripePaymentProcessingEnabled": true',
  '"deploymentEnabled": true',
  '"internalBetaUnlocked": true',
  '"externalBetaUnlocked": true',
  '"productionUnlocked": true',
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

for (const key of ['review', 'acceptance', 'readiness', 'boundary', 'blockers', 'policy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`);
}

assert(parsed.review.sourceDecision === sourceDecision, 'Source decision mismatch');
assert(parsed.review.sourcePr === 1331, 'Source PR mismatch');
assert(
  parsed.review.sourceMergeCommit === 'ff010c8765dbc4edb2a0ea8bc09d6ceff277e936',
  'Source merge commit mismatch'
);
assert(parsed.review.ownerReviewResult.unlockPlanAcceptedForBoundedInternalBetaStateChange === true, 'Unlock plan not accepted');
assert(parsed.review.ownerReviewResult.currentReadinessSummariesReran === true, 'Readiness summaries not recorded');
assert(parsed.review.ownerReviewResult.readinessContradictsBoundedInternalBetaScope === false, 'Readiness contradiction recorded');
assert(parsed.review.ownerReviewResult.acceptedSoundCpuToolCount === 15, 'Tool count mismatch');
assert(parsed.review.ownerReviewResult.representedEvidenceCount === 6, 'Evidence count mismatch');
assert(parsed.review.ownerReviewResult.remainingEvidenceCount === 0, 'Remaining evidence mismatch');
assert(parsed.review.ownerReviewResult.internalBetaStateChangeMayProceedInLaterPrompt === true, 'State-change next gate not allowed');

for (const flag of [
  'internalBetaUnlockApprovedToday',
  'externalBetaUnlockApprovedToday',
  'realUserMediaBetaApprovedToday',
  'paidProductionApprovedToday',
  'productionUnlockApprovedToday',
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'creditMutationApprovedToday',
  'stripePaymentProcessingApprovedToday',
  'deploymentApprovedToday'
]) {
  assert(parsed.review.ownerReviewResult[flag] === false, `Review flag widened: ${flag}`);
}

assert(parsed.acceptance.acceptedForNextGate.boundedInternalBetaStateChangePrompt === 'yes', 'Next gate acceptance missing');
for (const value of Object.values(parsed.acceptance.acceptedForToday)) {
  assert(value === 'no', `Today acceptance widened: ${value}`);
}
assert(parsed.acceptance.counts.acceptedSoundCpuToolCount === 15, 'Acceptance tool count mismatch');
assert(parsed.acceptance.counts.representedEvidenceCount === 6, 'Acceptance evidence count mismatch');
assert(parsed.acceptance.counts.remainingEvidenceCount === 0, 'Acceptance remaining evidence mismatch');
assert(parsed.acceptance.counts.acceptedForInternalBetaTodayCount === 0, 'Internal beta today count widened');
assert(parsed.acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'External beta today count widened');
assert(parsed.acceptance.counts.acceptedForProductionTodayCount === 0, 'Production today count widened');

assert(parsed.readiness.readinessRerun.prodReadinessOverallStatus === 'blocked', 'Readiness status mismatch');
assert(parsed.readiness.readinessRerun.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');
assert(parsed.readiness.readinessRerun.prodReadinessWarnings === 26, 'Warning count mismatch');
assert(parsed.readiness.readinessRerun.prodBetaStatus === 'internal_testing_ready', 'Beta status mismatch');
assert(parsed.readiness.readinessRerun.internalDryRunAllowed === true, 'Internal dry-run not allowed');
assert(parsed.readiness.readinessRerun.externalBetaAllowed === false, 'External beta widened');
assert(parsed.readiness.readinessRerun.realUserMediaBetaAllowed === false, 'Real user media beta widened');
assert(parsed.readiness.readinessRerun.paidProductionAllowed === false, 'Paid production widened');
assert(parsed.readiness.ownerReadinessDecision.summariesAllowBoundedInternalTestingContinuation === true, 'Internal testing continuation not allowed');
assert(parsed.readiness.ownerReadinessDecision.summariesContradictBoundedInternalBetaScope === false, 'Readiness contradiction mismatch');
assert(parsed.readiness.ownerReadinessDecision.mustRerunReadinessBeforeStateChange === true, 'State-change rerun requirement missing');
for (const key of [
  'internalBetaUnlockApprovedToday',
  'externalBetaAllowedToday',
  'realUserMediaBetaAllowedToday',
  'paidProductionAllowedToday',
  'productionAllowedToday'
]) {
  assert(parsed.readiness.ownerReadinessDecision[key] === false, `Readiness widened: ${key}`);
}

assert(parsed.boundary.laterStateChangeBoundary.boundedInternalBetaMetadataStateChangeMayBeReviewedLater === true, 'Bounded state-change next gate missing');
for (const [key, value] of Object.entries(parsed.boundary.laterStateChangeBoundary)) {
  if (key !== 'boundedInternalBetaMetadataStateChangeMayBeReviewedLater') {
    assert(value === false, `Later boundary widened: ${key}`);
  }
}
for (const value of Object.values(parsed.boundary.runtimeFlags)) {
  assert(value === false, 'Runtime flag widened');
}
for (const value of Object.values(parsed.boundary.executionBoundary)) {
  assert(value === 'blocked', `Execution boundary widened: ${value}`);
}

assert(parsed.blockers.counts.ownerReviewBlockingCount === 0, 'Owner review blockers remain');
assert(parsed.blockers.counts.boundedInternalBetaStateChangePreconditionsCount === 2, 'State-change precondition count mismatch');
assert(parsed.blockers.counts.externalBetaBlockingCount === 6, 'External beta blocker count mismatch');
assert(parsed.blockers.counts.productionReadinessHardBlockers === 101, 'Hard blocker count mismatch in blockers');
assert(parsed.blockers.remainingBeforeExternalBeta.includes('production_readiness_hard_blockers'), 'External beta hard blocker missing');

for (const claim of [
  'internal beta unlocked',
  'external beta ready',
  'production ready',
  'product tool-call readiness',
  'worker execution readiness',
  'generated_local_fixture_passed',
  'dry_run_passed'
]) {
  assert(parsed.policy.forbiddenClaims.includes(claim), `Forbidden claim missing: ${claim}`);
}
assert(parsed.policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.policy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.policy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');

assert(parsed.sourcePlan.decision === sourceDecision, 'Source plan decision mismatch');
assert(parsed.sourcePlan.sourcePr === 1329, 'Source plan source PR mismatch');
assert(parsed.sourcePlan.sourceMergeCommit === '82cdc0d155084c32b608ffa3cc83973cf904970c', 'Source plan merge mismatch');
assert(parsed.sourcePlan.unlockPlanResult.acceptedSoundCpuToolCount === 15, 'Source tool count mismatch');
assert(parsed.sourcePlan.unlockPlanResult.representedEvidenceCount === 6, 'Source evidence count mismatch');
assert(parsed.sourcePlan.unlockPlanResult.remainingEvidenceCount === 0, 'Source remaining evidence mismatch');
assert(parsed.sourcePlan.unlockPlanResult.unlockOwnerReviewMayProceed === true, 'Source owner review flag missing');
assert(parsed.sourceReadiness.currentReadinessSnapshot.prodReadinessOverallStatus === 'blocked', 'Source readiness widened');
assert(parsed.sourceReadiness.currentReadinessSnapshot.externalBetaAllowed === false, 'Source external beta widened');
assert(parsed.sourceReadiness.unlockPlanReadinessDecision.mustRerunReadinessBeforeOwnerReview === true, 'Source rerun requirement missing');
assert(parsed.sourceBlockers.counts.unlockOwnerReviewBlockingCount === 0, 'Source owner-review blockers mismatch');
assert(parsed.sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'Source SQL widened');
assert(/bounded internal beta state-change/i.test(docs.nextPrompt), 'Next prompt missing bounded state-change wording');
assert(/No external beta/i.test(docs.nextPrompt), 'Next prompt missing external beta closure');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-internal-beta-unlock-owner-review-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-review-after-runner-boundary-execution-proof-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_internal_beta_unlock_owner_review_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1331,
      sourceMergeCommit: 'ff010c8765dbc4edb2a0ea8bc09d6ceff277e936',
      acceptedSoundCpuToolCount: 15,
      representedEvidenceCount: 6,
      remainingEvidenceCount: 0,
      internalBetaStateChangeMayProceedInLaterPrompt: true,
      internalBetaUnlockApprovedToday: false,
      externalBetaAllowedToday: false,
      productionAllowedToday: false,
      prodReadinessHardBlockers: 101,
      prodReadinessWarnings: 26,
      supabaseClassification: parsed.policy.supabaseClassification,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-INTERNAL-BETA-STATE-CHANGE-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: perform bounded internal beta state change, no external beta/no execution'
    },
    null,
    2
  )
);
