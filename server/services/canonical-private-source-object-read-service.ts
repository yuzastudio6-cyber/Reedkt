import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import { createStorageAdapter } from '../storage/storage-adapter'
import type { StorageAdapter } from '../storage/storage-types'
import type { ServiceContext } from '../types'
import type {
  CanonicalApprovedExecutionAuthority,
  CanonicalApprovedExecutionWorkItem,
} from './edit-planning-authority-service'
import {
  privateProjectUploadMediaAuthority,
  privateUploadMediaAuthorityValueHash,
  readPrivateUploadMediaAuthorityAggregate,
} from './private-upload-media-authority-store'
import { sha256AuthorityValue } from './private-edit-authority-store'
import { getRequiredAuthUserId } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export const CANONICAL_PRIVATE_SOURCE_OBJECT_MAX_BYTES = 16 * 1024 * 1024

export interface CanonicalPrivateSourceObjectReadResult {
  bytes: Buffer
  sourceSequenceItemId: string
  mediaAssetId: string
  storageObjectRecordId: string
  mimeType: 'video/mp4'
  byteLength: number
  sha256: string
  bindingHash: string
  storageIdentityHash: string
  sourceReadEvidenceHash: string
}

/**
 * Resolves one exact source object from the immutable approved source manifest.
 * Callers cannot provide a bucket, object path, URL, generation, checksum, or
 * source bytes. Those values are recovered from checksum-protected backend
 * authority and verified again against the stored object before any bytes are
 * returned to the canonical coordinator.
 */
