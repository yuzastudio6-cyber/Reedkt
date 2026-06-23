# AI Graphics Canonical Agent Selection Canonicalization Matrix

Decision: `ai_graphics_canonical_agent_selection_canonicalization_review_passed_with_warnings`

## Matrix Result
All 21 tools and all 12 capabilities are canonicalized for planning/study metadata selection only.

- `chart_overlay`: `vega_lite`, `d3` preferred; execution false.
- `data_visualization`: `vega_lite`, `vega`, `d3` preferred; execution false.
- `svg_graphics`: `svgdotjs_svg_js`, `satori` preferred; execution false.
- `diagram_graphics`: `viz_js` preferred; execution false.
- `animation_overlay`: `lottie_web`, `animejs` preferred; execution false.
- `canvas_scene`: `pixi_js`, `konva` preferred; execution false.
- `webgl_3d_scene`: `three_js`, `babylonjs` preferred; execution false.
- `background_removal`: `sam2`, `birefnet` preferred; execution false.
- `subject_segmentation`: `sam2`, `birefnet` preferred; execution false.
- `upscaling`: `real_esrgan` preferred; execution false.
- `tensor_image_ops`: `kornia` preferred; execution false.
- `model_runtime_foundation`: `torch_torchvision`, `transformers` preferred; execution false.

## No-Scope
No agent execution, tool execution, route execution, worker execution, provider/model execution, browser/WebGL/canvas runtime, GPU/model runtime, Supabase/SQL/GCS, signed URL, public artifact, E2E proof, runtime readiness, internal beta, external beta, production, dependency install, npm ci, package-lock mutation, CPU/static execution, import smoke, synthetic fixtures, PR merge, PR close, or PR retarget is approved.
