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
  buildGpacMp4boxPrivateArtifactManifestEntry,
  buildGpacMp4boxPrivateArtifactManifestMockInput,
  validateGpacMp4boxPrivateArtifactManifestMockInput,
} from '../../src/backend/contracts/gpac-mp4box-private-artifact-manifest-mock-contracts'
import {
  buildGpacMp4boxMockWorkerRouteIdempotencyKey,
  type GpacMp4boxCommandTemplateId,
  type GpacMp4boxMockWorkerJobEnvelope,
} from '../../src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts'
import { createMockDatabase } from '../../src/backend/mock/mock-database'

const now = new Date('2026-06-29T00:00:00.000Z').toISOString()
const commandTemplateId: GpacMp4boxCommandTemplateId = 'mp4box_package_validation_metadata_v1'
const routeIdempotencyBasis = {
  workspaceId: 'workspace-gpac-artifact-manifest-smoke',
  projectId: 'project-gpac-artifact-manifest-smoke',
  approvedSnapshotId: 'approved-snapshot-gpac-artifact-manifest-smoke',
  jobId: 'job-gpac-artifact-manifest-smoke',
  commandTemplateId,
}

const workerEnvelope: GpacMp4boxMockWorkerJobEnvelope = {
  lane: 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1',
  approvedSnapshotRef: { id: routeIdempotencyBasis.approvedSnapshotId, status: 'approved' },
  approvalRecordRef: { id: 'approval-record-gpac-artifact-manifest-smoke', status: 'approved' },
  jobRef: { id: routeIdempotencyBasis.jobId, status: 'planned' },
  workerLeaseRef: { id: 'lease-gpac-artifact-manifest-smoke', status: 'active', leaseStatus: 'active' },
  routeIdempotencyKey: buildGpacMp4boxMockWorkerRouteIdempotencyKey(routeIdempotencyBasis),
  sourceSequenceMapRef: { id: 'source-sequence-map-gpac-artifact-manifest-smoke', status: 'approved' },
  compiledIntentRef: { id: 'compiled-intent-gpac-artifact-manifest-smoke', status: 'approved' },
  modelRoutingPolicyRef: { id: 'model-routing-policy-gpac-artifact-manifest-smoke', status: 'approved' },
  qaPolicyRef: {
    id: 'qa-policy-gpac-artifact-manifest-smoke',
    requiredChecks: ['manifest_integrity', 'checksum_match', 'mp4box_stdout_bounded', 'cleanup_verified'],
    blocksPreview: true,
    blocksFinalExport: true,
  },
  privateInputManifestRef: {
    id: 'private-input-manifest-gpac-artifact-manifest-smoke',
    sourceClass: 'generated_fixture',
    storageObjectPath: 'workspaces/workspace-gpac-artifact-manifest-smoke/projects/project-gpac-artifact-manifest-smoke/private/generated-subtitle.srt',
    checksumSha256: 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8',
    byteCount: 73,
    sourceOfTruth: true,
    privateArtifact: true,
  },
  privateArtifactManifestRef: {
    id: 'private-artifact-manifest-gpac-artifact-manifest-smoke',
    storageObjectPrefix: 'workspaces/workspace-gpac-artifact-manifest-smoke/projects/project-gpac-artifact-manifest-smoke/private/gpac-mp4box/',
    expectedOutputFileNames: ['validation-report.json', 'artifact-manifest.json'],
    expectedChecksumAlgorithm: 'sha256',
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
  },
  privateArtifactChecksumRef: { id: 'checksum-gpac-artifact-manifest-smoke', status: 'planned' },
  toolRuntimePolicyRef: { id: 'tool-runtime-policy-gpac-artifact-manifest-smoke', status: 'approved' },
  gpacMp4boxWorkerContractRef: { id: 'worker-contract-gpac-artifact-manifest-smoke', status: 'approved' },
  gpacMp4boxRouteContractRef: { id: 'route-contract-gpac-artifact-manifest-smoke', status: 'approved' },
  cleanupPolicyRef: {
    id: 'cleanup-policy-gpac-artifact-manifest-smoke',
    status: 'approved',
    cleanupStatus: 'cleanup_required',
    tempArtifactScope: 'worker_temp_only',
  },
  auditRecordRef: { id: 'audit-record-gpac-artifact-manifest-smoke', status: 'planned' },
  commandTemplateId,
  createdAt: now,
  executionMode: 'mock_contract_only',
  runtimeExecution: false,
  workerExecution: false,
  routeExecution: false,
}

