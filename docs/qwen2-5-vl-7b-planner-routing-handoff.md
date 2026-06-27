# QWEN2_5_VL 7B Planner Routing Handoff

## Status

Decision: `qwen_vl_planner_routing_handoff_metadata_only`

This packet hands Qwen2.5-VL routing choices to the planner/tool-routing layer as metadata only. It does not call Qwen, invoke Cloud Run, dispatch workers, run inference, download model weights, create generated assets, mutate Supabase, create signed URLs, create public artifacts, process media, render, export, spend credits, unlock beta, or unlock production.

## Purpose

The handoff lets ReeditPro planning code reason about Qwen route choices from structured planner tasks before runtime execution exists.

It preserves the required path:

1. structured intent
2. approved plan snapshot
3. credit reservation
4. queue lease
5. private source references
6. bounded Qwen use-case routing metadata
7. future worker execution only after separate approval

Raw chat is not a worker payload.

## Planner Task Coverage

| Planner task | Source | Handoff result |
| --- | --- | --- |
| planner_source_sequence_map_visual_understanding | source sequence map | primary metadata route |
| planner_product_demo_step_detection | edit-intent visual analysis | primary metadata route |
| planner_broll_relevance_scoring | B-roll asset plan | primary metadata route |
| planner_generated_asset_visual_qa | generated asset QA plan | primary metadata route |
| planner_caption_visual_collision_review | caption layout QA plan | advisory metadata route |
| planner_ocr_layout_context_review | controlled tool QA plan | advisory metadata route |
| planner_chart_screen_context_review | controlled tool QA plan | advisory metadata route |
| planner_safe_zone_semantic_signal | caption layout QA plan | advisory metadata route |
| planner_blocked_ai_video_generation_request | blocked execution request | blocked policy route |
| planner_blocked_final_export_request | blocked execution request | blocked policy route |
| planner_blocked_raw_chat_request | blocked execution request | blocked policy route |
| planner_blocked_frontend_request | blocked execution request | blocked policy route |
| planner_blocked_unbounded_video_request | blocked execution request | blocked policy route |

## Tool Ownership Boundaries

- Qwen is visual understanding and visual QA metadata only.
- Wan remains primary generated B-roll.
- LTX remains secondary fast-preview/image-to-video.
- Mochi remains fallback/research.
- Hunyuan remains gated.
- PaddleOCR remains exact OCR/text authority.
- OpenCV remains deterministic frame sampling, region, and safe-zone support.
- D3, ECharts, and Vega-Lite remain exact chart/dataviz routes.
- Remotion remains final layout/composition.
- FFmpeg and ffprobe remain media/export integrity.

## Runtime Gates

All planner handoffs keep these false:

- planner dispatch
- Cloud Run invocation
- inference
- generated asset creation
- render/export
- raw prompt use
- dry-run pass claim

Every selected handoff is metadata-only and still depends on future private invocation auth, worker runtime dispatch acceptance, model runtime execution approval, QA evidence, billing evidence, and owner gates.

## Current Blocker

Private Cloud Run invocation is still blocked until local gcloud auth is refreshed and the guarded read-only auth preflight can confirm Cloud Run/IAM readiness without fetching tokens or invoking the service.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_42-PLANNER-UI-SURFACING: surface Qwen planner route choices in mock tool planning UI, no inference`
