import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const decision =
  'worker_runtime_jobs_sound_cpu_supabase_sql_gate_evidence_plan_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_security_cost_support_gate_evidence_plan_after_runner_boundary_execution_proof';

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-gate-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceRegister:
    'docs/worker-runtime-jobs-sound-cpu-supabase-sql-gate-source-register-after-runner-boundary-execution-proof.md',
  boundaryPolicy:
    'docs/worker-runtime-jobs-sound-cpu-supabase-sql-gate-policy-after-runner-boundary-execution-proof.md',
  blockerRegister:
    'docs/worker-runtime-jobs-sound-cpu-supabase-sql-gate-blocker-register-after-runner-boundary-execution-proof.md',
  claimPolicy:
    'docs/worker-runtime-jobs-sound-cpu-supabase-sql-gate-claim-policy-after-runner-boundary-execution-proof.md',
  nextPrompt:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-security-cost-support-gate-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceDispatch:
    'docs/worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-evidence-plan-after-runner-boundary-execution-proof.md',
  sourceDispatchBlockers:
    'docs/worker-runtime-jobs-sound-cpu-worker-route-dispatch-gate-blocker-register-after-runner-boundary-execution-proof.md',
  supabaseStorageGap: 'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-closure.md',
  supabaseStorageReadiness:
    'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-readiness-boundary.md',
  supabaseStorageClaim:
    'docs/worker-runtime-jobs-sound-cpu-supabase-sql-storage-gap-claim-policy.md',
  mediaOwnerGate: 'docs/worker-runtime-jobs-sound-cpu-media-supabase-owner-gate-register.md',
  mediaSourceReview: 'docs/worker-runtime-jobs-sound-cpu-supabase-media-source-review-register.md'
};

const labels = {
  plan: 'worker-runtime-jobs-sound-cpu-supabase-sql-gate-evidence-plan-after-runner-boundary-execution-proof',
  sourceRegister:
    'worker-runtime-jobs-sound-cpu-supabase-sql-gate-source-register-after-runner-boundary-execution-proof',
  boundaryPolicy:
    'worker-runtime-jobs-sound-cpu-supabase-sql-gate-policy-after-runner-boundary-execution-proof',
  blockerRegister:
    'worker-runtime-jobs-sound-cpu-supabase-sql-gate-blocker-register-after-runner-boundary-execution-proof',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-supabase-sql-gate-claim-policy-after-runner-boundary-execution-proof'
};

const falseFlags = [
  'supabaseMutationApprovedToday',
  'serviceRoleMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'migrationDeploymentApprovedToday',
  'storageWriteApprovedToday',
  'signedUrlCreationApprovedToday',
  'environmentMutationApprovedToday',
  'supabaseCliRunApprovedToday',
  'artifactDeliveryApprovedToday',
  'productToolCallExecutionApprovedToday',
  'workerDispatchApprovedToday',
  'routeExecutionApprovedToday',
  'internalBetaUnlockApprovedToday',
  'externalBetaUnlockApprovedToday',
  'productionUnlockApprovedToday'
];

