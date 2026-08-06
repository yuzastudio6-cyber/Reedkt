import { createHash } from 'node:crypto'
import { Storage } from '@google-cloud/storage'
import { Readable } from 'node:stream'
import { ApiError } from '../errors/api-error'
import type { RuntimeEnv } from '../config/env'
import type {
  DownloadTarget,
  ObjectMetadata,
  ObjectReadIdentity,
  PutObjectInput,
  StorageAdapter,
  UploadTarget,
  VerifyObjectInput,
} from './storage-types'
import {
  REEDITPRO_RESUMABLE_UPLOAD_CHUNK_BYTES,
  shouldUseResumableUpload,
} from '../../src/types/large-media'

export class GcsDisabledStorageAdapter implements StorageAdapter {
  readonly mode = 'gcs_disabled' as const

  async createUploadTarget(): Promise<UploadTarget> {
    throw new ApiError('MOCK_ONLY', 'GCS storage adapter is disabled. Use STORAGE_MODE=local for smoke tests or configure STORAGE_MODE=gcs later.', 503)
  }

  async putObject(): Promise<ObjectMetadata> {
    throw new ApiError('MOCK_ONLY', 'GCS storage writes are disabled.', 503)
  }

  async verifyUploadedObject(): Promise<ObjectMetadata> {
    throw new ApiError('MOCK_ONLY', 'GCS storage verification is disabled.', 503)
  }

  async createDownloadTarget(): Promise<DownloadTarget> {
    throw new ApiError('MOCK_ONLY', 'GCS download targets are disabled.', 503)
  }

  async getObjectMetadata(): Promise<ObjectMetadata> {
    throw new ApiError('MOCK_ONLY', 'GCS metadata reads are disabled.', 503)
  }

  async createReadStream(): Promise<Readable> {
    throw new ApiError('MOCK_ONLY', 'GCS object streaming is disabled.', 503)
  }

  async deleteObject(): Promise<{ deleted: boolean; warnings: string[] }> {
    return { deleted: false, warnings: ['GCS delete is disabled in this skeleton.'] }
  }
}

export class GcsStorageAdapter implements StorageAdapter {
  readonly mode = 'gcs' as const
  private readonly storage: Storage

  constructor(env: RuntimeEnv, storage?: Storage) {
    assertGcsConfigured(env)
    this.storage = storage ?? new Storage({
      projectId: env.googleCloudProjectId,
    })
  }

