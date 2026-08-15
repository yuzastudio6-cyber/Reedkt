import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import {
  lstat,
  mkdir,
  open,
  rename,
  rm,
  statfs,
  truncate,
  type FileHandle,
} from 'node:fs/promises'
import path from 'node:path'
import { ApiError } from '../errors/api-error'

const LEDGER_HEADER_BYTES = 128
const LEDGER_RECORD_BYTES = 80
const LEDGER_SCHEMA_VERSION = 1
const LEDGER_MAGIC = Buffer.from('RPE-UPLOAD-V1')
const SHA256_PATTERN = /^[a-f0-9]{64}$/
const DEFAULT_STORAGE_RESERVE_BYTES = 64 * 1024 * 1024
const MAX_SAFE_CHUNK_BYTES = 16 * 1024 * 1024

export type LocalResumableRecoveryReason =
  | 'ledger_header_rebuilt'
  | 'ledger_tail_discarded'
  | 'ledger_record_discarded'
  | 'truncated_chunk_discarded'
  | 'uncommitted_tail_discarded'
  | 'corrupt_chunk_discarded'

export interface LocalResumableRecovery {
  readonly reason: LocalResumableRecoveryReason
  readonly restartByte: number
  readonly discardedBytes: number
}

export interface LocalResumableLedgerStatus {
  readonly acceptedBytes: number
  readonly complete: boolean
  readonly replayed: boolean
  readonly integrityVerifiedThroughBytes: number
  readonly verifiedChunkCount: number
  readonly recovery?: LocalResumableRecovery
}

export interface LocalResumableCapacitySnapshot {
  readonly availableBytes: bigint
}

export type LocalResumableCapacityProbe = (
  directory: string,
) => Promise<LocalResumableCapacitySnapshot>

export interface LocalResumableLedgerOptions {
  readonly capacityProbe?: LocalResumableCapacityProbe
  readonly minimumFreeReserveBytes?: number
}

interface LedgerRecord {
  readonly startByte: number
  readonly lengthBytes: number
  readonly checksumSha256: string
  readonly chainDigestSha256: string
}

interface LoadedLedger {
  readonly headerDigestSha256: string
  readonly records: readonly LedgerRecord[]
  readonly recovery?: LocalResumableRecovery
}

interface ReconciledUpload {
  readonly acceptedBytes: number
  readonly complete: boolean
  readonly records: readonly LedgerRecord[]
  readonly headerDigestSha256: string
  readonly recovery?: LocalResumableRecovery
}

const localUploadLocks = new Map<string, Promise<void>>()

export async function commitLocalResumableUploadChunk(input: {
  readonly completedPath: string
  readonly partialPath: string
  readonly ledgerPath: string
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
  readonly startByte: number
  readonly endByteInclusive: number
  readonly body: Buffer
  readonly chunkChecksumSha256: string
  readonly options?: LocalResumableLedgerOptions
}): Promise<LocalResumableLedgerStatus> {
  validateCommitInput(input)
  return withLocalUploadLock(input.partialPath, async () => {
    const before = await reconcileUpload({
      ...input,
      verification: 'tail',
    })
    if (before.complete) {
      const replayedBytes = await readExactRange(
        input.completedPath,
        input.startByte,
        input.body.byteLength,
      )
      if (sha256(replayedBytes) !== input.chunkChecksumSha256) {
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'Resumable chunk replay does not match the completed object bytes.',
          409,
          { acceptedBytes: before.acceptedBytes },
        )
      }
      return statusFromReconciliation(before, true)
    }

    if (input.startByte < before.acceptedBytes) {
      if (input.endByteInclusive + 1 > before.acceptedBytes) {
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'Resumable chunk overlaps bytes that were not fully committed.',
          409,
          { acceptedBytes: before.acceptedBytes },
        )
      }
      const replayedBytes = await readExactRange(
        input.partialPath,
        input.startByte,
        input.body.byteLength,
      )
      if (sha256(replayedBytes) !== input.chunkChecksumSha256) {
        throw new ApiError(
          'UPLOAD_NOT_FINALIZED',
          'Resumable chunk replay does not match committed bytes.',
          409,
          { acceptedBytes: before.acceptedBytes },
        )
      }
      return {
        acceptedBytes: before.acceptedBytes,
        complete: false,
        replayed: true,
        integrityVerifiedThroughBytes: before.acceptedBytes,
        verifiedChunkCount: before.records.length,
        ...(before.recovery ? { recovery: before.recovery } : {}),
      }
    }

    if (input.startByte !== before.acceptedBytes) {
      throw new ApiError(
        'UPLOAD_NOT_FINALIZED',
        'Resumable chunk starts after the verified upload offset.',
        409,
        { acceptedBytes: before.acceptedBytes },
      )
    }

    await assertWritableCapacity({
      directory: path.dirname(input.partialPath),
      nextChunkBytes: input.body.byteLength,
      acceptedBytes: before.acceptedBytes,
      options: input.options,
    })

    try {
      await writeChunkDurably(input.partialPath, input.body, input.startByte)
      await appendLedgerRecord({
        ledgerPath: input.ledgerPath,
        previousChainDigestSha256: before.records.at(-1)?.chainDigestSha256
          ?? before.headerDigestSha256,
        startByte: input.startByte,
        lengthBytes: input.body.byteLength,
        checksumSha256: input.chunkChecksumSha256,
      })
    } catch (error) {
      await truncate(input.partialPath, before.acceptedBytes).catch(() => undefined)
      await discardIncompleteLedgerTail(input.ledgerPath, before.records.length).catch(() => undefined)
      throw mapStorageWriteError(error, before.acceptedBytes)
    }

    const after = await reconcileUpload({
      ...input,
      verification: input.endByteInclusive + 1 === input.totalBytes ? 'full' : 'tail',
    })
    return statusFromReconciliation(after, false)
  })
}

