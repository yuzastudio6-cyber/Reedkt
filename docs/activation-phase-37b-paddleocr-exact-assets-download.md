# Phase 37B PaddleOCR Exact Assets Download Evidence

Status: `private_staging_evidence_passed`

Phase 37B selected the exact PP-OCRv5 assets for the first generated OCR safe-zone runtime path, ran the guarded private staging download/upload workflow, and verified the selected assets plus evidence reports in private GCS. Default plan, report, and smoke commands remain non-mutating; they now report the approved private staging evidence.

## Selected Assets

| Asset | Size | SHA-256 |
| --- | ---: | --- |
| `PP-OCRv5_mobile_det_infer.tar` | 4,935,680 bytes | `50446e5d01ac2a73d5319c89513281f6578414c888c602f9af13f93feefffc58` |
| `PP-OCRv5_mobile_rec_infer.tar` | 16,834,560 bytes | `566b9512b34e34a9f0db54d87b51fa5a0b9ed2cf1ab7e49728cc0b8b5a64f414` |
| `ppocrv5_dict.txt` | 74,012 bytes | `d1979e9f794c464c0d2e0b70a7fe14dd978e9dc644c0e71f14158cdf8342af1b` |

Asset version: `paddle3.0.0-mobile-safe-zone-v1`

Aggregate checksum: `6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b`

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

## Verified Private Staging Evidence

- Downloaded at `2026-05-30T22:03:33.371Z`.
- Uploaded at `2026-05-30T22:03:56.822Z`.
- Verified at `2026-05-30T22:04:32.605Z`.
- Uploaded object count: `12`.
- Private prefix: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/`.
- Current GCS verification records object size, generation, CRC32C, and MD5 where returned by Cloud Storage. GCS does not expose SHA-256 in the verification response, so SHA-256 remains sourced from the local checksum manifest.
- `PP-LCNet_x1_0_textline_ori` was not downloaded or uploaded.

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

Phase 37C may now plan generated UI/text-frame OCR runtime verification only. Phase 37B evidence does not approve real-media OCR, caption/render integration, beta, production, or public output.

## Validation

Run `npm run smoke:activation-ocr-model-download`, `npm run activation:ocr-model-download:plan`, `npm run activation:ocr-model-download:report`, production readiness summaries, lint, build, server build, and `git diff --check`.
