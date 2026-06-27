import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_internal_beta_reconsideration_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_owner_go_no_go_no_unlock';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_security_cost_support_gate_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_reconsideration_no_unlock';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-after-runner-boundary-execution-proof.md',
  evidenceSummary:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-evidence-summary-after-runner-boundary-execution-proof.md',
  readinessSummary:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-readiness-summary-after-runner-boundary-execution-proof.md',
  blockerRegister:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-blocker-register-after-runner-boundary-execution-proof.md',
  claimPolicy:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-owner-go-no-go-after-runner-boundary-execution-proof.md',
  sourceSecurityCost:
    'docs/worker-runtime-jobs-sound-cpu-security-cost-support-gate-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceSecurityCostBlockers:
    'docs/worker-runtime-jobs-sound-cpu-security-cost-support-gate-blocker-register-after-runner-boundary-execution-proof.md',
  sourceSecurityCostPolicy:
    'docs/worker-runtime-jobs-sound-cpu-security-cost-support-gate-policy-after-runner-boundary-execution-proof.md',
  sourceSecurityCostClaim:
    'docs/worker-runtime-jobs-sound-cpu-security-cost-support-gate-claim-policy-after-runner-boundary-execution-proof.md'
};

const labels = {
  plan: 'worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-after-runner-boundary-execution-proof',
  evidenceSummary:
    'worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-evidence-summary-after-runner-boundary-execution-proof',
  readinessSummary:
    'worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-readiness-summary-after-runner-boundary-execution-proof',
  blockerRegister:
    'worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-blocker-register-after-runner-boundary-execution-proof',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-claim-policy-after-runner-boundary-execution-proof'
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
  '"acceptedForExecutionToday": true',
  '"acceptedForInternalBetaUnlockTodayCount": 6',
  '"externalBetaAllowedToday": true',
  '"realUserMediaBetaAllowedToday": true',
  '"paidProductionAllowedToday": true',
  '"productionAllowedToday": true',
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
assert(parsed.plan.sourcePr === 1318, 'Source PR mismatch');
assert(
  parsed.plan.sourceMergeCommit === '29ec8c3121db128c7fc2b90048cbbcd1b6b22fae',
  'Source merge commit mismatch'
);
assert(parsed.plan.internalBetaReconsiderationResult.reconsiderationPacketCreated === true, 'Reconsideration packet missing');
assert(parsed.plan.internalBetaReconsiderationResult.acceptedSoundCpuToolCount === 15, 'SOUND CPU tool count mismatch');
assert(parsed.plan.internalBetaReconsiderationResult.requiredEvidenceCount === 6, 'Required evidence count mismatch');
assert(parsed.plan.internalBetaReconsiderationResult.representedEvidenceCount === 6, 'Represented evidence count mismatch');
assert(parsed.plan.internalBetaReconsiderationResult.remainingEvidenceCount === 0, 'Remaining evidence count mismatch');
assert(parsed.plan.internalBetaReconsiderationResult.ownerGoNoGoMayProceed === true, 'Owner go/no-go not allowed');
for (const flag of [
  'ownerGoNoGoCompletedToday',
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
  assert(parsed.plan.internalBetaReconsiderationResult[flag] === false, `Plan flag widened: ${flag}`);
}

assert(parsed.evidenceSummary.counts.representedEvidenceCount === 6, 'Evidence summary count mismatch');
assert(parsed.evidenceSummary.counts.remainingEvidenceCount === 0, 'Evidence summary remaining mismatch');
assert(parsed.evidenceSummary.counts.acceptedForExecutionTodayCount === 0, 'Execution count widened');
assert(parsed.evidenceSummary.counts.acceptedForInternalBetaUnlockTodayCount === 0, 'Unlock count widened');
for (const item of parsed.evidenceSummary.representedEvidenceItems) {
  assert(item.represented === true, `Evidence item not represented: ${item.id}`);
  assert(item.acceptedForExecutionToday === false, `Evidence item execution widened: ${item.id}`);
  readRequired(item.sourceFile);
}

assert(parsed.readinessSummary.readinessSummaryPolicy.prodReadinessSummaryMustBeRerunBeforeGoNoGo === true, 'Readiness rerun missing');
assert(parsed.readinessSummary.readinessSummaryPolicy.stopRatherThanForceReadiness === true, 'Stop-rather-than-force policy missing');
assert(parsed.readinessSummary.acceptedCurrentLaneStatus.internalDryRunEvidenceMayBeConsidered === true, 'Internal dry-run consideration missing');
for (const key of [
  'internalBetaUnlockApprovedToday',
  'externalBetaAllowedToday',
  'realUserMediaBetaAllowedToday',
  'paidProductionAllowedToday',
  'productionAllowedToday'
]) {
  assert(parsed.readinessSummary.acceptedCurrentLaneStatus[key] === false, `Readiness status widened: ${key}`);
}

assert(parsed.blockerRegister.remainingBeforeOwnerGoNoGo.length === 0, 'Owner go/no-go blockers remain');
assert(parsed.blockerRegister.counts.ownerGoNoGoBlockingEvidenceCount === 0, 'Owner go/no-go evidence blockers mismatch');
assert(parsed.blockerRegister.counts.internalBetaUnlockBlockingCount === 5, 'Internal beta unlock blockers not preserved');
assert(parsed.blockerRegister.counts.externalBetaBlockingCount === 6, 'External beta blockers not preserved');
assert(parsed.blockerRegister.closedEvidenceItems.length === 6, 'Closed evidence item count mismatch');

assert(parsed.claimPolicy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.claimPolicy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.claimPolicy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.claimPolicy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');
for (const claim of ['internal beta unlocked', 'external beta ready', 'production ready', 'worker execution readiness']) {
  assert(parsed.claimPolicy.forbiddenClaims.includes(claim), `Forbidden claim missing: ${claim}`);
}

assert(docs.sourceSecurityCost.includes(sourceDecision), 'Source security/cost decision missing');
assert(docs.sourceSecurityCost.includes('"remainingEvidenceCount": 0'), 'Source security/cost remaining count mismatch');
assert(docs.sourceSecurityCostBlockers.includes('"internalBetaEvidenceBlockingCount": 0'), 'Source blocker count mismatch');
assert(docs.sourceSecurityCostPolicy.includes('"internalBetaUnlockApprovedToday": false'), 'Source policy unlock widened');
assert(docs.sourceSecurityCostClaim.includes('"external beta ready"'), 'Source claim policy missing external beta forbidden claim');
assert(/go\/no-go/i.test(docs.nextPrompt), 'Next prompt missing go/no-go');
assert(/no unlock is made/i.test(docs.nextPrompt) && /no_execution/i.test(docs.nextPrompt), 'Next prompt must preserve no-unlock/no-execution wording');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-internal-beta-reconsideration-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-after-runner-boundary-execution-proof-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_internal_beta_reconsideration_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1318,
      sourceMergeCommit: '29ec8c3121db128c7fc2b90048cbbcd1b6b22fae',
      acceptedSoundCpuToolCount: 15,
      representedEvidenceCount: 6,
      remainingEvidenceCount: 0,
      ownerGoNoGoMayProceed: true,
      internalBetaUnlockApprovedToday: false,
      externalBetaUnlockApprovedToday: false,
      productionUnlockApprovedToday: false,
      supabaseClassification: parsed.claimPolicy.supabaseClassification,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-INTERNAL-BETA-OWNER-GO-NO-GO-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: decide internal beta go/no-go, no automatic unlock'
    },
    null,
    2
  )
);
