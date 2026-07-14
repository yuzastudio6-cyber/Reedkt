import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'

import type {
  PlannedSourceUpload,
  PlanSourceUploadsResult,
} from '../../src/lib/source-upload-planning'

type SeenRequest = {
  method: string
  url: string
  idempotencyKey?: string
  contentType?: string
  generationPrecondition?: string
  bodyByteLength: number
}

const seenRequests: SeenRequest[] = []
const uploadedBytes: Buffer[] = []
const sourceFileBytes = Buffer.from('mock-safe uploaded source bytes')
const sourceChecksumSha256 = createHash('sha256').update(sourceFileBytes).digest('hex')

const server = createServer(async (request, response) => {
  const body = await readRequestBody(request)
  seenRequests.push({
    method: request.method ?? 'GET',
    url: request.url ?? '/',
    idempotencyKey: request.headers['idempotency-key']?.toString(),
    contentType: request.headers['content-type']?.toString(),
    generationPrecondition: request.headers['x-goog-if-generation-match']?.toString(),
    bodyByteLength: body.byteLength,
  })

  if (request.method === 'POST' && request.url === '/v1/projects/project-upload-smoke/upload-intents') {
    const input = JSON.parse(body.toString('utf8')) as Record<string, unknown>
    assert.equal(input.workspaceId, 'workspace-upload-smoke')
    assert.equal(input.uploadPurpose, 'source_media')
    assert.equal(input.originalFileName, 'uploaded-story.mp4')
    assert.equal(
      input.checksumSha256,
      undefined,
      'Browser upload planning must not buffer the entire source merely to submit an optional checksum.',
    )

    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        uploadIntent: {
          id: 'upload-intent-smoke',
          workspaceId: 'workspace-upload-smoke',
          projectId: 'project-upload-smoke',
          targetBucket: 'source-media',
          targetPath: 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/upload-intent-smoke/uploaded-story.mp4',
          originalFileName: 'uploaded-story.mp4',
          mimeType: 'video/mp4',
          expectedSizeBytes: 34,
          mockOnly: true,
        },
        uploadTarget: {
          uploadMethod: 'PUT',
          uploadUrl: '/v1/upload-intents/upload-intent-smoke/local-object',
          uploadHeaders: {
            'content-type': 'video/mp4',
            'x-goog-if-generation-match': '0',
          },
          bucketName: 'source-media',
          objectPath: 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/upload-intent-smoke/uploaded-story.mp4',
        },
      },
      warnings: ['Backend upload intent smoke response.'],
    }))
    return
  }

  if (request.method === 'PUT' && request.url === '/v1/upload-intents/upload-intent-smoke/local-object') {
    assert.equal(request.headers['x-goog-if-generation-match']?.toString(), '0')
    assert.equal(request.headers['x-goog-meta-sha256'], undefined)
    uploadedBytes.push(body)
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        localObjectUpload: {
          uploadIntentId: 'upload-intent-smoke',
          bucketName: 'source-media',
          objectPath: 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/upload-intent-smoke/uploaded-story.mp4',
          mimeType: request.headers['content-type']?.toString() ?? 'video/mp4',
          sizeBytes: body.byteLength,
          checksumSha256: sourceChecksumSha256,
          status: 'uploaded',
          temporaryMetadataOnly: true,
        },
      },
      warnings: ['Backend local object upload smoke response.'],
    }))
    return
  }

  if (request.method === 'POST' && request.url === '/v1/upload-intents/upload-intent-smoke/finalize') {
    const input = JSON.parse(body.toString('utf8')) as Record<string, unknown>
    assert.equal(input.workspaceId, 'workspace-upload-smoke')
    assert.equal(input.sizeBytes, sourceFileBytes.byteLength)
    assert.equal(
      input.checksumSha256,
      undefined,
      'Finalization must rely on the backend-computed stored-byte checksum rather than a browser whole-file digest.',
    )
    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({
      ok: true,
      data: {
        uploadIntent: {
          id: 'upload-intent-smoke',
          workspaceId: 'workspace-upload-smoke',
          projectId: 'project-upload-smoke',
          originalFileName: 'uploaded-story.mp4',
          mimeType: 'video/mp4',
          targetBucket: 'source-media',
          targetPath: 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/upload-intent-smoke/uploaded-story.mp4',
          mediaAssetId: 'media-asset-upload-smoke',
          status: 'finalized',
          mockOnly: true,
        },
        storageObjectRecord: {
          id: 'storage-object-upload-smoke',
          bucketName: 'source-media',
          objectPath: 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/upload-intent-smoke/uploaded-story.mp4',
          storageProvider: 'local_private',
          mimeType: 'video/mp4',
          sizeBytes: uploadedBytes[0]?.byteLength ?? 0,
          checksumSha256: sourceChecksumSha256,
          mockOnly: true,
        },
        mediaAsset: {
          id: 'media-asset-upload-smoke',
          workspaceId: 'workspace-upload-smoke',
          projectId: 'project-upload-smoke',
          fileName: 'uploaded-story.mp4',
          mimeType: 'video/mp4',
          storageProvider: 'local_private',
          storageBucket: 'source-media',
          storagePath: 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/upload-intent-smoke/uploaded-story.mp4',
          sizeBytes: uploadedBytes[0]?.byteLength ?? 0,
          checksumSha256: sourceChecksumSha256,
          status: 'uploaded',
          mockOnly: true,
          sourceMetadata: {
            probeStatus: 'probed',
            source: 'local_ffprobe',
            durationSeconds: 9.2,
            width: 1920,
            height: 1080,
            videoCodec: 'h264',
            audioCodec: 'aac',
            formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
            streamCount: 2,
            hasVideo: true,
            hasAudio: true,
          },
        },
      },
      warnings: ['Backend finalize upload smoke response.'],
    }))
    return
  }

  response.statusCode = 404
  response.setHeader('content-type', 'application/json')
  response.end(JSON.stringify({
    ok: false,
    error: { code: 'not_found', message: 'Unexpected source upload smoke route.' },
    warnings: [],
  }))
})

