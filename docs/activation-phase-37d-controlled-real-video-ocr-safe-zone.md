# Phase 37D Controlled Real-Video OCR Safe-Zone Gate

Status: `metadata_planning_gate_passed`; controlled execution follow-up passed for `phase37d-20260531T002046`

Phase 37D defines the controlled real-video OCR/caption safe-zone planning gate after the Phase 37C generated OCR runtime pass. It selects one approved private controlled sample and defines future frame/OCR/report schemas. It does not read media bytes, extract frames, run OCR on real video, upload artifacts, mutate IAM/GCP, build Docker, deploy Cloud Run, touch Track A execution code, or unlock beta/production.

## Approved Inputs

- Phase 37B OCR assets: private PP-OCRv5 det/rec/dictionary assets under `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/paddleocr/pp-ocrv5/paddle3.0.0-mobile-safe-zone-v1/`
- Phase 37B aggregate SHA-256: `6c4fbb9986bc5fdc97a363ab41124feb835656388cb6d51f17986f70e14a5a7b`
- Phase 37C verified run: `phase37c-20260530T230413`
- Phase 37C private QA prefix: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37c/generated-ocr-runtime/phase37c-20260530T230413/`
- Phase 32 controlled private export: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- Phase 32 export SHA-256: `78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa`

## Selected Sample

- Sample id: `phase37d-phase32-color-export-safe-zone-window-v1`
- Controlled chain id: `controlled-real-video-chain-phase28-through-phase32-v1`
- Future window: `6.9s` to `8.9s`
- Future frame offsets: `6.9, 7.3, 7.7, 8.1, 8.5, 8.9`
- Maximum future sampled frames: `6`
- Global Phase 37D cap: one window and no more than `12` future sampled frames

The metadata gate recorded the 6.9s-8.9s window without reading media. The controlled execution follow-up then used only that same window and offsets, extracted exactly six local temp frames, ran CPU-only PaddleOCR, and uploaded private JSON QA artifacts only.

## Outputs Defined

Phase 37D defines these future private artifacts and schemas:

- `phase_37d_controlled_real_video_ocr_safe_zone_plan.json`
- `phase_37d_controlled_chain_manifest.json`
- `phase_37d_selected_sample_manifest.json`
- `phase_37d_future_frame_sampling_manifest.json`
- `phase_37d_future_ocr_text_regions_schema.json`
- `phase_37d_future_caption_safe_zone_schema.json`
- `phase_37d_future_collision_report_schema.json`
- `phase_37d_future_private_artifact_manifest_schema.json`
- `phase_37d_controlled_real_video_ocr_safe_zone_report.json`

Future private artifact prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/<run-id>/`

Completed execution prefix:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase37d/controlled-real-video-ocr-safe-zone/phase37d-20260531T002046/`

Execution summary:

- Extracted frames: `6`
- OCR text regions: `11`
- Frames with OCR text: `6`
- Lower-third collision frames: `0`
- Caption recommendations available: `6`
- Private JSON artifact objects: `10`

## Commands

```bash
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run smoke:activation-controlled-real-video-ocr-safe-zone
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run activation:controlled-real-video-ocr-safe-zone:plan
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run activation:controlled-real-video-ocr-safe-zone:report
PATH="/Applications/Codex.app/Contents/Resources:$PATH" npm run activation:controlled-real-video-ocr-safe-zone:iam-plan
```

Future-only confirmations are defined but must not be set in Phase 37D:

- `REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_OCR_EXECUTE=true`
- `REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_FRAME_EXTRACTION=true`
- `REEDITPRO_CONFIRM_CONTROLLED_REAL_VIDEO_ARTIFACT_UPLOAD=true`

The Phase 37D planning gate rejects those confirmations if they are set.

## Still Blocked

- Arbitrary real-video OCR and broad media OCR
- Full-video OCR and unapproved windows
- Raw frame upload and overlay upload
- IAM/GCP mutation
- Docker build/push and Cloud Run deploy/job execution
- Provider execution
- Caption/render QA integration and Phase 37E
- Public output and signed URL source-of-truth
- PP-LCNet textline orientation classifier auto-download
- Track A execution code
- Internal beta, external beta, paid production, and broad real-user media

The Phase 37C PaddleOCR dictionary-path limitation is carried forward: the verified dictionary is present, but the installed PaddleOCR constructor did not expose a recognized dictionary-path parameter in the Phase 37C runtime run.
