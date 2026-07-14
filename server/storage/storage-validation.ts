import { ApiError } from '../errors/api-error'
import type { UploadPurpose } from './storage-types'
import {
  REEDITPRO_LOCAL_RAW_UPLOAD_MAX_BYTES,
  REEDITPRO_REFERENCE_IMAGE_MAX_BYTES,
  REEDITPRO_REFERENCE_MEDIA_MAX_BYTES,
  REEDITPRO_SOURCE_AUDIO_MAX_BYTES,
  REEDITPRO_SOURCE_MEDIA_MAX_BYTES,
} from '../../src/types/large-media'

const GB = 1024 * 1024 * 1024
const MB = 1024 * 1024
const NON_SOURCE_VIDEO_MAX_BYTES = 2 * GB
const NON_SOURCE_AUDIO_MAX_BYTES = 500 * MB
const SOURCE_REFERENCE_PURPOSES: UploadPurpose[] = ['source_media', 'reference_media']

// This cap applies only to the non-production Express raw-body compatibility
// route. Large media must use a signed/direct object-storage upload target so
// the API process never buffers multi-gigabyte bodies in memory.
export const LOCAL_RAW_UPLOAD_MAX_BYTES = REEDITPRO_LOCAL_RAW_UPLOAD_MAX_BYTES

export const UPLOAD_PURPOSES: UploadPurpose[] = [
  'source_media',
  'reference_media',
  'generated_asset',
  'processed_media',
  'preview',
  'export',
  'thumbnail',
  'qa_artifact',
  'worker_temp',
]

const MIME_LIMITS: Record<string, { maxBytes: number; purposes?: UploadPurpose[] }> = {
  'video/mp4': { maxBytes: NON_SOURCE_VIDEO_MAX_BYTES },
  'video/quicktime': { maxBytes: NON_SOURCE_VIDEO_MAX_BYTES },
  'video/webm': { maxBytes: NON_SOURCE_VIDEO_MAX_BYTES },
  'video/x-m4v': { maxBytes: NON_SOURCE_VIDEO_MAX_BYTES, purposes: SOURCE_REFERENCE_PURPOSES },
  'video/x-matroska': { maxBytes: NON_SOURCE_VIDEO_MAX_BYTES, purposes: SOURCE_REFERENCE_PURPOSES },
  'video/x-msvideo': { maxBytes: NON_SOURCE_VIDEO_MAX_BYTES, purposes: SOURCE_REFERENCE_PURPOSES },
  'video/mp2t': { maxBytes: NON_SOURCE_VIDEO_MAX_BYTES, purposes: SOURCE_REFERENCE_PURPOSES },
  'application/mxf': { maxBytes: NON_SOURCE_VIDEO_MAX_BYTES, purposes: SOURCE_REFERENCE_PURPOSES },
  'audio/wav': { maxBytes: NON_SOURCE_AUDIO_MAX_BYTES },
  'audio/x-wav': { maxBytes: NON_SOURCE_AUDIO_MAX_BYTES },
  'audio/mpeg': { maxBytes: NON_SOURCE_AUDIO_MAX_BYTES },
  'audio/mp3': { maxBytes: NON_SOURCE_AUDIO_MAX_BYTES },
  'audio/aac': { maxBytes: NON_SOURCE_AUDIO_MAX_BYTES },
  'image/png': { maxBytes: 50 * MB },
  'image/jpeg': { maxBytes: 50 * MB },
  'image/webp': { maxBytes: 50 * MB },
  'application/octet-stream': { maxBytes: 5 * GB, purposes: ['worker_temp'] },
}

