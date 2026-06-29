import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_plan_recorded_approval_decision_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CA-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVAL-DECISION: decide real persisted Qwen worker dispatch runtime approval, no generated assets/no beta'

type JsonRecord = Record<string, unknown>

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  [
    'signed URL token',
    /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i,
  ],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['identity token assignment', /\b(identityToken|idToken|accessToken)\s*[:=]\s*['"][^'"]+['"]/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  [
    'unsafe real runtime true claim',
    /\b(readyForRealWorkerDispatch|realDispatchApprovalDecisionRecorded|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
  ],
  [
    'unsafe pass claim',
    /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i,
  ],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase cloud hostname', /\bsupabase\.co\b/i],
  [
    'signed URL token',
    /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i,
  ],
  ['bearer token value', /\bBearer\s+[A-Za-z0-9._~+/-]+/i],
  ['credential-looking value', /\b(sk-[A-Za-z0-9]{12,}|hf_[A-Za-z0-9]{12,}|ya29\.[A-Za-z0-9._-]+)/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
]

function assertNoForbiddenText(relativePath: string) {
  const text = read(relativePath)
  const findings = forbiddenTextPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name)
  assert.deepEqual(findings, [], `Forbidden value in ${relativePath}: ${findings.join('; ')}`)
}

function scanValues(value: unknown, pathParts: string[] = []): string[] {
  if (typeof value === 'string') {
    return forbiddenValuePatterns
      .filter(([, pattern]) => pattern.test(value))
      .map(([name]) => `${pathParts.join('.')}: ${name}`)
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => scanValues(item, [...pathParts, String(index)]))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as JsonRecord).flatMap(([key, nested]) =>
      scanValues(nested, [...pathParts, key]),
    )
  }
  return []
}

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRequired',
    'readyForRealWorkerDispatch',
    'realDispatchApprovalDecisionRecorded',
    'realJobCreated',
    'realLeaseClaimed',
    'idempotencyRowCreated',
    'jobEventCreated',
    'backendRuntimeMessageCreated',
    'workerClaimCreated',
    'storageObjectRecordCreated',
    'signedUrlEventCreated',
    'qaReportCreated',
    'auditEventCreated',
    'creditMutationCreated',
    'cloudRunInvocationAttempted',
    'serviceRuntimeRequestSent',
    'serviceUrlResolvedNow',
    'audienceResolvedNow',
    'identityTokenFetched',
    'authHeaderCreated',
    'modelImportRun',
    'modelLoadRun',
    'vllmEngineInitialized',
    'promptProcessed',
    'forwardPassRun',
    'inferenceRun',
    'providerCallsMade',
    'workersDispatched',
    'supabaseTouched',
    'sqlExecuted',
    'generatedAssetsCreated',
    'publicArtifactsCreated',
    'signedUrlsCreated',
    'mediaProcessingRun',
    'renderExportRun',
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review-smoke.ts',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'async-edit-work-graph.md',
  'editing-asset-manifest.md',
  'model-routing-policy.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.md')
