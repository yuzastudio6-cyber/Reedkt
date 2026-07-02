import type { Readable } from 'node:stream'

export type StorageMode = 'local' | 'gcs_disabled' | 'gcs'

export type UploadPurpose =
  | 'source_media'
  | 'reference_media'
  | 'generated_asset'
  | 'processed_media'
  | 'preview'
  | 'export'
  | 'thumbnail'
  | 'qa_artifact'
  | 'worker_temp'

export interface CanonicalObjectPathInput {
  workspaceId: string
  projectId: string
  purpose: UploadPurpose
  ownerId: string
  fileName: string
}

export interface UploadTarget {
  uploadMethod: 'PUT' | 'POST'
  uploadUrl: string
  uploadHeaders: Record<string, string>
  expiresAt: string
  bucketName: string
  objectPath: string
  temporary: true
}

export interface DownloadTarget {
  downloadMethod: 'GET'
  downloadUrl: string
  expiresAt: string
  bucketName: string
  objectPath: string
  temporary: true
}

export interface ObjectMetadata {
  bucketName: string
  objectPath: string
  sizeBytes: number
  checksumSha256: string
  mimeType?: string
  exists: boolean
}

export interface VerifyObjectInput {
  bucketName: string
  objectPath: string
  expectedSizeBytes?: number
  checksumSha256?: string
}

export interface PutObjectInput {
  bucketName: string
  objectPath: string
  body: Buffer
  mimeType?: string
}

export interface StorageAdapter {
  mode: StorageMode
  createUploadTarget(input: {
    uploadIntentId: string
    bucketName: string
    objectPath: string
    mimeType: string
    expiresAt: string
  }): Promise<UploadTarget>
  putObject(input: PutObjectInput): Promise<ObjectMetadata>
  verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata>
  createDownloadTarget(input: {
    storageObjectRecordId: string
    bucketName: string
    objectPath: string
    expiresAt: string
    workspaceId?: string
  }): Promise<DownloadTarget>
  getObjectMetadata(bucketName: string, objectPath: string): Promise<ObjectMetadata>
  createReadStream(bucketName: string, objectPath: string): Promise<Readable>
  deleteObject(bucketName: string, objectPath: string): Promise<{ deleted: boolean; warnings: string[] }>
}
