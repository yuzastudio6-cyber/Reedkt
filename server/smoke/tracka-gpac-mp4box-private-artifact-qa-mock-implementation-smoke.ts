import assert from 'node:assert/strict'
import { buildGpacMp4boxGuardedServiceRoleRouteMockRequest } from '../../src/backend/contracts/gpac-mp4box-guarded-service-role-route-mock-contracts'
import {
  buildGpacMp4boxGuardedWorkerEnqueueMockInput,
  enqueueGpacMp4boxGuardedWorkerMock,
} from '../../src/backend/contracts/gpac-mp4box-guarded-worker-enqueue-mock-contracts'
import { buildGpacMp4boxGuardedWorkerSkeletonMockInput } from '../../src/backend/contracts/gpac-mp4box-guarded-worker-skeleton-mock-contracts'
import { buildGpacMp4boxPrivateArtifactPolicyMockInput } from '../../src/backend/contracts/gpac-mp4box-private-artifact-policy-mock-contracts'
import {
  buildGpacMp4boxPrivateArtifactManifestEntry,
  buildGpacMp4boxPrivateArtifactManifestMockInput,
  validateGpacMp4boxPrivateArtifactManifestMockInput,
} from '../../src/backend/contracts/gpac-mp4box-private-artifact-manifest-mock-contracts'
import {
  buildGpacMp4boxPrivateArtifactQaMockInput,
  validateGpacMp4boxPrivateArtifactQaMockInput,
} from '../../src/backend/contracts/gpac-mp4box-private-artifact-qa-mock-contracts'
import {
  buildGpacMp4boxMockWorkerRouteIdempotencyKey,
  type GpacMp4boxCommandTemplateId,
  type GpacMp4boxMockWorkerJobEnvelope,
} from '../../src/backend/contracts/gpac-mp4box-mock-worker-interface-contracts'
import { createMockDatabase } from '../../src/backend/mock/mock-database'

const now = new Date('2026-06-29T00:00:00.000Z').toISOString()
const commandTemplateId: GpacMp4boxCommandTemplateId = 'mp4box_package_validation_metadata_v1'
const routeIdempotencyBasis = {
  workspaceId: 'workspace-gpac-artifact-qa-smoke',
  projectId: 'project-gpac-artifact-qa-smoke',
  approvedSnapshotId: 'approved-snapshot-gpac-artifact-qa-smoke',
  jobId: 'job-gpac-artifact-qa-smoke',
  commandTemplateId,
}

const workerEnvelope: GpacMp4boxMockWorkerJobEnvelope = {
  lane: 'TRACKA-GPAC-MP4BOX-MOCK-WORKER-INTERFACE-1',
  approvedSnapshotRef: { id: routeIdempotencyBasis.approvedSnapshotId, status: 'approved' },
  approvalRecordRef: { id: 'approval-record-gpac-artifact-qa-smoke', status: 'approved' },
  jobRef: { id: routeIdempotencyBasis.jobId, status: 'planned' },
  workerLeaseRef: { id: 'lease-gpac-artifact-qa-smoke', status: 'active', leaseStatus: 'active' },
  routeIdempotencyKey: buildGpacMp4boxMockWorkerRouteIdempotencyKey(routeIdempotencyBasis),
  sourceSequenceMapRef: { id: 'source-sequence-map-gpac-artifact-qa-smoke', status: 'approved' },
  compiledIntentRef: { id: 'compiled-intent-gpac-artifact-qa-smoke', status: 'approved' },
  modelRoutingPolicyRef: { id: 'model-routing-policy-gpac-artifact-qa-smoke', status: 'approved' },
  qaPolicyRef: {
    id: 'qa-policy-gpac-artifact-qa-smoke',
    requiredChecks: ['manifest_integrity', 'checksum_match', 'mp4box_stdout_bounded', 'cleanup_verified'],
    blocksPreview: true,
    blocksFinalExport: true,
  },
  privateInputManifestRef: {
    id: 'private-input-manifest-gpac-artifact-qa-smoke',
    sourceClass: 'generated_fixture',
    storageObjectPath: 'workspaces/workspace-gpac-artifact-qa-smoke/projects/project-gpac-artifact-qa-smoke/private/generated-subtitle.srt',
    checksumSha256: 'afc4c7fc017f5d41d817284aa633355d587958416df02a71c0fdd66df7829bb8',
    byteCount: 73,
    sourceOfTruth: true,
    privateArtifact: true,
  },
  privateArtifactManifestRef: {
    id: 'private-artifact-manifest-gpac-artifact-qa-smoke',
    storageObjectPrefix: 'workspaces/workspace-gpac-artifact-qa-smoke/projects/project-gpac-artifact-qa-smoke/private/gpac-mp4box/',
    expectedOutputFileNames: ['validation-report.json', 'artifact-manifest.json'],
    expectedChecksumAlgorithm: 'sha256',
    publicArtifactsAllowed: false,
    signedUrlsAllowed: false,
  },
  privateArtifactChecksumRef: { id: 'checksum-gpac-artifact-qa-smoke', status: 'planned' },
  toolRuntimePolicyRef: { id: 'tool-runtime-policy-gpac-artifact-qa-smoke', status: 'approved' },
  gpacMp4boxWorkerContractRef: { id: 'worker-contract-gpac-artifact-qa-smoke', status: 'approved' },
  gpacMp4boxRouteContractRef: { id: 'route-contract-gpac-artifact-qa-smoke', status: 'approved' },
  cleanupPolicyRef: {
    id: 'cleanup-policy-gpac-artifact-qa-smoke',
    status: 'approved',
    cleanupStatus: 'cleanup_required',
    tempArtifactScope: 'worker_temp_only',
  },
  auditRecordRef: { id: 'audit-record-gpac-artifact-qa-smoke', status: 'planned' },
  commandTemplateId,
  createdAt: now,
  executionMode: 'mock_contract_only',
  runtimeExecution: false,
  workerExecution: false,
  routeExecution: false,
}

