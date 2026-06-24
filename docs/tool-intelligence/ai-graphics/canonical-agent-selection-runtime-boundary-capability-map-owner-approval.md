# Runtime Boundary Capability Map Owner Approval

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_owner_approved_with_warnings`

- `chart_overlay`: owner-approves vega_lite, d3, echarts for planning/study metadata only; execution/runtime false.
- `data_visualization`: owner-approves vega_lite, vega, d3, echarts for planning/study metadata only; execution/runtime false.
- `svg_graphics`: owner-approves svgdotjs_svg_js, satori, d3 for planning/study metadata only; execution/runtime false.
- `diagram_graphics`: owner-approves viz_js, svgdotjs_svg_js, d3 for planning/study metadata only; execution/runtime false.
- `animation_overlay`: owner-approves lottie_web, animejs for planning/study metadata only; execution/runtime false.
- `canvas_scene`: owner-approves pixi_js, konva for planning/study metadata only; execution/runtime false.
- `webgl_3d_scene`: owner-approves three_js, babylonjs for planning/study metadata only; execution/runtime false.
- `background_removal`: owner-approves sam2, birefnet, rembg, transparent_background for planning/study metadata only; execution/runtime false.
- `subject_segmentation`: owner-approves sam2, birefnet, rembg, transparent_background for planning/study metadata only; execution/runtime false.
- `upscaling`: owner-approves real_esrgan for planning/study metadata only; execution/runtime false.
- `tensor_image_ops`: owner-approves torch_torchvision, kornia for planning/study metadata only; execution/runtime false.
- `model_runtime_foundation`: owner-approves torch_torchvision, transformers for planning/study metadata only; execution/runtime false.

## Scope Boundary
This owner approval does not approve agent/tool/route/worker/provider execution, browser/WebGL/canvas runtime, GPU/model runtime, E2E proof, Supabase/GCS mutation, signed URLs, public artifacts, runtime readiness, internal beta, external beta, production readiness, dependency install, package-lock mutation, or generated outputs. Track B remains under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export exclusion remains via PR #544.
