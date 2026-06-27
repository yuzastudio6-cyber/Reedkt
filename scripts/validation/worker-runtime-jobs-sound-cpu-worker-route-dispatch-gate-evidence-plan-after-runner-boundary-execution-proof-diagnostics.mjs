import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const decision =
  'worker_runtime_jobs_sound_cpu_worker_route_dispatch_gate_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_supabase_sql_gate_evidence_plan_after_runner_boundary_execution_proof';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceRegister:
    'docs/worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-source-register-after-runner-boundary-execution-proof.md',
  boundaryPolicy:
    'docs/worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-policy-after-runner-boundary-execution-proof.md',
  blockerRegister:
    'docs/worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-blocker-register-after-runner-boundary-execution-proof.md',
  claimPolicy:
    'docs/worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-supabase-sql-gate-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceNoArtifact:
    'docs/worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceNoArtifactBlockers:
    'docs/worker-runtime-jobs-sound-cpu-no-artifact-storage-delivery-blocker-register-after-runner-boundary-execution-proof.md',
  limitedInternalRunnerCompletion:
    'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-execution-completion-decision-after-image-import-proof.md',
  controlledLimitedInternalRunnerOwner:
    'docs/worker-runtime-jobs-sound-cpu-controlled-limited-internal-runner-boundary-execution-proof-owner-review-after-image-import-proof.md',
  limitedInternalRunnerPreflight:
    'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-completion-decision-after-image-import-proof.md',
  runnerBoundaryOwner:
    'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-review-after-image-import-proof.md',
  toolCallOwner:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof.md',
  executionGateSourceOwner:
    'docs/worker-runtime-jobs-sound-cpu-execution-gate-source-owner-review.md',
  runtimeExecutionApprovalOwner:
    'docs/worker-runtime-jobs-sound-cpu-runtime-execution-owner-approval-packet-review.md'
};

const labels = {
  plan: 'worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-evidence-plan-after-runner-boundary-execution-proof',
  sourceRegister:
    'worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-source-register-after-runner-boundary-execution-proof',
  boundaryPolicy:
    'worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-policy-after-runner-boundary-execution-proof',
  blockerRegister:
    'worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-blocker-register-after-runner-boundary-execution-proof',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-claim-policy-after-runner-boundary-execution-proof'
};

const falseFlags = [
  'productToolCallDispatchApprovedToday',
  'productToolCallExecutionApprovedToday',
  'workerDispatchApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'claimLeaseMutationApprovedToday',
  'runtimeExecutionApprovedToday',
  'serviceRoleExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseSqlApprovedToday',
  'internalBetaUnlockApprovedToday',
  'externalBetaUnlockApprovedToday',
  'productionUnlockApprovedToday'
];

