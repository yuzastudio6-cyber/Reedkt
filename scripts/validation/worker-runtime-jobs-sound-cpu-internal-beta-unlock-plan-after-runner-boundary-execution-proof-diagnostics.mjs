import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_unlock_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_unlock_owner_review_no_execution';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_internal_beta_owner_go_no_go_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_internal_beta_unlock_plan_no_execution';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-after-runner-boundary-execution-proof.md',
  scope:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-scope-register-after-runner-boundary-execution-proof.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-readiness-register-after-runner-boundary-execution-proof.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-execution-boundary-after-runner-boundary-execution-proof.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-blocker-register-after-runner-boundary-execution-proof.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-review-after-runner-boundary-execution-proof.md',
  sourcePlan:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-after-runner-boundary-execution-proof.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-evidence-register-after-runner-boundary-execution-proof.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-readiness-register-after-runner-boundary-execution-proof.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-blocker-register-after-runner-boundary-execution-proof.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-claim-policy-after-runner-boundary-execution-proof.md'
};

const labels = {
  plan: 'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-after-runner-boundary-execution-proof',
  scope: 'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-scope-register-after-runner-boundary-execution-proof',
  readiness:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-readiness-register-after-runner-boundary-execution-proof',
  boundary:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-execution-boundary-after-runner-boundary-execution-proof',
  blockers:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-blocker-register-after-runner-boundary-execution-proof',
  policy: 'worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-claim-policy-after-runner-boundary-execution-proof'
};

