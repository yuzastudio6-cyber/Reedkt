# Capability Map Canonicalization Owner Approval

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_owner_approved_with_warnings`.

## chart_overlay

- Preferred planning tools owner-approved: vega_lite, d3
- Conditional planning tools owner-approved: echarts
- Fallback planning tools owner-approved: vega
- Eliminated tools owner-approved: sam2, real_esrgan, three_js unless 3D chart is explicitly requested
- Current execution allowed: false
- Next proof milestone owner-approved: Future chart overlay spec/runtime approval before execution.

## data_visualization

- Preferred planning tools owner-approved: vega_lite, vega, d3
- Conditional planning tools owner-approved: echarts
- Fallback planning tools owner-approved: svgdotjs_svg_js
- Eliminated tools owner-approved: sam2, real_esrgan, lottie_web unless animation is explicitly requested
- Current execution allowed: false
- Next proof milestone owner-approved: Future structured data visualization execution approval after source data and runtime review.

## svg_graphics

- Preferred planning tools owner-approved: svgdotjs_svg_js, satori
- Conditional planning tools owner-approved: d3
- Fallback planning tools owner-approved: viz_js for graph-shaped SVG
- Eliminated tools owner-approved: sam2, real_esrgan, transformers
- Current execution allowed: false
- Next proof milestone owner-approved: Future SVG contract execution approval with private artifact policy.

## diagram_graphics

- Preferred planning tools owner-approved: viz_js
- Conditional planning tools owner-approved: svgdotjs_svg_js
- Fallback planning tools owner-approved: d3
- Eliminated tools owner-approved: vega_lite unless the request is a chart, sam2, real_esrgan
- Current execution allowed: false
- Next proof milestone owner-approved: Future diagram metadata execution approval before DOT/SVG artifact creation.

## animation_overlay

- Preferred planning tools owner-approved: lottie_web, animejs
- Conditional planning tools owner-approved: none
- Fallback planning tools owner-approved: satori for static fallback planning
- Eliminated tools owner-approved: sam2, real_esrgan, vega_lite unless the request is chart animation
- Current execution allowed: false
- Next proof milestone owner-approved: Animation manifest/runtime approval before player or timeline execution.

## canvas_scene

- Preferred planning tools owner-approved: pixi_js, konva
- Conditional planning tools owner-approved: none
- Fallback planning tools owner-approved: svgdotjs_svg_js for static 2D plan
- Eliminated tools owner-approved: sam2, real_esrgan, vega_lite unless the scene is a chart
- Current execution allowed: false
- Next proof milestone owner-approved: Browser/canvas sandbox approval before any canvas runtime.

## webgl_3d_scene

- Preferred planning tools owner-approved: three_js, babylonjs
- Conditional planning tools owner-approved: none
- Fallback planning tools owner-approved: pixi_js for 2D fallback, d3 for non-3D chart fallback
- Eliminated tools owner-approved: vega_lite unless 3D chart is explicitly requested, sam2, real_esrgan
- Current execution allowed: false
- Next proof milestone owner-approved: Browser/WebGL sandbox approval before any scene runtime.

## background_removal

- Preferred planning tools owner-approved: sam2, birefnet
- Conditional planning tools owner-approved: rembg, transparent_background
- Fallback planning tools owner-approved: manual mask planning after model proof
- Eliminated tools owner-approved: vega_lite, d3, three_js
- Current execution allowed: false
- Next proof milestone owner-approved: CPU import, model provenance, model-weight, and GPU policy proof before execution.

## subject_segmentation

- Preferred planning tools owner-approved: sam2, birefnet
- Conditional planning tools owner-approved: kornia
- Fallback planning tools owner-approved: manual review path
- Eliminated tools owner-approved: vega_lite, viz_js, lottie_web
- Current execution allowed: false
- Next proof milestone owner-approved: Model provenance and segmentation boundary proof before execution.

## upscaling

- Preferred planning tools owner-approved: real_esrgan
- Conditional planning tools owner-approved: none
- Fallback planning tools owner-approved: source replacement or lower-resolution layout plan
- Eliminated tools owner-approved: vega_lite, d3, sam2 unless segmentation is also requested
- Current execution allowed: false
- Next proof milestone owner-approved: Model/GPU/provenance proof before upscaling execution.

## tensor_image_ops

- Preferred planning tools owner-approved: kornia
- Conditional planning tools owner-approved: torch_torchvision
- Fallback planning tools owner-approved: blocked manual planning until import proof
- Eliminated tools owner-approved: vega_lite, lottie_web, viz_js
- Current execution allowed: false
- Next proof milestone owner-approved: CPU import and tensor/image operation contract proof before execution.

## model_runtime_foundation

- Preferred planning tools owner-approved: torch_torchvision, transformers
- Conditional planning tools owner-approved: kornia
- Fallback planning tools owner-approved: defer until model-boundary proof
- Eliminated tools owner-approved: d3, vega_lite, svgdotjs_svg_js
- Current execution allowed: false
- Next proof milestone owner-approved: CPU/GPU model-runtime foundation proof, model-weight provenance, and boundary review before execution.
