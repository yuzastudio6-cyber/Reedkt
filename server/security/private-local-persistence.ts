import { createHash, randomUUID } from 'node:crypto'
import { constants, createWriteStream } from 'node:fs'
import { link, lstat, mkdir, open, readdir, rename, rm } from 'node:fs/promises'
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { Transform, type Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { ApiError } from '../errors/api-error'

const PRIVATE_DIRECTORY_MODE = 0o700
const PRIVATE_FILE_MODE = 0o600
const PRIVATE_COOPERATIVE_LOCK_RECORD_VERSION =
  'private-cooperative-file-lock-record-v1' as const
const MAX_PRIVATE_COOPERATIVE_LOCK_RECORD_BYTES = 4 * 1024

type PrivateWriteInput = {
  rootPath: string
  relativePath: string
}

export interface PrivateDirectoryIdentity {
  device: number
  inode: number
}

export interface PrivateRegularDirectoryEntry {
  name: string
  identity: PrivateDirectoryIdentity
}

export interface PrivateFlatDirectoryInspection {
  identity: PrivateDirectoryIdentity
  entryCount: number
  newestActivityAtMs: number
}

interface PrivateCooperativeFileLockRecord {
  recordVersion: typeof PRIVATE_COOPERATIVE_LOCK_RECORD_VERSION
  ownerId: string
  processId: number
  processStartedAtEpochMs: number
  acquiredAt: string
  checksumSha256: string
}

/**
 * Serializes cooperating Node processes through one private, no-follow lock
 * file. A fully written candidate is hard-linked into the canonical lock path,
 * so another process never observes a partially initialized owner record.
 *
 * A dead owner can be reclaimed on the same host. PID reuse deliberately
 * fails closed as a busy lock rather than risking concurrent ownership. This
 * is a cooperative single-host primitive, not protection from a hostile
 * same-UID filesystem actor and not a distributed lock.
 */
export async function withPrivateCooperativeFileLockWithinRoot<T>(input: {
  rootPath: string
  relativePath: string
  operation: () => Promise<T>
  acquisitionTimeoutMs?: number
  retryIntervalMs?: number
}): Promise<T> {
  const acquisitionTimeoutMs = boundedPrivateLockDuration(
    input.acquisitionTimeoutMs ?? 10_000,
    50,
    30_000,
    'private_lock_acquisition_timeout_invalid',
  )
  const retryIntervalMs = boundedPrivateLockDuration(
    input.retryIntervalMs ?? 10,
    5,
    1_000,
    'private_lock_retry_interval_invalid',
  )
  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const parentPath = dirname(targetPath)
  await ensurePrivateParentDirectory(input.rootPath, parentPath)
  const ownerId = randomUUID()
  const acquiredAt = new Date().toISOString()
  const recordPayload = {
    recordVersion: PRIVATE_COOPERATIVE_LOCK_RECORD_VERSION,
    ownerId,
    processId: process.pid,
    processStartedAtEpochMs: Math.max(
      0,
      Math.floor(Date.now() - process.uptime() * 1_000),
    ),
    acquiredAt,
  }
  const record: PrivateCooperativeFileLockRecord = {
    ...recordPayload,
    checksumSha256: sha256PrivateLockPayload(recordPayload),
  }
  const recordBytes = Buffer.from(`${JSON.stringify(record)}\n`, 'utf8')
  const candidatePath = resolve(
    parentPath,
    `.${basename(targetPath)}.${ownerId}.candidate`,
  )
  const deadlineAt = Date.now() + acquisitionTimeoutMs
  let acquiredIdentity: PrivateDirectoryIdentity | undefined

  try {
    while (!acquiredIdentity) {
      await assertPrivateDirectoryChain(input.rootPath, parentPath)
      await assertSafeExistingPrivateFile(targetPath)
      let candidateHandle: Awaited<ReturnType<typeof open>> | undefined
      try {
        candidateHandle = await open(
          candidatePath,
          constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
          PRIVATE_FILE_MODE,
        )
        await candidateHandle.writeFile(recordBytes)
        await candidateHandle.chmod(PRIVATE_FILE_MODE)
        await candidateHandle.sync()
        await candidateHandle.close()
        candidateHandle = undefined

        try {
          await link(candidatePath, targetPath)
          const candidateStat = await lstat(candidatePath)
          const targetStat = await lstat(targetPath)
          if (
            candidateStat.isSymbolicLink() || !candidateStat.isFile() ||
            targetStat.isSymbolicLink() || !targetStat.isFile() ||
            candidateStat.dev !== targetStat.dev || candidateStat.ino !== targetStat.ino
          ) {
            throw unsafePrivatePersistencePath('private_lock_publish_identity_changed')
          }
          acquiredIdentity = privateDirectoryIdentity(targetStat)
        } catch (error) {
          if (!isNodeErrorWithCode(error, 'EEXIST')) throw error
        }
      } finally {
        await candidateHandle?.close().catch(() => undefined)
        await rm(candidatePath, { force: true }).catch(() => undefined)
      }

      if (acquiredIdentity) break
      const reclaimed = await reclaimDeadPrivateCooperativeLock({
        rootPath: input.rootPath,
        relativePath: input.relativePath,
      })
      if (reclaimed) continue
      if (Date.now() >= deadlineAt) {
        throw new ApiError(
          'IDEMPOTENCY_REQUEST_IN_PROGRESS',
          'Private package-state mutation is already in progress.',
          409,
          { reason: 'private_cooperative_lock_busy' },
        )
      }
      await waitForPrivateLockRetry(retryIntervalMs)
    }

    return await input.operation()
  } finally {
    await rm(candidatePath, { force: true }).catch(() => undefined)
    if (acquiredIdentity) {
      await releasePrivateCooperativeLock({
        rootPath: input.rootPath,
        relativePath: input.relativePath,
        expectedOwnerId: ownerId,
        expectedIdentity: acquiredIdentity,
      })
    }
  }
}

export async function writePrivateTextFileAtomicWithinRoot(
  input: PrivateWriteInput & { content: string },
): Promise<string> {
  return writePrivateFileAtomicWithinRoot({
    ...input,
    content: input.content,
  })
}

export async function writePrivateFileAtomicWithinRoot(
  input: PrivateWriteInput & { content: string | Buffer | Uint8Array },
): Promise<string> {
  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const parentPath = dirname(targetPath)
  await ensurePrivateParentDirectory(input.rootPath, parentPath)
  await assertSafeExistingPrivateFile(targetPath)

  const temporaryPath = privateTemporaryPath(targetPath)
  let temporaryHandle: Awaited<ReturnType<typeof open>> | undefined
  try {
    temporaryHandle = await open(
      temporaryPath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      PRIVATE_FILE_MODE,
    )
    await temporaryHandle.writeFile(input.content)
    await temporaryHandle.chmod(PRIVATE_FILE_MODE)
    await temporaryHandle.sync()
    await temporaryHandle.close()
    temporaryHandle = undefined

    await assertPrivateDirectoryChain(input.rootPath, parentPath)
    await assertSafeExistingPrivateFile(targetPath)
    await rename(temporaryPath, targetPath)
    return targetPath
  } finally {
    await temporaryHandle?.close().catch(() => undefined)
    await rm(temporaryPath, { force: true }).catch(() => undefined)
  }
}

/**
 * Creates a private file exactly once. A retry is accepted only when the
 * existing regular file is byte-identical. The temporary-file + hard-link
 * commit keeps creation atomic without rename-overwriting a live object.
 */
export async function writePrivateFileCreateOnlyWithinRoot(
  input: PrivateWriteInput & { content: Buffer | Uint8Array },
): Promise<{ absolutePath: string; created: boolean }> {
  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const parentPath = dirname(targetPath)
  await ensurePrivateParentDirectory(input.rootPath, parentPath)
  await assertSafeExistingPrivateFile(targetPath)

  const bytes = Buffer.isBuffer(input.content) ? input.content : Buffer.from(input.content)
  const temporaryPath = privateTemporaryPath(targetPath)
  const createLockPath = privateCreateLockPath(targetPath)
  let temporaryHandle: Awaited<ReturnType<typeof open>> | undefined
  let createLockHandle: Awaited<ReturnType<typeof open>> | undefined
  try {
    temporaryHandle = await open(
      temporaryPath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      PRIVATE_FILE_MODE,
    )
    await temporaryHandle.writeFile(bytes)
    await temporaryHandle.chmod(PRIVATE_FILE_MODE)
    await temporaryHandle.sync()
    await temporaryHandle.close()
    temporaryHandle = undefined

    try {
      createLockHandle = await open(
        createLockPath,
        constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
        PRIVATE_FILE_MODE,
      )
      await createLockHandle.chmod(PRIVATE_FILE_MODE)
      await createLockHandle.sync()
    } catch (error) {
      if (isNodeErrorWithCode(error, 'EEXIST')) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Private local object create-only commit is already in progress.',
          409,
          { reason: 'create_only_object_lock_conflict' },
        )
      }
      throw error
    }

    await assertPrivateDirectoryChain(input.rootPath, parentPath)
    await assertSafeExistingPrivateFile(targetPath)
    const existing = await readPrivateFileIfExistsWithinRoot(input)
    if (existing) {
      if (existing.equals(bytes)) return { absolutePath: targetPath, created: false }
      throw new ApiError(
        'UPLOAD_NOT_FINALIZED',
        'Private local object already exists with different bytes.',
        409,
        { reason: 'create_only_object_collision' },
      )
    }
    // The exclusive sidecar lock serializes cooperating writers. Rename then
    // publishes the fully fsynced temporary bytes in one filesystem operation.
    await rename(temporaryPath, targetPath)
    return { absolutePath: targetPath, created: true }
  } finally {
    await temporaryHandle?.close().catch(() => undefined)
    await createLockHandle?.close().catch(() => undefined)
    await rm(temporaryPath, { force: true }).catch(() => undefined)
    if (createLockHandle) await rm(createLockPath, { force: true }).catch(() => undefined)
  }
}

