# Central Tool Owner Registry

Status: `ownership_claim_scoped_pending_merge_order`

Patch type: Docs/diagnostics-only central tool ownership registry follow-up repair for TOOL-OWNER-CONFLICT-SCAN-1.

Base PR: [#544](https://github.com/yuzastudio6-cyber/Reedkt/pull/544)

## Central Registry Path Decision

Keep `docs/tool-ownership/central-tool-owner-registry.json` as the PR #544 Track A registry path.

Cross-reference existing owner sources under `docs/open-source-tool-stack/owner-registry/` and `docs/open-source-tool-stack/ownership/`. Do not move, merge, or replace those registry trees in this PR.

## Purpose

The registry prevents duplicate tool ownership across chats and workstreams. Atlas Track A owns only scoped Track A Render/Export responsibility labels. It does not own raw global OSS packages owned by Track B, AI Tools / Creative Graphics / Worker, Sound/Music/Audio, Web Search/Capture, Map/Geospatial, Provider/API, Worker Runtime, Supabase, or Billing lanes.

Product-ready end-to-end local OSS tools remain `0`.

## Registered Owner

ownerDisplayName: Atlas Track A

ownerId: owner_tracka_visual_render_export

workstream: TRACK_A_VISUAL_RENDER_EXPORT

responsibilityType: tracka_scoped_visual_render_export_ownership

currentStatus: ownership_claim_scoped_pending_merge_order

duplicateRisk: resolved_to_expanded_scoped_tracka_claims

nextRequiredAction: MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544

postMergeNextPrompt: TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1

lastUpdatedByBranch: codex/rp-tool-owner-registry-1-atlas-tracka-visual-render-export

## Claimed Scoped Tools

These are scoped Track A Render/Export responsibility labels only. They do not permit installation, execution, media processing, worker runtime, final delivery, beta, or production unlock.

| claimedScopedTool | classification |
| --- | --- |
| remotion_render_validation | keep_owned_by_atlas_tracka |
| opentimelineio_timeline_validation | keep_owned_by_atlas_tracka |
| hyperframe_render_handoff | keep_owned_by_atlas_tracka |
| libass_caption_burnin | keep_owned_by_atlas_tracka |
| gstreamer_render_pipeline_support | keep_owned_by_atlas_tracka |
| bento4_mp4box_packaging_validation | keep_owned_by_atlas_tracka |
| mkvtoolnix_container_validation | keep_owned_by_atlas_tracka |
| vapoursynth_frame_pipeline | keep_owned_by_atlas_tracka |
| revideo_render_preview_alternative | keep_owned_by_atlas_tracka |
| film_frame_interpolation | keep_owned_by_atlas_tracka |
| tracka_caption_burnin_policy_e2e | keep_owned_by_atlas_tracka |
| tracka_render_export_private_review_path | keep_owned_by_atlas_tracka |
| tracka_visual_video_private_e2e | keep_owned_by_atlas_tracka |

## Shared Dependencies Owned Elsewhere

These raw upstream dependencies are not Atlas Track A-owned tools. Atlas Track A may coordinate with the owning lane only through a future approved handoff.

| sharedDependency | owning lane |
| --- | --- |
| ffmpeg | TRACK_B_MEDIA_OSS_STEWARD, PR #542 |
| ffprobe | TRACK_B_MEDIA_OSS_STEWARD, PR #542 |
| sharp_libvips | TRACK_B_MEDIA_OSS_STEWARD, PR #542 |
| opencolorio | TRACK_B_MEDIA_OSS_STEWARD, PR #542 |
| openimageio | TRACK_B_MEDIA_OSS_STEWARD, PR #542 |
| sam2 | AI Tools / Creative Graphics / Worker, PR #543 |
| kornia | AI Tools / Creative Graphics / Worker, PR #543 |
| birefnet | AI Tools / Creative Graphics / Worker, PR #543 |
| real_esrgan | AI Tools / Creative Graphics / Worker, PR #543 |

## Dropped Claims

dropped_to_track_b_owner:

- ffmpeg
- ffprobe
- sharp_libvips
- opencolorio
- openimageio

dropped_to_ai_graphics_worker_owner:

- sam2
- kornia
- birefnet
- real_esrgan

dropped_or_not_claimed_due_other_lanes:

- Track B media processing tools
- AI creative graphics tools
- Sound/Music/Audio tools
- Web Search/Capture tools
- Map/Geospatial tools
- Provider/API tools
- Worker Runtime infrastructure
- Supabase schema/RLS/migrations
- Billing/Stripe/credits

## Explicit Non-Owned Tool Sets

TRACK_B_MEDIA_OSS_STEWARD owns exactly these 16 tools: `ffmpeg`, `ffprobe`, `sharp_libvips`, `duckdb`, `polars_nodejs_polars`, `opencv`, `pyav`, `pyscenedetect`, `paddleocr`, `paddlepaddle`, `mediainfo`, `exiftool`, `imagemagick_graphicsmagick`, `tesseract`, `opencolorio`, `openimageio`.

AI Tools / Creative Graphics / Worker owns or responsibility-scopes: `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svg_js`, `viz_js`, `lottie_web`, `animejs`, `three`, `pixi_js`, `konva`, `babylonjs`, `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `rembg`, `transparent_background`, `real_esrgan`, `kornia`.

Sound/Music/Audio owns: `deepfilternet`, `signalsmith_stretch`, `demucs`, `audioflux`, `rnnoise`, `librosa`, `soundfile_libsndfile`, `sox`, `rubber_band`, `aubio`, `essentia`, `mmaudio`.

Web Search/Capture owns: `playwright_chromium`.

Map/Geospatial owns: `maplibre`, `turf`, `gdal_ogr`, `tippecanoe`, `pmtiles`, `deck_gl`, `cesium_js`.

Provider/API lanes own: `qwen_deepseek_provider_apis`, `lyria_provider_api`, `mirelo_provider_api`, `vllm`, `qwen3_vl`, `onnx_runtime_when_provider_or_runtime_infrastructure`.

Worker Runtime infrastructure, Supabase schema/RLS/migrations, and Billing/Stripe/credits are explicitly not owned by Atlas Track A.

## Conflict Scan Evidence

- #544 Track A visual render owner
- #543 AI Graphics owner assignment
- #542 Track B media OSS steward owner registry
- #534 Open-source tool stack refresh after AI graphics worker
- #536 Open-source tool stack refresh after AI graphics worker QA review
- #529 Open-source tool stack owner-lane reconciliation after Batch 1 rollup
- #533 Open-source tool stack staged owner merge plan after Batch 1 rollup

## Unresolved Conflicts

none

## Next Prompt

MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
