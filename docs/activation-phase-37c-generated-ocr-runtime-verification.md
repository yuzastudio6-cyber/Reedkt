# Phase 37C Generated OCR Runtime Verification

Status: `generated_ocr_runtime_verified`

Phase 37C verifies PaddleOCR on deterministic generated UI/text frames using the private Phase 37B PP-OCRv5 assets. It is CPU-first, local-first, and generated-fixture only. It does not deploy Cloud Run, change IAM, push Docker images, process real media, touch Track A, or unlock beta/production.

Verified run: `phase37c-20260530T230413`

Private artifact prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37c/generated-ocr-runtime/phase37c-20260530T230413/`

## Inputs

Only these private Phase 37B assets may be copied into `/tmp/reeditpro-ocr-runtime/phase37c/<run-id>/models/raw/`:

| Asset | SHA-256 |
| --- | --- |
| `det/PP-OCRv5_mobile_det_infer.tar` | `50446e5d01ac2a73d5319c89513281f6578414c888c602f9af13f93feefffc58` |
| `rec/PP-OCRv5_mobile_rec_infer.tar` | `566b9512b34e34a9f0db54d87b51fa5a0b9ed2cf1ab7e49728cc0b8b5a64f414` |
| `dict/ppocrv5_dict.txt` | `d1979e9f794c464c0d2e0b70a7fe14dd978e9dc644c0e71f14158cdf8342af1b` |

Aggregate checksum: `6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b`

## Runtime

The worker uses an isolated local venv with pinned deps:

- `paddlepaddle==3.0.0`
- `paddleocr==3.0.0`
- `Pillow==10.4.0`
- `numpy==1.26.4`
- `opencv-python-headless==4.10.0.84`
- `PyYAML==6.0.2`

The PaddleOCR constructor is given explicit local detection and recognition model paths. The verified dictionary path is passed when the installed PaddleOCR constructor exposes a supported dictionary-path parameter. CPU mode is required. `use_doc_orientation_classify=false`, `use_doc_unwarping=false`, and `use_textline_orientation=false` are required when supported by the constructor. The worker wraps initialization and inference in a network guard; any runtime model download attempt blocks Phase 37C.

Official reference docs:

- [PaddleOCR v3.0.0 OCR usage](http://www.paddleocr.ai/v3.0.0/en/version3.x/pipeline_usage/OCR.html)
- [PaddleOCR 3.0.3 PyPI quick start](https://pypi.org/project/paddleocr/3.0.3/)

## Generated Fixtures

Required-pass fixtures:

- `basic-ui-text`
- `caption-safe-zone-conflict`
- `multi-region-ui`

Warning-only fixtures:

- `low-contrast-warning`
- `small-text-warning`

Deferred orientation fixture:

- `rotated-text-blocked-or-warning`

`PP-LCNet_x1_0_textline_ori` remains deferred and blocked from auto-download, so rotated text is warning/skipped and cannot alone pass or fail Phase 37C.

## Reports

Phase 37C emits:

- `phase_37c_ocr_runtime_plan.json`
- `phase_37c_ocr_model_asset_verification.json`
- `phase_37c_generated_fixture_manifest.json`
- `phase_37c_ocr_runtime_results.json`
- `phase_37c_ocr_text_match_report.json`
- `phase_37c_ocr_safe_zone_report.json`
- `phase_37c_ocr_runtime_qa_report.json`
- `phase_37c_private_artifact_manifest.json`
- `phase_37c_generated_ocr_runtime_report.json`

If artifact upload is confirmed, only generated reports and generated fixture images are uploaded to:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37c/generated-ocr-runtime/<run-id>/`

## Verified QA

Required fixtures passed:

| Fixture | Token recall | Average confidence | Region/safe-zone result |
| --- | ---: | ---: | --- |
| `basic-ui-text` | `1.00` | `0.9992` | All required broad regions matched |
| `caption-safe-zone-conflict` | `1.00` | `0.9641` | Lower caption conflict zone intersected |
| `multi-region-ui` | `1.00` | `0.9987` | All required broad regions matched |

Warning fixtures:

- `low-contrast-warning`: token recall `1.00`, confidence `0.9626`.
- `small-text-warning`: token recall `1.00`, confidence `0.9449`.
- `rotated-text-blocked-or-warning`: skipped/warning because `PP-LCNet_x1_0_textline_ori` remains deferred.

Runtime evidence:

- PaddleOCR `3.0.0` and PaddlePaddle `3.0.0` imported.
- CPU-only mode used.
- Local detection and recognition model paths used.
- Runtime network/model-download guard active with no attempted download.
- Phase 37B copied model assets matched SHA-256 evidence exactly.
- GCS verification records size, generation, CRC32C, and MD5 where returned. GCS does not expose SHA-256 for these uploaded QA artifacts, so SHA-256 remains sourced from local generated manifests.

## Commands

Pre-execution:

```bash
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run smoke:activation-ocr-runtime
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run activation:ocr-runtime:plan
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run activation:ocr-runtime:report
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run activation:ocr-runtime:iam-plan
```

Execution:

```bash
PATH="/Applications/Codex.app/Contents/Resources:$PATH" \
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_OCR_PRIVATE_GCS_READ=true \
REEDITPRO_CONFIRM_OCR_RUNTIME_EXECUTE=true \
REEDITPRO_CONFIRM_OCR_RUNTIME_ARTIFACT_UPLOAD=true \
npm run activation:ocr-runtime -- --execute --keep-temp
```

## Still Blocked

- Real media OCR and real video OCR
- Caption/render QA integration
- Provider calls
- Public artifacts and signed URL source-of-truth
- Cloud Run deploy
- Docker push
- GPU jobs
- Track A work
- Internal beta, external beta, paid production, and broad real user media

Phase 37D is now ready only for one controlled real-video OCR/caption safe-zone planning gate. Real media execution, caption/render integration, beta, production, and broad media remain blocked until their own explicit phases pass.
