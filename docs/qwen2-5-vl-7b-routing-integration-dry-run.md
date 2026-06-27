# QWEN2_5_VL 7B Routing Integration Dry-Run

## Status

Decision: `qwen_vl_routing_integration_dry_run_no_inference`

This packet integrates the Qwen2.5-VL use-case ranking table into a deterministic server-side route dry-run. It does not call Qwen, invoke Cloud Run, dispatch workers, run inference, download model weights, create generated assets, create signed URLs, create public artifacts, mutate Supabase, run media processing, render, export, spend credits, unlock beta, or unlock production.

## Purpose

The dry-run proves that structured routing cases can map to Qwen use-case decisions before any live invocation exists.

It answers:

- when Qwen is selected as primary VLM metadata only
- when Qwen is selected as secondary advisory metadata only
- when Qwen is blocked by policy
- which deterministic tools must stay before or after Qwen
- which runtime gates remain required before any future execution

## Synthetic Cases

| Case | Expected result | Boundary |
| --- | --- | --- |
| private_source_frame_understanding | selected primary metadata only | Qwen can reason over approved private frame refs after deterministic sampling |
| private_product_demo_step_understanding | selected primary metadata only | Qwen can interpret step context while exact UI text stays deterministic |
| private_broll_candidate_review | selected primary metadata only | Qwen can review B-roll candidates but cannot generate video |
| private_generated_asset_visual_qa | selected primary metadata only | Qwen can advise generated asset QA before composition/export |
| private_caption_visual_consistency_qa | selected advisory metadata only | Qwen advises after PaddleOCR/OpenCV checks |
| private_ocr_layout_reasoning | selected advisory metadata only | PaddleOCR remains exact text authority |
| private_chart_screen_reasoning | selected advisory metadata only | D3, ECharts, Vega-Lite, and PaddleOCR remain exact chart/screen authorities |
| private_safe_zone_planning_signal | selected advisory metadata only | OpenCV/PaddleOCR/Remotion keep final safe-zone control |
| blocked_ai_video_generation | blocked by policy | Wan/LTX/Mochi/Hunyuan own generated B-roll routes |
| blocked_final_render_export | blocked by policy | Remotion, FFmpeg, and ffprobe own final composition/export/media integrity |
| blocked_raw_chat_worker_execution | blocked by policy | approved snapshot and structured payload required |
| blocked_direct_frontend_invocation | blocked by policy | Qwen remains backend/worker-only |
| blocked_unbounded_long_video_analysis | blocked by policy | bounded sampled frames required |

## Runtime Gates

Every dry-run evaluation keeps these gates closed:

- inference disabled
- Cloud Run invocation disabled
- worker dispatch disabled
- model download disabled
- provider calls disabled
- generated asset creation disabled
- public artifact creation disabled
- signed URL creation disabled
- media processing disabled
- render/export disabled
- frontend invocation disabled
- CPU execution disabled
- dry-run pass unclaimed

Every selected metadata-only route still requires:

- approved plan snapshot
- credit reservation
- queue lease
- structured intent
- private source refs
- private model path
- bounded visual-token budget
- scale-to-zero GPU runtime

## Tool Ordering Rules

Qwen must not replace deterministic or owner-specific tools:

- Wan remains primary generated B-roll.
- LTX remains secondary fast-preview/image-to-video.
- PaddleOCR remains exact OCR/text authority.
- OpenCV remains deterministic sampling, region, and safe-zone support.
- D3, ECharts, and Vega-Lite remain exact chart/dataviz routes.
- Remotion remains final layout and composition owner.
- FFmpeg and ffprobe remain media/export integrity owners.

## Current Blockers

The private invocation lane is still blocked until the guarded read-only auth preflight can run with a refreshed local gcloud auth session. This dry-run does not require that auth and does not fetch identity tokens.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_41-PRIVATE-INVOKE-AUTH-VERIFY-OR-ROUTER-HANDOFF: refresh gcloud auth or hand off Qwen routing dry-run to planner, no inference`
