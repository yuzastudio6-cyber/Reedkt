import { randomUUID } from 'node:crypto'
import type { Readable } from 'node:stream'
import { ApiError } from '../errors/api-error'
import { createStorageAdapter, resolveBucketName } from '../storage/storage-adapter'
import { buildCanonicalObjectPath } from '../storage/storage-paths'
import { assertAllowedUpload } from '../storage/storage-validation'
import type { ObjectMetadata, UploadPurpose, UploadTarget } from '../storage/storage-types'
import type { ServiceContext } from '../types'
import { getRequiredAuthUserId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

interface CreateUploadIntentInput {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  uploadPurpose: UploadPurpose
  originalFileName: string
  mimeType: string
  expectedSizeBytes?: number
  checksumSha256?: string
}

interface FinalizeUploadIntentInput {
  workspaceId: string
  uploadIntentId: string
  sizeBytes?: number
  checksumSha256?: string
}

interface SignedUrlEventInput {
  workspaceId: string
  projectId?: string
  storageObjectRecordId?: string
  uploadIntentId?: string
  urlPurpose: string
  expiresAt: string
  metadataJson?: Record<string, unknown>
}

interface UploadIntentView {
  id: string
  workspaceId: string
  projectId: string
  chatSessionId?: string
  requestedByUserId: string
  uploadPurpose: UploadPurpose
  targetBucket: string
  targetPath: string
  originalFileName: string
  mimeType: string
  expectedSizeBytes?: number
  checksumSha256?: string
  status: string
  expiresAt: string
  finalizedAt?: string
  mediaAssetId?: string
  createdAt: string
  updatedAt: string
  mockOnly?: boolean
}

interface StorageObjectView {
  id: string
  workspaceId: string
  projectId?: string
  mediaAssetId?: string
  uploadIntentId?: string
  bucketName: string
  objectPath: string
  objectPurpose: string
  mimeType?: string
  sizeBytes?: number
  checksumSha256?: string
  region?: string
  status: string
  createdAt: string
  updatedAt: string
  mockOnly?: boolean
}

interface MediaAssetView {
  id: string
  workspaceId: string
  projectId: string
  assetType: string
  fileName: string
  mimeType: string
  storageBucket: string
  storagePath: string
  sizeBytes?: number
  checksumSha256?: string
  status: string
  createdAt: string
  updatedAt: string
  mockOnly?: boolean
}

interface LocalObjectUploadView {
  uploadIntentId: string
  bucketName: string
  objectPath: string
  mimeType?: string
  sizeBytes: number
  checksumSha256: string
  status: 'uploaded'
  temporaryMetadataOnly: boolean
}

const mockUploadIntents = new Map<string, UploadIntentView>()
const mockStorageObjects = new Map<string, StorageObjectView>()
const mockStorageObjectByUploadIntent = new Map<string, string>()
const mockMediaAssets = new Map<string, MediaAssetView>()

export function getMockMediaAsset(mediaAssetId: string): MediaAssetView | undefined {
  return mockMediaAssets.get(mediaAssetId)
}

export function createUploadService(context: ServiceContext) {
  const storage = createStorageAdapter(context.env)

  return {
    async createUploadIntent(input: CreateUploadIntentInput) {
      const userId = getRequiredAuthUserId(context)
      assertAllowedUpload({
        purpose: input.uploadPurpose,
        mimeType: input.mimeType,
        expectedSizeBytes: input.expectedSizeBytes,
      })

      const uploadIntentId = randomUUID()
      const now = nowIso()
      const expiresAt = new Date(Date.now() + context.env.signedUrlTtlSeconds * 1000).toISOString()
      const targetBucket = resolveBucketName(context.env, input.uploadPurpose)
      const targetPath = buildCanonicalObjectPath({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        purpose: input.uploadPurpose,
        ownerId: uploadIntentId,
        fileName: input.originalFileName,
      })

      const uploadTarget = await storage.createUploadTarget({
        uploadIntentId,
        bucketName: targetBucket,
        objectPath: targetPath,
        mimeType: input.mimeType,
        expiresAt,
      })

      if (!context.clients.admin || context.env.mockOnly) {
        const uploadIntent: UploadIntentView = {
          id: uploadIntentId,
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          chatSessionId: input.chatSessionId,
          requestedByUserId: userId,
          uploadPurpose: input.uploadPurpose,
          targetBucket,
          targetPath,
          originalFileName: input.originalFileName,
          mimeType: input.mimeType,
          expectedSizeBytes: input.expectedSizeBytes,
          checksumSha256: input.checksumSha256,
          status: 'signed',
          expiresAt,
          createdAt: now,
          updatedAt: now,
          mockOnly: true,
        }
        mockUploadIntents.set(uploadIntent.id, uploadIntent)
        const signedUrlEvent = await recordSignedUrlEvent(context, {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          uploadIntentId,
          urlPurpose: 'upload',
          expiresAt,
          metadataJson: uploadTargetMetadata(storage.mode, uploadTarget, targetBucket, targetPath),
        })

        return {
          uploadIntent,
          uploadTarget,
          signedUrlEvent: signedUrlEvent.signedUrlEvent,
          warnings: [
            mockWarning('Upload intent creation'),
            'Upload target is temporary; canonical storage truth is bucketName + objectPath only.',
          ],
        }
      }

      const { data, error } = await context.clients.admin
        .from('upload_intents')
        .insert({
          id: uploadIntentId,
          workspace_id: input.workspaceId,
          project_id: input.projectId,
          chat_session_id: input.chatSessionId ?? null,
          requested_by_user_id: userId,
          upload_purpose: toDatabaseUploadPurpose(input.uploadPurpose),
          target_bucket: targetBucket,
          target_path: targetPath,
          original_file_name: input.originalFileName,
          mime_type: input.mimeType,
          expected_size_bytes: input.expectedSizeBytes ?? null,
          checksum_sha256: input.checksumSha256 ?? null,
          status: 'signed',
          expires_at: expiresAt,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      const signedUrlEvent = await recordSignedUrlEvent(context, {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        uploadIntentId,
        urlPurpose: 'upload',
        expiresAt,
        metadataJson: uploadTargetMetadata(storage.mode, uploadTarget, targetBucket, targetPath),
      })
      return {
        uploadIntent: mapUploadIntent(data),
        uploadTarget,
        signedUrlEvent: signedUrlEvent.signedUrlEvent,
        warnings: ['Upload intent created without storing a signed URL as canonical truth.'],
      }
    },

    async uploadLocalObject(uploadIntentId: string, body: Buffer, mimeType?: string) {
      if (storage.mode !== 'local') {
        throw new ApiError('MOCK_ONLY', 'Local object upload route is available only when STORAGE_MODE=local.', 409)
      }

      const uploadIntent = await loadUploadIntent(context, uploadIntentId)
      if (uploadIntent.status === 'finalized') {
        throw new ApiError('UPLOAD_NOT_FINALIZED', 'Upload intent is already finalized.', 409)
      }

      const metadata = await storage.putObject({
        bucketName: uploadIntent.targetBucket,
        objectPath: uploadIntent.targetPath,
        body,
        mimeType: mimeType ?? uploadIntent.mimeType,
      })

      await markUploadIntentUploaded(context, uploadIntentId)
      const localObjectUpload: LocalObjectUploadView = {
        uploadIntentId,
        bucketName: metadata.bucketName,
        objectPath: metadata.objectPath,
        mimeType: mimeType ?? uploadIntent.mimeType,
        sizeBytes: metadata.sizeBytes,
        checksumSha256: metadata.checksumSha256,
        status: 'uploaded',
        temporaryMetadataOnly: true,
      }

      return {
        localObjectUpload,
        warnings: ['Local object upload stored private test bytes under the backend storage root; no filesystem path was exposed.'],
      }
    },

    async finalizeUploadIntent(input: FinalizeUploadIntentInput) {
      const uploadIntent = await loadUploadIntent(context, input.uploadIntentId)
      if (uploadIntent.workspaceId !== input.workspaceId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Upload intent does not belong to the requested workspace.', 403)
      }

      if (uploadIntent.status === 'finalized' && uploadIntent.mediaAssetId) {
        return loadFinalizedUploadResult(uploadIntent)
      }

      const metadata = await storage.verifyUploadedObject({
        bucketName: uploadIntent.targetBucket,
        objectPath: uploadIntent.targetPath,
        expectedSizeBytes: input.sizeBytes ?? uploadIntent.expectedSizeBytes,
        checksumSha256: input.checksumSha256 ?? uploadIntent.checksumSha256,
      })

      const mediaAsset = await createMediaAsset(context, uploadIntent, metadata)
      const storageObjectRecord = await createStorageObjectRecord(context, uploadIntent, metadata, mediaAsset.id)
      await finalizeUploadIntentRow(context, uploadIntent.id, mediaAsset.id)

      const finalizedIntent: UploadIntentView = {
        ...uploadIntent,
        status: 'finalized',
        finalizedAt: nowIso(),
        mediaAssetId: mediaAsset.id,
        updatedAt: nowIso(),
      }
      mockUploadIntents.set(finalizedIntent.id, finalizedIntent)

      return {
        uploadIntent: finalizedIntent,
        storageObjectRecord,
        mediaAsset,
        warnings: ['Upload finalized with canonical bucket/object metadata only; no signed URL was stored.'],
      }
    },

    async recordSignedUrlEvent(input: SignedUrlEventInput) {
      return recordSignedUrlEvent(context, input)
    },

    async getStorageObjectRecord(storageObjectRecordId: string, workspaceId: string) {
      const storageObjectRecord = await loadStorageObjectRecord(context, storageObjectRecordId)
      if (storageObjectRecord.workspaceId !== workspaceId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Storage object does not belong to the requested workspace.', 403)
      }

      return {
        storageObjectRecord,
        canonicalOnly: true,
        warnings: ['Canonical storage metadata does not include temporary URLs.'],
      }
    },

    async createDownloadTarget(storageObjectRecordId: string, workspaceId: string, urlPurpose = 'download') {
      const storageObjectRecord = await loadStorageObjectRecord(context, storageObjectRecordId)
      if (storageObjectRecord.workspaceId !== workspaceId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Storage object does not belong to the requested workspace.', 403)
      }

      const expiresAt = new Date(Date.now() + context.env.signedUrlTtlSeconds * 1000).toISOString()
      const downloadTarget = await storage.createDownloadTarget({
        storageObjectRecordId,
        bucketName: storageObjectRecord.bucketName,
        objectPath: storageObjectRecord.objectPath,
        expiresAt,
        workspaceId,
      })
      const signedUrlEvent = await recordSignedUrlEvent(context, {
        workspaceId,
        projectId: storageObjectRecord.projectId,
        storageObjectRecordId,
        urlPurpose,
        expiresAt,
        metadataJson: {
          targetType: storage.mode === 'local' ? 'backend_local_get_route' : 'temporary_storage_target',
          downloadMethod: downloadTarget.downloadMethod,
          hasTemporaryTarget: Boolean(downloadTarget.downloadUrl),
          bucketName: storageObjectRecord.bucketName,
          objectPath: storageObjectRecord.objectPath,
        },
      })

      return {
        downloadTarget,
        signedUrlEvent: signedUrlEvent.signedUrlEvent,
        warnings: ['Download target is temporary and was not stored as canonical truth.'],
      }
    },

    async createLocalObjectStream(storageObjectRecordId: string, workspaceId: string): Promise<{
      stream: Readable
      storageObjectRecord: StorageObjectView
    }> {
      if (storage.mode !== 'local') {
        throw new ApiError('MOCK_ONLY', 'Local object reads are available only when STORAGE_MODE=local.', 409)
      }

      const storageObjectRecord = await loadStorageObjectRecord(context, storageObjectRecordId)
      if (storageObjectRecord.workspaceId !== workspaceId) {
        throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Storage object does not belong to the requested workspace.', 403)
      }

      const stream = await storage.createReadStream(storageObjectRecord.bucketName, storageObjectRecord.objectPath)
      return { stream, storageObjectRecord }
    },
  }
}

function uploadTargetMetadata(
  storageMode: string,
  uploadTarget: UploadTarget,
  bucketName: string,
  objectPath: string,
): Record<string, unknown> {
  return {
    targetType: storageMode === 'local' ? 'backend_local_put_route' : 'temporary_storage_target',
    uploadMethod: uploadTarget.uploadMethod,
    hasTemporaryTarget: Boolean(uploadTarget.uploadUrl),
    bucketName,
    objectPath,
  }
}

async function recordSignedUrlEvent(context: ServiceContext, input: SignedUrlEventInput) {
  if (!context.clients.admin || context.env.mockOnly) {
    return {
      signedUrlEvent: {
        id: randomUUID(),
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        storageObjectRecordId: input.storageObjectRecordId,
        uploadIntentId: input.uploadIntentId,
        requestedByUserId: context.auth?.userId,
        urlPurpose: input.urlPurpose,
        expiresAt: input.expiresAt,
        metadataJson: input.metadataJson ?? {},
        createdAt: nowIso(),
        mockOnly: true,
      },
      warnings: [mockWarning('Signed URL event recording'), 'The signed URL itself was not stored.'],
    }
  }

  const { data, error } = await context.clients.admin
    .from('signed_url_events')
    .insert({
      workspace_id: input.workspaceId,
      project_id: input.projectId ?? null,
      storage_object_record_id: input.storageObjectRecordId ?? null,
      upload_intent_id: input.uploadIntentId ?? null,
      requested_by_user_id: context.auth?.userId ?? null,
      url_purpose: input.urlPurpose,
      expires_at: input.expiresAt,
      metadata_json: input.metadataJson ?? {},
    })
    .select('*')
    .single()

  throwOnSupabaseError(error)
  return { signedUrlEvent: mapSignedUrlEvent(data), warnings: ['Signed URL event metadata recorded without the URL value.'] }
}

async function loadUploadIntent(context: ServiceContext, uploadIntentId: string): Promise<UploadIntentView> {
  const mockIntent = mockUploadIntents.get(uploadIntentId)
  if (mockIntent) return mockIntent

  if (!context.clients.admin || context.env.mockOnly) {
    throw new ApiError('UPLOAD_INTENT_NOT_FOUND', 'Upload intent was not found in local/mock state.', 404)
  }

  const { data, error } = await context.clients.admin
    .from('upload_intents')
    .select('*')
    .eq('id', uploadIntentId)
    .single()

  throwOnSupabaseError(error, 'UPLOAD_INTENT_NOT_FOUND')
  if (!data) throw new ApiError('UPLOAD_INTENT_NOT_FOUND', 'Upload intent was not found.', 404)
  return mapUploadIntent(data)
}

async function loadStorageObjectRecord(context: ServiceContext, storageObjectRecordId: string): Promise<StorageObjectView> {
  const mockRecord = mockStorageObjects.get(storageObjectRecordId)
  if (mockRecord) return mockRecord

  if (!context.clients.admin || context.env.mockOnly) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Storage object record was not found in local/mock state.', 404)
  }

  const { data, error } = await context.clients.admin
    .from('storage_object_records')
    .select('*')
    .eq('id', storageObjectRecordId)
    .single()

  throwOnSupabaseError(error, 'UPLOAD_NOT_FINALIZED')
  if (!data) throw new ApiError('UPLOAD_NOT_FINALIZED', 'Storage object record was not found.', 404)
  return mapStorageObjectRecord(data)
}

async function markUploadIntentUploaded(context: ServiceContext, uploadIntentId: string): Promise<void> {
  const mockIntent = mockUploadIntents.get(uploadIntentId)
  if (mockIntent) {
    mockUploadIntents.set(uploadIntentId, { ...mockIntent, status: 'uploaded', updatedAt: nowIso() })
  }

  if (context.clients.admin && !context.env.mockOnly) {
    const { error } = await context.clients.admin
      .from('upload_intents')
      .update({ status: 'uploaded', updated_at: nowIso() })
      .eq('id', uploadIntentId)

    throwOnSupabaseError(error)
  }
}

async function createMediaAsset(
  context: ServiceContext,
  uploadIntent: UploadIntentView,
  metadata: ObjectMetadata,
): Promise<MediaAssetView> {
  const now = nowIso()
  const mediaAssetId = randomUUID()
  const mediaAsset: MediaAssetView = {
    id: mediaAssetId,
    workspaceId: uploadIntent.workspaceId,
    projectId: uploadIntent.projectId,
    assetType: mediaAssetTypeForUpload(uploadIntent),
    fileName: uploadIntent.originalFileName,
    mimeType: uploadIntent.mimeType,
    storageBucket: metadata.bucketName,
    storagePath: metadata.objectPath,
    sizeBytes: metadata.sizeBytes,
    checksumSha256: metadata.checksumSha256,
    status: 'uploaded',
    createdAt: now,
    updatedAt: now,
    mockOnly: !context.clients.admin || context.env.mockOnly,
  }

  if (!context.clients.admin || context.env.mockOnly) {
    mockMediaAssets.set(mediaAsset.id, mediaAsset)
    return mediaAsset
  }

  const { data, error } = await context.clients.admin
    .from('media_assets')
    .insert({
      id: mediaAssetId,
      workspace_id: uploadIntent.workspaceId,
      project_id: uploadIntent.projectId,
      created_by: context.auth?.userId ?? null,
      asset_type: mediaAsset.assetType,
      processing_status: 'uploaded',
      file_name: uploadIntent.originalFileName,
      display_name: uploadIntent.originalFileName,
      mime_type: uploadIntent.mimeType,
      storage_provider: context.env.storageMode === 'local' ? 'local_private_storage' : 'gcs',
      storage_bucket: metadata.bucketName,
      storage_path: metadata.objectPath,
      public_url: null,
      signed_url_expires_at: null,
      file_size_bytes: metadata.sizeBytes,
      checksum: metadata.checksumSha256,
      metadata: {
        uploadIntentId: uploadIntent.id,
        storageMode: context.env.storageMode,
      },
    })
    .select('*')
    .single()

  throwOnSupabaseError(error)
  return mapMediaAsset(data)
}

async function createStorageObjectRecord(
  context: ServiceContext,
  uploadIntent: UploadIntentView,
  metadata: ObjectMetadata,
  mediaAssetId: string,
): Promise<StorageObjectView> {
  const existingId = mockStorageObjectByUploadIntent.get(uploadIntent.id)
  if (existingId) {
    const existing = mockStorageObjects.get(existingId)
    if (existing) return existing
  }

  const now = nowIso()
  const storageObjectRecord: StorageObjectView = {
    id: randomUUID(),
    workspaceId: uploadIntent.workspaceId,
    projectId: uploadIntent.projectId,
    mediaAssetId,
    uploadIntentId: uploadIntent.id,
    bucketName: metadata.bucketName,
    objectPath: metadata.objectPath,
    objectPurpose: toDatabaseStoragePurpose(uploadIntent.uploadPurpose),
    mimeType: uploadIntent.mimeType,
    sizeBytes: metadata.sizeBytes,
    checksumSha256: metadata.checksumSha256,
    region: context.env.gcsDefaultRegion,
    status: 'ready',
    createdAt: now,
    updatedAt: now,
    mockOnly: !context.clients.admin || context.env.mockOnly,
  }

  if (!context.clients.admin || context.env.mockOnly) {
    mockStorageObjects.set(storageObjectRecord.id, storageObjectRecord)
    mockStorageObjectByUploadIntent.set(uploadIntent.id, storageObjectRecord.id)
    return storageObjectRecord
  }

  const { data, error } = await context.clients.admin
    .from('storage_object_records')
    .upsert({
      id: storageObjectRecord.id,
      workspace_id: uploadIntent.workspaceId,
      project_id: uploadIntent.projectId,
      media_asset_id: mediaAssetId,
      upload_intent_id: uploadIntent.id,
      bucket_name: metadata.bucketName,
      object_path: metadata.objectPath,
      object_purpose: storageObjectRecord.objectPurpose,
      mime_type: uploadIntent.mimeType,
      size_bytes: metadata.sizeBytes,
      checksum_sha256: metadata.checksumSha256,
      region: context.env.gcsDefaultRegion,
      status: 'ready',
    }, { onConflict: 'bucket_name,object_path' })
    .select('*')
    .single()

  throwOnSupabaseError(error)
  return mapStorageObjectRecord(data)
}

async function finalizeUploadIntentRow(context: ServiceContext, uploadIntentId: string, mediaAssetId: string): Promise<void> {
  if (!context.clients.admin || context.env.mockOnly) return

  const { error } = await context.clients.admin
    .from('upload_intents')
    .update({
      status: 'finalized',
      finalized_at: nowIso(),
      media_asset_id: mediaAssetId,
    })
    .eq('id', uploadIntentId)

  throwOnSupabaseError(error)
}

function loadFinalizedUploadResult(uploadIntent: UploadIntentView) {
  const storageObjectId = mockStorageObjectByUploadIntent.get(uploadIntent.id)
  const storageObjectRecord = storageObjectId ? mockStorageObjects.get(storageObjectId) : undefined
  const mediaAsset = uploadIntent.mediaAssetId ? mockMediaAssets.get(uploadIntent.mediaAssetId) : undefined

  if (!storageObjectRecord || !mediaAsset) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Finalized upload metadata is incomplete.', 409)
  }

  return {
    uploadIntent,
    storageObjectRecord,
    mediaAsset,
    warnings: ['Upload was already finalized; returning existing canonical metadata.'],
  }
}

function mapUploadIntent(row: Record<string, unknown>): UploadIntentView {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    projectId: String(row.project_id),
    chatSessionId: maybeString(row.chat_session_id),
    requestedByUserId: String(row.requested_by_user_id),
    uploadPurpose: fromDatabaseUploadPurpose(String(row.upload_purpose)),
    targetBucket: String(row.target_bucket),
    targetPath: String(row.target_path),
    originalFileName: String(row.original_file_name),
    mimeType: String(row.mime_type),
    expectedSizeBytes: maybeNumber(row.expected_size_bytes),
    checksumSha256: maybeString(row.checksum_sha256),
    status: String(row.status),
    expiresAt: String(row.expires_at),
    finalizedAt: maybeString(row.finalized_at),
    mediaAssetId: maybeString(row.media_asset_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapStorageObjectRecord(row: Record<string, unknown>): StorageObjectView {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    projectId: maybeString(row.project_id),
    mediaAssetId: maybeString(row.media_asset_id),
    uploadIntentId: maybeString(row.upload_intent_id),
    bucketName: String(row.bucket_name),
    objectPath: String(row.object_path),
    objectPurpose: fromDatabaseStoragePurpose(String(row.object_purpose)),
    mimeType: maybeString(row.mime_type),
    sizeBytes: maybeNumber(row.size_bytes),
    checksumSha256: maybeString(row.checksum_sha256),
    region: maybeString(row.region),
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapMediaAsset(row: Record<string, unknown>): MediaAssetView {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    projectId: String(row.project_id),
    assetType: String(row.asset_type),
    fileName: String(row.file_name),
    mimeType: String(row.mime_type),
    storageBucket: String(row.storage_bucket),
    storagePath: String(row.storage_path),
    sizeBytes: maybeNumber(row.file_size_bytes),
    checksumSha256: maybeString(row.checksum),
    status: String(row.processing_status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapSignedUrlEvent(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    storageObjectRecordId: row.storage_object_record_id,
    uploadIntentId: row.upload_intent_id,
    requestedByUserId: row.requested_by_user_id,
    urlPurpose: row.url_purpose,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    metadataJson: row.metadata_json ?? {},
  }
}

function mediaAssetTypeForUpload(uploadIntent: UploadIntentView): string {
  const isVideo = uploadIntent.mimeType.startsWith('video/')
  const isAudio = uploadIntent.mimeType.startsWith('audio/')
  const isImage = uploadIntent.mimeType.startsWith('image/')

  if (uploadIntent.uploadPurpose === 'reference_media') return isVideo ? 'reference_video' : 'reference_image'
  if (uploadIntent.uploadPurpose === 'preview') return 'preview_render'
  if (uploadIntent.uploadPurpose === 'export') return 'final_export'
  if (uploadIntent.uploadPurpose === 'generated_asset') return isAudio ? 'generated_audio' : 'generated_overlay'
  if (isAudio) return 'source_audio'
  if (isImage) return 'source_image'
  return 'source_video'
}

function toDatabaseUploadPurpose(purpose: UploadPurpose): string {
  if (purpose === 'preview') return 'preview_render'
  if (purpose === 'export') return 'final_export'
  if (purpose === 'processed_media') return 'generated_asset'
  return purpose
}

function fromDatabaseUploadPurpose(purpose: string): UploadPurpose {
  if (purpose === 'preview_render') return 'preview'
  if (purpose === 'final_export') return 'export'
  if (purpose === 'audio_asset') return 'generated_asset'
  if (purpose === 'profile_asset' || purpose === 'brand_asset') return 'reference_media'
  if (isUploadPurpose(purpose)) return purpose
  return 'source_media'
}

function toDatabaseStoragePurpose(purpose: UploadPurpose): string {
  if (purpose === 'preview') return 'preview_render'
  if (purpose === 'export') return 'final_export'
  return purpose
}

function fromDatabaseStoragePurpose(purpose: string): string {
  if (purpose === 'preview_render') return 'preview'
  if (purpose === 'final_export') return 'export'
  return purpose
}

function isUploadPurpose(value: string): value is UploadPurpose {
  return [
    'source_media',
    'reference_media',
    'generated_asset',
    'processed_media',
    'preview',
    'export',
    'thumbnail',
    'qa_artifact',
    'worker_temp',
  ].includes(value)
}

function maybeString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function maybeNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value !== '') return Number(value)
  return undefined
}
