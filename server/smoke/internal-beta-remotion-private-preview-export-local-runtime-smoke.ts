import assert from 'node:assert/strict'

import {
  createInternalBetaRemotionPrivatePreviewExportLocalRuntime,
  type InternalBetaRemotionPrivatePreviewExportLocalRuntimeInput,
} from '../services/internal-beta-remotion-private-preview-export-local-runtime'

const checksumA = 'c'.repeat(64)
const checksumB = 'd'.repeat(64)

function buildInput(
  overrides: Partial<InternalBetaRemotionPrivatePreviewExportLocalRuntimeInput> = {},
): InternalBetaRemotionPrivatePreviewExportLocalRuntimeInput {
  return {
    workspaceId: 'workspace_remotion_local_smoke_001',
    projectId: 'project_remotion_local_smoke_001',
    approvedPlanSnapshotId: 'approved_snapshot_remotion_local_smoke_001',
    creditReservationId: 'credit_reservation_remotion_local_smoke_001',
    jobId: 'job_remotion_local_smoke_001',
    artifactManifestId: 'artifact_manifest_remotion_local_smoke_001',
    rendererPlanId: 'renderer_plan_remotion_local_smoke_001',
    idempotencyKey: 'idempotency_remotion_local_smoke_001',
    renderMode: 'preview_and_export_candidate',
    outputFrame: {
      width: 1080,
      height: 1920,
      fps: 30,
      durationFrames: 150,
    },
    expectedOutputs: [
      {
        outputKind: 'private_preview',
        fileName: 'private-preview-manifest.json',
        byteCount: 400,
        sha256: checksumA,
        linkedArtifactId: 'artifact_preview_manifest_001',
        linkedRendererLayerIds: ['layer_title', 'layer_caption'],
        qaStatus: 'qa_pending',
        cleanupPolicy: 'retain_with_project_private',
      },
      {
        outputKind: 'private_export_candidate',
        fileName: 'private-export-candidate-manifest.json',
        byteCount: 480,
        sha256: checksumB,
        linkedArtifactId: 'artifact_export_manifest_001',
        linkedRendererLayerIds: ['layer_title', 'layer_caption', 'layer_source_clip'],
        qaStatus: 'not_run',
        cleanupPolicy: 'worker_temp_delete_after_job',
      },
    ],
    metadata: { source: 'internal_beta_remotion_private_preview_export_local_runtime_smoke' },
    ...overrides,
  }
}

function assertSafety(result: ReturnType<typeof createInternalBetaRemotionPrivatePreviewExportLocalRuntime>) {
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
  assert.equal(result.safety.remotionExecution, false)
  assert.equal(result.safety.ffmpegExecution, false)
  assert.equal(result.safety.ffprobeExecution, false)
  assert.equal(result.safety.mediaProcessing, false)
  assert.equal(result.safety.renderExportExecution, false)
  assert.equal(result.safety.previewArtifactCreation, false)
  assert.equal(result.safety.finalExportCreation, false)
  assert.equal(result.safety.storageObjectCreation, false)
  assert.equal(result.safety.storageObjectRead, false)
  assert.equal(result.safety.signedUrlCreation, false)
  assert.equal(result.safety.publicArtifactCreation, false)
  assert.equal(result.safety.privateMediaProcessing, false)
  assert.equal(result.safety.userMediaProcessing, false)
  assert.equal(result.safety.internalBetaUnlock, false)
}

const valid = createInternalBetaRemotionPrivatePreviewExportLocalRuntime(buildInput())
assert.equal(valid.ok, true)
assert.equal(valid.status, 'local_remotion_private_preview_export_metadata_validated_no_render_execution')
assert.equal(valid.localRenderRequestRecordCreated, true)
assert.equal(valid.localPreviewExpectationRecordsCreated, 1)
assert.equal(valid.localExportExpectationRecordsCreated, 1)
assert.equal(valid.localOutputChecksumRecordsValidated, 2)
assert.equal(valid.localQaGateRecorded, true)
assert.equal(valid.localCleanupPolicyRecorded, true)
assert.match(valid.renderRequestHash ?? '', /^[a-f0-9]{64}$/)
assert.match(valid.renderRequest?.id ?? '', /^remotion_private_render_request_[a-f0-9]{24}$/)
assert.equal(valid.renderRequest?.workerDispatch, false)
assert.equal(valid.renderRequest?.workerExecution, false)
assert.equal(valid.renderRequest?.remotionExecution, false)
assert.equal(valid.renderRequest?.ffmpegExecution, false)
assert.equal(valid.renderRequest?.ffprobeExecution, false)
assert.equal(valid.renderRequest?.previewArtifactCreation, false)
assert.equal(valid.renderRequest?.finalExportCreation, false)
assert.equal(valid.renderRequest?.outputExpectations[0].storageProvider, 'local_metadata_only')
assert.equal(valid.renderRequest?.outputExpectations[0].previewArtifactCreated, false)
assert.equal(valid.renderRequest?.outputExpectations[1].finalExportCreated, false)
assert.equal(valid.qaSummary?.qaExecution, false)
assert.equal(valid.qaSummary?.outputCount, 2)
assert.equal(valid.cleanupSummary?.cleanupJobCreated, false)
assert.equal(valid.cleanupSummary?.cleanupExecuted, false)
assertSafety(valid)

const repeated = createInternalBetaRemotionPrivatePreviewExportLocalRuntime(buildInput())
assert.equal(repeated.renderRequestHash, valid.renderRequestHash, 'same Remotion private preview/export basis should hash deterministically')
assert.equal(repeated.renderRequest?.id, valid.renderRequest?.id, 'same Remotion private preview/export basis should create deterministic id')
assertSafety(repeated)

const missingFrame = createInternalBetaRemotionPrivatePreviewExportLocalRuntime(buildInput({ outputFrame: { width: 1080 } }))
assert.equal(missingFrame.ok, false)
assert.equal(missingFrame.status, 'blocked_invalid_remotion_private_preview_export_input')
assert.ok(missingFrame.validation.errors.some((error) => error.includes('outputFrame.height')))
assertSafety(missingFrame)

const pathFileName = createInternalBetaRemotionPrivatePreviewExportLocalRuntime(
  buildInput({
    expectedOutputs: [
      {
        outputKind: 'private_preview',
        fileName: '../private-preview.json',
        byteCount: 1,
        sha256: checksumA,
      },
    ],
  }),
)
assert.equal(pathFileName.ok, false)
assert.ok(pathFileName.validation.errors.some((error) => error.includes('file name only')))
assertSafety(pathFileName)

const signedUrl = createInternalBetaRemotionPrivatePreviewExportLocalRuntime(
  buildInput({ metadata: { signedUrl: 'https://example.test/private-preview.mp4?signature=abc' } }),
)
assert.equal(signedUrl.ok, false)
assert.ok(signedUrl.validation.errors.some((error) => error.includes('signed/public URL')))
assertSafety(signedUrl)

const renderedBytes = createInternalBetaRemotionPrivatePreviewExportLocalRuntime(
  buildInput({
    expectedOutputs: [
      {
        outputKind: 'private_preview',
        fileName: 'private-preview.json',
        byteCount: 1,
        sha256: checksumB,
        metadata: { renderedBytes: 'abc' },
      },
    ],
  }),
)
assert.equal(renderedBytes.ok, false)
assert.ok(renderedBytes.validation.errors.some((error) => error.includes('rendered bytes')))
assertSafety(renderedBytes)

console.log('internal-beta-remotion-private-preview-export-local-runtime-smoke passed')