export async function writePrivateStreamAtomicWithinRoot(
  input: PrivateWriteInput & { stream: Readable },
): Promise<string> {
  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const parentPath = dirname(targetPath)
  await ensurePrivateParentDirectory(input.rootPath, parentPath)
  await assertSafeExistingPrivateFile(targetPath)

  const temporaryPath = privateTemporaryPath(targetPath)
  try {
    await pipeline(input.stream, createWriteStream(temporaryPath, {
      flags: 'wx',
      mode: PRIVATE_FILE_MODE,
    }))
    const temporaryHandle = await open(temporaryPath, constants.O_RDWR | constants.O_NOFOLLOW)
    try {
      await temporaryHandle.chmod(PRIVATE_FILE_MODE)
      await temporaryHandle.sync()
    } finally {
      await temporaryHandle.close()
    }

    await assertPrivateDirectoryChain(input.rootPath, parentPath)
    await assertSafeExistingPrivateFile(targetPath)
    await rename(temporaryPath, targetPath)
    return targetPath
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined)
  }
}

/**
 * Streams a potentially large worker/source artifact into a private temporary
 * file, verifies a byte ceiling while hashing, then publishes it exactly once.
 * Unlike the replacement writer above, an existing target always fails closed.
 */
export async function writePrivateStreamCreateOnlyWithinRoot(
  input: PrivateWriteInput & { stream: Readable; maximumBytes: number },
): Promise<{ absolutePath: string; byteLength: number; checksumSha256: string }> {
  if (!Number.isSafeInteger(input.maximumBytes) || input.maximumBytes <= 0) {
    throw new ApiError('VALIDATION_FAILED', 'Private stream byte ceiling is invalid.', 400)
  }
  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const parentPath = dirname(targetPath)
  await ensurePrivateParentDirectory(input.rootPath, parentPath)
  await assertSafeExistingPrivateFile(targetPath)

  const temporaryPath = privateTemporaryPath(targetPath)
  const createLockPath = privateCreateLockPath(targetPath)
  const checksum = createHash('sha256')
  let byteLength = 0
  let createLockHandle: Awaited<ReturnType<typeof open>> | undefined
  const meter = new Transform({
    transform(chunk: Buffer | Uint8Array | string, _encoding, callback) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      byteLength += bytes.byteLength
      if (byteLength > input.maximumBytes) {
        callback(new ApiError(
          'VALIDATION_FAILED',
          'Private stream exceeded its server-owned byte ceiling.',
          413,
          { maximumBytes: input.maximumBytes },
        ))
        return
      }
      checksum.update(bytes)
      callback(null, bytes)
    },
  })

  try {
    await pipeline(input.stream, meter, createWriteStream(temporaryPath, {
      flags: 'wx',
      mode: PRIVATE_FILE_MODE,
    }))
    const temporaryHandle = await open(temporaryPath, constants.O_RDWR | constants.O_NOFOLLOW)
    try {
      const temporaryStat = await temporaryHandle.stat()
      if (!temporaryStat.isFile() || temporaryStat.size !== byteLength) {
        throw unsafePrivatePersistencePath('private_stream_temporary_file_invalid')
      }
      await temporaryHandle.chmod(PRIVATE_FILE_MODE)
      await temporaryHandle.sync()
    } finally {
      await temporaryHandle.close()
    }

    createLockHandle = await open(
      createLockPath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      PRIVATE_FILE_MODE,
    ).catch((error) => {
      if (isNodeErrorWithCode(error, 'EEXIST')) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'Private stream create-only commit is already in progress.',
          409,
          { reason: 'create_only_stream_lock_conflict' },
        )
      }
      throw error
    })
    await createLockHandle.chmod(PRIVATE_FILE_MODE)
    await createLockHandle.sync()
    await assertPrivateDirectoryChain(input.rootPath, parentPath)
    if (await safePrivateFileExists(targetPath)) {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'Private stream create-only target already exists.',
        409,
        { reason: 'create_only_stream_target_exists' },
      )
    }
    await rename(temporaryPath, targetPath)
    return {
      absolutePath: targetPath,
      byteLength,
      checksumSha256: checksum.digest('hex'),
    }
  } finally {
    await createLockHandle?.close().catch(() => undefined)
    await rm(temporaryPath, { force: true }).catch(() => undefined)
    if (createLockHandle) await rm(createLockPath, { force: true }).catch(() => undefined)
  }
}

