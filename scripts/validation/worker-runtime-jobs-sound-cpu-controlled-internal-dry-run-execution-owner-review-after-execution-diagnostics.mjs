import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_controlled_internal_dry_run_execution_owner_review_after_execution_passed_with_warnings_ready_for_internal_beta_next_scope_review_no_external_beta';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_controlled_internal_dry_run_execution_after_plan_review_completed_with_warnings_ready_for_dry_run_execution_owner_review_no_external_beta';
const descriptorDigest = '278afb2895eeebdbb433b858fa6df87e966d2dcf4d21826380e11956121ce81a';

const files = {
  review:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-after-execution.md',
  acceptance:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-acceptance-register-after-execution.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-evidence-owner-review-after-execution.md',
  boundary:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-boundary-review-after-execution.md',
  nextScope:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-next-scope-readiness-after-dry-run-review.md',
  claimPolicy:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-claim-policy-after-execution.md',
  blocker:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-blocker-follow-up-after-execution.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-next-scope-review-after-dry-run.md',
  sourceResult:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-result-after-plan-review.md',
  sourceDescriptor:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-synthetic-descriptor-register-after-plan-review.md',
  sourceOutput:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-sanitized-output-after-plan-review.md',
  sourcePolicy:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-claim-policy-after-plan-review.md'
};

const labels = {
  review:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-after-execution',
  acceptance:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-acceptance-register-after-execution',
  evidence:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-evidence-owner-review-after-execution',
  boundary:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-boundary-review-after-execution',
  nextScope:
    'worker-runtime-jobs-sound-cpu-internal-beta-next-scope-readiness-after-dry-run-review',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-claim-policy-after-execution',
  blocker:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-blocker-follow-up-after-execution',
  sourceResult:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-result-after-plan-review',
  sourceDescriptor:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-synthetic-descriptor-register-after-plan-review',
  sourceOutput:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-sanitized-output-after-plan-review',
  sourcePolicy:
    'worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-claim-policy-after-plan-review'
};

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

const expectedJobTypes = [
  'sound.package_import_smoke',
  'sound.numeric_array_analysis',
  'sound.symbolic_midi_analysis',
  'sound.loudness_synthetic_analysis'
];

