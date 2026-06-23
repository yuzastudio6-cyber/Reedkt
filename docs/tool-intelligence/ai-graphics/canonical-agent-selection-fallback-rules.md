# Canonical Agent Selection Fallback Rules

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Fallbacks are planning-only. They do not authorize execution.

- `chart_overlay`: preferred `vega_lite`, `d3`; fallback `vega`.
- `data_visualization`: preferred `vega_lite`, `vega`, `d3`; fallback `d3`.
- `svg_graphics`: preferred `svgdotjs_svg_js`, `satori`; fallback `d3`.
- `diagram_graphics`: preferred `viz_js`; fallback `svgdotjs_svg_js`.
- `animation_overlay`: preferred `lottie_web`, `animejs`; fallback `animejs`.
- `canvas_scene`: preferred `pixi_js`, `konva`; fallback `konva`.
- `webgl_3d_scene`: preferred `three_js`, `babylonjs`; fallback `babylonjs`.
- `background_removal`: preferred `sam2`, `birefnet`; fallback `rembg`, `transparent_background`.
- `subject_segmentation`: preferred `sam2`, `birefnet`; fallback `birefnet`.
- `upscaling`: preferred `real_esrgan`; fallback `real_esrgan`.
- `tensor_image_ops`: preferred `kornia`; fallback `kornia`.
- `model_runtime_foundation`: preferred `torch_torchvision`, `transformers`; fallback `transformers`.
