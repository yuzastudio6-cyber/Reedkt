import {
  OCR_MODEL_ASSET_VERSION,
  OCR_MODEL_FAMILY,
  optionalDeferredOcrModelAssets,
  selectedOcrModelAssets,
} from './ocr-model-asset-registry'
import {
  OCR_MODEL_DOWNLOAD_GCS_PATH,
  OCR_MODEL_DOWNLOAD_LOCAL_DIR,
} from './ocr-model-download-policy'
import { buildOcrAggregateChecksum } from './ocr-model-checksum-manifest'
import type { OcrChecksumEntry, OcrModelTreeManifest } from './ocr-model-download-types'

export function buildOcrModelTreeManifest(input: {
  files: OcrChecksumEntry[]
  createdAt: string
  localTempPath?: string
}): OcrModelTreeManifest {
  const fileSha256 = Object.fromEntries(
    input.files.map((entry) => [entry.relativePath, entry.sha256 ?? 'pending_until_download']),
  )
  const fileSizes = Object.fromEntries(
    input.files.map((entry) => [entry.relativePath, entry.sizeBytes ?? null]),
  )
  return {
    phase: '37B',
    manifestId: 'paddleocr_ppocrv5_model_tree_manifest_v1',
    modelFamily: OCR_MODEL_FAMILY,
    assetVersion: OCR_MODEL_ASSET_VERSION,
    selectedAssets: selectedOcrModelAssets.map((asset) => ({ ...asset })),
    optionalDeferredAssets: optionalDeferredOcrModelAssets.map((asset) => ({ ...asset })),
    licenseName: 'Apache-2.0',
    fileSha256,
    fileSizes,
    aggregateSha256: input.files.every((entry) => entry.sha256) ? buildOcrAggregateChecksum(input.files) : 'pending_until_download',
    createdAt: input.createdAt,
    targetGcsPath: OCR_MODEL_DOWNLOAD_GCS_PATH,
    localTempPath: input.localTempPath ?? OCR_MODEL_DOWNLOAD_LOCAL_DIR,
    downloadAllowedInPhase37B: true,
    privateGcsUploadAllowedInPhase37B: true,
    runtimeAutoDownloadAllowed: false,
    textlineOrientationAutoDownloadAllowed: false,
    ocrRuntimeAllowed: false,
    ocrInferenceAllowed: false,
    realMediaOcrAllowed: false,
    realVideoOcrAllowed: false,
    captionRenderIntegrationAllowed: false,
    publicOutputAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
  }
}
