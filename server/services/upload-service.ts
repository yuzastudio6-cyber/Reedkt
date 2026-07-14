import { randomUUID } from 'node:crypto'
import type { Readable } from 'node:stream'
import { ApiError } from '../errors/api-error'
import { probeMediaFile } from '../media/ffprobe'
import {
  isPrivateSourceProbeTerminalIntegrityError,
  stagePrivateSourceForProbe,
} from '../media/private-source-probe-staging'
import { createStorageAdapter, resolveBucketName } from '../storage/storage-adapter'
import { buildCanonicalObjectPath } from '../storage/storage-paths'
import {
  assertAllowedUpload,
  assertLocalRawUploadByteLength,
  normalizeAllowedUploadMimeType,
} from '../storage/storage-validation'
import type { ObjectMetadata, StorageAdapter, UploadPurpose, UploadTarget } from '../storage/storage-types'
import {
  GCS_RESUMABLE_SESSION_TTL_SECONDS,
  shouldUseResumableUpload,
} from '../../src/types/large-media'
import { deriveMediaTaskTimeoutMs } from '../workers/media/media-task-policy'
import type { ServiceContext } from '../types'
import type {
  PrivateMediaAssetAuthorityRecord,
  PrivateStorageObjectAuthorityRecord,
  PrivateUploadIntentAuthorityRecord,
} from '../validation/private-upload-media-authority-schemas'
import {
  commitPrivateFinalizedUploadAuthority,
  createPrivateUploadIntentAuthority,
  loadPrivateFinalizedMediaAuthority,
  loadPrivateStorageObjectAuthority,
  loadPrivateUploadIntentAuthority,
  privateUploadMediaAuthorityValueHash,
  transitionPrivateUploadIntentAuthority,
  type PrivateUploadMediaAuthorityScope,
} from './private-upload-media-authority-store'
import { createProjectService } from './project-service'
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
  idempotencyKey?: string
}

interface FinalizeUploadIntentInput {
  workspaceId: string
  uploadIntentId: string
  sizeBytes?: number
  checksumSha256?: string
}

interface FinalizeUploadIntentOptions {
  /** Server-owned background worker authority. Never accepted from an HTTP body. */
  backgroundWorkerAuthority?: true
}

export interface UploadFinalizationCandidate {
  uploadIntentId: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  uploadPurpose: 'source_media' | 'reference_media'
  expectedSizeBytes: number
  status: string
  storageMode: StorageAdapter['mode']
  backgroundFinalizationRequired: boolean
  authorityFingerprint: string
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
  uploadPurpose?: 'source_media' | 'reference_media'
  storageProvider?: 'local_private' | 'google_cloud_storage'
  bucketName: string
  objectPath: string
  objectPurpose: string
  mimeType?: string
  sizeBytes?: number
  checksumSha256?: string
  generation?: string
  etag?: string
  metageneration?: string
  integrityVerified?: true
  checksumSource?: 'server_computed_bytes'
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
  uploadIntentId?: string
  storageObjectRecordId?: string
  uploadPurpose?: 'source_media' | 'reference_media'
  assetType: string
  fileName: string
  mimeType: string
  storageProvider?: string
  storageBucket: string
  storagePath: string
  sizeBytes?: number
  checksumSha256?: string
  storageGeneration?: string
  storageEtag?: string
  storageMetageneration?: string
  integrityVerified?: true
  checksumSource?: 'server_computed_bytes'
  sourceMetadata?: SourceMediaMetadataView
  status: string
  createdAt: string
  updatedAt: string
  mockOnly?: boolean
}

