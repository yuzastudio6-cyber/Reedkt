# Canonical Agent Selection Examples Canonicalization Owner Approval

Decision: `ai_graphics_canonical_agent_selection_canonicalization_owner_approved_with_warnings`

Owner-approves selection examples as planning-only examples.

- `chart_overlay`: prefer vega_lite, d3; conditional echarts; fallback vega; execution false.
- `data_visualization`: prefer vega_lite, vega, d3; conditional echarts; fallback svgdotjs_svg_js; execution false.
- `svg_graphics`: prefer svgdotjs_svg_js, satori; conditional d3; fallback viz_js; execution false.
- `diagram_graphics`: prefer viz_js; conditional svgdotjs_svg_js; fallback d3; execution false.
- `animation_overlay`: prefer lottie_web, animejs; conditional none; fallback satori; execution false.
- `canvas_scene`: prefer pixi_js, konva; conditional none; fallback svgdotjs_svg_js; execution false.
- `webgl_3d_scene`: prefer three_js, babylonjs; conditional none; fallback pixi_js; execution false.
- `background_removal`: prefer sam2, birefnet; conditional rembg, transparent_background; fallback kornia; execution false.
- `subject_segmentation`: prefer sam2, birefnet; conditional kornia; fallback rembg; execution false.
- `upscaling`: prefer real_esrgan; conditional none; fallback kornia; execution false.
- `tensor_image_ops`: prefer kornia; conditional torch_torchvision; fallback transformers; execution false.
- `model_runtime_foundation`: prefer torch_torchvision, transformers; conditional none; fallback kornia; execution false.
