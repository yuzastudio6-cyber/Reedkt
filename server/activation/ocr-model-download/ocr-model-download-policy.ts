import {
  OCR_MODEL_DOWNLOAD_BUCKET,
  OCR_MODEL_DOWNLOAD_ENV,
  OCR_MODEL_DOWNLOAD_GCS_PATH,
  OCR_MODEL_DOWNLOAD_LOCAL_DIR,
  OCR_MODEL_DOWNLOAD_PHASE,
  OCR_MODEL_DOWNLOAD_PROJECT_ID,
  OCR_MODEL_DOWNLOAD_REGION,
  OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
  OCR_MODEL_DOWNLOAD_TEMP_ROOT,
} from './ocr-model-download-config'
import {
  hasExactlySelectedOcrModelAssetUrls,
  optionalDeferredOcrModelAssets,
  selectedOcrModelAssets,
} from './ocr-model-asset-registry'
import type {
  OcrModelDownloadPreflightInput,
  OcrModelDownloadPreflightResult,
} from './ocr-model-download-types'

export {
  OCR_MODEL_DOWNLOAD_BUCKET,
  OCR_MODEL_DOWNLOAD_ENV,
  OCR_MODEL_DOWNLOAD_GCS_PATH,
  OCR_MODEL_DOWNLOAD_LOCAL_DIR,
  OCR_MODEL_DOWNLOAD_PHASE,
  OCR_MODEL_DOWNLOAD_PROJECT_ID,
  OCR_MODEL_DOWNLOAD_REGION,
  OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
  OCR_MODEL_DOWNLOAD_TEMP_ROOT,
}

export const ocrModelDownloadExecutionDoesNotDo = [
  'no OCR inference',
  'no PaddleOCR runtime execution',
  'no runtime model auto-download',
  'no textline orientation auto-download',
  'no real-media OCR',
  'no real-video OCR',
  'no caption/render integration',
  'no media processing',
  'no GPU jobs',
  'no Cloud Run deploy or execution',
  'no Docker build or push',
  'no provider calls',
  'no public model storage',
  'no signed URL source of truth',
  'no source-media bucket storage',
  'no public bucket principals',
  'no model files committed to git',
  'no production or external beta unblock',
  'no Revideo production path',
  'no FILM or slow-motion work',
]

export function validateOcrModelDownloadExecutionEnv(
  input: OcrModelDownloadPreflightInput = {},
): OcrModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const projectId = input.projectId ?? process.env.GCP_PROJECT_ID
  const region = input.region ?? process.env.GCP_REGION
  const env = input.env ?? process.env.REEDITPRO_ENV
  const downloadConfirmation = input.downloadConfirmation ?? process.env.REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD
  const privateGcsUploadConfirmation = input.privateGcsUploadConfirmation ?? process.env.REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD
  const assetUrls = input.assetUrls ?? selectedOcrModelAssets.map((asset) => asset.sourceUrl)

  if (projectId !== OCR_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('GCP_PROJECT_ID must be exactly reeditpro.')
  if (input.activeProject && input.activeProject !== OCR_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('Active gcloud project must be exactly reeditpro.')
  if (region !== OCR_MODEL_DOWNLOAD_REGION) blockers.push('GCP_REGION must be exactly us-central1.')
  if (env !== OCR_MODEL_DOWNLOAD_ENV) blockers.push('REEDITPRO_ENV must be exactly staging.')
  if (downloadConfirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD=true is required for Phase 37B download execution.')
  if (privateGcsUploadConfirmation !== 'true') blockers.push('REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD=true is required for Phase 37B private GCS upload.')
  if (input.bucketName && input.bucketName !== OCR_MODEL_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== OCR_MODEL_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved PP-OCRv5 mobile safe-zone private model-weight prefix.')
  if (input.localTempDir && isOcrModelDownloadPathInsideRepo(input.localTempDir)) blockers.push('OCR model download path must be outside the git repo.')
  if (!hasExactlySelectedOcrModelAssetUrls(assetUrls)) blockers.push('Asset URLs must be exactly the approved PP-OCRv5 mobile det, rec, and dictionary URLs.')
  if (input.providerExecutionEnabled && input.providerExecutionEnabled !== 'false') blockers.push('Provider execution must remain disabled for Phase 37B.')
  if (input.productionReady && input.productionReady !== 'false') blockers.push('Production readiness must remain false for Phase 37B.')
  if (input.externalBetaReady && input.externalBetaReady !== 'false') blockers.push('External beta readiness must remain false for Phase 37B.')
  if (input.broadRealMediaReady && input.broadRealMediaReady !== 'false') blockers.push('Broad real-media readiness must remain false for Phase 37B.')
  if (input.betaReady && input.betaReady !== 'false') blockers.push('Beta readiness must remain false for Phase 37B.')
  if (process.env.NODE_ENV === 'production') blockers.push('NODE_ENV=production is not allowed for Phase 37B execution.')
  if (optionalDeferredOcrModelAssets.some((asset) => asset.requiredForSafeZoneV1)) blockers.push('Deferred OCR assets must not be required for safe-zone v1.')

  warnings.push('Phase 37B downloads and stores selected PP-OCRv5 assets only; OCR runtime and OCR inference remain blocked until Phase 37C.')
  warnings.push('Phase 37B must not instantiate PaddleOCR, process media, or allow runtime defaults to auto-download the textline orientation classifier.')

  return { allowed: blockers.length === 0, blockers, warnings }
}

export function validateOcrModelDownloadStaticPlan(
  input: OcrModelDownloadPreflightInput = {},
): OcrModelDownloadPreflightResult {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.projectId && input.projectId !== OCR_MODEL_DOWNLOAD_PROJECT_ID) blockers.push('GCP project must be exactly reeditpro.')
  if (input.region && input.region !== OCR_MODEL_DOWNLOAD_REGION) blockers.push('GCP region must be exactly us-central1.')
  if (input.env && input.env !== OCR_MODEL_DOWNLOAD_ENV) blockers.push('Environment must be staging.')
  if (input.bucketName && input.bucketName !== OCR_MODEL_DOWNLOAD_BUCKET) blockers.push('Target bucket must be the approved staging generated-assets bucket.')
  if (input.targetPrefix && input.targetPrefix !== OCR_MODEL_DOWNLOAD_TARGET_PREFIX) blockers.push('Target prefix must be the approved PP-OCRv5 mobile safe-zone private model-weight prefix.')
  if (input.assetUrls && !hasExactlySelectedOcrModelAssetUrls(input.assetUrls)) blockers.push('Static plan asset URLs must remain exactly the approved PP-OCRv5 mobile det, rec, and dictionary URLs.')
  warnings.push('Static plan/report/smoke mode does not download OCR assets, mutate GCS, run OCR, process media, or unlock beta/production.')
  warnings.push('PP-LCNet_x1_0_textline_ori stays optional/deferred and runtime auto-download remains blocked.')
  return { allowed: blockers.length === 0, blockers, warnings }
}

export function isOcrModelDownloadPathInsideRepo(path: string): boolean {
  return /\/Users\/macuser\/Documents\/REeditpro(?:-|\/|$)|\/private\/tmp\/reeditpro-phase37b-ocr-model-download(?:\/|$)/.test(path)
}
