import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_owner_go_no_go_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_internal_beta_unlock_plan_no_execution';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_internal_beta_reconsideration_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_owner_go_no_go_no_unlock';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-after-runner-boundary-execution-proof.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-evidence-register-after-runner-boundary-execution-proof.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-readiness-register-after-runner-boundary-execution-proof.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-blocker-register-after-runner-boundary-execution-proof.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-unlock-plan-after-runner-boundary-execution-proof.md',
  sourcePlan:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-after-runner-boundary-execution-proof.md',
  sourceEvidence:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-evidence-summary-after-runner-boundary-execution-proof.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-readiness-summary-after-runner-boundary-execution-proof.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-blocker-register-after-runner-boundary-execution-proof.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-claim-policy-after-runner-boundary-execution-proof.md'
};

const labels = {
  plan: 'worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-after-runner-boundary-execution-proof',
  evidence:
    'worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-evidence-register-after-runner-boundary-execution-proof',
  readiness:
    'worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-readiness-register-after-runner-boundary-execution-proof',
  blockers:
    'worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-blocker-register-after-runner-boundary-execution-proof',
  policy:
    'worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-claim-policy-after-runner-boundary-execution-proof'
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
  '"acceptedForExecutionToday": true',
  '"acceptedForInternalBetaUnlockTodayCount": 6',
  '"acceptedForExternalBetaTodayCount": 15',
  '"acceptedForProductionTodayCount": 15',
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
assert(parsed.plan.sourcePr === 1323, 'Source PR mismatch');
assert(
  parsed.plan.sourceMergeCommit === '917a6ffc27111addb4837ec8a21cdbfd79438d5c',
  'Source merge commit mismatch'
);
assert(parsed.plan.ownerGoNoGoResult.ownerDecisionRecorded === true, 'Owner decision not recorded');
assert(parsed.plan.ownerGoNoGoResult.ownerGoNoGo === 'go_for_internal_beta_unlock_plan_only', 'Owner go/no-go mismatch');
assert(parsed.plan.ownerGoNoGoResult.acceptedSoundCpuToolCount === 15, 'SOUND CPU tool count mismatch');
assert(parsed.plan.ownerGoNoGoResult.requiredEvidenceCount === 6, 'Required evidence count mismatch');
assert(parsed.plan.ownerGoNoGoResult.representedEvidenceCount === 6, 'Represented evidence count mismatch');
assert(parsed.plan.ownerGoNoGoResult.remainingEvidenceCount === 0, 'Remaining evidence count mismatch');
assert(parsed.plan.ownerGoNoGoResult.internalBetaUnlockPlanMayProceed === true, 'Unlock plan not allowed');
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
  assert(parsed.plan.ownerGoNoGoResult[flag] === false, `Plan flag widened: ${flag}`);
}

assert(parsed.evidence.counts.acceptedForGoNoGoCount === 6, 'Go/no-go evidence count mismatch');
assert(parsed.evidence.counts.remainingEvidenceCount === 0, 'Evidence remaining count mismatch');
assert(parsed.evidence.counts.acceptedForExecutionTodayCount === 0, 'Execution count widened');
assert(parsed.evidence.counts.acceptedForInternalBetaUnlockTodayCount === 0, 'Unlock count widened');
assert(parsed.evidence.counts.acceptedForExternalBetaTodayCount === 0, 'External beta count widened');
assert(parsed.evidence.counts.acceptedForProductionTodayCount === 0, 'Production count widened');
for (const item of parsed.evidence.representedEvidenceItems) {
  assert(item.acceptedForGoNoGo === true, `Evidence item not accepted for go/no-go: ${item.id}`);
  assert(item.acceptedForExecutionToday === false, `Evidence item execution widened: ${item.id}`);
  readRequired(item.sourceFile);
}

