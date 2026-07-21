import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  rename,
  writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { ApiError } from '../errors/api-error'
import {
  commitLocalResumableUploadChunk,
  localResumableUploadLedgerPath,
  localResumableUploadPartialPath,
  readLocalResumableUploadStatus,
  type LocalResumableLedgerOptions,
  type LocalResumableRecovery,
} from './local-resumable-upload-ledger'

interface PutObjectChunkInput {
  readonly body: Buffer
  readonly startByte: number
  readonly endByteInclusive: number
  readonly totalBytes: number
  readonly chunkChecksumSha256: string
}

interface ResumableUploadStatus {
  readonly bucketName: string
  readonly objectPath: string
  readonly acceptedBytes: number
  readonly totalBytes?: number
  readonly complete: boolean
  readonly replayed: boolean
  readonly integrityVerifiedThroughBytes?: number
  readonly verifiedChunkCount?: number
  readonly recovery?: LocalResumableRecovery
}

const MANIFEST_SCHEMA_VERSION = 1
const MAX_MANAGED_SEGMENT_COUNT = 1_000_000
const SHA256_PATTERN = /^[a-f0-9]{64}$/

interface ManagedSegmentRecord {
  readonly index: number
  readonly sizeBytes: number
  readonly checksumSha256: string
}

export interface LocalManagedSegmentedObjectManifest {
  readonly schemaVersion: typeof MANIFEST_SCHEMA_VERSION
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
  readonly segmentSizeBytes: number
  readonly segmentCount: number
  readonly checksumSha256: string
  readonly segments: readonly ManagedSegmentRecord[]
  readonly finalizedAt: string
  readonly manifestDigestSha256: string
}

export interface LocalManagedSegmentedObjectOptions {
  readonly segmentSizeBytes: number
  readonly resumableOptions?: LocalResumableLedgerOptions
}

export interface LocalManagedSegmentedMediaInput {
  readonly kind: 'managed_segmented'
  readonly ffmpegInput: string
  readonly backingFilePaths: readonly string[]
  readonly totalBytes: number
  readonly checksumSha256: string
  readonly segmentCount: number
  readonly manifestPath: string
}

const managedObjectLocks = new Map<string, Promise<void>>()

export function localManagedSegmentedManifestPath(completedPath: string): string {
  return `${completedPath}.managed-segment-manifest-v1.json`
}

export function localManagedSegmentedDirectory(completedPath: string): string {
  return `${completedPath}.managed-segments-v1`
}

export async function commitLocalManagedSegmentedObjectChunk(input: {
  readonly completedPath: string
  readonly objectIdentityDigestSha256: string
  readonly chunk: PutObjectChunkInput
  readonly options: LocalManagedSegmentedObjectOptions
}): Promise<ResumableUploadStatus> {
  validateOptions(input.options)
  return withManagedObjectLock(input.completedPath, async () => {
    const before = await readManagedStatusInternal({
      completedPath: input.completedPath,
      objectIdentityDigestSha256: input.objectIdentityDigestSha256,
      totalBytes: input.chunk.totalBytes,
      options: input.options,
    })
    const chunkEndExclusive = input.chunk.endByteInclusive + 1

    if (input.chunk.startByte < before.acceptedBytes) {
      if (chunkEndExclusive > before.acceptedBytes) {
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'Managed upload chunk overlaps bytes that were not fully committed.',
          409,
          { acceptedBytes: before.acceptedBytes },
        )
      }
      const replay = await readManagedRange({
        completedPath: input.completedPath,
        startByte: input.chunk.startByte,
        lengthBytes: input.chunk.body.byteLength,
        segmentSizeBytes: input.options.segmentSizeBytes,
      })
      if (sha256(replay) !== input.chunk.chunkChecksumSha256) {
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'Managed upload chunk replay does not match committed bytes.',
          409,
          { acceptedBytes: before.acceptedBytes },
        )
      }
      return { ...before, replayed: true }
    }
    if (input.chunk.startByte !== before.acceptedBytes) {
      throw new ApiError(
        'UPLOAD_NOT_FINALIZED',
        'Managed upload chunk starts after the verified upload offset.',
        409,
        { acceptedBytes: before.acceptedBytes },
      )
    }

    let globalOffset = input.chunk.startByte
    let bodyOffset = 0
    while (bodyOffset < input.chunk.body.byteLength) {
      const index = Math.floor(globalOffset / input.options.segmentSizeBytes)
      const segmentGlobalStart = index * input.options.segmentSizeBytes
      const segmentTotalBytes = Math.min(
        input.options.segmentSizeBytes,
        input.chunk.totalBytes - segmentGlobalStart,
      )
      const localStartByte = globalOffset - segmentGlobalStart
      const sliceLength = Math.min(
        input.chunk.body.byteLength - bodyOffset,
        segmentTotalBytes - localStartByte,
      )
      const body = input.chunk.body.subarray(bodyOffset, bodyOffset + sliceLength)
      const segmentPath = localManagedSegmentedSegmentPath(input.completedPath, index)
      await mkdir(path.dirname(segmentPath), { recursive: true, mode: 0o700 })
      const segmentStatus = await commitLocalResumableUploadChunk({
        completedPath: segmentPath,
        partialPath: localResumableUploadPartialPath(segmentPath),
        ledgerPath: localResumableUploadLedgerPath(segmentPath),
        objectIdentityDigestSha256: managedSegmentIdentityDigest(
          input.objectIdentityDigestSha256,
          index,
        ),
        totalBytes: segmentTotalBytes,
        startByte: localStartByte,
        endByteInclusive: localStartByte + sliceLength - 1,
        body,
        chunkChecksumSha256: sha256(body),
        options: input.options.resumableOptions,
      })
      if (segmentStatus.complete) await chmod(segmentPath, 0o400)
      globalOffset += sliceLength
      bodyOffset += sliceLength
    }

    return readManagedStatusInternal({
      completedPath: input.completedPath,
      objectIdentityDigestSha256: input.objectIdentityDigestSha256,
      totalBytes: input.chunk.totalBytes,
      options: input.options,
      finalizeWhenComplete: true,
    })
  })
}

