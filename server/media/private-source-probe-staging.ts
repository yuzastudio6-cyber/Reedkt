import { createHash, randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import type { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import {
  createPrivateDirectoryCreateOnlyWithinRoot,
  removePrivateDirectoryTreeWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
  type PrivateDirectoryIdentity,
} from '../security/private-local-persistence'
import { sanitizeFileName } from '../storage/storage-paths'
import {
  PRIVATE_SOURCE_PROBE_ATTEMPT_ID_PATTERN,
  PRIVATE_SOURCE_PROBE_STAGE_VERSION,
  privateSourceProbeAttemptRelativeDirectory,
} from './private-source-probe-paths'

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/
const MAX_ATTEMPT_DIRECTORY_COLLISIONS = 8
const TERMINAL_INTEGRITY_REASONS = new Set([
  'source_probe_stage_size_invalid',
  'source_probe_stage_checksum_invalid',
  'source_probe_stage_size_mismatch',
  'source_probe_stage_checksum_mismatch',
])

export interface PrivateSourceProbeStageScope {
  ownerUserId: string
  workspaceId: string
  projectId: string
  uploadIntentId: string
}

export interface PrivateSourceProbeStage {
  inputPath: string
  byteLength: number
  checksumSha256: string
  cleanup(): Promise<void>
}

export async function stagePrivateSourceForProbe(input: {
  localStorageRoot: string
  scope: PrivateSourceProbeStageScope
  originalFileName: string
  expectedSizeBytes: number
  expectedChecksumSha256: string
  openStream: () => Promise<Readable>
  attemptIdFactory?: () => string
}): Promise<PrivateSourceProbeStage> {
  assertStageInput(input)

  const localStorageRoot = input.localStorageRoot.trim()
  const scopeHash = privateSourceProbeScopeHash(input.scope)
  const ownedAttempt = await createOwnedPrivateSourceProbeAttempt({
    localStorageRoot,
    scopeHash,
    attemptIdFactory: input.attemptIdFactory ?? randomUUID,
  })
  const relativeDirectory = ownedAttempt.relativeDirectory
  const relativePath = `${relativeDirectory}/${sanitizeFileName(input.originalFileName)}`
  const cleanupRoot = resolve(localStorageRoot, relativeDirectory)
  let cleanupComplete = false
  let cleanupInFlight: Promise<void> | undefined
  try {
    registerActivePrivateSourceProbeAttempt(localStorageRoot, relativeDirectory, ownedAttempt.identity)
  } catch (error) {
    const normalizedError = normalizeStagingError(error, input.expectedSizeBytes)
    try {
      await removePrivateDirectoryTreeWithinRoot({
        rootPath: localStorageRoot,
        relativePath: relativeDirectory,
        expectedIdentity: ownedAttempt.identity,
      })
    } catch (cleanupError) {
      throw privateSourceProbeStageErrorWithCleanupFailure(normalizedError, cleanupError)
    }
    throw normalizedError
  }
  const cleanup = (): Promise<void> => {
    if (cleanupComplete) return Promise.resolve()
    if (cleanupInFlight) return cleanupInFlight
    const action = (async (): Promise<void> => {
      try {
        await removePrivateDirectoryTreeWithinRoot({
          rootPath: localStorageRoot,
          relativePath: relativeDirectory,
          expectedIdentity: ownedAttempt.identity,
        })
        cleanupComplete = true
      } catch (error) {
        throw stagingError('source_probe_stage_cleanup_failed', undefined, error)
      } finally {
        unregisterActivePrivateSourceProbeAttempt(localStorageRoot, relativeDirectory, ownedAttempt.identity)
        if (!cleanupComplete) cleanupInFlight = undefined
      }
    })()
    cleanupInFlight = action
    return action
  }

  try {
    const stream = await input.openStream()
    const staged = await writePrivateStreamCreateOnlyWithinRoot({
      rootPath: localStorageRoot,
      relativePath,
      stream,
      maximumBytes: input.expectedSizeBytes,
    })
    if (dirname(staged.absolutePath) !== cleanupRoot) {
      throw stagingError('source_probe_stage_path_mismatch')
    }
    if (staged.byteLength !== input.expectedSizeBytes) {
      throw stagingError('source_probe_stage_size_mismatch', {
        expectedSizeBytes: input.expectedSizeBytes,
        actualSizeBytes: staged.byteLength,
      })
    }
    if (staged.checksumSha256 !== input.expectedChecksumSha256) {
      throw stagingError('source_probe_stage_checksum_mismatch', {
        expectedChecksumSha256: input.expectedChecksumSha256,
        actualChecksumSha256: staged.checksumSha256,
      })
    }

    return {
      inputPath: staged.absolutePath,
      byteLength: staged.byteLength,
      checksumSha256: staged.checksumSha256,
      cleanup,
    }
  } catch (error) {
    const normalizedError = normalizeStagingError(error, input.expectedSizeBytes)
    try {
      await cleanup()
    } catch (cleanupError) {
      throw privateSourceProbeStageErrorWithCleanupFailure(normalizedError, cleanupError)
    }
    throw normalizedError
  }
}

export function isPrivateSourceProbeStagingError(error: unknown): error is ApiError {
  if (!(error instanceof ApiError) || error.code !== 'UPLOAD_NOT_FINALIZED') return false
  const details = error.details
  if (!details || typeof details !== 'object' || !('reason' in details)) return false
  return typeof details.reason === 'string' && details.reason.startsWith('source_probe_stage_')
}

export function isPrivateSourceProbeTerminalIntegrityError(error: unknown): error is ApiError {
  if (!isPrivateSourceProbeStagingError(error)) return false
  const details = error.details as { reason: string }
  return TERMINAL_INTEGRITY_REASONS.has(details.reason)
}

export function privateSourceProbeStageErrorWithCleanupFailure(
  stagingFailure: ApiError,
  cleanupFailure: unknown,
): ApiError {
  if (isPrivateSourceProbeTerminalIntegrityError(stagingFailure)) {
    const details = stagingFailure.details as Record<string, unknown>
    return stagingError(details.reason as string, {
      ...details,
      cleanupFailureReason: stagingReason(cleanupFailure),
    }, cleanupFailure)
  }
  if (isPrivateSourceProbeStagingError(cleanupFailure)) return cleanupFailure
  return stagingError('source_probe_stage_cleanup_failed', undefined, cleanupFailure)
}

export function privateSourceProbeScopeHash(scope: PrivateSourceProbeStageScope): string {
  const values = [
    PRIVATE_SOURCE_PROBE_STAGE_VERSION,
    requireScopeValue(scope.ownerUserId, 'ownerUserId'),
    requireScopeValue(scope.workspaceId, 'workspaceId'),
    requireScopeValue(scope.projectId, 'projectId'),
    requireScopeValue(scope.uploadIntentId, 'uploadIntentId'),
  ]
  return createHash('sha256').update(values.join('\u0000')).digest('hex')
}

export function isPrivateSourceProbeAttemptActive(input: {
  localStorageRoot: string
  relativeDirectory: string
  identity: PrivateDirectoryIdentity
}): boolean {
  const active = activePrivateSourceProbeAttempts.get(privateSourceProbeAttemptKey(
    input.localStorageRoot,
    input.relativeDirectory,
  ))
  return Boolean(
    active
    && active.device === input.identity.device
    && active.inode === input.identity.inode,
  )
}

function assertStageInput(input: {
  localStorageRoot: string
  scope: PrivateSourceProbeStageScope
  expectedSizeBytes: number
  expectedChecksumSha256: string
}): void {
  if (!input.localStorageRoot.trim()) {
    throw stagingError('source_probe_stage_root_required')
  }
  privateSourceProbeScopeHash(input.scope)
  if (!Number.isSafeInteger(input.expectedSizeBytes) || input.expectedSizeBytes <= 0) {
    throw stagingError('source_probe_stage_size_invalid')
  }
  if (!SHA256_HEX_PATTERN.test(input.expectedChecksumSha256)) {
    throw stagingError('source_probe_stage_checksum_invalid')
  }
}

function requireScopeValue(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) {
    throw stagingError('source_probe_stage_scope_invalid', { field })
  }
  return normalized
}

function stagingError(reason: string, details?: Record<string, unknown>, cause?: unknown): ApiError {
  return new ApiError(
    'UPLOAD_NOT_FINALIZED',
    'Source media could not be safely staged for metadata probing.',
    409,
    { reason, ...details },
    cause === undefined ? {} : { cause },
  )
}

function isPrivateStreamByteCeilingError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.code !== 'VALIDATION_FAILED' || error.status !== 413) return false
  const details = error.details
  return Boolean(details && typeof details === 'object' && 'maximumBytes' in details)
}