const forbiddenText = [
  '"internalBetaUnlockApprovedToday": true',
  '"externalBetaUnlockApprovedToday": true',
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
  '"mediaProcessingEnabled": true',
  '"artifactDeliveryEnabled": true',
  '"supabaseMutationEnabled": true',
  '"sqlExecutionEnabled": true',
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

function readRequired(relativePath) {
  const absolutePath = join(root, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf8');
}

function parseJsonFence(markdown, label) {
  const fence = '```json ' + label;
  const start = markdown.indexOf(fence);
  if (start === -1) {
    throw new Error(`Missing JSON fence: ${label}`);
  }
  const jsonStart = markdown.indexOf('\n', start);
  const end = markdown.indexOf('```', jsonStart + 1);
  if (jsonStart === -1 || end === -1) {
    throw new Error(`Unclosed JSON fence: ${label}`);
  }
  return JSON.parse(markdown.slice(jsonStart + 1, end).trim());
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

assert(parsed.plan.decision === decision, 'Plan decision mismatch');
assert(parsed.plan.sourceDecision === sourceDecision, 'Source decision mismatch');
assert(parsed.plan.sourcePr === 1329, 'Source PR mismatch');
assert(
  parsed.plan.sourceMergeCommit === '82cdc0d155084c32b608ffa3cc83973cf904970c',
  'Source merge commit mismatch'
);
assert(parsed.plan.unlockPlanResult.internalBetaUnlockPlanCreated === true, 'Unlock plan not created');
assert(parsed.plan.unlockPlanResult.acceptedSoundCpuToolCount === 15, 'Tool count mismatch');
assert(parsed.plan.unlockPlanResult.representedEvidenceCount === 6, 'Evidence count mismatch');
assert(parsed.plan.unlockPlanResult.remainingEvidenceCount === 0, 'Remaining evidence mismatch');
assert(parsed.plan.unlockPlanResult.unlockOwnerReviewMayProceed === true, 'Owner review not allowed');
for (const flag of [
  'internalBetaUnlockApprovedToday',
  'externalBetaUnlockApprovedToday',
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
  assert(parsed.plan.unlockPlanResult[flag] === false, `Plan flag widened: ${flag}`);
}

assert(parsed.scope.plannedScope.acceptedSoundCpuToolCount === 15, 'Scope tool count mismatch');
for (const key of [
  'sanitizedFixturesOnly',
  'noRealUserMedia',
  'noArtifactDelivery',
  'noSupabaseMutation',
  'noSqlExecution',
  'noWorkerExecution',
  'noRouteExecution',
  'noProductToolCallExecution',
  'noCreditMutation',
  'noStripeProcessing',
  'noDeployment'
]) {
  assert(parsed.scope.plannedScope[key] === true, `Scope boundary missing: ${key}`);
}
assert(parsed.scope.notAcceptedForToday.includes('external beta'), 'External beta closure missing');
assert(parsed.scope.notAcceptedForToday.includes('internal beta unlock'), 'Internal beta unlock closure missing');

assert(parsed.readiness.currentReadinessSnapshot.prodReadinessOverallStatus === 'blocked', 'Readiness status changed');
assert(parsed.readiness.currentReadinessSnapshot.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');
assert(parsed.readiness.currentReadinessSnapshot.prodReadinessWarnings === 26, 'Warning count mismatch');
assert(parsed.readiness.currentReadinessSnapshot.prodBetaStatus === 'internal_testing_ready', 'Beta status mismatch');
assert(parsed.readiness.unlockPlanReadinessDecision.internalBetaUnlockOwnerReviewMayProceed === true, 'Owner review readiness missing');
assert(parsed.readiness.unlockPlanReadinessDecision.mustRerunReadinessBeforeOwnerReview === true, 'Rerun requirement missing');
for (const key of [
  'internalBetaUnlockApprovedToday',
  'externalBetaAllowedToday',
  'realUserMediaBetaAllowedToday',
  'paidProductionAllowedToday',
  'productionAllowedToday'
]) {
  assert(parsed.readiness.unlockPlanReadinessDecision[key] === false, `Readiness widened: ${key}`);
}

for (const value of Object.values(parsed.boundary.runtimeFlags)) {
  assert(value === false, 'Runtime flag widened');
}
for (const value of Object.values(parsed.boundary.executionBoundary)) {
  assert(value === 'blocked' || value === 'not_enabled_in_this_packet', `Execution boundary widened: ${value}`);
}

assert(parsed.blockers.remainingBeforeUnlockOwnerReview.length === 0, 'Owner-review blockers remain');
assert(parsed.blockers.counts.unlockOwnerReviewBlockingCount === 0, 'Owner-review blocker count mismatch');
assert(parsed.blockers.counts.internalBetaUnlockBlockingCount === 4, 'Internal beta unlock blockers mismatch');
assert(parsed.blockers.counts.externalBetaBlockingCount === 6, 'External beta blockers mismatch');

assert(parsed.policy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.policy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.policy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.policy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');
for (const claim of [
  'internal beta unlocked',
  'external beta ready',
  'production ready',
  'worker execution readiness',
  'generated_local_fixture_passed',
  'dry_run_passed'
]) {
  assert(parsed.policy.forbiddenClaims.includes(claim), `Forbidden claim missing: ${claim}`);
}

assert(docs.sourcePlan.includes(sourceDecision), 'Source go/no-go decision missing');
assert(docs.sourcePlan.includes('"internalBetaUnlockPlanMayProceed": true'), 'Source unlock plan flag missing');
assert(docs.sourceEvidence.includes('"remainingEvidenceCount": 0'), 'Source remaining evidence mismatch');
assert(docs.sourceReadiness.includes('"externalBetaAllowed": false'), 'Source external beta widened');
assert(docs.sourceReadiness.includes('"stopRatherThanForceReadiness": true'), 'Source stop-rather-than-force missing');
assert(docs.sourceBlockers.includes('"internalBetaUnlockPlanBlockingCount": 0'), 'Source unlock plan blocker mismatch');
assert(docs.sourcePolicy.includes('"internal beta unlocked"'), 'Source forbidden internal beta claim missing');
assert(/review the SOUND CPU internal-beta unlock plan/i.test(docs.nextPrompt), 'Next prompt missing owner review');
assert(/Do not enable external beta/i.test(docs.nextPrompt), 'Next prompt missing external beta closure');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-internal-beta-unlock-plan-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-after-runner-boundary-execution-proof-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_internal_beta_unlock_plan_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1329,
      sourceMergeCommit: '82cdc0d155084c32b608ffa3cc83973cf904970c',
      acceptedSoundCpuToolCount: 15,
      representedEvidenceCount: 6,
      remainingEvidenceCount: 0,
      unlockOwnerReviewMayProceed: true,
      internalBetaUnlockApprovedToday: false,
      externalBetaAllowedToday: false,
      productionAllowedToday: false,
      supabaseClassification: parsed.policy.supabaseClassification,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-INTERNAL-BETA-UNLOCK-OWNER-REVIEW-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: review internal beta unlock plan, no execution'
    },
    null,
    2
  )
);
