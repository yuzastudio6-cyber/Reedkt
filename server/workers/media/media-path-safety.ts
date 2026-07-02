import { existsSync } from 'node:fs'
import path from 'node:path'

const signedUrlNeedles = [
  'x-goog-signature=',
  'x-amz-signature=',
  'signature=',
  'signedurl',
  'signed_url',
]

export function isSignedUrlOrRawUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('signed://') ||
    signedUrlNeedles.some((needle) => normalized.includes(needle))
}

export function assertNoSignedUrlOrRawUrl(value: string, label: string): void {
  if (isSignedUrlOrRawUrl(value)) {
    throw new Error(`${label} must be a private storage/local reference, not a raw URL or signed URL.`)
  }
}

export function assertNoPathTraversal(value: string, label: string): void {
  const normalized = value.replace(/\\/g, '/')
  if (normalized.split('/').some((segment) => segment === '..') || normalized.includes('\0')) {
    throw new Error(`${label} must not contain path traversal segments.`)
  }
}

export function resolvePathInsideRoot(rootDir: string, targetPath: string): string {
  assertNoSignedUrlOrRawUrl(rootDir, 'rootDir')
  assertNoSignedUrlOrRawUrl(targetPath, 'targetPath')
  assertNoPathTraversal(targetPath, 'targetPath')

  const resolvedRoot = path.resolve(rootDir)
  const resolvedTarget = path.isAbsolute(targetPath)
    ? path.resolve(targetPath)
    : path.resolve(resolvedRoot, targetPath)
  const relative = path.relative(resolvedRoot, resolvedTarget)

  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Resolved path escapes the allowed root directory.')
  }

  return resolvedTarget
}

export function assertOutputPathInsideRoot(outputPath: string, safeOutputRoot: string): string {
  return resolvePathInsideRoot(safeOutputRoot, outputPath)
}

export function assertSourceNotOverwritten(sourcePath: string, outputPath: string): void {
  if (path.resolve(sourcePath) === path.resolve(outputPath)) {
    throw new Error('Media foundation output path must not overwrite source media.')
  }
}

export function assertExistingLocalFile(localFilePath: string): void {
  assertNoSignedUrlOrRawUrl(localFilePath, 'localFilePath')
  assertNoPathTraversal(localFilePath, 'localFilePath')

  if (!existsSync(localFilePath)) {
    throw new Error(`Media file is missing: ${sanitizePathForLog(localFilePath)}`)
  }
}

export function sanitizePathForLog(localPath: string): string {
  const baseName = path.basename(localPath)
  return baseName || '[path-hidden]'
}

export function safeJoinStoragePath(...parts: string[]): string {
  const cleaned = parts
    .map((part) => part.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)

  for (const part of cleaned) {
    assertNoSignedUrlOrRawUrl(part, 'storageObjectPath')
    assertNoPathTraversal(part, 'storageObjectPath')
  }

  return cleaned.join('/')
}
