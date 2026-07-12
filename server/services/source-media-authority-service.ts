import { ApiError } from '../errors/api-error'
import { createStorageAdapter } from '../storage/storage-adapter'
import type { ObjectMetadata } from '../storage/storage-types'
import type { ServiceContext } from '../types'
import {
  buildSourceBindingManifestCandidateSchema,
  sourceBindingManifestCandidateSchema,
  type BuildSourceBindingManifestCandidateBody,
  type SourceBindingManifestCandidate,
} from '../validation/source-media-authority-schemas'
import {
  privateProjectUploadMediaAuthority,
  privateUploadMediaAuthorityValueHash,
  readPrivateUploadMediaAuthorityAggregate,
} from './private-upload-media-authority-store'
import { createProjectService } from './project-service'
import { authorizeWorkspaceAccess } from './workspace-access-service'

export function createSourceMediaAuthorityService(context: ServiceContext) {
  return {
    async buildManifestCandidate(
      input: BuildSourceBindingManifestCandidateBody,
    ): Promise<{ sourceBindingManifestCandidate: SourceBindingManifestCandidate; warnings: string[] }> {
      const parsed = buildSourceBindingManifestCandidateSchema.safeParse(input)
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Source binding manifest candidate input is invalid.',
          400,
          parsed.error.flatten(),
        )
      }
      assertPrivateSourceAuthorityRuntime(context)
      const body = parsed.data
      const access = await authorizeWorkspaceAccess(context, body.workspaceId, 'read')
      await createProjectService(context).getProject(body.projectId, access.workspaceId)
      const aggregate = await readPrivateUploadMediaAuthorityAggregate({
        localStorageRoot: context.env.localStorageRoot,
        ownerUserId: access.userId,
        workspaceId: access.workspaceId,
      })
      if (!aggregate) {
        throw new ApiError('UPLOAD_NOT_FINALIZED', 'Private source-media authority was not found.', 409)
      }
      const storage = context.storageAdapter ?? createStorageAdapter(context.env)
      const bindings: SourceBindingManifestCandidate['bindings'] = []

      for (const item of body.orderedItems) {
        const mediaAsset = aggregate.mediaAssets.find((record) => record.id === item.mediaAssetId)
        const uploadIntent = mediaAsset
          ? aggregate.uploadIntents.find((record) => record.id === mediaAsset.uploadIntentId)
          : undefined
        const storageObjectId = mediaAsset
          ? aggregate.storageObjectIdByMediaAssetId[mediaAsset.id]
          : undefined
        const storageObject = aggregate.storageObjects.find((record) => record.id === storageObjectId)
        if (
          !mediaAsset ||
          !uploadIntent ||
          !storageObject ||
          uploadIntent.status !== 'finalized' ||
          mediaAsset.status !== 'uploaded' ||
          storageObject.status !== 'ready'
        ) {
          throw sourceAuthorityMismatch(item.mediaAssetId, 'finalized_lineage_missing')
        }
        if (
          uploadIntent.workspaceId !== access.workspaceId ||
          uploadIntent.projectId !== body.projectId ||
          uploadIntent.uploadPurpose !== body.uploadPurpose ||
          mediaAsset.workspaceId !== access.workspaceId ||
          mediaAsset.projectId !== body.projectId ||
          mediaAsset.uploadPurpose !== body.uploadPurpose ||
          storageObject.workspaceId !== access.workspaceId ||
          storageObject.projectId !== body.projectId ||
          storageObject.uploadPurpose !== body.uploadPurpose ||
          storageObject.objectPurpose !== body.uploadPurpose
        ) {
          throw sourceAuthorityMismatch(item.mediaAssetId, 'tenant_project_or_purpose_mismatch')
        }
        if (
          aggregate.mediaAssetIdByUploadIntentId[uploadIntent.id] !== mediaAsset.id ||
          aggregate.storageObjectIdByUploadIntentId[uploadIntent.id] !== storageObject.id ||
          aggregate.storageObjectIdByMediaAssetId[mediaAsset.id] !== storageObject.id ||
          mediaAsset.storageObjectRecordId !== storageObject.id ||
          storageObject.mediaAssetId !== mediaAsset.id ||
          storageObject.uploadIntentId !== uploadIntent.id
        ) {
          throw sourceAuthorityMismatch(item.mediaAssetId, 'exact_index_linkage_mismatch')
        }
        if (
          item.checksumSha256 !== mediaAsset.checksumSha256 ||
          item.checksumSha256 !== storageObject.checksumSha256 ||
          mediaAsset.sizeBytes !== storageObject.sizeBytes ||
          mediaAsset.mimeType !== storageObject.mimeType ||
          mediaAsset.storageProvider !== storageObject.storageProvider
        ) {
          throw sourceAuthorityMismatch(item.mediaAssetId, 'checksum_size_or_storage_mismatch')
        }

        await assertStoredObjectStillMatches({
          storageMode: storage.mode,
          storage,
          mediaAssetId: mediaAsset.id,
          storageProvider: mediaAsset.storageProvider,
          bucketName: storageObject.bucketName,
          objectPath: storageObject.objectPath,
          sizeBytes: storageObject.sizeBytes,
          checksumSha256: storageObject.checksumSha256,
          mimeType: storageObject.mimeType,
          generation: storageObject.generation,
          etag: storageObject.etag,
        })

        const storageIdentityHash = privateUploadMediaAuthorityValueHash({
          storageProvider: storageObject.storageProvider,
          bucketName: storageObject.bucketName,
          objectPath: storageObject.objectPath,
          generation: storageObject.generation,
          etag: storageObject.etag,
          metageneration: storageObject.metageneration,
        })
        const bindingWithoutHash = {
          sourceSequenceItemId: item.sourceSequenceItemId,
          mediaAssetId: item.mediaAssetId,
          uploadedOrder: item.uploadedOrder,
          required: item.required,
          uploadIntentId: uploadIntent.id,
          storageObjectRecordId: storageObject.id,
          storageProvider: storageObject.storageProvider,
          mimeType: mediaAsset.mimeType,
          sizeBytes: mediaAsset.sizeBytes,
          checksumSha256: mediaAsset.checksumSha256,
          ...(storageObject.generation ? { generation: storageObject.generation } : {}),
          ...(storageObject.etag ? { etag: storageObject.etag } : {}),
          storageIdentityHash,
        }
        bindings.push({
          ...bindingWithoutHash,
          bindingHash: privateUploadMediaAuthorityValueHash(bindingWithoutHash),
        })
      }

      const sourceSequenceHash = privateUploadMediaAuthorityValueHash(body.orderedItems)
      const projectAuthority = privateProjectUploadMediaAuthority(aggregate, body.projectId)
      const candidateWithoutHash = {
        schemaVersion: 'private-source-binding-manifest-candidate-v1' as const,
        authorityStatus: 'unapproved_manifest_candidate' as const,
        executionAuthorized: false as const,
        approvedSnapshotMutated: false as const,
        noRuntimeSideEffects: true as const,
        workspaceId: access.workspaceId,
        projectId: body.projectId,
        uploadPurpose: body.uploadPurpose,
        authorityRevision: projectAuthority.authorityRevision,
        authorityChecksumSha256: projectAuthority.authorityChecksumSha256,
        sourceSequenceHash,
        bindings,
        requiredBindingCount: bindings.filter((binding) => binding.required).length,
      }
      const candidate = sourceBindingManifestCandidateSchema.parse({
        ...candidateWithoutHash,
        candidateHash: privateUploadMediaAuthorityValueHash(candidateWithoutHash),
      })
      return {
        sourceBindingManifestCandidate: candidate,
        warnings: [
          'This is an authenticated private manifest candidate only; it is not approved snapshot authority.',
          'No provider, worker, media processing, render, credit, or canonical snapshot side effect occurred.',
        ],
      }
    },
  }
}

