# Canonical Agent Routing Capability Map

## chart_overlay

Preferred planning tools: `vega_lite`, `d3`

Conditional planning tools: `echarts`

Fallback planning tools: `vega`

Execution allowed now: false

Next proof: Future chart overlay spec/runtime approval before execution.

## data_visualization

Preferred planning tools: `vega_lite`, `vega`, `d3`

Conditional planning tools: `echarts`

Fallback planning tools: `svgdotjs_svg_js`

Execution allowed now: false

Next proof: Future structured data visualization execution approval after source data and runtime review.

## svg_graphics

Preferred planning tools: `svgdotjs_svg_js`, `satori`

Conditional planning tools: `d3`

Fallback planning tools: `viz_js for graph-shaped SVG`

Execution allowed now: false

Next proof: Future SVG contract execution approval with private artifact policy.

## diagram_graphics

Preferred planning tools: `viz_js`

Conditional planning tools: `svgdotjs_svg_js`

Fallback planning tools: `d3`

Execution allowed now: false

Next proof: Future diagram metadata execution approval before DOT/SVG artifact creation.

## animation_overlay

Preferred planning tools: `lottie_web`, `animejs`

Conditional planning tools: `none`

Fallback planning tools: `satori for static fallback planning`

Execution allowed now: false

Next proof: Animation manifest/runtime approval before player or timeline execution.

## canvas_scene

Preferred planning tools: `pixi_js`, `konva`

Conditional planning tools: `none`

Fallback planning tools: `svgdotjs_svg_js for static 2D plan`

Execution allowed now: false

Next proof: Browser/canvas sandbox approval before any canvas runtime.

## webgl_3d_scene

Preferred planning tools: `three_js`, `babylonjs`

Conditional planning tools: `none`

Fallback planning tools: `pixi_js for 2D fallback`, `d3 for non-3D chart fallback`

Execution allowed now: false

Next proof: Browser/WebGL sandbox approval before any scene runtime.

## background_removal

Preferred planning tools: `sam2`, `birefnet`

Conditional planning tools: `rembg`, `transparent_background`

Fallback planning tools: `manual mask planning after model proof`

Execution allowed now: false

Next proof: CPU import, model provenance, model-weight, and GPU policy proof before execution.

## subject_segmentation

Preferred planning tools: `sam2`, `birefnet`

Conditional planning tools: `kornia`

Fallback planning tools: `manual review path`

Execution allowed now: false

Next proof: Model provenance and segmentation boundary proof before execution.

## upscaling

Preferred planning tools: `real_esrgan`

Conditional planning tools: `none`

Fallback planning tools: `source replacement or lower-resolution layout plan`

Execution allowed now: false

Next proof: Model/GPU/provenance proof before upscaling execution.

## tensor_image_ops

Preferred planning tools: `kornia`

Conditional planning tools: `torch_torchvision`

Fallback planning tools: `blocked manual planning until import proof`

Execution allowed now: false

Next proof: CPU import and tensor/image operation contract proof before execution.

## model_runtime_foundation

Preferred planning tools: `torch_torchvision`, `transformers`

Conditional planning tools: `kornia`

Fallback planning tools: `defer until model-boundary proof`

Execution allowed now: false

Next proof: CPU/GPU model-runtime foundation proof, model-weight provenance, and boundary review before execution.
