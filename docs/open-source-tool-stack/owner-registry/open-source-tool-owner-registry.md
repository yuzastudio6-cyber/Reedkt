# Open-Source Tool Owner Registry

Decision: `trackb_media_oss_steward_registry_passed_ready_for_install_proof_milestone_plan`

This registry records source-of-truth ownership for local/professional open-source tool install-proof coordination after the Batch 1 rollup and owner-lane reconciliation.

| Owner ID | Owner | Lane | Scope | Owned tools | Accepted/proven bounded | Blocked/not installed-proven | End-to-end product-ready |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: |
| `TRACK_B_MEDIA_OSS_STEWARD` | Track B Media OSS Steward | `TRACK_B_MEDIA_PROCESSING` | Local/professional open-source tools only | 16 | 16 | 0 | 0 |

## Source Evidence

- PR #416: 71-candidate open-source inventory.
- PR #522: Batch 1 final rollup accepting Sharp/libvips, DuckDB, Polars, FFmpeg, and FFprobe only within bounded proof limits.
- PR #527: Batch 2 planning with 16 Track B media candidates.
- PR #529: owner-lane reconciliation preserving 71 inventoried candidates, 13 AI graphics accepted-with-warnings, and 0 end-to-end product-ready tools.

Do not claim 40+ tools are installed/proven end-to-end. Batch 1 proof remains bounded, and media processing, render/export, worker/route/provider runtime, Supabase/GCS/public delivery, signed URLs, raw prompts, beta, and production remain blocked.

Next prompt: `TRACKB_MEDIA_OSS_INSTALL_PROOF_MILESTONE_PLAN`.

Supabase classification: no write / environment none / SQL none / migration no.

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
