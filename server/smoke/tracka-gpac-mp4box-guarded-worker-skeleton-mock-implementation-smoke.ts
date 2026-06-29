import assert from 'node:assert/strict'
import {
  buildGpacMp4boxGuardedServiceRoleRouteMockRequest,
} from '../../src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts'
import {
  buildGpacMp4boxGuardedWorkerEnqueueMockInput,
  enqueueGpacMp4boxGuardedWorkerMock,
} from '../../src/backend/contracts/gpac-mp4box-guarded-worker-enqueue-mock-contracts'
import {
  buildGpacMp4boxGuardedWorkerSkeletonMockInput,
  validateGpacMp4boxGuardedWorkerSkeletonMockInput,
} from '../../src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts'
import {
  buildGpacMp4boxMockWorkerRouteIdempotencyKey,
  type GpacMp4boxCommandTemplateId,
  type GpacMp4boxMockWorkerJobEnvelope,
} from '../../src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts'
import { createMockDatabase } from '../../src/backend/mock/mock-database'

const now = new Date('2026-06-29T00:00:00.000Z').toISOString()
const commandTemplateId: GpacMp4boxCommandTemplateId = 'mp4box_package_validation_metadata_v1'
const routeIdempotencyBasis = {
  workspaceId: 'workspace-gpac-skeleton-smoke',
  projectId: 'project-gpac-skeleton-smoke',
  approvedSnapshotId: 'approved-snapshot-gpac-skeleton-smoke',
  jobId: 'job-gpac-skeleton-smoke',
  commandTemplateId,
}

const workerEnvelope: GpacMp4boxMockWorkerJobEnvelope = {
  lane: 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1',
  approvedSnapshotRef: { id: routeIdempotencyBasis.approvedSnapshotId, status: 'approved' },
  approvalRecordRef: { id: 'approval-record-gpac-skeleton-smoke', status: 'approved' },
  jobRef: { id: routeIdempotencyBasis.jobId, status: 'planned' },
  workerLeaseRef: { id: 'lease-gpac-skeleton-smoke', status: 'active', leaseStatus: 'active' },
  routeIdempotencyKey: buildGpacMp4boxMockWorkerRouteIdempotencyKey(routeIdempotencyBasis),
  sourceSequenceMapRef: { id: 'source-sequence-map-gpac-skeleton-smoke', status: 'approved' },
  compiledIntentRef: { id: 'compiled-intent-gpac-skeleton-smoke', status: 'approved' },
  modelRoutingPolicyRef: { id: 'model-routing-policy-gpac-skeleton-smoke', status: 'approved' },
  qaPolicyRef: {
    id: 'qa-policy-gpac-skeleton-smoke',
    requiredChecks: ['manifest_integrity', 'checksum_match', 'mp4box_stdout_bounded', 'cleanup_verified'],
    blocksPreview: true,
    blocksFinalExport: true,
  },
  privateInputManifestRef: {
    id: 'private-input-manifest-gpac-skeleton-smoke',
    sourceClass: 'generated_fixture',
    storageObjectPath: 'workspaces/workspace-gpac-skeleton-smoke/projects/project-gpac-skeleton-smoke/private/generated-subtitle.srt',
    checksumSha256: 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8',
    byteCount: 73,
    sourceOfTruth: true,
    privateArtifact: true,
  },
  privateArtifactManifestRef: {
    id: 'private-artifact-manifest-gpac-skeleton-smoke',
    storageObjectPrefix: 'workspaces/workspace-gpac-skeleton-smoke/projects/project-gpac-skeleton-smoke/private/gpac-mp4box/',
    expectedOutputFileNames: ['validation-report.json', 'artifact-manifest.json'],
    expectedChecksumAlgorithm: 'sha256',
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
  },
  privateArtifactChecksumRef: { id: 'checksum-gpac-skeleton-smoke', status: 'planned' },
  toolRuntimePolicyRef: { id: 'tool-runtime-policy-gpac-skeleton-smoke', status: 'approved' },
  gpacMp4boxWorkerContractRef: { id: 'worker-contract-gpac-skeleton-smoke', status: 'approved' },
  gpacMp4boxRouteContractRef: { id: 'route-contract-gpac-skeleton-smoke', status: 'approved' },
  cleanupPolicyRef: {
    id: 'cleanup-policy-gpac-skeleton-smoke',
    status: 'approved',
    cleanupStatus: 'cleanup_required',
    tempArtifactScope: 'worker_temp_only',
  },
  auditRecordRef: { id: 'audit-record-gpac-skeleton-smoke', status: 'planned' },
  commandTemplateId,
  createdAt: now,
  executionMode: 'mock_contract_only',
  runtimeExecution: false,
  workerExecution: false,
  routeExecution: false,
}

const routeRequest = buildGpacMp4boxGuardedServiceRoleRouteMockRequest({
  workerEnvelope,
  creditReservationRef: { id: 'credit-reservation-gpac-skeleton-smoke', status: 'approved' },
  routeIdempotencyBasis,
  createdAt: now,
})

const enqueueResult = enqueueGpacMp4boxGuardedWorkerMock(createMockDatabase(), buildGpacMp4boxGuardedWorkerEnqueueMockInput({
  routeRequest,
  createdAt: now,
}))

assert.equal(enqueueResult.ok, true, enqueueResult.sanitizedSummary)

const skeletonInput = buildGpacMp4boxGuardedWorkerSkeletonMockInput({
  enqueueResult,
  createdAt: now,
})

const skeleton = validateGpacMp4boxGuardedWorkerSkeletonMockInput(skeletonInput)
assert.equal(skeleton.ok, true, skeleton.sanitizedSummary)
assert.equal(skeleton.skeletonStatus, 'registered_disabled_mock_worker_skeleton')
assert.equal(skeleton.skeletonId, 'worker.gpacMp4box.packageValidation.mock')
assert.equal(skeleton.sanitizedPayload.workerSkeletonEnabled, false)
assert.equal(skeleton.sanitizedPayload.workerDispatchAttempted, false)
assert.equal(skeleton.sanitizedPayload.workerExecution, false)
assert.equal(skeleton.sanitizedPayload.gpacMp4boxExecution, false)
assert.equal(skeleton.sanitizedPayload.mediaProcessing, false)
assert.equal(skeleton.sanitizedPayload.storageTransfer, false)
assert.equal(skeleton.sanitizedPayload.publicArtifactCreation, false)
assert.equal(skeleton.queueItem?.queueStatus, 'queued')

const executionAttempt = validateGpacMp4boxGuardedWorkerSkeletonMockInput({
  ...skeletonInput,
  workerSkeletonEnabled: true,
  workerDispatchAttempted: true,
  workerExecution: true,
} as unknown as typeof skeletonInput)
assert.equal(executionAttempt.ok, false)
assert.ok(executionAttempt.blockers.includes('blocked_worker_execution_not_enabled'))

const mutatedQueue = validateGpacMp4boxGuardedWorkerSkeletonMockInput({
  ...skeletonInput,
  enqueueResult: {
    ...enqueueResult,
    queueItem: {
      ...enqueueResult.queueItem!,
      queueStatus: 'running',
    },
  },
})
assert.equal(mutatedQueue.ok, false)
assert.ok(mutatedQueue.blockers.includes('blocked_queue_item_not_queued'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'skeleton_input_validates',
    'skeleton_registered_disabled',
    'worker_dispatch_attempt_blocks',
    'non_queued_item_blocks',
    'no_tool_or_media_execution_enabled',
  ],
  skeletonStatus: skeleton.skeletonStatus,
  nextRequiredGate: skeleton.nextRequiredGate,
}, null, 2))