export async function ensurePrivateDirectoryWithinRoot(input: {
  rootPath: string
  relativePath: string
}): Promise<string> {
  const directoryPath = resolvePrivateDirectoryPath(input.rootPath, input.relativePath)
  await ensurePrivateParentDirectory(input.rootPath, directoryPath)
  return directoryPath
}

/**
 * Creates one owned private directory exactly once and returns the directory
 * identity that every later cleanup must present. Existing paths are never
 * adopted. A future dirfd-based worker sandbox is still required to close the
 * hostile same-UID pathname race that Node's path APIs cannot eliminate.
 */
export async function createPrivateDirectoryCreateOnlyWithinRoot(input: {
  rootPath: string
  relativePath: string
}): Promise<{ absolutePath: string; identity: PrivateDirectoryIdentity }> {
  const directoryPath = resolvePrivateDirectoryPath(input.rootPath, input.relativePath)
  const parentPath = dirname(directoryPath)
  await ensurePrivateParentDirectory(input.rootPath, parentPath)

  try {
    await mkdir(directoryPath, { mode: PRIVATE_DIRECTORY_MODE })
  } catch (error) {
    if (isNodeErrorWithCode(error, 'EEXIST')) {
      throw new ApiError(
        'IDEMPOTENCY_CONFLICT',
        'Private directory create-only target already exists.',
        409,
        { reason: 'private_directory_create_only_collision' },
      )
    }
    throw error
  }

  const createdStat = await lstat(directoryPath)
  if (createdStat.isSymbolicLink() || !createdStat.isDirectory()) {
    throw unsafePrivatePersistencePath('private_created_directory_not_regular')
  }
  const createdIdentity = privateDirectoryIdentity(createdStat)
  const directoryHandle = await open(directoryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const openedStat = await directoryHandle.stat()
    if (!openedStat.isDirectory() || !samePrivateDirectoryIdentity(createdIdentity, openedStat)) {
      throw unsafePrivatePersistencePath('private_created_directory_identity_changed')
    }
    await directoryHandle.chmod(PRIVATE_DIRECTORY_MODE)
    await assertPrivateDirectoryChain(input.rootPath, parentPath)
    const latestStat = await lstat(directoryPath)
    if (
      latestStat.isSymbolicLink()
      || !latestStat.isDirectory()
      || !samePrivateDirectoryIdentity(createdIdentity, latestStat)
    ) {
      throw unsafePrivatePersistencePath('private_created_directory_identity_changed')
    }
    return { absolutePath: directoryPath, identity: createdIdentity }
  } finally {
    await directoryHandle.close().catch(() => undefined)
  }
}

/**
 * Removes one owned private directory tree after validating every ancestor and
 * the opened target inode without following symbolic links. Keeping the target
 * directory handle open and rechecking its inode immediately before removal
 * narrows pathname substitution races available to cooperating local writers.
 * A future dirfd/unlinkat worker boundary is still required for a hostile
 * same-UID filesystem actor.
 */
