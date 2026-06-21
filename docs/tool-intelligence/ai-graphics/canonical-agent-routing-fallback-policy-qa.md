# Canonical Agent Routing Fallback Policy QA

## chart_overlay

QA status: accepted with warnings.

Preferred: `vega_lite`, `d3`

Conditional: `echarts`

Fallback: `vega`

Execution allowed now: false

## data_visualization

QA status: accepted with warnings.

Preferred: `vega_lite`, `vega`, `d3`

Conditional: `echarts`

Fallback: `svgdotjs_svg_js`

Execution allowed now: false

## svg_graphics

QA status: accepted with warnings.

Preferred: `svgdotjs_svg_js`, `satori`

Conditional: `d3`

Fallback: `viz_js for graph-shaped SVG`

Execution allowed now: false

## diagram_graphics

QA status: accepted with warnings.

Preferred: `viz_js`

Conditional: `svgdotjs_svg_js`

Fallback: `d3`

Execution allowed now: false

## animation_overlay

QA status: accepted with warnings.

Preferred: `lottie_web`, `animejs`

Conditional: `none`

Fallback: `satori for static fallback planning`

Execution allowed now: false

## canvas_scene

QA status: accepted with warnings.

Preferred: `pixi_js`, `konva`

Conditional: `none`

Fallback: `svgdotjs_svg_js for static 2D plan`

Execution allowed now: false

## webgl_3d_scene

QA status: accepted with warnings.

Preferred: `three_js`, `babylonjs`

Conditional: `none`

Fallback: `pixi_js for 2D fallback`, `d3 for non-3D chart fallback`

Execution allowed now: false

## background_removal

QA status: accepted with warnings.

Preferred: `sam2`, `birefnet`

Conditional: `rembg`, `transparent_background`

Fallback: `manual mask planning after model proof`

Execution allowed now: false

## subject_segmentation

QA status: accepted with warnings.

Preferred: `sam2`, `birefnet`

Conditional: `kornia`

Fallback: `manual review path`

Execution allowed now: false

## upscaling

QA status: accepted with warnings.

Preferred: `real_esrgan`

Conditional: `none`

Fallback: `source replacement or lower-resolution layout plan`

Execution allowed now: false

## tensor_image_ops

QA status: accepted with warnings.

Preferred: `kornia`

Conditional: `torch_torchvision`

Fallback: `blocked manual planning until import proof`

Execution allowed now: false

## model_runtime_foundation

QA status: accepted with warnings.

Preferred: `torch_torchvision`, `transformers`

Conditional: `kornia`

Fallback: `defer until model-boundary proof`

Execution allowed now: false
