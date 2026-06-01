import {
  OCR_MODEL_DOWNLOAD_GCS_PATH,
  OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
} from './ocr-model-download-config'
import type { OcrAssetSelectionManifest, OcrModelAssetRecord } from './ocr-model-download-types'

export const OCR_MODEL_ASSET_VERSION = 'paddle3.0.0-mobile-safe-zone-v1'
export const OCR_MODEL_FAMILY = 'PP-OCRv5'
export const PADDLEOCR_SOURCE_REPO = 'PaddlePaddle/PaddleOCR'
export const PADDLEOCR_SOURCE_REPO_URL = 'https://github.com/PaddlePaddle/PaddleOCR'
export const PADDLEOCR_DOCS_URL = 'https://www.paddleocr.ai/main/en/version3.x/pipeline_usage/OCR.html'
export const PADDLEOCR_REPO_LICENSE_URL = 'https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/LICENSE'
export const PADDLEOCR_MODEL_HOST_BASE_URL = 'https://paddle-model-ecology.bj.bcebos.com/paddlex/official_inference_model/paddle3.0.0/'
export const PP_OCRV5_MOBILE_DET_FILE_NAME = 'PP-OCRv5_mobile_det_infer.tar'
export const PP_OCRV5_MOBILE_REC_FILE_NAME = 'PP-OCRv5_mobile_rec_infer.tar'
export const PP_OCRV5_DICT_FILE_NAME = 'ppocrv5_dict.txt'
export const PP_LCNET_TEXTLINE_ORI_FILE_NAME = 'PP-LCNet_x1_0_textline_ori_infer.tar'
export const PP_OCRV5_MOBILE_DET_SOURCE_URL = `${PADDLEOCR_MODEL_HOST_BASE_URL}${PP_OCRV5_MOBILE_DET_FILE_NAME}`
export const PP_OCRV5_MOBILE_REC_SOURCE_URL = `${PADDLEOCR_MODEL_HOST_BASE_URL}${PP_OCRV5_MOBILE_REC_FILE_NAME}`
export const PP_OCRV5_DICT_SOURCE_URL = 'https://raw.githubusercontent.com/PaddlePaddle/PaddleOCR/main/ppocr/utils/dict/ppocrv5_dict.txt'
export const PP_LCNET_TEXTLINE_ORI_SOURCE_URL = `${PADDLEOCR_MODEL_HOST_BASE_URL}${PP_LCNET_TEXTLINE_ORI_FILE_NAME}`

export const selectedOcrModelAssets: OcrModelAssetRecord[] = [
  {
    assetId: 'ppocrv5-mobile-det-infer',
    fileName: PP_OCRV5_MOBILE_DET_FILE_NAME,
    role: 'text_detection',
    selectionStatus: 'selected_for_phase37b_safe_zone_v1',
    modelFamily: OCR_MODEL_FAMILY,
    assetVersion: OCR_MODEL_ASSET_VERSION,
    sourceUrl: PP_OCRV5_MOBILE_DET_SOURCE_URL,
    sourceKind: 'official_paddlex_inference_model',
    localRelativePath: `det/${PP_OCRV5_MOBILE_DET_FILE_NAME}`,
    gcsRelativePath: `det/${PP_OCRV5_MOBILE_DET_FILE_NAME}`,
    requiredForSafeZoneV1: true,
    runtimeAutoDownloadBlocked: true,
    reason: 'CPU-first mobile PP-OCRv5 detection asset for generated UI/text safe-zone OCR verification.',
  },
  {
    assetId: 'ppocrv5-mobile-rec-infer',
    fileName: PP_OCRV5_MOBILE_REC_FILE_NAME,
    role: 'text_recognition',
    selectionStatus: 'selected_for_phase37b_safe_zone_v1',
    modelFamily: OCR_MODEL_FAMILY,
    assetVersion: OCR_MODEL_ASSET_VERSION,
    sourceUrl: PP_OCRV5_MOBILE_REC_SOURCE_URL,
    sourceKind: 'official_paddlex_inference_model',
    localRelativePath: `rec/${PP_OCRV5_MOBILE_REC_FILE_NAME}`,
    gcsRelativePath: `rec/${PP_OCRV5_MOBILE_REC_FILE_NAME}`,
    requiredForSafeZoneV1: true,
    runtimeAutoDownloadBlocked: true,
    reason: 'CPU-first mobile PP-OCRv5 recognition asset for generated UI/text safe-zone OCR verification.',
  },
  {
    assetId: 'ppocrv5-recognition-dictionary',
    fileName: PP_OCRV5_DICT_FILE_NAME,
    role: 'recognition_dictionary',
    selectionStatus: 'selected_for_phase37b_safe_zone_v1',
    modelFamily: OCR_MODEL_FAMILY,
    assetVersion: OCR_MODEL_ASSET_VERSION,
    sourceUrl: PP_OCRV5_DICT_SOURCE_URL,
    sourceKind: 'official_paddleocr_dictionary',
    localRelativePath: `dict/${PP_OCRV5_DICT_FILE_NAME}`,
    gcsRelativePath: `dict/${PP_OCRV5_DICT_FILE_NAME}`,
    requiredForSafeZoneV1: true,
    runtimeAutoDownloadBlocked: true,
    reason: 'Official PP-OCRv5 recognition dictionary required to keep runtime input pinned and offline.',
  },
]

