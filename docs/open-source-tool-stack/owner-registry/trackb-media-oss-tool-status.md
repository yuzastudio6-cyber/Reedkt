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

<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL:

- Decision: `trackb_media_oss_milestone1_system_packaging_approval_passed_ready_for_packaging_execution`.
- Future packaging target: `docker/prod/cpu-worker/Dockerfile`.
- Approved future packages: `libimage-exiftool-perl`, `mediainfo`, `tesseract-ocr`, `tesseract-ocr-eng`, `imagemagick`.
- GraphicsMagick role: optional fallback only; ImageMagick is the Milestone 1 default.
- Current phase execution: no package install, Dockerfile mutation, Docker build/run, tool execution, media processing, render/export, worker/route/provider execution, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production.
- End-to-end product-ready Track B tools remain `0`; no 40+ installed/proven end-to-end claim is allowed.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION`.
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_APPROVAL_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION:

- Decision: `trackb_media_oss_milestone1_system_packaging_execution_blocked_pending_docker_build_context`
- Owner: `TRACK_B_MEDIA_OSS_STEWARD`
- Target: `docker/prod/cpu-worker/Dockerfile`
- Approved package set: `libimage-exiftool-perl`, `mediainfo`, `tesseract-ocr`, `tesseract-ocr-eng`, `imagemagick`
- Target tools: ExifTool, MediaInfo, Tesseract, and ImageMagick only.
- GraphicsMagick remains optional fallback and is not installed by default.
- End-to-end product-ready Track B tools remain `0`; no 40+ installed/proven end-to-end claim is allowed.
- Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_BUILD_CONTEXT_BLOCKER_FOLLOWUP`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_1_SYSTEM_PACKAGING_EXECUTION_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_BLOCKER_FOLLOWUP_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_BLOCKER_FOLLOWUP:

- Decision: `trackb_media_oss_milestone1_build_context_followup_blocked_by_tesseract_proof`
- Owner: `TRACK_B_MEDIA_OSS_STEWARD`
- Build-context outputs: `dist-server`, `dist-staging-fixture-worker` generated locally and cleaned before commit.
- Target Dockerfile: `docker/prod/cpu-worker/Dockerfile`
- Local image tag: `reeditpro-cpu-worker:trackb-milestone1-cd4e5f0e234c4ff4bf3cefacba84a2f31530c3e8`
- Target tools: ExifTool, MediaInfo, Tesseract, and ImageMagick only.
- GraphicsMagick remains optional fallback and is not installed or proven by default.
- End-to-end product-ready Track B tools remain `0`; no 40+ installed/proven end-to-end claim is allowed.
- Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_FOLLOWUP_BLOCKER_REVIEW`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_1_BUILD_CONTEXT_BLOCKER_FOLLOWUP_STATUS:end -->

<!-- TRACKB_MILESTONE_1_TESSERACT_FIXTURE_FOLLOWUP_STATUS:start -->
Decision: `trackb_media_oss_milestone1_tesseract_fixture_followup_passed_ready_for_qa`.
Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW`.
PR #557 evidence remains accepted for ExifTool, MediaInfo, ImageMagick, Docker build, build-context generation, and Tesseract version proof.
Tesseract fixture proof accepted variant: `dejavu_sans_bold_large_psm7`.
Track B end-to-end product-ready tools remain `0`; do not claim 40+ tools are installed/proven end-to-end.
Supabase classification: no write / none / none / no.
<!-- TRACKB_MILESTONE_1_TESSERACT_FIXTURE_FOLLOWUP_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW:

- Decision: `trackb_media_oss_milestone1_qa_passed_ready_for_milestone2_video_analysis_approval`
- Accepted Milestone 1 tools: ExifTool, MediaInfo, Tesseract, and ImageMagick.
- PR #557 evidence remains accepted for ExifTool, MediaInfo, ImageMagick, Docker build/build-context, and Tesseract version proof.
- PR #559 evidence is accepted for Tesseract fixture proof variant `dejavu_sans_bold_large_psm7` with normalized OCR `REEDITPRO`.
- Track B counts after QA: 16 owned tools, 9 bounded accepted/proven tools, 7 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.
- GraphicsMagick remains optional fallback only and is not counted as accepted/proven.
- Do not claim 40+ tools are installed/proven end-to-end.
- Media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_2_VIDEO_ANALYSIS_APPROVAL`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_1_QA_REVIEW_STATUS:end -->