interface SourceMediaMetadataView {
  probeStatus: 'probed' | 'unavailable'
  source: 'local_ffprobe' | 'gcs_ffprobe'
  durationSeconds?: number
  width?: number
  height?: number
  videoCodec?: string
  audioCodec?: string
  pixelFormat?: string
  colorSpace?: string
  colorTransfer?: string
  colorPrimaries?: string
  colorRange?: string
  bitsPerRawSample?: number
  formatName?: string
  streamCount?: number
  hasVideo: boolean
  hasAudio: boolean
  unavailableReason?: string
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

type UserStorageAccessPurpose =
  | 'metadata'
  | 'download'
  | 'preview_review'
  | 'thumbnail'
  | 'qa_review'
  | 'export_delivery'

const backendLocalStorageObjects = new Map<string, StorageObjectView>()

function backendLocalStorageObjectKey(workspaceId: string, storageObjectRecordId: string): string {
  return `${workspaceId}\u0000${storageObjectRecordId}`
}

export function registerBackendLocalStorageObjectRecord(input: {
  id: string
  workspaceId: string
  projectId?: string
  bucketName: string
  objectPath: string
  objectPurpose: string
  mimeType?: string
  sizeBytes?: number
  checksumSha256?: string
}): StorageObjectView {
  const now = nowIso()
  const storageObjectRecord: StorageObjectView = {
    id: input.id,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    bucketName: input.bucketName,
    objectPath: input.objectPath,
    objectPurpose: input.objectPurpose,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    checksumSha256: input.checksumSha256,
    status: 'ready',
    createdAt: now,
    updatedAt: now,
    mockOnly: true,
  }
  backendLocalStorageObjects.set(
    backendLocalStorageObjectKey(storageObjectRecord.workspaceId, storageObjectRecord.id),
    storageObjectRecord,
  )
  return storageObjectRecord
}

export function createUploadService(context: ServiceContext) {
  const storage = context.storageAdapter ?? createStorageAdapter(context.env)

  return {
    async authorizeCreateUploadIntent(input: CreateUploadIntentInput) {
      await assertUploadProjectOwnedByCurrentUser(context, input.projectId, input.workspaceId)
      assertProductionUploadUsesDirectObjectStorage(context, storage)
      assertUserInitiatedUploadPurpose(input.uploadPurpose)
      assertAllowedUpload({
        purpose: input.uploadPurpose,
        mimeType: input.mimeType,
        expectedSizeBytes: input.expectedSizeBytes,
      })
    },

    async authorizeUploadIntentWrite(uploadIntentId: string, workspaceId: string) {
      const uploadIntent = await loadUploadIntent(context, uploadIntentId, workspaceId)
      await assertUploadIntentAccessibleByCurrentUser(context, uploadIntent, workspaceId)
      assertUserInitiatedUploadPurpose(uploadIntent.uploadPurpose)
    },

    async authorizeLocalObjectUpload(
      uploadIntentId: string,
      workspaceId: string,
      mimeType: string | undefined,
      declaredContentLength: number,
    ) {
      assertLocalRawUploadRuntimeEnabled(context, storage)
      assertLocalRawUploadByteLength(declaredContentLength)
      const uploadIntent = await loadUploadIntent(context, uploadIntentId, workspaceId)
      await assertUploadIntentAccessibleByCurrentUser(context, uploadIntent, workspaceId)
      assertUserInitiatedUploadPurpose(uploadIntent.uploadPurpose)
      assertLocalUploadRequestMatchesIntent(uploadIntent, mimeType, declaredContentLength)
    },

    async authorizeSignedUrlEvent(input: SignedUrlEventInput) {
      await assertSignedUrlEventAccess(context, input)
    },

    async authorizeStorageObjectRead(
      storageObjectRecordId: string,
      workspaceId: string,
      accessPurpose: string,
    ) {
      const storageObjectRecord = await loadStorageObjectRecord(context, storageObjectRecordId, workspaceId)
      assertStorageObjectWorkspace(storageObjectRecord, workspaceId)
      await assertStorageObjectAccessibleByCurrentUser(
        context,
        storageObjectRecord,
        normalizeUserStorageAccessPurpose(accessPurpose),
      )
    },

    async createUploadIntent(input: CreateUploadIntentInput) {
      const userId = getRequiredAuthUserId(context)
      const mimeType = normalizeAllowedUploadMimeType(input.mimeType)
      await assertUploadProjectOwnedByCurrentUser(context, input.projectId, input.workspaceId)
      assertProductionUploadUsesDirectObjectStorage(context, storage)
      assertUserInitiatedUploadPurpose(input.uploadPurpose)
      assertAllowedUpload({
        purpose: input.uploadPurpose,
        mimeType,
        expectedSizeBytes: input.expectedSizeBytes,
      })

      const uploadIntentId = randomUUID()
      const now = nowIso()
      const usesResumableCloudSession = storage.mode === 'gcs' && shouldUseResumableUpload(input.expectedSizeBytes)
      const uploadTargetTtlSeconds = usesResumableCloudSession
        ? GCS_RESUMABLE_SESSION_TTL_SECONDS
        : context.env.signedUrlTtlSeconds
      const expiresAt = new Date(Date.now() + uploadTargetTtlSeconds * 1000).toISOString()
      const targetBucket = resolveBucketName(context.env, input.uploadPurpose)
      const targetPath = buildCanonicalObjectPath({
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        purpose: input.uploadPurpose,
        ownerId: uploadIntentId,
        fileName: input.originalFileName,
      })

      let uploadTarget = await storage.createUploadTarget({
        uploadIntentId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        bucketName: targetBucket,
        objectPath: targetPath,
        mimeType,
        expectedSizeBytes: input.expectedSizeBytes,
        checksumSha256: normalizeChecksumSha256(input.checksumSha256),
        expiresAt,
      })

      if (usesLocalUploadPersistence(context)) {
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
          mimeType,
          expectedSizeBytes: input.expectedSizeBytes,
          checksumSha256: input.checksumSha256,
          status: 'signed',
          expiresAt,
          createdAt: now,
          updatedAt: now,
          mockOnly: true,
        }
        const persistedUploadIntent = await createPrivateUploadIntentAuthority({
          scope: privateUploadMediaAuthorityScope(context, input.workspaceId),
          uploadIntent: toPrivateUploadIntentAuthorityRecord(uploadIntent),
          idempotencyKey: input.idempotencyKey,
          requestHash: input.idempotencyKey
            ? privateUploadMediaAuthorityValueHash({
                operation: 'create_upload_intent',
                workspaceId: input.workspaceId,
                projectId: input.projectId,
                chatSessionId: input.chatSessionId,
                uploadPurpose: input.uploadPurpose,
                originalFileName: input.originalFileName,
                mimeType,
                expectedSizeBytes: input.expectedSizeBytes,
                checksumSha256: normalizeChecksumSha256(input.checksumSha256),
              })
            : undefined,
          now,
        })
        if (persistedUploadIntent.id !== uploadIntentId) {
          uploadTarget = await storage.createUploadTarget({
            uploadIntentId: persistedUploadIntent.id,
            workspaceId: persistedUploadIntent.workspaceId,
            projectId: persistedUploadIntent.projectId,
            bucketName: persistedUploadIntent.targetBucket,
            objectPath: persistedUploadIntent.targetPath,
            mimeType: persistedUploadIntent.mimeType,
            expectedSizeBytes: persistedUploadIntent.expectedSizeBytes,
            checksumSha256: persistedUploadIntent.checksumSha256,
            expiresAt: persistedUploadIntent.expiresAt,
          })
        }
        const signedUrlEvent = await recordSignedUrlEvent(context, {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          uploadIntentId: persistedUploadIntent.id,
          urlPurpose: 'upload',
          expiresAt,
          metadataJson: uploadTargetMetadata(storage.mode, uploadTarget, targetBucket, targetPath),
        })

        return {
          uploadIntent: persistedUploadIntent,
          uploadTarget,
          signedUrlEvent: signedUrlEvent.signedUrlEvent,
          warnings: [
            mockWarning('Upload intent creation'),
            'Upload target is temporary; canonical storage truth is bucketName + objectPath only.',
          ],
        }
      }

      const adminClient = getRequiredUploadAdminClient(context)
      const { data, error } = await adminClient
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
          mime_type: mimeType,
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

    async uploadLocalObject(
      uploadIntentId: string,
      workspaceId: string,
      body: Buffer,
      mimeType?: string,
      declaredContentLength?: number,
    ) {
      assertLocalRawUploadRuntimeEnabled(context, storage)
      assertLocalRawUploadByteLength(body.byteLength)
      if (declaredContentLength !== undefined && body.byteLength !== declaredContentLength) {
        throw new ApiError('VALIDATION_FAILED', 'Local raw upload body size does not match Content-Length.', 400, {
          declaredContentLength,
          actualSizeBytes: body.byteLength,
        })
      }
      const uploadIntent = await loadUploadIntent(context, uploadIntentId, workspaceId)
      await assertUploadIntentAccessibleByCurrentUser(context, uploadIntent, workspaceId)
      assertUserInitiatedUploadPurpose(uploadIntent.uploadPurpose)
      if (uploadIntent.status === 'finalized') {
        throw new ApiError('UPLOAD_NOT_FINALIZED', 'Upload intent is already finalized.', 409)
      }
      assertLocalUploadRequestMatchesIntent(uploadIntent, mimeType, body.byteLength)
      const expectedMimeType = normalizeMimeType(uploadIntent.mimeType)
      assertAllowedUpload({
        purpose: uploadIntent.uploadPurpose,
        mimeType: expectedMimeType,
        expectedSizeBytes: body.byteLength,
      })

      const metadata = await storage.putObject({
        bucketName: uploadIntent.targetBucket,
        objectPath: uploadIntent.targetPath,
        body,
        mimeType: expectedMimeType,
      })

      await markUploadIntentUploaded(context, uploadIntentId, workspaceId)
      const localObjectUpload: LocalObjectUploadView = {
        uploadIntentId,
        bucketName: metadata.bucketName,
        objectPath: metadata.objectPath,
        mimeType: expectedMimeType,
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

    async getUploadFinalizationCandidate(
      uploadIntentId: string,
      workspaceId: string,
    ): Promise<UploadFinalizationCandidate> {
      const uploadIntent = await loadUploadIntent(context, uploadIntentId, workspaceId)
      await assertUploadIntentAccessibleByCurrentUser(context, uploadIntent, workspaceId)
      assertUserInitiatedUploadPurpose(uploadIntent.uploadPurpose)
      const expectedSizeBytes = uploadIntent.expectedSizeBytes
      if (!Number.isSafeInteger(expectedSizeBytes) || Number(expectedSizeBytes) <= 0) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Source finalization requires the exact positive byte size from its upload intent.',
          400,
        )
      }
      return {
        uploadIntentId: uploadIntent.id,
        ownerUserId: uploadIntent.requestedByUserId,
        workspaceId: uploadIntent.workspaceId,
        projectId: uploadIntent.projectId,
        uploadPurpose: uploadIntent.uploadPurpose,
        expectedSizeBytes: Number(expectedSizeBytes),
        status: uploadIntent.status,
        storageMode: storage.mode,
        backgroundFinalizationRequired:
          storage.mode === 'gcs' && shouldUseResumableUpload(Number(expectedSizeBytes)),
        authorityFingerprint: privateUploadMediaAuthorityValueHash({
          uploadIntentId: uploadIntent.id,
          requestedByUserId: uploadIntent.requestedByUserId,
          workspaceId: uploadIntent.workspaceId,
          projectId: uploadIntent.projectId,
          uploadPurpose: uploadIntent.uploadPurpose,
          targetBucket: uploadIntent.targetBucket,
          targetPath: uploadIntent.targetPath,
          mimeType: uploadIntent.mimeType,
          expectedSizeBytes: Number(expectedSizeBytes),
          expiresAt: uploadIntent.expiresAt,
        }),
      }
    },

    async finalizeUploadIntent(
      input: FinalizeUploadIntentInput,
      options: FinalizeUploadIntentOptions = {},
    ) {
      const uploadIntent = await loadUploadIntent(context, input.uploadIntentId, input.workspaceId)
      await assertUploadIntentAccessibleByCurrentUser(context, uploadIntent, input.workspaceId)
      assertUserInitiatedUploadPurpose(uploadIntent.uploadPurpose)

      if (uploadIntent.status === 'finalized' && uploadIntent.mediaAssetId) {
        return loadFinalizedUploadResult(context, uploadIntent)
      }
      if (uploadIntent.status === 'failed') {
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'Failed upload authority cannot be finalized without a new upload intent.',
          409,
        )
      }

      if (
        storage.mode === 'gcs' &&
        shouldUseResumableUpload(uploadIntent.expectedSizeBytes) &&
        options.backgroundWorkerAuthority !== true
      ) {
        throw new ApiError(
          'SOURCE_MEDIA_NOT_READY',
          'Large source media must be finalized by the restart-safe background finalization worker.',
          409,
          {
            uploadIntentId: uploadIntent.id,
            backgroundFinalizationRequired: true,
            nextAction: 'create_large_media_finalization_job',
          },
        )
      }

      if (
        uploadIntent.expectedSizeBytes !== undefined &&
        input.sizeBytes !== undefined &&
        input.sizeBytes !== uploadIntent.expectedSizeBytes
      ) {
        throw new ApiError('VALIDATION_FAILED', 'Finalized upload size cannot override the upload-intent size.', 400, {
          uploadIntentId: uploadIntent.id,
          expectedSizeBytes: uploadIntent.expectedSizeBytes,
          suppliedSizeBytes: input.sizeBytes,
        })
      }
      const intentChecksumSha256 = normalizeChecksumSha256(uploadIntent.checksumSha256)
      const suppliedChecksumSha256 = normalizeChecksumSha256(input.checksumSha256)
      if (intentChecksumSha256 && suppliedChecksumSha256 && intentChecksumSha256 !== suppliedChecksumSha256) {
        throw new ApiError('VALIDATION_FAILED', 'Finalized upload checksum cannot override the upload-intent checksum.', 400, {
          uploadIntentId: uploadIntent.id,
        })
      }
      const expectedChecksumSha256 = intentChecksumSha256 ?? suppliedChecksumSha256
      let verifiedMetadata: ObjectMetadata
      try {
        verifiedMetadata = await storage.verifyUploadedObject({
          bucketName: uploadIntent.targetBucket,
          objectPath: uploadIntent.targetPath,
          expectedSizeBytes: uploadIntent.expectedSizeBytes ?? input.sizeBytes,
          checksumSha256: expectedChecksumSha256,
        })
      } catch (error) {
        if (
          options.backgroundWorkerAuthority !== true ||
          isTerminalUploadedObjectVerificationFailure(error)
        ) {
          await markUploadIntentFailed(context, uploadIntent.id, uploadIntent.workspaceId)
        }
        throw error
      }

      let metadata: ObjectMetadata
      try {
        metadata = requireCanonicalSourceChecksum(uploadIntent, verifiedMetadata, storage.mode)
      } catch (error) {
        await cleanupRejectedUploadedObject(storage, verifiedMetadata)
        await markUploadIntentFailed(context, uploadIntent.id, uploadIntent.workspaceId)
        throw error
      }
      assertAllowedUpload({
        purpose: uploadIntent.uploadPurpose,
        mimeType: uploadIntent.mimeType,
        expectedSizeBytes: metadata.sizeBytes,
      })
      if (metadata.mimeType && normalizeMimeType(metadata.mimeType) !== normalizeMimeType(uploadIntent.mimeType)) {
        await cleanupRejectedUploadedObject(storage, metadata)
        await markUploadIntentFailed(context, uploadIntent.id, uploadIntent.workspaceId)
        throw new ApiError('VALIDATION_FAILED', 'Uploaded object MIME type does not match the upload intent.', 400, {
          uploadIntentId: uploadIntent.id,
          expectedMimeType: normalizeMimeType(uploadIntent.mimeType),
          actualMimeType: normalizeMimeType(metadata.mimeType),
        })
      }

      let mediaAsset: MediaAssetView
      try {
        mediaAsset = await createMediaAsset(context, uploadIntent, metadata, storage)
      } catch (error) {
        if (isPrivateSourceProbeTerminalIntegrityError(error)) {
          const [failedStatus, cleanupStatus] = await Promise.allSettled([
            markUploadIntentFailed(context, uploadIntent.id, uploadIntent.workspaceId),
            cleanupRejectedUploadedObject(storage, metadata),
          ])
          if (failedStatus.status === 'rejected') {
            throw new ApiError(
              'INTERNAL_ERROR',
              'Terminal upload integrity failure could not be persisted safely.',
              500,
              { reason: 'source_probe_terminal_status_persistence_failed' },
              { cause: failedStatus.reason, internal: true },
            )
          }
          if (cleanupStatus.status === 'rejected') {
            throw sourceProbeIntegrityErrorWithCleanupEvidence(error, {
              objectCleanupStatus: 'failed',
            }, cleanupStatus.reason)
          }
          const cleanupWarnings = cleanupStatus.value?.warnings.slice(0, 8) ?? []
          if (cleanupWarnings.length > 0) {
            throw sourceProbeIntegrityErrorWithCleanupEvidence(error, {
              objectCleanupStatus: 'warning',
              objectCleanupWarnings: cleanupWarnings,
            })
          }
        }
        throw error
      }
      const storageObjectRecord = await createStorageObjectRecord(context, uploadIntent, metadata, mediaAsset.id, storage)
      if (usesLocalUploadPersistence(context)) {
        const finalizedAt = nowIso()
        const finalized = await commitPrivateFinalizedUploadAuthority({
          scope: privateUploadMediaAuthorityScope(context, uploadIntent.workspaceId),
          uploadIntentId: uploadIntent.id,
          mediaAsset: toPrivateMediaAssetAuthorityRecord(
            mediaAsset,
            uploadIntent,
            storageObjectRecord,
            metadata,
          ),
          storageObject: toPrivateStorageObjectAuthorityRecord(
            storageObjectRecord,
            uploadIntent,
            mediaAsset,
            metadata,
          ),
          now: finalizedAt,
        })
        return {
          uploadIntent: finalized.uploadIntent,
          storageObjectRecord: finalized.storageObject,
          mediaAsset: finalized.mediaAsset,
          warnings: ['Upload finalized into restart-safe private source-media authority; no signed URL was stored.'],
        }
      }
      await finalizeUploadIntentRow(context, uploadIntent.id, mediaAsset.id)

      const finalizedIntent: UploadIntentView = {
        ...uploadIntent,
        status: 'finalized',
        finalizedAt: nowIso(),
        mediaAssetId: mediaAsset.id,
        updatedAt: nowIso(),
      }
      return {
        uploadIntent: finalizedIntent,
        storageObjectRecord,
        mediaAsset,
        warnings: ['Upload finalized with canonical bucket/object metadata only; no signed URL was stored.'],
      }
    },

    async recordSignedUrlEvent(input: SignedUrlEventInput) {
      await assertSignedUrlEventAccess(context, input)
      return recordSignedUrlEvent(context, input)
    },

    async getStorageObjectRecord(storageObjectRecordId: string, workspaceId: string) {
      const storageObjectRecord = await loadStorageObjectRecord(context, storageObjectRecordId, workspaceId)
      assertStorageObjectWorkspace(storageObjectRecord, workspaceId)
      await assertStorageObjectAccessibleByCurrentUser(context, storageObjectRecord, 'metadata')

      return {
        storageObjectRecord,
        canonicalOnly: true,
        warnings: ['Canonical storage metadata does not include temporary URLs.'],
      }
    },

    async createDownloadTarget(storageObjectRecordId: string, workspaceId: string, urlPurpose = 'download') {
      const storageObjectRecord = await loadStorageObjectRecord(context, storageObjectRecordId, workspaceId)
      assertStorageObjectWorkspace(storageObjectRecord, workspaceId)
      const accessPurpose = normalizeUserStorageAccessPurpose(urlPurpose)
      await assertStorageObjectAccessibleByCurrentUser(context, storageObjectRecord, accessPurpose)

      const expiresAt = new Date(Date.now() + context.env.signedUrlTtlSeconds * 1000).toISOString()
      const downloadTarget = await storage.createDownloadTarget({
        storageObjectRecordId,
        bucketName: storageObjectRecord.bucketName,
        objectPath: storageObjectRecord.objectPath,
        expiresAt,
        workspaceId,
        generation: storageObjectRecord.generation,
        etag: storageObjectRecord.etag,
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
          generation: storageObjectRecord.generation,
          etag: storageObjectRecord.etag,
        },
      })

      return {
        downloadTarget,
        signedUrlEvent: signedUrlEvent.signedUrlEvent,
        warnings: ['Download target is temporary and was not stored as canonical truth.'],
      }
    },

