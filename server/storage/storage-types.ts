import type { Readable } from 'node:stream'
import type { TemporaryUploadProtocol } from '../../src/types/large-media'

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
  /** The target may create a new live object only; replay cannot replace it. */
  createOnly: boolean
  /** Defaults to single_put for older/local adapters. */
  uploadProtocol?: TemporaryUploadProtocol
  /** True only when the client can query committed bytes and continue. */
  supportsResume?: boolean
  /** Provider-aligned client chunk recommendation for resumable sessions. */
  recommendedChunkSizeBytes?: number
  /** Authenticated relative status route for the local resumable protocol. */
  uploadStatusUrl?: string
  /** True only when a failed request may restart from a server-verified offset. */
  retryFromVerifiedOffset?: boolean
  /** Session URLs are bearer credentials and must never be durably persisted. */
  sessionUriIsCredential?: boolean
}

export interface ResumableObjectChunkInput {
  bucketName: string
  objectPath: string
  objectIdentityDigestSha256: string
  totalBytes: number
  startByte: number
  endByteInclusive: number
  body: Buffer
  chunkChecksumSha256: string
}

export interface ResumableObjectStatusInput {
  bucketName: string
  objectPath: string
  objectIdentityDigestSha256: string
  totalBytes: number
}

export interface ResumableObjectStatus {
  acceptedBytes: number
  totalBytes: number
  complete: boolean
  replayed: boolean
  integrityVerifiedThroughBytes: number
  verifiedChunkCount: number
  recovery?: {
    reason: string
    restartByte: number
    discardedBytes: number
  }
}

export interface DownloadTarget {
  downloadMethod: 'GET'
  downloadUrl: string
  expiresAt: string
  bucketName: string
  objectPath: string
  temporary: true
  generation?: string
  etag?: string
}

export interface ObjectReadIdentity {
  generation?: string
  etag?: string
}

export type ObjectChecksumSource = 'server_computed_bytes' | 'unavailable'

export interface ObjectMetadata {
  bucketName: string
  objectPath: string
  sizeBytes: number
  checksumSha256: string
  mimeType?: string
  exists: boolean
  /** Provider object version. Required for durable GCS object identity. */
  generation?: string
  /** Provider entity tag observed for the same generation. */
  etag?: string
  metageneration?: string
  /** True only after a trusted backend has hashed the actual object bytes. */
  integrityVerified: boolean
  checksumSource: ObjectChecksumSource
}

export interface VerifyObjectInput {
  bucketName: string
  objectPath: string
  expectedSizeBytes?: number
  checksumSha256?: string
  /** Defaults true for untrusted uploads. Backend idempotency probes may opt out. */
  cleanupOnMismatch?: boolean
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
    workspaceId?: string
    projectId?: string
    bucketName: string
    objectPath: string
    mimeType: string
    expectedSizeBytes?: number
    checksumSha256?: string
    expiresAt: string
  }): Promise<UploadTarget>
  putObject(input: PutObjectInput): Promise<ObjectMetadata>
  putResumableObjectChunk?(
    input: ResumableObjectChunkInput,
  ): Promise<ResumableObjectStatus>
  getResumableObjectStatus?(
    input: ResumableObjectStatusInput,
  ): Promise<ResumableObjectStatus>
  verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata>
  createDownloadTarget(input: {
    storageObjectRecordId: string
    bucketName: string
    objectPath: string
    expiresAt: string
    workspaceId?: string
    generation?: string
    etag?: string
  }): Promise<DownloadTarget>
  getObjectMetadata(bucketName: string, objectPath: string, identity?: ObjectReadIdentity): Promise<ObjectMetadata>
  createReadStream(bucketName: string, objectPath: string, identity?: ObjectReadIdentity): Promise<Readable>
  deleteObject(bucketName: string, objectPath: string, identity?: ObjectReadIdentity): Promise<{ deleted: boolean; warnings: string[] }>
}
