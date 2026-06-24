# Runtime Boundary Capability Map Owner Review

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_owner_review_passed_with_warnings`

- `chart_overlay`: owner accepts vega_lite, d3, echarts for planning/study metadata only; execution/runtime false.
- `data_visualization`: owner accepts vega_lite, vega, d3, echarts for planning/study metadata only; execution/runtime false.
- `svg_graphics`: owner accepts svgdotjs_svg_js, satori, d3 for planning/study metadata only; execution/runtime false.
- `diagram_graphics`: owner accepts viz_js, svgdotjs_svg_js, d3 for planning/study metadata only; execution/runtime false.
- `animation_overlay`: owner accepts lottie_web, animejs for planning/study metadata only; execution/runtime false.
- `canvas_scene`: owner accepts pixi_js, konva for planning/study metadata only; execution/runtime false.
- `webgl_3d_scene`: owner accepts three_js, babylonjs for planning/study metadata only; execution/runtime false.
- `background_removal`: owner accepts sam2, birefnet, rembg, transparent_background for planning/study metadata only; execution/runtime false.
- `subject_segmentation`: owner accepts sam2, birefnet, rembg, transparent_background for planning/study metadata only; execution/runtime false.
- `upscaling`: owner accepts real_esrgan for planning/study metadata only; execution/runtime false.
- `tensor_image_ops`: owner accepts torch_torchvision, kornia for planning/study metadata only; execution/runtime false.
- `model_runtime_foundation`: owner accepts torch_torchvision, transformers for planning/study metadata only; execution/runtime false.

## Scope Boundary
This owner review does not approve agent/tool/route/worker/provider execution, browser/WebGL/canvas runtime, GPU/model runtime, E2E proof, Supabase/GCS mutation, signed URLs, public artifacts, runtime readiness, internal beta, external beta, production readiness, dependency install, package-lock mutation, or generated outputs. Track B remains under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export exclusion remains via PR #544.