await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert(address && typeof address === 'object', 'Source upload smoke server should expose a TCP address.')

process.env.VITE_REEDITPRO_API_MODE = 'frontend_safe'
process.env.VITE_REEDITPRO_API_BASE_URL = `http://127.0.0.1:${address.port}`
process.env.VITE_SUPABASE_URL = ''
process.env.VITE_SUPABASE_ANON_KEY = ''

try {
  const {
    createBackendUploadTargetHeaders,
    createExecutionSourceMediaAssetsFromPlannedUploads,
    planSourceUploadsForEditor,
  } = await import('../../src/lib/source-upload-planning')
  const { getApiRouteById } = await import('../../src/backend/api/api-route-registry')
  const { createSourceUploadFlow } = await import('../../src/backend/storage/source-upload-flow-service')

  for (const routeId of [
    'projects.list',
    'projects.get',
    'projects.create',
    'media.uploadIntent.create',
    'media.uploadIntent.localObject.put',
    'media.uploadIntent.finalize',
    'media.largeFinalizationJob.create',
    'media.largeFinalizationJob.get',
    'media.storageObject.get',
    'media.storageObject.downloadTarget.create',
    'media.storageObject.localObject.get',
  ]) {
    const route = getApiRouteById(routeId)
    assert.equal(route?.runtimeMode, 'frontend_safe', `${routeId} should be registered as a reviewed frontend-safe backend route.`)
    assert.equal(route?.status, 'frontend_safe_ready', `${routeId} should be marked ready for signed-in internal testing.`)
    assert.equal(route?.requiresServiceRole, false, `${routeId} must not require frontend service-role access.`)
    assert.equal(route?.requiresProviderSecret, false, `${routeId} must not require provider secrets.`)
    assert.equal(route?.requiresStripeSecret, false, `${routeId} must not require Stripe secrets.`)
    assert.notEqual(route?.securityLevel, 'public', `${routeId} must stay authenticated/workspace-scoped.`)
  }

  const file = new File([sourceFileBytes], 'uploaded-story.mp4', {
    type: 'video/mp4',
  })
  const result = await planSourceUploadsForEditor({
    files: [file],
    workspaceId: 'workspace-upload-smoke',
    projectId: 'project-upload-smoke',
    userId: 'user-upload-smoke',
  })

  assert.equal(result.ok, true, `Backend source upload planning should pass: ${JSON.stringify(result.warnings)}`)
  assert.equal(result.plannedUploads.length, 1)
  assert.equal(result.plannedUploads[0]?.uploadPlan.id, 'media-asset-upload-smoke')
  assert.equal(result.plannedUploads[0]?.uploadPlan.finalizedMediaAssetId, 'media-asset-upload-smoke')
  assert.equal(result.plannedUploads[0]?.uploadPlan.bucketName, 'source-media')
  assert.equal(result.plannedUploads[0]?.uploadPlan.storageProvider, 'local_private')
  assert.equal(result.plannedUploads[0]?.uploadPlan.checksumSha256, sourceChecksumSha256)
  assert.equal(result.plannedUploads[0]?.uploadPlan.sourceMetadata?.probeStatus, 'probed')
  assert.equal(result.plannedUploads[0]?.uploadPlan.sourceMetadata?.durationSeconds, 9.2)
  assert.equal(result.plannedUploads[0]?.uploadPlan.sourceMetadata?.width, 1920)
  assert.equal(result.plannedUploads[0]?.storageUpload?.status, 'uploaded')
  assert.equal(result.clips[0]?.fileName, 'uploaded-story.mp4')
  assert.equal(result.clips[0]?.duration, '00:09')
  assert.match(result.clips[0]?.thumbnailHint ?? '', /1920x1080/)
  assert.match(result.clips[0]?.thumbnailHint ?? '', /video\+audio/)
  assert.match(result.clips[0]?.notes ?? '', /uploaded to private source storage/i)
  assert.equal(result.sourceSequence?.sourceSequenceItems.length, 1)
  assert.equal(result.sourceSequence?.mediaAssetRecords[0]?.id, 'media-asset-upload-smoke')
  assert.equal(result.sourceSequence?.mediaAssetRecords[0]?.storageProvider, 'local_private')
  assert.equal(result.sourceSequence?.mediaAssetRecords[0]?.checksum, sourceChecksumSha256)
  const executionSourceAssets = createExecutionSourceMediaAssetsFromPlannedUploads(result.plannedUploads, result)
  assert.equal(executionSourceAssets.length, 1)
  assert.equal(executionSourceAssets[0]?.mediaAssetId, result.sourceSequence?.mediaAssetRecords[0]?.id)
  assert.equal(executionSourceAssets[0]?.mediaAssetId, result.sourceSequence?.sourceSequenceItems[0]?.mediaAssetId)
  assert.equal(executionSourceAssets[0]?.sourceSequenceItemId, result.sourceSequence?.sourceSequenceItems[0]?.id)
  assert.equal(executionSourceAssets[0]?.storageProvider, 'local_private')
  assert.equal(executionSourceAssets[0]?.checksumSha256, sourceChecksumSha256)
  assert.equal(
    executionSourceAssets[0]?.storagePath,
    'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/upload-intent-smoke/uploaded-story.mp4',
  )
  assert.equal(executionSourceAssets[0]?.privateArtifact, true)
  assert.equal(executionSourceAssets[0]?.publicUrl, null)
  assert.equal(executionSourceAssets[0]?.signedUrl, null)
  const firstIncrementalSequence = createSourceUploadFlow({
    workspaceId: 'workspace-upload-smoke',
    projectId: 'project-upload-smoke',
    uploads: [{
      uploadPlan: {
        ...result.plannedUploads[0]!.uploadPlan,
        id: 'incremental-media-asset-a',
        uploadedOrder: 1,
      },
      uploadedOrder: 1,
    }],
  })
  const secondIncrementalSequence = createSourceUploadFlow({
    workspaceId: 'workspace-upload-smoke',
    projectId: 'project-upload-smoke',
    uploads: [{
      uploadPlan: {
        ...result.plannedUploads[0]!.uploadPlan,
        id: 'incremental-media-asset-b',
        uploadedOrder: 2,
      },
      uploadedOrder: 2,
    }],
  })
  const incrementalSequenceItemIds = [
    firstIncrementalSequence.sourceSequenceItems[0]?.id,
    secondIncrementalSequence.sourceSequenceItems[0]?.id,
  ]
  assert.equal(
    new Set(incrementalSequenceItemIds).size,
    2,
    'Separate incremental upload batches must derive stable, distinct source-sequence item identities.',
  )
  assert.match(incrementalSequenceItemIds[0] ?? '', /incremental-media-asset-a/)
  assert.match(incrementalSequenceItemIds[1] ?? '', /incremental-media-asset-b/)
  const mockOnlyExecutionSourceAssets = createExecutionSourceMediaAssetsFromPlannedUploads([
    {
      file: {
        name: 'mock-planned-demo.mp4',
        size: 1024,
        type: 'video/mp4',
      },
      uploadPlan: {
        id: 'mock-planned-demo-upload',
        workspaceId: 'workspace-upload-smoke',
        projectId: 'project-upload-smoke',
        purpose: 'source_media',
        bucketName: 'mock-source-media',
        objectPath: 'mock/source/mock-planned-demo.mp4',
        storageProvider: 'local_mock',
        fileName: 'mock-planned-demo.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 1024,
        checksumSha256: 'a'.repeat(64),
        requiresAuth: false,
        createsMediaAsset: false,
        mockOnly: true,
        uploadedOrder: 1,
      },
      clip: {
        id: 'mock-planned-demo-upload',
        uploadedOrder: 1,
        fileName: 'mock-planned-demo.mp4',
        duration: 'Pending analysis',
        detectedType: 'Video source',
      },
      warnings: ['mock-only planning fixture'],
    },
  ])
  assert.equal(mockOnlyExecutionSourceAssets.length, 0, 'Mock-only upload plans must never become execution source assets.')

  const previousNodeEnv = process.env.NODE_ENV
  const previousApiMode = process.env.VITE_REEDITPRO_API_MODE
  const previousApiBaseUrl = process.env.VITE_REEDITPRO_API_BASE_URL
  const previousLocalPrivateUploads = process.env.VITE_REEDITPRO_LOCAL_PRIVATE_UPLOADS
  try {
    process.env.NODE_ENV = 'test'
    process.env.VITE_REEDITPRO_API_MODE = 'mock'
    process.env.VITE_REEDITPRO_API_BASE_URL = ''
    process.env.VITE_REEDITPRO_LOCAL_PRIVATE_UPLOADS = 'true'

    const localPrivateResult = await planSourceUploadsForEditor({
      files: [new File([Buffer.from('local private source bytes')], 'local-private-story.mp4', { type: 'video/mp4' })],
      workspaceId: 'workspace-local-private-smoke',
      projectId: 'project-local-private-smoke',
      userId: 'user-local-private-smoke',
    })
    assert.equal(localPrivateResult.ok, true, `Local private source upload planning should pass: ${JSON.stringify(localPrivateResult.warnings)}`)
    assert.equal(localPrivateResult.plannedUploads.length, 1)
    assert.equal(localPrivateResult.plannedUploads[0]?.uploadPlan.storageProvider, 'local_private')
    assert.equal(localPrivateResult.plannedUploads[0]?.uploadPlan.mockOnly, false)
    assert.equal(localPrivateResult.plannedUploads[0]?.storageUpload?.status, 'uploaded')
    assert.match(localPrivateResult.clips[0]?.notes ?? '', /uploaded to private source storage/i)
    const localPrivateExecutionAssets = createExecutionSourceMediaAssetsFromPlannedUploads(
      localPrivateResult.plannedUploads,
      localPrivateResult,
    )
    assert.equal(localPrivateExecutionAssets.length, 1)
    assert.equal(localPrivateExecutionAssets[0]?.storageProvider, 'local_private')
    assert.equal(localPrivateExecutionAssets[0]?.publicUrl, null)
    assert.equal(localPrivateExecutionAssets[0]?.signedUrl, null)
  } finally {
    restoreEnvValue('NODE_ENV', previousNodeEnv)
    restoreEnvValue('VITE_REEDITPRO_API_MODE', previousApiMode)
    restoreEnvValue('VITE_REEDITPRO_API_BASE_URL', previousApiBaseUrl)
    restoreEnvValue('VITE_REEDITPRO_LOCAL_PRIVATE_UPLOADS', previousLocalPrivateUploads)
  }

  const gcsPlannedUploads = [
    {
      file: {
        name: 'gcs-uploaded-story.mp4',
        size: 2048,
        type: 'video/mp4',
      },
      uploadPlan: {
        id: 'gcs-upload-plan-001',
        workspaceId: 'workspace-upload-smoke',
        projectId: 'project-upload-smoke',
        purpose: 'source_media',
        bucketName: 'reeditpro-source-media',
        objectPath: 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/gcs-uploaded-story.mp4',
        storageProvider: 'google_cloud_storage',
        fileName: 'gcs-uploaded-story.mp4',
        mimeType: 'video/mp4',
        fileSizeBytes: 2048,
        checksumSha256: 'b'.repeat(64),
        requiresAuth: true,
        createsMediaAsset: true,
        uploadedOrder: 1,
      },
      storageUpload: {
        ok: true,
        mode: 'backend_required',
        status: 'uploaded',
        bucketName: 'reeditpro-source-media',
        objectPath: 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/gcs-uploaded-story.mp4',
        message: 'GCS source upload completed for execution fixture.',
        warnings: [],
      },
      clip: {
        id: 'gcs-upload-plan-001',
        uploadedOrder: 1,
        fileName: 'gcs-uploaded-story.mp4',
        duration: 'Pending analysis',
        detectedType: 'Video source',
      },
      warnings: [],
    },
  ] satisfies PlannedSourceUpload[]
  const sourceRecordTimestamp = new Date(0).toISOString()
  const gcsUploadResult = {
    sourceSequence: {
      ok: true,
      sourceSequenceItems: [
        {
          id: 'gcs-source-sequence-item-001',
          sourceClipSequenceId: 'gcs-source-sequence-001',
          mediaAssetId: 'gcs-media-asset-001',
          uploadedOrder: 1,
          isImportant: false,
          isOptional: false,
          possibleUses: [],
          transcriptStatus: 'not_started',
          analysisStatus: 'completed',
          metadata: { uploadPlanId: 'gcs-upload-plan-001' },
        },
      ],
      mediaAssetRecords: [
        {
          id: 'gcs-media-asset-001',
          createdAt: sourceRecordTimestamp,
          updatedAt: sourceRecordTimestamp,
          workspaceId: 'workspace-upload-smoke',
          projectId: 'project-upload-smoke',
          assetType: 'source_video',
          storageProvider: 'google_cloud_storage',
          storageBucket: 'reeditpro-source-media',
          storagePath: 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/gcs-uploaded-story.mp4',
          fileName: 'gcs-uploaded-story.mp4',
          mimeType: 'video/mp4',
          byteSize: 2048,
          checksum: 'b'.repeat(64),
          status: 'completed',
        },
      ],
      uploadOrderSummary: {
        ok: true,
        orderedUploadPlanIds: ['gcs-upload-plan-001'],
        missingOrderIds: [],
        duplicateOrders: [],
        warnings: [],
        message: 'GCS execution fixture preserves the uploaded order.',
      },
      nextStep: 'ready_to_upload',
      message: 'GCS execution fixture source sequence is ready.',
      warnings: [],
    },
  } satisfies Pick<PlanSourceUploadsResult, 'sourceSequence'>
  const gcsExecutionSourceAssets = createExecutionSourceMediaAssetsFromPlannedUploads(
    gcsPlannedUploads,
    gcsUploadResult,
  )
  assert.equal(gcsExecutionSourceAssets.length, 1)
  assert.equal(gcsExecutionSourceAssets[0]?.storageProvider, 'google_cloud_storage')
  assert.equal(gcsExecutionSourceAssets[0]?.storageBucket, 'reeditpro-source-media')
  assert.equal(gcsExecutionSourceAssets[0]?.storagePath, 'workspaces/workspace-upload-smoke/projects/project-upload-smoke/source-media/gcs-uploaded-story.mp4')
  assert.equal(gcsExecutionSourceAssets[0]?.checksumSha256, 'b'.repeat(64))
  const relativeBackendHeaders = createBackendUploadTargetHeaders({
    apiBaseUrl: `http://127.0.0.1:${address.port}`,
    uploadUrl: '/v1/upload-intents/upload-intent-smoke/local-object',
    uploadHeaders: { 'x-goog-if-generation-match': '0' },
    mimeType: 'video/mp4',
    authorization: 'Bearer signed-in-test-token',
  })
  assert.equal(relativeBackendHeaders.authorization, 'Bearer signed-in-test-token')
  const sameOriginBackendHeaders = createBackendUploadTargetHeaders({
    apiBaseUrl: `http://127.0.0.1:${address.port}`,
    uploadUrl: `http://127.0.0.1:${address.port}/v1/upload-intents/upload-intent-smoke/local-object`,
    mimeType: 'video/mp4',
    authorization: 'Bearer signed-in-test-token',
  })
  assert.equal(sameOriginBackendHeaders.authorization, 'Bearer signed-in-test-token')
  const externalStorageHeaders = createBackendUploadTargetHeaders({
    apiBaseUrl: `http://127.0.0.1:${address.port}`,
    uploadUrl: 'https://storage.googleapis.com/reeditpro-source-media/uploaded-story.mp4?signature=fake',
    uploadHeaders: { Authorization: 'Bearer forged-provider-header' },
    mimeType: 'video/mp4',
    authorization: 'Bearer signed-in-test-token',
  })
  assert.equal(externalStorageHeaders.authorization, undefined)
  assert.equal(uploadedBytes.length, 1)
  assert.equal(uploadedBytes[0]?.toString('utf8'), sourceFileBytes.toString('utf8'))
  assert.equal(seenRequests.filter((request) => request.method === 'POST').length, 2)
  assert.equal(seenRequests.filter((request) => request.method === 'PUT').length, 1)
  assert.ok(
    seenRequests
      .filter((request) => request.method === 'POST')
      .every((request) => request.idempotencyKey?.includes('source-upload')),
    'Backend source upload writes should carry idempotency keys.',
  )

  console.log(JSON.stringify({
    ok: true,
    checks: [
      'backend_upload_intent_created',
      'source_file_bytes_uploaded_to_backend_target',
      'backend_upload_finalized_to_media_asset',
      'local_probe_metadata_promoted_to_source_clip',
      'local_private_storage_provider_preserved',
      'backend_upload_checksum_promoted_to_execution_source_asset',
      'browser_whole_file_checksum_omitted_backend_hash_is_authority',
      'finalized_backend_media_asset_identity_preserved_without_mock_record_substitution',
      'source_sequence_created_from_backend_media_asset',
      'incremental_upload_batches_keep_unique_source_sequence_item_identities',
      'execution_source_asset_mapping_preserves_local_private_storage',
      'mock_only_upload_plan_does_not_create_execution_source_asset',
      'mock_safe_local_private_upload_unblocks_internal_testing_source_asset',
      'gcs_upload_plan_preserves_bucket_and_provider_for_execution_source_asset',
      'signed_in_backend_upload_targets_receive_authorization_header',
      'external_storage_upload_targets_do_not_receive_backend_authorization_header',
      'idempotency_keys_sent_for_backend_upload_writes',
      'backend_upload_routes_registered_frontend_safe_without_service_role',
    ],
    requestCount: seenRequests.length,
    uploadedByteCount: uploadedBytes[0]?.byteLength ?? 0,
    sourceSequenceItemCount: result.sourceSequence?.sourceSequenceItems.length ?? 0,
  }))
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
    return
  }

  process.env[key] = value
}

function readRequestBody(request: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    request.on('end', () => resolve(Buffer.concat(chunks)))
    request.on('error', reject)
  })
}