const forbiddenText = [
  ...falseFlags.map((flag) => `"${flag}": true`),
  '"supabaseMutationAllowed": true',
  '"serviceRoleMutationAllowed": true',
  '"sqlExecutionAllowed": true',
  '"storageWriteAllowed": true',
  '"signedUrlCreationAllowed": true',
  '"sqlExecuted": "yes"',
  '"environmentTouched": "yes"',
  '"migrationDeployed": "yes"',
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
assert(parsed.plan.sourcePr === 1307, 'Source PR mismatch');
assert(
  parsed.plan.sourceMergeCommit === '9f764c6c853eb9f70ba3fe514593e399bbe32d99',
  'Source merge commit mismatch'
);
assert(parsed.plan.supabaseSqlGateEvidenceResult.supabaseSqlGateEvidencePlanCreated === true, 'Plan not created');
assert(parsed.plan.closedEvidenceItem === 'supabase_sql_gate', 'Closed evidence item mismatch');
assert(parsed.plan.remainingEvidenceCount === 1, 'Remaining evidence count mismatch');
assert(parsed.plan.nextEvidenceItem === 'security_cost_support_gate', 'Next evidence item mismatch');

for (const flag of falseFlags) {
  assert(parsed.plan.supabaseSqlGateEvidenceResult[flag] === false, `Plan flag must be false: ${flag}`);
  assert(parsed.boundaryPolicy.blockedToday[flag] === false, `Boundary flag must be false: ${flag}`);
  assert(parsed.claimPolicy.claimPolicy[flag] === false, `Claim-policy flag must be false: ${flag}`);
}

assert(parsed.sourceRegister.sourceEvidenceCount === 7, 'Source evidence count mismatch');
assert(parsed.sourceRegister.sourceEvidenceAcceptedForExecutionToday === false, 'Source evidence must not allow execution');

for (const operation of [
  'Supabase CLI run',
  'SQL execution',
  'migration deployment',
  'service-role mutation',
  'storage object write',
  'signed URL creation',
  'environment mutation',
  'remote project mutation',
  'RLS policy mutation'
]) {
  assert(parsed.boundaryPolicy.blockedSupabaseOperationsToday.includes(operation), `Missing blocked operation: ${operation}`);
}

assert(
  parsed.blockerRegister.closedEvidenceItems.some((item) => item.id === 'supabase_sql_gate') &&
    parsed.blockerRegister.closedEvidenceItems.length === 5,
  'Closed evidence items incomplete'
);
assert(parsed.blockerRegister.remainingEvidenceCount === 1, 'Blocker remaining evidence count mismatch');
assert(
  parsed.blockerRegister.remainingEvidenceItems.includes('security_cost_support_gate'),
  'Missing remaining security/cost/support item'
);
assert(parsed.claimPolicy.supabaseClassification.updateRequired === 'no', 'Supabase update classification changed');
assert(parsed.claimPolicy.supabaseClassification.environmentTouched === 'no', 'Supabase environment classification changed');
assert(parsed.claimPolicy.supabaseClassification.sqlExecuted === 'no', 'Supabase SQL classification changed');
assert(parsed.claimPolicy.supabaseClassification.migrationDeployed === 'no', 'Supabase migration classification changed');

assert(
  docs.sourceDispatch.includes('"sourcePr": 1301') &&
    docs.sourceDispatch.includes('"supabaseSqlApprovedToday": false'),
  'Dispatch source evidence incomplete'
);
assert(docs.sourceDispatchBlockers.includes('supabase_sql_gate'), 'Dispatch blocker source missing Supabase item');
assert(
  docs.supabaseStorageGap.includes('"supabaseSqlStoragePlanningGapClosed": true') &&
    docs.supabaseStorageGap.includes('"supabaseMutationApprovedToday": false') &&
    docs.supabaseStorageGap.includes('"sqlExecutionApprovedToday": false') &&
    docs.supabaseStorageGap.includes('"storageWriteApprovedToday": false'),
  'Supabase storage gap source incomplete'
);
assert(
  docs.supabaseStorageReadiness.includes('"supabaseMutationAllowed": false') &&
    docs.supabaseStorageReadiness.includes('"sqlExecutionAllowed": false') &&
    docs.supabaseStorageReadiness.includes('"signedUrlCreationAllowed": false'),
  'Supabase readiness boundary source incomplete'
);
assert(
  docs.supabaseStorageClaim.includes('"sqlExecuted": "no"') &&
    docs.supabaseStorageClaim.includes('"migrationDeployed": "no"'),
  'Supabase claim source incomplete'
);
assert(docs.mediaOwnerGate.includes('"storageWriteApprovedToday": false'), 'Media owner gate missing storage false');
assert(
  docs.mediaSourceReview.includes('"supabaseSourceCreationApprovedToday": false'),
  'Media source review missing Supabase source false'
);
assert(/security\/cost\/support gate evidence/i.test(docs.nextPrompt), 'Next prompt missing security/cost/support scope');

console.log(
  JSON.stringify(
    {
      status:
        'worker_runtime_jobs_sound_cpu_supabase_sql_gate_evidence_plan_after_runner_boundary_execution_proof_diagnostics_passed',
      decision,
      sourcePr: 1307,
      sourceMergeCommit: '9f764c6c853eb9f70ba3fe514593e399bbe32d99',
      supabaseSqlGateEvidencePlanCreated: true,
      supabaseMutationApprovedToday: false,
      sqlExecutionApprovedToday: false,
      migrationDeploymentApprovedToday: false,
      remainingEvidenceCount: 1,
      nextEvidenceItem: 'security_cost_support_gate',
      internalBetaUnlockApprovedToday: false,
      externalBetaUnlockApprovedToday: false,
      supabaseClassification: {
        updateRequired: 'no',
        environmentTouched: 'no',
        sqlExecuted: 'no',
        migrationDeployed: 'no',
        nextAction: 'none'
      },
      nextPrompt:
        'WORKER_RUNTIME_JOBS-SOUND-CPU-SECURITY-COST-SUPPORT-GATE-EVIDENCE-PLAN-AFTER-RUNNER-BOUNDARY-EXECUTION-PROOF: plan security/cost/support gate evidence for internal beta, no unlock'
    },
    null,
    2
  )
);
