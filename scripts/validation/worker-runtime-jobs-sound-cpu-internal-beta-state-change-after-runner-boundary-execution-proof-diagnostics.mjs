import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_state_change_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_unlock_owner_confirmation';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_internal_beta_unlock_owner_review_after_runner_boundary_execution_proof_passed_with_warnings_ready_for_internal_beta_state_change_no_execution';

const files = {
  stateChange: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-change-after-runner-boundary-execution-proof.md',
  stateRegister: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-register-after-runner-boundary-execution-proof.md',
  scope: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-scope-register-after-runner-boundary-execution-proof.md',
  readiness: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-readiness-register-after-runner-boundary-execution-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-blocker-register-after-runner-boundary-execution-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-state-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-confirmation-after-runner-boundary-execution-proof.md',
  sourceReview:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-review-after-runner-boundary-execution-proof.md',
  sourceAcceptance:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-acceptance-register-after-runner-boundary-execution-proof.md',
  sourceReadiness:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-readiness-review-after-runner-boundary-execution-proof.md',
  sourceBoundary:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-execution-boundary-after-runner-boundary-execution-proof.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-claim-policy-after-runner-boundary-execution-proof.md'
};

const labels = {
  stateChange: 'worker-runtime-jobs-sound-cpu-internal-beta-state-change-after-runner-boundary-execution-proof',
  stateRegister: 'worker-runtime-jobs-sound-cpu-internal-beta-state-register-after-runner-boundary-execution-proof',
  scope: 'worker-runtime-jobs-sound-cpu-internal-beta-state-scope-register-after-runner-boundary-execution-proof',
  readiness: 'worker-runtime-jobs-sound-cpu-internal-beta-state-readiness-register-after-runner-boundary-execution-proof',
  blockers: 'worker-runtime-jobs-sound-cpu-internal-beta-state-blocker-register-after-runner-boundary-execution-proof',
  policy: 'worker-runtime-jobs-sound-cpu-internal-beta-state-claim-policy-after-runner-boundary-execution-proof',
  sourceReview:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-review-after-runner-boundary-execution-proof',
  sourceAcceptance:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-acceptance-register-after-runner-boundary-execution-proof',
  sourceReadiness:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-readiness-review-after-runner-boundary-execution-proof',
  sourceBoundary:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-execution-boundary-after-runner-boundary-execution-proof',
  sourcePolicy:
    'worker-runtime-jobs-sound-cpu-internal-beta-unlock-owner-claim-policy-after-runner-boundary-execution-proof'
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
  '"workerExecutionAllowed": true',
  '"routeExecutionAllowed": true',
  '"toolExecutionAllowed": true',
  '"mediaProcessingAllowed": true',
  '"artifactDeliveryAllowed": true',
  '"supabaseMutationAllowed": true',
  '"sqlExecutionAllowed": true',
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

for (const key of ['stateChange', 'stateRegister', 'scope', 'readiness', 'blockers', 'policy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`);
}

assert(parsed.stateChange.sourceDecision === sourceDecision, 'Source decision mismatch');
assert(parsed.stateChange.sourcePr === 1336, 'Source PR mismatch');
assert(parsed.stateChange.sourceMergeCommit === '56e7fd1afb25cd86bac19d8ddce11e7cb2003cf5', 'Source merge commit mismatch');
assert(parsed.stateChange.stateChangeResult.boundedSoundCpuInternalBetaMetadataStateChanged === true, 'State change not recorded');
assert(
  parsed.stateChange.stateChangeResult.soundCpuInternalBetaState === 'bounded_internal_testing_enabled_metadata_only',
  'State value mismatch'
);
assert(parsed.stateChange.stateChangeResult.acceptedSoundCpuToolCount === 15, 'Tool count mismatch');
assert(parsed.stateChange.stateChangeResult.representedEvidenceCount === 6, 'Evidence count mismatch');
assert(parsed.stateChange.stateChangeResult.remainingEvidenceCount === 0, 'Remaining evidence mismatch');
assert(parsed.stateChange.stateChangeResult.currentReadinessSummariesReran === true, 'Readiness rerun missing');

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
  assert(parsed.stateChange.stateChangeResult[flag] === false, `State-change flag widened: ${flag}`);
}

assert(parsed.stateRegister.soundCpuInternalBetaState.stateChangedInThisPacket === true, 'State register did not change');
assert(
  parsed.stateRegister.soundCpuInternalBetaState.newState === 'bounded_internal_testing_enabled_metadata_only',
  'State register new state mismatch'
);
assert(parsed.stateRegister.soundCpuInternalBetaState.requiresOwnerConfirmationNext === true, 'Owner confirmation requirement missing');
assert(parsed.stateRegister.acceptedTools.toolCount === 15, 'State register tool count mismatch');
assert(parsed.stateRegister.acceptedTools.runtimeExecutionApproved === false, 'Runtime execution widened');
assert(parsed.stateRegister.productStateClosures.productWideInternalBetaUnlocked === false, 'Product-wide internal beta widened');
assert(parsed.stateRegister.productStateClosures.externalBetaUnlocked === false, 'External beta widened');

for (const value of Object.values(parsed.scope.scopeGuards)) {
  assert(value === false, 'Scope guard widened');
}
assert(parsed.scope.allowedInternalScope.includes('bounded_SOUND_CPU_internal_testing_metadata'), 'Bounded internal scope missing');
assert(parsed.scope.blockedScope.includes('external_beta'), 'External beta blocked scope missing');

assert(parsed.readiness.readinessRerun.prodReadinessOverallStatus === 'blocked', 'Readiness status mismatch');
assert(parsed.readiness.readinessRerun.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');
assert(parsed.readiness.readinessRerun.prodReadinessWarnings === 26, 'Warning count mismatch');
assert(parsed.readiness.readinessRerun.prodBetaStatus === 'internal_testing_ready', 'Beta status mismatch');
assert(parsed.readiness.readinessRerun.internalDryRunAllowed === true, 'Internal dry-run not allowed');
assert(parsed.readiness.readinessRerun.externalBetaAllowed === false, 'External beta allowed widened');
assert(parsed.readiness.stateChangeReadinessDecision.boundedSoundCpuInternalBetaMetadataStateChangeAllowed === true, 'State-change readiness missing');
for (const key of [
  'productWideInternalBetaUnlockAllowed',
  'externalBetaUnlockAllowed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionAllowed'
]) {
  assert(parsed.readiness.stateChangeReadinessDecision[key] === false, `Readiness decision widened: ${key}`);
}

assert(parsed.blockers.counts.boundedSoundCpuInternalStateBlockingCount === 0, 'State blockers remain');
assert(parsed.blockers.counts.ownerConfirmationPreconditionsCount === 2, 'Owner confirmation count mismatch');
assert(parsed.blockers.counts.externalBetaBlockingCount === 6, 'External beta blocker count mismatch');
assert(parsed.blockers.counts.productionReadinessHardBlockers === 101, 'Production hard blocker mismatch');

assert(parsed.policy.allowedClaims.includes('SOUND CPU bounded internal beta metadata state changed'), 'Allowed state-change claim missing');
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

assert(parsed.sourceReview.decision === sourceDecision, 'Source owner review decision mismatch');
assert(parsed.sourceReview.sourcePr === 1331, 'Source owner review source PR mismatch');
assert(parsed.sourceReview.ownerReviewResult.internalBetaStateChangeMayProceedInLaterPrompt === true, 'Source state-change gate missing');
assert(parsed.sourceAcceptance.acceptedForNextGate.boundedInternalBetaStateChangePrompt === 'yes', 'Source next-gate acceptance missing');
assert(parsed.sourceReadiness.ownerReadinessDecision.mustRerunReadinessBeforeStateChange === true, 'Source rerun requirement missing');
assert(parsed.sourceBoundary.laterStateChangeBoundary.boundedInternalBetaMetadataStateChangeMayBeReviewedLater === true, 'Source boundary missing');
assert(parsed.sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'Source SQL widened');
assert(/confirm the SOUND CPU bounded internal beta metadata state change/i.test(docs.nextPrompt), 'Next prompt missing owner confirmation wording');
assert(/No product-wide internal beta unlock/i.test(docs.nextPrompt), 'Next prompt missing product-wide closure');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-internal-beta-state-change-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-state-change-after-runner-boundary-execution-proof-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_internal_beta_state_change_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1336,
      sourceMergeCommit: '56e7fd1afb25cd86bac19d8ddce11e7cb2003cf5',
      soundCpuInternalBetaState: 'bounded_internal_testing_enabled_metadata_only',
      boundedSoundCpuInternalBetaMetadataStateChanged: true,
      productWideInternalBetaUnlocked: false,
      externalBetaUnlocked: false,
      productionUnlocked: false,
      prodReadinessHardBlockers: 101,
      prodReadinessWarnings: 26,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-INTERNAL-BETA-UNLOCK-OWNER-CONFIRMATION-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: confirm bounded internal beta state change, no external beta/no execution'
    },
    null,
    2
  )
);