function normalizeStagingError(error: unknown, expectedSizeBytes: number): ApiError {
  if (isPrivateSourceProbeStagingError(error)) return error
  if (isPrivateStreamByteCeilingError(error)) {
    return stagingError('source_probe_stage_size_mismatch', {
      expectedSizeBytes,
      actualSizeBytes: 'greater_than_expected',
    }, error)
  }
  return stagingError('source_probe_stage_failed', undefined, error)
}

function stagingReason(error: unknown): string {
  if (!isPrivateSourceProbeStagingError(error)) return 'source_probe_stage_cleanup_failed'
  return (error.details as { reason: string }).reason
}

const activePrivateSourceProbeAttempts = new Map<string, PrivateDirectoryIdentity>()

async function createOwnedPrivateSourceProbeAttempt(input: {
  localStorageRoot: string
  scopeHash: string
  attemptIdFactory: () => string
}): Promise<{ relativeDirectory: string; identity: PrivateDirectoryIdentity }> {
  for (let attempt = 0; attempt < MAX_ATTEMPT_DIRECTORY_COLLISIONS; attempt += 1) {
    const attemptId = input.attemptIdFactory()
    if (!PRIVATE_SOURCE_PROBE_ATTEMPT_ID_PATTERN.test(attemptId)) {
      throw stagingError('source_probe_stage_attempt_id_invalid')
    }
    const relativeDirectory = privateSourceProbeAttemptRelativeDirectory(input.scopeHash, attemptId)
    try {
      const created = await createPrivateDirectoryCreateOnlyWithinRoot({
        rootPath: input.localStorageRoot,
        relativePath: relativeDirectory,
      })
      return { relativeDirectory, identity: created.identity }
    } catch (error) {
      if (isPrivateDirectoryCreateCollision(error)) continue
      throw stagingError('source_probe_stage_failed', undefined, error)
    }
  }
  throw stagingError('source_probe_stage_attempt_collision_limit')
}

