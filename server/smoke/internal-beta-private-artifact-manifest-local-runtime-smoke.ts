import assert from 'node:assert/strict'

import {
  createInternalBetaPrivateArtifactManifestLocalRuntime,
  type InternalBetaPrivateArtifactManifestLocalRuntimeInput,
} from '../services/internal-beta-private-artifact-manifest-local-runtime'

const checksumA = 'a'.repeat(64)
const checksumB = 'b'.repeat(64)

function buildInput(
  overrides: Partial<InternalBetaPrivateArtifactManifestLocalRuntimeInput> = {},
): InternalBetaPrivateArtifactManifestLocalRuntimeInput {
  return {
    workspaceId: 'workspace_artifact_local_smoke_001',
    projectId: 'project_artifact_local_smoke_001',
    approvedPlanSnapshotId: 'approved_snapshot_artifact_local_smoke_001',
    jobId: 'job_artifact_local_smoke_001',
    jobBatchId: 'job_batch_artifact_local_smoke_001',
    creditReservationId: 'credit_reservation_artifact_local_smoke_001',
    idempotencyKey: 'idempotency_artifact_local_smoke_001',
    requestedByUserId: 'user_artifact_local_smoke_001',
    artifacts: [
      {
        artifactKind: 'manifest',
        artifactRole: 'private_preview_manifest',
        fileName: 'private-preview-manifest.json',
        byteCount: 320,
        sha256: checksumA,
        linkedJobId: 'job_artifact_local_smoke_001',
        linkedRendererLayerIds: ['layer_001'],
        qaStatus: 'qa_pending',
        cleanupPolicy: 'retain_with_project_private',
      },
      {
        artifactKind: 'qa_report',
        artifactRole: 'private_preview_qa_report',
        fileName: 'private-preview-qa-report.json',
        byteCount: 240,
        sha256: checksumB,
        linkedJobId: 'job_artifact_local_smoke_001',
        qaStatus: 'not_run',
        cleanupPolicy: 'qa_short_retention',
      },
    ],
    metadata: { source: 'internal_beta_private_artifact_manifest_local_runtime_smoke' },
    ...overrides,
  }
}

function assertSafety(result: ReturnType<typeof createInternalBetaPrivateArtifactManifestLocalRuntime>) {
  assert.equal(result.localOnly, true)
  assert.equal(result.persistedToSupabase, false)
  assert.equal(result.safety.routeExecution, false)
  assert.equal(result.safety.remoteSupabaseMutation, false)
  assert.equal(result.safety.sqlExecution, false)
  assert.equal(result.safety.serviceRoleRouteExecution, false)
  assert.equal(result.safety.creditMutation, false)
  assert.equal(result.safety.jobEnqueueExecution, false)
  assert.equal(result.safety.jobEventWriteExecution, false)
  assert.equal(result.safety.workerExecution, false)
  assert.equal(result.safety.workerDispatch, false)
  assert.equal(result.safety.providerModelCall, false)
  assert.equal(result.safety.rawPromptExecution, false)
  assert.equal(result.safety.renderExportExecution, false)
  assert.equal(result.safety.storageObjectCreation, false)
  assert.equal(result.safety.storageObjectRead, false)
  assert.equal(result.safety.signedUrlCreation, false)
  assert.equal(result.safety.publicArtifactCreation, false)
  assert.equal(result.safety.privateMediaProcessing, false)
  assert.equal(result.safety.userMediaProcessing, false)
  assert.equal(result.safety.internalBetaUnlock, false)
}

const valid = createInternalBetaPrivateArtifactManifestLocalRuntime(buildInput())
assert.equal(valid.ok, true)
assert.equal(valid.status, 'local_private_artifact_manifest_validated_no_storage_access')
assert.equal(valid.localManifestRecordCreated, true)
assert.equal(valid.localArtifactRecordsCreated, 2)
assert.equal(valid.localChecksumRecordsCreated, 2)
assert.equal(valid.localQaReportLinkCreated, true)
assert.equal(valid.localCleanupPolicyRecorded, true)
assert.match(valid.manifestHash ?? '', /^[a-f0-9]{64}$/)
assert.match(valid.manifest?.id ?? '', /^artifact_manifest_[a-f0-9]{24}$/)
assert.equal(valid.manifest?.storageWrite, false)
assert.equal(valid.manifest?.storageRead, false)
assert.equal(valid.manifest?.signedUrlCreation, false)
assert.equal(valid.manifest?.publicArtifactCreation, false)
assert.equal(valid.manifest?.artifacts[0].storageProvider, 'local_metadata_only')
assert.equal(valid.manifest?.artifacts[0].storageObjectCreated, false)
assert.equal(valid.manifest?.artifacts[0].signedUrlCreated, false)
assert.equal(valid.qaSummary?.qaExecution, false)
assert.equal(valid.qaSummary?.artifactCount, 2)
assert.equal(valid.cleanupSummary?.cleanupJobCreated, false)
assert.equal(valid.cleanupSummary?.cleanupExecuted, false)
assertSafety(valid)

const repeated = createInternalBetaPrivateArtifactManifestLocalRuntime(buildInput())
assert.equal(repeated.manifestHash, valid.manifestHash, 'same private artifact manifest basis should hash deterministically')
assert.equal(repeated.manifest?.id, valid.manifest?.id, 'same private artifact manifest basis should create deterministic id')
assertSafety(repeated)

const missingChecksum = createInternalBetaPrivateArtifactManifestLocalRuntime(
  buildInput({ artifacts: [{ artifactKind: 'manifest', artifactRole: 'missing_checksum', fileName: 'manifest.json', byteCount: 1 }] }),
)
assert.equal(missingChecksum.ok, false)
assert.equal(missingChecksum.status, 'blocked_invalid_private_artifact_manifest_input')
assert.ok(missingChecksum.validation.errors.some((error) => error.includes('sha256')))
assertSafety(missingChecksum)

const pathFileName = createInternalBetaPrivateArtifactManifestLocalRuntime(
  buildInput({
    artifacts: [{ artifactKind: 'manifest', artifactRole: 'bad_path', fileName: '../manifest.json', byteCount: 1, sha256: checksumA }],
  }),
)
assert.equal(pathFileName.ok, false)
assert.ok(pathFileName.validation.errors.some((error) => error.includes('file name only')))
assertSafety(pathFileName)

const signedUrl = createInternalBetaPrivateArtifactManifestLocalRuntime(
  buildInput({ metadata: { signedUrl: 'https://example.test/private.mp4?signature=abc' } }),
)
assert.equal(signedUrl.ok, false)
assert.ok(signedUrl.validation.errors.some((error) => error.includes('signed/public URL')))
assertSafety(signedUrl)

const mediaBytes = createInternalBetaPrivateArtifactManifestLocalRuntime(
  buildInput({ artifacts: [{ artifactKind: 'preview', artifactRole: 'unsafe', fileName: 'preview.mp4', byteCount: 9, sha256: checksumB, metadata: { mediaBytes: 'abc' } }] }),
)
assert.equal(mediaBytes.ok, false)
assert.ok(mediaBytes.validation.errors.some((error) => error.includes('media bytes')))
assertSafety(mediaBytes)

console.log('internal-beta-private-artifact-manifest-local-runtime-smoke passed')
