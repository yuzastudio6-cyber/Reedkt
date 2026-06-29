import assert from 'node:assert/strict'
import { buildGpacMp4boxGuardedServiceRoleRouteMockRequest } from '../../src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts'
import {
  buildGpacMp4boxGuardedWorkerEnqueueMockInput,
  enqueueGpacMp4boxGuardedWorkerMock,
} from '../../src/backend/contracts/gpac-mp4box-guarded-worker-enqueue-mock-contracts'
import { buildGpacMp4boxGuardedWorkerSkeletonMockInput } from '../../src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts'
import {
  buildGpacMp4boxPrivateArtifactPolicyMockInput,
  validateGpacMp4boxPrivateArtifactPolicyMockInput,
} from '../../src/backend/contracts/gpac-mp4box-private-artifact-policy-mock-contracts'
import {
  buildGpacMp4boxMockWorkerRouteIdempotencyKey,
  type GpacMp4boxCommandTemplateId,
  type GpacMp4boxMockWorkerJobEnvelope,
} from '../../src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts'
import { createMockDatabase } from '../../src/backend/mock/mock-database'

const now = new Date('2026-06-29T00:00:00.000Z').toISOString()
const commandTemplateId: GpacMp4boxCommandTemplateId = 'mp4box_package_validation_metadata_v1'
const routeIdempotencyBasis = {
  workspaceId: 'workspace-gpac-artifact-policy-smoke',
  projectId: 'project-gpac-artifact-policy-smoke',
  approvedSnapshotId: 'approved-snapshot-gpac-artifact-policy-smoke',
  jobId: 'job-gpac-artifact-policy-smoke',
  commandTemplateId,
}

const workerEnvelope: GpacMp4boxMockWorkerJobEnvelope = {
  lane: 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1',
  approvedSnapshotRef: { id: routeIdempotencyBasis.approvedSnapshotId, status: 'approved' },
  approvalRecordRef: { id: 'approval-record-gpac-artifact-policy-smoke', status: 'approved' },
  jobRef: { id: routeIdempotencyBasis.jobId, status: 'planned' },
  workerLeaseRef: { id: 'lease-gpac-artifact-policy-smoke', status: 'active', leaseStatus: 'active' },
  routeIdempotencyKey: buildGpacMp4boxMockWorkerRouteIdempotencyKey(routeIdempotencyBasis),
  sourceSequenceMapRef: { id: 'source-sequence-map-gpac-artifact-policy-smoke', status: 'approved' },
  compiledIntentRef: { id: 'compiled-intent-gpac-artifact-policy-smoke', status: 'approved' },
  modelRoutingPolicyRef: { id: 'model-routing-policy-gpac-artifact-policy-smoke', status: 'approved' },
  qaPolicyRef: {
    id: 'qa-policy-gpac-artifact-policy-smoke',
    requiredChecks: ['manifest_integrity', 'checksum_match', 'mp4box_stdout_bounded', 'cleanup_verified'],
    blocksPreview: true,
    blocksFinalExport: true,
  },
  privateInputManifestRef: {
    id: 'private-input-manifest-gpac-artifact-policy-smoke',
    sourceClass: 'generated_fixture',
    storageObjectPath: 'workspaces/workspace-gpac-artifact-policy-smoke/projects/project-gpac-artifact-policy-smoke/private/generated-subtitle.srt',
    checksumSha256: 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8',
    byteCount: 73,
    sourceOfTruth: true,
    privateArtifact: true,
  },
  privateArtifactManifestRef: {
    id: 'private-artifact-manifest-gpac-artifact-policy-smoke',
    storageObjectPrefix: 'workspaces/workspace-gpac-artifact-policy-smoke/projects/project-gpac-artifact-policy-smoke/private/gpac-mp4box/',
    expectedOutputFileNames: ['validation-report.json', 'artifact-manifest.json'],
    expectedChecksumAlgorithm: 'sha256',
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
  },
  privateArtifactChecksumRef: { id: 'checksum-gpac-artifact-policy-smoke', status: 'planned' },
  toolRuntimePolicyRef: { id: 'tool-runtime-policy-gpac-artifact-policy-smoke', status: 'approved' },
  gpacMp4boxWorkerContractRef: { id: 'worker-contract-gpac-artifact-policy-smoke', status: 'approved' },
  gpacMp4boxRouteContractRef: { id: 'route-contract-gpac-artifact-policy-smoke', status: 'approved' },
  cleanupPolicyRef: {
    id: 'cleanup-policy-gpac-artifact-policy-smoke',
    status: 'approved',
    cleanupStatus: 'cleanup_required',
    tempArtifactScope: 'worker_temp_only',
  },
  auditRecordRef: { id: 'audit-record-gpac-artifact-policy-smoke', status: 'planned' },
  commandTemplateId,
  createdAt: now,
  executionMode: 'mock_contract_only',
  runtimeExecution: false,
  workerExecution: false,
  routeExecution: false,
}

const routeRequest = buildGpacMp4boxGuardedServiceRoleRouteMockRequest({
  workerEnvelope,
  creditReservationRef: { id: 'credit-reservation-gpac-artifact-policy-smoke', status: 'approved' },
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

const policyInput = buildGpacMp4boxPrivateArtifactPolicyMockInput({
  skeletonInput,
  createdAt: now,
})

const policy = validateGpacMp4boxPrivateArtifactPolicyMockInput(policyInput)
assert.equal(policy.ok, true, policy.sanitizedSummary)
assert.equal(policy.policyStatus, 'policy_registered_metadata_only')
assert.equal(policy.policyId, 'artifactPolicy.gpacMp4box.private.mock')
assert.equal(policy.sanitizedPolicy.storageAccessMode, 'metadata_only_no_storage_transfer')
assert.equal(policy.sanitizedPolicy.artifactScope, 'worker_temp_private_only')
assert.equal(policy.sanitizedPolicy.checksumAlgorithm, 'sha256')
assert.equal(policy.sanitizedPolicy.storageTransfer, false)
assert.equal(policy.sanitizedPolicy.signedUrlCreation, false)
assert.equal(policy.sanitizedPolicy.publicArtifactCreation, false)
assert.equal(policy.sanitizedPolicy.workerExecution, false)
assert.equal(policy.sanitizedPolicy.gpacMp4boxExecution, false)

const storageAttempt = validateGpacMp4boxPrivateArtifactPolicyMockInput({
  ...policyInput,
  storageTransfer: true,
  storageAccessMode: 'metadata_only_no_storage_transfer',
} as unknown as typeof policyInput)
assert.equal(storageAttempt.ok, false)
assert.ok(storageAttempt.blockers.includes('blocked_storage_transfer_not_enabled'))

const publicArtifactAttempt = validateGpacMp4boxPrivateArtifactPolicyMockInput({
  ...policyInput,
  signedUrlCreation: true,
  publicArtifactCreation: true,
} as unknown as typeof policyInput)
assert.equal(publicArtifactAttempt.ok, false)
assert.ok(publicArtifactAttempt.blockers.includes('blocked_public_or_signed_artifact_attempt'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'policy_input_validates',
    'policy_registered_metadata_only',
    'storage_transfer_attempt_blocks',
    'public_artifact_attempt_blocks',
    'no_tool_or_media_execution_enabled',
  ],
  policyStatus: policy.policyStatus,
  nextRequiredGate: policy.nextRequiredGate,
}, null, 2))
