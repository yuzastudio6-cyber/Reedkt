import type { OcrDownloadCommandPlan, OcrStoragePlan } from './ocr-model-approval-types'

export function buildOcrModelDownloadCommandPlan(storagePlan: OcrStoragePlan): OcrDownloadCommandPlan[] {
  return [
    {
      commandId: 'phase37b_select_official_ppocrv5_assets',
      futurePhase: '37B',
      description: 'Select exact official PP-OCRv5 det/rec/cls asset URLs and versions before any download.',
      commandText: `TEXT_ONLY Phase 37B must record official PaddleOCR/PaddleX/Paddle model URLs for ${storagePlan.baseStagingPath} before download.`,
      executableCommand: null,
      executionMode: 'text_only',
      safeToRunNow: false,
      requiresFutureApproval: true,
      blockedReason: 'Exact PP-OCRv5 model asset URLs are not selected in Phase 37A.',
      warnings: ['Do not guess asset URLs.', 'Do not use unofficial mirrors.', 'Do not run runtime auto-download.'],
    },
    {
      commandId: 'phase37b_download_with_official_deterministic_urls',
      futurePhase: '37B',
      description: 'Future deterministic download option after exact official asset URLs are approved.',
      commandText: 'TEXT_ONLY REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD=true download exact approved PaddleOCR assets to a temp directory outside the repo, compute SHA-256, then upload to private GCS.',
      executableCommand: null,
      executionMode: 'text_only',
      safeToRunNow: false,
      requiresFutureApproval: true,
      blockedReason: 'Phase 37A is planning-only and cannot download model files.',
      warnings: ['No curl/wget command is executable in Phase 37A.', 'No model file may be committed to git.'],
    },
    {
      commandId: 'phase37b_build_pinned_no_runtime_download_image_if_supported',
      futurePhase: '37B',
      description: 'Future alternative: build a pinned OCR image only if model packaging avoids runtime download.',
      commandText: 'TEXT_ONLY If official packaging supports pinned no-runtime-download OCR assets, record package versions, model hashes, and private storage evidence before Phase 37C.',
      executableCommand: null,
      executionMode: 'text_only',
      safeToRunNow: false,
      requiresFutureApproval: true,
      blockedReason: 'No OCR runtime image build is allowed in Phase 37A.',
      warnings: ['Phase 37C must fail if runtime attempts to download models.'],
    },
  ]
}