for (const phrase of [
  DECISION,
  'fail-closed execution attempt result review accepted: true',
  'approved fixture attempt only: true',
  'real-dispatch approval plan recorded: true',
  'real-dispatch approval decision required: true',
  'real worker dispatch approved now: false',
  'worker lease claim approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'generated asset creation approved now: false',
  'approved snapshot fixture scope',
  'credit reservation no-spend precondition',
  'service-role job lease claim scope',
  'idempotency duplicate source guard',
  'private invoke transport execution conditions',
  'Qwen request and response schema',
  'result persistence without generated assets',
  'QA, audit, cost, and observability',
  'rollback, cleanup, and credit release',
  'beta, production, and public artifact lock',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired=true`',
  '`approvedSnapshotFixtureScopePlanned=true`',
  '`creditReservationNoSpendPreconditionPlanned=true`',
  '`serviceRoleJobLeaseClaimScopePlanned=true`',
  '`idempotencyDuplicateSourceGuardPlanned=true`',
  '`privateInvokeTransportExecutionConditionsPlanned=true`',
  '`qwenRequestResponseSchemaPlanned=true`',
  '`resultPersistenceWithoutGeneratedAssetsPlanned=true`',
  '`qaAuditCostObservabilityPlanned=true`',
  '`rollbackCleanupCreditReleasePlanned=true`',
  '`betaProductionPublicArtifactLockPlanned=true`',
  '`readyForRealWorkerDispatch=false`',
  '`realDispatchApprovalDecisionRecorded=false`',
  '`workersDispatched=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`dryRunPassedClaimed=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT_REVIEW.decision,
)
assert.equal(plan.approvalScope.realDispatchApprovalPlanRecorded, true)
assert.equal(plan.approvalScope.realDispatchApprovalDecisionRequired, true)
assert.equal(plan.approvalScope.approvesRealDispatchNow, false)
assert.equal(plan.approvalScope.approvesWorkerLeaseClaimNow, false)
assert.equal(plan.approvalScope.approvesCloudRunInvocationNow, false)
assert.equal(plan.approvalScope.approvesQwenInferenceNow, false)
assert.equal(plan.approvalScope.approvesGeneratedAssetsNow, false)
assert.equal(plan.acceptedPreconditions.failClosedExecutionAttemptReviewed, true)
assert.equal(plan.acceptedPreconditions.approvedFixtureAttemptOnly, true)
assert.equal(plan.acceptedPreconditions.defaultLeaseBoundaryAccepted, true)
assert.equal(plan.acceptedPreconditions.adapterPreviewBoundaryAccepted, true)
assert.equal(plan.acceptedPreconditions.transportPreviewBoundaryAccepted, true)
assert.equal(plan.acceptedPreconditions.selectedGpuL4Accepted, true)
assert.equal(plan.acceptedPreconditions.scaleToZeroCostPostureAccepted, true)
assert.equal(plan.requiredRealDispatchApprovalEvidence.length, 10)
for (const id of [
  'approved_snapshot_fixture_scope',
  'credit_reservation_no_spend_precondition',
  'service_role_job_lease_claim_scope',
  'idempotency_duplicate_source_guard',
  'private_invoke_transport_execution_conditions',
  'qwen_request_response_schema',
  'result_persistence_without_generated_assets',
  'qa_audit_cost_observability',
  'rollback_cleanup_credit_release',
  'beta_production_public_artifact_lock',
]) {
  const entry = plan.requiredRealDispatchApprovalEvidence.find((item) => item.id === id)
  check(entry, `Missing approval evidence entry ${id}`)
  assert.equal(entry.executionAllowedByThisPlan, false)
  check(entry.requiredEvidence.length >= 3, `${id} must include detailed evidence requirements`)
}
assert.equal(plan.approvedRuntimePosture.selectedGpu, 'nvidia_l4')
assert.equal(plan.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(plan.approvedRuntimePosture.minInstances, 0)
assert.equal(plan.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(plan.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(
  plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewAccepted,
  true,
)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRecorded, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired, true)
assert.equal(plan.runtimeFlags.approvedSnapshotFixtureScopePlanned, true)
assert.equal(plan.runtimeFlags.creditReservationNoSpendPreconditionPlanned, true)
assert.equal(plan.runtimeFlags.serviceRoleJobLeaseClaimScopePlanned, true)
assert.equal(plan.runtimeFlags.idempotencyDuplicateSourceGuardPlanned, true)
assert.equal(plan.runtimeFlags.privateInvokeTransportExecutionConditionsPlanned, true)
assert.equal(plan.runtimeFlags.qwenRequestResponseSchemaPlanned, true)
assert.equal(plan.runtimeFlags.resultPersistenceWithoutGeneratedAssetsPlanned, true)
assert.equal(plan.runtimeFlags.qaAuditCostObservabilityPlanned, true)
assert.equal(plan.runtimeFlags.rollbackCleanupCreditReleasePlanned, true)
assert.equal(plan.runtimeFlags.betaProductionPublicArtifactLockPlanned, true)
assertFalseRuntimeFlags(plan.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled persisted real-dispatch approval plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  realDispatchApprovalEvidenceAreas: plan.requiredRealDispatchApprovalEvidence.length,
  realDispatchApprovalPlanRecorded:
    plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRecorded,
  realDispatchApprovalDecisionRequired:
    plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired,
  readyForRealWorkerDispatch: plan.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: plan.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
