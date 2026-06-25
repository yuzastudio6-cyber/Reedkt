# Track B Media OSS Steward

Decision: `trackb_media_oss_steward_registry_passed_ready_for_install_proof_milestone_plan`

Owner ID: `TRACK_B_MEDIA_OSS_STEWARD`

Lane: `TRACK_B_MEDIA_PROCESSING`

Scope type: local/professional open-source tools only.

Responsibility: central/local OSS media-processing tool install-proof, status tracking, duplicate prevention, and source-of-truth reporting.

## Boundary

The steward owns Track B media OSS install-proof coordination. It does not own AI graphics worker tools, Sound/Music/Audio tools, Track A render/export runtime tools, provider/API tools, Supabase/GCS/public delivery, signed URLs, beta, or production unlocks.

## Tool Status

| Tool | Status | Boundary |
| --- | --- | --- |
| FFmpeg | Accepted/proven bounded Batch 1 | Track A container version proof only, `5.1.9-0+deb12u1`; no media processing |
| FFprobe | Accepted/proven bounded Batch 1 | Track A container version proof only, `5.1.9-0+deb12u1`; no media file probing |
| Sharp/libvips | Accepted/proven bounded Batch 1 | Import/version proof only, no image processing |
| DuckDB | Accepted/proven bounded Batch 1 | Native rebuild, import/API shape, tiny in-memory query |
| Polars / nodejs-polars | Accepted/proven bounded Batch 1 | Import/version and tiny in-memory dataframe metadata |
| OpenCV | Blocked/not installed-proven | Future Track B install-proof milestone required |
| PyAV | Blocked/not installed-proven | Future Track B install-proof milestone required |
| PySceneDetect | Blocked/not installed-proven | Future Track B install-proof milestone required |
| PaddleOCR | Blocked/not installed-proven | Future Track B install-proof milestone required |
| PaddlePaddle | Blocked/not installed-proven | Future Track B install-proof milestone required |
| MediaInfo | Blocked/not installed-proven | Future Track B install-proof milestone required |
| ExifTool | Blocked/not installed-proven | Future Track B install-proof milestone required |
| ImageMagick / GraphicsMagick | Blocked/not installed-proven | Future Track B install-proof milestone required |
| Tesseract | Blocked/not installed-proven | Future Track B install-proof milestone required |
| OpenColorIO | Accepted/proven bounded Milestone 4 color/image CPU | Import/version/raw Config API-shape proof only; no image processing |
| OpenImageIO | Accepted/proven bounded Milestone 4 color/image CPU | Import/version/ImageSpec/ImageBuf API-shape proof only; no file I/O or image processing |

Counts: 16 owned tools, 16 accepted/proven bounded, 0 blocked/not installed-proven, 0 end-to-end product-ready tools.

Do not claim 40+ tools are installed/proven end-to-end. Media processing, render/export, workers, routes, providers, Supabase/GCS, public delivery, signed URLs, raw prompts, beta, and production remain blocked.

## Install/Proof Milestone Plan

Decision: `trackb_media_oss_install_proof_milestone_plan_passed_ready_for_milestone_1_execution`

The milestone plan records CPU/GPU placement for all 16 owned Track B media OSS tools and approves only future Milestone 1 execution for ExifTool, MediaInfo, Tesseract, and ImageMagick / GraphicsMagick.

This phase does not install tools, mutate package-lock, process media, render/export, run workers/routes/providers, or unlock beta/production.

Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_1_LOW_RISK_METADATA_TOOLING_EXECUTION`.

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

<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW:

- Decision: `trackb_media_oss_milestone3_ocr_ml_cpu_gpu_review_passed_ready_for_cpu_execution`
- Review tools: PaddleOCR and PaddlePaddle.
- Future CPU target: `docker/prod/ocr-runtime/Dockerfile` with `docker/prod/ocr-runtime/requirements.ocr.txt`.
- Package strategy: existing pinned `paddlepaddle==3.0.0` and `paddleocr==3.0.0` remain future execution inputs; no requirements mutation occurred in this review.
- CPU proof policy: future import/version/API-shape and model-free tensor/device checks only.
- Model asset policy: OCR inference remains blocked until model asset provenance, checksum, and private storage approval lands.
- GPU policy: future-only and requires separate approval for heavy OCR, frame-heavy batches, high-resolution OCR, or CPU latency/timeouts.
- Track B counts remain: 16 owned tools, 12 bounded accepted/proven tools, 4 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.
- Still blocked/not installed-proven: PaddleOCR, PaddlePaddle, OpenColorIO, and OpenImageIO.
- Forty-plus end-to-end proof claims remain disallowed.
- No package install, npm ci/install/rebuild, pip install, requirements mutation, Dockerfile mutation, Docker build/run, PaddleOCR/PaddlePaddle execution, OCR inference, model download/copy/upload, GPU job, media processing, render/export, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, or production scope ran.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_GPU_REVIEW_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION:

- Decision: `trackb_media_oss_milestone3_ocr_ml_cpu_execution_blocked_by_paddlepaddle_import_or_api_shape`
- Owner: `TRACK_B_MEDIA_OSS_STEWARD`
- Target: `docker/prod/ocr-runtime/Dockerfile` with `docker/prod/ocr-runtime/requirements.ocr.txt`.
- Target tools: PaddlePaddle and PaddleOCR only.
- Build-context generation: not required for the OCR runtime target.
- Local image tag: `reeditpro-ocr-runtime:trackb-milestone3-cpu-3cc82ddad41854860a4b06421dc9e22e74a1435f`
- Canonical Track B counts remain pending QA: 16 owned tools, 12 bounded accepted/proven tools, 4 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.
- Newly proofed CPU evidence pending QA: `0`.
- Do not claim 40+ tools are installed/proven end-to-end.
- No OCR inference, model download/copy/upload, GPU execution, real media/documents, FFmpeg/FFprobe, other Track B tool execution, render/export, workers/routes/providers, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production scope is accepted.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_BLOCKER_FOLLOWUP`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_BLOCKER_FOLLOWUP_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_BLOCKER_FOLLOWUP:

