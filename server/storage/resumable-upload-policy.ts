import type { UploadPurpose } from './storage-types'

export const REEDITPRO_RESUMABLE_UPLOAD_THRESHOLD_BYTES = 64 * 1024 * 1024
export const REEDITPRO_RESUMABLE_UPLOAD_CHUNK_BYTES = 8 * 1024 * 1024
export const REEDITPRO_MAX_RESUMABLE_CHUNK_BYTES = 16 * 1024 * 1024
export const REEDITPRO_SINGLE_OBJECT_CAPABILITY_BYTES = 5 * 1024 ** 4
export const REEDITPRO_MANAGED_SEGMENT_BYTES = 4 * 1024 ** 4

export function requiresManagedSegmentedUpload(input: {
  purpose: UploadPurpose
  mimeType: string
  expectedSizeBytes?: number
}, singleObjectCapabilityBytes = REEDITPRO_SINGLE_OBJECT_CAPABILITY_BYTES): boolean {
  return input.mimeType.startsWith('video/')
    && ['source_media', 'reference_media'].includes(input.purpose)
    && Number.isSafeInteger(input.expectedSizeBytes)
    && (input.expectedSizeBytes ?? 0) > singleObjectCapabilityBytes
}

export function requiresResumableUpload(input: {
  purpose: UploadPurpose
  mimeType: string
  expectedSizeBytes?: number
}): boolean {
  return input.mimeType.startsWith('video/')
    && ['source_media', 'reference_media'].includes(input.purpose)
    && (input.expectedSizeBytes ?? 0) >= REEDITPRO_RESUMABLE_UPLOAD_THRESHOLD_BYTES
}
