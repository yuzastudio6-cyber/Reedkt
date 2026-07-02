import { Storage } from '@google-cloud/storage'
import { Readable } from 'node:stream'
import { ApiError } from '../errors/api-error'
import type { RuntimeEnv } from '../config/env'
import type { DownloadTarget, ObjectMetadata, StorageAdapter, UploadTarget, VerifyObjectInput } from './storage-types'

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

  constructor(env: RuntimeEnv) {
    assertGcsConfigured(env)
    this.storage = new Storage({
      projectId: env.googleCloudProjectId,
    })
  }

  async createUploadTarget(input: {
    uploadIntentId: string
    bucketName: string
    objectPath: string
    mimeType: string
    expiresAt: string
  }): Promise<UploadTarget> {
    const [uploadUrl] = await this.storage
      .bucket(input.bucketName)
      .file(input.objectPath)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: input.expiresAt,
        contentType: input.mimeType,
      })

    return {
      uploadMethod: 'PUT',
      uploadUrl,
      uploadHeaders: { 'content-type': input.mimeType },
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
    }
  }

  async putObject(): Promise<ObjectMetadata> {
    throw new ApiError('MOCK_ONLY', 'Direct backend GCS uploads are not implemented; clients must use temporary upload targets.', 501)
  }

  async verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata> {
    const metadata = await this.getObjectMetadata(input.bucketName, input.objectPath)

    if (!metadata.exists) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'GCS object was not found.', 404)
    }

    if (input.expectedSizeBytes !== undefined && metadata.sizeBytes !== input.expectedSizeBytes) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'GCS object size does not match expected size.', 409)
    }

    if (input.checksumSha256 && metadata.checksumSha256 && metadata.checksumSha256 !== input.checksumSha256) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'GCS object checksum does not match expected checksum.', 409)
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
    const [downloadUrl] = await this.storage
      .bucket(input.bucketName)
      .file(input.objectPath)
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
    }
  }

  async getObjectMetadata(bucketName: string, objectPath: string): Promise<ObjectMetadata> {
    const file = this.storage.bucket(bucketName).file(objectPath)
    const [exists] = await file.exists()
    if (!exists) {
      return { bucketName, objectPath, exists: false, sizeBytes: 0, checksumSha256: '' }
    }

    const [metadata] = await file.getMetadata()
    return {
      bucketName,
      objectPath,
      exists: true,
      sizeBytes: Number(metadata.size ?? 0),
      checksumSha256: typeof metadata.metadata?.sha256 === 'string' ? metadata.metadata.sha256 : '',
      mimeType: metadata.contentType,
    }
  }

  async createReadStream(): Promise<Readable> {
    throw new ApiError('MOCK_ONLY', 'Backend proxy streaming for GCS is not implemented yet; use temporary download targets.', 501)
  }

  async deleteObject(): Promise<{ deleted: boolean; warnings: string[] }> {
    return { deleted: false, warnings: ['GCS delete is intentionally a placeholder until retention policy is reviewed.'] }
  }
}

function assertGcsConfigured(env: RuntimeEnv): void {
  if (!env.googleCloudProjectId) {
    throw new ApiError('MOCK_ONLY', 'GOOGLE_CLOUD_PROJECT_ID is required for STORAGE_MODE=gcs.', 503)
  }
}
