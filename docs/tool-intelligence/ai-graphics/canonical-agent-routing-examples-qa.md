# Canonical Agent Routing Examples QA

## chart_overlay

QA status: accepted with warnings.

Preferred planning: `vega_lite`, `d3`

Conditional: `echarts`

Fallback: `vega`

Eliminated: `sam2`, `real_esrgan`, `three_js unless 3D chart is explicitly requested`

Execution allowed now: false

## data_visualization

QA status: accepted with warnings.

Preferred planning: `vega_lite`, `vega`, `d3`

Conditional: `echarts`

Fallback: `svgdotjs_svg_js`

Eliminated: `sam2`, `real_esrgan`, `lottie_web unless animation is explicitly requested`

Execution allowed now: false

## svg_graphics

QA status: accepted with warnings.

Preferred planning: `svgdotjs_svg_js`, `satori`

Conditional: `d3`

Fallback: `viz_js for graph-shaped SVG`

Eliminated: `sam2`, `real_esrgan`, `transformers`

Execution allowed now: false

## diagram_graphics

QA status: accepted with warnings.

Preferred planning: `viz_js`

Conditional: `svgdotjs_svg_js`

Fallback: `d3`

Eliminated: `vega_lite unless the request is a chart`, `sam2`, `real_esrgan`

Execution allowed now: false

## animation_overlay

QA status: accepted with warnings.

Preferred planning: `lottie_web`, `animejs`

Conditional: `none`

Fallback: `satori for static fallback planning`

Eliminated: `sam2`, `real_esrgan`, `vega_lite unless the request is chart animation`

Execution allowed now: false

## canvas_scene

QA status: accepted with warnings.

Preferred planning: `pixi_js`, `konva`

Conditional: `none`

Fallback: `svgdotjs_svg_js for static 2D plan`

Eliminated: `sam2`, `real_esrgan`, `vega_lite unless the scene is a chart`

Execution allowed now: false

## webgl_3d_scene

QA status: accepted with warnings.

Preferred planning: `three_js`, `babylonjs`

Conditional: `none`

Fallback: `pixi_js for 2D fallback`, `d3 for non-3D chart fallback`

Eliminated: `vega_lite unless 3D chart is explicitly requested`, `sam2`, `real_esrgan`

Execution allowed now: false

## background_removal

QA status: accepted with warnings.

Preferred planning: `sam2`, `birefnet`

Conditional: `rembg`, `transparent_background`

Fallback: `manual mask planning after model proof`

Eliminated: `vega_lite`, `d3`, `three_js`

Execution allowed now: false

## subject_segmentation

QA status: accepted with warnings.

Preferred planning: `sam2`, `birefnet`

Conditional: `kornia`

Fallback: `manual review path`

Eliminated: `vega_lite`, `viz_js`, `lottie_web`

Execution allowed now: false

## upscaling

QA status: accepted with warnings.

Preferred planning: `real_esrgan`

Conditional: `none`

Fallback: `source replacement or lower-resolution layout plan`

Eliminated: `vega_lite`, `d3`, `sam2 unless segmentation is also requested`

Execution allowed now: false

## tensor_image_ops

QA status: accepted with warnings.

Preferred planning: `kornia`

Conditional: `torch_torchvision`

Fallback: `blocked manual planning until import proof`

Eliminated: `vega_lite`, `lottie_web`, `viz_js`

Execution allowed now: false

## model_runtime_foundation

QA status: accepted with warnings.

Preferred planning: `torch_torchvision`, `transformers`

Conditional: `kornia`

Fallback: `defer until model-boundary proof`

Eliminated: `d3`, `vega_lite`, `svgdotjs_svg_js`

Execution allowed now: false
