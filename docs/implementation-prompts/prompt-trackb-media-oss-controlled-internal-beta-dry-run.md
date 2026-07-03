# TRACKB_MEDIA_OSS_CONTROLLED_INTERNAL_BETA_DRY_RUN

## Summary

Run a controlled internal Track B media OSS tool-call dry-run lane after `trackb_media_oss_tool_call_beta_readiness_rerun_passed_ready_for_controlled_internal_beta_dry_run`.

This next phase may validate route/worker contract shape, ranking metadata, approved-snapshot linkage, credit reservation linkage, private artifact references, QA gate linkage, fallback policy linkage, idempotency, result schema, and sanitized logging using dry-run payloads only.

## Boundaries

- Do not execute FFmpeg, FFprobe, Sharp/libvips, DuckDB, Polars, ExifTool, MediaInfo, Tesseract, ImageMagick, OpenCV, PyAV, PySceneDetect, PaddlePaddle, PaddleOCR, OpenColorIO, or OpenImageIO.
- Do not run Docker, OCR inference, image/media processing, render/export, worker dispatch, provider calls, Supabase writes, GCS uploads, public artifacts, signed URLs, raw prompts, beta delivery, or production.
- Keep `executionEnabled: false` and `dryRunOnly: true` unless a later approved runtime gate changes the contract.
- Product-ready local OSS tool count remains `0`.

## Required Checks

- All 16 Track B tools have callable contract metadata.
- All 16 Track B tools have deterministic ranking metadata.
- Disabled route metadata still covers validate, queue, and status.
- Payload validation fails closed without approved snapshot, edit plan, idempotency, credit reservation, private artifact references, QA gates, fallback policy, and result schema.
- Public URLs, signed URLs, raw prompts, and raw chat execution payloads remain rejected.
- Supabase classification remains: no write / environment none / SQL none / migration no.