- Decision: `trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_paddleocr_import_or_api_shape`
- Owner: `TRACK_B_MEDIA_OSS_STEWARD`
- Target: `docker/prod/ocr-runtime/Dockerfile` with `docker/prod/ocr-runtime/requirements.ocr.txt`.
- Target tools: PaddlePaddle and PaddleOCR only.
- Build-context generation: not required for the OCR runtime target.
- Local image tag: `reeditpro-ocr-runtime:trackb-milestone3-cpu-libgomp-b17a20898d5c046447905e5a411a733133afa535`
- Canonical Track B counts remain pending QA: 16 owned tools, 12 bounded accepted/proven tools, 4 still blocked/not installed-proven tools, 0 end-to-end product-ready tools.
- Newly proofed CPU evidence pending QA: `0`.
- Do not claim 40+ tools are installed/proven end-to-end.
- No OCR inference, model download/copy/upload, GPU execution, real media/documents, FFmpeg/FFprobe, other Track B tool execution, render/export, workers/routes/providers, Supabase/GCS, public artifact, signed URL, raw prompt, beta, or production scope is accepted.
- Next prompt: `TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_BLOCKER_FOLLOWUP_RESOLUTION`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_3_OCR_ML_CPU_EXECUTION_BLOCKER_FOLLOWUP_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_QA_REVIEW_STATUS:start -->
TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_QA_REVIEW_STATUS:

- Decision: `trackb_media_oss_milestone4_color_image_pipeline_qa_passed_ready_for_trackb_final_rollup`
- PR #648 bounded CPU/container evidence is accepted for OpenColorIO and OpenImageIO.
- OpenColorIO: `PyOpenColorIO` import/version 2.5.2 and raw `Config` API-shape proof accepted under `--network none`.
- OpenImageIO: import/version 3.1.14.1 and `ImageSpec`/`ImageBuf` API-shape proof accepted under `--network none` without file I/O.
- Track B counts after QA: 16 owned tools, 16 bounded accepted/proven tools, 0 blocked/not installed-proven tools, 0 end-to-end product-ready tools.
- Product runtime, image/media processing, render/export, GPU, FFmpeg/FFprobe reruns, workers/routes/providers, Supabase/GCS, public artifacts, signed URLs, raw prompts, beta, and production remain blocked.
- No 40+ tools installed/proven end-to-end claim is allowed.
- Next prompt: `TRACKB_MEDIA_OSS_FINAL_ROLLUP`
- Supabase classification: no write / environment none / SQL none / migration no.
<!-- TRACKB_MEDIA_OSS_MILESTONE_4_COLOR_IMAGE_PIPELINE_QA_REVIEW_STATUS:end -->

<!-- TRACKB_MEDIA_OSS_FINAL_ROLLUP_STATUS:start -->
TRACKB_MEDIA_OSS_FINAL_ROLLUP:

- Decision: `trackb_media_oss_final_rollup_passed_ready_for_tool_call_beta_readiness_review`
- Owner: `TRACK_B_MEDIA_OSS_STEWARD`.
- Final coverage: 16 owned / 16 bounded accepted-proven / 0 blocked-not-installed-proven / 0 product-ready.
- All owned tools are ready for the dedicated tool-call beta-readiness review.
- Direct tool calls, internal beta, external beta, and production remain blocked until the next gate proves callable worker/route contracts and beta hardening.
- Next prompt: `TRACKB_MEDIA_OSS_TOOL_CALL_BETA_READINESS_REVIEW`
<!-- TRACKB_MEDIA_OSS_FINAL_ROLLUP_STATUS:end -->
