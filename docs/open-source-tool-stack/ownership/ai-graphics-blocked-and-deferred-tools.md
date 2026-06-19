# AI Graphics Blocked And Deferred Tools

Decision: `ai_graphics_implementation_state_scan_completed_ready_for_draft_proof_promotion_review`

| Category | Tools | Status |
| --- | --- | --- |
| Track B excluded | `ffmpeg`, `ffprobe`, `sharp_libvips`, `duckdb`, `polars`, `opencv`, `pyav`, `pyscenedetect`, `paddleocr`, `paddlepaddle`, `mediainfo`, `exiftool`, `imagemagick_graphicsmagick`, `tesseract`, `opencolorio`, `openimageio` | not owned by Atlas |
| Track A excluded | `remotion`, `film`, `libass`, `opentimelineio`, `hyperframe`, `gstreamer`, `bento4_mp4box`, `mkvtoolnix`, `vapoursynth`, `revideo` | not owned by Atlas |
| Background fallback decision | `rembg`, `transparent_background` | defer_or_drop_after_backlog_review |
| Future model-weight review | `sam2`, `birefnet`, `real_esrgan`, `transformers` | model_weight_review_later |
| Future browser/WebGL/canvas sandbox | `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs` | browser_webgl_sandbox_later |

No blocked/deferred item is runtime-ready or beta-ready.
