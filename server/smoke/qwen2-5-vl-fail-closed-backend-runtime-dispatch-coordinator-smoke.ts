import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR_CONTRACT,
  runQwen25VlFailClosedBackendRuntimeDispatchCoordinator,
} from '../../src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator'
import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_BACKEND_RUNTIME_DISPATCH_IMPLEMENTATION_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-backend-runtime-dispatch-implementation-plan'
import { QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR } from '../../src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_fail_closed_backend_runtime_dispatch_coordinator_implemented_review_required'
const RESULT_DECISION =
  'qwen2_5_vl_fail_closed_backend_runtime_dispatch_coordinator_blocked_no_runtime_side_effect'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58L-CONTROLLED-BACKEND-DISPATCH-DRY-RUN: run Qwen fail-closed backend dispatch coordinator smoke review, no cloud/no assets/no beta'

type JsonRecord = Record<string, unknown>

function check(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message)
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8')
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

const forbiddenTextPatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
  ['authorization bearer value', /\bAuthorization\s*:\s*Bearer\s+\S+/i],
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  ['unsafe runtime true claim', /\b(realJobCreated|realLeaseClaimed|idempotencyRowCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|inferenceRun|workersDispatched|supabaseTouched|sqlExecuted)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe generated/public claim', /\b(generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated)\b\s*[:=]\s*(true|"true")/i],
  ['unsafe unlock claim', /\b(betaReady|productionReady|dryRunPassedClaimed|generatedLocalFixturePassedClaimed)\b\s*[:=]\s*(true|"true")/i],
]

const forbiddenValuePatterns: Array<[string, RegExp]> = [
  ['cloud run public hostname', /\brun\.app\b/i],
  ['supabase hostname', /\bsupabase\.co\b/i],
  ['signed URL token', /\b(X-Amz-Signature|X-Amz-Credential|X-Amz-Algorithm|X-Goog-|Key-Pair-Id=|Expires=|Policy=|Signature=)/i],
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

function assertFalseRuntimeSideEffects(flags: JsonRecord) {
  for (const key of [
    'realJobCreated',
    'realLeaseClaimed',
    'idempotencyRowCreated',
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
    'creditMutationCreated',
    'betaReady',
    'productionReady',
    'dryRunPassedClaimed',
    'generatedLocalFixturePassedClaimed',
  ]) {
    assert.equal(flags[key], false, `${key} must be false`)
  }
}

function fixtureWithMutation(mutate: (fixture: JsonRecord) => void): JsonRecord {
  const fixture = clone(
    QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
  ) as JsonRecord
  mutate(fixture)
  return fixture
}

for (const file of [
  'docs/qwen2-5-vl-7b-fail-closed-backend-runtime-dispatch-coordinator.md',
  'docs/qwen2-5-vl-7b-backend-runtime-dispatch-implementation-plan.md',
  'src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
  'src/backend/runtime/idempotency-service.ts',
  'src/backend/runtime/worker-lease-service.ts',
  'src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator.ts',
  'server/smoke/qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator-smoke.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator'],
  'tsx server/smoke/qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-fail-closed-backend-runtime-dispatch-coordinator.md')
for (const phrase of [
  DECISION,
  'runWorkerJobSchema validation',
  'approved snapshot + credit + source-of-truth checks',
  'idempotency conflict check',
  'transactional lease precondition',
  'Qwen fail-closed dispatch adapter',
  'Qwen private invoke envelope',
  'Qwen private invoke transport preview',
  'blocked_invalid_worker_job_schema',
  'blocked_missing_approved_snapshot',
  'blocked_missing_credit_reservation',
  'blocked_missing_source_of_truth_refs',
  'blocked_idempotency_conflict',
  'blocked_real_lease_backend_required',
  'blocked_qwen_dispatch_adapter_fail_closed',
  'blocked_private_invoke_transport_preview_only',
  '`realJobCreated=false`',
  '`realLeaseClaimed=false`',
  '`cloudRunInvocationAttempted=false`',
  '`identityTokenFetched=false`',
  '`workersDispatched=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

const defaultResult = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator()
assert.equal(defaultResult.decision, RESULT_DECISION)
assert.equal(defaultResult.status, 'blocked_real_lease_backend_required')
assert.equal(defaultResult.workerJobSchemaValidated, true)
assert.equal(defaultResult.localQueueValidated, true)
assert.equal(defaultResult.idempotencyChecked, true)
assert.equal(defaultResult.backendLeaseChecked, true)
assert.equal(defaultResult.qwenDispatchAdapterChecked, false)
assertFalseRuntimeSideEffects(defaultResult.runtimeFlags)

const invalidSchema = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
  queueFixture: fixtureWithMutation((fixture) => {
    delete fixture.workspaceId
  }),
})
assert.equal(invalidSchema.status, 'blocked_invalid_worker_job_schema')
assert.equal(invalidSchema.workerJobSchemaValidated, false)
assertFalseRuntimeSideEffects(invalidSchema.runtimeFlags)

const missingSnapshot = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
  queueFixture: fixtureWithMutation((fixture) => {
    delete fixture.approvedPlanSnapshotId
    delete asRecord(fixture.payloadJson).approvedPlanSnapshotId
  }),
})
assert.equal(missingSnapshot.status, 'blocked_missing_approved_snapshot')
assert.ok(missingSnapshot.queueValidationIssues.includes('missing_approved_snapshot'))
assertFalseRuntimeSideEffects(missingSnapshot.runtimeFlags)