export async function removePrivateDirectoryTreeWithinRoot(input: {
  rootPath: string
  relativePath: string
  expectedIdentity?: PrivateDirectoryIdentity
}): Promise<{ removed: boolean }> {
  const directoryPath = resolvePrivateDirectoryPath(input.rootPath, input.relativePath)
  const parentPath = dirname(directoryPath)
  const parentExists = await assertPrivateDirectoryChain(input.rootPath, parentPath, true, true)
  if (!parentExists) return { removed: false }

  let directoryStat: Awaited<ReturnType<typeof lstat>>
  try {
    directoryStat = await lstat(directoryPath)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return { removed: false }
    throw error
  }
  if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
    throw unsafePrivatePersistencePath('private_cleanup_directory_not_regular')
  }
  if (input.expectedIdentity && !samePrivateDirectoryIdentity(input.expectedIdentity, directoryStat)) {
    throw unsafePrivatePersistencePath('private_cleanup_directory_identity_mismatch')
  }

  const directoryHandle = await open(directoryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const openedStat = await directoryHandle.stat()
    if (!openedStat.isDirectory()) {
      throw unsafePrivatePersistencePath('private_cleanup_directory_not_regular')
    }
    if (input.expectedIdentity && !samePrivateDirectoryIdentity(input.expectedIdentity, openedStat)) {
      throw unsafePrivatePersistencePath('private_cleanup_directory_identity_mismatch')
    }
    await directoryHandle.chmod(PRIVATE_DIRECTORY_MODE)
    await assertPrivateDirectoryChain(input.rootPath, parentPath, false, true)
    const latestStat = await lstat(directoryPath)
    if (
      latestStat.isSymbolicLink()
      || !latestStat.isDirectory()
      || latestStat.dev !== openedStat.dev
      || latestStat.ino !== openedStat.ino
      || (input.expectedIdentity && !samePrivateDirectoryIdentity(input.expectedIdentity, latestStat))
    ) {
      throw unsafePrivatePersistencePath('private_cleanup_directory_identity_changed')
    }
    await rm(directoryPath, { force: false, recursive: true })
    return { removed: true }
  } finally {
    await directoryHandle.close().catch(() => undefined)
  }
}

/**
 * Lists only regular child directories from one private directory without
 * creating or hardening the inspected tree. Files, symlinks, special entries,
 * over-limit directories, or a directory changed during inspection fail
 * closed. Returned identities can be used for later exact cleanup checks.
 */
