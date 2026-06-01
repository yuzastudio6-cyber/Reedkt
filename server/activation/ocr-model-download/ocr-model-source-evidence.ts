import {
  PADDLEOCR_DOCS_URL,
  PADDLEOCR_MODEL_HOST_BASE_URL,
  PADDLEOCR_SOURCE_REPO,
  PADDLEOCR_SOURCE_REPO_URL,
  PP_OCRV5_DICT_FILE_NAME,
  PP_OCRV5_DICT_SOURCE_URL,
  PP_OCRV5_MOBILE_DET_FILE_NAME,
  PP_OCRV5_MOBILE_DET_SOURCE_URL,
  PP_OCRV5_MOBILE_REC_FILE_NAME,
  PP_OCRV5_MOBILE_REC_SOURCE_URL,
  optionalDeferredOcrModelAssets,
  selectedOcrModelAssets,
} from './ocr-model-asset-registry'
import type { OcrModelSourceEvidence } from './ocr-model-download-types'

export function buildStaticOcrModelSourceEvidence(): OcrModelSourceEvidence {
  return {
    collectedAt: '2026-05-30T00:00:00.000Z',
    sourceRepo: PADDLEOCR_SOURCE_REPO,
    sourceRepoUrl: PADDLEOCR_SOURCE_REPO_URL,
    docsUrl: PADDLEOCR_DOCS_URL,
    dictionarySourceUrl: PP_OCRV5_DICT_SOURCE_URL,
    modelHostBaseUrl: PADDLEOCR_MODEL_HOST_BASE_URL,
    selectedAssets: selectedOcrModelAssets.map((asset) => ({ ...asset })),
    optionalDeferredAssets: optionalDeferredOcrModelAssets.map((asset) => ({ ...asset })),
    docsEvidenceSummary: 'Official PaddleOCR OCR usage docs identify PP-OCRv5 mobile detection/recognition model choices and disable-able orientation/unwarping runtime options.',
    modelSourceEvidenceSummary: 'Selected model archives use the official Paddle model ecology paddle3.0.0 inference-model host for PP-OCRv5 mobile det/rec assets.',
    dictionaryEvidenceSummary: 'The PP-OCRv5 recognition dictionary is selected from the official PaddleOCR repository raw dictionary path.',
    sourceUrls: [
      PADDLEOCR_SOURCE_REPO_URL,
      PADDLEOCR_DOCS_URL,
      PP_OCRV5_MOBILE_DET_SOURCE_URL,
      PP_OCRV5_MOBILE_REC_SOURCE_URL,
      PP_OCRV5_DICT_SOURCE_URL,
      ...optionalDeferredOcrModelAssets.map((asset) => asset.sourceUrl),
    ],
    blockers: [],
    warnings: [
      'Static source evidence does not mean model files are downloaded or uploaded.',
      'The optional textline orientation classifier is recorded only to block accidental runtime auto-download.',
    ],
  }
}

export async function collectOcrModelSourceEvidence(): Promise<OcrModelSourceEvidence> {
  const collectedAt = new Date().toISOString()
  const blockers: string[] = []
  const warnings: string[] = []
  const [docs, dictionary] = await Promise.all([
    fetchText(PADDLEOCR_DOCS_URL),
    fetchText(PP_OCRV5_DICT_SOURCE_URL),
  ])

  if (!docs.includes('PP-OCRv5_mobile_det') && !docs.includes('PP-OCRv5_mobile_det_infer')) {
    blockers.push('Official PaddleOCR docs do not identify PP-OCRv5 mobile detection model evidence.')
  }
  if (!docs.includes('PP-OCRv5_mobile_rec') && !docs.includes('PP-OCRv5_mobile_rec_infer')) {
    blockers.push('Official PaddleOCR docs do not identify PP-OCRv5 mobile recognition model evidence.')
  }
  if (!docs.includes('use_doc_orientation_classify')) {
    blockers.push('Official PaddleOCR docs do not expose use_doc_orientation_classify evidence for disabling document orientation classification.')
  }
  if (!docs.includes('use_doc_unwarping')) {
    blockers.push('Official PaddleOCR docs do not expose use_doc_unwarping evidence for disabling document unwarping.')
  }
  if (!docs.includes('use_textline_orientation')) {
    blockers.push('Official PaddleOCR docs do not expose use_textline_orientation evidence for disabling textline orientation.')
  }
  if (!dictionary.includes('\n') || dictionary.trim().length < 100) {
    blockers.push(`Official ${PP_OCRV5_DICT_FILE_NAME} dictionary evidence is unexpectedly small or unavailable.`)
  }
  if (!PP_OCRV5_MOBILE_DET_SOURCE_URL.startsWith(PADDLEOCR_MODEL_HOST_BASE_URL)) {
    blockers.push(`${PP_OCRV5_MOBILE_DET_FILE_NAME} does not use the approved official model host base URL.`)
  }
  if (!PP_OCRV5_MOBILE_REC_SOURCE_URL.startsWith(PADDLEOCR_MODEL_HOST_BASE_URL)) {
    blockers.push(`${PP_OCRV5_MOBILE_REC_FILE_NAME} does not use the approved official model host base URL.`)
  }
  if (optionalDeferredOcrModelAssets.some((asset) => asset.requiredForSafeZoneV1)) {
    blockers.push('Optional/deferred OCR assets cannot be required for the Phase 37B safe-zone v1 asset set.')
  }
  if (!docs.includes('PP-LCNet_x1_0_textline_ori')) {
    warnings.push('Official docs did not include the expected PP-LCNet textline orientation wording; classifier remains deferred and blocked from auto-download.')
  }

  return {
    collectedAt,
    sourceRepo: PADDLEOCR_SOURCE_REPO,
    sourceRepoUrl: PADDLEOCR_SOURCE_REPO_URL,
    docsUrl: PADDLEOCR_DOCS_URL,
    dictionarySourceUrl: PP_OCRV5_DICT_SOURCE_URL,
    modelHostBaseUrl: PADDLEOCR_MODEL_HOST_BASE_URL,
    selectedAssets: selectedOcrModelAssets.map((asset) => ({ ...asset })),
    optionalDeferredAssets: optionalDeferredOcrModelAssets.map((asset) => ({ ...asset })),
    docsEvidenceSummary: 'Official PaddleOCR OCR usage docs identify PP-OCRv5 mobile detection/recognition model choices and expose orientation/unwarping toggles used by the safe-zone v1 profile.',
    modelSourceEvidenceSummary: 'Selected model archives use the official Paddle model ecology paddle3.0.0 inference-model host for PP-OCRv5 mobile det/rec assets.',
    dictionaryEvidenceSummary: 'The PP-OCRv5 recognition dictionary is selected from the official PaddleOCR repository raw dictionary path.',
    sourceUrls: [
      PADDLEOCR_SOURCE_REPO_URL,
      PADDLEOCR_DOCS_URL,
      PP_OCRV5_MOBILE_DET_SOURCE_URL,
      PP_OCRV5_MOBILE_REC_SOURCE_URL,
      PP_OCRV5_DICT_SOURCE_URL,
      ...optionalDeferredOcrModelAssets.map((asset) => asset.sourceUrl),
    ],
    blockers,
    warnings,
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  return response.text()
}
