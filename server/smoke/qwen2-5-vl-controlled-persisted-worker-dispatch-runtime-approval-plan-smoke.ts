import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_approval_plan_recorded_approval_decision_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BT-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-APPROVAL-DECISION: decide controlled persisted Qwen worker dispatch runtime approval, no Cloud Run invocation/no inference/no assets/no beta'

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
    'unsafe runtime true claim',
    /\b(readyForRealWorkerDispatch|runtimeApprovalDecisionRecorded|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeApprovalPlanRequired',
    'readyForRealWorkerDispatch',
    'runtimeApprovalDecisionRecorded',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review-smoke.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-plan.md')
for (const phrase of [
  DECISION,
  'runtime smoke result review accepted: true',
  'runtime approval plan recorded: true',
  'runtime approval decision required: true',
  'approved plan snapshot source of truth',
  'credit reservation source of truth',
  'private source-of-truth refs',
  'service-role lease and claim mutation',
  'idempotency and duplicate guard',
  'private invoke transport dependencies',
  'QA, audit, cost, and credit evidence',
  'rollback and fail-closed behavior',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeApprovalPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeApprovalPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeApprovalDecisionRequired=true`',
  '`readyForRealWorkerDispatch=false`',
  '`runtimeApprovalDecisionRecorded=false`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-approval-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-approval-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchRuntimeSmokeResultReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_RESULT_REVIEW.decision,
)
assert.equal(plan.approvalScope.approvalPlanRecorded, true)
assert.equal(plan.approvalScope.approvalDecisionRequired, true)
assert.equal(plan.approvalScope.approvesExecutionNow, false)
assert.equal(plan.approvalScope.approvesCloudRunInvocationNow, false)
assert.equal(plan.approvalScope.approvesQwenInferenceNow, false)
assert.equal(plan.approvalScope.approvesGeneratedAssetsNow, false)
assert.equal(plan.requiredRuntimeApprovalEvidence.length, 8)
for (const id of [
  'approved_plan_snapshot_source_of_truth',
  'credit_reservation_source_of_truth',
  'private_source_of_truth_refs',
  'service_role_lease_claim_mutation',
  'idempotency_and_duplicate_guard',
  'private_invoke_transport_dependencies',
  'qa_audit_cost_credit_evidence',
  'rollback_and_fail_closed_behavior',
]) {
  const entry = plan.requiredRuntimeApprovalEvidence.find((item) => item.id === id)
  check(entry, `Missing approval evidence entry ${id}`)
  assert.equal(entry.executionAllowedByThisPlan, false)
  check(entry.requiredEvidence.length >= 3, `${id} must include detailed evidence requirements`)
}
assert.equal(plan.approvedRuntimePosture.selectedGpu, 'nvidia_l4')
assert.equal(plan.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(plan.approvedRuntimePosture.minInstances, 0)
assert.equal(plan.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(plan.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeResultReviewAccepted, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovalPlanRecorded, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovalDecisionRequired, true)
assert.equal(plan.runtimeFlags.approvedSnapshotApprovalPlanned, true)
assert.equal(plan.runtimeFlags.creditReservationApprovalPlanned, true)
assert.equal(plan.runtimeFlags.privateSourceOfTruthRefsApprovalPlanned, true)
assert.equal(plan.runtimeFlags.serviceRoleLeaseClaimApprovalPlanned, true)
assert.equal(plan.runtimeFlags.idempotencyApprovalPlanned, true)
assert.equal(plan.runtimeFlags.privateInvokeTransportApprovalPlanned, true)
assert.equal(plan.runtimeFlags.qaAuditCostCreditApprovalPlanned, true)
assert.equal(plan.runtimeFlags.rollbackFailClosedApprovalPlanned, true)
assertFalseRuntimeFlags(plan.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled persisted runtime approval plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  approvalEvidenceAreas: plan.requiredRuntimeApprovalEvidence.length,
  approvalPlanRecorded: plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovalPlanRecorded,
  approvalDecisionRequired: plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeApprovalDecisionRequired,
  readyForRealWorkerDispatch: plan.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: plan.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
