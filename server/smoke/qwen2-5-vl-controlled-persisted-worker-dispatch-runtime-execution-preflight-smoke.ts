import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_APPROVAL } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-approval'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_preflight_verified_execution_attempt_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BX-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-EXECUTION-ATTEMPT: run controlled persisted Qwen worker dispatch runtime execution attempt, approved fixture only/no generated assets/no beta'

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
    'controlledPersistedWorkerDispatchRuntimeExecutionPreflightRequired',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-preflight.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-approval.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-approval.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight-smoke.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-approval-smoke.ts',
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
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-preflight.md')
for (const phrase of [
  DECISION,
  'execution approval accepted for preflight: true',
  'controlled runtime execution preflight recorded: true',
  'controlled runtime execution preflight passed: true',
  'controlled runtime execution attempt required: true',
  'real worker dispatch approved now: false',
  'Cloud Run invocation approved now: false',
  'Qwen inference approved now: false',
  'approved snapshot intake',
  'credit reservation check',
  'private source-of-truth refs',
  'idempotency guard',
  'backend-only lease claim',
  'Qwen envelope build',
  'private invoke transport',
  'result, QA, audit, cost, credit',
  'selected GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'Workers execute approved snapshots, not raw chat.',
  'Signed URLs and public URLs are not source of truth.',
  '`controlledPersistedWorkerDispatchRuntimeExecutionPreflightRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionPreflightRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionPreflightPassed=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired=true`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight.ts',
]) {
  assertNoForbiddenText(file)
}

const preflight = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PREFLIGHT
assert.equal(preflight.decision, DECISION)
assert.equal(preflight.nextPrompt, NEXT_PROMPT)
assert.equal(
  preflight.upstreamControlledPersistedWorkerDispatchRuntimeExecutionApprovalDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_APPROVAL.decision,
)
assert.equal(preflight.preflightDecision.decisionRecorded, true)
assert.equal(preflight.preflightDecision.acceptsExecutionApprovalForFutureControlledRuntimeAttempt, true)
assert.equal(preflight.preflightDecision.executionPreflightRecorded, true)
assert.equal(preflight.preflightDecision.executionPreflightPassed, true)
assert.equal(preflight.preflightDecision.controlledRuntimeExecutionAttemptRequired, true)
assert.equal(preflight.preflightDecision.approvesExecutionNow, false)
assert.equal(preflight.preflightDecision.approvesWorkerDispatchNow, false)
assert.equal(preflight.preflightDecision.approvesCloudRunInvocationNow, false)
assert.equal(preflight.preflightDecision.approvesQwenInferenceNow, false)
assert.equal(preflight.preflightDecision.approvesGeneratedAssetsNow, false)
assert.equal(preflight.verifiedPreflightAreas.length, 8)
for (const id of [
  'approved_snapshot_intake',
  'credit_reservation_check',
  'private_source_of_truth_refs',
  'idempotency_guard',
  'backend_only_lease_claim',
  'qwen_envelope_build',
  'private_invoke_transport',
  'result_qa_audit_cost_credit',
]) {
  const entry = preflight.verifiedPreflightAreas.find((item) => item.id === id)
  check(entry, `Missing preflight area ${id}`)
  assert.equal(entry.prerequisiteCategoryVerified, true)
  assert.equal(entry.executionAllowedNow, false)
  check(entry.requiredInputs.length >= 5, `${id} must preserve detailed inputs`)
}
assert.equal(preflight.approvedRuntimePosture.selectedGpu, 'nvidia_l4')
assert.equal(preflight.approvedRuntimePosture.costPosture, 'scale_to_zero_required')
assert.equal(preflight.approvedRuntimePosture.minInstances, 0)
assert.equal(preflight.approvedRuntimePosture.initialMaxInstances, 1)
assert.equal(preflight.approvedRuntimePosture.cpuFallbackAllowed, false)
assert.equal(preflight.controlledRuntimeExecutionAttemptRequirements.length, 8)
assert.equal(preflight.sourceOfTruthRules.workersExecuteApprovedSnapshots, true)
assert.equal(preflight.sourceOfTruthRules.rawChatWorkerExecutionAllowed, false)
assert.equal(preflight.sourceOfTruthRules.signedUrlSourceOfTruthAllowed, false)
assert.equal(preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionApprovalAccepted, true)
assert.equal(preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionPreflightRecorded, true)
assert.equal(preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionPreflightPassed, true)
assert.equal(preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired, true)
assertFalseRuntimeFlags(preflight.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues({ preflight })
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled persisted runtime execution preflight data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: preflight.decision,
  verifiedPreflightAreas: preflight.verifiedPreflightAreas.length,
  executionPreflightRecorded:
    preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionPreflightRecorded,
  executionPreflightPassed:
    preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionPreflightPassed,
  executionAttemptRequired:
    preflight.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired,
  readyForRealWorkerDispatch: preflight.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: preflight.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: preflight.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: preflight.runtimeFlags.inferenceRun,
  generatedAssetsCreated: preflight.runtimeFlags.generatedAssetsCreated,
  nextPrompt: preflight.nextPrompt,
}, null, 2))