    async getFinalizedSourceMediaAsset(
      mediaAssetId: string,
      workspaceId: string,
      projectId: string,
      expectedPurpose: 'source_media' | 'reference_media' = 'source_media',
    ) {
      await assertUploadProjectOwnedByCurrentUser(context, projectId, workspaceId)
      if (!usesLocalUploadPersistence(context)) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'The private source-media authority loader is available only for explicit local/internal persistence.',
          503,
        )
      }
      const authority = await loadPrivateFinalizedMediaAuthority(
        privateUploadMediaAuthorityScope(context, workspaceId),
        mediaAssetId,
      )
      if (
        !authority ||
        authority.uploadIntent.projectId !== projectId ||
        authority.uploadIntent.uploadPurpose !== expectedPurpose ||
        authority.mediaAsset.projectId !== projectId ||
        authority.storageObject.projectId !== projectId
      ) {
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'Finalized source media was not found for the authenticated workspace, project, and purpose.',
          409,
          { mediaAssetId },
        )
      }
      return authority
    },

    async createLocalObjectStream(storageObjectRecordId: string, workspaceId: string): Promise<{
      stream: Readable
      storageObjectRecord: StorageObjectView
    }> {
      if (storage.mode !== 'local') {
        throw new ApiError('MOCK_ONLY', 'Local object reads are available only when STORAGE_MODE=local.', 409)
      }

      const storageObjectRecord = await loadStorageObjectRecord(context, storageObjectRecordId, workspaceId)
      assertStorageObjectWorkspace(storageObjectRecord, workspaceId)
      await assertStorageObjectAccessibleByCurrentUser(context, storageObjectRecord, 'download')

      await storage.verifyUploadedObject({
        bucketName: storageObjectRecord.bucketName,
        objectPath: storageObjectRecord.objectPath,
        expectedSizeBytes: storageObjectRecord.sizeBytes,
        checksumSha256: normalizeChecksumSha256(storageObjectRecord.checksumSha256),
      })
      const stream = await storage.createReadStream(
        storageObjectRecord.bucketName,
        storageObjectRecord.objectPath,
        { generation: storageObjectRecord.generation, etag: storageObjectRecord.etag },
      )
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
    createOnly: uploadTarget.createOnly,
    uploadProtocol: uploadTarget.uploadProtocol ?? 'single_put',
    supportsResume: uploadTarget.supportsResume ?? false,
    recommendedChunkSizeBytes: uploadTarget.recommendedChunkSizeBytes,
    sessionUriIsCredential: uploadTarget.sessionUriIsCredential ?? true,
    bucketName,
    objectPath,
  }
}

