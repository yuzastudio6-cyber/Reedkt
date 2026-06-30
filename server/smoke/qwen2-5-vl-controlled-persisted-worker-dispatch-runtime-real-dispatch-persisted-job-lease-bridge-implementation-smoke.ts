import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT } from '../../src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_IMPLEMENTATION } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation'
import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_PLAN } from '../../src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan'
import {
  QWEN2_5_VL_CONTROLLED_PERSISTED_JOB_LEASE_BRIDGE_CONTRACT,
  runQwen25VlControlledPersistedJobLeaseBridge,
} from '../../src/backend/workers/qwen2-5-vl-controlled-persisted-job-lease-bridge'

const ROOT = process.cwd()
const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_persisted_job_lease_bridge_implemented_fail_closed_result_review_required'
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58DE-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-PERSISTED-JOB-LEASE-BRIDGE-RESULT-REVIEW: review the fail-closed persisted job and lease bridge result, no inference/no generated assets/no beta'

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
  ['credential assignment', /\b(api[_-]?key|secret|password|hf[_-]?token)\s*[:=]\s*['"][^'"]+['"]/i],
  ['database URL', /\b(postgres(?:ql)?:\/\/|mysql:\/\/|mongodb(?:\+srv)?:\/\/)/i],
  ['public storage endpoint', /\bstorage\.googleapis\.com\//i],
  ['private key block', /BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY/i],
  [
    'unsafe runtime true claim',
    /\b(readyForRealWorkerDispatch|privateInvokeHandoffAllowedNow|realJobCreated|realLeaseClaimed|idempotencyRowCreated|jobEventCreated|backendRuntimeMessageCreated|workerClaimCreated|storageObjectRecordCreated|signedUrlEventCreated|qaReportCreated|auditEventCreated|creditMutationCreated|cloudRunInvocationAttempted|serviceRuntimeRequestSent|serviceUrlResolvedNow|audienceResolvedNow|identityTokenFetched|authHeaderCreated|modelImportRun|modelLoadRun|vllmEngineInitialized|promptProcessed|forwardPassRun|inferenceRun|providerCallsMade|workersDispatched|supabaseTouched|sqlExecuted|generatedAssetsCreated|publicArtifactsCreated|signedUrlsCreated|mediaProcessingRun|renderExportRun|betaReady|productionReady)\b\s*[:=]\s*(true|"true")/i,
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function assertFalseRuntimeFlags(flags: JsonRecord) {
  for (const key of [
    'readyForRealWorkerDispatch',
    'privateInvokeHandoffAllowedNow',
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
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation.md',
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan.md',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-job-lease-bridge.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-plan.ts',
  'src/backend/mock/mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-local-queue-contract.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-envelope.ts',
  'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
  'package.json',
]) {
  check(fs.existsSync(path.join(ROOT, file)), `Missing required file: ${file}`)
}

const packageJson = JSON.parse(read('package.json')) as { scripts?: Record<string, string> }
assert.equal(
  packageJson.scripts?.[
    'smoke:qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation'
  ],
  'tsx server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation-smoke.ts',
  'package script mismatch',
)

const doc = read(
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation.md',
)
for (const phrase of [
  DECISION,
  'bridge implementation recorded: true',
  'bridge implementation required: false',
  'bridge result review required: true',
  'approved Qwen queue fixture accepted: true',
  'idempotency conflict blocked: true',
  'private invoke transport executed: false',
  'Cloud Run invocation attempted: false',
  'inference run: false',
  'generated assets created: false',
  'GPU: `nvidia_l4`',
  'cost posture: `scale_to_zero_required`',
  'runQwen25VlControlledPersistedJobLeaseBridge',
  '`blocked_private_invoke_transport_preview_only`',
  '`blocked_idempotency_conflict`',
  '`blocked_missing_approved_snapshot`',
  '`blocked_missing_credit_reservation`',
  '`blocked_missing_source_of_truth_refs`',
  '`blocked_invalid_worker_job_schema`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplementationRequired=false`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplemented=true`',
  '`controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewRequired=true`',
  '`persistedJobReferenceCreated=true`',
  '`persistedLeaseReferenceCreated=true`',
  '`backendRuntimeMessageReferenceCreated=true`',
  '`workerClaimReferenceCreated=true`',
  '`readyForRealWorkerDispatch=false`',
  '`workersDispatched=false`',
  '`inferenceRun=false`',
  '`generatedAssetsCreated=false`',
  '`generatedLocalFixturePassedClaimed=false`',
  NEXT_PROMPT,
]) {
  assert.ok(doc.includes(phrase), `Doc missing phrase: ${phrase}`)
}

for (const file of [
  'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation.md',
  'src/backend/workers/qwen2-5-vl-controlled-persisted-job-lease-bridge.ts',
  'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-persisted-job-lease-bridge-implementation.ts',
]) {
  assertNoForbiddenText(file)
}

const implementation =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_IMPLEMENTATION
assert.equal(implementation.decision, DECISION)
assert.equal(implementation.nextPrompt, NEXT_PROMPT)
assert.equal(
  implementation.upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgePlanDecision,
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PERSISTED_JOB_LEASE_BRIDGE_PLAN.decision,
)
assert.equal(implementation.bridgeContractDecision, QWEN2_5_VL_CONTROLLED_PERSISTED_JOB_LEASE_BRIDGE_CONTRACT.decision)
assert.equal(implementation.implementationSummary.bridgeImplementedFailClosed, true)
assert.equal(implementation.implementationSummary.bridgeResultReviewRequired, true)
assert.equal(implementation.implementationSummary.defaultBridgeStatus, 'blocked_private_invoke_transport_preview_only')
assert.equal(implementation.implementationSummary.idempotencyConflictStatus, 'blocked_idempotency_conflict')
assert.equal(implementation.implementationSummary.mockRecordsStoredInMemoryOnly, true)
assert.equal(implementation.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplementationRequired, false)
assert.equal(implementation.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeImplemented, true)
assert.equal(implementation.runtimeFlags.controlledPersistedWorkerDispatchRuntimeRealDispatchPersistedJobLeaseBridgeResultReviewRequired, true)
assert.equal(implementation.runtimeFlags.persistedJobReferenceCreated, true)
assert.equal(implementation.runtimeFlags.persistedLeaseReferenceCreated, true)
assert.equal(implementation.runtimeFlags.sanitizedJobEventReferenceCreated, true)
assert.equal(implementation.runtimeFlags.backendRuntimeMessageReferenceCreated, true)
assert.equal(implementation.runtimeFlags.workerClaimReferenceCreated, true)
assert.equal(implementation.runtimeFlags.privateInvokeEnvelopeChecked, true)
assert.equal(implementation.runtimeFlags.privateInvokeTransportPreviewChecked, true)
assert.equal(implementation.runtimeFlags.idempotencyConflictBlocked, true)
assert.equal(implementation.runtimeFlags.selectedGpuL4Accepted, true)
assert.equal(implementation.runtimeFlags.scaleToZeroCostPostureAccepted, true)
assertFalseRuntimeFlags(implementation.runtimeFlags as unknown as JsonRecord)

for (const field of [
  'workspaceId',
  'projectId',
  'approvedPlanSnapshotId',
  'creditReservationId',
  'jobId',
  'leaseId',
  'leaseExpiresAt',
  'workerClaimId',
  'backendRuntimeMessageId',
  'jobEventId',
]) {
  assert.ok(implementation.bridgeRefs?.[field as keyof typeof implementation.bridgeRefs], `bridgeRefs.${field} must exist`)
}
assert.equal(implementation.bridgeRefs?.persistedReferenceOnly, true)
assert.equal(implementation.bridgeRefs?.mockOnly, true)
assert.equal(implementation.bridgeRefs?.privateInvokeEnvelopeAcceptedForFutureTransport, true)
assert.deepEqual(implementation.bridgeRefs?.privateManifestRefs, ['private_manifest_ref_mock_qwen_queue_001'])
assert.deepEqual(implementation.bridgeRefs?.checksumRefs, ['checksum_ref_mock_qwen_queue_001'])
assert.deepEqual(implementation.bridgeRefs?.structuredFindingIds, ['finding_mock_qwen_queue_001'])
assert.deepEqual(implementation.bridgeRefs?.editIntentIds, ['intent_mock_qwen_queue_001'])

const defaultBridge = runQwen25VlControlledPersistedJobLeaseBridge()
assert.equal(defaultBridge.status, 'blocked_private_invoke_transport_preview_only')
assert.equal(defaultBridge.runtimeFlags.persistedJobReferenceCreated, true)
assert.equal(defaultBridge.runtimeFlags.persistedLeaseReferenceCreated, true)
assert.equal(defaultBridge.runtimeFlags.backendRuntimeMessageReferenceCreated, true)
assert.equal(defaultBridge.runtimeFlags.workerClaimReferenceCreated, true)
assert.equal(defaultBridge.runtimeFlags.privateInvokeEnvelopeChecked, true)
assert.equal(defaultBridge.runtimeFlags.privateInvokeTransportPreviewChecked, true)
assert.equal(defaultBridge.runtimeFlags.mockRecordsStoredInMemoryOnly, true)
assertFalseRuntimeFlags(defaultBridge.runtimeFlags as unknown as JsonRecord)

const conflictBridge = runQwen25VlControlledPersistedJobLeaseBridge({ forceIdempotencyConflict: true })
assert.equal(conflictBridge.status, 'blocked_idempotency_conflict')
assert.equal(conflictBridge.runtimeFlags.persistedJobReferenceCreated, false)
assertFalseRuntimeFlags(conflictBridge.runtimeFlags as unknown as JsonRecord)

const missingApprovedSnapshot = clone(
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
) as JsonRecord
delete missingApprovedSnapshot.approvedPlanSnapshotId
const missingApprovedPayload = missingApprovedSnapshot.payloadJson as JsonRecord
delete missingApprovedPayload.approvedPlanSnapshotId
assert.equal(
  runQwen25VlControlledPersistedJobLeaseBridge({ queueFixture: missingApprovedSnapshot }).status,
  'blocked_missing_approved_snapshot',
)

const missingCreditReservation = clone(
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
) as JsonRecord
delete missingCreditReservation.creditReservationId
const missingCreditPayload = missingCreditReservation.payloadJson as JsonRecord
delete missingCreditPayload.creditReservationId
assert.equal(
  runQwen25VlControlledPersistedJobLeaseBridge({ queueFixture: missingCreditReservation }).status,
  'blocked_missing_credit_reservation',
)

const missingSourceRefs = clone(
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.validQueueFixture,
) as JsonRecord
const missingSourcePayload = missingSourceRefs.payloadJson as JsonRecord
missingSourcePayload.sourceOfTruthRefs = {}
assert.equal(
  runQwen25VlControlledPersistedJobLeaseBridge({ queueFixture: missingSourceRefs }).status,
  'blocked_missing_source_of_truth_refs',
)

assert.equal(
  runQwen25VlControlledPersistedJobLeaseBridge({ queueFixture: { workerType: 'qwen2_5_vl_cloud_run_gpu_worker' } }).status,
  'blocked_invalid_worker_job_schema',
)

const forbiddenFindings = scanValues({
  implementation,
  defaultBridge,
  conflictBridge,
  contract: QWEN2_5_VL_CONTROLLED_PERSISTED_JOB_LEASE_BRIDGE_CONTRACT,
})
assert.deepEqual(
  forbiddenFindings,
  [],
  `Forbidden values in Qwen bridge implementation data: ${forbiddenFindings.join('; ')}`,
)

console.log(JSON.stringify({
  ok: true,
  decision: DECISION,
  bridgeImplementedFailClosed: true,
  defaultStatus: defaultBridge.status,
  idempotencyConflictStatus: conflictBridge.status,
  privateInvokeTransportPreviewChecked: defaultBridge.runtimeFlags.privateInvokeTransportPreviewChecked,
  inferenceRun: defaultBridge.runtimeFlags.inferenceRun,
  generatedAssetsCreated: defaultBridge.runtimeFlags.generatedAssetsCreated,
  nextPrompt: NEXT_PROMPT,
}, null, 2))