export async function readLocalManagedSegmentedObjectStatus(input: {
  readonly completedPath: string
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
  readonly options: LocalManagedSegmentedObjectOptions
}): Promise<ResumableUploadStatus> {
  validateOptions(input.options)
  return withManagedObjectLock(input.completedPath, () => readManagedStatusInternal({
    ...input,
    finalizeWhenComplete: true,
  }))
}

export async function getLocalManagedSegmentedObjectManifest(
  completedPath: string,
  options?: { readonly verifyContent?: boolean },
): Promise<LocalManagedSegmentedObjectManifest | undefined> {
  const manifestPath = localManagedSegmentedManifestPath(completedPath)
  if (!await safeRegularFileStat(manifestPath)) return undefined
  const encoded = await readFile(manifestPath, 'utf8').catch((error: unknown) => {
    if (hasErrorCode(error, 'ENOENT')) return undefined
    throw error
  })
  if (encoded === undefined) return undefined
  let parsed: LocalManagedSegmentedObjectManifest
  try {
    parsed = JSON.parse(encoded) as LocalManagedSegmentedObjectManifest
  } catch {
    throw new ApiError(
      'UPLOAD_NOT_FINALIZED',
      'Managed-media manifest integrity is invalid.',
      409,
    )
  }
  validateManifest(parsed)
  await verifyManifestBackingFiles(completedPath, parsed, options?.verifyContent ?? false)
  return parsed
}

export async function createLocalManagedSegmentedReadStream(
  completedPath: string,
): Promise<Readable | undefined> {
  const manifest = await getLocalManagedSegmentedObjectManifest(completedPath)
  if (!manifest) return undefined
  const paths = manifest.segments.map((segment) => localManagedSegmentedSegmentPath(completedPath, segment.index))
  return Readable.from(streamFiles(paths))
}

export async function resolveLocalManagedSegmentedMediaInput(input: {
  readonly completedPath: string
  readonly expectedSizeBytes: number
  readonly expectedChecksumSha256: string
}): Promise<LocalManagedSegmentedMediaInput | undefined> {
  const manifest = await getLocalManagedSegmentedObjectManifest(input.completedPath, {
    verifyContent: true,
  })
  if (!manifest) return undefined
  if (
    manifest.totalBytes !== input.expectedSizeBytes
    || manifest.checksumSha256 !== input.expectedChecksumSha256
  ) {
    throw new ApiError(
      'REFERENCE_VIDEO_INTEGRITY_MISMATCH',
      'The managed video segments no longer match the finalized storage record.',
      409,
    )
  }
  const backingFilePaths = manifest.segments.map((segment) => (
    localManagedSegmentedSegmentPath(input.completedPath, segment.index)
  ))
  if (backingFilePaths.some((file) => file.includes('|') || file.includes('\0'))) {
    throw new ApiError(
      'REFERENCE_VIDEO_PRIVATE_PATH_UNSAFE',
      'The managed video path cannot be represented safely for private media study.',
      409,
    )
  }
  return {
    kind: 'managed_segmented',
    ffmpegInput: `concat:${backingFilePaths.join('|')}`,
    backingFilePaths,
    totalBytes: manifest.totalBytes,
    checksumSha256: manifest.checksumSha256,
    segmentCount: manifest.segmentCount,
    manifestPath: localManagedSegmentedManifestPath(input.completedPath),
  }
}

