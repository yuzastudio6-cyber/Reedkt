import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  assertNoPathTraversal,
  assertNoSignedUrlOrRawUrl,
  assertOutputPathInsideRoot,
  assertSourceNotOverwritten,
  safeJoinStoragePath,
  sanitizePathForLog,
} from '../media/media-path-safety'

export function assertAudioStorageReferenceIsPrivate(input: {
  storageObjectPath?: string
  localPath?: string
}): void {
  if (input.storageObjectPath) {
    assertNoSignedUrlOrRawUrl(input.storageObjectPath, 'audioStorageObjectPath')
    assertNoPathTraversal(input.storageObjectPath, 'audioStorageObjectPath')
  }
  if (input.localPath) {
    assertNoSignedUrlOrRawUrl(input.localPath, 'audioLocalPath')
    assertNoPathTraversal(input.localPath, 'audioLocalPath')
  }
}

export function resolveAudioOutputPath(input: {
  sourceAudioLocalPath: string
  outputAudioLocalPath: string
  safeOutputRoot: string
}): string {
  assertAudioStorageReferenceIsPrivate({ localPath: input.sourceAudioLocalPath })
  if (!existsSync(input.sourceAudioLocalPath)) {
    throw new Error(`Audio source is missing: ${sanitizePathForLog(input.sourceAudioLocalPath)}`)
  }
  const outputPath = assertOutputPathInsideRoot(input.outputAudioLocalPath, input.safeOutputRoot)
  assertSourceNotOverwritten(input.sourceAudioLocalPath, outputPath)
  return outputPath
}

export function buildAudioStoragePath(input: {
  workspaceId: string
  projectId: string
  mediaAssetId: string
  fileName: string
}): string {
  return safeJoinStoragePath(
    'workspaces',
    input.workspaceId,
    'projects',
    input.projectId,
    'media',
    input.mediaAssetId,
    'audio',
    input.fileName,
  )
}

export function sanitizeAudioPathForLog(localPath: string): string {
  return path.basename(localPath) || '[audio-path-hidden]'
}
