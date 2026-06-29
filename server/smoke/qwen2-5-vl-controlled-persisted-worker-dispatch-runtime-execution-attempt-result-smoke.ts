import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PREFLIGHT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_execution_attempt_recorded_result_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BY-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-EXECUTION-ATTEMPT-RESULT-REVIEW: review controlled persisted Qwen worker dispatch runtime execution attempt result, no generated assets/no beta'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired',
    'readyForRealWorkerDispatch',
    'privateInvokeReady',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-preflight.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-preflight.ts',
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-smoke.ts',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  'approved-plan-snapshot-policy.md',
  'editing-agent-execution-architecture.md',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.md')
for (const phrase of [
  DECISION,
  'Approved fixture default runtime path | blocked as expected | `blocked_real_lease_backend_required`',
  'Approved fixture adapter preview path | blocked as expected | `blocked_qwen_dispatch_adapter_fail_closed`',
  'Approved fixture transport preview path | blocked as expected | `blocked_private_invoke_transport_preview_only`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptRecorded=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptPassedFailClosed=true`',
  '`controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRequired=true`',
  '`transportPreviewReachedAllRuntimeBoundaries=true`',
  '`selectedGpuL4=true`',
  '`scaleToZeroRequired=true`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result.ts',
]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(
  result.upstreamControlledPersistedWorkerDispatchRuntimeExecutionPreflightDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_PREFLIGHT.decision,
)
assert.equal(result.executionAttemptSummary.controlledPersistedWorkerDispatchRuntimeExecutionPreflightPassed, true)
assert.equal(result.executionAttemptSummary.controlledPersistedWorkerDispatchRuntimeExecutionAttemptRequired, false)
assert.equal(result.executionAttemptSummary.controlledPersistedWorkerDispatchRuntimeExecutionAttemptRecorded, true)
assert.equal(result.executionAttemptSummary.controlledPersistedWorkerDispatchRuntimeExecutionAttemptPassedFailClosed, true)
assert.equal(result.executionAttemptSummary.controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRequired, true)
assert.equal(result.executionAttemptSummary.approvedFixtureOnly, true)
assert.equal(result.executionAttemptSummary.generatedLocalFixturePassedClaimed, false)
assert.deepEqual(result.executedAttemptChecks.map((checkResult) => checkResult.id), [
  'approvedFixtureDefaultAttempt',
  'approvedFixtureAdapterPreviewAttempt',
  'approvedFixtureTransportPreviewAttempt',
])
assert.deepEqual(result.runtimeStatusesObserved, [
  'blocked_real_lease_backend_required',
  'blocked_qwen_dispatch_adapter_fail_closed',
  'blocked_private_invoke_transport_preview_only',
])
assert.equal(result.executedAttemptChecks.every((checkResult) => checkResult.passed), true)
assert.equal(result.runtimeFlags.approvedFixtureDefaultAttemptBlocked, true)
assert.equal(result.runtimeFlags.approvedFixtureAdapterPreviewBlocked, true)
assert.equal(result.runtimeFlags.approvedFixtureTransportPreviewBlocked, true)
assert.equal(result.runtimeFlags.transportPreviewReachedAllRuntimeBoundaries, true)
assert.equal(result.runtimeFlags.selectedGpuL4, true)
assert.equal(result.runtimeFlags.scaleToZeroRequired, true)
assert.equal(result.sourceOfTruthExpectation.signedUrlsAreSourceOfTruth, false)
assert.equal(result.sourceOfTruthExpectation.publicUrlsAreSourceOfTruth, false)
assert.equal(result.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(result.selectedRuntime.costPosture, 'scale_to_zero_required')
assertFalseRuntimeFlags(result.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues(result)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled persisted runtime execution attempt result: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: result.decision,
  attemptChecks: result.executedAttemptChecks.length,
  statusesObserved: result.runtimeStatusesObserved,
  resultReviewRequired:
    result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewRequired,
  readyForRealWorkerDispatch: result.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: result.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: result.runtimeFlags.inferenceRun,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  generatedLocalFixturePassedClaimed: result.runtimeFlags.generatedLocalFixturePassedClaimed,
  nextPrompt: result.nextPrompt,
}, null, 2))