  async createUploadTarget(input: {
    uploadIntentId: string
    bucketName: string
    objectPath: string
    mimeType: string
    expectedSizeBytes?: number
    checksumSha256?: string
    expiresAt: string
  }): Promise<UploadTarget> {
    if (shouldUseResumableUpload(input.expectedSizeBytes)) {
      const [uploadUrl] = await this.storage
        .bucket(input.bucketName)
        .file(input.objectPath)
        .createResumableUpload({
          metadata: {
            contentType: input.mimeType,
          },
          preconditionOpts: { ifGenerationMatch: 0 },
        })

      return {
        uploadMethod: 'PUT',
        uploadUrl,
        uploadHeaders: {
          'content-type': input.mimeType,
        },
        expiresAt: input.expiresAt,
        bucketName: input.bucketName,
        objectPath: input.objectPath,
        temporary: true,
        createOnly: true,
        uploadProtocol: 'gcs_resumable',
        supportsResume: true,
        recommendedChunkSizeBytes: REEDITPRO_RESUMABLE_UPLOAD_CHUNK_BYTES,
        sessionUriIsCredential: true,
      }
    }

    // The XML API generation precondition is part of the V4 signature. A
    // replay can therefore never replace an already-created live object.
    const createOnlyHeaders = { 'x-goog-if-generation-match': '0' }
    const [uploadUrl] = await this.storage
      .bucket(input.bucketName)
      .file(input.objectPath)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: input.expiresAt,
        contentType: input.mimeType,
        extensionHeaders: createOnlyHeaders,
      })

    return {
      uploadMethod: 'PUT',
      uploadUrl,
      uploadHeaders: {
        'content-type': input.mimeType,
        ...createOnlyHeaders,
      },
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      createOnly: true,
      uploadProtocol: 'single_put',
      supportsResume: false,
      sessionUriIsCredential: true,
    }
  }

  async putObject(input: PutObjectInput): Promise<ObjectMetadata> {
    const checksumSha256 = createHash('sha256').update(input.body).digest('hex')
    const file = this.storage
      .bucket(input.bucketName)
      .file(input.objectPath, { preconditionOpts: { ifGenerationMatch: 0 } })
    try {
      await file.save(input.body, {
        contentType: input.mimeType,
        resumable: false,
        preconditionOpts: { ifGenerationMatch: 0 },
      })
    } catch (error) {
      if (cloudErrorCode(error) !== 412) throw error
      // A lost response followed by an idempotent worker retry reaches this
      // path. Accept only byte-identical existing output and never delete a
      // collision that this request did not create.
      return this.verifyUploadedObject({
        bucketName: input.bucketName,
        objectPath: input.objectPath,
        expectedSizeBytes: input.body.byteLength,
        checksumSha256,
        cleanupOnMismatch: false,
      })
    }

    return this.verifyUploadedObject({
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      expectedSizeBytes: input.body.byteLength,
      checksumSha256,
    })
  }

  async verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata> {
    const metadata = await this.getObjectMetadata(input.bucketName, input.objectPath)

    if (!metadata.exists) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'GCS object was not found.', 404)
    }

    const identity = requireGcsObjectIdentity(metadata)

    if (input.expectedSizeBytes !== undefined && metadata.sizeBytes !== input.expectedSizeBytes) {
      return this.rejectUploadedGeneration(
        input,
        identity,
        'GCS object size does not match expected size.',
        { expectedSizeBytes: input.expectedSizeBytes, actualSizeBytes: metadata.sizeBytes },
      )
    }

    const generationFile = this.storage
      .bucket(input.bucketName)
      .file(input.objectPath, { generation: identity.generation })
    const byteEvidence = await hashActualStoredBytes(
      generationFile.createReadStream({ decompress: false, validation: 'crc32c' }),
    )

    if (byteEvidence.sizeBytes !== metadata.sizeBytes) {
      return this.rejectUploadedGeneration(
        input,
        identity,
        'GCS object bytes do not match provider metadata size.',
        { metadataSizeBytes: metadata.sizeBytes, actualSizeBytes: byteEvidence.sizeBytes },
      )
    }

    const expectedChecksumSha256 = normalizeSha256(input.checksumSha256)
    if (expectedChecksumSha256 && byteEvidence.checksumSha256 !== expectedChecksumSha256) {
      return this.rejectUploadedGeneration(
        input,
        identity,
        'GCS object checksum does not match expected checksum.',
        { expectedChecksumSha256, actualChecksumSha256: byteEvidence.checksumSha256 },
      )
    }

    // Re-read the exact generation and require the same ETag. This detects a
    // metadata mutation while the server is building byte-integrity evidence.
    const stableMetadata = await this.getObjectMetadata(input.bucketName, input.objectPath, identity)

    return {
      ...stableMetadata,
      checksumSha256: byteEvidence.checksumSha256,
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }

  async createDownloadTarget(input: {
    storageObjectRecordId: string
    bucketName: string
    objectPath: string
    expiresAt: string
    workspaceId?: string
    generation?: string
    etag?: string
  }): Promise<DownloadTarget> {
    const identity = requireGcsReadIdentity(input)
    await this.getObjectMetadata(input.bucketName, input.objectPath, identity)
    const [downloadUrl] = await this.storage
      .bucket(input.bucketName)
      .file(input.objectPath, { generation: identity.generation })
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: input.expiresAt,
      })

    return {
      downloadMethod: 'GET',
      downloadUrl,
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      generation: identity.generation,
      etag: identity.etag,
    }
  }

  async getObjectMetadata(
    bucketName: string,
    objectPath: string,
    identity?: ObjectReadIdentity,
  ): Promise<ObjectMetadata> {
    const file = this.storage.bucket(bucketName).file(
      objectPath,
      identity?.generation ? { generation: identity.generation } : undefined,
    )
    let metadata: Record<string, unknown>
    try {
      const result = await file.getMetadata()
      metadata = result[0] as unknown as Record<string, unknown>
    } catch (error) {
      if (cloudErrorCode(error) === 404) {
        return {
          bucketName,
          objectPath,
          exists: false,
          sizeBytes: 0,
          checksumSha256: '',
          integrityVerified: false,
          checksumSource: 'unavailable',
        }
      }
      throw error
    }

    const resolved: ObjectMetadata = {
      bucketName,
      objectPath,
      exists: true,
      sizeBytes: Number(metadata.size ?? 0),
      // Custom x-goog-meta-* values are caller-controlled and never count as
      // byte-integrity evidence.
      checksumSha256: '',
      mimeType: optionalString(metadata.contentType),
      generation: optionalStringOrNumber(metadata.generation),
      etag: optionalString(metadata.etag),
      metageneration: optionalStringOrNumber(metadata.metageneration),
      integrityVerified: false,
      checksumSource: 'unavailable',
    }

    const resolvedIdentity = requireGcsObjectIdentity(resolved)
    if (identity?.generation && identity.generation !== resolvedIdentity.generation) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'GCS object generation does not match finalized object identity.', 409)
    }
    if (identity?.etag && identity.etag !== resolvedIdentity.etag) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'GCS object ETag does not match finalized object identity.', 409)
    }
    return resolved
  }

  async createReadStream(
    bucketName: string,
    objectPath: string,
    expectedIdentity?: ObjectReadIdentity,
  ): Promise<Readable> {
    const metadata = await this.getObjectMetadata(bucketName, objectPath, expectedIdentity)
    if (!metadata.exists) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'GCS object was not found.', 404)
    }

    const identity = requireGcsObjectIdentity(metadata)
    return this.storage
      .bucket(bucketName)
      .file(objectPath, { generation: identity.generation })
      .createReadStream({ decompress: false, validation: 'crc32c' })
  }

  async deleteObject(
    bucketName: string,
    objectPath: string,
    expectedIdentity?: ObjectReadIdentity,
  ): Promise<{ deleted: boolean; warnings: string[] }> {
    if (!expectedIdentity?.generation || !expectedIdentity.etag) {
      return {
        deleted: false,
        warnings: ['GCS deletion requires the exact verified generation and ETag; unbound deletion was refused.'],
      }
    }

    const metadata = await this.getObjectMetadata(bucketName, objectPath, expectedIdentity)
    if (!metadata.exists) return { deleted: false, warnings: ['The exact GCS generation was already absent.'] }

    try {
      await this.storage
        .bucket(bucketName)
        .file(objectPath, {
          generation: expectedIdentity.generation,
          preconditionOpts: { ifGenerationMatch: expectedIdentity.generation },
        })
        .delete({ ignoreNotFound: true })
      return { deleted: true, warnings: [] }
    } catch (error) {
      return {
        deleted: false,
        warnings: [`Exact-generation GCS cleanup failed with provider status ${cloudErrorCode(error) ?? 'unknown'}.`],
      }
    }
  }

  private async rejectUploadedGeneration(
    input: VerifyObjectInput,
    identity: Required<ObjectReadIdentity>,
    message: string,
    details: Record<string, unknown>,
  ): Promise<never> {
    const cleanup = input.cleanupOnMismatch === false
      ? { deleted: false, warnings: ['Exact-generation cleanup was disabled for an idempotency collision probe.'] }
      : await this.deleteObject(input.bucketName, input.objectPath, identity)
    throw new ApiError('UPLOAD_NOT_FINALIZED', message, 409, {
      ...details,
      generation: identity.generation,
      rejectedGenerationDeleted: cleanup.deleted,
      cleanupWarnings: cleanup.warnings,
    })
  }
}

