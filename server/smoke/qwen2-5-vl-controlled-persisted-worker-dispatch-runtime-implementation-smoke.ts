import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan'
import {
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_CONTRACT,
  runQwen25VlControlledPersistedWorkerDispatchRuntime,
} from '../../src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_implemented_fail_closed_private_invoke_execution_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BP-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-SMOKE-PLAN: plan controlled persisted Qwen worker dispatch runtime smoke, no Cloud Run invocation/no inference/no assets/no beta'

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
    /\b(readyForRealWorkerDispatch|privateInvokeReady|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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
    return Object.entries(value as JsonRecord)
      .flatMap(([key, nested]) => scanValues(nested, [...pathParts, key]))
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-implementation.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-plan.md',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-plan.ts',
  'src/backend/workers/qwen2-5-vl-backend-runtime-dispatch-coordinator.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-dispatch-adapter.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
  'src/backend/runtime/idempotency-service.ts',
  'src/backend/runtime/worker-lease-service.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.['smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation'],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation-smoke.ts',
  'package script mismatch',
)

const doc = read('docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-implementation.md')
for (const phrase of [
  DECISION,
  'implemented_fail_closed',
  'NVIDIA L4',
  'scale_to_zero_required',
  'Minimum instances: `0`',
  'approved plan snapshot',
  'credit reservation',
  'Supabase row refs',
  'private manifest refs',
  'checksum refs',
  'persisted worker job',
  'backend-only lease and idempotency gate',
  'Qwen private invoke runtime boundary',
  'blocked_real_lease_backend_required',
  'blocked_qwen_dispatch_adapter_fail_closed',
  'blocked_private_invoke_transport_preview_only',
  '`controlledPersistedWorkerDispatchRuntimeImplementationRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeImplemented=true`',
  '`controlledPersistedWorkerDispatchRuntimeSmokePlanRequired=true`',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-implementation.md',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-implementation.ts',
]) {
  assertNoForbiddenText(file)
}

const runtime = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_IMPLEMENTATION
assert.equal(runtime.decision, DECISION)
assert.equal(runtime.nextPrompt, NEXT_PROMPT)
assert.equal(
  runtime.upstreamControlledPersistedWorkerDispatchRuntimePlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_PLAN.decision,
)
assert.equal(runtime.runtimeSurface.status, 'implemented_fail_closed')
assert.equal(runtime.runtimeSurface.contractDecision, QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_CONTRACT.decision)
assert.equal(runtime.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(runtime.selectedRuntime.costPosture, 'scale_to_zero_required')
assert.equal(runtime.acceptedImplementationEvidence.runtimeImplementedFailClosed, true)
assert.equal(runtime.acceptedImplementationEvidence.defaultRuntimeStopsAtLeaseBoundary, true)
assert.equal(runtime.acceptedImplementationEvidence.adapterPreviewStopsAtFailClosedAdapter, true)
assert.equal(runtime.acceptedImplementationEvidence.transportPreviewStopsBeforeDependencies, true)
assert.equal(runtime.acceptedImplementationEvidence.idempotencyConflictBlocked, true)
assert.equal(runtime.acceptedImplementationEvidence.missingApprovedSnapshotBlocked, true)
assert.equal(runtime.remainingBlockers.controlledPersistedWorkerDispatchRuntimeSmokePlanRequired, true)
assert.equal(runtime.runtimeFlags.controlledPersistedWorkerDispatchRuntimePlanRequired, false)
assert.equal(runtime.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplementationRequired, false)
assert.equal(runtime.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplemented, true)
assert.equal(runtime.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePlanRequired, true)
assertFalseRuntimeFlags(runtime.runtimeFlags as unknown as JsonRecord)

for (const area of [
  'worker_job_schema_validation',
  'local_queue_contract_validation',
  'approved_snapshot_credit_source_refs',
  'idempotency_check',
  'backend_lease_boundary',
  'qwen_dispatch_adapter',
  'private_invoke_envelope',
  'private_invoke_transport_preview',
  'qa_audit_cost_credit_boundary',
  'cleanup_boundary',
]) {
  assert.ok((runtime.runtimeStepIds as readonly string[]).includes(area), `missing runtime step ${area}`)
}

const defaultRuntime = runQwen25VlControlledPersistedWorkerDispatchRuntime()
assert.equal(defaultRuntime.status, 'blocked_real_lease_backend_required')
assert.equal(defaultRuntime.selectedRuntime.gpu, 'nvidia_l4')
assert.equal(defaultRuntime.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplemented, true)
assert.equal(defaultRuntime.runtimeFlags.backendLeaseBoundaryChecked, true)
assert.equal(defaultRuntime.runtimeFlags.qwenDispatchAdapterChecked, false)
assertFalseRuntimeFlags(defaultRuntime.runtimeFlags as unknown as JsonRecord)

const adapterPreview = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  continueAfterLeaseBoundaryForPreview: true,
})
assert.equal(adapterPreview.status, 'blocked_qwen_dispatch_adapter_fail_closed')
assert.equal(adapterPreview.runtimeFlags.qwenDispatchAdapterChecked, true)
assertFalseRuntimeFlags(adapterPreview.runtimeFlags as unknown as JsonRecord)

