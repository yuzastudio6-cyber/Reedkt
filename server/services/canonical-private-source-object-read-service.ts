import { createHash } from 'node:crypto'
import type { Readable } from 'node:stream'

import { REEDITPRO_SOURCE_MEDIA_MAX_BYTES } from '../../src/types/large-media'
import { ApiError } from '../errors/api-error'
import { createPrivateReadStreamWithinRoot } from '../security/private-local-persistence'
import { createStorageAdapter } from '../storage/storage-adapter'
import type { StorageAdapter } from '../storage/storage-types'
import type { OfflineMediaBinaryServerInjectedInput } from '../tool-execution/media-binary-execution'
import type { ServiceContext } from '../types'
import {
  inspectLargeMediaFinalizationCapacity,
  reserveLargeMediaWorkerCapacity,
} from '../workers/media/media-worker-capacity-policy'
import {
  createPrivateCanonicalWorkerSandbox,
  destroyPrivateCanonicalWorkerSandbox,
  materializeVerifiedPrivateWorkerInput,
} from '../workers/canonical-runtime/private-worker-sandbox'
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

export const CANONICAL_PRIVATE_SOURCE_OBJECT_MAX_BYTES = REEDITPRO_SOURCE_MEDIA_MAX_BYTES
export const CANONICAL_PRIVATE_SOURCE_OBJECT_BUFFER_MAX_BYTES = 16 * 1024 * 1024

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

export interface CanonicalPrivateSourceObjectReadInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  snapshotId: string
  jobId: string
  approvedWorkItem: CanonicalApprovedExecutionWorkItem
  approvedSourceManifest: CanonicalApprovedExecutionAuthority['sourceAssetManifest']
  leaseId: string
  executionAttemptId: string
  dispatchGrantId: string
}

export interface CanonicalPrivateStagedSourceReadResult {
  sourceSequenceItemId: string
  mediaAssetId: string
  storageObjectRecordId: string
  mimeType: 'video/mp4'
  byteLength: number
  sha256: string
  bindingHash: string
  storageIdentityHash: string
  sourceReadEvidenceHash: string
  stagingEvidenceHash: string
  sourceInput: OfflineMediaBinaryServerInjectedInput
}

export interface CanonicalPrivateStagedSourceSet {
  sources: CanonicalPrivateStagedSourceReadResult[]
  combinedByteLength: number
  capacityPolicyId: 'large_media_worker_capacity_v1'
  capacityEvidenceHash: string
  cleanup(): Promise<void>
}

/**
 * Resolves one exact source object, or an exact ordered source sequence, from
 * the immutable approved source manifest.
 * Callers cannot provide a bucket, object path, URL, generation, checksum, or
 * source bytes. Those values are recovered from checksum-protected backend
 * authority and verified again against the stored object before any bytes are
 * returned to the canonical coordinator.
 */