function normalizeChecksumSha256(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : undefined
}

function isTerminalUploadedObjectVerificationFailure(error: unknown): boolean {
  return error instanceof ApiError && [
    'UPLOAD_NOT_FINALIZED',
    'UPLOAD_SOURCE_MISMATCH',
    'VALIDATION_FAILED',
  ].includes(error.code)
}

function normalizeMimeType(value: string): string {
  return value.trim().toLowerCase()
}

function assertProductionUploadUsesDirectObjectStorage(context: ServiceContext, storage: StorageAdapter): void {
  if (context.env.nodeEnv === 'production' && storage.mode === 'local') {
    throw new ApiError(
      'MOCK_ONLY',
      'Production media uploads require a signed/direct object-storage target; backend raw-body uploads are disabled.',
      503,
    )
  }
}

function assertUserInitiatedUploadPurpose(
  purpose: UploadPurpose,
): asserts purpose is 'source_media' | 'reference_media' {
  if (purpose !== 'source_media' && purpose !== 'reference_media') {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'This upload purpose is reserved for backend workers and explicit delivery workflows.',
      403,
    )
  }
}

function assertLocalRawUploadRuntimeEnabled(context: ServiceContext, storage: StorageAdapter): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    storage.mode !== 'local'
  ) {
    throw new ApiError(
      'MOCK_ONLY',
      'Direct backend byte uploads are disabled for this runtime. Use the temporary signed/direct object-storage target returned by the upload-intent endpoint, then finalize the upload.',
      409,
    )
  }
}

function assertLocalUploadRequestMatchesIntent(
  uploadIntent: UploadIntentView,
  mimeType: string | undefined,
  sizeBytes: number,
): void {
  if (uploadIntent.status !== 'signed' && uploadIntent.status !== 'uploaded') {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Upload intent is not open for local object writes.', 409)
  }
  const uploadedMimeType = normalizeMimeType(mimeType ?? '')
  const expectedMimeType = normalizeMimeType(uploadIntent.mimeType)
  if (!uploadedMimeType || uploadedMimeType !== expectedMimeType) {
    throw new ApiError('VALIDATION_FAILED', 'Local object upload MIME type must match the upload intent.', 400, {
      uploadIntentId: uploadIntent.id,
      expectedMimeType,
      uploadedMimeType,
    })
  }
  if (uploadIntent.expectedSizeBytes !== undefined && sizeBytes !== uploadIntent.expectedSizeBytes) {
    throw new ApiError('VALIDATION_FAILED', 'Local object upload size must match the upload intent.', 400, {
      uploadIntentId: uploadIntent.id,
      expectedSizeBytes: uploadIntent.expectedSizeBytes,
      actualSizeBytes: sizeBytes,
    })
  }
  assertLocalRawUploadByteLength(sizeBytes)
  assertAllowedUpload({
    purpose: uploadIntent.uploadPurpose,
    mimeType: expectedMimeType,
    expectedSizeBytes: sizeBytes,
  })
}

function assertUploadIntentOwnedByCurrentUser(context: ServiceContext, uploadIntent: UploadIntentView): void {
  const userId = getRequiredAuthUserId(context)
  if (uploadIntent.requestedByUserId !== userId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Upload intent does not belong to the authenticated user.', 403, {
      uploadIntentId: uploadIntent.id,
      workspaceId: uploadIntent.workspaceId,
    })
  }
}

async function assertUploadIntentAccessibleByCurrentUser(
  context: ServiceContext,
  uploadIntent: UploadIntentView,
  workspaceId: string,
): Promise<void> {
  assertUploadIntentOwnedByCurrentUser(context, uploadIntent)
  if (uploadIntent.workspaceId !== workspaceId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Upload intent does not belong to the requested workspace.', 403)
  }
  await assertUploadProjectOwnedByCurrentUser(context, uploadIntent.projectId, uploadIntent.workspaceId)
}