const forbiddenText = [
  '"externalBetaUnlocked": true',
  '"realUserMediaBetaUnlocked": true',
  '"paidProductionUnlocked": true',
  '"productionUnlocked": true',
  '"acceptedForExternalBeta": true',
  '"acceptedForRealUserMediaBeta": true',
  '"acceptedForPaidProduction": true',
  '"acceptedForRuntimeReadiness": true',
  '"acceptedForWorkerExecutionReadiness": true',
  '"acceptedForRouteExecutionReadiness": true',
  '"acceptedForMediaReadiness": true',
  '"mayUnlockExternalBetaToday": true',
  '"mayUseRealUserMediaToday": true',
  '"mayClaimRuntimeReadinessToday": true',
  '"mayClaimBroadDryRunPassedToday": true',
  '"workerDispatched": true',
  '"routeCalled": true',
  '"mediaOpened": true',
  '"mediaProcessed": true',
  '"artifactWritten": true',
  '"supabaseTouched": true',
  '"sqlExecuted": true',
  '"providerCalled": true',
  '"modelCalled": true',
  '"signedUrlCreated": true',
  '"generatedLocalFixturePassedClaimed": true',
  '"dryRunPassedClaimed": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
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

function arrayEquals(actual, expected, message) {
  assert(Array.isArray(actual), `${message}: not an array`);
  assert(actual.length === expected.length, `${message}: length mismatch`);
  for (const value of expected) assert(actual.includes(value), `${message}: missing ${value}`);
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

for (const key of ['review', 'acceptance', 'evidence', 'boundary', 'nextScope', 'claimPolicy', 'blocker']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`);
}

assert(parsed.review.sourcePr === 1353, 'Review source PR mismatch');
assert(parsed.review.sourceMergeCommit === '2b61263c4db72712e02c59951b2861ecd2947964', 'Review source merge mismatch');
assert(parsed.review.sourceDecision === sourceDecision, 'Review source decision mismatch');
assert(parsed.review.reviewOutcome.boundedSyntheticDryRunEvidenceAccepted === true, 'Dry-run evidence not accepted');
assert(parsed.review.reviewOutcome.acceptedSoundCpuToolCount === 15, 'Tool count mismatch');
assert(parsed.review.reviewOutcome.syntheticDescriptorCount === 15, 'Descriptor count mismatch');
assert(parsed.review.reviewOutcome.passed === 15, 'Passed count mismatch');
assert(parsed.review.reviewOutcome.failed === 0, 'Failed count mismatch');
assert(parsed.review.reviewOutcome.descriptorDigest === descriptorDigest, 'Descriptor digest mismatch');
assert(parsed.review.reviewOutcome.acceptedForNextInternalBetaScopeReview === true, 'Next scope acceptance missing');
for (const key of [
  'acceptedForExternalBeta',
  'acceptedForRealUserMediaBeta',
  'acceptedForPaidProduction',
  'acceptedForRuntimeReadiness',
  'acceptedForWorkerExecutionReadiness',
  'acceptedForRouteExecutionReadiness',
  'acceptedForMediaReadiness'
]) {
  assert(parsed.review.reviewOutcome[key] === false, `Review widened ${key}`);
}
assert(parsed.review.readinessStateAccepted.prodReadinessOverallStatus === 'blocked', 'Prod readiness status mismatch');
assert(parsed.review.readinessStateAccepted.prodReadinessHardBlockers === 101, 'Hard blocker count mismatch');
assert(parsed.review.readinessStateAccepted.externalBetaAllowed === false, 'External beta readiness widened');

arrayEquals(parsed.acceptance.acceptedToolIds, expectedToolIds, 'Accepted tool ids');
arrayEquals(parsed.acceptance.acceptedJobTypes, expectedJobTypes, 'Accepted job types');
assert(parsed.acceptance.acceptedEvidence.oneControlledInternalSyntheticDryRunAttempt === true, 'Attempt evidence missing');
assert(parsed.acceptance.acceptedEvidence.passed === 15, 'Acceptance passed count mismatch');
assert(parsed.acceptance.acceptedEvidence.failed === 0, 'Acceptance failure count mismatch');
for (const [key, value] of Object.entries(parsed.acceptance.acceptedEvidence)) {
  if (
    ![
      'oneControlledInternalSyntheticDryRunAttempt',
      'descriptorRunnerUsedNodeBuiltinsOnly',
      'descriptorCount',
      'passed',
      'failed',
      'skipped'
    ].includes(key)
  ) {
    assert(value === false, `Acceptance evidence widened ${key}`);
  }
}
assert(parsed.acceptance.acceptedForToday.nextInternalBetaScopeReview === true, 'Next internal scope not accepted');
for (const [key, value] of Object.entries(parsed.acceptance.acceptedForToday)) {
  if (key !== 'nextInternalBetaScopeReview') assert(value === false, `Accepted for today widened ${key}`);
}

assert(parsed.evidence.sourceEvidence.sourcePr === 1353, 'Evidence source PR mismatch');
assert(parsed.evidence.sourceEvidence.sourceDecision === sourceDecision, 'Evidence source decision mismatch');
assert(parsed.evidence.evidenceChecks.acceptedSoundCpuToolCount === 15, 'Evidence tool count mismatch');
assert(parsed.evidence.evidenceChecks.failed === 0, 'Evidence failure count mismatch');
assert(parsed.evidence.evidenceChecks.descriptorDigest === descriptorDigest, 'Evidence digest mismatch');
assert(parsed.evidence.ownerReviewDecision.acceptEvidenceForNextInternalBetaScopeReview === true, 'Evidence next review not accepted');
assert(parsed.evidence.ownerReviewDecision.requestFix === false, 'Evidence fix requested unexpectedly');

for (const value of Object.values(parsed.boundary.observedFalseDuringSourceAttempt)) {
  assert(value === false, 'Boundary observed false flag widened');
}
for (const value of Object.values(parsed.boundary.stillBlocked)) {
  assert(value === true, 'Boundary blocker not preserved');
}

assert(parsed.nextScope.nextScopeReviewReadiness.mayReviewNextInternalBetaScope === true, 'Next scope review not allowed');
assert(parsed.nextScope.nextScopeReviewReadiness.mayUnlockExternalBetaToday === false, 'Next scope external beta widened');
assert(parsed.nextScope.currentReadinessSummary.externalBetaAllowed === false, 'Next scope beta summary widened');
assert(parsed.nextScope.currentReadinessSummary.hardBlockers === 101, 'Next scope hard blockers mismatch');
for (const required of [
  'route_worker_dispatch_contracts_and_runtime_guard_evidence',
  'tool_call_execution_readiness_evidence',
  'supabase_storage_sql_and_service_role_boundary_evidence',
  'billing_credit_and_stripe_safety_evidence'
]) {
  assert(parsed.nextScope.requiredBeforeExternalBeta.includes(required), `Missing external beta prerequisite ${required}`);
}

assert(parsed.claimPolicy.allowedClaims.includes('external beta remains blocked'), 'Blocked beta allowed claim missing');
for (const claim of [
  'external beta ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime readiness',
  'worker execution readiness'
]) {
  assert(parsed.claimPolicy.forbiddenClaims.includes(claim), `Forbidden claim missing: ${claim}`);
}
assert(parsed.claimPolicy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.claimPolicy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.claimPolicy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.claimPolicy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');

assert(
  parsed.blocker.recommendedNextPrompt.includes('INTERNAL-BETA-NEXT-SCOPE-REVIEW-AFTER-DRY-RUN'),
  'Recommended next prompt mismatch'
);
assert(
  /no .*external beta|must not unlock external beta/i.test(docs.nextPrompt),
  'Next prompt missing external beta boundary'
);

assert(parsed.sourceResult.decision === sourceDecision, 'Source result decision mismatch');
assert(parsed.sourceResult.controlledDryRunResult.acceptedSoundCpuToolCount === 15, 'Source tool count mismatch');
assert(parsed.sourceResult.controlledDryRunResult.failed === 0, 'Source failed count mismatch');
assert(parsed.sourceResult.controlledDryRunResult.descriptorDigest === descriptorDigest, 'Source digest mismatch');
assert(parsed.sourceResult.controlledDryRunResult.externalBetaUnlocked === false, 'Source external beta widened');
arrayEquals(parsed.sourceDescriptor.acceptedToolIds, expectedToolIds, 'Source accepted tool ids');
assert(parsed.sourceDescriptor.descriptorCounts.passed === 15, 'Source descriptor passed mismatch');
assert(parsed.sourceOutput.sanitizedOutput.status === 'passed', 'Source output status mismatch');
assert(parsed.sourceOutput.sanitizedOutput.artifactFileCreated === false, 'Source artifact file created');
assert(parsed.sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'Source SQL classification widened');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-controlled-internal-dry-run-execution-owner-review-after-execution:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-after-execution-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_controlled_internal_dry_run_execution_owner_review_after_execution_diagnostics_passed',
      decision,
      sourcePr: 1353,
      sourceMergeCommit: '2b61263c4db72712e02c59951b2861ecd2947964',
      acceptedSoundCpuToolCount: 15,
      syntheticDescriptorCount: 15,
      failed: 0,
      externalBetaAllowed: false,
      prodReadinessOverallStatus: 'blocked',
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-INTERNAL-BETA-NEXT-SCOPE-REVIEW-AFTER-DRY-RUN: review next internal beta scope, no external beta'
    },
    null,
    2
  )
);
