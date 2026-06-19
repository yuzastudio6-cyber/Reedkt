# Owner: Atlas Track A

ownerDisplayName: Atlas Track A

ownerId: owner_tracka_visual_render_export

workstream: TRACK_A_VISUAL_RENDER_EXPORT

ownerRole: Scoped owner for Track A Render/Export responsibility labels only.

responsibilityType: tracka_scoped_visual_render_export_ownership

currentStatus: ownership_claim_scoped_pending_merge_order

humanOwnerPromptSource: current chat request

duplicateRisk: resolved_to_expanded_scoped_tracka_claims

nextRequiredAction: MERGE-EXECUTION -- TOOL-OWNER-REGISTRY-1 / PR #544

postMergeNextPrompt: TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1

lastUpdatedByBranch: codex/rp-tool-owner-registry-1-atlas-tracka-visual-render-export

## Conflict Scan Decision

TOOL-OWNER-CONFLICT-SCAN-1 decision: `completed_expanded_scoped_ownership_repair_clean`

Atlas Track A does not claim global OSS packages. It owns only scoped Track A Render/Export responsibility labels and may coordinate with other owners only through future approved handoffs.

Product-ready end-to-end local OSS tools remain `0`.

Unresolved conflicts: none

## Claimed Scoped Tools

| claimedScopedTool | classification | boundary |
| --- | --- | --- |
| remotion_render_validation | keep_owned_by_atlas_tracka | Track A render validation responsibility label only; no Remotion runtime execution. |
| opentimelineio_timeline_validation | keep_owned_by_atlas_tracka | Track A timeline validation responsibility label only; no OTIO execution. |
| hyperframe_render_handoff | keep_owned_by_atlas_tracka | Track A render handoff boundary only. |
| libass_caption_burnin | keep_owned_by_atlas_tracka | Track A caption burn-in responsibility label only; no libass execution. |
| gstreamer_render_pipeline_support | keep_owned_by_atlas_tracka | Track A render pipeline support label only; no GStreamer execution. |
| bento4_mp4box_packaging_validation | keep_owned_by_atlas_tracka | Track A packaging validation label only; no Bento4 or MP4Box execution. |
| mkvtoolnix_container_validation | keep_owned_by_atlas_tracka | Track A container validation label only; no MKVToolNix execution. |
| vapoursynth_frame_pipeline | keep_owned_by_atlas_tracka | Track A frame pipeline responsibility label only; no VapourSynth execution. |
| revideo_render_preview_alternative | keep_owned_by_atlas_tracka | Track A preview alternative label only; Revideo remains non-executing/evaluation-boundary. |
| film_frame_interpolation | keep_owned_by_atlas_tracka | Track A frame interpolation label only; no FILM execution. |
| tracka_caption_burnin_policy_e2e | keep_owned_by_atlas_tracka | Track A caption burn-in policy and private E2E review handoff. |
| tracka_render_export_private_review_path | keep_owned_by_atlas_tracka | Track A private render/export review path, manifest/checksum/QA policy, and blocked final delivery policy. |
| tracka_visual_video_private_e2e | keep_owned_by_atlas_tracka | Restricted Track A visual-video private E2E review readiness path. |

## Shared Dependencies Owned Elsewhere

| sharedDependency | owning lane | source |
| --- | --- | --- |
| ffmpeg | TRACK_B_MEDIA_OSS_STEWARD | PR #542 merged |
| ffprobe | TRACK_B_MEDIA_OSS_STEWARD | PR #542 merged |
| sharp_libvips | TRACK_B_MEDIA_OSS_STEWARD | PR #542 merged |
| opencolorio | TRACK_B_MEDIA_OSS_STEWARD | PR #542 merged |
| openimageio | TRACK_B_MEDIA_OSS_STEWARD | PR #542 merged |
| sam2 | AI Tools / Creative Graphics / Worker | PR #543 active draft |
| kornia | AI Tools / Creative Graphics / Worker | PR #543 active draft |
| birefnet | AI Tools / Creative Graphics / Worker | PR #543 active draft |
| real_esrgan | AI Tools / Creative Graphics / Worker | PR #543 active draft |

## Dropped Claims

dropped_to_track_b_owner: `ffmpeg`, `ffprobe`, `sharp_libvips`, `opencolorio`, `openimageio`

dropped_to_ai_graphics_worker_owner: `sam2`, `kornia`, `birefnet`, `real_esrgan`

dropped_or_not_claimed_due_other_lanes: Track B media processing tools; AI creative graphics tools; Sound/Music/Audio tools; Web Search/Capture tools; Map/Geospatial tools; Provider/API tools; Worker Runtime infrastructure; Supabase schema/RLS/migrations; Billing/Stripe/credits.

## Explicitly Not Owned

TRACK_B_MEDIA_OSS_STEWARD owns exactly these 16 tools: `ffmpeg`, `ffprobe`, `sharp_libvips`, `duckdb`, `polars_nodejs_polars`, `opencv`, `pyav`, `pyscenedetect`, `paddleocr`, `paddlepaddle`, `mediainfo`, `exiftool`, `imagemagick_graphicsmagick`, `tesseract`, `opencolorio`, `openimageio`.

AI Tools / Creative Graphics / Worker owns or responsibility-scopes SAM2, BiRefNet, Real-ESRGAN, Kornia, Torch/TorchVision, Transformers, and graphics tools such as D3, ECharts, Vega-Lite, Vega, Satori, SVG.js, Viz.js, Lottie, Anime.js, Three, PixiJS, Konva, and BabylonJS.

Sound/Music/Audio, Web Search/Capture, Map/Geospatial, Provider/API, Worker Runtime, Supabase, and Billing lanes remain outside Atlas Track A ownership.

## Conflict Evidence

- #544 Track A visual render owner
- #543 AI Graphics owner assignment
- #542 Track B media OSS steward owner registry
- #534 Open-source tool stack refresh after AI graphics worker
- #536 Open-source tool stack refresh after AI graphics worker QA review
- #529 Open-source tool stack owner-lane reconciliation after Batch 1 rollup
- #533 Open-source tool stack staged owner merge plan after Batch 1 rollup

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, or broad service-role handler was enabled.