async function readManagedStatusInternal(input: {
  readonly completedPath: string
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
  readonly options: LocalManagedSegmentedObjectOptions
  readonly finalizeWhenComplete?: boolean
}): Promise<ResumableUploadStatus> {
  validateIdentity(input)
  const existingManifest = await getLocalManagedSegmentedObjectManifest(input.completedPath)
  if (existingManifest) {
    if (
      existingManifest.totalBytes !== input.totalBytes
      || existingManifest.objectIdentityDigestSha256 !== input.objectIdentityDigestSha256
      || existingManifest.segmentSizeBytes !== input.options.segmentSizeBytes
    ) throw new ApiError('UPLOAD_NOT_FINALIZED', 'Managed upload identity conflicts with its finalized manifest.', 409)
    return createStatus(input, input.totalBytes, true, false, existingManifest.segmentCount)
  }

  const count = segmentCount(input.totalBytes, input.options.segmentSizeBytes)
  let acceptedBytes = 0
  let verifiedChunkCount = 0
  let recovery: ResumableUploadStatus['recovery']
  for (let index = 0; index < count; index += 1) {
    const segmentGlobalStart = index * input.options.segmentSizeBytes
    const segmentTotalBytes = Math.min(
      input.options.segmentSizeBytes,
      input.totalBytes - segmentGlobalStart,
    )
    const segmentPath = localManagedSegmentedSegmentPath(input.completedPath, index)
    const status = await readLocalResumableUploadStatus({
      completedPath: segmentPath,
      partialPath: localResumableUploadPartialPath(segmentPath),
      ledgerPath: localResumableUploadLedgerPath(segmentPath),
      objectIdentityDigestSha256: managedSegmentIdentityDigest(input.objectIdentityDigestSha256, index),
      totalBytes: segmentTotalBytes,
    })
    acceptedBytes = segmentGlobalStart + status.acceptedBytes
    verifiedChunkCount += status.verifiedChunkCount
    if (status.recovery) {
      recovery = {
        ...status.recovery,
        restartByte: segmentGlobalStart + status.recovery.restartByte,
      }
    }
    if (!status.complete) {
      return createStatus(input, acceptedBytes, false, status.replayed, verifiedChunkCount, recovery)
    }
  }

  if (acceptedBytes === input.totalBytes && input.finalizeWhenComplete) {
    const manifest = await finalizeManagedObject(input)
    return createStatus(input, input.totalBytes, true, false, manifest.segmentCount, recovery)
  }
  return createStatus(input, acceptedBytes, false, false, verifiedChunkCount, recovery)
}

async function finalizeManagedObject(input: {
  readonly completedPath: string
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
  readonly options: LocalManagedSegmentedObjectOptions
}): Promise<LocalManagedSegmentedObjectManifest> {
  const count = segmentCount(input.totalBytes, input.options.segmentSizeBytes)
  const segments: ManagedSegmentRecord[] = []
  const aggregate = createHash('sha256')
  for (let index = 0; index < count; index += 1) {
    const segmentPath = localManagedSegmentedSegmentPath(input.completedPath, index)
    const expectedSize = Math.min(
      input.options.segmentSizeBytes,
      input.totalBytes - index * input.options.segmentSizeBytes,
    )
    const observed = await safeRegularFileStat(segmentPath)
    if (!observed || observed.size !== expectedSize) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'A managed upload segment is incomplete.', 409)
    }
    const segmentHash = createHash('sha256')
    for await (const chunk of createReadStream(segmentPath)) {
      segmentHash.update(chunk as Buffer)
      aggregate.update(chunk as Buffer)
    }
    segments.push({
      index,
      sizeBytes: expectedSize,
      checksumSha256: segmentHash.digest('hex'),
    })
    await chmod(segmentPath, 0o400)
  }
  const unsigned = {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    objectIdentityDigestSha256: input.objectIdentityDigestSha256,
    totalBytes: input.totalBytes,
    segmentSizeBytes: input.options.segmentSizeBytes,
    segmentCount: count,
    checksumSha256: aggregate.digest('hex'),
    segments,
    finalizedAt: new Date().toISOString(),
  } as const
  const manifest: LocalManagedSegmentedObjectManifest = {
    ...unsigned,
    manifestDigestSha256: sha256(Buffer.from(stableStringify(unsigned))),
  }
  const manifestPath = localManagedSegmentedManifestPath(input.completedPath)
  const temporaryPath = `${manifestPath}.writing-${process.pid}-${randomUUID()}`
  await mkdir(path.dirname(manifestPath), { recursive: true, mode: 0o700 })
  await writeFile(temporaryPath, `${JSON.stringify(manifest)}\n`, { mode: 0o600, flag: 'wx' })
  await chmod(temporaryPath, 0o400)
  await rename(temporaryPath, manifestPath)
  await chmod(manifestPath, 0o400)
  return manifest
}