export async function listPrivateRegularDirectoriesWithinRoot(input: {
  rootPath: string
  relativeDirectoryPath: string
  maximumEntries: number
  expectedIdentity?: PrivateDirectoryIdentity
}): Promise<PrivateRegularDirectoryEntry[]> {
  validatePrivateInspectionLimit(input.maximumEntries)
  const directoryPath = resolvePrivateDirectoryPath(input.rootPath, input.relativeDirectoryPath)
  const directoryExists = await assertPrivateDirectoryChain(input.rootPath, directoryPath, true)
  if (!directoryExists) return []

  const directoryHandle = await open(directoryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const openedStat = await directoryHandle.stat()
    if (!openedStat.isDirectory()) throw unsafePrivatePersistencePath('private_inspection_directory_not_regular')
    if (input.expectedIdentity && !samePrivateDirectoryIdentity(input.expectedIdentity, openedStat)) {
      throw unsafePrivatePersistencePath('private_inspection_directory_identity_changed')
    }
    const entries = await readdir(directoryPath, { withFileTypes: true })
    if (entries.length > input.maximumEntries) {
      throw unsafePrivatePersistencePath('private_inspection_entry_limit_exceeded')
    }
    const results: PrivateRegularDirectoryEntry[] = []
    for (const entry of entries) {
      if (basename(entry.name) !== entry.name || entry.name === '.' || entry.name === '..') {
        throw unsafePrivatePersistencePath('private_inspection_entry_name_invalid')
      }
      const entryPath = resolve(directoryPath, entry.name)
      const entryStat = await lstat(entryPath)
      if (entryStat.isSymbolicLink() || !entryStat.isDirectory()) {
        throw unsafePrivatePersistencePath('private_inspection_entry_not_regular_directory')
      }
      const entryHandle = await open(entryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
      try {
        const openedEntryStat = await entryHandle.stat()
        if (!openedEntryStat.isDirectory() || openedEntryStat.dev !== entryStat.dev || openedEntryStat.ino !== entryStat.ino) {
          throw unsafePrivatePersistencePath('private_inspection_entry_identity_changed')
        }
        results.push({ name: entry.name, identity: privateDirectoryIdentity(openedEntryStat) })
      } finally {
        await entryHandle.close().catch(() => undefined)
      }
    }
    await assertPrivateDirectoryChain(input.rootPath, directoryPath)
    const latestStat = await lstat(directoryPath)
    if (
      latestStat.isSymbolicLink()
      || !latestStat.isDirectory()
      || latestStat.dev !== openedStat.dev
      || latestStat.ino !== openedStat.ino
      || (input.expectedIdentity && !samePrivateDirectoryIdentity(input.expectedIdentity, latestStat))
      || latestStat.mtimeMs !== openedStat.mtimeMs
      || latestStat.ctimeMs !== openedStat.ctimeMs
    ) {
      throw unsafePrivatePersistencePath('private_inspection_directory_changed')
    }
    return results.sort((left, right) => left.name.localeCompare(right.name))
  } finally {
    await directoryHandle.close().catch(() => undefined)
  }
}

/**
 * Inspects one flat private attempt directory. Only regular files are allowed;
 * nested directories, symlinks, and special entries fail closed. The newest
 * mtime/ctime/birthtime across the directory and every file is returned for a
 * conservative age decision.
 */
export async function inspectPrivateFlatDirectoryWithinRoot(input: {
  rootPath: string
  relativePath: string
  maximumEntries: number
  expectedIdentity?: PrivateDirectoryIdentity
}): Promise<PrivateFlatDirectoryInspection | undefined> {
  validatePrivateInspectionLimit(input.maximumEntries)
  const directoryPath = resolvePrivateDirectoryPath(input.rootPath, input.relativePath)
  const parentPath = dirname(directoryPath)
  const parentExists = await assertPrivateDirectoryChain(input.rootPath, parentPath, true)
  if (!parentExists) return undefined

  let directoryStat: Awaited<ReturnType<typeof lstat>>
  try {
    directoryStat = await lstat(directoryPath)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return undefined
    throw error
  }
  if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
    throw unsafePrivatePersistencePath('private_inspection_directory_not_regular')
  }
  if (input.expectedIdentity && !samePrivateDirectoryIdentity(input.expectedIdentity, directoryStat)) {
    throw unsafePrivatePersistencePath('private_inspection_directory_identity_changed')
  }

  const directoryHandle = await open(directoryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const openedStat = await directoryHandle.stat()
    if (
      !openedStat.isDirectory()
      || openedStat.dev !== directoryStat.dev
      || openedStat.ino !== directoryStat.ino
      || (input.expectedIdentity && !samePrivateDirectoryIdentity(input.expectedIdentity, openedStat))
    ) {
      throw unsafePrivatePersistencePath('private_inspection_directory_identity_changed')
    }
    const entries = await readdir(directoryPath, { withFileTypes: true })
    if (entries.length > input.maximumEntries) {
      throw unsafePrivatePersistencePath('private_inspection_entry_limit_exceeded')
    }
    let newestActivityAtMs = newestPrivateFilesystemActivityAtMs(openedStat)
    for (const entry of entries) {
      if (basename(entry.name) !== entry.name || entry.name === '.' || entry.name === '..') {
        throw unsafePrivatePersistencePath('private_inspection_entry_name_invalid')
      }
      const entryPath = resolve(directoryPath, entry.name)
      const entryStat = await lstat(entryPath)
      if (entryStat.isSymbolicLink() || !entryStat.isFile()) {
        throw unsafePrivatePersistencePath('private_inspection_entry_not_regular_file')
      }
      const entryHandle = await open(entryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
      try {
        const openedEntryStat = await entryHandle.stat()
        if (!openedEntryStat.isFile() || openedEntryStat.dev !== entryStat.dev || openedEntryStat.ino !== entryStat.ino) {
          throw unsafePrivatePersistencePath('private_inspection_entry_identity_changed')
        }
        const latestEntryStat = await entryHandle.stat()
        if (
          latestEntryStat.dev !== openedEntryStat.dev
          || latestEntryStat.ino !== openedEntryStat.ino
          || latestEntryStat.size !== openedEntryStat.size
          || latestEntryStat.mtimeMs !== openedEntryStat.mtimeMs
          || latestEntryStat.ctimeMs !== openedEntryStat.ctimeMs
        ) {
          throw unsafePrivatePersistencePath('private_inspection_entry_changed')
        }
        newestActivityAtMs = Math.max(newestActivityAtMs, newestPrivateFilesystemActivityAtMs(latestEntryStat))
      } finally {
        await entryHandle.close().catch(() => undefined)
      }
    }
    await assertPrivateDirectoryChain(input.rootPath, parentPath)
    const latestStat = await lstat(directoryPath)
    if (
      latestStat.isSymbolicLink()
      || !latestStat.isDirectory()
      || latestStat.dev !== openedStat.dev
      || latestStat.ino !== openedStat.ino
      || (input.expectedIdentity && !samePrivateDirectoryIdentity(input.expectedIdentity, latestStat))
      || latestStat.mtimeMs !== openedStat.mtimeMs
      || latestStat.ctimeMs !== openedStat.ctimeMs
    ) {
      throw unsafePrivatePersistencePath('private_inspection_directory_changed')
    }
    return {
      identity: privateDirectoryIdentity(openedStat),
      entryCount: entries.length,
      newestActivityAtMs,
    }
  } finally {
    await directoryHandle.close().catch(() => undefined)
  }
}

/**
 * Lists regular file names from one private registry directory. Directory
 * names are never returned, symbolic-link or special-file entries fail
 * closed, and callers must still open every returned file through the private
 * no-follow reader before trusting its bytes.
 */
export async function listPrivateRegularFileNamesWithinRoot(input: {
  rootPath: string
  relativeDirectoryPath: string
}): Promise<string[]> {
  const directoryPath = resolvePrivateDirectoryPath(input.rootPath, input.relativeDirectoryPath)
  const directoryExists = await assertPrivateDirectoryChain(input.rootPath, directoryPath, true, true)
  if (!directoryExists) return []

  const directoryHandle = await open(directoryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const openedStat = await directoryHandle.stat()
    if (!openedStat.isDirectory()) throw unsafePrivatePersistencePath('private_registry_not_regular_directory')
    await directoryHandle.chmod(PRIVATE_DIRECTORY_MODE)
    const entries = await readdir(directoryPath, { withFileTypes: true })
    await assertPrivateDirectoryChain(input.rootPath, directoryPath, false, true)
    const fileNames: string[] = []
    for (const entry of entries) {
      if (entry.isSymbolicLink() || (!entry.isFile() && !entry.isDirectory())) {
        throw unsafePrivatePersistencePath('private_registry_entry_not_regular')
      }
      if (entry.isFile()) fileNames.push(entry.name)
    }
    return fileNames.sort((left, right) => left.localeCompare(right))
  } finally {
    await directoryHandle.close()
  }
}

export async function readPrivateFileIfExistsWithinRoot(input: PrivateWriteInput): Promise<Buffer | undefined> {
  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const parentPath = dirname(targetPath)
  const parentExists = await assertPrivateDirectoryChain(input.rootPath, parentPath, true, true)
  if (!parentExists) return undefined

  let targetStat: Awaited<ReturnType<typeof lstat>>
  try {
    targetStat = await lstat(targetPath)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return undefined
    throw error
  }
  if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
    throw unsafePrivatePersistencePath('private_file_not_regular')
  }

  let handle: Awaited<ReturnType<typeof open>>
  try {
    handle = await open(targetPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return undefined
    throw error
  }
  try {
    const openedStat = await handle.stat()
    if (!openedStat.isFile()) throw unsafePrivatePersistencePath('private_file_not_regular')
    await handle.chmod(PRIVATE_FILE_MODE)
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

export async function readPrivateTextFileIfExistsWithinRoot(input: PrivateWriteInput): Promise<string | undefined> {
  const content = await readPrivateFileIfExistsWithinRoot(input)
  return content?.toString('utf8')
}

/**
 * Removes one exact private regular file after validating its no-follow inode
 * and content digest. This is intended for transient commit/recovery records,
 * never caller-selected media or arbitrary paths.
 */
export async function removePrivateRegularFileWithinRoot(input: PrivateWriteInput & {
  expectedContentSha256: string
}): Promise<{ removed: boolean }> {
  if (!/^[a-f0-9]{64}$/u.test(input.expectedContentSha256)) {
    throw unsafePrivatePersistencePath('private_file_expected_digest_invalid')
  }
  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const parentPath = dirname(targetPath)
  const parentExists = await assertPrivateDirectoryChain(input.rootPath, parentPath, true, true)
  if (!parentExists) return { removed: false }

  let targetStat: Awaited<ReturnType<typeof lstat>>
  try {
    targetStat = await lstat(targetPath)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return { removed: false }
    throw error
  }
  if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
    throw unsafePrivatePersistencePath('private_file_not_regular')
  }
  const expectedIdentity = privateDirectoryIdentity(targetStat)
  const handle = await open(targetPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const openedStat = await handle.stat()
    if (
      !openedStat.isFile() ||
      !samePrivateDirectoryIdentity(expectedIdentity, openedStat)
    ) throw unsafePrivatePersistencePath('private_file_identity_changed')
    const bytes = await handle.readFile()
    if (createHash('sha256').update(bytes).digest('hex') !== input.expectedContentSha256) {
      throw unsafePrivatePersistencePath('private_file_digest_changed')
    }
    await assertPrivateDirectoryChain(input.rootPath, parentPath)
    const latestStat = await lstat(targetPath)
    if (
      latestStat.isSymbolicLink() || !latestStat.isFile() ||
      !samePrivateDirectoryIdentity(expectedIdentity, latestStat)
    ) throw unsafePrivatePersistencePath('private_file_identity_changed')
    await rm(targetPath)
    return { removed: true }
  } finally {
    await handle.close().catch(() => undefined)
  }
}

export async function createPrivateReadStreamWithinRoot(
  input: PrivateWriteInput & { start?: number; end?: number },
): Promise<Readable> {
  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const parentPath = dirname(targetPath)
  const parentExists = await assertPrivateDirectoryChain(input.rootPath, parentPath, true, true)
  if (!parentExists) throw new ApiError('UPLOAD_NOT_FINALIZED', 'Private local object was not found.', 404)

  const handle = await open(targetPath, constants.O_RDONLY | constants.O_NOFOLLOW).catch((error) => {
    if (isNodeErrorWithCode(error, 'ENOENT')) {
      throw new ApiError('UPLOAD_NOT_FINALIZED', 'Private local object was not found.', 404)
    }
    throw error
  })
  try {
    const openedStat = await handle.stat()
    if (!openedStat.isFile()) throw unsafePrivatePersistencePath('private_file_not_regular')
    const hasRange = input.start !== undefined || input.end !== undefined
    if (
      hasRange && (
        !Number.isSafeInteger(input.start) || !Number.isSafeInteger(input.end) ||
        input.start! < 0 || input.end! < input.start! || input.end! >= openedStat.size
      )
    ) throw unsafePrivatePersistencePath('private_file_range_invalid')
    await handle.chmod(PRIVATE_FILE_MODE)
    return handle.createReadStream({
      autoClose: true,
      ...(hasRange ? { start: input.start, end: input.end } : {}),
    })
  } catch (error) {
    await handle.close().catch(() => undefined)
    throw error
  }
}

function resolvePrivateTargetPath(rootPathInput: string, relativePathInput: string): string {
  const rootPath = normalizeRootPath(rootPathInput)
  const relativePath = normalizeRelativePath(relativePathInput)
  const targetPath = resolve(rootPath, relativePath)
  if (targetPath === rootPath || !targetPath.startsWith(`${rootPath}${sep}`)) {
    throw unsafePrivatePersistencePath('path_escapes_root')
  }
  return targetPath
}

function resolvePrivateDirectoryPath(rootPathInput: string, relativePathInput: string): string {
  const rootPath = normalizeRootPath(rootPathInput)
  const relativePath = normalizeRelativePath(relativePathInput)
  const directoryPath = resolve(rootPath, relativePath)
  if (directoryPath === rootPath || !directoryPath.startsWith(`${rootPath}${sep}`)) {
    throw unsafePrivatePersistencePath('path_escapes_root')
  }
  return directoryPath
}

function normalizeRootPath(rootPathInput: string): string {
  const rootPath = rootPathInput.trim()
  if (!rootPath) throw unsafePrivatePersistencePath('root_path_required')
  return resolve(rootPath)
}

function normalizeRelativePath(relativePathInput: string): string {
  const relativePath = relativePathInput.trim()
  const normalizedSegments = relativePath.replace(/\\/g, '/').split('/')
  if (
    !relativePath
    || isAbsolute(relativePath)
    || relativePath.includes('\0')
    || normalizedSegments.some((segment) => segment === '..')
  ) {
    throw unsafePrivatePersistencePath('relative_path_invalid')
  }
  return relativePath
}

async function ensurePrivateParentDirectory(rootPathInput: string, parentPath: string): Promise<void> {
  const rootPath = normalizeRootPath(rootPathInput)
  let rootStat: Awaited<ReturnType<typeof lstat>>
  try {
    rootStat = await lstat(rootPath)
  } catch (error) {
    if (!isNodeErrorWithCode(error, 'ENOENT')) throw error
    await mkdir(rootPath, { recursive: true, mode: PRIVATE_DIRECTORY_MODE })
    rootStat = await lstat(rootPath)
  }

  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw unsafePrivatePersistencePath('root_not_regular_directory')
  }
  // Harden an existing configured root as well as a newly created one. Local
  // storage roots are often created by another process with a permissive
  // umask; private records must not inherit that exposure.
  await hardenPrivateDirectoryPath(rootPath, 'root_not_regular_directory')

  const relativeParent = relative(rootPath, parentPath)
  if (relativeParent === '..' || relativeParent.startsWith(`..${sep}`) || isAbsolute(relativeParent)) {
    throw unsafePrivatePersistencePath('path_escapes_root')
  }

  let currentPath = rootPath
  for (const pathPart of relativeParent.split(sep).filter(Boolean)) {
    currentPath = resolve(currentPath, pathPart)
    try {
      await mkdir(currentPath, { mode: PRIVATE_DIRECTORY_MODE })
    } catch (error) {
      if (!isNodeErrorWithCode(error, 'EEXIST')) throw error
    }
    const directoryStat = await lstat(currentPath)
    if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
      throw unsafePrivatePersistencePath('parent_not_regular_directory')
    }
    await hardenPrivateDirectoryPath(currentPath, 'parent_not_regular_directory')
  }
}