export async function readLocalResumableUploadStatus(input: {
  readonly completedPath: string
  readonly partialPath: string
  readonly ledgerPath: string
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
}): Promise<LocalResumableLedgerStatus> {
  validateIdentity(input)
  return withLocalUploadLock(input.partialPath, async () => {
    const partialSize = await safeRegularFileSize(input.partialPath)
    const reconciled = await reconcileUpload({
      ...input,
      verification: partialSize === input.totalBytes ? 'full' : 'tail',
    })
    return statusFromReconciliation(reconciled, false)
  })
}

export function localResumableUploadLedgerPath(completedPath: string): string {
  return `${completedPath}.uploading-ledger-v1`
}

export function localResumableUploadPartialPath(completedPath: string): string {
  return `${completedPath}.uploading`
}

async function reconcileUpload(input: {
  readonly completedPath: string
  readonly partialPath: string
  readonly ledgerPath: string
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
  readonly verification: 'tail' | 'full'
}): Promise<ReconciledUpload> {
  const completedSize = await safeRegularFileSize(input.completedPath)
  if (completedSize !== undefined) {
    if (completedSize !== input.totalBytes) {
      throw new ApiError(
        'UPLOAD_NOT_FINALIZED',
        'Completed local upload size conflicts with the resumable upload.',
        409,
      )
    }
    await removeSafePrivateFile(input.ledgerPath).catch(() => undefined)
    await removeSafePrivateFile(input.partialPath).catch(() => undefined)
    return {
      acceptedBytes: completedSize,
      complete: true,
      records: [],
      headerDigestSha256: '',
    }
  }

  await mkdir(path.dirname(input.partialPath), { recursive: true, mode: 0o700 })
  const loaded = await loadOrCreateLedger(input)
  let records = [...loaded.records]
  let recovery = loaded.recovery
  const partialSize = await safeRegularFileSize(input.partialPath) ?? 0
  let verifiedBytes = records.at(-1)
    ? (records.at(-1) as LedgerRecord).startByte + (records.at(-1) as LedgerRecord).lengthBytes
    : 0

  if (partialSize < verifiedBytes) {
    const retainedCount = records.findIndex((record) => record.startByte + record.lengthBytes > partialSize)
    const safeCount = retainedCount < 0 ? records.length : retainedCount
    records = records.slice(0, safeCount)
    verifiedBytes = records.at(-1)
      ? (records.at(-1) as LedgerRecord).startByte + (records.at(-1) as LedgerRecord).lengthBytes
      : 0
    await truncateLedgerToRecordCount(input.ledgerPath, safeCount)
    await truncateOrCreate(input.partialPath, verifiedBytes)
    recovery = chooseRecovery(recovery, {
      reason: 'truncated_chunk_discarded',
      restartByte: verifiedBytes,
      discardedBytes: Math.max(0, partialSize - verifiedBytes),
    })
  }

  const verificationIndexes = input.verification === 'full'
    ? records.map((_, index) => index)
    : records.length > 0 ? [records.length - 1] : []
  for (const index of verificationIndexes) {
    const record = records[index] as LedgerRecord
    const bytes = await readExactRange(input.partialPath, record.startByte, record.lengthBytes)
      .catch(() => undefined)
    if (bytes && sha256(bytes) === record.checksumSha256) continue
    records = records.slice(0, index)
    verifiedBytes = record.startByte
    const observedSize = await safeRegularFileSize(input.partialPath) ?? verifiedBytes
    await truncateLedgerToRecordCount(input.ledgerPath, index)
    await truncateOrCreate(input.partialPath, verifiedBytes)
    recovery = chooseRecovery(recovery, {
      reason: 'corrupt_chunk_discarded',
      restartByte: verifiedBytes,
      discardedBytes: Math.max(0, observedSize - verifiedBytes),
    })
    break
  }

  const reconciledSize = await safeRegularFileSize(input.partialPath) ?? 0
  if (reconciledSize > verifiedBytes) {
    await truncateOrCreate(input.partialPath, verifiedBytes)
    recovery = chooseRecovery(recovery, {
      reason: 'uncommitted_tail_discarded',
      restartByte: verifiedBytes,
      discardedBytes: reconciledSize - verifiedBytes,
    })
  }

  if (verifiedBytes === input.totalBytes && input.verification === 'full') {
    await rename(input.partialPath, input.completedPath)
    await removeSafePrivateFile(input.ledgerPath)
    return {
      acceptedBytes: verifiedBytes,
      complete: true,
      records,
      headerDigestSha256: loaded.headerDigestSha256,
      ...(recovery ? { recovery } : {}),
    }
  }

  return {
    acceptedBytes: verifiedBytes,
    complete: false,
    records,
    headerDigestSha256: loaded.headerDigestSha256,
    ...(recovery ? { recovery } : {}),
  }
}