const missingCredit = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
  queueFixture: fixtureWithMutation((fixture) => {
    delete fixture.creditReservationId
    delete asRecord(fixture.payloadJson).creditReservationId
  }),
})
assert.equal(missingCredit.status, 'blocked_missing_credit_reservation')
assert.ok(missingCredit.queueValidationIssues.includes('missing_credit_reservation'))
assertFalseRuntimeSideEffects(missingCredit.runtimeFlags)

const missingSource = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
  queueFixture: fixtureWithMutation((fixture) => {
    asRecord(asRecord(fixture.payloadJson).sourceOfTruthRefs).privateManifestRefs = []
  }),
})
assert.equal(missingSource.status, 'blocked_missing_source_of_truth_refs')
assert.ok(missingSource.queueValidationIssues.includes('missing_source_of_truth_refs'))
assertFalseRuntimeSideEffects(missingSource.runtimeFlags)

const idempotencyConflict = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
  forceIdempotencyConflict: true,
})
assert.equal(idempotencyConflict.status, 'blocked_idempotency_conflict')
assert.equal(idempotencyConflict.idempotencyChecked, true)
assert.equal(idempotencyConflict.idempotencyConflict, true)
assertFalseRuntimeSideEffects(idempotencyConflict.runtimeFlags)

const adapterBlocked = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
  continueAfterLeaseBackendRequirementForPreview: true,
})
assert.equal(adapterBlocked.status, 'blocked_qwen_dispatch_adapter_fail_closed')
assert.equal(adapterBlocked.qwenDispatchAdapterChecked, true)
assert.equal(adapterBlocked.privateInvokeEnvelopeChecked, false)
assertFalseRuntimeSideEffects(adapterBlocked.runtimeFlags)

const transportPreview = runQwen25VlFailClosedBackendRuntimeDispatchCoordinator({
  continueAfterLeaseBackendRequirementForPreview: true,
  continueAfterDispatchAdapterForPreview: true,
})
assert.equal(transportPreview.status, 'blocked_private_invoke_transport_preview_only')
assert.equal(transportPreview.qwenDispatchAdapterChecked, true)
assert.equal(transportPreview.privateInvokeEnvelopeChecked, true)
assert.equal(transportPreview.privateInvokeTransportPreviewChecked, true)
assertFalseRuntimeSideEffects(transportPreview.runtimeFlags)

const spec = QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR
assert.equal(spec.decision, DECISION)
assert.equal(
  spec.upstreamBackendRuntimeDispatchImplementationPlanDecision,
  QWEN2_5_VL_BACKEND_RUNTIME_DISPATCH_IMPLEMENTATION_PLAN.decision,
)
assert.equal(spec.readinessDecision.backendRuntimeDispatchCoordinatorImplemented, true)
assert.equal(spec.readinessDecision.controlledBackendDispatchDryRunRequired, true)
assert.equal(spec.readinessDecision.readyForRealWorkerDispatch, false)
assert.equal(spec.nextPrompt, NEXT_PROMPT)
assert.equal(QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR_CONTRACT.decision, RESULT_DECISION)
assert.equal(QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR_CONTRACT.invokesCloudRun, false)
assert.equal(QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR_CONTRACT.runsInference, false)
assert.equal(QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR_CONTRACT.mutatesSupabase, false)
assert.equal(QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR_CONTRACT.createsGeneratedAsset, false)
assertFalseRuntimeSideEffects(spec.runtimeFlags)

for (const outcome of [
  'blocked_invalid_worker_job_schema',
  'blocked_missing_approved_snapshot',
  'blocked_missing_credit_reservation',
  'blocked_missing_source_of_truth_refs',
  'blocked_idempotency_conflict',
  'blocked_real_lease_backend_required',
  'blocked_qwen_dispatch_adapter_fail_closed',
  'blocked_private_invoke_transport_preview_only',
]) {
  assert.ok(spec.coordinatorOutcomes.includes(outcome as never), `spec missing outcome ${outcome}`)
  assert.ok(
    QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR_CONTRACT.requiredOutcomes.includes(outcome as never),
    `contract missing outcome ${outcome}`,
  )
}

for (const file of [
  'docs/qwen2-5-vl-7b-fail-closed-backend-runtime-dispatch-coordinator.md',
  'src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts',
  'src/backend/mock/mock-qwen2-5-vl-fail-closed-backend-runtime-dispatch-coordinator.ts',
]) {
  assertNoForbiddenText(file)
}

const forbiddenDataFindings = scanValues({
  spec,
  contract: QWEN2_5_VL_FAIL_CLOSED_BACKEND_RUNTIME_DISPATCH_COORDINATOR_CONTRACT,
  defaultResult,
  invalidSchema,
  missingSnapshot,
  missingCredit,
  missingSource,
  idempotencyConflict,
  adapterBlocked,
  transportPreview,
})
assert.deepEqual(
  forbiddenDataFindings,
  [],
  `Forbidden values in Qwen fail-closed backend runtime dispatch coordinator data: ${forbiddenDataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: spec.decision,
  defaultStatus: defaultResult.status,
  outcomeCount: spec.coordinatorOutcomes.length,
  backendRuntimeDispatchCoordinatorImplemented:
    spec.readinessDecision.backendRuntimeDispatchCoordinatorImplemented,
  readyForRealWorkerDispatch: spec.readinessDecision.readyForRealWorkerDispatch,
  cloudRunInvocationAttempted: spec.runtimeFlags.cloudRunInvocationAttempted,
  workersDispatched: spec.runtimeFlags.workersDispatched,
  generatedAssetsCreated: spec.runtimeFlags.generatedAssetsCreated,
  nextPrompt: spec.nextPrompt,
}, null, 2))