async function hardenPrivateDirectoryPath(directoryPath: string, unsafeReason: string): Promise<void> {
  const directoryHandle = await open(directoryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  try {
    const openedStat = await directoryHandle.stat()
    if (!openedStat.isDirectory()) throw unsafePrivatePersistencePath(unsafeReason)
    await directoryHandle.chmod(PRIVATE_DIRECTORY_MODE)
  } finally {
    await directoryHandle.close()
  }
}

async function assertPrivateDirectoryChain(
  rootPathInput: string,
  parentPath: string,
  allowMissing = false,
  hardenOwnedDescendants = false,
): Promise<boolean> {
  const rootPath = normalizeRootPath(rootPathInput)
  const relativeParent = relative(rootPath, parentPath)
  if (relativeParent === '..' || relativeParent.startsWith(`..${sep}`) || isAbsolute(relativeParent)) {
    throw unsafePrivatePersistencePath('path_escapes_root')
  }

  const paths = [
    rootPath,
    ...relativeParent.split(sep).filter(Boolean).map((_, index, parts) =>
      resolve(rootPath, ...parts.slice(0, index + 1))
    ),
  ]
  for (const [index, directoryPath] of paths.entries()) {
    let directoryStat: Awaited<ReturnType<typeof lstat>>
    try {
      directoryStat = await lstat(directoryPath)
    } catch (error) {
      if (allowMissing && isNodeErrorWithCode(error, 'ENOENT')) return false
      throw error
    }
    if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
      throw unsafePrivatePersistencePath('parent_not_regular_directory')
    }
    if (hardenOwnedDescendants && index > 0) {
      const directoryHandle = await open(directoryPath, constants.O_RDONLY | constants.O_NOFOLLOW)
      try {
        const openedStat = await directoryHandle.stat()
        if (!openedStat.isDirectory()) throw unsafePrivatePersistencePath('parent_not_regular_directory')
        await directoryHandle.chmod(PRIVATE_DIRECTORY_MODE)
      } finally {
        await directoryHandle.close()
      }
    }
  }
  return true
}

