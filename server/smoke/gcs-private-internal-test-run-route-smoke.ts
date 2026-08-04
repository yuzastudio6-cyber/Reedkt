import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import { clearApprovedEditExecutionPrivateDownloadMemoryForSmoke } from '../services/approved-edit-execution-package-service'
import type { ObjectMetadata, PutObjectInput, StorageAdapter, VerifyObjectInput } from '../storage/storage-types'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import type { ProfessionalEditDecisionManifestClientModel } from '../../src/lib/approved-edit-execution-package-client'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { PlannerInput } from '../../src/types/reeditpro'
import type { PrivateInternalTestRunJsonResponse } from './private-internal-test-run-smoke-types'

class FakeGcsStorageAdapter implements StorageAdapter {
  readonly mode = 'gcs' as const
  metadataReadCount = 0
  readStreamCount = 0
  writeAttemptCount = 0
  signedUrlAttemptCount = 0
  private readonly objects = new Map<string, {
    bucketName: string
    objectPath: string
    body: Buffer
    checksumSha256: string
    mimeType: string
  }>()

  constructor(input: {
    bucketName: string
    objectPath: string
    body: Buffer
    checksumSha256: string
    mimeType: string
  }) {
    this.objects.set(this.objectKey(input.bucketName, input.objectPath), input)
  }

  async createUploadTarget(): Promise<never> {
    this.signedUrlAttemptCount += 1
    throw new Error('Fake GCS route smoke does not create upload targets.')
  }

  async putObject(input: PutObjectInput): Promise<ObjectMetadata> {
    this.writeAttemptCount += 1
    const checksumSha256 = createHash('sha256').update(input.body).digest('hex')
    const object = {
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      body: input.body,
      checksumSha256,
      mimeType: input.mimeType ?? 'application/octet-stream',
    }
    this.objects.set(this.objectKey(input.bucketName, input.objectPath), object)
    return {
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      sizeBytes: input.body.byteLength,
      checksumSha256,
      mimeType: input.mimeType,
      exists: true,
      generation: '2001',
      etag: 'etag-2001',
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }

  async verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata> {
    const metadata = await this.getObjectMetadata(input.bucketName, input.objectPath)
    if (!metadata.exists) throw new Error('Fake GCS route smoke object not found.')
    if (input.expectedSizeBytes !== undefined && input.expectedSizeBytes !== metadata.sizeBytes) {
      throw new Error('Fake GCS route smoke object size mismatch.')
    }
    if (input.checksumSha256 && input.checksumSha256 !== metadata.checksumSha256) {
      throw new Error('Fake GCS route smoke object checksum mismatch.')
    }
    return metadata
  }

  async createDownloadTarget(): Promise<never> {
    this.signedUrlAttemptCount += 1
    throw new Error('Fake GCS route smoke does not create download targets.')
  }

  async getObjectMetadata(bucketName: string, objectPath: string): Promise<ObjectMetadata> {
    this.metadataReadCount += 1
    const object = this.objects.get(this.objectKey(bucketName, objectPath))
    if (!object) {
      return {
        bucketName,
        objectPath,
        sizeBytes: 0,
        checksumSha256: '',
        exists: false,
        integrityVerified: false,
        checksumSource: 'unavailable',
      }
    }

    return {
      bucketName,
      objectPath,
      sizeBytes: object.body.byteLength,
      checksumSha256: object.checksumSha256,
      mimeType: object.mimeType,
      exists: true,
      generation: '2001',
      etag: 'etag-2001',
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }

  async createReadStream(bucketName: string, objectPath: string): Promise<Readable> {
    this.readStreamCount += 1
    const metadata = await this.getObjectMetadata(bucketName, objectPath)
    if (!metadata.exists) throw new Error('Fake GCS route smoke object not found.')
    const object = this.objects.get(this.objectKey(bucketName, objectPath))
    if (!object) throw new Error('Fake GCS route smoke object not found.')
    return Readable.from([object.body])
  }

  async deleteObject(): Promise<never> {
    this.writeAttemptCount += 1
    throw new Error('Fake GCS route smoke does not delete objects.')
  }

  private objectKey(bucketName: string, objectPath: string): string {
    return `${bucketName}/${objectPath}`
  }
}

const localStorageRoot = '/tmp/reeditpro-gcs-private-internal-test-run-route-smoke'
await rm(localStorageRoot, { force: true, recursive: true })

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  STORAGE_MODE: 'gcs',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-source-media-route-smoke',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const sourceFixture = await createSyntheticMp4Fixture({
  localStorageRoot,
  outputPath: join(localStorageRoot, 'fixtures', 'route-gcs-uploaded-source.mp4'),
  durationSeconds: 1,
  width: 160,
  height: 90,
})
assert.equal(sourceFixture.available, true, `Synthetic route GCS source fixture should be available: ${sourceFixture.warnings.join('; ')}`)
assert.ok(sourceFixture.outputPath, 'Synthetic route GCS source fixture should expose its local file path.')