async function verifyManifestBackingFiles(
  completedPath: string,
  manifest: LocalManagedSegmentedObjectManifest,
  verifyContent: boolean,
): Promise<void> {
  const aggregate = verifyContent ? createHash('sha256') : undefined
  for (const segment of manifest.segments) {
    const segmentPath = localManagedSegmentedSegmentPath(completedPath, segment.index)
    const observed = await safeRegularFileStat(segmentPath)
    if (!observed || observed.size !== segment.sizeBytes) {
      throw new ApiError(
        'UPLOAD_NOT_FINALIZED',
        'A finalized managed-media segment is missing or changed.',
        409,
      )
    }
    if (aggregate) {
      const segmentHash = createHash('sha256')
      for await (const chunk of createReadStream(segmentPath)) {
        segmentHash.update(chunk as Buffer)
        aggregate.update(chunk as Buffer)
      }
      if (segmentHash.digest('hex') !== segment.checksumSha256) {
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'A finalized managed-media segment failed checksum verification.',
          409,
        )
      }
    }
  }
  if (aggregate && aggregate.digest('hex') !== manifest.checksumSha256) {
    throw new ApiError(
      'UPLOAD_NOT_FINALIZED',
      'The finalized managed-media object failed logical checksum verification.',
      409,
    )
  }
}

function validateManifest(manifest: LocalManagedSegmentedObjectManifest): void {
  const unsigned = {
    schemaVersion: manifest.schemaVersion,
    objectIdentityDigestSha256: manifest.objectIdentityDigestSha256,
    totalBytes: manifest.totalBytes,
    segmentSizeBytes: manifest.segmentSizeBytes,
    segmentCount: manifest.segmentCount,
    checksumSha256: manifest.checksumSha256,
    segments: manifest.segments,
    finalizedAt: manifest.finalizedAt,
  }
  if (
    manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION
    || !SHA256_PATTERN.test(manifest.objectIdentityDigestSha256)
    || !SHA256_PATTERN.test(manifest.checksumSha256)
    || !SHA256_PATTERN.test(manifest.manifestDigestSha256)
    || manifest.manifestDigestSha256 !== sha256(Buffer.from(stableStringify(unsigned)))
    || !Number.isSafeInteger(manifest.totalBytes)
    || manifest.totalBytes <= 0
    || !Number.isSafeInteger(manifest.segmentSizeBytes)
    || manifest.segmentSizeBytes <= 0
    || manifest.segmentCount !== segmentCount(manifest.totalBytes, manifest.segmentSizeBytes)
    || !Array.isArray(manifest.segments)
    || manifest.segments.length !== manifest.segmentCount
    || !Number.isFinite(Date.parse(manifest.finalizedAt))
    || manifest.segments.some((segment, index) => (
      segment.index !== index
      || !Number.isSafeInteger(segment.sizeBytes)
      || segment.sizeBytes !== Math.min(
        manifest.segmentSizeBytes,
        manifest.totalBytes - index * manifest.segmentSizeBytes,
      )
      || !SHA256_PATTERN.test(segment.checksumSha256)
    ))
  ) throw new ApiError('UPLOAD_NOT_FINALIZED', 'Managed-media manifest integrity is invalid.', 409)
}

