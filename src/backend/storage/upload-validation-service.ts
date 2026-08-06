import type {
  UploadFileLike,
  UploadPurpose,
  UploadValidationContext,
  UploadValidationResult,
} from '../../types/upload'
import {
  REEDITPRO_REFERENCE_MEDIA_MAX_BYTES,
  REEDITPRO_REFERENCE_IMAGE_MAX_BYTES,
  REEDITPRO_SOURCE_AUDIO_MAX_BYTES,
  REEDITPRO_SOURCE_MEDIA_MAX_BYTES,
} from '../../types/large-media'

const MB = 1024 * 1024
const GB = 1024 * MB

const WEB_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
] as const
const PROFESSIONAL_SOURCE_VIDEO_MIME_TYPES = [
  ...WEB_VIDEO_MIME_TYPES,
  'video/x-m4v',
  'video/x-matroska',
  'video/x-msvideo',
  'video/mp2t',
  'application/mxf',
] as const
const ALL_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
] as const
const ALL_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

const MIME_BY_EXTENSION: Record<string, string> = {
  aac: 'audio/aac',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  avi: 'video/x-msvideo',
  m2ts: 'video/mp2t',
  m4v: 'video/x-m4v',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  mts: 'video/mp2t',
  mxf: 'application/mxf',
  png: 'image/png',
  ts: 'video/mp2t',
  wav: 'audio/wav',
  webm: 'video/webm',
  webp: 'image/webp',
}

const MAX_BYTES_BY_PURPOSE: Record<UploadPurpose, number> = {
  source_media: REEDITPRO_SOURCE_MEDIA_MAX_BYTES,
  reference_media: REEDITPRO_REFERENCE_MEDIA_MAX_BYTES,
  generated_asset: GB,
  processed_media: GB,
  preview: 2 * GB,
  export: 5 * GB,
  preview_render: 2 * GB,
  final_export: 5 * GB,
  thumbnail: 20 * MB,
  audio_asset: 200 * MB,
  profile_asset: 20 * MB,
  brand_asset: 20 * MB,
  qa_artifact: 500 * MB,
  worker_temp: 5 * GB,
}

const ALLOWED_MIME_BY_PURPOSE: Record<UploadPurpose, string[]> = {
  source_media: [...PROFESSIONAL_SOURCE_VIDEO_MIME_TYPES, ...ALL_AUDIO_MIME_TYPES],
  reference_media: [...PROFESSIONAL_SOURCE_VIDEO_MIME_TYPES, ...ALL_AUDIO_MIME_TYPES, ...ALL_IMAGE_MIME_TYPES],
  generated_asset: [...WEB_VIDEO_MIME_TYPES, ...ALL_AUDIO_MIME_TYPES, ...ALL_IMAGE_MIME_TYPES],
  processed_media: [...WEB_VIDEO_MIME_TYPES, ...ALL_AUDIO_MIME_TYPES, ...ALL_IMAGE_MIME_TYPES],
  preview: [...WEB_VIDEO_MIME_TYPES],
  export: [...WEB_VIDEO_MIME_TYPES],
  preview_render: [...WEB_VIDEO_MIME_TYPES],
  final_export: [...WEB_VIDEO_MIME_TYPES],
  thumbnail: [...ALL_IMAGE_MIME_TYPES],
  audio_asset: [...ALL_AUDIO_MIME_TYPES],
  profile_asset: [...ALL_IMAGE_MIME_TYPES],
  brand_asset: [...ALL_IMAGE_MIME_TYPES],
  qa_artifact: [...WEB_VIDEO_MIME_TYPES, ...ALL_AUDIO_MIME_TYPES, ...ALL_IMAGE_MIME_TYPES],
  worker_temp: ['application/octet-stream'],
}

const PROJECT_REQUIRED_PURPOSES = new Set<UploadPurpose>([
  'source_media',
  'reference_media',
  'generated_asset',
  'processed_media',
  'preview',
  'export',
  'preview_render',
  'final_export',
  'thumbnail',
  'audio_asset',
  'qa_artifact',
  'worker_temp',
])

