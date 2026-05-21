import path from 'node:path'
import { ApiError } from '../errors/api-error'
import { normalizeStoragePath } from '../storage/storage-paths'

export function resolveLocalStorageObjectPath(rootDir: string, bucketName: string, objectPath: string): string {
  const absoluteRoot = path.resolve(rootDir)
  const absolutePath = path.resolve(
    absoluteRoot,
    normalizeStoragePath(bucketName),
    normalizeStoragePath(objectPath),
  )

  if (!absolutePath.startsWith(absoluteRoot + path.sep)) {
    throw new ApiError('VALIDATION_FAILED', 'Local media path escapes local storage root.', 400)
  }

  return absolutePath
}

export function assertPathInsideRoot(rootDir: string, targetPath: string): string {
  const absoluteRoot = path.resolve(rootDir)
  const absolutePath = path.resolve(targetPath)
  if (!absolutePath.startsWith(absoluteRoot + path.sep)) {
    throw new ApiError('VALIDATION_FAILED', 'Media output path escapes local storage root.', 400)
  }

  return absolutePath
}
