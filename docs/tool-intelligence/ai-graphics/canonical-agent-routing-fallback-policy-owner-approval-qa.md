# AI Graphics Canonical Routing Fallback Policy Owner Approval QA

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_owner_approval_qa_passed_with_warnings`.

QA accepted preferred, conditional, and fallback tool coverage for every required capability.

## chart_overlay

- Preferred: vega_lite, d3
- Conditional: echarts
- Fallback: vega

## data_visualization

- Preferred: vega_lite, vega, d3
- Conditional: echarts
- Fallback: svgdotjs_svg_js

## svg_graphics

- Preferred: svgdotjs_svg_js, satori
- Conditional: d3
- Fallback: viz_js for graph-shaped SVG

## diagram_graphics

- Preferred: viz_js
- Conditional: svgdotjs_svg_js
- Fallback: d3

## animation_overlay

- Preferred: lottie_web, animejs
- Conditional: none
- Fallback: satori for static fallback planning

## canvas_scene

- Preferred: pixi_js, konva
- Conditional: none
- Fallback: svgdotjs_svg_js for static 2D plan

## webgl_3d_scene

- Preferred: three_js, babylonjs
- Conditional: none
- Fallback: pixi_js for 2D fallback, d3 for non-3D chart fallback

## background_removal

- Preferred: sam2, birefnet
- Conditional: rembg, transparent_background
- Fallback: manual mask planning after model proof

## subject_segmentation

- Preferred: sam2, birefnet
- Conditional: kornia
- Fallback: manual review path

## upscaling

- Preferred: real_esrgan
- Conditional: none
- Fallback: source replacement or lower-resolution layout plan

## tensor_image_ops

- Preferred: kornia
- Conditional: torch_torchvision
- Fallback: blocked manual planning until import proof

## model_runtime_foundation

- Preferred: torch_torchvision, transformers
- Conditional: kornia
- Fallback: defer until model-boundary proof