async function assertStoredObjectStillMatches(input: {
  storageMode: 'local' | 'gcs_disabled' | 'gcs'
  storage: ReturnType<typeof createStorageAdapter> | NonNullable<ServiceContext['storageAdapter']>
  mediaAssetId: string
  storageProvider: 'local_private' | 'google_cloud_storage'
  bucketName: string
  objectPath: string
  sizeBytes: number
  checksumSha256: string
  mimeType: string
  generation?: string
  etag?: string
}): Promise<void> {
  if (input.storageProvider === 'local_private') {
    if (input.storageMode !== 'local') {
      throw sourceAuthorityMismatch(input.mediaAssetId, 'local_storage_runtime_mismatch')
    }
    await input.storage.verifyUploadedObject({
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      expectedSizeBytes: input.sizeBytes,
      checksumSha256: input.checksumSha256,
      cleanupOnMismatch: false,
    })
    return
  }

  if (input.storageMode !== 'gcs' || !input.generation || !input.etag) {
    throw sourceAuthorityMismatch(input.mediaAssetId, 'gcs_generation_identity_missing')
  }
  const metadata: ObjectMetadata = await input.storage.getObjectMetadata(
    input.bucketName,
    input.objectPath,
    { generation: input.generation, etag: input.etag },
  )
  if (
    !metadata.exists ||
    metadata.sizeBytes !== input.sizeBytes ||
    metadata.generation !== input.generation ||
    metadata.etag !== input.etag ||
    (metadata.mimeType && metadata.mimeType.trim().toLowerCase() !== input.mimeType)
  ) {
    throw sourceAuthorityMismatch(input.mediaAssetId, 'gcs_live_identity_mismatch')
  }
}

function assertPrivateSourceAuthorityRuntime(context: ServiceContext): void {
  if (
    context.env.nodeEnv === 'production' ||
    (context.env.mode !== 'local' && context.env.mode !== 'mock') ||
    (!context.env.mockOnly && !context.env.allowInternalTestExecutionWithSupabase)
  ) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Private source-media manifest candidates are limited to explicit local/internal testing.',
      503,
      { requiredGate: 'canonical_distributed_source_media_authority' },
    )
  }
}

function sourceAuthorityMismatch(mediaAssetId: string, reason: string): ApiError {
  return new ApiError(
    'UPLOAD_NOT_FINALIZED',
    'Source media does not match exact private upload/storage authority.',
    409,
    { mediaAssetId, reason },
  )
}