const sourceBytes = await readFile(sourceFixture.outputPath)
const sourceChecksumSha256 = createHash('sha256').update(sourceBytes).digest('hex')
const sourceBucket = 'reeditpro-source-media-route-smoke'
const sourceObjectPath = 'workspaces/workspace-gcs-route-smoke/projects/project-gcs-route-smoke/source-media/route-gcs-uploaded-source.mp4'
const fakeGcsStorageAdapter = new FakeGcsStorageAdapter({
  bucketName: sourceBucket,
  objectPath: sourceObjectPath,
  body: sourceBytes,
  checksumSha256: sourceChecksumSha256,
  mimeType: 'video/mp4',
})

const plannerInput: PlannerInput = {
  projectName: 'GCS route private internal edit',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  aspectRatioConfirmed: true,
  aspectRatioSource: 'user_selected',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'storytelling',
  workflowType: 'custom_let_ai_decide',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'clean',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: '',
  customInstructions: 'Create a clean private internal edit from a cloud-stored source clip.',
  creditPreference: 'balanced',
  clips: [
    {
      id: 'route-gcs-uploaded-source-clip',
      fileName: 'route-gcs-uploaded-source.mp4',
      duration: '1s',
      detectedType: 'Talking head source',
      notes: 'Uploaded through private GCS storage and submitted to the edit execution route.',
      previewLabel: 'Route GCS source clip',
      thumbnailHint: 'Synthetic private GCS source',
      sourceRole: 'main_story',
      uploadedOrder: 1,
    },
  ],
  sourceSequenceMode: 'single_complete_video',
  sourceOrderConfirmed: true,
  cleanupPreference: 'balanced_cleanup',
  cleanupPreferenceConfirmed: true,
}

const plan = createMockEditPlan(plannerInput)
const snapshot = createApprovedPlanSnapshot({
  approvedBy: 'mock-user-gcs-route',
  editSessionId: 'edit-session-gcs-route-smoke',
  projectId: 'project-gcs-route-smoke',
  plan,
})
const compactSnapshot = {
  id: snapshot.id,
  projectId: snapshot.projectId,
  editSessionId: snapshot.editSessionId,
  editPlanVersionId: snapshot.editPlanVersionId,
  creditEstimateId: snapshot.creditEstimateId,
  approvedAt: snapshot.approvedAt,
  approvedBy: snapshot.approvedBy,
  compiledIntent: snapshot.compiledIntent,
  sourceSequence: snapshot.sourceSequence,
  segments: snapshot.segments,
  operations: snapshot.operations,
  rendererLayers: snapshot.rendererLayers,
  masterTimingPlan: snapshot.masterTimingPlan,
  captionVisualCueTimingPlan: snapshot.captionVisualCueTimingPlan,
  sourceCleanupPlan: snapshot.sourceCleanupPlan,
  sourcePlan: {
    goalSummary: snapshot.sourcePlan.goalSummary,
  },
  creditEstimate: snapshot.creditEstimate,
  colorPipelinePlan: snapshot.colorPipelinePlan,
  editingAgentExecutionPlan: snapshot.editingAgentExecutionPlan,
  asyncAssetReconciliationPlan: snapshot.asyncAssetReconciliationPlan,
  agentQAFallbackPlan: snapshot.agentQAFallbackPlan,
  qaPlan: snapshot.qaPlan,
  toolStrategyPlan: snapshot.toolStrategyPlan,
}

