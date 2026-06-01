export const ocrModelDownloadBlockers = [
  'Selected PP-OCRv5 assets are not downloaded in default plan/report/smoke mode.',
  'Selected PP-OCRv5 assets are not checksummed until guarded Phase 37B execution runs.',
  'Selected PP-OCRv5 assets are not verified in private staging GCS until guarded upload verification passes.',
  'Phase 37C generated OCR runtime verification remains blocked until Phase 37B private asset evidence is reviewed.',
]

export const ocrModelDownloadWarnings = [
  'Phase 37B approves exact asset selection and guarded private staging download/upload only.',
  'Phase 37B does not run PaddleOCR, instantiate PaddlePaddle, process media, render captions, or expose public artifacts.',
  'PP-LCNet_x1_0_textline_ori is optional/deferred for safe-zone v1; runtime defaults must not auto-download it.',
  'Apache-2.0 source/license evidence is staging download evidence only and is not production legal approval.',
]

export const ocrModelDownloadNotReadyFor = [
  'OCR runtime execution',
  'OCR inference',
  'runtime model auto-download',
  'textline orientation classifier auto-download',
  'real media OCR',
  'real video OCR',
  'caption/render QA integration',
  'production',
  'external beta',
  'paid production',
  'broad real user media',
  'public output',
  'provider execution',
]

export const OCR_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS = [
  'source_evidence.json',
  'license_evidence.json',
  'asset_selection_manifest.json',
  'checksum_manifest.json',
  'file_checksums_sha256.txt',
  'model_tree_manifest.json',
  'download_report.json',
  'private_gcs_upload_report.json',
  'phase_37b_ocr_model_download_report.json',
] as const
