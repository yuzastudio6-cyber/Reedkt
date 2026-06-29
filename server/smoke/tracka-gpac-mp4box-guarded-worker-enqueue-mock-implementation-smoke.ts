import assert from 'node:assert/strict'
import {
  buildGpacMp4boxGuardedServiceRoleRouteMockRequest,
  type GpacMp4boxGuardedServiceRoleRouteMockRequest,
} from '../../src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts'
import {
  buildGpacMp4boxGuardedWorkerEnqueueMockInput,
  enqueueGpacMp4boxGuardedWorkerMock,
  validateGpacMp4boxGuardedWorkerEnqueueMockInput,
} from '../../src/backend/contracts/gpac-mp4box-guarded-worker-enqueue-mock-contracts'
import {
  buildGpacMp4boxMockWorkerRouteIdempotencyKey,
  type GpacMp4boxCommandTemplateId,
  type GpacMp4boxMockWorkerJobEnvelope,
} from '../../src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts'
import { createMockDatabase } from '../../src/backend/mock/mock-database'

const now = new Date('2026-06-29T00:00:00.000Z').toISOString()
const commandTemplateId: GpacMp4boxCommandTemplateId = 'mp4box_package_validation_metadata_v1'
const routeIdempotencyBasis = {
  workspaceId: 'workspace-gpac-enqueue-smoke',
  projectId: 'project-gpac-enqueue-smoke',
  approvedSnapshotId: 'approved-snapshot-gpac-enqueue-smoke',
  jobId: 'job-gpac-enqueue-smoke',
  commandTemplateId,
}

const workerEnvelope: GpacMp4boxMockWorkerJobEnvelope = {
  lane: 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1',
  approvedSnapshotRef: { id: routeIdempotencyBasis.approvedSnapshotId, status: 'approved' },
  approvalRecordRef: { id: 'approval-record-gpac-enqueue-smoke', status: 'approved' },
  jobRef: { id: routeIdempotencyBasis.jobId, status: 'planned' },
  workerLeaseRef: { id: 'lease-gpac-enqueue-smoke', status: 'active', leaseStatus: 'active' },
  routeIdempotencyKey: buildGpacMp4boxMockWorkerRouteIdempotencyKey(routeIdempotencyBasis),
  sourceSequenceMapRef: { id: 'source-sequence-map-gpac-enqueue-smoke', status: 'approved' },
  compiledIntentRef: { id: 'compiled-intent-gpac-enqueue-smoke', status: 'approved' },
  modelRoutingPolicyRef: { id: 'model-routing-policy-gpac-enqueue-smoke', status: 'approved' },
  qaPolicyRef: {
    id: 'qa-policy-gpac-enqueue-smoke',
    requiredChecks: ['manifest_integrity', 'checksum_match', 'mp4box_stdout_bounded', 'cleanup_verified'],
    blocksPreview: true,
    blocksFinalExport: true,
  },
  privateInputManifestRef: {
    id: 'private-input-manifest-gpac-enqueue-smoke',
    sourceClass: 'generated_fixture',
    storageObjectPath: 'workspaces/workspace-gpac-enqueue-smoke/projects/project-gpac-enqueue-smoke/private/generated-subtitle.srt',
    checksumSha256: 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8',
    byteCount: 73,
    sourceOfTruth: true,
    privateArtifact: true,
  },
  privateArtifactManifestRef: {
    id: 'private-artifact-manifest-gpac-enqueue-smoke',
    storageObjectPrefix: 'workspaces/workspace-gpac-enqueue-smoke/projects/project-gpac-enqueue-smoke/private/gpac-mp4box/',
    expectedOutputFileNames: ['validation-report.json', 'artifact-manifest.json'],
    expectedChecksumAlgorithm: 'sha256',
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
  },
  privateArtifactChecksumRef: { id: 'checksum-gpac-enqueue-smoke', status: 'planned' },
  toolRuntimePolicyRef: { id: 'tool-runtime-policy-gpac-enqueue-smoke', status: 'approved' },
  gpacMp4boxWorkerContractRef: { id: 'worker-contract-gpac-enqueue-smoke', status: 'approved' },
  gpacMp4boxRouteContractRef: { id: 'route-contract-gpac-enqueue-smoke', status: 'approved' },
  cleanupPolicyRef: {
    id: 'cleanup-policy-gpac-enqueue-smoke',
    status: 'approved',
    cleanupStatus: 'cleanup_required',
    tempArtifactScope: 'worker_temp_only',
  },
  auditRecordRef: { id: 'audit-record-gpac-enqueue-smoke', status: 'planned' },
  commandTemplateId,
  createdAt: now,
  executionMode: 'mock_contract_only',
  runtimeExecution: false,
  workerExecution: false,
  routeExecution: false,
}