assert(parsed.readiness.currentReadinessSnapshot.prodReadinessOverallStatus === 'blocked', 'Readiness status changed');
assert(parsed.readiness.currentReadinessSnapshot.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');
assert(parsed.readiness.currentReadinessSnapshot.prodReadinessWarnings === 26, 'Warning count mismatch');
assert(parsed.readiness.currentReadinessSnapshot.prodBetaStatus === 'internal_testing_ready', 'Beta status mismatch');
assert(parsed.readiness.currentReadinessSnapshot.internalDryRunAllowed === true, 'Internal dry-run flag mismatch');
for (const key of [
  'externalBetaAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed'
]) {
  assert(parsed.readiness.currentReadinessSnapshot[key] === false, `Readiness snapshot widened: ${key}`);
}
assert(parsed.readiness.ownerGoNoGoReadinessDecision.internalBetaUnlockPlanMayProceed === true, 'Readiness unlock plan missing');
assert(parsed.readiness.ownerGoNoGoReadinessDecision.stopRatherThanForceReadiness === true, 'Stop-rather-than-force missing');
for (const key of [
  'internalBetaUnlockApprovedToday',
  'externalBetaAllowedToday',
  'realUserMediaBetaAllowedToday',
  'paidProductionAllowedToday',
  'productionAllowedToday'
]) {
  assert(parsed.readiness.ownerGoNoGoReadinessDecision[key] === false, `Readiness decision widened: ${key}`);
}

assert(parsed.blockers.remainingBeforeInternalBetaUnlockPlan.length === 0, 'Unlock plan blockers remain');
assert(parsed.blockers.counts.internalBetaUnlockPlanBlockingCount === 0, 'Unlock plan blocker count mismatch');
assert(parsed.blockers.counts.internalBetaUnlockBlockingCount === 4, 'Internal beta unlock blockers not preserved');
assert(parsed.blockers.counts.externalBetaBlockingCount === 6, 'External beta blockers not preserved');
assert(parsed.blockers.closedEvidenceItems.length === 6, 'Closed evidence count mismatch');

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

assert(docs.sourcePlan.includes(sourceDecision), 'Source reconsideration decision missing');
assert(docs.sourcePlan.includes('"remainingEvidenceCount": 0'), 'Source reconsideration remaining count mismatch');
assert(docs.sourceEvidence.includes('"representedEvidenceCount": 6'), 'Source evidence count mismatch');
assert(docs.sourceEvidence.includes('"acceptedForExecutionTodayCount": 0'), 'Source execution count widened');
assert(docs.sourceReadiness.includes('"externalBetaAllowedToday": false'), 'Source external beta widened');
assert(docs.sourceReadiness.includes('"stopRatherThanForceReadiness": true'), 'Source stop-rather-than-force missing');
assert(docs.sourceBlockers.includes('"ownerGoNoGoBlockingEvidenceCount": 0'), 'Source go/no-go blocker mismatch');
assert(docs.sourcePolicy.includes('"external beta ready"'), 'Source forbidden external beta claim missing');
assert(/no-execution internal-beta unlock plan/i.test(docs.nextPrompt), 'Next prompt missing no-execution unlock plan');
assert(/Do not enable external beta/i.test(docs.nextPrompt), 'Next prompt missing external beta closure');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-internal-beta-owner-go-no-go-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-after-runner-boundary-execution-proof-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_internal_beta_owner_go_no_go_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1323,
      sourceMergeCommit: '917a6ffc27111addb4837ec8a21cdbfd79438d5c',
      acceptedSoundCpuToolCount: 15,
      representedEvidenceCount: 6,
      remainingEvidenceCount: 0,
      internalBetaUnlockPlanMayProceed: true,
      internalBetaUnlockApprovedToday: false,
      externalBetaAllowedToday: false,
      productionAllowedToday: false,
      supabaseClassification: parsed.policy.supabaseClassification,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-INTERNAL-BETA-UNLOCK-PLAN-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: plan internal beta unlock, no execution'
    },
    null,
    2
  )
);