async function loadOrCreateLedger(input: {
  readonly ledgerPath: string
  readonly partialPath: string
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
}): Promise<LoadedLedger> {
  const expectedHeader = createLedgerHeader(input.totalBytes, input.objectIdentityDigestSha256)
  const expectedHeaderDigestSha256 = expectedHeader.subarray(60, 92).toString('hex')
  if (await safeRegularFileSize(input.ledgerPath) === undefined) {
    await writeNewLedger(input.ledgerPath, expectedHeader)
    return { headerDigestSha256: expectedHeaderDigestSha256, records: [] }
  }

  const handle = await open(input.ledgerPath, constants.O_RDWR | constants.O_NOFOLLOW)
  try {
    const ledgerStat = await handle.stat()
    if (!ledgerStat.isFile()) throw new Error('resumable_upload_ledger_not_regular')
    if (ledgerStat.size < LEDGER_HEADER_BYTES) {
      await handle.truncate(0)
      await writeAll(handle, expectedHeader, 0)
      await handle.sync()
      await truncateOrCreate(input.partialPath, 0)
      return {
        headerDigestSha256: expectedHeaderDigestSha256,
        records: [],
        recovery: { reason: 'ledger_header_rebuilt', restartByte: 0, discardedBytes: 0 },
      }
    }

    const header = await readExact(handle, LEDGER_HEADER_BYTES, 0)
    if (!validLedgerHeader(header, input.totalBytes, input.objectIdentityDigestSha256)) {
      const discardedBytes = await safeRegularFileSize(input.partialPath) ?? 0
      await handle.truncate(0)
      await writeAll(handle, expectedHeader, 0)
      await handle.sync()
      await truncateOrCreate(input.partialPath, 0)
      return {
        headerDigestSha256: expectedHeaderDigestSha256,
        records: [],
        recovery: { reason: 'ledger_header_rebuilt', restartByte: 0, discardedBytes },
      }
    }

    const headerDigestSha256 = header.subarray(60, 92).toString('hex')
    const completeRecordCount = Math.floor((ledgerStat.size - LEDGER_HEADER_BYTES) / LEDGER_RECORD_BYTES)
    let previousChainDigestSha256 = headerDigestSha256
    const records: LedgerRecord[] = []
    let recovery: LocalResumableRecovery | undefined
    for (let index = 0; index < completeRecordCount; index += 1) {
      const offset = LEDGER_HEADER_BYTES + index * LEDGER_RECORD_BYTES
      const encoded = await readExact(handle, LEDGER_RECORD_BYTES, offset)
      const parsed = parseLedgerRecord(encoded, previousChainDigestSha256)
      const expectedStart = records.at(-1)
        ? (records.at(-1) as LedgerRecord).startByte + (records.at(-1) as LedgerRecord).lengthBytes
        : 0
      if (
        !parsed
        || parsed.startByte !== expectedStart
        || parsed.lengthBytes < 1
        || parsed.lengthBytes > MAX_SAFE_CHUNK_BYTES
        || parsed.startByte + parsed.lengthBytes > input.totalBytes
      ) {
        await handle.truncate(offset)
        recovery = {
          reason: 'ledger_record_discarded',
          restartByte: expectedStart,
          discardedBytes: 0,
        }
        break
      }
      records.push(parsed)
      previousChainDigestSha256 = parsed.chainDigestSha256
    }

    const retainedLedgerBytes = LEDGER_HEADER_BYTES + records.length * LEDGER_RECORD_BYTES
    if (ledgerStat.size !== retainedLedgerBytes) {
      await handle.truncate(retainedLedgerBytes)
      recovery = chooseRecovery(recovery, {
        reason: 'ledger_tail_discarded',
        restartByte: records.at(-1)
          ? (records.at(-1) as LedgerRecord).startByte + (records.at(-1) as LedgerRecord).lengthBytes
          : 0,
        discardedBytes: 0,
      })
    }
    await handle.sync()
    return {
      headerDigestSha256,
      records,
      ...(recovery ? { recovery } : {}),
    }
  } finally {
    await handle.close()
  }
}

