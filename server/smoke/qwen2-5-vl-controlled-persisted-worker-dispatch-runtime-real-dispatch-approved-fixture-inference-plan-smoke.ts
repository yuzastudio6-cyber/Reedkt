import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_RESULT_REVIEW } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result-review'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approved_fixture_inference_plan_recorded_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CY-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-INFERENCE-APPROVAL: approve one controlled Qwen approved-fixture inference through persisted worker dispatch, no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|approvedFixtureInferenceAcceptedForPersistedDispatch|approvedFixtureInferenceApprovedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|privateRequestSendAllowedNow|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'readyForRealWorkerDispatch',
    'approvedFixtureInferenceAcceptedForPersistedDispatch',
    'approvedFixtureInferenceApprovedNow',
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
    'privateRequestSendAllowedNow',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result-review.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result-review.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result-review-smoke.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'model-routing-policy.md',
  'intent-led-edit-planning.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.md',
)
for (const phrase of [
  DECISION,
  'transport attempt result review accepted: true',
  'approved-fixture inference plan recorded: true',
  'approved-fixture inference approval required: true',
  'inference approval now: false',
  'model import now: false',
  'model load now: false',
  'vLLM initialization now: false',
  'Cloud Run invocation now: false',
  'worker dispatch now: false',
  'generated asset creation now: false',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'CPU fallback allowed: false',
  'Approved Snapshot And Fixture Scope',
  'Persisted Worker Dispatch Refs',
  'Private Source-Of-Truth Refs',
  'Qwen Request Envelope',
  'Private Invoke Transport Dependencies',
  'Qwen Runtime Inference Boundary',
  'Response Schema And Result Handling',
  'QA, Audit, Cost, And Credit No-Spend',
  'Cleanup, Retry, And Beta Lock',
  'max approved fixture requests: 1',
  'arbitrary user media allowed: false',
  'raw chat worker execution allowed: false',
  'Qwen may generate B-roll video: false',
  'Qwen may create generated assets: false',
  'Workers execute approved snapshots, not raw chat.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRequired=true`',
  '`approvedSnapshotAndFixtureScopePlanned=true`',
  '`persistedWorkerDispatchRefsPlanned=true`',
  '`privateSourceOfTruthRefsPlanned=true`',
  '`qwenRequestEnvelopePlanned=true`',
  '`qwenRuntimeInferenceBoundaryPlanned=true`',
  '`approvedFixtureInferenceApprovedNow=false`',
  '`modelImportRun=false`',
  '`modelLoadRun=false`',
  '`vllmEngineInitialized=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`supabaseTouched=false`',
  '`sqlExecuted=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  'What Went Wrong Previously',
  NEXT_PROMPT,
]) {
  assert.ok(doc.toLowerCase().includes(phrase.toLowerCase()), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approved-fixture-inference-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVED_FIXTURE_INFERENCE_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptResultReviewDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_RESULT_REVIEW.decision,
)
assert.equal(plan.planScope.transportAttemptResultReviewAccepted, true)
assert.equal(plan.planScope.approvedFixtureInferencePlanRecorded, true)
assert.equal(plan.planScope.approvedFixtureInferenceApprovalRequired, true)
assert.equal(plan.planScope.mayApproveInferenceNow, false)
assert.equal(plan.planScope.mayRunInferenceNow, false)
assert.equal(plan.planScope.mayImportModelNow, false)
assert.equal(plan.planScope.mayLoadModelNow, false)
assert.equal(plan.planScope.mayInitializeVllmNow, false)
assert.equal(plan.planScope.mayInvokeCloudRunNow, false)
assert.equal(plan.planScope.mayDispatchWorkerNow, false)
assert.equal(plan.planScope.mayCreateGeneratedAssetsNow, false)
assert.equal(plan.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(plan.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(plan.selectedRuntime.minInstances, 0)
assert.equal(plan.selectedRuntime.initialMaxInstances, 1)
assert.equal(plan.selectedRuntime.cpuFallbackAllowed, false)
assert.deepEqual(
  plan.approvedFixtureInferencePlan.map((entry) => entry.id),
  [
    'approved_snapshot_and_fixture_scope',
    'persisted_worker_dispatch_refs',
    'private_source_of_truth_refs',
    'qwen_request_envelope',
    'private_invoke_transport_dependencies',
    'qwen_runtime_inference_boundary',
    'response_schema_and_result_handling',
    'qa_audit_cost_and_credit_no_spend',
    'cleanup_retry_and_beta_lock',
  ],
)
assert.equal(plan.approvedFixtureInferencePlan.every((entry) => entry.plannedForFutureApproval), true)
assert.equal(plan.approvedFixtureInferencePlan.every((entry) => !entry.currentExecutionAllowed), true)
assert.equal(plan.futureInferenceAttemptBoundaries.maxApprovedFixtureRequests, 1)
assert.equal(plan.futureInferenceAttemptBoundaries.rawChatWorkerExecutionAllowed, false)
assert.equal(plan.futureInferenceAttemptBoundaries.rawWorkerPromptAllowed, false)
assert.equal(plan.futureInferenceAttemptBoundaries.qwenMayGenerateBrollVideo, false)
assert.equal(plan.futureInferenceAttemptBoundaries.qwenMayCreateGeneratedAssets, false)
assert.equal(plan.futureInferenceAttemptBoundaries.approvalRequiredBeforePreflight, true)
assert.equal(plan.futureInferenceAttemptBoundaries.preflightRequiredBeforeAttempt, true)
assert.equal(plan.futureInferenceAttemptBoundaries.resultReviewRequiredAfterAttempt, true)
assert.equal(plan.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(plan.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(plan.sourceOfTruthRules.publicUrlSourceOfTruthAllowed, false)
assert.equal(plan.sourceOfTruthRules.frontendMayCallCloudRun, false)
assert.equal(
  plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRequired,
  false,
)
assert.equal(
  plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRecorded,
  true,
)
assert.equal(
  plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferenceApprovalRequired,
  true,
)
assert.equal(plan.runtimeFlags.selectedGpuL4Accepted, true)
assert.equal(plan.runtimeFlags.scaleToZeroCostPostureAccepted, true)
assert.equal(plan.runtimeFlags.minInstancesZeroAccepted, true)
assert.equal(plan.runtimeFlags.initialMaxInstancesOneAccepted, true)
assertFalseRuntimeFlags(plan.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues(plan)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in approved-fixture inference plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  selectedGpu: plan.selectedRuntime.gpu,
  costPosture: plan.selectedRuntime.costPosture,
  planRows: plan.approvedFixtureInferencePlan.length,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