const routeRequest = buildGpacMp4boxGuardedServiceRoleRouteMockRequest({
  workerEnvelope,
  creditReservationRef: { id: 'credit-reservation-gpac-artifact-manifest-smoke', status: 'approved' },
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

const manifestEntries = [
  buildGpacMp4boxPrivateArtifactManifestEntry({
    entryId: 'artifact-entry-validation-report',
    fileName: 'validation-report.json',
    artifactKind: 'validation_report_json',
    byteCount: 412,
    checksumSha256: 'e31c57b9b47054acdc67efac18e87fbfae2d5a1504367e8ed813b01d24ef28b9',
  }),
  buildGpacMp4boxPrivateArtifactManifestEntry({
    entryId: 'artifact-entry-manifest',
    fileName: 'artifact-manifest.json',
    artifactKind: 'artifact_manifest_json',
    byteCount: 529,
    checksumSha256: 'f83bb12d827a9e7b0d44c6bb578ed09a02f5a1c1bdcf29b620fb5b2800439468',
  }),
]

const manifestInput = buildGpacMp4boxPrivateArtifactManifestMockInput({
  policyInput,
  createdAt: now,
  manifestEntries,
})

const manifest = validateGpacMp4boxPrivateArtifactManifestMockInput(manifestInput)
assert.equal(manifest.ok, true, manifest.sanitizedSummary)
assert.equal(manifest.manifestStatus, 'manifest_registered_metadata_only')
assert.equal(manifest.manifestId, 'artifactManifest.gpacMp4box.private.mock')
assert.equal(manifest.sanitizedManifest.entryCount, 2)
assert.equal(manifest.sanitizedManifest.totalByteCount, 941)
assert.equal(manifest.sanitizedManifest.storageTransfer, false)
assert.equal(manifest.sanitizedManifest.signedUrlCreation, false)
assert.equal(manifest.sanitizedManifest.publicArtifactCreation, false)
assert.equal(manifest.sanitizedManifest.workerExecution, false)
assert.equal(manifest.sanitizedManifest.gpacMp4boxExecution, false)

const badChecksum = validateGpacMp4boxPrivateArtifactManifestMockInput({
  ...manifestInput,
  manifestEntries: [
    {
      ...manifestEntries[0],
      checksumSha256: 'not-a-sha',
    },
  ],
})
assert.equal(badChecksum.ok, false)
assert.ok(badChecksum.blockers.includes('blocked_manifest_entry_checksum_invalid'))

const publicEntry = validateGpacMp4boxPrivateArtifactManifestMockInput({
  ...manifestInput,
  manifestEntries: [
    {
      ...manifestEntries[0],
      publicArtifact: true,
    } as unknown as typeof manifestEntries[number],
  ],
})
assert.equal(publicEntry.ok, false)
assert.ok(publicEntry.blockers.includes('blocked_manifest_entry_not_private'))

const storageAttempt = validateGpacMp4boxPrivateArtifactManifestMockInput({
  ...manifestInput,
  storageTransfer: true,
} as unknown as typeof manifestInput)
assert.equal(storageAttempt.ok, false)
assert.ok(storageAttempt.blockers.includes('blocked_storage_or_public_delivery_attempt'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'manifest_input_validates',
    'manifest_registered_metadata_only',
    'checksum_invalid_blocks',
    'public_entry_blocks',
    'storage_transfer_attempt_blocks',
    'no_tool_or_media_execution_enabled',
  ],
  manifestStatus: manifest.manifestStatus,
  nextRequiredGate: manifest.nextRequiredGate,
}, null, 2))
