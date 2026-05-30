import {
  OCR_MODEL_DOWNLOAD_BUCKET,
  OCR_MODEL_DOWNLOAD_GCS_PATH,
  OCR_MODEL_DOWNLOAD_LOCAL_DIR,
  OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
} from './ocr-model-download-policy'
import { selectedOcrModelAssets } from './ocr-model-asset-registry'

export interface OcrModelDownloadStoragePlan {
  storagePlanId: 'paddleocr_ppocrv5_mobile_safe_zone_private_storage_v1'
  bucketName: string
  targetPrefix: string
  targetGcsPath: string
  localTempDir: string
  selectedAssetDestinations: Array<{
    assetId: string
    fileName: string
    localRelativePath: string
    gcsUri: string
  }>
  privateStorageRequired: true
  sourceMediaBucketAllowed: false
  publicAccessAllowed: false
  signedUrlSourceOfTruthAllowed: false
  committedToGitAllowed: false
  checksumRequiredAfterDownload: true
  exactModelAssetVersionsRequiredBeforeRuntime: true
  notes: string[]
}

export function buildOcrModelDownloadStoragePlan(): OcrModelDownloadStoragePlan {
  return {
    storagePlanId: 'paddleocr_ppocrv5_mobile_safe_zone_private_storage_v1',
    bucketName: OCR_MODEL_DOWNLOAD_BUCKET,
    targetPrefix: OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
    targetGcsPath: OCR_MODEL_DOWNLOAD_GCS_PATH,
    localTempDir: OCR_MODEL_DOWNLOAD_LOCAL_DIR,
    selectedAssetDestinations: selectedOcrModelAssets.map((asset) => ({
      assetId: asset.assetId,
      fileName: asset.fileName,
      localRelativePath: asset.localRelativePath,
      gcsUri: `${OCR_MODEL_DOWNLOAD_GCS_PATH}${asset.gcsRelativePath}`,
    })),
    privateStorageRequired: true,
    sourceMediaBucketAllowed: false,
    publicAccessAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    committedToGitAllowed: false,
    checksumRequiredAfterDownload: true,
    exactModelAssetVersionsRequiredBeforeRuntime: true,
    notes: [
      'Store selected PP-OCRv5 assets only under the private staging generated-assets model-weight prefix.',
      'Do not store OCR model files in source-media buckets, public buckets, signed-url-only locations, or git.',
      'Phase 37C may proceed only after checksums and private GCS object verification are reviewed.',
      'The textline orientation classifier is not part of the safe-zone v1 asset set and must not be auto-downloaded at runtime.',
    ],
  }
}