async function appendLedgerRecord(input: {
  readonly ledgerPath: string
  readonly previousChainDigestSha256: string
  readonly startByte: number
  readonly lengthBytes: number
  readonly checksumSha256: string
}): Promise<void> {
  const encoded = encodeLedgerRecord(input)
  const handle = await open(
    input.ledgerPath,
    constants.O_WRONLY | constants.O_APPEND | constants.O_NOFOLLOW,
  )
  try {
    await writeAll(handle, encoded, null)
    await handle.sync()
  } finally {
    await handle.close()
  }
}

function encodeLedgerRecord(input: {
  readonly previousChainDigestSha256: string
  readonly startByte: number
  readonly lengthBytes: number
  readonly checksumSha256: string
}): Buffer {
  const encoded = Buffer.alloc(LEDGER_RECORD_BYTES)
  encoded.writeBigUInt64BE(BigInt(input.startByte), 0)
  encoded.writeUInt32BE(input.lengthBytes, 8)
  Buffer.from(input.checksumSha256, 'hex').copy(encoded, 12)
  const chainDigest = createHash('sha256')
    .update(Buffer.from(input.previousChainDigestSha256, 'hex'))
    .update(encoded.subarray(0, 44))
    .digest()
  chainDigest.copy(encoded, 44)
  return encoded
}

function parseLedgerRecord(encoded: Buffer, previousChainDigestSha256: string): LedgerRecord | undefined {
  const start = encoded.readBigUInt64BE(0)
  if (start > BigInt(Number.MAX_SAFE_INTEGER)) return undefined
  const startByte = Number(start)
  const lengthBytes = encoded.readUInt32BE(8)
  const checksumSha256 = encoded.subarray(12, 44).toString('hex')
  const chainDigestSha256 = encoded.subarray(44, 76).toString('hex')
  const expectedChainDigestSha256 = createHash('sha256')
    .update(Buffer.from(previousChainDigestSha256, 'hex'))
    .update(encoded.subarray(0, 44))
    .digest('hex')
  if (chainDigestSha256 !== expectedChainDigestSha256) return undefined
  return { startByte, lengthBytes, checksumSha256, chainDigestSha256 }
}

function createLedgerHeader(totalBytes: number, objectIdentityDigestSha256: string): Buffer {
  const header = Buffer.alloc(LEDGER_HEADER_BYTES)
  LEDGER_MAGIC.copy(header, 0)
  header.writeUInt32BE(LEDGER_SCHEMA_VERSION, 16)
  header.writeBigUInt64BE(BigInt(totalBytes), 20)
  Buffer.from(objectIdentityDigestSha256, 'hex').copy(header, 28)
  createHash('sha256').update(header.subarray(0, 60)).digest().copy(header, 60)
  return header
}

