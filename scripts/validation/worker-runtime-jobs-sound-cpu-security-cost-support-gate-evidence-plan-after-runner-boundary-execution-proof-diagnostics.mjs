import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const decision =
  'worker_runtime_jobs_sound_cpu_security_cost_support_gate_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_reconsideration_no_unlock';
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_supabase_sql_gate_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_security_cost_support_gate_evidence_plan_after_runner_boundary_execution_proof';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-security-cost-support-gate-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceRegister:
    'docs/worker-runtime-jobs-sound-cpu-security-cost-support-gate-source-register-after-runner-boundary-execution-proof.md',
  gatePolicy:
    'docs/worker-runtime-jobs-sound-cpu-security-cost-support-gate-policy-after-runner-boundary-execution-proof.md',
  blockerRegister:
    'docs/worker-runtime-jobs-sound-cpu-security-cost-support-gate-blocker-register-after-runner-boundary-execution-proof.md',
  claimPolicy:
    'docs/worker-runtime-jobs-sound-cpu-security-cost-support-gate-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-internal-beta-reconsideration-after-runner-boundary-execution-proof.md',
  sourceSupabase:
    'docs/worker-runtime-jobs-sound-cpu-supabase-sql-gate-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceRequiredEvidence:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceRequiredEvidenceMap:
    'docs/worker-runtime-jobs-sound-cpu-internal-beta-required-evidence-map-after-runner-boundary-execution-proof.md',
  sourceBilling: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-closure.md',
  sourceBillingClaim: 'docs/worker-runtime-jobs-sound-cpu-billing-stripe-credits-gap-claim-policy.md',
  sourceCompliance: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-closure.md',
  sourceComplianceBoundary: 'docs/worker-runtime-jobs-sound-cpu-compliance-security-gap-readiness-boundary.md',
  sourceProductBeta: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  sourceObservability: 'docs/worker-runtime-jobs-sound-cpu-retry-timeout-cancellation-observability-owner-register.md',
  sourceInternalBetaDecision:
    'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-internal-beta-decision-readiness-register-after-runner-boundary-execution-proof.md',
  productPlan: 'product-plan.md',
  pricing: 'pricing-and-credits.md',
  securityPolicy: 'docs/production-security-review-policy.md',
  costPolicy: 'docs/production-cost-control-policy.md'
};

const labels = {
  plan: 'worker-runtime-jobs-sound-cpu-security-cost-support-gate-evidence-plan-after-runner-boundary-execution-proof',
  sourceRegister:
    'worker-runtime-jobs-sound-cpu-security-cost-support-gate-source-register-after-runner-boundary-execution-proof',
  gatePolicy:
    'worker-runtime-jobs-sound-cpu-security-cost-support-gate-policy-after-runner-boundary-execution-proof',
  blockerRegister:
    'worker-runtime-jobs-sound-cpu-security-cost-support-gate-blocker-register-after-runner-boundary-execution-proof',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-security-cost-support-gate-claim-policy-after-runner-boundary-execution-proof'
};

const falseFlags = [
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseMutationApprovedToday',
  'serviceRoleMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'migrationDeploymentApprovedToday',
  'environmentMutationApprovedToday',
  'creditMutationApprovedToday',
  'stripeCheckoutApprovedToday',
  'stripeWebhookApprovedToday',
  'paymentProcessingApprovedToday',
  'dockerGcpApprovedToday',
  'cloudRunExecutionApprovedToday',
  'secretManagerApiApprovedToday',
  'serviceAccountApprovedToday',
  'providerModelCallApprovedToday',
  'browserCaptureApprovedToday',
  'internalBetaUnlockApprovedToday',
  'externalBetaUnlockApprovedToday',
  'productionUnlockApprovedToday'
];