const app = createReeditProApiApp(env, { storageAdapter: fakeGcsStorageAdapter })
const server = await listen(createServer(app))

try {
  const baseUrl = `http://127.0.0.1:${addressPort(server)}`
  const response = await postJson(
    `${baseUrl}/v1/edit-executions/private-internal-test-runs`,
    {
      workspaceId: 'workspace-gcs-route-smoke',
      projectId: snapshot.projectId,
      approvedPlanSnapshotId: snapshot.id,
      approvedSnapshot: compactSnapshot,
      creditReservationId: 'credit-reservation-gcs-route-smoke',
      requestedAdapterToolNames: ['d3', 'three', 'sam2'],
      packageReadyToolIds: ['d3', 'three', 'sam2'],
      modelWeightApprovedToolIds: ['sam2'],
      internalTestRunOnly: true,
      sourceMediaAssets: [
        {
          mediaAssetId: 'gcs-route-media-asset-001',
          sourceSequenceItemId: snapshot.sourceSequence[0]?.id,
          uploadedClipId: 'route-gcs-uploaded-source-clip',
          uploadedOrder: 1,
          storageProvider: 'google_cloud_storage',
          storageBucket: sourceBucket,
          storagePath: sourceObjectPath,
          fileName: 'route-gcs-uploaded-source.mp4',
          mimeType: 'video/mp4',
          byteSize: sourceBytes.byteLength,
          checksumSha256: sourceChecksumSha256,
          privateArtifact: true,
          publicUrl: null,
          signedUrl: null,
        },
      ],
      processingMode: 'private_internal_review_render',
      maxDurationSeconds: 30,
      targetWidth: 540,
      targetHeight: 960,
      fps: 24,
      reviewerNote: 'Route smoke approves the private internal review render for final-render readiness.',
    },
    'gcs-route-private-internal-test-run',
  )
  assert.equal(
    response.status,
    503,
    `Legacy caller-authored GCS execution must stay disabled: ${JSON.stringify(response.json)}`,
  )
  if (response.status === 503) {
    assert.equal(response.json.error?.code, 'TOOL_NOT_READY')
    const details = response.json.error?.details
    assert.ok(details && typeof details === 'object')
    assert.equal(
      (details as Record<string, unknown>).requiredGate,
      'canonical_browser_consumption_of_planning_handoff',
    )
    assert.equal(fakeGcsStorageAdapter.metadataReadCount, 0, 'Disabled legacy route must reject before GCS metadata access.')
    assert.equal(fakeGcsStorageAdapter.readStreamCount, 0, 'Disabled legacy route must reject before GCS byte access.')
    assert.equal(fakeGcsStorageAdapter.writeAttemptCount, 0, 'Disabled legacy route must not write GCS artifacts.')
    assert.equal(fakeGcsStorageAdapter.signedUrlAttemptCount, 0, 'Disabled legacy route must not create signed URLs.')
    console.log(JSON.stringify({
      ok: true,
      status: 'blocked_by_canonical_browser_consumption_of_planning_handoff',
      checks: [
        'legacy_private_internal_execution_route_fails_closed_before_gcs_access',
        'no_gcs_metadata_stream_write_or_signed_url_side_effect',
      ],
      nextRequiredGate: 'canonical_browser_consumption_of_planning_handoff',
    }))
  } else {
  assert.equal(response.status, 201, `GCS route private internal test run should succeed: ${JSON.stringify(response.json)}`)

  const internalTestRun = response.json.data?.internalTestRun
  assert.ok(internalTestRun, 'GCS route should return a private internal test run.')
  assert.equal(internalTestRun?.status, 'private_internal_test_run_completed_ready_for_download')
  assert.equal(internalTestRun?.sourceMediaAssetCount, 1)
  assert.equal(internalTestRun?.privateInternalDownloadDelivery?.privateInternalDownloadReady, true)
  assert.equal(internalTestRun?.publicDeliveryReady, false)
  assert.equal(internalTestRun?.externalBetaReady, false)
  assert.equal(internalTestRun?.productionReady, false)
  assert.ok(fakeGcsStorageAdapter.readStreamCount > 0, 'Private internal test run route should stream the fake GCS source object.')
  assert.ok(fakeGcsStorageAdapter.metadataReadCount >= fakeGcsStorageAdapter.readStreamCount, 'Route should validate GCS metadata while staging source media.')
  assert.equal(fakeGcsStorageAdapter.writeAttemptCount, 3, 'Route smoke should mirror the final MP4, manifest, and private delivery registry to GCS storage.')
  assert.equal(fakeGcsStorageAdapter.signedUrlAttemptCount, 0, 'Route smoke must not create signed URLs.')
  assert.equal(internalTestRun?.finalRenderArtifact?.privateStorageMirror?.storageProvider, 'google_cloud_storage')
  assert.equal(internalTestRun?.finalRenderArtifact?.privateStorageMirror?.publicArtifact, false)
  assert.equal(internalTestRun?.finalRenderArtifact?.privateStorageMirror?.signedUrl, null)
  assert.equal(internalTestRun?.finalRenderArtifact?.editDecisionManifestArtifact?.privateStorageMirror?.storageProvider, 'google_cloud_storage')

  const editDecisionManifest = internalTestRun?.finalRenderArtifact?.editDecisionManifest
  assert.equal(editDecisionManifest?.uploadedSourceOrderTrace?.source, 'uploaded_media_source_order')
  assert.equal(editDecisionManifest?.uploadedSourceOrderTrace?.sourceMediaCoverageComplete, true)
  assert.equal(
    editDecisionManifest?.uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId?.['gcs-route-media-asset-001'],
    sourceChecksumSha256,
  )
  assert.equal(editDecisionManifest?.audioQaIntegration?.attached, true)
  assert.equal(editDecisionManifest?.audioQaIntegration?.source, 'private_uploaded_audio_execution')
  assert.equal(editDecisionManifest?.audioQaIntegration?.finalMuxAllowed, false)
  assert.equal(editDecisionManifest?.audioQaIntegration?.productRuntimeExecuted, false)
  assert.equal(editDecisionManifest?.audioQaIntegration?.publicArtifact, false)
  assert.equal(editDecisionManifest?.audioQaIntegration?.signedUrl, null)
  assert.ok(
    editDecisionManifest?.decisions?.every((decision: ProfessionalEditDecisionManifestClientModel['decisions'][number]) =>
      decision.sourceMediaAssetId === 'gcs-route-media-asset-001' &&
      decision.sourceChecksumSha256 === sourceChecksumSha256 &&
      decision.processedArtifact?.storageProvider === 'local_private' &&
      decision.processedArtifact?.processingMode === 'private_internal_review_render' &&
      decision.processedArtifact?.privateArtifact === true &&
      decision.processedArtifact?.publicArtifact === false &&
      decision.processedArtifact?.signedUrl === null &&
      decision.audioExecutionReview?.attached === true &&
      decision.audioExecutionReview?.finalMuxAllowed === false &&
      decision.audioExecutionReview?.productRuntimeExecuted === false
    ),
    'Route final manifest should preserve GCS source checksum and private processed artifact proof.',
  )

  const sourceReadStreamCountAfterRun = fakeGcsStorageAdapter.readStreamCount
  const finalRenderLocalPath = internalTestRun?.finalRenderArtifact?.localFilePath
  const manifestLocalPath = internalTestRun?.finalRenderArtifact?.editDecisionManifestArtifact?.localFilePath
  assert.equal(typeof finalRenderLocalPath, 'string', 'Private final render should include a local path before fallback deletion.')
  assert.equal(typeof manifestLocalPath, 'string', 'Private manifest should include a local path before fallback deletion.')
  await rm(finalRenderLocalPath, { force: true })
  await rm(manifestLocalPath, { force: true })
  clearApprovedEditExecutionPrivateDownloadMemoryForSmoke()

  const privateDownload = await fetchBinary(`${baseUrl}${internalTestRun.privateInternalDownloadPath}`)
  assert.equal(privateDownload.status, 200, 'Private internal route download should stream MP4 bytes from the private storage mirror when local temp output is gone.')
  assert.match(privateDownload.headers.get('content-type') ?? '', /^video\/mp4\b/i)
  assert.equal(privateDownload.bytes.byteLength, internalTestRun.finalRenderArtifact.byteSize)
  const privateManifest = await fetchBinary(`${baseUrl}${internalTestRun.privateInternalManifestPath}`)
  assert.equal(privateManifest.status, 200, 'Private internal route manifest should stream JSON bytes from the private storage mirror when local temp output is gone.')
  assert.match(privateManifest.headers.get('content-type') ?? '', /^application\/json\b/i)
  const downloadedManifest = JSON.parse(
    Buffer.from(privateManifest.bytes).toString('utf8'),
  ) as ProfessionalEditDecisionManifestClientModel
  assert.equal(downloadedManifest.uploadedSourceOrderTrace?.sourceChecksumSha256ByMediaAssetId?.['gcs-route-media-asset-001'], sourceChecksumSha256)
  assert.deepEqual(downloadedManifest.audioQaIntegration, editDecisionManifest?.audioQaIntegration)
  assert.ok(
    downloadedManifest.decisions?.every((decision) =>
      decision.processedArtifact?.processingMode === 'private_internal_review_render' &&
      decision.audioExecutionReview?.attached === true &&
      decision.audioExecutionReview?.finalMuxAllowed === false
    ),
    'Downloaded GCS route manifest should preserve private internal review render mode.',
  )
  assert.ok(
    fakeGcsStorageAdapter.readStreamCount >= sourceReadStreamCountAfterRun + 2,
    'Private download file and manifest should be streamed from fake GCS after local temp files are removed.',
  )

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'private_internal_test_run_route_accepts_google_cloud_storage_source_asset',
      'fake_gcs_source_streamed_through_backend_route',
      'private_final_render_preserves_gcs_source_checksum_trace',
      'private_download_streams_after_cloud_source_processing',
      'private_delivery_registry_reloads_after_memory_clear_and_local_temp_deletion',
      'private_final_render_and_manifest_mirrored_to_gcs_without_signed_url_public_artifact_external_beta_or_production_scope',
    ],
    gcsReadStreamCount: fakeGcsStorageAdapter.readStreamCount,
    privateDownloadByteCount: privateDownload.bytes.byteLength,
    privateManifestByteCount: privateManifest.bytes.byteLength,
    nextRequiredGate: internalTestRun.nextRequiredGate,
  }))
  }
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await rm(localStorageRoot, { force: true, recursive: true })
}

function listen(server: Server): Promise<Server> {
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function addressPort(server: Server): number {
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected server to listen on a TCP port.')
  return address.port
}

async function postJson(
  url: string,
  body: unknown,
  idempotencyKey: string,
): Promise<{ status: number; json: PrivateInternalTestRunJsonResponse }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify(body),
  })
  return {
    status: response.status,
    json: await response.json() as PrivateInternalTestRunJsonResponse,
  }
}

async function fetchBinary(url: string): Promise<{ status: number; bytes: Uint8Array; headers: Headers }> {
  const response = await fetch(url)
  return {
    status: response.status,
    bytes: new Uint8Array(await response.arrayBuffer()),
    headers: response.headers,
  }
}