async function assertStorageObjectAccessibleByCurrentUser(
  context: ServiceContext,
  storageObjectRecord: StorageObjectView,
  accessPurpose: UserStorageAccessPurpose,
): Promise<void> {
  assertUserDeliveryBoundary(context, storageObjectRecord, accessPurpose)

  let effectiveProjectId = storageObjectRecord.projectId
  if (storageObjectRecord.uploadIntentId) {
    const uploadIntent = await loadUploadIntent(
      context,
      storageObjectRecord.uploadIntentId,
      storageObjectRecord.workspaceId,
    )
    await assertUploadIntentAccessibleByCurrentUser(context, uploadIntent, storageObjectRecord.workspaceId)
    if (effectiveProjectId && effectiveProjectId !== uploadIntent.projectId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Storage object project scope does not match its upload intent.', 403)
    }
    effectiveProjectId = effectiveProjectId ?? uploadIntent.projectId
  }

  if (!effectiveProjectId) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'Storage object has no project-scoped user delivery boundary.',
      403,
      { storageObjectRecordId: storageObjectRecord.id },
    )
  }

  await assertUploadProjectOwnedByCurrentUser(context, effectiveProjectId, storageObjectRecord.workspaceId)
}

function assertStorageObjectWorkspace(storageObjectRecord: StorageObjectView, workspaceId: string): void {
  if (storageObjectRecord.workspaceId !== workspaceId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Storage object does not belong to the requested workspace.', 403)
  }
}

function assertUserDeliveryBoundary(
  context: ServiceContext,
  storageObjectRecord: StorageObjectView,
  accessPurpose: UserStorageAccessPurpose,
): void {
  if (storageObjectRecord.status !== 'ready') {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Storage object is not ready for user delivery.', 409)
  }

  const purpose = storageObjectRecord.objectPurpose
  const isWorkerTempBucket = storageObjectRecord.bucketName === 'worker-temp' ||
    Boolean(context.env.gcsWorkerTempBucket && storageObjectRecord.bucketName === context.env.gcsWorkerTempBucket)
  const isProcessedMediaBucket = storageObjectRecord.bucketName === 'processed-media' ||
    Boolean(context.env.gcsProcessedMediaBucket && storageObjectRecord.bucketName === context.env.gcsProcessedMediaBucket)
  const isQaArtifactBucket = storageObjectRecord.bucketName === 'qa-artifacts' ||
    Boolean(context.env.gcsQaArtifactsBucket && storageObjectRecord.bucketName === context.env.gcsQaArtifactsBucket)
  if (purpose === 'worker_temp' || purpose === 'other' || isWorkerTempBucket) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Worker-only storage objects are not available through user delivery routes.', 403)
  }
  if ((purpose === 'processed_media' || isProcessedMediaBucket) && accessPurpose !== 'preview_review') {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Processed media requires an explicit preview-review delivery boundary.', 403)
  }
  if ((purpose === 'qa_artifact' || isQaArtifactBucket) && accessPurpose !== 'qa_review') {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'QA artifacts require an explicit QA-review delivery boundary.', 403)
  }
}

function normalizeUserStorageAccessPurpose(value: string): UserStorageAccessPurpose {
  if (
    value === 'metadata' ||
    value === 'download' ||
    value === 'preview_review' ||
    value === 'thumbnail' ||
    value === 'qa_review' ||
    value === 'export_delivery'
  ) {
    return value
  }
  throw new ApiError('WORKSPACE_ACCESS_DENIED', 'The requested storage delivery purpose is not available to user routes.', 403)
}

async function assertUploadProjectOwnedByCurrentUser(
  context: ServiceContext,
  projectId: string,
  workspaceId: string,
): Promise<void> {
  const result = await createProjectService(context).getProject(projectId, workspaceId)
  const projectWorkspaceId = getProjectWorkspaceId(result.project)
  if (projectWorkspaceId !== workspaceId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Upload project does not belong to the requested workspace.', 403, {
      projectId,
      workspaceId,
      projectWorkspaceId,
    })
  }
}

function getProjectWorkspaceId(project: unknown): string | undefined {
  if (!project || typeof project !== 'object') return undefined
  const record = project as { workspaceId?: unknown; workspace_id?: unknown }
  if (typeof record.workspaceId === 'string') return record.workspaceId
  if (typeof record.workspace_id === 'string') return record.workspace_id
  return undefined
}

async function assertSignedUrlEventAccess(context: ServiceContext, input: SignedUrlEventInput): Promise<void> {
  if (input.uploadIntentId) {
    const uploadIntent = await loadUploadIntent(context, input.uploadIntentId, input.workspaceId)
    await assertUploadIntentAccessibleByCurrentUser(context, uploadIntent, input.workspaceId)
    assertUserInitiatedUploadPurpose(uploadIntent.uploadPurpose)
    if (input.urlPurpose !== 'upload') {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Upload-intent signed URL events must use the upload purpose.', 403)
    }
    if (input.projectId && input.projectId !== uploadIntent.projectId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Signed URL event project does not match its upload intent.', 403)
    }
  }

  if (input.storageObjectRecordId) {
    const storageObjectRecord = await loadStorageObjectRecord(
      context,
      input.storageObjectRecordId,
      input.workspaceId,
    )
    assertStorageObjectWorkspace(storageObjectRecord, input.workspaceId)
    const accessPurpose = normalizeUserStorageAccessPurpose(input.urlPurpose)
    await assertStorageObjectAccessibleByCurrentUser(context, storageObjectRecord, accessPurpose)
    if (input.projectId && input.projectId !== storageObjectRecord.projectId) {
      throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Signed URL event project does not match its storage object.', 403)
    }
  }

  if (!input.uploadIntentId && !input.storageObjectRecordId) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Signed URL events require an authorized upload intent or storage object.', 403)
  }
}

function usesLocalUploadPersistence(context: ServiceContext): boolean {
  return !context.clients.admin || context.env.mockOnly || context.env.allowInternalTestExecutionWithSupabase
}

function getRequiredUploadAdminClient(context: ServiceContext): NonNullable<ServiceContext['clients']['admin']> {
  const adminClient = context.clients.admin
  if (!adminClient) {
    throw new ApiError('INTERNAL_ERROR', 'Supabase admin client is unavailable for upload persistence.', 500)
  }

  return adminClient
}

function requireCanonicalSourceChecksum(
  uploadIntent: UploadIntentView,
  metadata: ObjectMetadata,
  storageMode: StorageAdapter['mode'],
): ObjectMetadata {
  const checksumSha256 = normalizeChecksumSha256(metadata.checksumSha256)

  if (
    (uploadIntent.uploadPurpose === 'source_media' || uploadIntent.uploadPurpose === 'reference_media') &&
    (!checksumSha256 || !metadata.integrityVerified || metadata.checksumSource !== 'server_computed_bytes')
  ) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Uploaded source media is missing server-computed SHA-256 byte evidence.', 409, {
      uploadIntentId: uploadIntent.id,
      uploadPurpose: uploadIntent.uploadPurpose,
      bucketName: metadata.bucketName,
      objectPath: metadata.objectPath,
    })
  }

  if (storageMode === 'gcs' && (!metadata.generation || !metadata.etag)) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Uploaded GCS source media is missing generation-bound object identity.', 409, {
      uploadIntentId: uploadIntent.id,
      bucketName: metadata.bucketName,
      objectPath: metadata.objectPath,
    })
  }

  return {
    ...metadata,
    checksumSha256: checksumSha256 ?? metadata.checksumSha256,
  }
}