export function createCanonicalPrivateSourceObjectReadService(context: ServiceContext) {
  async function resolveApprovedSource(
    input: CanonicalPrivateSourceObjectReadInput,
    sourceSequenceItemId: string,
  ) {
    if (!input.approvedWorkItem.sourceSequenceItemIds.includes(sourceSequenceItemId)) {
      throw invalidSource('Requested source is outside the exact approved work item.')
    }
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

    return {
      access,
      binding,
      storageIdentityHash,
      storage,
      storageObject,
      identity,
    }
  }

  async function readApprovedSource(
    input: CanonicalPrivateSourceObjectReadInput,
    sourceSequenceItemId: string,
  ): Promise<CanonicalPrivateSourceObjectReadResult> {
    const resolved = await resolveApprovedSource(input, sourceSequenceItemId)
    const { access, binding, storageIdentityHash, storage, storageObject, identity } = resolved
    if (binding.sizeBytes > CANONICAL_PRIVATE_SOURCE_OBJECT_BUFFER_MAX_BYTES) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Approved source requires the private streamed media-runner contract.',
        409,
        {
          maximumBufferedBytes: CANONICAL_PRIVATE_SOURCE_OBJECT_BUFFER_MAX_BYTES,
          requiredInputMode: 'server_injected_private_stream_v1',
        },
      )
    }

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
  }

  async function stageApprovedSourceSet(
    input: CanonicalPrivateSourceObjectReadInput,
    sourceSequenceItemIds: string[],
  ): Promise<CanonicalPrivateStagedSourceSet> {
    const resolvedSources = []
    for (const sourceSequenceItemId of sourceSequenceItemIds) {
      resolvedSources.push(await resolveApprovedSource(input, sourceSequenceItemId))
    }
    const combinedByteLength = resolvedSources.reduce(
      (total, source) => safeSourceByteSum(total, source.binding.sizeBytes),
      0,
    )
    const capacity = await inspectLargeMediaFinalizationCapacity({
      filesystemPath: context.env.localStorageRoot,
      expectedSourceBytes: combinedByteLength,
    })
    if (!capacity.byteTraversalAuthorized) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'This private worker does not have verified capacity to stage the approved source set.',
        409,
        {
          capacityPolicyId: capacity.policyId,
          capacityStatus: capacity.status,
          expectedSourceBytes: capacity.expectedSourceBytes,
          requiredAvailableBytes: capacity.requiredAvailableBytes,
          availableBytes: capacity.availableBytes,
        },
      )
    }
    const capacityReservation = reserveLargeMediaWorkerCapacity({
      filesystemPath: context.env.localStorageRoot,
      assessment: capacity,
    })
    if (!capacityReservation.acquired) {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Verified private staging capacity is already reserved by another media attempt.',
        409,
        { capacityPolicyId: capacity.policyId },
      )
    }
    let sandbox: Awaited<ReturnType<typeof createPrivateCanonicalWorkerSandbox>> | undefined
    try {
      sandbox = await createPrivateCanonicalWorkerSandbox({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: getRequiredAuthUserId(context),
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        editSessionId: input.editSessionId,
        snapshotId: input.snapshotId,
        jobId: input.jobId,
        leaseId: input.leaseId,
        executionAttemptId: input.executionAttemptId,
        dispatchGrantId: input.dispatchGrantId,
      })
      const stagedSources: CanonicalPrivateStagedSourceReadResult[] = []
      for (const [index, resolved] of resolvedSources.entries()) {
        const inputId = `approved-source-${index + 1}`
        const materialized = await materializeVerifiedPrivateWorkerInput({
          sandbox,
          inputId,
          extension: 'mp4',
          stream: await resolved.storage.createReadStream(
            resolved.storageObject.bucketName,
            resolved.storageObject.objectPath,
            resolved.identity,
          ),
          expectedByteLength: resolved.binding.sizeBytes,
          expectedChecksumSha256: resolved.binding.checksumSha256,
          maximumBytes: resolved.binding.sizeBytes,
        })
        const stagingEvidence = {
          domain: 'canonical_private_source_staging_v2',
          workspaceId: resolved.access.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          snapshotId: input.snapshotId,
          jobId: input.jobId,
          approvedWorkItemId: input.approvedWorkItem.id,
          sourceSequenceItemId: resolved.binding.sourceSequenceItemId,
          mediaAssetId: resolved.binding.mediaAssetId,
          storageObjectRecordId: resolved.binding.storageObjectRecordId,
          leaseId: input.leaseId,
          executionAttemptId: input.executionAttemptId,
          dispatchGrantId: input.dispatchGrantId,
          sandboxId: sandbox.sandboxId,
          inputId,
          bindingHash: resolved.binding.bindingHash,
          storageIdentityHash: resolved.storageIdentityHash,
          byteLength: materialized.byteLength,
          sha256: materialized.checksumSha256,
          capacityPolicyId: capacity.policyId,
          inputMode: 'server_injected_private_stream_v1',
        }
        const stagingEvidenceHash = sha256AuthorityValue(stagingEvidence)
        const sourceInput: OfflineMediaBinaryServerInjectedInput = Object.freeze({
          inputMode: 'private_verified_stream_v1' as const,
          byteLength: materialized.byteLength,
          sha256: materialized.checksumSha256,
          async openStream(): Promise<Readable> {
            return createPrivateReadStreamWithinRoot({
              rootPath: sandbox!.localStorageRoot,
              relativePath: materialized.relativePath,
            })
          },
        })
        stagedSources.push({
          sourceSequenceItemId: resolved.binding.sourceSequenceItemId,
          mediaAssetId: resolved.binding.mediaAssetId,
          storageObjectRecordId: resolved.binding.storageObjectRecordId,
          mimeType: 'video/mp4',
          byteLength: materialized.byteLength,
          sha256: materialized.checksumSha256,
          bindingHash: resolved.binding.bindingHash,
          storageIdentityHash: resolved.storageIdentityHash,
          sourceReadEvidenceHash: sha256AuthorityValue({
            ...stagingEvidence,
            domain: 'canonical_private_source_object_read_v2',
            stagingEvidenceHash,
          }),
          stagingEvidenceHash,
          sourceInput,
        })
      }
      const capacityEvidenceHash = sha256AuthorityValue({
        domain: 'canonical_private_source_set_capacity_v1',
        capacity,
        combinedByteLength,
        sourceSha256s: stagedSources.map((source) => source.sha256),
        sandboxId: sandbox.sandboxId,
      })
      let cleaned = false
      return {
        sources: stagedSources,
        combinedByteLength,
        capacityPolicyId: capacity.policyId,
        capacityEvidenceHash,
        async cleanup() {
          if (cleaned) return
          await destroyPrivateCanonicalWorkerSandbox(sandbox!)
          capacityReservation.release()
          cleaned = true
        },
      }
    } catch (error) {
      if (sandbox) {
        try {
          await destroyPrivateCanonicalWorkerSandbox(sandbox)
        } catch (cleanupError) {
          throw new ApiError(
            'INTERNAL_ERROR',
            'Private source staging failed and its sandbox cleanup could not be verified.',
            500,
            undefined,
            { cause: new AggregateError([error, cleanupError]), internal: true },
          )
        }
      }
      capacityReservation.release()
      throw error
    }
  }

  return {
    async readExactApprovedSource(
      input: CanonicalPrivateSourceObjectReadInput,
    ): Promise<CanonicalPrivateSourceObjectReadResult> {
      if (input.approvedWorkItem.sourceSequenceItemIds.length !== 1) {
        throw invalidSource('A single-source media operation must resolve exactly one approved source item.')
      }
      return readApprovedSource(input, input.approvedWorkItem.sourceSequenceItemIds[0]!)
    },

    async stageExactApprovedSource(
      input: CanonicalPrivateSourceObjectReadInput,
    ): Promise<CanonicalPrivateStagedSourceSet> {
      if (input.approvedWorkItem.sourceSequenceItemIds.length !== 1) {
        throw invalidSource('A single-source media operation must resolve exactly one approved source item.')
      }
      return stageApprovedSourceSet(input, [input.approvedWorkItem.sourceSequenceItemIds[0]!])
    },

    async readExactApprovedSources(
      input: CanonicalPrivateSourceObjectReadInput,
    ): Promise<CanonicalPrivateSourceObjectReadResult[]> {
      const sourceIds = input.approvedWorkItem.sourceSequenceItemIds
      if (sourceIds.length < 2 || sourceIds.length > 8 || new Set(sourceIds).size !== sourceIds.length) {
        throw invalidSource('A source-sequence media operation requires two to eight unique approved source items.')
      }
      const results: CanonicalPrivateSourceObjectReadResult[] = []
      for (const sourceSequenceItemId of sourceIds) {
        results.push(await readApprovedSource(input, sourceSequenceItemId))
      }
      if (results.reduce((total, source) => total + source.byteLength, 0) > 20 * 1024 * 1024) {
        throw invalidSource('Approved source sequence exceeds the bounded combined byte ceiling.')
      }
      return results
    },

    async stageExactApprovedSources(
      input: CanonicalPrivateSourceObjectReadInput,
    ): Promise<CanonicalPrivateStagedSourceSet> {
      const sourceIds = input.approvedWorkItem.sourceSequenceItemIds
      if (sourceIds.length < 2 || sourceIds.length > 8 || new Set(sourceIds).size !== sourceIds.length) {
        throw invalidSource('A source-sequence media operation requires two to eight unique approved source items.')
      }
      return stageApprovedSourceSet(input, sourceIds)
    },
  }
}

async function readBounded(stream: NodeJS.ReadableStream, expectedBytes: number): Promise<Buffer> {
  if (expectedBytes < 64 || expectedBytes > CANONICAL_PRIVATE_SOURCE_OBJECT_BUFFER_MAX_BYTES) {
    throw invalidSource('Approved source byte length is outside the fixed runner bounds.')
  }
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += bytes.byteLength
    if (total > expectedBytes || total > CANONICAL_PRIVATE_SOURCE_OBJECT_BUFFER_MAX_BYTES) {
      throw invalidSource('Private source stream exceeded its approved byte commitment.')
    }
    chunks.push(bytes)
  }
  return Buffer.concat(chunks, total)
}

function safeSourceByteSum(left: number, right: number): number {
  const total = left + right
  if (!Number.isSafeInteger(total) || total <= 0) {
    throw invalidSource('Approved source-set byte commitment exceeds safe integer bounds.')
  }
  return total
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
