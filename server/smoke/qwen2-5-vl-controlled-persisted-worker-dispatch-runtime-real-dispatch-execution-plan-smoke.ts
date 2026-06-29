import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_DECISION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_execution_plan_recorded_execution_approval_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CC-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-EXECUTION-APPROVAL: approve first real persisted Qwen worker dispatch execution plan, no Cloud Run invocation/no inference/no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRequired',
    'readyForRealWorkerDispatch',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-decision-smoke.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.md')
for (const phrase of [
  DECISION,
  'real-dispatch approval decision accepted for execution planning: true',
  'controlled real-dispatch execution plan recorded: true',
  'controlled real-dispatch execution approval required: true',
  'real worker dispatch approved now: false',
  'worker lease claim approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'approved snapshot fixture intake',
  'credit reservation no-spend check',
  'private source-of-truth refs',
  'idempotency duplicate-source guard',
  'backend-only service-role lease claim',
  'Qwen request envelope build',
  'private invoke credential resolution',
  'Cloud Run L4 invocation attempt',
  'result validation and persistence',
  'QA audit cost cleanup credit handoff',
  '`qwen_fixture_visual_metadata_v1`',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'minimum instances: 0',
  'initial max instances: 1',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionAccepted=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRequired=true`',
  '`readyForRealWorkerDispatch=false`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-plan.ts',
]) {
  assertNoForbiddenText(file)
}

const plan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_PLAN
assert.equal(plan.decision, DECISION)
assert.equal(plan.nextPrompt, NEXT_PROMPT)
assert.equal(
  plan.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_DECISION.decision,
)
assert.equal(plan.executionScope.approvalDecisionAcceptedForExecutionPlanning, true)
assert.equal(plan.executionScope.executionPlanRecorded, true)
assert.equal(plan.executionScope.executionApprovalRequired, true)
assert.equal(plan.executionScope.approvesExecutionNow, false)
assert.equal(plan.executionScope.approvesWorkerDispatchNow, false)
assert.equal(plan.executionScope.approvesWorkerLeaseClaimNow, false)
assert.equal(plan.executionScope.approvesCloudRunInvocationNow, false)
assert.equal(plan.executionScope.approvesQwenInferenceNow, false)
assert.equal(plan.executionScope.approvesGeneratedAssetsNow, false)
assert.equal(plan.firstRealDispatchExecutionEnvelope.length, 10)
for (const id of [
  'approved_snapshot_fixture_intake',
  'credit_reservation_no_spend_check',
  'private_source_of_truth_refs',
  'idempotency_duplicate_source_guard',
  'backend_only_service_role_lease_claim',
  'qwen_request_envelope_build',
  'private_invoke_credential_resolution',
  'cloud_run_l4_invocation_attempt',
  'result_validation_and_persistence',
  'qa_audit_cost_cleanup_credit_handoff',
]) {
  const entry = plan.firstRealDispatchExecutionEnvelope.find((item) => item.id === id)
  check(entry, `Missing first real-dispatch envelope entry ${id}`)
  assert.equal(entry.currentExecutionAllowed, false)
  check(entry.requiredInputs.length >= 6, `${id} must include detailed required inputs`)
}
assert.equal(plan.selectedRuntime.selectedGpu, 'nvidia_l4')
assert.equal(plan.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(plan.selectedRuntime.minInstances, 0)
assert.equal(plan.selectedRuntime.initialMaxInstances, 1)
assert.equal(plan.selectedRuntime.cpuFallbackAllowed, false)
assert.equal(plan.executionApprovalPreconditions.length, 8)
assert.equal(plan.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(plan.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(plan.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(plan.sourceOfTruthRules.qwenMayGenerateBrollVideo, false)
assert.equal(plan.sourceOfTruthRules.frontendMayCallCloudRun, false)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionAccepted, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRecorded, true)
assert.equal(plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRequired, true)
assertFalseRuntimeFlags(plan.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues({ plan })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled real-dispatch execution plan data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: plan.decision,
  executionEnvelopeSteps: plan.firstRealDispatchExecutionEnvelope.length,
  executionPlanRecorded: plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRecorded,
  executionApprovalRequired: plan.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionApprovalRequired,
  readyForRealWorkerDispatch: plan.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: plan.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: plan.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: plan.runtimeFlags.inferenceRun,
  generatedAssetsCreated: plan.runtimeFlags.generatedAssetsCreated,
  nextPrompt: plan.nextPrompt,
}, null, 2))
