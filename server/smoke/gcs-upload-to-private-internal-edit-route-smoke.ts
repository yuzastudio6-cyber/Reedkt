import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { readFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'

import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { createSyntheticMp4Fixture } from '../media/test-media-fixture'
import type { DownloadTarget, ObjectMetadata, ObjectReadIdentity, PutObjectInput, StorageAdapter, UploadTarget, VerifyObjectInput } from '../storage/storage-types'
import { createApprovedPlanSnapshot } from '../../src/lib/approved-plan-snapshot'
import { createMockEditPlan } from '../../src/lib/mock-planner/full'
import type { PlannerInput } from '../../src/types/reeditpro'
import type { PrivateInternalTestRunJsonResponse } from './private-internal-test-run-smoke-types'

class FakeUploadedGcsStorageAdapter implements StorageAdapter {
  readonly mode = 'gcs' as const
  createUploadTargetCount = 0
  verifyCount = 0
  metadataReadCount = 0
  readStreamCount = 0
  readonly readStreamIdentities: Array<ObjectReadIdentity | undefined> = []
  writeAttemptCount = 0
  signedDownloadAttemptCount = 0
  uploadTarget?: UploadTarget
  private readonly uploadedBody: Buffer
  private readonly checksumSha256: string

  private object?: {
    bucketName: string
    objectPath: string
    body: Buffer
    checksumSha256: string
    mimeType: string
    generation: string
    etag: string
  }

  constructor(uploadedBody: Buffer, checksumSha256: string) {
    this.uploadedBody = uploadedBody
    this.checksumSha256 = checksumSha256
  }

  async createUploadTarget(input: {
    uploadIntentId: string
    bucketName: string
    objectPath: string
    mimeType: string
    checksumSha256?: string
    expiresAt: string
  }): Promise<UploadTarget> {
    this.createUploadTargetCount += 1
    this.object = {
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      body: this.uploadedBody,
      checksumSha256: input.checksumSha256 ?? this.checksumSha256,
      mimeType: input.mimeType,
      generation: '1001',
      etag: 'etag-1001',
    }
    this.uploadTarget = {
      uploadMethod: 'PUT',
      uploadUrl: `https://fake-gcs-upload.example/${encodeURIComponent(input.uploadIntentId)}`,
      uploadHeaders: {
        'content-type': input.mimeType,
        'x-goog-if-generation-match': '0',
      },
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      createOnly: true,
    }
    return this.uploadTarget
  }

  async putObject(_input: PutObjectInput): Promise<ObjectMetadata> {
    this.writeAttemptCount += 1
    const checksumSha256 = createHash('sha256').update(_input.body).digest('hex')
    this.object = {
      bucketName: _input.bucketName,
      objectPath: _input.objectPath,
      body: _input.body,
      checksumSha256,
      mimeType: _input.mimeType ?? 'application/octet-stream',
      generation: '1002',
      etag: 'etag-1002',
    }
    return {
      bucketName: _input.bucketName,
      objectPath: _input.objectPath,
      sizeBytes: _input.body.byteLength,
      checksumSha256,
      mimeType: _input.mimeType,
      exists: true,
      generation: '1002',
      etag: 'etag-1002',
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }

  async verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata> {
    this.verifyCount += 1
    const metadata = await this.getObjectMetadata(input.bucketName, input.objectPath)
    if (!metadata.exists) return metadata
    if (input.expectedSizeBytes !== undefined && metadata.sizeBytes !== input.expectedSizeBytes) {
      return { ...metadata, exists: false, sizeBytes: metadata.sizeBytes }
    }
    const actualChecksumSha256 = createHash('sha256').update(this.object?.body ?? Buffer.alloc(0)).digest('hex')
    if (input.checksumSha256 && actualChecksumSha256 !== input.checksumSha256) return { ...metadata, exists: false }
    return {
      ...metadata,
      checksumSha256: actualChecksumSha256,
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }

  async createDownloadTarget(): Promise<DownloadTarget> {
    this.signedDownloadAttemptCount += 1
    throw new Error('Fake uploaded GCS route smoke does not create download targets.')
  }

  async getObjectMetadata(bucketName: string, objectPath: string): Promise<ObjectMetadata> {
    this.metadataReadCount += 1
    if (!this.object || this.object.bucketName !== bucketName || this.object.objectPath !== objectPath) {
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
      sizeBytes: this.object.body.byteLength,
      checksumSha256: '',
      mimeType: this.object.mimeType,
      exists: true,
      generation: this.object.generation,
      etag: this.object.etag,
      integrityVerified: false,
      checksumSource: 'unavailable',
    }
  }

  async createReadStream(bucketName: string, objectPath: string, identity?: ObjectReadIdentity): Promise<Readable> {
    this.readStreamCount += 1
    this.readStreamIdentities.push(identity)
    const metadata = await this.getObjectMetadata(bucketName, objectPath)
    if (!metadata.exists || !this.object) throw new Error('Fake uploaded GCS object not found.')
    return Readable.from([this.object.body])
  }

  async deleteObject(): Promise<never> {
    this.writeAttemptCount += 1
    throw new Error('Fake uploaded GCS route smoke does not delete objects.')
  }
}

const localStorageRoot = '/tmp/reeditpro-gcs-upload-to-private-internal-edit-route-smoke'
await rm(localStorageRoot, { force: true, recursive: true })

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  STORAGE_MODE: 'gcs',
  LOCAL_STORAGE_ROOT: localStorageRoot,
  GCS_SOURCE_MEDIA_BUCKET: 'reeditpro-source-media-upload-route-smoke',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const sourceFixture = await createSyntheticMp4Fixture({
  localStorageRoot,
  outputPath: join(localStorageRoot, 'fixtures', 'upload-route-gcs-source.mp4'),
  durationSeconds: 1,
  width: 160,
  height: 90,
})
assert.equal(sourceFixture.available, true, `Synthetic upload-route GCS source fixture should be available: ${sourceFixture.warnings.join('; ')}`)
assert.ok(sourceFixture.outputPath, 'Synthetic upload-route GCS source fixture should expose its local file path.')

const sourceBytes = await readFile(sourceFixture.outputPath)
const sourceChecksumSha256 = createHash('sha256').update(sourceBytes).digest('hex')
const fakeGcsStorageAdapter = new FakeUploadedGcsStorageAdapter(sourceBytes, sourceChecksumSha256)

const plannerInput: PlannerInput = {
  projectName: 'GCS upload route private edit',
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
  customInstructions: 'Create a professional private edit from the cloud-uploaded source clip.',
  creditPreference: 'balanced',
  clips: [
    {
      id: 'upload-route-gcs-source-clip',
      fileName: 'upload-route-gcs-source.mp4',
      duration: '1s',
      detectedType: 'Talking head source',
      notes: 'Source clip is uploaded through the GCS upload intent route.',
      previewLabel: 'GCS upload route source clip',
      thumbnailHint: 'Synthetic private GCS upload source',
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

const app = createReeditProApiApp(env, { storageAdapter: fakeGcsStorageAdapter })
const server = await listen(createServer(app))

try {
  const baseUrl = `http://127.0.0.1:${addressPort(server)}`
  const project = await createBackendProject({
    baseUrl,
    workspaceId: 'workspace-gcs-upload-route-smoke',
    name: plannerInput.projectName,
    idempotencyKey: 'gcs-upload-route-project',
  })
  const snapshot = createApprovedPlanSnapshot({
    approvedBy: 'mock-user-gcs-upload-route',
    editSessionId: 'edit-session-gcs-upload-route-smoke',
    projectId: project.id,
    plan,
  })
  const compactSnapshot = createCompactSnapshot(snapshot)
  const uploadIntentResponse = await postJson(
    `${baseUrl}/v1/projects/${snapshot.projectId}/upload-intents`,
    {
      workspaceId: 'workspace-gcs-upload-route-smoke',
      uploadPurpose: 'source_media',
      originalFileName: 'upload-route-gcs-source.mp4',
      mimeType: 'video/mp4',
      expectedSizeBytes: sourceBytes.byteLength,
      checksumSha256: sourceChecksumSha256,
    },
    'gcs-upload-route-upload-intent',
  )
  assert.equal(uploadIntentResponse.status, 201, `GCS upload intent should be created: ${JSON.stringify(uploadIntentResponse.json)}`)
  const uploadIntent = uploadIntentResponse.json.data?.uploadIntent
  const uploadTarget = uploadIntentResponse.json.data?.uploadTarget
  const signedUrlEvent = uploadIntentResponse.json.data?.signedUrlEvent
  assert.ok(uploadIntent?.id, 'GCS upload intent should include an id.')
  assert.ok(uploadTarget, 'GCS upload intent should include an upload target.')
  assert.equal(uploadTarget?.uploadMethod, 'PUT')
  assert.equal(uploadTarget?.bucketName, 'reeditpro-source-media-upload-route-smoke')
  assert.equal(uploadTarget?.uploadHeaders?.['x-goog-if-generation-match'], '0')
  assert.equal(uploadTarget?.uploadHeaders?.['x-goog-meta-sha256'], undefined)
  assert.equal(signedUrlEvent?.metadataJson?.bucketName, uploadTarget.bucketName)
  assert.equal(signedUrlEvent?.metadataJson?.objectPath, uploadTarget.objectPath)
  assert.equal(/fake-gcs-upload/.test(JSON.stringify(signedUrlEvent)), false, 'Signed URL event must not store the temporary upload URL.')

  const finalizedResponse = await postJson(
    `${baseUrl}/v1/upload-intents/${uploadIntent.id}/finalize`,
    {
      workspaceId: 'workspace-gcs-upload-route-smoke',
      sizeBytes: sourceBytes.byteLength,
      checksumSha256: sourceChecksumSha256,
    },
    'gcs-upload-route-finalize',
  )
  assert.equal(finalizedResponse.status, 201, `GCS upload finalize should succeed: ${JSON.stringify(finalizedResponse.json)}`)
  const mediaAsset = finalizedResponse.json.data?.mediaAsset
  const storageObjectRecord = finalizedResponse.json.data?.storageObjectRecord
  assert.ok(mediaAsset, 'Finalized GCS upload should include a media asset.')
  assert.equal(mediaAsset?.storageProvider, 'google_cloud_storage')
  assert.equal(mediaAsset?.storageBucket, uploadTarget.bucketName)
  assert.equal(mediaAsset?.storagePath, uploadTarget.objectPath)
  assert.equal(mediaAsset?.checksumSha256, sourceChecksumSha256)
  assert.equal(mediaAsset?.storageGeneration, '1001')
  assert.equal(mediaAsset?.storageEtag, 'etag-1001')
  assert.equal(mediaAsset?.sourceMetadata?.probeStatus, 'probed')
  assert.equal(mediaAsset?.sourceMetadata?.source, 'gcs_ffprobe')
  assert.equal(mediaAsset?.sourceMetadata?.hasVideo, true)
  assert.equal(mediaAsset?.sourceMetadata?.hasAudio, false)
  assert.equal(mediaAsset?.sourceMetadata?.width, 160)
  assert.equal(mediaAsset?.sourceMetadata?.height, 90)
  assert.ok((mediaAsset?.sourceMetadata?.durationSeconds ?? 0) > 0, 'Finalized GCS media asset should include duration metadata.')
  assert.ok(
    fakeGcsStorageAdapter.readStreamIdentities.some((identity) =>
      identity?.generation === '1001' && identity.etag === 'etag-1001'
    ),
    'Upload-time source probing must reopen the exact verified GCS generation and ETag.',
  )
  assert.equal(
    await countRegularFiles(join(localStorageRoot, 'upload-probes')),
    0,
    'Upload-time GCS probe staging must remove every staged source byte after FFprobe.',
  )
  assert.equal(storageObjectRecord?.bucketName, uploadTarget.bucketName)
  assert.equal(storageObjectRecord?.objectPath, uploadTarget.objectPath)
  assert.equal(storageObjectRecord?.checksumSha256, sourceChecksumSha256)
  assert.equal(storageObjectRecord?.generation, '1001')
  assert.equal(storageObjectRecord?.etag, 'etag-1001')

  const privateRunResponse = await postJson(
    `${baseUrl}/v1/edit-executions/private-internal-test-runs`,
    {
      workspaceId: 'workspace-gcs-upload-route-smoke',
      projectId: snapshot.projectId,
      approvedPlanSnapshotId: snapshot.id,
      approvedSnapshot: compactSnapshot,
      creditReservationId: 'credit-reservation-gcs-upload-route-smoke',
      requestedAdapterToolNames: ['d3', 'three', 'sam3_1'],
      packageReadyToolIds: ['d3', 'three', 'sam3_1'],
      modelWeightApprovedToolIds: ['sam3_1'],
      internalTestRunOnly: true,
      sourceMediaAssets: [
        {
          mediaAssetId: mediaAsset.id,
          sourceSequenceItemId: snapshot.sourceSequence[0]?.id,
          uploadedClipId: 'upload-route-gcs-source-clip',
          uploadedOrder: 1,
          storageProvider: mediaAsset.storageProvider,
          storageBucket: mediaAsset.storageBucket,
          storagePath: mediaAsset.storagePath,
          fileName: mediaAsset.fileName,
          mimeType: mediaAsset.mimeType,
          byteSize: mediaAsset.sizeBytes,
          checksumSha256: mediaAsset.checksumSha256,
          privateArtifact: true,
          publicUrl: null,
          signedUrl: null,
        },
      ],
      maxDurationSeconds: 2,
      targetWidth: 320,
      targetHeight: 568,
      fps: 24,
      reviewerNote: 'Upload-route smoke approves the private preview for final-render readiness.',
    },
    'gcs-upload-route-private-internal-test-run',
  )
  assert.equal(
    privateRunResponse.status,
    503,
    `Legacy caller-authored execution must stay disabled after GCS upload finalization: ${JSON.stringify(privateRunResponse.json)}`,
  )
  if (privateRunResponse.status === 503) {
    assert.equal(privateRunResponse.json.error?.code, 'TOOL_NOT_READY')
    const details = privateRunResponse.json.error?.details
    assert.ok(details && typeof details === 'object')
    assert.equal(
      (details as Record<string, unknown>).requiredGate,
      'canonical_browser_consumption_of_planning_handoff',
    )
    assert.equal(fakeGcsStorageAdapter.writeAttemptCount, 0, 'The disabled legacy route must not write render artifacts to GCS.')
    assert.equal(fakeGcsStorageAdapter.signedDownloadAttemptCount, 0, 'The disabled legacy route must not create GCS download targets.')
    console.log(JSON.stringify({
      ok: true,
      status: 'blocked_by_canonical_browser_consumption_of_planning_handoff',
      checks: [
        'backend_project_created_before_gcs_upload_intent',
        'gcs_upload_intent_created_without_signed_url_source_truth',
        'gcs_finalize_preserved_generation_and_etag_identity',
        'gcs_upload_probe_reopened_exact_generation_and_etag',
        'gcs_upload_probe_staging_removed_all_source_bytes',
        'gcs_upload_finalize_promoted_probed_private_media_asset',
        'legacy_private_internal_execution_route_fails_closed',
        'no_provider_render_delivery_billing_or_wallet_side_effect',
      ],
      uploadedByteCount: sourceBytes.byteLength,
      gcsReadStreamCount: fakeGcsStorageAdapter.readStreamCount,
      nextRequiredGate: 'canonical_browser_consumption_of_planning_handoff',
    }))
  } else {
    assert.equal(privateRunResponse.status, 201, `Private internal edit run should consume finalized GCS media asset: ${JSON.stringify(privateRunResponse.json)}`)
    const internalTestRun = privateRunResponse.json.data?.internalTestRun
    assert.ok(internalTestRun, 'Private GCS upload run should return an internal test run.')
    assert.equal(internalTestRun?.status, 'private_internal_test_run_completed_ready_for_download')
    assert.equal(internalTestRun?.sourceMediaAssetCount, 1)
    assert.equal(internalTestRun?.privateInternalDownloadDelivery?.privateInternalDownloadReady, true)
    assert.equal(internalTestRun?.publicDeliveryReady, false)
    assert.equal(internalTestRun?.externalBetaReady, false)
    assert.equal(internalTestRun?.productionReady, false)
    assert.ok(fakeGcsStorageAdapter.createUploadTargetCount === 1, 'GCS upload target should be created once.')
    assert.ok(fakeGcsStorageAdapter.verifyCount >= 1, 'GCS finalized upload should be verified.')
    assert.ok(fakeGcsStorageAdapter.readStreamCount > 0, 'Finalization/processing should stream the private GCS object.')
    assert.equal(fakeGcsStorageAdapter.writeAttemptCount, 3, 'Backend should mirror the final MP4, manifest, and private delivery registry to GCS storage in this flow.')
    assert.equal(fakeGcsStorageAdapter.signedDownloadAttemptCount, 0, 'Backend must not create GCS download signed URLs in this flow.')
    assert.equal(internalTestRun?.finalRenderArtifact?.privateStorageMirror?.storageProvider, 'google_cloud_storage')
    assert.equal(internalTestRun?.finalRenderArtifact?.privateStorageMirror?.publicArtifact, false)
    assert.equal(internalTestRun?.finalRenderArtifact?.privateStorageMirror?.signedUrl, null)
    assert.equal(internalTestRun?.finalRenderArtifact?.editDecisionManifestArtifact?.privateStorageMirror?.storageProvider, 'google_cloud_storage')

    const privateDownload = await fetchBinary(`${baseUrl}${internalTestRun.privateInternalDownloadPath}`)
    assert.equal(privateDownload.status, 200, 'Private internal download should stream after GCS upload-route edit run.')
    assert.match(privateDownload.headers.get('content-type') ?? '', /^video\/mp4\b/i)
    assert.equal(privateDownload.bytes.byteLength, internalTestRun.finalRenderArtifact.byteSize)

    console.log(JSON.stringify({
      ok: true,
      checks: [
        'backend_project_created_before_gcs_upload_intent',
        'gcs_upload_intent_created_without_signed_url_source_truth',
        'gcs_finalize_preserved_generation_and_etag_identity',
        'gcs_upload_probe_reopened_exact_generation_and_etag',
        'gcs_upload_probe_staging_removed_all_source_bytes',
        'gcs_upload_finalize_promoted_probed_private_media_asset',
        'gcs_finalized_media_asset_consumed_by_private_internal_test_run_route',
        'private_final_render_download_streamed_after_gcs_upload_finalize',
        'private_final_render_and_manifest_mirrored_without_signed_download_public_artifact_external_beta_or_production_scope',
      ],
      uploadedByteCount: sourceBytes.byteLength,
      gcsReadStreamCount: fakeGcsStorageAdapter.readStreamCount,
      privateDownloadByteCount: privateDownload.bytes.byteLength,
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

async function countRegularFiles(rootPath: string): Promise<number> {
  const entries = await readdir(rootPath, { recursive: true, withFileTypes: true }).catch((error) => {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return []
    throw error
  })
  return entries.filter((entry) => entry.isFile()).length
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

async function createBackendProject(input: {
  baseUrl: string
  workspaceId: string
  name: string
  idempotencyKey: string
}): Promise<{ id: string; workspaceId: string; name: string }> {
  const response = await postJson(
    `${input.baseUrl}/v1/projects`,
    {
      workspaceId: input.workspaceId,
      name: input.name,
    },
    input.idempotencyKey,
  )
  assert.equal(response.status, 201, `Backend project should be created before GCS upload intent: ${JSON.stringify(response.json)}`)
  const project = response.json.data?.project
  assert.ok(project, 'Backend project creation should return the created project.')
  assert.match(project?.id ?? '', /^project_[0-9a-f-]+$/, 'Backend project should include a generated project id.')
  assert.equal(project?.workspaceId, input.workspaceId, 'Backend project should preserve the GCS upload workspace.')
  assert.equal(project?.name, input.name, 'Backend project should preserve the GCS upload project name.')
  return project
}

type ApprovedPlanSnapshotRecord = ReturnType<typeof createApprovedPlanSnapshot>

function createCompactSnapshot(snapshot: ApprovedPlanSnapshotRecord) {
  return {
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
    sourcePlan: { goalSummary: snapshot.sourcePlan.goalSummary },
    creditEstimate: snapshot.creditEstimate,
    colorPipelinePlan: snapshot.colorPipelinePlan,
    editingAgentExecutionPlan: snapshot.editingAgentExecutionPlan,
    asyncAssetReconciliationPlan: snapshot.asyncAssetReconciliationPlan,
    agentQAFallbackPlan: snapshot.agentQAFallbackPlan,
    qaPlan: snapshot.qaPlan,
    toolStrategyPlan: snapshot.toolStrategyPlan,
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