async function assertSafeExistingPrivateFile(targetPath: string): Promise<void> {
  try {
    const targetStat = await lstat(targetPath)
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
      throw unsafePrivatePersistencePath('private_file_not_regular')
    }
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return
    throw error
  }
}

async function safePrivateFileExists(targetPath: string): Promise<boolean> {
  try {
    const targetStat = await lstat(targetPath)
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
      throw unsafePrivatePersistencePath('private_file_not_regular')
    }
    return true
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return false
    throw error
  }
}

function privateTemporaryPath(targetPath: string): string {
  return resolve(dirname(targetPath), `.${basename(targetPath)}.${randomUUID()}.tmp`)
}

function privateCreateLockPath(targetPath: string): string {
  return resolve(dirname(targetPath), `.${basename(targetPath)}.create.lock`)
}

function privateDirectoryIdentity(stat: { dev: number; ino: number }): PrivateDirectoryIdentity {
  return { device: stat.dev, inode: stat.ino }
}

function samePrivateDirectoryIdentity(
  identity: PrivateDirectoryIdentity,
  stat: { dev: number; ino: number },
): boolean {
  return identity.device === stat.dev && identity.inode === stat.ino
}

function newestPrivateFilesystemActivityAtMs(stat: {
  mtimeMs: number
  ctimeMs: number
  birthtimeMs: number
}): number {
  return Math.max(stat.mtimeMs, stat.ctimeMs, stat.birthtimeMs)
}

function validatePrivateInspectionLimit(value: number): void {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 10_000) {
    throw unsafePrivatePersistencePath('private_inspection_limit_invalid')
  }
}

