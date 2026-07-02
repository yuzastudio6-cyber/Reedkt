import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { ApiError } from '../errors/api-error'
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
    bucketName: string
    objectPath: string
    mimeType: string
    expiresAt: string
  }): Promise<UploadTarget> {
    return {
      uploadMethod: 'PUT',
      uploadUrl: `/v1/upload-intents/${input.uploadIntentId}/local-object`,
      uploadHeaders: {
        'content-type': input.mimeType,
      },
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
    }
  }

  async putObject(input: PutObjectInput): Promise<ObjectMetadata> {
    const absolutePath = this.resolvePath(input.bucketName, input.objectPath)
    await mkdir(path.dirname(absolutePath), { recursive: true })
    await writeFile(absolutePath, input.body)
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
    const absolutePath = this.resolvePath(bucketName, objectPath)
    try {
      const fileStat = await stat(absolutePath)
      const buffer = await readFile(absolutePath)
      return this.metadataFromBuffer(bucketName, objectPath, buffer, undefined, fileStat.size)
    } catch {
      return {
        bucketName,
        objectPath,
        sizeBytes: 0,
        checksumSha256: '',
        exists: false,
      }
    }
  }

  async createReadStreamForObject(bucketName: string, objectPath: string): Promise<Readable> {
    const metadata = await this.getObjectMetadata(bucketName, objectPath)
    if (!metadata.exists) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Local storage object was not found.', 404)
    }
    return createReadStream(this.resolvePath(bucketName, objectPath))
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

  private resolvePath(bucketName: string, objectPath: string): string {
    const safeBucket = normalizeStoragePath(bucketName)
    const safeObjectPath = normalizeStoragePath(objectPath)
    const absoluteRoot = path.resolve(this.rootDir)
    const absolutePath = path.resolve(absoluteRoot, safeBucket, safeObjectPath)

    if (!absolutePath.startsWith(absoluteRoot + path.sep)) {
      throw new ApiError('VALIDATION_FAILED', 'Storage path escapes local storage root.', 400)
    }

    return absolutePath
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
    }
  }
}