function validLedgerHeader(
  header: Buffer,
  totalBytes: number,
  objectIdentityDigestSha256: string,
): boolean {
  return header.subarray(0, LEDGER_MAGIC.length).equals(LEDGER_MAGIC)
    && header.readUInt32BE(16) === LEDGER_SCHEMA_VERSION
    && header.readBigUInt64BE(20) === BigInt(totalBytes)
    && header.subarray(28, 60).toString('hex') === objectIdentityDigestSha256
    && header.subarray(60, 92).equals(createHash('sha256').update(header.subarray(0, 60)).digest())
}

async function writeNewLedger(file: string, header: Buffer): Promise<void> {
  const handle = await open(
    file,
    constants.O_RDWR | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600,
  ).catch(async (error) => {
    if (!isNodeError(error, 'EEXIST')) throw error
    return open(file, constants.O_RDWR | constants.O_NOFOLLOW)
  })
  try {
    const current = await handle.stat()
    if (!current.isFile()) throw new Error('resumable_upload_ledger_not_regular')
    if (current.size === 0) {
      await writeAll(handle, header, 0)
      await handle.sync()
    }
  } finally {
    await handle.close()
  }
}

async function writeChunkDurably(file: string, body: Buffer, position: number): Promise<void> {
  const handle = await open(
    file,
    constants.O_RDWR | constants.O_CREAT | constants.O_NOFOLLOW,
    0o600,
  )
  try {
    const fileStat = await handle.stat()
    if (!fileStat.isFile()) throw new Error('resumable_upload_partial_not_regular')
    await writeAll(handle, body, position)
    await handle.sync()
  } finally {
    await handle.close()
  }
}

async function writeAll(handle: FileHandle, bytes: Buffer, position: number | null): Promise<void> {
  let writtenBytes = 0
  while (writtenBytes < bytes.byteLength) {
    const written = await handle.write(
      bytes,
      writtenBytes,
      bytes.byteLength - writtenBytes,
      position === null ? null : position + writtenBytes,
    )
    if (written.bytesWritten < 1) throw new Error('resumable_upload_zero_byte_write')
    writtenBytes += written.bytesWritten
  }
}

async function readExact(handle: FileHandle, length: number, position: number): Promise<Buffer> {
  const bytes = Buffer.alloc(length)
  let readBytes = 0
  while (readBytes < length) {
    const read = await handle.read(bytes, readBytes, length - readBytes, position + readBytes)
    if (read.bytesRead < 1) throw new Error('resumable_upload_short_read')
    readBytes += read.bytesRead
  }
  return bytes
}

async function readExactRange(file: string, startByte: number, lengthBytes: number): Promise<Buffer> {
  const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    return await readExact(handle, lengthBytes, startByte)
  } finally {
    await handle.close()
  }
}

async function assertWritableCapacity(input: {
  readonly directory: string
  readonly nextChunkBytes: number
  readonly acceptedBytes: number
  readonly options?: LocalResumableLedgerOptions
}): Promise<void> {
  const reserveBytes = normalizeReserveBytes(input.options?.minimumFreeReserveBytes)
  const capacity = await (input.options?.capacityProbe ?? defaultCapacityProbe)(input.directory)
  const requiredBytes = BigInt(input.nextChunkBytes + reserveBytes)
  if (capacity.availableBytes >= requiredBytes) return
  throw new ApiError(
    'STORAGE_CAPACITY_UNAVAILABLE',
    'Private storage is temporarily short of working space. ReEditPro kept every verified upload chunk and will continue from the saved checkpoint when capacity returns.',
    507,
    {
      retryable: true,
      retryAfterMs: 5_000,
      acceptedBytes: input.acceptedBytes,
    },
  )
}

async function defaultCapacityProbe(directory: string): Promise<LocalResumableCapacitySnapshot> {
  const value = await statfs(directory, { bigint: true })
  return { availableBytes: value.bavail * value.bsize }
}

function normalizeReserveBytes(value: number | undefined): number {
  if (value === undefined) return DEFAULT_STORAGE_RESERVE_BYTES
  if (!Number.isSafeInteger(value) || value < 0 || value > 4 * 1024 * 1024 * 1024) {
    throw new Error('Local resumable upload storage reserve is invalid.')
  }
  return value
}

