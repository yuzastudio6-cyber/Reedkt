import { createReadStream } from 'node:fs'
import { mkdir, open, rm, type FileHandle } from 'node:fs/promises'
import path from 'node:path'
import { Transform, type Readable } from 'node:stream'

import { REEDITPRO_RESUMABLE_UPLOAD_MIN_CHUNK_BYTES } from '../../../src/types/large-media'
import type {
  DownloadTarget,
  ObjectMetadata,
  ObjectReadIdentity,
  StorageAdapter,
  UploadTarget,
  VerifyObjectInput,
} from '../../storage/storage-types'
import { inspectLocalMediaFileAuthority } from '../../workers/media'

interface SessionRecord {
  uploadUrl: string
  bucketName: string
  objectPath: string
  mimeType: string
  etag: string
  expectedSizeBytes: number
  localFilePath: string
  committedBytes: number
}

export class LocalBackedResumableGcsTestAdapter implements StorageAdapter {
  readonly mode = 'gcs' as const
  readonly generation = '1700000000000001'
  etag = ''
  committedBytes = 0
  maximumChunkBodyBytes = 0
  crossOriginAuthorizationSeen = false
  verifyUploadedObjectCalls = 0
  createReadStreamCalls = 0
  streamedReadBytes = 0

  private readonly sessions = new Map<string, SessionRecord>()
  private readonly objects = new Map<string, SessionRecord>()
  private sessionSequence = 0
  private chunkWriteCount = 0
  private interruptionInjected = false
  private readonly providerRoot: string
  private readonly options: { injectResponseLossAfterChunk?: number }

  constructor(
    providerRoot: string,
    options: { injectResponseLossAfterChunk?: number } = {},
  ) {
    this.providerRoot = providerRoot
    this.options = options
    this.fetch = this.fetch.bind(this)
  }

  async createUploadTarget(
    input: Parameters<StorageAdapter['createUploadTarget']>[0],
  ): Promise<UploadTarget> {
    this.sessionSequence += 1
    const sessionId = `session-${this.sessionSequence}`
    const uploadUrl = `https://storage.example.invalid/resumable/${sessionId}`
    const record: SessionRecord = {
      uploadUrl,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      mimeType: input.mimeType,
      etag: '',
      expectedSizeBytes: input.expectedSizeBytes ?? 0,
      localFilePath: path.join(this.providerRoot, 'objects', `${sessionId}.bin`),
      committedBytes: 0,
    }
    this.sessions.set(uploadUrl, record)
    this.objects.set(objectKey(input.bucketName, input.objectPath), record)
    return {
      uploadMethod: 'PUT',
      uploadUrl,
      uploadHeaders: { 'content-type': input.mimeType },
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      createOnly: true,
      uploadProtocol: 'gcs_resumable',
      supportsResume: true,
      recommendedChunkSizeBytes: REEDITPRO_RESUMABLE_UPLOAD_MIN_CHUNK_BYTES,
      sessionUriIsCredential: true,
    }
  }

  readonly fetch = async (
    request: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const session = this.sessions.get(String(request))
    if (!session) throw new Error('Unknown local-backed resumable test session.')
    const headers = new Headers(init?.headers)
    if (headers.has('authorization')) this.crossOriginAuthorizationSeen = true
    if (headers.get('content-type') !== session.mimeType) {
      throw new Error('Resumable test chunk MIME does not match its upload target.')
    }
    const contentRange = headers.get('content-range') ?? ''
    const offsetQuery = /^bytes \*\/(\d+)$/u.exec(contentRange)
    if (offsetQuery) {
      if (Number(offsetQuery[1]) !== session.expectedSizeBytes) {
        throw new Error('Resumable offset query changed the expected object size.')
      }
      return resumableProgressResponse(session.committedBytes)
    }
    const chunkRange = /^bytes (\d+)-(\d+)\/(\d+)$/u.exec(contentRange)
    if (!chunkRange || !(init?.body instanceof Blob)) {
      throw new Error('Resumable test chunk is outside the exact browser upload contract.')
    }
    const start = Number(chunkRange[1])
    const end = Number(chunkRange[2])
    const total = Number(chunkRange[3])
    if (
      total !== session.expectedSizeBytes || start !== session.committedBytes ||
      end < start || end >= total
    ) throw new Error('Resumable test chunk offset diverged from provider authority.')
    const body = Buffer.from(await init.body.arrayBuffer())
    if (body.byteLength !== end - start + 1) {
      throw new Error('Resumable test chunk body length changed in transit.')
    }
    this.maximumChunkBodyBytes = Math.max(this.maximumChunkBodyBytes, body.byteLength)
    await this.writeChunk(session, body, start)
    session.committedBytes = end + 1
    this.committedBytes = session.committedBytes
    this.chunkWriteCount += 1
    if (
      this.options.injectResponseLossAfterChunk === this.chunkWriteCount &&
      !this.interruptionInjected
    ) {
      this.interruptionInjected = true
      throw new TypeError('Simulated response loss after provider chunk commitment.')
    }
    return session.committedBytes === session.expectedSizeBytes
      ? new Response(null, { status: 200 })
      : resumableProgressResponse(session.committedBytes)
  }

