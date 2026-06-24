# AI Graphics Runtime Boundary Canonicalization QA Matrix

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_canonicalization_qa_passed_with_warnings`

## Runtime Buckets

- `planning_metadata_allowed_now`: QA accepted; no current agent execution or runtime unlocked.
- `cpu_static_execution_previously_validated_but_not_agent_executable_now`: QA accepted; no current agent execution or runtime unlocked.
- `browser_chart_runtime_later`: QA accepted; no current agent execution or runtime unlocked.
- `animation_runtime_later`: QA accepted; no current agent execution or runtime unlocked.
- `browser_canvas_webgl_runtime_later`: QA accepted; no current agent execution or runtime unlocked.
- `model_cpu_gpu_runtime_later`: QA accepted; no current agent execution or runtime unlocked.
- `tool_route_handoff_later`: QA accepted; no current agent execution or runtime unlocked.
- `worker_handoff_later`: QA accepted; no current agent execution or runtime unlocked.
- `public_artifact_and_signed_url_later`: QA accepted; no current agent execution or runtime unlocked.

## Tools

- `torch_torchvision`: QA accepted for planning/study metadata only; agent/tool execution false.
- `transformers`: QA accepted for planning/study metadata only; agent/tool execution false.
- `sam2`: QA accepted for planning/study metadata only; agent/tool execution false.
- `birefnet`: QA accepted for planning/study metadata only; agent/tool execution false.
- `real_esrgan`: QA accepted for planning/study metadata only; agent/tool execution false.
- `kornia`: QA accepted for planning/study metadata only; agent/tool execution false.
- `rembg`: QA accepted for planning/study metadata only; agent/tool execution false.
- `transparent_background`: QA accepted for planning/study metadata only; agent/tool execution false.
- `d3`: QA accepted for planning/study metadata only; agent/tool execution false.
- `echarts`: QA accepted for planning/study metadata only; agent/tool execution false.
- `vega_lite`: QA accepted for planning/study metadata only; agent/tool execution false.
- `vega`: QA accepted for planning/study metadata only; agent/tool execution false.
- `satori`: QA accepted for planning/study metadata only; agent/tool execution false.
- `svgdotjs_svg_js`: QA accepted for planning/study metadata only; agent/tool execution false.
- `viz_js`: QA accepted for planning/study metadata only; agent/tool execution false.
- `lottie_web`: QA accepted for planning/study metadata only; agent/tool execution false.
- `animejs`: QA accepted for planning/study metadata only; agent/tool execution false.
- `three_js`: QA accepted for planning/study metadata only; agent/tool execution false.
- `pixi_js`: QA accepted for planning/study metadata only; agent/tool execution false.
- `konva`: QA accepted for planning/study metadata only; agent/tool execution false.
- `babylonjs`: QA accepted for planning/study metadata only; agent/tool execution false.

## Capabilities

- `chart_overlay`: QA accepted; product-facing capability category; runtime remains blocked.
- `data_visualization`: QA accepted; product-facing capability category; runtime remains blocked.
- `svg_graphics`: QA accepted; product-facing capability category; runtime remains blocked.
- `diagram_graphics`: QA accepted; product-facing capability category; runtime remains blocked.
- `animation_overlay`: QA accepted; product-facing capability category; runtime remains blocked.
- `canvas_scene`: QA accepted; product-facing capability category; runtime remains blocked.
- `webgl_3d_scene`: QA accepted; product-facing capability category; runtime remains blocked.
- `background_removal`: QA accepted; product-facing capability category; runtime remains blocked.
- `subject_segmentation`: QA accepted; product-facing capability category; runtime remains blocked.
- `upscaling`: QA accepted; product-facing capability category; runtime remains blocked.
- `tensor_image_ops`: QA accepted; product-facing capability category; runtime remains blocked.
- `model_runtime_foundation`: QA accepted; product-facing capability category; runtime remains blocked.

## Boundary

Agent planning/study metadata selection is allowed. Agent execution, tool execution, route execution, worker execution, provider/model execution, browser/WebGL/canvas runtime, GPU/model runtime, Supabase/GCS, signed URLs, public artifacts, runtime readiness, internal beta, external beta, production, dependency install, package-lock mutation remain false. Track B remains under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export exclusion remains evidence-only context via PR #544.