export const optionalDeferredOcrModelAssets: OcrModelAssetRecord[] = [
  {
    assetId: 'pplcnet-textline-orientation-deferred',
    fileName: PP_LCNET_TEXTLINE_ORI_FILE_NAME,
    role: 'textline_orientation_classifier',
    selectionStatus: 'optional_deferred',
    modelFamily: OCR_MODEL_FAMILY,
    assetVersion: OCR_MODEL_ASSET_VERSION,
    sourceUrl: PP_LCNET_TEXTLINE_ORI_SOURCE_URL,
    sourceKind: 'official_paddlex_inference_model',
    localRelativePath: `deferred/${PP_LCNET_TEXTLINE_ORI_FILE_NAME}`,
    gcsRelativePath: `deferred/${PP_LCNET_TEXTLINE_ORI_FILE_NAME}`,
    requiredForSafeZoneV1: false,
    runtimeAutoDownloadBlocked: true,
    reason: 'Optional textline orientation classifier is deferred because the safe-zone v1 runtime profile disables textline orientation.',
  },
]

export const selectedOcrModelAssetUrls = selectedOcrModelAssets.map((asset) => asset.sourceUrl)
export const selectedOcrModelAssetRelativePaths = selectedOcrModelAssets.map((asset) => asset.localRelativePath)
export const ocrModelDownloadExpectedGcsAssetUris = selectedOcrModelAssets.map((asset) => `${OCR_MODEL_DOWNLOAD_GCS_PATH}${asset.gcsRelativePath}`)

export function buildOcrAssetSelectionManifest(createdAt = new Date().toISOString()): OcrAssetSelectionManifest {
  return {
    phase: '37B',
    manifestId: 'paddleocr_ppocrv5_exact_assets_paddle3_mobile_safe_zone_v1',
    selectedAt: createdAt,
    selectedBy: 'codex_phase37b_static_registry',
    modelFamily: OCR_MODEL_FAMILY,
    assetVersion: OCR_MODEL_ASSET_VERSION,
    targetGcsPath: OCR_MODEL_DOWNLOAD_GCS_PATH,
    selectedAssets: selectedOcrModelAssets.map((asset) => ({ ...asset })),
    optionalDeferredAssets: optionalDeferredOcrModelAssets.map((asset) => ({ ...asset })),
    safeZoneRuntimeProfile: {
      use_doc_orientation_classify: false,
      use_doc_unwarping: false,
      use_textline_orientation: false,
      blockTextlineOrientationAutoDownload: true,
    },
    exactAssetSelectionApproved: true,
    downloadExecuted: false,
    privateGcsUploadVerified: false,
    blockers: [
      'Selected OCR assets are not downloaded, checksummed, or verified in private staging GCS until the guarded Phase 37B execution runs.',
    ],
    warnings: [
      `All OCR assets must remain under ${OCR_MODEL_DOWNLOAD_TARGET_PREFIX}.`,
      'PP-LCNet_x1_0_textline_ori is optional/deferred and must not be auto-downloaded by runtime defaults.',
    ],
  }
}

export function hasExactlySelectedOcrModelAssetUrls(urls: string[]): boolean {
  const expected = [...selectedOcrModelAssetUrls].sort()
  const candidate = [...urls].sort()
  return candidate.length === expected.length && candidate.every((url, index) => url === expected[index])
}

export function isSelectedOcrModelAssetUrl(sourceUrl: string): boolean {
  return selectedOcrModelAssets.some((asset) => asset.sourceUrl === sourceUrl)
}