const transportPreview = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  continueAfterLeaseBoundaryForPreview: true,
  continueAfterAdapterBoundaryForPreview: true,
})
assert.equal(transportPreview.status, 'blocked_private_invoke_transport_preview_only')
assert.equal(transportPreview.runtimeFlags.privateInvokeEnvelopeChecked, true)
assert.equal(transportPreview.runtimeFlags.privateInvokeTransportPreviewChecked, true)
assertFalseRuntimeFlags(transportPreview.runtimeFlags as unknown as JsonRecord)

const conflict = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  forceIdempotencyConflict: true,
})
assert.equal(conflict.status, 'blocked_idempotency_conflict')
assert.equal(conflict.idempotencyConflict, true)
assertFalseRuntimeFlags(conflict.runtimeFlags as unknown as JsonRecord)

const validFixture = QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture
const payload = validFixture.payloadJson as JsonRecord
const missingSnapshot = runQwen25VlControlledPersistedWorkerDispatchRuntime({
  queueFixture: {
    ...validFixture,
    approvedPlanSnapshotId: undefined,
    payloadJson: {
      ...payload,
      approvedPlanSnapshotId: undefined,
    },
  },
})
assert.equal(missingSnapshot.status, 'blocked_missing_approved_snapshot')
assert.equal(missingSnapshot.approvedSnapshotPresent, false)
assertFalseRuntimeFlags(missingSnapshot.runtimeFlags as unknown as JsonRecord)

const dataFindings = scanValues({ runtime, defaultRuntime, adapterPreview, transportPreview, conflict, missingSnapshot })
assert.deepEqual(
  dataFindings,
  [],
  `Forbidden values in controlled persisted dispatch runtime implementation data: ${dataFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: runtime.decision,
  selectedGpu: runtime.selectedRuntime.gpu,
  costPosture: runtime.selectedRuntime.costPosture,
  defaultRuntimeStatus: defaultRuntime.status,
  adapterPreviewStatus: adapterPreview.status,
  transportPreviewStatus: transportPreview.status,
  runtimeImplemented: runtime.runtimeFlags.controlledPersistedWorkerDispatchRuntimeImplemented,
  runtimeSmokePlanRequired: runtime.runtimeFlags.controlledPersistedWorkerDispatchRuntimeSmokePlanRequired,
  readyForRealWorkerDispatch: runtime.runtimeFlags.readyForRealWorkerDispatch,
  workersDispatched: runtime.runtimeFlags.workersDispatched,
  cloudRunInvocationAttempted: runtime.runtimeFlags.cloudRunInvocationAttempted,
  inferenceRun: runtime.runtimeFlags.inferenceRun,
  generatedAssetsCreated: runtime.runtimeFlags.generatedAssetsCreated,
  nextPrompt: runtime.nextPrompt,
}, null, 2))