function mapStorageWriteError(error: unknown, acceptedBytes: number): unknown {
  if (isNodeError(error, 'ENOSPC') || isNodeError(error, 'EDQUOT')) {
    return new ApiError(
      'STORAGE_CAPACITY_UNAVAILABLE',
      'Private storage reached its current capacity. ReEditPro rolled back only the unverified tail and kept every verified upload chunk for automatic continuation.',
      507,
      { retryable: true, retryAfterMs: 5_000, acceptedBytes },
    )
  }
  return error
}

function statusFromReconciliation(
  reconciled: ReconciledUpload,
  replayed: boolean,
): LocalResumableLedgerStatus {
  return {
    acceptedBytes: reconciled.acceptedBytes,
    complete: reconciled.complete,
    replayed,
    integrityVerifiedThroughBytes: reconciled.acceptedBytes,
    verifiedChunkCount: reconciled.records.length,
    ...(reconciled.recovery ? { recovery: reconciled.recovery } : {}),
  }
}

async function discardIncompleteLedgerTail(ledgerPath: string, recordCount: number): Promise<void> {
  await truncateLedgerToRecordCount(ledgerPath, recordCount)
}

async function truncateLedgerToRecordCount(ledgerPath: string, recordCount: number): Promise<void> {
  await truncate(ledgerPath, LEDGER_HEADER_BYTES + recordCount * LEDGER_RECORD_BYTES)
}

async function truncateOrCreate(file: string, size: number): Promise<void> {
  if (await safeRegularFileSize(file) === undefined) {
    const handle = await open(
      file,
      constants.O_RDWR | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o600,
    )
    await handle.close()
  }
  await truncate(file, size)
}

async function safeRegularFileSize(file: string): Promise<number | undefined> {
  try {
    const fileStat = await lstat(file)
    if (!fileStat.isFile() || fileStat.isSymbolicLink()) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Local upload target is not a safe regular file.', 409)
    }
    return fileStat.size
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) return undefined
    throw error
  }
}

async function removeSafePrivateFile(file: string): Promise<void> {
  const size = await safeRegularFileSize(file)
  if (size === undefined) return
  await rm(file, { force: true })
}

function chooseRecovery(
  current: LocalResumableRecovery | undefined,
  candidate: LocalResumableRecovery,
): LocalResumableRecovery {
  if (!current) return candidate
  const priority: Record<LocalResumableRecoveryReason, number> = {
    ledger_tail_discarded: 1,
    ledger_record_discarded: 2,
    ledger_header_rebuilt: 3,
    uncommitted_tail_discarded: 4,
    truncated_chunk_discarded: 5,
    corrupt_chunk_discarded: 6,
  }
  return priority[candidate.reason] >= priority[current.reason] ? candidate : current
}

function validateCommitInput(input: {
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
  readonly startByte: number
  readonly endByteInclusive: number
  readonly body: Buffer
  readonly chunkChecksumSha256: string
}): void {
  validateIdentity(input)
  const expectedLength = input.endByteInclusive - input.startByte + 1
  if (
    !Number.isSafeInteger(input.startByte)
    || input.startByte < 0
    || !Number.isSafeInteger(input.endByteInclusive)
    || input.endByteInclusive < input.startByte
    || input.endByteInclusive >= input.totalBytes
    || expectedLength !== input.body.byteLength
    || expectedLength < 1
    || expectedLength > MAX_SAFE_CHUNK_BYTES
    || !SHA256_PATTERN.test(input.chunkChecksumSha256)
    || sha256(input.body) !== input.chunkChecksumSha256
  ) throw new ApiError('VALIDATION_FAILED', 'Resumable upload chunk authority is invalid.', 400)
}

function validateIdentity(input: {
  readonly objectIdentityDigestSha256: string
  readonly totalBytes: number
}): void {
  if (
    !SHA256_PATTERN.test(input.objectIdentityDigestSha256)
    || !Number.isSafeInteger(input.totalBytes)
    || input.totalBytes <= 0
  ) throw new ApiError('VALIDATION_FAILED', 'Resumable upload identity is invalid.', 400)
}

async function withLocalUploadLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = localUploadLocks.get(key) ?? Promise.resolve()
  let release = (): void => undefined
  const current = new Promise<void>((resolve) => { release = resolve })
  localUploadLocks.set(key, current)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (localUploadLocks.get(key) === current) localUploadLocks.delete(key)
  }
}

function sha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function isNodeError(error: unknown, code: string): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === code)
}