async function readManagedRange(input: {
  readonly completedPath: string
  readonly startByte: number
  readonly lengthBytes: number
  readonly segmentSizeBytes: number
}): Promise<Buffer> {
  const output = Buffer.allocUnsafe(input.lengthBytes)
  let globalOffset = input.startByte
  let outputOffset = 0
  while (outputOffset < input.lengthBytes) {
    const index = Math.floor(globalOffset / input.segmentSizeBytes)
    const localOffset = globalOffset - index * input.segmentSizeBytes
    const bytesToRead = Math.min(
      input.lengthBytes - outputOffset,
      input.segmentSizeBytes - localOffset,
    )
    const completed = localManagedSegmentedSegmentPath(input.completedPath, index)
    const partial = localResumableUploadPartialPath(completed)
    let segmentPath = await safeRegularFileStat(completed) ? completed : undefined
    if (!segmentPath && await safeRegularFileStat(partial)) segmentPath = partial
    if (!segmentPath) {
      throw new ApiError(
        'UPLOAD_NOT_FINALIZED',
        'Managed upload replay bytes are unavailable.',
        409,
      )
    }
    const handle = await open(segmentPath, 'r')
    try {
      const result = await handle.read(output, outputOffset, bytesToRead, localOffset)
      if (result.bytesRead !== bytesToRead) throw new Error('managed_replay_range_truncated')
    } finally {
      await handle.close()
    }
    globalOffset += bytesToRead
    outputOffset += bytesToRead
  }
  return output
}

async function* streamFiles(files: readonly string[]): AsyncGenerator<Buffer> {
  for (const file of files) {
    for await (const chunk of createReadStream(file)) yield chunk as Buffer
  }
}

export function localManagedSegmentedSegmentPath(completedPath: string, index: number): string {
  if (!Number.isSafeInteger(index) || index < 0 || index > 999_999) {
    throw new ApiError('VALIDATION_FAILED', 'Managed upload segment index is invalid.', 400)
  }
  return path.join(
    localManagedSegmentedDirectory(completedPath),
    `segment-${String(index).padStart(6, '0')}.bin`,
  )
}

function managedSegmentIdentityDigest(objectIdentityDigestSha256: string, index: number): string {
  return sha256(Buffer.from(`${objectIdentityDigestSha256}\u0000${index}`))
}

function segmentCount(totalBytes: number, segmentSizeBytes: number): number {
  const count = Math.ceil(totalBytes / segmentSizeBytes)
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_MANAGED_SEGMENT_COUNT) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Managed upload segment layout exceeds the reviewed capacity.',
      400,
    )
  }
  return count
}

function createStatus(
  input: { readonly totalBytes: number },
  acceptedBytes: number,
  complete: boolean,
  replayed: boolean,
  verifiedChunkCount: number,
  recovery?: ResumableUploadStatus['recovery'],
): ResumableUploadStatus {
  return {
    bucketName: '',
    objectPath: '',
    acceptedBytes,
    totalBytes: input.totalBytes,
    complete,
    replayed,
    integrityVerifiedThroughBytes: acceptedBytes,
    verifiedChunkCount,
    ...(recovery ? { recovery } : {}),
  }
}

function validateIdentity(input: {
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
}): void {
  if (
    !SHA256_PATTERN.test(input.objectIdentityDigestSha256)
    || !Number.isSafeInteger(input.totalBytes)
    || input.totalBytes <= 0
  ) throw new ApiError('VALIDATION_FAILED', 'Managed upload identity is invalid.', 400)
}

function validateOptions(options: LocalManagedSegmentedObjectOptions): void {
  if (!Number.isSafeInteger(options.segmentSizeBytes) || options.segmentSizeBytes < 1) {
    throw new Error('Managed upload segment size must be a positive safe integer.')
  }
}

async function safeRegularFileStat(file: string) {
  try {
    const value = await lstat(file)
    if (!value.isFile() || value.isSymbolicLink()) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Managed upload storage contains an unsafe file.', 409)
    }
    return value
  } catch (error) {
    if (hasErrorCode(error, 'ENOENT')) return undefined
    throw error
  }
}

function hasErrorCode(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code)
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`
}

async function withManagedObjectLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = managedObjectLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolve) => { release = resolve })
  const queued = previous.then(() => current)
  managedObjectLocks.set(key, queued)
  await previous
  try {
    return await task()
  } finally {
    release()
    if (managedObjectLocks.get(key) === queued) managedObjectLocks.delete(key)
  }
}