const forbiddenText = [
  ...falseFlags.map((flag) => `"${flag}": true`),
  '"productToolCallExecution": "yes"',
  '"workerExecution": "yes"',
  '"routeExecution": "yes"',
  '"runtimeExecutionApprovedToday": true',
  '"workerDispatchApprovedToday": true',
  '"allOwnerSignoffsGrantedToday": true',
  '"sqlExecuted": "yes"',
  '"acceptedForExecutionToday": true',
  'SUPABASE_URL',
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
assert(parsed.plan.sourcePr === 1301, 'Source PR mismatch');
assert(
  parsed.plan.sourceMergeCommit === '14ea875461bcb6e0d2d89ad43d33f9e682886afa',
  'Source merge commit mismatch'
);
assert(parsed.plan.workerRouteDispatchGateEvidenceResult.workerRouteDispatchGateEvidencePlanCreated === true, 'Plan not created');
assert(parsed.plan.closedEvidenceItem === 'worker_route_dispatch_gate', 'Closed evidence item mismatch');
assert(parsed.plan.remainingEvidenceCount === 2, 'Remaining evidence count mismatch');
assert(parsed.plan.nextEvidenceItem === 'supabase_sql_gate', 'Next evidence item mismatch');

for (const flag of falseFlags) {
  assert(parsed.plan.workerRouteDispatchGateEvidenceResult[flag] === false, `Plan flag must be false: ${flag}`);
  assert(parsed.boundaryPolicy.blockedToday[flag] === false, `Boundary flag must be false: ${flag}`);
  assert(parsed.claimPolicy.claimPolicy[flag] === false, `Claim-policy flag must be false: ${flag}`);
}

assert(parsed.sourceRegister.sourceEvidenceCount === 8, 'Source evidence count mismatch');
assert(parsed.sourceRegister.sourceEvidenceAcceptedForExecutionToday === false, 'Source evidence must not allow execution');

for (const surface of [
  'product tool-call dispatch',
  'product tool-call execution',
  'worker dispatch',
  'worker execution',
  'server route execution',
  'claim mutation',
  'lease mutation',
  'service-role execution payloads'
]) {
  assert(parsed.boundaryPolicy.blockedDispatchSurfacesToday.includes(surface), `Missing blocked dispatch surface: ${surface}`);
}

assert(
  parsed.blockerRegister.closedEvidenceItems.some((item) => item.id === 'worker_route_dispatch_gate') &&
    parsed.blockerRegister.closedEvidenceItems.length === 4,
  'Closed evidence items incomplete'
);
assert(parsed.blockerRegister.remainingEvidenceCount === 2, 'Blocker remaining evidence count mismatch');
for (const item of ['supabase_sql_gate', 'security_cost_support_gate']) {
  assert(parsed.blockerRegister.remainingEvidenceItems.includes(item), `Missing remaining evidence item: ${item}`);
}

assert(parsed.claimPolicy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.claimPolicy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');

assert(
  docs.sourceNoArtifact.includes(
    'worker_runtime_jobs_sound_cpu_no_artifact_storage_delivery_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_worker_route_dispatch_gate_evidence_plan_after_runner_boundary_execution_proof'
  ) &&
    docs.sourceNoArtifact.includes('"workerExecutionApprovedToday": false') &&
    docs.sourceNoArtifact.includes('"routeExecutionApprovedToday": false'),
  'No-artifact source evidence incomplete'
);
assert(docs.sourceNoArtifactBlockers.includes('worker_route_dispatch_gate'), 'No-artifact blocker source missing dispatch item');
assert(
  docs.limitedInternalRunnerCompletion.includes('"acceptedSoundCpuToolCount": 15') &&
    docs.limitedInternalRunnerCompletion.includes('"productExecutionAuthorizedCount": 0') &&
    docs.limitedInternalRunnerCompletion.includes('"workerExecutionAuthorizedCount": 0'),
  'Limited internal runner completion source incomplete'
);
assert(
  docs.controlledLimitedInternalRunnerOwner.includes('"workerExecutionAuthorizedCount": 0') &&
    docs.controlledLimitedInternalRunnerOwner.includes('"productExecutionAuthorizedCount": 0'),
  'Controlled limited runner owner source incomplete'
);
assert(
  docs.limitedInternalRunnerPreflight.includes('"limitedInternalRunnerBoundaryExecution": "no"') &&
    docs.limitedInternalRunnerPreflight.includes('"routeExecution": "no"'),
  'Limited internal runner preflight source incomplete'
);
assert(docs.runnerBoundaryOwner.includes('"runnerBoundaryReauthorized": "no"'), 'Runner boundary owner source incomplete');
assert(
  docs.toolCallOwner.includes('"productToolCallExecution": "no"') &&
    docs.toolCallOwner.includes('"workerExecution": "no"') &&
    docs.toolCallOwner.includes('"routeExecution": "no"'),
  'Tool-call owner source incomplete'
);
assert(
  docs.executionGateSourceOwner.includes('"workerExecutionApprovedToday": false') &&
    docs.executionGateSourceOwner.includes('"supabaseSqlApprovedToday": false'),
  'Execution gate source owner incomplete'
);
assert(
  docs.runtimeExecutionApprovalOwner.includes('"allOwnerSignoffsGrantedToday": false') &&
    docs.runtimeExecutionApprovalOwner.includes('"workerDispatchApprovedToday": false'),
  'Runtime execution approval owner source incomplete'
);
assert(/Supabase\/SQL gate evidence/i.test(docs.nextPrompt), 'Next prompt missing Supabase/SQL scope');

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_worker_route_dispatch_gate_evidence_plan_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1301,
      sourceMergeCommit: '14ea875461bcb6e0d2d89ad43d33f9e682886afa',
      workerRouteDispatchGateEvidencePlanCreated: true,
      productToolCallDispatchApprovedToday: false,
      workerDispatchApprovedToday: false,
      routeExecutionApprovedToday: false,
      remainingEvidenceCount: 2,
      nextEvidenceItem: 'supabase_sql_gate',
      internalBetaUnlockApprovedToday: false,
      externalBetaUnlockApprovedToday: false,
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-SUPABASE-SQL-GATE-EVIDENCE-PLAN-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: plan Supabase/SQL gate evidence for internal beta, no mutation'
    },
    null,
    2
  )
);