async function reclaimDeadPrivateCooperativeLock(input: PrivateWriteInput): Promise<boolean> {
  const existing = await readPrivateCooperativeLockRecord(input)
  if (!existing) return true
  if (privateProcessIsAlive(existing.record.processId)) return false

  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  let latestStat: Awaited<ReturnType<typeof lstat>>
  try {
    latestStat = await lstat(targetPath)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return true
    throw error
  }
  if (
    latestStat.isSymbolicLink() || !latestStat.isFile() ||
    !samePrivateDirectoryIdentity(existing.identity, latestStat)
  ) return false
  await rm(targetPath)
  return true
}

async function releasePrivateCooperativeLock(input: PrivateWriteInput & {
  expectedOwnerId: string
  expectedIdentity: PrivateDirectoryIdentity
}): Promise<void> {
  const existing = await readPrivateCooperativeLockRecord(input)
  if (
    !existing ||
    existing.record.ownerId !== input.expectedOwnerId ||
    !samePrivateDirectoryIdentity(input.expectedIdentity, {
      dev: existing.identity.device,
      ino: existing.identity.inode,
    })
  ) throw unsafePrivatePersistencePath('private_lock_release_authority_changed')

  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const latestStat = await lstat(targetPath)
  if (
    latestStat.isSymbolicLink() || !latestStat.isFile() ||
    !samePrivateDirectoryIdentity(input.expectedIdentity, latestStat)
  ) throw unsafePrivatePersistencePath('private_lock_release_identity_changed')
  await rm(targetPath)
}

async function readPrivateCooperativeLockRecord(
  input: PrivateWriteInput,
): Promise<{
  record: PrivateCooperativeFileLockRecord
  identity: PrivateDirectoryIdentity
} | undefined> {
  const targetPath = resolvePrivateTargetPath(input.rootPath, input.relativePath)
  const parentPath = dirname(targetPath)
  const parentExists = await assertPrivateDirectoryChain(input.rootPath, parentPath, true, true)
  if (!parentExists) return undefined
  let targetStat: Awaited<ReturnType<typeof lstat>>
  try {
    targetStat = await lstat(targetPath)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return undefined
    throw error
  }
  if (
    targetStat.isSymbolicLink() || !targetStat.isFile() ||
    targetStat.size < 2 || targetStat.size > MAX_PRIVATE_COOPERATIVE_LOCK_RECORD_BYTES
  ) throw unsafePrivatePersistencePath('private_lock_record_invalid')

  const identity = privateDirectoryIdentity(targetStat)
  let handle: Awaited<ReturnType<typeof open>>
  try {
    handle = await open(targetPath, constants.O_RDONLY | constants.O_NOFOLLOW)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return undefined
    throw error
  }
  try {
    const openedStat = await handle.stat()
    if (!openedStat.isFile() || !samePrivateDirectoryIdentity(identity, openedStat)) {
      throw unsafePrivatePersistencePath('private_lock_record_identity_changed')
    }
    const bytes = await handle.readFile()
    if (bytes.length < 2 || bytes.length > MAX_PRIVATE_COOPERATIVE_LOCK_RECORD_BYTES) {
      throw unsafePrivatePersistencePath('private_lock_record_invalid')
    }
    let decoded: unknown
    try {
      decoded = JSON.parse(bytes.toString('utf8'))
    } catch {
      throw unsafePrivatePersistencePath('private_lock_record_invalid')
    }
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
      throw unsafePrivatePersistencePath('private_lock_record_invalid')
    }
    const candidate = decoded as Partial<PrivateCooperativeFileLockRecord>
    const payload = {
      recordVersion: candidate.recordVersion,
      ownerId: candidate.ownerId,
      processId: candidate.processId,
      processStartedAtEpochMs: candidate.processStartedAtEpochMs,
      acquiredAt: candidate.acquiredAt,
    }
    if (
      candidate.recordVersion !== PRIVATE_COOPERATIVE_LOCK_RECORD_VERSION ||
      typeof candidate.ownerId !== 'string' ||
      !/^[a-f0-9-]{36}$/u.test(candidate.ownerId) ||
      !Number.isSafeInteger(candidate.processId) || candidate.processId! <= 0 ||
      !Number.isSafeInteger(candidate.processStartedAtEpochMs) ||
      candidate.processStartedAtEpochMs! < 0 ||
      typeof candidate.acquiredAt !== 'string' ||
      !Number.isFinite(Date.parse(candidate.acquiredAt)) ||
      typeof candidate.checksumSha256 !== 'string' ||
      candidate.checksumSha256 !== sha256PrivateLockPayload(payload)
    ) throw unsafePrivatePersistencePath('private_lock_record_invalid')
    return {
      record: candidate as PrivateCooperativeFileLockRecord,
      identity,
    }
  } finally {
    await handle.close().catch(() => undefined)
  }
}

function privateProcessIsAlive(processId: number): boolean {
  try {
    process.kill(processId, 0)
    return true
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ESRCH')) return false
    if (isNodeErrorWithCode(error, 'EPERM')) return true
    throw new ApiError(
      'INTERNAL_ERROR',
      'Private cooperative lock owner could not be inspected.',
      500,
      undefined,
      { cause: error, internal: true },
    )
  }
}

function sha256PrivateLockPayload(value: object): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function boundedPrivateLockDuration(
  value: number,
  minimum: number,
  maximum: number,
  reason: string,
): number {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw unsafePrivatePersistencePath(reason)
  }
  return value
}

async function waitForPrivateLockRetry(durationMs: number): Promise<void> {
  await new Promise<void>((resolvePromise) => setTimeout(resolvePromise, durationMs))
}

function unsafePrivatePersistencePath(reason: string): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Private local persistence refused an unsafe filesystem path.',
    400,
    { reason },
  )
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}
