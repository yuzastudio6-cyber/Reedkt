# Phase 37B PaddleOCR Exact Assets Download Plan

Status: `asset_selection_approved_download_pending`

Phase 37B selects the exact PP-OCRv5 assets for the first generated OCR safe-zone runtime path and adds a guarded private staging download/upload workflow. Default plan, report, and smoke commands are non-mutating.

## Selected Assets

- `PP-OCRv5_mobile_det_infer.tar`
- `PP-OCRv5_mobile_rec_infer.tar`
- `ppocrv5_dict.txt`

Asset version: `paddle3.0.0-mobile-safe-zone-v1`

Private target prefix:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/`

## Deferred Asset

`PP-LCNet_x1_0_textline_ori` is recorded as optional/deferred only. Safe-zone v1 sets:

- `use_doc_orientation_classify=false`
- `use_doc_unwarping=false`
- `use_textline_orientation=false`

Any runtime default that tries to auto-download the textline orientation classifier must block before Phase 37C can pass.

## Guards

- Plan/report/smoke modes do not download assets or mutate GCS.
- Real download requires `REEDITPRO_CONFIRM_OCR_MODEL_DOWNLOAD=true`.
- Private GCS upload also requires `REEDITPRO_CONFIRM_PRIVATE_GCS_UPLOAD=true`.
- Execution is limited to project `reeditpro`, region `us-central1`, environment `staging`, and the approved private generated-assets bucket.

## Report Artifacts

- `source_evidence.json`
- `license_evidence.json`
- `asset_selection_manifest.json`
- `checksum_manifest.json`
- `file_checksums_sha256.txt`
- `model_tree_manifest.json`
- `download_report.json`
- `private_gcs_upload_report.json`
- `phase_37b_ocr_model_download_report.json`

## Still Blocked

- OCR runtime and OCR inference
- Runtime model auto-download
- Textline orientation auto-download
- Real media OCR and real video OCR
- Caption/render integration
- Provider calls
- Public output and signed URL source-of-truth
- Production, external beta, paid production, and broad real user media

## Validation

Run `npm run smoke:activation-ocr-model-download`, `npm run activation:ocr-model-download:plan`, `npm run activation:ocr-model-download:report`, production readiness summaries, lint, build, server build, and `git diff --check`.
