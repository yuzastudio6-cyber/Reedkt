# Canonical Agent Routing Examples

## chart_overlay

Preferred planning: `vega_lite`, `d3`

Conditional: `echarts`

Fallback: `vega`

Eliminate: `sam2`, `real_esrgan`, `three_js unless 3D chart is explicitly requested`

Recommendation: Chart Overlay: select vega_lite, d3 for study metadata first; execution remains blocked.

Execution allowed now: false

## data_visualization

Preferred planning: `vega_lite`, `vega`, `d3`

Conditional: `echarts`

Fallback: `svgdotjs_svg_js`

Eliminate: `sam2`, `real_esrgan`, `lottie_web unless animation is explicitly requested`

Recommendation: Data Visualization: select vega_lite, vega, d3 for study metadata first; execution remains blocked.

Execution allowed now: false

## svg_graphics

Preferred planning: `svgdotjs_svg_js`, `satori`

Conditional: `d3`

Fallback: `viz_js for graph-shaped SVG`

Eliminate: `sam2`, `real_esrgan`, `transformers`

Recommendation: SVG Graphics: select svgdotjs_svg_js, satori for study metadata first; execution remains blocked.

Execution allowed now: false

## diagram_graphics

Preferred planning: `viz_js`

Conditional: `svgdotjs_svg_js`

Fallback: `d3`

Eliminate: `vega_lite unless the request is a chart`, `sam2`, `real_esrgan`

Recommendation: Diagram Graphics: select viz_js for study metadata first; execution remains blocked.

Execution allowed now: false

## animation_overlay

Preferred planning: `lottie_web`, `animejs`

Conditional: `none`

Fallback: `satori for static fallback planning`

Eliminate: `sam2`, `real_esrgan`, `vega_lite unless the request is chart animation`

Recommendation: Animation Overlay: select lottie_web, animejs for study metadata first; execution remains blocked.

Execution allowed now: false

## canvas_scene

Preferred planning: `pixi_js`, `konva`

Conditional: `none`

Fallback: `svgdotjs_svg_js for static 2D plan`

Eliminate: `sam2`, `real_esrgan`, `vega_lite unless the scene is a chart`

Recommendation: Canvas Scene: select pixi_js, konva for study metadata first; execution remains blocked.

Execution allowed now: false

## webgl_3d_scene

Preferred planning: `three_js`, `babylonjs`

Conditional: `none`

Fallback: `pixi_js for 2D fallback`, `d3 for non-3D chart fallback`

Eliminate: `vega_lite unless 3D chart is explicitly requested`, `sam2`, `real_esrgan`

Recommendation: WebGL 3D Scene: select three_js, babylonjs for study metadata first; execution remains blocked.

Execution allowed now: false

## background_removal

Preferred planning: `sam2`, `birefnet`

Conditional: `rembg`, `transparent_background`

Fallback: `manual mask planning after model proof`

Eliminate: `vega_lite`, `d3`, `three_js`

Recommendation: Background Removal: select sam2, birefnet for study metadata first; execution remains blocked.

Execution allowed now: false

## subject_segmentation

Preferred planning: `sam2`, `birefnet`

Conditional: `kornia`

Fallback: `manual review path`

Eliminate: `vega_lite`, `viz_js`, `lottie_web`

Recommendation: Subject Segmentation: select sam2, birefnet for study metadata first; execution remains blocked.

Execution allowed now: false

## upscaling

Preferred planning: `real_esrgan`

Conditional: `none`

Fallback: `source replacement or lower-resolution layout plan`

Eliminate: `vega_lite`, `d3`, `sam2 unless segmentation is also requested`

Recommendation: Upscaling: select real_esrgan for study metadata first; execution remains blocked.

Execution allowed now: false

## tensor_image_ops

Preferred planning: `kornia`

Conditional: `torch_torchvision`

Fallback: `blocked manual planning until import proof`

Eliminate: `vega_lite`, `lottie_web`, `viz_js`

Recommendation: Tensor Image Ops: select kornia for study metadata first; execution remains blocked.

Execution allowed now: false

## model_runtime_foundation

Preferred planning: `torch_torchvision`, `transformers`

Conditional: `kornia`

Fallback: `defer until model-boundary proof`

Eliminate: `d3`, `vega_lite`, `svgdotjs_svg_js`

Recommendation: Model Runtime Foundation: select torch_torchvision, transformers for study metadata first; execution remains blocked.

Execution allowed now: false