  async putObject(): Promise<ObjectMetadata> {
    throw new Error('Local-backed resumable GCS proof must not use backend buffer uploads.')
  }

  async verifyUploadedObject(input: VerifyObjectInput): Promise<ObjectMetadata> {
    this.verifyUploadedObjectCalls += 1
    const record = this.requiredObject(input.bucketName, input.objectPath)
    const authority = await inspectLocalMediaFileAuthority(record.localFilePath)
    if (
      authority.sizeBytes !== record.expectedSizeBytes ||
      (input.expectedSizeBytes !== undefined && authority.sizeBytes !== input.expectedSizeBytes) ||
      (input.checksumSha256 !== undefined && authority.checksumSha256 !== input.checksumSha256)
    ) throw new Error('Local-backed GCS object failed stored-byte verification.')
    record.etag = `"${authority.checksumSha256}"`
    this.etag = record.etag
    return this.metadata(record, authority)
  }

  async createDownloadTarget(input: {
    storageObjectRecordId: string
    bucketName: string
    objectPath: string
    expiresAt: string
    generation?: string
    etag?: string
  }): Promise<DownloadTarget> {
    const record = this.requiredObject(input.bucketName, input.objectPath)
    this.assertIdentity(record, input)
    return {
      downloadMethod: 'GET',
      downloadUrl: `https://storage.example.invalid/private-download/${path.basename(record.localFilePath)}`,
      expiresAt: input.expiresAt,
      bucketName: input.bucketName,
      objectPath: input.objectPath,
      temporary: true,
      generation: this.generation,
      etag: record.etag,
    }
  }

  async getObjectMetadata(
    bucketName: string,
    objectPath: string,
    identity?: ObjectReadIdentity,
  ): Promise<ObjectMetadata> {
    const record = this.requiredObject(bucketName, objectPath)
    this.assertIdentity(record, identity)
    return this.metadata(record, await inspectLocalMediaFileAuthority(record.localFilePath))
  }

  async createReadStream(
    bucketName: string,
    objectPath: string,
    identity?: ObjectReadIdentity,
  ): Promise<Readable> {
    const record = this.requiredObject(bucketName, objectPath)
    this.assertIdentity(record, identity)
    this.createReadStreamCalls += 1
    const counter = new Transform({
      transform: (chunk: Buffer, _encoding, callback) => {
        this.streamedReadBytes += chunk.byteLength
        callback(null, chunk)
      },
    })
    return createReadStream(record.localFilePath).pipe(counter)
  }

  async deleteObject(
    bucketName: string,
    objectPath: string,
    identity?: ObjectReadIdentity,
  ): Promise<{ deleted: boolean; warnings: string[] }> {
    const record = this.requiredObject(bucketName, objectPath)
    this.assertIdentity(record, identity)
    await rm(record.localFilePath, { force: true })
    return { deleted: true, warnings: [] }
  }

  localFilePath(bucketName: string, objectPath: string): string {
    return this.requiredObject(bucketName, objectPath).localFilePath
  }

  private async writeChunk(record: SessionRecord, body: Buffer, position: number): Promise<void> {
    await mkdir(path.dirname(record.localFilePath), { recursive: true, mode: 0o700 })
    let handle: FileHandle | undefined
    try {
      handle = await open(record.localFilePath, position === 0 ? 'wx' : 'r+', 0o600)
      await handle.write(body, 0, body.byteLength, position)
      await handle.sync()
    } finally {
      await handle?.close()
    }
  }

  private requiredObject(bucketName: string, objectPath: string): SessionRecord {
    const record = this.objects.get(objectKey(bucketName, objectPath))
    if (!record || record.committedBytes !== record.expectedSizeBytes) {
      throw new Error('Local-backed GCS test object is unavailable or incomplete.')
    }
    return record
  }

  private assertIdentity(
    record: SessionRecord,
    identity?: ObjectReadIdentity,
  ): void {
    if (!identity) return
    if (identity.generation !== undefined && identity.generation !== this.generation) {
      throw new Error('Local-backed GCS generation identity changed.')
    }
    if (identity.etag !== undefined && identity.etag !== record.etag) {
      throw new Error('Local-backed GCS ETag identity changed.')
    }
  }

  private metadata(
    record: SessionRecord,
    authority: { sizeBytes: number; checksumSha256: string },
  ): ObjectMetadata {
    return {
      bucketName: record.bucketName,
      objectPath: record.objectPath,
      sizeBytes: authority.sizeBytes,
      checksumSha256: authority.checksumSha256,
      mimeType: record.mimeType,
      exists: true,
      generation: this.generation,
      etag: record.etag,
      metageneration: '1',
      integrityVerified: true,
      checksumSource: 'server_computed_bytes',
    }
  }
}

function resumableProgressResponse(committedBytes: number): Response {
  return new Response(null, {
    status: 308,
    headers: committedBytes > 0 ? { range: `bytes=0-${committedBytes - 1}` } : undefined,
  })
}

function objectKey(bucketName: string, objectPath: string): string {
  return `${bucketName}\u0000${objectPath}`
}
