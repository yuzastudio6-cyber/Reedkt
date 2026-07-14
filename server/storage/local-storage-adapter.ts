import { createHash } from 'node:crypto'
import { Readable } from 'node:stream'
import { ApiError } from '../errors/api-error'
import {
  createPrivateReadStreamWithinRoot,
  readPrivateFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import { normalizeStoragePath } from './storage-paths'
import type { DownloadTarget, ObjectMetadata, PutObjectInput, StorageAdapter, UploadTarget, VerifyObjectInput } from './storage-types'

export class LocalStorageAdapter implements StorageAdapter {
  readonly mode = 'local' as const
  private readonly rootDir: string

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  async createUploadTarget(input: {
    uploadIntentId: string
    workspaceId?: string
    projectId?: string
    bucketName: string
    objectPath: string
    mimeType: string
    expectedSizeBytes?: number
    checksumSha256?: string
    expiresAt: string
  }): Promise<UploadTarget> {
    const workspaceQuery = input.workspaceId
      ? `?workspaceId=${encodeURIComponent(input.workspaceId)}`
      : ''
    return {
      uploadMethod: 'PUT',
      uploadUrl: `/v1/upload-intents/${input.uploadIntentId}/local-object${workspaceQuery}`,
      uploadHeaders: {
        'content-type': input.mimeType,
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
    await writePrivateFileCreateOnlyWithinRoot({
      rootPath: this.rootDir,
      relativePath: this.relativeObjectPath(input.bucketName, input.objectPath),
      content: input.body,
    })
    return this.metadataFromBuffer(input.bucketName, input.objectPath, input.body, input.mimeType)
  }

  async verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata> {
    const metadata = await this.getObjectMetadata(input.bucketName, input.objectPath)
    if (!metadata.exists) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Uploaded object was not found in local storage.', 404)
    }

    if (input.expectedSizeBytes !== undefined && metadata.sizeBytes !== input.expectedSizeBytes) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Uploaded object size does not match expected size.', 409, {
        expectedSizeBytes: input.expectedSizeBytes,
        actualSizeBytes: metadata.sizeBytes,
      })
    }

    if (input.checksumSha256 && metadata.checksumSha256 !== input.checksumSha256) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Uploaded object checksum does not match expected checksum.', 409)
    }

    return metadata
  }

  async createDownloadTarget(input: {
    storageObjectRecordId: string
    bucketName: string
    objectPath: string
    expiresAt: string
    workspaceId?: string
  }): Promise<DownloadTarget> {
    const workspaceQuery = input.workspaceId ? `?workspaceId=${encodeURIComponent(input.workspaceId)}` : ''
    return {
      downloadMethod: 'GET',
      downloadUrl: `/v1/storage-objects/${input.storageObjectRecordId}/local-object${workspaceQuery}`,
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
    }
  }

  async getObjectMetadata(bucketName: string, objectPath: string): Promise<ObjectMetadata> {
    const buffer = await readPrivateFileIfExistsWithinRoot({
      rootPath: this.rootDir,
      relativePath: this.relativeObjectPath(bucketName, objectPath),
    })
    if (!buffer) {
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
    return this.metadataFromBuffer(bucketName, objectPath, buffer)
  }

  async createReadStreamForObject(bucketName: string, objectPath: string): Promise<Readable> {
    const metadata = await this.getObjectMetadata(bucketName, objectPath)
    if (!metadata.exists) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Local storage object was not found.', 404)
    }
    return createPrivateReadStreamWithinRoot({
      rootPath: this.rootDir,
      relativePath: this.relativeObjectPath(bucketName, objectPath),
    })
  }

  async createReadStream(bucketName: string, objectPath: string): Promise<Readable> {
    return this.createReadStreamForObject(bucketName, objectPath)
  }

  async deleteObject(): Promise<{ deleted: boolean; warnings: string[] }> {
    return {
      deleted: false,
      warnings: ['Local storage delete is intentionally a placeholder in RP-E2E-READY-01.'],
    }
  }

  private relativeObjectPath(bucketName: string, objectPath: string): string {
    const safeBucket = normalizeStoragePath(bucketName)
    const safeObjectPath = normalizeStoragePath(objectPath)
    if (!safeBucket || !safeObjectPath) {
      throw new ApiError('VALIDATION_FAILED', 'Local storage bucket and object path are required.', 400)
    }
    return `${safeBucket}/${safeObjectPath}`
  }

  private metadataFromBuffer(
    bucketName: string,
    objectPath: string,
    buffer: Buffer,
    mimeType?: string,
    sizeOverride?: number,
  ): ObjectMetadata {
    return {
      bucketName,
      objectPath,
      sizeBytes: sizeOverride ?? buffer.byteLength,
      checksumSha256: createHash('sha256').update(buffer).digest('hex'),
      mimeType,
      exists: true,
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }
}