export function getAllowedMimeTypesForPurpose(purpose: UploadPurpose): string[] {
  return [...ALLOWED_MIME_BY_PURPOSE[purpose]]
}

export function getMaxUploadBytesForPurpose(purpose: UploadPurpose): number {
  return MAX_BYTES_BY_PURPOSE[purpose]
}

export function validateUploadPurpose(purpose: UploadPurpose): UploadValidationResult {
  return {
    ok: true,
    status: 'valid',
    maxBytes: getMaxUploadBytesForPurpose(purpose),
    warnings: [],
    message: `${purpose} is a supported upload purpose.`,
  }
}

export function validateUploadFile(
  file: UploadFileLike | undefined | null,
  purpose: UploadPurpose,
  context: UploadValidationContext = {},
): UploadValidationResult {
  if (!file) {
    return createValidationResult(false, 'missing_file', purpose, {
      message: 'Choose a file before creating an upload plan.',
    })
  }

  const contextResult = validateUploadWorkspaceProjectContext(purpose, context)
  if (!contextResult.ok) return withFileDetails(contextResult, file)

  const mimeResult = validateUploadMimeType(purpose, file.type, file.name)
  if (!mimeResult.ok) return withFileDetails(mimeResult, file)

  const sizeResult = validateUploadFileSize(purpose, file.size, mimeResult.mimeType)
  if (!sizeResult.ok) return withFileDetails(sizeResult, file)

  return {
    ok: true,
    status: 'valid',
    maxBytes: sizeResult.maxBytes,
    fileSizeBytes: file.size ?? 0,
    mimeType: resolveMimeType(file.type, file.name),
    extension: extractExtension(file.name),
    warnings: contextResult.warnings,
    message: 'Upload file and context are valid for planning.',
  }
}

export function validateUploadMimeType(
  purpose: UploadPurpose,
  mimeType?: string,
  fileName?: string,
): UploadValidationResult {
  const resolvedMimeType = resolveMimeType(mimeType, fileName)
  const extension = extractExtension(fileName)
  const allowedMimeTypes = getAllowedMimeTypesForPurpose(purpose)

  if (!resolvedMimeType || !allowedMimeTypes.includes(resolvedMimeType)) {
    return createValidationResult(false, 'unsupported_type', purpose, {
      mimeType: resolvedMimeType,
      extension,
      message: `Unsupported file type for ${purpose}.`,
      warnings: [`Allowed MIME types: ${allowedMimeTypes.join(', ')}.`],
    })
  }

  return createValidationResult(true, 'valid', purpose, {
    mimeType: resolvedMimeType,
    extension,
    message: 'Upload MIME type is supported.',
  })
}

export function validateUploadFileSize(
  purpose: UploadPurpose,
  fileSizeBytes?: number,
  mimeType?: string,
): UploadValidationResult {
  const maxBytes = getMaxUploadBytesForFile(purpose, mimeType)

  if (typeof fileSizeBytes !== 'number' || Number.isNaN(fileSizeBytes) || fileSizeBytes <= 0) {
    return createValidationResult(false, 'missing_file', purpose, {
      message: 'Upload file size is missing or invalid.',
      maxBytes,
    })
  }

  if (fileSizeBytes > maxBytes) {
    return createValidationResult(false, 'too_large', purpose, {
      fileSizeBytes,
      message: `File is larger than the planning limit for ${purpose}.`,
      maxBytes,
    })
  }

  return createValidationResult(true, 'valid', purpose, {
    fileSizeBytes,
    message: 'Upload file size is within the planning limit.',
    maxBytes,
  })
}

