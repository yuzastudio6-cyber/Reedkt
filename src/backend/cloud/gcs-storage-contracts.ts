import type { ID, JSONObject } from '../../types/shared'
import {
  cloudValidationResult,
  hasNonEmptyString,
  inspectForSecretLikeValues,
  looksLikeSignedUrl,
} from './cloud-runtime-contracts'
import type { CloudValidationResult } from './cloud-runtime-contracts'

export type GcsBucketPurpose =
  | 'source_media'
  | 'generated_assets'
  | 'processed_media'
  | 'previews'
  | 'exports'
  | 'thumbnails'
  | 'qa_artifacts'
  | 'worker_temp'

export interface GcsObjectLocation {
  bucketPurpose: GcsBucketPurpose
  bucketName: string
  objectPath: string
  contentType?: string
  generation?: string
  sizeBytes?: number
  checksum?: string
  signedUrlRequired: boolean
  publicUrlAllowed?: boolean
  createdByJobId?: ID
  metadata?: JSONObject
}

export const GCS_BUCKET_PURPOSES: GcsBucketPurpose[] = [
  'source_media',
  'generated_assets',
  'processed_media',
  'previews',
  'exports',
  'thumbnails',
  'qa_artifacts',
  'worker_temp',
]

export const GCS_WORKSPACE_PROJECT_PATH_CONVENTION =
  'workspaces/{workspaceId}/projects/{projectId}/...'

export const GCS_OBJECT_PATH_EXAMPLES: Record<GcsBucketPurpose, string> = {
  source_media: 'workspaces/ws_fake_001/projects/prj_fake_001/source-media/src_clip_001.mov',
  generated_assets: 'workspaces/ws_fake_001/projects/prj_fake_001/generated-assets/images/asset_img_001.png',
  processed_media: 'workspaces/ws_fake_001/projects/prj_fake_001/processed-media/audio/dialogue_clean_001.wav',
  previews: 'workspaces/ws_fake_001/projects/prj_fake_001/previews/render_preview_001.mp4',
  exports: 'workspaces/ws_fake_001/projects/prj_fake_001/exports/final_export_001.mp4',
  thumbnails: 'workspaces/ws_fake_001/projects/prj_fake_001/thumbnails/thumb_001.jpg',
  qa_artifacts: 'workspaces/ws_fake_001/projects/prj_fake_001/qa-artifacts/qa_report_frames_001.json',
  worker_temp: 'workspaces/ws_fake_001/projects/prj_fake_001/worker-temp/job_fake_001/intermediate.wav',
}

export const GCS_BUCKET_NAME_EXAMPLES: Record<GcsBucketPurpose, string> = {
  source_media: 'reeditpro-prod-source-media',
  generated_assets: 'reeditpro-prod-generated-assets',
  processed_media: 'reeditpro-prod-processed-media',
  previews: 'reeditpro-prod-previews',
  exports: 'reeditpro-prod-exports',
  thumbnails: 'reeditpro-prod-thumbnails',
  qa_artifacts: 'reeditpro-prod-qa-artifacts',
  worker_temp: 'reeditpro-prod-worker-temp',
}

const NEVER_PUBLIC_BUCKET_PURPOSES: GcsBucketPurpose[] = [
  'source_media',
  'worker_temp',
  'qa_artifacts',
]

const PATH_SECRET_MARKERS = [
  'api_key',
  'apikey',
  'access_token',
  'auth_token',
  'secret',
  'service_role',
  'signature=',
  'x-goog-signature',
  'x-amz-signature',
]

function pathContainsSecretMarker(path: string): boolean {
  const lowerPath = path.toLowerCase()

  return PATH_SECRET_MARKERS.some((marker) => lowerPath.includes(marker))
}

export function validateGcsObjectLocation(location: GcsObjectLocation): CloudValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!hasNonEmptyString(location.bucketName)) {
    errors.push('GCS object location must include a bucketName.')
  }

  if (!hasNonEmptyString(location.objectPath)) {
    errors.push('GCS object location must include an objectPath.')
  }

  if (location.publicUrlAllowed === true && NEVER_PUBLIC_BUCKET_PURPOSES.includes(location.bucketPurpose)) {
    errors.push(`${location.bucketPurpose} objects must not allow public URLs.`)
  }

  if (location.objectPath.startsWith('http://') || location.objectPath.startsWith('https://') || location.objectPath.startsWith('gs://')) {
    errors.push('GCS objectPath must be a canonical object path, not a URL or gs:// URI.')
  }

  if (looksLikeSignedUrl(location.objectPath)) {
    errors.push('Signed URLs must not be stored as canonical storage paths.')
  }

  if (location.objectPath.includes('?')) {
    errors.push('GCS objectPath must not include query parameters.')
  }

  if (pathContainsSecretMarker(location.objectPath) || pathContainsSecretMarker(location.bucketName)) {
    errors.push('GCS bucketName/objectPath must not contain obvious secret or token markers.')
  }

  if (location.publicUrlAllowed === undefined) {
    warnings.push('publicUrlAllowed defaults to false when omitted.')
  }

  const secretResult = inspectForSecretLikeValues(location.metadata ?? {})
  errors.push(...secretResult.errors)
  warnings.push(...secretResult.warnings)

  return cloudValidationResult(errors, warnings)
}
