import type { UploadPurpose } from '../../types/upload'

export const REEDITPRO_STORAGE_BUCKETS = {
  sourceMedia: 'source-media',
  generatedAssets: 'generated-assets',
  processedMedia: 'processed-media',
  previews: 'previews',
  exports: 'exports',
  thumbnails: 'thumbnails',
  qaArtifacts: 'qa-artifacts',
  workerTemp: 'worker-temp',
} as const

export type ReeditProStorageBucketKey = keyof typeof REEDITPRO_STORAGE_BUCKETS
export type ReeditProStorageBucketName =
  (typeof REEDITPRO_STORAGE_BUCKETS)[ReeditProStorageBucketKey]

export const STORAGE_BUCKET_PURPOSE_MAP: Record<UploadPurpose, ReeditProStorageBucketName> = {
  source_media: REEDITPRO_STORAGE_BUCKETS.sourceMedia,
  reference_media: REEDITPRO_STORAGE_BUCKETS.sourceMedia,
  generated_asset: REEDITPRO_STORAGE_BUCKETS.generatedAssets,
  preview_render: REEDITPRO_STORAGE_BUCKETS.previews,
  final_export: REEDITPRO_STORAGE_BUCKETS.exports,
  thumbnail: REEDITPRO_STORAGE_BUCKETS.thumbnails,
  audio_asset: REEDITPRO_STORAGE_BUCKETS.generatedAssets,
  profile_asset: REEDITPRO_STORAGE_BUCKETS.thumbnails,
  brand_asset: REEDITPRO_STORAGE_BUCKETS.thumbnails,
}

const BACKEND_SIGNED_UPLOAD_PURPOSES = new Set<UploadPurpose>([
  'generated_asset',
  'preview_render',
  'final_export',
  'audio_asset',
  'profile_asset',
  'brand_asset',
])

export function getStorageBucketForUploadPurpose(
  purpose: UploadPurpose,
): ReeditProStorageBucketName {
  return STORAGE_BUCKET_PURPOSE_MAP[purpose]
}

export function getStorageBucketWarningsForUploadPurpose(purpose: UploadPurpose): string[] {
  if (purpose === 'reference_media') {
    return ['Reference uploads share the source-media bucket and are separated by object path.']
  }

  if (purpose === 'profile_asset' || purpose === 'brand_asset') {
    return [
      'Profile and brand asset planning maps to thumbnails for now; production use should prefer backend signed upload support.',
    ]
  }

  if (BACKEND_SIGNED_UPLOAD_PURPOSES.has(purpose)) {
    return [
      'This purpose may require a backend worker or signed upload route before production use.',
    ]
  }

  return []
}

export function uploadPurposePrefersBackendSignedUpload(purpose: UploadPurpose): boolean {
  return BACKEND_SIGNED_UPLOAD_PURPOSES.has(purpose)
}
