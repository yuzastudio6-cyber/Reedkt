# AI Graphics Runtime Boundary Canonicalization Owner Matrix

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_canonicalization_owner_review_passed_with_warnings`

## Runtime Buckets

- `planning_metadata_allowed_now`: owner accepted; no current agent execution or runtime unlocked.
- `cpu_static_execution_previously_validated_but_not_agent_executable_now`: owner accepted; no current agent execution or runtime unlocked.
- `browser_chart_runtime_later`: owner accepted; no current agent execution or runtime unlocked.
- `animation_runtime_later`: owner accepted; no current agent execution or runtime unlocked.
- `browser_canvas_webgl_runtime_later`: owner accepted; no current agent execution or runtime unlocked.
- `model_cpu_gpu_runtime_later`: owner accepted; no current agent execution or runtime unlocked.
- `tool_route_handoff_later`: owner accepted; no current agent execution or runtime unlocked.
- `worker_handoff_later`: owner accepted; no current agent execution or runtime unlocked.
- `public_artifact_and_signed_url_later`: owner accepted; no current agent execution or runtime unlocked.

## Tools

- `torch_torchvision`: owner accepted for planning/study metadata only; agent/tool execution false.
- `transformers`: owner accepted for planning/study metadata only; agent/tool execution false.
- `sam2`: owner accepted for planning/study metadata only; agent/tool execution false.
- `birefnet`: owner accepted for planning/study metadata only; agent/tool execution false.
- `real_esrgan`: owner accepted for planning/study metadata only; agent/tool execution false.
- `kornia`: owner accepted for planning/study metadata only; agent/tool execution false.
- `rembg`: owner accepted for planning/study metadata only; agent/tool execution false.
- `transparent_background`: owner accepted for planning/study metadata only; agent/tool execution false.
- `d3`: owner accepted for planning/study metadata only; agent/tool execution false.
- `echarts`: owner accepted for planning/study metadata only; agent/tool execution false.
- `vega_lite`: owner accepted for planning/study metadata only; agent/tool execution false.
- `vega`: owner accepted for planning/study metadata only; agent/tool execution false.
- `satori`: owner accepted for planning/study metadata only; agent/tool execution false.
- `svgdotjs_svg_js`: owner accepted for planning/study metadata only; agent/tool execution false.
- `viz_js`: owner accepted for planning/study metadata only; agent/tool execution false.
- `lottie_web`: owner accepted for planning/study metadata only; agent/tool execution false.
- `animejs`: owner accepted for planning/study metadata only; agent/tool execution false.
- `three_js`: owner accepted for planning/study metadata only; agent/tool execution false.
- `pixi_js`: owner accepted for planning/study metadata only; agent/tool execution false.
- `konva`: owner accepted for planning/study metadata only; agent/tool execution false.
- `babylonjs`: owner accepted for planning/study metadata only; agent/tool execution false.

## Capabilities

- `chart_overlay`: owner accepted; product-facing capability category; runtime remains blocked.
- `data_visualization`: owner accepted; product-facing capability category; runtime remains blocked.
- `svg_graphics`: owner accepted; product-facing capability category; runtime remains blocked.
- `diagram_graphics`: owner accepted; product-facing capability category; runtime remains blocked.
- `animation_overlay`: owner accepted; product-facing capability category; runtime remains blocked.
- `canvas_scene`: owner accepted; product-facing capability category; runtime remains blocked.
- `webgl_3d_scene`: owner accepted; product-facing capability category; runtime remains blocked.
- `background_removal`: owner accepted; product-facing capability category; runtime remains blocked.
- `subject_segmentation`: owner accepted; product-facing capability category; runtime remains blocked.
- `upscaling`: owner accepted; product-facing capability category; runtime remains blocked.
- `tensor_image_ops`: owner accepted; product-facing capability category; runtime remains blocked.
- `model_runtime_foundation`: owner accepted; product-facing capability category; runtime remains blocked.

## Boundary

Agent planning/study metadata selection is allowed. Agent execution, tool execution, route execution, worker execution, provider/model execution, browser/WebGL/canvas runtime, GPU/model runtime, Supabase/GCS, signed URL flow, public artifact flow, runtime readiness, internal beta, external beta, production, dependency install, and package-lock mutation remain false. Track B remains under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export exclusion remains evidence-only context via PR #544.