export function assertAllowedUpload(input: {
  purpose: UploadPurpose
  mimeType: string
  expectedSizeBytes?: number
}): void {
  const mimeType = normalizeAllowedUploadMimeType(input.mimeType)
  if (!UPLOAD_PURPOSES.includes(input.purpose)) {
    throw new ApiError('VALIDATION_FAILED', `Unsupported upload purpose: ${input.purpose}.`, 400)
  }

  if (
    (input.purpose === 'source_media' || input.purpose === 'reference_media') &&
    (!Number.isSafeInteger(input.expectedSizeBytes) || (input.expectedSizeBytes ?? 0) <= 0)
  ) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Source and reference uploads require an exact positive expected byte size.',
      400,
    )
  }

  const mimeRule = MIME_LIMITS[mimeType]
  if (!mimeRule) {
    throw new ApiError('VALIDATION_FAILED', `Unsupported upload MIME type: ${mimeType}.`, 400)
  }

  if (mimeRule.purposes && !mimeRule.purposes.includes(input.purpose)) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `${mimeType} is not allowed for ${input.purpose} uploads.`,
      400,
    )
  }

  if (input.purpose === 'source_media' && !isVideoOrAudioMime(mimeType)) {
    throw new ApiError('VALIDATION_FAILED', 'Source media uploads must be video or audio.', 400)
  }
  if (input.purpose === 'reference_media' && !isVideoAudioOrImageMime(mimeType)) {
    throw new ApiError('VALIDATION_FAILED', 'Reference media uploads must be video, audio, or image.', 400)
  }

  const maxBytes = maxUploadBytesForPurposeAndMime(input.purpose, mimeType)
  if (input.expectedSizeBytes !== undefined && input.expectedSizeBytes > maxBytes) {
    throw new ApiError('VALIDATION_FAILED', `Upload exceeds max size for ${mimeType}.`, 400, {
      maxBytes,
    })
  }
}

export function maxUploadBytesForMime(mimeType: string, purpose: UploadPurpose = 'source_media'): number | undefined {
  const normalizedMimeType = normalizeAllowedUploadMimeType(mimeType)
  return MIME_LIMITS[normalizedMimeType]
    ? maxUploadBytesForPurposeAndMime(purpose, normalizedMimeType)
    : undefined
}

export function normalizeAllowedUploadMimeType(mimeType: string): string {
  const normalized = mimeType.trim().toLowerCase()
  if (normalized === 'audio/mp3') return 'audio/mpeg'
  if (normalized === 'video/mov') return 'video/quicktime'
  if (normalized === 'video/mxf' || normalized === 'application/x-mxf') return 'application/mxf'
  if (normalized === 'video/mkv' || normalized === 'application/x-matroska') return 'video/x-matroska'
  if (normalized === 'video/avi' || normalized === 'video/msvideo' || normalized === 'video/vnd.avi') {
    return 'video/x-msvideo'
  }
  if (normalized === 'video/x-mpeg2ts' || normalized === 'video/vnd.dlna.mpeg-tts') return 'video/mp2t'
  return normalized
}

function maxUploadBytesForPurposeAndMime(purpose: UploadPurpose, mimeType: string): number {
  const mimeRule = MIME_LIMITS[mimeType]
  if (!mimeRule) return 0
  if (isVideoMime(mimeType)) {
    if (purpose === 'reference_media') return REEDITPRO_REFERENCE_MEDIA_MAX_BYTES
    if (purpose === 'source_media') return REEDITPRO_SOURCE_MEDIA_MAX_BYTES
  }
  if (mimeType.startsWith('audio/')) {
    if (purpose === 'source_media' || purpose === 'reference_media') {
      return REEDITPRO_SOURCE_AUDIO_MAX_BYTES
    }
    return mimeRule.maxBytes
  }
  if (purpose === 'reference_media' && mimeType.startsWith('image/')) {
    return REEDITPRO_REFERENCE_IMAGE_MAX_BYTES
  }
  return mimeRule.maxBytes
}

function isVideoOrAudioMime(mimeType: string): boolean {
  return isVideoMime(mimeType) || mimeType.startsWith('audio/')
}

function isVideoAudioOrImageMime(mimeType: string): boolean {
  return isVideoOrAudioMime(mimeType) || mimeType.startsWith('image/')
}

function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith('video/') || mimeType === 'application/mxf'
}

export function assertLocalRawUploadByteLength(byteLength: number): void {
  if (!Number.isSafeInteger(byteLength) || byteLength <= 0) {
    throw new ApiError('VALIDATION_FAILED', 'Local raw upload Content-Length must be a positive integer.', 411)
  }

  if (byteLength > LOCAL_RAW_UPLOAD_MAX_BYTES) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Local raw upload exceeds the bounded development-route limit. Use the signed/direct object-storage upload target for larger media.',
      413,
      { maxBytes: LOCAL_RAW_UPLOAD_MAX_BYTES },
    )
  }
}
