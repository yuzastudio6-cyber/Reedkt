import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_unlock_owner_confirmation_after_runner_boundary_execution_proof_passed_with_warnings_bounded_internal_beta_metadata_enabled';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_internal_beta_state_change_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_unlock_owner_confirmation';

const files = {
  confirmation:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-after-runner-boundary-execution-proof.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-acceptance-register-after-runner-boundary-execution-proof.md',
  readiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-readiness-register-after-runner-boundary-execution-proof.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-boundary-register-after-runner-boundary-execution-proof.md',
  blockers:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-blocker-register-after-runner-boundary-execution-proof.md',
  policy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-bounded-internal-beta-operator-runbook-after-owner-confirmation.md',
  sourceState:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-change-after-runner-boundary-execution-proof.md',
  sourceStateRegister:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-register-after-runner-boundary-execution-proof.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-readiness-register-after-runner-boundary-execution-proof.md',
  sourceBlockers:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-blocker-register-after-runner-boundary-execution-proof.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-claim-policy-after-runner-boundary-execution-proof.md'
};

const labels = {
  confirmation:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-after-runner-boundary-execution-proof',
  acceptance:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-acceptance-register-after-runner-boundary-execution-proof',
  readiness:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-readiness-register-after-runner-boundary-execution-proof',
  boundary:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-boundary-register-after-runner-boundary-execution-proof',
  blockers:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-blocker-register-after-runner-boundary-execution-proof',
  policy:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-claim-policy-after-runner-boundary-execution-proof',
  sourceState:
    'worker-runtime-jobs-sound-cpu-internal-beta-state-change-after-runner-boundary-execution-proof',
  sourceStateRegister:
    'worker-runtime-jobs-sound-cpu-internal-beta-state-register-after-runner-boundary-execution-proof',
  sourceReadiness:
    'worker-runtime-jobs-sound-cpu-internal-beta-state-readiness-register-after-runner-boundary-execution-proof',
  sourceBlockers:
    'worker-runtime-jobs-sound-cpu-internal-beta-state-blocker-register-after-runner-boundary-execution-proof',
  sourcePolicy:
    'worker-runtime-jobs-sound-cpu-internal-beta-state-claim-policy-after-runner-boundary-execution-proof'
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

for (const key of ['confirmation', 'acceptance', 'readiness', 'boundary', 'blockers', 'policy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`);
}

assert(parsed.confirmation.sourceDecision === sourceDecision, 'Source decision mismatch');
assert(parsed.confirmation.sourcePr === 1338, 'Source PR mismatch');
assert(
  parsed.confirmation.sourceMergeCommit === 'e13755f32693014db31d6c43f971d59c97854a18',
  'Source merge commit mismatch'
);
assert(
  parsed.confirmation.sourceHeadCommit === '9a1df108d15bd22b68465bcf799b3cd63fb4de28',
  'Source head commit mismatch'
);
assert(parsed.confirmation.ownerConfirmationResult.boundedSoundCpuInternalBetaMetadataConfirmed === true, 'Confirmation not recorded');
assert(
  parsed.confirmation.ownerConfirmationResult.soundCpuInternalBetaState ===
    'bounded_internal_testing_enabled_metadata_only',
  'Confirmed state mismatch'
);
assert(parsed.confirmation.ownerConfirmationResult.acceptedSoundCpuToolCount === 15, 'Tool count mismatch');
assert(parsed.confirmation.ownerConfirmationResult.representedEvidenceCount === 6, 'Evidence count mismatch');
assert(parsed.confirmation.ownerConfirmationResult.remainingEvidenceCount === 0, 'Remaining evidence mismatch');
assert(parsed.confirmation.ownerConfirmationResult.currentReadinessSummariesReran === true, 'Readiness rerun missing');
assert(parsed.confirmation.ownerConfirmationResult.duplicateOwnerConfirmationPrFound === false, 'Duplicate PR recorded');

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
  assert(parsed.confirmation.ownerConfirmationResult[flag] === false, `Confirmation flag widened: ${flag}`);
}

assert(
  parsed.acceptance.acceptedForBoundedInternalTestingMetadata.boundedSoundCpuInternalBetaMetadataState === 'yes',
  'Bounded metadata acceptance missing'
);
for (const value of Object.values(parsed.acceptance.acceptedForToday)) {
  assert(value === 'no', `Today acceptance widened: ${value}`);
}
assert(parsed.acceptance.counts.acceptedSoundCpuToolCount === 15, 'Acceptance tool count mismatch');
assert(parsed.acceptance.counts.directPinnedPackageCount === 13, 'Direct package count mismatch');
assert(parsed.acceptance.counts.aliasCoveredToolCount === 2, 'Alias tool count mismatch');
assert(parsed.acceptance.counts.representedEvidenceCount === 6, 'Acceptance evidence count mismatch');
assert(parsed.acceptance.counts.remainingEvidenceCount === 0, 'Acceptance remaining evidence mismatch');
assert(parsed.acceptance.counts.acceptedForExternalBetaTodayCount === 0, 'External beta acceptance widened');
assert(parsed.acceptance.counts.acceptedForProductionTodayCount === 0, 'Production acceptance widened');

assert(parsed.readiness.readinessRerun.prodReadinessOverallStatus === 'blocked', 'Readiness status mismatch');
assert(parsed.readiness.readinessRerun.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');
assert(parsed.readiness.readinessRerun.prodReadinessWarnings === 26, 'Warning count mismatch');
assert(parsed.readiness.readinessRerun.prodBetaStatus === 'internal_testing_ready', 'Beta status mismatch');
assert(parsed.readiness.readinessRerun.internalDryRunAllowed === true, 'Internal dry-run not allowed');
assert(parsed.readiness.readinessRerun.externalBetaAllowed === false, 'External beta widened');
assert(parsed.readiness.readinessRerun.realUserMediaBetaAllowed === false, 'Real user media beta widened');
assert(parsed.readiness.readinessRerun.paidProductionAllowed === false, 'Paid production widened');
assert(
  parsed.readiness.ownerConfirmationReadinessDecision.boundedSoundCpuInternalBetaMetadataConfirmed === true,
  'Readiness confirmation missing'
);
assert(
  parsed.readiness.ownerConfirmationReadinessDecision.summariesAllowBoundedInternalTestingContinuation === true,
  'Internal testing continuation missing'
);
assert(
  parsed.readiness.ownerConfirmationReadinessDecision.summariesContradictBoundedInternalBetaScope === false,
  'Readiness contradiction mismatch'
);
for (const key of [
  'productWideInternalBetaUnlockAllowed',
  'externalBetaUnlockAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionAllowed'
]) {
  assert(parsed.readiness.ownerConfirmationReadinessDecision[key] === false, `Readiness decision widened: ${key}`);
}

assert(parsed.boundary.allowedBoundedScope.includes('SOUND_CPU_internal_beta_metadata_state_confirmed'), 'Allowed bounded scope missing');
assert(parsed.boundary.blockedScope.includes('external_beta_unlock'), 'External beta blocked scope missing');
for (const value of Object.values(parsed.boundary.boundaryGuards)) {
  assert(value === false, 'Boundary guard widened');
}

assert(parsed.blockers.counts.boundedSoundCpuInternalConfirmationBlockingCount === 0, 'Confirmation blockers remain');
assert(parsed.blockers.counts.operatorRunbookFollowUpCount === 3, 'Runbook follow-up count mismatch');
assert(parsed.blockers.counts.externalBetaBlockingCount === 6, 'External beta blocker count mismatch');
assert(parsed.blockers.counts.productionReadinessHardBlockers === 101, 'Production hard blocker mismatch');
assert(
  parsed.blockers.remainingBeforeExternalBeta.includes('production_readiness_hard_blockers'),
  'External beta hard blocker missing'
);

assert(parsed.policy.allowedClaims.includes('SOUND CPU bounded internal beta metadata is confirmed'), 'Allowed confirmation claim missing');
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

assert(parsed.sourceState.decision === sourceDecision, 'Source state decision mismatch');
assert(parsed.sourceState.sourcePr === 1336, 'Source state owner-review PR mismatch');
assert(parsed.sourceState.stateChangeResult.boundedSoundCpuInternalBetaMetadataStateChanged === true, 'Source state change missing');
assert(
  parsed.sourceState.stateChangeResult.soundCpuInternalBetaState === 'bounded_internal_testing_enabled_metadata_only',
  'Source state value mismatch'
);
assert(parsed.sourceStateRegister.soundCpuInternalBetaState.requiresOwnerConfirmationNext === true, 'Source confirmation requirement missing');
assert(parsed.sourceReadiness.readinessRerun.internalDryRunAllowed === true, 'Source internal dry-run missing');
assert(parsed.sourceReadiness.readinessRerun.externalBetaAllowed === false, 'Source external beta widened');
assert(parsed.sourceBlockers.counts.ownerConfirmationPreconditionsCount === 2, 'Source owner-confirmation precondition count mismatch');
assert(parsed.sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'Source SQL widened');
assert(/bounded internal beta operator runbook/i.test(docs.nextPrompt), 'Next prompt missing runbook wording');
assert(/No product-wide internal beta unlock/i.test(docs.nextPrompt), 'Next prompt missing product-wide closure');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-internal-beta-unlock-owner-confirmation-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-after-runner-boundary-execution-proof-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_internal_beta_unlock_owner_confirmation_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1338,
      sourceMergeCommit: 'e13755f32693014db31d6c43f971d59c97854a18',
      soundCpuInternalBetaState: 'bounded_internal_testing_enabled_metadata_only',
      boundedSoundCpuInternalBetaMetadataConfirmed: true,
      productWideInternalBetaUnlocked: false,
      externalBetaUnlocked: false,
      productionUnlocked: false,
      prodReadinessHardBlockers: 101,
      prodReadinessWarnings: 26,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-INTERNAL-BETA-OPERATOR-RUNBOOK-AFTER-OWNER-CONFIRMATION: document bounded internal beta operating runbook, no external beta/no execution'
    },
    null,
    2
  )
);