function registerActivePrivateSourceProbeAttempt(
  localStorageRoot: string,
  relativeDirectory: string,
  identity: PrivateDirectoryIdentity,
): void {
  const key = privateSourceProbeAttemptKey(localStorageRoot, relativeDirectory)
  if (activePrivateSourceProbeAttempts.has(key)) {
    throw stagingError('source_probe_stage_active_attempt_collision')
  }
  activePrivateSourceProbeAttempts.set(key, identity)
}

function unregisterActivePrivateSourceProbeAttempt(
  localStorageRoot: string,
  relativeDirectory: string,
  identity: PrivateDirectoryIdentity,
): void {
  const key = privateSourceProbeAttemptKey(localStorageRoot, relativeDirectory)
  const active = activePrivateSourceProbeAttempts.get(key)
  if (active?.device === identity.device && active.inode === identity.inode) {
    activePrivateSourceProbeAttempts.delete(key)
  }
}

function privateSourceProbeAttemptKey(localStorageRoot: string, relativeDirectory: string): string {
  return createHash('sha256').update([
    resolve(localStorageRoot),
    relativeDirectory,
  ].join('\u0000')).digest('hex')
}

function isPrivateDirectoryCreateCollision(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.code !== 'IDEMPOTENCY_CONFLICT') return false
  const details = error.details
  return Boolean(
    details
    && typeof details === 'object'
    && 'reason' in details
    && details.reason === 'private_directory_create_only_collision',
  )
}
