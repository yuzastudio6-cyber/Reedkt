# Track B Media OSS Tool Status

Decision: `trackb_media_oss_steward_registry_passed_ready_for_install_proof_milestone_plan`

Owner: `TRACK_B_MEDIA_OSS_STEWARD`

| Status group | Count | Tools |
| --- | ---: | --- |
| Accepted/proven bounded Batch 1 | 5 | FFmpeg, FFprobe, Sharp/libvips, DuckDB, Polars / nodejs-polars |
| Blocked/not installed-proven | 11 | OpenCV, PyAV, PySceneDetect, PaddleOCR, PaddlePaddle, MediaInfo, ExifTool, ImageMagick / GraphicsMagick, Tesseract, OpenColorIO, OpenImageIO |
| End-to-end product-ready | 0 | None |

FFmpeg and FFprobe are accepted only as Track A container-path version proof at `5.1.9-0+deb12u1`. That does not authorize media input, file probing, decode/encode, caption burn-in, render/export, worker/runtime execution, public artifacts, signed URLs, beta, or production.

Sharp/libvips, DuckDB, and Polars/nodejs-polars are accepted only within their committed bounded proof lanes. They are not evidence that Track B media processing is product-ready.

## Install/Proof Milestone Plan

Decision: `trackb_media_oss_install_proof_milestone_plan_passed_ready_for_milestone_1_execution`

Milestone 1 future execution is approved for ExifTool, MediaInfo, Tesseract, and ImageMagick / GraphicsMagick. It is CPU-only/default and future-only; no install, package-lock mutation, proof execution, media processing, render/export, worker runtime, Supabase/GCS, public artifact, signed URL, beta, or production scope ran in this planning phase.

Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_LOW_RISK_METADATA_TOOLING_EXECUTION`.

<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_1_LOW_RISK_METADATA_TOOLING_EXECUTION:

- Decision: `trackb_media_oss_milestone1_blocked_pending_container_packaging_approval`
- Owner: `TRACK_B_MEDIA_OSS_STEWARD`
- Scope: ExifTool, MediaInfo, Tesseract, and ImageMagick/GraphicsMagick only.
- CPU/GPU policy: CPU-only/default; no GPU.
- Current result: system binary packaging approval is required before Milestone 1 can pass.
- End-to-end product-ready Track B tools remain `0`; no 40+ installed/proven end-to-end claim is allowed.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_1_EXECUTION_STATUS:end -->
