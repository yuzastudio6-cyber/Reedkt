import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_EXECUTION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_smoke_executed_mock_only_result_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BM-CONTROLLED-PERSISTED-WORKER-DISPATCH-SMOKE-RESULT-REVIEW: review controlled persisted Qwen worker dispatch smoke result, no Cloud Run invocation/no inference/no assets/no beta'
const RESULT_DOC =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-execution-result.md'
const RESULT_SPEC =
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result.ts'
const RESULT_SMOKE =
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result-smoke.ts'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|inferenceRun|workersDispatched|supabaseCloudTouched|sqlExecuted|generatedAssetsCreated|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    'supabaseCloudTouched',
    'stagingTouched',
    'productionTouched',
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
  RESULT_DOC,
  RESULT_SPEC,
  RESULT_SMOKE,
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-smoke-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-plan.ts',
  'src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  'src/backend/runtime/idempotency-service.ts',
  'src/backend/runtime/worker-lease-service.ts',
  'src/backend/runtime/backend-runtime-transport-service.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-smoke-execution-result-smoke.ts',
  'package script mismatch',
)

const doc = read(RESULT_DOC)
for (const phrase of [
  DECISION,
  'local TypeScript/mock memory',
  'mock-only in-memory shapes for a job, idempotency record, worker lease, worker claim attempt, job event, and backend runtime message',
  '| Queue fixture validation | passed |',
  '| Coordinator default path | blocked as expected | `blocked_real_lease_backend_required`',
  '| Coordinator adapter preview path | blocked as expected | `blocked_qwen_dispatch_adapter_fail_closed`',
  '| Coordinator transport preview path | blocked as expected | `blocked_private_invoke_transport_preview_only`',
  '`controlledPersistedWorkerDispatchSmokeExecuted=true`',
  '`controlledPersistedWorkerDispatchSmokePassed=true`',
  '`controlledPersistedWorkerDispatchSmokeResultReviewRequired=true`',
  '`mockJobRecordCreated=true`',
  '`mockIdempotencyRecordCreated=true`',
  '`mockWorkerLeaseClaimed=true`',
  '`mockWorkerClaimAttemptCreated=true`',
  '`mockJobEventCreated=true`',
  '`mockBackendRuntimeMessageCreated=true`',
  '`mockRecordsStoredInMemoryOnly=true`',
  '`realJobCreated=false`',
  '`realLeaseClaimed=false`',
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

for (const file of [RESULT_DOC, RESULT_SPEC]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_EXECUTION_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(
  result.upstreamControlledPersistedWorkerDispatchSmokePlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_SMOKE_PLAN.decision,
)
assert.equal(result.executionSummary.controlledPersistedWorkerDispatchSmokeExecuted, true)
assert.equal(result.executionSummary.controlledPersistedWorkerDispatchSmokePassed, true)
assert.equal(result.executionSummary.resultReviewRequired, true)
assert.equal(result.executionSummary.mockOnly, true)
assert.equal(result.executionSummary.recordsStoredInMemoryOnly, true)
assert.equal(result.executionSummary.generatedLocalFixturePassedClaimed, false)

assert.deepEqual(result.executedChecks.map((checkResult) => checkResult.id), [
  'queue_fixture_validation',
  'coordinator_default_path',
  'coordinator_adapter_preview_path',
  'coordinator_transport_preview_path',
  'mock_idempotency_shape',
  'mock_worker_lease_shape',
  'mock_backend_runtime_message_shape',
])
assert.equal(result.executedChecks[1].status, 'blocked_real_lease_backend_required')
assert.equal(result.executedChecks[2].status, 'blocked_qwen_dispatch_adapter_fail_closed')
assert.equal(result.executedChecks[3].status, 'blocked_private_invoke_transport_preview_only')
assert.deepEqual(result.mockRecordCounts, {
  jobs: 1,
  runtimeIdempotencyRecords: 1,
  workerLeases: 1,
  workerLeaseClaimAttempts: 1,
  jobEvents: 1,
  backendRuntimeMessages: 1,
  generatedAssets: 0,
  creditReservations: 0,
  qaReports: 0,
})
assert.equal(result.sourceOfTruthExpectation.signedUrlsAreSourceOfTruth, false)
assert.equal(result.sourceOfTruthExpectation.publicUrlsAreSourceOfTruth, false)
assert.equal(result.sourceOfTruthExpectation.storageObjectsCreated, false)
assert.equal(result.sourceOfTruthExpectation.signedUrlsCreated, false)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchSmokePlanRecorded, true)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchSmokeExecutionRequired, false)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchSmokeExecuted, true)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchSmokePassed, true)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchSmokeResultReviewRequired, true)
assert.equal(result.runtimeFlags.mockRecordsStoredInMemoryOnly, true)
assertFalseRuntimeFlags(result.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues(result)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled persisted dispatch smoke execution result: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  controlledPersistedWorkerDispatchSmokeExecuted:
    result.runtimeFlags.controlledPersistedWorkerDispatchSmokeExecuted,
  controlledPersistedWorkerDispatchSmokePassed:
    result.runtimeFlags.controlledPersistedWorkerDispatchSmokePassed,
  resultReviewRequired:
    result.runtimeFlags.controlledPersistedWorkerDispatchSmokeResultReviewRequired,
  mockRecordCounts: result.mockRecordCounts,
  readyForRealWorkerDispatch: result.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: result.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  nextPrompt: result.nextPrompt,
}, null, 2))
