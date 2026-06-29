# Phase 37D Controlled Real-Video OCR Safe-Zone Execution

Status: `controlled_execution_passed`

Phase 37D execution ran OCR only on the one gate-approved private Phase 32 sample. It copied the approved private source into local temp storage, extracted exactly six frames with OpenCV, verified the three Phase 37B PP-OCRv5 assets by SHA-256 before model extraction, ran PaddleOCR/PaddlePaddle `3.0.0` CPU-only with local detection and recognition model paths, and uploaded JSON QA artifacts only to the private Phase 37D QA prefix.

## Run

- Run id: `phase37d-20260531T002046`
- Sample id: `phase37d-phase32-color-export-safe-zone-window-v1`
- Controlled chain id: `controlled-real-video-chain-phase28-through-phase32-v1`
- Source: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Source generation: `1779975269726662`
- Source size: `94,522,751` bytes
- Window: `6.9s` to `8.9s`
- Offsets: `6.9, 7.3, 7.7, 8.1, 8.5, 8.9`
- Extracted frames: `6`
- OCR text regions: `11`
- Frames with OCR text: `6`
- Frames with lower-third collision: `0`
- Caption recommendations available: `6`

## Private Artifacts

Private prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/phase37d-20260531T002046/`

Uploaded JSON object count: `10`

- `phase_37d_controlled_real_video_ocr_execution_plan.json`
- `phase_37d_controlled_real_video_sample_manifest.json`
- `phase_37d_frame_extraction_manifest.json`
- `phase_37d_ocr_model_asset_verification.json`
- `phase_37d_ocr_results.json`
- `phase_37d_ocr_safe_zone_manifest.json`
- `phase_37d_caption_collision_report.json`
- `phase_37d_safe_zone_recommendation_report.json`
- `phase_37d_private_artifact_manifest.json`
- `phase_37d_controlled_real_video_ocr_execution_report.json`

Raw frames, overlays, model archives, extracted model directories, video bytes, venvs, credentials, signed URLs, and temp folders are not committed. Frames remain local temp only under `/tmp/reeditpro-ocr-runtime/phase37d/<run-id>/frames/`.

## Runtime Notes

- Runtime model auto-download remained blocked.
- Runtime network guard was active.
- Local detection and recognition model directories were accepted.
- `PP-LCNet_x1_0_textline_ori` remains deferred and blocked from auto-download.
- The verified dictionary file was present, but PaddleOCR `3.0.0` did not expose a recognized dictionary-path constructor parameter in this runtime; this limitation remains carried forward.
- Local `ffmpeg` and `ffprobe` were unavailable, so frame extraction used OpenCV as planned.

## Phase 37E Readiness

Phase 37D execution is ready only for Phase 37E controlled caption/render QA integration planning. It does not unlock broad OCR, arbitrary media OCR, full-video OCR, Track A, beta, production, public output, providers, Docker push, Cloud Run deploy, or GPU jobs.
