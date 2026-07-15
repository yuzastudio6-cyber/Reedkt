import { createHash, randomUUID } from 'node:crypto'
import { lstat } from 'node:fs/promises'
import { resolve, sep } from 'node:path'
import type { Readable } from 'node:stream'
import { finished } from 'node:stream/promises'
import { ApiError } from '../../errors/api-error'
import {
  createPrivateDirectoryCreateOnlyWithinRoot,
  createPrivateReadStreamWithinRoot,
  ensurePrivateDirectoryWithinRoot,
  removePrivateDirectoryTreeWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
  type PrivateDirectoryIdentity,
} from '../../security/private-local-persistence'

export const PRIVATE_CANONICAL_WORKER_SANDBOX_VERSION =
  'private-canonical-worker-sandbox-v1' as const

export interface PrivateCanonicalWorkerSandbox {
  schemaVersion: typeof PRIVATE_CANONICAL_WORKER_SANDBOX_VERSION
  sandboxId: string
  localStorageRoot: string
  relativeDirectory: string
  absoluteDirectory: string
  directoryIdentity: PrivateDirectoryIdentity
  privateInternalOnly: true
}

export interface PrivateWorkerMaterializedFile {
  relativePath: string
  absolutePath: string
  byteLength: number
  checksumSha256: string
}

const SAFE_IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/u
const SAFE_EXTENSION = /^[a-z0-9]{1,12}$/u

export async function createPrivateCanonicalWorkerSandbox(input: {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  snapshotId: string
  jobId: string
  leaseId: string
  executionAttemptId: string
  dispatchGrantId: string
}): Promise<PrivateCanonicalWorkerSandbox> {
  for (const [field, value] of Object.entries(input).filter(([key]) => key !== 'localStorageRoot')) {
    assertSafeIdentity(value, field)
  }
  const scopeHash = createHash('sha256').update([
    input.ownerUserId,
    input.workspaceId,
    input.projectId,
    input.editSessionId,
    input.snapshotId,
    input.jobId,
    input.leaseId,
    input.executionAttemptId,
    input.dispatchGrantId,
  ].join('\n')).digest('hex')
  const sandboxId = `worker_sandbox_${randomUUID()}`
  const relativeDirectory = [
    'canonical-worker-sandboxes',
    'private-internal-v1',
    `scope-${scopeHash}`,
    sandboxId,
  ].join('/')
  const created = await createPrivateDirectoryCreateOnlyWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: relativeDirectory,
  })
  return {
    schemaVersion: PRIVATE_CANONICAL_WORKER_SANDBOX_VERSION,
    sandboxId,
    localStorageRoot: input.localStorageRoot,
    relativeDirectory,
    absoluteDirectory: created.absolutePath,
    directoryIdentity: created.identity,
    privateInternalOnly: true,
  }
}

export async function materializeVerifiedPrivateWorkerInput(input: {
  sandbox: PrivateCanonicalWorkerSandbox
  inputId: string
  extension: string
  stream: Readable
  expectedByteLength: number
  expectedChecksumSha256: string
  maximumBytes: number
}): Promise<PrivateWorkerMaterializedFile> {
  assertSandbox(input.sandbox)
  assertSafeIdentity(input.inputId, 'inputId')
  const extension = normalizeExtension(input.extension)
  if (!Number.isSafeInteger(input.expectedByteLength) || input.expectedByteLength < 0) {
    throw new ApiError('VALIDATION_FAILED', 'Expected private worker input size is invalid.', 400)
  }
  if (!/^[a-f0-9]{64}$/u.test(input.expectedChecksumSha256)) {
    throw new ApiError('VALIDATION_FAILED', 'Expected private worker input checksum is invalid.', 400)
  }
  const relativePath = `${input.sandbox.relativeDirectory}/inputs/${input.inputId}.${extension}`
  let materialized: Awaited<ReturnType<typeof writePrivateStreamCreateOnlyWithinRoot>>
  try {
    materialized = await writePrivateStreamCreateOnlyWithinRoot({
      rootPath: input.sandbox.localStorageRoot,
      relativePath,
      stream: input.stream,
      maximumBytes: input.maximumBytes,
    })
  } catch (error) {
    input.stream.destroy()
    await finished(input.stream).catch(() => undefined)
    throw error
  }
  if (
    materialized.byteLength !== input.expectedByteLength ||
    materialized.checksumSha256 !== input.expectedChecksumSha256
  ) {
    await destroyPrivateCanonicalWorkerSandbox(input.sandbox)
    throw new ApiError(
      'UPLOAD_SOURCE_MISMATCH',
      'Materialized private worker input does not match immutable source authority.',
      409,
      {
        expectedByteLength: input.expectedByteLength,
        actualByteLength: materialized.byteLength,
      },
    )
  }
  return { relativePath, ...materialized }
}

