import { ApiError } from '../errors/api-error'
import type { UploadPurpose } from './storage-types'

const GB = 1024 * 1024 * 1024
const MB = 1024 * 1024

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
  'video/mp4': { maxBytes: 2 * GB },
  'video/quicktime': { maxBytes: 2 * GB },
  'video/webm': { maxBytes: 2 * GB },
  'audio/wav': { maxBytes: 500 * MB },
  'audio/mpeg': { maxBytes: 500 * MB },
  'audio/mp3': { maxBytes: 500 * MB },
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
  if (!UPLOAD_PURPOSES.includes(input.purpose)) {
    throw new ApiError('VALIDATION_FAILED', `Unsupported upload purpose: ${input.purpose}.`, 400)
  }

  const mimeRule = MIME_LIMITS[input.mimeType]
  if (!mimeRule) {
    throw new ApiError('VALIDATION_FAILED', `Unsupported upload MIME type: ${input.mimeType}.`, 400)
  }

  if (mimeRule.purposes && !mimeRule.purposes.includes(input.purpose)) {
    throw new ApiError('VALIDATION_FAILED', `${input.mimeType} is only allowed for worker_temp uploads.`, 400)
  }

  if (input.expectedSizeBytes !== undefined && input.expectedSizeBytes > mimeRule.maxBytes) {
    throw new ApiError('VALIDATION_FAILED', `Upload exceeds max size for ${input.mimeType}.`, 400, {
      maxBytes: mimeRule.maxBytes,
    })
  }
}

export function maxUploadBytesForMime(mimeType: string): number | undefined {
  return MIME_LIMITS[mimeType]?.maxBytes
}