const forbiddenText = [
  ...falseFlags.map((flag) => `"${flag}": true`),
  '"internalBetaAllowed": true',
  '"externalBetaAllowed": true',
  '"productionAllowed": true',
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
assert(parsed.plan.sourcePr === 1311, 'Source PR mismatch');
assert(
  parsed.plan.sourceMergeCommit === 'b21396ea398a4289eedae4f98891a91e2d981850',
  'Source merge commit mismatch'
);
assert(parsed.plan.securityCostSupportEvidenceResult.securityCostSupportEvidencePlanCreated === true, 'Plan not created');
assert(parsed.plan.securityCostSupportEvidenceResult.acceptedSoundCpuToolCount === 15, 'SOUND CPU tool count mismatch');
for (const key of [
  'securityEvidenceRepresented',
  'privacyRetentionEvidenceRepresented',
  'billingCostEvidenceRepresented',
  'observabilityEvidenceRepresented',
  'supportEvidenceRepresented',
  'incidentResponseEvidenceRepresented',
  'rollbackEvidenceRepresented',
  'allRequiredInternalBetaEvidenceItemsRepresented',
  'internalBetaReconsiderationMayProceed',
  'securityReviewRequiredBeforeExternalBeta',
  'humanLaunchApprovalRequired'
]) {
  assert(parsed.plan.securityCostSupportEvidenceResult[key] === true, `${key} not represented`);
}
for (const flag of falseFlags.filter((flag) => flag in parsed.plan.securityCostSupportEvidenceResult)) {
  assert(parsed.plan.securityCostSupportEvidenceResult[flag] === false, `Plan flag widened: ${flag}`);
}
assert(parsed.plan.closedEvidenceItem === 'security_cost_support_gate', 'Closed evidence item mismatch');
assert(parsed.plan.remainingEvidenceCount === 0, 'Remaining evidence count mismatch');
assert(parsed.plan.nextEvidenceItem === 'internal_beta_reconsideration_no_unlock', 'Next evidence item mismatch');

assert(parsed.sourceRegister.sourceEvidenceCount === 10, 'Source evidence count mismatch');
assert(parsed.sourceRegister.sourceEvidenceAcceptedForExecutionToday === false, 'Source evidence execution widened');
for (const source of parsed.sourceRegister.sourceEvidence) {
  assert(source.acceptedForEvidenceRepresentation === true, `Source not represented: ${source.sourceId}`);
  assert(source.acceptedForExecutionToday === false, `Source execution widened: ${source.sourceId}`);
  if (source.file) readRequired(source.file);
  if (source.files) for (const file of source.files) readRequired(file);
}

for (const area of [
  'security_review',
  'privacy_retention',
  'cost_controls',
  'billing_stripe_credits',
  'observability',
  'support_escalation',
  'incident_response',
  'rollback',
  'launch_go_no_go'
]) {
  assert(parsed.gatePolicy.representedGateAreas.includes(area), `Missing represented gate area: ${area}`);
}
assert(parsed.gatePolicy.allowedPlanningOutcomes.internalBetaReconsiderationNoUnlockMayProceed === true, 'No-unlock reconsideration not allowed');
for (const flag of falseFlags.filter((flag) => flag in parsed.gatePolicy.blockedToday)) {
  assert(parsed.gatePolicy.blockedToday[flag] === false, `Gate-policy flag widened: ${flag}`);
}
for (const value of Object.values(parsed.gatePolicy.readinessClaims)) {
  assert(value === false, 'Readiness claim widened');
}

assert(parsed.blockerRegister.closedEvidenceItems.length === 6, 'Closed evidence item count mismatch');
assert(parsed.blockerRegister.closedEvidenceItems.includes('security_cost_support_gate'), 'Security/cost/support not closed');
assert(parsed.blockerRegister.closedEvidenceCount === 6, 'Closed evidence count mismatch');
assert(parsed.blockerRegister.remainingEvidenceCount === 0, 'Remaining evidence count in blocker register mismatch');
assert(parsed.blockerRegister.remainingBeforeInternalBetaReconsiderationNoUnlock.length === 0, 'Unexpected blocker before reconsideration');
assert(parsed.blockerRegister.counts.internalBetaEvidenceBlockingCount === 0, 'Internal beta evidence blockers remain');
assert(parsed.blockerRegister.counts.externalBetaBlockingCount === 6, 'External beta blockers not preserved');

assert(parsed.claimPolicy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.claimPolicy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.claimPolicy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.claimPolicy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');
for (const claim of ['internal beta unlocked', 'external beta ready', 'production ready', 'worker execution readiness']) {
  assert(parsed.claimPolicy.forbiddenClaims.includes(claim), `Forbidden claim missing: ${claim}`);
}

assert(docs.sourceSupabase.includes(sourceDecision), 'Supabase source decision missing');
assert(docs.sourceSupabase.includes('"remainingEvidenceCount": 1'), 'Supabase source remaining count mismatch');
assert(docs.sourceRequiredEvidence.includes('"requiredEvidenceCount": 6'), 'Required evidence source count missing');
assert(docs.sourceRequiredEvidenceMap.includes('security_cost_support_gate'), 'Required evidence map missing security/cost/support');
assert(docs.sourceBilling.includes('"billingStripeCreditsPlanningGapClosed": true'), 'Billing planning source missing');
assert(docs.sourceBilling.includes('"creditMutationApprovedToday": false'), 'Credit mutation source widened');
assert(docs.sourceBillingClaim.includes('Stripe webhook readiness'), 'Billing forbidden claim source missing');
assert(docs.sourceCompliance.includes('"complianceSecurityPlanningGapClosed": true'), 'Compliance planning source missing');
assert(docs.sourceCompliance.includes('"securityReviewRequiredBeforeExternalBeta": true'), 'Security external beta requirement missing');
assert(docs.sourceComplianceBoundary.includes('"secretManagerApiAllowed": false'), 'Secret Manager boundary widened');
assert(docs.sourceProductBeta.includes('"externalBetaAllowed": false'), 'Product beta source widened');
assert(docs.sourceProductBeta.includes('"productWideBetaApprovedToday": false'), 'Product-wide beta source widened');
assert(docs.sourceObservability.includes('"observabilityPolicyApprovedToday": false'), 'Observability execution source widened');
assert(docs.sourceInternalBetaDecision.includes('support, rollback, observability, and cost owner checks'), 'Support/cost owner check source missing');
assert(docs.productPlan.includes('approve') && docs.productPlan.includes('credit estimate'), 'Product plan approval guardrail missing');
assert(docs.pricing.includes('Deduct Only After Approval'), 'Pricing approval guardrail missing');
assert(docs.securityPolicy.includes('not a substitute for human security review before external beta'), 'Security review guardrail missing');
assert(docs.costPolicy.includes('human approvals pass'), 'Cost-control guardrail missing');
assert(/no[-_ ]unlock/i.test(docs.nextPrompt), 'Next prompt must preserve no-unlock wording');

const packageJson = JSON.parse(readRequired('package.json'));
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-security-cost-support-gate-evidence-plan-after-runner-boundary-execution-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-security-cost-support-gate-evidence-plan-after-runner-boundary-execution-proof-diagnostics.mjs',
  'Package script missing'
);

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_security_cost_support_gate_evidence_plan_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1311,
      sourceMergeCommit: 'b21396ea398a4289eedae4f98891a91e2d981850',
      acceptedSoundCpuToolCount: 15,
      closedEvidenceItem: 'security_cost_support_gate',
      closedEvidenceCount: 6,
      remainingEvidenceCount: 0,
      internalBetaReconsiderationMayProceed: true,
      internalBetaUnlockApprovedToday: false,
      externalBetaUnlockApprovedToday: false,
      productionUnlockApprovedToday: false,
      supabaseClassification: parsed.claimPolicy.supabaseClassification,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-INTERNAL-BETA-RECONSIDERATION-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: reconsider internal beta after required evidence, no unlock'
    },
    null,
    2
  )
);