export async function allocatePrivateWorkerOutputPath(input: {
  sandbox: PrivateCanonicalWorkerSandbox
  outputId: string
  extension: string
}): Promise<{ relativePath: string; absolutePath: string }> {
  assertSandbox(input.sandbox)
  assertSafeIdentity(input.outputId, 'outputId')
  const extension = normalizeExtension(input.extension)
  const outputDirectory = `${input.sandbox.relativeDirectory}/outputs`
  await ensurePrivateDirectoryWithinRoot({
    rootPath: input.sandbox.localStorageRoot,
    relativePath: outputDirectory,
  })
  const relativePath = `${outputDirectory}/${input.outputId}.${extension}`
  const absolutePath = resolve(input.sandbox.localStorageRoot, relativePath)
  assertPathWithinSandbox(input.sandbox, absolutePath)
  try {
    await lstat(absolutePath)
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Private worker output path already exists.', 409)
  } catch (error) {
    if (isNodeErrorWithCode(error, 'ENOENT')) return { relativePath, absolutePath }
    throw error
  }
}

export async function promotePrivateWorkerOutputCreateOnly(input: {
  sandbox: PrivateCanonicalWorkerSandbox
  scratchRelativePath: string
  artifactRelativePath: string
  maximumBytes: number
}): Promise<PrivateWorkerMaterializedFile> {
  assertSandbox(input.sandbox)
  const scratchAbsolutePath = resolve(input.sandbox.localStorageRoot, input.scratchRelativePath)
  assertPathWithinSandbox(input.sandbox, scratchAbsolutePath)
  const stream = await createPrivateReadStreamWithinRoot({
    rootPath: input.sandbox.localStorageRoot,
    relativePath: input.scratchRelativePath,
  })
  let promoted: Awaited<ReturnType<typeof writePrivateStreamCreateOnlyWithinRoot>>
  try {
    promoted = await writePrivateStreamCreateOnlyWithinRoot({
      rootPath: input.sandbox.localStorageRoot,
      relativePath: input.artifactRelativePath,
      stream,
      maximumBytes: input.maximumBytes,
    })
  } catch (error) {
    stream.destroy()
    await finished(stream).catch(() => undefined)
    throw error
  }
  return {
    relativePath: input.artifactRelativePath,
    ...promoted,
  }
}

export async function destroyPrivateCanonicalWorkerSandbox(
  sandbox: PrivateCanonicalWorkerSandbox,
): Promise<void> {
  assertSandbox(sandbox)
  assertPathWithinSandbox(sandbox, sandbox.absoluteDirectory)
  await removePrivateDirectoryTreeWithinRoot({
    rootPath: sandbox.localStorageRoot,
    relativePath: sandbox.relativeDirectory,
    expectedIdentity: sandbox.directoryIdentity,
  })
}

function assertSandbox(sandbox: PrivateCanonicalWorkerSandbox): void {
  const expectedAbsoluteDirectory = resolve(sandbox.localStorageRoot, sandbox.relativeDirectory)
  const normalizedRoot = resolve(sandbox.localStorageRoot)
  if (
    sandbox.schemaVersion !== PRIVATE_CANONICAL_WORKER_SANDBOX_VERSION ||
    sandbox.privateInternalOnly !== true ||
    !sandbox.relativeDirectory.endsWith(`/${sandbox.sandboxId}`) ||
    resolve(sandbox.absoluteDirectory) !== expectedAbsoluteDirectory ||
    !Number.isSafeInteger(sandbox.directoryIdentity?.device) ||
    !Number.isSafeInteger(sandbox.directoryIdentity?.inode) ||
    !expectedAbsoluteDirectory.startsWith(`${normalizedRoot}${sep}`)
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private canonical worker sandbox identity is invalid.', 400)
  }
  assertSafeIdentity(sandbox.sandboxId, 'sandboxId')
  assertPathWithinSandbox(sandbox, sandbox.absoluteDirectory)
}

function assertPathWithinSandbox(
  sandbox: Pick<PrivateCanonicalWorkerSandbox, 'absoluteDirectory'>,
  absolutePath: string,
): void {
  const sandboxRoot = resolve(sandbox.absoluteDirectory)
  const candidate = resolve(absolutePath)
  if (candidate !== sandboxRoot && !candidate.startsWith(`${sandboxRoot}${sep}`)) {
    throw new ApiError('VALIDATION_FAILED', 'Private worker path escapes its sandbox.', 400)
  }
}

function assertSafeIdentity(value: string, field: string): void {
  if (!SAFE_IDENTITY.test(value) || value.includes('..')) {
    throw new ApiError('VALIDATION_FAILED', `Private worker ${field} is invalid.`, 400)
  }
}

function normalizeExtension(value: string): string {
  const extension = value.trim().toLowerCase().replace(/^\./u, '')
  if (!SAFE_EXTENSION.test(extension)) {
    throw new ApiError('VALIDATION_FAILED', 'Private worker file extension is invalid.', 400)
  }
  return extension
}

function isNodeErrorWithCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}
