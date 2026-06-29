import type { OcrManifestRecord, OcrStoragePlan } from './ocr-model-approval-types'

export function buildOcrModelManifests(storagePlan: OcrStoragePlan): OcrManifestRecord[] {
  return [
    {
      manifestId: 'ocr_paddleocr_ppocrv5_staging_plan_v1',
      toolId: 'paddleocr',
      runtimeId: 'paddlepaddle',
      modelFamily: 'PP-OCRv5',
      purpose: 'Generated OCR safe-zone planning for text/UI region detection and caption safe-zone metadata.',
      source: 'PaddleOCR official repo/docs',
      sourceUrl: 'https://github.com/PaddlePaddle/PaddleOCR',
      stagingStoragePath: storagePlan.baseStagingPath,
      expectedRuntimePath: '/opt/reeditpro/model-weights/paddleocr/pp-ocrv5/',
      license: 'Apache-2.0',
      reviewStatus: 'staging_approved_for_ocr_safe_zone_planning',
      downloadStatus: 'blocked_until_exact_assets_selected',
      runtimeStatus: 'blocked_until_phase37C',
      productionStatus: 'production_blocked',
      externalBetaStatus: 'blocked',
      broadRealMediaStatus: 'blocked',
      checksum: 'missing_until_download',
      approvedFor: [
        'generated_ocr_safe_zone_planning',
        'phase37B_asset_selection',
        'phase37C_generated_ocr_runtime_verification',
        'phase37D_real_video_safe_zone_after_runtime_passes',
      ],
    },
    {
      manifestId: 'paddlepaddle_runtime_staging_plan_v1',
      runtimeId: 'paddlepaddle',
      purpose: 'PaddleOCR runtime planning only.',
      source: 'PaddlePaddle official repo/docs',
      sourceUrl: 'https://github.com/PaddlePaddle/Paddle',
      license: 'Apache-2.0',
      reviewStatus: 'planning_only',
      downloadStatus: 'not_applicable_until_image_build',
      runtimeStatus: 'planning_only',
      productionStatus: 'blocked',
      externalBetaStatus: 'blocked',
      broadRealMediaStatus: 'blocked',
      checksum: 'not_applicable_until_image_build',
      approvedFor: ['phase37C_cpu_first_runtime_image_planning'],
    },
  ]
}