const routeRequest = buildGpacMp4boxGuardedServiceRoleRouteMockRequest({
  workerEnvelope,
  creditReservationRef: { id: 'credit-reservation-gpac-enqueue-smoke', status: 'approved' },
  routeIdempotencyBasis,
  createdAt: now,
})

const enqueueInput = buildGpacMp4boxGuardedWorkerEnqueueMockInput({
  routeRequest,
  createdAt: now,
})

const validation = validateGpacMp4boxGuardedWorkerEnqueueMockInput(enqueueInput)
assert.equal(validation.ok, true, validation.sanitizedSummary)
assert.equal(validation.enqueueStatus, 'queued_mock_contract_only')
assert.deepEqual(validation.blockers, [])
assert.equal(validation.sanitizedPayload.workerExecution, false)
assert.equal(validation.sanitizedPayload.gpacMp4boxExecution, false)
assert.equal(validation.sanitizedPayload.storageTransfer, false)
assert.equal(validation.sanitizedPayload.publicArtifactCreation, false)

const result = enqueueGpacMp4boxGuardedWorkerMock(createMockDatabase(), enqueueInput)
assert.equal(result.ok, true, result.sanitizedSummary)
assert.equal(result.enqueueStatus, 'queued_mock_contract_only')
assert.ok(result.queueItem, 'queue item must be created')
assert.equal(result.queueItem.queueStatus, 'queued')
assert.equal(result.queueItem.workerKind, 'render_export')
assert.equal(result.queueItem.mockOnly, true)
assert.equal(result.queueItem.payload.mockOnly, true)
assert.equal(result.queueItem.payload.workerExecution, false)
assert.equal(result.queueItem.payload.gpacMp4boxExecution, false)
assert.equal(result.queueItem.payload.storageTransfer, false)
assert.equal(result.queueItem.payload.publicArtifactCreation, false)
assert.equal(result.queueItem.payload.routeIdempotencyKey, workerEnvelope.routeIdempotencyKey)
assert.equal(result.queueItem.payload.commandTemplateId, commandTemplateId)
assert.equal(Object.keys(result.queueItem.payload).some((key) => /secret|token|password/i.test(key)), false)

const executionAttempt = validateGpacMp4boxGuardedWorkerEnqueueMockInput({
  ...enqueueInput,
  workerDispatchAttempted: true,
  workerExecution: true,
} as unknown as typeof enqueueInput)
assert.equal(executionAttempt.ok, false)
assert.ok(executionAttempt.blockers.includes('blocked_worker_execution_not_enabled'))

const missingCreditRoute: GpacMp4boxGuardedServiceRoleRouteMockRequest = {
  ...routeRequest,
  creditReservationRef: { id: '', status: 'planned' },
}
const missingCredit = validateGpacMp4boxGuardedWorkerEnqueueMockInput({
  ...enqueueInput,
  routeRequest: missingCreditRoute,
})
assert.equal(missingCredit.ok, false)
assert.ok(missingCredit.blockers.includes('blocked_route_mock_contract_invalid'))

const idempotencyMismatch = validateGpacMp4boxGuardedWorkerEnqueueMockInput({
  ...enqueueInput,
  routeRequest: {
    ...routeRequest,
    workerEnvelope: {
      ...routeRequest.workerEnvelope,
      routeIdempotencyKey: 'wrong-key',
    },
  },
})
assert.equal(idempotencyMismatch.ok, false)
assert.ok(idempotencyMismatch.blockers.includes('blocked_idempotency_mismatch'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'enqueue_input_validates',
    'mock_queue_item_created',
    'queue_payload_sanitized_refs_only',
    'execution_attempt_blocks',
    'missing_credit_blocks',
    'idempotency_mismatch_blocks',
  ],
  queueStatus: result.queueItem.queueStatus,
  nextRequiredGate: result.nextRequiredGate,
}, null, 2))
