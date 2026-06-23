# Fallback Policy Canonicalization Owner Approval

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_owner_approved_with_warnings`.

## chart_overlay

- Preferred: vega_lite, d3
- Conditional: echarts
- Fallback: vega
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## data_visualization

- Preferred: vega_lite, vega, d3
- Conditional: echarts
- Fallback: svgdotjs_svg_js
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## svg_graphics

- Preferred: svgdotjs_svg_js, satori
- Conditional: d3
- Fallback: viz_js for graph-shaped SVG
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## diagram_graphics

- Preferred: viz_js
- Conditional: svgdotjs_svg_js
- Fallback: d3
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## animation_overlay

- Preferred: lottie_web, animejs
- Conditional: none
- Fallback: satori for static fallback planning
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## canvas_scene

- Preferred: pixi_js, konva
- Conditional: none
- Fallback: svgdotjs_svg_js for static 2D plan
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## webgl_3d_scene

- Preferred: three_js, babylonjs
- Conditional: none
- Fallback: pixi_js for 2D fallback, d3 for non-3D chart fallback
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## background_removal

- Preferred: sam2, birefnet
- Conditional: rembg, transparent_background
- Fallback: manual mask planning after model proof
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## subject_segmentation

- Preferred: sam2, birefnet
- Conditional: kornia
- Fallback: manual review path
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## upscaling

- Preferred: real_esrgan
- Conditional: none
- Fallback: source replacement or lower-resolution layout plan
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## tensor_image_ops

- Preferred: kornia
- Conditional: torch_torchvision
- Fallback: blocked manual planning until import proof
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.

## model_runtime_foundation

- Preferred: torch_torchvision, transformers
- Conditional: kornia
- Fallback: defer until model-boundary proof
- Rule: Use fallback only for planning metadata when preferred tools are eliminated by capability fit, proof gap, cost, or simpler-tool rules. Do not execute fallback tools now.
