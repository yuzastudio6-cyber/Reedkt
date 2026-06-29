import type { OcrStoragePlan } from './ocr-model-approval-types'

export function buildOcrModelStoragePlan(): OcrStoragePlan {
  const base = 'gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/'
  return {
    storagePlanId: 'paddleocr_ppocrv5_private_staging_storage_v1',
    baseStagingPath: base,
    detectionModelPath: `${base}pp-ocrv5/det/`,
    recognitionModelPath: `${base}pp-ocrv5/rec/`,
    classifierModelPath: `${base}pp-ocrv5/cls/`,
    privateStorageRequired: true,
    sourceMediaBucketAllowed: false,
    publicAccessAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    committedToGitAllowed: false,
    checksumRequiredAfterDownload: true,
    exactModelAssetVersionsRequiredBeforeRuntime: true,
    notes: [
      'Use generated-assets model-weight storage only for Phase 37B OCR assets.',
      'Do not store OCR model files in git or source-media buckets.',
      'Record exact source URL, version, file name, checksum, and private upload evidence before Phase 37C runtime verification.',
    ],
  }
}