export function validateUploadWorkspaceProjectContext(
  purpose: UploadPurpose,
  context: UploadValidationContext,
): UploadValidationResult {
  if (context.requiresAuth !== false && !context.userId) {
    return createValidationResult(false, 'requires_auth', purpose, {
      message: 'Sign in before creating an upload plan.',
    })
  }

  if (!context.workspaceId) {
    return createValidationResult(false, 'missing_workspace', purpose, {
      message: 'Workspace context is required before creating an upload plan.',
    })
  }

  if (PROJECT_REQUIRED_PURPOSES.has(purpose) && !context.projectId) {
    return createValidationResult(false, 'missing_project', purpose, {
      message: `${purpose} requires a project id.`,
    })
  }

  const warnings = purpose === 'profile_asset' || purpose === 'brand_asset'
    ? ['Workspace-only profile/brand paths are planned, but production writes may need backend signed uploads.']
    : []

  return createValidationResult(true, 'valid', purpose, {
    warnings,
    message: 'Upload workspace and project context are valid.',
  })
}

export function createUploadValidationSummary(result: UploadValidationResult): string {
  if (result.ok) return 'Upload validation passed.'
  if (result.status === 'requires_auth') return 'Upload planning requires a signed-in user.'
  if (result.status === 'missing_workspace') return 'Upload planning needs a current workspace.'
  if (result.status === 'missing_project') return 'This upload purpose needs a project.'
  if (result.status === 'too_large') return 'The file is larger than the planning limit.'
  if (result.status === 'unsupported_type') return 'The file type is not supported for this upload purpose.'
  return result.message
}

function resolveMimeType(mimeType?: string, fileName?: string): string | undefined {
  if (mimeType && mimeType.trim().length > 0) {
    const normalized = mimeType.trim().toLowerCase()
    if (normalized === 'audio/mp3') return 'audio/mpeg'
    if (normalized === 'video/mov') return 'video/quicktime'
    if (normalized === 'video/mxf' || normalized === 'application/x-mxf') return 'application/mxf'
    if (normalized === 'video/mkv' || normalized === 'application/x-matroska') return 'video/x-matroska'
    if (normalized === 'video/avi' || normalized === 'video/msvideo' || normalized === 'video/vnd.avi') return 'video/x-msvideo'
    if (normalized === 'video/x-mpeg2ts' || normalized === 'video/vnd.dlna.mpeg-tts') return 'video/mp2t'
    if (normalized !== 'application/octet-stream') return normalized
  }

  const extension = extractExtension(fileName)
  return extension ? MIME_BY_EXTENSION[extension] : undefined
}

function extractExtension(fileName?: string): string | undefined {
  const fileNameParts = fileName?.split('.')
  const extension = fileNameParts && fileNameParts.length > 1 ? fileNameParts.at(-1) : undefined
  return extension?.trim().toLowerCase()
}

function createValidationResult(
  ok: boolean,
  status: UploadValidationResult['status'],
  purpose: UploadPurpose,
  details: Partial<UploadValidationResult>,
): UploadValidationResult {
  return {
    ok,
    status,
    maxBytes: details.maxBytes ?? getMaxUploadBytesForPurpose(purpose),
    warnings: details.warnings ?? [],
    message: details.message ?? (ok ? 'Upload validation passed.' : 'Upload validation failed.'),
    fileSizeBytes: details.fileSizeBytes,
    mimeType: details.mimeType,
    extension: details.extension,
  }
}

function getMaxUploadBytesForFile(purpose: UploadPurpose, mimeType?: string): number {
  if (mimeType?.startsWith('audio/') && (purpose === 'source_media' || purpose === 'reference_media')) {
    return REEDITPRO_SOURCE_AUDIO_MAX_BYTES
  }
  if (mimeType?.startsWith('image/') && purpose === 'reference_media') {
    return REEDITPRO_REFERENCE_IMAGE_MAX_BYTES
  }
  if ((mimeType?.startsWith('video/') || mimeType === 'application/mxf') && purpose === 'reference_media') {
    return REEDITPRO_REFERENCE_MEDIA_MAX_BYTES
  }
  return getMaxUploadBytesForPurpose(purpose)
}

function withFileDetails(
  result: UploadValidationResult,
  file: UploadFileLike,
): UploadValidationResult {
  return {
    ...result,
    fileSizeBytes: typeof file.size === 'number' ? file.size : result.fileSizeBytes,
    mimeType: resolveMimeType(file.type, file.name) ?? result.mimeType,
    extension: extractExtension(file.name) ?? result.extension,
  }
}
