# TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1 Duplicate Scan

Duplicate scan result: `completed_no_unresolved_conflicts`.

Unresolved duplicate ownership conflicts: `none`.

## Sources Checked

- #544 `[tools] Register Track A visual render tool owner`
- #547 `[track-a] Atlas Track A open-source tool inventory`
- #542 `[tools] Track B media OSS steward owner registry`
- #543 `[tools] Register AI graphics owner assignment`
- #534 and #536 open-source tool stack refresh packets
- `docs/tool-ownership/`
- `docs/open-source-tool-stack/`
- `docs/track-a/`
- `docs/internal-beta/`
- `docs/tool-routes/`
- `docs/worker-runtime/`
- `docs/supabase-worker-runtime/`
- `server/tool-registry/`
- `docker/prod/`
- `package.json`
- `package-lock.json`

## Duplicate Decisions

| Candidate | Classification | Decision |
| --- | --- | --- |
| `libass_caption_burnin` | `keep_owned_by_atlas_tracka` | Scoped Track A caption burn-in responsibility only; no broad libass ownership or execution claim. |
| `opentimelineio_timeline_validation` | `keep_owned_by_atlas_tracka` | Scoped Track A timeline validation responsibility only; no OTIO execution claim. |
| `tracka_caption_burnin_policy_e2e` | `keep_owned_by_atlas_tracka` | Scoped Track A caption policy/private E2E handoff only. |
| `tracka_render_export_private_review_path` | `keep_owned_by_atlas_tracka` | Scoped private review path planning only. |
| `ffmpeg` | `owned_by_other_workstream_drop_from_atlas` | Track B owns broad/global FFmpeg. Atlas Track A keeps only handoff references. |
| `ffprobe` | `owned_by_other_workstream_drop_from_atlas` | Track B owns broad/global FFprobe. Atlas Track A keeps only handoff references. |

## Explicit Non-Claims

Atlas Track A does not claim Track B Media OSS Steward tools:

`ffmpeg`, `ffprobe`, `sharp_libvips`, `duckdb`, `polars_nodejs_polars`, `opencv`, `pyav`, `pyscenedetect`, `paddleocr`, `paddlepaddle`, `mediainfo`, `exiftool`, `imagemagick_graphicsmagick`, `tesseract`, `opencolorio`, `openimageio`

Atlas Track A does not claim AI Graphics / Worker tools:

`sam2`, `kornia`, `birefnet`, `real_esrgan`, `d3`, `echarts`, `vega`, `vega_lite`, `satori`, `svg_js`, `viz_js`, `lottie_web`, `animejs`, `three`, `pixi_js`, `konva`, `babylonjs`, `torch`, `torchvision`, `transformers`, `rembg`, `transparent_background`

Product-ready end-to-end local OSS tools: `0`.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, tool execution, media processing, or broad service-role handler was enabled.
