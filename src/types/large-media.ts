const KIB = 1024
const MIB = 1024 * KIB
const GIB = 1024 * MIB
const TIB = 1024 * GIB

/** Google Cloud Storage's provider ceiling. This is not ReEditPro's product limit. */
export const GCS_MAX_OBJECT_SIZE_BYTES = 5 * TIB

/**
 * High source ceiling for the current product contract. It intentionally
 * leaves operating headroom below the provider maximum and must still be
 * constrained by deployed workspace quotas and worker-capacity evidence.
 */
export const REEDITPRO_SOURCE_MEDIA_MAX_BYTES = 1 * TIB
export const REEDITPRO_REFERENCE_MEDIA_MAX_BYTES = 250 * GIB
export const REEDITPRO_SOURCE_AUDIO_MAX_BYTES = 50 * GIB
export const REEDITPRO_REFERENCE_IMAGE_MAX_BYTES = 50 * MIB

/** The development-only Express raw-body route remains deliberately small. */
export const REEDITPRO_LOCAL_RAW_UPLOAD_MAX_BYTES = 16 * MIB

/** Larger cloud uploads must use a recoverable resumable session. */
export const REEDITPRO_RESUMABLE_UPLOAD_THRESHOLD_BYTES = 16 * MIB
export const REEDITPRO_RESUMABLE_UPLOAD_MIN_CHUNK_BYTES = 8 * MIB
export const REEDITPRO_RESUMABLE_UPLOAD_CHUNK_BYTES = 32 * MIB
export const REEDITPRO_RESUMABLE_UPLOAD_CHUNK_ALIGNMENT_BYTES = 256 * KIB
export const REEDITPRO_RESUMABLE_UPLOAD_MAX_RETRIES = 5
export const GCS_RESUMABLE_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

export const REEDITPRO_ANALYSIS_PROXY_POLICY = {
  id: 'professional_1080p_analysis_proxy_v1',
  maxWidth: 1920,
  maxHeight: 1080,
  videoCodec: 'libx264',
  videoPreset: 'fast',
  videoCrf: 20,
  pixelFormat: 'yuv420p',
  audioCodec: 'aac',
  audioBitrate: '192k',
  finalRenderUsesOriginal: true,
} as const

export type TemporaryUploadProtocol = 'single_put' | 'gcs_resumable'

export function shouldUseResumableUpload(expectedSizeBytes: number | undefined): boolean {
  return typeof expectedSizeBytes === 'number' &&
    Number.isSafeInteger(expectedSizeBytes) &&
    expectedSizeBytes > REEDITPRO_RESUMABLE_UPLOAD_THRESHOLD_BYTES
}

export function assertValidResumableChunkSize(chunkSizeBytes: number): void {
  if (
    !Number.isSafeInteger(chunkSizeBytes) ||
    chunkSizeBytes < REEDITPRO_RESUMABLE_UPLOAD_MIN_CHUNK_BYTES ||
    chunkSizeBytes % REEDITPRO_RESUMABLE_UPLOAD_CHUNK_ALIGNMENT_BYTES !== 0
  ) {
    throw new Error(
      'Resumable upload chunk size must be at least 8 MiB and aligned to 256 KiB.',
    )
  }
}
