import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { checkJobRuntimeGates } from '../../src/backend/services/job-gate-service'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_DISPATCH_READINESS, evaluateQwen25VlDispatchReadiness } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-dispatch-readiness'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT, validateQwen25VlLocalQueueFixture } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_dispatch_readiness_audited_no_dispatch'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_34-CLOUD-RUN-GPU-FAIL-CLOSED-DISPATCH-ADAPTER: add a Qwen-specific fail-closed dispatch adapter, no Cloud Run invocation'

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

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['non-local URL', /\bhttps?:\/\/(?!127\.0\.0\.1|localhost)/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token|access[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['execution true claim', /\b(inferenceRun|forwardPassRun|promptProcessed|cloudRunInvocationAllowedNow|serviceRuntimeRequestSent|workersDispatched|supabaseTouched|sqlExecuted|readyForRealDispatch)\b\s*[:=]\s*(true|"true")/i],
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
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-dispatch-readiness.ts',
  'server/smoke/qwen2-5-vl-cloud-run-gpu-approved-snapshot-dispatch-readiness-smoke.ts',
  'src/backend/services/job-gate-service.ts',
  'src/backend/services/job-queue-runtime-service.ts',
  'src/backend/runtime/worker-lease-service.ts',
  'src/backend/runtime/idempotency-service.ts',
  'src/backend/services/worker-dispatch-service.ts',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-local-queue-contract.md',
  'package.json'
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness'],
  'tsx server/smoke/qwen2-5-vl-cloud-run-gpu-approved-snapshot-dispatch-readiness-smoke.ts',
  'package script mismatch'
)

const doc = read('docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness.md')
const changeLog = parseBlock(
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness-change-log.md',
  'qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness-change-log'
)
const readiness = QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_DISPATCH_READINESS

for (const phrase of [
  DECISION,
  'blocked_backend_runtime_missing',
  'user/chat request',
  'structured agent findings',
  'edit intents',
  'approved plan snapshot',
  'credit reservation',
  'queue lease / worker contract',
  'bounded Qwen runtime request',
  'private Cloud Run invocation',
  '`qwen2_5_vl_cloud_run_gpu_worker`',
  '`media_analysis`',
  '`qa_worker`',
  '`nvidia-l4`',
  '`readyForRealDispatch=false`',
  '`cloudRunInvocationAllowedNow=false`',
  '`workersDispatched=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

assert.equal(readiness.decision, DECISION, 'readiness decision mismatch')
assert.equal(changeLog.decision, DECISION, 'change log decision mismatch')
assert.equal(readiness.dispatchReadinessStatus, 'blocked_backend_runtime_missing')
assert.equal(changeLog.dispatchReadinessStatus, 'blocked_backend_runtime_missing')
assert.equal(readiness.nextPrompt, NEXT_PROMPT)
assert.equal(changeLog.nextPrompt, NEXT_PROMPT)
assert.equal(readiness.upstreamContracts.localQueueContractDecision, QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.decision)
assert.equal(readiness.upstreamContracts.runtimeContractDecision, QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.decision)
assert.equal(readiness.upstreamContracts.runtimeSchemaVersion, QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion)
assert.equal(readiness.qwenWorkerIdentity.workerType, 'qwen2_5_vl_cloud_run_gpu_worker')
assert.equal(readiness.qwenWorkerIdentity.jobType, 'media_analysis')
assert.equal(readiness.qwenWorkerIdentity.workerKind, 'qa')
assert.equal(readiness.qwenWorkerIdentity.runtimeKind, 'qa_worker')

const queueValidation = validateQwen25VlLocalQueueFixture(
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
)
assert.equal(queueValidation.ok, true, 'upstream local queue fixture must remain valid')
assert.equal(queueValidation.acceptedForFutureDispatch, true, 'queue fixture should remain future-dispatch-planning accepted')
assert.equal(queueValidation.dispatchAllowedNow, false, 'queue fixture must not dispatch now')

const gateInput = readiness.dispatchGateFixture
const gateResult = checkJobRuntimeGates(createMockDatabase(), {
  workspaceId: gateInput.workspaceId,
  projectId: gateInput.projectId,
  requiresBackendRuntime: gateInput.requiresBackendRuntime,
  mockSafe: gateInput.mockSafe
})
assert.equal(gateResult.ok, false, 'backend runtime gate must block real dispatch')
assert.ok(gateResult.blockReasons.includes('backend_runtime_missing'), 'backend runtime blocker must be present')
assert.equal(gateResult.mockOnly, true, 'gate result must be mock-only')

const evaluated = evaluateQwen25VlDispatchReadiness()
assert.equal(evaluated.status, 'blocked_backend_runtime_missing')
assert.equal(evaluated.localQueueContractValid, true)
assert.equal(evaluated.acceptedForDispatchReadinessPlanning, true)
assert.equal(evaluated.readyForRealDispatch, false)
assert.equal(evaluated.dispatchAllowedNow, false)
assert.equal(evaluated.cloudRunInvocationAllowedNow, false)
assert.equal(evaluated.inferenceAllowedNow, false)

for (const blocker of [
  'backend_dispatch_route_missing',
  'service_role_lease_claim_missing',
  'idempotency_backend_enforcement_missing',
  'private_cloud_run_invocation_not_wired',
  'supabase_queue_mutation_not_enabled',
  'credit_mutation_not_enabled',
  'qwen_specific_dispatch_adapter_missing',
  'qwen_inference_disabled'
]) {
  assert.ok(evaluated.blockers.includes(blocker as never), `evaluation missing blocker ${blocker}`)
  assert.ok(readiness.currentBlockers.some((item) => item.id === blocker), `readiness missing blocker ${blocker}`)
  assert.ok((changeLog.currentBlockers as string[]).includes(blocker), `change log missing blocker ${blocker}`)
}

const blockedBypassIds = new Set<string>(readiness.blockedBypasses)
for (const bypass of [
  'dispatch_without_approved_snapshot',
  'dispatch_without_credit_reservation',
  'dispatch_without_queue_lease',
  'raw_chat_or_raw_prompt_dispatch',
  'signed_url_source_of_truth_dispatch',
  'enabled_runtime_gate_dispatch',
  'model_policy_mismatch_dispatch',
  'generic_worker_completion_substitution'
]) {
  assert.ok(blockedBypassIds.has(bypass), `missing blocked bypass ${bypass}`)
  assert.ok((changeLog.blockedBypasses as string[]).includes(bypass), `change log missing bypass ${bypass}`)
}

const surfaceIds = new Set<string>(readiness.workerRuntimeSurfaces.map((surface) => surface.id))
for (const surface of [
  'runWorkerJobSchema',
  'JobRuntimeQueueItem',
  'checkJobRuntimeGates',
  'claimWorkerLeaseMock',
  'idempotencyService',
  'dispatchMockWorkerJob'
]) {
  assert.ok(surfaceIds.has(surface), `missing worker runtime surface ${surface}`)
}

assert.equal(readiness.runtimeFlags.dispatchReadinessAudited, true)
assert.equal(readiness.runtimeFlags.localQueueContractValid, true)
assert.equal(readiness.runtimeFlags.acceptedForDispatchReadinessPlanning, true)
assert.equal(readiness.runtimeFlags.backendRuntimeRequired, true)

const falseRuntimeFlags = [
  'readyForRealDispatch',
  'backendRuntimeAvailable',
  'workerDispatchAdapterImplemented',
  'realLeaseClaimAllowedNow',
  'idempotencyBackendEnforced',
  'cloudRunInvocationAllowedNow',
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
assertAllFalse(readiness.runtimeFlags as JsonRecord, falseRuntimeFlags)
assertAllFalse(changeLog.runtimeFlags as JsonRecord, falseRuntimeFlags)

for (const file of [
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness.md',
  'docs/qwen2-5-vl-7b-cloud-run-gpu-approved-snapshot-dispatch-readiness-change-log.md',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-dispatch-readiness.ts'
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  readiness,
  evaluated
})
assert.deepEqual(forbiddenDataFindings, [], `Forbidden values in dispatch readiness data: ${forbiddenDataFindings.join('; ')}`)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  status: readiness.dispatchReadinessStatus,
  workerType: readiness.qwenWorkerIdentity.workerType,
  jobType: readiness.qwenWorkerIdentity.jobType,
  workerKind: readiness.qwenWorkerIdentity.workerKind,
  localQueueContractValid: readiness.runtimeFlags.localQueueContractValid,
  acceptedForDispatchReadinessPlanning: readiness.runtimeFlags.acceptedForDispatchReadinessPlanning,
  readyForRealDispatch: readiness.runtimeFlags.readyForRealDispatch,
  backendRuntimeBlockReason: gateResult.blockReasons[0],
  currentBlockerCount: readiness.currentBlockers.length,
  nextPrompt: NEXT_PROMPT
}, null, 2))
