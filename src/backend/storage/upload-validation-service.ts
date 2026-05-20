import type {
  UploadFileLike,
  UploadPurpose,
  UploadValidationContext,
  UploadValidationResult,
} from '../../types/upload'

const MB = 1024 * 1024
const GB = 1024 * MB

const ALL_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const
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
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  png: 'image/png',
  wav: 'audio/wav',
  webm: 'video/webm',
  webp: 'image/webp',
}

const MAX_BYTES_BY_PURPOSE: Record<UploadPurpose, number> = {
  source_media: 2 * GB,
  reference_media: GB,
  generated_asset: GB,
  preview_render: 2 * GB,
  final_export: 5 * GB,
  thumbnail: 20 * MB,
  audio_asset: 200 * MB,
  profile_asset: 20 * MB,
  brand_asset: 20 * MB,
}

const ALLOWED_MIME_BY_PURPOSE: Record<UploadPurpose, string[]> = {
  source_media: [...ALL_VIDEO_MIME_TYPES, ...ALL_AUDIO_MIME_TYPES],
  reference_media: [...ALL_VIDEO_MIME_TYPES, ...ALL_AUDIO_MIME_TYPES, ...ALL_IMAGE_MIME_TYPES],
  generated_asset: [...ALL_VIDEO_MIME_TYPES, ...ALL_AUDIO_MIME_TYPES, ...ALL_IMAGE_MIME_TYPES],
  preview_render: [...ALL_VIDEO_MIME_TYPES],
  final_export: [...ALL_VIDEO_MIME_TYPES],
  thumbnail: [...ALL_IMAGE_MIME_TYPES],
  audio_asset: [...ALL_AUDIO_MIME_TYPES],
  profile_asset: [...ALL_IMAGE_MIME_TYPES],
  brand_asset: [...ALL_IMAGE_MIME_TYPES],
}

const PROJECT_REQUIRED_PURPOSES = new Set<UploadPurpose>([
  'source_media',
  'reference_media',
  'generated_asset',
  'preview_render',
  'final_export',
  'thumbnail',
  'audio_asset',
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

  const sizeResult = validateUploadFileSize(purpose, file.size)
  if (!sizeResult.ok) return withFileDetails(sizeResult, file)

  return {
    ok: true,
    status: 'valid',
    maxBytes: getMaxUploadBytesForPurpose(purpose),
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
): UploadValidationResult {
  const maxBytes = getMaxUploadBytesForPurpose(purpose)

  if (typeof fileSizeBytes !== 'number' || Number.isNaN(fileSizeBytes) || fileSizeBytes <= 0) {
    return createValidationResult(false, 'missing_file', purpose, {
      message: 'Upload file size is missing or invalid.',
    })
  }

  if (fileSizeBytes > maxBytes) {
    return createValidationResult(false, 'too_large', purpose, {
      fileSizeBytes,
      message: `File is larger than the planning limit for ${purpose}.`,
    })
  }

  return createValidationResult(true, 'valid', purpose, {
    fileSizeBytes,
    message: 'Upload file size is within the planning limit.',
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
    return normalized === 'audio/mp3' ? 'audio/mpeg' : normalized
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
    maxBytes: getMaxUploadBytesForPurpose(purpose),
    warnings: details.warnings ?? [],
    message: details.message ?? (ok ? 'Upload validation passed.' : 'Upload validation failed.'),
    fileSizeBytes: details.fileSizeBytes,
    mimeType: details.mimeType,
    extension: details.extension,
  }
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
