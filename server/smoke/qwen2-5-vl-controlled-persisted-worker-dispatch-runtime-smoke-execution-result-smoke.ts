import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_EXECUTION_RESULT } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_smoke_executed_mock_only_result_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BR-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-SMOKE-RESULT-REVIEW: review controlled persisted Qwen worker dispatch runtime smoke result, no Cloud Run invocation/no inference/no assets/no beta'
const RESULT_DOC =
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-execution-result.md'
const RESULT_SPEC =
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result.ts'
const RESULT_SMOKE =
  'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result-smoke.ts'

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
  RESULT_DOC,
  RESULT_SPEC,
  RESULT_SMOKE,
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-smoke-plan.md',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-plan.ts',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-execution-result-smoke.ts',
  'package script mismatch',
)

const doc = read(RESULT_DOC)
for (const phrase of [
  DECISION,
  'local TypeScript/mock memory',
  'Default runtime path | blocked as expected | `blocked_real_lease_backend_required`',
  'Adapter preview path | blocked as expected | `blocked_qwen_dispatch_adapter_fail_closed`',
  'Transport preview path | blocked as expected | `blocked_private_invoke_transport_preview_only`',
  'Idempotency conflict path | blocked as expected | `blocked_idempotency_conflict`',
  'Missing approved snapshot path | blocked as expected | `blocked_missing_approved_snapshot`',
  'Missing credit reservation path | blocked as expected | `blocked_missing_credit_reservation`',
  'Missing private source-of-truth refs path | blocked as expected | `blocked_missing_source_of_truth_refs`',
  'Invalid worker job schema path | blocked as expected | `blocked_invalid_worker_job_schema`',
  '`controlledPersistedWorkerDispatchRuntimeSmokeExecuted=true`',
  '`controlledPersistedWorkerDispatchRuntimeSmokePassed=true`',
  '`controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired=true`',
  '`allRequiredRuntimeStatusesObserved=true`',
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

for (const file of [RESULT_DOC, RESULT_SPEC]) {
  assertNoForbiddenText(file)
}

const result = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_EXECUTION_RESULT
assert.equal(result.decision, DECISION)
assert.equal(result.nextPrompt, NEXT_PROMPT)
assert.equal(
  result.upstreamControlledPersistedWorkerDispatchRuntimeSmokePlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_PLAN.decision,
)
assert.equal(result.executionSummary.controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded, true)
assert.equal(result.executionSummary.controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired, false)
assert.equal(result.executionSummary.controlledPersistedWorkerDispatchRuntimeSmokeExecuted, true)
assert.equal(result.executionSummary.controlledPersistedWorkerDispatchRuntimeSmokePassed, true)
assert.equal(result.executionSummary.controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired, true)
assert.equal(result.executionSummary.mockOnly, true)
assert.equal(result.executionSummary.recordsStoredInMemoryOnly, true)
assert.equal(result.executionSummary.generatedLocalFixturePassedClaimed, false)

assert.deepEqual(result.executedRuntimeChecks.map((checkResult) => checkResult.id), [
  'defaultRuntimePath',
  'adapterPreviewPath',
  'transportPreviewPath',
  'idempotencyConflictPath',
  'missingApprovedSnapshotPath',
  'missingCreditReservationPath',
  'missingSourceOfTruthRefsPath',
  'invalidWorkerJobSchemaPath',
])
assert.deepEqual(result.runtimeStatusesObserved, [
  'blocked_real_lease_backend_required',
  'blocked_qwen_dispatch_adapter_fail_closed',
  'blocked_private_invoke_transport_preview_only',
  'blocked_idempotency_conflict',
  'blocked_missing_approved_snapshot',
  'blocked_missing_credit_reservation',
  'blocked_missing_source_of_truth_refs',
  'blocked_invalid_worker_job_schema',
])
assert.equal(result.executedRuntimeChecks.every((checkResult) => checkResult.passed), true)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePlanRecorded, true)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeExecutionRequired, false)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeExecuted, true)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePassed, true)
assert.equal(result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired, true)
assert.equal(result.runtimeFlags.defaultRuntimeLeaseBoundaryBlocked, true)
assert.equal(result.runtimeFlags.adapterPreviewBoundaryBlocked, true)
assert.equal(result.runtimeFlags.transportPreviewBoundaryBlocked, true)
assert.equal(result.runtimeFlags.idempotencyConflictBlocked, true)
assert.equal(result.runtimeFlags.missingApprovedSnapshotBlocked, true)
assert.equal(result.runtimeFlags.missingCreditReservationBlocked, true)
assert.equal(result.runtimeFlags.missingSourceOfTruthRefsBlocked, true)
assert.equal(result.runtimeFlags.invalidWorkerJobSchemaBlocked, true)
assert.equal(result.runtimeFlags.allRequiredRuntimeStatusesObserved, true)
assert.equal(result.runtimeFlags.transportPreviewReachedAllRuntimeBoundaries, true)
assert.equal(result.sourceOfTruthExpectation.signedUrlsAreSourceOfTruth, false)
assert.equal(result.sourceOfTruthExpectation.publicUrlsAreSourceOfTruth, false)
assert.equal(result.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(result.selectedRuntime.costPosture, 'scale_to_zero_required')
assertFalseRuntimeFlags(result.runtimeFlags as unknown as JsonRecord)

const forbiddenDataFindings = scanValues(result)
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in controlled persisted runtime smoke execution result: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  runtimeSmokeExecuted:
    result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeExecuted,
  runtimeSmokePassed:
    result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePassed,
  resultReviewRequired:
    result.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokeResultReviewRequired,
  observedStatusCount: result.runtimeStatusesObserved.length,
  selectedGpu: result.selectedRuntime.gpu,
  readyForRealWorkerDispatch: result.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: result.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: result.runtimeFlags.cloudRunInvocationAttempted,
  generatedAssetsCreated: result.runtimeFlags.generatedAssetsCreated,
  nextPrompt: result.nextPrompt,
}, null, 2))
