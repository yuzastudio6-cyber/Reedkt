import { createHash, randomUUID } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import type { Readable } from 'node:stream'

import { ApiError } from '../errors/api-error'
import {
  removePrivateDirectoryTreeWithinRoot,
  writePrivateStreamCreateOnlyWithinRoot,
} from '../security/private-local-persistence'
import { sanitizeFileName } from '../storage/storage-paths'

const SOURCE_PROBE_STAGE_VERSION = 'private-source-probe-v1'
const SOURCE_PROBE_STAGE_ROOT = 'upload-probes'
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/
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
}): Promise<PrivateSourceProbeStage> {
  assertStageInput(input)

  const localStorageRoot = input.localStorageRoot.trim()
  const relativeDirectory = privateSourceProbeAttemptRelativeDirectory(input.scope)
  const relativePath = `${relativeDirectory}/${sanitizeFileName(input.originalFileName)}`
  const cleanupRoot = resolve(localStorageRoot, relativeDirectory)
  let cleanupComplete = false
  const cleanup = async (): Promise<void> => {
    if (cleanupComplete) return
    try {
      await removePrivateDirectoryTreeWithinRoot({
        rootPath: localStorageRoot,
        relativePath: relativeDirectory,
      })
    } catch (error) {
      throw stagingError('source_probe_stage_cleanup_failed', undefined, error)
    }
    cleanupComplete = true
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
    SOURCE_PROBE_STAGE_VERSION,
    requireScopeValue(scope.ownerUserId, 'ownerUserId'),
    requireScopeValue(scope.workspaceId, 'workspaceId'),
    requireScopeValue(scope.projectId, 'projectId'),
    requireScopeValue(scope.uploadIntentId, 'uploadIntentId'),
  ]
  return createHash('sha256').update(values.join('\u0000')).digest('hex')
}

function privateSourceProbeAttemptRelativeDirectory(scope: PrivateSourceProbeStageScope): string {
  return `${SOURCE_PROBE_STAGE_ROOT}/${SOURCE_PROBE_STAGE_VERSION}/${privateSourceProbeScopeHash(scope)}/${randomUUID()}`
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