async function recordSignedUrlEvent(context: ServiceContext, input: SignedUrlEventInput) {
  if (usesLocalUploadPersistence(context)) {
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

  const adminClient = getRequiredUploadAdminClient(context)
  const { data, error } = await adminClient
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

async function loadUploadIntent(
  context: ServiceContext,
  uploadIntentId: string,
  workspaceId: string,
): Promise<UploadIntentView> {
  if (usesLocalUploadPersistence(context)) {
    const uploadIntent = await loadPrivateUploadIntentAuthority(
      privateUploadMediaAuthorityScope(context, workspaceId),
      uploadIntentId,
    )
    if (!uploadIntent) {
      throw new ApiError('UPLOAD_INTENT_NOT_FOUND', 'Upload intent was not found in private local authority.', 404)
    }
    return uploadIntent
  }

  const adminClient = getRequiredUploadAdminClient(context)
  const { data, error } = await adminClient
    .from('upload_intents')
    .select('*')
    .eq('id', uploadIntentId)
    .eq('workspace_id', workspaceId)
    .single()

  throwOnSupabaseError(error, 'UPLOAD_INTENT_NOT_FOUND')
  if (!data) throw new ApiError('UPLOAD_INTENT_NOT_FOUND', 'Upload intent was not found.', 404)
  return mapUploadIntent(data)
}

async function loadStorageObjectRecord(
  context: ServiceContext,
  storageObjectRecordId: string,
  workspaceId: string,
): Promise<StorageObjectView> {
  if (usesLocalUploadPersistence(context)) {
    const registeredObject = backendLocalStorageObjects.get(
      backendLocalStorageObjectKey(workspaceId, storageObjectRecordId),
    )
    if (registeredObject) return registeredObject
    const storageObject = await loadPrivateStorageObjectAuthority(
      privateUploadMediaAuthorityScope(context, workspaceId),
      storageObjectRecordId,
    )
    if (!storageObject) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Storage object record was not found in private local authority.', 404)
    }
    return storageObject
  }

  const adminClient = getRequiredUploadAdminClient(context)
  const { data, error } = await adminClient
    .from('storage_object_records')
    .select('*')
    .eq('id', storageObjectRecordId)
    .eq('workspace_id', workspaceId)
    .single()

  throwOnSupabaseError(error, 'UPLOAD_NOT_FINALIZED')
  if (!data) throw new ApiError('UPLOAD_NOT_FINALIZED', 'Storage object record was not found.', 404)
  return enrichStorageObjectIdentity(context, mapStorageObjectRecord(data))
}

async function enrichStorageObjectIdentity(
  context: ServiceContext,
  storageObjectRecord: StorageObjectView,
): Promise<StorageObjectView> {
  if ((storageObjectRecord.generation && storageObjectRecord.etag) || !storageObjectRecord.mediaAssetId) {
    return storageObjectRecord
  }

  const adminClient = getRequiredUploadAdminClient(context)
  const { data, error } = await adminClient
    .from('media_assets')
    .select('metadata')
    .eq('id', storageObjectRecord.mediaAssetId)
    .maybeSingle()

  throwOnSupabaseError(error)
  const row = unknownRecord(data)
  const metadata = unknownRecord(row?.metadata)
  const identity = unknownRecord(metadata?.storageObjectIdentity)
  return {
    ...storageObjectRecord,
    generation: maybeString(identity?.generation),
    etag: maybeString(identity?.etag),
    metageneration: maybeString(identity?.metageneration),
  }
}

async function markUploadIntentUploaded(
  context: ServiceContext,
  uploadIntentId: string,
  workspaceId: string,
): Promise<void> {
  if (usesLocalUploadPersistence(context)) {
    await transitionPrivateUploadIntentAuthority({
      scope: privateUploadMediaAuthorityScope(context, workspaceId),
      uploadIntentId,
      nextStatus: 'uploaded',
      now: nowIso(),
    })
  } else {
    const adminClient = getRequiredUploadAdminClient(context)
    const { error } = await adminClient
      .from('upload_intents')
      .update({ status: 'uploaded', updated_at: nowIso() })
      .eq('id', uploadIntentId)

    throwOnSupabaseError(error)
  }
}

async function markUploadIntentFailed(
  context: ServiceContext,
  uploadIntentId: string,
  workspaceId: string,
): Promise<void> {
  if (usesLocalUploadPersistence(context)) {
    await transitionPrivateUploadIntentAuthority({
      scope: privateUploadMediaAuthorityScope(context, workspaceId),
      uploadIntentId,
      nextStatus: 'failed',
      now: nowIso(),
    })
  } else {
    const adminClient = getRequiredUploadAdminClient(context)
    const { error } = await adminClient
      .from('upload_intents')
      .update({ status: 'failed', updated_at: nowIso() })
      .eq('id', uploadIntentId)

    throwOnSupabaseError(error)
  }
}

async function cleanupRejectedUploadedObject(
  storage: StorageAdapter,
  metadata: ObjectMetadata,
): Promise<{ deleted: boolean; warnings: string[] } | undefined> {
  if (!metadata.generation || !metadata.etag) return undefined
  return storage.deleteObject(
    metadata.bucketName,
    metadata.objectPath,
    { generation: metadata.generation, etag: metadata.etag },
  )
}

function sourceProbeIntegrityErrorWithCleanupEvidence(
  error: ApiError,
  evidence: Record<string, unknown>,
  cleanupCause?: unknown,
): ApiError {
  const details = error.details && typeof error.details === 'object' && !Array.isArray(error.details)
    ? error.details as Record<string, unknown>
    : {}
  return new ApiError(
    error.code,
    error.message,
    error.status,
    { ...details, ...evidence },
    cleanupCause === undefined
      ? { internal: error.internal }
      : { cause: cleanupCause, internal: error.internal },
  )
}

async function createMediaAsset(
  context: ServiceContext,
  uploadIntent: UploadIntentView,
  metadata: ObjectMetadata,
  storage: StorageAdapter,
): Promise<MediaAssetView> {
  const now = nowIso()
  const mediaAssetId = randomUUID()
  const sourceMetadata = await probeSourceMediaMetadata(context, uploadIntent, metadata, storage)
  const mediaAsset: MediaAssetView = {
    id: mediaAssetId,
    workspaceId: uploadIntent.workspaceId,
    projectId: uploadIntent.projectId,
    uploadIntentId: uploadIntent.id,
    uploadPurpose: uploadIntent.uploadPurpose === 'reference_media' ? 'reference_media' : 'source_media',
    assetType: mediaAssetTypeForUpload(uploadIntent),
    fileName: uploadIntent.originalFileName,
    mimeType: uploadIntent.mimeType,
    storageProvider: storage.mode === 'gcs' ? 'google_cloud_storage' : 'local_private',
    storageBucket: metadata.bucketName,
    storagePath: metadata.objectPath,
    sizeBytes: metadata.sizeBytes,
    checksumSha256: metadata.checksumSha256,
    storageGeneration: metadata.generation,
    storageEtag: metadata.etag,
    storageMetageneration: metadata.metageneration,
    integrityVerified: metadata.integrityVerified ? true : undefined,
    checksumSource: metadata.checksumSource === 'server_computed_bytes' ? 'server_computed_bytes' : undefined,
    sourceMetadata,
    status: 'uploaded',
    createdAt: now,
    updatedAt: now,
    mockOnly: usesLocalUploadPersistence(context),
  }

  if (usesLocalUploadPersistence(context)) {
    return mediaAsset
  }

  const adminClient = getRequiredUploadAdminClient(context)
  const { data, error } = await adminClient
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
      storage_provider: storage.mode === 'gcs' ? 'gcs' : 'local_private_storage',
      storage_bucket: metadata.bucketName,
      storage_path: metadata.objectPath,
      public_url: null,
      signed_url_expires_at: null,
      file_size_bytes: metadata.sizeBytes,
      checksum: metadata.checksumSha256,
      metadata: {
        uploadIntentId: uploadIntent.id,
        storageMode: storage.mode,
        storageObjectIdentity: {
          generation: metadata.generation,
          etag: metadata.etag,
          metageneration: metadata.metageneration,
        },
        sourceMediaMetadata: sourceMetadata,
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
  storage: StorageAdapter,
): Promise<StorageObjectView> {
  const now = nowIso()
  const storageObjectRecord: StorageObjectView = {
    id: randomUUID(),
    workspaceId: uploadIntent.workspaceId,
    projectId: uploadIntent.projectId,
    mediaAssetId,
    uploadIntentId: uploadIntent.id,
    uploadPurpose: uploadIntent.uploadPurpose === 'reference_media' ? 'reference_media' : 'source_media',
    storageProvider: storage.mode === 'gcs' ? 'google_cloud_storage' : 'local_private',
    bucketName: metadata.bucketName,
    objectPath: metadata.objectPath,
    objectPurpose: toDatabaseStoragePurpose(uploadIntent.uploadPurpose),
    mimeType: uploadIntent.mimeType,
    sizeBytes: metadata.sizeBytes,
    checksumSha256: metadata.checksumSha256,
    generation: metadata.generation,
    etag: metadata.etag,
    metageneration: metadata.metageneration,
    integrityVerified: metadata.integrityVerified ? true : undefined,
    checksumSource: metadata.checksumSource === 'server_computed_bytes' ? 'server_computed_bytes' : undefined,
    region: context.env.gcsDefaultRegion,
    status: 'ready',
    createdAt: now,
    updatedAt: now,
    mockOnly: usesLocalUploadPersistence(context),
  }

  if (usesLocalUploadPersistence(context)) {
    return storageObjectRecord
  }

  const adminClient = getRequiredUploadAdminClient(context)
  const { data, error } = await adminClient
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
  return {
    ...mapStorageObjectRecord(data),
    generation: metadata.generation,
    etag: metadata.etag,
    metageneration: metadata.metageneration,
  }
}

async function finalizeUploadIntentRow(context: ServiceContext, uploadIntentId: string, mediaAssetId: string): Promise<void> {
  if (usesLocalUploadPersistence(context)) return

  const adminClient = getRequiredUploadAdminClient(context)
  const { error } = await adminClient
    .from('upload_intents')
    .update({
      status: 'finalized',
      finalized_at: nowIso(),
      media_asset_id: mediaAssetId,
    })
    .eq('id', uploadIntentId)

  throwOnSupabaseError(error)
}

async function loadFinalizedUploadResult(context: ServiceContext, uploadIntent: UploadIntentView) {
  if (!uploadIntent.mediaAssetId) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Finalized upload metadata is incomplete.', 409)
  }
  if (usesLocalUploadPersistence(context)) {
    const finalized = await loadPrivateFinalizedMediaAuthority(
      privateUploadMediaAuthorityScope(context, uploadIntent.workspaceId),
      uploadIntent.mediaAssetId,
    )
    if (!finalized || finalized.uploadIntent.id !== uploadIntent.id) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Finalized private upload authority is incomplete.', 409)
    }
    return {
      uploadIntent: finalized.uploadIntent,
      storageObjectRecord: finalized.storageObject,
      mediaAsset: finalized.mediaAsset,
      warnings: ['Upload was already finalized; returning restart-safe private authority metadata.'],
    }
  }

  const adminClient = getRequiredUploadAdminClient(context)
  const [{ data: storageRow, error: storageError }, { data: mediaRow, error: mediaError }] = await Promise.all([
    adminClient
      .from('storage_object_records')
      .select('*')
      .eq('upload_intent_id', uploadIntent.id)
      .eq('workspace_id', uploadIntent.workspaceId)
      .single(),
    adminClient
      .from('media_assets')
      .select('*')
      .eq('id', uploadIntent.mediaAssetId)
      .eq('workspace_id', uploadIntent.workspaceId)
      .single(),
  ])
  throwOnSupabaseError(storageError, 'UPLOAD_NOT_FINALIZED')
  throwOnSupabaseError(mediaError, 'UPLOAD_NOT_FINALIZED')
  if (!storageRow || !mediaRow) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'Finalized upload metadata is incomplete.', 409)
  }
  return {
    uploadIntent,
    storageObjectRecord: await enrichStorageObjectIdentity(context, mapStorageObjectRecord(storageRow)),
    mediaAsset: mapMediaAsset(mediaRow),
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
    generation: maybeString(row.generation),
    etag: maybeString(row.etag),
    metageneration: maybeString(row.metageneration),
    region: maybeString(row.region),
    status: String(row.status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapMediaAsset(row: Record<string, unknown>): MediaAssetView {
  const rowMetadata = unknownRecord(row.metadata)
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    projectId: String(row.project_id),
    assetType: String(row.asset_type),
    fileName: String(row.file_name),
    mimeType: String(row.mime_type),
    storageProvider: mapDatabaseMediaStorageProvider(maybeString(row.storage_provider)),
    storageBucket: String(row.storage_bucket),
    storagePath: String(row.storage_path),
    sizeBytes: maybeNumber(row.file_size_bytes),
    checksumSha256: maybeString(row.checksum),
    storageGeneration: maybeString(unknownRecord(rowMetadata?.storageObjectIdentity)?.generation),
    storageEtag: maybeString(unknownRecord(rowMetadata?.storageObjectIdentity)?.etag),
    sourceMetadata: sourceMediaMetadataFromUnknown(rowMetadata?.sourceMediaMetadata),
    status: String(row.processing_status),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

async function probeSourceMediaMetadata(
  context: ServiceContext,
  uploadIntent: UploadIntentView,
  metadata: ObjectMetadata,
  storage: StorageAdapter,
): Promise<SourceMediaMetadataView | undefined> {
  if (uploadIntent.uploadPurpose !== 'source_media' && uploadIntent.uploadPurpose !== 'reference_media') return undefined
  if (!uploadIntent.mimeType.startsWith('video/') && !uploadIntent.mimeType.startsWith('audio/')) return undefined

  if (storage.mode !== 'local' && storage.mode !== 'gcs') return undefined

  const source: SourceMediaMetadataView['source'] = storage.mode === 'gcs' ? 'gcs_ffprobe' : 'local_ffprobe'
  const expectedChecksumSha256 = normalizeChecksumSha256(metadata.checksumSha256)
  if (!expectedChecksumSha256) {
    throw new ApiError(
      'UPLOAD_NOT_FINALIZED',
      'Source media requires a canonical checksum before metadata probing.',
      409,
      { reason: 'source_probe_stage_checksum_invalid' },
    )
  }
  const staged = await stagePrivateSourceForProbe({
    localStorageRoot: context.env.localStorageRoot,
    scope: {
      ownerUserId: getRequiredAuthUserId(context),
      workspaceId: uploadIntent.workspaceId,
      projectId: uploadIntent.projectId,
      uploadIntentId: uploadIntent.id,
    },
    originalFileName: uploadIntent.originalFileName,
    expectedSizeBytes: metadata.sizeBytes,
    expectedChecksumSha256,
    openStream: () => storage.createReadStream(
      metadata.bucketName,
      metadata.objectPath,
      { generation: metadata.generation, etag: metadata.etag },
    ),
  })

  try {
    const probe = await probeMediaFile(staged.inputPath, {
      ffprobeBin: context.env.ffprobeBin,
      timeoutMs: deriveMediaTaskTimeoutMs({
        task: 'probe',
        sourceSizeBytes: metadata.sizeBytes,
      }),
    })
    const streamTypes = probe.rawSummary.streamTypes
    return {
      probeStatus: 'probed',
      source,
      durationSeconds: roundOptionalSeconds(probe.durationSeconds),
      width: positiveIntegerOrUndefined(probe.width),
      height: positiveIntegerOrUndefined(probe.height),
      videoCodec: probe.videoCodec,
      audioCodec: probe.audioCodec,
      pixelFormat: probe.pixelFormat,
      colorSpace: probe.colorSpace,
      colorTransfer: probe.colorTransfer,
      colorPrimaries: probe.colorPrimaries,
      colorRange: probe.colorRange,
      bitsPerRawSample: probe.bitsPerRawSample,
      formatName: probe.formatName,
      streamCount: probe.streamCount,
      hasVideo: streamTypes.includes('video'),
      hasAudio: streamTypes.includes('audio'),
    }
  } catch (error) {
    return {
      probeStatus: 'unavailable',
      source,
      hasVideo: uploadIntent.mimeType.startsWith('video/'),
      hasAudio: uploadIntent.mimeType.startsWith('audio/'),
      unavailableReason: error instanceof Error ? error.message.slice(0, 240) : 'Backend FFprobe media metadata was unavailable.',
    }
  } finally {
    await staged.cleanup()
  }
}

function sourceMediaMetadataFromUnknown(value: unknown): SourceMediaMetadataView | undefined {
  const record = unknownRecord(value)
  if (!record) return undefined
  const probeStatus = record.probeStatus === 'probed' ? 'probed' : record.probeStatus === 'unavailable' ? 'unavailable' : undefined
  if (!probeStatus) return undefined
  return {
    probeStatus,
    source: record.source === 'gcs_ffprobe' ? 'gcs_ffprobe' : 'local_ffprobe',
    durationSeconds: maybeNumber(record.durationSeconds),
    width: maybeNumber(record.width),
    height: maybeNumber(record.height),
    videoCodec: maybeString(record.videoCodec),
    audioCodec: maybeString(record.audioCodec),
    pixelFormat: maybeString(record.pixelFormat),
    colorSpace: maybeString(record.colorSpace),
    colorTransfer: maybeString(record.colorTransfer),
    colorPrimaries: maybeString(record.colorPrimaries),
    colorRange: maybeString(record.colorRange),
    bitsPerRawSample: maybeNumber(record.bitsPerRawSample),
    formatName: maybeString(record.formatName),
    streamCount: maybeNumber(record.streamCount),
    hasVideo: Boolean(record.hasVideo),
    hasAudio: Boolean(record.hasAudio),
    unavailableReason: maybeString(record.unavailableReason),
  }
}

function roundOptionalSeconds(value: number | undefined): number | undefined {
  return Number.isFinite(value) && value !== undefined ? Number(value.toFixed(3)) : undefined
}

function positiveIntegerOrUndefined(value: number | undefined): number | undefined {
  return Number.isFinite(value) && value !== undefined && value > 0 ? Math.round(value) : undefined
}

function mapDatabaseMediaStorageProvider(storageProvider?: string): string | undefined {
  if (storageProvider === 'local_private_storage') return 'local_private'
  if (storageProvider === 'gcs') return 'google_cloud_storage'
  return storageProvider
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

function privateUploadMediaAuthorityScope(
  context: ServiceContext,
  workspaceId: string,
): PrivateUploadMediaAuthorityScope {
  return {
    localStorageRoot: context.env.localStorageRoot,
    ownerUserId: getRequiredAuthUserId(context),
    workspaceId,
  }
}

function toPrivateUploadIntentAuthorityRecord(
  uploadIntent: UploadIntentView,
): PrivateUploadIntentAuthorityRecord {
  if (uploadIntent.uploadPurpose !== 'source_media' && uploadIntent.uploadPurpose !== 'reference_media') {
    throw new ApiError('VALIDATION_FAILED', 'Private upload authority supports source/reference media only.', 400)
  }
  if (
    uploadIntent.status !== 'signed' &&
    uploadIntent.status !== 'uploaded' &&
    uploadIntent.status !== 'failed' &&
    uploadIntent.status !== 'finalized'
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private upload intent status is unsupported.', 409)
  }
  return {
    id: uploadIntent.id,
    workspaceId: uploadIntent.workspaceId,
    projectId: uploadIntent.projectId,
    chatSessionId: uploadIntent.chatSessionId,
    requestedByUserId: uploadIntent.requestedByUserId,
    uploadPurpose: uploadIntent.uploadPurpose,
    targetBucket: uploadIntent.targetBucket,
    targetPath: uploadIntent.targetPath,
    originalFileName: uploadIntent.originalFileName,
    mimeType: normalizeMimeType(uploadIntent.mimeType),
    expectedSizeBytes: uploadIntent.expectedSizeBytes,
    checksumSha256: normalizeChecksumSha256(uploadIntent.checksumSha256),
    status: uploadIntent.status,
    expiresAt: uploadIntent.expiresAt,
    finalizedAt: uploadIntent.finalizedAt,
    mediaAssetId: uploadIntent.mediaAssetId,
    createdAt: uploadIntent.createdAt,
    updatedAt: uploadIntent.updatedAt,
    mockOnly: true,
  }
}

function toPrivateMediaAssetAuthorityRecord(
  mediaAsset: MediaAssetView,
  uploadIntent: UploadIntentView,
  storageObject: StorageObjectView,
  metadata: ObjectMetadata,
): PrivateMediaAssetAuthorityRecord {
  const integrity = requirePrivateFinalizedIntegrity(metadata)
  const storageProvider = mediaAsset.storageProvider === 'google_cloud_storage'
    ? 'google_cloud_storage' as const
    : 'local_private' as const
  return {
    id: mediaAsset.id,
    workspaceId: uploadIntent.workspaceId,
    projectId: uploadIntent.projectId,
    uploadIntentId: uploadIntent.id,
    storageObjectRecordId: storageObject.id,
    uploadPurpose: uploadIntent.uploadPurpose === 'reference_media' ? 'reference_media' : 'source_media',
    assetType: mediaAsset.assetType,
    fileName: mediaAsset.fileName,
    mimeType: normalizeMimeType(mediaAsset.mimeType),
    storageProvider,
    storageBucket: mediaAsset.storageBucket,
    storagePath: mediaAsset.storagePath,
    sizeBytes: integrity.sizeBytes,
    checksumSha256: integrity.checksumSha256,
    storageGeneration: metadata.generation,
    storageEtag: metadata.etag,
    storageMetageneration: metadata.metageneration,
    integrityVerified: true,
    checksumSource: 'server_computed_bytes',
    sourceMetadata: mediaAsset.sourceMetadata,
    status: 'uploaded',
    createdAt: mediaAsset.createdAt,
    updatedAt: mediaAsset.updatedAt,
    mockOnly: true,
  }
}

function toPrivateStorageObjectAuthorityRecord(
  storageObject: StorageObjectView,
  uploadIntent: UploadIntentView,
  mediaAsset: MediaAssetView,
  metadata: ObjectMetadata,
): PrivateStorageObjectAuthorityRecord {
  const integrity = requirePrivateFinalizedIntegrity(metadata)
  return {
    id: storageObject.id,
    workspaceId: uploadIntent.workspaceId,
    projectId: uploadIntent.projectId,
    mediaAssetId: mediaAsset.id,
    uploadIntentId: uploadIntent.id,
    uploadPurpose: uploadIntent.uploadPurpose === 'reference_media' ? 'reference_media' : 'source_media',
    storageProvider: mediaAsset.storageProvider === 'google_cloud_storage'
      ? 'google_cloud_storage'
      : 'local_private',
    bucketName: storageObject.bucketName,
    objectPath: storageObject.objectPath,
    objectPurpose: uploadIntent.uploadPurpose === 'reference_media' ? 'reference_media' : 'source_media',
    mimeType: normalizeMimeType(uploadIntent.mimeType),
    sizeBytes: integrity.sizeBytes,
    checksumSha256: integrity.checksumSha256,
    generation: metadata.generation,
    etag: metadata.etag,
    metageneration: metadata.metageneration,
    integrityVerified: true,
    checksumSource: 'server_computed_bytes',
    region: storageObject.region,
    status: 'ready',
    createdAt: storageObject.createdAt,
    updatedAt: storageObject.updatedAt,
    mockOnly: true,
  }
}

function requirePrivateFinalizedIntegrity(metadata: ObjectMetadata): {
  sizeBytes: number
  checksumSha256: string
} {
  const checksumSha256 = normalizeChecksumSha256(metadata.checksumSha256)
  if (
    !Number.isInteger(metadata.sizeBytes) ||
    metadata.sizeBytes <= 0 ||
    !checksumSha256 ||
    metadata.integrityVerified !== true ||
    metadata.checksumSource !== 'server_computed_bytes'
  ) {
    throw new ApiError(
      'UPLOAD_NOT_FINALIZED',
      'Finalized private source media requires positive size and server-computed SHA-256 byte evidence.',
      409,
    )
  }
  return { sizeBytes: metadata.sizeBytes, checksumSha256 }
}

function maybeString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function maybeNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value !== '') return Number(value)
  return undefined
}

function unknownRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