const routeRequest = buildGpacMp4boxGuardedServiceRoleRouteMockRequest({
  workerEnvelope,
  creditReservationRef: { id: 'credit-reservation-gpac-artifact-qa-smoke', status: 'approved' },
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

const qaInput = buildGpacMp4boxPrivateArtifactQaMockInput({
  manifestInput,
  createdAt: now,
})
const qa = validateGpacMp4boxPrivateArtifactQaMockInput(qaInput)
assert.equal(qa.ok, true, qa.sanitizedSummary)
assert.equal(qa.qaStatus, 'qa_passed_metadata_only')
assert.equal(qa.qaId, 'qa.gpacMp4box.privateArtifact.mock')
assert.equal(qa.sanitizedQaReport.entryCount, 2)
assert.equal(qa.sanitizedQaReport.totalByteCount, 941)
assert.equal(qa.sanitizedQaReport.requiredChecks.length, 5)
assert.equal(qa.sanitizedQaReport.storageTransfer, false)
assert.equal(qa.sanitizedQaReport.signedUrlCreation, false)
assert.equal(qa.sanitizedQaReport.publicArtifactCreation, false)
assert.equal(qa.sanitizedQaReport.workerExecution, false)
assert.equal(qa.sanitizedQaReport.gpacMp4boxExecution, false)

const missingChecksumCheck = validateGpacMp4boxPrivateArtifactQaMockInput({
  ...qaInput,
  requiredChecks: qaInput.requiredChecks.filter((check) => check !== 'checksum_references'),
})
assert.equal(missingChecksumCheck.ok, false)
assert.ok(missingChecksumCheck.blockers.includes('blocked_checksum_reference_check_failed'))

const storageAttempt = validateGpacMp4boxPrivateArtifactQaMockInput({
  ...qaInput,
  storageTransfer: true,
} as unknown as typeof qaInput)
assert.equal(storageAttempt.ok, false)
assert.ok(storageAttempt.blockers.includes('blocked_storage_or_public_delivery_attempt'))

const toolAttempt = validateGpacMp4boxPrivateArtifactQaMockInput({
  ...qaInput,
  gpacMp4boxExecution: true,
} as unknown as typeof qaInput)
assert.equal(toolAttempt.ok, false)
assert.ok(toolAttempt.blockers.includes('blocked_tool_or_media_execution_not_enabled'))

console.log(JSON.stringify({
  ok: true,
  checks: [
    'qa_input_validates',
    'qa_passed_metadata_only',
    'missing_checksum_check_blocks',
    'storage_transfer_attempt_blocks',
    'tool_execution_attempt_blocks',
    'no_tool_or_media_execution_enabled',
  ],
  qaStatus: qa.qaStatus,
  nextRequiredGate: qa.nextRequiredGate,
}, null, 2))
