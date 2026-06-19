# Atlas Track A Blocked Scope Register

## Blocked In This Phase

- tool installation
- tool execution
- media processing
- FFmpeg or FFprobe probing/execution
- libass burn-in execution
- Remotion render execution
- OpenTimelineIO runtime validation execution
- GStreamer, Bento4/MP4Box, MKVToolNix, VapourSynth, Revideo, or FILM execution
- model weight download or review execution
- Worker Runtime job execution
- Tool Route execution
- provider/model calls
- Supabase mutation
- SQL execution
- migration deployment
- private artifact or GCS access
- signed URL creation
- public artifact creation
- internal beta unlock
- external beta unlock
- production unlock
- final render/export
- paid production
- broad media

## Ownership Blockers

Track B-owned global tools remain blocked from Atlas ownership: `ffmpeg`, `ffprobe`, `sharp_libvips`, `duckdb`, `polars_nodejs_polars`, `opencv`, `pyav`, `pyscenedetect`, `paddleocr`, `paddlepaddle`, `mediainfo`, `exiftool`, `imagemagick_graphicsmagick`, `tesseract`, `opencolorio`, `openimageio`.

AI Graphics / Worker-owned tools remain blocked from Atlas ownership: `sam2`, `kornia`, `birefnet`, `real_esrgan`, `d3`, `echarts`, `vega`, `vega_lite`, `satori`, `svg_js`, `viz_js`, `lottie_web`, `animejs`, `three`, `pixi_js`, `konva`, `babylonjs`, `torch`, `torchvision`, `transformers`, `rembg`, `transparent_background`.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, media processing, or broad service-role handler was enabled.
