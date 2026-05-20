import type { UploadPurpose } from '../../types/upload'

export interface StoragePathBuildInput {
  workspaceId: string
  projectId?: string
  assetId: string
  fileName: string
  userId?: string
}

const DEFAULT_FILE_NAME = 'upload.bin'

function cleanPathSegment(value: string): string {
  return value
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .filter(Boolean)
    .join('-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
}

export function sanitizeStorageFileName(fileName?: string | null): string {
  if (!fileName) return DEFAULT_FILE_NAME

  const sanitized = cleanPathSegment(fileName)
  return sanitized.length > 0 ? sanitized : DEFAULT_FILE_NAME
}

export function createStorageObjectKey(parts: Array<string | undefined | null>): string {
  return parts
    .map((part) => (part ? cleanPathSegment(part) : undefined))
    .filter((part): part is string => Boolean(part))
    .join('/')
}

export function buildWorkspaceStoragePrefix(workspaceId: string): string {
  return createStorageObjectKey(['workspace', workspaceId])
}

export function buildProjectStoragePrefix(workspaceId: string, projectId: string): string {
  return createStorageObjectKey(['workspace', workspaceId, 'project', projectId])
}

export function buildSourceMediaPath(input: StoragePathBuildInput): string {
  return buildProjectAssetPath(input, 'source')
}

export function buildReferenceMediaPath(input: StoragePathBuildInput): string {
  return buildProjectAssetPath(input, 'reference')
}

export function buildGeneratedAssetPath(input: StoragePathBuildInput): string {
  return buildProjectAssetPath(input, 'generated')
}

export function buildPreviewRenderPath(input: StoragePathBuildInput): string {
  return buildProjectAssetPath(input, 'previews')
}

export function buildFinalExportPath(input: StoragePathBuildInput): string {
  return buildProjectAssetPath(input, 'exports')
}

export function buildThumbnailPath(input: StoragePathBuildInput): string {
  return buildProjectAssetPath(input, 'thumbnails')
}

export function buildAudioAssetPath(input: StoragePathBuildInput): string {
  return buildProjectAssetPath(input, 'audio')
}

export function buildProfileAssetPath(input: StoragePathBuildInput): string {
  return createStorageObjectKey([
    'workspace',
    input.workspaceId,
    'profile',
    input.userId ?? input.assetId,
    sanitizeStorageFileName(input.fileName),
  ])
}

export function buildBrandAssetPath(input: StoragePathBuildInput): string {
  return createStorageObjectKey([
    'workspace',
    input.workspaceId,
    'brand',
    input.assetId,
    sanitizeStorageFileName(input.fileName),
  ])
}

export function buildStoragePathForUploadPurpose(
  purpose: UploadPurpose,
  input: StoragePathBuildInput,
): string {
  switch (purpose) {
    case 'source_media':
      return buildSourceMediaPath(input)
    case 'reference_media':
      return buildReferenceMediaPath(input)
    case 'generated_asset':
      return buildGeneratedAssetPath(input)
    case 'preview_render':
      return buildPreviewRenderPath(input)
    case 'final_export':
      return buildFinalExportPath(input)
    case 'thumbnail':
      return buildThumbnailPath(input)
    case 'audio_asset':
      return buildAudioAssetPath(input)
    case 'profile_asset':
      return buildProfileAssetPath(input)
    case 'brand_asset':
      return buildBrandAssetPath(input)
  }
}

function buildProjectAssetPath(input: StoragePathBuildInput, folder: string): string {
  if (!input.projectId) {
    return createStorageObjectKey([
      'workspace',
      input.workspaceId,
      folder,
      input.assetId,
      sanitizeStorageFileName(input.fileName),
    ])
  }

  return createStorageObjectKey([
    'workspace',
    input.workspaceId,
    'project',
    input.projectId,
    folder,
    input.assetId,
    sanitizeStorageFileName(input.fileName),
  ])
}