export function createCanonicalPrivateSourceObjectReadService(context: ServiceContext) {
  return {
    async readExactApprovedSource(input: {
      workspaceId: string
      projectId: string
      snapshotId: string
      jobId: string
      approvedWorkItem: CanonicalApprovedExecutionWorkItem
      approvedSourceManifest: CanonicalApprovedExecutionAuthority['sourceAssetManifest']
      leaseId: string
      executionAttemptId: string
      dispatchGrantId: string
    }): Promise<CanonicalPrivateSourceObjectReadResult> {
      assertPrivateInternalRuntime(context)
      const actorUserId = getRequiredAuthUserId(context)
      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      if (access.userId !== actorUserId) throw invalidSource('Authenticated source reader is outside the workspace.')
      if (
        input.approvedSourceManifest.workspaceId !== access.workspaceId ||
        input.approvedSourceManifest.projectId !== input.projectId ||
        input.approvedSourceManifest.snapshotId !== input.snapshotId ||
        input.approvedSourceManifest.uploadPurpose !== 'source_media'
      ) throw invalidSource('Approved source manifest does not match execution identity.')
      if (input.approvedWorkItem.sourceSequenceItemIds.length !== 1) {
        throw invalidSource('A bounded media operation must resolve exactly one approved source item.')
      }

      const sourceSequenceItemId = input.approvedWorkItem.sourceSequenceItemIds[0]!
      const binding = input.approvedSourceManifest.bindings.find((candidate) =>
        candidate.sourceSequenceItemId === sourceSequenceItemId)
      if (!binding) throw invalidSource('Approved source binding is unavailable for this work item.')
      const bindingWithoutHash = Object.fromEntries(
        Object.entries(binding).filter(([key]) => key !== 'bindingHash'),
      )
      if (binding.bindingHash !== privateUploadMediaAuthorityValueHash(bindingWithoutHash)) {
        throw invalidSource('Approved source binding checksum is invalid.')
      }
      if (binding.mimeType !== 'video/mp4' || binding.sizeBytes > CANONICAL_PRIVATE_SOURCE_OBJECT_MAX_BYTES) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'Approved source is outside the bounded private media-runner contract.',
          409,
          { requiredMimeType: 'video/mp4', maximumBytes: CANONICAL_PRIVATE_SOURCE_OBJECT_MAX_BYTES },
        )
      }

      const aggregate = await readPrivateUploadMediaAuthorityAggregate({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: actorUserId,
        workspaceId: access.workspaceId,
      })
      if (!aggregate) throw invalidSource('Private upload authority changed after plan approval.')
      const projectAuthority = privateProjectUploadMediaAuthority(aggregate, input.projectId)
      if (
        projectAuthority.authorityRevision !== input.approvedSourceManifest.authorityRevision ||
        projectAuthority.authorityChecksumSha256 !== input.approvedSourceManifest.authorityChecksumSha256
      ) throw invalidSource('Private upload authority changed after plan approval.')

      const mediaAsset = aggregate.mediaAssets.find((candidate) => candidate.id === binding.mediaAssetId)
      const storageObject = aggregate.storageObjects.find((candidate) => candidate.id === binding.storageObjectRecordId)
      const uploadIntent = aggregate.uploadIntents.find((candidate) => candidate.id === binding.uploadIntentId)
      if (
        !mediaAsset || !storageObject || !uploadIntent ||
        uploadIntent.status !== 'finalized' || mediaAsset.status !== 'uploaded' || storageObject.status !== 'ready' ||
        uploadIntent.workspaceId !== access.workspaceId || uploadIntent.projectId !== input.projectId ||
        mediaAsset.workspaceId !== access.workspaceId || mediaAsset.projectId !== input.projectId ||
        storageObject.workspaceId !== access.workspaceId || storageObject.projectId !== input.projectId ||
        aggregate.mediaAssetIdByUploadIntentId[uploadIntent.id] !== mediaAsset.id ||
        aggregate.storageObjectIdByUploadIntentId[uploadIntent.id] !== storageObject.id ||
        aggregate.storageObjectIdByMediaAssetId[mediaAsset.id] !== storageObject.id ||
        mediaAsset.storageObjectRecordId !== storageObject.id || storageObject.mediaAssetId !== mediaAsset.id ||
        storageObject.uploadIntentId !== uploadIntent.id || mediaAsset.uploadIntentId !== uploadIntent.id ||
        binding.checksumSha256 !== mediaAsset.checksumSha256 || binding.checksumSha256 !== storageObject.checksumSha256 ||
        binding.sizeBytes !== mediaAsset.sizeBytes || binding.sizeBytes !== storageObject.sizeBytes ||
        binding.mimeType !== mediaAsset.mimeType || binding.mimeType !== storageObject.mimeType ||
        binding.storageProvider !== mediaAsset.storageProvider || binding.storageProvider !== storageObject.storageProvider ||
        binding.generation !== storageObject.generation || binding.etag !== storageObject.etag
      ) throw invalidSource('Approved source binding no longer matches exact finalized upload lineage.')

      const storageIdentityHash = privateUploadMediaAuthorityValueHash({
        storageProvider: storageObject.storageProvider,
        bucketName: storageObject.bucketName,
        objectPath: storageObject.objectPath,
        generation: storageObject.generation,
        etag: storageObject.etag,
        metageneration: storageObject.metageneration,
      })
      if (storageIdentityHash !== binding.storageIdentityHash) {
        throw invalidSource('Approved storage-object identity changed after approval.')
      }

      const storage = context.storageAdapter ?? createStorageAdapter(context.env)
      assertStorageMode(storage, storageObject.storageProvider)
      const identity = storageObject.storageProvider === 'google_cloud_storage'
        ? { generation: storageObject.generation, etag: storageObject.etag }
        : undefined
      if (storageObject.storageProvider === 'google_cloud_storage' && (!identity?.generation || !identity.etag)) {
        throw invalidSource('Approved GCS source lacks exact generation and ETag authority.')
      }
      const metadata = await storage.getObjectMetadata(storageObject.bucketName, storageObject.objectPath, identity)
      if (
        !metadata.exists || metadata.sizeBytes !== binding.sizeBytes ||
        (metadata.mimeType && metadata.mimeType.trim().toLowerCase() !== binding.mimeType) ||
        (identity?.generation && metadata.generation !== identity.generation) ||
        (identity?.etag && metadata.etag !== identity.etag)
      ) throw invalidSource('Live private object metadata does not match approved source authority.')

      const bytes = await readBounded(
        await storage.createReadStream(storageObject.bucketName, storageObject.objectPath, identity),
        binding.sizeBytes,
      )
      const sha256 = createHash('sha256').update(bytes).digest('hex')
      if (bytes.byteLength !== binding.sizeBytes || sha256 !== binding.checksumSha256) {
        throw invalidSource('Live private source bytes do not match approved source authority.')
      }
      const evidence = {
        domain: 'canonical_private_source_object_read_v1',
        workspaceId: access.workspaceId,
        projectId: input.projectId,
        snapshotId: input.snapshotId,
        jobId: input.jobId,
        approvedWorkItemId: input.approvedWorkItem.id,
        sourceSequenceItemId,
        mediaAssetId: binding.mediaAssetId,
        storageObjectRecordId: binding.storageObjectRecordId,
        leaseId: input.leaseId,
        executionAttemptId: input.executionAttemptId,
        dispatchGrantId: input.dispatchGrantId,
        bindingHash: binding.bindingHash,
        storageIdentityHash,
        mimeType: binding.mimeType,
        byteLength: bytes.byteLength,
        sha256,
      }
      return {
        bytes,
        sourceSequenceItemId,
        mediaAssetId: binding.mediaAssetId,
        storageObjectRecordId: binding.storageObjectRecordId,
        mimeType: 'video/mp4',
        byteLength: bytes.byteLength,
        sha256,
        bindingHash: binding.bindingHash,
        storageIdentityHash,
        sourceReadEvidenceHash: sha256AuthorityValue(evidence),
      }
    },
  }
}

async function readBounded(stream: NodeJS.ReadableStream, expectedBytes: number): Promise<Buffer> {
  if (expectedBytes < 64 || expectedBytes > CANONICAL_PRIVATE_SOURCE_OBJECT_MAX_BYTES) {
    throw invalidSource('Approved source byte length is outside the fixed runner bounds.')
  }
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += bytes.byteLength
    if (total > expectedBytes || total > CANONICAL_PRIVATE_SOURCE_OBJECT_MAX_BYTES) {
      throw invalidSource('Private source stream exceeded its approved byte commitment.')
    }
    chunks.push(bytes)
  }
  return Buffer.concat(chunks, total)
}

function assertStorageMode(storage: StorageAdapter, provider: 'local_private' | 'google_cloud_storage'): void {
  if (
    (provider === 'local_private' && storage.mode !== 'local') ||
    (provider === 'google_cloud_storage' && storage.mode !== 'gcs')
  ) throw invalidSource('Private source storage provider does not match the active backend adapter.')
}

function assertPrivateInternalRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) throw new ApiError('TOOL_NOT_READY', 'Private source reads are limited to explicit internal testing.', 503)
}

function invalidSource(message: string): ApiError {
  return new ApiError('UPLOAD_NOT_FINALIZED', message, 409)
}
