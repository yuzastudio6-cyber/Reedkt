import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {
  QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT,
  runQwen25VlCloudRunGpuFailClosedDispatchAdapter,
} from '../../src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter'
import { QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_fail_closed_dispatch_adapter_refused_no_cloud_run_invocation'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_35-CLOUD-RUN-GPU-PRIVATE-INVOKE-PLAN: plan private Cloud Run invocation transport for Qwen dispatch adapter, no invocation'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function parseBlock(relativePath: string, label: string) {
  const text = read(relativePath)
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = text.match(new RegExp('```json\\s+' + escaped + '\\n([\\s\\S]*?)\\n```'))
  check(match, `Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1]) as JsonRecord
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['non-local URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['execution true claim', /\b(inferenceRun|forwardPassRun|promptProcessed|cloudRunInvocationAttempted|serviceRuntimeRequestSent|workersDispatched|dispatchSubmitted|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe pass claim', /\b(dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i]
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['non-local URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential-looking value', /\b(api[_-]?key|hf[_-]?token|access[_-]?token|service[_-]?role)\b/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i]
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
    return Object.entries(value as JsonRecord)
      .flatMap(([key, nested]) => scanValues(nested, [...pathParts, key]))
  }
  return []
}

function assertAllFalse(flags: JsonRecord, keys: string[]) {
  for (const key of keys) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter-change-log.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts',
  'src/backend/workers/index.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter-smoke.ts',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness.md',
  'package.json'
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter-smoke.ts',
  'package script mismatch'
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter.md')
const changeLog = parseBlock(
  'docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter-change-log.md',
  'qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter-change-log'
)
const adapter = QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER

for (const phrase of [
  DECISION,
  'src/backend/workers',
  'bounded Qwen runtime request',
  'private Cloud Run invocation',
  '`qwen2_5_vl_cloud_run_gpu_fail_closed_dispatch_adapter`',
  '`qwen2_5_vl_cloud_run_gpu_worker`',
  '`media_analysis`',
  '`qwen2_5_vl_cloud_run_gpu_runtime_request_v1`',
  '`blocked_invalid_queue_contract`',
  '`blocked_fail_closed_cloud_run_invocation_disabled`',
  '`dispatchSubmitted=false`',
  '`cloudRunInvocationAttempted=false`',
  '`inferenceRun=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assert.equal(adapter.decision, DECISION)
assert.equal(changeLog.decision, DECISION)
assert.equal(adapter.nextPrompt, NEXT_PROMPT)
assert.equal(changeLog.nextPrompt, NEXT_PROMPT)
assert.equal(QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT.decision, DECISION)
assert.equal(QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT.submitsDispatch, false)
assert.equal(QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT.invokesCloudRun, false)
assert.equal(QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DISPATCH_ADAPTER_CONTRACT.enablesInference, false)
assert.equal(adapter.adapterContract.adapterId, 'qwen2_5_vl_cloud_run_gpu_fail_closed_dispatch_adapter')

const validResult = runQwen25VlCloudRunGpuFailClosedDispatchAdapter()
assert.equal(validResult.ok, false)
assert.equal(validResult.status, 'blocked_fail_closed_cloud_run_invocation_disabled')
assert.equal(validResult.decision, DECISION)
assert.equal(validResult.queueContractValidated, true)
assert.equal(validResult.localQueueAcceptedForFutureDispatch, true)
assert.equal(validResult.validationIssues.length, 0)
assert.equal(validResult.runtimeFlags.dispatchSubmitted, false)
assert.equal(validResult.runtimeFlags.cloudRunInvocationAttempted, false)
assert.equal(validResult.runtimeFlags.inferenceRun, false)

const invalidFixture = clone(QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture) as JsonRecord
delete invalidFixture.approvedPlanSnapshotId
const invalidResult = runQwen25VlCloudRunGpuFailClosedDispatchAdapter({ queueFixture: invalidFixture })
assert.equal(invalidResult.ok, false)
assert.equal(invalidResult.status, 'blocked_invalid_queue_contract')
assert.equal(invalidResult.queueContractValidated, false)
assert.equal(invalidResult.localQueueAcceptedForFutureDispatch, false)
assert.ok(invalidResult.validationIssues.includes('missing_approved_snapshot'))
assert.equal(invalidResult.runtimeFlags.dispatchSubmitted, false)
assert.equal(invalidResult.runtimeFlags.cloudRunInvocationAttempted, false)

for (const outcome of [
  'blocked_invalid_queue_contract',
  'blocked_fail_closed_cloud_run_invocation_disabled'
]) {
  assert.ok((changeLog.adapterOutcomes as string[]).includes(outcome), `change log missing outcome ${outcome}`)
}

const adapterRequirements = new Set<string>(adapter.requiredBeforeEnablingCloudRunInvocation)
for (const required of [
  'backend_dispatch_route_for_qwen_worker',
  'service_role_transactional_job_claim_and_lease',
  'backend_idempotency_conflict_enforcement',
  'private_cloud_run_service_to_service_invocation_auth',
  'approved_snapshot_hash_verification',
  'credit_reservation_verification',
  'failure_release_or_refund_policy',
  'observability_for_dispatch_attempts_and_results'
]) {
  assert.ok(adapterRequirements.has(required), `adapter missing requirement ${required}`)
  assert.ok(
    (changeLog.requiredBeforeEnablingCloudRunInvocation as string[]).includes(required),
    `change log missing requirement ${required}`
  )
}

const adapterRefusedInputs = new Set<string>(adapter.refusedInputs)
for (const refused of [
  'invalid_queue_contract',
  'raw_prompt_payload',
  'signed_url_source_of_truth',
  'public_url_source_of_truth',
  'enabled_runtime_gate',
  'model_policy_mismatch',
  'missing_approved_snapshot',
  'missing_credit_reservation',
  'missing_queue_lease'
]) {
  assert.ok(adapterRefusedInputs.has(refused), `adapter missing refused input ${refused}`)
  assert.ok((changeLog.refusedInputs as string[]).includes(refused), `change log missing refused input ${refused}`)
}

assert.equal(adapter.runtimeFlags.adapterImplemented, true)
assert.equal(adapter.runtimeFlags.adapterInvokedLocally, true)
assert.equal(adapter.runtimeFlags.validQueueFixtureRefusedFailClosed, true)
assert.equal(adapter.runtimeFlags.invalidQueueFixtureRefusedBeforeRuntime, true)

const falseRuntimeFlags = [
  'dispatchSubmitted',
  'cloudRunInvocationAttempted',
  'serviceRuntimeRequestSent',
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
  'creditMutationCreated',
  'betaUnlocked',
  'productionUnlocked',
  'dryRunPassedClaimed',
  'generatedLocalFixturePassedClaimed'
]
assertAllFalse(adapter.runtimeFlags as JsonRecord, falseRuntimeFlags)
assertAllFalse(changeLog.runtimeFlags as JsonRecord, falseRuntimeFlags)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-fail-closed-dispatch-adapter-change-log.md',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-fail-closed-dispatch-adapter.ts'
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({ adapter, validResult, invalidResult })
assert.deepEqual(forbiddenDataFindings, [], `Forbidden values in dispatch adapter data: ${forbiddenDataFindings.join('; ')}`)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  adapterId: adapter.adapterContract.adapterId,
  validStatus: validResult.status,
  invalidStatus: invalidResult.status,
  dispatchSubmitted: adapter.runtimeFlags.dispatchSubmitted,
  cloudRunInvocationAttempted: adapter.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: adapter.runtimeFlags.inferenceRun,
  nextPrompt: NEXT_PROMPT
}, null, 2))
