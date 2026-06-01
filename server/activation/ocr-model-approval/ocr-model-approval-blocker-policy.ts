export const ocrModelApprovalBlockers = [
  'phase37a_no_ocr_execution: OCR inference is blocked until Phase 37C.',
  'phase37a_no_model_download: PaddleOCR model downloads are blocked until exact Phase 37B assets are selected.',
  'phase37a_no_real_media: real media and real video OCR are blocked until Phase 37D after generated runtime verification passes.',
  'phase37a_no_runtime_auto_download: runtime auto-download is forbidden for future OCR runtime verification.',
  'phase37a_no_production_or_beta: production, external beta, paid production, and broad real media remain blocked.',
]

export const ocrModelApprovalWarnings = [
  'PaddleOCR and PaddlePaddle evidence supports staging planning, not execution.',
  'PP-OCRv5 exact detection, recognition, and classifier asset URLs are deferred to Phase 37B.',
  'Phase 37C should use CPU-first runtime verification unless later evidence requires GPU.',
]
