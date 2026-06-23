# Canonical Agent Selection Examples

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

- `chart_overlay`: preferred `vega_lite`, `d3`; fallback `vega`; execution false.
- `data_visualization`: preferred `vega_lite`, `vega`, `d3`; fallback `d3`; execution false.
- `svg_graphics`: preferred `svgdotjs_svg_js`, `satori`; fallback `d3`; execution false.
- `diagram_graphics`: preferred `viz_js`; fallback `svgdotjs_svg_js`; execution false.
- `animation_overlay`: preferred `lottie_web`, `animejs`; fallback `animejs`; execution false.
- `canvas_scene`: preferred `pixi_js`, `konva`; fallback `konva`; execution false.
- `webgl_3d_scene`: preferred `three_js`, `babylonjs`; fallback `babylonjs`; execution false.
- `background_removal`: preferred `sam2`, `birefnet`; fallback `rembg`, `transparent_background`; execution false.
- `subject_segmentation`: preferred `sam2`, `birefnet`; fallback `birefnet`; execution false.
- `upscaling`: preferred `real_esrgan`; fallback `real_esrgan`; execution false.
- `tensor_image_ops`: preferred `kornia`; fallback `kornia`; execution false.
- `model_runtime_foundation`: preferred `torch_torchvision`, `transformers`; fallback `transformers`; execution false.