function requireGcsReadIdentity(input: { generation?: string; etag?: string }): Required<ObjectReadIdentity> {
  if (!input.generation || !input.etag) {
    throw new ApiError(
      'UPLOAD_NOT_FINALIZED',
      'Finalized GCS generation and ETag evidence is required before creating a download target.',
      409,
    )
  }
  return { generation: input.generation, etag: input.etag }
}

function requireGcsObjectIdentity(metadata: ObjectMetadata): Required<ObjectReadIdentity> {
  if (!metadata.generation || !metadata.etag) {
    throw new ApiError('UPLOAD_NOT_FINALIZED', 'GCS object generation or ETag metadata is missing.', 409, {
      bucketName: metadata.bucketName,
      objectPath: metadata.objectPath,
    })
  }
  return { generation: metadata.generation, etag: metadata.etag }
}

async function hashActualStoredBytes(stream: Readable): Promise<{ checksumSha256: string; sizeBytes: number }> {
  const hash = createHash('sha256')
  let sizeBytes = 0
  for await (const chunk of stream) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    sizeBytes += bytes.byteLength
    hash.update(bytes)
  }
  return { checksumSha256: hash.digest('hex'), sizeBytes }
}

function normalizeSha256(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim().toLowerCase()
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : undefined
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function optionalStringOrNumber(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return optionalString(value)
}

function cloudErrorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined
  const code = (error as { code?: unknown }).code
  if (typeof code === 'number') return code
  if (typeof code === 'string' && /^\d+$/.test(code)) return Number(code)
  return undefined
}

function assertGcsConfigured(env: RuntimeEnv): void {
  if (!env.googleCloudProjectId) {
    throw new ApiError('MOCK_ONLY', 'GOOGLE_CLOUD_PROJECT_ID is required for STORAGE_MODE=gcs.', 503)
  }
}
